// Shared types used across adapters, normalizer and analytics.

// Real brokers Rohit trades through. (Earlier placeholders ANGELONE/UPSTOX/
// PROGRESSIVE were never his brokers and have been removed.)
export type Broker = "ZERODHA" | "KOTAK" | "HDFC";

export type OptionType = "CE" | "PE";

// Asset family of the contract. Options-only is the analytics scope, but we
// tag FUT so futures can be cleanly excluded rather than silently dropped.
export type AssetClass = "OPT" | "FUT";

// Widened to match Rohit's real book: index now covers SENSEX/BANKEX/
// MIDCPNIFTY etc., not just the original three.
export type InstrumentClass =
  | "NIFTY"
  | "BANKNIFTY"
  | "FINNIFTY"
  | "SENSEX"
  | "BANKEX"
  | "MIDCPNIFTY"
  | "INDEX" // any other index underlying
  | "STOCK"
  | "COMMODITY"
  | "OTHER";

// A single execution (one fill) as read from a broker tradebook.
export interface RawExecution {
  broker: Broker;
  accountId: string; // which account this fill belongs to (segregation key)
  externalId?: string;
  rawSymbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  price: number;
  time: Date;
  // Adapters that can read structured fields (an explicit expiry column, or a
  // cleanly delimited symbol) supply this so the normalizer doesn't have to
  // crack an ambiguous string. When absent, the normalizer falls back to
  // parseSymbol().
  parsed?: ParsedSymbol;
  asset?: AssetClass;
  // Real per-trade charges when the broker provides them (Kotak does; Zerodha
  // and HDFC do not — those are estimated later and flagged).
  charges?: number | null;
}

// A completed round-trip trade after pairing buys & sells.
export interface NormalizedTrade {
  externalId?: string;
  broker: Broker;
  accountId: string;
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
  charges: number | null; // real if broker supplied; else null (estimated later)
  holdingMinutes: number | null;
  isExpiryDay: boolean;
}

// Parsed components of an Indian option tradingsymbol.
export interface ParsedSymbol {
  symbol: string; // underlying
  instrument: InstrumentClass;
  strike: number | null;
  optionType: OptionType | null;
  expiryDate: Date | null;
}
