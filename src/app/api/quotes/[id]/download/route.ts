import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const quote = await prisma.quote.findUnique({
    where: { id },
    select: { userId: true, fileUrl: true },
  });

  if (!quote) return Response.json({ error: "Not found" }, { status: 404 });
  if (quote.userId !== session.user.id) return Response.json({ error: "Forbidden" }, { status: 403 });

  const basePrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/quotes/`;
  const storagePath = quote.fileUrl.startsWith(basePrefix)
    ? quote.fileUrl.slice(basePrefix.length)
    : null;

  if (!storagePath) return Response.json({ error: "File not found" }, { status: 400 });

  const { data, error } = await supabase.storage
    .from("quotes")
    .createSignedUrl(storagePath, 60);

  if (error || !data?.signedUrl) {
    return Response.json({ error: "Could not generate download URL" }, { status: 500 });
  }

  return Response.json({ url: data.signedUrl });
}
