import { NextRequest, NextResponse } from "next/server";
import { executeAgent } from "../../../lib/agent/agent";
import { getSession, saveSession } from "../../../lib/agent/session-store";
import { MAX_LLM_CALLS } from "../../../lib/agent/types";

export const runtime = "nodejs";
export const maxDuration = 300;

function errorResponse(message: string, status = 400) {
  return NextResponse.json(
    { status: "error", error: message, response: null, steps: [] },
    { status },
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { prompt?: unknown };
    if (typeof body.prompt !== "string" || !body.prompt.trim()) {
      return errorResponse("The request must include a non-empty string field named 'prompt'.");
    }
    if (body.prompt.length > 30000) return errorResponse("The prompt is limited to 30,000 characters.");

    const existingId = request.cookies.get("adaptive_session_id")?.value;
    const sessionId = existingId || crypto.randomUUID();
    const state = getSession(sessionId);
    const result = await executeAgent(state, body.prompt.trim());
    saveSession(state);

    const response = NextResponse.json({
      status: "ok",
      error: null,
      response: result.response,
      steps: result.steps,
    });
    response.headers.set("X-LLM-Calls-Used", String(state.llmCalls));
    response.headers.set("X-LLM-Calls-Remaining", String(Math.max(0, MAX_LLM_CALLS - state.llmCalls)));
    response.headers.set("X-Agent-Session-Id", sessionId);
    if (!existingId) {
      response.cookies.set("adaptive_session_id", sessionId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60,
        path: "/",
      });
    }
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected agent error.";
    return errorResponse(message, 500);
  }
}
