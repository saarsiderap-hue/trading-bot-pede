
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Layout from './components/Layout';
import TradingDashboard from './components/TradingDashboard';
import TrainingTerminal from './components/TrainingTerminal';
import RiskCenter from './components/RiskCenter';
import SettingsModal from './components/SettingsModal';
import OracleChat from './components/OracleChat';
import ImageForge from './components/ImageForge';
import StrategicAnalysis from './components/StrategicAnalysis';
import { AppTab, SystemStatus, TradeRecord, Position, MarketTicker, TradeOrder } from './types';
import { forgeEngine } from './services/marketEngine';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);
  
  // --- GLOBAL STATE ---
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    safetyScore: 34.5,
    trainingEpochs: 142,
    walletConnected: false,
    liveTradingEnabled: false,
    tradingMode: 'PAPER',
    securityLevel: 'CRITICAL',
    killswitchActive: false
  });

  // Account
  const INITIAL_BALANCE = 10000.00;
  const [balanceEUR, setBalanceEUR] = useState(INITIAL_BALANCE); 
  const [peakBalance, setPeakBalance] = useState(INITIAL_BALANCE); // For Drawdown tracking
  const [positions, setPositions] = useState<Position[]>([]);
  
  // Order Management
  const [orderHistory, setOrderHistory] = useState<TradeOrder[]>([]);
  const [activeOrders, setActiveOrders] = useState<TradeOrder[]>([]); // LIMIT / STOP orders waiting to trigger
  
  // Live Market Data Store (The "Truth")
  const [marketMap, setMarketMap] = useState<Record<string, MarketTicker>>({});

  // --- ENGINE INITIALIZATION & MATCHING ---
  useEffect(() => {
    const unsubscribe = forgeEngine.subscribe((ticker: MarketTicker) => {
      setMarketMap(prev => {
         const newData = { ...prev, [ticker.symbol]: ticker };
         
         // 1. UPDATE POSITIONS (Real-time PnL & Liquidation Check)
         setPositions(currentPositions => {
             const updatedPositions: Position[] = [];
             
             currentPositions.forEach(pos => {
                if (pos.symbol === ticker.symbol) {
                    // Check Liquidation First
                    const isLiquidated = pos.isLong 
                        ? ticker.price <= pos.liquidationPrice 
                        : ticker.price >= pos.liquidationPrice;

                    if (isLiquidated) {
                        // LIQUIDATION EVENT
                        executeLiquidation(pos, ticker.price);
                        return; // Remove from positions
                    }

                    const priceDiff = ticker.price - pos.avgEntryPrice;
                    // Adjusted for leverage and direction
                    const pnlRaw = pos.isLong ? priceDiff : -priceDiff;
                    
                    const positionSizeToken = pos.amount;
                    const pnlUSD = pnlRaw * positionSizeToken;
                    
                    // Initial Margin = (EntryPrice * Amount) / Leverage
                    const initialMarginUSD = (pos.avgEntryPrice * pos.amount) / pos.leverage;
                    const pnlPercent = (pnlUSD / initialMarginUSD) * 100;

                    updatedPositions.push({
                        ...pos,
                        currentPrice: ticker.price,
                        unrealizedPnL: pnlUSD / 1.08, // Convert back to EUR approx
                        unrealizedPnLPercent: pnlPercent,
                        valueEUR: (ticker.price * pos.amount) / 1.08 // Notional Value
                    });
                } else {
                    updatedPositions.push(pos);
                }
             });
             return updatedPositions;
         });

         return newData;
      });
    });
    return () => unsubscribe();
  }, []);

  // --- RISK GUARDIAN (KILLSWITCH) ---
  useEffect(() => {
      if (balanceEUR > peakBalance) {
          setPeakBalance(balanceEUR);
      }
      const currentDrawdown = (peakBalance - balanceEUR) / peakBalance;
      
      // If Drawdown > 15%, Trigger Killswitch
      if (currentDrawdown > 0.15 && !systemStatus.killswitchActive) {
          setSystemStatus(prev => ({
              ...prev,
              killswitchActive: true,
              liveTradingEnabled: false,
              securityLevel: 'CRITICAL'
          }));
          alert("⚠️ RISK GUARDIAN TRIGGERED: Max Drawdown Exceeded (15%). Trading Halted.");
      }
  }, [balanceEUR, peakBalance, systemStatus.killswitchActive]);


  // --- MATCHING ENGINE (Run whenever Market Data Updates) ---
  useEffect(() => {
    // Check Active Orders against latest prices
    if (activeOrders.length === 0) return;

    const remainingOrders: TradeOrder[] = [];

    activeOrders.forEach(order => {
        const ticker = marketMap[order.symbol];
        if (!ticker) {
            remainingOrders.push(order);
            return;
        }

        let filled = false;

        // LIMIT ORDER LOGIC
        if (order.type === 'LIMIT' && order.limitPrice) {
            if (order.side === 'BUY' && ticker.price <= order.limitPrice) filled = true;
            if (order.side === 'SELL' && ticker.price >= order.limitPrice) filled = true;
        }

        // STOP ORDER LOGIC (Trigger Market Close)
        if (order.type === 'STOP_MARKET' && order.stopPrice) {
            if (order.side === 'SELL' && ticker.price <= order.stopPrice) filled = true; // Stop Loss for Long
            if (order.side === 'BUY' && ticker.price >= order.stopPrice) filled = true; // Stop Loss for Short
        }

        if (filled) {
            const fillPrice = order.limitPrice || ticker.price; // Limit gets limit price, Stop gets market
            executeFill(order, fillPrice);
        } else {
            remainingOrders.push(order);
        }
    });

    if (activeOrders.length !== remainingOrders.length) {
        setActiveOrders(remainingOrders);
    }
  }, [marketMap, activeOrders]); 

  const executeLiquidation = (pos: Position, price: number) => {
      // Logic: Position is closed, Margin is lost.
      // We do NOT return margin to balance.
      // We log the liquidation.
      const liquidationOrder: TradeOrder = {
          id: `LIQ-${Date.now()}`,
          symbol: pos.symbol,
          side: pos.isLong ? 'SELL' : 'BUY',
          type: 'MARKET',
          amount: pos.amount,
          price: price,
          leverage: pos.leverage,
          valueEUR: pos.marginUsedEUR,
          timestamp: Date.now(),
          fee: 0,
          status: 'LIQUIDATED'
      };
      setOrderHistory(prev => [liquidationOrder, ...prev]);
  };

  const executeFill = (order: TradeOrder, fillPrice: number) => {
      const EUR_USD_RATE = 1.08;
      
      // Calculate final amounts based on fill price
      const notionalUSD = order.amount * fillPrice;
      const marginRequiredEUR = (notionalUSD / order.leverage) / EUR_USD_RATE;

      if (order.side === 'BUY') {
          // LONG OPEN 
          setPositions(prev => {
            const existing = prev.find(p => p.symbol === order.symbol);
            if (existing) {
                 // Averaging
                 const totalAmount = existing.amount + order.amount;
                 const totalCostUSD = (existing.amount * existing.avgEntryPrice) + notionalUSD;
                 const newAvg = totalCostUSD / totalAmount;
                 return prev.map(p => p.symbol === order.symbol ? {
                     ...p,
                     amount: totalAmount,
                     avgEntryPrice: newAvg,
                     marginUsedEUR: existing.marginUsedEUR + marginRequiredEUR
                 } : p);
            } else {
                // Calculate Liquidation Price for Long
                // Bankruptcy = Entry * (1 - 1/Lev)
                // Liq Price = Entry * (1 - (1/Lev) + MaintenanceMargin(0.005))
                const maintenanceMargin = 0.005; // 0.5%
                const liqPrice = fillPrice * (1 - (1 / order.leverage) + maintenanceMargin);

                return [...prev, {
                    symbol: order.symbol,
                    amount: order.amount,
                    avgEntryPrice: fillPrice,
                    currentPrice: fillPrice,
                    liquidationPrice: liqPrice,
                    unrealizedPnL: 0,
                    unrealizedPnLPercent: 0,
                    valueEUR: marginRequiredEUR * order.leverage,
                    marginUsedEUR: marginRequiredEUR,
                    leverage: order.leverage,
                    isLong: true
                }];
            }
          });
      } else {
          // SELL (Closing Long)
          setPositions(prev => {
              const pos = prev.find(p => p.symbol === order.symbol);
              if (!pos) return prev; 
              
              // Realize PnL
              const ratio = order.amount / pos.amount;
              const pnlRealized = pos.unrealizedPnL * ratio;
              const marginReleased = pos.marginUsedEUR * ratio;

              // Fee Deduction (0.1% of Notional Value)
              const feeEUR = (notionalUSD * 0.001) / EUR_USD_RATE;

              // Return Margin + PnL - Fee to Balance
              setBalanceEUR(b => b + marginReleased + pnlRealized - feeEUR);

              if (ratio >= 0.99) {
                  return prev.filter(p => p.symbol !== order.symbol);
              } else {
                  return prev.map(p => p.symbol === order.symbol ? {
                      ...p,
                      amount: p.amount - order.amount,
                      marginUsedEUR: p.marginUsedEUR - marginReleased
                  } : p);
              }
          });
      }

      // Add to History
      const filledOrder: TradeOrder = {
          ...order,
          status: 'FILLED',
          price: fillPrice, 
          timestamp: Date.now()
      };
      setOrderHistory(prev => [filledOrder, ...prev]);
  };


  const updateStatus = (newStatus: Partial<SystemStatus>) => {
    setSystemStatus(prev => ({ ...prev, ...newStatus }));
  };

  // --- ORDER ROUTER ---
  const handleOrderEntry = (
      symbol: string, 
      side: 'BUY' | 'SELL', 
      type: 'MARKET' | 'LIMIT', 
      amountEUR: number, 
      leverage: number,
      limitPrice?: number
  ) => {
    if (systemStatus.killswitchActive) {
        alert("KILLSWITCH ACTIVE. TRADING DISABLED.");
        return;
    }

    const ticker = marketMap[symbol];
    if (!ticker) return;

    const EUR_USD_RATE = 1.08;
    const FEE_RATE = 0.001; 

    // Calculate Notional Size
    const buyingPowerEUR = amountEUR * leverage;
    const buyingPowerUSD = buyingPowerEUR * EUR_USD_RATE;
    
    // Estimated price for qty calc
    const estPrice = type === 'LIMIT' && limitPrice ? limitPrice : ticker.price;
    const tokenQty = buyingPowerUSD / estPrice;

    if (side === 'BUY') {
        if (balanceEUR < amountEUR) {
            alert("Insufficient Margin Balance");
            return;
        }
        setBalanceEUR(prev => prev - amountEUR); // Lock Margin
    } else {
        // SELL Logic checks
        const pos = positions.find(p => p.symbol === symbol);
        if (!pos) {
            alert("No position to sell");
            return;
        }
    }

    const newOrder: TradeOrder = {
        id: Date.now().toString(),
        symbol,
        side,
        type,
        amount: tokenQty,
        price: estPrice,
        limitPrice: type === 'LIMIT' ? limitPrice : undefined,
        leverage,
        valueEUR: amountEUR, // Margin locked
        timestamp: Date.now(),
        fee: amountEUR * FEE_RATE,
        status: 'OPEN'
    };

    if (type === 'MARKET') {
        executeFill(newOrder, ticker.price);
    } else {
        setActiveOrders(prev => [...prev, newOrder]);
    }
  };

  const cancelOrder = (orderId: string) => {
      const order = activeOrders.find(o => o.id === orderId);
      if (order && order.side === 'BUY') {
          setBalanceEUR(prev => prev + order.valueEUR); // Unlock margin
      }
      setActiveOrders(prev => prev.filter(o => o.id !== orderId));
  };

  const renderContent = () => {
    switch (activeTab) {
      case AppTab.DASHBOARD:
        return (
          <TradingDashboard 
            marketData={marketMap}
            positions={positions}
            orders={orderHistory}
            activeOrders={activeOrders}
            balanceEUR={balanceEUR}
            systemStatus={systemStatus}
            onExecuteTrade={handleOrderEntry}
            onCancelOrder={cancelOrder}
          />
        );
      case AppTab.TRAINING:
        return <TrainingTerminal systemStatus={systemStatus} updateStatus={updateStatus} addTrade={() => {}} />;
      case AppTab.RISK:
        return <RiskCenter systemStatus={systemStatus} positions={positions} orders={orderHistory} balanceEUR={balanceEUR} />;
      case AppTab.SETTINGS:
        return <SettingsModal systemStatus={systemStatus} updateStatus={updateStatus} />;
      case AppTab.ORACLE_CHAT:
        return <OracleChat />;
      case AppTab.MEME_FORGE:
        return <ImageForge />;
      case AppTab.DEEP_STRATEGY:
        return <StrategicAnalysis />;
      default:
        return null;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} systemStatus={systemStatus}>
      {renderContent()}
    </Layout>
  );
};

export default App;
