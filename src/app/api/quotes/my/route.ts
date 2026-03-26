import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const quotes = await prisma.quote.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      userId: true,
      title: true,
      suburb: true,
      state: true,
      createdAt: true,
      category: { select: { name: true, slug: true } },
      analysis: {
        select: { totalAmount: true, priceScore: true, reputationScore: true, timeScore: true },
      },
      _count: { select: { votes: true, comments: true } },
    },
  });

  const data = quotes.map((q) => ({
    id: q.id,
    userId: q.userId,
    title: q.title,
    suburb: q.suburb,
    state: q.state,
    createdAt: q.createdAt,
    category: q.category,
    totalAmount: q.analysis?.totalAmount ?? null,
    priceScore: q.analysis?.priceScore ?? null,
    reputationScore: q.analysis?.reputationScore ?? null,
    timeScore: q.analysis?.timeScore ?? null,
    voteCount: q._count.votes,
    commentCount: q._count.comments,
  }));

  return Response.json({ quotes: data });
}
