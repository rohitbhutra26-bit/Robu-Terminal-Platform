import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/automated/prisma";
import { computeAnalytics } from "@/lib/automated/analytics";
import type { AnalyticTrade } from "@/lib/automated/analytics/types";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Scope rules:
//   ?accountId=<id>  -> just that account
//   (default)        -> "combined" = all accounts flagged includeInCombined
//                       (HDFC is excluded by its flag)
export async function GET(req: NextRequest) {
  try {
    const accountId = req.nextUrl.searchParams.get("accountId");

    let where: Prisma.TradeWhereInput = {};
    if (accountId) {
      where = { accountId };
    } else {
      const combinedAccounts = await prisma.account.findMany({
        where: { includeInCombined: true },
        select: { id: true },
      });
      where = { accountId: { in: combinedAccounts.map((a) => a.id) } };
    }

    const rows = await prisma.trade.findMany({ where, orderBy: { entryTime: "asc" } });
    const trades: AnalyticTrade[] = rows.map((r) => ({
      id: r.id,
      rawSymbol: r.rawSymbol,
      symbol: r.symbol,
      instrument: r.instrument as AnalyticTrade["instrument"],
      strike: r.strike,
      optionType: r.optionType as AnalyticTrade["optionType"],
      entryTime: r.entryTime,
      exitTime: r.exitTime,
      expiryDate: r.expiryDate,
      premiumSold: r.premiumSold,
      premiumBought: r.premiumBought,
      quantity: r.quantity,
      isShort: r.isShort,
      pnl: r.pnl,
      charges: r.charges,
      costSource: r.costSource as AnalyticTrade["costSource"],
      holdingMinutes: r.holdingMinutes,
      isExpiryDay: r.isExpiryDay,
    }));

    if (trades.length === 0) {
      return NextResponse.json({ empty: true });
    }

    return NextResponse.json(computeAnalytics(trades));
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to compute analytics. Is the database running and migrated?" },
      { status: 500 }
    );
  }
}
