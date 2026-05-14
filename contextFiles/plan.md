Project: Enterview — AI SWE Mock Interviewer
Document Purpose: Granular V1 implementation plan. Every step has a clear, testable outcome.

---

## Phase 0: Project Foundation

**0.1** Create repo structure
```
enterview/
  client/
  server/
  docker/
  docker-compose.yml
  .env.example
```

**0.2** Write `docker-compose.yml` with all 4 services — frontend, backend, mongodb, ollama

**0.3** Write `Dockerfile` for backend

**0.4** Write `Dockerfile` for frontend

**0.5** Write `.env.example` with all required variables — `MONGODB_URI`, `OLLAMA_URL`, `OLLAMA_MODEL`, `PORT`

**0.6** Validate — `docker-compose up` starts all 4 containers without errors

---

## Phase 1: Backend Foundation

**1.1** Initialize Express server with JSON middleware and basic error handler

**1.2** Connect to MongoDB — fail clearly with readable error if not reachable

**1.3** Connect to Ollama — ping `ollama/api/tags` on startup, fail clearly if not reachable

**1.4** Write `/health` REST endpoint — returns status of MongoDB + Ollama

**1.5** Add request logger middleware

**1.6** Validate — health endpoint returns live status of all dependencies

---

## Phase 2: LLM Adapter

**2.1** Create `server/src/llm/index.js` — exports one function `chat(prompt)`, nothing else in the app touches Ollama directly

**2.2** Implement raw Ollama API call inside the adapter using `fetch` — no LangChain

**2.3** Add streaming support — yield tokens as Ollama streams them

**2.4** Create `server/src/llm/validate.js` — Zod utility that parses and validates LLM JSON output against a given schema

**2.5** Add retry logic — on invalid JSON or failed Zod parse, retry once with a stricter format instruction appended to the prompt

**2.6** Add fallback behavior — if retry also fails, return a safe hardcoded fallback object so the session never breaks

**2.7** Validate — send a test prompt, get structured JSON back, break the JSON intentionally and confirm retry + fallback fires correctly

---

## Phase 3: Interview Tree Engine

**3.1** Define node schemas using Zod
```
InterviewerQuestion — id, type, status, question, topic, depth, parent_id, children, summary
IntervieweeResponse — id, type, status, answer, parent_id, children
```

**3.2** Define context object schema using Zod
```
current_focus, active_node_id, observations, covered_topics,
pending_topics, contradictions, candidate_summary, timer
```

**3.3** Implement `createTree(subject)` — returns a fresh tree with empty root

**3.4** Implement `addNode(tree, parentId, node)` — appends a new node to correct parent

**3.5** Implement `updateNodeStatus(tree, nodeId, status)` — marks a node active / explored / skipped

**3.6** Implement `canCollapse(node)` — returns true only if node and all descendants are explored to leaf

**3.7** Implement `prepareTreeForLLM(tree)` — recursively compresses fully explored subtrees to summary, sends pending/active nodes in full

**3.8** Implement `getPendingNodes(tree)` — returns flat list of all pending nodes across the tree

**3.9** Validate — write unit tests for each operation, test compression on a sample tree with mixed explored/pending nodes

---

## Phase 4: Frontend Foundation

**4.1** Initialize React + Vite inside `client/`

**4.2** Create two-panel layout — chat panel left, IDE panel right, responsive split

**4.3** Integrate Monaco Editor in IDE panel — set language to C++

**4.4** Add Run button below Monaco — output display area below Run button

**4.5** Add basic client-side routing — Home, Interview, History screens as separate views

**4.6** Add browser `speechSynthesis` utility — `speak(text)` function, graceful fallback if browser does not support it

**4.7** Validate — layout renders correctly, Monaco editor loads, typing code works, speak() works in browser

---

## Phase 5: WebSocket Layer

**5.1** Add WebSocket server to backend using `ws` library — attach to existing Express HTTP server

**5.2** Define all event type constants in a shared file both client and server import
```
CLIENT → SERVER:  session:start, answer:submit, session:end
SERVER → CLIENT:  question:token, question:complete, tree:update, session:error, report:ready
```

**5.3** Add WebSocket client to frontend — connect on interview screen mount

**5.4** Implement reconnection logic on client — exponential backoff, max 3 retries

