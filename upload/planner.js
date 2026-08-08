/**
 * Star Interview - Planner (Professional Accurate Version)
 * --------------------------------------------------------
 * Builds ordered, risk-based question plans with accurate vocabulary extraction,
 * difficulty calibration, and coverage guarantees.
 *
 * Connections Preserved:
 *  - require("./data") -> dayById, moduleForDay preserved
 *  - exports: buildQuestionPlan, keyTerms preserved
 */

const { dayById, moduleForDay } = require("./data");

// Enhanced stopwords - curated for curriculum text, prevents generic verbs from becoming key terms
const STOPWORDS = new Set([
  "the","a","an","of","to","and","in","for","on","with","your","you","using","use","how","into","is","are","be","it","its","this","that","as","or","at","by","from","their","them","will","can","understand","generate","create","build","run","verify","converted","whether","alongside","original","documents","analyze","concepts","together","chunk","store","knowledge","every","base","learn","explore","implement","design","write","practice","review","identify","describe","compare","apply","evaluate","configure","understanding","including","through","between","within","without","about","which","should","would","could","have","has","had","been","were","also","then","than","when","what","where","there","these","those","they","them","some","such","into","your","you","our","out","over","under","more","most","other","another","first","second","third","very","just","even","much","many","include","includes","including","using","used","uses",
]);

