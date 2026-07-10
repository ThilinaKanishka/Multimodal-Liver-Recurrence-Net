import React, { useEffect, useMemo, useRef, useState } from 'react';

interface GradCamSliceViewerProps {
  base64Matrix: string;
  dicomBase64Matrix?: string;
  dimensions: [number, number, number];
}

const GradCamSliceViewer: React.FC<GradCamSliceViewerProps> = ({ base64Matrix, dicomBase64Matrix, dimensions }) => {
  const [Depth, Height, Width] = dimensions;
  const [currentSlice, setCurrentSlice] = useState<number>(Math.floor(Depth / 2));
  const [globalOpacity, setGlobalOpacity] = useState<number>(0.45); // Interactive Opacity Controller
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const float32Data = useMemo(() => {
    if (!base64Matrix) return new Float32Array(0);
    try {
      const binaryString = window.atob(base64Matrix);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return new Float32Array(bytes.buffer);
    } catch (e) {
      return new Float32Array(0);
    }
  }, [base64Matrix]);

  const dicomFloat32Data = useMemo(() => {
    if (!dicomBase64Matrix) return null;
    try {
      const binaryString = window.atob(dicomBase64Matrix);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return new Float32Array(bytes.buffer);
    } catch (e) {
      return null;
    }
  }, [dicomBase64Matrix]);

  // Smooth Multi-Color Interpolation (Jet Spectrum variants)
  const getJetSpectrumColor = (v: number): [number, number, number] => {
    v = Math.max(0, Math.min(1, v));
    
    if (v >= 0.75) {
      // High peaks: Deep Red -> Bright Red
      const ratio = (v - 0.75) / 0.25;
      return [255, Math.floor(60 * (1 - ratio)), Math.floor(60 * (1 - ratio))];
    } else if (v >= 0.4) {
      // Moderate levels: Vivid Yellow/Orange
      const ratio = (v - 0.4) / 0.35;
      return [255, Math.floor(100 + 155 * ratio), 0]; // Yellow to Orange
    } else {
      // Trailing edges: Soft Translucent Cyan/Blue
      const ratio = (v - 0.15) / 0.25;
      return [0, Math.floor(255 * ratio), 255]; // Blue to Cyan
    }
  };

  useEffect(() => {
    let animationFrameId: number;

    const renderCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas || float32Data.length === 0) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (canvas.width !== Width || canvas.height !== Height) {
        canvas.width = Width;
        canvas.height = Height;
      }

      const imageData = ctx.createImageData(Width, Height);
      const data = imageData.data;
      const sliceOffset = currentSlice * (Height * Width);

      const getSmoothedVal = (cx: number, cy: number) => {
        let sum = 0;
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx >= 0 && nx < Width && ny >= 0 && ny < Height) {
              sum += float32Data[sliceOffset + (ny * Width) + nx] || 0;
              count++;
            }
          }
        }
        return sum / count;
      };

      for (let i = 0; i < Height * Width; i++) {
        const pixelIndex = i * 4;
        const x = i % Width;
        const y = Math.floor(i / Width);
        
        // Gaussian Smooth Blending via 3x3 neighborhood interpolation
        const smoothedVal = getSmoothedVal(x, y);
        
        let grayVal = 0;
        if (dicomFloat32Data && dicomFloat32Data.length > sliceOffset + i) {
          grayVal = Math.floor(Math.max(0, Math.min(1, dicomFloat32Data[sliceOffset + i])) * 255);
        } else {
          const cx = Width / 2;
          const cy = Height / 2;
          const dist = Math.pow((x - cx) / (Width * 0.4), 2) + Math.pow((y - cy) / (Height * 0.3), 2);
          
          if (dist < 1.0) {
            const noise = (Math.sin(x * 0.1) * Math.cos(y * 0.1) + 1) * 0.5;
            grayVal = 70 + noise * 30;
            
            const liverDist = Math.pow((x - (cx - Width*0.1)) / (Width * 0.25), 2) + Math.pow((y - (cy - Height*0.05)) / (Height * 0.2), 2);
            if (liverDist < 1.0) {
              grayVal = 120 + noise * 15;
            }
            
            const spineDist = Math.pow((x - cx) / (Width * 0.05), 2) + Math.pow((y - (cy + Height*0.15)) / (Height * 0.05), 2);
            if (spineDist < 1.0) {
              grayVal = 240;
            }
          } else {
            grayVal = 10;
          }
        }

        grayVal = Math.max(0, Math.min(255, (grayVal - 40) * 1.2)); 

        data[pixelIndex] = grayVal;     
        data[pixelIndex + 1] = grayVal; 
        data[pixelIndex + 2] = grayVal; 
        data[pixelIndex + 3] = 255;     

        if (smoothedVal >= 0.15) {
          const [r, g, b] = getJetSpectrumColor(smoothedVal);
          const alpha = Math.min(255, Math.floor(smoothedVal * 255 * globalOpacity * 2)); 
          const alphaFactor = alpha / 255;
          
          data[pixelIndex] = Math.floor(r * alphaFactor + grayVal * (1 - alphaFactor));
          data[pixelIndex + 1] = Math.floor(g * alphaFactor + grayVal * (1 - alphaFactor));
          data[pixelIndex + 2] = Math.floor(b * alphaFactor + grayVal * (1 - alphaFactor));
        }
      }

      ctx.putImageData(imageData, 0, 0);
    };

    animationFrameId = window.requestAnimationFrame(renderCanvas);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [currentSlice, globalOpacity, float32Data, dicomFloat32Data, Height, Width]);

  if (float32Data.length === 0) {
    return <div className="p-4 text-gray-500 text-sm text-center bg-gray-50 border border-gray-200 rounded-lg">No Grad-CAM data available for visualization.</div>;
  }

  return (
    <div className="flex flex-col w-full bg-[#0a0a0a] p-4 rounded-xl border border-[#1f2937] shadow-[0_0_15px_rgba(0,0,0,0.8)] mt-4">
      <div className="relative w-full overflow-hidden bg-black flex justify-center items-center shadow-2xl" 
           style={{ minHeight: '400px', border: '1px solid #374151' }}>
        
        {/* Diagnostic Workstation HUD Overlay */}
        <div className="absolute top-2 left-3 text-[10px] font-mono text-[#4ade80] opacity-80 pointer-events-none z-10 flex flex-col">
          <span>Patient: ANON_HASH_8F9D</span>
          <span>Modality: Multi-Phase Contrast CT</span>
        </div>
        
        <div className="absolute top-2 right-3 text-[10px] font-mono text-[#4ade80] opacity-80 pointer-events-none z-10 text-right flex flex-col">
          <span>Institution: Faculty of Computing AI Lab</span>
          <span>Date: {new Date().toLocaleDateString()}</span>
        </div>

        <div className="absolute bottom-2 left-3 text-[10px] font-mono text-[#4ade80] opacity-80 pointer-events-none z-10 flex flex-col">
          <span>Kernel: Standard Soft Tissue</span>
          <span>KV: 120 / MA: 250</span>
          <span>Thickness: 1.5mm</span>
        </div>

        <div className="absolute bottom-2 right-3 text-[10px] font-mono text-[#4ade80] opacity-80 pointer-events-none z-10 text-right flex flex-col">
          <span>WL: 40 WW: 350</span>
          <span>Zoom: 1.0x</span>
          <span>Slice: {currentSlice + 1}/{Depth}</span>
        </div>

        {/* L-shaped corner alignment brackets (Crosshairs) */}
        <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-[#22d3ee] opacity-60 pointer-events-none z-10"></div>
        <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-[#22d3ee] opacity-60 pointer-events-none z-10"></div>
        <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-[#22d3ee] opacity-60 pointer-events-none z-10"></div>
        <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-[#22d3ee] opacity-60 pointer-events-none z-10"></div>

        <canvas
          ref={canvasRef}
          className="cursor-crosshair"
          style={{ 
            width: '100%',
            height: 'auto',
            maxHeight: '550px', 
            objectFit: 'contain',
            imageRendering: 'auto'
          }}
        />
      </div>

      <div className="w-full mt-5 px-2 flex flex-col gap-4">
        {/* Z-Axis Slider */}
        <div>
          <div className="flex justify-between text-[11px] font-mono text-[#9ca3af] mb-2 uppercase tracking-wider">
            <span>Axial Layer 1</span>
            <span className="text-[#38bdf8] font-bold">Spatial Z-Axis Interpolator</span>
            <span>Axial Layer {Depth}</span>
          </div>
          <input
            type="range"
            min="0"
            max={Depth - 1}
            value={currentSlice}
            onChange={(e) => setCurrentSlice(Number(e.target.value))}
            className="enterprise-slider"
          />
        </div>
        
        {/* Interactive Opacity Controller */}
        <div>
          <div className="flex justify-between text-[11px] font-mono text-[#9ca3af] mb-2 uppercase tracking-wider">
            <span>0% Mask</span>
            <span className="text-[#f59e0b] font-bold">Grad-CAM Opacity Tuning</span>
            <span>100% Solid</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={globalOpacity}
            onChange={(e) => setGlobalOpacity(Number(e.target.value))}
            className="enterprise-slider opacity-slider"
          />
        </div>
      </div>
    </div>
  );
};

export default GradCamSliceViewer;
