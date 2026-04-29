ABSTRACT REQUIREMENTS:
Project: AI SWE Mock Interviewer

Purpose
- Build a voice-first AI mock interviewer for Software Engineering interviews.
- Solve the problem that existing LLM chat/voice tools behave too linearly and do not probe deeply enough.
- Simulate a more realistic technical interview where the interviewer asks cross-questions, explores follow-up paths, and evaluates whether the candidate truly understands their claims.

Core Product Insight
- Real interviews are not linear question-answer flows.
- A good interviewer treats each candidate answer as a branching tree of possible follow-up directions.
- The system should behave more like a depth-oriented interviewer:
  - identify multiple probe areas from a single answer
  - decide which branch is most valuable to pursue
  - continue drilling until a branch is sufficiently explored
  - revisit other branches intelligently when needed

Primary User
- Software Engineering candidates preparing for interviews.

V1 Product Positioning
- Candidate-first product.
- Recruiter-facing workflow is out of scope for V1.
- Focus only on SWE interviews, not other domains.
- V1 should optimize for realistic mock interview practice rather than formal enterprise assessment.

Input Requirements Before Interview Starts
- Resume
- Job Description (mandatory)
- Candidate/project/work experience context derived from uploaded material
- Interview configuration, including:
  - company type: `servicebased`, `productbased`, `startup`
  - difficulty: `roast`, `easy`, `medium`
  - interviewer behavior mode
  - hint behavior
  - session duration

Granular V1 Decisions for Input
- Supported upload formats:
  - resume: `pdf`, `docx`, `txt`
  - JD: `pdf`, `docx`, `txt`, or pasted text
- Resume is mandatory.
- JD is mandatory, but V1 should also provide sample JDs that the user can choose and treat as the active JD.
- Project documents are optional in V1.
- Extracted candidate profile should be normalized into:
  - name
  - years of experience
  - current/previous roles
  - projects
  - skills/tools
  - achievements
  - education
- Extracted JD should be normalized into:
  - target role
  - seniority
  - required skills
  - preferred skills
  - responsibilities
  - company type
- If uploaded documents are low quality or partially unreadable, the app should ask the candidate to review and confirm extracted details before interview start.

Interaction Model
- Voice-first only in V1.
- No text-first mode in V1.
- The AI should wait for the candidate to finish speaking before processing.
- No mid-answer interruption in V1.

Granular V1 Decisions for Voice Flow
- The voice loop per turn should be:
  - AI asks question through TTS
  - candidate answers by voice
  - STT converts answer to text
  - app confirms final transcript internally
  - interview engine decides next move
  - AI asks next question
- Maximum acceptable average post-answer latency target: `3 to 5 seconds` for the next spoken question.
- Candidate controls supported in V1:
  - `repeat question`
  - `give small hint`
  - `skip`
  - `end interview`
- The system should treat silence of roughly `8 seconds` as no response and prompt once.
- After two consecutive no-response events, the system should either skip the question or ask the candidate whether to continue.
- Filler words should be ignored during scoring unless they materially harm clarity.
- Voice transcripts should be shown in the UI after each turn for transparency, but the session remains voice-first.

Interview Scope for V1
- Resume-based discussion
- Project-based discussion
- Backend interview discussion
- Frontend interview discussion
- System design discussion
- DSA live coding round is out of scope for V1

Granular V1 Decisions for Scope
- V1 interview categories:
  - `resume/project deep dive`
  - `backend fundamentals`
  - `frontend fundamentals`
  - `system design lite`
- The candidate chooses one primary interview track before starting.
- The primary track controls roughly `70%` of interview time.
- The remaining `30%` may be used for adjacent probing based on JD relevance and candidate claims.
- `system design lite` in V1 means discussion-based design only:
  - API design
  - scaling basics
  - data modeling
  - caching
  - queues/background jobs
  - tradeoff reasoning
- For candidates with less than `2 years` experience, system design should remain practical and project-oriented rather than large-scale distributed systems heavy.

Granular V1 Topic Boundaries
- `resume/project deep dive` should cover:
  - project goals
  - tech stack choices
  - architecture choices
  - tradeoffs taken
  - implementation details
  - challenges faced
  - debugging and failure handling
  - ownership and exact contribution
- `backend fundamentals` should cover a practical subset of:
  - authentication and authorization basics
  - API design
  - request lifecycle
  - database choice and data modeling
  - indexing and query efficiency
  - caching basics
  - background jobs and queues
  - scaling and reliability basics
  - consistency and tradeoffs
- `frontend fundamentals` should cover a practical subset of:
  - rendering model
  - client vs server responsibilities
  - state management
  - component design
  - performance basics
  - API integration
  - error/loading states
  - browser fundamentals relevant to the claimed stack
- `system design lite` should cover a practical subset of:
  - requirements clarification
  - high-level component design
  - API boundaries
  - data flow
  - database choice
  - caching opportunities
  - asynchronous processing
  - bottlenecks and tradeoffs
