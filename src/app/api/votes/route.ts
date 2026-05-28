import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { quoteId, commentId, value } = body as {
    quoteId?: string;
    commentId?: string;
    value?: number;
  };

  if (!quoteId && !commentId) {
    return Response.json({ error: "quoteId or commentId is required" }, { status: 400 });
  }

  const userId = session.user.id;

  if (quoteId) {
    // Quote votes are upvote-only toggle (value always 1)
    const where = { userId_quoteId: { userId, quoteId } };
    const existing = await prisma.vote.findUnique({ where });
    if (existing) {
      await prisma.vote.delete({ where });
      const count = await prisma.vote.count({ where: { quoteId } });
      return Response.json({ voted: false, count });
    }
    await prisma.vote.create({ data: { userId, quoteId, value: 1 } });
    const count = await prisma.vote.count({ where: { quoteId } });
    return Response.json({ voted: true, count });
  }

  // Comment votes — up/down with value 1 or -1
  const voteValue = value === -1 ? -1 : 1;
  const where = { userId_commentId: { userId, commentId: commentId! } };
  const existing = await prisma.vote.findUnique({ where });

  if (existing) {
    if (existing.value === voteValue) {
      // Same direction — toggle off
      await prisma.vote.delete({ where });
    } else {
      // Opposite direction — flip
      await prisma.vote.update({ where, data: { value: voteValue } });
    }
  } else {
    await prisma.vote.create({ data: { userId, commentId: commentId!, value: voteValue } });
  }

  const votes = await prisma.vote.findMany({ where: { commentId }, select: { userId: true, value: true } });
  const netScore = votes.reduce((sum, v) => sum + v.value, 0);
  const userVote = votes.find((v) => v.userId === userId);
  return Response.json({
    netScore,
    upvoted: userVote?.value === 1,
    downvoted: userVote?.value === -1,
  });
}