**5.5** Add ping/pong heartbeat — server pings every 30s, client responds, server closes stale connections

**5.6** Add session ID to every WebSocket message — server uses it to route to correct session state

**5.7** Validate — client connects, send a test event from client, receive a test event from server, disconnect and confirm reconnection fires

---

## Phase 6: Resume Upload + Parsing

**6.1** Create REST `POST /upload/resume` endpoint — accepts `multipart/form-data`, supports PDF and plain text

**6.2** Add `pdf-parse` library — extract plain text from uploaded PDF

**6.3** Add input length limit — truncate resume text beyond 5000 characters before it touches anything else

**6.4** Write resume extraction prompt — XML-delimited, instructs LLM to extract structured candidate profile
```
name, experience_level, skills, projects, roles
```

**6.5** Define candidate profile Zod schema — validate LLM extraction output

**6.6** Store extracted profile in session memory (in-memory map keyed by session ID for now)

**6.7** Return extracted profile to client — client shows a brief confirmation screen before continuing

**6.8** Validate — upload a real resume PDF, confirm structured profile comes back correctly

---

## Phase 7: Subject Selection + Session Creation

**7.1** Build subject selection UI — grid of subject cards, one selectable at a time
```
DSA | OS | DBMS | CN | OOPs | OOD | System Design | Tech Stack | Resume Cross Questions | Resume Roasting
```

**7.2** Create REST `POST /session/create` endpoint — takes subject + candidate profile, returns session ID

**7.3** Create in-memory session store on backend — keyed by session ID, holds tree + context object + candidate profile

**7.4** For Resume Roasting — add JD upload field on subject selection screen, `POST /upload/jd` endpoint mirrors resume upload flow

**7.5** Validate — create a session for two different subjects, confirm separate session states exist

---

## Phase 8: Interview Orchestration Engine

**8.1** Write system prompt template — who the LLM is, behavioral rules, XML delimiter instructions, output format contract

**8.2** Write turn prompt template — injects compressed tree, context object, candidate profile, last answer, current objective. All user content wrapped in XML tags

**8.3** Implement input sanitizer — strips prompt-injection patterns from resume text, answers, code before inserting into any prompt. Enforces length limits per input type

**8.4** Define LLM turn output Zod schema
```
new_question_nodes[], activate_node_id, context_update, session_complete
```

**8.5** Implement `buildPrompt(session)` — assembles full prompt from session state using templates

**8.6** Implement `processTurn(session, answer)` — calls LLM, validates output, applies tree mutations, updates context object

**8.7** Implement `generateFirstQuestion(session)` — called once when interview starts, seeds the first InterviewerQuestion node

**8.8** Validate — run a simulated 3-turn interview through the orchestration engine without WebSocket, confirm tree grows correctly each turn

---

## Phase 9: Live Interview Loop

**9.1** On `session:start` WebSocket event — load session from memory, call `generateFirstQuestion`, stream tokens back via `question:token` events

**9.2** On `question:complete` event on client — trigger `speak(question)` using browser TTS

**9.3** Build chat message UI — interviewer messages appear on left, user input box at bottom with "Include code" checkbox

**9.4** On answer submit — validate answer length, send `answer:submit` event with `{ answer, includeCode, code }`

**9.5** On `answer:submit` on server — call `processTurn`, stream next question tokens, send `tree:update` after turn completes

**9.6** Show typing indicator on client while `question:token` events are arriving

**9.7** On `session:end` event — mark session complete, trigger report generation, save to MongoDB

**9.8** Validate — complete a 5-turn interview end to end over WebSocket, confirm tree state is correct after each turn, TTS fires

---

## Phase 10: IDE + C++ Execution

**10.1** Create REST `POST /code/run` endpoint — accepts `{ code, stdin }`

**10.2** Write temp `.cpp` file to `/tmp` with a unique filename

**10.3** Compile with `g++` via `child_process.exec` — capture compilation errors separately from runtime errors

**10.4** Run compiled binary with 5 second timeout — capture stdout and stderr

**10.5** Clean up temp files (source + binary) after execution regardless of success or failure

**10.6** Return `{ stdout, stderr, compilationError, timedOut }` to client

**10.7** Display output below Run button in IDE panel

