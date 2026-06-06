import { NextResponse } from "next/server";

// Proxy to the Kite charts engine (Python FastAPI). Keeps everything same-origin
// so the native Charts page has no CORS issues. Engine must be running on :8010.
const CHARTS = process.env.CHARTS_SERVER_URL || "http://localhost:8010";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol") || "";
  try {
    const res = await fetch(`${CHARTS}/api/analyze?symbol=${encodeURIComponent(symbol)}`, {
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e: any) {
    return NextResponse.json(
      { error: "engine_down", message: String(e?.message ?? e) },
      { status: 503 }
    );
  }
}
