import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const quote = await prisma.quote.findUnique({
    where: { id },
    select: { analysisStatus: true, userId: true, hidden: true },
  });
  if (!quote) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ analysisStatus: quote.analysisStatus });
}

const VALID_STATUSES = ["pending", "accepted", "rejected"] as const;
type Status = (typeof VALID_STATUSES)[number];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { status } = (await request.json()) as { status?: string };

  if (!status || !VALID_STATUSES.includes(status as Status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  const quote = await prisma.quote.findUnique({ where: { id }, select: { userId: true } });
  if (!quote) return Response.json({ error: "Not found" }, { status: 404 });
  if (quote.userId !== session.user.id) return Response.json({ error: "Forbidden" }, { status: 403 });

  const updated = await prisma.quote.update({
    where: { id },
    data: { status: status as Status },
    select: { id: true, status: true },
  });

  return Response.json(updated);
}
