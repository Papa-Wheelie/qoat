import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_EMOJIS = new Set(["👍", "💡", "😱"]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: commentId } = await params;
  const body = await request.json();
  const emoji = body.emoji as string;

  if (!ALLOWED_EMOJIS.has(emoji)) {
    return Response.json({ error: "Invalid emoji" }, { status: 400 });
  }

  const userId = session.user.id;
  const where = { commentId_userId_emoji: { commentId, userId, emoji } };
  const existing = await prisma.commentReaction.findUnique({ where });

  if (existing) {
    await prisma.commentReaction.delete({ where });
  } else {
    await prisma.commentReaction.create({ data: { commentId, userId, emoji } });
  }

  const reactions = await prisma.commentReaction.findMany({
    where: { commentId },
    select: { userId: true, emoji: true },
  });

  const result = Array.from(ALLOWED_EMOJIS).map((e) => ({
    emoji: e,
    count: reactions.filter((r) => r.emoji === e).length,
    userReacted: reactions.some((r) => r.emoji === e && r.userId === userId),
  }));

  return Response.json({ reactions: result });
}
