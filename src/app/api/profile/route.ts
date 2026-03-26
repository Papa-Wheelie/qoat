import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user, quoteCount, commentCount, voteCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, emailVerified: true, createdAt: true, password: true },
    }),
    prisma.quote.count({ where: { userId: session.user.id } }),
    prisma.comment.count({ where: { userId: session.user.id } }),
    prisma.vote.count({ where: { userId: session.user.id } }),
  ]);

  if (!user) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json({
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    hasPassword: !!user.password,
    stats: { quoteCount, commentCount, voteCount },
  });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await request.json() as { name?: string };

  if (!name?.trim()) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { name: name.trim() },
    select: { id: true, name: true, email: true },
  });

  return Response.json(user);
}
