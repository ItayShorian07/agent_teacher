type LlmMessage = { role: "system" | "user" | "assistant"; content: string };

function extractJson(text: string): Record<string, unknown> {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error("The model returned invalid JSON.");
  }
}

export async function callLlm(messages: LlmMessage[]): Promise<Record<string, unknown>> {
  const apiKey = process.env.LLMOD_API_KEY;
  if (!apiKey) return mockLlm(messages);

  const configured = process.env.LLMOD_CHAT_COMPLETIONS_URL;
  const baseUrl = (process.env.LLMOD_BASE_URL || "https://api.llmod.ai/v1").replace(/\/$/, "");
  const url = configured || `${baseUrl}/chat/completions`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(process.env.LLMOD_API_KEY_HEADER
        ? { [process.env.LLMOD_API_KEY_HEADER]: apiKey }
        : {}),
    },
    body: JSON.stringify({
      model: process.env.LLMOD_MODEL || "MB5R2CF-azure/gpt-5.4-mini",
      messages,
      temperature: 0.25,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`LLMod request failed (${response.status}): ${detail.slice(0, 300)}`);
  }
  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | Array<{ text?: string }> } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  const text = Array.isArray(content)
    ? content.map((part) => part.text || "").join("")
    : content;
  if (!text) throw new Error("LLMod returned an empty response.");
  return extractJson(text);
}

function mockLlm(messages: LlmMessage[]): Record<string, unknown> {
  const system = messages[0]?.content || "";
  const user = messages.at(-1)?.content || "";
  let demoInput: { student_message?: string } = {};
  try { demoInput = JSON.parse(user) as { student_message?: string }; } catch { /* demo fallback */ }
  const studentMessage = demoInput.student_message || user;
  if (system.startsWith("You are LearningSupervisor,")) {
    const hasMaterial = user.includes('"material":"') && !user.includes('"material":""');
    const hasInterests = !user.includes('"interests":[]');
    const looksLikeAnswer = /student message.*\b(answer|התשובה|לדעתי|כי|היא|הוא)\b/is.test(user);
    let action = "AnalyzeMaterial";
    if (!hasMaterial) action = "AnalyzeMaterial";
    else if (!hasInterests) action = "AskInterests";
    else if (looksLikeAnswer) action = "AnswerEvaluator";
    else action = "QuestionTool";
    return {
      action,
      reason: "Demo mode selected the most useful next teaching action from the current state.",
      tool_instruction: "Respond in the student's language and move the learning conversation forward.",
      direct_response: "",
    };
  }
  if (system.includes("AskInterests")) return {
    response: "כדי להתאים את הלמידה אליך, ספר לי על שניים או שלושה דברים שמעניינים אותך—למשל ספורט, מוזיקה, משחקים או טכנולוגיה.",
    interests: [],
  };
  if (system.includes("AnalyzeMaterial")) return {
    response: "קיבלתי את חומר הלימוד ושמרתי אותו להמשך השיחה. במצב הדמו זיהיתי את הרעיונות המרכזיים. כעת ספר לי מה מעניין אותך, כדי שאוכל להתאים את ההסברים.",
    material: studentMessage.slice(-6000),
    interests: /כדורסל/.test(studentMessage) ? ["כדורסל"] : [],
    topics: ["הנושא המרכזי", "מושגי מפתח"],
  };
  if (system.includes("QuestionTool")) return {
    response: "נתחיל בשאלה קצרה: מהו הרעיון המרכזי של החומר במילים שלך?",
    questions: ["מהו הרעיון המרכזי של החומר במילים שלך?"],
  };
  if (system.includes("AnswerEvaluator")) return {
    response: "תשובה טובה. זיהית את הכיוון המרכזי, אבל כדאי לדייק במושגי המפתח. נסה לתת דוגמה אחת מתוך החומר.",
    score: 75,
    weak_topics: ["מושגי מפתח"],
    strong_topics: ["הרעיון המרכזי"],
    mastery: false,
  };
  return { response: "אני מוכן להמשיך ללמד בהתאם לחומר ולתחומי העניין שלך." };
}
