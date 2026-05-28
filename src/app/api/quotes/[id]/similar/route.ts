import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: quoteId } = await params;
  const userId = session.user.id;
  const body = await request.json();
  const price = typeof body.price === "number" && body.price > 0 ? body.price : null;
  const note = typeof body.note === "string" && body.note.trim() ? body.note.trim().slice(0, 280) : null;

  if (price == null && note == null) {
    return Response.json({ error: "price or note is required" }, { status: 400 });
  }

  await prisma.similarQuote.upsert({
    where: { quoteId_userId: { quoteId, userId } },
    create: { quoteId, userId, price, note },
    update: { price, note },
  });

  const all = await prisma.similarQuote.findMany({
    where: { quoteId },
    select: { price: true, note: true, createdAt: true, userId: true, user: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });

  const prices = all.map((s) => s.price).filter((p): p is number => p != null);
  const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : null;

  return Response.json({
    count: all.length,
    avgPrice,
    submissions: all.map((s) => ({
      price: s.price,
      note: s.note,
      createdAt: s.createdAt.toISOString(),
      isOwn: s.userId === userId,
    })),
  });
}
