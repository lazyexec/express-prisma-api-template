// src/lib/ai-helper.ts
// ============================================================================
// AI ASSISTANT HELPER - COMPLETE CODE
// Copy this file to your project: src/lib/ai-helper.ts
// ============================================================================

import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { EventEmitter } from "events";
import prisma from "../configs/prisma";
import logger from "../utils/logger";
import ApiError from "../utils/ApiError";
import httpStatus from "http-status";

// ============================================================================
// TYPES
// ============================================================================

interface AIHelperConfig {
  provider: "openai" | "anthropic" | "gemini";
  model?: string;
  temperature?: number;
  maxTokens?: number;
  streaming?: boolean;
  enableRAG?: boolean;
  openaiKey?: string;
  anthropicKey?: string;
  geminiKey?: string;
}

interface ChatOptions {
  userId: string;
  sessionId: string;
  message: string;
  systemPrompt?: string;
  context?: string[];
  ragQuery?: {
    userId: string;
    projectId: string;
    text: string;
    limit?: number;
  };
}

interface ChatResponse {
  content: string;
  tokensUsed?: number;
  conversationId: number;
}

type AIRole = "user" | "assistant" | "system";

interface Message {
  role: AIRole;
  content: string;
}

// ============================================================================
// MAIN AI HELPER CLASS
// ============================================================================

export class AIHelper extends EventEmitter {
  private config: Required<
    Omit<AIHelperConfig, "openaiKey" | "anthropicKey" | "geminiKey" | "prisma">
  >;
  private openai?: OpenAI;
  private anthropic?: Anthropic;
  private gemini?: GoogleGenerativeAI;
  private prisma: typeof prisma;

