export type Subcategory = {
  slug: string;
  name: string;
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
      { slug: "kitchen-renovation",     name: "Kitchen renovation" },
      { slug: "bathroom-renovation",    name: "Bathroom renovation" },
      { slug: "laundry-renovation",     name: "Laundry renovation" },
      { slug: "living-area-renovation", name: "Living area renovation" },
      { slug: "extension",              name: "Extension" },
      { slug: "loft-conversion",        name: "Loft / attic conversion" },
      { slug: "garage-conversion",      name: "Garage conversion" },
      { slug: "basement-renovation",    name: "Basement renovation" },
      { slug: "whole-house-renovation", name: "Whole-house renovation" },
    ],
  },
  {
    slug: "building-structural",
    name: "Building & structural",
    subcategories: [
      { slug: "new-build",            name: "New build" },
      { slug: "roofing",              name: "Roofing" },
      { slug: "concrete-paving",      name: "Concrete & paving" },
      { slug: "fencing",              name: "Fencing" },
      { slug: "decking",              name: "Decking" },
      { slug: "retaining-walls",      name: "Retaining walls" },
      { slug: "demolition",           name: "Demolition" },
      { slug: "waterproofing",        name: "Waterproofing" },
      { slug: "foundations-footings", name: "Foundations & footings" },
    ],
  },
  {
    slug: "trades",
    name: "Trades",
    subcategories: [
      { slug: "electrical",          name: "Electrical" },
      { slug: "plumbing",            name: "Plumbing" },
      { slug: "hvac-heating",        name: "HVAC / heating" },
      { slug: "painting-decorating", name: "Painting & decorating" },
      { slug: "plastering",          name: "Plastering" },
      { slug: "tiling",              name: "Tiling" },
      { slug: "carpentry",           name: "Carpentry" },
      { slug: "glazing",             name: "Glazing" },
      { slug: "locksmith",           name: "Locksmith" },
    ],
  },
  {
    slug: "outdoor-property",
    name: "Outdoor & property",
    subcategories: [
      { slug: "landscaping",             name: "Landscaping" },
      { slug: "lawn-garden-maintenance", name: "Lawn & garden maintenance" },
      { slug: "tree-work",               name: "Tree work / arborist" },
      { slug: "pest-control",            name: "Pest control" },
      { slug: "pool-spa",                name: "Pool & spa" },
      { slug: "driveway-pathways",       name: "Driveway & pathways" },
      { slug: "irrigation",              name: "Irrigation" },
      { slug: "outdoor-lighting",        name: "Outdoor lighting" },
      { slug: "exterior-cleaning",       name: "Cleaning (windows, gutters, exterior)" },
    ],
  },
  {
    slug: "energy-systems",
    name: "Energy & systems",
    subcategories: [
      { slug: "solar-install",      name: "Solar panel install" },
      { slug: "battery-storage",    name: "Battery storage" },
      { slug: "insulation",         name: "Insulation" },
      { slug: "hot-water-system",   name: "Hot water system" },
      { slug: "heating-install",    name: "Heating system install" },
      { slug: "cooling-install",    name: "Cooling / air conditioning install" },
      { slug: "ev-charger-install", name: "EV charger install" },
    ],
  },
  {
    slug: "supplies-products",
    name: "Supplies & products",
    subcategories: [
      { slug: "blinds-shutters",           name: "Blinds & shutters" },
      { slug: "curtains-soft-furnishings", name: "Curtains & soft furnishings" },
      { slug: "windows-doors",             name: "Windows & doors" },
      { slug: "flooring-materials",        name: "Flooring materials" },
      { slug: "timber-lumber",             name: "Timber & lumber" },
      { slug: "kitchen-fittings",          name: "Kitchen fittings" },
      { slug: "bathroom-fittings",         name: "Bathroom fittings" },
      { slug: "paint-finishes",            name: "Paint & finishes" },
      { slug: "appliances",                name: "Appliances (heating/cooling/whitegoods)" },
      { slug: "building-materials",        name: "Building materials" },
      { slug: "lighting-fixtures",         name: "Lighting fixtures" },
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
