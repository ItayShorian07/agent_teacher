# Adaptive AI Teacher

An adaptive ReAct learning agent built for the AI Agents course project. The application accepts plain-text learning material and maintains a continuous learning conversation. A dynamic `LearningSupervisor` chooses the best tool on every turn; there is no fixed learning workflow.

## Core behavior

- Plain-text material only.
- Temporary, in-memory session state.
- Interests can be collected at the beginning or gradually.
- The model decides when mastery has been reached.
- The supplied material is authoritative. General model knowledge may enrich an explanation, but the material wins in a conflict.
- Hard limit of 16 total LLM calls per session, including supervisor and tool calls.
- Every LLM call is returned in `steps` with the module name, full prompts, and structured response.

## Architecture

`LearningSupervisor` dynamically chooses one of:

- `AskInterests`
- `AnalyzeMaterial`
- `ExplainMaterial`
- `StoryTool`
- `QuestionTool`
- `AnswerEvaluator`
- `RespondDirectly`
- `Stop`

The exact same module names are used in the architecture PNG, execution trace, prompts, and API documentation.

## Required endpoints

- `GET /api/team_info`
- `GET /api/agent_info`
- `GET /api/model_architecture` — returns `image/png`
- `POST /api/execute`

Example request:

```bash
curl -X POST http://localhost:3000/api/execute \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"אני אוהב כדורסל. חומר הלימוד: כדור הארץ מקיף את השמש."}'
```

The execute response has exactly the four required top-level fields:

```json
{
  "status": "ok",
  "error": null,
  "response": "...",
  "steps": []
}
```

LLM usage information is exposed through response headers so the required JSON schema remains exact:

- `X-LLM-Calls-Used`
- `X-LLM-Calls-Remaining`
- `X-Agent-Session-Id`

## Local setup

Requirements: Node.js 22 or later.

```bash
npm install
cp .env.example .env.local
npm run generate:architecture
npm run dev
```

Open `http://localhost:3000`.

Without `LLMOD_API_KEY`, the project runs in a deterministic demo mode so the GUI and API contract can be tested without spending budget.

## LLMod configuration

Add the group key to `.env.local`:

```env
LLMOD_API_KEY=your_group_key
LLMOD_BASE_URL=https://api.llmod.ai/v1
LLMOD_MODEL=MB5R2CF-azure/gpt-5.4-mini
```

If the course dashboard provides a complete chat-completions URL, configure `LLMOD_CHAT_COMPLETIONS_URL` instead. Never commit `.env.local`.

Before submission, also replace the team placeholders:

```env
GROUP_BATCH_ORDER_NUMBER=batch_order
BATEL_EMAIL=...
ITAY_EMAIL=...
BOAZ_EMAIL=...
```

## Vercel deployment

1. Push the repository to GitHub.
2. Import it into Vercel as a Next.js project.
3. Add the variables from `.env.example` in Vercel Project Settings.
4. Set `NEXT_PUBLIC_SITE_URL` to the final Vercel URL.
5. Deploy and verify all four endpoints in production.

The execute route declares a 300-second maximum duration, matching the project requirement. In practice, each turn normally uses two model calls: one supervisor decision and one selected tool.

## Important serverless note

Temporary state is intentionally held in process memory and expires after one hour. This matches the current product decision, but serverless instances may be recycled. If reliable cross-instance sessions are required later, replace `lib/agent/session-store.ts` with an external ephemeral store without changing the agent contract.
