/**
 * Simple and flexible Prisma Pagination Utility
 */

/*


// Basic pagination
const result = await paginate(
  prisma.user,
  { page: 1, limit: 20, sort: { createdAt: 'desc' } },
  { isActive: true }
);

// With manual filtering/search
const searchResult = await paginate(
  prisma.user,
  { page: 1, limit: 20, sort: { name: 'asc' } },
  { 
    OR: [
      { name: { contains: 'john', mode: 'insensitive' } },
      { email: { contains: 'john', mode: 'insensitive' } }
    ],
    role: 'ADMIN'
  }
);

// Cursor pagination
const cursorResult = await paginateCursor(
  prisma.post,
  'id',
  { limit: 20, cursor: lastPostId, sort: { createdAt: 'desc' } },
  { published: true }
);


 */

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface PaginationOptions {
  limit?: number;
  page?: number;
  maxLimit?: number;
  sort?: any;
}

export interface CursorPaginationOptions {
  limit?: number;
  cursor?: string | number;
  maxLimit?: number;
  sort?: any;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface CursorPaginationResult<T> {
  data: T[];
  pagination: {
    nextCursor: string | number | null;
    prevCursor: string | number | null;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
}

// ============================================================================
// Offset-Based Pagination
// ============================================================================

/**
 * Offset-based pagination for Prisma queries
 *
 * @example
 * const result = await paginate(
 *   prisma.user,
 *   { page: 1, limit: 20, sort: { createdAt: 'desc' } },
 *   { isActive: true }
 * );
 */
export async function paginate<T, TModel extends { findMany: any; count: any }>(
  model: TModel,
  options: PaginationOptions = {},
  filters: any = {},
): Promise<PaginationResult<T>> {
  const { limit = 10, page = 1, maxLimit = 100, sort } = options;

  // Validate and sanitize inputs
  const sanitizedLimit = Math.min(Math.max(1, limit), maxLimit);
  const sanitizedPage = Math.max(1, page);
  const skip = (sanitizedPage - 1) * sanitizedLimit;

  // Execute queries in parallel
  const [data, total] = await Promise.all([
    model.findMany({
      where: filters,
      take: sanitizedLimit,
      skip,
      ...(sort && { orderBy: sort }),
    }),
    model.count({ where: filters }),
  ]);

  const totalPages = Math.ceil(total / sanitizedLimit);

  return {
    data,
    pagination: {
      total,
      page: sanitizedPage,
      limit: sanitizedLimit,
      totalPages,
      hasNextPage: sanitizedPage < totalPages,
      hasPrevPage: sanitizedPage > 1,
    },
  };
}

// ============================================================================
// Cursor-Based Pagination
// ============================================================================

/**
 * Cursor-based pagination for Prisma queries
 * Best for large datasets and infinite scroll
 *
 * @example
 * const result = await paginateCursor(
 *   prisma.user,
 *   'id',
 *   { limit: 20, cursor: lastUserId, sort: { createdAt: 'desc' } },
 *   { isActive: true }
 * );
 */
export async function paginateCursor<T, TModel extends { findMany: any }>(
  model: TModel,
  cursorField: string,
  options: CursorPaginationOptions = {},
  filters: any = {},
): Promise<CursorPaginationResult<T>> {
  const { limit = 10, cursor, maxLimit = 100, sort } = options;

  const sanitizedLimit = Math.min(Math.max(1, limit), maxLimit);

  // Fetch one extra record to determine if there's a next page
  const takeLimit = sanitizedLimit + 1;

  const data = await model.findMany({
    where: filters,
    take: takeLimit,
    ...(cursor && {
      skip: 1,
      cursor: {
        [cursorField]: cursor,
      },
    }),
    ...(sort && { orderBy: sort }),
  });

  const hasNextPage = data.length > sanitizedLimit;
  const results = hasNextPage ? data.slice(0, sanitizedLimit) : data;

  const nextCursor =
    hasNextPage && results.length > 0
      ? results[results.length - 1][cursorField]
      : null;

  const prevCursor =
    results.length > 0 && cursor ? results[0][cursorField] : null;

  return {
    data: results,
    pagination: {
      nextCursor,
      prevCursor,
      hasNextPage,
      hasPrevPage: !!cursor,
      limit: sanitizedLimit,
    },
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Parse pagination params from request query
 */
export function parsePaginationParams(query: any): PaginationOptions {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;

  return {
    page: Math.max(1, page),
    limit: Math.max(1, Math.min(100, limit)),
  };
}

/**
 * Calculate offset from page and limit
 */
export function getOffset(page: number, limit: number): number {
  return Math.max(0, (Math.max(1, page) - 1) * Math.max(1, limit));
}
