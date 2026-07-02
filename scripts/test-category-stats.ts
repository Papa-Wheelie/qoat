import { getCategoryStats } from "../src/lib/categoryStats";

const TEST_SLUGS = [
  "kitchen-renovation",
  "blinds-shutters",
  "solar-install",
  "locksmith",
  "extension",
];

async function main() {
  for (const slug of TEST_SLUGS) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`SUB-CATEGORY: ${slug}`);
    console.log("=".repeat(60));
    const stats = await getCategoryStats(slug);
    if (!stats) {
      console.log("  (not found in DB)");
      continue;
    }
    console.log(JSON.stringify(stats, null, 2));
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
