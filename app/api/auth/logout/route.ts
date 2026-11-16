import { NextResponse } from "next/server";
import { clearDashboardSession } from "@/lib/auth";

export async function POST() {
  const loginUrl = new URL(process.env.NEXT_PUBLIC_LOGIN_URL ?? "https://zynema-web.vercel.app");
  const response = NextResponse.redirect(loginUrl.toString());
  clearDashboardSession(response);
  return response;
}
