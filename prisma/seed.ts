import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { name: "Building & Construction", slug: "building-construction" },
  { name: "Electrical", slug: "electrical" },
  { name: "Plumbing", slug: "plumbing" },
  { name: "HVAC & Heating", slug: "hvac-heating" },
  { name: "Painting & Decorating", slug: "painting-decorating" },
  { name: "Landscaping", slug: "landscaping" },
  { name: "Automotive", slug: "automotive" },
  { name: "Insurance", slug: "insurance" },
  { name: "Supplier & Products", slug: "supplier-products" },
  { name: "Other", slug: "other" },
];

async function main() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }
  console.log("Seeded", categories.length, "categories");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