- Mandatory topic rules:
  - `resume/project deep dive` must always be covered in every V1 interview
  - the selected primary track must always be covered
  - system design may be skipped in `15 min` sessions unless it is the primary track
- Topic difficulty should be experience-aware:
  - fresher candidates should be judged more on clarity, ownership, and practical understanding
  - experienced candidates should face more tradeoff, scale, and edge-case probing

Interview Behavior Requirements
- The interviewer should ask cross-questions rather than accept surface-level answers.
- It should choose which branch to pursue based on:
  - answer depth
  - knowledge gaps
  - candidate confidence
  - tradeoff reasoning
  - contradictions with earlier statements
  - relevance to the target JD
- It may continue drilling within one branch or move across multiple branches if useful.
- Each branch may contain multiple sub-branches.
- If the candidate gives strong answers, the system does not need to over-drill unnecessarily.
- If the candidate gives vague, inconsistent, memorized, or weak answers, the system should probe deeper.

Granular V1 Decisions for Behavior Modes
- `strict interviewer`
  - terse tone
  - minimal positive reinforcement
  - prioritizes gaps, contradictions, and tradeoffs
  - rarely offers hints unless explicitly allowed
- `coach interviewer`
  - still evaluates rigorously
  - gives brief feedback transitions
  - may redirect the candidate when they drift
  - can provide tiny hints when configured
- Hint behavior values in V1:
  - `off`
  - `minimal`
  - `on-demand`
- `minimal` means one short directional hint per question at most.
- `on-demand` means hints are only given when the candidate explicitly asks.
- Interview config is fixed for a session after it begins.

Granular V1 Tone and Conversational Rules
- The interviewer may acknowledge an answer briefly, but should avoid over-validating with phrases like `great`, `perfect`, or `solid choice` unless the answer is genuinely exceptional.
- Preferred acknowledgement styles:
  - `Okay. Why did you choose that over X?`
  - `Fine. Go one level deeper.`
  - `You mentioned Y. Explain that decision.`
- In `strict interviewer` mode:
  - praise should be rare
  - challenges should be immediate when the answer is weak or incomplete
  - drifting should be cut off quickly
- In `coach interviewer` mode:
  - the AI may allow a bit more explanation room
  - the AI may give one sentence of feedback before the next probe
  - the AI may redirect with softer phrasing
- Acceptable hints in V1 should be directional, not revealing.
- Example acceptable hint:
  - `Think about tradeoffs between consistency and flexibility.`
- Example unacceptable hint:
  - `MongoDB supports ACID transactions in replica sets, mention that.`

Interview Modes
- `roast`
  - aggressive probing
  - more follow-ups
  - lower tolerance for vague reasoning
- `medium`
  - standard SWE interview behavior
- `easy`
  - lighter probing
  - simpler progression

Granular V1 Decisions for Difficulty Modes
- `easy`
  - shorter follow-up chains
  - more direct questions
  - fewer contradiction checks
- `medium`
  - standard interview depth
  - balanced topic coverage and probing
- `roast`
  - deeper branch exploration
  - more contradiction checks
  - more frequent tradeoff and edge-case follow-ups
  - higher expectation of precision
- Difficulty should influence probing depth, question sharpness, and tolerance for incomplete answers.

Adaptive Difficulty
- Difficulty should be influenced by:
  - candidate experience
  - previous roles
  - project complexity
  - work experience
- achievements
- User configuration should still be able to override or guide difficulty.

Granular V1 Decisions for Adaptive Difficulty
- If the user manually selects a difficulty, that selection takes priority.
- If the user chooses `auto`, the system should infer difficulty from:
  - years of experience
  - seniority in JD
  - complexity of listed projects
  - listed responsibilities
- Suggested default behavior:
  - `0 to 2 years`: easy or medium
  - `2 to 5 years`: medium
  - `5+ years`: medium or roast
- The system may still ask one or two stretch questions above the configured level to test headroom.

Granular V1 Decisions for Company Type Mapping
- `startup`
  - more emphasis on ownership, speed of execution, pragmatic tradeoffs, and breadth
  - more questions on shipping decisions, prioritization, and working across layers
- `productbased`
  - more emphasis on correctness, scale, tradeoff depth, performance, and system quality
  - more likely to receive deeper probing on architecture and CS fundamentals
- `servicebased`
  - more emphasis on implementation clarity, client requirement handling, maintainability, and practical delivery
  - less bias toward hyperscale assumptions unless the resume/JD clearly justifies it
- Company type should influence question framing and emphasis, not entirely replace JD-driven prioritization.

Branching Engine Requirements
- For each candidate answer, the system should:
  - identify concepts, tools, claims, decisions, and tradeoffs
  - generate possible follow-up branches
  - track explored and unexplored branches
  - prioritize the next branch intelligently
- The engine should avoid naive breadth-first traversal.
- The engine should avoid uncontrolled branching that causes the interview to never end.
- The engine should maintain enough state to know:
  - current topic
  - prior candidate claims
  - contradictions
  - explored nodes
  - pending nodes
  - why the next question is being asked

