import { createClient } from "jsr:@supabase/supabase-js@2";
import { AIProviderError } from "../_shared/ai/provider.ts";
import {
  GEMINI_LIVE_TOKEN_CONNECTION_WINDOW_MS,
  GEMINI_LIVE_TOKEN_START_WINDOW_MS,
  geminiLiveConfig,
  isGeminiLiveEnabled,
} from "../_shared/gemini-live-config.ts";

const GEMINI_AUTH_TOKENS_URL =
  "https://generativelanguage.googleapis.com/v1beta/auth_tokens";
const RATE_LIMIT_WINDOW_MS = 5 * 60_000;
const RATE_LIMIT_REQUESTS = 3;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const requestWindows = new Map<string, number[]>();

interface GeminiTokenResponse {
  name?: unknown;
  error?: { message?: unknown };
}

interface GeminiLiveTokenRequest {
  action?: unknown;
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
      // A chave enviada pelo navegador ainda pode ser usada abaixo.
    }
  }
  return request.headers.get("apikey") || "";
}

async function authenticatedStudent(request: Request) {
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
  if (error || !data.user || data.user.is_anonymous) return null;
  return data.user;
}

function enforceRateLimit(userId: string): boolean {
  const now = Date.now();
  const current = (requestWindows.get(userId) || []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
  );
  if (current.length >= RATE_LIMIT_REQUESTS) {
    requestWindows.set(userId, current);
    return false;
  }
  current.push(now);
  requestWindows.set(userId, current);
  return true;
}

function modelName(model: string): string {
  return model.startsWith("models/") ? model : `models/${model}`;
}

async function createEphemeralToken(): Promise<string> {
  const config = geminiLiveConfig();
  const now = Date.now();
  const response = await fetch(GEMINI_AUTH_TOKENS_URL, {
    method: "POST",
    headers: {
      "x-goog-api-key": config.apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      authToken: {
        uses: 1,
        newSessionExpireTime: new Date(
          now + GEMINI_LIVE_TOKEN_START_WINDOW_MS,
        ).toISOString(),
        expireTime: new Date(
          now + GEMINI_LIVE_TOKEN_CONNECTION_WINDOW_MS,
        ).toISOString(),
        fieldMask:
          "model,generationConfig.responseModalities,sessionResumption,inputAudioTranscription,outputAudioTranscription",
        bidiGenerateContentSetup: {
          model: modelName(config.model),
          generationConfig: { responseModalities: ["AUDIO"] },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          sessionResumption: {},
        },
      },
    }),
  });
  const payload = await response.json().catch(
    () => ({}),
  ) as GeminiTokenResponse;
  const token = typeof payload.name === "string" ? payload.name.trim() : "";

  if (!response.ok || !token) {
    console.error("Gemini ephemeral token request failed", {
      status: response.status,
      providerMessage: typeof payload.error?.message === "string"
        ? payload.error.message
        : "unknown",
    });
    throw new AIProviderError(
      response.status === 429
        ? "A conversa ao vivo recebeu muitas solicitações. Aguarde um momento e tente novamente."
        : "Não foi possível iniciar a conversa ao vivo agora. Tente novamente em alguns instantes.",
      response.status === 429 ? 429 : 502,
      response.status === 429 ? "GEMINI_RATE_LIMIT" : "GEMINI_TOKEN_FAILED",
    );
  }

  return token;
}

async function requestBody(
  request: Request,
): Promise<GeminiLiveTokenRequest | null> {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 1_000) return null;
  try {
    const body = await request.json();
    return body && typeof body === "object"
      ? body as GeminiLiveTokenRequest
      : null;
  } catch {
    return null;
  }
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

  const body = await requestBody(request);
  if (!body) {
    return errorResponse(
      "INVALID_REQUEST",
      "A solicitação enviada não é válida.",
      400,
    );
  }

  const user = await authenticatedStudent(request);
  if (!user) {
    return errorResponse(
      "UNAUTHORIZED",
      "Sua sessão expirou. Entre novamente no portal.",
      401,
    );
  }

  const action = body.action === "availability"
    ? "availability"
    : body.action === "token" || body.action === undefined
    ? "token"
    : "unknown";
  if (action === "unknown") {
    return errorResponse(
      "UNSUPPORTED_ACTION",
      "Esta ação não está disponível.",
      400,
    );
  }

  if (action === "availability") {
    if (!isGeminiLiveEnabled()) return jsonResponse({ enabled: false });
    try {
      const config = geminiLiveConfig();
      return jsonResponse({
        enabled: true,
        model: config.model,
        maxSessionMinutes: config.maxSessionMinutes,
      });
    } catch (error) {
      if (error instanceof AIProviderError) {
        return errorResponse(error.code, error.message, error.status);
      }
      return errorResponse(
        "INTERNAL_ERROR",
        "Não foi possível preparar a conversa ao vivo agora.",
        500,
      );
    }
  }

  if (!isGeminiLiveEnabled()) {
    return errorResponse(
      "LIVE_DISABLED",
      "A conversa ao vivo ainda não está disponível.",
      403,
    );
  }
  if (!enforceRateLimit(user.id)) {
    return errorResponse(
      "RATE_LIMIT",
      "Você tentou iniciar muitas conversas em pouco tempo. Aguarde alguns minutos.",
      429,
    );
  }

  try {
    const token = await createEphemeralToken();
    return jsonResponse({ token });
  } catch (error) {
    if (error instanceof AIProviderError) {
      return errorResponse(error.code, error.message, error.status);
    }
    console.error("Unexpected Gemini token function error", {
      name: error instanceof Error ? error.name : "unknown",
    });
    return errorResponse(
      "INTERNAL_ERROR",
      "Não foi possível iniciar a conversa ao vivo agora. Tente novamente em alguns instantes.",
      500,
    );
  }
});
