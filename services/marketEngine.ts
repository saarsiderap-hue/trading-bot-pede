
// FORGE ENGINE V2 - CORE DATA LAYER

// Supported Pairs for the Scanner
// Prioritizing SOL, TRX, BTC as requested for the specialized bot
export const TRACKED_PAIRS = [
  'SOLUSDT', 'TRXUSDT', 'BTCUSDT', 'ETHUSDT', 'BONKUSDT', 'WIFUSDT', 'PEPEUSDT', 'DOGEUSDT'
];

export const PAIR_DISPLAY_MAP: Record<string, string> = {
  'SOLUSDT': 'SOL/USDT',
  'TRXUSDT': 'TRX/USDT',
  'BTCUSDT': 'BTC/USDT',
  'ETHUSDT': 'ETH/USDT',
  'BONKUSDT': 'BONK/USDT',
  'WIFUSDT': 'WIF/USDT',
  'PEPEUSDT': 'PEPE/USDT',
  'DOGEUSDT': 'DOGE/USDT'
};

export class MarketEngine {
  private ws: WebSocket | null = null;
  private subscribers: ((data: any) => void)[] = [];
  private isConnected: boolean = false;
  private reconnectTimer: any = null;

  constructor() {
    this.connect();
  }

  private connect() {
    if (this.ws) {
        this.ws.close();
    }

    // Multiplexed Stream URL
    const streams = TRACKED_PAIRS.map(pair => `${pair.toLowerCase()}@ticker`).join('/');
    
    const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;
    
    console.log("Creating Forge Uplink:", url);
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('Forge Uplink Established [SECURE]');
      this.isConnected = true;
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const payload = message.data;
        // payload.s is Symbol
        
        // Simple RSI approximation (rolling)
        const mockRSI = 50 + (parseFloat(payload.P) * 1.5) + (Math.random() * 5 - 2.5);

        const ticker = {
          symbol: payload.s,
          price: parseFloat(payload.c),
          priceChangePercent: parseFloat(payload.P),
          high24h: parseFloat(payload.h),
          low24h: parseFloat(payload.l),
          volume: parseFloat(payload.v),
          quoteVolume: parseFloat(payload.q),
          bid: parseFloat(payload.b),
          ask: parseFloat(payload.a),
          rsi: Math.max(0, Math.min(100, mockRSI)),
          volatility: Math.abs(parseFloat(payload.P)) // Simple volatility proxy
        };

        this.notify(ticker);
      } catch (e) {
        console.error("Stream parse error", e);
      }
    };

    this.ws.onclose = () => {
      console.warn('Forge Uplink Severed. Retrying...');
      this.isConnected = false;
      this.reconnectTimer = setTimeout(() => this.connect(), 2000); // Exponential backoff in real app
    };

    this.ws.onerror = (err) => {
      console.error('Forge Uplink Error', err);
      this.ws?.close();
    };
  }

  public subscribe(callback: (data: any) => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  private notify(data: any) {
    this.subscribers.forEach(cb => cb(data));
  }
}

// Singleton Instance
export const forgeEngine = new MarketEngine();
