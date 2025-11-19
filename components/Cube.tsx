
import React, { useRef, useEffect } from 'react';
import { AngleState } from '../types';
import { Move3d } from './Icons';

interface CubeProps {
  angles: AngleState;
  setAngles: React.Dispatch<React.SetStateAction<AngleState>>;
}

export const Cube: React.FC<CubeProps> = ({ angles, setAngles }) => {
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const startAngles = useRef({ rot: 0, tilt: 0 });

  // CSS transform
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

    const sensitivity = 1.2;

    // Inverted Logic compared to previous:
    // Drag Right -> Rotate Right (Increase Yaw)
    // Drag Down -> Rotate Down (Decrease Pitch)
    let newRot = startAngles.current.rot + (deltaX * sensitivity);
    let newTilt = startAngles.current.tilt - (deltaY * sensitivity);

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
        className="w-full h-48 flex flex-col items-center justify-center overflow-hidden bg-[#0f0f0f] rounded-xl border border-white/5 relative perspective-container group cursor-grab active:cursor-grabbing select-none"
        onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
        onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
    >
        <div className="absolute top-3 right-3 text-[#ccff00] opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            <Move3d size={16} />
        </div>
        <div className="absolute bottom-3 text-[9px] text-gray-600 font-mono uppercase tracking-widest pointer-events-none z-10">
            Angle Cube
        </div>

        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ 
                 backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', 
                 backgroundSize: '20px 20px' 
             }}>
        </div>

        <div className="scene w-[100px] h-[100px] pointer-events-none">
            <div className="cube" style={transformStyle}>
                <div className="cube-face cube-face-front border-2 border-[#ccff00] bg-[#ccff00]/20 text-[#ccff00] backdrop-blur-sm">FRONT</div>
                <div className="cube-face cube-face-back border border-white/20 bg-white/5 text-white/50">BACK</div>
                <div className="cube-face cube-face-right border border-white/20 bg-white/5 text-white/50">RIGHT</div>
                <div className="cube-face cube-face-left border border-white/20 bg-white/5 text-white/50">LEFT</div>
                <div className="cube-face cube-face-top border border-white/20 bg-white/5 text-white/50">TOP</div>
                <div className="cube-face cube-face-bottom border border-white/20 bg-white/5 text-white/50">BOT</div>
            </div>
        </div>
    </div>
  );
};
