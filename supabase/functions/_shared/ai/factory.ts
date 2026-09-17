import { AIProvider, AIProviderError } from "./provider.ts";
import { GroqProvider } from "./groq.ts";

export function createAIProvider(): AIProvider {
  const provider = (Deno.env.get("AI_PROVIDER") || "groq").toLowerCase();
  if (provider !== "groq") {
    throw new AIProviderError(
      "O provedor de IA configurado não está disponível.",
      500,
      "UNSUPPORTED_AI_PROVIDER",
    );
  }

  const apiKey = Deno.env.get("GROQ_API_KEY") || "";
  const model = Deno.env.get("GROQ_CHAT_MODEL") || "";
  if (!apiKey) {
    throw new AIProviderError(
      "O tutor ainda não foi configurado. Fale com a professora.",
      503,
      "MISSING_GROQ_API_KEY",
    );
  }
  if (!model) {
    throw new AIProviderError(
      "O modelo do tutor ainda não foi configurado. Fale com a professora.",
      503,
      "MISSING_GROQ_CHAT_MODEL",
    );
  }

  return new GroqProvider(apiKey, model);
}
