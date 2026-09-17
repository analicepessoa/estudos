import {
  AIProvider,
  AIProviderError,
  ChatRequest,
  ChatResult,
  ConversationReport,
  ConversationReportRequest,
  TutorCorrection,
  TutorVocabulary,
  UtteranceAnalysisRequest,
  UtteranceAnalysisResult,
} from "./provider.ts";

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 30_000;

interface GroqChatResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
}

const TUTOR_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string" },
    corrections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          original: { type: "string" },
          corrected: { type: "string" },
          explanation: { type: "string" },
        },
        required: ["original", "corrected", "explanation"],
        additionalProperties: false,
      },
    },
    vocabulary: {
      type: "array",
      items: {
        type: "object",
        properties: {
          original: { type: "string" },
          english: { type: "string" },
        },
        required: ["original", "english"],
        additionalProperties: false,
      },
    },
  },
  required: ["reply", "corrections", "vocabulary"],
  additionalProperties: false,
} as const;

const UTTERANCE_ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    hasImportantCorrection: { type: "boolean" },
    corrections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          original: { type: "string" },
          corrected: { type: "string" },
          explanation: { type: "string" },
        },
        required: ["original", "corrected", "explanation"],
        additionalProperties: false,
      },
    },
  },
  required: ["hasImportantCorrection", "corrections"],
  additionalProperties: false,
} as const;

const CONVERSATION_REPORT_SCHEMA = {
  type: "object",
  properties: {
    grammar: { type: "array", items: { type: "string" } },
    vocabulary: { type: "array", items: { type: "string" } },
    communication: { type: "array", items: { type: "string" } },
    importantCorrections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          original: { type: "string" },
          corrected: { type: "string" },
          explanation: { type: "string" },
        },
        required: ["original", "corrected", "explanation"],
        additionalProperties: false,
      },
    },
    newUsefulExpressions: { type: "array", items: { type: "string" } },
    suggestedPractice: { type: "string" },
  },
  required: [
    "grammar",
    "vocabulary",
    "communication",
    "importantCorrections",
    "newUsefulExpressions",
    "suggestedPractice",
  ],
  additionalProperties: false,
} as const;

function safeText(value: unknown, maximum: number): string {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

export function parseTutorResult(content: string): ChatResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new AIProviderError(
      "O tutor respondeu em um formato inesperado. Tente novamente.",
      502,
      "INVALID_AI_RESPONSE",
    );
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new AIProviderError(
      "O tutor respondeu em um formato inesperado. Tente novamente.",
      502,
      "INVALID_AI_RESPONSE",
    );
  }

  const value = parsed as Record<string, unknown>;
  const reply = safeText(value.reply, 900);
  const corrections = Array.isArray(value.corrections)
    ? value.corrections.slice(0, 5).map((item): TutorCorrection | null => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;
      const correction = item as Record<string, unknown>;
      const original = safeText(correction.original, 300);
      const corrected = safeText(correction.corrected, 300);
      const explanation = safeText(correction.explanation, 240);
      return original && corrected && explanation
        ? { original, corrected, explanation }
        : null;
    }).filter((item): item is TutorCorrection => item !== null)
    : [];
  const vocabulary = Array.isArray(value.vocabulary)
    ? value.vocabulary.slice(0, 5).map((item): TutorVocabulary | null => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;
      const word = item as Record<string, unknown>;
      const original = safeText(word.original, 120);
      const english = safeText(word.english, 160);
      return original && english ? { original, english } : null;
    }).filter((item): item is TutorVocabulary => item !== null)
    : [];

  if (
    !reply || !Array.isArray(value.corrections) ||
    !Array.isArray(value.vocabulary)
  ) {
    throw new AIProviderError(
      "O tutor respondeu em um formato inesperado. Tente novamente.",
      502,
      "INVALID_AI_RESPONSE",
    );
  }

  return { reply, corrections, vocabulary };
}

