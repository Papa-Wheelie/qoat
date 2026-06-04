/**
 * scripts/diagnose-google-matches.ts
 *
 * Read-only diagnostic run: re-runs findSupplierReviews against all
 * QuoteAnalysis records that have a supplier name and logs full diagnostics.
 * Does NOT write to the database.
 *
 * Run with: npx tsx scripts/diagnose-google-matches.ts
 * (requires GOOGLE_PLACES_API_KEY in environment / .env.local)
 */

import { PrismaClient } from "@prisma/client";
import { findSupplierReviews } from "../src/lib/googlePlaces";

// Load .env.local for local runs
import { config } from "dotenv";
config({ path: ".env.local" });

const prisma = new PrismaClient();

async function main() {
  const analyses = await prisma.quoteAnalysis.findMany({
    where: { supplierName: { not: null } },
    select: {
      id: true,
      quoteId: true,
      supplierName: true,
      googlePlaceId: true,
      googleMatchConfident: true,
      quote: {
        select: {
          suburb: true,
          state: true,
          category: { select: { slug: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  console.log(`\n── Diagnosing ${analyses.length} quotes with supplier names ──\n`);

  let totalProcessed = 0;
  let wouldAccept = 0;
  let wouldReject = 0;
  let decisionChanged = 0;

  const changedRows: Array<{
    quoteId: string;
    supplier: string;
    wasConfident: boolean;
    nowConfident: boolean;
    composite: number;
    reason: string;
  }> = [];

  for (const analysis of analyses) {
    const supplier = analysis.supplierName!;
    const suburb = analysis.quote?.suburb ?? "";
    const state = analysis.quote?.state ?? "";
    const categorySlug = analysis.quote?.category?.slug ?? "other";

    process.stdout.write(`\nQuote ${analysis.quoteId} — "${supplier}" (${suburb || "?"}/${state || "?"})\n`);

    const result = await findSupplierReviews(supplier, suburb, state, categorySlug);
    totalProcessed++;

    const nowConfident = result.confident;
    const composite = result.diagnostics?.checks.compositeConfidence ?? 0;
    const wasConfident = analysis.googleMatchConfident;

    if (nowConfident) {
      wouldAccept++;
    } else {
      wouldReject++;
    }

    if (wasConfident !== nowConfident) {
      decisionChanged++;
      const candidate = result.diagnostics?.googleCandidate?.displayName ?? "(no candidate)";
      const nameFinal = result.diagnostics?.checks.nameSimilarity.finalScore ?? 0;
      const locResult = result.diagnostics?.checks.locationProximity.result ?? "n/a";
      const typeResult = result.diagnostics?.checks.businessType.result ?? "n/a";

      changedRows.push({
        quoteId: analysis.quoteId,
        supplier,
        wasConfident,
        nowConfident,
        composite,
        reason: `candidate="${candidate}" name=${nameFinal.toFixed(2)} loc=${locResult} type=${typeResult} composite=${composite.toFixed(2)}`,
      });
    }

    // Small delay to avoid hammering the Places API
    await new Promise((r) => setTimeout(r, 200));
  }

  // ── Summary ───────────────────────────────────────────────────────────────

  console.log("\n\n══════════════════════════════════════════════════");
  console.log("  SUMMARY");
  console.log("══════════════════════════════════════════════════");
  console.log(`  Total analysed:       ${totalProcessed}`);
  console.log(`  Would ACCEPT:         ${wouldAccept}`);
  console.log(`  Would REJECT:         ${wouldReject}`);
  console.log(`  Decision changed:     ${decisionChanged}`);

  if (changedRows.length > 0) {
    console.log("\n  Changed decisions:");
    for (const row of changedRows) {
      const arrow = row.wasConfident ? "ACCEPT → REJECT" : "REJECT → ACCEPT";
      console.log(`    [${arrow}] ${row.quoteId} "${row.supplier}"`);
      console.log(`      ${row.reason}`);
    }
  }

  console.log("\n  Tip: Re-analyse individual quotes via the UI to pick up improved matching.");
  console.log("  Run these re-analyses via the UI for any quotes you'd like to update with the new matching.\n");
  console.log("══════════════════════════════════════════════════\n");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
