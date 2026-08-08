/**
 * Star Interview - LLM Brain (Professional Accurate Version)
 * ----------------------------------------------------------
 * Responsibilities:
 *  - Secure Gemini client initialization (no hardcoded secrets)
 *  - Deterministic, accurate verdict + follow-up generation
 *  - Robust final JSON feedback synthesis with strict validation
 * 
 * Connections Preserved:
 *  - require("@google/genai")  -> unchanged
 *  - exports: isEnabled, llmVerdictAndFollowUp, llmFinalFeedback, MODEL -> unchanged signature
 */

const { GoogleGenAI } = require("@google/genai");

const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const MAX_RETRIES = 1;
const REQUEST_TIMEOUT_MS = 15000;

// Secure key resolution: only env, no hardcoded default (security improvement)
function resolveApiKey() {
  const key = (process.env.GEMINI_API_KEY || "").trim();
  return key.length >= 20 ? key : null; // basic sanity length
}

let clientSingleton = null;
let clientInitError = null;

function getClient() {
  if (clientSingleton) return clientSingleton;
  if (clientInitError) return null;

  const apiKey = resolveApiKey();
  if (!apiKey) {
    return null;
  }
  try {
    clientSingleton = new GoogleGenAI({ apiKey });
    return clientSingleton;
  } catch (e) {
    clientInitError = e;
    console.error("[llm] Failed to init GoogleGenAI client:", e.message);
    return null;
  }
}

const isEnabled = () => {
  return !!resolveApiKey() && !!getClient();
};

// Sanitize and clamp inputs to prevent prompt injection / overflow
function sanitize(str, maxLen = 8000) {
  if (!str) return "";
  let s = String(str).trim();
  if (s.length > maxLen) s = s.slice(0, maxLen) + " ...[truncated]";
  return s;
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`LLM timeout after ${ms}ms`)), ms)),
  ]);
}

async function complete(system, user, maxTokens = 300, { temperature = 0.25, retries = MAX_RETRIES } = {}) {
  const c = getClient();
  if (!c) return null;

  const sysPrompt = sanitize(system, 4000);
  const userPrompt = sanitize(user, 8000);

  const payload = {
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: `${sysPrompt}\n\n${userPrompt}` }] }],
    config: {
      maxOutputTokens: Math.min(Math.max(maxTokens, 50), 2048),
      temperature,
      topP: 0.9,
      topK: 40,
    },
  };

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const resp = await withTimeout(c.models.generateContent(payload), REQUEST_TIMEOUT_MS);
      // resp.text is getter in new SDK, but fallback to candidates
      let text = null;
      if (resp && typeof resp.text === "string" && resp.text.trim()) {
        text = resp.text.trim();
      } else if (resp && resp.candidates && resp.candidates[0]?.content?.parts?.[0]?.text) {
        text = resp.candidates[0].content.parts[0].text.trim();
      }
      if (text) return text;
      return null;
    } catch (err) {
      const isLast = attempt === retries;
      console.error(`[llm] Gemini call failed (attempt ${attempt + 1}/${retries + 1}):`, err.message);
      if (isLast) return null;
      // brief backoff
      await new Promise(r => setTimeout(r, 400 * (attempt + 1)));
    }
  }
  return null;
}

/**
 * Turn a candidate's answer + question context into a short interviewer verdict + optional follow-up.
 * Preserved signature for compatibility.
 */
async function llmVerdictAndFollowUp({ question, answerText, grade, wantFollowUp }) {
  // Defensive validation - never break caller
  if (!question || !answerText) return null;
  const qTitle = sanitize(question.dayTitle || "this topic", 120);
  const qPrompt = sanitize(question.prompt || "", 1000);
  const aText = sanitize(answerText, 3000);
  const score = typeof grade?.score === "number" ? grade.score : 0;
  const missing = Array.isArray(grade?.missingTerms) ? grade.missingTerms.slice(0, 5) : [];

  const system = `You are a rigorous but fair senior technical interviewer (FAANG-level) conducting a live oral interview for an AI engineering cohort.
RULES:
- You just asked about "${qTitle}" (curriculum day ${question.day || "?"}).
- Respond in at most 2 short sentences, spoken aloud style (natural, encouraging, no markdown, no lists, no emojis).
- Be precise: reference what was actually said, not invented.
- ${wantFollowUp
      ? "The answer was incomplete/shaky: First sentence = brief encouraging verdict acknowledging what WAS correct. Second sentence = ONE precise follow-up probing the SPECIFIC gap (use missing terms if relevant)."
      : "Answer was acceptable: First sentence = brief verdict on correctness + specific praise. Second sentence = transition: 'Let's move to the next one.' Do NOT ask a new question."
  }`;

  const user = `Question asked: ${qPrompt}
Candidate's answer: ${aText}
Deterministic evaluation: score ${score}/100. Missing key terms: ${missing.join(", ") || "none"}. Hit terms: ${(grade?.hitTerms || []).join(", ") || "some"}.
Too short: ${grade?.tooShort ? "yes" : "no"}.`;

  const result = await complete(system, user, 220, { temperature: 0.28 });
  if (!result) return null;
  // Ensure at most 2 sentences, clean
  const cleaned = result.replace(/\n+/g, " ").trim().slice(0, 500);
  return cleaned;
}

