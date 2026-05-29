import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { action } = body as { action?: string };
  if (!action || !["hide", "unhide", "dismiss"].includes(action)) {
    return Response.json({ error: "Invalid action" }, { status: 400 });
  }

  const report = await prisma.report.findUnique({
    where: { id },
    select: { id: true, quoteId: true, commentId: true },
  });
  if (!report) return Response.json({ error: "Report not found" }, { status: 404 });

  const resolvedById = session.user.id!;
  const resolvedAt = new Date();

  if (action === "dismiss") {
    await prisma.report.update({
      where: { id },
      data: { status: "dismissed", resolvedById, resolvedAt },
    });
    return Response.json({ status: "dismissed", resolvedAt: resolvedAt.toISOString() });
  }

  const hidden = action === "hide";
  const status = action === "hide" ? "actioned" : "dismissed";

  if (report.quoteId) {
    const [, updatedReport] = await prisma.$transaction([
      prisma.quote.update({ where: { id: report.quoteId }, data: { hidden } }),
      prisma.report.update({ where: { id }, data: { status, resolvedById, resolvedAt } }),
    ]);
    const quote = await prisma.quote.findUnique({
      where: { id: report.quoteId },
      select: { id: true, title: true, hidden: true },
    });
    return Response.json({
      status: updatedReport.status,
      resolvedAt: resolvedAt.toISOString(),
      quote,
    });
  }

  if (report.commentId) {
    const [, updatedReport] = await prisma.$transaction([
      prisma.comment.update({ where: { id: report.commentId }, data: { hidden } }),
      prisma.report.update({ where: { id }, data: { status, resolvedById, resolvedAt } }),
    ]);
    const comment = await prisma.comment.findUnique({
      where: { id: report.commentId },
      select: { id: true, content: true, hidden: true, quoteId: true },
    });
    return Response.json({
      status: updatedReport.status,
      resolvedAt: resolvedAt.toISOString(),
      comment,
    });
  }

  return Response.json({ error: "Report has no target" }, { status: 400 });
}
