const { dayById, moduleForDay } = require("./data");

const STOPWORDS = new Set([
  "the", "a", "an", "of", "to", "and", "in", "for", "on", "with", "your",
  "you", "using", "use", "how", "into", "is", "are", "be", "it", "its",
  "this", "that", "as", "or", "at", "by", "from", "their", "them", "will",
  "can", "understand", "generate", "create", "build", "run", "verify",
  "converted", "whether", "alongside", "original", "documents", "analyze",
  "concepts", "together", "chunk", "store", "knowledge", "every", "base",
  "learn", "explore", "implement", "design", "write", "practice", "review",
  "identify", "describe", "compare", "apply", "evaluate", "configure",
]);

/**
 * Curated grading vocabulary for a day: tool names first (highest signal,
 * these are the concrete things a strong answer should name), then a small
 * number of distinctive long words pulled from the objectives. Capped so a
 * partial-but-relevant answer isn't penalized for missing every minor word.
 */
function keyTerms(day) {
  const toolWords = (day.tools || [])
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9\s\.\+\-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));

  const objWords = (day.objectives || [])
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9\s\.\+\-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 6 && !STOPWORDS.has(w));

  const merged = Array.from(new Set([...toolWords, ...objWords]));
  return merged.slice(0, 8);
}

/** Risk score: how much a day deserves probing in the interview. */
function riskForMission(m) {
  if (m.skipped) return 3;
  if (m.attempts >= 4) return 2.5;
  if (m.attempts >= 2) return 1.5;
  return 0.5; // first try / low signal, still worth a harder probe
}

function pickObjective(day, n = 0) {
  const objs = day.objectives || [day.title];
  return objs[n % objs.length];
}
function pickTool(day, n = 0) {
  const tools = day.tools && day.tools.length ? day.tools : [day.title];
  return tools[n % tools.length];
}

function phraseQuestion(day, difficulty, variant, wasSkipped) {
  const objective = pickObjective(day, variant).replace(/\.$/, "");
  const tool = pickTool(day, variant);
  const mod = moduleForDay(day.day);
  const moduleTitle = mod ? mod.title : "";

  if (wasSkipped && variant === 0) {
    return `You skipped "${day.title}" during the cohort — in your own words, what's the core idea here, and where would it normally be used in a real system?`;
  }

  // Vary opening phrase so questions 2, 3, 4 don't repeat "Let's start with"
  const startPhrases = [
    `Let's start with Day ${day.day}, "${day.title}."`,
    `Turning to Day ${day.day}, "${day.title}."`,
    `Looking at Day ${day.day}, "${day.title}."`,
    `Moving on to Day ${day.day}, "${day.title}."`,
    `For Day ${day.day}, "${day.title}."`,
  ];
  const opening = startPhrases[variant % startPhrases.length];

  if (difficulty === "easy") {
    return `${opening} Can you explain what "${objective}" means and why it matters in ${moduleTitle || "this module"}?`;
  }
  if (difficulty === "hard") {
    return `On Day ${day.day} ("${day.title}") you worked with ${tool}. Imagine ${tool} starts misbehaving or underperforming in production for this use case — how would you diagnose it, and what trade-offs would you weigh in the fix?`;
  }
  // medium (default)
  return `${opening} Walk me through how you'd use ${tool} to "${objective}" — what decisions would you have to make along the way?`;
}


/**
 * Build an ordered question plan for the interview.
 * Ensures >= minQuestions total and >= minDays distinct curriculum days.
 */
function buildQuestionPlan(candidate, difficulty = "medium", { minQuestions = 8, minDays = 4 } = {}) {
  const missions = candidate.missions || [];
  if (missions.length === 0) {
    throw new Error("Candidate has no missions to build an interview from.");
  }

  const ranked = missions
    .map((m) => ({ m, risk: riskForMission(m), day: dayById.get(m.day) }))
    .filter((x) => x.day) // only days we have curriculum content for
    .sort((a, b) => b.risk - a.risk || a.m.day - b.m.day);

  const dayCount = Math.max(minDays, Math.min(ranked.length, 6));
  const chosenDays = ranked.slice(0, dayCount);

  const plan = [];
  // Pass 1: one question per chosen day, guarantees day coverage.
  chosenDays.forEach(({ m, day }) => {
    plan.push({
      day: day.day,
      dayTitle: day.title,
      module: moduleForDay(day.day)?.title || "",
      prompt: phraseQuestion(day, difficulty, 0, !!m.skipped),
      keyTerms: keyTerms(day),
      followUpUsed: false,
      wasSkippedByCandidate: !!m.skipped,
      attempts: m.attempts || 0,
    });
  });

  // Pass 2: add extra questions on the riskiest days until minQuestions is met.
  let i = 0;
  while (plan.length < minQuestions) {
    const { m, day } = chosenDays[i % chosenDays.length];
    plan.push({
      day: day.day,
      dayTitle: day.title,
      module: moduleForDay(day.day)?.title || "",
      prompt: phraseQuestion(day, difficulty, 1 + Math.floor(i / chosenDays.length), false),
      keyTerms: keyTerms(day),
      followUpUsed: false,
      wasSkippedByCandidate: !!m.skipped,
      attempts: m.attempts || 0,
    });
    i++;
    if (i > 50) break; // safety
  }

  return plan;
}

module.exports = { buildQuestionPlan, keyTerms };
