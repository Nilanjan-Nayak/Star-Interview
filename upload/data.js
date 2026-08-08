/**
 * Star Interview - Data Layer (Professional Accurate Version)
 * ----------------------------------------------------------
 * Loads curriculum.json and candidates.json with validation, caching, and graceful fallbacks.
 * 
 * Connections Preserved:
 *  - fs, path requires unchanged
 *  - exports: curriculum, candidates, dayById, moduleForDay, findCandidate (same names & signatures)
 *  - Links: expects ../data/curriculum.json and ../data/candidates.json relative path -> preserved
 */

const fs = require("fs");
const path = require("path");

// Cache singletons to avoid re-reading
let _curriculum = null;
let _candidatesRaw = null;
let _candidates = null;
let _dayById = null;
let _loadError = null;

function resolveDataPaths() {
  // Preserve original relative resolution: __dirname/../data/...
  const baseDir = path.join(__dirname, "..", "data");
  return {
    curriculumPath: path.join(baseDir, "curriculum.json"),
    candidatesPath: path.join(baseDir, "candidates.json"),
  };
}

function safeReadJSON(filePath, fallback = null) {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`[data] File not found: ${filePath} — using fallback`);
      return fallback;
    }
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (e) {
    console.error(`[data] Failed to read/parse ${filePath}:`, e.message);
    _loadError = e;
    return fallback;
  }
}

function loadCurriculum() {
  if (_curriculum) return _curriculum;
  const { curriculumPath } = resolveDataPaths();
  const data = safeReadJSON(curriculumPath, { days: [], modules: [] });

  // Validation & normalization
  if (!data || typeof data !== "object") {
    _curriculum = { days: [], modules: [] };
    return _curriculum;
  }
  const days = Array.isArray(data.days) ? data.days : [];
  const modules = Array.isArray(data.modules) ? data.modules : [];

  // Ensure each day has required fields
  const cleanDays = days
    .filter(d => d && typeof d.day === "number" && typeof d.title === "string")
    .map(d => ({
      day: d.day,
      title: d.title.trim(),
      objectives: Array.isArray(d.objectives) ? d.objectives : [d.title],
      tools: Array.isArray(d.tools) ? d.tools : [],
    }));

  const cleanModules = modules
    .filter(m => m && Array.isArray(m.days) && m.days.length === 2)
    .map(m => ({
      title: String(m.title || "Module").trim(),
      days: [Number(m.days[0]), Number(m.days[1])],
    }))
    .sort((a, b) => a.days[0] - b.days[0]);

  _curriculum = { days: cleanDays, modules: cleanModules, raw: data };
  return _curriculum;
}

function loadCandidatesData() {
  if (_candidates) return _candidates;
  const { candidatesPath } = resolveDataPaths();
  const data = safeReadJSON(candidatesPath, { candidates: [] });

  const list = Array.isArray(data?.candidates) ? data.candidates : Array.isArray(data) ? data : [];

  const clean = list
    .filter(c => c && c.member && typeof c.member.name === "string")
    .map(c => {
      const member = c.member;
      return {
        member: {
          id: String(member.id || member.name.toLowerCase().replace(/\s+/g, "-")).trim(),
          name: String(member.name).trim(),
          jobRole: String(member.jobRole || "Candidate").trim(),
          yearsExperience: Number(member.yearsExperience || 0),
          education: String(member.education || "").trim(),
        },
        signals: {
          missionsCompleted: Number(c.signals?.missionsCompleted || c.missions?.filter(m=>!m.skipped).length || 0),
          missionsFirstTry: Number(c.signals?.missionsFirstTry || 0),
          commitDays: Number(c.signals?.commitDays || 0),
        },
        missions: Array.isArray(c.missions)
          ? c.missions.map(m => ({
              day: Number(m.day),
              title: String(m.title || `Day ${m.day}`),
              skipped: !!m.skipped,
              attempts: Number(m.attempts || (m.skipped ? 0 : 1)),
            }))
          : [],
      };
    });

  _candidatesRaw = data;
  _candidates = clean;
  return _candidates;
}

function buildDayMap() {
  if (_dayById) return _dayById;
  const curriculum = loadCurriculum();
  _dayById = new Map(curriculum.days.map(d => [d.day, d]));
  return _dayById;
}

// Eager load for backward compatibility (original code did immediate read)
// But now with safe wrappers
const curriculum = loadCurriculum();
const candidates = loadCandidatesData();
const dayById = buildDayMap();

/**
 * Find module that contains a given day.
 * Preserved signature.
 */
function moduleForDay(day) {
  const dNum = Number(day);
  if (Number.isNaN(dNum)) return null;
  const cur = loadCurriculum(); // ensure loaded
  // Linear scan is fine (<30 modules), but we have sorted modules
  for (const m of cur.modules) {
    if (dNum >= m.days[0] && dNum <= m.days[1]) return m;
  }
  return null;
}

/**
 * Find candidate by id or name (case-insensitive, trimmed).
 * Preserved signature, but now more resilient: also matches partial name and id with dashes/underscores.
 */
function findCandidate(idOrName) {
  if (!idOrName) return null;
  const needle = String(idOrName).trim().toLowerCase();
  if (!needle) return null;

  const list = loadCandidatesData();
  // 1. Exact id
  let found = list.find(c => c.member.id.toLowerCase() === needle);
  if (found) return found;

  // 2. Exact name
  found = list.find(c => c.member.name.toLowerCase() === needle);
  if (found) return found;

  // 3. Normalized id (replace _ with -)
  const normalizedNeedle = needle.replace(/_/g, "-");
  found = list.find(c => c.member.id.toLowerCase().replace(/_/g, "-") === normalizedNeedle);
  if (found) return found;

  // 4. Partial name inclusion (first token)
  found = list.find(c => c.member.name.toLowerCase().includes(needle));
  if (found) return found;

  return null;
}

/**
 * Additional helpers (not breaking existing exports, additive)
 */
function getLoadError() {
  return _loadError;
}

function getDay(dayNumber) {
  return buildDayMap().get(Number(dayNumber)) || null;
}

module.exports = { curriculum, candidates, dayById, moduleForDay, findCandidate, getLoadError, getDay };
