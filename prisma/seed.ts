/**
 * Seeds the SIX real accounts (no trades). The demo/synthetic tradebook seeder
 * was removed — real data now enters only through file imports, so the
 * dashboard never shows fake numbers.
 *
 * Account numbers are placeholders; edit them to your real (masked) client IDs.
 * HDFC is under a different name and is excluded from combined "All Accounts"
 * totals (includeInCombined = false).
 *
 * Run: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ACCOUNTS = [
  { label: "Zerodha — 1", broker: "ZERODHA" as const, accountNumber: "ZER-1", includeInCombined: true },
  { label: "Zerodha — 2", broker: "ZERODHA" as const, accountNumber: "ZER-2", includeInCombined: true },
  { label: "Zerodha — 3", broker: "ZERODHA" as const, accountNumber: "ZER-3", includeInCombined: true },
  { label: "Zerodha — 4", broker: "ZERODHA" as const, accountNumber: "ZER-4", includeInCombined: true },
  { label: "Kotak Neo", broker: "KOTAK" as const, accountNumber: "KOTAK-1", includeInCombined: true },
  { label: "HDFC Securities", broker: "HDFC" as const, accountNumber: "HDFC-1212336", includeInCombined: false },
];

async function main() {
  for (const a of ACCOUNTS) {
    await prisma.account.upsert({
      where: { broker_accountNumber: { broker: a.broker, accountNumber: a.accountNumber } },
      update: { label: a.label, includeInCombined: a.includeInCombined },
      create: a,
    });
  }
  const count = await prisma.account.count();
  console.log(`Seeded accounts. Total accounts in DB: ${count}. No trades seeded (import real files).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
