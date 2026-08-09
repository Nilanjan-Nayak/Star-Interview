# 🌟 Star Interview — AI Technical Interviewer Platform

<div align="center">

<img width="140" height="140" alt="Star Interview Logo" src="/img/star-interview-professional-icon-only.svg" />

### *An Intelligent, Voice-Driven Technical Interviewer Powered by Google Gemini 2.0 Flash*

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Google Gemini API](https://img.shields.io/badge/Google_Gemini-2.0_Flash-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![Web Speech API](https://img.shields.io/badge/Web_Speech_API-Voice_STT%2FTTS-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
[![STAR Method](https://img.shields.io/badge/Framework-STAR_Method-4F46E5?style=for-the-badge)](https://en.wikipedia.org/wiki/Situation,_task,_action,_result)

</div>

---

## 📌 Executive Summary

**Star Interview** is a state-of-the-art AI-powered technical interviewing platform designed to conduct live, adaptive, voice-driven evaluations of software engineering candidates.

Built around the **STAR Methodology (Situation, Task, Action, Result)** and integrated with **Google Gemini 2.0 Flash**, Star Interview dynamically generates contextual technical questions, probes candidate responses with intelligent follow-ups, analyzes real-time camera engagement metrics (Eye Contact %, Speech WPM pace, Filler Word count, Energy), enforces anti-cheating security safeguards, and synthesizes structured executive feedback debriefs with visual competency radar analytics.

---

## 🚀 Key Features & Innovations

### 🎙️ 1. Voice-Driven Conversational Studio
- **Speech Synthesis (TTS):** The AI interviewer speaks aloud each verdict analysis and question turn with natural voice cadence.
- **Continuous Speech Recognition (STT):** Real-time transcript rendering with audio-reactive soundwave visualizers (`AnalyserNode`).
- **Interactive Controls:** Toggle between voice speech and keyboard input at any time.

### 🤖 2. Adaptive Intelligence Powered by Gemini 2.0 Flash
- **Contextual Probing:** Evaluates technical depth against key domain terminology. If an answer is thin or incomplete, Gemini automatically generates a 1-sentence STAR follow-up question before advancing topics.
- **Multi-Level Difficulty Calibration:** Choose between **Easy** (definitions & concepts), **Medium** (applied scenario questions), and **Hard** (system design & production trade-offs under pressure).
- **Graceful Fallback:** Seamlessly operates with Google Gemini 2.0 Flash API (`@google/genai`), with an automatic deterministic template fallback if offline or unconfigured.

### 👁️ 3. Real-Time Video Frame Eye Contact & Motion Analyzer
- **HTML5 Canvas Pixel Engine:** Samples camera video frames (`<video id="cam">`) every 300ms on a 160x120 analysis canvas.
- **Dynamic Engagement Scoring:** Measures pixel luminance, face frame alignment, and frame-to-frame motion delta to compute accurate Eye Contact percentages (`GOOD` >=75%, `FAIR` >=55%, `LOW` <55%).

### 🛡️ 4. Anti-Cheating & Session Integrity Safeguard
- **Tab & Focus Loss Audit:** Intercepts browser visibility state changes (`visibilitychange`) and window focus loss (`blur`).
- **Instant Nullification Overlay:** Automatically cancels the session if a candidate attempts to switch tabs or minimize windows, displaying an official security audit modal.
- **Unload Guard:** Protects candidates from accidental tab closure during active sessions (`beforeunload`).

### 📊 5. Executive Debrief & Radar Analytics
- **Overall Score Calculation (0 – 100):** Synthesizes cumulative candidate performance across all turns.
- **Competency Radar Chart:** Visualizes per-topic performance metrics using Chart.js.
- **Actionable Insights:** Generates top technical strengths, identified growth gaps, and recommended next steps for developer progression.
- **Export Options:** Download complete transcript as `.txt` or print clean `.pdf` reports.

---

## 🏗️ System Architecture & Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Camera + Voice Studio)                 │
│  - Web Speech API (Speech Recognition + SpeechSynthesis Utterance)          │
│  - HTML5 Canvas Real-Time Video Frame Sampler (Eye Contact % Engine)        │
│  - Tab Switching & Focus Loss Security Safeguards                           │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │  HTTP / JSON (REST API)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            BACKEND (Express.js Server)                      │
│  - POST /api/interview  : Session Planner, Grader, & Feedback Router       │
│  - GET  /api/candidates : Candidate Cohort Selector                        │
│  - GET  /api/health     : Real-Time API Health & LLM Status Check           │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │  Google GenAI SDK (@google/genai)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          GOOGLE GEMINI 2.0 FLASH API                        │
│  - gemini-2.0-flash Model Execution                                         │
│  - STAR Method Grader & Adaptive Follow-Up Question Generator               │
│  - Final Executive Feedback Synthesis Engine                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📂 Project Directory Structure

```text
star-interview/
├── package.json               # Root npm config for direct `npm start` execution
├── README.md                  # Comprehensive GitHub project documentation
├── PROMPT.md                  # Complete System Prompt Specification & Architecture
├── PROMPTS.md                # Development Trajectory & AI Usage Log
├── PROJECT_PLAN.md            # Hackathon Blueprint & Technical Requirements
├── backend/
│   ├── server.js              # Express API Server & Static File Host
│   ├── .env                   # Environment variables (GEMINI_API_KEY)
│   ├── package.json           # Backend package configuration
│   └── lib/
│       ├── llm.js             # Google GenAI (@google/genai) Gemini 2.0 Integration
│       ├── planner.js         # Adaptive Question Plan Builder
│       ├── grader.js          # STAR Answer Grading & Key-Term Coverage Engine
│       ├── feedback.js        # Final Debrief & Scoring Synthesis
│       └── data.js            # Curriculum & Candidate Cohort Dataset
├── frontend/
│   └── index.html             # Full Responsive Single-Page Studio Interface
└── img/
    ├── star-interview-professional-icon-only.svg  # Professional Platform Branding
    └── logo.png               # High-res Brand Assets
```

---

## ⚡ Quickstart & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Browser**: Google Chrome, Microsoft Edge, or Firefox (for Web Speech API support)

### 1. Clone the Repository
```bash
git clone https://github.com/Nilanjan-Nayak/Star-Interview.git
cd Star-Interview
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Gemini API Key
Create a `.env` file in the `backend/` directory or set the environment variable:

```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
GEMINI_MODEL=gemini-2.0-flash
```

*(Note: If no API key is provided, the platform automatically activates Demo Mode with high-fidelity template fallbacks).*

### 4. Launch the Platform
Run from the root directory:
```bash
npm start
```

The terminal will launch the server and display your local URL:
```text
==================================================
🚀 Star Interview App running at: http://localhost:3000
⚡ Mode: LLM ON (Gemini 2.0 Flash)
==================================================
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser!

---

## 🔌 API Endpoints Documentation

### `GET /api/health`
Checks server status and LLM connectivity mode.

**Response:**
```json
{
  "ok": true,
  "llmEnabled": true,
  "model": "gemini-2.0-flash"
}
```

---

### `GET /api/candidates`
Fetches candidate cohort profiles available for evaluation.

**Response:**
```json
{
  "candidates": [
    {
      "member": {
        "name": "Sarah Johnson",
        "jobRole": "Senior Data Engineer",
        "yearsExperience": 9,
        "education": "MS Computer Science"
      },
      "signals": {
        "missionsCompleted": 30,
        "missionsFirstTry": 20,
        "commitDays": 28
      }
    }
  ]
}
```

---

### `POST /api/interview`
Main evaluation endpoint. Handles session initialization, question turn progression, scoring, and final debrief generation.

#### Request (Initialize Session):
```json
{
  "sessionId": "session-101",
  "candidate": { "member": { "name": "Sarah Johnson" } }
}
```

#### Request (Submit Candidate Answer):
```json
{
  "sessionId": "session-101",
  "message": "We chose useReducer over useState because the form contained 8 interdependent state transitions..."
}
```

#### Response (Question Turn):
```json
{
  "reply": "Solid explanation of state transitions. Question 2 of 4 — How do you handle flaky production APIs?",
  "meta": {
    "index": 2,
    "total": 4,
    "dayTitle": "Async & Resilience",
    "coaching": {
      "fillers": { "total": 0 },
      "pace": { "wpm": 142 }
    }
  }
}
```

#### Response (Final Turn - `done: true`):
```json
{
  "done": true,
  "feedback": {
    "overall": 86,
    "summary": "Demonstrates strong production trade-off awareness and clear STAR articulation.",
    "strengths": ["Deep state machine knowledge", "Structured STAR answers", "Low filler usage"],
    "gaps": ["Error handling edge cases", "Safari cross-browser testing"],
    "next": ["Build retry queue with jitter", "Explore visual regression tools"]
  }
}
```

---

## 👨‍💻 Author & Credits

- **Developer & Designer:** Nilanjan Nayak
- **GitHub Repository:** [Nilanjan-Nayak/Star-Interview](https://github.com/Nilanjan-Nayak/Star-Interview.git)
- **Built For:** AI Technical Interview Evaluation & Hackathon Showcase

---

<div align="center">
  <sub>Built with ❤️ by Nilanjan Nayak • Powered by Google Gemini 2.0 Flash</sub>
</div>