  constructor(config: AIHelperConfig) {
    super();

    // Set defaults
    this.config = {
      provider: config.provider || "openai",
      model: config.model || this.getDefaultModel(config.provider),
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 1000,
      streaming: config.streaming !== false,
      enableRAG: config.enableRAG ?? false,
    };

    // Initialize AI clients
    if (config.openaiKey) {
      this.openai = new OpenAI({ apiKey: config.openaiKey });
    }

    if (config.anthropicKey) {
      this.anthropic = new Anthropic({ apiKey: config.anthropicKey });
    }

    if (config.geminiKey) {
      this.gemini = new GoogleGenerativeAI(config.geminiKey);
    }

    // Validate at least one provider is configured
    if (!this.openai && !this.anthropic && !this.gemini) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "At least one AI provider API key must be provided",
      );
    }

    // Initialize Prisma
    this.prisma = prisma;
  }

  private getDefaultModel(provider: string): string {
    const defaults: Record<string, string> = {
      openai: "gpt-4-turbo-preview",
      anthropic: "claude-3-5-sonnet-20241022",
      gemini: "gemini-2.5-flash",
    };
    return defaults[provider] || defaults.openai;
  }

  // ============================================================================
  // MAIN CHAT METHOD
  // ============================================================================

  async chat(options: ChatOptions): Promise<ChatResponse | EventEmitter> {
    const {
      userId,
      sessionId,
      message,
      systemPrompt,
      context = [],
      ragQuery,
    } = options;

    // Create or get conversation
    console.time("Creating Conversation if not available...!");
    const conversation = await this.prisma.conversation.upsert({
      where: {
        userId_sessionId: { userId, sessionId },
      },
      create: {
        userId,
        sessionId,
        metadata: {},
      },
      update: {
        updatedAt: new Date(),
      },
    });
    console.timeEnd("Creating Conversation if not available...!");

    // Get conversation history (last 10 messages)
    console.time("Getting Conversation History...!");
    const historyRecords = await this.prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { role: true, content: true },
    });
    console.timeEnd("Getting Conversation History...!");

    const history = historyRecords.reverse() as Message[];

    // Enhance with RAG if enabled
    let enhancedContext = [...context];
    if (this.config.enableRAG && ragQuery) {
      const ragDocs = await this.searchRAG(ragQuery);
      enhancedContext = [...ragDocs.map((d) => d.content), ...enhancedContext];
    }

    // Save user message
    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: message,
        provider: this.config.provider,
        model: this.config.model,
      },
    });

    // Generate response (streaming or non-streaming)
    if (this.config.streaming) {
      return this.streamResponse({
        message,
        systemPrompt,
        history,
        context: enhancedContext,
        conversationId: conversation.id,
      });
    } else {
      return this.generateResponse({
        message,
        systemPrompt,
        history,
        context: enhancedContext,
        conversationId: conversation.id,
      });
    }

  }

  // ============================================================================
  // STREAMING RESPONSE
  // ============================================================================

  private async streamResponse(params: {
    message: string;
    systemPrompt?: string;
    history: Message[];
    context: string[];
    conversationId: number;
  }): Promise<EventEmitter> {
    const emitter = new EventEmitter();
    let fullContent = "";

    (async () => {
      try {
        const stream = await this.getProviderStream(params);

        stream.on("data", (chunk: string) => {
          fullContent += chunk;
          emitter.emit("data", chunk);
        });

        stream.on("end", async () => {
          // Save assistant message
          await this.prisma.message.create({
            data: {
              conversationId: params.conversationId,
              role: "assistant",
              content: fullContent,
              provider: this.config.provider,
              model: this.config.model,
            },
          });

          emitter.emit("end", fullContent);
        });

        stream.on("error", (error: Error) => {
          emitter.emit("error", error);
        });
      } catch (error) {
        emitter.emit("error", error);
      }
    })();

    return emitter;
  }

  private async getProviderStream(params: {
    message: string;
    systemPrompt?: string;
    history: Message[];
    context: string[];
  }): Promise<EventEmitter> {
    const { message, systemPrompt, history, context } = params;

    switch (this.config.provider) {
      case "openai":
        return this.streamOpenAI(message, systemPrompt, history, context);
      case "anthropic":
        return this.streamAnthropic(message, systemPrompt, history, context);
      case "gemini":
        return this.streamGemini(message, systemPrompt, history, context);
      default:
        throw new ApiError(
          httpStatus.INTERNAL_SERVER_ERROR,
          `Unsupported provider: ${this.config.provider}`,
        );
    }
  }

  private async streamOpenAI(
    message: string,
    systemPrompt?: string,
    history?: Message[],
    context?: string[],
  ): Promise<EventEmitter> {
    if (!this.openai)
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "OpenAI client not initialized",
      );

    const messages = this.buildOpenAIMessages(
      systemPrompt,
      history,
      context,
      message,
    );

    const stream = await this.openai.chat.completions.create({
      model: this.config.model,
      messages,
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens,
      stream: true,
    });

    const emitter = new EventEmitter();

    (async () => {
      try {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) emitter.emit("data", content);
        }
        emitter.emit("end");
      } catch (error) {
        emitter.emit("error", error);
      }
    })();

    return emitter;
  }

  private async streamAnthropic(
    message: string,
    systemPrompt?: string,
    history?: Message[],
    context?: string[],
  ): Promise<EventEmitter> {
    if (!this.anthropic)
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Anthropic client not initialized",
      );

    const messages = this.buildAnthropicMessages(history, context, message);

    const stream = await this.anthropic.messages.stream({
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      system: systemPrompt,
      messages,
    });

    const emitter = new EventEmitter();

    stream.on("text", (text: string) => {
      emitter.emit("data", text);
    });

    stream.on("end", () => {
      emitter.emit("end");
    });

    stream.on("error", (error: Error) => {
      emitter.emit("error", error);
    });

    return emitter;
  }

  private async streamGemini(
    message: string,
    systemPrompt?: string,
    history?: Message[],
    context?: string[],
  ): Promise<EventEmitter> {
    if (!this.gemini)
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Gemini client not initialized",
      );

    const model = this.gemini.getGenerativeModel({ model: this.config.model });
    const chat = model.startChat({
      history: this.buildGeminiHistory(history, context),
      generationConfig: {
        temperature: this.config.temperature,
        maxOutputTokens: this.config.maxTokens,
      },
    });

    const result = await chat.sendMessageStream(message);
    const emitter = new EventEmitter();

    (async () => {
      try {
        for await (const chunk of result.stream) {
          emitter.emit("data", chunk.text());
        }
        emitter.emit("end");
      } catch (error) {
        emitter.emit("error", error);
      }
    })();

    return emitter;
  }

  // ============================================================================
  // NON-STREAMING RESPONSE
  // ============================================================================

  private async generateResponse(params: {
    message: string;
    systemPrompt?: string;
    history: Message[];
    context: string[];
    conversationId: number;
  }): Promise<ChatResponse> {
    const { message, systemPrompt, history, context, conversationId } = params;
    let response: { content: string; tokensUsed?: number };

    switch (this.config.provider) {
      case "openai":
        response = await this.chatOpenAI(
          message,
          systemPrompt,
          history,
          context,
        );
        break;
      case "anthropic":
        response = await this.chatAnthropic(
          message,
          systemPrompt,
          history,
          context,
        );
        break;
      case "gemini":
        response = await this.chatGemini(
          message,
          systemPrompt,
          history,
          context,
        );
        break;
      default:
        throw new ApiError(
          httpStatus.INTERNAL_SERVER_ERROR,
          `Unsupported provider: ${this.config.provider}`,
        );
    }

    // Save assistant message
    await this.prisma.message.create({
      data: {
        conversationId,
        role: "assistant",
        content: response.content,
        provider: this.config.provider,
        model: this.config.model,
        tokensUsed: response.tokensUsed,
      },
    });
    return {
      content: response.content,
      tokensUsed: response.tokensUsed,
      conversationId,
    };
  }

  private async chatOpenAI(
    message: string,
    systemPrompt?: string,
    history?: Message[],
    context?: string[],
  ): Promise<{ content: string; tokensUsed?: number }> {
    if (!this.openai)
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "OpenAI client not initialized",
      );

    const messages = this.buildOpenAIMessages(
      systemPrompt,
      history,
      context,
      message,
    );

    const completion = await this.openai.chat.completions.create({
      model: this.config.model,
      messages,
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens,
    });

    return {
      content: completion.choices[0].message.content || "",
      tokensUsed: completion.usage?.total_tokens,
    };
  }

  private async chatAnthropic(
    message: string,
    systemPrompt?: string,
    history?: Message[],
    context?: string[],
  ): Promise<{ content: string; tokensUsed?: number }> {
    if (!this.anthropic)
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Anthropic client not initialized",
      );

    const messages = this.buildAnthropicMessages(history, context, message);

    const response = await this.anthropic.messages.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      system: systemPrompt,
      messages,
    });

    const content = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    return {
      content,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    };
  }

  private async chatGemini(
    message: string,
    systemPrompt?: string,
    history?: Message[],
    context?: string[],
  ): Promise<{ content: string; tokensUsed?: number }> {
    if (!this.gemini)
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Gemini client not initialized",
      );

    const model = this.gemini.getGenerativeModel({ model: this.config.model });
    const chat = model.startChat({
      history: this.buildGeminiHistory(history, context),
      generationConfig: {
        temperature: this.config.temperature,
        maxOutputTokens: this.config.maxTokens,
      },
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;

    return {
      content: response.text(),
      tokensUsed: undefined,
    };
  }

  // ============================================================================
  // MESSAGE BUILDERS
  // ============================================================================

  private buildOpenAIMessages(
    systemPrompt?: string,
    history?: Message[],
    context?: string[],
    message?: string,
  ): OpenAI.ChatCompletionMessageParam[] {
    const messages: OpenAI.ChatCompletionMessageParam[] = [];

    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }

    if (context && context.length > 0) {
      context.forEach((ctx) => {
        messages.push({ role: "system", content: ctx });
      });
    }

    if (history && history.length > 0) {
      history.forEach((msg) => {
        messages.push({
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content,
        });
      });
    }

    if (message) {
      messages.push({ role: "user", content: message });
    }

    return messages;
  }

  private buildAnthropicMessages(
    history?: Message[],
    context?: string[],
    message?: string,
  ): Anthropic.MessageParam[] {
    const messages: Anthropic.MessageParam[] = [];

    if (history && history.length > 0) {
      history.forEach((msg) => {
        if (msg.role !== "system") {
          messages.push({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          });
        }
      });
    }

    if (message) {
      const contextStr =
        context && context.length > 0
          ? `Context: ${context.join("\n\n")}\n\n`
          : "";
      messages.push({ role: "user", content: contextStr + message });
    }

    return messages;
  }

  private buildGeminiHistory(
    history?: Message[],
    context?: string[],
  ): Array<{ role: string; parts: Array<{ text: string }> }> {
    const geminiHistory: Array<{
      role: string;
      parts: Array<{ text: string }>;
    }> = [];

    // 1. Combine context and history into a list of messages
    const messages: Message[] = [];

    if (context && context.length > 0) {
      context.forEach((ctx) => {
        messages.push({ role: "user", content: ctx });
        messages.push({ role: "assistant", content: "Understood." });
      });
    }

    if (history && history.length > 0) {
      messages.push(...history);
    }

    // 2. Filter and merge to satisfy Gemini's constraints:
    // - Must start with 'user'
    // - Roles must alternate (user -> model -> user -> model)
    let lastRole: string | null = null;

    for (const msg of messages) {
      const geminiRole = msg.role === "assistant" ? "model" : "user";

      // If history hasn't started yet, it MUST start with a 'user' message
      if (geminiHistory.length === 0 && geminiRole !== "user") {
        continue;
      }

      if (geminiRole === lastRole) {
        // If same role as last message, merge content (Gemini doesn't allow consecutive same rolls)
        const lastMsg = geminiHistory[geminiHistory.length - 1];
        lastMsg.parts[0].text += "\n\n" + msg.content;
      } else {
        geminiHistory.push({
          role: geminiRole,
          parts: [{ text: msg.content }],
        });
        lastRole = geminiRole;
      }
    }

    // 3. Final Constraint: Gemini's startChat history should ideally end with a 'model' response
    // if we are about to call sendMessage() with a new 'user' message.
    // If the last message in history is from 'user', we pop it to avoid consecutive 'user' messages.
    if (
      geminiHistory.length > 0 &&
      geminiHistory[geminiHistory.length - 1].role === "user"
    ) {
      geminiHistory.pop();
    }

    return geminiHistory;
  }

  // ============================================================================
  // RAG METHODS
  // ============================================================================

  async addRAGDocument(
    userId: string,
    projectId: string,
    content: string,
    metadata: Record<string, any> = {},
  ): Promise<void> {
    if (!this.config.enableRAG) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "RAG is not enabled. Set enableRAG: true in config.",
      );
    }

    if (!this.openai) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "OpenAI client required for embeddings. Provide openaiKey in config.",
      );
    }

    // Generate embedding
    const response = await this.openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: content,
    });

    const embedding = response.data[0].embedding;

    // Save to database using raw SQL (Prisma doesn't support vector type directly)
    await this.prisma.$executeRawUnsafe(
      `
      INSERT INTO "RagDocument" (user_id, project_id, content, embedding, metadata)
      VALUES ($1, $2, $3, $4::vector, $5::jsonb)
    `,
      userId,
      projectId,
      content,
      `[${embedding.join(",")}]`,
      JSON.stringify(metadata),
    );
  }

  async searchRAG(query: {
    userId: string;
    projectId: string;
    text: string;
    limit?: number;
  }): Promise<
    Array<{ id: number; content: string; metadata: any; similarity: number }>
  > {
    if (!this.config.enableRAG) {
      return [];
    }

    if (!this.openai) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "OpenAI client required for embeddings",
      );
    }

    // Generate query embedding
    const response = await this.openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: query.text,
    });

    const embedding = response.data[0].embedding;
    const limit = query.limit || 5;

    // Search similar documents using raw SQL
    const results: any[] = await this.prisma.$queryRawUnsafe(
      `
      SELECT id, content, metadata,
             1 - (embedding <=> $1::vector) as similarity
      FROM "RagDocument"
      WHERE user_id = $2 AND project_id = $3
      ORDER BY similarity DESC
      LIMIT $4
    `,
      `[${embedding.join(",")}]`,
      query.userId,
      query.projectId,
      limit,
    );

    return results;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  async getHistory(
    userId: string,
    sessionId: string,
    limit: number = 50,
  ): Promise<any[]> {
    const conversation = await this.prisma.conversation.findUnique({
      where: {
        userId_sessionId: { userId, sessionId },
      },
    });

    if (!conversation) return [];

    return this.prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        role: true,
        content: true,
        createdAt: true,
        tokensUsed: true,
        provider: true,
        model: true,
      },
    });
  }

  async deleteConversation(userId: string, sessionId: string): Promise<void> {
    await this.prisma.conversation.delete({
      where: {
        userId_sessionId: { userId, sessionId },
      },
    });
  }
}

export default AIHelper;
