import { extractLocationHint, normaliseForSearch } from "./normaliseSupplierName";

// ── Types ─────────────────────────────────────────────────────────────────────

export type GoogleReview = {
  authorName: string;
  rating: number;
  text: string;
  relativePublishTimeDescription: string;
};

export type GoogleMatchDiagnostics = {
  querySupplierName: string;
  queryLocation: { suburb: string | null; state: string | null };
  /** Location hint extracted from parentheses in the supplier name, if any */
  locationHint: string | null;
  queriesAttempted: number;
  candidatesEvaluated: number;
  winningQuery: "A" | "B" | "C" | null;
  /** true when multiple same-name Google listings were found and couldn't be disambiguated */
  ambiguityRejected: boolean;
  googleCandidate: {
    displayName: string | null;
    formattedAddress: string | null;
    types: string[];
    primaryType: string | null;
  } | null;
  checks: {
    nameSimilarity: {
      levenshteinScore: number;
      tokenRecallScore: number;
      finalScore: number;
      passed: boolean;
      threshold: number;
    };
    locationProximity: {
      result: "match" | "soft" | "fail";
      score: number;
      reason: string;
    };
    businessType: {
      candidateTypes: string[];
      matchedTypes: string[];
      result: "match" | "soft" | "fail";
      score: number;
      reason: string;
    };
    compositeConfidence: number;
  };
};

