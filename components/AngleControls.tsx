import React, { useState, useRef } from 'react';
import { AngleState, AspectRatio, ImageQuality, BatchSize, VisualizerMode } from '../types';
import { RefreshCw, Square, RectangleHorizontal, RectangleVertical, MonitorPlay, Wand2, X, Layers, Move3d, User, ImagePlus, ScanFace, Lock, Unlock, Circle, ArrowLeft, ArrowRight, ArrowUp } from './Icons';
import { Cube } from './Cube';
import { HeadSimulator } from './HeadSimulator';

interface AngleControlsProps {
  angles: AngleState;
  setAngles: React.Dispatch<React.SetStateAction<AngleState>>;
  disabled: boolean;
  onSuggestPrompt: () => void;
  isSuggesting: boolean;
  batchSize: BatchSize;
  setBatchSize: (v: BatchSize) => void;
}

export const AngleControls: React.FC<AngleControlsProps> = ({ 
    angles, 
    setAngles, 
    disabled, 
    onSuggestPrompt, 
    isSuggesting,
    batchSize,
    setBatchSize
}) => {
  
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('HEAD');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (key: keyof AngleState, value: any) => {
    setAngles(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setAngles(prev => ({ ...prev, rotation: 0, tilt: 0, zoom: 0, referenceImage: null }));
  };

  const handleRefUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            handleChange('referenceImage', ev.target?.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const ratios: { label: string, value: AspectRatio, icon: any }[] = [
    { label: '1:1', value: '1:1', icon: Square },
    { label: '4:3', value: '4:3', icon: RectangleHorizontal },
    { label: '3:4', value: '3:4', icon: RectangleVertical },
    { label: '16:9', value: '16:9', icon: MonitorPlay },
    { label: '9:16', value: '9:16', icon: RectangleVertical },
    { label: '21:9', value: '21:9', icon: MonitorPlay },
    { label: '3:2', value: '3:2', icon: RectangleHorizontal },
    { label: '2:3', value: '2:3', icon: RectangleVertical },
  ];

  const presetAngles = [
    { label: 'Left -90°', rot: -90, icon: ArrowLeft },
    { label: 'Left -45°', rot: -45, icon: ArrowLeft },
    { label: 'Front 0°', rot: 0, icon: Circle },
    { label: 'Right 45°', rot: 45, icon: ArrowRight },
    { label: 'Right 90°', rot: 90, icon: ArrowRight },
    { label: 'Back 180°', rot: 180, icon: RefreshCw },
  ];

  const qualities: ImageQuality[] = ['Standard', '2K', '4K'];
  const batchOptions: BatchSize[] = [1, 2, 4];

  return (
    <div className="flex flex-col gap-1 p-5">
      
      {/* 1. CANVAS CONFIGURATION */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors mb-4">
          <div className="flex justify-between items-center mb-3">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Canvas Config</label>
              <div className="flex bg-black rounded overflow-hidden border border-white/10">
                 {qualities.map(q => (
                    <button
                        key={q}
                        onClick={() => handleChange('quality', q)}
                        className={`px-2 py-1 text-[8px] font-bold ${angles.quality === q ? 'bg-[#ccff00] text-black' : 'text-gray-500 hover:text-white'}`}
                    >
                        {q}
                    </button>
                ))}
              </div>
          </div>
          
          {/* Aspect Ratio Grid */}
          <div className="grid grid-cols-4 gap-1.5">
            {ratios.map((r) => (
                <button
                    key={r.value}
                    onClick={() => handleChange('aspectRatio', r.value)}
                    disabled={disabled}
                    title={r.label}
                    className={`flex flex-col items-center justify-center h-10 rounded border text-[9px] transition-all ${
                        angles.aspectRatio === r.value 
                        ? 'bg-[#ccff00]/20 border-[#ccff00] text-[#ccff00]' 
                        : 'bg-black border-transparent text-gray-600 hover:bg-white/5'
                    }`}
                >
                    <r.icon size={12} />
                    <span className="text-[8px] mt-0.5">{r.label}</span>
                </button>
            ))}
          </div>
      </div>

      {/* 2. CAMERA STUDIO */}
      <div className="bg-white/5 rounded-xl p-1 border border-white/5 hover:border-white/10 transition-colors relative mb-4">
         {/* Reference Mode Overlay */}
         <div className={`absolute inset-0 bg-black/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-2 rounded-xl transition-opacity ${angles.referenceImage ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
            <ScanFace className="text-[#ccff00] animate-pulse" size={24} />
            <span className="text-xs font-bold text-white">Reference Mode Active</span>
            <span className="text-[10px] text-gray-400 text-center px-6 leading-tight">Camera angles locked to match<br/>uploaded reference image.</span>
            <button onClick={() => handleChange('referenceImage', null)} className="mt-3 px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-[10px] text-white transition-colors">Cancel</button>
        </div>

         {/* Visualizer Header */}
         <div className="flex justify-between items-center px-3 py-2 border-b border-white/5">
             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Move3d size={12}/> Camera Studio
             </label>
             <div className="flex gap-1">
                <button 
                    onClick={() => setVisualizerMode(visualizerMode === 'CUBE' ? 'HEAD' : 'CUBE')}
                    className="p-1 text-gray-500 hover:text-white hover:bg-white/10 rounded transition-colors"
                    title="Switch View"
                >
                    {visualizerMode === 'CUBE' ? <User size={12}/> : <Move3d size={12}/>}
                </button>
                <button 
                    onClick={handleReset}
                    disabled={disabled}
                    className="p-1 text-gray-500 hover:text-[#ccff00] hover:bg-white/10 rounded transition-colors"
                    title="Reset Angles"
                >
                    <RefreshCw size={12} />
                </button>
             </div>
         </div>

         {/* The Interactive Visualizer */}
         <div className="p-1">
            {visualizerMode === 'HEAD' ? (
                <HeadSimulator angles={angles} setAngles={setAngles} />
            ) : (
                <Cube angles={angles} setAngles={setAngles} />
            )}
         </div>

         {/* Controls Section Inside Card */}
         <div className="p-4 space-y-4">
             
             {/* Quick Presets Row */}
            <div className="flex justify-between gap-1 bg-black/40 p-1 rounded-lg">
                {presetAngles.map((p) => (
                    <button
                        key={p.label}
                        onClick={() => handleChange('rotation', p.rot)}
                        disabled={disabled}
                        className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded transition-colors ${angles.rotation === p.rot ? 'bg-[#ccff00] text-black' : 'text-gray-500 hover:bg-white/10 hover:text-gray-300'}`}
                        title={p.label}
                    >
                        <p.icon size={10} className={p.label.includes('Left') ? 'rotate-180' : ''} />
                    </button>
                ))}
            </div>

            {/* Face Lock */}
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Face Lock</span>
                <button 
                    onClick={() => handleChange('faceLock', !angles.faceLock)}
                    className={`flex items-center gap-2 px-2 py-1 rounded-full border text-[9px] font-bold transition-all ${angles.faceLock ? 'bg-[#ccff00]/10 border-[#ccff00] text-[#ccff00]' : 'bg-black border-white/10 text-gray-500'}`}
                >
                    {angles.faceLock ? <Lock size={10}/> : <Unlock size={10}/>}
                    {angles.faceLock ? "ON" : "OFF"}
                </button>
            </div>

            {/* Sliders with Inputs */}
            <div className="space-y-3">
                {/* Rotation */}
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-gray-500 w-8">YAW</span>
                    <input
                        type="range"
                        min="-180"
                        max="180"
                        value={angles.rotation}
                        disabled={disabled}
                        onChange={(e) => handleChange('rotation', parseInt(e.target.value))}
                        className="flex-1 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#ccff00]"
                    />
                    <input 
                        type="number" 
                        value={angles.rotation}
                        onChange={(e) => handleChange('rotation', parseInt(e.target.value))}
                        className="w-10 bg-black border border-white/10 rounded px-1 text-[10px] text-center text-[#ccff00] focus:outline-none focus:border-[#ccff00]"
                    />
                </div>

                {/* Tilt */}
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-gray-500 w-8">TILT</span>
                    <input
                        type="range"
                        min="-90"
                        max="90"
                        value={angles.tilt}
                        disabled={disabled}
                        onChange={(e) => handleChange('tilt', parseInt(e.target.value))}
                        className="flex-1 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#ccff00]"
                    />
                    <input 
                        type="number" 
                        value={angles.tilt}
                        onChange={(e) => handleChange('tilt', parseInt(e.target.value))}
                        className="w-10 bg-black border border-white/10 rounded px-1 text-[10px] text-center text-[#ccff00] focus:outline-none focus:border-[#ccff00]"
                    />
                </div>
                
                {/* Zoom */}
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-gray-500 w-8">ZOOM</span>
                    <input
                        type="range"
                        min="-10"
                        max="10"
                        value={angles.zoom}
                        disabled={disabled}
                        onChange={(e) => handleChange('zoom', parseInt(e.target.value))}
                        className="flex-1 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#ccff00]"
                    />
                    <span className="w-10 text-[10px] text-center text-gray-400 font-mono">{angles.zoom}</span>
                </div>
            </div>
         </div>
      </div>

      {/* 3. CONTEXT & DETAILS */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors mb-4 space-y-4">
          {/* Prompt */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Prompt Engineering</label>
                 <button 
                    onClick={onSuggestPrompt}
                    disabled={disabled || isSuggesting}
                    className="flex items-center gap-1 text-[9px] text-[#ccff00] hover:text-white transition-colors disabled:opacity-50 bg-[#ccff00]/10 px-2 py-0.5 rounded"
                 >
                    {isSuggesting ? <RefreshCw size={10} className="animate-spin"/> : <Wand2 size={10} />}
                    Auto-Enhance
                 </button>
            </div>
            <div className="relative">
                <textarea 
                    value={angles.prompt}
                    onChange={(e) => handleChange('prompt', e.target.value)}
                    placeholder="Describe specific details (e.g. 'cinematic lighting', 'blue background')..."
                    className="w-full h-16 bg-black border border-white/10 rounded-lg p-2 pr-6 text-[10px] text-white placeholder-gray-600 focus:outline-none focus:border-[#ccff00] resize-none transition-colors leading-relaxed"
                    disabled={disabled}
                />
                {angles.prompt && (
                    <button 
                        onClick={() => handleChange('prompt', '')}
                        className="absolute top-2 right-2 text-gray-600 hover:text-white"
                    >
                        <X size={10} />
                    </button>
                )}
            </div>
          </div>

          {/* Ref Image Compact */}
          <div>
             <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Match Pose (Optional)</label>
             </div>
             {!angles.referenceImage ? (
                 <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="h-8 border border-dashed border-white/20 rounded bg-black hover:border-[#ccff00]/50 hover:bg-white/5 cursor-pointer flex items-center justify-center gap-2 transition-all"
                 >
                    <ImagePlus size={12} className="text-gray-500"/>
                    <span className="text-[9px] text-gray-500">Upload Reference</span>
                 </div>
             ) : (
                 <div className="flex items-center gap-2 bg-black border border-[#ccff00]/30 rounded p-1 pr-2">
                     <img src={angles.referenceImage} alt="Ref" className="w-8 h-8 rounded object-cover opacity-80" />
                     <div className="flex-1 min-w-0">
                         <p className="text-[9px] text-white truncate">Reference Loaded</p>
                         <p className="text-[8px] text-[#ccff00]">Overriding manual angles</p>
                     </div>
                     <button onClick={() => handleChange('referenceImage', null)} className="text-gray-500 hover:text-white"><X size={12}/></button>
                 </div>
             )}
             <input type="file" ref={fileInputRef} onChange={handleRefUpload} className="hidden" accept="image/*" />
          </div>
      </div>

      {/* 4. BATCH SETTINGS */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors">
        <div className="flex items-center justify-between mb-2">
             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Output Variations</label>
             <span className="text-[9px] text-gray-600 font-mono">BATCH SIZE</span>
        </div>
        <div className="flex bg-black border border-white/10 rounded-lg p-1">
             {batchOptions.map(b => (
                 <button
                    key={b}
                    onClick={() => setBatchSize(b)}
                    className={`flex-1 text-[9px] font-bold py-1.5 rounded flex items-center justify-center gap-1 transition-all ${batchSize === b ? 'bg-[#ccff00] text-black shadow-sm' : 'text-gray-500 hover:text-white'}`}
                 >
                     {b === 1 ? 'Single' : b + ' Angles'}
                 </button>
             ))}
         </div>
      </div>

    </div>
  );
};