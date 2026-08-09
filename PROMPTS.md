# 🌟 Star Interview — AI Usage Log & Prompt History

This file is required by the hackathon submission rules (Stage 1 eligibility + Stage 2 authenticity review). It maintains an honest, chronological log of prompts and AI tools utilized while building **Star Interview** — an AI Technical Interviewer Platform powered by Google Gemini 2.0 Flash (`gemini-2.0-flash`).

---

## 📌 Submission Format Specification

Each entry records:
- **Date & Phase:** Timestamp and feature focus
- **AI Tool:** Model / Agent utilized
- **User Prompt:** Exact instruction provided
- **Output & Modifications:** Code changes, files touched, and verification

---

## 📅 Chronological Development & AI Prompt Log

### 2026-08-08 — Initial Scaffold
- **Tool:** Claude
- **Prompt:** `"Build the project plan and initial scaffold for Star Interview: an adaptive spoken interview agent over the AI Cohort curriculum, per the technical spec and hackathon brief."`
- **What it produced / what was kept vs. changed:** Generated `PROJECT_PLAN.md`, backend (Express + adaptive planner/grader/feedback), and frontend camera + voice UI. Kept architecture as-is; iterated on grading thresholds after testing.
- **Files touched:** `PROJECT_PLAN.md`, `backend/server.js`, `backend/lib/planner.js`, `backend/lib/grader.js`, `backend/lib/feedback.js`, `frontend/index.html`.

---

### 2026-08-08 — Grading Calibration
- **Tool:** Claude
- **Prompt:** `"Simulate a full interview run and tune the follow-up trigger — it's firing on every question."`
- **What it produced / what was kept vs. changed:** Reduced keyword-vocabulary noise in `planner.js#keyTerms` (capped to 8 salient terms, expanded stopword list) and rebalanced `grader.js` scoring weights so on-topic answers pass without over-triggering follow-ups. Verified via scripted end-to-end run against live server.
- **Files touched:** `backend/lib/planner.js`, `backend/lib/grader.js`.

---

### 2026-08-08 — Gemini API Integration
- **Tool:** Antigravity (Gemini 3.6 Flash)
- **Prompt:** `"replace the anthropic and set gimini api then start"`
- **What it produced / what was kept vs. changed:** Installed `@google/genai`, updated `backend/lib/llm.js` to use `GoogleGenAI` with model `gemini-2.0-flash` and default key configuration, updated `package.json` and `README.md`, verified server startup and graceful template fallback.
- **Files touched:** `backend/package.json`, `backend/lib/llm.js`, `README.md`.

---

### 2026-08-08 — UI & Header Connection Cleanup
- **Tool:** Antigravity AI
- **Prompt:** `"this are the export btn was remove and connection was remove only expot btn"`
- **What it produced / what was kept vs. changed:** Removed static export button and cleaned up header connection status badges in `frontend/index.html`.
- **Files touched:** `frontend/index.html`.

---

### 2026-08-08 — Speech Turn Utterance Synchronization
- **Tool:** Antigravity AI
- **Prompt:** `"system will be next qustion not properly speak . he is only speak 1st section analyase but 2nd qustion alsow speak"`
- **What it produced / what was kept vs. changed:** Combined interviewer verdict feedback analysis and next question text into a single continuous Web Speech Synthesis TTS utterance in `frontend/index.html`.
- **Files touched:** `frontend/index.html`.

---

### 2026-08-08 — Question Header Text Cleanup
- **Tool:** Antigravity AI
- **Prompt:** `"Let's start with Day 12, why this are text are show"`
- **What it produced / what was kept vs. changed:** Stripped `Day X` prefixes from TTS speech utterances so the interviewer speaks question prompts directly.
- **Files touched:** `frontend/index.html`.

---

### 2026-08-08 — Single-Tab Anti-Cheating & Security Safeguard
- **Tool:** Antigravity AI
- **Prompt:** `"When this interview happens, no one should expect to go from one tab to another and then no one should be able to close that tab. Whenever this is done, the interview will automatically be canceled and a properly professional message will appear..."`
- **What it produced / what was kept vs. changed:** Implemented `visibilitychange`, `blur`, and `beforeunload` security event listeners. Triggered full-screen session nullification modal with security audit details when tab focus is lost.
- **Files touched:** `frontend/index.html`.

---

