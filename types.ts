
export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface ChartData {
  time: string;
  price: number;
  volume: number;
}

export enum AppTab {
  DASHBOARD = 'DASHBOARD', // Live Scanner & Execution
  TRAINING = 'TRAINING',   // Simulation Engine
  RISK = 'RISK',           // Risk Management
  ORACLE_CHAT = 'ORACLE_CHAT',
  MEME_FORGE = 'MEME_FORGE',
  DEEP_STRATEGY = 'DEEP_STRATEGY',
  SETTINGS = 'SETTINGS',   // Wallet/Keys
}

// --- ENGINE TYPES ---

export interface MarketTicker {
  symbol: string;
  price: number;
  priceChangePercent: number;
  high24h: number;
  low24h: number;
  volume: number;
  quoteVolume: number;
  bid: number;
  ask: number;
  rsi?: number; // Calculated on the fly
  volatility?: number;
}

export interface TradeOrder {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT' | 'STOP_MARKET';
  amount: number; // Quantity of token
  price: number; // Fill price or Market price at entry
  limitPrice?: number; // For Limit orders
  stopPrice?: number; // For Stop orders
  leverage: number;
  valueEUR: number; // Cost basis in EUR (Margin Used)
  timestamp: number;
  fee: number;
  status: 'FILLED' | 'OPEN' | 'CANCELLED' | 'LIQUIDATED';
}

export interface Position {
  symbol: string;
  amount: number;
  avgEntryPrice: number;
  currentPrice: number;
  liquidationPrice: number; // Critical for Futures
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  valueEUR: number; // Total Position Value
  marginUsedEUR: number; // Initial Margin
  leverage: number;
  isLong: boolean; 
}

export interface SystemStatus {
  safetyScore: number; // 0 - 100
  trainingEpochs: number;
  walletConnected: boolean;
  liveTradingEnabled: boolean;
  tradingMode: 'PAPER' | 'TESTNET' | 'LIVE';
  securityLevel: 'CRITICAL' | 'CALIBRATING' | 'SECURE';
  killswitchActive: boolean; // Risk Guardian Trigger
}

export interface TradeRecord {
  id: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  pnl: number;
  confidence: number;
  timestamp: Date;
}

export interface PortfolioItem {
  symbol: string;
  amount: number;
  avgPrice: number;
}

export interface RiskMetrics {
  var24h: number; // Value at Risk
  sharpeRatio: number;
  maxDrawdown: number;
  volatilityScore: number;
  exposureRatio: number; // Portfolio vs Cash
}
