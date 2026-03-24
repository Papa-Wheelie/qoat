import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password, name } = body as {
    email?: string;
    password?: string;
    name?: string;
  };

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with that email already exists." },
      { status: 409 }
    );
  }

  const hashed = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { email, password: hashed, name: name ?? null },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  return NextResponse.json(user, { status: 201 });
}
