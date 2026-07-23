import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import SettingsContent from "./SettingsContent";

export const metadata = { title: "Settings — QOAT", robots: { index: false, follow: false } };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, emailVerified: true, password: true },
  });

  if (!user) redirect("/login");

  return (
    <main className="min-h-screen bg-surface pt-14 py-16 px-6">
      <div className="max-w-2xl mx-auto space-y-10">
        <header>
          <h1 className="text-3xl font-extrabold tracking-tight text-primary">Account settings</h1>
        </header>
        <SettingsContent
          email={user.email}
          emailVerified={!!user.emailVerified}
          hasPassword={!!user.password}
        />
      </div>
    </main>
  );
}
