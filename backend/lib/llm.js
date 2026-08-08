const { GoogleGenAI } = require("@google/genai");

const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";


let client = null;
function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!client) {
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}


const isEnabled = () => !!getClient();

async function complete(system, user, maxTokens = 300) {
  const c = getClient();
  if (!c) return null;
  try {
    const resp = await c.models.generateContent({
      model: MODEL,
      contents: [
        { role: "user", parts: [{ text: `${system}\n\n${user}` }] }
      ],
      config: {
        maxOutputTokens: maxTokens,
      },
    });
    return resp.text ? resp.text.trim() : null;
  } catch (err) {
    console.error("[llm] Gemini call failed, falling back to templates:", err.message);
    return null;
  }
}

/** Turn a candidate's answer + question context into a short interviewer verdict + optional follow-up. */
async function llmVerdictAndFollowUp({ question, answerText, grade, wantFollowUp }) {
  const system = `You are a rigorous but fair senior technical interviewer conducting a live oral interview
for an AI engineering cohort. You just asked a candidate a question about "${question.dayTitle}"
(curriculum day ${question.day}). Respond in at most 2 short sentences, spoken out loud style
(no markdown, no lists). ${wantFollowUp
    ? "The answer was incomplete or shaky: give a brief, encouraging verdict, then ask ONE precise follow-up question that probes the specific gap."
    : "Give a brief verdict on correctness and then say you're moving to the next question (do not ask a new question yourself, the system will supply it)."
  }`;
  const user = `Question asked: ${question.prompt}
Candidate's answer: ${answerText}
Deterministic keyword coverage score: ${grade.score}/100. Missing key terms: ${grade.missingTerms.join(", ") || "none"}.`;
  return complete(system, user, 220);
}

/** Synthesize the final structured feedback from the full transcript. */
async function llmFinalFeedback({ candidate, transcript }) {
  const system = `You are a senior technical interviewer writing final feedback for a candidate after a live
technical interview. Base every claim ONLY on the transcript given — never invent facts. Respond with STRICT JSON only,
no markdown fences, no preamble, matching exactly this shape:
{"summary": string, "strengths": string[], "gaps": string[], "next": string[]}
Keep "summary" to 2-3 sentences. Each array should have 3-5 short, concrete, actionable bullet points.`;
  const user = `Candidate: ${candidate.member.name}, ${candidate.member.jobRole}, ${candidate.member.yearsExperience} yrs experience.
Transcript (question, answer, score out of 100):
${transcript
    .map(
      (t, i) =>
        `${i + 1}. [Day ${t.day} - ${t.dayTitle}] Q: ${t.prompt}\n   A: ${t.answerText}\n   Score: ${t.score}/100`
    )
    .join("\n")}`;
  const raw = await complete(system, user, 700);
  if (!raw) return null;
  try {
    const cleaned = raw.replace(/^```json\s*|```$/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (parsed.summary && Array.isArray(parsed.strengths)) return parsed;
    return null;
  } catch {
    return null;
  }
}

module.exports = { isEnabled, llmVerdictAndFollowUp, llmFinalFeedback, MODEL };

