import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { type Metadata } from "next";
import { type ReactNode } from "react";
import CommunitySection from "./CommunitySection";
import QuoteOwnerActions from "./QuoteOwnerActions";
import ShareButton from "./ShareButton";
import { formatPublicPrice } from "@/lib/formatPrice";
import SocialProof from "@/components/SocialProof";

type LineItem = {
  description: string;
  quantity?: number | null;
  unitPrice?: number | null;
  totalPrice?: number | null;
};

type GoogleReview = {
  authorName: string;
  rating: number;
  text: string;
  relativePublishTimeDescription: string;
};

function formatAUD(amount: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(amount);
}

// ── Score helpers ────────────────────────────────────────────────────────────

const VERDICT_SENTIMENT: Record<string, "positive" | "neutral" | "negative"> = {
  fair: "neutral", low: "positive", high: "negative",
  competitive: "positive", expensive: "negative",
  trustworthy: "positive", adequate: "neutral", concerning: "negative", unknown: "neutral",
  fast: "positive", typical: "neutral", slow: "negative", unspecified: "neutral",
};

const SENTIMENT_BADGE: Record<"positive" | "neutral" | "negative", { bg: string; color: string }> = {
  positive: { bg: "#E1F5EE", color: "#085041" },
  neutral:  { bg: "#FAEEDA", color: "#633806" },
  negative: { bg: "#FCEBEB", color: "#791F1F" },
};

function scoreColor(score: number): string {
  if (score >= 8) return "#27500A";
  if (score >= 5) return "#633806";
  return "#791F1F";
}

// ── Components ───────────────────────────────────────────────────────────────


type ScoreCardProps = {
  label: string;
  score: number | null;
  verdict: string | null;
  explanation: string | null;
  accent: string;
  extra?: ReactNode;
};

function ScoreCard({ label, score, verdict, explanation, accent, extra }: ScoreCardProps) {
  if (score == null) {
    return (
      <div
        className="flex-1 rounded-[16px] bg-white px-6 py-6 flex flex-col gap-3 min-w-0"
        style={{ borderLeft: "4px solid #E0E0E0" }}
      >
        <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant">{label}</p>
        <p className="text-sm text-on-surface-variant">Scoring…</p>
      </div>
    );
  }

  const sentiment = VERDICT_SENTIMENT[verdict?.toLowerCase() ?? ""] ?? "neutral";
  const badge = SENTIMENT_BADGE[sentiment];

  return (
    <div
      className="flex-1 rounded-[16px] bg-white px-6 py-6 flex flex-col gap-3 min-w-0"
      style={{ borderLeft: `4px solid ${accent}` }}
    >
      <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant">{label}</p>

      <div className="flex items-end gap-2">
        <span
          className="text-5xl font-extrabold tracking-tighter leading-none"
          style={{ color: scoreColor(score) }}
        >
          {score}
        </span>
        <span className="text-lg font-semibold text-on-surface-variant mb-1">/10</span>
      </div>

      {/* 10-segment score bar */}
      <div className="flex gap-[3px]">
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full"
            style={{ backgroundColor: i < score ? accent : `${accent}26` }}
          />
        ))}
      </div>

      {verdict && (
        <span
          className="inline-block self-start px-3 py-1 rounded-full text-xs font-bold capitalize"
          style={{ backgroundColor: badge.bg, color: badge.color }}
        >
          {verdict}
        </span>
      )}
      {explanation && (
        <p style={{ fontSize: "13px", color: "#444444", lineHeight: "1.5" }}>{explanation}</p>
      )}
      {extra}
    </div>
  );
}

function QoatScore({ price, rep, time }: { price: number; rep: number; time: number }) {
  const raw = price * 0.4 + rep * 0.35 + time * 0.25;
  const score = Math.round(raw * 10) / 10;
  const color = scoreColor(Math.round(score));

  return (
    <div className="bg-white rounded-[16px] px-6 py-6 flex items-center gap-6">
      <div>
        <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant mb-2">
          QOAT Score
        </p>
        <div className="flex items-end gap-2">
          <span className="text-6xl font-extrabold tracking-tighter leading-none" style={{ color }}>
            {score}
          </span>
          <div className="flex flex-col pb-1">
            <span className="text-lg font-semibold text-on-surface-variant">/10</span>
            <span className="text-xs text-on-surface-variant">AI analysis</span>
          </div>
        </div>
      </div>
      <div className="flex-1 text-xs text-on-surface-variant leading-relaxed hidden sm:block">
        Weighted average of Price (40%), Reputation (35%), and Time (25%).
      </div>
    </div>
  );
}

// ── Recommendation config ────────────────────────────────────────────────────

type RecommendationConfig = { heading: string; color: string; icon: ReactNode };

