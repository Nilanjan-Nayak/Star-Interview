function normalize(text) {
  return (text || "").toLowerCase();
}

/** Score an answer against a question's key curriculum terms. Returns 0-100 + missing terms. */
function gradeAnswer(answerText, question) {
  const answer = normalize(answerText);
  const words = answer.split(/\s+/).filter(Boolean);

  if (words.length < 5) {
    return { score: 10, coverage: 0, missingTerms: question.keyTerms.slice(0, 3), tooShort: true };
  }

  const hit = [];
  const missing = [];
  question.keyTerms.forEach((term) => {
    if (answer.includes(term)) hit.push(term);
    else missing.push(term);
  });

  const coverage = question.keyTerms.length ? hit.length / question.keyTerms.length : 0.6;
  const lengthBonus = Math.min(15, Math.floor(words.length / 8)); // richer answers get a small bonus, capped
  const score = Math.round(Math.min(100, 45 + coverage * 40 + lengthBonus));

  return { score, coverage, missingTerms: missing, hitTerms: hit, tooShort: false };
}

function verdictLabel(score) {
  if (score >= 75) return "strong";
  if (score >= 45) return "partial";
  return "weak";
}

/** Decide whether this answer deserves a targeted follow-up before moving on. */
function needsFollowUp(grade, question) {
  if (question.followUpUsed) return false;
  if (grade.tooShort) return true;
  return grade.score < 55 && grade.missingTerms.length > 0;
}

function templatedVerdictLine(grade, question) {
  const label = verdictLabel(grade.score);
  if (label === "strong") {
    return `Good — that covers the key idea clearly.`;
  }
  if (label === "partial") {
    return `That's on the right track, but there's a gap.`;
  }
  return `That's not quite there yet — let's dig into it.`;
}

function templatedFollowUp(grade, question) {
  const term = grade.missingTerms[0];
  if (grade.tooShort) {
    return `Can you say more about that? Specifically, how does ${question.dayTitle} actually work in practice?`;
  }
  if (term) {
    return `You didn't mention ${term} — how does that fit into "${question.dayTitle}"?`;
  }
  return `Can you give a concrete example of "${question.dayTitle}" from something you built?`;
}

module.exports = { gradeAnswer, verdictLabel, needsFollowUp, templatedVerdictLine, templatedFollowUp };
