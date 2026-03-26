import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(request: Request) {
  const { email } = await request.json() as { email?: string };
  console.log("[forgot-password] received request for:", email);

  if (!email) {
    return Response.json({ error: "Email is required" }, { status: 400 });
  }

  console.log("[forgot-password] RESEND_API_KEY present:", !!process.env.RESEND_API_KEY);
  console.log("[forgot-password] NEXTAUTH_URL:", process.env.NEXTAUTH_URL);

  const user = await prisma.user.findUnique({ where: { email } });
  console.log("[forgot-password] user found:", !!user);

  // Always return success to avoid leaking whether an email exists
  if (!user) {
    console.log("[forgot-password] no user found, returning early");
    return Response.json({ success: true });
  }

  // Delete any existing password-reset tokens for this email
  await prisma.verificationToken.deleteMany({
    where: { email, type: "password-reset" },
  });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.verificationToken.create({
    data: { email, token, type: "password-reset", expiresAt },
  });

  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
  console.log("[forgot-password] sending email to:", email, "url:", resetUrl);

  try {
    const result = await sendPasswordResetEmail(email, resetUrl);
    console.log("[forgot-password] Resend result:", result);
  } catch (err) {
    console.error("[forgot-password] Resend error:", err);
  }

  return Response.json({ success: true });
}
