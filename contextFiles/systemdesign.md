SYSTEM DESIGN:
Project: AI SWE Mock Interviewer

Document Purpose
- Capture the current system design context and architecture decisions for V1.
- Act as the baseline design document that future detailed design can build on.
- Stay aligned with:
  - `abstractrequirements.md`
  - `engine-spec.md`
  - `prompt-spec.md`
  - `ui-flow.md`

V1 System Design Philosophy
- Keep V1 realistic, buildable, and free to use.
- Prioritize a strong architectural story without adding unnecessary distributed complexity.
- Use deterministic application logic for interview control flow.
- Use local/free speech and LLM components wherever possible.
- Accept a few V1 simplifications intentionally:
  - one active live interview session per user
  - audio transferred inline over WebSocket for now
  - limited scalability optimization in V1

Primary Product Context
- This is a voice-first AI SWE mock interviewer.
- It is candidate-first in V1.
- The key differentiation is non-linear branching interviews instead of linear chatbot-style questioning.
- The interviewer should:
  - ask realistic cross-questions
  - branch into follow-up topics
  - probe depth, contradictions, and tradeoffs
  - maintain topic-wise scoring
  - generate structured post-interview feedback

Chosen V1 Tech Stack
- Frontend: `React`
- Backend: `Node.js + Express`
- Database: `MongoDB`
- Hot state / cache: `Redis`
- Realtime transport: `WebSocket`
- Authentication: `JWT + refresh-token-backed auth sessions`
- LLM runtime: `Ollama`
- Local model: `qwen2:0.5b`
- LLM orchestration: `LangChain`
- Runtime validation: `Zod`
- STT: `whisper.cpp`
- TTS: browser-native `speechSynthesis`
- Browser audio capture: `MediaRecorder`

High-Level Architecture
- The system should consist of these major parts:
  - React client
  - Express backend
  - WebSocket live session channel
  - Interview engine
  - LLM service layer
  - Speech processing layer
  - MongoDB persistent store
  - Redis live state store

High-Level Component Responsibilities

1. React Client
- Candidate-facing UI.
- Handles:
  - login/signup UI
  - resume/JD upload
  - extraction review
  - interview configuration
  - live interview screen
  - transcript confirmation
  - final report display
  - session history
- Owns browser-side voice behavior:
  - play interviewer audio
  - auto-open mic after question playback ends
  - capture candidate answer audio
  - optionally generate provisional text

2. Express Backend
- Primary application backend.
- Handles:
  - auth APIs
  - upload APIs
  - session creation APIs
  - report/history APIs
  - WebSocket authentication handshake
  - interview orchestration entrypoints

3. WebSocket Channel
- Used for the live interview loop.
- Carries:
  - interviewer question events
  - interviewer question audio payload
  - candidate answer audio payload
  - candidate answer text payload
  - transcript confirmation events
  - hint/repeat/skip/end controls
  - live session state events
  - error/recovery events

4. Interview Engine
- Core deterministic runtime brain of the application.
- Owns:
  - canonical interview state
  - interview phases
  - branch graph state
  - contradiction registry
  - topic scorecards
  - coverage scheduling
  - question routing decisions
  - verdict guardrails
- The LLM does not own this logic.

5. LLM Service Layer
- Wraps Ollama and LangChain.
- Used for bounded tasks only:
  - extraction support
  - branch suggestions
  - next-question phrasing
  - scoring observations
  - final report synthesis
- Output must be validated with Zod.
- Invalid output must be rejected and retried or degraded via fallback behavior.

6. Speech Processing Layer
- Handles speech input/output logic.
- TTS strategy:
  - generate interviewer question text on server
  - convert question to audio using browser-native `speechSynthesis` on the client side where practical
  - V1 may still transport question audio from server if needed by the chosen implementation path, but the preferred free voice output mechanism is browser TTS
- STT strategy:
  - candidate answer audio is sent to backend
  - backend uses `whisper.cpp` to derive canonical transcript
  - candidate/client may also send provisional transcript text
  - server remains authoritative for accepted transcript

7. MongoDB
- Stores durable long-lived application data.

8. Redis
- Stores hot mutable runtime session state.

Core Design Principles

1. App-owned state, not LLM-owned state
- The backend owns the interview state.
- The LLM receives only structured bounded slices of the state.
- The LLM never decides canonical truth by itself.

2. Deterministic control flow
- Branch scoring
- phase transitions
- early stop rules
- contradiction handling
- verdict caps
should be app-level logic.