export type GoogleReviewsResult = {
  confident: boolean;
  diagnostics: GoogleMatchDiagnostics | null;
  rating: number | null;
  reviewCount: number | null;
  placeId: string | null;
  googleUrl: string | null;
  reviews: GoogleReview[] | null;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const NAME_THRESHOLD = 0.70;
const COMPOSITE_THRESHOLD = 0.70;
const WEIGHT_NAME = 0.60;
const WEIGHT_LOCATION = 0.25;
const WEIGHT_TYPE = 0.15;

const FIELD_MASK =
  "places.id,places.displayName,places.formattedAddress," +
  "places.rating,places.userRatingCount,places.googleMapsUri," +
  "places.reviews,places.types,places.primaryType";

// Types that indicate a real physical local business even without a specific whitelist
const GENERIC_BUSINESS_TYPES = new Set([
  "establishment", "point_of_interest", "store", "local_business",
  "business", "organization",
]);

// Per-category whitelists using Google Places (New) types
const CATEGORY_TYPE_WHITELIST: Record<string, string[]> = {
  electrical:              ["electrician", "electrical_contractor"],
  plumbing:                ["plumber"],
  "building-construction": ["general_contractor", "construction_company", "builder",
                            "roofing_contractor", "carpenter", "renovation_service"],
  "hvac-heating":          ["hvac_contractor"],
  "painting-decorating":   ["painter", "painting"],
  landscaping:             ["landscaping", "landscape_architect",
                            "lawn_care_service", "garden_center"],
  automotive:              ["car_repair", "car_dealer", "auto_parts_store",
                            "auto_body_shop", "tire_shop"],
  insurance:               ["insurance_agency"],
  "supplier-products":     ["store", "home_goods_store", "furniture_store",
                            "hardware_store", "window_treatment_store", "lighting_store",
                            "flooring_store", "appliance_store", "wholesaler", "supplier",
                            "home_improvement_store", "general_store", "department_store"],
  other:                   [], // empty → always "soft"
};

// ── Similarity helpers ────────────────────────────────────────────────────────

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function levenshteinSimilarity(a: string, b: string): number {
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  return 1 - levenshtein(a, b) / Math.max(a.length, b.length);
}

/** What fraction of query tokens appear in the match tokens.
 *  Handles "Royal Crest Blinds" vs "Royal Crest Blinds & Shutters" → 1.0 */
function tokenRecall(query: string, match: string): number {
  const queryTokens = query.split(/\s+/).filter(Boolean);
  if (queryTokens.length === 0) return 0;
  const matchSet = new Set(match.split(/\s+/).filter(Boolean));
  return queryTokens.filter((t) => matchSet.has(t)).length / queryTokens.length;
}

/** Normalise for similarity comparison: lowercase, strip legal suffixes, country suffixes, punctuation except & */
function normaliseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\bpty\.?\s*ltd\.?\b/gi, "")
    .replace(/\bpty\.?\s*limited\.?\b/gi, "")
    .replace(/\blimited\b/gi, "")
    .replace(/\band\b/gi, "&")
    // Strip country/region suffixes — prevents "AU" dragging down similarity scores
    .replace(/\b(australia|aust|aus|au)\b/g, "")
    .replace(/[^a-z0-9&\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Scoring functions ─────────────────────────────────────────────────────────

function scoreNameSimilarity(
  supplierName: string,
  displayName: string | null,
): GoogleMatchDiagnostics["checks"]["nameSimilarity"] {
  const normQuery = normaliseName(supplierName);
  const normMatch = normaliseName(displayName ?? "");
  const levScore = levenshteinSimilarity(normQuery, normMatch);
  const recallScore = tokenRecall(normQuery, normMatch);
  const finalScore = Math.max(levScore, recallScore);
  return {
    levenshteinScore: round(levScore),
    tokenRecallScore: round(recallScore),
    finalScore: round(finalScore),
    passed: finalScore >= NAME_THRESHOLD,
    threshold: NAME_THRESHOLD,
  };
}

/**
 * Score location proximity.
 * @param effectiveSuburb - preferably the locationHint (business's own suburb),
 *                          falling back to the quote's suburb
 */
function scoreLocation(
  address: string,
  effectiveSuburb: string,
  state: string,
): GoogleMatchDiagnostics["checks"]["locationProximity"] {
  const addr = address.toLowerCase();
  const sub = effectiveSuburb.toLowerCase();
  const st = state.toLowerCase();

  if (sub && addr.includes(sub)) {
    return { result: "match", score: 1.0, reason: `suburb "${effectiveSuburb}" found in address` };
  }
  if (st && addr.includes(st)) {
    return { result: "soft", score: 0.5, reason: `state "${state}" found in address (no suburb match)` };
  }
  if (addr.includes("australia")) {
    return { result: "soft", score: 0.5, reason: '"Australia" found but no state/suburb match' };
  }
  return { result: "fail", score: 0.0, reason: `no AU location signal in address: "${address}"` };
}

function scoreType(
  candidateTypes: string[],
  categorySlug: string,
): GoogleMatchDiagnostics["checks"]["businessType"] {
  const whitelist = CATEGORY_TYPE_WHITELIST[categorySlug] ?? [];

  if (whitelist.length === 0) {
    return { candidateTypes, matchedTypes: [], result: "soft", score: 0.5,
      reason: `no whitelist for category "${categorySlug}" — soft accept` };
  }

  const matchedTypes = candidateTypes.filter((t) => whitelist.includes(t));
  if (matchedTypes.length > 0) {
    return { candidateTypes, matchedTypes, result: "match", score: 1.0,
      reason: `matched whitelist types: [${matchedTypes.join(", ")}]` };
  }

  const hasGeneric = candidateTypes.some((t) => GENERIC_BUSINESS_TYPES.has(t));
  if (hasGeneric) {
    const genericFound = candidateTypes.filter((t) => GENERIC_BUSINESS_TYPES.has(t));
    return { candidateTypes, matchedTypes: [], result: "soft", score: 0.5,
      reason: `no whitelist match but generic type(s) present: [${genericFound.join(", ")}]` };
  }

  return { candidateTypes, matchedTypes: [], result: "fail", score: 0.0,
    reason: `no match and no generic types — types: [${candidateTypes.slice(0, 4).join(", ")}]` };
}

// ── Google Places API call ────────────────────────────────────────────────────

async function searchPlace(
  textQuery: string,
  apiKey: string,
): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      // JSON.stringify handles all special characters (apostrophes, ampersands, dashes)
      body: JSON.stringify({ textQuery, pageSize: 1 }),
    });

    if (!res.ok) {
      console.error("[googlePlaces] API error", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    return data.places?.[0] ?? null;
  } catch (err) {
    console.error("[googlePlaces] fetch error:", err);
    return null;
  }
}

// ── Candidate scoring ─────────────────────────────────────────────────────────

type ScoredCandidate = {
  fromQuery: "A" | "B" | "C";
  rawPlace: Record<string, unknown>;
  placeId: string;
  displayName: string | null;
  formattedAddress: string | null;
  allTypes: string[];
  primaryType: string | null;
  nameSim: GoogleMatchDiagnostics["checks"]["nameSimilarity"];
  location: GoogleMatchDiagnostics["checks"]["locationProximity"];
  typeCheck: GoogleMatchDiagnostics["checks"]["businessType"];
  composite: number;
  confident: boolean;
};

function scoreRawPlace(
  rawPlace: Record<string, unknown>,
  fromQuery: "A" | "B" | "C",
  supplierName: string,
  effectiveSuburb: string,
  state: string,
  categorySlug: string,
): ScoredCandidate {
  const displayName = (rawPlace.displayName as { text?: string } | null)?.text ?? null;
  const formattedAddress = (rawPlace.formattedAddress as string | null) ?? null;
  const types = (rawPlace.types as string[] | null) ?? [];
  const primaryType = (rawPlace.primaryType as string | null) ?? null;
  const allTypes = primaryType ? [...new Set([...types, primaryType])] : types;

  const nameSim = scoreNameSimilarity(supplierName, displayName);
  const location = scoreLocation(formattedAddress ?? "", effectiveSuburb, state);
  const typeCheck = scoreType(allTypes, categorySlug);

  const composite = round(
    WEIGHT_NAME * nameSim.finalScore +
    WEIGHT_LOCATION * location.score +
    WEIGHT_TYPE * typeCheck.score,
  );

  return {
    fromQuery,
    rawPlace,
    placeId: (rawPlace.id as string) ?? "",
    displayName,
    formattedAddress,
    allTypes,
    primaryType,
    nameSim,
    location,
    typeCheck,
    composite,
    confident: nameSim.finalScore >= NAME_THRESHOLD && composite >= COMPOSITE_THRESHOLD,
  };
}

