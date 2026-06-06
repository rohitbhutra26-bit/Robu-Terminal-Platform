import type { InstrumentClass, OptionType } from "../types";

export type CostSource = "REAL" | "ESTIMATED" | "NONE";

// The trade shape the analytics layer operates on (mirrors the DB row).
export interface AnalyticTrade {
  id: string;
  rawSymbol: string;
  symbol: string;
  instrument: InstrumentClass;
  strike: number | null;
  optionType: OptionType | null;
  entryTime: Date;
  exitTime: Date | null;
  expiryDate: Date | null;
  premiumSold: number;
  premiumBought: number;
  quantity: number;
  isShort: boolean;
  pnl: number;
  charges?: number | null;
  costSource?: CostSource;
  holdingMinutes: number | null;
  isExpiryDay: boolean;
  // enriched
  underlyingAtEntry?: number | null;
  strikeDistance?: number | null;
  strikeDistancePct?: number | null;
  approxDelta?: number | null;
  isReentry?: boolean;
  reentryWindow?: number | null; // minutes bucket
}

export interface PerfStats {
  trades: number;
  wins: number;
  losses: number;
  winRate: number; // 0..1
  totalPnl: number;
  avgProfit: number;
  avgLoss: number;
  profitFactor: number; // gross profit / gross loss
  maxDrawdown: number;
  expectancy: number; // avg pnl per trade
}
