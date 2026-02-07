/**
 * Keyword extraction and mentor-matching utilities for intelligent suggestions.
 */

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
  'can', 'need', 'dare', 'ought', 'used', 'i', 'me', 'my', 'we', 'our', 'you', 'your',
  'it', 'its', 'this', 'that', 'these', 'those', 'am', 'into', 'through', 'during'
]);

/**
 * Extract meaningful keywords from text (project idea, guidance needed, etc.)
 * @param {string} text - Raw text
 * @returns {string[]} - Normalized keywords (lowercase, no duplicates, no stop words)
 */
function extractKeywordsFromText(text) {
  if (!text || typeof text !== 'string') return [];
  const normalized = text.toLowerCase().replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' ');
  const words = normalized.split(' ').filter(w => w.length > 1 && !STOP_WORDS.has(w));
  return [...new Set(words)];
}

/**
 * Combine and dedupe keywords from array and from text fields.
 * @param {string[]} keywordArray - e.g. project.keywords
 * @param {string} [idea] - Project idea text
 * @param {string} [guidanceNeeded] - Guidance needed text
 * @param {string} [title] - Project title
 * @returns {string[]}
 */
function gatherKeywords(keywordArray = [], idea = '', guidanceNeeded = '', title = '') {
  const set = new Set();
  keywordArray.forEach(k => {
    if (k && typeof k === 'string') set.add(k.toLowerCase().trim());
  });
  extractKeywordsFromText(idea).forEach(k => set.add(k));
  extractKeywordsFromText(guidanceNeeded).forEach(k => set.add(k));
  extractKeywordsFromText(title).forEach(k => set.add(k));
  return [...set];
}

/**
 * Normalize keyword string from request (e.g. "ML, Python, APIs" or "machine learning python")
 * @param {string[]|string} keywords - Array of keywords or comma/space-separated string
 * @returns {string[]}
 */
function normalizeKeywordInput(keywords) {
  if (Array.isArray(keywords)) {
    return keywords
      .filter(k => k != null && String(k).trim())
      .map(k => String(k).toLowerCase().trim());
  }
  if (typeof keywords === 'string') {
    return keywords.split(/[\s,;]+/).map(k => k.trim().toLowerCase()).filter(Boolean);
  }
  return [];
}

/**
 * Score a mentor against search keywords.
 * Weights: expertise exact match (3), expertise partial (2), summary/description/projectsDone (1).
 * @param {Object} mentor - Mentor document (with expertise, summary, shortDescription, projectsDone)
 * @param {string[]} searchKeywords
 * @returns {{ score: number, matchedKeywords: string[] }}
 */
function scoreMentor(mentor, searchKeywords) {
  let score = 0;
  const matchedKeywords = [];
  const expertise = (mentor.expertise || []).map(e => (e && e.toLowerCase().trim()));
  const summary = (mentor.summary || '').toLowerCase();
  const shortDesc = (mentor.shortDescription || '').toLowerCase();
  const projectsDone = (mentor.projectsDone || '').toLowerCase();
  const textFields = [summary, shortDesc, projectsDone].join(' ');

  for (const kw of searchKeywords) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const wordRegex = new RegExp(`\\b${escaped}\\b`, 'i');
    const partialRegex = new RegExp(escaped, 'i');

    const exactInExpertise = expertise.some(e => e === kw);
    const partialInExpertise = expertise.some(e => e.includes(kw) || kw.includes(e));
    const wordInExpertise = expertise.some(e => wordRegex.test(e));

    if (exactInExpertise || wordInExpertise) {
      score += 3;
      if (!matchedKeywords.includes(kw)) matchedKeywords.push(kw);
    } else if (partialInExpertise) {
      score += 2;
      if (!matchedKeywords.includes(kw)) matchedKeywords.push(kw);
    } else if (partialRegex.test(textFields)) {
      score += 1;
      if (!matchedKeywords.includes(kw)) matchedKeywords.push(kw);
    }
  }

  return { score, matchedKeywords };
}

module.exports = {
  extractKeywordsFromText,
  gatherKeywords,
  normalizeKeywordInput,
  scoreMentor
};
