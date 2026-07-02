"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { PriceBucket } from "@/lib/categoryStats";

type Props = {
  distribution: PriceBucket[];
  median: number;
};

function findMedianBucket(distribution: PriceBucket[], median: number): string | null {
  for (const bucket of distribution) {
    if (median >= bucket.min && (bucket.max === null || median < bucket.max)) {
      return bucket.label;
    }
  }
  return null;
}

export default function PriceDistributionChart({ distribution, median }: Props) {
  const medianLabel = findMedianBucket(distribution, median);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={distribution} margin={{ top: 16, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid vertical={false} stroke="#F0F0EE" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#888" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "#888" }}
          axisLine={false}
          tickLine={false}
          width={24}
        />
        <Tooltip
          cursor={{ fill: "#F0F0EE" }}
          contentStyle={{
            borderRadius: 8,
            border: "none",
            boxShadow: "0 2px 12px rgba(0,0,0,0.10)",
            fontSize: 12,
          }}
          formatter={(value) => [value, "Quotes"]}
        />
        <Bar dataKey="count" fill="#7DD4C0" radius={[4, 4, 0, 0]} />
        {medianLabel && (
          <ReferenceLine
            x={medianLabel}
            stroke="#444444"
            strokeDasharray="4 2"
            label={{
              value: "Median",
              position: "top",
              fontSize: 11,
              fill: "#444444",
            }}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}
