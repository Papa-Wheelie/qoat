import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const prisma = new PrismaClient();

async function main() {
  const analysis = await prisma.quoteAnalysis.findFirst({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      supplierName: true,
      reputationSignals: true,
      createdAt: true,
    },
  });

  if (!analysis) {
    console.log("No analyses found.");
    return;
  }

  console.log("id:          ", analysis.id);
  console.log("supplierName:", analysis.supplierName);
  console.log("createdAt:   ", analysis.createdAt);
  console.log("reputationSignals type:", typeof analysis.reputationSignals);

  if (analysis.reputationSignals === null) {
    console.log("reputationSignals: NULL");
  } else if (analysis.reputationSignals === undefined) {
    console.log("reputationSignals: UNDEFINED");
  } else {
    console.log("reputationSignals: POPULATED");
    console.log(JSON.stringify(analysis.reputationSignals, null, 2));
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
