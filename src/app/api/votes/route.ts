import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { quoteId, commentId } = body as { quoteId?: string; commentId?: string };

  if (!quoteId && !commentId) {
    return Response.json({ error: "quoteId or commentId is required" }, { status: 400 });
  }

  const userId = session.user.id;
  const where = quoteId
    ? { userId_quoteId: { userId, quoteId } }
    : { userId_commentId: { userId, commentId: commentId! } };

  const existing = await prisma.vote.findUnique({ where });

  if (existing) {
    await prisma.vote.delete({ where });
    const count = quoteId
      ? await prisma.vote.count({ where: { quoteId } })
      : await prisma.vote.count({ where: { commentId } });
    return Response.json({ voted: false, count });
  }

  await prisma.vote.create({
    data: { userId, quoteId: quoteId ?? null, commentId: commentId ?? null },
  });
  const count = quoteId
    ? await prisma.vote.count({ where: { quoteId } })
    : await prisma.vote.count({ where: { commentId } });

  return Response.json({ voted: true, count });
}
