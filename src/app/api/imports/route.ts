import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/automated/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// List every imported file (batch), newest first, with its account label and
// trade count. Optionally scope to one account via ?accountId=.
export async function GET(req: NextRequest) {
  try {
    const accountId = req.nextUrl.searchParams.get("accountId");
    const batches = await prisma.importBatch.findMany({
      where: accountId ? { accountId } : {},
      orderBy: { createdAt: "desc" },
      include: { account: { select: { label: true, broker: true } } },
    });
    return NextResponse.json({
      imports: batches.map((b) => ({
        id: b.id,
        fileName: b.fileName,
        accountLabel: b.account.label,
        broker: b.broker,
        rowCount: b.rowCount,
        tradeCount: b.tradeCount,
        createdAt: b.createdAt.toISOString(),
      })),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to load imports." },
      { status: 500 }
    );
  }
}

// Delete one imported file: removes its trades and the batch record.
// DELETE /api/imports?id=<batchId>
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "No import id provided." }, { status: 400 });
    }
    const batch = await prisma.importBatch.findUnique({ where: { id } });
    if (!batch) {
      return NextResponse.json({ error: "Import not found." }, { status: 404 });
    }
    const del = await prisma.trade.deleteMany({ where: { importBatchId: id } });
    await prisma.importBatch.delete({ where: { id } });
    return NextResponse.json({ ok: true, deletedTrades: del.count, fileName: batch.fileName });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to delete import." },
      { status: 500 }
    );
  }
}
