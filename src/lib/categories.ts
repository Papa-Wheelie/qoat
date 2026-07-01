export type PricingModel = "scope-variant" | "per-unit" | "fixed-job";

export type Subcategory = {
  slug: string;
  name: string;
  pricingModel: PricingModel;
  unitLabel: string | null;
};

export type TopCategory = {
  slug: string;
  name: string;
  subcategories: Subcategory[];
};

export const CATEGORIES: TopCategory[] = [
  {
    slug: "home-renovation",
    name: "Home renovation",
    subcategories: [
      { slug: "kitchen-renovation",     name: "Kitchen renovation",       pricingModel: "scope-variant", unitLabel: null },
      { slug: "bathroom-renovation",    name: "Bathroom renovation",      pricingModel: "scope-variant", unitLabel: null },
      { slug: "laundry-renovation",     name: "Laundry renovation",       pricingModel: "scope-variant", unitLabel: null },
      { slug: "living-area-renovation", name: "Living area renovation",   pricingModel: "scope-variant", unitLabel: null },
      { slug: "extension",              name: "Extension",                pricingModel: "scope-variant", unitLabel: null },
      { slug: "loft-conversion",        name: "Loft / attic conversion",  pricingModel: "scope-variant", unitLabel: null },
      { slug: "garage-conversion",      name: "Garage conversion",        pricingModel: "scope-variant", unitLabel: null },
      { slug: "basement-renovation",    name: "Basement renovation",      pricingModel: "scope-variant", unitLabel: null },
      { slug: "whole-house-renovation", name: "Whole-house renovation",   pricingModel: "scope-variant", unitLabel: null },
    ],
  },
  {
    slug: "building-structural",
    name: "Building & structural",
    subcategories: [
      { slug: "new-build",            name: "New build",              pricingModel: "scope-variant", unitLabel: null },
      { slug: "roofing",              name: "Roofing",                pricingModel: "scope-variant", unitLabel: null },
      { slug: "concrete-paving",      name: "Concrete & paving",      pricingModel: "per-unit",      unitLabel: "$/m²" },
      { slug: "fencing",              name: "Fencing",                pricingModel: "per-unit",      unitLabel: "$/lineal m" },
      { slug: "decking",              name: "Decking",                pricingModel: "per-unit",      unitLabel: "$/m²" },
      { slug: "retaining-walls",      name: "Retaining walls",        pricingModel: "scope-variant", unitLabel: null },
      { slug: "demolition",           name: "Demolition",             pricingModel: "scope-variant", unitLabel: null },
      { slug: "waterproofing",        name: "Waterproofing",          pricingModel: "fixed-job",     unitLabel: null },
      { slug: "foundations-footings", name: "Foundations & footings", pricingModel: "scope-variant", unitLabel: null },
    ],
  },
  {
    slug: "trades",
    name: "Trades",
    subcategories: [
      { slug: "electrical",          name: "Electrical",            pricingModel: "scope-variant", unitLabel: null },
      { slug: "plumbing",            name: "Plumbing",              pricingModel: "scope-variant", unitLabel: null },
      { slug: "hvac-heating",        name: "HVAC / heating",        pricingModel: "scope-variant", unitLabel: null },
      { slug: "painting-decorating", name: "Painting & decorating", pricingModel: "per-unit",      unitLabel: "$/m²" },
      { slug: "plastering",          name: "Plastering",            pricingModel: "per-unit",      unitLabel: "$/m²" },
      { slug: "tiling",              name: "Tiling",                pricingModel: "per-unit",      unitLabel: "$/m²" },
      { slug: "carpentry",           name: "Carpentry",             pricingModel: "scope-variant", unitLabel: null },
      { slug: "glazing",             name: "Glazing",               pricingModel: "per-unit",      unitLabel: "$/unit" },
      { slug: "locksmith",           name: "Locksmith",             pricingModel: "fixed-job",     unitLabel: null },
    ],
  },
  {
    slug: "outdoor-property",
    name: "Outdoor & property",
    subcategories: [
      { slug: "landscaping",             name: "Landscaping",                           pricingModel: "scope-variant", unitLabel: null },
      { slug: "lawn-garden-maintenance", name: "Lawn & garden maintenance",             pricingModel: "fixed-job",     unitLabel: null },
      { slug: "tree-work",               name: "Tree work / arborist",                  pricingModel: "scope-variant", unitLabel: null },
      { slug: "pest-control",            name: "Pest control",                          pricingModel: "fixed-job",     unitLabel: null },
      { slug: "pool-spa",                name: "Pool & spa",                            pricingModel: "scope-variant", unitLabel: null },
      { slug: "driveway-pathways",       name: "Driveway & pathways",                   pricingModel: "per-unit",      unitLabel: "$/m²" },
      { slug: "irrigation",              name: "Irrigation",                            pricingModel: "scope-variant", unitLabel: null },
      { slug: "outdoor-lighting",        name: "Outdoor lighting",                      pricingModel: "scope-variant", unitLabel: null },
      { slug: "exterior-cleaning",       name: "Cleaning (windows, gutters, exterior)", pricingModel: "fixed-job",     unitLabel: null },
    ],
  },
  {
    slug: "energy-systems",
    name: "Energy & systems",
    subcategories: [
      { slug: "solar-install",      name: "Solar panel install",                pricingModel: "per-unit",      unitLabel: "$/kW" },
      { slug: "battery-storage",    name: "Battery storage",                    pricingModel: "per-unit",      unitLabel: "$/kWh" },
      { slug: "insulation",         name: "Insulation",                         pricingModel: "per-unit",      unitLabel: "$/m²" },
      { slug: "hot-water-system",   name: "Hot water system",                   pricingModel: "fixed-job",     unitLabel: null },
      { slug: "heating-install",    name: "Heating system install",             pricingModel: "scope-variant", unitLabel: null },
      { slug: "cooling-install",    name: "Cooling / air conditioning install", pricingModel: "scope-variant", unitLabel: null },
      { slug: "ev-charger-install", name: "EV charger install",                 pricingModel: "fixed-job",     unitLabel: null },
    ],
  },
  {
    slug: "supplies-products",
    name: "Supplies & products",
    subcategories: [
      { slug: "blinds-shutters",           name: "Blinds & shutters",                      pricingModel: "per-unit",      unitLabel: "$/window" },
      { slug: "curtains-soft-furnishings", name: "Curtains & soft furnishings",             pricingModel: "per-unit",      unitLabel: "$/window" },
      { slug: "windows-doors",             name: "Windows & doors",                         pricingModel: "per-unit",      unitLabel: "$/unit" },
      { slug: "flooring-materials",        name: "Flooring materials",                      pricingModel: "per-unit",      unitLabel: "$/m²" },
      { slug: "timber-lumber",             name: "Timber & lumber",                         pricingModel: "per-unit",      unitLabel: "$/lineal m" },
      { slug: "kitchen-fittings",          name: "Kitchen fittings",                        pricingModel: "scope-variant", unitLabel: null },
      { slug: "bathroom-fittings",         name: "Bathroom fittings",                       pricingModel: "scope-variant", unitLabel: null },
      { slug: "paint-finishes",            name: "Paint & finishes",                        pricingModel: "per-unit",      unitLabel: "$/litre" },
      { slug: "appliances",                name: "Appliances (heating/cooling/whitegoods)", pricingModel: "fixed-job",     unitLabel: null },
      { slug: "building-materials",        name: "Building materials",                      pricingModel: "per-unit",      unitLabel: "$/unit" },
      { slug: "lighting-fixtures",         name: "Lighting fixtures",                       pricingModel: "per-unit",      unitLabel: "$/fixture" },
    ],
  },
];