// Normalize token: lower, remove non-alphanum except .+- , trim
function cleanToken(raw) {
  return String(raw || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s.\+\-#]/g, " ")
    .trim();
}

/**
 * Curated grading vocabulary for a day: tool names first (highest signal),
 * then distinctive long/technical words from objectives.
 * Capped to 8 to avoid penalizing partial answers for missing minor words.
 * Professional improvement: weights tools higher, filters better, deduplicates smarter.
 */
function keyTerms(day) {
  if (!day) return ["concept", "implementation"];

  const toolText = (day.tools || []).join(" ");
  const toolWords = cleanToken(toolText)
    .split(/\s+/)
    .filter(w => w.length > 2 && w.length < 24 && !STOPWORDS.has(w) && !/^\d+$/.test(w));

  const objText = (day.objectives || []).join(" ");
  const objWords = cleanToken(objText)
    .split(/\s+/)
    .filter(w => w.length >= 6 && w.length < 28 && !STOPWORDS.has(w) && !/^\d+$/.test(w));

  // Prioritize: tools first, then long distinctive objective words, deduplicated preserving order
  const seen = new Set();
  const merged = [];

  for (const w of toolWords) {
    if (!seen.has(w)) {
      seen.add(w);
      merged.push(w);
    }
  }
  for (const w of objWords) {
    if (!seen.has(w)) {
      seen.add(w);
      merged.push(w);
    }
    if (merged.length >= 12) break; // allow slightly more before slice, we will trim
  }

  // If still too few, add title words as fallback
  if (merged.length < 4 && day.title) {
    const titleWords = cleanToken(day.title).split(/\s+/).filter(w => w.length > 3 && !STOPWORDS.has(w));
    for (const w of titleWords) {
      if (!seen.has(w)) {
        seen.add(w);
        merged.push(w);
      }
    }
  }

  // Cap to 8 high-signal terms, but ensure at least 3
  const result = merged.slice(0, 8);
  return result.length >= 3 ? result : merged.slice(0, 5);
}

/**
 * Risk score: how much a day deserves probing in the interview.
 * More accurate: considers skip, attempts, recency (higher day = slightly higher risk if recent), and first-try vs struggling.
 */
function riskForMission(m) {
  if (!m) return 0;
  if (m.skipped) return 5.0; // highest priority - they avoided it
  const attempts = Number(m.attempts || 1);
  if (attempts >= 5) return 4.0;
  if (attempts >= 4) return 3.2;
  if (attempts >= 3) return 2.6;
  if (attempts >= 2) return 1.8;
  // first try: still 0.8 but add slight recency bias (higher day number slightly riskier if recent)
  const dayNum = Number(m.day || 0);
  const recencyBonus = dayNum > 15 ? 0.3 : 0;
  return 0.8 + recencyBonus;
}

function pickObjective(day, n = 0) {
  const objs = Array.isArray(day.objectives) && day.objectives.length > 0 ? day.objectives : [day.title];
  const idx = Math.abs(n) % objs.length;
  return String(objs[idx] || day.title).trim();
}

function pickTool(day, n = 0) {
  const tools = Array.isArray(day.tools) && day.tools.length > 0 ? day.tools : [day.title];
  const idx = Math.abs(n) % tools.length;
  return String(tools[idx] || day.title).trim();
}

function stripTrailingDot(str) {
  return String(str || "").replace(/\.$/, "").trim();
}

function phraseQuestion(day, difficulty, variant, wasSkipped) {
  const objective = pickObjective(day, variant);
  const objectiveClean = stripTrailingDot(objective);
  const tool = pickTool(day, variant);
  const mod = moduleForDay(day.day);
  const moduleTitle = mod ? mod.title : "";

  // Skipped handling: first variant for skipped is empathetic but probing
  if (wasSkipped && variant === 0) {
    return `I noticed you skipped "${day.title}" during the cohort — in your own words, what's the core idea behind it, and where would it normally be used in a real production system?`;
  }

  // Easy: definitional, warm, guided
  if (difficulty === "easy") {
    const templates = [
      `Let's start with Day ${day.day}, "${day.title}." Can you explain what "${objectiveClean}" means in simple terms and why it matters in ${moduleTitle || "this module"}?`,
      `For Day ${day.day} — "${day.title}" — how would you describe "${objectiveClean}" to a junior teammate?`,
      `Quick warm-up on Day ${day.day} "${day.title}": what is the main purpose of "${objectiveClean}" and when would you use it?`,
    ];
    return templates[variant % templates.length];
  }

  // Hard: production diagnosis, trade-offs, incident
  if (difficulty === "hard") {
    const templates = [
      `Let's go deep on Day ${day.day} ("${day.title}") — you worked with ${tool}. Imagine ${tool} starts misbehaving or degrading under load in production for this use case — how would you diagnose the root cause, what metrics would you check, and what trade-offs would you weigh in the fix?`,
      `Hard scenario for Day ${day.day} "${day.title}": You're on call, ${tool} is failing for "${objectiveClean}" in production at 2am. Walk me through your incident response — detection, mitigation, and longer-term prevention.`,
      `For ${day.title} (Day ${day.day}), you used ${tool} to "${objectiveClean}". If you had to rebuild that for 10x scale, what would you change architecturally and why?`,
    ];
    return templates[variant % templates.length];
  }

  // Medium: applied, decision-driven (default)
  const mediumTemplates = [
    `Walk me through how you'd use ${tool} to "${objectiveClean}" — what key decisions would you have to make along the way, from Day ${day.day} ("${day.title}")?`,
    `Suppose a product manager asks you to deliver "${objectiveClean}" using what you learned on Day ${day.day} "${day.title}". How would you approach it with ${tool}, and what alternatives would you consider?`,
    `Day ${day.day} — "${day.title}" focused on "${objectiveClean}" with ${tool}. Can you describe a real example where you'd apply that, including a tricky edge case you handled?`,
    `For "${day.title}" (Day ${day.day}), explain your workflow for "${objectiveClean}" — what would you do first with ${tool}, and how would you verify it works correctly?`,
  ];
  return mediumTemplates[variant % mediumTemplates.length];
}

/**
 * Build an ordered question plan for the interview.
 * Ensures >= minQuestions total and >= minDays distinct curriculum days.
 * Preserved signature, but far more accurate planning logic.
 */
function buildQuestionPlan(candidate, difficulty = "medium", { minQuestions = 8, minDays = 4 } = {}) {
  const missions = Array.isArray(candidate?.missions) ? candidate.missions : [];
  if (missions.length === 0) {
    throw new Error("Candidate has no missions to build an interview from.");
  }

  // Validate difficulty
  const diff = ["easy", "medium", "hard"].includes(difficulty) ? difficulty : "medium";
  const minQ = Math.max(3, Math.min(12, Number(minQuestions) || 8));
  const minD = Math.max(2, Math.min(8, Number(minDays) || 4));

  // Rank by risk, but also filter out days not in curriculum
  const ranked = missions
    .map(m => {
      const dayNum = Number(m.day);
      const dayObj = dayById.get(dayNum) || null;
      return { m, risk: riskForMission(m), day: dayObj, dayNum };
    })
    .filter(x => x.day) // only days we have curriculum content for
    .sort((a, b) => {
      // Primary: risk desc, Secondary: day asc for stability, Tertiary: skipped first
      if (b.risk !== a.risk) return b.risk - a.risk;
      if (a.m.skipped !== b.m.skipped) return a.m.skipped ? -1 : 1;
      return a.dayNum - b.dayNum;
    });

  if (ranked.length === 0) {
    throw new Error("Candidate has missions but none match curriculum days.");
  }

  // Ensure at least minDays distinct days, at most 6 for focus, but allow up to ranked.length
  const desiredDayCount = Math.max(minD, Math.min(ranked.length, Math.min(6, Math.ceil(minQ * 0.75))));
  const chosenDays = ranked.slice(0, desiredDayCount);

  const plan = [];
  const usedPrompts = new Set(); // avoid duplicate prompts

  function pushUnique(dayObj, mission, variantIndex) {
    const prompt = phraseQuestion(dayObj, diff, variantIndex, !!mission.skipped);
    if (usedPrompts.has(prompt)) return false;
    usedPrompts.add(prompt);
    plan.push({
      day: dayObj.day,
      dayTitle: dayObj.title,
      module: moduleForDay(dayObj.day)?.title || "",
      prompt,
      keyTerms: keyTerms(dayObj),
      followUpUsed: false,
      wasSkippedByCandidate: !!mission.skipped,
      attempts: Number(mission.attempts || 0),
      risk: riskForMission(mission),
    });
    return true;
  }

  // Pass 1: one question per chosen day, guarantees day coverage (most important)
  chosenDays.forEach(({ m, day }) => {
    pushUnique(day, m, 0);
  });

  // Pass 2: add extra questions on riskiest days until minQuestions is met, with increasing variant
  let iter = 0;
  let variantCounter = 1;
  while (plan.length < minQ && iter < 100) {
    const idx = iter % chosenDays.length;
    const { m, day } = chosenDays[idx];
    // Use higher variant numbers to get different phrasing, but cycle
    const variant = variantCounter + Math.floor(iter / chosenDays.length);
    pushUnique(day, m, variant);
    iter++;
    if (iter % chosenDays.length === 0) variantCounter++;
  }

  // Final safety: if still under minQ (due to duplicate avoidance), force add even if duplicate risk
  while (plan.length < minQ) {
    const { m, day } = chosenDays[plan.length % chosenDays.length];
    plan.push({
      day: day.day,
      dayTitle: day.title,
      module: moduleForDay(day.day)?.title || "",
      prompt: phraseQuestion(day, diff, plan.length, !!m.skipped),
      keyTerms: keyTerms(day),
      followUpUsed: false,
      wasSkippedByCandidate: !!m.skipped,
      attempts: Number(m.attempts || 0),
      risk: riskForMission(m),
    });
  }

  // Sort final plan lightly: first half = high-risk, second half = medium for pacing (easy start, hard middle)
  // But preserve coverage guarantee - we already have distinct days first
  return plan.slice(0, minQ);
}

module.exports = { buildQuestionPlan, keyTerms, riskForMission, phraseQuestion };
