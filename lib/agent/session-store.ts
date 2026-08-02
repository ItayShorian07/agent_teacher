import { LearningState } from "./types";

const SESSION_TTL_MS = 60 * 60 * 1000;
const globalStore = globalThis as typeof globalThis & {
  adaptiveTeacherSessions?: Map<string, LearningState>;
};

const sessions = globalStore.adaptiveTeacherSessions ?? new Map<string, LearningState>();
globalStore.adaptiveTeacherSessions = sessions;

export function createState(sessionId: string): LearningState {
  return {
    sessionId,
    material: "",
    interests: [],
    topics: [],
    weakTopics: [],
    strongTopics: [],
    history: [],
    llmCalls: 0,
    lastAction: null,
    updatedAt: Date.now(),
  };
}

export function getSession(sessionId: string): LearningState {
  const now = Date.now();
  for (const [id, state] of sessions) {
    if (now - state.updatedAt > SESSION_TTL_MS) sessions.delete(id);
  }
  const existing = sessions.get(sessionId);
  if (existing) return existing;
  const state = createState(sessionId);
  sessions.set(sessionId, state);
  return state;
}

export function saveSession(state: LearningState) {
  state.updatedAt = Date.now();
  sessions.set(state.sessionId, state);
}

export function deleteSession(sessionId: string) {
  sessions.delete(sessionId);
}
