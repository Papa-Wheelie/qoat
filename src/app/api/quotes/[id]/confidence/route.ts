import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const voteCount = await prisma.vote.count({ where: { quoteId: id } });

  // MVP: score scales from 0–10 based on upvotes, capped at 10
  const score = Math.min(voteCount, 10);

  return Response.json({ score, voteCount });
}
