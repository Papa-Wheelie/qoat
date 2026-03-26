import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import CommunitySection from "./CommunitySection";
import Nav from "@/components/Nav";
import { formatPublicPrice } from "@/lib/formatPrice";

type LineItem = {
  description: string;
  quantity?: number | null;
  unitPrice?: number | null;
  totalPrice?: number | null;
};

function formatAUD(amount: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(amount);
}

const RECOMMENDATION_LABEL: Record<string, string> = {
  accept: "Accept",
  negotiate: "Negotiate",
  reject: "Reject",
  "get-more-quotes": "Get More Quotes",
};

const RECOMMENDATION_STYLE: Record<string, string> = {
  accept: "bg-[#7DD4C0] text-[#0d3830]",
  negotiate: "bg-[#F4A7C3] text-[#4a1228]",
  reject: "bg-red-100 text-red-800",
  "get-more-quotes": "bg-[#89CFF0] text-[#0a2e42]",
};

type ScoreCardProps = {
  label: string;
  score: number | null;
  verdict: string | null;
  explanation: string | null;
  bg: string;
  textColor: string;
};

function ScoreCard({ label, score, verdict, explanation, bg, textColor }: ScoreCardProps) {
  if (score == null) {
    return (
      <div className="flex-1 rounded-[16px] bg-surface-container-low px-6 py-6 flex flex-col gap-3 min-w-0">
        <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant">
          {label}
        </p>
        <p className="text-sm text-on-surface-variant">Scoring…</p>
      </div>
    );
  }

  return (
    <div
      className="flex-1 rounded-[16px] px-6 py-6 flex flex-col gap-3 min-w-0"
      style={{ backgroundColor: bg, color: textColor }}
    >
      <p className="text-xs font-semibold tracking-widest uppercase opacity-70">
        {label}
      </p>
      <div className="flex items-end gap-2">
        <span className="text-5xl font-extrabold tracking-tighter leading-none">
          {score}
        </span>
        <span className="text-lg font-semibold opacity-50 mb-1">/10</span>
      </div>
      {verdict && (
        <span className="inline-block self-start px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-black/10">
          {verdict}
        </span>
      )}
      {explanation && (
        <p className="text-sm leading-relaxed opacity-80 mt-1">{explanation}</p>
      )}
    </div>
  );
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
    <>
    <Nav />
    <main className="min-h-screen bg-surface pt-14 py-16 px-6 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-8">

        {/* Header */}
        <header>
          <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant mb-2">
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
            <p className="mt-2 text-on-surface-variant">{quote.description}</p>
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
                  <div className="flex flex-col sm:flex-row gap-4">
                    <ScoreCard
                      label="Price"
                      score={analysis.priceScore}
                      verdict={analysis.priceVerdict}
                      explanation={analysis.priceExplanation}
                      bg="#7DD4C0"
                      textColor="#0d3830"
                    />
                    <ScoreCard
                      label="Reputation"
                      score={analysis.reputationScore}
                      verdict={analysis.reputationVerdict}
                      explanation={analysis.reputationExplanation}
                      bg="#F4A7C3"
                      textColor="#4a1228"
                    />
                    <ScoreCard
                      label="Time"
                      score={analysis.timeScore}
                      verdict={analysis.timeVerdict}
                      explanation={analysis.timeExplanation}
                      bg="#89CFF0"
                      textColor="#0a2e42"
                    />
                  </div>
                </section>

                {/* 3. Overall recommendation */}
                {hasScores && analysis.recommendation && (
                  <section className="bg-surface-container-lowest rounded-[16px] px-6 py-6 space-y-3">
                    <div className="flex items-center gap-3">
                      <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant">
                        Recommendation
                      </p>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                          RECOMMENDATION_STYLE[analysis.recommendation] ??
                          "bg-surface-container-low text-on-surface"
                        }`}
                      >
                        {RECOMMENDATION_LABEL[analysis.recommendation] ??
                          analysis.recommendation}
                      </span>
                    </div>
                    {analysis.overallSummary && (
                      <p className="text-on-surface leading-relaxed">
                        {analysis.overallSummary}
                      </p>
                    )}
                  </section>
                )}

                {/* 4. Red flags */}
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

                {/* 5. Questions to ask */}
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
    </>
  );
}
