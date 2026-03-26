import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const { token, password } = await request.json() as { token?: string; password?: string };

  if (!token || !password) {
    return Response.json({ error: "Token and password are required" }, { status: 400 });
  }

  const record = await prisma.verificationToken.findUnique({ where: { token } });

  if (!record || record.type !== "password-reset" || record.expiresAt < new Date()) {
    return Response.json({ error: "Invalid or expired reset link" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { email: record.email },
    data: { password: hashed },
  });

  await prisma.verificationToken.delete({ where: { token } });

  return Response.json({ success: true });
}
