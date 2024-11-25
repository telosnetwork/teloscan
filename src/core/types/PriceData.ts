export interface PriceChartData {
  lastUpdated: number;
  tokenPrice: number;
  dayChange: number;
  dayVolume: number;
  marketCap: number;
  prices: DateTuple[];
}

export interface PriceHistory {
  data: {
    prices: DateTuple[];
  };
}

export type DateTuple = [number | string, number];

export interface PriceStats {
  status: number;
  data: {
    [tokenId: string]: {
      last_updated_at: number;
      usd: number;
      usd_24h_change: number;
      usd_24h_vol: number;
      usd_market_cap: number;
    };
  };
}