3. Voice-first but turn-based
- Although transport is realtime and bidirectional, the interview flow is still turn-based:
  - interviewer asks
  - candidate answers
  - transcript is accepted
  - engine evaluates
  - next question is generated

4. Free-first infra decisions
- No paid STT/TTS/LLM dependency in V1.
- Prefer local/browser-native components.

5. Simplicity over premature scale
- V1 intentionally supports one active live interview session per user.
- Scalability improvements can be layered later.

Auth and Session Management

Auth Model
- Use JWT for authentication.
- Use refresh-token-backed server-side auth sessions for login lifecycle management.

Why JWT Alone Is Not Enough
- JWT alone proves identity but does not manage session lifecycle well.
- The product also needs:
  - logout/invalidation
  - refresh rotation
  - active session control
  - WebSocket authentication continuity

Chosen Auth Strategy
- Access token:
  - short-lived JWT
- Refresh token:
  - longer-lived token
- Auth session record:
  - persistent server-side record stored in MongoDB

Auth Session Responsibilities
- track which login sessions exist
- allow refresh token rotation
- support logout
- support revocation
- support future device/session history

Interview Session vs Auth Session
- These are different concepts:

1. Auth Session
- user login lifecycle

2. Interview Session
- one mock interview execution
- stores branching interview state and results

V1 Active Session Constraint
- A user may have multiple historical interview sessions.
- A user may have only one live `in_progress` interview session at a time.

If a user tries to start a new interview while one is active:
- the system should resume the existing one
- or require the user to explicitly end/abandon it

Speech Processing Design

V1 Speech Flow
1. Server decides next interviewer question text.
2. Question is delivered to client along with audio behavior support.
3. Client auto-plays question audio or uses browser TTS.
4. When question playback ends, client opens mic.
5. Candidate answers by voice.
6. Client sends:
  - answer audio
  - transcript text if available
7. Server runs STT using `whisper.cpp`.
8. Server finalizes accepted transcript.
9. Interview engine processes accepted transcript.
10. Next question is generated.

Chosen Input Model
- Option B for robustness:
  - client sends `audio + text`
- Server derives canonical accepted transcript.
- Engine uses canonical transcript only.

Why Canonical Transcript Must Be Server-Owned
- client provisional transcript may be wrong
- browser capabilities may differ
- transcript must remain trustworthy for scoring and contradiction detection

WebSocket Transport Decision

Why WebSocket
- The interview is voice-first and interactive.
- WebSocket supports bidirectional communication after connection establishment.
- Both client and server can push events independently.

Application-Level Behavior
- Even though WebSocket is full-duplex, the interview logic remains turn-based in V1.

Chosen V1 Transport Simplification
- Audio is sent inline over WebSocket for now.
- This is intentionally a V1 simplification.
- It is not the most scalable design, but acceptable because:
  - only one active session per user
  - early-stage concurrency expectations are low

Future Optimization Path
- Later replace inline audio transport with:
  - audio upload endpoints
  - object storage references
  - lighter WebSocket coordination events

Illustrative WebSocket Event Families

Client -> Server
- `answer:submit`
- `transcript:confirm`
- `transcript:rerecord`
- `control:repeat`
- `control:hint`
- `control:skip`
- `control:end`

Server -> Client
- `question:ask`
- `session:state`
- `transcript:review`
- `hint:response`
- `session:error`
- `report:ready`

LLM Design

Chosen LLM Strategy
- Use local Ollama runtime.
- Use `qwen2:0.5b` as the default local model.
- Keep LLM responsibilities bounded.

Why Small Local Model Is Acceptable
- free to use
- light enough for local execution
- sufficient for constrained prompt tasks

Why Small Local Model Must Be Constrained
- A 0.5B model should not own:
  - state management
  - final score computation
  - contradiction truth
  - phase transitions
  - verdict control

LLM Responsibilities in V1
- branch suggestions
- question phrasing
- answer scoring observations
- feedback/report drafting

LLM Non-Responsibilities in V1
- authoritative state mutation
- direct control-flow ownership
- final truth source for contradictions

LangChain and Zod Usage

LangChain Role
- simplify local LLM orchestration
- support structured-output oriented flows
- separate prompt responsibilities

Zod Role
- validate runtime output shape
- reject malformed LLM responses
- validate:
  - LLM outputs
  - API payloads
  - WebSocket event payloads

Important Principle
- LangChain helps with output structure generation.
- Zod enforces whether the structure is actually valid.

