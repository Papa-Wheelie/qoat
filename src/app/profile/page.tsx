import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProfileContent from "./ProfileContent";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [user, quoteCount, commentCount, voteCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, createdAt: true },
    }),
    prisma.quote.count({ where: { userId: session.user.id } }),
    prisma.comment.count({ where: { userId: session.user.id } }),
    prisma.vote.count({ where: { userId: session.user.id } }),
  ]);

  if (!user) redirect("/login");

  return (
    <main className="min-h-screen bg-surface pt-14 py-16 px-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-extrabold tracking-tight text-primary">Profile</h1>
        </header>
        <ProfileContent
          profile={{
            name: user.name,
            email: user.email,
            createdAt: user.createdAt.toISOString(),
            stats: { quoteCount, commentCount, voteCount },
          }}
          image={session.user.image ?? null}
        />
      </div>
    </main>
  );
}
