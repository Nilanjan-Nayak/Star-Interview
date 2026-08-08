const { verdictLabel } = require("./grader");

function buildDeterministicFeedback(candidate, transcript) {
  const byDay = new Map();
  transcript.forEach((t) => {
    if (!byDay.has(t.day)) byDay.set(t.day, { dayTitle: t.dayTitle, scores: [] });
    byDay.get(t.day).scores.push(t.score);
  });

  const perDay = Array.from(byDay.entries()).map(([day, v]) => ({
    day,
    dayTitle: v.dayTitle,
    avg: Math.round(v.scores.reduce((a, b) => a + b, 0) / v.scores.length),
  }));
  perDay.sort((a, b) => b.avg - a.avg);

  const strengths = perDay
    .filter((d) => d.avg >= 70)
    .slice(0, 4)
    .map((d) => `Solid grasp of "${d.dayTitle}" (Day ${d.day}) — answered with clear, specific detail.`);

  const gaps = perDay
    .filter((d) => d.avg < 55)
    .slice(0, 4)
    .map((d) => `"${d.dayTitle}" (Day ${d.day}) needs review — answers were thin or missed key concepts.`);

  // Cross-reference the candidate's own skipped/high-attempt missions even if not asked about.
  (candidate.missions || []).forEach((m) => {
    if (m.skipped && !gaps.some((g) => g.includes(m.title))) {
      gaps.push(`"${m.title}" (Day ${m.day}) was skipped during the cohort and should be revisited before interviews.`);
    }
  });

  if (strengths.length === 0) strengths.push("Showed willingness to work through unfamiliar questions live.");
  if (gaps.length === 0) gaps.push("No major gaps surfaced — focus on articulating trade-offs faster under pressure.");

  const next = gaps.slice(0, 3).map((g) => {
    const match = g.match(/"([^"]+)"/);
    const topic = match ? match[1] : "the flagged topics";
    return `Re-do a hands-on exercise for "${topic}" and be ready to explain the "why," not just the "how."`;
  });
  next.push("Practice narrating trade-offs out loud in under 60 seconds per topic — interviewers reward concise reasoning.");

  const overall = Math.round(
    transcript.reduce((a, t) => a + t.score, 0) / Math.max(1, transcript.length)
  );
  const label = verdictLabel(overall);
  const summary =
    `${candidate.member.name} answered ${transcript.length} questions across ${byDay.size} curriculum days ` +
    `with an overall performance that was ${label === "strong" ? "strong" : label === "partial" ? "mixed" : "still developing"} ` +
    `(avg ${overall}/100). ` +
    (strengths.length
      ? `Strongest on topics like ${perDay[0].dayTitle}. `
      : "") +
    (gaps.length ? `The clearest opportunity is closing the gaps listed below before a real interview.` : "");

  return { summary, strengths, gaps, next, overall, perDay };
}

module.exports = { buildDeterministicFeedback };