Granular V1 Decisions for Branching Engine
- A `branch` in V1 is a probeable interview topic derived from a candidate answer or uploaded context.
- Each branch should store:
  - branch id
  - parent branch id
  - topic label
  - source of branch: resume, JD, candidate answer, or interviewer inference
  - priority score
  - depth level
  - status: `unexplored`, `active`, `partially explored`, `sufficiently explored`, `dropped`
  - why this branch matters
  - candidate claims tied to the branch
  - contradiction flags
  - last question asked on this branch
  - current confidence about candidate understanding
- Branch priority should be driven by:
  - JD relevance
  - importance of the topic to the claimed project/role
  - presence of contradictions
  - weakness in current answer
  - interview mode
  - unexplored high-value claims
- V1 branch limits:
  - maximum active candidate branches considered per turn: `5`
  - maximum depth for a single branch before forced reconsideration: `4`
  - maximum new child branches created from a single answer: `4`
- A branch is `sufficiently explored` when one of these is true:
  - candidate demonstrates correct understanding with depth and tradeoffs
  - candidate clearly lacks knowledge and the gap has already been proven
  - further drilling would be repetitive relative to time budget
- After each turn, the engine should either:
  - continue the current branch
  - switch to a higher-priority pending branch
  - close the branch and move to coverage expansion
- Contradictions should be detected by comparing new claims against:
  - normalized prior claims
  - extracted resume/project claims
  - previous answers in the same session
- Contradictions should raise branch priority rather than immediately penalize the final score without verification.

Granular V1 Decisions for Branch Priority Formula
- The branch priority score should be a weighted heuristic, not a free-form intuition.
- Default priority weights:
  - JD relevance: `25%`
  - contradiction severity: `25%`
  - weakness or incompleteness in current answer: `20%`
  - importance to claimed project/role: `15%`
  - unexplored claim value: `10%`
  - time sensitivity and remaining session budget: `5%`
- Continuity bonus:
  - if the current active branch still has high-value unresolved questions, it should receive a continuity bonus before switching
- Tie-break rules:
  - contradiction branch wins over non-contradiction branch
  - JD-critical branch wins over non-critical branch
  - current active branch wins over equal-priority fresh branch
  - simpler-to-resolve branch wins near end of session

Granular V1 Decisions for Branch Priority Math
- Each priority factor should be normalized to a `0 to 1` score before weighting.
- Suggested normalization guidance:
  - JD relevance:
    - `1.0` if directly tied to required JD skill
    - `0.7` if tied to preferred JD skill
    - `0.4` if only indirectly related
    - `0.1` if mostly incidental
  - contradiction severity:
    - `1.0` for direct contradiction on core claimed experience
    - `0.7` for important inconsistency on implementation detail
    - `0.4` for mild inconsistency or unclear statement
    - `0.0` if no contradiction exists
  - weakness/incompleteness:
    - `1.0` if answer is evasive, very shallow, or clearly wrong
    - `0.7` if answer is partially correct but incomplete
    - `0.4` if answer is mostly fine with one missing layer
    - `0.1` if answer is already strong
  - role/project importance:
    - `1.0` if central to a major listed project or role
    - `0.6` if secondary but meaningful
    - `0.2` if peripheral
  - unexplored claim value:
    - `1.0` if the answer introduced a high-value new claim not yet tested
    - `0.5` if the claim is useful but non-critical
    - `0.1` if already mostly explored
  - time sensitivity:
    - `1.0` if unresolved and session is near wrap-up
    - `0.5` if there is still healthy time remaining
    - `0.1` if time pressure is low
- Low-confidence extracted claims should reduce their own branch priority by roughly `20%` unless later evidence strengthens them.
- The application should compute the final priority score deterministically from these inputs rather than ask the LLM to invent the priority.

Granular V1 Decisions for Claim Model
- A `claim` should be stored as a normalized unit with:
  - claim id
  - source turn
  - raw quote
  - normalized meaning
  - topic
  - confidence in extraction
  - claim type
- Claim types in V1:
  - `used_tool`
  - `made_decision`
  - `understands_concept`
  - `implemented_feature`
  - `faced_problem`
  - `justified_tradeoff`
  - `experience_level_claim`
- Contradiction categories in V1:
  - factual contradiction
  - resume mismatch
  - role inflation
  - implementation inconsistency
  - tradeoff inconsistency
- If the candidate clarifies a contradiction convincingly, the contradiction should be marked `resolved`, but the consistency dimension may still reflect the earlier confusion slightly.

Granular V1 Decisions for Branch Closure
- A branch may close after one strong answer only if:
  - the topic is low complexity
  - the answer is correct
  - the candidate explains why, how, and tradeoffs clearly
- Most medium/high-value branches should require `2 to 4` meaningful follow-ups.
- A branch should be considered repetitive if two consecutive follow-ups produce no new evidence about understanding.
- Near the end of the session, the engine should prefer `good enough` closure over perfect exploration.

