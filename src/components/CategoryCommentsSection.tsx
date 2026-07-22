import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCategoryComments } from "@/lib/getCategoryComments";
import CategoryCommentsInteractive from "@/components/CategoryCommentsInteractive";

type Props = {
  subSlug: string;
  subName: string;
};

export default async function CategoryCommentsSection({ subSlug, subName }: Props) {
  const session = await auth();
  const currentUserId = session?.user?.id ?? null;

  const dbSub = await prisma.subcategory.findUnique({
    where: { slug: subSlug },
    select: { id: true },
  });

  if (!dbSub) return null;

  const initialComments = await getCategoryComments(dbSub.id, "helpful", currentUserId);

  return (
    <div className="bg-white rounded-2xl px-6 py-6 space-y-4">
      <div>
        <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant">
          Community
        </p>
        <p className="text-base font-bold text-on-surface mt-1">Discussion</p>
      </div>
      <CategoryCommentsInteractive
        subSlug={subSlug}
        subName={subName}
        initialComments={initialComments}
        currentUserId={currentUserId}
      />
    </div>
  );
}
