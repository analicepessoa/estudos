import { TutorMessage } from "./ai/provider.ts";

export const MAX_MESSAGE_LENGTH = 1_500;
export const MAX_HISTORY_MESSAGES = 18;
export const MAX_HISTORY_CHARACTERS = 12_000;

export function validatedMessages(value: unknown): TutorMessage[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const messages = value.slice(-MAX_HISTORY_MESSAGES).map((item) => {
    if (!item || typeof item !== "object") return null;
    const role = (item as { role?: unknown }).role;
    const content = String((item as { content?: unknown }).content || "")
      .trim();
    if ((role !== "user" && role !== "assistant") || !content) return null;
    if (content.length > MAX_MESSAGE_LENGTH) return null;
    return { role, content } as TutorMessage;
  });
  if (messages.some((message) => message === null)) return null;
  const safeMessages = messages as TutorMessage[];
  const totalCharacters = safeMessages.reduce(
    (total, message) => total + message.content.length,
    0,
  );
  if (totalCharacters > MAX_HISTORY_CHARACTERS) return null;
  if (safeMessages.at(-1)?.role !== "user") return null;
  return safeMessages;
}

export function validatedReportMessages(value: unknown): TutorMessage[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const messages = value.slice(-MAX_HISTORY_MESSAGES).map((item) => {
    if (!item || typeof item !== "object") return null;
    const role = (item as { role?: unknown }).role;
    const content = String((item as { content?: unknown }).content || "")
      .trim();
    if ((role !== "user" && role !== "assistant") || !content) return null;
    if (content.length > MAX_MESSAGE_LENGTH) return null;
    return { role, content } as TutorMessage;
  });
  if (messages.some((message) => message === null)) return null;
  const safeMessages = messages as TutorMessage[];
  const totalCharacters = safeMessages.reduce(
    (total, message) => total + message.content.length,
    0,
  );
  return totalCharacters <= MAX_HISTORY_CHARACTERS ? safeMessages : null;
}
