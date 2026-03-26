type Fill = "full" | "half" | "empty";

function getStarFills(rating: number): Fill[] {
  const full = Math.floor(rating);
  const frac = rating - full;
  return Array.from({ length: 5 }, (_, i) => {
    if (i < full) return "full";
    if (i === full) {
      if (frac >= 0.75) return "full";
      if (frac >= 0.25) return "half";
    }
    return "empty";
  });
}

const STAR_PATH =
  "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";

function StarSvg({ fill, size, index }: { fill: Fill; size: number; index: number }) {
  const clipId = `star-half-${index}`;

  if (fill === "full") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24">
        <path d={STAR_PATH} fill="#FBBC04" />
      </svg>
    );
  }

  if (fill === "empty") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24">
        <path d={STAR_PATH} fill="#E0E0E0" />
      </svg>
    );
  }

  // Half star
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y="0" width="12" height="24" />
        </clipPath>
      </defs>
      <path d={STAR_PATH} fill="#E0E0E0" />
      <path d={STAR_PATH} fill="#FBBC04" clipPath={`url(#${clipId})`} />
    </svg>
  );
}

export default function StarRating({
  rating,
  size = 16,
}: {
  rating: number;
  size?: number;
}) {
  const fills = getStarFills(Math.min(5, Math.max(0, rating)));
  return (
    <span className="flex items-center gap-px">
      {fills.map((fill, i) => (
        <StarSvg key={i} fill={fill} size={size} index={i} />
      ))}
    </span>
  );
}
