import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

const REASONS = [
  "spam",
  "misleading",
  "inappropriate",
  "duplicate",
  "other",
] as const;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { quoteId, commentId, reason, details } = body as Record<string, unknown>;

  if (!quoteId && !commentId) {
    return Response.json({ error: "quoteId or commentId required" }, { status: 400 });
  }
  if (quoteId && commentId) {
    return Response.json({ error: "Provide quoteId or commentId, not both" }, { status: 400 });
  }
  if (!reason || !REASONS.includes(reason as typeof REASONS[number])) {
    return Response.json({ error: "Invalid reason" }, { status: 400 });
  }

  // Verify the target exists
  if (quoteId) {
    const quote = await prisma.quote.findUnique({ where: { id: String(quoteId) }, select: { id: true } });
    if (!quote) return Response.json({ error: "Quote not found" }, { status: 404 });
  } else {
    const comment = await prisma.comment.findUnique({ where: { id: String(commentId) }, select: { id: true } });
    if (!comment) return Response.json({ error: "Comment not found" }, { status: 404 });
  }

  try {
    const report = await prisma.report.create({
      data: {
        reporterId: userId,
        reason: String(reason),
        details: details ? String(details) : null,
        quoteId: quoteId ? String(quoteId) : null,
        commentId: commentId ? String(commentId) : null,
      },
      select: { id: true },
    });
    return Response.json({ reported: true, id: report.id });
  } catch (e: unknown) {
    // Unique constraint: already reported
    if (
      e instanceof Error &&
      e.message.includes("Unique constraint")
    ) {
      return Response.json({ error: "Already reported" }, { status: 409 });
    }
    throw e;
  }
}
