// ── Location hint extraction ──────────────────────────────────────────────────

// Patterns that indicate parens content is NOT a location hint
const PAREN_NON_LOCATION_RE = /\d|ABN|ACN|Pty|Ltd|Inc|No\.|#/i;

/**
 * Detects a suburb/state hint embedded in parentheses in a supplier name.
 *
 * e.g. "Jim's Diggers (Cranbourne)"  → { cleanedName: "Jim's Diggers", locationHint: "Cranbourne" }
 *      "ABC Co (ABN 12345 678)"      → { cleanedName: "ABC Co",         locationHint: null }
 *      "Royal Crest Blinds"          → { cleanedName: "Royal Crest Blinds", locationHint: null }
 */
export function extractLocationHint(supplierName: string): {
  cleanedName: string;
  locationHint: string | null;
} {
  const parenMatch = supplierName.match(/\(([^)]+)\)/);

  // Remove any parenthetical content from the name regardless
  const cleanedName = supplierName
    .replace(/\([^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!parenMatch) {
    return { cleanedName, locationHint: null };
  }

  const content = parenMatch[1].trim();

  // Reject if it looks like a legal/numeric identifier rather than a suburb
  if (PAREN_NON_LOCATION_RE.test(content)) {
    return { cleanedName, locationHint: null };
  }

  // Accept if 1-3 words, all alphabetical (suburb names are words, not numbers)
  const words = content.split(/\s+/);
  if (words.length >= 1 && words.length <= 3 && words.every((w) => /^[a-zA-Z'-]+$/.test(w))) {
    return { cleanedName, locationHint: content };
  }

  return { cleanedName, locationHint: null };
}

// ── Search query normalisation ────────────────────────────────────────────────

/**
 * Normalises a supplier name into a clean search-ready string for the Google
 * Places API. Keeps apostrophes (Google handles them fine). Strips legal
 * suffixes, special punctuation, and extra whitespace.
 *
 * Different from the internal `normaliseName` (used for similarity comparison)
 * — that one strips more aggressively. This one is for building query strings.
 *
 * e.g. "Jim's Diggers (Cranbourne)" → "Jim's Diggers"  (parens handled upstream)
 *      "Royal Crest Blinds Pty Ltd" → "Royal Crest Blinds"
 *      "Steela AU"                  → "Steela AU"
 *      "A–Z Trades"                 → "A-Z Trades"      (en-dash → hyphen)
 */
export function normaliseForSearch(supplierName: string): string {
  return supplierName
    // Normalise Unicode dashes to hyphens
    .replace(/[–—]/g, "-")
    // Normalise Unicode quotes to ASCII
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    // Strip legal suffixes (case-insensitive, word-boundary)
    .replace(/\bPty\.?\s*Ltd\.?\b/gi, "")
    .replace(/\bPty\.?\s*Limited\.?\b/gi, "")
    .replace(/\bP\/L\b/gi, "")
    .replace(/\bLimited\b/gi, "")
    .replace(/\bLtd\.?\b/gi, "")
    .replace(/\bInc\.?\b/gi, "")
    // Remove parenthetical content (location hint already extracted upstream)
    .replace(/\([^)]*\)/g, "")
    // Remove punctuation except apostrophes and hyphens
    .replace(/[^a-zA-Z0-9'\-\s]/g, "")
    // Collapse whitespace
    .replace(/\s+/g, " ")
    .trim();
}

/*
 * ── Expected inputs/outputs ────────────────────────────────────────────────
 *
 * extractLocationHint:
 *   "Jim's Diggers (Cranbourne)"       → { cleanedName: "Jim's Diggers",         locationHint: "Cranbourne" }
 *   "Jim's Diggers (Cranbourne North)" → { cleanedName: "Jim's Diggers",         locationHint: "Cranbourne North" }
 *   "ABC Company (ABN 12 345 678 901)" → { cleanedName: "ABC Company",           locationHint: null }
 *   "XYZ (Pty Ltd)"                    → { cleanedName: "XYZ",                   locationHint: null }
 *   "Royal Crest Blinds"               → { cleanedName: "Royal Crest Blinds",    locationHint: null }
 *   "Acme (NSW)"                       → { cleanedName: "Acme",                  locationHint: "NSW" }
 *
 * normaliseForSearch:
 *   "Jim's Diggers Pty Ltd"            → "Jim's Diggers"
 *   "Royal Crest Blinds & Shutters"    → "Royal Crest Blinds & Shutters"
 *   "A–Z Plumbing"                     → "A-Z Plumbing"
 *   "Steela AU"                        → "Steela AU"
 *   "Matt Caminiti Design Inc."        → "Matt Caminiti Design"
 *   "O'Brien's Glass P/L"              → "O'Brien's Glass"
 */
