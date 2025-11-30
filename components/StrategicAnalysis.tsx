import React, { useState } from 'react';
import { performDeepStrategy } from '../services/geminiService';
import { BrainCircuit, Play, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const StrategicAnalysis: React.FC = () => {
  const [query, setQuery] = useState('');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  const handleStrategize = async () => {
    if (!query.trim()) return;
    setIsThinking(true);
    setAnalysis(null);
    try {
      const result = await performDeepStrategy(query);
      setAnalysis(result);
    } catch (error) {
      setAnalysis("Strategic computation failed.");
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
         <h2 className="text-3xl font-bold text-white uppercase tracking-widest flex items-center justify-center">
            <BrainCircuit className="mr-3 text-orange-500 w-8 h-8" /> 
            Deep Thought Core
         </h2>
         <p className="text-gray-400 font-mono text-sm">
            Leveraging Gemini 3.0 Pro with Extended Thinking Budget (32k Tokens)
         </p>
      </div>

      <div className="bg-neutral-900 border border-orange-900/30 p-1 rounded-xl shadow-2xl">
        <div className="bg-black rounded-lg p-6 space-y-4">
           <label className="text-xs font-bold text-orange-500 uppercase tracking-wider">Strategic Inquiry</label>
           <textarea
             value={query}
             onChange={(e) => setQuery(e.target.value)}
             placeholder="Enter complex market scenario (e.g., 'Analyze the liquidity risks of a new meme coin launch on Pump.fun given current SOL congestion and whale movements...')"
             className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-4 text-gray-200 focus:outline-none focus:border-orange-600 min-h-[120px] font-mono text-sm leading-relaxed"
           />
           <div className="flex justify-end">
             <button
               onClick={handleStrategize}
               disabled={isThinking || !query}
               className={`px-8 py-3 rounded font-bold uppercase tracking-widest flex items-center space-x-2 transition-all
                 ${isThinking 
                   ? 'bg-neutral-800 text-orange-500/50 cursor-wait' 
                   : 'bg-orange-700 hover:bg-orange-600 text-white shadow-[0_0_15px_rgba(234,88,12,0.4)]'
                 }`}
             >
               {isThinking ? (
                 <span className="animate-pulse">Computing...</span>
               ) : (
                 <>
                   <span>Execute Strategy</span>
                   <Play size={16} fill="currentColor" />
                 </>
               )}
             </button>
           </div>
        </div>
      </div>

      {/* Output Display */}
      {(analysis || isThinking) && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8 shadow-2xl relative min-h-[200px] animate-in slide-in-from-bottom-4 duration-500">
          {isThinking && !analysis ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10 rounded-lg">
                <div className="w-16 h-16 border-4 border-orange-900 border-t-orange-500 rounded-full animate-spin mb-4"></div>
                <p className="text-orange-500 font-mono text-sm animate-pulse">Running Monte Carlo Simulations...</p>
             </div>
          ) : null}
          
          <div className="prose prose-invert prose-orange max-w-none">
             <h3 className="text-xl font-bold text-white mb-4 border-b border-neutral-800 pb-2 flex items-center">
               <ChevronRight className="text-orange-500 mr-2" /> Strategic Output
             </h3>
             <div className="text-gray-300 leading-7 font-sans">
               <ReactMarkdown>{analysis || ''}</ReactMarkdown>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StrategicAnalysis;