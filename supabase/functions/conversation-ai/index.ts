import { createClient } from "jsr:@supabase/supabase-js@2";
import { createAIProvider } from "../_shared/ai/factory.ts";
import { AIProviderError } from "../_shared/ai/provider.ts";
import {
  conversationReportPrompt,
  conversationTutorPrompt,
  normalizeStudentLevel,
  utteranceCorrectionPrompt,
} from "../_shared/conversation-tutor.ts";
import {
  MAX_MESSAGE_LENGTH,
  validatedMessages,
  validatedReportMessages,
} from "../_shared/conversation-request.ts";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_REQUESTS = 12;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const requestWindows = new Map<string, number[]>();

interface ConversationRequest {
  action?: unknown;
  level?: unknown;
  messages?: unknown;
  text?: unknown;
  previousTurnContext?: unknown;
}

function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: corsHeaders });
}

function errorResponse(
  code: string,
  message: string,
  status: number,
): Response {
  return jsonResponse({ error: { code, message } }, status);
}

function projectPublishableKey(request: Request): string {
  const legacyKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  if (legacyKey) return legacyKey;

  const keyMap = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "";
  if (keyMap) {
    try {
      const values = Object.values(JSON.parse(keyMap)) as string[];
      if (values[0]) return values[0];
    } catch {
      // A chave enviada pelo cliente ainda pode ser usada abaixo.
    }
  }
  return request.headers.get("apikey") || "";
}

async function authenticatedUser(request: Request) {
  const authorization = request.headers.get("Authorization") || "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const publishableKey = projectPublishableKey(request);
  if (!authorization.startsWith("Bearer ") || !supabaseUrl || !publishableKey) {
    return null;
  }

  const supabase = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

function enforceRateLimit(userId: string): boolean {
  const now = Date.now();
  const current = (requestWindows.get(userId) || [])
    .filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
  if (current.length >= RATE_LIMIT_REQUESTS) {
    requestWindows.set(userId, current);
    return false;
  }
  current.push(now);
  requestWindows.set(userId, current);
  return true;
}

function optionalText(value: unknown, maximum: number): string {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return errorResponse(
      "METHOD_NOT_ALLOWED",
      "Use uma solicitação POST.",
      405,
    );
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 20_000) {
    return errorResponse(
      "REQUEST_TOO_LARGE",
      "A conversa enviada é muito grande.",
      413,
    );
  }

  const user = await authenticatedUser(request);
  if (!user) {
    return errorResponse(
      "UNAUTHORIZED",
      "Sua sessão expirou. Entre novamente no portal.",
      401,
    );
  }
  let body: ConversationRequest;
  try {
    body = await request.json();
  } catch {
    return errorResponse(
      "INVALID_JSON",
      "A solicitação enviada não é válida.",
      400,
    );
  }

  const action = typeof body.action === "string" ? body.action : "chat";
  if (!enforceRateLimit(`${user.id}:${action}`)) {
    return errorResponse(
      "RATE_LIMIT",
      "Você enviou muitas mensagens em pouco tempo. Aguarde um minuto e tente novamente.",
      429,
    );
  }
  if (action === "analyze_utterance") {
    const text = optionalText(body.text, MAX_MESSAGE_LENGTH);
    if (!text) {
      return errorResponse(
        "INVALID_TEXT",
        "Envie uma fala válida de até 1.500 caracteres.",
        400,
      );
    }
    try {
      const level = normalizeStudentLevel(body.level);
      const previousTurnContext = optionalText(body.previousTurnContext, 1_200);
      const provider = createAIProvider();
      const result = await provider.analyzeStudentUtterance({
        text,
        systemPrompt: utteranceCorrectionPrompt(level, previousTurnContext),
      });
      return jsonResponse(result);
    } catch (error) {
      if (error instanceof AIProviderError) {
        return errorResponse(error.code, error.message, error.status);
      }
      console.error("Unexpected conversation correction error", {
        name: error instanceof Error ? error.name : "unknown",
      });
      return errorResponse(
        "INTERNAL_ERROR",
        "Não foi possível analisar esta fala agora.",
        500,
      );
    }
  }

  if (action === "generate_report") {
    const messages = validatedReportMessages(body.messages);
    if (!messages) {
      return errorResponse(
        "INVALID_MESSAGES",
        "Não há conversa suficiente para criar o relatório.",
        400,
      );
    }
    try {
      const level = normalizeStudentLevel(body.level);
      const provider = createAIProvider();
      const result = await provider.generateConversationReport({
        systemPrompt: conversationReportPrompt(level),
        messages,
      });
      return jsonResponse(result);
    } catch (error) {
      if (error instanceof AIProviderError) {
        return errorResponse(error.code, error.message, error.status);
      }
      console.error("Unexpected conversation report error", {
        name: error instanceof Error ? error.name : "unknown",
      });
      return errorResponse(
        "INTERNAL_ERROR",
        "Não foi possível criar o relatório agora.",
        500,
      );
    }
  }

  if (action !== "chat") {
    return errorResponse(
      "UNSUPPORTED_ACTION",
      "Esta ação ainda não está disponível.",
      400,
    );
  }

  const messages = validatedMessages(body.messages);
  if (!messages) {
    return errorResponse(
      "INVALID_MESSAGES",
      "Escreva uma mensagem válida de até 1.500 caracteres.",
      400,
    );
  }

  try {
    const level = normalizeStudentLevel(body.level);
    const provider = createAIProvider();
    const result = await provider.chat({
      systemPrompt: conversationTutorPrompt(level),
      messages,
    });
    return jsonResponse({
      reply: result.reply,
      corrections: result.corrections,
      vocabulary: result.vocabulary,
    });
  } catch (error) {
    if (error instanceof AIProviderError) {
      return errorResponse(error.code, error.message, error.status);
    }
    console.error("Unexpected conversation function error", {
      name: error instanceof Error ? error.name : "unknown",
    });
    return errorResponse(
      "INTERNAL_ERROR",
      "Não foi possível responder agora. Tente novamente em alguns instantes.",
      500,
    );
  }
});
