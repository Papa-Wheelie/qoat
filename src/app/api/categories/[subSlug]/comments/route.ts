import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

const REACTION_EMOJIS = ["👍", "💡", "😱"] as const;

// ─── Shared serialiser ────────────────────────────────────────────────────────

type VoteRow = { userId: string; value: number };
type ReactionRow = { userId: string; emoji: string };

type SerializedComment = {
  id: string;
  content: string;
  createdAt: Date;
  user: { name: string };
  netScore: number;
  voteCount: number;
  userVoted: boolean;
  reactions: { emoji: string; count: number; userReacted: boolean }[];
  replies: SerializedComment[];
};

type CommentInput = {
  id: string;
  content: string;
  createdAt: Date;
  user: { name: string | null };
  votes: VoteRow[];
  reactions: ReactionRow[];
  replies?: CommentInput[];
};

function serializeComment(c: CommentInput, userId: string | null): SerializedComment {
  const netScore = c.votes.reduce((sum, v) => sum + v.value, 0);
  return {
    id: c.id,
    content: c.content,
    createdAt: c.createdAt,
    user: { name: c.user.name?.split(" ")[0] ?? "User" },
    netScore,
    voteCount: c.votes.filter((v) => v.value === 1).length,
    userVoted: userId ? c.votes.some((v) => v.userId === userId) : false,
    reactions: REACTION_EMOJIS.map((emoji) => ({
      emoji,
      count: c.reactions.filter((r) => r.emoji === emoji).length,
      userReacted: userId
        ? c.reactions.some((r) => r.emoji === emoji && r.userId === userId)
        : false,
    })),
    replies: (c.replies ?? []).map((r) => serializeComment(r, userId)),
  };
}

// ─── GET /api/categories/[subSlug]/comments ───────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subSlug: string }> }
) {
  const { subSlug } = await params;

  const session = await auth();
  const userId = session?.user?.id ?? null;

  const subcategory = await prisma.subcategory.findUnique({
    where: { slug: subSlug },
    select: { id: true },
  });
  if (!subcategory) {
    return Response.json({ error: "Subcategory not found" }, { status: 404 });
  }

  const sort = request.nextUrl.searchParams.get("sort") ?? "helpful";
  const orderBy =
    sort === "newest"
      ? ({ createdAt: "desc" } as const)
      : sort === "oldest"
      ? ({ createdAt: "asc" } as const)
      : ({ createdAt: "asc" } as const); // helpful: sort in memory after fetch

  const comments = await prisma.comment.findMany({
    where: { subcategoryId: subcategory.id, parentId: null, hidden: false },
    orderBy,
    include: {
      user: { select: { name: true } },
      votes: { select: { userId: true, value: true } },
      reactions: { select: { userId: true, emoji: true } },
      replies: {
        where: { hidden: false },
        orderBy: { createdAt: "asc" },
        include: {
          user: { select: { name: true } },
          votes: { select: { userId: true, value: true } },
          reactions: { select: { userId: true, emoji: true } },
        },
      },
    },
  });

  let result = comments.map((c) => serializeComment(c, userId));

  if (sort === "helpful") {
    result = result.sort((a, b) => b.netScore - a.netScore);
  }

  return Response.json(result);
}

// ─── POST /api/categories/[subSlug]/comments ──────────────────────────────────

export async function POST(
  request: Request,
  { params }: { params: Promise<{ subSlug: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { subSlug } = await params;

  const subcategory = await prisma.subcategory.findUnique({
    where: { slug: subSlug },
    select: { id: true },
  });
  if (!subcategory) {
    return Response.json({ error: "Subcategory not found" }, { status: 404 });
  }

  let body: { content?: string; parentId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { content, parentId } = body;

  if (!content?.trim()) {
    return Response.json({ error: "content is required" }, { status: 400 });
  }
  const trimmed = content.trim();
  if (trimmed.length < 3) {
    return Response.json({ error: "Comment must be at least 3 characters" }, { status: 400 });
  }
  if (trimmed.length > 2000) {
    return Response.json({ error: "Comment must be under 2000 characters" }, { status: 400 });
  }

  // Validate parentId: same subcategory, not itself a reply
  if (parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: parentId },
      select: { subcategoryId: true, parentId: true },
    });
    if (!parent) {
      return Response.json({ error: "Parent comment not found" }, { status: 400 });
    }
    if (parent.subcategoryId !== subcategory.id) {
      return Response.json(
        { error: "Parent comment belongs to a different category" },
        { status: 400 }
      );
    }
    if (parent.parentId !== null) {
      return Response.json(
        { error: "Replies cannot be nested more than one level" },
        { status: 400 }
      );
    }
  }

  const comment = await prisma.comment.create({
    data: {
      subcategoryId: subcategory.id,
      quoteId: null, // XOR enforced — never both
      userId: session.user.id,
      content: trimmed,
      parentId: parentId ?? null,
    },
    include: {
      user: { select: { name: true } },
    },
  });

  return Response.json(
    {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      user: { name: comment.user.name?.split(" ")[0] ?? "User" },
      netScore: 0,
      voteCount: 0,
      userVoted: false,
      reactions: REACTION_EMOJIS.map((emoji) => ({ emoji, count: 0, userReacted: false })),
      replies: [],
    },
    { status: 201 }
  );
}
