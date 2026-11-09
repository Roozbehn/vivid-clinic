// Shared helpers for the Vivid Clinic review pipeline.
// Pure, dependency-free. Used by import / validate / summary / build.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const DATA_DIR = join(ROOT, 'src', 'data');
export const REVIEWS_PATH = join(DATA_DIR, 'google-reviews.json');
export const CLINIC_PATH = join(DATA_DIR, 'clinic.json');

export function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

// GBP API enum -> integer
const STAR_MAP = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
export function starRatingToInt(enumValue) {
  if (typeof enumValue === 'number') return enumValue;
  return STAR_MAP[enumValue] ?? 0;
}

// Google auto-translated comments arrive as:
//   "(Translated by Google) <translation>\n\n(Original)\n<original>"
// We keep the ORIGINAL verbatim and store the translation separately.
export function parseTranslation(comment) {
  const raw = (comment || '').trim();
  if (!raw) return { originalText: '', translatedText: '' };
  const transMarker = '(Translated by Google)';
  const origMarker = '(Original)';
  if (raw.includes(transMarker) && raw.includes(origMarker)) {
    const tIdx = raw.indexOf(transMarker);
    const oIdx = raw.indexOf(origMarker);
    if (oIdx > tIdx) {
      const translated = raw.slice(tIdx + transMarker.length, oIdx).trim();
      const original = raw.slice(oIdx + origMarker.length).trim();
      return { originalText: original, translatedText: translated };
    }
  }
  return { originalText: raw, translatedText: '' };
}

