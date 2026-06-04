import StarRating from "@/components/StarRating";
import type { ReputationSignals } from "@/lib/getReputationSignals";

type GoogleReview = {
  authorName: string;
  rating: number;
  text: string;
  relativePublishTimeDescription: string;
};

type Props = {
  googleRating: number | null;
  googleReviewCount: number | null;
  googleUrl: string | null;
  googleReviews: GoogleReview[] | null;
  googleMatchConfident?: boolean;
  /** true when Google returned a candidate but confidence was too low to accept */
  googleCandidateFound?: boolean;
  /** true when multiple same-name Google listings were found and couldn't be disambiguated */
  ambiguityRejected?: boolean;
  supplierName?: string | null;
  reputationSignals?: ReputationSignals | null;
};

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#085041" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#791F1F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function DashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888888" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

type SignalRowProps = { label: string; value: string; status: "positive" | "negative" | "neutral" };

function SignalRow({ label, value, status }: SignalRowProps) {
  const icon = status === "positive" ? <CheckIcon /> : status === "negative" ? <CrossIcon /> : <DashIcon />;
  const valueColor = status === "positive" ? "#085041" : status === "negative" ? "#791F1F" : "#666666";
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span style={{ fontSize: "13px", color: "#444444" }}>{label}</span>
      <span className="flex items-center gap-1.5">
        {icon}
        <span style={{ fontSize: "13px", fontWeight: 600, color: valueColor }}>{value}</span>
      </span>
    </div>
  );
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function firstNameOnly(fullName: string): string {
  return fullName.split(" ")[0] ?? fullName;
}

function truncate(text: string, max: number): { short: string; truncated: boolean } {
  if (text.length <= max) return { short: text, truncated: false };
  return { short: text.slice(0, max).trimEnd(), truncated: true };
}

