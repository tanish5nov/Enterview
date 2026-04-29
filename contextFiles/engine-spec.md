Project: AI SWE Mock Interviewer

Document Purpose
- Define the exact V1 interview engine behavior.
- Translate `abstractrequirements.md` into machine-oriented schemas, turn-loop rules, scoring logic, and fallback behavior.
- Keep this document product-agnostic enough to survive implementation refactors.

Principles
- The application owns interview control flow.
- The LLM assists with extraction, questioning, scoring hints, and report synthesis.
- State must be canonical outside the LLM.
- Branch selection, pacing, coverage, and verdict guardrails must be deterministic at the application layer.

Core Runtime Model
- One interview session contains:
  - candidate context
  - JD context
  - interview configuration
  - conversation turns
  - branch graph
  - normalized claims
  - contradiction registry
  - topic scorecards
  - final report data

Interview Phases
- `setup`
  - upload parsing, extraction review, config selection
- `warmup`
  - initial ownership/context calibration
- `primary_probe`
  - deep probing on primary track and high-value JD-aligned claims
- `coverage_probe`
  - breadth expansion, unresolved important branches, adjacent topics
- `wrapup`
  - contradiction resolution, reflection, final evidence gathering
- `completed`
  - final scoring/report complete

Session Status
- `not_started`
- `in_progress`
- `completed`
- `interrupted`
- `abandoned`
- `failed_setup`

Canonical State Schema
- The engine should maintain a canonical state object shaped conceptually like:

```json
{
  "session": {},
  "candidate_profile": {},
  "jd_profile": {},
  "conversation": [],
  "branches": [],
  "claims": [],
  "contradictions": [],
  "scorecards": [],
  "memory": {},
  "control": {},
  "report": null
}
```

Session Schema
```json
{
  "id": "sess_123",
  "status": "in_progress",
  "phase": "primary_probe",
  "track": "resume_project",
  "company_type": "startup",
  "difficulty": "medium",
  "interviewer_mode": "strict",
  "hint_mode": "on-demand",
  "duration_minutes": 30,
  "elapsed_seconds": 420,
  "remaining_seconds": 1380,
  "created_at": "2026-04-29T12:00:00Z",
  "started_at": "2026-04-29T12:01:00Z",
  "ended_at": null
}
```

Candidate Profile Schema
```json
{
  "name": "Candidate Name",
  "experience_band": "0_2_years",
  "years_experience_estimate": 1.5,
  "roles": [
    {
      "title": "Software Engineer Intern",
      "company": "ABC",
      "duration_text": "6 months"
    }
  ],
  "projects": [
    {
      "id": "proj_1",
      "name": "Flashcard Engine",
      "summary": "PDF to flashcard app",
      "claimed_tools": ["Next.js", "MongoDB", "Docker", "Ollama"],
      "raw_source_refs": ["resume:lines:12-17"]
    }
  ],
  "skills": ["Next.js", "MongoDB", "Docker"],
  "achievements": [],
  "education": []
}
```

JD Profile Schema
```json
{
  "role_title": "Backend Software Engineer",
  "seniority": "entry_level",
  "required_skills": ["Node.js", "Databases", "REST APIs"],
  "preferred_skills": ["Docker", "Redis"],
  "responsibilities": [
    "Build APIs",
    "Optimize backend performance"
  ],
  "company_type": "productbased",
  "raw_source_refs": ["jd:section:requirements"]
}
```

Conversation Turn Schema
```json
{
  "turn_number": 7,
  "question_id": "q_7",
  "speaker": "candidate",
  "question_text": "Why did you choose MongoDB over SQL for this project?",
  "transcript": "I needed flexibility because the schema could evolve...",
  "accepted_transcript": true,
  "started_at": "2026-04-29T12:08:00Z",
  "ended_at": "2026-04-29T12:08:42Z",
  "controls_used": []
}
```

Branch Schema
```json
{
  "id": "branch_mongodb_choice",
  "parent_id": "branch_project_stack",
  "topic_label": "MongoDB choice and tradeoffs",
  "source": "candidate_answer",
  "status": "active",
  "depth_level": 2,
  "priority_score": 0.81,
  "jd_relevance_score": 0.6,
  "contradiction_severity_score": 0.0,
  "weakness_score": 0.7,
  "role_importance_score": 1.0,
  "unexplored_claim_value_score": 0.8,
  "time_sensitivity_score": 0.4,
  "why_branch_matters": "Candidate used MongoDB in a core project and must justify tradeoffs.",
  "linked_claim_ids": ["claim_21", "claim_22"],
  "linked_contradiction_ids": [],
  "last_question_id": "q_7",
  "current_understanding_confidence": "medium"
}
```

