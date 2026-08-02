import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "../../../lib/agent/session-store";

export async function DELETE(request: NextRequest) {
  const sessionId = request.cookies.get("adaptive_session_id")?.value;
  if (sessionId) deleteSession(sessionId);
  const response = NextResponse.json({ status: "ok" });
  response.cookies.set("adaptive_session_id", "", { maxAge: 0, path: "/" });
  return response;
}
