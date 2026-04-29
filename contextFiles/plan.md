Project: AI SWE Mock Interviewer

Document Purpose
- Provide a very granular, end-to-end implementation plan for V1.
- Keep each step small enough that it can be built and validated independently.
- Preserve an iterative development path where the project remains understandable and testable at every stage.

Plan Principles
- Build the smallest working slice first.
- Validate each layer before stacking the next one on top.
- Prefer end-to-end thin slices over large isolated subsystems.
- Keep fallback-friendly architecture from the beginning.
- Do not optimize for scale before correctness.

Execution Style
- Each step should produce a visible or testable outcome.
- Each step should have a narrow change surface.
- If a step introduces a new subsystem, validate it immediately before proceeding.
- After each step, run the listed test cases before moving ahead.

Phase 0: Workspace Foundation

Step 0.1
- Create the repo/folder structure for:
  - `client/`
  - `server/`
  - `docs/` if needed
  - shared config files
Validation
- project directories exist and are cleanly separated
Test Cases
- expected folders are present
- no unintended nested app structure is created
- path naming is consistent and unambiguous

Step 0.2
- Initialize React client app
- Initialize Express server app
Validation
- client starts locally
- server starts locally
Test Cases
- client dev server boots without crash
- server process boots without crash
- both apps can run independently
- root docs/design files remain untouched

Step 0.3
- Add root-level scripts for starting client and server
Validation
- both services can be started from a documented command flow
Test Cases
- root script starts client successfully
- root script starts server successfully
- failure output is readable when one service is unavailable

Step 0.4
- Add environment variable scaffolding for:
  - Mongo connection
  - Redis connection
  - JWT secrets
  - Ollama base URL
Validation
- app boots with env placeholders and fails clearly when required vars are missing
Test Cases
- server fails with clear error when Mongo URL is missing
- server fails with clear error when Redis URL is missing
- server fails with clear error when JWT secret is missing
- env example file documents all required vars

Step 0.5
- Add linting/formatting/basic TypeScript setup where applicable
Validation
- lint command runs
- typecheck command runs
Test Cases
- lint passes on clean scaffold
- typecheck passes on clean scaffold
- intentionally broken type causes typecheck failure

Phase 1: Basic Persistent Backend Setup

Step 1.1
- Connect Express server to MongoDB
Validation
- health endpoint confirms Mongo connection
Test Cases
- valid Mongo connection succeeds
- invalid Mongo URL fails cleanly
- server restart reconnects correctly

Step 1.2
- Connect Express server to Redis
Validation
- health endpoint confirms Redis connection
Test Cases
- valid Redis connection succeeds
- invalid Redis URL fails cleanly
- Redis disconnect is reflected by health logic

Step 1.3
- Create a basic server health route that checks:
  - server alive
  - Mongo reachable
  - Redis reachable
Validation
- health response returns all subsystem statuses
Test Cases
- health route returns healthy status when all dependencies are up
- health route returns degraded status when Mongo is down
- health route returns degraded status when Redis is down

Step 1.4
- Create basic shared backend logging utilities
Validation
- requests log cleanly in development
Test Cases
- normal request logs once
- failed request logs useful error context
- log output stays readable in local development

Phase 2: Auth Foundation

Step 2.1
- Create `User` model
Validation
- user document can be inserted and read from Mongo
Test Cases
- valid user insert succeeds
- missing required fields fail
- duplicate identity constraint behaves correctly if implemented

Step 2.2
- Create `AuthSession` model
Validation
- auth session document can be inserted and read from Mongo
Test Cases
- valid auth session insert succeeds
- missing required session fields fail
- revoked/expired state can be stored and queried

Step 2.3
- Implement signup API
Validation
- user can sign up and record appears in Mongo
Test Cases
- valid signup succeeds
- duplicate signup fails gracefully
- malformed signup body fails validation
- password is not stored in plain text

Step 2.4
- Implement login API with password verification
Validation
- valid login succeeds
- invalid login fails correctly
Test Cases
- valid credentials return success
- wrong password fails
- unknown user fails
- malformed login body fails validation

