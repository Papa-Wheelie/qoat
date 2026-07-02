type SubcategoryContent = {
  description: string;
  priceDrivers: string[];
  questionsToAsk: string[];
  permitNotes: string;
};

export const SUBCATEGORY_CONTENT: Record<string, SubcategoryContent> = {
  "kitchen-renovation": {
    description:
      "Full or partial kitchen renovation across Australia — from cabinet refresh to complete rebuilds with layout changes.",
    priceDrivers: [
      "Cabinetry type — flat-pack DIY-adjacent through custom joinery",
      "Benchtop material — laminate, engineered stone, or natural stone",
      "Appliance tier — budget mainstream vs premium built-in",
      "Layout changes — keeping vs moving plumbing and electrical",
      "Splashback and finishes — tile, glass, or stone",
    ],
    questionsToAsk: [
      "Are all appliances (oven, cooktop, rangehood, dishwasher) included in the quote?",
      "Is benchtop installation and template included in the stone pricing?",
      "Does the quote include electrical rewiring for new circuits or moved sockets?",
      "Does the quote include plumbing modifications for sink or dishwasher relocation?",
      "What is the timeline from deposit to completion?",
      "Are demolition and disposal costs included?",
      "Do I need council permits for layout changes, and who handles them?",
      "What is the warranty on cabinetry, benchtops, and installation?",
    ],
    permitNotes:
      "Most cosmetic kitchen renovations don't require council permits. Layout changes involving load-bearing walls, plumbing relocation, or structural modifications may require a building permit. Electrical work must be completed by a licensed electrician and a Certificate of Electrical Safety issued. Plumbing changes require a licensed plumber and Certificate of Compliance. Confirm with your local council if scope involves any structural elements.",
  },
};

const FALLBACK: SubcategoryContent = {
  description: "Category-specific details coming soon.",
  priceDrivers: [
    "Scope of work",
    "Materials chosen",
    "Location and site access",
  ],
  questionsToAsk: [
    "What is included in the quoted price?",
    "What is the timeline?",
    "Are permits required?",
  ],
  permitNotes:
    "Confirm permit and compliance requirements with your local council or licensed trade.",
};

export function getSubcategoryContent(slug: string): SubcategoryContent {
  return SUBCATEGORY_CONTENT[slug] || FALLBACK;
}
