
import React, { useState } from 'react';
import { editImageInForge, generateImageInForge } from '../services/geminiService';
import { Upload, ArrowRight, Download, Wand2, Plus, Sparkles, Image as ImageIcon } from 'lucide-react';

const ImageForge: React.FC = () => {
  const [mode, setMode] = useState<'EDIT' | 'GENERATE'>('GENERATE');
  
  // Edit State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Common State
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Generate Config
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '4:3' | '3:4' | '9:16'>('1:1');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      setResultUrl(null);
    }
  };

  const handleProcess = async () => {
    if (!prompt) return;
    
    setIsProcessing(true);
    setResultUrl(null);

    try {
      let result = null;

      if (mode === 'EDIT' && previewUrl) {
          // Edit Mode
          const base64Data = previewUrl.split(',')[1];
          result = await editImageInForge(base64Data, prompt);
      } else if (mode === 'GENERATE') {
          // Generate Mode
          result = await generateImageInForge(prompt, imageSize, aspectRatio);
      }

      if (result) {
        setResultUrl(result);
      }
    } catch (error) {
      console.error("Forge failed", error);
      alert("Forge process failed. Check console.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <div className="flex justify-center space-x-4">
        <button 
          onClick={() => { setMode('GENERATE'); setResultUrl(null); setPrompt(''); }}
          className={`px-8 py-3 rounded-t-lg border-t border-x font-bold uppercase tracking-widest transition-all ${mode === 'GENERATE' ? 'bg-neutral-900 border-orange-500/50 text-white' : 'bg-black border-transparent text-gray-600 hover:text-gray-400'}`}
        >
            <div className="flex items-center space-x-2">
                <Sparkles size={16} />
                <span>Genesis (Generate)</span>
            </div>
        </button>
        <button 
          onClick={() => { setMode('EDIT'); setResultUrl(null); setPrompt(''); }}
          className={`px-8 py-3 rounded-t-lg border-t border-x font-bold uppercase tracking-widest transition-all ${mode === 'EDIT' ? 'bg-neutral-900 border-orange-500/50 text-white' : 'bg-black border-transparent text-gray-600 hover:text-gray-400'}`}
        >
             <div className="flex items-center space-x-2">
                <Wand2 size={16} />
                <span>Transmute (Edit)</span>
            </div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-neutral-900 border border-neutral-800 p-8 rounded-lg rounded-tl-none shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-600 to-transparent"></div>

        {/* Input Section */}
        <div className="space-y-6">
          
          {/* Edit Mode Upload */}
          {mode === 'EDIT' && (
             <div className="bg-black/40 border border-neutral-800 p-6 rounded-lg">
                <h2 className="text-sm font-bold text-gray-400 mb-4 uppercase flex items-center">
                    <Upload className="mr-2 text-orange-500" size={16} /> Source Material
                </h2>
                <div className="border-2 border-dashed border-neutral-700 rounded-lg p-8 text-center hover:border-orange-500/50 transition-colors relative group h-64 flex items-center justify-center">
                    <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="max-h-full max-w-full rounded shadow-md object-contain" />
                    ) : (
                    <div className="text-gray-500">
                        <Upload size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-xs uppercase tracking-widest">Drop Image Feed</p>
                    </div>
                    )}
                </div>
            </div>
          )}

          {/* Config Controls */}
          <div className="bg-black/40 border border-neutral-800 p-6 rounded-lg">
            <h2 className="text-sm font-bold text-gray-400 mb-4 uppercase flex items-center">
                <Wand2 className="mr-2 text-orange-500" size={16} /> 
                {mode === 'GENERATE' ? 'Creation Specs (Nano Banana Pro)' : 'Transmutation Specs'}
            </h2>
            
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={mode === 'GENERATE' ? "Describe the visual asset to forge (e.g., 'A cyberpunk trader dashboard hologram in 4k')..." : "Describe the modification (e.g., 'Add a retro glitch filter')..."}
                className="w-full bg-neutral-900 border border-neutral-700 rounded p-4 text-white focus:outline-none focus:border-orange-500 min-h-[100px] mb-4 font-mono text-sm"
            />

            {mode === 'GENERATE' && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Resolution</label>
                        <select 
                            value={imageSize}
                            onChange={(e) => setImageSize(e.target.value as any)}
                            className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-xs text-white focus:border-orange-500 outline-none font-mono"
                        >
                            <option value="1K">1K (Standard)</option>
                            <option value="2K">2K (High Def)</option>
                            <option value="4K">4K (Ultra)</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Aspect Ratio</label>
                        <select 
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value as any)}
                            className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-xs text-white focus:border-orange-500 outline-none font-mono"
                        >
                            <option value="1:1">1:1 (Square)</option>
                            <option value="16:9">16:9 (Landscape)</option>
                            <option value="9:16">9:16 (Portrait)</option>
                            <option value="4:3">4:3 (Classic)</option>
                            <option value="3:4">3:4 (Vertical)</option>
                        </select>
                    </div>
                </div>
            )}

            <button
                onClick={handleProcess}
                disabled={!prompt || isProcessing || (mode === 'EDIT' && !selectedFile)}
                className={`w-full py-4 text-sm font-bold uppercase tracking-widest rounded flex justify-center items-center space-x-2 transition-all
                ${(!prompt || isProcessing || (mode === 'EDIT' && !selectedFile))
                    ? 'bg-neutral-800 text-gray-500 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-orange-600 to-red-700 text-white hover:from-orange-500 hover:to-red-600 shadow-[0_0_20px_rgba(234,88,12,0.3)]'
                }`}
            >
                {isProcessing ? (
                <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                </>
                ) : (
                <>
                    {mode === 'GENERATE' ? <Sparkles size={16} /> : <Wand2 size={16} />}
                    <span>{mode === 'GENERATE' ? 'Execute Genesis' : 'Execute Edit'}</span>
                </>
                )}
            </button>
          </div>
        </div>

        {/* Output Section */}
        <div className="bg-black/40 border border-neutral-800 p-6 rounded-lg flex flex-col h-full">
            <h2 className="text-sm font-bold text-gray-400 mb-4 uppercase flex items-center">
                <ArrowRight className="mr-2 text-orange-500" size={16} /> Output Render
            </h2>
            <div className="flex-grow flex items-center justify-center bg-neutral-900/50 rounded-lg border border-neutral-800 min-h-[400px] relative overflow-hidden">
                {resultUrl ? (
                <div className="relative group w-full h-full flex items-center justify-center p-2">
                    <img src={resultUrl} alt="Forged Result" className="max-w-full max-h-[600px] rounded shadow-2xl object-contain" />
                    <a 
                    href={resultUrl} 
                    download={`forge-${mode.toLowerCase()}-${Date.now()}.png`}
                    className="absolute bottom-4 right-4 bg-orange-600 text-white p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-orange-500 transform hover:scale-110"
                    >
                    <Download size={20} />
                    </a>
                </div>
                ) : (
                <div className="flex flex-col items-center justify-center text-gray-700">
                    <ImageIcon size={48} className="mb-4 opacity-20" />
                    <p className="font-mono text-xs uppercase tracking-widest opacity-50">Awaiting Render Output...</p>
                </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ImageForge;
