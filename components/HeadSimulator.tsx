import React, { useRef, useEffect } from 'react';
import { AngleState } from '../types';
import { ScanFace } from './Icons';

interface HeadSimulatorProps {
  angles: AngleState;
  setAngles: React.Dispatch<React.SetStateAction<AngleState>>;
}

export const HeadSimulator: React.FC<HeadSimulatorProps> = ({ angles, setAngles }) => {
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const startAngles = useRef({ rot: 0, tilt: 0 });

  // Visual transform
  const transformStyle = {
    transform: `rotateX(${-angles.tilt}deg) rotateY(${angles.rotation}deg) scale(${1 + angles.zoom / 20})`,
  };

  const handleStart = (clientX: number, clientY: number) => {
    isDragging.current = true;
    startPos.current = { x: clientX, y: clientY };
    startAngles.current = { rot: angles.rotation, tilt: angles.tilt };
    document.body.style.cursor = 'grabbing';
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging.current) return;

    const deltaX = clientX - startPos.current.x;
    const deltaY = clientY - startPos.current.y;
    
    // Drag Right -> Positive Rotation (Turn right)
    // Drag Up -> Positive Tilt (Look up)
    const sensitivity = 1.5;

    let newRot = startAngles.current.rot + (deltaX * sensitivity);
    let newTilt = startAngles.current.tilt - (deltaY * sensitivity); 

    // Clamp
    if (newRot > 180) newRot = 180;
    if (newRot < -180) newRot = -180;
    if (newTilt > 90) newTilt = 90;
    if (newTilt < -90) newTilt = -90;

    setAngles(prev => ({
      ...prev,
      rotation: Math.round(newRot),
      tilt: Math.round(newTilt)
    }));
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX, e.touches[0].clientY);
    const onEnd = () => {
      isDragging.current = false;
      document.body.style.cursor = 'default';
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [angles]);

  return (
    <div 
        className="w-full h-48 flex flex-col items-center justify-center overflow-hidden bg-black/40 rounded-lg border border-white/5 relative perspective-container group cursor-grab active:cursor-grabbing select-none shadow-inner"
        onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
        onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
    >
        <div className="absolute top-2 right-2 text-[#ccff00] opacity-30 pointer-events-none z-10">
            <ScanFace size={14} />
        </div>
        
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ 
                 backgroundImage: 'radial-gradient(#ccff00 0.5px, transparent 0.5px)', 
                 backgroundSize: '20px 20px' 
             }}>
        </div>

        {/* Wireframe Head Assembly */}
        <div className="scene w-[100px] h-[120px] pointer-events-none">
            <div className="cube" style={transformStyle}>
                
                {/* Central Axis */}
                <div className="absolute top-0 left-1/2 w-[1px] h-full bg-[#ccff00]/40 -translate-x-1/2"></div>
                
                {/* Vertical Rings (Longitude) */}
                <div className="absolute inset-0 rounded-full border border-[#ccff00]/30" style={{ transform: 'rotateY(0deg)' }}></div>
                <div className="absolute inset-0 rounded-full border border-[#ccff00]/20" style={{ transform: 'rotateY(45deg)' }}></div>
                <div className="absolute inset-0 rounded-full border border-[#ccff00]/30" style={{ transform: 'rotateY(90deg)' }}></div>
                <div className="absolute inset-0 rounded-full border border-[#ccff00]/20" style={{ transform: 'rotateY(135deg)' }}></div>

                {/* Horizontal Rings (Latitude) */}
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-[#ccff00]/40 -translate-y-1/2"></div>
                <div className="absolute top-1/4 left-[10%] w-[80%] h-[1px] rounded-[100%] border-t border-[#ccff00]/20 -translate-y-1/2"></div>
                <div className="absolute bottom-1/4 left-[10%] w-[80%] h-[1px] rounded-[100%] border-b border-[#ccff00]/20 -translate-y-1/2"></div>

                {/* Face Marker (The "Front") */}
                <div className="absolute top-1/2 left-1/2 w-16 h-16 border-2 border-[#ccff00] rounded-lg -translate-x-1/2 -translate-y-1/2 translate-z-[50px] flex items-center justify-center backdrop-blur-[1px] shadow-[0_0_20px_rgba(204,255,0,0.15)]" style={{ transform: 'translateZ(50px)' }}>
                    <div className="w-1 h-1 bg-[#ccff00] rounded-full shadow-[0_0_10px_#ccff00]"></div>
                </div>

                {/* Directional Arrow */}
                <div className="absolute top-1/2 left-1/2 w-24 h-[1px] bg-gradient-to-r from-transparent via-[#ccff00] to-transparent -translate-x-1/2 -translate-y-1/2" style={{ transform: 'translateZ(60px)' }}></div>
            </div>
        </div>
        
        <div className="absolute bottom-2 flex flex-col items-center opacity-30 pointer-events-none">
            <span className="text-[8px] text-[#ccff00] font-mono tracking-[0.2em]">INTERACTIVE MESH</span>
        </div>
    </div>
  );
};