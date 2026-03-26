import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import EditQuoteForm from "./EditQuoteForm";

export default async function EditQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [quote, categories] = await Promise.all([
    prisma.quote.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        title: true,
        categoryId: true,
        suburb: true,
        state: true,
        description: true,
      },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!quote) notFound();
  if (quote.userId !== session.user.id) redirect(`/quotes/${id}`);

  return (
    <main className="min-h-screen bg-surface pt-14 py-16 px-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-extrabold tracking-tight text-primary">Edit quote</h1>
        </header>
        <EditQuoteForm
          quoteId={id}
          initial={{
            title: quote.title,
            categoryId: quote.categoryId,
            suburb: quote.suburb ?? "",
            state: quote.state ?? "",
            description: quote.description ?? "",
          }}
          categories={categories}
        />
      </div>
    </main>
  );
}