Step 2.5
- Implement JWT access token generation
Validation
- access token is returned and can be decoded/verified
Test Cases
- valid login returns JWT
- JWT verifies with configured secret
- invalid/expired token fails verification

Step 2.6
- Implement refresh token issuance and persistent session creation
Validation
- login creates `AuthSession`
- refresh token is stored hashed
Test Cases
- auth session record is created on login
- refresh token hash is stored, not raw token
- second login creates predictable additional auth session behavior

Step 2.7
- Implement refresh endpoint
Validation
- expired/near-expired access token can be renewed using refresh token
Test Cases
- valid refresh token issues new access token
- revoked refresh token fails
- missing refresh token fails
- rotated refresh flow updates stored session correctly if rotation is enabled

Step 2.8
- Implement logout endpoint
Validation
- auth session is revoked/deleted
- refresh token can no longer be used
Test Cases
- logout succeeds for authenticated user
- logged-out refresh token cannot mint new access token
- repeated logout does not corrupt session state

Step 2.9
- Add auth middleware for protected routes
Validation
- protected route rejects unauthenticated request
- protected route accepts valid JWT
Test Cases
- no token returns unauthorized
- invalid token returns unauthorized
- valid token allows access
- expired token returns unauthorized

Phase 3: Basic Client Auth Flow

Step 3.1
- Create signup page/form
Validation
- user can submit signup from UI
Test Cases
- valid signup form submits successfully
- invalid inputs show field-level errors
- backend error shows understandable message

Step 3.2
- Create login page/form
Validation
- user can log in from UI
Test Cases
- valid login redirects into app
- wrong credentials show error
- missing fields are blocked by client validation if present

Step 3.3
- Add authenticated route guard on client
Validation
- unauthenticated user is redirected away from protected pages
Test Cases
- unauthenticated navigation redirects to login
- authenticated user can access protected route
- expired auth eventually forces re-auth

Step 3.4
- Add basic authenticated app shell placeholder
Validation
- logged-in user sees private app shell
Test Cases
- authenticated user sees shell
- unauthenticated user does not
- shell survives refresh while auth remains valid

Phase 4: Interview Session Skeleton

Step 4.1
- Create `InterviewSession` model
Validation
- empty interview session document can be created
Test Cases
- valid interview session insert succeeds
- invalid status enum fails
- missing required fields fail

Step 4.2
- Create minimal API to create a new interview session
Validation
- authenticated user can create a session
Test Cases
- authenticated request creates session
- unauthenticated request fails
- malformed payload fails validation

Step 4.3
- Enforce “one active session per user” rule at API layer
Validation
- second active session creation is blocked or resumes existing one
Test Cases
- user with no active session can create one
- user with active session cannot create duplicate active session
- completed session does not block a new one

Step 4.4
- Add session listing API
Validation
- user can fetch all their interview sessions
Test Cases
- list returns only current user sessions
- empty history returns empty list
- unauthorized access fails

Step 4.5
- Add session detail API
Validation
- user can fetch one session by id
Test Cases
- user can fetch own session
- user cannot fetch another user’s session
- nonexistent session returns not found

Phase 5: Upload and Extraction Skeleton

Step 5.1
- Create UI for uploading resume and JD
Validation
- files/text can be submitted from client
Test Cases
- resume upload control accepts supported input
- JD upload or pasted text input works
- missing required inputs block submission

Step 5.2
- Create backend upload endpoint for resume/JD intake
Validation
- server receives upload and acknowledges it
Test Cases
- valid upload succeeds
- unsupported file type fails
- oversized upload fails clearly

Step 5.3
- Store raw upload metadata in Mongo
Validation
- uploaded file metadata appears in DB
Test Cases
- resume metadata is saved
- JD metadata is saved
- metadata links to correct user/session

