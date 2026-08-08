/**
 * Star Interview - Feedback Builder (Professional Accurate Version)
 * ------------------------------------------------------------------
 * Produces deterministic, accurate overall scores, per-day averages,
 * strengths/gaps/next steps with cross-reference to skipped missions.
 *
 * Connections Preserved:
 *  - require("./grader").verdictLabel preserved
 *  - exports: buildDeterministicFeedback preserved
 */

const { verdictLabel } = require("./grader");

function safeArray(input) {
  return Array.isArray(input) ? input : [];
}

function avg(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((a, b) => a + Number(b || 0), 0) / arr.length;
}

function median(arr) {
  if (!arr || arr.length === 0) return 0;
  const sorted = [...arr].map(Number).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Build deterministic feedback - accurate professional version.
 * Preserved signature.
 */
function buildDeterministicFeedback(candidate, transcript) {
  const safeTranscript = safeArray(transcript);
  const missions = safeArray(candidate?.missions);

  // Guard: empty transcript
  if (safeTranscript.length === 0) {
    const fallbackPerDay = [];
    return {
      summary: `${candidate?.member?.name || "Candidate"} did not complete any questions in this session. No scores available — schedule a retake after reviewing skipped topics.`,
      strengths: ["Showed up and attempted setup — good baseline."],
      gaps: ['No interview data — transcript empty. Check microphone and try again.', 'Skipped topics should be reviewed before retake.'],
      next: ['Re-run interview with mic permission enabled.', 'Review curriculum days with skipped missions.', 'Practice 60-second STAR answers out loud.'],
      overall: 0,
      perDay: fallbackPerDay,
    };
  }

  // Group by day with richer stats
  const byDay = new Map();
  safeTranscript.forEach(t => {
    const dayNum = Number(t.day);
    if (Number.isNaN(dayNum)) return;
    if (!byDay.has(dayNum)) {
      byDay.set(dayNum, {
        dayTitle: String(t.dayTitle || `Day ${dayNum}`),
        scores: [],
        coverages: [],
        attempts: [],
        prompts: [],
      });
    }
    const entry = byDay.get(dayNum);
    entry.scores.push(Number(t.score) || 0);
    if (typeof t.coverage === "number") entry.coverages.push(t.coverage);
    if (t.attempts != null) entry.attempts.push(t.attempts);
    if (t.prompt) entry.prompts.push(t.prompt);
  });

  const perDay = Array.from(byDay.entries())
    .map(([day, v]) => ({
      day,
      dayTitle: v.dayTitle,
      avg: Math.round(avg(v.scores)),
      median: Math.round(median(v.scores)),
      count: v.scores.length,
      coverageAvg: v.coverages.length ? Number(avg(v.coverages).toFixed(2)) : null,
      scores: v.scores.slice(),
    }))
    .sort((a, b) => b.avg - a.avg || b.count - a.count);

  // Strengths: avg >=70, strong coverage, at least 1 answer, sorted by avg desc
  const strengths = perDay
    .filter(d => d.avg >= 70)
    .slice(0, 4)
    .map(d => {
      const covNote = d.coverageAvg != null && d.coverageAvg >= 0.6 ? `with ${(d.coverageAvg * 100).toFixed(0)}% keyword coverage` : "with clear, specific detail";
      return `Solid grasp of "${d.dayTitle}" (Day ${d.day}) — ${d.count} question(s) averaging ${d.avg}/100 ${covNote}.`;
    });

  // Gaps: avg <55, plus any with low coverage
  const gaps = perDay
    .filter(d => d.avg < 55 || (d.coverageAvg != null && d.coverageAvg < 0.35))
    .slice(0, 4)
    .map(d => {
      const reason = d.avg < 35 ? "answers were thin or missed core concepts" : d.avg < 55 ? "answers were partial, missing key terms" : "keyword coverage low";
      return `"${d.dayTitle}" (Day ${d.day}) needs review — avg ${d.avg}/100, ${reason}.`;
    });

  // Cross-reference skipped/high-attempt missions not yet in gaps, to ensure holistic feedback
  const existingGapTitles = new Set(gaps.map(g => {
    const m = g.match(/"([^"]+)"/);
    return m ? m[1].toLowerCase() : "";
  }));

  missions.forEach(m => {
    if (!m || m.day == null) return;
    const titleLower = String(m.title || "").toLowerCase();
    if (m.skipped && titleLower && !existingGapTitles.has(titleLower)) {
      gaps.push(`"${m.title}" (Day ${m.day}) was skipped during the cohort and should be revisited before interviews — high-risk gap.`);
      existingGapTitles.add(titleLower);
    } else if (Number(m.attempts) >= 4 && titleLower && !existingGapTitles.has(titleLower)) {
      // High attempt count indicates struggle even if not in transcript
      gaps.push(`"${m.title}" (Day ${m.day}) took ${m.attempts} attempts in the program — shows past struggle, recommend extra drills.`);
      existingGapTitles.add(titleLower);
    }
  });

  // Ensure at least one strength and one gap for balanced feedback
  if (strengths.length === 0) {
    // Best performing day among all, even if <70
    const best = perDay[0];
    if (best) {
      strengths.push(`Showed willingness to work through unfamiliar questions — best relative performance on "${best.dayTitle}" (Day ${best.day}) with ${best.avg}/100.`);
    } else {
      strengths.push("Showed willingness to work through unfamiliar questions live — good interview stamina.");
    }
  }
  if (gaps.length === 0) {
    gaps.push("No major gaps surfaced in this short session — focus on articulating trade-offs faster under pressure and adding concrete examples.");
  }

  // Next steps: derive from gaps
  const next = gaps.slice(0, 3).map(g => {
    const match = g.match(/"([^"]+)"/);
    const topic = match ? match[1] : "the flagged topics";
    return `Re-do a hands-on exercise for "${topic}" and be ready to explain the "why," not just the "how" — include one production trade-off.`;
  });
  // Always add universal coaching next steps
  next.push("Practice narrating trade-offs out loud in under 60 seconds per topic — interviewers reward concise reasoning with metrics.");
  if (perDay.some(d => d.count > 1 && Math.abs(d.scores[0] - d.scores[d.scores.length - 1]) > 20)) {
    next.push("Work on consistency — your scores varied on same day, aim for repeatable 75+ answers with STAR structure.");
  }

  const overall = Math.round(avg(safeTranscript.map(t => Number(t.score) || 0)));
  const overallLabel = verdictLabel(overall);

  // More accurate summary with median context
  const medianOverall = Math.round(median(safeTranscript.map(t => Number(t.score) || 0)));
  const strongest = perDay.length > 0 ? perDay[0].dayTitle : "core topics";
  const weakest = perDay.length > 0 ? perDay[perDay.length - 1].dayTitle : null;

  let summary = `${candidate?.member?.name || "Candidate"} answered ${safeTranscript.length} question(s) across ${byDay.size} curriculum day(s) with an overall performance that was ${overallLabel === "strong" ? "strong" : overallLabel === "good" ? "solid" : overallLabel === "partial" ? "mixed" : "still developing"} (avg ${overall}/100, median ${medianOverall}/100). `;

  if (strongest) {
    summary += `Strongest on ${strongest}. `;
  }
  if (weakest && perDay.length > 1 && perDay[perDay.length - 1].avg < 50) {
    summary += `The clearest opportunity is closing gaps in ${weakest} and the topics listed below before a real interview.`;
  } else if (gaps.length > 0) {
    summary += `Focus next on the gap topics below to be interview-ready.`;
  } else {
    summary += `No major gaps — polish speed and storytelling.`;
  }

  return {
    summary: summary.trim(),
    strengths: strengths.slice(0, 4),
    gaps: gaps.slice(0, 5),
    next: next.slice(0, 5),
    overall,
    perDay: perDay.map(({ day, dayTitle, avg, median, count }) => ({ day, dayTitle, avg, median, count })),
  };
}

module.exports = { buildDeterministicFeedback };
