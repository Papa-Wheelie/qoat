import { PrismaClient } from "@prisma/client";
import { CATEGORIES } from "../src/lib/categories";

const prisma = new PrismaClient();

async function main() {
  let topCount = 0;
  let subCount = 0;

  for (const top of CATEGORIES) {
    const topRecord = await prisma.topCategory.upsert({
      where: { slug: top.slug },
      update: { name: top.name },
      create: { name: top.name, slug: top.slug },
    });

    for (const sub of top.subcategories) {
      await prisma.subcategory.upsert({
        where: { slug: sub.slug },
        update: { name: sub.name, topCategoryId: topRecord.id },
        create: { name: sub.name, slug: sub.slug, topCategoryId: topRecord.id },
      });
      subCount++;
    }

    console.log(`Upserted top: ${top.name} (${top.subcategories.length} subs)`);
    topCount++;
  }

  console.log(`\nDone. ${topCount} top categories, ${subCount} subcategories.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
