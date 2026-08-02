import { callLlm } from "./llm";
import { supervisorPrompt, toolPrompt } from "./prompts";
import {
  LearningState,
  MAX_LLM_CALLS,
  SupervisorDecision,
  TOOL_NAMES,
  ToolName,
  TraceStep,
} from "./types";

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(0, 20) : [];
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function validateDecision(raw: Record<string, unknown>): SupervisorDecision {
  const action = raw.action;
  if (typeof action !== "string" || !TOOL_NAMES.includes(action as ToolName)) {
    throw new Error("LearningSupervisor selected an unknown tool.");
  }
  return {
    action: action as ToolName,
    reason: typeof raw.reason === "string" ? raw.reason : "",
    tool_instruction: typeof raw.tool_instruction === "string" ? raw.tool_instruction : "",
    direct_response: typeof raw.direct_response === "string" ? raw.direct_response : "",
  };
}

function updateState(state: LearningState, action: ToolName, result: Record<string, unknown>) {
  if (typeof result.material === "string" && result.material.trim()) {
    state.material = result.material.trim().slice(0, 30000);
  }
  state.interests = unique([...state.interests, ...stringArray(result.interests)]);
  state.topics = unique([...state.topics, ...stringArray(result.topics)]);
  state.weakTopics = unique([...state.weakTopics, ...stringArray(result.weak_topics)]);
  state.strongTopics = unique([...state.strongTopics, ...stringArray(result.strong_topics)]);
  state.lastAction = action;
}

export async function executeAgent(state: LearningState, message: string) {
  const steps: TraceStep[] = [];
  if (state.llmCalls >= MAX_LLM_CALLS) {
    const response = "הגענו למגבלה של 16 קריאות למודל בשיחה הזו. אפשר להתחיל session חדש כדי להמשיך ללמוד.";
    state.history.push({ role: "student", content: message }, { role: "teacher", content: response });
    return { response, steps };
  }

  state.history.push({ role: "student", content: message });
  const callsAfterSupervisor = MAX_LLM_CALLS - state.llmCalls - 1;
  const supervisor = supervisorPrompt(state, message, Math.max(0, callsAfterSupervisor));
  const supervisorRaw = await callLlm([
    { role: "system", content: supervisor.system },
    { role: "user", content: supervisor.user },
  ]);
  state.llmCalls += 1;
  const decision = validateDecision(supervisorRaw);
  steps.push({
    module: "LearningSupervisor",
    prompt: { System_prompt: supervisor.system, User_prompt: supervisor.user },
    response: supervisorRaw,
  });

  let response = decision.direct_response;
  if (decision.action !== "RespondDirectly" && decision.action !== "Stop") {
    if (state.llmCalls >= MAX_LLM_CALLS) {
      response = "הגעתי למגבלת הקריאות לפני הפעלת הכלי הבא. הנה המלצה: פתח session חדש כדי להמשיך מהחומר עם תקציב מלא.";
      state.lastAction = "Stop";
    } else {
      const tool = toolPrompt(decision.action, state, message, decision.tool_instruction);
      const toolResult = await callLlm([
        { role: "system", content: tool.system },
        { role: "user", content: tool.user },
      ]);
      state.llmCalls += 1;
      steps.push({
        module: decision.action,
        prompt: { System_prompt: tool.system, User_prompt: tool.user },
        response: toolResult,
      });
      updateState(state, decision.action, toolResult);
      response = typeof toolResult.response === "string" ? toolResult.response : "הפעולה הושלמה, אך לא התקבלה תשובה להצגה.";
    }
  } else {
    state.lastAction = decision.action;
    if (!response) response = decision.action === "Stop" ? "סיימנו את תהליך הלמידה להיום." : "אני מוכן להמשיך.";
  }

  state.history.push({ role: "teacher", content: response });
  state.history = state.history.slice(-20);
  return { response, steps };
}
