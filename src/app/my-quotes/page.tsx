import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import MyQuotesList, { type MyQuoteData } from "./MyQuotesList";

export default async function MyQuotesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const quotes = await prisma.quote.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      hidden: true,
      suburb: true,
      state: true,
      createdAt: true,
      category: { select: { name: true, slug: true } },
      analysis: {
        select: { totalAmount: true, priceScore: true, reputationScore: true, timeScore: true },
      },
      _count: { select: { votes: true, comments: true, helpfulMarks: true, similarQuotes: true } },
    },
  });

  const serialized: MyQuoteData[] = quotes.map((q) => ({
    id: q.id,
    title: q.title,
    status: q.status,
    hidden: q.hidden,
    suburb: q.suburb,
    state: q.state,
    createdAt: q.createdAt.toISOString(),
    category: q.category,
    totalAmount: q.analysis?.totalAmount ?? null,
    priceScore: q.analysis?.priceScore ?? null,
    reputationScore: q.analysis?.reputationScore ?? null,
    timeScore: q.analysis?.timeScore ?? null,
    voteCount: q._count.votes,
    commentCount: q._count.comments,
    helpfulCount: q._count.helpfulMarks,
    similarCount: q._count.similarQuotes,
  }));

  return (
    <main className="min-h-screen bg-surface pt-14 py-16 px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-extrabold tracking-tight text-primary">My Quotes</h1>
          <p className="mt-1 text-on-surface-variant">
            {quotes.length} quote{quotes.length !== 1 ? "s" : ""} submitted
          </p>
        </header>
        <MyQuotesList quotes={serialized} />
      </div>
    </main>
  );
}
