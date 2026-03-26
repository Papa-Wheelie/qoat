import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";

async function getOwned(id: string, userId: string) {
  const quote = await prisma.quote.findUnique({ where: { id } });
  if (!quote) return null;
  if (quote.userId !== userId) return null;
  return quote;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const quote = await getOwned(id, session.user.id);
  if (!quote) return Response.json({ error: "Not found" }, { status: 404 });

  const { title, categoryId, suburb, state, description } = (await request.json()) as {
    title?: string;
    categoryId?: string;
    suburb?: string;
    state?: string;
    description?: string;
  };

  if (!title?.trim()) return Response.json({ error: "Title is required" }, { status: 400 });

  const updated = await prisma.quote.update({
    where: { id },
    data: {
      title: title.trim(),
      categoryId: categoryId ?? quote.categoryId,
      suburb: suburb?.trim() || null,
      state: state?.trim() || null,
      description: description?.trim() || null,
    },
    select: { id: true, title: true },
  });

  return Response.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const quote = await getOwned(id, session.user.id);
  if (!quote) return Response.json({ error: "Not found" }, { status: 404 });

  // Cascade delete in FK order
  const commentIds = (
    await prisma.comment.findMany({ where: { quoteId: id }, select: { id: true } })
  ).map((c) => c.id);

  await prisma.vote.deleteMany({ where: { commentId: { in: commentIds } } });
  await prisma.comment.deleteMany({ where: { quoteId: id } });
  await prisma.quoteAnalysis.deleteMany({ where: { quoteId: id } });
  await prisma.vote.deleteMany({ where: { quoteId: id } });
  await prisma.quote.delete({ where: { id } });

  // Delete file from Supabase Storage
  const basePrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/quotes/`;
  const storagePath = quote.fileUrl.startsWith(basePrefix)
    ? quote.fileUrl.slice(basePrefix.length)
    : null;

  if (storagePath) {
    await supabase.storage.from("quotes").remove([storagePath]);
  }

  return Response.json({ success: true });
}