export function parseUtteranceAnalysis(
  content: string,
): UtteranceAnalysisResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new AIProviderError(
      "A correção respondeu em um formato inesperado.",
      502,
      "INVALID_AI_RESPONSE",
    );
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new AIProviderError(
      "A correção respondeu em um formato inesperado.",
      502,
      "INVALID_AI_RESPONSE",
    );
  }
  const value = parsed as Record<string, unknown>;
  const corrections = Array.isArray(value.corrections)
    ? value.corrections.slice(0, 5).map((item): TutorCorrection | null => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;
      const correction = item as Record<string, unknown>;
      const original = safeText(correction.original, 300);
      const corrected = safeText(correction.corrected, 300);
      const explanation = safeText(correction.explanation, 240);
      return original && corrected && explanation
        ? { original, corrected, explanation }
        : null;
    }).filter((item): item is TutorCorrection => item !== null)
    : [];
  const hasImportantCorrection = value.hasImportantCorrection === true &&
    corrections.length > 0;

  if (
    typeof value.hasImportantCorrection !== "boolean" ||
    !Array.isArray(value.corrections)
  ) {
    throw new AIProviderError(
      "A correção respondeu em um formato inesperado.",
      502,
      "INVALID_AI_RESPONSE",
    );
  }
  return { hasImportantCorrection, corrections };
}

function safeTextList(
  value: unknown,
  maximumItems: number,
  maximumText: number,
): string[] {
  return Array.isArray(value)
    ? value.slice(0, maximumItems).map((item) => safeText(item, maximumText))
      .filter(Boolean)
    : [];
}

function safeCorrections(value: unknown): TutorCorrection[] {
  return Array.isArray(value)
    ? value.slice(0, 5).map((item): TutorCorrection | null => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;
      const correction = item as Record<string, unknown>;
      const original = safeText(correction.original, 300);
      const corrected = safeText(correction.corrected, 300);
      const explanation = safeText(correction.explanation, 240);
      return original && corrected && explanation
        ? { original, corrected, explanation }
        : null;
    }).filter((item): item is TutorCorrection => item !== null)
    : [];
}

export function parseConversationReport(content: string): ConversationReport {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new AIProviderError(
      "O relatório respondeu em um formato inesperado.",
      502,
      "INVALID_AI_RESPONSE",
    );
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new AIProviderError(
      "O relatório respondeu em um formato inesperado.",
      502,
      "INVALID_AI_RESPONSE",
    );
  }
  const value = parsed as Record<string, unknown>;
  const requiredArrays = [
    "grammar",
    "vocabulary",
    "communication",
    "importantCorrections",
    "newUsefulExpressions",
  ];
  if (
    requiredArrays.some((field) => !Array.isArray(value[field])) ||
    typeof value.suggestedPractice !== "string"
  ) {
    throw new AIProviderError(
      "O relatório respondeu em um formato inesperado.",
      502,
      "INVALID_AI_RESPONSE",
    );
  }
  return {
    grammar: safeTextList(value.grammar, 3, 240),
    vocabulary: safeTextList(value.vocabulary, 3, 240),
    communication: safeTextList(value.communication, 3, 240),
    importantCorrections: safeCorrections(value.importantCorrections),
    newUsefulExpressions: safeTextList(value.newUsefulExpressions, 3, 180),
    suggestedPractice: safeText(value.suggestedPractice, 300),
  };
}

