const fs = require("fs");
const path = require("path");

const curriculum = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "data", "curriculum.json"), "utf8")
);
const candidates = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "data", "candidates.json"), "utf8")
).candidates;

const dayById = new Map(curriculum.days.map((d) => [d.day, d]));

function moduleForDay(day) {
  return curriculum.modules.find((m) => day >= m.days[0] && day <= m.days[1]);
}

function findCandidate(idOrName) {
  if (!idOrName) return null;
  const needle = String(idOrName).trim().toLowerCase();
  return (
    candidates.find(
      (c) =>
        c.member.id.toLowerCase() === needle ||
        c.member.name.toLowerCase() === needle
    ) || null
  );
}

module.exports = { curriculum, candidates, dayById, moduleForDay, findCandidate };
