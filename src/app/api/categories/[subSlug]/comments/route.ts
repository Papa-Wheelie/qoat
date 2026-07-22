import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { getCategoryComments } from "@/lib/getCategoryComments";

const REACTION_EMOJIS = ["👍", "💡", "😱"] as const;

// ─── GET /api/categories/[subSlug]/comments ───────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subSlug: string }> }
) {
  const { subSlug } = await params;

  const session = await auth();
  const currentUserId = session?.user?.id ?? null;

  const subcategory = await prisma.subcategory.findUnique({
    where: { slug: subSlug },
    select: { id: true },
  });
  if (!subcategory) {
    return Response.json({ error: "Subcategory not found" }, { status: 404 });
  }

  const rawSort = request.nextUrl.searchParams.get("sort") ?? "helpful";
  const sort =
    rawSort === "newest" ? "newest" : rawSort === "oldest" ? "oldest" : "helpful";

  const comments = await getCategoryComments(subcategory.id, sort, currentUserId);
  return Response.json(comments);
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
      quoteId: null,
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
      createdAt: comment.createdAt.toISOString(),
      user: { name: comment.user.name },
      netScore: 0,
      userUpvoted: false,
      userDownvoted: false,
      reactions: REACTION_EMOJIS.map((emoji) => ({ emoji, count: 0, userReacted: false })),
      replies: [],
    },
    { status: 201 }
  );
}
