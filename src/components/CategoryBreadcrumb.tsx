import Link from "next/link";

type Props = {
  topSlug: string;
  topName: string;
  subName?: string;
};

export default function CategoryBreadcrumb({ topSlug, topName, subName }: Props) {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-on-surface-variant">
      <Link href="/categories" className="hover:text-on-surface transition-colors">
        Categories
      </Link>
      <span aria-hidden>›</span>
      {subName ? (
        <>
          <Link
            href={`/categories/${topSlug}`}
            className="hover:text-on-surface transition-colors"
          >
            {topName}
          </Link>
          <span aria-hidden>›</span>
          <span className="text-on-surface">{subName}</span>
        </>
      ) : (
        <span className="text-on-surface">{topName}</span>
      )}
    </nav>
  );
}