Step 5.4
- Implement simple text extraction placeholder path
Validation
- backend can return extracted plain text from sample/test input
Test Cases
- sample resume text extracts successfully
- sample JD text extracts successfully
- empty/invalid input produces clear failure

Step 5.5
- Create extracted summary response structure without LLM yet
Validation
- client receives candidate/JD summary placeholders
Test Cases
- summary response matches expected shape
- missing sections still produce valid response shell

Step 5.6
- Build extraction review UI
Validation
- user can see extracted summary before continuing
Test Cases
- extracted candidate summary renders
- extracted JD summary renders
- user cannot continue if required review data is missing

Phase 6: LLM Connectivity Skeleton

Step 6.1
- Connect backend to Ollama
Validation
- test route can send a prompt and receive a response from local model
Test Cases
- Ollama reachable path succeeds
- unavailable model path fails clearly
- timeout is handled gracefully

Step 6.2
- Add LangChain wrapper around Ollama
Validation
- simple LangChain call succeeds against local model
Test Cases
- wrapper returns model response
- provider abstraction hides raw implementation details
- failure path is surfaced cleanly

Step 6.3
- Add Zod-based structured output validation for one tiny test prompt
Validation
- valid response passes
- malformed response fails validation
Test Cases
- schema-valid JSON passes
- missing required field fails
- wrong enum value fails
- malformed JSON fails

Step 6.4
- Implement retry-on-invalid-output utility
Validation
- malformed output triggers retry path
Test Cases
- first invalid output triggers retry
- repeated invalid output produces controlled failure
- valid first output does not retry

Phase 7: Resume/JD Structured Extraction

Step 7.1
- Implement extraction prompt using LangChain
Validation
- raw resume/JD text returns structured JSON
Test Cases
- realistic resume extracts required candidate fields
- realistic JD extracts required role fields
- sparse input still returns structured output plus warnings

Step 7.2
- Validate extracted JSON with Zod
Validation
- extraction output is accepted only if schema-valid
Test Cases
- valid extraction passes
- missing required extracted field fails
- wrong extracted field type fails

Step 7.3
- Persist extracted candidate profile summary
Validation
- extracted candidate fields are stored in Mongo
Test Cases
- candidate summary persists correctly
- repeated extraction updates or versions cleanly based on chosen approach

Step 7.4
- Persist extracted JD profile summary
Validation
- extracted JD fields are stored in Mongo
Test Cases
- JD summary persists correctly
- JD summary links to correct interview session

Step 7.5
- Add low-confidence extraction warnings
Validation
- client can see warnings when extraction quality is low
Test Cases
- low-confidence field produces warning
- high-confidence extraction does not show false warnings

Step 7.6
- Add extraction review confirmation API
Validation
- user can confirm extracted context and move session forward
Test Cases
- valid confirmation succeeds
- confirmation fails if required extraction pieces are missing
- unauthorized confirmation fails

Phase 8: Interview Configuration Flow

Step 8.1
- Build UI for selecting:
  - track
  - difficulty
  - interviewer mode
  - hint mode
  - company type
  - duration
Validation
- config can be filled from client
Test Cases
- all config fields render
- sensible defaults are pre-selected
- invalid combinations are blocked if constraints exist

Step 8.2
- Persist session config in Mongo
Validation
- session config is stored and retrievable
Test Cases
- config save succeeds
- saved config reloads correctly
- invalid config payload fails validation

Step 8.3
- Initialize corresponding live runtime state in Redis
Validation
- Redis contains initial live state snapshot for the session
Test Cases
- live state is created once config is confirmed
- initial state contains expected required keys
- duplicate initialization does not corrupt state

Phase 9: WebSocket Foundation

Step 9.1
- Add WebSocket server to backend
Validation
- client can connect to socket
Test Cases
- socket connects successfully
- duplicate connections do not crash server
- unsupported path/origin handling is safe if configured

Step 9.2
- Authenticate WebSocket connection using JWT
Validation
- invalid token rejects socket
- valid token connects
Test Cases
- valid JWT connects
- invalid JWT is rejected
- expired JWT is rejected

