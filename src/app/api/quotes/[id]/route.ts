import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { moderateText } from "@/lib/moderateText";

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

  const body = (await request.json()) as {
    title?: string;
    privateNickname?: string;
    categoryId?: string;
    suburb?: string;
    state?: string;
    description?: string;
    topCategorySlug?: string;
    subcategorySlug?: string | null;
  };
  const { title, privateNickname, categoryId, suburb, state, description, topCategorySlug, subcategorySlug } = body;

  // title is now locked — controlled by QOAT AI only
  if (title !== undefined) {
    return Response.json({ error: "The public title is set by QOAT and cannot be edited." }, { status: 400 });
  }

  // Validate privateNickname if provided
  if (privateNickname !== undefined && privateNickname.trim().length > 100) {
    return Response.json({ error: "Personal label must be 100 characters or fewer." }, { status: 400 });
  }

  // Content moderation for text fields being changed
  if (privateNickname !== undefined && privateNickname.trim()) {
    const mod = await moderateText(privateNickname.trim(), "title");
    if (!mod.ok) return Response.json({ error: mod.reason ?? "That content isn't allowed." }, { status: 422 });
  }
  if (suburb !== undefined && suburb.trim()) {
    const mod = await moderateText(suburb.trim(), "location");
    if (!mod.ok) return Response.json({ error: mod.reason ?? "That content isn't allowed." }, { status: 422 });
  }
  if (description !== undefined && description.trim()) {
    const mod = await moderateText(description.trim(), "description");
    if (!mod.ok) return Response.json({ error: mod.reason ?? "That content isn't allowed." }, { status: 422 });
  }

  // Category slug validation
  if (subcategorySlug !== undefined && topCategorySlug === undefined) {
    return Response.json({ error: "You must select a top category first." }, { status: 400 });
  }

  let resolvedSubcategoryId: string | null = null;

  if (topCategorySlug !== undefined) {
    const topCat = await prisma.topCategory.findUnique({ where: { slug: topCategorySlug } });
    if (!topCat) return Response.json({ error: "Invalid top category." }, { status: 400 });

    if (subcategorySlug != null) {
      const sub = await prisma.subcategory.findUnique({
        where: { slug: subcategorySlug },
        include: { topCategory: { select: { slug: true } } },
      });
      if (!sub) return Response.json({ error: "Invalid subcategory." }, { status: 400 });
      if (sub.topCategory.slug !== topCategorySlug) {
        return Response.json({ error: "Subcategory does not belong to the selected top category." }, { status: 400 });
      }
      resolvedSubcategoryId = sub.id;
    }
  }

  // Build update payload — only update fields present in the request
  const data: Record<string, unknown> = {};

  if (privateNickname !== undefined) {
    data.privateNickname = privateNickname.trim() || null;
  }
  if (categoryId !== undefined) {
    data.categoryId = categoryId;
    data.categoryEdited = true;
  }
  if (topCategorySlug !== undefined) {
    data.subcategoryId = resolvedSubcategoryId;
    data.categoryEdited = true;
  }
  if (suburb !== undefined || state !== undefined) {
    if (suburb !== undefined) data.suburb = suburb.trim() || null;
    if (state !== undefined) data.state = state.trim() || null;
    data.locationEdited = true;
  }
  if (description !== undefined) {
    data.description = description.trim() || null;
  }

  if (Object.keys(data).length === 0) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  const updated = await prisma.quote.update({
    where: { id },
    data,
    select: {
      id: true,
      title: true,
      privateNickname: true,
      categoryId: true,
      subcategoryId: true,
      suburb: true,
      state: true,
      description: true,
      categoryEdited: true,
      locationEdited: true,
      category: { select: { id: true, name: true, slug: true } },
      subcategory: {
        select: {
          id: true,
          name: true,
          slug: true,
          topCategory: { select: { id: true, name: true, slug: true } },
        },
      },
    },
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