Context Management Requirements
- Context management should be controlled explicitly by the application, not delegated blindly to the LLM.
- At each iteration, the system should provide the LLM with structured interview state, including:
  - role and objective of the interviewer
  - candidate profile
  - JD context
  - interview configuration
  - conversation history
  - explored nodes
  - unexplored nodes
  - current topic state
  - what to do next
  - why that next step was chosen

Granular V1 Decisions for Context Management
- The application should maintain a structured interview state object outside the LLM.
- The LLM should receive:
  - system role and interview behavior
  - candidate summary
  - JD summary
  - active configuration
  - compressed conversation history
  - current branch
  - top pending branches
  - scoring observations so far
  - explicit next-step objective
  - explicit rationale for that next step
- Full raw conversation should not be sent every turn once the session grows large.
- Older turns should be summarized into structured memory buckets:
  - proven strengths
  - unresolved claims
  - contradictions
  - branch history
  - important quotes
- The application, not the LLM, should decide the canonical interview state after each turn.
- The LLM should propose the next question and reasoning within the boundaries of that supplied state.

Granular V1 State Shape
- The canonical interview state should contain:
  - session metadata
  - candidate profile
  - JD profile
  - configuration
  - current phase
  - active branch
  - pending branches
  - explored branch history
  - normalized claims
  - contradiction registry
  - topic scorecards
  - compressed memory summary
  - remaining time
  - last question
  - last answer transcript
  - next-step objective
- Interview phases in V1:
  - `setup`
  - `warmup`
  - `primary_probe`
  - `coverage_probe`
  - `wrapup`
  - `completed`

Granular V1 Decisions for State Schema
- Session metadata should include:
  - session id
  - created at
  - started at
  - current phase
  - selected track
  - duration preset
  - remaining time
  - company type
  - difficulty
  - interviewer mode
  - hint mode
- Candidate profile should include:
  - name
  - experience band
  - roles
  - projects
  - skills
  - achievements
- JD profile should include:
  - role title
  - seniority
  - required skills
  - preferred skills
  - responsibilities
  - company type
- Branch objects should use enums only from the allowed status set:
  - `unexplored`
  - `active`
  - `partially_explored`
  - `sufficiently_explored`
  - `dropped`
  - `resolved`
- Contradiction objects should include:
  - contradiction id
  - contradiction category
  - related claim ids
  - severity
  - status: `open`, `resolved`, `dismissed`
  - explanation
- Topic scorecards should include:
  - topic id
  - topic label
  - evidence items
  - per-dimension scores
  - weighted topic score
  - confidence level
- The state schema should prefer explicit enums and numeric scores over free-form prose wherever possible.

Granular V1 Canonical State Contracts
- The canonical interview state should be representable as structured JSON.
- Required top-level objects:
  - `session`
  - `candidate_profile`
  - `jd_profile`
  - `conversation`
  - `branches`
  - `claims`
  - `contradictions`
  - `scorecards`
  - `memory`
  - `control`
- `conversation` should store:
  - turn number
  - speaker
  - transcript
  - timestamps
  - accepted transcript flag
- `control` should store:
  - active branch id
  - next-step objective
  - wrap-up mode flag
  - fallback mode flag
  - pending user control request if any
- JSON contracts should favor backward-compatible additive changes in later versions.

Knowledge Grounding
- The interview should be grounded in:
  - resume
  - projects
  - work experience
  - achievements
  - job description
- The system should support a sample generic SWE JD when the user does not want to provide a custom one, but JD context remains conceptually important.

Granular V1 Decisions for Grounding
- Resume and JD extraction should be reviewed by the candidate before the interview begins.
- The app should build a candidate knowledge profile and a target role profile before the first question.
- If a spoken answer conflicts with the uploaded resume, the system should:
  - create a contradiction flag
  - ask a clarifying follow-up
  - update the evaluation only after the candidate responds
- If the JD heavily emphasizes an area not present in the resume, the interviewer may still probe it, but should label it as JD-driven rather than resume-driven questioning.

Granular V1 Decisions for Sample JD Library
- V1 should ship with a small sample JD library covering:
  - `backend SWE`
  - `frontend SWE`
  - `full-stack SWE`
- Each sample JD should have versions for:
  - `0 to 2 years`
  - `2 to 5 years`
  - `5+ years`
- Sample JDs should vary in emphasis by company type, but still share a common role core.

Granular V1 Decisions for Resume and JD Extraction
- Required resume extraction outputs:
  - candidate name
  - experience estimate
  - roles
  - projects
  - claimed tools/technologies
- Optional extraction outputs:
  - achievements
  - education
  - certifications
- Required JD extraction outputs:
  - role title
  - seniority
  - required skills
  - responsibilities
- If extraction confidence is low for a required field, the user should confirm or correct it before proceeding.
- Project bullets should be split into normalized project claims such as:
  - `built X`
  - `used Y`
  - `designed Z`
  - `improved metric A`
