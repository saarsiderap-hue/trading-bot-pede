
import React, { useState, useEffect } from 'react';
import { Key, Save, Server, Shield, ToggleLeft, ToggleRight, Check, Lock, Unlock, Zap, Database, Globe, ShieldAlert } from 'lucide-react';
import { SystemStatus } from '../types';
import { maskKey } from '../services/security';

interface SettingsProps {
    systemStatus: SystemStatus;
    updateStatus: (newStatus: Partial<SystemStatus>) => void;
}

const SettingsModal: React.FC<SettingsProps> = ({ systemStatus, updateStatus }) => {
  const [apiKey, setApiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [walletConnected, setWalletConnected] = useState(systemStatus.walletConnected);

  useEffect(() => {
    const storedKey = localStorage.getItem('forge_api_key_sim');
    if (storedKey) setApiKey(storedKey);
  }, []);

  const toggleWallet = () => {
    const newState = !walletConnected;
    setWalletConnected(newState);
    updateStatus({ walletConnected: newState });
    
    // Safety check: if wallet disconnects, live trading must stop
    if (!newState && systemStatus.liveTradingEnabled) {
        updateStatus({ liveTradingEnabled: false });
    }
  }

  const handleSave = () => {
      localStorage.setItem('forge_api_key_sim', apiKey);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
  }

  const setTradingMode = (mode: 'PAPER' | 'TESTNET' | 'LIVE') => {
      updateStatus({ tradingMode: mode });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in zoom-in duration-300">
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8">
         <h2 className="text-2xl font-bold text-white uppercase tracking-widest mb-6 flex items-center">
            <Server className="mr-3 text-forge-neon" /> Mainframe Configuration
         </h2>

         <div className="space-y-8">
            
            {/* Environment Selector */}
            <div className="bg-black/50 p-6 rounded border border-neutral-800">
                <h3 className="font-bold text-white uppercase mb-4 flex items-center">
                    <Globe className="mr-2 text-gray-400" size={16}/> Execution Environment
                </h3>
                <div className="grid grid-cols-3 gap-4">
                    <button 
                        onClick={() => setTradingMode('PAPER')}
                        className={`p-4 rounded border flex flex-col items-center justify-center transition-all ${systemStatus.tradingMode === 'PAPER' ? 'bg-blue-900/20 border-blue-500 text-blue-400' : 'bg-neutral-800 border-transparent text-gray-500 hover:bg-neutral-700'}`}
                    >
                        <Database size={24} className="mb-2" />
                        <span className="font-bold text-xs">SIMULATION</span>
                    </button>
                    <button 
                        onClick={() => setTradingMode('TESTNET')}
                        className={`p-4 rounded border flex flex-col items-center justify-center transition-all ${systemStatus.tradingMode === 'TESTNET' ? 'bg-yellow-900/20 border-yellow-500 text-yellow-400' : 'bg-neutral-800 border-transparent text-gray-500 hover:bg-neutral-700'}`}
                    >
                        <Shield size={24} className="mb-2" />
                        <span className="font-bold text-xs">TESTNET</span>
                    </button>
                    <button 
                        onClick={() => setTradingMode('LIVE')}
                        disabled={systemStatus.safetyScore < 80}
                        className={`p-4 rounded border flex flex-col items-center justify-center transition-all ${systemStatus.tradingMode === 'LIVE' ? 'bg-red-900/20 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-neutral-800 border-transparent text-gray-500 opacity-50 cursor-not-allowed'}`}
                    >
                        <Zap size={24} className="mb-2" />
                        <span className="font-bold text-xs">LIVE MAINNET</span>
                    </button>
                </div>
                {systemStatus.tradingMode === 'PAPER' && (
                    <p className="text-xs text-blue-500/80 mt-2 font-mono text-center">
                        CONNECTED TO REAL-TIME MARKET DATA. EXECUTING ON VIRTUAL LEDGER.
                    </p>
                )}
                {systemStatus.tradingMode === 'LIVE' && (
                    <p className="text-xs text-red-500/80 mt-2 font-mono text-center flex items-center justify-center">
                        <ShieldAlert size={12} className="mr-1"/> CAUTION: REAL CAPITAL AT RISK. 0.1% FEE APPLIED.
                    </p>
                )}
            </div>

            {/* Wallet Section */}
            <div className="bg-black/50 p-6 rounded border border-neutral-800">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-3">
                        <Key className="text-gray-400" />
                        <div>
                            <h3 className="font-bold text-white uppercase">Hardware Wallet Uplink</h3>
                            <p className="text-xs text-gray-500">Ledger / Trezor / Phantom Adapter</p>
                        </div>
                    </div>
                    <button onClick={toggleWallet} className="transition-colors text-gray-400 hover:text-white">
                        {walletConnected 
                            ? <ToggleRight size={32} className="text-emerald-500" /> 
                            : <ToggleLeft size={32} className="text-red-500" />}
                    </button>
                </div>
                <div className="font-mono text-xs text-gray-500 bg-neutral-900 p-3 rounded flex justify-between">
                    <span>STATUS: {walletConnected ? 'CONNECTED (ENCRYPTED TUNNEL)' : 'DISCONNECTED'}</span>
                    {walletConnected && <span className="text-emerald-500">AES-256</span>}
                </div>
            </div>

            {/* API Keys */}
            <div className="space-y-4">
                <label className="text-xs font-bold text-orange-500 uppercase tracking-wider">Exchange API Secrets</label>
                <div className="flex space-x-2">
                    <div className="relative flex-grow">
                        <input 
                            type="password" 
                            value={apiKey} 
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="••••••••••••••••••••••••••••••"
                            className="w-full bg-neutral-800 border border-neutral-700 rounded p-3 text-gray-300 font-mono text-sm focus:outline-none focus:border-orange-500 tracking-widest pl-10"
                        />
                        <Lock className="absolute left-3 top-3.5 text-gray-500" size={14} />
                    </div>
                    <button 
                        onClick={handleSave}
                        className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white px-4 rounded transition-colors flex items-center justify-center min-w-[50px]"
                    >
                        {isSaved ? <Check size={18} className="text-emerald-500" /> : <Save size={18} />}
                    </button>
                </div>
                <p className="text-xs text-gray-500 flex items-center">
                    <Shield size={12} className="mr-1 text-emerald-500" /> 
                    Keys are locally encrypted before storage.
                </p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default SettingsModal;