### 2026-08-08 — Remote Repository Push
- **Tool:** Antigravity AI
- **Prompt:** `"connect this git and push it 'https://github.com/Nilanjan-Nayak/Star-Interview.git'"`
- **What it produced / what was kept vs. changed:** Connected remote git origin `https://github.com/Nilanjan-Nayak/Star-Interview.git` and synchronized main branch.
- **Files touched:** `.git/config`.

---

### 2026-08-08 — Camera HUD Layout & Dark Styling
- **Tool:** Antigravity AI
- **Prompt:** `"The camera here, if you make it a little smaller, it will look more professional, and the background of that camera and the background of the interview on that side. So that they are the same..."`
- **What it produced / what was kept vs. changed:** Compacted camera frame dimensions, matched dark backdrop colors across left camera pane and right studio pane.
- **Files touched:** `frontend/index.html`.

---

### 2026-08-08 — Gemini API Key Configuration
- **Tool:** Antigravity AI
- **Prompt:** `"set this gimini api key 'AQ.Ab8RN6JmF...'"`
- **What it produced / what was kept vs. changed:** Updated `backend/.env` with `GEMINI_API_KEY` and verified `gemini-2.0-flash` backend execution.
- **Files touched:** `backend/.env`.

---

### 2026-08-08 — Removal of Hint and Log Features
- **Tool:** Antigravity AI
- **Prompt:** `"there are the 2 feachers remove 'hint,log'"`
- **What it produced / what was kept vs. changed:** Removed Hint (`#hintBtn`) and Log (`#transcriptToggleBtn`) buttons and popup containers from `frontend/index.html`.
- **Files touched:** `frontend/index.html`.

---

### 2026-08-08 — Real-Time Video Frame Eye Contact Tracking Engine
- **Tool:** Antigravity AI
- **Prompt:** `"this feacher was not accuratly work . so please accurate type of create"`
- **What it produced / what was kept vs. changed:** Built an HTML5 canvas video frame sampler analyzing frame luminance, face alignment, and frame-to-frame pixel motion delta every 300ms. Restructured HUD card labels to prevent text smashing (`EYE CONTACT` `GOOD`).
- **Files touched:** `frontend/index.html`.

---

### 2026-08-09 — Root Workspace Package Config & Startup URL
- **Tool:** Antigravity AI
- **Prompt:** `"this are the run is correct but i am not view in 'http://localhost:3000' this type of set"`
- **What it produced / what was kept vs. changed:** Added root `package.json` for direct `npm start` execution from root directory and updated `backend/server.js` startup logs to print clickable `http://localhost:3000` banner.
- **Files touched:** `package.json`, `backend/server.js`.

---

### 2026-08-09 — Clean Setup View & Animated Agent Background
- **Tool:** Antigravity AI
- **Prompt:** `"please this design impre improve but no any unwanted element set.design was simple and backgroun attractive agenr animate type create"`
- **What it produced / what was kept vs. changed:** Streamlined candidate setup view by removing promotional clutter chips, and added fluid glowing ambient background canvas (`.ambient-bg`) with floating mesh blobs.
- **Files touched:** `frontend/index.html`.

---

### 2026-08-09 — Camera Overlay Text Cleanup
- **Tool:** Antigravity AI
- **Prompt:** `"this are the read mark section please revove only dos't any remove"`
- **What it produced / what was kept vs. changed:** Removed `#apiStatusChip`, `COACHING ON` text, `#timecode` timestamp span, and `DAY 10 — ` topic tag prefix while preserving camera feed, HUD metrics, and timer.
- **Files touched:** `frontend/index.html`.

---

### 2026-08-09 — Candidate Setup Dropdown Null Guard Fix
- **Tool:** Antigravity AI
- **Prompt:** `"this are the main section was not working so please fix that problem"`
- **What it produced / what was kept vs. changed:** Added null guards inside `checkAPI()` to prevent `TypeError` when optional HUD elements are removed, restoring candidate select dropdown and profile card rendering.
- **Files touched:** `frontend/index.html`.

---

### 2026-08-09 — Complete Documentation & README Generation
- **Tool:** Antigravity AI
- **Prompt:** `"Well, whatever I have done so far or for so long, create the peompt.md file professionally and I want to upload this project to github, so create the readme.md file professionally..."`
- **What it produced / what was kept vs. changed:** Generated `PROMPT.md` system prompt specification, `README.md` for GitHub repository, and updated `PROMPTS.md` AI usage log while preserving all original historical entries verbatim.
- **Files touched:** `PROMPT.md`, `PROMPTS.md`, `README.md`.

---

<div align="center">
  <sub>Authentic AI Development Log • Star Interview Project</sub>
</div>