- The application should preserve raw source text references so extracted claims can be traced back to their origin.

Granular V1 Extraction Rules
- Resume extraction should treat section headers like `Experience`, `Projects`, and `Skills` as high-confidence anchors.
- JD extraction should prioritize:
  - explicit required skills
  - repeated keywords
  - stated years-of-experience requirements
  - responsibilities that map to interview topics
- If multiple projects are present, the system should rank them by:
  - recency
  - depth of description
  - relevance to the JD
  - number of concrete technical claims
- The highest-ranked project should become the default project branch for project deep dive unless the user explicitly selects another project.

Session Length
- Session duration should be configurable by the user.
- Maximum session duration in V1: 1 hour.

Granular V1 Decisions for Session Control
- Allowed duration presets in V1:
  - `15 min`
  - `30 min`
  - `45 min`
  - `60 min`
- The engine should manage pacing dynamically based on time remaining.
- The session may end early only if:
  - minimum coverage has been reached
  - no major high-priority unexplored branches remain
  - the user selected a short session and strong evidence has already been gathered
- Minimum coverage for early completion:
  - at least `3` major topics explored for 30+ minute sessions
  - at least `2` major topics explored for 15 minute sessions
- As the session approaches the final `20%` of time, the system should reduce deep drilling and shift toward coverage completion plus final wrap-up questions.

Granular V1 Decisions for Topic Coverage Policy
- Coverage targets by session length:
  - `15 min`: `2 to 3` major topics
  - `30 min`: `3 to 4` major topics
  - `45 min`: `4 to 5` major topics
  - `60 min`: `5 to 6` major topics
- If one branch consumes too much time without yielding new evidence, the system should cut it and move on.
- `resume/project deep dive` should consume at least:
  - `30%` of time in short sessions
  - `20%` of time in longer sessions
- The selected primary track should receive guaranteed coverage even if the candidate gives weak early answers.
- The engine should avoid spending more than half of the total session on a single branch family unless the user explicitly selected a narrow mock focus in a future version.

Granular V1 Coverage Scheduler Defaults
- Suggested phase split by session:
  - `warmup`: `10%`
  - `primary_probe`: `50%`
  - `coverage_probe`: `30%`
  - `wrapup`: `10%`
- `warmup` should establish candidate context and confidence level quickly.
- `primary_probe` should focus on the selected track and strongest JD-aligned branches.
- `coverage_probe` should test adjacent areas and unresolved important claims.
- `wrapup` should confirm unresolved high-value concerns and gather reflective answers.

Evaluation and Scoring
- The system should maintain a topic-level evaluation log.
- For each topic, it should store:
  - score out of 10
  - detailed reasoning
  - what went right
  - what went wrong
  - references to the actual question asked
  - references to the candidate’s answer
- Topic scoring dimensions should include:
  - correctness
  - depth
  - tradeoff reasoning
  - communication
  - consistency

Granular V1 Decisions for Scoring
- Each scoring dimension should be rated on `0 to 10`.
- Default weights in V1:
  - correctness: `30%`
  - depth: `25%`
  - tradeoff reasoning: `20%`
  - communication: `10%`
  - consistency: `15%`
- Per-topic score is the weighted score across these dimensions.
- Overall score is a weighted aggregation of topic scores, where primary-track topics carry more weight than secondary topics.
- Suggested topic weighting:
  - primary-track topics: `70%`
  - secondary topics: `30%`
- Dimension guidance:
  - correctness: factual accuracy and conceptual validity
  - depth: ability to go beyond definitions into mechanism and implications
  - tradeoff reasoning: ability to compare alternatives and justify choices
  - communication: structure, clarity, and conciseness of answer
  - consistency: alignment with earlier claims, resume, and interview context
- Evidence stored per topic should include:
  - question excerpts
  - answer excerpts
  - scoring notes
  - contradiction references if any
- Hard failures in V1:
  - repeated confident contradictions on core claimed experience
  - inability to explain major resume-listed project choices
- Hard failures should cap the final verdict at `Needs improvements` or `Can be considered for next round` depending on severity.

Granular V1 Rubric Anchors
- `correctness`
  - `0 to 3`: mostly incorrect or invented
  - `4 to 5`: partially correct but materially flawed
  - `6 to 7`: mostly correct with some gaps
  - `8 to 9`: correct and reliable
  - `10`: highly accurate, precise, and resilient under follow-up
- `depth`
  - `0 to 3`: definition-level only
  - `4 to 5`: some explanation but shallow mechanism
  - `6 to 7`: explains how/why with moderate detail
  - `8 to 9`: explains internals, implications, and edge cases
  - `10`: demonstrates expert-level layered understanding
- `tradeoff reasoning`
  - `0 to 3`: no comparison or naive absolutist answer
  - `4 to 5`: mentions alternatives but weak justification
  - `6 to 7`: gives practical comparison and reasonable choice
  - `8 to 9`: strong contextual tradeoff analysis
  - `10`: nuanced tradeoff reasoning with constraints and consequences
