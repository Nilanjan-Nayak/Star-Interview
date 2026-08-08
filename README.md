# ★ Star Interview
<img width="512" height="512" alt="star-interview-professional-icon-only" src="https://github.com/user-attachments/assets/0cd09068-8b35-460d-92af-7a3d1ffdbd40" />

An AI interview agent that conducts a live, spoken, adaptive technical
interview based on a candidate's actual progress through the AI Cohort
curriculum. Full concept and architecture notes: see `PROJECT_PLAN.md`.

```
star-interview/
├── PROJECT_PLAN.md          concept, architecture, flow
├── PROMPTS.md                AI usage log (hackathon requirement)
├── backend/
│   ├── server.js             POST /api/interview (the required contract)
│   ├── lib/
│   │   ├── data.js           loads curriculum.json / candidates.json
│   │   ├── planner.js        adaptive question plan builder
│   │   ├── grader.js         answer scoring + follow-up decision
│   │   ├── feedback.js       deterministic final feedback synthesis
│   │   └── llm.js            optional Claude-powered mode
│   └── data/                 curriculum.json, candidates.json
└── frontend/
    └── index.html            camera + voice interview UI (no build step)
```

## Run it locally

```bash
cd backend
npm install
npm start        # -> http://localhost:3000
```

Open `http://localhost:3000` in Chrome or Edge (best Web Speech API support).
The backend also serves the frontend directly, so this one command runs the
whole app.

### Gemini API / LLM mode

The agent connects to **Gemini API** (`@google/genai`) with Gemini 2.0 Flash (`gemini-2.0-flash`). If the Gemini API call succeeds, Gemini generates live follow-ups, verdicts, and final narrative feedback. If the key is unavailable or quota-exhausted, it gracefully degrades to deterministic templates.

```bash
export GEMINI_API_KEY=YOUR_GEMINI_API_KEY
# optional, defaults to gemini-2.0-flash
export GEMINI_MODEL=gemini-2.0-flash
npm start
```



Check `GET /api/health` to confirm which mode is active.

## Using the API directly

```bash
# 1. start a session
curl -X POST localhost:3000/api/interview -H "Content-Type: application/json" \
  -d '{"sessionId":"demo-1","candidate": <candidate.json entry>}'

# 2. pick a difficulty
curl -X POST localhost:3000/api/interview -H "Content-Type: application/json" \
  -d '{"sessionId":"demo-1","message":"medium"}'

# 3. answer each question
curl -X POST localhost:3000/api/interview -H "Content-Type: application/json" \
  -d '{"sessionId":"demo-1","message":"<candidate answer text>"}'
```

The interview guarantees **≥8 questions across ≥4 distinct curriculum days**,
adds a targeted follow-up whenever an answer is thin or misses the topic's key
terms, and returns `done: true` with a structured `feedback` object
(`summary`, `strengths`, `gaps`, `next`) on the final turn.

## Deploying for the live demo URL

Anywhere that runs Node works (Render, Railway, Fly.io, a VM). Since the
Express server also serves `frontend/index.html`, one deploy gives you both
the required API and a working live demo at the same URL — set
`ANTHROPIC_API_KEY` as an environment variable there if you want LLM mode in
the hosted demo.

## Notes

- Voice is used for interaction only — no audio is stored; only the
  transcribed text is sent to the backend and analyzed.
- No auth, no database, no persistent accounts — matches the challenge's
  "out of scope" list.
- Candidate data and curriculum are the synthetic files provided for the
  challenge (`candidates.json`, `curriculum.json`), loaded straight from
  `backend/data/`.