// ── Null result helpers ───────────────────────────────────────────────────────

function noChecksFailed(): GoogleMatchDiagnostics["checks"] {
  return {
    nameSimilarity: { levenshteinScore: 0, tokenRecallScore: 0, finalScore: 0,
      passed: false, threshold: NAME_THRESHOLD },
    locationProximity: { result: "fail", score: 0, reason: "no candidate returned by Google" },
    businessType: { candidateTypes: [], matchedTypes: [], result: "fail", score: 0, reason: "no candidate" },
    compositeConfidence: 0,
  };
}

function nullResult(diagnostics: GoogleMatchDiagnostics | null = null): GoogleReviewsResult {
  return { confident: false, diagnostics, rating: null, reviewCount: null,
    placeId: null, googleUrl: null, reviews: null };
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function findSupplierReviews(
  supplierName: string,
  suburb: string,
  state: string,
  categorySlug = "other",
): Promise<GoogleReviewsResult> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.warn("[googlePlaces] GOOGLE_PLACES_API_KEY not set — skipping lookup");
    return nullResult();
  }

  // ── Extract location hint from supplier name (e.g. "Jim's Diggers (Cranbourne)") ──
  const { cleanedName, locationHint } = extractLocationHint(supplierName);
  const searchName = normaliseForSearch(cleanedName);

  // Effective suburb for location proximity — prefer the business's own suburb from parens
  const effectiveSuburb = locationHint ?? suburb;

  // ── Build query list (max 3, hard cap) ────────────────────────────────────

  type QuerySpec = { label: "A" | "B" | "C"; text: string };
  const querySpecs: QuerySpec[] = [];

  // Query A — cleaned name + location hint + state (only if hint was found)
  if (locationHint) {
    const parts = [searchName, locationHint, state, "Australia"].filter(Boolean);
    querySpecs.push({ label: "A", text: parts.join(" ") });
  }

  // Query B — cleaned name + quote location (only if location info exists)
  if (suburb || state) {
    const parts = [searchName, suburb, state, "Australia"].filter(Boolean);
    const textB = parts.join(" ");
    // Skip if identical to Query A
    if (!querySpecs.some((q) => q.text === textB)) {
      querySpecs.push({ label: "B", text: textB });
    }
  }

  // Query C — cleaned name alone (always, unless duplicate of above)
  if (!querySpecs.some((q) => q.text === searchName)) {
    querySpecs.push({ label: "C", text: searchName });
  }

  const cappedQueries = querySpecs.slice(0, 3);

  // ── Execute queries and collect unique candidates ─────────────────────────

  const seenPlaceIds = new Set<string>();
  const scoredCandidates: ScoredCandidate[] = [];
  let queriesAttempted = 0;

  for (const spec of cappedQueries) {
    queriesAttempted++;
    console.log(`[googlePlaces] query ${spec.label} "${spec.text}"`);

    const rawPlace = await searchPlace(spec.text, apiKey);

    if (!rawPlace) {
      console.log(`[googlePlaces] query ${spec.label} → 0 candidates`);
      continue;
    }

    const placeId = (rawPlace.id as string) ?? "";
    if (seenPlaceIds.has(placeId)) {
      console.log(`[googlePlaces] query ${spec.label} → duplicate place_id, skipping`);
      continue;
    }
    seenPlaceIds.add(placeId);

    const scored = scoreRawPlace(rawPlace, spec.label, supplierName,
      effectiveSuburb, state, categorySlug);
    scoredCandidates.push(scored);

    console.log(`[googlePlaces] query ${spec.label} → 1 candidate: "${scored.displayName}" (composite ${scored.composite.toFixed(2)})`);
  }

  // ── Pick best candidate ───────────────────────────────────────────────────

  const baseDiag = {
    querySupplierName: supplierName,
    queryLocation: { suburb: suburb || null, state: state || null },
    locationHint,
    queriesAttempted,
    candidatesEvaluated: scoredCandidates.length,
  };

  if (scoredCandidates.length === 0) {
    const diag: GoogleMatchDiagnostics = {
      ...baseDiag,
      winningQuery: null,
      ambiguityRejected: false,
      googleCandidate: null,
      checks: noChecksFailed(),
    };
    console.log(`[googlePlaces] no candidates across all queries — REJECTED`);
    return nullResult(diag);
  }

  // Sort by composite descending
  scoredCandidates.sort((a, b) => b.composite - a.composite);

  // ── Multi-branch detection + re-scoring ───────────────────────────────────
  // Group by normalised display name — 2+ candidates with the same name = multi-branch
  const nameGroups = new Map<string, ScoredCandidate[]>();
  for (const c of scoredCandidates) {
    const norm = normaliseName(c.displayName ?? "");
    const group = nameGroups.get(norm) ?? [];
    group.push(c);
    nameGroups.set(norm, group);
  }

  // Re-score multi-branch groups: name is no longer a signal (30%), location is decisive (55%)
  for (const group of nameGroups.values()) {
    if (group.length >= 2) {
      for (const c of group) {
        c.composite = round(0.30 * c.nameSim.finalScore + 0.55 * c.location.score + 0.15 * c.typeCheck.score);
        c.confident = c.nameSim.finalScore >= NAME_THRESHOLD && c.composite >= COMPOSITE_THRESHOLD;
      }
    }
  }

  // Re-sort after possible re-scoring; pick winner
  scoredCandidates.sort((a, b) => b.composite - a.composite);
  const best = scoredCandidates[0];

  // ── Ambiguity guard ───────────────────────────────────────────────────────
  // If the top two same-name candidates score within 0.10 of each other, we can't pick
  let ambiguityRejected = false;
  const bestNorm = normaliseName(best.displayName ?? "");
  const sameNameGroup = nameGroups.get(bestNorm) ?? [];
  if (sameNameGroup.length >= 2) {
    sameNameGroup.sort((a, b) => b.composite - a.composite);
    const diff = sameNameGroup[0].composite - sameNameGroup[1].composite;
    if (diff < 0.10) {
      ambiguityRejected = true;
      const compositeList = sameNameGroup.map((c) => c.composite.toFixed(3)).join(", ");
      console.log(
        `[googlePlaces] ambiguity detected: ${sameNameGroup.length} candidates named "${best.displayName}" with composites [${compositeList}] — difference ${diff.toFixed(2)} < 0.10 → REJECTED for ambiguity`,
      );
    }
  }

  const isAccepted = best.confident && !ambiguityRejected;

  const diag: GoogleMatchDiagnostics = {
    ...baseDiag,
    winningQuery: isAccepted ? best.fromQuery : null,
    ambiguityRejected,
    googleCandidate: {
      displayName: best.displayName,
      formattedAddress: best.formattedAddress,
      types: best.allTypes,
      primaryType: best.primaryType,
    },
    checks: {
      nameSimilarity: best.nameSim,
      locationProximity: best.location,
      businessType: best.typeCheck,
      compositeConfidence: best.composite,
    },
  };

  // ── Structured log ────────────────────────────────────────────────────────

  const primaryCause = !best.nameSim.passed
    ? `name similarity ${best.nameSim.finalScore.toFixed(2)}`
    : best.location.result === "fail"
    ? `location fail`
    : best.typeCheck.result === "fail"
    ? `type fail`
    : `composite ${best.composite.toFixed(2)}`;

  if (isAccepted) {
    console.log(
      `[googlePlaces] best candidate: "${best.displayName}" (composite ${best.composite.toFixed(2)}) via query ${best.fromQuery} → ACCEPTED`,
    );
  } else if (!ambiguityRejected) {
    console.log(
      `[googlePlaces] best candidate: "${best.displayName}" (composite ${best.composite.toFixed(2)}) → REJECTED (primary cause: ${primaryCause})`,
    );
    return nullResult(diag);
  } else {
    return nullResult(diag);
  }

  // ── Build reviews ─────────────────────────────────────────────────────────

  const rp = best.rawPlace;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reviews: GoogleReview[] = ((rp.reviews as any[]) ?? []).map((r: any) => ({
    authorName: r.authorAttribution?.displayName ?? "Anonymous",
    rating: r.rating ?? 0,
    text: r.text?.text ?? "",
    relativePublishTimeDescription: r.relativePublishTimeDescription ?? "",
  }));

  return {
    confident: true,
    diagnostics: diag,
    rating: (rp.rating as number | null) ?? null,
    reviewCount: (rp.userRatingCount as number | null) ?? null,
    placeId: (rp.id as string | null) ?? null,
    googleUrl: (rp.googleMapsUri as string | null) ?? null,
    reviews: reviews.length > 0 ? reviews : null,
  };
}

// ── Utility ───────────────────────────────────────────────────────────────────

function round(n: number, dp = 3) {
  return Math.round(n * 10 ** dp) / 10 ** dp;
}