export default function SocialProof({ googleRating, googleReviewCount, googleUrl, googleReviews, googleMatchConfident, googleCandidateFound, ambiguityRejected, supplierName, reputationSignals }: Props) {
  const hasListing = googleRating != null;
  // Multiple same-name listings found — can't pick a branch
  const isAmbiguityRejected = !hasListing && ambiguityRejected === true;
  // Searched, candidate found, but confidence too low
  const foundButRejected = !hasListing && !isAmbiguityRejected && googleMatchConfident === false && googleCandidateFound === true;
  // Searched (supplier name exists), no candidate returned at all
  const notFound = !hasListing && !isAmbiguityRejected && supplierName && !foundButRejected;
  const reviews = (googleReviews ?? []).slice(0, 3);

  return (
    <section className="space-y-4">
      <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant">
        Supplier reputation
      </p>

      {/* Signals checklist */}
      {reputationSignals && (
        <div className="bg-white rounded-[16px] px-6 divide-y divide-outline-variant/10">
          <SignalRow
            label="ABN provided"
            value={reputationSignals.hasABN ? reputationSignals.abnNumber ?? "Yes" : "No"}
            status={reputationSignals.hasABN ? "positive" : "negative"}
          />
          <SignalRow
            label="Licence number"
            value={
              reputationSignals.hasLicence
                ? reputationSignals.licenceNumber ?? "Yes"
                : reputationSignals.licenceRequired
                ? "No (required for this trade)"
                : "Not required for this trade"
            }
            status={
              reputationSignals.hasLicence
                ? "positive"
                : reputationSignals.licenceRequired
                ? "negative"
                : "neutral"
            }
          />
          <SignalRow
            label="Insurance mentioned"
            value={reputationSignals.hasInsurance ? "Yes" : "No"}
            status={reputationSignals.hasInsurance ? "positive" : "negative"}
          />
          <SignalRow
            label="Google reviews"
            value={
              reputationSignals.googleRating != null
                ? `${reputationSignals.googleRating} (${reputationSignals.googleReviewCount?.toLocaleString()} reviews)`
                : "Not found"
            }
            status={
              reputationSignals.googleRating != null
                ? reputationSignals.googleRating >= 4
                  ? "positive"
                  : reputationSignals.googleRating >= 3
                  ? "neutral"
                  : "negative"
                : "neutral"
            }
          />
          <SignalRow
            label="Seen in QOAT before"
            value={
              reputationSignals.qoatQuoteCount === 0
                ? "First time"
                : `${reputationSignals.qoatQuoteCount} previous quote${reputationSignals.qoatQuoteCount !== 1 ? "s" : ""}`
            }
            status={reputationSignals.qoatQuoteCount > 0 ? "positive" : "neutral"}
          />
        </div>
      )}

      {/* Summary card */}
      {hasListing ? (
        <div className="bg-white rounded-[16px] px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <GoogleG />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-extrabold tracking-tight text-on-surface">
                  {googleRating.toFixed(1)}
                </span>
                <StarRating rating={googleRating} size={15} />
              </div>
              <p style={{ fontSize: "13px", color: "#666666" }}>
                {googleReviewCount?.toLocaleString()} reviews on Google
              </p>
            </div>
          </div>
          {googleUrl && (
            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-primary hover:opacity-70 transition-opacity shrink-0 flex items-center gap-1"
            >
              View on Google Maps
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
              </svg>
            </a>
          )}
        </div>
      ) : isAmbiguityRejected ? (
        <div className="bg-white rounded-[16px] px-6 py-5 flex items-start gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div>
            <p className="text-sm font-semibold text-on-surface">
              We found multiple Google listings with this supplier name and couldn&apos;t confidently identify the right one.
            </p>
            <p className="text-sm text-on-surface-variant mt-0.5">
              This often happens with franchise or multi-branch businesses. Add a more specific location to your quote to help us match.
            </p>
          </div>
        </div>
      ) : foundButRejected ? (
        <div className="bg-white rounded-[16px] px-6 py-5 flex items-start gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div>
            <p className="text-sm font-semibold text-on-surface">
              We found a possible Google listing but couldn&apos;t confidently match it.
            </p>
            <p className="text-sm text-on-surface-variant mt-0.5">
              This may indicate a similar business name or limited information on the quote.
            </p>
          </div>
        </div>
      ) : notFound ? (
        <div className="bg-white rounded-[16px] px-6 py-5 flex items-start gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-on-surface-variant shrink-0 mt-0.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <div>
            <p className="text-sm font-semibold text-on-surface">
              We couldn&apos;t find a Google listing for this supplier.
            </p>
            <p className="text-sm text-on-surface-variant mt-0.5">
              This may indicate a new or unregistered business.
            </p>
          </div>
        </div>
      ) : null}

      {/* Review snippets */}
      {reviews.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-3">
            {reviews.map((review, i) => {
              const { short, truncated } = truncate(review.text, 150);
              return (
                <div
                  key={i}
                  className="bg-white rounded-[12px] px-5 py-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-on-surface">
                        {firstNameOnly(review.authorName)}
                      </span>
                      <StarRating rating={review.rating} size={12} />
                    </div>
                    <span style={{ fontSize: "12px", color: "#888888" }}>
                      {review.relativePublishTimeDescription}
                    </span>
                  </div>
                  {review.text && (
                    <p style={{ fontSize: "13px", color: "#444444", lineHeight: "1.5" }}>
                      {short}
                      {truncated && (
                        <>
                          {"… "}
                          <a
                            href={googleUrl ?? undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-primary hover:opacity-70 transition-opacity"
                          >
                            read more
                          </a>
                        </>
                      )}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          {googleUrl && (
            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: "13px" }}
              className="flex items-center gap-1 font-semibold text-primary hover:opacity-70 transition-opacity"
            >
              See all reviews on Google
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
              </svg>
            </a>
          )}
        </>
      ) : hasListing ? (
        <p style={{ fontSize: "13px", color: "#888888" }}>No reviews available.</p>
      ) : null}
    </section>
  );
}
