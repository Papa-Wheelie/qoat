export type GoogleReview = {
  authorName: string;
  rating: number;
  text: string;
  relativePublishTimeDescription: string;
};

export type GoogleReviewsResult = {
  rating: number | null;
  reviewCount: number | null;
  placeId: string | null;
  googleUrl: string | null;
  reviews: GoogleReview[] | null;
  /** true when the match passed all confidence checks */
  confident: boolean;
};

// ── Levenshtein distance ──────────────────────────────────────────────────────

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

function nameSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const dist = levenshtein(a, b);
  return 1 - dist / Math.max(a.length, b.length);
}

// Normalise a supplier name for comparison: lowercase, strip legal suffixes, punctuation
function normaliseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\bpty\.?\s*ltd\.?\b/gi, "")
    .replace(/\bpty\.?\s*limited\.?\b/gi, "")
    .replace(/\blimited\b/gi, "")
    .replace(/\band\b/gi, "&")
    .replace(/[^a-z0-9&\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Business type whitelists per QOAT category slug ──────────────────────────

const CATEGORY_TYPE_WHITELIST: Record<string, string[]> = {
  electrical:               ["electrician", "electrical_contractor", "general_contractor"],
  plumbing:                 ["plumber", "plumbing_supply_store", "general_contractor"],
  "building-construction":  ["general_contractor", "roofing_contractor", "home_improvement_store", "construction_company"],
  "hvac-heating":           ["hvac_contractor", "general_contractor", "home_improvement_store"],
  "painting-decorating":    ["painter", "general_contractor"],
  landscaping:              ["landscaper", "garden_center", "lawn_care_service"],
  automotive:               ["car_repair", "auto_parts_store", "auto_body_shop", "car_dealer"],
  insurance:                ["insurance_agency", "insurance_company"],
  "supplier-products":      ["home_improvement_store", "hardware_store", "general_store", "department_store"],
  other:                    [], // no whitelist — accept any
};

// ── Main export ───────────────────────────────────────────────────────────────

const NULL_RESULT: GoogleReviewsResult = {
  rating: null,
  reviewCount: null,
  placeId: null,
  googleUrl: null,
  reviews: null,
  confident: false,
};

export async function findSupplierReviews(
  supplierName: string,
  suburb: string,
  state: string,
  categorySlug = "other"
): Promise<GoogleReviewsResult> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.warn("[googlePlaces] GOOGLE_PLACES_API_KEY not set — skipping lookup");
    return NULL_RESULT;
  }

  const queryParts = [supplierName, suburb, state, "Australia"].filter(Boolean);
  const textQuery = queryParts.join(" ");

  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.googleMapsUri,places.reviews,places.types,places.primaryType",
      },
      body: JSON.stringify({ textQuery, pageSize: 1 }),
    });

    if (!res.ok) {
      console.error("[googlePlaces] API error", res.status, await res.text());
      return NULL_RESULT;
    }

    const data = await res.json();
    const place = data.places?.[0];

    if (!place) {
      console.log("[googlePlaces] no results for:", textQuery);
      return NULL_RESULT;
    }

    // ── Confidence checks ─────────────────────────────────────────────────────

    // 1. Name similarity ≥ 0.70
    const matchedName: string = place.displayName?.text ?? "";
    const normQuery = normaliseName(supplierName);
    const normMatch = normaliseName(matchedName);
    const sim = nameSimilarity(normQuery, normMatch);

    if (sim < 0.70) {
      console.log(
        `[googlePlaces] rejected: name similarity ${sim.toFixed(2)} < 0.70 — query="${normQuery}" match="${normMatch}"`
      );
      return NULL_RESULT;
    }

    // 2. Location proximity — formattedAddress must contain suburb/state or "Australia"
    const address: string = (place.formattedAddress ?? "").toLowerCase();
    const suburbLower = suburb.toLowerCase();
    const stateLower = state.toLowerCase();
    const hasLocation =
      (suburbLower && address.includes(suburbLower)) ||
      (stateLower && address.includes(stateLower)) ||
      address.includes("australia");

    if (!hasLocation) {
      console.log(
        `[googlePlaces] rejected: address "${place.formattedAddress}" doesn't match suburb/state/Australia`
      );
      return NULL_RESULT;
    }

    // 3. Business type relevance — per-category whitelist (empty list = accept any)
    const whitelist = CATEGORY_TYPE_WHITELIST[categorySlug] ?? [];
    if (whitelist.length > 0) {
      const placeTypes: string[] = [
        ...(place.types ?? []),
        ...(place.primaryType ? [place.primaryType] : []),
      ];
      const typeMatch = placeTypes.some((t: string) => whitelist.includes(t));
      if (!typeMatch) {
        console.log(
          `[googlePlaces] rejected: types [${placeTypes.join(", ")}] not in whitelist for category "${categorySlug}"`
        );
        return NULL_RESULT;
      }
    }

    console.log(
      `[googlePlaces] accepted: sim=${sim.toFixed(2)} name="${matchedName}" addr="${place.formattedAddress}"`
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reviews: GoogleReview[] = (place.reviews ?? []).map((r: any) => ({
      authorName: r.authorAttribution?.displayName ?? "Anonymous",
      rating: r.rating ?? 0,
      text: r.text?.text ?? "",
      relativePublishTimeDescription: r.relativePublishTimeDescription ?? "",
    }));

    return {
      rating: place.rating ?? null,
      reviewCount: place.userRatingCount ?? null,
      placeId: place.id ?? null,
      googleUrl: place.googleMapsUri ?? null,
      reviews: reviews.length > 0 ? reviews : null,
      confident: true,
    };
  } catch (err) {
    console.error("[googlePlaces] fetch error:", err);
    return NULL_RESULT;
  }
}
