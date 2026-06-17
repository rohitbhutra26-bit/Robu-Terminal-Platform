import { NextResponse } from "next/server";

// Proxy to the Kite charts engine to fetch the Zerodha login URL.
// Keeps it same-origin so the Charts page can start the login with one click.
const CHARTS = process.env.CHARTS_SERVER_URL || "http://localhost:8010";

export async function GET() {
  try {
    const res = await fetch(`${CHARTS}/api/kite_login`, { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e: any) {
    return NextResponse.json(
      { url: "", error: "engine_down", message: String(e?.message ?? e) },
      { status: 503 }
    );
  }
}
