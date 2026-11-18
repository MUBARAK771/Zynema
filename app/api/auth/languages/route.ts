import { NextResponse } from "next/server";
import { getTMDBLocales } from "@/lib/tmdb";

export async function GET() {
  try {
    return NextResponse.json(
      { languages: await getTMDBLocales() },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600" } },
    );
  } catch (error) {
    console.error("TMDB language list lookup failed", error);
    return NextResponse.json(
      { error: "Content languages are temporarily unavailable." },
      { status: 502 },
    );
  }
}
