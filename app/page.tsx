"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type TraceStep = {
  module: string;
  prompt: { System_prompt: string; User_prompt: string };
  response: unknown;
};

type ApiResult = {
  status: "ok" | "error";
  error: string | null;
  response: string | null;
  steps: TraceStep[];
};

type Message = {
  id: string;
  role: "student" | "teacher";
  text: string;
  steps?: TraceStep[];
};

const STARTERS = [
  "אני אוהב כדורסל. הנה חומר הלימוד שלי: ",
  "סכם לי את החומר והתחל ללמד אותי: ",
  "בחן אותי על החומר הבא: ",
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState({ used: 0, remaining: 16 });
  const [openTrace, setOpenTrace] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function runAgent(event: FormEvent) {
    event.preventDefault();
    const value = prompt.trim();
    if (!value || busy) return;

    const studentMessage: Message = {
      id: crypto.randomUUID(),
      role: "student",
      text: value,
    };
    setMessages((current) => [...current, studentMessage]);
    setPrompt("");
    setError(null);
    setBusy(true);

    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: value }),
      });
      const result = (await response.json()) as ApiResult;
      if (!response.ok || result.status === "error" || !result.response) {
        throw new Error(result.error || "The agent could not complete the request.");
      }
      const messageId = crypto.randomUUID();
      setMessages((current) => [
        ...current,
        {
          id: messageId,
          role: "teacher",
          text: result.response!,
          steps: result.steps,
        },
      ]);
      const used = Number(response.headers.get("X-LLM-Calls-Used"));
      const remaining = Number(response.headers.get("X-LLM-Calls-Remaining"));
      if (Number.isFinite(used) && Number.isFinite(remaining)) setUsage({ used, remaining });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unexpected error");
    } finally {
      setBusy(false);
    }
  }

  async function resetSession() {
    await fetch("/api/session", { method: "DELETE" }).catch(() => undefined);
    setMessages([]);
    setUsage({ used: 0, remaining: 16 });
    setError(null);
    setOpenTrace(null);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Adaptive AI Teacher home">
          <span className="brand-mark">A</span>
          <span>
            <strong>Adaptive</strong>
            <small>AI Teacher</small>
          </span>
        </a>
        <div className="top-actions">
          <div className="usage" aria-label={`${usage.remaining} LLM calls remaining`}>
            <span className="usage-dot" />
            {usage.remaining} / 16 calls left
          </div>
          <button className="ghost-button" onClick={resetSession} type="button">
            New session
          </button>
        </div>
      </header>

      <section className="workspace" id="top">
        <aside className="context-panel">
          <div>
            <p className="eyebrow">PERSONAL LEARNING AGENT</p>
            <h1>Learn the material your way.</h1>
            <p className="intro">
              Paste learning material, then talk naturally. The supervisor chooses the
              right teaching tool at every turn—without a fixed lesson path.
            </p>
          </div>

          <div className="agent-loop" aria-label="How the agent works">
            <span>Understand</span>
            <i>→</i>
            <span>Choose a tool</span>
            <i>→</i>
            <span>Adapt</span>
          </div>

          <div className="capabilities">
            <p>THE AGENT CAN</p>
            <ul>
              <li><span>01</span> Explain and summarize</li>
              <li><span>02</span> Teach through personal stories</li>
              <li><span>03</span> Ask and evaluate questions</li>
              <li><span>04</span> Track weak topics in memory</li>
            </ul>
          </div>

          <p className="source-rule">
            <strong>Source rule</strong>
            Your material is authoritative. General model knowledge may enrich an
            explanation, but never overrides your text.
          </p>
        </aside>

        <section className="chat-panel" aria-label="Learning conversation">
          <div className="chat-heading">
            <div>
              <span className="live-dot" /> Session active
            </div>
            <span>{messages.length ? `${messages.length} messages` : "Ready to learn"}</span>
          </div>

          <div className="messages" aria-live="polite">
            {messages.length === 0 ? (
              <div className="empty-state">
                <div className="orb"><span>AI</span></div>
                <h2>What are we learning today?</h2>
                <p>Start by pasting plain text. You can also tell me what interests you.</p>
                <div className="starter-list">
                  {STARTERS.map((starter) => (
                    <button key={starter} onClick={() => setPrompt(starter)} type="button">
                      {starter.trim()}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <article className={`message ${message.role}`} key={message.id}>
                  <div className="message-label">
                    <span>{message.role === "student" ? "YOU" : "ADAPTIVE TEACHER"}</span>
                    {message.steps?.length ? (
                      <button
                        type="button"
                        onClick={() => setOpenTrace(openTrace === message.id ? null : message.id)}
                        aria-expanded={openTrace === message.id}
                      >
                        {message.steps.length} traced {message.steps.length === 1 ? "step" : "steps"}
                      </button>
                    ) : null}
                  </div>
                  <p>{message.text}</p>
                  {openTrace === message.id && message.steps ? (
                    <div className="trace">
                      {message.steps.map((step, index) => (
                        <details key={`${step.module}-${index}`} open>
                          <summary>
                            <span>{String(index + 1).padStart(2, "0")}</span>
                            {step.module}
                          </summary>
                          <div className="trace-body">
                            <h4>System prompt</h4>
                            <pre>{step.prompt.System_prompt}</pre>
                            <h4>User prompt</h4>
                            <pre>{step.prompt.User_prompt}</pre>
                            <h4>Response</h4>
                            <pre>{JSON.stringify(step.response, null, 2)}</pre>
                          </div>
                        </details>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))
            )}
            {busy ? (
              <div className="thinking">
                <span /><span /><span /> Supervisor is choosing the next action…
              </div>
            ) : null}
            <div ref={endRef} />
          </div>

          <form className="composer" onSubmit={runAgent}>
            <label htmlFor="prompt">Message the learning agent</label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder="Paste learning material or answer the teacher…"
              rows={3}
              maxLength={30000}
            />
            <div className="composer-footer">
              <span>Enter to send · Shift + Enter for a new line</span>
              <button type="submit" disabled={!prompt.trim() || busy}>
                Run agent <span>↗</span>
              </button>
            </div>
          </form>
          {error ? <div className="error-banner" role="alert">{error}</div> : null}
        </section>
      </section>
    </main>
  );
}
