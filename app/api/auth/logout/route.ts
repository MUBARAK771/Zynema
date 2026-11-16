import { NextResponse } from "next/server";
import { clearDashboardSession } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ signedOut: true });
  clearDashboardSession(response);
  return response;
}
