const productCategories = ["supplier-products", "automotive", "insurance"];

const aud = (n: number) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

export function formatPublicPrice(amount: number, categorySlug: string): string {
  if (productCategories.includes(categorySlug)) {
    return aud(amount);
  }

  const lower = Math.floor((amount * 0.9) / 100) * 100;
  const upper = Math.ceil((amount * 1.1) / 100) * 100;
  return `${aud(lower)} – ${aud(upper)}`;
}
