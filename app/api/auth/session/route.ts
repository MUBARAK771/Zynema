import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";

export async function GET() {
  const user = await getRequestUser();

  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email ?? null,
    },
  });
}