export class GroqProvider implements AIProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async chat(request: ChatRequest): Promise<ChatResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(GROQ_CHAT_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: request.systemPrompt },
            ...request.messages,
          ],
          temperature: 0.65,
          max_completion_tokens: 520,
          reasoning_effort: "low",
          include_reasoning: false,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "conversation_tutor_response",
              strict: true,
              schema: TUTOR_RESPONSE_SCHEMA,
            },
          },
        }),
        signal: controller.signal,
      });

      const payload = await response.json().catch(
        () => ({}),
      ) as GroqChatResponse;

      if (!response.ok) {
        if (response.status === 429) {
          throw new AIProviderError(
            "O tutor recebeu muitas solicitações agora. Aguarde um momento e tente novamente.",
            429,
            "GROQ_RATE_LIMIT",
          );
        }
        console.error("Groq chat request failed", {
          status: response.status,
          providerMessage: payload.error?.message || "unknown",
        });
        throw new AIProviderError(
          "O tutor está temporariamente indisponível. Tente novamente em alguns instantes.",
          502,
          "GROQ_REQUEST_FAILED",
        );
      }

      const content = String(payload.choices?.[0]?.message?.content || "")
        .trim();
      if (!content) {
        throw new AIProviderError(
          "O tutor não conseguiu formular uma resposta. Tente enviar sua mensagem novamente.",
          502,
          "EMPTY_AI_REPLY",
        );
      }

      return parseTutorResult(content);
    } catch (error) {
      if (error instanceof AIProviderError) throw error;
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new AIProviderError(
          "O tutor demorou mais do que o esperado. Tente novamente.",
          504,
          "GROQ_TIMEOUT",
        );
      }
      console.error("Unexpected Groq chat error", {
        name: error instanceof Error ? error.name : "unknown",
      });
      throw new AIProviderError(
        "Não foi possível conectar ao tutor agora. Tente novamente em alguns instantes.",
        502,
        "GROQ_CONNECTION_FAILED",
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  async analyzeStudentUtterance(
    request: UtteranceAnalysisRequest,
  ): Promise<UtteranceAnalysisResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(GROQ_CHAT_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: "system",
              content: request.systemPrompt,
            },
            { role: "user", content: request.text },
          ],
          temperature: 0.2,
          max_completion_tokens: 360,
          reasoning_effort: "low",
          include_reasoning: false,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "conversation_utterance_correction",
              strict: true,
              schema: UTTERANCE_ANALYSIS_SCHEMA,
            },
          },
        }),
        signal: controller.signal,
      });
      const payload = await response.json().catch(
        () => ({}),
      ) as GroqChatResponse;
      if (!response.ok) {
        if (response.status === 429) {
          throw new AIProviderError(
            "As correções estão temporariamente ocupadas.",
            429,
            "GROQ_RATE_LIMIT",
          );
        }
        console.error("Groq correction request failed", {
          status: response.status,
          providerMessage: payload.error?.message || "unknown",
        });
        throw new AIProviderError(
          "As correções estão temporariamente indisponíveis.",
          502,
          "GROQ_REQUEST_FAILED",
        );
      }
      return parseUtteranceAnalysis(
        String(payload.choices?.[0]?.message?.content || "").trim(),
      );
    } catch (error) {
      if (error instanceof AIProviderError) throw error;
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new AIProviderError(
          "A correção demorou mais do que o esperado.",
          504,
          "GROQ_TIMEOUT",
        );
      }
      console.error("Unexpected Groq correction error", {
        name: error instanceof Error ? error.name : "unknown",
      });
      throw new AIProviderError(
        "Não foi possível analisar esta fala agora.",
        502,
        "GROQ_CONNECTION_FAILED",
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  async generateConversationReport(
    request: ConversationReportRequest,
  ): Promise<ConversationReport> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(GROQ_CHAT_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: request.systemPrompt },
            ...request.messages,
          ],
          temperature: 0.35,
          max_completion_tokens: 700,
          reasoning_effort: "low",
          include_reasoning: false,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "conversation_report",
              strict: true,
              schema: CONVERSATION_REPORT_SCHEMA,
            },
          },
        }),
        signal: controller.signal,
      });
      const payload = await response.json().catch(
        () => ({}),
      ) as GroqChatResponse;
      if (!response.ok) {
        if (response.status === 429) {
          throw new AIProviderError(
            "O relatório está temporariamente ocupado. Tente novamente em instantes.",
            429,
            "GROQ_RATE_LIMIT",
          );
        }
        console.error("Groq report request failed", {
          status: response.status,
          providerMessage: payload.error?.message || "unknown",
        });
        throw new AIProviderError(
          "Não foi possível criar o relatório agora.",
          502,
          "GROQ_REQUEST_FAILED",
        );
      }
      return parseConversationReport(
        String(payload.choices?.[0]?.message?.content || "").trim(),
      );
    } catch (error) {
      if (error instanceof AIProviderError) throw error;
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new AIProviderError(
          "O relatório demorou mais do que o esperado.",
          504,
          "GROQ_TIMEOUT",
        );
      }
      console.error("Unexpected Groq report error", {
        name: error instanceof Error ? error.name : "unknown",
      });
      throw new AIProviderError(
        "Não foi possível criar o relatório agora.",
        502,
        "GROQ_CONNECTION_FAILED",
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
