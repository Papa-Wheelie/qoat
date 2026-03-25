import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { extractQuote } from "@/lib/extractQuote";

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;
    const categoryId = formData.get("categoryId") as string | null;
    const description = formData.get("description") as string | null;

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

    // Upload to Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const storagePath = `${session.user.id}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("quotes")
      .upload(storagePath, buffer, { contentType: file.type });

    if (uploadError) {
      return Response.json(
        { error: "File upload failed", details: uploadError.message },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from("quotes")
      .getPublicUrl(storagePath);

    // Save Quote record
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

    // Run AI extraction — non-blocking, do not fail the upload on error
    console.log("[upload] starting extraction for quote", quote.id, "path:", storagePath);
    extractQuote(storagePath, file.type)
      .then((extraction) => {
        console.log("[upload] extraction succeeded for quote", quote.id, "summary:", extraction.summary);
        return prisma.quoteAnalysis.create({
          data: {
            quoteId: quote.id,
            rawExtraction: extraction,
            supplierName: extraction.supplierName ?? undefined,
            totalAmount: extraction.totalAmount ?? undefined,
            lineItems: extraction.lineItems,
            redFlags: extraction.redFlags,
            summary: extraction.summary ?? undefined,
            estimatedTimeframe: extraction.estimatedTimeframe ?? undefined,
          },
        });
      })
      .then((saved) => console.log("[upload] analysis saved, id:", saved.id))
      .catch((err) => console.error("[upload] extraction failed for quote", quote.id, err));

    return Response.json(quote, { status: 201 });
  } catch (error) {
    console.error("[upload] unhandled error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
