import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { type Metadata } from "next";
import { type ReactNode } from "react";
import Link from "next/link";
import CommunitySection from "./CommunitySection";
import ShareButton from "./ShareButton";
import ComparablesPanel from "./ComparablesPanel";
import QuoteEditableHeader from "./QuoteEditableHeader";
import AnalysingTakeover, { AnalysisFailed } from "@/components/AnalysingTakeover";
import AddLocationPrompt from "@/components/AddLocationPrompt";
import { formatPublicPrice } from "@/lib/formatPrice";
import SocialProof from "@/components/SocialProof";
import type { ReputationSignals } from "@/lib/getReputationSignals";
import type { ComplianceFlags } from "@/lib/assessCompliance";

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

  const [quote, initialComments, quoteVoteCount, userVote, helpfulCount, userHelpful, similarQuotes, hiddenReport, categories] = await Promise.all([
    prisma.quote.findUnique({
      where: { id },
      include: { analysis: true, category: true },
    }),
    prisma.comment.findMany({
      where: { quoteId: id, parentId: null, hidden: false },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { name: true } },
        votes: { select: { userId: true, value: true } },
        reactions: { select: { userId: true, emoji: true } },
        replies: {
          where: { hidden: false },
          orderBy: { createdAt: "asc" },
          include: {
            user: { select: { name: true } },
            votes: { select: { userId: true, value: true } },
            reactions: { select: { userId: true, emoji: true } },
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
    prisma.helpfulMark.count({ where: { quoteId: id } }),
    currentUserId
      ? prisma.helpfulMark.findUnique({
          where: { quoteId_userId: { quoteId: id, userId: currentUserId } },
        })
      : null,
    prisma.similarQuote.findMany({
      where: { quoteId: id },
      select: { price: true, note: true, createdAt: true, userId: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.report.findFirst({
      where: { quoteId: id, status: "actioned" },
      orderBy: { resolvedAt: "desc" },
      select: { resolvedAt: true },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
  ]);

  if (!quote) notFound();

  const isOwner = currentUserId === quote.userId;

  // Hidden quotes: owner sees a notice, everyone else gets 404
  if (quote.hidden && !isOwner) notFound();

  // Owner-only full-screen take-over while analysis is in progress
  type AnalysisStatus = "pending" | "extracting" | "scoring" | "complete" | "failed";
  const analysisStatus = quote.analysisStatus as AnalysisStatus;
  const PENDING_STATUSES: AnalysisStatus[] = ["pending", "extracting", "scoring"];

  if (isOwner && PENDING_STATUSES.includes(analysisStatus)) {
    return <AnalysingTakeover quoteId={quote.id} initialStatus={analysisStatus} />;
  }

  if (isOwner && analysisStatus === "failed") {
    return <AnalysisFailed quoteId={quote.id} />;
  }

  const analysis = quote.analysis;
  const lineItems = analysis ? (analysis.lineItems as LineItem[]) : [];
  const redFlags = analysis ? (analysis.redFlags as string[]) : [];
  const questionsToAsk = analysis ? (analysis.questionsToAsk as string[] | null) ?? [] : [];
  const hasScores = analysis?.priceScore != null;

  const REACTION_EMOJIS = ["👍", "💡", "😱"];

  type VoteLike = { userId: string; value: number };
  type ReactionLike = { userId: string; emoji: string };

  function serializeVotesAndReactions(
    votes: VoteLike[],
    reactions: ReactionLike[]
  ) {
    const netScore = votes.reduce((sum, v) => sum + v.value, 0);
    const userVote = currentUserId ? votes.find((v) => v.userId === currentUserId) : null;
    return {
      netScore,
      userUpvoted: userVote?.value === 1,
      userDownvoted: userVote?.value === -1,
      reactions: REACTION_EMOJIS.map((emoji) => ({
        emoji,
        count: reactions.filter((r) => r.emoji === emoji).length,
        userReacted: currentUserId ? reactions.some((r) => r.emoji === emoji && r.userId === currentUserId) : false,
      })),
    };
  }

  const serializedComments = initialComments.map((c) => ({
    id: c.id,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    user: { name: c.user.name },
    ...serializeVotesAndReactions(c.votes, c.reactions),
    replies: c.replies.map((r) => ({
      id: r.id,
      content: r.content,
      createdAt: r.createdAt.toISOString(),
      user: { name: r.user.name },
      ...serializeVotesAndReactions(r.votes, r.reactions),
      replies: [],
    })),
  }));

  const similarPrices = similarQuotes.map((s) => s.price).filter((p): p is number => p != null);
  const similarAvgPrice = similarPrices.length > 0
    ? similarPrices.reduce((a, b) => a + b, 0) / similarPrices.length
    : null;
  const serializedSimilarQuotes = similarQuotes.map((s) => ({
    price: s.price,
    note: s.note,
    createdAt: s.createdAt.toISOString(),
    isOwn: s.userId === currentUserId,
  }));

  return (
    <main className="min-h-screen bg-surface pt-14 py-16 px-6 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-8">

        {/* Header */}
        {isOwner ? (
          <QuoteEditableHeader
            quoteId={quote.id}
            initialTitle={quote.title}
            initialPrivateNickname={quote.privateNickname ?? null}
            initialCategoryId={quote.categoryId}
            initialCategoryName={quote.category.name}
            initialSuburb={quote.suburb}
            initialState={quote.state}
            initialDescription={quote.description ?? null}
            categoryEdited={quote.categoryEdited}
            locationEdited={quote.locationEdited}
            initialStatus={quote.status as "pending" | "accepted" | "rejected"}
            categories={categories}
          />
        ) : (
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
            <ShareButton />
          </header>
        )}

        {/* Hidden notice for owner */}
        {quote.hidden && isOwner && (
          <div className="bg-red-50 border border-red-200 rounded-[12px] px-5 py-4 flex items-start gap-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#991B1B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div>
              <p className="text-sm font-semibold text-red-800">
                {hiddenReport?.resolvedAt
                  ? `Hidden by a moderator on ${hiddenReport.resolvedAt.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}`
                  : "Hidden by a moderator"}
              </p>
              <p className="text-xs text-red-700 mt-0.5">This quote is no longer visible to the public. If you believe this is an error, please contact us.</p>
            </div>
          </div>
        )}

        {!analysis ? (
          <div className="bg-surface-container-low rounded-[16px] px-6 py-12 text-center">
            <p className="text-on-surface-variant font-medium">AI analysis pending…</p>
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

            {/* Location prompt — owner only, when location missing and not dismissed */}
            {isOwner && !quote.suburb && !quote.state && !quote.locationPromptDismissed && (
              <AddLocationPrompt quoteId={quote.id} />
            )}

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
                            <ComparablesPanel quoteId={quote.id} sampleSize={analysis.priceSampleSize} />
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
                      extra={(() => {
                        const js = analysis.jobSize as { quantity: number | null; unit: string | null; descriptor: string; sizeBand: string } | null;
                        if (!js) return null;
                        const label = js.quantity != null && js.unit
                          ? `${js.sizeBand.charAt(0).toUpperCase() + js.sizeBand.slice(1)}-sized job · ${js.descriptor}`
                          : `${js.sizeBand.charAt(0).toUpperCase() + js.sizeBand.slice(1)}-sized job`;
                        return (
                          <p style={{ fontSize: "12px", color: "#888888" }}>{label}</p>
                        );
                      })()}
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

                {/* 4. Compliance check */}
                {analysis.complianceFlags && (() => {
                  const flags = analysis.complianceFlags as ComplianceFlags;

                  const CheckIcon = () => (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#085041" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  );
                  const WarnIcon = () => (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  );
                  const DashIcon = () => (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888888" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  );

                  const permitIcon = flags.permitLikelyRequired
                    ? flags.permitMentionedInQuote ? <CheckIcon /> : <WarnIcon />
                    : <DashIcon />;
                  const permitText = flags.permitLikelyRequired
                    ? flags.permitMentionedInQuote
                      ? `Permit likely required — addressed in quote${flags.permitResponsibility && flags.permitResponsibility !== "unclear" ? ` (${flags.permitResponsibility} responsible)` : ""}`
                      : "Permit likely required — not mentioned in quote. Ask who is responsible."
                    : "No permit typically required for this work";
                  const permitColor = flags.permitLikelyRequired
                    ? flags.permitMentionedInQuote ? "#085041" : "#92400E"
                    : "#444444";

                  const certLabel = flags.certificateType ?? "Certificate of compliance";
                  const certIcon = flags.certificateRequired
                    ? flags.certificateMentionedInQuote ? <CheckIcon /> : <WarnIcon />
                    : <DashIcon />;
                  const certText = flags.certificateRequired
                    ? flags.certificateMentionedInQuote
                      ? `${certLabel} required — addressed in quote`
                      : `${certLabel} required — not mentioned in quote. Ask your supplier to confirm they will provide it.`
                    : "No compliance certificate required for this work";
                  const certColor = flags.certificateRequired
                    ? flags.certificateMentionedInQuote ? "#085041" : "#92400E"
                    : "#444444";

                  return (
                    <section className="bg-surface-container-lowest rounded-[16px] px-6 py-6 space-y-4">
                      <div>
                        <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant">
                          Compliance check
                        </p>
                        <p style={{ fontSize: "12px", color: "#888888" }} className="mt-1">
                          Guidance only — always confirm requirements with your local council.
                        </p>
                      </div>
                      <div className="space-y-4">
                        <div className="flex gap-3">
                          {permitIcon}
                          <div className="space-y-0.5">
                            <p style={{ fontSize: "13px", fontWeight: 600, color: permitColor }}>{permitText}</p>
                            {flags.permitNote && (
                              <p style={{ fontSize: "12px", color: "#888888" }}>{flags.permitNote}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-3">
                          {certIcon}
                          <div className="space-y-0.5">
                            <p style={{ fontSize: "13px", fontWeight: 600, color: certColor }}>{certText}</p>
                            {flags.certificateNote && (
                              <p style={{ fontSize: "12px", color: "#888888" }}>{flags.certificateNote}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </section>
                  );
                })()}

                {/* 5. Social proof */}
                <SocialProof
                  googleRating={analysis.googleRating}
                  googleReviewCount={analysis.googleReviewCount}
                  googleUrl={analysis.googleUrl}
                  googleReviews={analysis.googleReviews as GoogleReview[] | null}
                  googleMatchConfident={analysis.googleMatchConfident}
                  googleCandidateFound={
                    !!(analysis.googleDiagnostics &&
                      (analysis.googleDiagnostics as { googleCandidate?: unknown }).googleCandidate != null)
                  }
                  ambiguityRejected={
                    !!(analysis.googleDiagnostics &&
                      (analysis.googleDiagnostics as { ambiguityRejected?: boolean }).ambiguityRejected === true)
                  }
                  supplierName={analysis.supplierName}
                  reputationSignals={analysis.reputationSignals as ReputationSignals | null}
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

                {/* Methodology stamp */}
                {analysis.analysedAt && (
                  <p style={{ fontSize: "12px", color: "#AAAAAA", textAlign: "center" }}>
                    Analysed{" "}
                    {new Date(analysis.analysedAt).toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    ·{" "}
                    QOAT{" "}
                    <Link href="/methodology" style={{ color: "#AAAAAA", textDecoration: "underline", textDecorationColor: "#CCCCCC" }}>
                      methodology
                    </Link>{" "}
                    {analysis.methodologyVersion ?? "v1.0"}
                  </p>
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
          initialHelpfulCount={helpfulCount}
          initialUserMarkedHelpful={!!userHelpful}
          initialSimilarQuotes={serializedSimilarQuotes}
          similarAvgPrice={similarAvgPrice}
        />
      </div>
    </main>
  );
}