**10.8** When `includeCode` is true in `answer:submit` — append code content + last run output to the turn prompt inside `<ide_code>` and `<ide_output>` XML tags

**10.9** Validate — write a simple C++ program with stdin, run it, confirm output appears. Write a program with a bug, confirm compilation error appears. Write an infinite loop, confirm timeout fires

---

## Phase 11: Resume Roasting

**11.1** Write roasting system prompt — instructs LLM to act as a brutally honest technical recruiter

**11.2** Write roasting turn prompt — injects resume + JD inside XML tags, asks for structured roast

**11.3** Define roast report Zod schema
```
overall_impression, strengths[], weak_areas[],
project_feedback[], skills_gap[], improvement_suggestions[], verdict
```

**11.4** Create `POST /roast` REST endpoint — takes session ID, calls LLM with roast prompts, validates output

**11.5** Build roast report UI — displays each section clearly, scannable layout

**11.6** Save roast report to MongoDB session record

**11.7** Validate — upload a real resume + a sample JD, confirm roast report returns with all sections populated

---

## Phase 12: Session Persistence + History

**12.1** Define MongoDB session schema — `sessionId, subject, candidateProfile, status, createdAt, completedAt, report`

**12.2** Define MongoDB turn schema — `sessionId, turnNumber, question, answer, topic, code, codeOutput, timestamp`

**12.3** On session create — write initial session document to MongoDB

**12.4** After each accepted turn — write turn document to MongoDB

**12.5** On session complete — update session document with final report and `completedAt`

**12.6** Create REST `GET /sessions` endpoint — returns list of all sessions with basic metadata

**12.7** Create REST `GET /sessions/:id` endpoint — returns full session with report

**12.8** Build history screen UI — list of past sessions showing date, subject, verdict

**12.9** Build report view — opens a past session's report in readable layout

**12.10** Validate — complete an interview, check it appears in history, open the report from history

---

## Phase 13: Docker Finalization

**13.1** Finalize backend Dockerfile — multi-stage, production ready, `node:20-alpine`

**13.2** Finalize frontend Dockerfile — build stage with Vite, serve stage with nginx

**13.3** Write Ollama model pull entrypoint script — `ollama serve & sleep 5 && ollama pull qwen2.5:0.5b`

**13.4** Configure Docker internal networking — backend reaches MongoDB as `mongodb:27017`, Ollama as `ollama:11434`

**13.5** Add named volumes for MongoDB data and Ollama models — data persists across container restarts

**13.6** Add environment variable passthrough in docker-compose for all required vars

**13.7** Test cold start — delete all volumes, run `docker-compose up`, confirm model pulls, interview works end to end

---

## Phase 14: Hardening + Edge Cases

**14.1** Handle Ollama not ready on backend startup — retry connection with backoff before accepting requests

**14.2** Handle MongoDB write failure during turn — log error, session continues, retry on next turn

**14.3** Handle WebSocket drop mid-interview — save tree + context to MongoDB on every turn so session can be resumed

**14.4** Handle `g++` not installed — return clear error message from `/code/run`, display it in IDE panel

**14.5** Handle empty or whitespace-only answer submission — reject on client before sending

**14.6** Handle LLM response exceeding reasonable token length — truncate before parsing

**14.7** Add rate limiting on code execution endpoint — max 10 runs per session to prevent abuse

**14.8** Add global Express error handler — catches unhandled errors, returns clean JSON, never leaks stack traces

**14.9** Validate all edge cases — drop WebSocket mid-interview, submit empty answer, run malformed C++, simulate Ollama timeout

---

## Build Order Summary

```
0  Project foundation + Docker skeleton
1  Backend foundation (Express, MongoDB, Ollama connectivity)
2  LLM adapter (plug-and-play, retry, fallback)
3  Tree engine (core data structure)
4  Frontend foundation (layout, Monaco, routing)
5  WebSocket layer (events, reconnection)
6  Resume upload + parsing
7  Subject selection + session creation
8  Orchestration engine (prompts, sanitization, turn processing)
9  Live interview loop (end to end)
10 IDE + C++ execution
11 Resume roasting
12 Session persistence + history
13 Docker finalization
14 Hardening
```

Total: 14 phases, 80+ steps. Each step produces a visible or testable outcome.
