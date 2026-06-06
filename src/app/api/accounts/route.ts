import { NextResponse } from "next/server";
import { prisma } from "@/lib/automated/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// List all accounts with a quick trade count + net P&L per account, so the
// dashboard can render the filter tabs and the comparison table without a
// second round-trip.
export async function GET() {
  try {
    const accounts = await prisma.account.findMany({ orderBy: { createdAt: "asc" } });

    const summaries = await Promise.all(
      accounts.map(async (a) => {
        const agg = await prisma.trade.aggregate({
          where: { accountId: a.id, exitTime: { not: null } },
          _count: { _all: true },
          _sum: { pnl: true, charges: true },
        });
        const wins = await prisma.trade.count({
          where: { accountId: a.id, exitTime: { not: null }, pnl: { gt: 0 } },
        });
        const closed = agg._count._all;
        return {
          id: a.id,
          label: a.label,
          broker: a.broker,
          includeInCombined: a.includeInCombined,
          closedTrades: closed,
          grossPnl: agg._sum.pnl ?? 0,
          charges: agg._sum.charges ?? 0,
          netPnl: (agg._sum.pnl ?? 0) - (agg._sum.charges ?? 0),
          winRate: closed ? wins / closed : 0,
        };
      })
    );

    return NextResponse.json({ accounts: summaries });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to load accounts. Is the database running and migrated?" },
      { status: 500 }
    );
  }
}

// Create a new account (used by the import flow when adding a broker account).
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { label, broker, accountNumber, includeInCombined } = body ?? {};
    if (!label || !broker) {
      return NextResponse.json({ error: "label and broker are required." }, { status: 400 });
    }
    const account = await prisma.account.create({
      data: {
        label,
        broker,
        accountNumber: accountNumber ?? null,
        includeInCombined: includeInCombined ?? true,
      },
    });
    return NextResponse.json({ ok: true, account });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Failed to create account." }, { status: 500 });
  }
}
