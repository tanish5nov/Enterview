Project: AI SWE Mock Interviewer

Document Purpose
- Define the V1 product flow and screen-by-screen UX behavior.
- Cover only candidate-facing UX for V1.

UX Principles
- Keep the experience focused and low-friction.
- Make the interview feel serious, not playful.
- Surface clarity over decoration.
- Show enough system transparency that the candidate trusts the report.
- Prefer the smallest possible number of screens and controls in V1.
- Default to simple layouts, obvious actions, and minimal cognitive load.

Primary V1 Screens
- Landing / Start Interview
- Upload and Extraction Review
- Interview Configuration
- Live Interview
- Transcript Confirmation
- Final Report
- Session History

Screen 1: Landing / Start Interview
Purpose
- Explain the product value quickly.
- Let the candidate start a new mock interview or view past sessions.

Primary UI Elements
- product headline
- short description of branching mock interview behavior
- `Start Interview` CTA
- `View History` CTA
- optional short note about required inputs:
  - resume
  - JD or sample JD

Key UX Notes
- The landing page should make it clear this is not a generic chatbot.
- Messaging should emphasize:
  - adaptive follow-ups
  - voice-first interaction
  - structured final feedback
- Keep this page very short. One clear CTA matters more than extra explanation.

Screen 2: Upload and Extraction Review
Purpose
- Collect resume and JD.
- Let the user confirm extracted context before interview start.

Flow
1. Upload resume.
2. Upload JD or choose sample JD.
3. App extracts structured data.
4. User reviews extracted candidate and JD summaries.
5. Low-confidence fields are highlighted for confirmation.

Primary UI Elements
- resume upload
- JD upload
- sample JD picker
- extracted candidate summary
- extracted JD summary
- low-confidence warnings
- `Looks Good` CTA
- `Re-upload` CTA

Review Fields
- candidate name
- years of experience estimate
- roles
- top project(s)
- claimed tools/skills
- role title from JD
- required skills
- preferred skills

UX Rules
- The user should not need to fix every field manually.
- The review should act as confirmation, not a full profile editor.
- If extraction quality is too poor, block progression and ask for better input.
- Keep the review on the same screen as upload if possible. Avoid a multi-step wizard unless necessary.

Screen 3: Interview Configuration
Purpose
- Let the candidate configure the interview style.

Primary UI Elements
- track selector:
  - resume/project deep dive
  - backend
  - frontend
  - system design lite
- difficulty selector:
  - easy
  - medium
  - roast
- interviewer mode:
  - strict
  - coach
- hint mode:
  - off
  - minimal
  - on-demand
- company type:
  - servicebased
  - productbased
  - startup
- duration selector:
  - 15
  - 30
  - 45
  - 60 minutes
- `Start Interview` CTA

UX Rules
- Use clear helper text for each mode.
- Avoid too many advanced controls in V1.
- Config choices should feel intentional, not overwhelming.
- Keep all config fields on one compact screen.
- Use sensible defaults so the user can start quickly without touching every option.

Screen 4: Live Interview
Purpose
- Run the voice-first mock interview.

Primary UI Elements
- current AI question card
- voice playback / speaking indicator
- microphone recording state
- elapsed time
- remaining time
- transcript preview region
- control buttons:
  - repeat question
  - give small hint
  - skip
  - end interview

Live Interaction States
- AI speaking
- waiting for candidate
- recording candidate answer
- transcribing
- awaiting transcript confirmation
- thinking / preparing next question
- fallback recovery

UX Rules
- The screen should always make it obvious what the system is doing now.
- The current question should remain visible while the candidate answers.
- Control buttons should stay accessible but not distracting.
- The candidate should not see internal branch graph or scores during the interview.
- The live screen should stay visually sparse:
  - one question area
  - one recording/transcript area
  - one small controls row
  - one timer area
- Avoid side panels, dense metadata, or live analytics in V1.

Transcript Confirmation Overlay
Purpose
- Confirm the accepted transcript before scoring and next turn generation.

When It Appears
- Immediately after STT completes for the current answer.

Primary UI Elements
- transcript text
- `Use This Answer`
- `Re-record`

UX Rules
- Keep this overlay lightweight and fast.
- Do not allow manual transcript rewriting in V1.
- If the transcript is obviously wrong, the candidate should re-record.
- If STT quality is good enough, this can be a compact inline confirmation instead of a full modal.

Screen 5: Final Report
Purpose
- Deliver a clear, evidence-backed summary of performance.

Report Ordering
1. overall verdict
2. overall score
3. top strengths
4. top weak areas
5. topic-wise breakdown
6. contradictions observed
7. ideal answer guidance
8. improvement plan
9. recommended next practice areas

Primary UI Elements
- verdict banner
- score card
- strengths section
- weak areas section
- topic list
- improvement checklist
- retry CTAs:
  - retry same config
  - retry harder
- `View History`

UX Rules
- Put the highest-signal summary at the top.
- The report should be scannable first, detailed second.
- Topic rows/items should show:
  - topic label
  - score
  - key evidence summary
- Contradictions should be framed constructively, not punitively.
- Do not overload the report with too many sections above the fold. Show verdict, score, strengths, weak areas first.

Screen 6: Session History
Purpose
- Let the candidate review past interview sessions.

Primary UI Elements
- session list
- filters by track/difficulty if needed later
- entry details:
  - date
  - track
  - duration
  - score
  - verdict
  - top weak areas
- `Open Report`
- `Retry`

UX Rules
- V1 history can be simple list-first UI.
- Prioritize easy scan over analytics-heavy dashboarding.
- Do not build charts or progress dashboards in V1.

Core User Journey
1. User lands on home page.
2. User starts new interview.
3. User uploads resume and JD or chooses sample JD.
4. User confirms extracted summaries.
5. User selects interview configuration.
6. User completes voice interview.
7. User confirms each transcript turn.
8. User receives final report.
9. User retries or views past sessions.

Transcript Behavior
- The accepted transcript is the only transcript that enters scoring.
- Re-record replaces the pending answer for that turn.
- No free editing in V1.

Interview Controls Behavior
- `repeat question`
  - first use repeats exactly
  - second use may paraphrase
- `give small hint`
  - returns one short directional hint only
- `skip`
  - immediately closes the current answer turn and logs the skip
- `end interview`
  - asks for confirmation, then proceeds to report generation

Visual Tone
- The interface should feel rigorous and professional.
- Avoid playful assistant aesthetics.
- Use clear hierarchy, timers, and stable layout.
- Favor a simple app-like interface over a flashy AI product aesthetic.

Edge UX Cases
- If upload parsing fails:
  - show specific reason
  - offer re-upload
- If STT fails:
  - show retry state without losing the current question
- If LLM turn generation fails:
  - show short `Thinking... retrying` state
  - avoid exposing technical errors unless recovery fails
- If session is interrupted:
  - offer `Resume from last stable turn` when possible

Out of Scope for V1 UX
- recruiter dashboard
- collaborative sharing
- live coding editor
- voice summary of the report
- deep analytics dashboards

V1 Simplicity Defaults
- Prefer a 5-screen effective flow:
  - landing
  - upload + review
  - config
  - live interview
  - final report
- Treat transcript confirmation as part of the live interview flow, not a separate heavy screen.
- Treat session history as secondary and keep it minimal.
- Every screen should answer one primary question only:
  - landing: start or not?
  - upload/review: is context correct?
  - config: how should interview run?
  - live: what is happening right now?
  - report: how did I do and what should I improve?

Design Boundary
- This document defines the candidate-facing flow.
- Wireframes, component inventory, and visual system details can be added later if needed.