Claim Schema
```json
{
  "id": "claim_21",
  "turn_number": 7,
  "raw_quote": "I chose MongoDB because the schema could evolve.",
  "normalized_meaning": "Candidate claims MongoDB was chosen for flexible schema evolution.",
  "topic": "database_choice",
  "claim_type": "made_decision",
  "extraction_confidence": 0.93,
  "linked_branch_id": "branch_mongodb_choice"
}
```

Contradiction Schema
```json
{
  "id": "contra_3",
  "category": "implementation_inconsistency",
  "related_claim_ids": ["claim_21", "claim_33"],
  "severity": 0.72,
  "status": "open",
  "explanation": "Candidate first said schema flexibility was the reason, later implied relational joins were central and planned from the start."
}
```

Scorecard Schema
```json
{
  "topic_id": "topic_database_choice",
  "topic_label": "Database choice and tradeoffs",
  "track_type": "primary",
  "dimension_scores": {
    "correctness": 7.5,
    "depth": 6.8,
    "tradeoff_reasoning": 7.2,
    "communication": 6.5,
    "consistency": 7.0
  },
  "weighted_topic_score": 7.05,
  "confidence_level": "medium",
  "confidence_modifier": 0.93,
  "evidence_ids": ["ev_4", "ev_5", "ev_6"]
}
```

Evidence Schema
```json
{
  "id": "ev_4",
  "topic_id": "topic_database_choice",
  "turn_number": 7,
  "question_excerpt": "Why did you choose MongoDB over SQL?",
  "answer_excerpt": "I needed flexibility because the schema could evolve.",
  "evidence_type": "tradeoff",
  "linked_claim_ids": ["claim_21"],
  "linked_contradiction_ids": [],
  "note": "Good practical reason, but answer did not compare query patterns or transactional tradeoffs."
}
```

Memory Schema
```json
{
  "strengths": ["Good ownership over project decisions"],
  "gaps": ["Weak articulation of database tradeoffs"],
  "unresolved_claims": ["Exact reason for choosing local SLM over API model"],
  "contradiction_summaries": [],
  "important_quotes": ["I chose MongoDB because the schema could evolve."]
}
```

Control Schema
```json
{
  "active_branch_id": "branch_mongodb_choice",
  "next_step_objective": "Test whether candidate understands SQL vs NoSQL tradeoffs beyond flexibility.",
  "wrapup_mode": false,
  "fallback_mode": false,
  "pending_user_control_request": null
}
```

Track Enum
- `resume_project`
- `backend`
- `frontend`
- `system_design_lite`

Branch Status Enum
- `unexplored`
- `active`
- `partially_explored`
- `sufficiently_explored`
- `dropped`
- `resolved`

Question Class Enum
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

Evidence Type Enum
- `strength`
- `gap`
- `contradiction`
- `tradeoff`
- `ownership`
- `clarification`

Turn Loop
1. AI asks a question.
2. Candidate answers by voice.
3. STT produces transcript.
4. Candidate accepts transcript or re-records.
5. Application updates conversation state.
6. Extraction/scoring pipeline runs on the accepted answer.
7. Branch manager updates active/pending branches.
8. Coverage scheduler checks phase and time.
9. Question generator chooses next branch + question class.
10. AI asks next question.

Answer Processing Pipeline
1. Accept transcript.
2. Extract candidate claims from latest answer.
3. Normalize and attach claims to branch/topics.
4. Compare new claims against prior claims and uploaded context.
5. Create or update contradictions if needed.
6. Score the latest answer contribution by dimension.
7. Add evidence items to relevant scorecards.
8. Update branch state.
9. Recompute priorities.

Branch Manager Algorithm
1. Read active branch and latest answer evidence.
2. Generate candidate child branches from:
  - extracted claims
  - unresolved JD-critical skills
  - contradictions
  - adjacent technical concepts
3. Normalize all candidate branches into the branch schema.
4. Compute priority for active and pending branches.
5. Apply continuity bonus to active branch if unresolved high-value probe remains.
6. Limit candidate branches considered this turn to top 5.
7. Choose:
  - continue active branch
  - switch to higher-priority branch
  - close branch and expand coverage

Priority Function
- Each branch gets a normalized weighted score:

```text
priority_score =
  0.25 * jd_relevance_score +
  0.25 * contradiction_severity_score +
  0.20 * weakness_score +
  0.15 * role_importance_score +
  0.10 * unexplored_claim_value_score +
  0.05 * time_sensitivity_score
```

- Then apply modifiers:
  - continuity bonus: `+0.05` to `+0.12`
  - low-confidence claim penalty: multiply by `0.8`
  - near-wrap-up breadth bias: reduce deep low-value branch scores

Contradiction Detection Logic
- Compare new normalized claims against:
  - previous session claims
  - extracted resume/project facts
  - earlier answers
- Only flag contradiction if mismatch is semantic and meaningful.
- Contradiction categories:
  - `factual_contradiction`
  - `resume_mismatch`
  - `role_inflation`
  - `implementation_inconsistency`
  - `tradeoff_inconsistency`
