# AI Usage Log

This file is required by the hackathon submission rules (Stage 1 eligibility
+ Stage 2 authenticity review). Keep a running, honest log of prompts used
with AI tools while building this project — judges cross-check this against
your commit history, so it should track real development, not be written
after the fact.

Suggested format per entry:

```
## <date/time>
Tool: Claude / Claude Code / Cursor / etc.
Prompt: <what you asked>
What it produced / what you kept vs. changed:
Files touched:
```

---

## Example (replace with your real log)

## 2026-08-08 — initial scaffold
Tool: Claude
Prompt: "Build the project plan and initial scaffold for Star Interview: an
adaptive spoken interview agent over the AI Cohort curriculum, per the
technical spec and hackathon brief."
What it produced / what you kept vs. changed: generated PROJECT_PLAN.md,
backend (Express + adaptive planner/grader/feedback), and the frontend
camera + voice UI. Kept the architecture as-is; iterated on the grading
thresholds after testing (see next entry).

## 2026-08-08 — grading calibration
Tool: Claude
Prompt: "Simulate a full interview run and tune the follow-up trigger — it's
firing on every question."
What it produced / what you kept vs. changed: reduced keyword-vocabulary
noise in `planner.js#keyTerms` (capped to 8 salient terms, expanded
stopword list) and rebalanced `grader.js` scoring weights so on-topic
answers pass without over-triggering follow-ups. Verified via a scripted
end-to-end run against the live server.

## 2026-08-08 — gemini api integration
Tool: Antigravity (Gemini 3.6 Flash)
Prompt: "replace the anthropic and set gimini api then start"
What it produced / what you kept vs. changed: Installed `@google/genai`, updated `backend/lib/llm.js` to use `GoogleGenAI` with model `gemini-2.0-flash` and default key configuration, updated `package.json` and `README.md`, verified server startup and graceful template fallback.

---

