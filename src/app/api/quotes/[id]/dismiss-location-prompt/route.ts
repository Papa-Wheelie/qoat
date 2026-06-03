import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const quote = await prisma.quote.findUnique({ where: { id }, select: { userId: true } });
  if (!quote) return Response.json({ error: "Not found" }, { status: 404 });
  if (quote.userId !== session.user.id) return Response.json({ error: "Forbidden" }, { status: 403 });

  await prisma.quote.update({ where: { id }, data: { locationPromptDismissed: true } });
  return Response.json({ ok: true });
}