Step 9.3
- Map socket connection to user/session in Redis
Validation
- live socket/session mapping is visible in Redis
Test Cases
- mapping is created on connect
- mapping is removed on disconnect
- reconnect updates mapping correctly

Step 9.4
- Add simple ping/pong or session state event
Validation
- client receives live server event over WebSocket
Test Cases
- client receives event payload
- disconnected socket does not receive new event
- unknown inbound event is handled safely

Phase 10: Live Interview Bootstrap

Step 10.1
- Add API or socket event to start live interview
Validation
- session moves from setup state to live-ready state
Test Cases
- valid session starts
- already-started active session does not duplicate start
- invalid session id fails cleanly

Step 10.2
- Seed first interview question with a static placeholder question
Validation
- client receives first question event over WebSocket
Test Cases
- first question is sent once
- question payload links to correct session
- placeholder question text is rendered correctly

Step 10.3
- Show live interview screen with:
  - question text
  - timer placeholder
  - controls row
Validation
- live screen renders correctly after interview starts
Test Cases
- live screen opens after start event
- timer placeholder is visible
- controls row renders with expected buttons

Phase 11: Browser Voice Output/Input Basics

Step 11.1
- Integrate browser `speechSynthesis` for question playback
Validation
- question text is spoken automatically on client
Test Cases
- supported browser plays question audio
- unsupported browser degrades gracefully
- question is not played twice accidentally

Step 11.2
- Integrate `MediaRecorder` for answer recording
Validation
- client can record answer audio
Test Cases
- mic permission grant works
- denied mic permission shows clear recovery path
- recording produces usable audio blob

Step 11.3
- Auto-open mic after question playback ends
Validation
- user can answer only after question finishes
Test Cases
- recording starts only after playback end
- replaying question does not break recording state logic

Step 11.4
- Add stop-recording and submit behavior
Validation
- recorded audio can be captured and packaged for submission
Test Cases
- stop creates final blob
- submit sends payload
- empty recording is blocked or handled clearly

Phase 12: First End-to-End Voice Turn

Step 12.1
- Send recorded answer audio from client to server over WebSocket
Validation
- backend receives audio payload
Test Cases
- audio payload reaches server
- mime type is carried correctly
- empty or oversized audio is handled safely

Step 12.2
- Send candidate text payload along with audio
Validation
- backend receives both audio and text
Test Cases
- audio plus text submission succeeds
- audio-only path is handled if text is missing
- malformed payload structure fails validation

Step 12.3
- Store raw turn payload temporarily
Validation
- backend can log/store the submitted turn safely
Test Cases
- temporary payload persists through processing window
- temp payload cleanup happens after completion/failure

Step 12.4
- Return a placeholder “answer received” event
Validation
- client sees successful turn submission response
Test Cases
- success acknowledgement reaches client
- rejection path sends error acknowledgement

Phase 13: STT Integration

Step 13.1
- Integrate `whisper.cpp` on the backend
Validation
- backend can transcribe a test audio file locally
Test Cases
- valid sample audio transcribes
- invalid audio fails gracefully
- missing whisper dependency is surfaced clearly

Step 13.2
- Run `whisper.cpp` on submitted answer audio
Validation
- backend returns server-generated transcript for live answer
Test Cases
- real recorded answer produces transcript
- long answer completes within acceptable behavior
- silent/empty audio yields meaningful handling

Step 13.3
- Add transcript reconciliation logic using:
  - client text
  - server STT text
Validation
- backend produces one accepted transcript
Test Cases
- close client/server transcript match yields accepted transcript
- large mismatch triggers review path
- missing client text falls back to server STT

Step 13.4
- Send accepted transcript to client for review
Validation
- client displays transcript review UI
Test Cases
- transcript review appears after STT completes
- transcript belongs to correct turn/session

Step 13.5
- Implement transcript confirm / re-record path
Validation
- user can accept transcript or re-record answer
Test Cases
- confirm path stores accepted transcript
- re-record path replaces pending answer
- repeated re-record does not corrupt turn state

