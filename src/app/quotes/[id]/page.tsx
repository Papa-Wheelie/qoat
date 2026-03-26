import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

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

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { analysis: true, category: true },
  });

  if (!quote) notFound();

  const analysis = quote.analysis;
  const lineItems = analysis ? (analysis.lineItems as LineItem[]) : [];
  const redFlags = analysis ? (analysis.redFlags as string[]) : [];
  const hasScores = analysis?.priceScore != null;

  return (
    <main className="min-h-screen bg-surface py-16 px-6 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-8">

        {/* Header */}
        <header>
          <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant mb-2">
            {quote.category.name}
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
            {/* Supplier + Total */}
            <section className="bg-surface-container-lowest rounded-[16px] px-6 py-6 space-y-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant mb-1">
                    Supplier
                  </p>
                  <p className="text-lg font-bold text-on-surface">
                    {analysis.supplierName ?? "Unknown"}
                  </p>
                </div>
                {analysis.totalAmount != null && (
                  <div className="text-right">
                    <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant mb-1">
                      Total
                    </p>
                    <p className="text-2xl font-extrabold tracking-tight text-primary">
                      {formatAUD(analysis.totalAmount)}
                    </p>
                  </div>
                )}
              </div>
              {analysis.summary && (
                <p className="text-on-surface leading-relaxed pt-4 border-t border-outline-variant/20">
                  {analysis.summary}
                </p>
              )}
              {analysis.estimatedTimeframe && (
                <p className="text-sm text-on-surface-variant">
                  <span className="font-semibold">Timeframe:</span>{" "}
                  {analysis.estimatedTimeframe}
                </p>
              )}
            </section>

            {/* Iron triangle score cards */}
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

            {/* Overall recommendation */}
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

            {/* Red flags */}
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

            {/* Line items */}
            {lineItems.length > 0 && (
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
                              ` × ${formatAUD(item.unitPrice)}`}
                          </p>
                        )}
                      </div>
                      {item.totalPrice != null && (
                        <p className="text-sm font-semibold text-on-surface whitespace-nowrap">
                          {formatAUD(item.totalPrice)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
