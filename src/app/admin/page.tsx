import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ReportList, { type ReportData } from "./ReportList";

export const metadata = { title: "Admin — QOAT" };

export default async function AdminPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") notFound();

  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      reporter: { select: { name: true, email: true } },
      resolvedBy: { select: { name: true } },
      quote: { select: { id: true, title: true, hidden: true } },
      comment: { select: { id: true, content: true, hidden: true, quoteId: true } },
    },
  });

  const data: ReportData[] = reports.map((r) => ({
    id: r.id,
    reason: r.reason,
    details: r.details,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    resolvedAt: r.resolvedAt?.toISOString() ?? null,
    reporter: { name: r.reporter.name, email: r.reporter.email },
    resolvedBy: r.resolvedBy ? { name: r.resolvedBy.name } : null,
    quote: r.quote ? { id: r.quote.id, title: r.quote.title, hidden: r.quote.hidden } : null,
    comment: r.comment
      ? { id: r.comment.id, content: r.comment.content, hidden: r.comment.hidden, quoteId: r.comment.quoteId }
      : null,
  }));

  const pending = data.filter((r) => r.status === "pending").length;

  return (
    <main className="min-h-screen bg-surface pt-14 py-16 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-extrabold tracking-tight text-primary">Moderation</h1>
          <p className="mt-1 text-on-surface-variant">
            {data.length} report{data.length !== 1 ? "s" : ""} · {pending} pending
          </p>
        </header>
        <ReportList reports={data} />
      </div>
    </main>
  );
}