Phase 14: Persistent Turn Storage

Step 14.1
- Create `InterviewTurn` model
Validation
- turn document can be stored in Mongo
Test Cases
- valid turn insert succeeds
- invalid turn shape fails validation

Step 14.2
- Persist accepted turn transcript
Validation
- confirmed transcript is saved in DB
Test Cases
- accepted transcript persists once
- duplicate persistence is prevented or handled predictably

Step 14.3
- Persist turn metadata:
  - duration
  - question id
  - controls used
Validation
- turn metadata is stored and retrievable
Test Cases
- metadata persists for confirmed turn
- optional metadata omission does not break persistence

Phase 15: Runtime Interview State in Redis

Step 15.1
- Define minimal Redis live state shape
Validation
- state can be created/read/updated from Redis
Test Cases
- new state key is created
- read returns expected structure
- update preserves required fields

Step 15.2
- Update live state after each accepted turn
Validation
- accepted transcript updates Redis state
Test Cases
- turn count increments
- latest accepted transcript is reflected in state
- current objective/branch placeholders update correctly

Step 15.3
- Add Redis checkpoint reads on live session resume
Validation
- interrupted session can restore latest live state
Test Cases
- interrupted session reloads last Redis state
- missing Redis state falls back cleanly if Mongo checkpoint exists

Phase 16: Interview Engine Minimal Loop

Step 16.1
- Implement minimal interview phase state machine:
  - setup
  - warmup
  - completed
Validation
- session transitions correctly through early phases
Test Cases
- setup transitions to warmup
- warmup transitions to completed in placeholder flow
- invalid phase transition is blocked

Step 16.2
- Implement first deterministic next-question generator without LLM
Validation
- backend can ask a second question after first accepted answer
Test Cases
- same input state yields same next question
- second question is generated after first answer acceptance

Step 16.3
- Complete first full multi-turn loop:
  - ask
  - answer
  - transcript accept
  - next question
Validation
- two-turn interview works end to end
Test Cases
- first two-turn happy path completes
- accepted transcript persists across turns

Phase 17: Branching Model Introduction

Step 17.1
- Define branch schema in code
Validation
- branch object can be created and stored in runtime state
Test Cases
- valid branch object passes validation
- invalid branch status/shape fails

Step 17.2
- Create first root branch from selected track
Validation
- live state starts with root branch
Test Cases
- selected track produces matching root branch
- root branch is active initially

Step 17.3
- Add static branch generation from accepted answer using simple rules
Validation
- answer creates predictable candidate branches
Test Cases
- tool mention creates expected branches
- no-branch edge case is handled safely

Step 17.4
- Add active branch vs pending branches state
Validation
- engine can distinguish current branch from future branches
Test Cases
- one branch is marked active
- other branches are stored as pending
- pending branches survive next turn update

Phase 18: Claim Extraction and Contradiction Skeleton

Step 18.1
- Define claim schema in code
Validation
- claim object can be created and stored
Test Cases
- valid claim passes validation
- invalid claim type fails validation

Step 18.2
- Implement simple deterministic claim extraction from accepted transcript
Validation
- basic tool/decision claims can be extracted from sample answers
Test Cases
- tools mentioned in transcript create `used_tool` claims
- decisions mentioned create decision claims
- irrelevant filler does not create excessive noise

Step 18.3
- Define contradiction schema in code
Validation
- contradiction object can be created and stored
Test Cases
- valid contradiction object passes validation
- contradiction status enum works

Step 18.4
- Add first contradiction detection rule against prior claims
Validation
- obvious contradiction is detected on test input
Test Cases
- conflicting claim pair raises contradiction
- harmless rephrase does not falsely trigger contradiction

Phase 19: LLM-Assisted Branch Generation

Step 19.1
- Add branch-generation prompt using current answer + state
Validation
- LLM returns candidate follow-up branches
Test Cases
- branch prompt returns structured branches
- low-information answer still returns limited safe suggestions

