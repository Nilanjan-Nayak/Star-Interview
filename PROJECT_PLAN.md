# Star Interview — Project Plan

## 1. Concept

**Star Interview** is an AI interview agent that runs a live, spoken, adaptive
technical interview based on a candidate's *actual* progress through the AI
Cohort curriculum — not a static question bank.

The core idea that makes it different from a "chatbot that asks questions":

- **The agent reads the candidate before it reads the question.** It looks at
  which days a candidate struggled on (`attempts > 2`), skipped, or breezed
  through (`attempts === 1`), and biases question difficulty and topic choice
  toward the candidate's real learning signal — the same way a good human
  interviewer skims a resume and probes the weak spots.
- **The agent listens, judges, and decides live.** Every answer is scored
  against the day's actual learning objectives and tools from `curriculum.json`.
  Depending on the score, the agent either (a) moves on, (b) asks a targeted
  follow-up to probe a shaky answer, or (c) gives a short correction and moves
  on — mirroring the "listen → verdict → next" loop the brief describes.
- **It's a real spoken interview**, not a text form: the interviewer speaks
  (TTS), the camera stays on, the candidate answers out loud (live STT
  captioning), and the agent's verdict is visible + spoken before the next
  question — voice is used for interaction only (out of scope: it is not
  stored as audio, only transcribed text is analyzed, so there's no persistent
  voice data or auth surface to build).

## 2. Architecture

```
┌─────────────────────────────┐        POST /api/interview        ┌──────────────────────────────┐
│         Frontend            │ ─────────────────────────────────▶│           Backend             │
│  (single-page, vanilla JS)  │                                    │  Node.js + Express             │
│                              │◀───────────────────────────────── │                                │
│  • camera feed (getUserMedia)        {reply, done, feedback?}    │  • Session Manager (in-memory) │
│  • Web Speech: TTS (agent voice)                                 │  • Question Planner            │
│  • Web Speech: STT (live captions)                                │  • Answer Grader                │
│  • difficulty picker → topic view → Q/A loop → results dashboard │  • Follow-up Generator          │
└─────────────────────────────┘                                    │  • Feedback Synthesizer         │
                                                                     │  • curriculum.json / candidates.json
                                                                     │  • optional: Claude API (LLM mode)
                                                                     └──────────────────────────────┘
```

**Single endpoint, stateful by `sessionId`** (per the technical spec): the
session object holds the candidate profile, the generated question plan, the
transcript, and running per-topic scores. No database needed — in-memory Map
is enough for a hackathon-scoped, non-persistent interview.

### Two grading/generation modes (graceful degradation)
- **LLM mode** (if `ANTHROPIC_API_KEY` is set): Claude generates natural
  follow-ups, phrases the interviewer's verdicts, and writes the final
  narrative feedback, grounded in the candidate's transcript + curriculum
  objectives (passed in as context, not invented).
- **Deterministic mode** (no key needed, always on as a fallback): a rules
  engine builds questions from each day's `objectives`/`tools`, grades answers
  by objective/tool keyword coverage + answer depth, and generates templated
  but personalized follow-ups and feedback.

This means the demo **always works live** even without API keys, and gets
noticeably sharper when an API key is present — a good hackathon hedge.

## 3. Interview Flow (state machine)

1. **`start`** — client posts `{sessionId, candidate}` → server builds a
   candidate profile snapshot + returns a welcome reply. No questions chosen
   yet (difficulty not known).
2. **`select_difficulty`** — client's first "message" turn is a structured
   pick (`easy` / `medium` / `hard`). Server builds the **question plan**:
   - Pull every curriculum day the candidate touched (passed, skipped, or
     attempted).
   - Score each day's "risk": skipped (highest), high attempts (medium),
     passed-first-try (low, but still eligible for a harder probe).
   - Select ≥8 questions spanning ≥4 distinct days, weighted toward risk,
     scaled to difficulty (easy = definitional, medium = applied/why, hard =
     trade-off/design/debug).
   - Returns question 1, agent "speaks" it.
3. **`answer` turns (repeated)** — client posts the transcribed spoken answer.
   Server grades it, decides: follow-up (same day, once max) or advance.
   Reply includes a short verdict line + the next question. `done: false`.
4. **`done`** — after the last question (and its follow-up, if any), server
   returns `done: true` with the full `feedback` object: `summary`,
   `strengths[]`, `gaps[]`, `next[]`, all computed from the transcript +
   candidate's original skipped/high-attempt topics — so the "gaps" the agent
   reports are checked against both what was said in the interview *and* what
   the candidate's own learning signals already flagged.

## 4. Minimum requirements → where they're met

| Requirement | Implementation |
|---|---|
| Conversational multi-turn interview | `/api/interview`, session state machine above |
| ≥8 questions, ≥4 curriculum days | Question Planner enforces both minimums |
| Follow-ups from previous responses | Answer Grader triggers targeted follow-up on weak/incomplete answers |
| Context maintained throughout | Full transcript + per-day scores held in session, passed to LLM mode when active |
| Structured feedback at the end | `feedback: {summary, strengths, gaps, next}` |
| Required HTTP endpoint | `POST /api/interview`, exact contract from technical-spec.md |

## 5. UI Design (see next message for visual spec + build)

Full-bleed split screen: candidate's camera on one side, the agent's
interview panel on the other. Difficulty selection → live topic view →
one-question-at-a-time spoken Q&A with real-time captions and an agent
verdict beat → final results dashboard with a per-topic performance chart.

## 6. Stack

- **Backend:** Node.js, Express, `@anthropic-ai/sdk` (optional LLM mode), no DB.
- **Frontend:** single HTML/CSS/JS file (no build step, hackathon-friction-free),
  Web Speech API (`SpeechSynthesis` + `SpeechRecognition`) for voice,
  `getUserMedia` for camera, Chart.js (CDN) for the results dashboard.
- **Deploy:** backend → Render/Railway/Fly, frontend → Vercel/Netlify (static),
  or serve both from the same Express app for a single live-demo URL.

## 7. Stretch ideas (if time allows)

- Confidence/pace signal from STT timing (long pauses, filler-word rate) shown
  as a soft "communication clarity" sub-score, not just correctness.
- "Interviewer persona" toggle (supportive vs. rigorous) that changes verdict
  tone and follow-up aggressiveness — same grading, different delivery.
- Export the final feedback as a shareable one-page PDF.
