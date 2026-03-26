import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    redirect("/?verified=error");
  }

  const record = await prisma.verificationToken.findUnique({ where: { token } });

  if (!record || record.type !== "email-verify" || record.expiresAt < new Date()) {
    redirect("/?verified=error");
  }

  await prisma.user.update({
    where: { email: record.email },
    data: { emailVerified: new Date() },
  });

  await prisma.verificationToken.delete({ where: { token } });

  redirect("/?verified=true");
}
