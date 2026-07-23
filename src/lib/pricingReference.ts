import fs from "fs";
import path from "path";

type BandData = {
  median: number;
  min: number;
  max: number;
  scope?: string;
  notes?: string;
  confidence?: string;
};

type SubEntry = {
  pricingModel: "scope-variant" | "per-unit" | "fixed-job";
  bands?: {
    small?: BandData;
    medium?: BandData;
    large?: BandData;
  };
  band?: BandData;
  rate?: BandData & { notes?: string };
  unitLabel?: string;
  calloutFee?: BandData;
  hourlyRate?: BandData;
};

let cachedReference: Record<string, Record<string, SubEntry>> | null = null;

function loadReference() {
  if (cachedReference) return cachedReference;
  const filePath = path.join(process.cwd(), "data", "reference-prices.draft.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw);
  cachedReference = parsed.categories;
  return cachedReference;
}

function formatAUD(n: number): string {
  return "$" + n.toLocaleString("en-AU");
}

export type RateInfo = {
  median: number;
  min: number;
  max: number;
  notes: string | null;
};

export type CategoryRates = {
  calloutFee: RateInfo | null;
  hourlyRate: RateInfo | null;
};

export function getCategoryRates(topSlug: string, subSlug: string): CategoryRates | null {
  const ref = loadReference();
  if (!ref) return null;
  const topCat = ref[topSlug];
  if (!topCat) return null;
  const sub = topCat[subSlug];
  if (!sub) return null;

  const calloutFee = sub.calloutFee
    ? { median: sub.calloutFee.median, min: sub.calloutFee.min, max: sub.calloutFee.max, notes: sub.calloutFee.notes ?? null }
    : null;
  const hourlyRate = sub.hourlyRate
    ? { median: sub.hourlyRate.median, min: sub.hourlyRate.min, max: sub.hourlyRate.max, notes: sub.hourlyRate.notes ?? null }
    : null;

  if (!calloutFee && !hourlyRate) return null;
  return { calloutFee, hourlyRate };
}

export function getReferenceBlock(topSlug: string, subSlug: string): string | null {
  const ref = loadReference();
  if (!ref) return null;
  const topCat = ref[topSlug];
  if (!topCat) return null;
  const sub = topCat[subSlug];
  if (!sub) return null;

  if (sub.pricingModel === "scope-variant" && sub.bands) {
    const lines: string[] = ["AU MARKET REFERENCE — " + subSlug];
    lines.push("");
    if (sub.bands.small) {
      const b = sub.bands.small;
      lines.push(
        "Small (" + (b.scope || "") + "): " +
        formatAUD(b.min) + "–" + formatAUD(b.max) +
        " (typical " + formatAUD(b.median) + ")"
      );
    }
    if (sub.bands.medium) {
      const b = sub.bands.medium;
      lines.push(
        "Medium (" + (b.scope || "") + "): " +
        formatAUD(b.min) + "–" + formatAUD(b.max) +
        " (typical " + formatAUD(b.median) + ")"
      );
    }
    if (sub.bands.large) {
      const b = sub.bands.large;
      lines.push(
        "Large (" + (b.scope || "") + "): " +
        formatAUD(b.min) + "–" + formatAUD(b.max) +
        " (typical " + formatAUD(b.median) + ")"
      );
    }
    if (sub.calloutFee) {
      const c = sub.calloutFee;
      const h = sub.hourlyRate;
      let rates =
        "Rates: Call-out " + formatAUD(c.min) + "–" + formatAUD(c.max) +
        " (typical " + formatAUD(c.median) + ")";
      if (h) {
        rates +=
          ", hourly " + formatAUD(h.min) + "–" + formatAUD(h.max) +
          " (typical " + formatAUD(h.median) + ")";
      }
      lines.push("");
      lines.push(rates);
    }
    return lines.join("\n");
  }

  if (sub.pricingModel === "per-unit" && sub.rate) {
    const r = sub.rate;
    const unit = sub.unitLabel || "per unit";
    const lines: string[] = ["AU MARKET REFERENCE — " + subSlug];
    lines.push("");
    lines.push(
      formatAUD(r.min) + "–" + formatAUD(r.max) + " " + unit +
      " (typical " + formatAUD(r.median) + " " + unit + ")"
    );
    if (r.notes) {
      lines.push("");
      lines.push("Notes: " + r.notes);
    }
    return lines.join("\n");
  }

  if (sub.pricingModel === "fixed-job" && sub.band) {
    const b = sub.band;
    const lines: string[] = ["AU MARKET REFERENCE — " + subSlug];
    lines.push("");
    lines.push(
      "Range: " + formatAUD(b.min) + "–" + formatAUD(b.max) +
      " (typical " + formatAUD(b.median) + ")"
    );
    if (b.scope) {
      lines.push("");
      lines.push("Notes: " + b.scope);
    }
    return lines.join("\n");
  }

  return null;
}