- `communication`
  - `0 to 3`: very unclear or disorganized
  - `4 to 5`: understandable but rambling or confusing
  - `6 to 7`: clear enough with minor structure issues
  - `8 to 9`: clear, concise, and well-structured
  - `10`: highly crisp, structured, and interview-ready
- `consistency`
  - `0 to 3`: repeated contradictions or mismatches
  - `4 to 5`: notable inconsistencies needing rescue
  - `6 to 7`: mostly consistent with minor drift
  - `8 to 9`: consistent across answers and resume context
  - `10`: fully coherent across the session

Granular V1 Verdict Logic
- Base verdict should come from the overall weighted score.
- Verdict should then be adjusted by guardrail rules:
  - one severe hard failure on a core claimed project/topic should cap verdict at `Needs improvements`
  - one moderate hard failure may cap verdict at `Can be considered for next round`
  - strong averages should not fully override proven contradictions on core claimed experience
- The system should also store evaluation confidence:
  - `low`
  - `medium`
  - `high`
- Confidence should depend on:
  - number of topics explored
  - number of follow-ups completed
  - stability of evidence across the session

Granular V1 Decisions for Scoring Evidence Format
- Evidence should be stored at both turn level and topic level.
- Each evidence item should include:
  - evidence id
  - topic id
  - turn number
  - question excerpt
  - answer excerpt
  - evidence type: `strength`, `gap`, `contradiction`, `tradeoff`, `ownership`, `clarification`
  - linked claim ids
  - linked contradiction ids if any
  - short evaluator note
- Each topic should keep a bounded set of the most relevant evidence items, ideally `3 to 6`.
- Contradictory evidence should always be linkable back to the exact turns that produced it.

Granular V1 Score Aggregation Defaults
- Topic score computation:
  - compute weighted average of dimension scores
  - multiply by topic confidence modifier between `0.85` and `1.0`
- Overall score computation:
  - compute weighted average of topic scores
  - apply verdict guardrail caps afterward
- Confidence modifier guidance:
  - `1.0` for well-explored topic with multiple consistent follow-ups
  - `0.93` for moderately explored topic
  - `0.85` for lightly explored topic
- Topics with only one shallow answer should never dominate the overall score.

Final Evaluation Output
- Overall score out of 10
- Verdict mapping:
  - `<= 4`: Needs improvements
  - `<= 6`: Can be considered for next round
  - `<= 8`: Hire
  - `<= 10`: Strongly hire
- Final report should include:
  - strengths
  - weak areas
  - ideal answers
  - improvement plan
  - structured reasoning behind the evaluation

Granular V1 Decisions for Final Report
- Final report sections:
  - overall verdict
  - overall score
  - topic-wise breakdown
  - strongest answers
  - weakest answers
  - contradictions observed
  - ideal answer guidance
  - improvement plan
  - recommended next practice areas
- `ideal answers` in V1 should be personalized to the candidate’s interview context and JD, not generic textbook answers.
- Improvement plan should include:
  - what concept to revise
  - why it matters
  - what better answer characteristics were missing
  - what to practice next
- Reports are candidate-facing in V1 and should be readable without replaying the entire interview.

Granular V1 Decisions for Ideal Answers
- Ideal answers should not be long essay outputs by default.
- Each ideal answer should contain:
  - a short strong answer version
  - key points that should have been covered
  - missing tradeoffs or implementation details
- Ideal answers should be tailored to:
  - candidate experience level
  - selected interview track
  - JD context
  - the candidate’s own project if the question was project-specific

Granular V1 Decisions for Improvement Plan
- Improvement plan should be grouped by severity first, then by topic.
- Each improvement item should include:
  - issue observed
  - why it matters in interviews
  - what a stronger answer should include
  - a concrete next practice task
- The report should also include:
  - top `3` priority areas to improve
  - optional short-term practice plan for the next mock interview

Granular V1 Decisions for Session History
- The user should be able to view past interview sessions in a history list.
- Each session history entry should show:
  - date
  - track
  - duration
  - overall score
  - verdict
  - top weak areas
- Retry behavior in V1:
  - `retry same config` starts a fresh session and does not preload prior conversation state
  - `retry harder` starts fresh with modified difficulty or stricter mode
- V1 may highlight recurring weak areas across past sessions in a lightweight way, but it should not deeply personalize the live interview from history yet.

Product Goals
- Realistic interview simulation
- Interview preparation and learning
- Stronger depth probing than generic chat assistants

Granular V1 User Flow
- Pre-interview flow:
  - upload resume
  - upload or select JD
  - review extracted candidate/JD summaries
  - select interview track
  - select difficulty, interviewer behavior, hints, company type, and duration
  - start interview
- In-interview flow:
  - AI asks question
  - candidate answers by voice
  - system updates branch tree, score notes, and topic state
  - AI asks next question
- Post-interview flow:
  - show transcript
  - show final report
  - allow retry with same config
  - allow retry with tougher config

