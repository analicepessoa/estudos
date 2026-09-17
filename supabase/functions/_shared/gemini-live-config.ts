import { AIProviderError } from "./ai/provider.ts";

export const GEMINI_LIVE_TOKEN_START_WINDOW_MS = 60_000;
export const GEMINI_LIVE_TOKEN_CONNECTION_WINDOW_MS = 12 * 60_000;
export const LIVE_SESSION_MAX_MINUTES_DEFAULT = 9;

export interface GeminiLiveConfig {
  apiKey: string;
  model: string;
  maxSessionMinutes: number;
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function isGeminiLiveEnabled(): boolean {
  return (Deno.env.get("ENABLE_GEMINI_LIVE") || "").toLowerCase() === "true";
}

export function geminiLiveConfig(): GeminiLiveConfig {
  const apiKey = Deno.env.get("GEMINI_API_KEY") || "";
  const model = Deno.env.get("GEMINI_LIVE_MODEL") || "";

  if (!apiKey) {
    throw new AIProviderError(
      "A conversa ao vivo ainda não foi configurada. Fale com a professora.",
      503,
      "MISSING_GEMINI_API_KEY",
    );
  }
  if (!model) {
    throw new AIProviderError(
      "O modelo da conversa ao vivo ainda não foi configurado. Fale com a professora.",
      503,
      "MISSING_GEMINI_LIVE_MODEL",
    );
  }

  return {
    apiKey,
    model,
    maxSessionMinutes: positiveInteger(
      Deno.env.get("LIVE_SESSION_MAX_MINUTES"),
      LIVE_SESSION_MAX_MINUTES_DEFAULT,
    ),
  };
}