MongoDB vs Redis Design

Why Both Are Used
- MongoDB and Redis solve different classes of problems.

MongoDB Role
- durable product data
- long-term history
- persistent user and interview artifacts

Redis Role
- live mutable runtime state
- hot state lookups
- low-latency active session management

MongoDB Should Store
- `User`
- `AuthSession`
- `InterviewSession`
- `InterviewTurn`
- `InterviewReport`
- resume/JD metadata
- durable checkpoints

Redis Should Store
- live interview state snapshot
- active branch/phase/runtime state
- active socket/session mapping
- short-lived live session markers
- hot session lookup keys

How LLM Context Is Built
- The LLM does not read Redis directly.
- Backend flow:
  1. load live interview state from Redis
  2. merge latest turn updates
  3. build bounded structured prompt context
  4. call LLM
  5. validate output
  6. write updated state back to Redis
  7. checkpoint durable state to MongoDB

Why Not Redis-Only
- Redis is good for ephemeral and hot state.
- MongoDB is still required because the product needs:
  - history
  - reports
  - user records
  - durable artifacts
  - persistent auth sessions

High-Level Persistent Data Model

1. User
- identity data
- profile basics
- auth linkage

2. AuthSession
- login session lifecycle
- refresh token hash
- revocation state
- expiry info

3. InterviewSession
- one interview run
- config
- phase/status
- summary state
- final score/verdict

4. InterviewTurn
- accepted question/answer transcript pairs
- turn-level metadata

5. InterviewReport
- final structured evaluation

High-Level Live Runtime State
- active branch id
- pending branches
- contradictions
- scorecards
- current phase
- remaining time
- accepted transcript context
- current objective
- wrap-up/fallback flags

Live Interview Sequence

Pre-Interview
1. User authenticates.
2. User uploads resume and JD.
3. Backend extracts candidate/JD summaries.
4. User confirms extracted context.
5. User configures interview.
6. Backend creates interview session record.
7. Backend initializes live state in Redis.

During Interview
1. WebSocket session is established and authenticated.
2. Backend loads active live interview state.
3. Backend sends first question.
4. Client plays question audio and shows text.
5. Candidate answers.
6. Client sends audio + text.
7. Backend transcribes and finalizes transcript.
8. Interview engine updates claims, contradictions, branches, scorecards.
9. Backend invokes LLM for bounded generation/scoring tasks.
10. Backend validates LLM output with Zod.
11. Backend updates Redis live state.
12. Backend checkpoints durable artifacts to MongoDB.
13. Backend sends next question.

Post-Interview
1. Wrap-up completes.
2. Final scoring and verdict computed deterministically.
3. Final report is synthesized.
4. Report stored in MongoDB.
5. Client receives report-ready event.
6. User sees report and may retry or view history.

Failure and Recovery Principles

Speech Failures
- If STT fails once:
  - retry path
- repeated failures:
  - recommend end/restart

LLM Failures
- malformed output:
  - retry
- repeated malformed output:
  - simplified fallback prompt path

Session Recovery
- important state should be updated in Redis live
- important checkpoints should be persisted to MongoDB
- interrupted sessions should be resumable when possible

Scalability Position
- V1 does not optimize aggressively for scale.
- V1 supports one active interview session per user.
- Architecture should still be extensible later for:
  - external media storage
  - worker queues
  - more scalable speech processing
  - stronger local or hosted models

Intentional V1 Simplifications
- inline audio transfer over WebSocket
- one active live interview session per user
- local small LLM
- browser/native free speech choices
- simple candidate-only UX

Future Design Growth Areas
- external object storage for audio
- dedicated background workers
- Redis queues/event-driven processing
- stronger local or hybrid model strategy
- multi-session/device coordination
- recruiter-side workflows

Current V1 System Design Summary
- Use MERN as the core stack:
  - React
  - Express
  - MongoDB
  - Node.js
- Add Redis for hot runtime state.
- Use WebSockets for the live interview loop.
- Use JWT + refresh-token-backed auth sessions.
- Use `whisper.cpp` for free local STT.
- Use browser-native TTS for free speech output.
- Use Ollama + `qwen2:0.5b` for free local LLM inference.
- Use LangChain for structured orchestration.
- Use Zod for runtime output validation.
- Keep the application in full control of interview state and scoring.

Design Boundary
- This document captures the current design context and architecture decisions.
- Detailed endpoint contracts, database schemas, and infrastructure deployment refinements can be layered on top of this document later.
