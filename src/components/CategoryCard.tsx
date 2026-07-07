import Link from "next/link";

type Props = {
  topSlug: string;
  topName: string;
  subcategoryCount: number;
  quoteCount: number;
  description: string;
  hasBadge?: boolean;
};

export default function CategoryCard({
  topSlug,
  topName,
  subcategoryCount,
  quoteCount,
  description,
  hasBadge,
}: Props) {
  return (
    <Link
      href={`/categories/${topSlug}`}
      className="group bg-white rounded-2xl px-5 py-5 space-y-3 hover:shadow-sm transition-shadow block"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-on-surface leading-snug">{topName}</h3>
        <span className="text-on-surface-variant group-hover:text-on-surface transition-colors shrink-0 mt-0.5">
          ›
        </span>
      </div>
      <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">{description}</p>
      <div className="flex items-center flex-wrap gap-2">
        <p className="text-xs text-on-surface-variant">
          {subcategoryCount} sub-categories ·{" "}
          <span className="text-on-surface font-medium">{quoteCount}</span> quotes
        </p>
        {hasBadge && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary whitespace-nowrap">
            You&apos;ve uploaded here
          </span>
        )}
      </div>
    </Link>
  );
}
