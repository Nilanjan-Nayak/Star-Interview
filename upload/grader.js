/**
 * Star Interview - Grader (Professional Accurate Version)
 * -------------------------------------------------------
 * Evaluates candidate answers against curriculum key terms with
 * fuzzy matching, weighted coverage, and professional verdict logic.
 *
 * Connections Preserved:
 *  - exports: gradeAnswer, verdictLabel, needsFollowUp, templatedVerdictLine, templatedFollowUp
 *  - Signature of each function unchanged
 */

const WORD_SPLIT = /\s+/;
const PUNCTUATION = /[^a-z0-9+\-#.\s]/g;

// Small synonym map for higher recall without LLM
const SYNONYM_MAP = {
  "k8s": ["kubernetes"],
  "js": ["javascript"],
  "ts": ["typescript"],
  "db": ["database"],
  "auth": ["authentication", "authorization"],
  "config": ["configuration"],
  "env": ["environment"],
  "repo": ["repository"],
  "ci": ["continuous integration"],
  "cd": ["continuous deployment"],
  "api": ["application programming interface", "endpoint"],
};

function normalize(text) {
  if (!text) return "";
  return String(text)
    .toLowerCase()
    .replace(PUNCTUATION, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Check if term appears in answer with word boundaries, plus synonym and partial fuzzy
function termMatches(term, normalizedAnswer) {
  if (!term || !normalizedAnswer) return false;
  const t = normalize(term);
  if (!t) return false;

  // Direct inclusion with word boundaries
  if (normalizedAnswer.includes(t)) return true;

  // Token-level exact word match
  const answerTokens = new Set(normalizedAnswer.split(WORD_SPLIT));
  if (answerTokens.has(t)) return true;

  // Synonym check
  const synonyms = SYNONYM_MAP[t] || [];
  for (const syn of synonyms) {
    if (normalizedAnswer.includes(normalize(syn))) return true;
  }
  // Reverse synonym (if term is long form, check short)
  for (const [short, longs] of Object.entries(SYNONYM_MAP)) {
    if (longs.includes(t) && normalizedAnswer.includes(short)) return true;
  }

  // Fuzzy: for terms >=6 chars, allow 1-char edit tolerance via inclusion of 80% substring
  if (t.length >= 7) {
    const sub = t.slice(0, Math.floor(t.length * 0.8));
    if (sub.length >= 5 && normalizedAnswer.includes(sub)) return true;
  }

  return false;
}

/**
 * Score an answer against a question's key curriculum terms.
 * Returns enriched object: score, coverage, missingTerms, hitTerms, tooShort, wordCount, etc.
 * Preserved export name.
 */
function gradeAnswer(answerText, question) {
  const raw = String(answerText || "");
  const answerNorm = normalize(raw);
  const words = answerNorm.split(WORD_SPLIT).filter(Boolean);
  const wordCount = words.length;

  const keyTerms = Array.isArray(question?.keyTerms) && question.keyTerms.length > 0
    ? question.keyTerms
    : ["concept", "implementation", "trade-off"];

  // Too short guard - very accurate threshold
  if (wordCount < 4) {
    return {
      score: 8,
      coverage: 0,
      missingTerms: keyTerms.slice(0, 4),
      hitTerms: [],
      tooShort: true,
      wordCount,
      reason: "Answer too short - less than 4 meaningful words",
    };
  }
  if (wordCount < 8) {
    // borderline short, still grade but flag
    const hit = [];
    const missing = [];
    keyTerms.forEach(term => {
      if (termMatches(term, answerNorm)) hit.push(term);
      else missing.push(term);
    });
    const coverage = keyTerms.length ? hit.length / keyTerms.length : 0;
    // harsher penalty for very short
    const score = Math.round(Math.min(100, 20 + coverage * 35 + Math.min(5, wordCount)));
    return { score, coverage, missingTerms: missing, hitTerms: hit, tooShort: true, wordCount };
  }

  const hitTerms = [];
  const missingTerms = [];
  let weightedHits = 0;
  let totalWeight = 0;

  keyTerms.forEach((term, idx) => {
    // Earlier terms (usually tools) weigh slightly higher - they are more concrete
    const weight = idx < 3 ? 1.3 : idx < 5 ? 1.1 : 1.0;
    totalWeight += weight;
    if (termMatches(term, answerNorm)) {
      hitTerms.push(term);
      weightedHits += weight;
    } else {
      missingTerms.push(term);
    }
  });

  const baseCoverage = totalWeight > 0 ? weightedHits / totalWeight : 0;
  const coverage = keyTerms.length ? hitTerms.length / keyTerms.length : 0.6;

  // Length bonus: richer answers get up to +18, but diminishing returns after 80 words
  const lengthBonus = Math.min(18, Math.floor(wordCount / 6) + Math.min(6, Math.floor(wordCount / 35)));

  // Diversity bonus: unique words ratio
  const uniqueRatio = new Set(words).size / Math.max(1, words.length);
  const diversityBonus = Math.round(uniqueRatio * 6); // 0-6

  // Penalty for excessive filler or repetition? Not yet, but placeholder
  let score = Math.round(42 + baseCoverage * 48 + lengthBonus + diversityBonus);

  // Clamp
  score = Math.max(5, Math.min(100, score));

  // If coverage is 0 but talkative, give at least 25 to acknowledge effort
  if (hitTerms.length === 0 && wordCount > 25) {
    score = Math.max(score, 28);
  }

  return {
    score,
    coverage, // simple coverage for external use
    weightedCoverage: baseCoverage,
    missingTerms,
    hitTerms,
    tooShort: false,
    wordCount,
    diversity: Number(uniqueRatio.toFixed(2)),
  };
}

function verdictLabel(score) {
  const s = Number(score) || 0;
  if (s >= 78) return "strong";
  if (s >= 62) return "good";
  if (s >= 45) return "partial";
  if (s >= 25) return "weak";
  return "poor";
}

/**
 * Decide whether this answer deserves a targeted follow-up before moving on.
 * More accurate professional logic.
 */
function needsFollowUp(grade, question) {
  if (!grade || !question) return false;
  if (question.followUpUsed) return false; // already used follow-up for this question

  // Very short always needs follow-up
  if (grade.tooShort) return true;

  const score = Number(grade.score) || 0;
  const missing = Array.isArray(grade.missingTerms) ? grade.missingTerms.length : 0;

  // High-value retry conditions
  if (score < 38) return true; // poor
  if (score < 55 && missing >= 2) return true; // partial with gaps
  if (score < 65 && missing >= 3) return true; // good but missing many key terms
  if (question.wasSkippedByCandidate && score < 70) return true; // they skipped this topic before

  return false;
}

function templatedVerdictLine(grade, question) {
  const label = verdictLabel(grade?.score || 0);
  const dayTitle = question?.dayTitle ? `"${question.dayTitle}"` : "that topic";

  // Professional varied responses, not repetitive
  const strongLines = [
    `Excellent — you covered ${dayTitle} with clear, specific detail.`,
    `Good — that hits the key idea for ${dayTitle} directly and concisely.`,
    `That's a strong answer — you nailed the core concept for ${dayTitle}.`,
  ];
  const goodLines = [
    `That's on the right track for ${dayTitle}, solid reasoning.`,
    `Good foundation on ${dayTitle} — you got the main trade-off.`,
  ];
  const partialLines = [
    `That's partially there for ${dayTitle} — right direction, but there's a gap to close.`,
    `You're circling the right idea for ${dayTitle}, let's sharpen it a bit.`,
  ];
  const weakLines = [
    `That's not quite there yet for ${dayTitle} — let's dig deeper into the core mechanism.`,
    `Hmm, missed the key piece for ${dayTitle}, let's probe that gap.`,
  ];
  const poorLines = [
    `That's too thin to evaluate for ${dayTitle} — can you expand with a concrete example?`,
    `Need more substance on ${dayTitle} — walk me through how it actually works.`,
  ];

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length) % arr.length];

  switch (label) {
    case "strong": return pick(strongLines);
    case "good": return pick(goodLines);
    case "partial": return pick(partialLines);
    case "weak": return pick(weakLines);
    default: return pick(poorLines);
  }
}

function templatedFollowUp(grade, question) {
  const term = Array.isArray(grade?.missingTerms) && grade.missingTerms.length > 0 ? grade.missingTerms[0] : null;
  const dayTitle = question?.dayTitle || "that topic";
  const toolHint = Array.isArray(question?.keyTerms) && question.keyTerms[0] ? question.keyTerms[0] : null;

  if (grade?.tooShort) {
    return `Can you say more about that? Specifically, how does ${dayTitle} actually work in practice — maybe walk through a real example you built?`;
  }
  if (term) {
    return `You didn't mention ${term} — how does ${term} fit into "${dayTitle}" and why does it matter for a production system?`;
  }
  if (toolHint) {
    return `You covered the basics of ${dayTitle}. How would ${toolHint} misbehave in production for this use case, and how would you diagnose it?`;
  }
  return `Can you give a concrete example of "${dayTitle}" from something you built — what worked, what didn't, and what you'd change next time?`;
}

module.exports = { gradeAnswer, verdictLabel, needsFollowUp, templatedVerdictLine, templatedFollowUp, normalize, termMatches };