Granular V1 Candidate Controls
- `repeat question`
  - repeats the same question once in the same wording
  - a second repeat request may paraphrase the question more simply
- `give small hint`
  - does not lower difficulty
  - provides one directional cue only
- `skip`
  - allowed, but should be recorded
  - repeated skipping on core topics should negatively affect depth and confidence
- `end interview`
  - ends the interview gracefully and generates a report from collected evidence

Granular V1 Decisions for Question Taxonomy
- The interviewer should generate questions from explicit question classes:
  - `definition_check`
  - `why_choice`
  - `how_it_works`
  - `tradeoff_probe`
  - `failure_mode_probe`
  - `scaling_probe`
  - `ownership_probe`
  - `contradiction_check`
  - `resume_authenticity_probe`
  - `reflection_probe`
- Question class selection should depend on the branch type and current evidence gap.
- The system should prefer:
  - `why_choice`, `how_it_works`, and `tradeoff_probe` for project claims
  - `definition_check` only as a shallow entry or correctness sanity check
  - `contradiction_check` only when enough evidence exists to justify it
- The engine should avoid repeated use of the same question class on the same branch unless it is escalating from shallow to deep.

Granular V1 Question Selection Defaults
- Real-world interview bias to emulate:
  - start with broad ownership or overview question
  - move into why/how questions
  - then test tradeoffs and failure cases
  - finally test consistency or breadth
- Default question progression on a strong project branch:
  - `ownership_probe`
  - `why_choice`
  - `how_it_works`
  - `tradeoff_probe`
  - `failure_mode_probe`
- Default question progression on a weak or suspicious branch:
  - `clarifying ownership`
  - `how_it_works`
  - `contradiction_check`
  - `tradeoff_probe`
- `definition_check` should be used mainly when:
  - the candidate invoked a concept without explaining it
  - correctness is uncertain
  - a quick calibration is needed

Granular V1 Decisions for LLM Prompt Contract
- Each turn should use a structured prompt contract with these sections:
  - interviewer role
  - behavioral rules
  - candidate summary
  - JD summary
  - current interview state
  - current branch
  - top pending branches
  - recent conversation window
  - next-step objective
  - output format instructions
- The LLM output per turn should include:
  - selected branch id
  - selected question class
  - reasoning for why this branch was chosen
  - next interviewer question
  - optional tiny hint text if requested and allowed
  - score observations from the candidate answer
  - any new claims detected
  - any contradiction suspicion detected
- The application should validate this structured output.
- If required fields are missing or invalid, the app should reject the output and retry with a stricter formatting prompt.

Granular V1 Prompt Suite
- V1 should use distinct prompt templates for:
  - resume/JD extraction
  - branch generation
  - next-question generation
  - answer scoring
  - final report synthesis
  - fallback simplified questioning
- Prompt responsibilities should stay narrow:
  - extraction prompts extract
  - questioning prompts question
  - scoring prompts score
  - report prompts summarize evidence
- The application should avoid a single monolithic prompt doing every task.

Granular V1 Structured Output Defaults
- `branch generation` output should return:
  - new branches
  - linked claims
  - branch rationale
- `next-question generation` output should return:
  - branch id
  - question class
  - interviewer utterance
  - optional hint
  - reasoning note
- `answer scoring` output should return:
  - updated per-dimension scores
  - evidence items
  - contradiction suspicion
  - branch status recommendation
- `final report synthesis` output should return:
  - final verdict
  - overall score
  - topic summaries
  - strengths
  - weaknesses
  - ideal answer guidance
  - improvement plan

Granular V1 Transcript Handling
- After STT, the transcript should be shown briefly for confirmation.
- In V1, the candidate should be allowed to:
  - accept transcript
  - re-record answer
- Free-form manual transcript editing should be avoided in V1 because it weakens authenticity.
- If technical terms are misheard repeatedly, the UI may offer a `speak again` or `use keyword correction` fallback in a later version, but V1 should keep this simple.

Granular V1 UX Decisions
- The pre-interview review screen should show:
  - extracted candidate summary
  - extracted JD summary
  - editable confirmation checkpoints for low-confidence fields
  - chosen track and configuration
- Transcript confirmation should happen immediately after each answer and before the engine finalizes that turn.
- The report should be shown section-by-section in a scannable layout rather than one long block of text.
- V1 does not need a voice-readout of the final report.

Granular V1 Screen Flow Defaults
- Minimum V1 screens:
  - landing / start interview
  - upload and extraction review
  - interview configuration
  - live interview
  - transcript confirmation overlay
  - final report
  - session history
- The live interview screen should show:
  - current AI question
  - recording state
  - elapsed and remaining time
  - candidate control buttons
  - current transcript after STT
- The final report screen should surface the overall verdict and top improvement areas first.

Granular V1 Session Persistence
- The system should persist:
  - uploaded resume/JD summaries
  - session config
  - transcript
  - branch tree summary
  - topic scorecards
  - final report
