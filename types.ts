export interface StockData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Indicators {
  rsi: number;
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
  };
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
  };
  ema50: number;
}

export interface AnalyzedData extends StockData {
  indicators: Indicators;
}

export enum SignalType {
  BUY = 'BUY',
  SELL = 'SELL',
  WAIT = 'WAIT'
}

export interface MarketSignal {
  type: SignalType;
  score: number;
  reasoning: string[];
  entryZone?: string;
  stopLoss?: string;
  targetPrice?: string;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
}

export interface NewsItem {
  title: string;
  source: string;
  published_at?: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  url: string;
}

export enum MarketRegion {
  US = 'US',
  PAKISTAN = 'PAKISTAN'
}

export interface TickerContext {
  price: number;
  price30DaysAgo: number; // ANCHOR 2: Ensures chart trend matches reality
  changePercent: number;
  companyName: string;
  sector: string;        // New Context
  marketCap: string;     // New Context
  currency: string;
}

export interface BacktestResult {
  trades: number;
  wins: number;
  totalReturn: number;
  winRate: number;
}
