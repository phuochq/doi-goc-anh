import React, { useState } from 'react';
import { AngleState, AppStatus, GeneratedImage, BatchSize } from './types';
import { AngleControls } from './components/AngleControls';
import { ImageUploader } from './components/ImageUploader';
import { generateNewAngle, suggestPrompt } from './services/gemini';
import { Download, Sparkles, History, Trash2, RotateCw, Clock, Layers, BoxSelect } from './components/Icons';

const App: React.FC = () => {
  // State
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [batchSize, setBatchSize] = useState<BatchSize>(1);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const [angles, setAngles] = useState<AngleState>({ 
      rotation: 0, 
      tilt: 0, 
      zoom: 0, 
      aspectRatio: '1:1', 
      prompt: '',
      quality: 'Standard',
      referenceImage: null,
      faceLock: false
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleImageUpload = (file: File) => {
    setSourceFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setSourceImage(e.target?.result as string);
      setSelectedImageId(null); 
      setStatus(AppStatus.IDLE);
      setAngles(prev => ({ ...prev, rotation: 0, tilt: 0, zoom: 0, referenceImage: null, faceLock: false }));
    };
    reader.readAsDataURL(file);
  };

  const handleSuggestPrompt = async () => {
      if (!sourceImage || !sourceFile) return;
      setIsSuggesting(true);
      try {
          const suggestion = await suggestPrompt(sourceImage.split(',')[1], sourceFile.type);
          setAngles(prev => ({ ...prev, prompt: suggestion }));
      } catch (e) {
          console.error(e);
      } finally {
          setIsSuggesting(false);
      }
  };

  const handleGenerate = async () => {
    if (!sourceImage || !sourceFile) return;

    setStatus(AppStatus.GENERATING);
    setErrorMsg(null);
    setLoadingStep("ANALYZING GEOMETRY...");

    try {
      const base64Data = sourceImage; 
      
      // Define queue
      const tasks = [];
      tasks.push({ 
          settings: { ...angles }, 
          label: angles.referenceImage ? "MATCHING REFERENCE..." : "RENDERING ANGLE..." 
      });

      // Batch logic
      if (batchSize > 1) {
          const baseRot = angles.rotation;
          if (batchSize >= 2) {
               tasks.push({
                  settings: { ...angles, rotation: baseRot + 45 > 180 ? baseRot - 45 : baseRot + 45, tilt: 0 },
                  label: "GENERATING VARIATION 1..."
              });
          }
          if (batchSize >= 4) {
               tasks.push({
                  settings: { ...angles, rotation: baseRot - 45 < -180 ? baseRot + 45 : baseRot - 45, tilt: 0 },
                  label: "GENERATING VARIATION 2..."
              });
               tasks.push({
                  settings: { ...angles, rotation: baseRot, tilt: 25 },
                  label: "GENERATING VARIATION 3..."
              });
          }
      }

      // INCREMENTAL EXECUTION
      let completedCount = 0;
      
      // Helper to run a single task
      const runTask = async (task: any, index: number) => {
           try {
               setLoadingStep(task.label);
               const url = await generateNewAngle(base64Data, sourceFile.type, task.settings);
               
               const newImg: GeneratedImage = {
                  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                  url: url,
                  timestamp: Date.now(),
                  settings: task.settings,
                  isVariation: index > 0
               };

               setGeneratedImages(prev => [newImg, ...prev]);
               // If it's the first image, select it immediately
               if (index === 0) setSelectedImageId(newImg.id);
               
           } catch (e) {
               console.error(`Task ${index} failed`, e);
           } finally {
               completedCount++;
               if (completedCount === tasks.length) {
                   setStatus(AppStatus.SUCCESS);
               }
           }
      };

      // Launch all tasks
      tasks.forEach((task, i) => {
          setTimeout(() => runTask(task, i), i * 1200);
      });

    } catch (err: any) {
      setStatus(AppStatus.ERROR);
      setErrorMsg(err.message || "Failed to generate image.");
    }
  };

  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setGeneratedImages(prev => prev.filter(img => img.id !== id));
    if (selectedImageId === id) {
        setSelectedImageId(null);
    }
  };

  const activeImageObj = generatedImages.find(img => img.id === selectedImageId);
  const activeImage = activeImageObj ? activeImageObj.url : sourceImage;

  const formatTime = (ts: number) => {
      return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(new Date(ts));
  };

  return (
    <div className="h-screen w-screen bg-[#050505] text-white font-sans overflow-hidden flex flex-col">
      
      {/* Header */}
      <header className="h-14 border-b border-white/5 bg-[#0a0a0a] flex items-center px-6 justify-between shrink-0 z-20 relative">
        <div className="flex items-center gap-3">
             <div className="w-6 h-6 bg-[#ccff00] rounded flex items-center justify-center font-black text-black text-xs">M</div>
             <span className="font-bold tracking-tight text-lg">MONDAY <span className="text-[#ccff00]">ANGLES</span></span>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-medium text-gray-500 uppercase tracking-widest">
             <span className="hidden sm:inline">AI Powered Studio</span>
             <span className="w-px h-3 bg-gray-800 hidden sm:inline"></span>
             <span className="text-[#ccff00]">PRO_BUILD v3.1</span>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT SIDEBAR: Assets & History */}
        <aside className="w-80 bg-[#0a0a0a] border-r border-white/5 flex flex-col shrink-0 z-10">
            
            {/* Upload Section */}
            <div className="p-5 border-b border-white/5">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-3 tracking-wider">Source Asset</h3>
                <ImageUploader onImageUpload={handleImageUpload} />
            </div>

            {/* History List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2 tracking-wider">
                        <History size={12} /> Session History
                    </h3>
                    <span className="text-[10px] text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">{generatedImages.length}</span>
                </div>

                {/* Source Thumbnail */}
                {sourceImage && (
                     <div 
                        onClick={() => setSelectedImageId(null)}
                        className={`relative w-full aspect-video rounded-lg mb-4 overflow-hidden cursor-pointer border transition-all group ${selectedImageId === null ? 'border-[#ccff00] ring-1 ring-[#ccff00]/50' : 'border-white/10 opacity-60 hover:opacity-100'}`}
                     >
                        <img src={sourceImage} alt="Source" className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2 bg-black/70 text-[9px] px-1.5 py-0.5 rounded text-white font-mono border border-white/10">
                            ORIGINAL
                        </div>
                     </div>
                )}

                <div className="space-y-3">
                    {generatedImages.map((img) => (
                        <div 
                            key={img.id}
                            onClick={() => setSelectedImageId(img.id)}
                            className={`flex gap-3 p-2 rounded-lg cursor-pointer border transition-all ${selectedImageId === img.id ? 'bg-white/5 border-[#ccff00]/30' : 'bg-transparent border-transparent hover:bg-white/5'}`}
                        >
                            {/* Thumbnail */}
                            <div className="w-16 h-16 shrink-0 rounded overflow-hidden bg-black border border-white/5 relative">
                                <img src={img.url} alt="Result" className="w-full h-full object-cover" />
                                {img.settings.referenceImage && (
                                    <div className="absolute bottom-0 right-0 bg-[#ccff00] text-black p-0.5 rounded-tl">
                                        <BoxSelect size={8} />
                                    </div>
                                )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                                <div className="flex items-start justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-white flex items-center gap-1">
                                            {img.isVariation && <Layers size={8} className="text-[#ccff00]"/>}
                                            {img.settings.referenceImage ? 'REF MATCH' : `R:${img.settings.rotation}° T:${img.settings.tilt}°`}
                                        </span>
                                        <span className="text-[9px] text-gray-500 font-mono">{img.settings.aspectRatio} • {img.settings.quality}</span>
                                    </div>
                                    <button 
                                        onClick={(e) => handleDeleteHistory(img.id, e)}
                                        className="text-gray-600 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                                <div className="flex items-center gap-1 text-[9px] text-gray-600 font-mono mt-1">
                                    <Clock size={8} />
                                    {formatTime(img.timestamp)}
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {generatedImages.length === 0 && !sourceImage && (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-700 gap-2 opacity-50">
                            <Clock size={24} />
                            <span className="text-xs">No history yet</span>
                        </div>
                    )}
                </div>
            </div>
            
             <div className="p-3 text-center border-t border-white/5 cursor-default select-none" title="Monday Angles">
                <p className="text-[9px] text-gray-600 font-mono">Copyright by monday.directory</p>
            </div>
        </aside>

        {/* CENTER: Canvas */}
        <main className="flex-1 bg-[#050505] relative flex items-center justify-center p-6 overflow-hidden">
            {/* Studio Background */}
            <div className="absolute inset-0 pointer-events-none" 
                 style={{ 
                     backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px)`,
                     backgroundSize: '40px 40px' 
                 }}>
            </div>

            {/* Canvas Area */}
            <div className="relative w-full h-full flex items-center justify-center z-0">
                
                {activeImage ? (
                    <div className="relative max-w-full max-h-full shadow-2xl shadow-black rounded-xl overflow-hidden group">
                        <img 
                            src={activeImage} 
                            alt="Active Canvas" 
                            className="max-w-full max-h-[calc(100vh-140px)] object-contain bg-[#080808] border border-white/5 rounded-xl relative z-10"
                        />
                        
                        {/* GREEN FLUID LOADING */}
                        {status === AppStatus.GENERATING && (
                            <div className="absolute inset-0 z-50 overflow-hidden rounded-xl flex items-center justify-center">
                                {/* Backdrop Blur */}
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-0"></div>
                                
                                {/* Green Energy Orb */}
                                <div className="absolute w-[150%] h-[150%] opacity-40 blur-[80px] animate-[spin_6s_linear_infinite]" 
                                     style={{
                                         background: 'conic-gradient(from 0deg, transparent, #ccff00, transparent)'
                                     }}>
                                </div>
                                <div className="absolute w-[100%] h-[100%] opacity-30 blur-[60px] animate-[spin_10s_linear_infinite_reverse]" 
                                     style={{
                                         background: 'conic-gradient(from 180deg, transparent, #4d7a00, transparent)'
                                     }}>
                                </div>
                                
                                {/* Inner Content */}
                                <div className="relative z-20 flex flex-col items-center gap-5">
                                     <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-md border border-[#ccff00]/30 flex items-center justify-center shadow-[0_0_50px_rgba(204,255,0,0.2)] relative">
                                         <div className="absolute inset-0 rounded-full border-t-2 border-[#ccff00] animate-spin"></div>
                                         <Sparkles className="text-[#ccff00]" size={24} />
                                     </div>
                                     <div className="flex flex-col items-center gap-1">
                                        <span className="font-bold text-[#ccff00] text-sm tracking-[0.2em] uppercase drop-shadow-[0_0_10px_rgba(204,255,0,0.5)]">Processing</span>
                                        <span className="font-mono text-[10px] text-gray-400 uppercase">{loadingStep}</span>
                                     </div>
                                </div>
                            </div>
                        )}

                        {/* Actions Overlay */}
                        {selectedImageId && status !== AppStatus.GENERATING && activeImageObj && (
                            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2 z-30">
                                <a 
                                    href={activeImage}
                                    download={`monday_angles_${selectedImageId}.png`}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#ccff00] text-black rounded hover:bg-white transition-colors font-bold text-xs shadow-lg"
                                >
                                    <Download size={14} />
                                    SAVE {activeImageObj.settings.quality}
                                </a>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-gray-600 opacity-50">
                        <div className="w-32 h-32 rounded-full border border-dashed border-gray-700 flex items-center justify-center mb-4 animate-[spin_20s_linear_infinite]">
                            <RotateCw size={32} className="text-gray-700" />
                        </div>
                        <p className="text-lg font-medium tracking-wider">MONDAY STUDIO</p>
                        <p className="text-xs font-mono mt-2">Import Image to Begin</p>
                    </div>
                )}

                {/* Error Toast */}
                {errorMsg && (
                    <div className="absolute bottom-8 bg-red-500/10 border border-red-500/50 text-red-400 px-6 py-3 rounded-lg text-sm backdrop-blur-md font-mono z-50 shadow-[0_0_30px_rgba(255,0,0,0.2)]">
                        ERROR: {errorMsg}
                    </div>
                )}
            </div>
        </main>

        {/* RIGHT SIDEBAR: Controls */}
        <aside className="w-80 bg-[#0a0a0a] border-l border-white/5 flex flex-col shrink-0 z-10 shadow-xl">
            <div className="p-4 border-b border-white/5 flex justify-between items-center">
                 <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Control Center</h3>
                 <div className={`flex items-center gap-2 px-2 py-0.5 rounded-full border ${status === AppStatus.GENERATING ? 'bg-[#ccff00]/10 border-[#ccff00]/30' : 'bg-white/5 border-white/5'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${status === AppStatus.GENERATING ? 'bg-[#ccff00] animate-pulse' : 'bg-gray-500'}`}></div>
                    <span className="text-[9px] font-mono text-gray-400">{status === AppStatus.GENERATING ? 'BUSY' : 'READY'}</span>
                 </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <AngleControls 
                    angles={angles}
                    setAngles={setAngles}
                    disabled={status === AppStatus.GENERATING || !sourceImage}
                    onSuggestPrompt={handleSuggestPrompt}
                    isSuggesting={isSuggesting}
                    batchSize={batchSize}
                    setBatchSize={setBatchSize}
                />
            </div>

            {/* Generate Button Footer */}
            <div className="p-5 border-t border-white/5 bg-[#0a0a0a] relative">
                <button
                    onClick={handleGenerate}
                    disabled={!sourceImage || status === AppStatus.GENERATING}
                    className="w-full bg-[#ccff00] text-black font-bold py-3.5 rounded-sm flex items-center justify-center gap-2 hover:bg-[#b3e600] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-[0_0_30px_rgba(204,255,0,0.1)] group relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 skew-y-12"></div>
                    
                    {status === AppStatus.GENERATING ? (
                        <span className="text-xs font-mono uppercase tracking-widest">Processing...</span>
                    ) : (
                        <>
                            <Sparkles size={16} className="transition-transform group-hover:rotate-45" />
                            <span className="tracking-widest text-sm">
                                {batchSize > 1 ? `BATCH GENERATE (${batchSize})` : 'GENERATE'}
                            </span>
                        </>
                    )}
                </button>
            </div>
        </aside>

      </div>
    </div>
  );
};

export default App;