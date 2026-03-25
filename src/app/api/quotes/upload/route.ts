import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  console.log("Step 1: Session check");
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  console.log("Step 1 OK: user id =", session.user.id);

  let file: File | null = null;
  try {
    console.log("Step 2: Parsing form data");
    const formData = await request.formData();
    file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;
    const categoryId = formData.get("categoryId") as string | null;
    const description = formData.get("description") as string | null;
    console.log("Step 2: File received:", file?.name, "title:", title, "categoryId:", categoryId);

    if (!file || !title || !categoryId) {
      return Response.json(
        { error: "file, title, and categoryId are required" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json(
        { error: "File must be a PDF, JPG, PNG, or WebP" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return Response.json({ error: "File exceeds 10MB limit" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const storagePath = `${session.user.id}/${Date.now()}-${file.name}`;

    console.log("Step 3: Uploading to Supabase, path:", storagePath);
    const { error: uploadError } = await supabase.storage
      .from("quotes")
      .upload(storagePath, buffer, { contentType: file.type });

    if (uploadError) {
      console.error("Step 3 FAILED:", uploadError);
      return Response.json(
        { error: "File upload failed", details: uploadError.message },
        { status: 500 }
      );
    }
    console.log("Step 3 OK: uploaded to", storagePath);

    const { data: publicUrlData } = supabase.storage
      .from("quotes")
      .getPublicUrl(storagePath);

    console.log("Step 4: Saving to DB...");
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
    console.log("Step 4 OK: quote id =", quote.id);

    return Response.json(quote, { status: 201 });
  } catch (error) {
    console.error("Upload route unhandled error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
