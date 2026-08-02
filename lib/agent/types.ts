export const MAX_LLM_CALLS = 16;

export const TOOL_NAMES = [
  "AskInterests",
  "AnalyzeMaterial",
  "ExplainMaterial",
  "StoryTool",
  "QuestionTool",
  "AnswerEvaluator",
  "RespondDirectly",
  "Stop",
] as const;

export type ToolName = (typeof TOOL_NAMES)[number];

export type TraceStep = {
  module: string;
  prompt: { System_prompt: string; User_prompt: string };
  response: Record<string, unknown>;
};

export type ChatTurn = { role: "student" | "teacher"; content: string };

export type LearningState = {
  sessionId: string;
  material: string;
  interests: string[];
  topics: string[];
  weakTopics: string[];
  strongTopics: string[];
  history: ChatTurn[];
  llmCalls: number;
  lastAction: ToolName | null;
  updatedAt: number;
};

export type SupervisorDecision = {
  action: ToolName;
  reason: string;
  tool_instruction: string;
  direct_response: string;
};
