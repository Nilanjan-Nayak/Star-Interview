# 🌟 Star Interview — System Prompt Engineering & Architecture Specification

> **Project Author:** Nilanjan Nayak  
> **LLM Engine:** Google Gemini 2.0 Flash (`gemini-2.0-flash`) via `@google/genai`  
> **Evaluation Methodology:** STAR Method (Situation, Task, Action, Result)  
> **Platform Version:** Pro Max Edition  

---

## 1. Executive Overview

**Star Interview** is an AI technical interviewer platform designed to conduct live, spoken, adaptive interviews over technical curricula. Powered by **Google Gemini 2.0 Flash**, the platform dynamically evaluates candidate responses using the **STAR methodology**, calculates live video frame engagement metrics (Eye Contact %, WPM pace, filler word frequency, speech energy), displays a **Real-Time STAR Method Progress Bar HUD (`S` -> `T` -> `A` -> `R`)**, enforces anti-cheating security safeguards, and generates structured executive feedback reports.

---

## 2. System Prompt Engineering Architecture

The AI engine employs a multi-stage prompt pipeline designed for deterministic structure, low-latency responses, and structured JSON outputs.

```
                  ┌──────────────────────────────────────────────┐
                  │          Candidate Response Input            │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │    Stage 1: Grader & Follow-Up Engine       │
                  │        (Evaluates STAR & Key Terms)          │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │    Stage 2: Adaptive Question Generator      │
                  │    (Picks Next Topic / Follow-Up Prompt)    │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │    Stage 3: Executive Feedback Synthesizer   │
                  │       (Overall Score, Strengths, Gaps)       │
                  └──────────────────────────────────────────────┘
```

---

### 2.1 Stage 1: Interviewer Persona & Question Prompting

**Role Definition:**
You are a Lead Staff Engineer and Technical Interviewer conducting a formal technical evaluation. Your persona is professional, encouraging, articulate, and highly focused on production trade-offs.

**Core Directives:**
1. **STAR Method Focus:** Prompt candidates to structure answers around **Situation, Task, Action, and Result**.
2. **Spoken Output Format:** Questions must be clear when spoken aloud via Web Speech Synthesis (TTS). Keep question turns under 60 words. Avoid code snippets or special symbols that render poorly in speech.
3. **Adaptive Probing:** If a candidate's answer is brief (<15 words) or misses key domain terms, probe deeper with a targeted follow-up before moving to the next topic.

#### Prompt Template (`backend/lib/planner.js` & `backend/lib/llm.js`):
```text
System: You are an expert technical interviewer evaluating a senior candidate for a high-impact engineering role.

Context:
- Candidate: {candidate_name} ({job_role}, {years_experience} years exp)
- Current Topic: {topic_title}
- Question Index: {current_index} of {total_questions}
- Difficulty Level: {difficulty_level}

Instructions:
1. Review the candidate's previous response: "{candidate_answer}"
2. Evaluate technical depth against key terms: [{key_terms}]
3. If the response is thin or lacks trade-offs, ask a direct 1-sentence STAR follow-up question.
4. Otherwise, summarize the candidate's key point in 1 sentence and transition to the next curriculum question.
5. Return JSON format:
{
  "verdict": "Clear explanation of reducer vs state machine.",
  "followUp": false,
  "nextQuestion": "Let me ask about production error handling..."
}
```

---

### 2.2 Stage 2: Grader & Follow-Up Decision Engine

**Scoring Rubric (0 – 100):**
- **90 – 100 (Mastery):** Demonstrates deep architectural understanding, production trade-offs, edge-case mitigation, and structured STAR delivery.
- **70 – 89 (Competent):** Answers core question accurately; covers main technical terms; minor gaps in trade-offs or operational metrics.
- **50 – 69 (Developing):** Partially accurate; misses key domain terminology; lacks clear STAR structure or actionable results.
- **< 50 (Unsatisfactory):** Brief, off-topic, or incorrect response.

#### Prompt Template (`backend/lib/grader.js`):
```text
System: Act as an impartial AI technical grading engine.

Task: Evaluate candidate answer for Topic: "{topic_title}".
Expected Key Terms: [{key_terms}]

Input:
Candidate Answer: "{candidate_answer}"

Criteria:
1. Key Term Coverage: Calculate ratio of domain terms correctly utilized.
2. Depth & STAR Structure: Assess if Situation, Action, and Result are articulated.
3. Concise Verdict: Provide 1 sentence of constructive feedback.

Return JSON:
{
  "score": 85,
  "verdict": "Solid explanation of optimistic UI updates, but did not mention rollback state.",
  "needsFollowUp": false
}
```

---

### 2.3 Stage 3: Executive Feedback & Debrief Synthesizer

When all interview turns complete (`done: true`), Gemini synthesizes an executive summary report summarizing overall candidate readiness.