- Contradiction handling:
  - first create `open` contradiction
  - raise branch priority
  - ask clarifying follow-up
  - resolve or preserve based on answer

Branch Closure Rules
- Close branch immediately if:
  - low-complexity topic
  - strong correct answer
  - strong why/how/tradeoff evidence already present
- Usually require 2 to 4 follow-ups for medium/high-value branches.
- Mark branch repetitive if two consecutive follow-ups produce no new evidence.
- Near end of session, prefer adequate closure over exhaustive drilling.

Coverage Scheduler
- Coverage targets:
  - 15 min: 2 to 3 major topics
  - 30 min: 3 to 4 major topics
  - 45 min: 4 to 5 major topics
  - 60 min: 5 to 6 major topics
- Phase split defaults:
  - warmup: 10%
  - primary_probe: 50%
  - coverage_probe: 30%
  - wrapup: 10%
- Force breadth expansion if:
  - one branch family consumes >50% of total session
  - no new evidence from current branch
  - primary track already sufficiently explored

Phase Transition Rules
- `setup -> warmup`
  - after successful extraction review and config submission
- `warmup -> primary_probe`
  - after at least 1 accepted candidate answer and 1 calibrated ownership/context question
- `primary_probe -> coverage_probe`
  - after primary track has meaningful evidence or remaining time drops below phase threshold
- `coverage_probe -> wrapup`
  - when remaining time <= 20%
- `wrapup -> completed`
  - after final reflective/clarifying question and report synthesis kickoff

Question Selection Policy
- Strong branch default progression:
  - `ownership_probe`
  - `why_choice`
  - `how_it_works`
  - `tradeoff_probe`
  - `failure_mode_probe`
- Weak/suspicious branch default progression:
  - `ownership_probe`
  - `how_it_works`
  - `contradiction_check`
  - `tradeoff_probe`
- Use `definition_check` sparingly as calibration.

Scoring Model
- Dimension weights:
  - correctness: 30%
  - depth: 25%
  - tradeoff_reasoning: 20%
  - communication: 10%
  - consistency: 15%

Topic Score Formula
```text
topic_score_raw =
  0.30 * correctness +
  0.25 * depth +
  0.20 * tradeoff_reasoning +
  0.10 * communication +
  0.15 * consistency

topic_score = topic_score_raw * confidence_modifier
```

Confidence Modifiers
- `high`: `1.0`
- `medium`: `0.93`
- `low`: `0.85`

Overall Score Formula
```text
overall_score =
  0.70 * weighted_average(primary_track_topics) +
  0.30 * weighted_average(secondary_topics)
```

Verdict Mapping
- `<= 4.0`: Needs improvements
- `<= 6.0`: Can be considered for next round
- `<= 8.0`: Hire
- `<= 10.0`: Strongly hire

Verdict Guardrails
- One severe hard failure on core claimed experience caps verdict at `Needs improvements`.
- One moderate hard failure may cap verdict at `Can be considered for next round`.
- Hard failures include:
  - repeated confident contradictions on core project claims
  - inability to explain major resume-listed project choices

Early Stop Logic
- Session may end early only if:
  - minimum coverage achieved
  - no major high-priority unexplored branches remain
  - remaining time is not needed to resolve a core contradiction
- Minimum coverage:
  - 15 min session: 2 major topics
  - 30+ min session: 3 major topics

User Controls
- `repeat question`
  - first repeat uses same wording
  - second repeat may paraphrase
- `give small hint`
  - one directional hint only
- `skip`
  - recorded and penalizes depth/confidence if repeated on core topics
- `end interview`
  - triggers graceful wrap-up and report

Failure and Fallback Logic
- STT fails once:
  - allow retry
- STT fails 3 times in a session:
  - recommend restart/end
- malformed LLM output once:
  - retry with stricter format
- malformed LLM output twice:
  - switch to simplified fallback mode for the turn
- if turn generation still fails:
  - mark session `interrupted`

Fallback Mode
- Simplified direct follow-up generation.
- No branch expansion beyond top unresolved branch.
- Reduced reasoning payload.
- Preserve core session state.

Persistence Requirements
- Persist:
  - resume/JD summaries
  - config
  - accepted transcripts
  - branch summaries
  - scorecards
  - contradictions
  - final report
- Abandoned sessions before 3 accepted turns may store minimal metadata only.

Final Report Payload
```json
{
  "overall_score": 7.4,
  "verdict": "Hire",
  "evaluation_confidence": "medium",
  "strengths": [],
  "weak_areas": [],
  "topic_breakdown": [],
  "contradictions_observed": [],
  "ideal_answer_guidance": [],
  "improvement_plan": [],
  "recommended_next_practice_areas": []
}
```

Design Boundary
- This document defines engine behavior and contracts.
- API surface, storage architecture, and service decomposition belong in `systemdesign.md`.
