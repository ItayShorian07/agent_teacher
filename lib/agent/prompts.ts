import { LearningState, ToolName } from "./types";

function compactState(state: LearningState) {
  return {
    material: state.material.slice(0, 12000),
    interests: state.interests,
    topics: state.topics,
    weak_topics: state.weakTopics,
    strong_topics: state.strongTopics,
    last_action: state.lastAction,
    llm_calls_used: state.llmCalls,
    recent_history: state.history.slice(-8),
  };
}

export function supervisorPrompt(state: LearningState, message: string, remaining: number) {
  const system = `You are LearningSupervisor, the decision-making ReAct agent for an adaptive AI teacher.
There is NO fixed workflow. On every student turn, select exactly one best action from:
AskInterests, AnalyzeMaterial, ExplainMaterial, StoryTool, QuestionTool, AnswerEvaluator, RespondDirectly, Stop.

Rules:
- The supplied learning material is authoritative. General knowledge may enrich an explanation, but if it conflicts with the material, the material wins.
- Use AskInterests initially or gradually when interests are missing or could improve teaching.
- Use AnswerEvaluator when the student is answering a learning question.
- Stop when mastery is sufficient, the student asks to stop, no useful action remains, or the call budget requires it.
- Every LLM call, including this supervisor call and calls inside tools, counts toward a hard limit of 16.
- If only 0 additional tool calls remain, choose RespondDirectly or Stop and put the complete answer in direct_response.
- Never claim a fixed sequence. Keep prompts and context efficient.
- Match the student's language.

Return JSON only:
{"action":"ToolName","reason":"brief reason","tool_instruction":"specific instruction for the selected tool","direct_response":"complete reply only for RespondDirectly or Stop, otherwise empty"}`;
  const user = JSON.stringify({
    student_message: message,
    calls_remaining_after_supervisor: remaining,
    state: compactState(state),
  });
  return { system, user };
}

const TOOL_PURPOSES: Record<Exclude<ToolName, "RespondDirectly" | "Stop">, string> = {
  AskInterests: "Discover or refine the student's interests through one concise, natural question. Do not interrogate the student.",
  AnalyzeMaterial: "Treat the latest student text as learning material when appropriate. Identify its main topics and return a concise acknowledgement or initial orientation.",
  ExplainMaterial: "Explain the most useful part of the supplied material clearly at the student's apparent level.",
  StoryTool: "Teach a relevant part of the material through a memorable story connected to the student's interests.",
  QuestionTool: "Create one or a small set of targeted questions, prioritizing weak topics and the supplied material.",
  AnswerEvaluator: "Evaluate the student's latest answer against the supplied material, provide feedback and infer mastery. The material wins over general knowledge.",
};

export function toolPrompt(action: Exclude<ToolName, "RespondDirectly" | "Stop">, state: LearningState, message: string, instruction: string) {
  const system = `You are ${action}, a tool used by LearningSupervisor.
Purpose: ${TOOL_PURPOSES[action]}

Source policy: the student's learning material is authoritative. You may use general model knowledge for examples or clarification, but clearly distinguish it and never override conflicting source material.
Return valid JSON only with a required string field "response" written in the student's language.
Also include these fields when relevant:
- material: the authoritative material text when newly supplied
- interests: string[]
- topics: string[]
- weak_topics: string[]
- strong_topics: string[]
- score: number from 0 to 100
- mastery: boolean
- questions: string[]
Be concise, educational, supportive, and faithful to the material.`;
  const user = JSON.stringify({
    supervisor_instruction: instruction,
    student_message: message,
    state: compactState(state),
  });
  return { system, user };
}
