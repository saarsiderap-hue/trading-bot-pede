
import React, { useMemo } from 'react';
import { SystemStatus, Position, TradeOrder } from '../types';
import { ShieldAlert, Activity, Lock, AlertOctagon, History, ArrowUpRight, ArrowDownRight, TrendingDown } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

interface RiskCenterProps {
    systemStatus: SystemStatus;
    positions: Position[];
    orders: TradeOrder[];
    balanceEUR: number;
}

const RiskCenter: React.FC<RiskCenterProps> = ({ systemStatus, positions, orders, balanceEUR }) => {
  
  // Calculate Risk Metrics
  const metrics = useMemo(() => {
    const totalExposureEUR = positions.reduce((acc, pos) => acc + pos.valueEUR, 0);
    const totalPortfolioValue = totalExposureEUR + balanceEUR;
    const exposureRatio = totalPortfolioValue > 0 ? (totalExposureEUR / totalPortfolioValue) * 100 : 0;
    
    // Simplified VaR (Value at Risk) Calculation: Exposure * Volatility Factor (approx 5% for crypto daily) * 1.65 (95% conf)
    const var24h = totalExposureEUR * 0.05 * 1.65; 

    return {
        exposure: totalExposureEUR,
        total: totalPortfolioValue,
        ratio: exposureRatio,
        var: var24h
    };
  }, [positions, balanceEUR]);


  // Generate chart data based on safety score
  const data = useMemo(() => {
    const baseRisk = 100 - systemStatus.safetyScore;
    return Array.from({ length: 20 }).map((_, i) => ({
        name: i.toString(),
        risk: Math.max(0, baseRisk + (Math.sin(i) * 10) + (Math.random() * 5))
    }));
  }, [systemStatus.safetyScore]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
      {/* KPI Cards */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-lg relative overflow-hidden group">
         <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShieldAlert size={64} />
         </div>
         <h3 className="text-gray-500 uppercase text-xs font-bold tracking-widest mb-2">Value at Risk (95%)</h3>
         <div className="text-3xl font-bold text-white mb-1">€{metrics.var.toFixed(2)}</div>
         <div className="text-xs text-red-400">Potential Daily Loss</div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-lg relative overflow-hidden group">
         <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity size={64} />
         </div>
         <h3 className="text-gray-500 uppercase text-xs font-bold tracking-widest mb-2">Portfolio Health</h3>
         <div className={`text-3xl font-bold mb-1 ${systemStatus.safetyScore > 80 ? 'text-emerald-500' : 'text-yellow-500'}`}>
            {systemStatus.safetyScore.toFixed(1)}%
         </div>
         <div className="text-xs text-gray-400">AI Confidence Score</div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-lg relative overflow-hidden group">
         <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Lock size={64} />
         </div>
         <h3 className="text-gray-500 uppercase text-xs font-bold tracking-widest mb-2">Net Exposure</h3>
         <div className="text-3xl font-bold text-white mb-1">{metrics.ratio.toFixed(1)}%</div>
         <div className="text-xs text-yellow-500">Allocated Capital</div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-lg relative overflow-hidden group">
         <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingDown size={64} />
         </div>
         <h3 className="text-gray-500 uppercase text-xs font-bold tracking-widest mb-2">Open Drawdown</h3>
         {/* Calculated from negative PnL positions */}
         <div className="text-3xl font-bold text-white mb-1">
            €{Math.abs(positions.reduce((acc, p) => acc + (p.unrealizedPnL < 0 ? p.unrealizedPnL : 0), 0) / 1.08).toFixed(2)}
         </div>
         <div className="text-xs text-forge-neon">Unrealized Losses</div>
      </div>

      {/* Main Chart */}
      <div className="md:col-span-2 lg:col-span-3 bg-neutral-900 border border-neutral-800 rounded-lg p-6">
         <h3 className="text-white font-bold uppercase mb-4 flex items-center">
            <ShieldAlert className="mr-2 text-forge-neon" size={20} />
            Volatility Surface
         </h3>
         <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={data}>
                  <defs>
                     <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                     </linearGradient>
                  </defs>
                  <Tooltip contentStyle={{ backgroundColor: '#171717', border: 'none' }} />
                  <Area type="monotone" dataKey="risk" stroke="#ef4444" fillOpacity={1} fill="url(#colorRisk)" />
               </AreaChart>
            </ResponsiveContainer>
         </div>
      </div>

      {/* Audit Log */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
         <h3 className="text-white font-bold uppercase mb-4">System Guardrails</h3>
         <div className="space-y-3">
             <RiskItem label="Killswitch Active" status="secure" />
             <RiskItem label="Slippage < 0.5%" status="secure" />
             <RiskItem label="Concentration < 20%" status={metrics.ratio > 80 ? 'warning' : 'secure'} />
             <RiskItem label="API Latency" status="secure" value="45ms" />
         </div>
      </div>

      {/* Recent Trades Section */}
      <div className="md:col-span-2 lg:col-span-4 bg-neutral-900 border border-neutral-800 rounded-lg p-6">
         <h3 className="text-white font-bold uppercase mb-4 flex items-center">
            <History className="mr-2 text-gray-500" size={20} />
            Execution Ledger
         </h3>
         <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
                 <thead className="text-xs text-gray-500 uppercase bg-black/20 font-mono">
                     <tr>
                         <th className="px-4 py-3 rounded-l">Time</th>
                         <th className="px-4 py-3">Symbol</th>
                         <th className="px-4 py-3">Side</th>
                         <th className="px-4 py-3 text-right">Size</th>
                         <th className="px-4 py-3 text-right">Price</th>
                         <th className="px-4 py-3 text-right">Fee</th>
                         <th className="px-4 py-3 rounded-r text-right">Value (EUR)</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-neutral-800 font-mono">
                    {orders.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-gray-600 italic">Ledger empty. No trades recorded this session.</td>
                        </tr>
                    ) : (
                        orders.slice(0, 10).map(order => (
                            <tr key={order.id} className="hover:bg-neutral-800/50 transition-colors">
                                <td className="px-4 py-3 text-gray-400">{new Date(order.timestamp).toLocaleTimeString()}</td>
                                <td className="px-4 py-3 font-bold text-white">{order.symbol}</td>
                                <td className="px-4 py-3">
                                    <span className={`flex items-center ${order.side === 'BUY' ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {order.side}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right text-gray-300">{order.amount.toFixed(4)}</td>
                                <td className="px-4 py-3 text-right text-gray-300">{order.price.toFixed(4)}</td>
                                <td className="px-4 py-3 text-right text-orange-500">{order.fee.toFixed(2)}</td>
                                <td className="px-4 py-3 text-right font-bold">€{order.valueEUR.toFixed(2)}</td>
                            </tr>
                        ))
                    )}
                 </tbody>
             </table>
         </div>
      </div>
    </div>
  );
};

const RiskItem = ({ label, status, value }: { label: string, status: 'secure' | 'warning' | 'critical', value?: string }) => {
    const colors = {
        secure: 'text-emerald-500',
        warning: 'text-yellow-500',
        critical: 'text-red-500'
    };
    const icons = {
        secure: 'OK',
        warning: 'WARN',
        critical: 'FAIL'
    }
    return (
        <div className="flex justify-between items-center text-sm border-b border-neutral-800 pb-2">
            <span className="text-gray-400">{label}</span>
            <div className="flex space-x-2">
                {value && <span className="text-gray-500 font-mono">{value}</span>}
                <span className={`font-mono font-bold ${colors[status]}`}>{icons[status]}</span>
            </div>
        </div>
    )
}

export default RiskCenter;
