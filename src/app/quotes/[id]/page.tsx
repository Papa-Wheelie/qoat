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
          <div className="bg-surface-container-low rounded-[12px] px-6 py-8 text-center">
            <p className="text-on-surface-variant font-medium">
              AI analysis pending…
            </p>
          </div>
        ) : (
          <>
            {/* Summary card */}
            <section className="bg-surface-container-lowest rounded-[12px] px-6 py-6 space-y-4">
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
                <p className="text-on-surface leading-relaxed border-t border-outline-variant/30 pt-4">
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

            {/* Red flags */}
            {redFlags.length > 0 && (
              <section className="bg-error-container rounded-[12px] px-6 py-5 space-y-2">
                <p className="text-sm font-semibold tracking-widest uppercase text-on-error-container">
                  Red Flags
                </p>
                <ul className="space-y-1">
                  {redFlags.map((flag, i) => (
                    <li
                      key={i}
                      className="text-sm text-on-error-container flex gap-2"
                    >
                      <span className="mt-0.5">⚠</span>
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
                <div className="bg-surface-container-lowest rounded-[12px] divide-y divide-outline-variant/20">
                  {lineItems.map((item, i) => (
                    <div
                      key={i}
                      className="px-6 py-4 flex items-center justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-on-surface truncate">
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