const RECOMMENDATION_CONFIG: Record<string, RecommendationConfig> = {
  accept: {
    heading: "Looks good to proceed",
    color: "#085041",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
  negotiate: {
    heading: "Worth negotiating",
    color: "#633806",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
        <polyline points="19 8 12 1 5 8" />
      </svg>
    ),
  },
  reject: {
    heading: "We suggest rejecting this quote",
    color: "#791F1F",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
  },
  "get-more-quotes": {
    heading: "Get more quotes first",
    color: "#791F1F",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        <line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
      </svg>
    ),
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { analysis: true },
  });
  if (!quote) return { title: "Quote not found — QOAT" };
  const description =
    quote.analysis?.publicSummary ?? "Get this quote validated by AI and the community.";
  return {
    title: `${quote.title} — QOAT`,
    description,
    openGraph: {
      title: `${quote.title} — QOAT`,
      description,
      url: `https://getqoat.com/quotes/${id}`,
      siteName: "QOAT",
      type: "article",
    },
  };
}

export default async function QuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const currentUserId = session?.user?.id ?? null;

  const [quote, initialComments, quoteVoteCount, userVote] = await Promise.all([
    prisma.quote.findUnique({
      where: { id },
      include: { analysis: true, category: true },
    }),
    prisma.comment.findMany({
      where: { quoteId: id, parentId: null },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { name: true } },
        votes: { select: { userId: true } },
        replies: {
          orderBy: { createdAt: "asc" },
          include: {
            user: { select: { name: true } },
            votes: { select: { userId: true } },
          },
        },
      },
    }),
    prisma.vote.count({ where: { quoteId: id } }),
    currentUserId
      ? prisma.vote.findUnique({
          where: { userId_quoteId: { userId: currentUserId, quoteId: id } },
        })
      : null,
  ]);

  if (!quote) notFound();

  const analysis = quote.analysis;
  const lineItems = analysis ? (analysis.lineItems as LineItem[]) : [];
  const redFlags = analysis ? (analysis.redFlags as string[]) : [];
  const questionsToAsk = analysis ? (analysis.questionsToAsk as string[] | null) ?? [] : [];
  const hasScores = analysis?.priceScore != null;
  const isOwner = currentUserId === quote.userId;

  const serializedComments = initialComments.map((c) => ({
    id: c.id,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    user: { name: c.user.name },
    voteCount: c.votes.length,
    userVoted: currentUserId ? c.votes.some((v) => v.userId === currentUserId) : false,
    replies: c.replies.map((r) => ({
      id: r.id,
      content: r.content,
      createdAt: r.createdAt.toISOString(),
      user: { name: r.user.name },
      voteCount: r.votes.length,
      userVoted: currentUserId ? r.votes.some((v) => v.userId === currentUserId) : false,
      replies: [],
    })),
  }));

  return (
    <main className="min-h-screen bg-surface pt-14 py-16 px-6 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-8">

        {/* Header */}
        <header className="space-y-3">
          <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant">
            {quote.category.name}
            {(quote.suburb || quote.state) && (
              <span className="font-normal normal-case tracking-normal">
                {" · "}
                {[quote.suburb, quote.state].filter(Boolean).join(", ")}
              </span>
            )}
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-primary">
            {quote.title}
          </h1>
          {quote.description && (
            <p className="text-on-surface-variant">{quote.description}</p>
          )}
          {isOwner ? (
            <QuoteOwnerActions
              quoteId={quote.id}
              initialStatus={quote.status as "pending" | "accepted" | "rejected"}
            />
          ) : (
            <ShareButton />
          )}
        </header>

        {!analysis ? (
          <div className="bg-surface-container-low rounded-[16px] px-6 py-12 text-center">
            <p className="text-on-surface-variant font-medium">
              AI analysis pending…
            </p>
          </div>
        ) : (
          <>
            {/* Public summary + total — visible to everyone */}
            <section className="bg-surface-container-lowest rounded-[16px] px-6 py-6 space-y-4">
              {analysis.totalAmount != null && (
                <div>
                  <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant mb-1">
                    {isOwner ? "Total" : "Estimated range"}
                  </p>
                  <p className="text-2xl font-extrabold tracking-tight text-primary">
                    {isOwner
                      ? formatAUD(analysis.totalAmount)
                      : formatPublicPrice(analysis.totalAmount, quote.category.slug)}
                  </p>
                </div>
              )}
              {analysis.publicSummary && (
                <p className="text-on-surface leading-relaxed border-t border-outline-variant/20 pt-4">
                  {analysis.publicSummary}
                </p>
              )}
            </section>

            {/* Owner-only block */}
            {isOwner ? (
              <>
                {/* 1. Supplier + AI summary */}
                <section className="bg-surface-container-lowest rounded-[16px] px-6 py-6 space-y-3">
                  <div>
                    <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant mb-1">
                      Supplier
                    </p>
                    <p className="text-lg font-bold text-on-surface">
                      {analysis.supplierName ?? "Unknown"}
                    </p>
                  </div>
                  {analysis.summary && (
                    <p className="text-on-surface leading-relaxed pt-3 border-t border-outline-variant/20">
                      {analysis.summary}
                    </p>
                  )}
                </section>

                {/* 2. Iron triangle */}
                <section className="space-y-4">
                  <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant">
                    Iron Triangle
                  </p>

                  {/* QOAT overall score */}
                  {hasScores && (
                    <QoatScore
                      price={analysis.priceScore!}
                      rep={analysis.reputationScore!}
                      time={analysis.timeScore!}
                    />
                  )}

                  <div className="flex flex-col sm:flex-row gap-4">
                    <ScoreCard
                      label="Price"
                      score={analysis.priceScore}
                      verdict={analysis.priceVerdict}
                      explanation={analysis.priceExplanation}
                      accent="#7DD4C0"
                      extra={
                        analysis.priceScore != null ? (
                          analysis.priceSampleSize != null && analysis.priceSampleSize >= 3 ? (
                            <p style={{ fontSize: "12px", color: "#888888", display: "flex", alignItems: "center", gap: "4px" }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                              </svg>
                              Benchmarked against {analysis.priceSampleSize} similar jobs
                            </p>
                          ) : (
                            <p style={{ fontSize: "12px", color: "#888888", display: "flex", alignItems: "center", gap: "4px" }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                              </svg>
                              Based on AI market estimate
                            </p>
                          )
                        ) : null
                      }
                    />
                    <ScoreCard
                      label="Reputation"
                      score={analysis.reputationScore}
                      verdict={analysis.reputationVerdict}
                      explanation={analysis.reputationExplanation}
                      accent="#F4A7C3"
                    />
                    <ScoreCard
                      label="Time"
                      score={analysis.timeScore}
                      verdict={analysis.timeVerdict}
                      explanation={analysis.timeExplanation}
                      accent="#89CFF0"
                    />
                  </div>
                </section>

                {/* 3. Overall recommendation */}
                {hasScores && analysis.recommendation && (() => {
                  const config = RECOMMENDATION_CONFIG[analysis.recommendation];
                  if (!config) return null;
                  return (
                    <section className="bg-surface-container-lowest rounded-[16px] px-6 py-6 space-y-3">
                      <div className="flex items-center gap-3" style={{ color: config.color }}>
                        {config.icon}
                        <p className="text-base font-bold">{config.heading}</p>
                      </div>
                      {analysis.overallSummary && (
                        <p className="text-on-surface leading-relaxed" style={{ color: "#444444" }}>
                          {analysis.overallSummary}
                        </p>
                      )}
                    </section>
                  );
                })()}

                {/* 4. Social proof */}
                <SocialProof
                  googleRating={analysis.googleRating}
                  googleReviewCount={analysis.googleReviewCount}
                  googleUrl={analysis.googleUrl}
                  googleReviews={analysis.googleReviews as GoogleReview[] | null}
                />

                {/* 5. Red flags */}
                {redFlags.length > 0 && (
                  <section className="bg-red-50 rounded-[16px] px-6 py-5 space-y-2">
                    <p className="text-xs font-semibold tracking-widest uppercase text-red-700">
                      Red Flags
                    </p>
                    <ul className="space-y-1">
                      {redFlags.map((flag, i) => (
                        <li key={i} className="text-sm text-red-800 flex gap-2">
                          <span className="mt-0.5 shrink-0">⚠</span>
                          <span>{flag}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* 6. Questions to ask */}
                {questionsToAsk.length > 0 && (
                  <section className="space-y-3">
                    <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant">
                      Questions to ask your supplier
                    </p>
                    <div className="bg-surface-container-lowest rounded-[16px] px-6 py-2">
                      {questionsToAsk.map((q, i) => (
                        <div key={i} className="flex items-start gap-4 py-4">
                          <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-on-primary text-xs font-bold flex items-center justify-center mt-0.5">
                            {i + 1}
                          </span>
                          <p className="text-sm text-on-surface leading-relaxed">{q}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </>
            ) : (
              /* Locked state for non-owners */
              <section className="bg-surface-container-low rounded-[16px] px-6 py-10 flex flex-col items-center text-center gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-on-surface-variant"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <p className="text-sm font-semibold text-on-surface">
                  Full analysis visible to the quote owner only.
                </p>
                <p className="text-sm text-on-surface-variant">
                  Have insight on this quote? Leave a comment below.
                </p>
              </section>
            )}
          </>
        )}

        {/* Line items — public, shown after owner block */}
        {analysis && lineItems.length > 0 && (
          <section className="space-y-3">
            <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant">
              Line Items
            </p>
            <div className="bg-surface-container-lowest rounded-[16px] divide-y divide-outline-variant/10">
              {lineItems.map((item, i) => (
                <div
                  key={i}
                  className="px-6 py-4 flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-on-surface">
                      {item.description}
                    </p>
                    {item.quantity != null && (
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        Qty: {item.quantity}
                        {item.unitPrice != null &&
                          ` × ${isOwner ? formatAUD(item.unitPrice) : formatPublicPrice(item.unitPrice, quote.category.slug)}`}
                      </p>
                    )}
                  </div>
                  {item.totalPrice != null && (
                    <p className="text-sm font-semibold text-on-surface whitespace-nowrap">
                      {isOwner ? formatAUD(item.totalPrice) : formatPublicPrice(item.totalPrice, quote.category.slug)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Community */}
        <CommunitySection
          quoteId={id}
          initialComments={serializedComments}
          initialVoteCount={quoteVoteCount}
          initialUserVoted={!!userVote}
          currentUserId={currentUserId}
        />
      </div>
    </main>
  );
}