export function getTopCategoryBySlug(slug: string): TopCategory | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function getSubcategoryBySlug(slug: string): { top: TopCategory; sub: Subcategory } | undefined {
  for (const top of CATEGORIES) {
    const sub = top.subcategories.find((s) => s.slug === slug);
    if (sub) return { top, sub };
  }
  return undefined;
}

export function getAllTopCategorySlugs(): string[] {
  return CATEGORIES.map((c) => c.slug);
}

export function getAllSubcategorySlugs(): string[] {
  return CATEGORIES.flatMap((c) => c.subcategories.map((s) => s.slug));
}

// Maps legacy Category slugs to new TopCategory slugs.
// Used during the migration window so legacy quotes
// still appear under the right new top-level filter.
// Will be deleted once 1c.v migration is complete.
export const LEGACY_CATEGORY_TO_TOP: Record<string, string> = {
  "building-construction": "building-structural",
  "electrical":            "trades",
  "plumbing":              "trades",
  "hvac-heating":          "trades",
  "painting-decorating":   "trades",
  "landscaping":           "outdoor-property",
  "supplier-products":     "supplies-products",
  // automotive, insurance, other → no fallback
};

export function getLegacyCategorySlugsForTop(topSlug: string): string[] {
  const result: string[] = [];
  for (const key in LEGACY_CATEGORY_TO_TOP) {
    if (LEGACY_CATEGORY_TO_TOP[key] === topSlug) {
      result.push(key);
    }
  }
  return result;
}