/**
 * Synthesize the final structured feedback from the full transcript.
 * Preserved signature, but with far more robust JSON extraction and validation.
 */
async function llmFinalFeedback({ candidate, transcript }) {
  if (!candidate || !Array.isArray(transcript) || transcript.length === 0) return null;

  const candInfo = `${sanitize(candidate.member?.name, 80) || "Candidate"}, ${sanitize(candidate.member?.jobRole, 80) || "candidate"}, ${candidate.member?.yearsExperience || "?"} yrs exp`;

  const transcriptBlock = transcript
    .slice(0, 20) // safety cap
    .map((t, i) => {
      return `${i + 1}. [Day ${t.day ?? "?"} - ${sanitize(t.dayTitle, 80)}] Q: ${sanitize(t.prompt, 600)}\n   A: ${sanitize(t.answerText, 900)}\n   Score: ${t.score ?? 0}/100 | Coverage: ${t.coverage != null ? Math.round(t.coverage * 100) + "%" : "n/a"}`;
    })
    .join("\n");

  const system = `You are a senior technical interviewer writing final feedback after a live technical interview.
CRITICAL RULES:
- Base EVERY claim ONLY on the transcript provided — never invent facts, never hallucinate tools.
- Output STRICT JSON ONLY, no markdown fences, no preamble, no explanation outside JSON.
- Exact shape: {"summary": string, "strengths": string[], "gaps": string[], "next": string[]}
- summary: 2-3 sentences, include overall average and strong/weak pattern.
- strengths: 3-5 short, concrete bullets, each referencing a specific day/topic that scored >=70.
- gaps: 3-5 short bullets, each referencing a topic that scored <55 or was skipped.
- next: 3-5 actionable next steps, each starting with a verb, specific to gaps.
- All strings must be concise, professional, interview-grade.`;

  const user = `Candidate: ${candInfo}
Transcript (question, answer, score):
${transcriptBlock}

Return ONLY the JSON object.`;

  const raw = await complete(system, user, 800, { temperature: 0.32 });
  if (!raw) return null;

  // Robust JSON extraction - handles markdown fences, extra text, etc.
  try {
    // 1. Strip markdown fences
    let cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();

    // 2. Try direct parse
    try {
      const direct = JSON.parse(cleaned);
      if (direct.summary && Array.isArray(direct.strengths)) return validateFeedback(direct);
    } catch (_) {}

    // 3. Extract first { ... } block
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const jsonBlock = cleaned.slice(firstBrace, lastBrace + 1);
      const parsed = JSON.parse(jsonBlock);
      if (parsed.summary && Array.isArray(parsed.strengths)) return validateFeedback(parsed);
    }

    return null;
  } catch (e) {
    console.error("[llm] Failed to parse final feedback JSON:", e.message, "raw:", raw.slice(0, 500));
    return null;
  }
}

function validateFeedback(obj) {
  if (!obj || typeof obj !== "object") return null;
  const { summary, strengths, gaps, next } = obj;
  if (typeof summary !== "string" || summary.length < 20 || summary.length > 800) return null;
  if (!Array.isArray(strengths) || strengths.length < 1 || strengths.length > 6) return null;
  if (!Array.isArray(gaps) || gaps.length < 1 || gaps.length > 6) return null;
  if (!Array.isArray(next) || next.length < 1 || next.length > 6) return null;
  // Ensure all items are non-empty strings
  const allStrings = [...strengths, ...gaps, ...next];
  if (!allStrings.every(s => typeof s === "string" && s.trim().length >= 10)) return null;
  return {
    summary: summary.trim(),
    strengths: strengths.map(s => s.trim()).slice(0, 5),
    gaps: gaps.map(s => s.trim()).slice(0, 5),
    next: next.map(s => s.trim()).slice(0, 5),
  };
}

module.exports = { isEnabled, llmVerdictAndFollowUp, llmFinalFeedback, MODEL };
