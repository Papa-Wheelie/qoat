import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const quoteId = request.nextUrl.searchParams.get("quoteId");
  if (!quoteId) {
    return Response.json({ error: "quoteId is required" }, { status: 400 });
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;

  const comments = await prisma.comment.findMany({
    where: { quoteId, parentId: null },
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
  });

  const serialize = (c: typeof comments[number] | typeof comments[number]["replies"][number]) => ({
    id: c.id,
    content: c.content,
    createdAt: c.createdAt,
    user: { name: c.user.name },
    voteCount: c.votes.length,
    userVoted: userId ? c.votes.some((v) => v.userId === userId) : false,
    replies: "replies" in c
      ? c.replies.map((r) => ({
          id: r.id,
          content: r.content,
          createdAt: r.createdAt,
          user: { name: r.user.name },
          voteCount: r.votes.length,
          userVoted: userId ? r.votes.some((v) => v.userId === userId) : false,
          replies: [],
        }))
      : [],
  });

  return Response.json(comments.map(serialize));
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { quoteId, content, parentId } = body as {
    quoteId?: string;
    content?: string;
    parentId?: string;
  };

  if (!quoteId || !content?.trim()) {
    return Response.json({ error: "quoteId and content are required" }, { status: 400 });
  }
  if (content.trim().length > 1000) {
    return Response.json({ error: "Comment must be under 1000 characters" }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      quoteId,
      userId: session.user.id,
      content: content.trim(),
      parentId: parentId ?? null,
    },
    include: { user: { select: { name: true } } },
  });

  return Response.json({
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt,
    user: { name: comment.user.name },
    voteCount: 0,
    userVoted: false,
    replies: [],
  }, { status: 201 });
}
