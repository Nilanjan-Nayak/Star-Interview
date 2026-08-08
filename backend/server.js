const express = require("express");
const cors = require("cors");
const path = require("path");

const { buildQuestionPlan } = require("./lib/planner");
const { gradeAnswer, needsFollowUp, templatedVerdictLine, templatedFollowUp } = require("./lib/grader");
const { buildDeterministicFeedback } = require("./lib/feedback");
const coaching = require("./lib/coaching");
const llm = require("./lib/llm");

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Serve the frontend and img assets as static files.
app.use(express.static(path.join(__dirname, "..", "frontend")));
app.use("/img", express.static(path.join(__dirname, "..", "img")));


/** sessionId -> session state */
const sessions = new Map();

function newSession(candidate) {
  return {
    candidate,
    difficulty: null,
    plan: [],
    cursor: 0,
    transcript: [],
    stage: "SETUP", // SETUP -> CALIBRATED -> IN_PROGRESS -> DONE
  };
}

app.get("/api/health", (req, res) => res.json({ status: "ok", llm: llm.isEnabled() }));

app.get("/api/candidates", (req, res) => {
  const { candidates } = require("./lib/data");
  res.json({ candidates });
});

app.post("/api/interview", async (req, res) => {
  try {
    const { sessionId: sid, candidate, message } = req.body || {};
    if (!sid) return res.status(400).json({ error: "sessionId required" });

    let session = sessions.get(sid);
    if (!session) {
      session = newSession(candidate);
      sessions.set(sid, session);
    }

    // ---- 1) SELECT CANDIDATE ----
    if (session.stage === "SETUP") {
      if (candidate) session.candidate = candidate;
      session.stage = "CALIBRATED";
      return res.json({
        reply: `Profile loaded for ${session.candidate?.member?.name || "Candidate"}. Choose difficulty to calibrate intensity.`,
        done: false,
        meta: { stage: "CALIBRATED" },
      });
    }

    // ---- 2) CALIBRATE DIFFICULTY ----
    if (session.stage === "CALIBRATED") {
      const difficulty = (message || "medium").toLowerCase();
      session.difficulty = difficulty;

      const plan = buildQuestionPlan(session.candidate, difficulty);
      session.plan = plan;
      session.cursor = 0;
      session.stage = "IN_PROGRESS";

      const firstQ = plan[0];
      return res.json({
        reply: `Calibration complete (${difficulty.toUpperCase()}). Question 1 of ${plan.length} — ${firstQ.prompt}`,
        done: false,
        meta: {
          day: firstQ.day,
          dayTitle: firstQ.dayTitle,
          index: 1,
          total: plan.length,
        },
      });
    }

    // ---- 3) ANSWER TURNS ----
    if (session.stage === "IN_PROGRESS") {
      const question = session.plan[session.cursor];
      const answerText = (message || "").trim();
      const grade = gradeAnswer(answerText, question);
      const turnAnalytics = coaching.analyzeAnswerTurn(answerText, 15);

      session.transcript.push({
        day: question.day,
        dayTitle: question.dayTitle,
        prompt: question.prompt,
        answerText,
        score: grade.score,
        coaching: turnAnalytics,
      });

      const wantFollowUp = needsFollowUp(grade, question);

      let verdictLine = null;
      if (llm.isEnabled()) {
        verdictLine = await llm.llmVerdictAndFollowUp({ question, answerText, grade, wantFollowUp });
      }
      if (!verdictLine) {
        verdictLine = wantFollowUp
          ? `${templatedVerdictLine(grade, question)} ${templatedFollowUp(grade, question)}`
          : templatedVerdictLine(grade, question);
      }

      if (wantFollowUp) {
        question.followUpUsed = true;
        return res.json({
          reply: verdictLine,
          done: false,
          meta: {
            day: question.day,
            dayTitle: question.dayTitle,
            index: session.cursor + 1,
            total: session.plan.length,
            followUp: true,
            lastScore: grade.score,
            coaching: turnAnalytics,
          },
        });
      }

      // Advance to next question, or finish.
      session.cursor += 1;
      if (session.cursor >= session.plan.length) {
        session.stage = "DONE";
        let feedback = await maybeGetLLMFeedback(session);
        const det = buildDeterministicFeedback(session.candidate, session.transcript);
        const radar = coaching.computeRadarMetrics(session.transcript);
        if (!feedback) feedback = det;
        else feedback.overall = det.overall; // keep the computed numeric score authoritative

        return res.json({
          reply: `${verdictLine} That was the last question — nice work. Here's your feedback.`,
          done: true,
          feedback: {
            summary: feedback.summary,
            strengths: feedback.strengths,
            gaps: feedback.gaps,
            next: feedback.next,
          },
          meta: { overall: det.overall, perDay: det.perDay, radar, coaching: turnAnalytics },
        });
      }

      const nextQ = session.plan[session.cursor];
      return res.json({
        reply: `${verdictLine} Question ${session.cursor + 1} of ${session.plan.length} — ${nextQ.prompt}`,
        done: false,
        meta: {
          day: nextQ.day,
          dayTitle: nextQ.dayTitle,
          index: session.cursor + 1,
          total: session.plan.length,
          lastScore: grade.score,
          coaching: turnAnalytics,
        },
      });
    }

    // ---- 4) Already done ----
    return res.json({ reply: "This interview has already finished.", done: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ reply: "Internal error running the interview.", done: false });
  }
});

async function maybeGetLLMFeedback(session) {
  if (!llm.isEnabled()) return null;
  return llm.llmFinalFeedback({ candidate: session.candidate, transcript: session.transcript });
}

function parseDifficulty(message) {
  const m = (message || "").toLowerCase();
  if (m.includes("easy")) return "easy";
  if (m.includes("hard")) return "hard";
  if (m.includes("medium")) return "medium";
  return null;
}

app.get("/api/health", (req, res) => res.json({ ok: true, llmEnabled: llm.isEnabled(), model: llm.MODEL }));

// Convenience endpoint for the demo frontend to populate the candidate picker.
// (Not part of the required contract — the required /api/interview endpoint works standalone.)
app.get("/api/candidates", (req, res) => {
  const { candidates } = require("./lib/data");
  res.json({ candidates });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Star Interview backend listening on :${PORT} (LLM mode: ${llm.isEnabled() ? "ON" : "OFF (templated)"})`);
});
