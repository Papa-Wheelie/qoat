export type SubcategoryFaqItem = {
  question: string;
  answer: string;
};

export type SubcategoryContent = {
  description: string;
  priceDrivers: string[];
  questionsToAsk: string[];
  permitNotes: string;
  faqs: SubcategoryFaqItem[];
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
    faqs: [
      {
        question: "Is it cheaper to reface kitchen cabinets or replace them?",
        answer:
          "Refacing typically costs $6,000–$18,000 versus $18,000–$50,000 for a full replacement. Refacing works well if your existing carcasses are sound and the layout works. If you're changing the layout, moving plumbing, or the cabinets are water-damaged, replacement is usually better value than refacing then regretting it.",
      },
      {
        question: "How long does a kitchen renovation take?",
        answer:
          "A cabinet reface takes about 1–2 weeks. A full rebuild keeping the existing layout typically runs 3–5 weeks. If you're changing the layout, moving plumbing or electrical, or waiting on custom joinery, allow 6–10 weeks. Stone benchtops add 1–2 weeks because they're templated after cabinets are installed.",
      },
      {
        question: "Should I supply my own appliances?",
        answer:
          "Often yes — retail sales can beat trade pricing, especially on mainstream brands. But confirm with your builder first: some quotes assume they supply and install, and removing appliances from scope may not reduce the price proportionally. Also check that cabinetry dimensions are set against your specific appliance models before joinery is manufactured.",
      },
      {
        question: "What's usually excluded from a kitchen quote?",
        answer:
          "Common exclusions are appliances, splashback tiling, painting, flooring, and electrical or plumbing modifications beyond simple reconnection. Also check whether demolition, waste removal, and the cost of any temporary kitchen setup are included. Ask for exclusions in writing.",
      },
    ],
  },
};

export const FALLBACK_PERMIT_NOTES =
  "Confirm permit and compliance requirements with your local council or licensed trade.";

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
  permitNotes: FALLBACK_PERMIT_NOTES,
  faqs: [],
};

export function getSubcategoryContent(slug: string): SubcategoryContent {
  return SUBCATEGORY_CONTENT[slug] || FALLBACK;
}

// ── Top category content ──────────────────────────────────────────────────────

export type TopCategoryContent = {
  description: string;
};

export const TOP_CATEGORY_CONTENT: Record<string, TopCategoryContent> = {
  "home-renovation": {
    description:
      "Full or partial home renovations across Australia — kitchens, bathrooms, extensions and whole-house rebuilds.",
  },
};

export function getTopCategoryContent(slug: string): TopCategoryContent {
  return TOP_CATEGORY_CONTENT[slug] || {
    description: "Category-specific summary coming soon.",
  };
}