Step 19.2
- Validate branch-generation output with Zod
Validation
- invalid branch output is rejected
Test Cases
- valid output passes
- malformed JSON fails
- invalid enum values fail

Step 19.3
- Merge validated LLM branch suggestions into live branch state
Validation
- runtime state includes LLM-generated branches
Test Cases
- validated branches merge into pending state correctly
- duplicate branch suggestions are deduped if dedupe is implemented

Phase 20: Deterministic Branch Scoring

Step 20.1
- Implement branch priority scoring function in code
Validation
- same input consistently yields same branch score
Test Cases
- fixed inputs yield repeatable score
- higher contradiction severity increases score
- lower JD relevance decreases score

Step 20.2
- Add tie-break rules
Validation
- equal-priority branches resolve predictably
Test Cases
- contradiction branch wins allowed tie
- active branch continuity tie resolves predictably

Step 20.3
- Select next active branch using scored branch set
Validation
- engine chooses branch deterministically
Test Cases
- top-scored eligible branch becomes active
- dropped/closed branch is not reselected

Phase 21: LLM-Assisted Question Generation

Step 21.1
- Add next-question prompt using:
  - chosen branch
  - phase
  - objective
Validation
- LLM generates one follow-up question
Test Cases
- returned question matches chosen branch context
- output contains exactly one interviewer question

Step 21.2
- Validate generated question with Zod
Validation
- malformed question output is rejected
Test Cases
- valid question output passes
- missing question text fails
- invalid question class fails

Step 21.3
- Send generated question to client and speak it
Validation
- candidate receives LLM-generated follow-up question
Test Cases
- question reaches client
- speech playback works
- client can answer follow-up normally

Phase 22: Topic Scorecards

Step 22.1
- Define scorecard schema in code
Validation
- scorecard can be created and stored
Test Cases
- valid scorecard passes validation
- invalid score value/range fails validation

Step 22.2
- Create scorecards for primary topics
Validation
- live session contains topic scorecards
Test Cases
- primary track creates expected initial scorecards
- scorecards link to correct topics

Step 22.3
- Add placeholder deterministic scoring updates from accepted answer
Validation
- answer updates topic scorecard values
Test Cases
- accepted answer updates score values
- unrelated answer does not corrupt unrelated topic scorecards

Phase 23: LLM-Assisted Answer Evaluation

Step 23.1
- Add scoring prompt for accepted answer
Validation
- LLM returns structured scoring observations
Test Cases
- scoring prompt returns dimension updates
- scoring prompt returns evidence items when appropriate

Step 23.2
- Validate scoring output with Zod
Validation
- invalid scoring output is rejected
Test Cases
- valid scoring output passes
- malformed evidence structure fails
- invalid score ranges fail

Step 23.3
- Merge scoring observations into scorecards and evidence store
Validation
- evidence and dimension updates appear in runtime state
Test Cases
- evidence items persist correctly
- score updates affect the right topic
- contradiction suspicion hooks into contradiction workflow if present

Phase 24: Coverage and Phase Management

Step 24.1
- Implement coverage counters for major topics
Validation
- engine tracks explored topic count
Test Cases
- explored topic count increments when new major topic is covered
- repeated probing of same topic does not inflate count

Step 24.2
- Implement transition from warmup to primary probe
Validation
- session changes phase at right time
Test Cases
- warmup transition occurs after expected evidence threshold
- premature transition is blocked

Step 24.3
- Implement transition from primary probe to coverage probe
Validation
- phase transition occurs based on time/coverage
Test Cases
- enough primary exploration triggers coverage phase
- insufficient exploration keeps primary phase active

Step 24.4
- Implement transition to wrap-up
Validation
- late-session behavior switches into wrap-up mode
Test Cases
- wrap-up begins at configured time threshold
- unresolved high-value branch can still be prioritized inside wrap-up

Phase 25: Timer and Duration Enforcement

