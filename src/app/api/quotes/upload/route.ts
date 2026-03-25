import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const title = formData.get("title") as string | null;
  const categoryId = formData.get("categoryId") as string | null;
  const description = formData.get("description") as string | null;

  if (!file || !title || !categoryId) {
    return NextResponse.json(
      { error: "file, title, and categoryId are required" },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "File must be a PDF, JPG, PNG, or WebP" },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File exceeds 10MB limit" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const storagePath = `${session.user.id}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("quotes")
    .upload(storagePath, buffer, { contentType: file.type });

  if (uploadError) {
    return NextResponse.json(
      { error: "File upload failed", details: uploadError.message },
      { status: 500 }
    );
  }

  const { data: publicUrlData } = supabase.storage
    .from("quotes")
    .getPublicUrl(storagePath);

  const quote = await prisma.quote.create({
    data: {
      title,
      description: description ?? undefined,
      fileUrl: publicUrlData.publicUrl,
      fileName: file.name,
      fileType: file.type,
      userId: session.user.id,
      categoryId,
    },
  });

  return NextResponse.json(quote, { status: 201 });
}