// Lightweight, conservative language hinting for the language filter.
// Returns { code, label } — only confident cases; otherwise English default.
export function detectLanguage(text) {
  const t = (text || '').trim();
  if (!t) return { code: '', label: '' };
  if (/[؀-ۿ]/.test(t)) return { code: 'ar', label: 'Arabic' };
  if (/[Ѐ-ӿ]/.test(t)) return { code: 'ru', label: 'Russian' };
  if (/[Ͱ-Ͽ]/.test(t)) return { code: 'el', label: 'Greek' };
  if (/[一-鿿]/.test(t)) return { code: 'zh', label: 'Chinese' };
  // Latin-script languages: score common function words per language and
  // pick the highest. A single signal (a Turkish surgeon's name like
  // "Pilancı", or "Klinik", which is both Turkish and German) used to decide
  // on its own, mislabelling German and English reviews as Turkish.
  const words = t.toLowerCase().match(/[\p{L}']+/gu) || [];
  const scores = { en: 0, tr: 0, de: 0, fr: 0, es: 0, ro: 0 };
  for (const w of words) {
    for (const [code, list] of Object.entries(LATIN_STOPWORDS)) {
      if (list.has(w)) scores[code] += 1;
    }
  }
  // Turkish-only letters are a weak signal (names carry them too): add a
  // small bonus only when Turkish words are already present.
  if (scores.tr > 0) scores.tr += Math.min(3, (t.match(/[ğıİşĞŞ]/g) || []).length * 0.25);
  const [best, bestScore] = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  if (bestScore === 0) return { code: 'en', label: 'English' };
  return { code: best, label: LATIN_LABELS[best] };
}

const LATIN_LABELS = { en: 'English', tr: 'Turkish', de: 'German', fr: 'French', es: 'Spanish', ro: 'Romanian' };
const LATIN_STOPWORDS = Object.fromEntries(Object.entries({
  en: 'the and i was very my with to for of is it in that this you thank thanks they we me all so recommend highly would',
  tr: 've çok bir bu için ile da de ki gibi en her çok teşekkür ederim ederiz kesinlikle tavsiye doktor hocam harika memnun kaldım oldu olarak sonra ama herkese güzel ilgili',
  de: 'und ich die der das mit nicht ist auch sehr war ein eine sich auf für zu dem den es danke arzt empfehlen wirklich',
  fr: 'et je le la les des une est pour avec très merci pas que qui dans sur clinique médecin recommande mon ma',
  es: 'y el la los las una es por con muy gracias que del en mi clínica médico recomiendo todo',
  ro: 'și foarte pentru această acest clinică clinica mulțumită mulțumit este sunt cu în fost recomand doamna domnul care'
}).map(([code, s]) => [code, new Set(s.split(/\s+/))]));

// Theme tagging — only tags that genuinely appear in the text are attached.
const THEME_KEYWORDS = {
  communication: ['communicat', 'whatsapp', 'respond', 'reply', 'answered', 'kept me informed', 'explained', 'in touch', 'contact'],
  staff: ['staff', 'team', 'coordinator', 'nurse', 'reception', 'friendly', 'kind', 'caring', 'welcoming', 'hospitality', 'helpful'],
  cleanliness: ['clean', 'hygien', 'sterile', 'modern', 'facilit', 'spotless', 'tidy'],
  doctor: ['doctor', 'dr.', 'dr ', 'surgeon', 'professional', 'expert', 'skilled', 'confiden', 'experienced'],
  coordination: ['transfer', 'hotel', 'airport', 'pickup', 'pick-up', 'accommodation', 'arrange', 'organiz', 'organis', 'driver'],
  followup: ['follow up', 'follow-up', 'aftercare', 'post-op', 'post op', 'recovery', 'checked on', 'after the surgery', 'after surgery'],
  results: ['result', 'natural', 'happy with', 'amazing', 'transformation', 'outcome', 'satisfied', 'recommend'],
  value: ['price', 'value', 'worth', 'affordable', 'cost', 'package']
};
export const THEME_LABELS = {
  communication: 'Clear communication',
  staff: 'Friendly staff',
  cleanliness: 'Modern, clean clinic',
  doctor: 'Confidence in the doctors',
  coordination: 'Travel & hotel coordination',
  followup: 'Post-op follow-up',
  results: 'Happy with results',
  value: 'Value for money'
};
export function deriveTags(text) {
  const t = (text || '').toLowerCase();
  if (!t) return [];
  const tags = [];
  for (const [theme, words] of Object.entries(THEME_KEYWORDS)) {
    if (words.some((w) => t.includes(w))) tags.push(theme);
  }
  return tags;
}

export function relativeDate(iso, now = new Date()) {
  if (!iso) return '';
  const then = new Date(iso);
  if (isNaN(then)) return '';
  const days = Math.floor((now - then) / 86400000);
  if (days < 1) return 'today';
  if (days < 2) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return months === 1 ? 'a month ago' : `${months} months ago`;
  const years = Math.floor(days / 365);
  return years === 1 ? 'a year ago' : `${years} years ago`;
}

// Compute all derived summary stats from a normalized reviews array.
export function computeSummary(reviews) {
  const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const langDist = {};
  let withText = 0;
  let withReply = 0;
  let latest = null;
  let ratingSum = 0;
  for (const r of reviews) {
    if (dist[r.rating] !== undefined) dist[r.rating] += 1;
    ratingSum += r.rating || 0;
    if ((r.originalText || '').trim()) withText += 1;
    if ((r.ownerReply || '').trim()) withReply += 1;
    const lang = r.originalLanguage || 'unknown';
    langDist[lang] = (langDist[lang] || 0) + 1;
    if (r.publishedAt && (!latest || new Date(r.publishedAt) > new Date(latest))) {
      latest = r.publishedAt;
    }
  }
  const total = reviews.length;
  const average = total ? Math.round((ratingSum / total) * 10) / 10 : 0;
  const fiveStarPct = total ? Math.round((dist[5] / total) * 1000) / 10 : 0;
  return {
    totalReviewCount: total,
    averageRating: average,
    ratingDistribution: dist,
    languageDistribution: langDist,
    fiveStarPercentage: fiveStarPct,
    reviewsWithText: withText,
    reviewsWithOwnerReply: withReply,
    latestReviewDate: latest
  };
}

// Aggregate theme frequencies across all reviews (for the "Review themes" section).
export function computeThemes(reviews) {
  const counts = {};
  for (const r of reviews) {
    for (const tag of r.tags || []) counts[tag] = (counts[tag] || 0) + 1;
  }
  return Object.entries(counts)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({ key, label: THEME_LABELS[key] || key, count }));
}

export function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Stable fallback id when the source provides none.
export function fallbackId({ reviewerName, rating, publishedAt, originalText }) {
  const basis = `${reviewerName}|${rating}|${publishedAt}|${(originalText || '').slice(0, 64)}`;
  let h = 0;
  for (let i = 0; i < basis.length; i++) {
    h = (Math.imul(31, h) + basis.charCodeAt(i)) | 0;
  }
  return 'gen_' + (h >>> 0).toString(36);
}
