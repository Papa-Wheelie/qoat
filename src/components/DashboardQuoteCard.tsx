import Link from "next/link";
import { formatAUD } from "@/lib/formatPrice";

type Props = {
  id: string;
  title: string;
  subcategoryName: string | null;
  totalAmount: number | null;
  createdAt: string; // ISO string
};

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "1 week ago";
  if (weeks < 5) return `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return "1 month ago";
  return `${months} months ago`;
}

export default function DashboardQuoteCard({
  id,
  title,
  subcategoryName,
  totalAmount,
  createdAt,
}: Props) {
  return (
    <Link
      href={`/quotes/${id}`}
      className="block bg-white rounded-[14px] px-5 py-5 space-y-3 hover:shadow-sm transition-shadow group"
    >
      <p className="text-[10px] font-semibold tracking-widest uppercase text-on-surface-variant">
        {subcategoryName ?? "Quote"}
      </p>
      <p className="text-sm font-bold text-on-surface group-hover:underline line-clamp-2 leading-snug">
        {title}
      </p>
      <div className="flex items-center justify-between gap-2">
        {totalAmount != null ? (
          <p className="text-base font-extrabold tracking-tight text-primary">
            {formatAUD(totalAmount)}
          </p>
        ) : (
          <p className="text-xs text-on-surface-variant italic">Analysing…</p>
        )}
        <p className="text-[10px] text-on-surface-variant whitespace-nowrap">
          Uploaded {timeAgo(createdAt)}
        </p>
      </div>
    </Link>
  );
}
