import { NextResponse } from "next/server";

const CHARTS = process.env.CHARTS_SERVER_URL || "http://localhost:8010";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  try {
    const res = await fetch(`${CHARTS}/api/search?q=${encodeURIComponent(q)}`, {
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ error: "engine_down", results: [] }, { status: 503 });
  }
}