Step 25.1
- Add session timer on backend
Validation
- backend tracks elapsed and remaining time
Test Cases
- timer starts on interview start
- elapsed time increases correctly
- remaining time decreases correctly

Step 25.2
- Surface timer state to client over WebSocket
Validation
- client displays live timer correctly
Test Cases
- client timer updates correctly
- reconnect restores current timer state

Step 25.3
- Enforce phase adjustments based on remaining time
Validation
- branch depth reduces near end of session
Test Cases
- near-end session reduces deep probing bias
- wrap-up behavior activates as expected

Phase 26: User Controls During Interview

Step 26.1
- Implement `repeat question`
Validation
- client can request repeat and hear question again
Test Cases
- first repeat replays same question
- repeated repeat behaves according to policy

Step 26.2
- Implement `give small hint`
Validation
- server returns small hint only
Test Cases
- hint returns when mode allows it
- hint is blocked when hint mode is off
- hint does not reveal full answer

Step 26.3
- Implement `skip`
Validation
- branch/turn is marked skipped and interview continues
Test Cases
- skip advances the session
- skip is recorded in turn/session state

Step 26.4
- Implement `end interview`
Validation
- user can terminate session gracefully
Test Cases
- end control moves session into wrap-up/report path
- partial evidence still generates safe output

Phase 27: Final Scoring and Verdict

Step 27.1
- Implement topic score aggregation
Validation
- topic scores produce deterministic topic results
Test Cases
- same score inputs produce same topic score
- confidence modifier affects topic score correctly

Step 27.2
- Implement overall score aggregation
Validation
- session produces overall numeric score
Test Cases
- primary and secondary topic weights apply correctly
- lightly explored topic does not dominate final score

Step 27.3
- Implement verdict mapping
Validation
- score maps to verdict bucket correctly
Test Cases
- threshold scores map to expected verdicts
- edge-case decimal scores map consistently

Step 27.4
- Implement hard-failure caps
Validation
- contradiction/core-failure cases cap verdict properly
Test Cases
- severe hard failure caps verdict
- absence of hard failure does not cap verdict unnecessarily

Phase 28: Final Report Generation

Step 28.1
- Create `InterviewReport` model
Validation
- report document can be stored
Test Cases
- valid report persists
- invalid report shape fails validation

Step 28.2
- Add final report synthesis prompt
Validation
- LLM returns structured final report
Test Cases
- final report contains required major sections
- report remains grounded in provided evidence

Step 28.3
- Validate final report with Zod
Validation
- malformed report output is rejected
Test Cases
- valid report passes schema
- missing required section fails

Step 28.4
- Persist final report in Mongo
Validation
- completed session stores report
Test Cases
- report persists for completed session
- report links to correct user/session

Step 28.5
- Send `report:ready` event to client
Validation
- client receives report-ready event after interview completion
Test Cases
- report-ready event arrives once
- client can navigate to report from that event

Phase 29: Final Report UI

Step 29.1
- Build report screen with:
  - verdict
  - overall score
  - strengths
  - weak areas
Validation
- user can open and read top-level report
Test Cases
- top-level report renders correctly
- empty optional sections do not break UI

Step 29.2
- Add topic-wise breakdown display
Validation
- topic results are visible in UI
Test Cases
- all topic rows render
- per-topic score displays accurately

Step 29.3
- Add ideal answer guidance and improvement plan sections
Validation
- detailed feedback is visible in report UI
Test Cases
- guidance section renders correctly
- long feedback remains readable

Phase 30: Session History

Step 30.1
- Build session history API
Validation
- user can fetch history list
Test Cases
- history returns only current user sessions
- empty history returns empty list

Step 30.2
- Build session history UI
Validation
- user can view prior sessions
Test Cases
- history list renders correctly
- empty state renders cleanly

Step 30.3
- Allow opening stored report from history
Validation
- old report can be loaded successfully
Test Cases
- selected history item opens correct report
- unauthorized access to another user report is blocked

Phase 31: Resume / Recovery

