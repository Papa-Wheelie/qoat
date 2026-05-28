import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: quoteId } = await params;
  const userId = session.user.id;
  const where = { quoteId_userId: { quoteId, userId } };
  const existing = await prisma.helpfulMark.findUnique({ where });

  if (existing) {
    await prisma.helpfulMark.delete({ where });
  } else {
    await prisma.helpfulMark.create({ data: { quoteId, userId } });
  }

  const count = await prisma.helpfulMark.count({ where: { quoteId } });
  return Response.json({ marked: !existing, count });
}
