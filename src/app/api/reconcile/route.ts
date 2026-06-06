import { NextResponse } from "next/server";
import { prisma } from "@/lib/automated/prisma";
import { reconcile } from "@/lib/automated/reconcile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Per-account reconciliation: does the cash that went in/out (raw, captured at
// import) equal what the paired trades account for (realised P&L + open legs)?
// If matched, the pairing lost/duplicated nothing — the numbers are trustworthy.
export async function GET() {
  try {
    const accounts = await prisma.account.findMany({ orderBy: { createdAt: "asc" } });

    const results = await Promise.all(
      accounts.map(async (a) => {
        const batches = await prisma.importBatch.findMany({ where: { accountId: a.id } });
        const rawNet = batches.reduce((s, b) => s + (b.rawSellValue - b.rawBuyValue), 0);
        const rawBuyQty = batches.reduce((s, b) => s + b.rawBuyQty, 0);
        const rawSellQty = batches.reduce((s, b) => s + b.rawSellQty, 0);
        const rawCharges = batches.reduce((s, b) => s + b.rawCharges, 0);

        const trades = await prisma.trade.findMany({
          where: { accountId: a.id },
          select: { pnl: true, exitTime: true, isShort: true, premiumSold: true, premiumBought: true, quantity: true },
        });

        const recon = reconcile(rawNet, rawBuyQty, rawSellQty, trades);
        return {
          accountId: a.id,
          label: a.label,
          broker: a.broker,
          imports: batches.length,
          rawCharges: Math.round(rawCharges * 100) / 100,
          ...recon,
        };
      })
    );

    const withData = results.filter((r) => r.imports > 0);
    const allMatched = withData.length > 0 && withData.every((r) => r.matched);

    return NextResponse.json({ results, allMatched, accountsWithData: withData.length });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to reconcile. Is the database running and migrated?" },
      { status: 500 }
    );
  }
}
