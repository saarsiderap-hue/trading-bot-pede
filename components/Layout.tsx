
import React, { ReactNode, ReactElement } from 'react';
import { AppTab, SystemStatus } from '../types';
import { 
  Activity, Cpu, MessageSquare, Image as ImageIcon, Flame, 
  ShieldAlert, Crosshair, Settings
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  systemStatus: SystemStatus;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, systemStatus }) => {
  
  const getStatusColor = () => {
    if (systemStatus.safetyScore < 40) return 'bg-red-600 shadow-red-600/50';
    if (systemStatus.safetyScore < 80) return 'bg-yellow-500 shadow-yellow-500/50';
    return 'bg-emerald-500 shadow-emerald-500/50';
  };

  const getStatusText = () => {
    if (systemStatus.safetyScore < 40) return 'TRAINING REQUIRED';
    if (systemStatus.safetyScore < 80) return 'CALIBRATING';
    return 'COMBAT READY';
  };

  return (
    <div className="min-h-screen bg-forge-black text-gray-300 flex flex-col font-sans selection:bg-orange-900 selection:text-white">
      {/* Header / Forge Top Bar */}
      <header className="border-b border-neutral-800 bg-forge-carbon/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onTabChange(AppTab.DASHBOARD)}>
            <div className="p-2 bg-gradient-to-br from-orange-700 to-red-900 rounded border border-orange-500/30">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold tracking-[0.2em] text-white uppercase leading-none">
                Forge<span className="text-forge-neon">.AI</span>
              </h1>
              <span className="text-[10px] text-gray-500 tracking-widest uppercase">Cartel Grade Systems</span>
            </div>
          </div>
          
          {/* Main Nav */}
          <nav className="hidden xl:flex items-center space-x-1 bg-neutral-900/50 p-1 rounded-lg border border-neutral-800">
            <NavButton label="Scanner" icon={<Activity size={16} />} isActive={activeTab === AppTab.DASHBOARD} onClick={() => onTabChange(AppTab.DASHBOARD)} />
            <NavButton label="Training" icon={<Crosshair size={16} />} isActive={activeTab === AppTab.TRAINING} onClick={() => onTabChange(AppTab.TRAINING)} />
            <NavButton label="Risk Ops" icon={<ShieldAlert size={16} />} isActive={activeTab === AppTab.RISK} onClick={() => onTabChange(AppTab.RISK)} />
            <div className="w-px h-6 bg-neutral-700 mx-2"></div>
            <NavButton label="Oracle" icon={<MessageSquare size={16} />} isActive={activeTab === AppTab.ORACLE_CHAT} onClick={() => onTabChange(AppTab.ORACLE_CHAT)} />
            <NavButton label="Strategy" icon={<Cpu size={16} />} isActive={activeTab === AppTab.DEEP_STRATEGY} onClick={() => onTabChange(AppTab.DEEP_STRATEGY)} />
            <NavButton label="Meme" icon={<ImageIcon size={16} />} isActive={activeTab === AppTab.MEME_FORGE} onClick={() => onTabChange(AppTab.MEME_FORGE)} />
          </nav>

          {/* Status Indicator (Right Side) */}
          <div className="flex items-center space-x-6">
            <button 
              onClick={() => onTabChange(AppTab.SETTINGS)}
              className="hidden md:flex items-center text-xs font-mono text-gray-500 hover:text-white transition-colors"
            >
              <Settings size={14} className="mr-2" />
              {systemStatus.walletConnected ? 'WALLET ACTIVE' : 'NO WALLET'}
            </button>

            {/* The Percentage Safety Dot */}
            <div className="flex items-center space-x-3 bg-neutral-900 px-3 py-1.5 rounded border border-neutral-800">
               <div className="flex flex-col items-end">
                 <span className={`text-[10px] font-bold tracking-widest ${systemStatus.safetyScore >= 80 ? 'text-emerald-500' : 'text-gray-400'}`}>
                   {getStatusText()}
                 </span>
                 <span className="text-sm font-mono font-bold text-white leading-none">
                   {systemStatus.safetyScore.toFixed(1)}%
                 </span>
               </div>
               <div className="relative">
                 <div className={`w-3 h-3 rounded-full ${getStatusColor()} shadow-[0_0_10px_currentColor]`}></div>
                 <div className={`absolute inset-0 rounded-full ${getStatusColor()} animate-ping opacity-75`}></div>
               </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-[1600px] mx-auto px-4 py-6 w-full relative">
        {/* Background Grid Texture */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
        {children}
      </main>

      {/* Mobile Nav */}
      <div className="xl:hidden fixed bottom-0 left-0 right-0 bg-neutral-900/95 backdrop-blur border-t border-orange-900/40 p-2 flex justify-around z-50">
        <MobileNavButton icon={<Activity />} label="Scan" isActive={activeTab === AppTab.DASHBOARD} onClick={() => onTabChange(AppTab.DASHBOARD)} />
        <MobileNavButton icon={<Crosshair />} label="Train" isActive={activeTab === AppTab.TRAINING} onClick={() => onTabChange(AppTab.TRAINING)} />
        <MobileNavButton icon={<ShieldAlert />} label="Risk" isActive={activeTab === AppTab.RISK} onClick={() => onTabChange(AppTab.RISK)} />
        <MobileNavButton icon={<Cpu />} label="AI" isActive={activeTab === AppTab.DEEP_STRATEGY} onClick={() => onTabChange(AppTab.DEEP_STRATEGY)} />
      </div>
    </div>
  );
};

const NavButton = ({ label, icon, isActive, onClick }: { label: string, icon: ReactNode, isActive: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-3 py-1.5 rounded transition-all duration-200 border
      ${isActive 
        ? 'bg-neutral-800 text-forge-neon border-forge-neon/30' 
        : 'border-transparent text-gray-400 hover:text-white hover:bg-neutral-800'
      }`}
  >
    {icon}
    <span className="font-semibold tracking-wide uppercase text-xs">{label}</span>
  </button>
);

const MobileNavButton = ({ label, icon, isActive, onClick }: { label: string, icon: ReactNode, isActive: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-2 w-full
      ${isActive ? 'text-forge-neon' : 'text-gray-500'}
    `}
  >
    {React.cloneElement(icon as ReactElement<any>, { size: 20 })}
    <span className="text-[9px] uppercase font-bold mt-1">{label}</span>
  </button>
);

export default Layout;
