
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { 
  Scan, ArrowUpRight, ArrowDownRight, Activity, Zap, 
  Wallet, TrendingUp, BarChart2, Flame, Crosshair, List, XCircle, Bitcoin, ShieldAlert, Sparkles
} from 'lucide-react';
import { MarketTicker, Position, TradeOrder, SystemStatus } from '../types';
import { PAIR_DISPLAY_MAP } from '../services/marketEngine';
import { analyzeMarketData } from '../services/geminiService';

interface TradingDashboardProps {
  marketData: Record<string, MarketTicker>;
  positions: Position[];
  orders: TradeOrder[]; // History
  activeOrders: TradeOrder[]; // Open Limits
  balanceEUR: number;
  systemStatus: SystemStatus;
  onExecuteTrade: (symbol: string, side: 'BUY' | 'SELL', type: 'MARKET' | 'LIMIT', amountEUR: number, leverage: number, limitPrice?: number) => void;
  onCancelOrder: (id: string) => void;
}

const TradingDashboard: React.FC<TradingDashboardProps> = ({ 
  marketData, 
  positions, 
  orders,
  activeOrders,
  balanceEUR, 
  systemStatus,
  onExecuteTrade,
  onCancelOrder
}) => {
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT'); 
  const [tradeAmount, setTradeAmount] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [leverage, setLeverage] = useState(5); // Default higher leverage for Futures feel
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [chartData, setChartData] = useState<any[]>([]);

  // AI Analysis State
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const activeTicker = marketData[selectedSymbol];
  const activePosition = positions.find(p => p.symbol === selectedSymbol);

  // Auto-set limit price to current price when switching to limit
  useEffect(() => {
      if (orderType === 'LIMIT' && activeTicker && !limitPrice) {
          setLimitPrice(activeTicker.price.toString());
      }
  }, [orderType, activeTicker]);

  // --- CHART LOGIC ---
  useEffect(() => {
    const fetchSnapshot = async () => {
        try {
            const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${selectedSymbol}&interval=1m&limit=100`);
            const json = await res.json();
            const formatted = json.map((k: any) => ({
                time: new Date(k[0]).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
                price: parseFloat(k[4])
            }));
            setChartData(formatted);
        } catch(e) { console.error(e); }
    };
    fetchSnapshot();
  }, [selectedSymbol]);

  // Listen to live ticks
  useEffect(() => {
    if (activeTicker) {
        setChartData(prev => {
            const last = prev[prev.length - 1];
            const now = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
            if (last && last.time === now) {
                const updated = [...prev];
                updated[updated.length - 1] = { time: now, price: activeTicker.price };
                return updated;
            } else {
                return [...prev.slice(-99), { time: now, price: activeTicker.price }];
            }
        });
    }
  }, [activeTicker]);


  const handleTrade = (side: 'BUY' | 'SELL') => {
    if (!tradeAmount) return;
    onExecuteTrade(
        selectedSymbol, 
        side, 
        orderType,
        parseFloat(tradeAmount), 
        leverage,
        orderType === 'LIMIT' ? parseFloat(limitPrice) : undefined
    );
    setTradeAmount('');
  };

  const handleAiAnalysis = async () => {
      setIsAnalyzing(true);
      setAiAnalysis(null);
      
      // Build summary string
      const summary = Object.values(marketData).map(t => 
        `${t.symbol}: $${t.price} (${t.priceChangePercent}%) Vol:${t.quoteVolume.toFixed(0)}`
      ).join('\n');

      const result = await analyzeMarketData(summary);
      setAiAnalysis(result);
      setIsAnalyzing(false);
  };

  const getPnlColor = (pnl: number) => {
    if (pnl > 0) return 'text-emerald-500';
    if (pnl < 0) return 'text-red-500';
    return 'text-gray-400';
  };

  // Filter orders for the current symbol
  const symbolActiveOrders = activeOrders.filter(o => o.symbol === selectedSymbol);

  return (
    <div className="grid grid-cols-12 gap-6 h-[calc(100vh-140px)] animate-fade-in relative">
      
      {/* KILLSWITCH OVERLAY */}
      {systemStatus.killswitchActive && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center border border-red-500/30 rounded-lg">
              <ShieldAlert size={64} className="text-red-500 animate-pulse mb-4" />
              <h1 className="text-4xl font-bold text-red-500 uppercase tracking-widest">Risk Guardian Triggered</h1>
              <p className="text-gray-400 mt-2 font-mono">Max drawdown exceeded. Trading disabled to preserve capital.</p>
              <button className="mt-8 px-8 py-3 bg-neutral-800 border border-red-500 text-red-500 font-bold rounded hover:bg-red-900/20">
                  Acknowledge & View Logs
              </button>
          </div>
      )}

      {/* 1. MARKET SCANNER (Left Sidebar) */}
      <div className="col-span-3 bg-neutral-900 border border-neutral-800 rounded-lg flex flex-col overflow-hidden shadow-xl">
        <div className="p-3 border-b border-neutral-800 bg-neutral-900 sticky top-0 z-10 flex flex-col space-y-2">
             <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center">
                    <Scan size={12} className="mr-2 text-forge-neon" /> Market Watch
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${systemStatus.tradingMode === 'LIVE' ? 'bg-red-900/20 text-red-500 border border-red-900' : 'bg-neutral-800 text-gray-500'}`}>
                    {systemStatus.tradingMode}
                </span>
             </div>
             
             {/* AI Scan Button */}
             <button 
                onClick={handleAiAnalysis}
                disabled={isAnalyzing}
                className="w-full bg-indigo-900/20 hover:bg-indigo-900/40 border border-indigo-500/30 text-indigo-400 text-[10px] font-bold uppercase py-1.5 rounded flex items-center justify-center transition-all"
             >
                {isAnalyzing ? (
                    <span className="animate-pulse">Scanning...</span>
                ) : (
                    <>
                        <Sparkles size={10} className="mr-1" /> Tactical AI Scan
                    </>
                )}
             </button>
        </div>
        
        {/* AI Analysis Result */}
        {aiAnalysis && (
            <div className="p-3 bg-indigo-950/30 border-b border-indigo-900/50 text-indigo-200 text-[10px] font-mono leading-relaxed relative group">
                <div className="absolute top-1 right-1 cursor-pointer opacity-50 hover:opacity-100" onClick={() => setAiAnalysis(null)}><XCircle size={12}/></div>
                <span className="text-indigo-500 font-bold mr-1">OP-INTEL:</span>
                {aiAnalysis}
            </div>
        )}

        <div className="flex-grow overflow-y-auto">
            {Object.values(marketData)
              .sort((a, b) => {
                   const priority = ['BTCUSDT', 'SOLUSDT', 'TRXUSDT', 'ETHUSDT'];
                   const aIdx = priority.indexOf(a.symbol);
                   const bIdx = priority.indexOf(b.symbol);
                   if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
                   if (aIdx !== -1) return -1;
                   if (bIdx !== -1) return 1;
                   return b.quoteVolume - a.quoteVolume;
              })
              .map((ticker) => (
                <div 
                    key={ticker.symbol}
                    onClick={() => setSelectedSymbol(ticker.symbol)}
                    className={`p-3 border-b border-neutral-800/50 cursor-pointer transition-all group relative
                        ${selectedSymbol === ticker.symbol ? 'bg-neutral-800 border-l-2 border-l-forge-neon' : 'hover:bg-neutral-800/30 border-l-2 border-l-transparent'}
                    `}
                >
                    <div className="flex justify-between items-center mb-1">
                        <span className={`font-bold text-sm flex items-center ${selectedSymbol === ticker.symbol ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                            {ticker.symbol === 'BTCUSDT' && <Bitcoin size={12} className="mr-1 text-orange-500" />}
                            {PAIR_DISPLAY_MAP[ticker.symbol] || ticker.symbol}
                        </span>
                        <span className={`text-xs font-mono font-bold ${ticker.priceChangePercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {ticker.priceChangePercent > 0 ? '+' : ''}{ticker.priceChangePercent.toFixed(2)}%
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 font-mono">${ticker.price < 1 ? ticker.price.toFixed(6) : ticker.price.toLocaleString()}</span>
                        <div className="flex items-center space-x-2">
                             {/* Mini Vol Bar */}
                             <div className="w-12 h-1 bg-neutral-700 rounded-full overflow-hidden">
                                 <div className="h-full bg-neutral-500" style={{width: `${Math.min(100, ticker.rsi || 50)}%`}}></div>
                             </div>
                        </div>
                    </div>
                    {/* Active Position Indicator Dot */}
                    {positions.find(p => p.symbol === ticker.symbol) && (
                        <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_5px_currentColor]"></div>
                    )}
                </div>
            ))}
        </div>
      </div>

      {/* 2. MAIN CHART & POSITIONS (Center) */}
      <div className="col-span-6 flex flex-col gap-6">
        
        {/* CHART CARD */}
        <div className="flex-grow bg-neutral-900 border border-neutral-800 rounded-lg p-1 relative shadow-2xl flex flex-col min-h-[400px]">
            {/* Chart Header */}
            <div className="p-4 flex justify-between items-end border-b border-neutral-800/50 bg-neutral-900/50 backdrop-blur absolute top-0 left-0 right-0 z-10">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center">
                        {PAIR_DISPLAY_MAP[selectedSymbol]}
                        {activeTicker && (
                            <span className={`ml-4 font-mono text-xl ${activeTicker.priceChangePercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                ${activeTicker.price < 1 ? activeTicker.price.toFixed(6) : activeTicker.price.toLocaleString()}
                            </span>
                        )}
                    </h2>
                    <div className="flex space-x-4 mt-1 text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                        <span>24h Vol: <span className="text-gray-300">{activeTicker ? (activeTicker.quoteVolume / 1000000).toFixed(2) : 0}M</span></span>
                        <span>High: <span className="text-gray-300">{activeTicker?.high24h}</span></span>
                        <span>Low: <span className="text-gray-300">{activeTicker?.low24h}</span></span>
                    </div>
                </div>
                <div className="text-right">
                     <div className="text-[9px] uppercase text-gray-600 font-bold mb-1">Funding / Spread</div>
                     <div className="flex items-center space-x-1 font-mono text-xs text-gray-400">
                         <span>0.01%</span>
                         <span className="mx-1">|</span>
                         <span className="text-emerald-500">{activeTicker?.bid.toFixed(2)}</span>
                     </div>
                </div>
            </div>
            
            {/* Graph */}
            <div className="w-full h-full pt-20 pb-2 bg-black/40">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ea580c" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                        <YAxis 
                            domain={['auto', 'auto']} 
                            orientation="right" 
                            stroke="#404040" 
                            tick={{fontSize: 10, fontFamily: 'monospace'}}
                            width={60}
                        />
                        <Tooltip 
                            contentStyle={{backgroundColor: '#171717', border: '1px solid #333'}}
                            itemStyle={{color: '#ea580c', fontFamily: 'monospace'}}
                        />
                        {symbolActiveOrders.map(order => (
                             <ReferenceLine 
                                key={order.id} 
                                y={order.limitPrice} 
                                stroke={order.side === 'BUY' ? "#10b981" : "#ef4444"} 
                                strokeDasharray="3 3" 
                                label={{ position: 'right', value: `${order.side} LIMIT`, fill: order.side === 'BUY' ? "#10b981" : "#ef4444", fontSize: 10 }} 
                             />
                        ))}
                        <Area 
                            type="step" 
                            dataKey="price" 
                            stroke="#ea580c" 
                            fill="url(#chartFill)" 
                            strokeWidth={2}
                            isAnimationActive={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* ACTIVE POSITIONS & ORDERS TABS */}
        <div className="h-1/3 bg-neutral-900 border border-neutral-800 rounded-lg p-4 flex flex-col shadow-lg">
            <h3 className="text-xs font-bold uppercase text-gray-400 mb-3 flex items-center justify-between">
                <span className="flex items-center"><Activity size={12} className="mr-2" /> Open Positions</span>
                <span className="text-[10px] text-gray-600">FUTURES ACCOUNT</span>
            </h3>
            <div className="overflow-auto flex-grow">
                <table className="w-full text-left text-xs font-mono">
                    <thead className="text-gray-600 uppercase border-b border-neutral-800">
                        <tr>
                            <th className="pb-2 pl-2">Pair</th>
                            <th className="pb-2 text-right">Lev</th>
                            <th className="pb-2 text-right">Size</th>
                            <th className="pb-2 text-right">Entry</th>
                            <th className="pb-2 text-right">Mark</th>
                            <th className="pb-2 text-right text-red-500">Liq. Price</th>
                            <th className="pb-2 text-right pr-2">PnL (ROE%)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                        {positions.length === 0 && (
                            <tr><td colSpan={7} className="py-4 text-center text-gray-700 italic">No open positions</td></tr>
                        )}
                        {positions.map(pos => (
                            <tr key={pos.symbol} className="group hover:bg-white/5 transition-colors">
                                <td className="py-2 pl-2 font-bold text-gray-300">{PAIR_DISPLAY_MAP[pos.symbol]}</td>
                                <td className="py-2 text-right text-orange-500">{pos.leverage}x</td>
                                <td className="py-2 text-right">{pos.amount.toFixed(4)}</td>
                                <td className="py-2 text-right text-gray-500">{pos.avgEntryPrice.toLocaleString()}</td>
                                <td className="py-2 text-right text-gray-300">{pos.currentPrice.toLocaleString()}</td>
                                <td className="py-2 text-right text-red-500 font-bold">{pos.liquidationPrice.toLocaleString()}</td>
                                <td className={`py-2 text-right font-bold pr-2 ${getPnlColor(pos.unrealizedPnLPercent)}`}>
                                    €{pos.unrealizedPnL.toFixed(2)} <span className="text-[10px] opacity-70">({pos.unrealizedPnLPercent.toFixed(2)}%)</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>

      {/* 3. ORDER ENTRY TERMINAL (Right Sidebar) */}
      <div className="col-span-3 flex flex-col gap-4">
        
        {/* Wallet Card */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <Wallet size={80} />
            </div>
            <span className="text-[10px] font-bold uppercase text-gray-500 tracking-widest block mb-2">Available Margin</span>
            <div className="text-3xl font-mono text-white font-bold tracking-tighter">€{balanceEUR.toFixed(2)}</div>
            <div className="mt-2 text-xs text-emerald-500 flex items-center">
                 <Zap size={10} className="mr-1" /> Buying Power: €{(balanceEUR * leverage).toFixed(2)}
            </div>
        </div>

        {/* Order Entry */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 flex-grow flex flex-col shadow-lg">
            {/* Order Type Tabs */}
            <div className="flex bg-neutral-800 rounded p-1 mb-4">
                <button 
                    onClick={() => setOrderType('MARKET')}
                    className={`flex-1 py-2 text-xs font-bold uppercase rounded transition-all ${orderType === 'MARKET' ? 'bg-neutral-700 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    Market
                </button>
                <button 
                    onClick={() => setOrderType('LIMIT')}
                    className={`flex-1 py-2 text-xs font-bold uppercase rounded transition-all ${orderType === 'LIMIT' ? 'bg-neutral-700 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    Limit
                </button>
            </div>

            <div className="space-y-4">
                {/* Leverage Slider */}
                <div>
                    <div className="flex justify-between mb-2">
                        <label className="text-[10px] font-bold uppercase text-gray-400">Leverage</label>
                        <span className="text-[10px] font-bold text-orange-500">{leverage}x</span>
                    </div>
                    <input 
                        type="range" 
                        min="1" 
                        max="20" 
                        step="1"
                        value={leverage}
                        onChange={(e) => setLeverage(parseInt(e.target.value))}
                        className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-forge-neon"
                    />
                    <div className="flex justify-between text-[9px] text-gray-600 mt-1 font-mono">
                        <span>1x</span>
                        <span>10x</span>
                        <span className="text-orange-500">20x (Max)</span>
                    </div>
                </div>

                {/* Price Input (Limit Only) */}
                {orderType === 'LIMIT' && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                        <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Limit Price</label>
                        <div className="relative">
                            <input 
                                type="number"
                                value={limitPrice}
                                onChange={(e) => setLimitPrice(e.target.value)}
                                className="w-full bg-black border border-neutral-700 rounded p-3 text-right font-mono text-white focus:border-forge-neon focus:outline-none"
                            />
                            <span className="absolute left-3 top-3 text-gray-500 text-xs font-bold">USD</span>
                        </div>
                    </div>
                )}

                {/* Amount Input */}
                <div>
                    <div className="flex justify-between mb-1">
                        <label className="text-[10px] font-bold uppercase text-gray-400">Margin Cost (EUR)</label>
                        <span className="text-[10px] text-gray-600 font-mono cursor-pointer hover:text-white" onClick={() => setTradeAmount(balanceEUR.toString())}>
                            Max: {balanceEUR.toFixed(0)}
                        </span>
                    </div>
                    <div className="relative">
                        <input 
                            type="number"
                            value={tradeAmount}
                            onChange={(e) => setTradeAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-black border border-neutral-700 rounded p-3 text-right font-mono text-white focus:border-forge-neon focus:outline-none"
                        />
                        <span className="absolute left-3 top-3 text-gray-500 text-xs font-bold">EUR</span>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="bg-neutral-800/50 p-3 rounded border border-neutral-800 space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Position Size</span>
                        <span className="font-mono text-gray-300">
                             {tradeAmount ? (parseFloat(tradeAmount) * leverage).toFixed(0) : '0'} EUR
                        </span>
                    </div>
                    <div className="flex justify-between text-xs border-t border-neutral-700 pt-2">
                        <span className="text-gray-500">Est. Fee (0.1%)</span>
                        <span className="font-mono text-orange-500">€{tradeAmount ? (parseFloat(tradeAmount) * leverage * 0.001).toFixed(2) : '0.00'}</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                    <button 
                        onClick={() => handleTrade('BUY')}
                        disabled={!tradeAmount}
                        className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-4 rounded font-bold uppercase tracking-wider text-sm shadow-lg shadow-emerald-900/20 transition-all active:scale-95"
                    >
                        {orderType === 'LIMIT' ? 'Limit Buy' : 'Buy / Long'}
                    </button>
                    <button 
                        onClick={() => handleTrade('SELL')}
                        disabled={!tradeAmount}
                        className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white py-4 rounded font-bold uppercase tracking-wider text-sm shadow-lg shadow-red-900/20 transition-all active:scale-95"
                    >
                         {orderType === 'LIMIT' ? 'Limit Sell' : 'Sell / Short'}
                    </button>
                </div>
            </div>

            {/* Active Limit Orders List */}
            <div className="mt-auto pt-6 flex-grow flex flex-col">
                <h4 className="text-[10px] font-bold uppercase text-gray-500 mb-2 border-b border-neutral-800 pb-1 flex items-center">
                    <List size={10} className="mr-1"/> Open Orders ({activeOrders.length})
                </h4>
                <div className="space-y-1 overflow-y-auto pr-1 flex-grow max-h-40">
                    {activeOrders.length === 0 && <span className="text-[9px] text-gray-700 italic block text-center mt-4">No active orders</span>}
                    {activeOrders.map(order => (
                        <div key={order.id} className="flex justify-between items-center bg-neutral-800/30 p-2 rounded border border-neutral-800 text-[9px] font-mono group">
                            <div className="flex flex-col">
                                <span className={`font-bold ${order.side === 'BUY' ? 'text-emerald-500' : 'text-red-500'}`}>{order.side} {PAIR_DISPLAY_MAP[order.symbol]}</span>
                                <span className="text-gray-400">@ {order.limitPrice}</span>
                            </div>
                            <button onClick={() => onCancelOrder(order.id)} className="text-gray-600 hover:text-red-500">
                                <XCircle size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TradingDashboard;
