const pick = <T extends object, K extends keyof T>(
  object: T,
  keys: K[]
): Pick<T, K> => {
  return keys.reduce((obj, key) => {
    if (Object.hasOwn(object, key)) {
      if (key === "sort") {
        obj[key] = formatSort(object[key] as string) as T[K];
      } else {
        obj[key] = object[key];
      }
    }
    return obj;
  }, {} as Pick<T, K>);
};

function formatSort(sort: string) {
  const [key, order] = sort.split(":");
  return {
    [key]: order,
  };
}

// Examples
/*
REQUEST
?page=1&limit=10&sort=createdAt:desc

RESPONSE
{
  page: 1,
  limit: 10,
  sort: { createdAt: "desc" },
}

CALL 
pick(req.query, ["page", "limit", "sort"]);
*/
export default pick;
