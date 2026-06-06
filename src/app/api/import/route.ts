import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/automated/prisma";
import { detectBroker, adaptRows, type Row } from "@/lib/automated/brokers";
import { buildTrades } from "@/lib/automated/normalize";
import { estimateCharges } from "@/lib/automated/costs";
import { computeRawTotals } from "@/lib/automated/reconcile";
import type { Broker } from "@/lib/automated/types";

export const runtime = "nodejs";

// Read rows from a file buffer, handling both CSV (Zerodha/Kotak) and the HDFC
// .xlsx order log. For xlsx we locate the real header row (HDFC prefixes the
// sheet with ~13 metadata rows) by finding the row containing "Symbol / Contract".
async function readRows(file: File): Promise<{ rows: Row[]; headers: string[] }> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const buf = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buf, { type: "buffer", cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const grid = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, raw: false, defval: "" });
    const headerIdx = grid.findIndex((r) =>
      r.some((c) => String(c).toLowerCase().replace(/\s/g, "").includes("symbol/contract"))
    );
    if (headerIdx < 0) return { rows: [], headers: [] };
    const headers = grid[headerIdx].map((h) => String(h).trim());
    const rows: Row[] = [];
    for (let i = headerIdx + 1; i < grid.length; i++) {
      const r = grid[i];
      if (!r || r.every((c) => String(c).trim() === "")) continue;
      const obj: Row = {};
      headers.forEach((h, j) => (obj[h] = r[j] != null ? String(r[j]) : ""));
      rows.push(obj);
    }
    return { rows, headers };
  }
  // CSV
  const text = (await file.text()).replace(/^﻿/, "");
  const parsed = Papa.parse<Row>(text, { header: true, skipEmptyLines: true, transformHeader: (h) => h.trim() });
  return { rows: parsed.data as Row[], headers: parsed.meta.fields ?? [] };
}

// Import a single tradebook file INTO A SPECIFIC ACCOUNT. The account is the
// segregation key — every trade from this file is owned by it. One Zerodha
// account can receive several files (FO + COM), so imports are additive.
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const accountId = form.get("accountId") as string | null;
    const brokerOverride = form.get("broker") as Broker | null;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }
    if (!accountId) {
      return NextResponse.json({ error: "No account selected for this import." }, { status: 400 });
    }

    const account = await prisma.account.findUnique({ where: { id: accountId } });
    if (!account) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    // Duplicate guard: if this exact filename was already imported into this
    // account, don't silently double-count. The UI can resend with replace=true
    // to wipe the prior import of this file first.
    const replace = String(form.get("replace") ?? "") === "true";
    const prior = await prisma.importBatch.findFirst({
      where: { accountId, fileName: file.name },
    });
    if (prior && !replace) {
      return NextResponse.json(
        {
          error: `"${file.name}" was already imported into ${account.label} (${prior.tradeCount} trades). Re-importing would double-count.`,
          duplicate: true,
          priorTradeCount: prior.tradeCount,
        },
        { status: 409 }
      );
    }
    if (prior && replace) {
      // Remove the previous import of this file before re-importing.
      await prisma.trade.deleteMany({ where: { accountId, importBatchId: prior.id } });
      await prisma.importBatch.delete({ where: { id: prior.id } });
    }

    const { rows, headers } = await readRows(file);
    if (rows.length === 0) {
      return NextResponse.json({ error: "No data rows found in the file." }, { status: 422 });
    }

    const broker: Broker | null =
      brokerOverride && brokerOverride !== ("AUTO" as Broker)
        ? brokerOverride
        : detectBroker(headers);

    if (!broker) {
      // Unknown format: hand headers back so the UI can show the confirm-mapping
      // screen (auto-guess + confirm flow). We don't silently guess wrong.
      return NextResponse.json(
        { error: "Unrecognized broker format.", needsMapping: true, headers },
        { status: 422 }
      );
    }

    const executions = adaptRows(broker, rows, accountId);
    const trades = buildTrades(executions);

    if (trades.length === 0) {
      return NextResponse.json(
        { error: "Could not parse any trades. Check the file / broker selection.", broker, headers },
        { status: 422 }
      );
    }

    // Capture raw totals (options-only) for the reconciliation check.
    const raw = computeRawTotals(executions);

    // Create the batch first so each trade can be tagged with its origin file.
    const batch = await prisma.importBatch.create({
      data: {
        accountId,
        broker,
        fileName: file.name,
        rowCount: rows.length,
        tradeCount: trades.length,
        rawBuyValue: raw.buyValue,
        rawSellValue: raw.sellValue,
        rawBuyQty: Math.round(raw.buyQty),
        rawSellQty: Math.round(raw.sellQty),
        rawCharges: raw.realCharges,
      },
    });

    await prisma.trade.createMany({
      data: trades.map((t) => {
        const hasReal = t.charges != null;
        const charges = hasReal ? (t.charges as number) : estimateCharges(t);
        return {
          accountId,
          importBatchId: batch.id,
          externalId: t.externalId ?? null,
          broker: t.broker,
          rawSymbol: t.rawSymbol,
          symbol: t.symbol,
          instrument: t.instrument,
          asset: "OPT" as const,
          strike: t.strike,
          optionType: t.optionType,
          entryTime: t.entryTime,
          exitTime: t.exitTime,
          expiryDate: t.expiryDate,
          premiumSold: t.premiumSold,
          premiumBought: t.premiumBought,
          quantity: t.quantity,
          isShort: t.isShort,
          pnl: t.pnl,
          charges,
          costSource: hasReal ? ("REAL" as const) : ("ESTIMATED" as const),
          holdingMinutes: t.holdingMinutes,
          isExpiryDay: t.isExpiryDay,
        };
      }),
    });

    return NextResponse.json({
      ok: true,
      broker,
      account: account.label,
      rowsParsed: rows.length,
      tradesCreated: trades.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Import failed." }, { status: 500 });
  }
}

// Reset: delete trades. Optionally scoped to one account via ?accountId=.
export async function DELETE(req: NextRequest) {
  const accountId = req.nextUrl.searchParams.get("accountId");
  if (accountId) {
    await prisma.trade.deleteMany({ where: { accountId } });
    await prisma.importBatch.deleteMany({ where: { accountId } });
  } else {
    await prisma.trade.deleteMany({});
    await prisma.importBatch.deleteMany({});
  }
  return NextResponse.json({ ok: true });
}
