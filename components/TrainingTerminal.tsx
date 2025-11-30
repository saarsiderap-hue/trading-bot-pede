
import React, { useState, useEffect, useRef } from 'react';
import { SystemStatus, TradeRecord } from '../types';
import { Play, Square, Terminal, Cpu, Database, ShieldCheck, AlertTriangle, Loader2, Activity } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

interface TrainingTerminalProps {
  systemStatus: SystemStatus;
  updateStatus: (newStatus: Partial<SystemStatus>) => void;
  addTrade: (trade: TradeRecord) => void;
}

const TrainingTerminal: React.FC<TrainingTerminalProps> = ({ systemStatus, updateStatus, addTrade }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  // Real-time Price Simulation State (Mock WebSocket)
  const pricesRef = useRef<Record<string, number>>({
    'SOL/USDT': 148.50,
    'TRX/USDT': 0.154,
    'BONK/SOL': 0.000021,
    'WIF/SOL': 3.10,
    'PEPE/USDT': 0.0000085
  });

  // Price Tick Engine: Updates prices independently of the training loop to simulate live market data
  useEffect(() => {
    const priceInterval = setInterval(() => {
        const keys = Object.keys(pricesRef.current);
        keys.forEach(key => {
            const volatility = 0.005; // 0.5% volatility per tick
            const change = 1 + (Math.random() * volatility * 2 - volatility);
            pricesRef.current[key] *= change;
        });
    }, 800); // Updates every 800ms
    return () => clearInterval(priceInterval);
  }, []);

  // Simulation Loop
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isRunning) {
      interval = setInterval(() => {
        // Increase Score slowly with randomness
        const improvement = Math.random() * 0.4 + 0.05; 
        const newScore = Math.min(100, systemStatus.safetyScore + improvement);
        
        let level: 'CRITICAL' | 'CALIBRATING' | 'SECURE' = 'CRITICAL';
        if (newScore > 40) level = 'CALIBRATING';
        if (newScore > 80) level = 'SECURE';

        updateStatus({
          safetyScore: newScore,
          trainingEpochs: systemStatus.trainingEpochs + 1,
          securityLevel: level
        });

        const strategies = ['MACD_CROSS_V2', 'ARBITRAGE_SEEKER', 'LIQUIDITY_SNIPER', 'SENTIMENT_ANALYZER_GEMINI'];
        const outcomes = ['PROFIT_TAKE', 'STOP_LOSS', 'ENTRY_FILLED', 'ORDER_REJECTED'];
        const symbols = Object.keys(pricesRef.current);
        
        const strategy = strategies[Math.floor(Math.random() * strategies.length)];
        const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
        
        // Execute Trade with Real-time Price Data
        const tradeSymbol = symbols[Math.floor(Math.random() * symbols.length)];
        const currentPrice = pricesRef.current[tradeSymbol];
        const tradeAction = Math.random() > 0.5 ? 'BUY' : 'SELL';
        
        // Simulate PnL: Assume we entered at a price slightly different from current (simulating volatility)
        const entryPrice = currentPrice * (1 + (Math.random() * 0.04 - 0.02)); // Entry was +/- 2%
        let grossPnl = 0;
        
        // Calculate Gross PnL percentage
        if (tradeAction === 'BUY') {
            grossPnl = ((currentPrice - entryPrice) / entryPrice) * 100;
        } else {
            grossPnl = ((entryPrice - currentPrice) / entryPrice) * 100;
        }

        // Apply Trading Fee (0.1%)
        const TRADING_FEE = 0.1;
        const netPnl = grossPnl - TRADING_FEE;
        const pnlVal = parseFloat(netPnl.toFixed(2));
        
        addLog(`[EPOCH_${systemStatus.trainingEpochs}] Executing ${strategy}... ${outcome}`);

        const tradeRecord: TradeRecord = {
          id: `${Date.now()}-${Math.random()}`,
          symbol: tradeSymbol,
          action: tradeAction,
          pnl: pnlVal,
          confidence: newScore,
          timestamp: new Date()
        };
        addTrade(tradeRecord);

        // Format price based on magnitude (e.g. PEPE needs more decimals)
        const decimals = currentPrice < 1 ? (currentPrice < 0.001 ? 8 : 4) : 2;
        const formattedPrice = currentPrice.toFixed(decimals);

        // Log the specific trade details with Live Price and Net PnL
        addLog(`>> ORDER_FILLED: ${tradeAction} ${tradeSymbol} @ $${formattedPrice} | Net PnL: ${pnlVal > 0 ? '+' : ''}${pnlVal.toFixed(2)}% (Fee -0.1%) | CONF: ${newScore.toFixed(1)}%`);

        setChartData(prev => {
            const newData = [...prev, { epoch: systemStatus.trainingEpochs, score: newScore }];
            if (newData.length > 50) return newData.slice(1);
            return newData;
        });

      }, 300); // slightly faster updates
    }

    return () => clearInterval(interval);
  }, [isRunning, systemStatus, updateStatus, addTrade]);

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`].slice(-30));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
      
      {/* Control Panel */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 flex flex-col space-y-6 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-widest flex items-center mb-2">
            <Cpu className="mr-2 text-forge-neon" /> Training Core
          </h2>
          <p className="text-gray-500 text-xs font-mono">
            Validate algorithmic integrity via high-frequency paper trading. Reaching 80% confidence unlocks the Mainnet Bridge.
          </p>
        </div>

        <div className="flex-grow flex flex-col items-center justify-center space-y-8">
           <div className="relative w-48 h-48 group">
              <svg className="w-full h-full transform -rotate-90">
                 <circle cx="96" cy="96" r="88" stroke="#171717" strokeWidth="12" fill="none" />
                 <circle 
                    cx="96" cy="96" r="88" 
                    stroke={systemStatus.safetyScore > 80 ? '#10b981' : systemStatus.safetyScore > 40 ? '#eab308' : '#ef4444'} 
                    strokeWidth="12" 
                    fill="none" 
                    strokeDasharray={552}
                    strokeDashoffset={552 - (552 * systemStatus.safetyScore) / 100}
                    className="transition-all duration-300 ease-linear shadow-[0_0_15px_currentColor]"
                 />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <span className={`text-4xl font-bold font-mono transition-colors ${isRunning ? 'text-white animate-pulse' : 'text-gray-300'}`}>
                    {systemStatus.safetyScore.toFixed(1)}%
                 </span>
                 <span className="text-xs uppercase tracking-widest text-gray-500 mt-1">Confidence</span>
              </div>
              
              <div className={`absolute inset-0 rounded-full blur-3xl opacity-20 -z-10 transition-colors duration-500 ${
                  systemStatus.safetyScore > 80 ? 'bg-emerald-500' : 'bg-red-500'
              }`}></div>
           </div>

           <div className="w-full space-y-2 bg-black/20 p-4 rounded border border-neutral-800">
              <div className="flex justify-between text-xs uppercase font-mono text-gray-500">
                <span>Epochs Run</span>
                <span className="text-white font-bold">{systemStatus.trainingEpochs}</span>
              </div>
              <div className="flex justify-between text-xs uppercase font-mono text-gray-500">
                <span>Bot Status</span>
                <span className={`font-bold ${isRunning ? "text-forge-neon animate-pulse" : "text-gray-400"}`}>
                    {isRunning ? "SIMULATION RUNNING" : "STANDBY"}
                </span>
              </div>
           </div>
        </div>

        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`w-full py-4 text-sm font-bold uppercase tracking-widest rounded flex justify-center items-center space-x-3 transition-all border shadow-lg
            ${isRunning 
              ? 'bg-red-900/10 border-red-500/50 text-red-500 hover:bg-red-900/30 hover:shadow-red-500/30' 
              : 'bg-gradient-to-r from-neutral-800 to-neutral-900 border-forge-neon text-forge-neon hover:from-orange-900/20 hover:to-orange-800/20 hover:text-white hover:shadow-orange-500/20'
            }`}
        >
          {isRunning ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              <span>Stop Simulation</span>
            </>
          ) : (
            <>
              <Play size={20} className="fill-current" /> 
              <span>Initiate Training</span>
            </>
          )}
        </button>
      </div>

      {/* Terminal Output */}
      <div className="lg:col-span-2 flex flex-col space-y-6">
        
        {/* Real-time Chart */}
        <div className="h-1/3 bg-neutral-900 border border-neutral-800 rounded-lg p-4 relative overflow-hidden flex flex-col">
             <div className="absolute top-3 left-4 text-xs font-bold uppercase text-gray-500 flex items-center z-10">
                <Database size={12} className="mr-2" /> Learning Curve
             </div>
             <div className="flex-grow w-full h-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                    <YAxis hide domain={[0, 100]} />
                    <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke={systemStatus.safetyScore > 80 ? '#10b981' : '#ea580c'} 
                        strokeWidth={2} 
                        dot={false} 
                        isAnimationActive={false} 
                    />
                    </LineChart>
                </ResponsiveContainer>
             </div>
        </div>

        {/* Console */}
        <div className="flex-grow bg-black border border-neutral-800 rounded-lg p-4 font-mono text-xs overflow-hidden flex flex-col relative shadow-inner">
            <div className="absolute top-0 left-0 right-0 bg-neutral-800/80 p-2 border-b border-neutral-700 flex justify-between items-center backdrop-blur z-10">
               <div className="flex items-center space-x-2">
                 <Terminal size={14} className="text-gray-400" />
                 <span className="text-gray-300">STDOUT // ALGO_ENGINE_V1</span>
               </div>
               <div className="flex space-x-1.5">
                 <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                 <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                 <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
               </div>
            </div>
            <div ref={logContainerRef} className="mt-8 flex-grow overflow-y-auto space-y-1.5 text-gray-400 scroll-smooth p-2">
               {logs.length === 0 && <span className="opacity-50 text-orange-500/50">System ready. Awaiting training command...</span>}
               {logs.map((log, i) => (
                 <div key={i} className="hover:bg-white/5 p-0.5 rounded flex break-all">
                   <span className="text-forge-neon mr-2 font-bold select-none">{'>'}</span>
                   <span>{log}</span>
                 </div>
               ))}
               {isRunning && (
                   <div className="flex items-center text-forge-neon animate-pulse">
                       <span className="mr-2">{'>'}</span>
                       <span className="w-2 h-4 bg-forge-neon block"></span>
                   </div>
               )}
            </div>
        </div>

        {/* Validation Check */}
        <div className={`p-4 rounded-lg border flex items-center justify-between transition-colors duration-500 ${
            systemStatus.safetyScore >= 80 
            ? 'bg-emerald-900/10 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
            : 'bg-red-900/10 border-red-500/30'
        }`}>
            <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-full ${systemStatus.safetyScore >= 80 ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                    {systemStatus.safetyScore >= 80 ? <ShieldCheck className="text-emerald-500" size={24} /> : <AlertTriangle className="text-red-500" size={24} />}
                </div>
                <div>
                    <h3 className={`font-bold uppercase tracking-wider ${systemStatus.safetyScore >= 80 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {systemStatus.safetyScore >= 80 ? 'System Validated' : 'Validation Failed'}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                        {systemStatus.safetyScore >= 80 
                            ? 'Safety protocols satisfied. Mainnet bridge authorized.' 
                            : `Current confidence level: ${systemStatus.safetyScore.toFixed(1)}%. Min required: 80.0%.`}
                    </p>
                </div>
            </div>
            {systemStatus.safetyScore >= 80 && (
                <button className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase text-xs rounded shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-105">
                    Enable Live Bridge
                </button>
            )}
        </div>

      </div>
    </div>
  );
};

export default TrainingTerminal;
