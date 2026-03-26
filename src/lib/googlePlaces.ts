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
};

export async function findSupplierReviews(
  supplierName: string,
  suburb: string,
  state: string
): Promise<GoogleReviewsResult> {
  const nullResult: GoogleReviewsResult = {
    rating: null,
    reviewCount: null,
    placeId: null,
    googleUrl: null,
    reviews: null,
  };

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.warn("[googlePlaces] GOOGLE_PLACES_API_KEY not set — skipping lookup");
    return nullResult;
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
          "places.id,places.rating,places.userRatingCount,places.googleMapsUri,places.reviews",
      },
      body: JSON.stringify({
        textQuery,
        pageSize: 1,
      }),
    });

    if (!res.ok) {
      console.error("[googlePlaces] API error", res.status, await res.text());
      return nullResult;
    }

    const data = await res.json();
    console.log("[googlePlaces] raw response:", JSON.stringify(data, null, 2));

    const place = data.places?.[0];

    if (!place) {
      console.log("[googlePlaces] no results for:", textQuery);
      return nullResult;
    }

    console.log("[googlePlaces] place keys:", Object.keys(place));

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
    };
  } catch (err) {
    console.error("[googlePlaces] fetch error:", err);
    return nullResult;
  }
}
