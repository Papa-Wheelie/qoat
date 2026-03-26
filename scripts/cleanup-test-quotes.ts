import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Find the most recent quote
  const latest = await prisma.quote.findFirst({ orderBy: { createdAt: "desc" } });
  if (!latest) {
    console.log("No quotes found — nothing to delete.");
    return;
  }
  console.log(`Keeping quote: ${latest.id} (${latest.title}, created ${latest.createdAt.toISOString()})`);

  const toDelete = await prisma.quote.findMany({
    where: { id: { not: latest.id } },
    select: { id: true },
  });
  const ids = toDelete.map((q) => q.id);

  if (ids.length === 0) {
    console.log("Only one quote exists — nothing to delete.");
    return;
  }
  console.log(`Deleting ${ids.length} quote(s)...`);

  const votes = await prisma.vote.deleteMany({ where: { quoteId: { in: ids } } });
  console.log(`Deleted ${votes.count} vote(s)`);

  const comments = await prisma.comment.deleteMany({ where: { quoteId: { in: ids } } });
  console.log(`Deleted ${comments.count} comment(s)`);

  const analyses = await prisma.quoteAnalysis.deleteMany({ where: { quoteId: { in: ids } } });
  console.log(`Deleted ${analyses.count} analysis record(s)`);

  const quotes = await prisma.quote.deleteMany({ where: { id: { in: ids } } });
  console.log(`Deleted ${quotes.count} quote(s)`);

  console.log("Done.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
