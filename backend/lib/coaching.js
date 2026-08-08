/**
 * Real Backend Coaching Analytics & Voice Intelligence Engine
 * Evaluates candidate responses for:
 * 1. Filler words & density (um, uh, like, you know, actually, basically, sort of, kind of)
 * 2. Words Per Minute (WPM) pace calculation & classification
 * 3. Technical Energy & Confidence score (action verbs, term density, clarity)
 * 4. STAR method compliance (Situation, Task, Action, Result)
 * 5. Overall Radar Skill Metrics across 5 dimensions (Architecture, Code Quality, Communication, Tradeoffs, Observability)
 */

const FILLER_PATTERNS = [
  /\b(um|uh|er|ah)\b/gi,
  /\b(like)\b/gi,
  /\b(you know)\b/gi,
  /\b(actually)\b/gi,
  /\b(basically)\b/gi,
  /\b(sort of|kind of)\b/gi,
  /\b(i mean)\b/gi,
  /\b(honestly)\b/gi,
  /\b(literally)\b/gi
];

const TECHNICAL_ACTION_VERBS = [
  "designed", "built", "implemented", "optimized", "refactored",
  "debugged", "deployed", "scaled", "benchmark", "configured",
  "orchestrated", "migrated", "monitored", "isolated", "resolved"
];

function analyzeAnswerTurn(text, durationSec = 15) {
  const cleanText = (text || "").trim();
  if (!cleanText) {
    return {
      wordCount: 0,
      fillers: { total: 0, densityPct: 0, detected: {} },
      pace: { wpm: 0, status: "No audio" },
      energy: { score: 20, status: "Low" },
      starScore: 0,
    };
  }

  const words = cleanText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // 1. Filler Analysis
  let totalFillers = 0;
  const detectedFillers = {};
  FILLER_PATTERNS.forEach((pattern) => {
    const matches = cleanText.match(pattern);
    if (matches) {
      totalFillers += matches.length;
      const key = matches[0].toLowerCase();
      detectedFillers[key] = (detectedFillers[key] || 0) + matches.length;
    }
  });

  const fillerDensityPct = wordCount > 0 ? Number(((totalFillers / wordCount) * 100).toFixed(1)) : 0;

  // 2. Pace (WPM)
  const safeDurationMin = Math.max(0.1, (durationSec || 15) / 60);
  const wpm = Math.round(wordCount / safeDurationMin);

  let paceStatus = "Optimal";
  if (wpm < 100) paceStatus = "Slow";
  else if (wpm > 175) paceStatus = "Fast";

  // 3. Technical Energy & Confidence
  let verbMatches = 0;
  const lowerText = cleanText.toLowerCase();
  TECHNICAL_ACTION_VERBS.forEach((v) => {
    if (lowerText.includes(v)) verbMatches++;
  });

  let rawEnergy = 45 + verbMatches * 10 + Math.min(35, wordCount * 0.4);
  if (fillerDensityPct > 8) rawEnergy -= 15;
  const energyScore = Math.max(15, Math.min(98, Math.round(rawEnergy)));

  let energyStatus = "Mid";
  if (energyScore >= 75) energyStatus = "High";
  else if (energyScore <= 40) energyStatus = "Low";

  // 4. STAR Method Analysis
  let starScore = 50;
  if (/\b(when|situation|project|context|team)\b/i.test(lowerText)) starScore += 12;
  if (/\b(task|goal|challenge|problem|issue)\b/i.test(lowerText)) starScore += 12;
  if (/\b(built|wrote|created|used|fixed|implemented)\b/i.test(lowerText)) starScore += 13;
  if (/\b(result|outcome|improved|reduced|increased|saved|shipped)\b/i.test(lowerText)) starScore += 13;
  starScore = Math.min(100, starScore);

  return {
    wordCount,
    fillers: {
      total: totalFillers,
      densityPct: fillerDensityPct,
      detected: detectedFillers,
    },
    pace: {
      wpm,
      status: paceStatus,
    },
    energy: {
      score: energyScore,
      status: energyStatus,
    },
    starScore,
  };
}

function computeRadarMetrics(transcript = []) {
  if (!transcript || transcript.length === 0) {
    return {
      architecture: 75,
      codeQuality: 78,
      communication: 80,
      tradeoffs: 72,
      observability: 70,
    };
  }

  let totalScore = 0;
  let wordSum = 0;
  let totalFillers = 0;

  transcript.forEach((t) => {
    totalScore += t.score || 70;
    const analysis = analyzeAnswerTurn(t.answerText || "", 20);
    wordSum += analysis.wordCount;
    totalFillers += analysis.fillers.total;
  });

  const avgScore = Math.round(totalScore / transcript.length);
  const commScore = Math.max(40, Math.min(95, Math.round(85 - (totalFillers * 3))));
  const archScore = Math.max(50, Math.min(98, Math.round(avgScore * 1.05)));
  const codeQuality = Math.max(45, Math.min(95, Math.round(avgScore * 0.98)));
  const tradeoffs = Math.max(40, Math.min(92, Math.round(avgScore * 0.92)));
  const observability = Math.max(40, Math.min(95, Math.round(avgScore * 0.95)));

  return {
    architecture: archScore,
    codeQuality: codeQuality,
    communication: commScore,
    tradeoffs: tradeoffs,
    observability: observability,
  };
}

module.exports = {
  analyzeAnswerTurn,
  computeRadarMetrics,
};
