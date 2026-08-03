# Adaptive AI Teacher

Adaptive AI Teacher is a conversational ReAct agent that turns plain-text learning material into an interactive, personalized lesson. A central `LearningSupervisor` evaluates the current conversation state and dynamically selects the most useful teaching tool. The system does not follow a predefined lesson pipeline.

Repository: [ItayShorian07/agent_teacher](https://github.com/ItayShorian07/agent_teacher)

## Current project status

| Component | Status | Notes |
|---|---|---|
| Responsive web interface | Complete | Continuous chat, call counter, reset action, and expandable execution traces |
| Required API endpoints | Complete | All four course endpoints are implemented |
| LLMod text model | Connected and verified | `MB5R2CF-azure/gpt-5.4-mini` |
| LLMod embedding model | Connected and verified | `MB5R2CF-azure/text-embedding-3-small`, 1,536 dimensions |
| Temporary conversation memory | Complete | In-memory session state with a one-hour expiry |
| Supabase | Pending | Database schema and connection are not implemented yet |
| Pinecone RAG | Pending | Indexing, retrieval, and session namespace cleanup are not implemented yet |
| Vercel production deployment | Pending | The repository is ready to import after the remaining integrations are complete |

## Product behavior

- Accepts plain-text learning material only.
- Maintains a continuous conversation for the current session.
- Learns student interests at the beginning or gradually during the conversation.
- Chooses tools dynamically rather than following a fixed workflow.
- Uses the supplied material as the authoritative source. General model knowledge may add examples or context, but the supplied material wins if the two conflict.
- Lets the LLM determine whether the student has mastered the material.
- Enforces a hard limit of 16 total LLM calls per session, including supervisor and tool calls.
- Returns a complete trace of every LLM call, including module name, system prompt, user prompt, and structured response.

## Agent architecture

The `LearningSupervisor` receives the current student message and a compact representation of the temporary learning state. It chooses exactly one action per turn:

- `AskInterests` — discovers or refines the student's interests.
- `AnalyzeMaterial` — identifies and organizes the supplied learning material.
- `ExplainMaterial` — creates a direct explanation at the student's apparent level.
- `StoryTool` — teaches through a story connected to student interests.
- `QuestionTool` — generates questions about all topics or weak topics.
- `AnswerEvaluator` — evaluates an answer and updates mastery, strengths, and weaknesses.
- `RespondDirectly` — replies without invoking another teaching tool.
- `Stop` — ends the learning session when appropriate or when the call limit is reached.

The tool names are identical in the runtime trace, prompt definitions, API documentation, and architecture image returned by `/api/model_architecture`.

## Source-of-truth policy

The student's learning material has priority over the model's general knowledge. The model may use external knowledge to clarify an idea or create a relatable example, but it must distinguish that information from the supplied material. When a conflict exists, the supplied material is treated as correct for the learning session.

## LLM call budget

Every model request counts toward the 16-call session limit:

- A `LearningSupervisor` decision counts as one call.
- A selected LLM-backed tool counts as one additional call.
- Local state updates and deterministic application logic do not count as LLM calls.

When no calls remain, the API returns a deterministic stop message without contacting LLMod. Usage is exposed through these response headers:

- `X-LLM-Calls-Used`
- `X-LLM-Calls-Remaining`
- `X-Agent-Session-Id`

## Required API endpoints

### `GET /api/team_info`

Returns the group identifier, team name, and student names and email addresses.

### `GET /api/agent_info`

Returns the agent description, purpose, recommended prompt template, example interaction, and complete example trace.

### `GET /api/model_architecture`

Returns the architecture diagram with `Content-Type: image/png`.

### `POST /api/execute`

Request:

```json
{
  "prompt": "Student request or learning material"
}
```

Successful response:

```json
{
  "status": "ok",
  "error": null,
  "response": "Agent response",
  "steps": []
}
```

Error response:

```json
{
  "status": "error",
  "error": "Human-readable error description",
  "response": null,
  "steps": []
}
```

The execute response deliberately contains exactly the four required top-level fields. Session and call-budget metadata are returned as HTTP headers.

## LLMod integration

The project uses the course LLMod gateway:

- Base URL: `https://api.llmod.ai`
- Chat endpoint: `/v1/chat/completions`
- Embeddings endpoint: `/v1/embeddings`
- Text model: `MB5R2CF-azure/gpt-5.4-mini`
- Embedding model: `MB5R2CF-azure/text-embedding-3-small`
- Verified embedding size: 1,536 dimensions

The API key is read only on the server. It is never sent to the browser and must never be committed to Git.

## Environment files

The two environment files serve different purposes:

- `.env.local` contains the real local values and secrets. Git ignores this file.
- `.env.example` contains only variable names and safe example values. The application does not load it at runtime; it documents the required configuration for teammates, new machines, and Vercel.

The existing local environment is already configured. Do not copy `.env.example` over `.env.local` again.

Required variables:

```env
LLMOD_API_KEY=
LLMOD_BASE_URL=https://api.llmod.ai
LLMOD_MODEL=MB5R2CF-azure/gpt-5.4-mini
LLMOD_EMBEDDING_MODEL=MB5R2CF-azure/text-embedding-3-small
GROUP_BATCH_ORDER_NUMBER=
TEAM_NAME=Adaptive AI Teacher
BATEL_EMAIL=
ITAY_EMAIL=
BOAZ_EMAIL=
```

Supabase and Pinecone variables will be added when those integrations are implemented.

## Local development

Requirements: Node.js 22.13 or later.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

For a new clone only:

```bash
cp .env.example .env.local
```

Then populate the private values in `.env.local`. If `LLMOD_API_KEY` is absent, the application uses a deterministic demo implementation so the user interface and API contract can still be tested without spending the course budget.

## Validation

Run the complete local validation suite:

```bash
npm test
```

This performs a production build, TypeScript validation, and ESLint checks. The LLMod connectivity tests are intentionally not part of the automated suite because real calls consume the assignment budget.

## Project structure

```text
app/
  api/                    Required HTTP endpoints and session reset endpoint
  page.tsx                Interactive learning interface
  globals.css             Responsive visual design
lib/agent/
  agent.ts                Supervisor execution and state updates
  llm.ts                  LLMod chat and embedding clients
  prompts.ts              Supervisor and tool prompt contracts
  session-store.ts        Temporary in-memory session storage
  types.ts                Shared agent types and call limit
public/
  model-architecture.png  Architecture endpoint asset
scripts/
  generate-architecture.mjs
```

## Security and privacy

- Secrets are stored in `.env.local` locally and in Vercel Environment Variables in production.
- `.env.local` is excluded by `.gitignore`.
- The LLMod key is used only by server-side code.
- The web interface has no login or authentication guard, as required by the assignment.
- Temporary learning state expires after one hour and is reset when the user starts a new session.
- Prompts and model responses are exposed in the execution trace because this is an explicit assignment requirement.

## Known limitations

- In-memory state is best effort in a serverless environment and may be lost when a Vercel function instance is recycled.
- The current `AnalyzeMaterial` tool does not yet retrieve chunks from Pinecone.
- Supabase does not yet store document metadata or session records.
- The embedding client is implemented and verified, but it is not yet connected to a vector index.
- Team email values must be completed before final submission.

## Remaining implementation work

1. Create the Supabase schema and connect the primary database.
2. Create a Pinecone index with 1,536 dimensions and cosine similarity.
3. Split supplied text into chunks, create embeddings, and upsert them under a session namespace.
4. Retrieve relevant chunks in `AnalyzeMaterial` and provide them to the selected teaching tool.
5. Delete temporary Pinecone data when a session is reset or expires.
6. Add the final environment variables to Vercel.
7. Deploy to Vercel and verify the GUI and all four required endpoints in production.

## Deployment target

The final deployment target is Vercel. The execute route declares a maximum duration of 300 seconds to match the assignment constraint. After Supabase and Pinecone are connected, import the GitHub repository into Vercel, add the private environment variables, deploy, and run production endpoint checks.