#### Prompt Template (`backend/lib/feedback.js`):
```text
System: You are a Principal Hiring Committee Director. Produce a comprehensive interview debrief.

Candidate Details:
- Name: {candidate_name}
- Role: {job_role}
- Full Interview Transcript:
{transcript_history}

Generate:
1. Overall Score (0-100) based on cumulative performance across all turns.
2. Narrative Summary (2-3 sentences analyzing overall technical readiness).
3. Top 3 Technical Strengths.
4. Top 2 Growth Gaps / Edge Cases Missed.
5. Top 3 Actionable Recommended Next Steps for candidate development.
6. Per-Topic Score Breakdown.

Return JSON Schema:
{
  "overall": 84,
  "summary": "Demonstrates strong foundational knowledge in React state architecture...",
  "strengths": ["Clear STAR structure", "Deep understanding of state machines", "Calm articulation"],
  "gaps": ["Error handling edge cases", "Safari cross-browser testing"],
  "next": ["Build retry queue with backoff", "Explore visual regression tools", "Add codemod migration scripts"],
  "perTopic": [{"topic": "React State", "score": 88}, {"topic": "Resilience", "score": 80}]
}
```

---

## 3. Real-Time HUD Coaching & Security Prompt System

### 3.1 Real-Time STAR Method Progress Bar HUD (`S` -> `T` -> `A` -> `R`)
- **Live Concept Detection:** Analyzes candidate speech transcription in real time.
- **Dynamic Chip Lighting:** As candidate articulates Situation, Task, Action, and Result components, individual STAR chips light up with glowing indigo badges and green checkmarks (`✓`).
- **Real-Time Score:** Displays `0 / 4` to `4 / 4` coverage counter.

### 3.2 Live Video Frame Eye Contact & Motion Tracking Engine
- **Canvas Sampling:** Samples live camera frames from `<video id="cam">` every 300ms onto a hidden 160x120 HTML5 canvas.
- **Luminance & Alignment:** Calculates pixel luminance (`0.299*R + 0.587*G + 0.114*B`) and frame-to-frame pixel delta (motion variance).
- **Metric Output:**
  - `eyeVal`: Dynamic percentage score (e.g. `85%–96%` when steady and centered, `50%–65%` when turning away, `25%` when camera covered).
  - `eyeStatus`: Classified as `GOOD` (>=75%), `FAIR` (>=55%), or `LOW` (<55%).
  - `eyeBar`: Dynamic progress bar colored in green (`var(--good)`), amber (`var(--warn)`), or red (`var(--bad)`).

### 3.3 Single-Tab Security & Anti-Cheating Protection
- **Visibility Detection:** Listens to `document.addEventListener('visibilitychange')`.
- **Focus Loss Protection:** Listens to `window.addEventListener('blur')`.
- **Unload Guard:** Intercepts `beforeunload` to prevent tab closing or window navigation during an active session.
- **Security Action:** Immediately halts TTS/speech recognition, invalidates the active session ID, and overlays a full-screen executive security modal:
  > *"Interview Terminated — Security Safeguard: Your technical interview session was automatically canceled due to a browser tab switch or window focus violation."*

---

## 4. Chronological Requirement & Development Log

| Requirement / Prompt | Implementation Solution | Files Modified |
| :--- | :--- | :--- |
| **01. Remove Export Button** | Removed static export buttons and cleaned up bottom toolbar. | `frontend/index.html` |
| **02. Synchronize TTS Speech Turn** | Ensured interviewer speaks both verdict feedback analysis and next question in a single continuous utterance. | `frontend/index.html` |
| **03. Remove "Day X" Text Display** | Removed `Day X — ` prefix from question topic tags and headers. | `frontend/index.html` |
| **04. Anti-Cheating & Tab Locking** | Implemented `visibilitychange` & `blur` event listeners with session nullification modal. | `frontend/index.html` |
| **05. Git Remote & Repository Push** | Connected remote repository `Nilanjan-Nayak/Star-Interview.git` and pushed main branch. | Git CLI |
| **06. Camera & Interface Styling** | Compacted camera container layout, aligned dark backdrop colors across left/right panes. | `frontend/index.html` |
| **07. Gemini 2.0 Flash Integration** | Integrated `@google/genai` API with `gemini-2.0-flash` model and fallback handling. | `backend/lib/llm.js`, `backend/.env` |
| **08. Remove Clutter Features** | Removed `Hint` and `Log` buttons and popup containers for a clean focus view. | `frontend/index.html` |
| **09. Fix Eye Contact % Calculation** | Built live HTML5 canvas video frame analyzer for dynamic Eye Contact tracking and fixed label spacing. | `frontend/index.html` |
| **10. Root Workspace Setup** | Added root `package.json` and clickable `http://localhost:3000` startup console banner. | `package.json`, `backend/server.js` |
| **11. Animated Ambient Background** | Added smooth, fluid ambient background canvas (`.ambient-bg`) with floating glowing mesh blobs. | `frontend/index.html` |
| **12. Live STAR Progress Bar HUD** | Built real-time STAR method progress indicator (`S` -> `T` -> `A` -> `R`) reacting live to transcript keywords. | `frontend/index.html` |

---

## 5. Summary & Verification

All prompt chains, scoring rubrics, security protocols, and real-time coaching engines operate in full compliance with the STAR evaluation standard and Gemini 2.0 Flash API capabilities.