- Previous sessions may be shown in history.
- V1 should not automatically personalize future interviews deeply from old sessions, but it may show past weak areas in the dashboard later.

Granular V1 Persistence Defaults
- Branch trees should be persisted as summaries, not necessarily as every transient internal scoring artifact.
- Full turn transcripts should be stored for completed and interrupted sessions.
- Abandoned sessions before meaningful interview progress may be stored with minimal metadata only.

Granular V1 Edge-Case Handling
- If resume extraction fails, ask the user to re-upload or manually confirm profile details.
- If JD extraction fails, allow pasted JD text or sample JD selection.
- If the candidate gives repeated one-line answers, the interviewer should first prompt for elaboration, then score depth accordingly if the pattern continues.
- If the LLM proposes a repetitive or low-value follow-up, the application should reject it and ask for another question using the existing branch priorities.
- If branch explosion occurs, only the top-scored pending branches should remain active and the rest should be dropped or deferred.

Granular V1 Failure Recovery
- If STT fails for a turn:
  - allow one immediate retry
  - if retry fails, offer skip or continue later
- If TTS fails:
  - show the question text and allow the user to continue the voice answer flow
- If the LLM response is malformed:
  - retry once with the same state
  - if it fails again, fall back to a simpler direct follow-up generation prompt
- The interview engine should checkpoint state after every completed turn.
- If the session crashes mid-interview, V1 may offer resume from last stable turn if session state was saved successfully.

Granular V1 Failure Thresholds
- If STT fails `3` times within one session, the system should recommend ending or restarting the session.
- If malformed LLM output occurs twice consecutively, the engine should enter simplified fallback mode for that turn.
- If both normal and fallback generation fail for a turn, the session should be marked `interrupted` rather than `failed`, and the user should be offered retry or resume later.
- Session status values in V1:
  - `not_started`
  - `in_progress`
  - `completed`
  - `interrupted`
  - `abandoned`
  - `failed_setup`

Granular V1 Guardrail Policy
- The interviewer should not fabricate resume claims, project details, or JD requirements.
- If the grounding context is weak or ambiguous, the interviewer should ask a clarifying question instead of assuming specifics.
- The interviewer may admit uncertainty internally through lower-confidence state, but user-facing questions should remain direct and composed.
- If a candidate gives nonsensical, evasive, or obviously fabricated answers, the interviewer should challenge them briefly and then record the weakness rather than endlessly argue.
- Guardrails should prefer evidence-backed probing over speculative questioning.

Granular V1 Algorithm Defaults
- Branch manager algorithm:
  - parse latest answer
  - extract candidate claims
  - update contradictions
  - update active branch evidence
  - generate candidate child branches
  - score all candidate branches
  - pick next branch according to priority and continuity
- Coverage scheduler algorithm:
  - track covered major topics
  - compare against phase target and remaining time
  - if over-invested in one branch family, force breadth expansion
- Contradiction detector algorithm:
  - compare normalized new claims against prior normalized claims
  - compare against uploaded resume/JD extracted facts
  - flag only when semantic mismatch is meaningful, not merely wording variation
- Session pacing algorithm:
  - as time decreases, increase breadth bias and reduce depth bias
  - preserve one unresolved contradiction branch if it is core and high value

Granular V1 Abort and Recovery Defaults
- A session should be marked `abandoned` if the candidate exits before completing at least `3` accepted turns.
- A session should be marked `interrupted` if a technical failure occurs after meaningful progress.
- A session should be marked `failed_setup` if resume/JD extraction or configuration never completes.

Granular V1 Wrap-Up Strategy
- During the final phase, the interviewer should prioritize:
  - unresolved high-value contradiction if one exists
  - one reflective question such as `What would you improve if you rebuilt this?`
  - one concise final coverage question if a key area was underexplored
- The wrap-up should avoid opening entirely new deep branches unless the missing area is critical.

Granular V1 Success Criteria
- The product should feel meaningfully better than a generic chatbot interview.
- Practical success indicators for V1:
  - users feel the AI asked relevant cross-questions
  - users feel weak answers were actually challenged
  - users feel the report is actionable
  - average turn latency remains acceptable for spoken interaction
  - the interview usually covers multiple meaningful branches without feeling random

Granular V1 Design Boundary
- The abstract requirements document is now allowed to contain implementation-facing defaults, but should still stop short of framework-specific code structure.
- Anything beyond this level should move into:
  - PRD
  - engine spec
  - system design
  - API/schema docs

Out of Scope for V1
- DSA live coding interviews
- Recruiter-first workflow
- Multi-domain interviewing outside SWE
- Mid-answer live interruption behavior

MVP Summary
- Candidate uploads resume and JD
- Candidate selects interview config
- AI starts a voice-first mock SWE interview
- Every answer is parsed into claims, tools, decisions, and tradeoffs
- AI builds and maintains a follow-up question tree
- AI chooses high-value branches and probes intelligently
- AI tracks explored/unexplored nodes and contradictions
- Session ends with structured feedback and scoring
