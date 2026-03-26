import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user) return Response.json({ error: "Not found" }, { status: 404 });

  // Collect IDs for cascaded deletes
  const quoteIds = (await prisma.quote.findMany({ where: { userId }, select: { id: true } })).map((q) => q.id);
  const userCommentIds = (await prisma.comment.findMany({ where: { userId }, select: { id: true } })).map((c) => c.id);
  const quoteCommentIds = (await prisma.comment.findMany({ where: { quoteId: { in: quoteIds } }, select: { id: true } })).map((c) => c.id);
  const allCommentIds = [...new Set([...userCommentIds, ...quoteCommentIds])];

  // Delete in FK-safe order
  await prisma.vote.deleteMany({ where: { userId } });
  await prisma.vote.deleteMany({ where: { quoteId: { in: quoteIds } } });
  await prisma.vote.deleteMany({ where: { commentId: { in: allCommentIds } } });

  // Delete replies to user's comments (by other users), then all remaining comments
  await prisma.comment.deleteMany({ where: { parentId: { in: userCommentIds } } });
  await prisma.comment.deleteMany({ where: { quoteId: { in: quoteIds } } });
  await prisma.comment.deleteMany({ where: { userId } });

  await prisma.quoteAnalysis.deleteMany({ where: { quoteId: { in: quoteIds } } });
  await prisma.quote.deleteMany({ where: { userId } });
  await prisma.verificationToken.deleteMany({ where: { email: user.email } });
  await prisma.account.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });

  return Response.json({ success: true });
}
