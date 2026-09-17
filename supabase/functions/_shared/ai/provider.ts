export type TutorRole = "user" | "assistant";

export interface TutorMessage {
  role: TutorRole;
  content: string;
}

export interface ChatRequest {
  systemPrompt: string;
  messages: TutorMessage[];
}

export interface TutorCorrection {
  original: string;
  corrected: string;
  explanation: string;
}

export interface TutorVocabulary {
  original: string;
  english: string;
}

export interface ChatResult {
  reply: string;
  corrections: TutorCorrection[];
  vocabulary: TutorVocabulary[];
}

export interface UtteranceAnalysisRequest {
  text: string;
  systemPrompt: string;
}

export interface UtteranceAnalysisResult {
  hasImportantCorrection: boolean;
  corrections: TutorCorrection[];
}

export interface ConversationReportRequest {
  systemPrompt: string;
  messages: TutorMessage[];
}

export interface ConversationReport {
  grammar: string[];
  vocabulary: string[];
  communication: string[];
  importantCorrections: TutorCorrection[];
  newUsefulExpressions: string[];
  suggestedPractice: string;
}

export interface AIProvider {
  chat(request: ChatRequest): Promise<ChatResult>;
  analyzeStudentUtterance(
    request: UtteranceAnalysisRequest,
  ): Promise<UtteranceAnalysisResult>;
  generateConversationReport(
    request: ConversationReportRequest,
  ): Promise<ConversationReport>;
}

export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly status = 502,
    public readonly code = "AI_PROVIDER_ERROR",
  ) {
    super(message);
    this.name = "AIProviderError";
  }
}