Step 31.1
- Add backend logic to detect interrupted session
Validation
- interrupted session is identifiable
Test Cases
- disconnected in-progress session is marked interrupted
- completed session is not mislabeled interrupted

Step 31.2
- Add resume-live-session flow using Redis + Mongo checkpoint
Validation
- user can resume interrupted active interview
Test Cases
- resume restores active branch and phase
- missing Redis state falls back to Mongo checkpoint
- resumed session continues without duplication

Step 31.3
- Add client UI for resuming existing session
Validation
- user can resume instead of starting duplicate session
Test Cases
- interrupted session shows resume CTA
- resume returns user to live interview screen

Phase 32: Error and Fallback Hardening

Step 32.1
- Add LLM malformed-output fallback path
Validation
- fallback question generation works when main prompt fails
Test Cases
- invalid LLM output triggers fallback
- fallback still generates usable question

Step 32.2
- Add STT failure recovery path
Validation
- repeated STT issues show retry/end behavior
Test Cases
- first STT failure offers retry
- repeated STT failure enters controlled recovery path

Step 32.3
- Add graceful socket disconnect handling
Validation
- disconnect does not corrupt session state
Test Cases
- disconnect preserves Redis/Mongo state
- reconnect does not create duplicate active session

Step 32.4
- Add session status handling:
  - completed
  - interrupted
  - abandoned
  - failed_setup
Validation
- sessions get correct terminal/non-terminal statuses
Test Cases
- early exit before meaningful progress marks abandoned
- setup failure marks failed_setup
- successful report marks completed

Phase 33: End-to-End Quality Pass

Step 33.1
- Run full happy-path interview from signup to report
Validation
- complete flow works end to end
Test Cases
- new user can complete full interview
- final report is produced and viewable

Step 33.2
- Run contradiction scenario
Validation
- contradiction detection and follow-up behavior work
Test Cases
- contradictory answers trigger contradiction path
- unresolved contradiction affects final evaluation

Step 33.3
- Run short-answer / weak-answer scenario
Validation
- deeper probing occurs
Test Cases
- shallow answer produces deeper/clarifying follow-up
- final report flags weak depth

Step 33.4
- Run skip/hint/repeat/end controls test
Validation
- all user controls work correctly
Test Cases
- each control works individually
- combined control usage does not corrupt state

Step 33.5
- Run interrupted-session recovery scenario
Validation
- session can recover or fail safely
Test Cases
- recoverable session resumes successfully
- unrecoverable case fails without data corruption

Phase 34: Cleanup and Documentation

Step 34.1
- Clean up environment documentation
Validation
- setup instructions are reproducible
Test Cases
- fresh developer can follow setup doc successfully

Step 34.2
- Document local dependencies:
  - Ollama
  - qwen2:0.5b
  - whisper.cpp
  - MongoDB
  - Redis
Validation
- new developer can understand required services
Test Cases
- dependency list is complete
- installation notes are understandable

Step 34.3
- Document architecture and current V1 limitations
Validation
- repo clearly states intentional V1 tradeoffs
Test Cases
- limitations list includes all major V1 simplifications
- architecture summary matches implementation intent

Step 34.4
- Add demo seed path or sample JD/resume fixtures
Validation
- local testing can happen without collecting fresh inputs every time
Test Cases
- sample fixtures load successfully
- fixtures produce predictable extraction/interview behavior

Final End State
- After all steps are completed, the project should support:
  - signup/login
  - JWT + refresh-token-backed auth sessions
  - resume/JD upload and extraction review
  - interview configuration
  - one active live interview session per user
  - WebSocket-based live voice interview
  - question playback and answer recording
  - server-side STT with canonical transcript
  - branching interview engine
  - contradiction-aware probing
  - topic scoring and final verdict
  - final report generation
  - session history
  - recovery/fallback handling

Recommended Build Order Summary
- Foundation
- Auth
- Session skeleton
- Upload/extraction
- WebSocket live loop
- Speech
- Minimal interview engine
- Branching
- Scoring
- Reporting
- Recovery/hardening
