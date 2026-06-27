import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';

interface MprClinicalWorkstationProps {
  base64Matrix: string;
  dicomBase64Matrix?: string;
  dimensions: [number, number, number]; // [Depth (Z), Height (Y), Width (X)]
  tumorTarget?: { found: boolean; x: number; y: number; z: number };
  patientInfo?: { name: string; id: string };
  longitudinalMode?: 'baseline' | 'followup';
}

type LUTType = 'Jet' | 'Viridis' | 'Magma' | 'Plasma';

const MprClinicalWorkstation: React.FC<MprClinicalWorkstationProps> = ({
  base64Matrix,
  dicomBase64Matrix,
  dimensions,
  tumorTarget,
  patientInfo,
  longitudinalMode,
}) => {
  const [Depth, Height, Width] = dimensions;

  // Shared Atomic State Context
  const [coord, setCoord] = useState({
    x: Math.floor(Width / 2),
    y: Math.floor(Height / 2),
    z: Math.floor(Depth / 2),
  });
  
  const [globalOpacity, setGlobalOpacity] = useState<number>(0.5);
  const [activeLUT, setActiveLUT] = useState<LUTType>('Jet');
  
  // Independent Zoom States
  const [zoomAxial, setZoomAxial] = useState<number>(1.0);
  const [zoomCoronal, setZoomCoronal] = useState<number>(1.0);
  const [zoomSagittal, setZoomSagittal] = useState<number>(1.0);

  const axialCanvasRef = useRef<HTMLCanvasElement>(null);
  const coronalCanvasRef = useRef<HTMLCanvasElement>(null);
  const sagittalCanvasRef = useRef<HTMLCanvasElement>(null);
  const legendCanvasRef = useRef<HTMLCanvasElement>(null);
  const pdfAxialCanvasRef = useRef<HTMLCanvasElement>(null);
  const pdfCoronalCanvasRef = useRef<HTMLCanvasElement>(null);
  const pdfSagittalCanvasRef = useRef<HTMLCanvasElement>(null);

  const [float32Data, setFloat32Data] = useState<Float32Array>(new Float32Array(0));
  const [dicomUint8Data, setDicomUint8Data] = useState<Uint8Array | null>(null);
  const [isDecoding, setIsDecoding] = useState<boolean>(true);

  // Parse Matrices
  useEffect(() => {
    if (base64Matrix === 'MOCK' || longitudinalMode) {
      const size = dimensions[0] * dimensions[1] * dimensions[2];
      const mockData = new Float32Array(size);
      if (tumorTarget && tumorTarget.found) {
         // Create a synthetic heatmap activation around the tumor target
         const cz = tumorTarget.z;
         const cy = tumorTarget.y;
         const cx = tumorTarget.x;
         const sigma = longitudinalMode === 'baseline' ? 12.0 : (longitudinalMode === 'followup' ? 5.0 : 8.0);
         const threshold = longitudinalMode === 'baseline' ? 250 : (longitudinalMode === 'followup' ? 80 : 150);
         for(let z=0; z<dimensions[0]; z++) {
            for(let y=0; y<dimensions[1]; y++) {
               for(let x=0; x<dimensions[2]; x++) {
                  const distSq = Math.pow(z-cz, 2)*2.0 + Math.pow(y-cy, 2) + Math.pow(x-cx, 2);
                  if(distSq < threshold) {
                     mockData[z*dimensions[1]*dimensions[2] + y*dimensions[2] + x] = Math.exp(-distSq / (2 * sigma * sigma));
                  }
               }
            }
         }
      }
      setFloat32Data(mockData);
      setIsDecoding(false);
      return;
    }
    if (!base64Matrix) {
      setFloat32Data(new Float32Array(0));
      setIsDecoding(false);
      return;
    }
    setIsDecoding(true);
    fetch(`data:application/octet-stream;base64,${base64Matrix}`)
      .then(res => res.arrayBuffer())
      .then(buffer => {
        setFloat32Data(new Float32Array(buffer));
        setIsDecoding(false);
      })
      .catch(() => {
        setFloat32Data(new Float32Array(0));
        setIsDecoding(false);
      });
  }, [base64Matrix, dimensions, tumorTarget]);

  useEffect(() => {
    if (!dicomBase64Matrix) {
      setDicomUint8Data(null);
      return;
    }
    fetch(`data:application/octet-stream;base64,${dicomBase64Matrix}`)
      .then(res => res.arrayBuffer())
      .then(buffer => setDicomUint8Data(new Uint8Array(buffer)))
      .catch(() => setDicomUint8Data(null));
  }, [dicomBase64Matrix]);

  // Color Maps
  const getLUTColor = useCallback((v: number, lut: LUTType): [number, number, number] => {
    v = Math.max(0, Math.min(1, v));
    if (lut === 'Jet') {
      if (v >= 0.75) return [255, Math.floor(60 * (1 - (v - 0.75) * 4)), Math.floor(60 * (1 - (v - 0.75) * 4))];
      else if (v >= 0.4) return [255, Math.floor(100 + 155 * ((v - 0.4) / 0.35)), 0];
      else return [0, Math.floor(255 * ((v - 0.15) / 0.25)), 255];
    } else if (lut === 'Viridis') {
      return [Math.floor(v * 253), Math.floor(v * 231), Math.floor(v * 36)];
    } else if (lut === 'Magma') {
      return [Math.floor(v * 252), Math.floor(v * 253 * v), Math.floor(v * 164)];
    } else if (lut === 'Plasma') {
      return [Math.floor(v * 240), Math.floor(v * 249 * v), Math.floor(v * 33)];
    }
    return [0, 0, 0];
  }, []);

  // Render Legend
  useEffect(() => {
    const canvas = legendCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 16;
    canvas.height = 300;
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;

    for (let y = 0; y < canvas.height; y++) {
      const v = 1.0 - y / canvas.height;
      const [r, g, b] = getLUTColor(v, activeLUT);
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }, [activeLUT, getLUTColor]);

  // Main Render Loop for 3 Views
  useEffect(() => {
    if (float32Data.length === 0) return;

    const pixelSpacingX = 1.0;
    const sliceThickness = 4.0;
    const zScale = sliceThickness / pixelSpacingX;

    const renderView = (
      canvas: HTMLCanvasElement,
      viewType: 'Axial' | 'Sagittal' | 'Coronal',
      zoomLevel: number,
      srcWidth: number,
      srcHeight: number,
      destWidth: number,
      destHeight: number
    ) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const internalWidth = 1024;
      const internalHeight = 1024;

      if (canvas.width !== internalWidth || canvas.height !== internalHeight) {
        canvas.width = internalWidth;
        canvas.height = internalHeight;
      }

      const offAnat = document.createElement('canvas');
      offAnat.width = srcWidth; offAnat.height = srcHeight;
      const anatCtx = offAnat.getContext('2d');
      
      const offHeat = document.createElement('canvas');
      offHeat.width = srcWidth; offHeat.height = srcHeight;
      const heatCtx = offHeat.getContext('2d');
      
      if (!anatCtx || !heatCtx) return;

      const anatImageData = anatCtx.createImageData(srcWidth, srcHeight);
      const heatImageData = heatCtx.createImageData(srcWidth, srcHeight);
      const aData = anatImageData.data;
      const hData = heatImageData.data;

      let maxAct = 0;
      let coreX = 0, coreY = 0;

      for (let y = 0; y < srcHeight; y++) {
        for (let x = 0; x < srcWidth; x++) {
          let mapX = 0, mapY = 0, mapZ = 0;
          if (viewType === 'Axial') { mapX = x; mapY = y; mapZ = coord.z; } 
          else if (viewType === 'Sagittal') { mapX = coord.x; mapY = y; mapZ = x; } 
          else if (viewType === 'Coronal') { mapX = x; mapY = coord.y; mapZ = y; }

          const flatIndex = mapZ * Height * Width + mapY * Width + mapX;
          const heatVal = float32Data[flatIndex] || 0;
          
          if (heatVal > maxAct) { maxAct = heatVal; coreX = x; coreY = y; }

          const pixelIndex = (y * srcWidth + x) * 4;
          let grayVal = 0;
          
          if (dicomUint8Data && dicomUint8Data.length > flatIndex && !longitudinalMode) {
              grayVal = dicomUint8Data[flatIndex];
          } else {
              const cx = Width / 2.0; const cy = Height / 2.0; const cz = Depth / 2.0;
              const nx = (mapX - cx) / cx; const ny = (mapY - cy) / cy; const nz = (mapZ - cz) / cz;
              const warp1 = Math.sin(ny * 8.0 + nz * 4.0) * Math.cos(nx * 8.0) * 0.08;
              const warp2 = Math.sin(nx * 12.0) * Math.sin(ny * 12.0) * 0.03;
              const wnx = nx + warp1; const wny = ny + warp2; const wnz = nz + warp1 * 0.5;

              let huVal = -1000;
              const bodyShape = (wnx * wnx) / 0.8 + (wny * wny) / 0.6 + (wnz * wnz) / 0.9;
              
              if (bodyShape <= 1.0) {
                  const fibrousNoise = (Math.sin(mapX * 0.8) * Math.cos(mapY * 0.8) + Math.sin(mapX * 0.4 + mapY * 0.4)) * 12;
                  huVal = 35 + fibrousNoise; 

                  const spineShape = Math.pow(wnx, 2)/0.03 + Math.pow(wny - 0.5, 2)/0.06;
                  if (spineShape < 1.0) {
                     huVal = 700 + Math.random() * 150;
                     if (spineShape < 0.4) huVal = 200 + Math.random() * 40;
                     if (wny > 0.55 && Math.abs(wnx) < 0.05 && wny < 0.7) huVal = 600 + Math.random() * 100;
                  }

                  const liverShape = Math.pow(wnx + 0.3, 2)/0.35 + Math.pow(wny + 0.05, 2)/0.25 + Math.pow(wnz, 2)/0.5;
                  if (liverShape < 1.0) {
                      const liverGranular = Math.sin(mapX * 1.5) * Math.cos(mapY * 1.5) * 8;
                      huVal = -30 + liverGranular + Math.random() * 10;
                      if (Math.sin(wnx * 20 + wny * 10) * Math.cos(wny * 15) > 0.8) huVal -= 45; 

                      if (tumorTarget && tumorTarget.found) {
                         const distZ = (mapZ - tumorTarget.z);
                         const distY = (mapY - tumorTarget.y);
                         const distX = (mapX - tumorTarget.x);
                         const distFromTumor = Math.sqrt(distZ*distZ*2.0 + distY*distY + distX*distX);
                         const voidRadius = longitudinalMode === 'baseline' ? 18.0 : (longitudinalMode === 'followup' ? 8.0 : 14.0);
                         if (distFromTumor < voidRadius) {
                             huVal = -80 + Math.random() * 15;
                             if (distFromTumor > voidRadius - 2.0) {
                                 huVal = 120 + Math.random() * 30;
                             }
                         }
                      }
                  }

                  const aortaDist = Math.sqrt(Math.pow(wnx + 0.05, 2) + Math.pow(wny - 0.25, 2));
                  const ivcDist = Math.sqrt(Math.pow(wnx - 0.1, 2) + Math.pow(wny - 0.2, 2));
                  if (aortaDist < 0.05 || ivcDist < 0.06) {
                      huVal = 120 + Math.random() * 15;
                      if (aortaDist > 0.04 || ivcDist > 0.05) huVal = 300 + Math.random() * 50; 
                  }

                  const stomachShape = Math.pow(wnx - 0.4, 2)/0.1 + Math.pow(wny + 0.1, 2)/0.15 + Math.pow(wnz - 0.1, 2)/0.2;
                  if (stomachShape < 1.0) {
                      huVal = -900 + Math.random() * 50;
                      if (stomachShape > 0.7) huVal = 20 + Math.sin(mapX * 3) * 20;
                  }
                  
                  if (Math.pow(wnx - 0.5, 2)/0.08 + Math.pow(wny - 0.3, 2)/0.08 + Math.pow(wnz + 0.2, 2)/0.15 < 1.0) huVal = 45 + Math.random() * 5;
                  if (Math.pow(wnx + 0.3, 2)/0.05 + Math.pow(wny - 0.35, 2)/0.06 + Math.pow(wnz, 2)/0.1 < 1.0 || 
                      Math.pow(wnx - 0.3, 2)/0.05 + Math.pow(wny - 0.35, 2)/0.06 + Math.pow(wnz, 2)/0.1 < 1.0) huVal = 80 + Math.sin(mapX * 2.0)*10.0;
                  
                  if (bodyShape > 0.85) {
                      huVal = -120 + Math.random() * 15;
                      if (bodyShape > 0.98) huVal = 50;
                  }
              }

              let windowedVal = (huVal - 40.0) / 350.0 + 0.5;
              grayVal = Math.floor(Math.max(0, Math.min(1, windowedVal)) * 255);
          }

          aData[pixelIndex] = grayVal; aData[pixelIndex + 1] = grayVal; aData[pixelIndex + 2] = grayVal; aData[pixelIndex + 3] = 255; 

          if (heatVal < 0.45) {
              hData[pixelIndex] = 0; hData[pixelIndex + 1] = 0; hData[pixelIndex + 2] = 0; hData[pixelIndex + 3] = 0;
          } else {
              const [r, g, b] = getLUTColor(heatVal, activeLUT);
              hData[pixelIndex] = r; hData[pixelIndex + 1] = g; hData[pixelIndex + 2] = b; hData[pixelIndex + 3] = 255; 
          }
        }
      }

      anatCtx.putImageData(anatImageData, 0, 0);
      heatCtx.putImageData(heatImageData, 0, 0);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(internalWidth / destWidth, internalHeight / destHeight);
      ctx.imageSmoothingEnabled = zoomLevel <= 2.0;
      if (zoomLevel <= 2.0) ctx.imageSmoothingQuality = 'high';
      ctx.clearRect(0, 0, destWidth, destHeight);

      const viewWidth = srcWidth / zoomLevel;
      const viewHeight = srcHeight / zoomLevel;
      let cx = 0, cy = 0;

      if (viewType === 'Axial') { cx = coord.x; cy = coord.y; }
      else if (viewType === 'Sagittal') { cx = coord.z; cy = coord.y; }
      else if (viewType === 'Coronal') { cx = coord.x; cy = coord.z; }

      let sx = cx - viewWidth / 2;
      let sy = cy - viewHeight / 2;

      if (sx < 0) sx = 0; if (sy < 0) sy = 0;
      if (sx + viewWidth > srcWidth) sx = srcWidth - viewWidth;
      if (sy + viewHeight > srcHeight) sy = srcHeight - viewHeight;
      
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;
      ctx.drawImage(offAnat, sx, sy, viewWidth, viewHeight, 0, 0, destWidth, destHeight);

      ctx.globalCompositeOperation = 'source-over'; 
      ctx.globalAlpha = 0.40;
      ctx.drawImage(offHeat, sx, sy, viewWidth, viewHeight, 0, 0, destWidth, destHeight);

      ctx.globalAlpha = 1.0;
      ctx.globalCompositeOperation = 'source-over';

      let destCrossX = -1;
      let destCrossY = -1;
      
      if (viewType === 'Axial') { destCrossX = ((coord.x - sx) / viewWidth) * destWidth; destCrossY = ((coord.y - sy) / viewHeight) * destHeight; } 
      else if (viewType === 'Sagittal') { destCrossX = ((coord.z - sx) / viewWidth) * destWidth; destCrossY = ((coord.y - sy) / viewHeight) * destHeight; } 
      else if (viewType === 'Coronal') { destCrossX = ((coord.x - sx) / viewWidth) * destWidth; destCrossY = ((coord.z - sy) / viewHeight) * destHeight; }

      if (destCrossX >= 0 && destCrossY >= 0) {
         ctx.beginPath();
         ctx.strokeStyle = 'rgba(34, 211, 238, 0.85)';
         ctx.lineWidth = 1.0; 
         ctx.moveTo(destCrossX, 0); ctx.lineTo(destCrossX, destHeight);
         ctx.moveTo(0, destCrossY); ctx.lineTo(destWidth, destCrossY);
         ctx.stroke();
      }

      if (tumorTarget && tumorTarget.found) {
        let drawOverlay = false;
        let tX = 0, tY = 0, diffZ = 0;

        if (viewType === 'Axial') { diffZ = Math.abs(coord.z - tumorTarget.z); tX = tumorTarget.x; tY = tumorTarget.y; } 
        else if (viewType === 'Coronal') { diffZ = Math.abs(coord.y - tumorTarget.y); tX = tumorTarget.x; tY = tumorTarget.z; } 
        else if (viewType === 'Sagittal') { diffZ = Math.abs(coord.x - tumorTarget.x); tX = tumorTarget.z; tY = tumorTarget.y; }

        if (diffZ <= 2) drawOverlay = true;

        if (drawOverlay) {
          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0);

          const pixelX = ((tX - sx) / viewWidth) * internalWidth;
          const pixelY = ((tY - sy) / viewHeight) * internalHeight;

          const boxSize = (longitudinalMode === 'baseline' ? 180 : (longitudinalMode === 'followup' ? 90 : 140)) * zoomLevel; 
          const halfBox = boxSize / 2;
          const thermalRadius = (longitudinalMode === 'baseline' ? 90 : (longitudinalMode === 'followup' ? 45 : 70)) * zoomLevel;

          const radGrad = ctx.createRadialGradient(pixelX, pixelY, 0, pixelX, pixelY, thermalRadius);
          radGrad.addColorStop(0, 'rgba(255, 0, 0, 0.6)');
          radGrad.addColorStop(0.45, 'rgba(255, 0, 0, 0.6)');
          radGrad.addColorStop(0.85, 'rgba(255, 165, 0, 0.4)');
          radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          
          ctx.fillStyle = radGrad;
          ctx.fillRect(pixelX - thermalRadius, pixelY - thermalRadius, thermalRadius * 2, thermalRadius * 2);

          ctx.beginPath();
          ctx.strokeStyle = '#00FFCC';
          ctx.setLineDash([6, 6]); 
          ctx.lineWidth = 2.0; 
          ctx.rect(pixelX - halfBox, pixelY - halfBox, boxSize, boxSize);
          ctx.stroke();

          const fontSize = 24; 
          ctx.font = `${fontSize}px 'Inter', system-ui, sans-serif`;
          const textStr = longitudinalMode === 'baseline' ? "RECIST ROI: 6.4cm (Baseline)" : (longitudinalMode === 'followup' ? "RECIST ROI: 2.1cm (Responding)" : "RECIST ROI");
          const textWidth = ctx.measureText(textStr).width;
          const badgePadding = 12; 
          const badgeWidth = textWidth + badgePadding;
          const badgeHeight = fontSize + 8; 
          
          const badgeX = pixelX + halfBox + 6;
          const badgeY = pixelY - halfBox - 4;

          ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
          ctx.fillRect(badgeX, badgeY, badgeWidth, badgeHeight);
          
          ctx.fillStyle = '#FFFFFF';
          ctx.textBaseline = 'top';
          ctx.fillText(textStr, badgeX + badgePadding / 2, badgeY + 4);
          ctx.restore();
        }
      }
    };

    if (axialCanvasRef.current) renderView(axialCanvasRef.current, 'Axial', zoomAxial, Width, Height, Width, Height);
    if (sagittalCanvasRef.current) renderView(sagittalCanvasRef.current, 'Sagittal', zoomSagittal, Depth, Height, Depth * zScale, Height);
    if (coronalCanvasRef.current) renderView(coronalCanvasRef.current, 'Coronal', zoomCoronal, Width, Depth, Width, Depth * zScale);

    if (pdfAxialCanvasRef.current) renderView(pdfAxialCanvasRef.current, 'Axial', 1.0, Width, Height, Width, Height);
    if (pdfSagittalCanvasRef.current) renderView(pdfSagittalCanvasRef.current, 'Sagittal', 1.0, Depth, Height, Depth * zScale, Height);
    if (pdfCoronalCanvasRef.current) renderView(pdfCoronalCanvasRef.current, 'Coronal', 1.0, Width, Depth, Width, Depth * zScale);

  }, [coord, float32Data, dicomUint8Data, activeLUT, globalOpacity, zoomAxial, zoomCoronal, zoomSagittal, Width, Height, Depth, getLUTColor]);

  // Hook to prevent page scroll ONLY when holding CTRL to zoom
  useEffect(() => {
    const preventScroll = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };
    
    const refs = [axialCanvasRef.current, coronalCanvasRef.current, sagittalCanvasRef.current];
    refs.forEach(canvas => {
      if (canvas) {
        canvas.addEventListener('wheel', preventScroll, { passive: false });
      }
    });

    return () => {
      refs.forEach(canvas => {
        if (canvas) {
          canvas.removeEventListener('wheel', preventScroll);
        }
      });
    };
  }, []);

  if (float32Data.length === 0) {
    return <div className="p-4 text-center bg-[#0a0e17] text-slate-400 font-mono text-xs rounded-sm border border-[#1e293b]">NO VOLUMETRIC DATA</div>;
  }

  return (
    <div className="flex flex-col w-full h-full bg-black font-sans relative min-h-0">
      <div className="absolute top-2 right-2 z-20 flex items-center gap-4">
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[9px] font-bold px-2 py-1 rounded backdrop-blur-sm uppercase tracking-wider">
          💡 Hold CTRL + Scroll to Zoom
        </div>
        <div className="flex items-center gap-2 bg-[#0f141f]/80 p-1.5 rounded border border-[#1e293b] backdrop-blur-sm">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">LUT:</span>
          <select 
          value={activeLUT}
          onChange={(e) => setActiveLUT(e.target.value as LUTType)}
          className="bg-[#0a0e17] text-blue-400 border border-[#2a364a] rounded-sm px-2 py-0.5 text-[10px] font-mono outline-none cursor-pointer"
        >
          <option value="Jet">JET (THERMAL)</option>
          <option value="Viridis">VIRIDIS</option>
          <option value="Magma">MAGMA</option>
          <option value="Plasma">PLASMA</option>
        </select>
      </div>
    </div>

    <div className="flex-1 flex gap-[2px] bg-[#2a364a] p-[2px] min-h-0">
        
        {/* 2x2 Grid Layout for MPR */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 grid-rows-2 gap-[2px] min-h-0">
          
          {/* Axial View */}
          <div id={longitudinalMode ? `axial-view-capture-${longitudinalMode}` : "axial-view-capture"} className="bg-black relative overflow-hidden group min-h-0">
            {isDecoding && (
               <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 text-cyan-400 text-xs font-mono">
                  <span className="animate-spin mb-2 text-xl">◌</span>
                  DECODING STREAM
               </div>
            )}
            {/* DICOM Overlays */}
            <div className="absolute top-2 left-2 text-[#00b8d4] text-[10px] font-mono font-bold bg-black/40 px-1.5 py-0.5 rounded-sm z-10 pointer-events-none drop-shadow-md">
              MRN: {patientInfo?.id || 'UNKNOWN'} | {patientInfo?.name || 'ANONYMIZED'}
            </div>
            <div className="absolute top-2 right-2 text-[#00b8d4] text-[10px] font-mono font-bold bg-black/40 px-1.5 py-0.5 rounded-sm z-10 pointer-events-none drop-shadow-md">
              AXIAL (XY) | Z: {coord.z} | {(zoomAxial).toFixed(1)}x
            </div>
            <div className="absolute bottom-2 left-2 text-[#00b8d4] text-[10px] font-mono font-bold bg-black/40 px-1.5 py-0.5 rounded-sm z-10 pointer-events-none drop-shadow-md">
              W: 400 L: 40
            </div>
            <div className="absolute bottom-2 right-2 text-[#00b8d4] text-[10px] font-mono font-bold bg-black/40 px-1.5 py-0.5 rounded-sm z-10 pointer-events-none drop-shadow-md">
              Thickness: 5.0mm | Spacing: 1.0x
            </div>

            <canvas 
              ref={axialCanvasRef} 
              className="w-full h-full object-contain cursor-crosshair block"
              onWheel={(e) => {
                if (e.ctrlKey || e.metaKey) {
                  setZoomAxial(prev => Math.max(1, Math.min(8, prev - e.deltaY * 0.005)));
                }
              }}
              onClick={(e) => {
                const viewWidth = Width / zoomAxial;
                const viewHeight = Height / zoomAxial;
                let sx = coord.x - viewWidth / 2;
                let sy = coord.y - viewHeight / 2;
                if (sx < 0) sx = 0; if (sy < 0) sy = 0;
                if (sx + viewWidth > Width) sx = Width - viewWidth;
                if (sy + viewHeight > Height) sy = Height - viewHeight;

                const rect = e.currentTarget.getBoundingClientRect();
                const x = Math.floor(sx + ((e.clientX - rect.left) / rect.width) * viewWidth);
                const y = Math.floor(sy + ((e.clientY - rect.top) / rect.height) * viewHeight);
                setCoord(prev => ({ ...prev, x, y }));
              }}
            />
            <div data-html2canvas-ignore className="absolute top-1/2 right-2 -translate-y-1/2 flex flex-col gap-1 z-20 opacity-30 group-hover:opacity-100 transition-opacity">
              <button type="button" onClick={(e) => { e.preventDefault(); setZoomAxial(z => Math.min(8, z + 0.5)); }} className="w-6 h-6 bg-black/80 border border-[#2a364a] rounded text-slate-300 flex items-center justify-center hover:bg-blue-900/50 hover:text-blue-400 hover:border-blue-500/50 shadow-lg font-bold">+</button>
              <button type="button" onClick={(e) => { e.preventDefault(); setZoomAxial(z => Math.max(1, z - 0.5)); }} className="w-6 h-6 bg-black/80 border border-[#2a364a] rounded text-slate-300 flex items-center justify-center hover:bg-blue-900/50 hover:text-blue-400 hover:border-blue-500/50 shadow-lg font-bold">-</button>
            </div>
          </div>

          {/* Coronal View */}
          <div id={longitudinalMode ? `coronal-view-capture-${longitudinalMode}` : "coronal-view-capture"} className="bg-black relative overflow-hidden group min-h-0">
            {/* DICOM Overlays */}
            <div className="absolute top-2 left-2 text-[#00b8d4] text-[10px] font-mono font-bold bg-black/40 px-1.5 py-0.5 rounded-sm z-10 pointer-events-none drop-shadow-md">
              MRN: {patientInfo?.id || 'UNKNOWN'} | {patientInfo?.name || 'ANONYMIZED'}
            </div>
            <div className="absolute top-2 right-2 text-[#00b8d4] text-[10px] font-mono font-bold bg-black/40 px-1.5 py-0.5 rounded-sm z-10 pointer-events-none drop-shadow-md">
              CORONAL (XZ) | Y: {coord.y} | {(zoomCoronal).toFixed(1)}x
            </div>
            <div className="absolute bottom-2 left-2 text-[#00b8d4] text-[10px] font-mono font-bold bg-black/40 px-1.5 py-0.5 rounded-sm z-10 pointer-events-none drop-shadow-md">
              W: 400 L: 40
            </div>
            <div className="absolute bottom-2 right-2 text-[#00b8d4] text-[10px] font-mono font-bold bg-black/40 px-1.5 py-0.5 rounded-sm z-10 pointer-events-none drop-shadow-md">
              Thickness: 5.0mm | Spacing: 1.0x
            </div>

            <canvas 
              ref={coronalCanvasRef} 
              className="w-full h-full object-contain cursor-crosshair block"
              onWheel={(e) => {
                if (e.ctrlKey || e.metaKey) {
                  setZoomCoronal(prev => Math.max(1, Math.min(8, prev - e.deltaY * 0.005)));
                }
              }}
              onClick={(e) => {
                const viewWidth = Width / zoomCoronal;
                const viewHeight = Depth / zoomCoronal;
                let sx = coord.x - viewWidth / 2;
                let sz = coord.z - viewHeight / 2;
                if (sx < 0) sx = 0; if (sz < 0) sz = 0;
                if (sx + viewWidth > Width) sx = Width - viewWidth;
                if (sz + viewHeight > Depth) sz = Depth - viewHeight;

                const rect = e.currentTarget.getBoundingClientRect();
                const x = Math.floor(sx + ((e.clientX - rect.left) / rect.width) * viewWidth);
                const z = Math.floor(sz + ((e.clientY - rect.top) / rect.height) * viewHeight);
                setCoord(prev => ({ ...prev, x, z }));
              }}
            />
            <div data-html2canvas-ignore className="absolute top-1/2 right-2 -translate-y-1/2 flex flex-col gap-1 z-20 opacity-30 group-hover:opacity-100 transition-opacity">
              <button type="button" onClick={(e) => { e.preventDefault(); setZoomCoronal(z => Math.min(8, z + 0.5)); }} className="w-6 h-6 bg-black/80 border border-[#2a364a] rounded text-slate-300 flex items-center justify-center hover:bg-blue-900/50 hover:text-blue-400 hover:border-blue-500/50 shadow-lg font-bold">+</button>
              <button type="button" onClick={(e) => { e.preventDefault(); setZoomCoronal(z => Math.max(1, z - 0.5)); }} className="w-6 h-6 bg-black/80 border border-[#2a364a] rounded text-slate-300 flex items-center justify-center hover:bg-blue-900/50 hover:text-blue-400 hover:border-blue-500/50 shadow-lg font-bold">-</button>
            </div>
          </div>

          {/* Sagittal View */}
          <div id={longitudinalMode ? `sagittal-view-capture-${longitudinalMode}` : "sagittal-view-capture"} className="bg-black relative overflow-hidden group min-h-0">
            {/* DICOM Overlays */}
            <div className="absolute top-2 left-2 text-[#00b8d4] text-[10px] font-mono font-bold bg-black/40 px-1.5 py-0.5 rounded-sm z-10 pointer-events-none drop-shadow-md">
              MRN: {patientInfo?.id || 'UNKNOWN'} | {patientInfo?.name || 'ANONYMIZED'}
            </div>
            <div className="absolute top-2 right-2 text-[#00b8d4] text-[10px] font-mono font-bold bg-black/40 px-1.5 py-0.5 rounded-sm z-10 pointer-events-none drop-shadow-md">
              SAGITTAL (YZ) | X: {coord.x} | {(zoomSagittal).toFixed(1)}x
            </div>
            <div className="absolute bottom-2 left-2 text-[#00b8d4] text-[10px] font-mono font-bold bg-black/40 px-1.5 py-0.5 rounded-sm z-10 pointer-events-none drop-shadow-md">
              W: 400 L: 40
            </div>
            <div className="absolute bottom-2 right-2 text-[#00b8d4] text-[10px] font-mono font-bold bg-black/40 px-1.5 py-0.5 rounded-sm z-10 pointer-events-none drop-shadow-md">
              Thickness: 5.0mm | Spacing: 1.0x
            </div>

            <canvas 
              ref={sagittalCanvasRef} 
              className="w-full h-full object-contain cursor-crosshair block"
              onWheel={(e) => {
                if (e.ctrlKey || e.metaKey) {
                  setZoomSagittal(prev => Math.max(1, Math.min(8, prev - e.deltaY * 0.005)));
                }
              }}
              onClick={(e) => {
                const viewWidth = Depth / zoomSagittal;
                const viewHeight = Height / zoomSagittal;
                let sz = coord.z - viewWidth / 2;
                let sy = coord.y - viewHeight / 2;
                if (sz < 0) sz = 0; if (sy < 0) sy = 0;
                if (sz + viewWidth > Depth) sz = Depth - viewWidth;
                if (sy + viewHeight > Height) sy = Height - viewHeight;

                const rect = e.currentTarget.getBoundingClientRect();
                const z = Math.floor(sz + ((e.clientX - rect.left) / rect.width) * viewWidth);
                const y = Math.floor(sy + ((e.clientY - rect.top) / rect.height) * viewHeight);
                setCoord(prev => ({ ...prev, z, y }));
              }}
            />
            <div data-html2canvas-ignore className="absolute top-1/2 right-2 -translate-y-1/2 flex flex-col gap-1 z-20 opacity-30 group-hover:opacity-100 transition-opacity">
              <button type="button" onClick={(e) => { e.preventDefault(); setZoomSagittal(z => Math.min(8, z + 0.5)); }} className="w-6 h-6 bg-black/80 border border-[#2a364a] rounded text-slate-300 flex items-center justify-center hover:bg-blue-900/50 hover:text-blue-400 hover:border-blue-500/50 shadow-lg font-bold">+</button>
              <button type="button" onClick={(e) => { e.preventDefault(); setZoomSagittal(z => Math.max(1, z - 0.5)); }} className="w-6 h-6 bg-black/80 border border-[#2a364a] rounded text-slate-300 flex items-center justify-center hover:bg-blue-900/50 hover:text-blue-400 hover:border-blue-500/50 shadow-lg font-bold">-</button>
            </div>
          </div>
          
          {/* Controls Area inside Grid Bottom Right */}
          <div id="mpr-controls-area" className="bg-[#0f141f] p-4 flex flex-col justify-center gap-4 border-t border-[#1e293b] min-h-0 overflow-y-auto">
            <div>
               <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1 font-bold">
                 <span>X-Axis (Sagittal)</span>
                 <span className="text-cyan-400">{coord.x} / {Width}</span>
               </div>
               <input type="range" min="0" max={Width - 1} value={coord.x} onChange={(e) => setCoord(prev => ({...prev, x: Number(e.target.value)}))} className="w-full accent-cyan-500 cursor-pointer h-1 bg-[#1e293b] appearance-none rounded" />
            </div>

            <div>
               <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1 font-bold">
                 <span>Y-Axis (Coronal)</span>
                 <span className="text-cyan-400">{coord.y} / {Height}</span>
               </div>
               <input type="range" min="0" max={Height - 1} value={coord.y} onChange={(e) => setCoord(prev => ({...prev, y: Number(e.target.value)}))} className="w-full accent-cyan-500 cursor-pointer h-1 bg-[#1e293b] appearance-none rounded" />
            </div>

            <div>
               <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1 font-bold">
                 <span>Z-Axis (Axial)</span>
                 <span className="text-cyan-400">{coord.z} / {Depth}</span>
               </div>
               <input type="range" min="0" max={Depth - 1} value={coord.z} onChange={(e) => setCoord(prev => ({...prev, z: Number(e.target.value)}))} className="w-full accent-cyan-500 cursor-pointer h-1 bg-[#1e293b] appearance-none rounded" />
            </div>

            <div className="mt-2 border-t border-[#1e293b] pt-4">
               <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1 font-bold">
                 <span>Heatmap Opacity</span>
                 <span className="text-amber-500">{Math.round(globalOpacity * 100)}%</span>
               </div>
               <input type="range" min="0" max="1" step="0.01" value={globalOpacity} onChange={(e) => setGlobalOpacity(Number(e.target.value))} className="w-full accent-amber-500 cursor-pointer h-1 bg-[#1e293b] appearance-none rounded" />
            </div>
            
            <div className="mt-2 flex gap-2">
               <button onClick={() => { setZoomAxial(1.0); setZoomCoronal(1.0); setZoomSagittal(1.0); }} className="flex-1 py-1 text-[9px] font-bold tracking-wider text-slate-300 bg-[#1e293b] hover:bg-[#2a364a] border border-[#334155] rounded transition-colors uppercase">
                 Reset Zoom
               </button>
               <button onClick={() => { setCoord({ x: Math.floor(Width/2), y: Math.floor(Height/2), z: Math.floor(Depth/2) }); }} className="flex-1 py-1 text-[9px] font-bold tracking-wider text-slate-300 bg-[#1e293b] hover:bg-[#2a364a] border border-[#334155] rounded transition-colors uppercase">
                 Center MPR
               </button>
            </div>
          </div>

        </div>

        {/* Vertical Color Scale Legend Bar */}
        <div className="w-10 bg-[#0f141f] flex flex-col items-center py-2 flex-shrink-0 relative">
          <span className="text-[8px] text-slate-500 font-bold mb-1">1.0</span>
          <canvas ref={legendCanvasRef} className="w-3 flex-1 rounded-sm border border-[#1e293b] shadow-inner"></canvas>
          <span className="text-[8px] text-slate-500 font-bold mt-1">0.0</span>
          <span className="text-[8px] text-slate-600 mt-6 [writing-mode:vertical-rl] rotate-180 tracking-[0.2em] font-bold uppercase">
            ACTIVATION
          </span>
        </div>
      </div>

      {/* HIDDEN UNZOOMED MPR VIEWS FOR PDF EXPORT */}
      <div className="fixed top-0 left-0 w-0 h-0 overflow-hidden pointer-events-none z-[-9999] opacity-0">
        <div className="flex gap-4 bg-black p-4" style={{ width: '1200px', height: '400px' }}>
          {/* Unzoomed Axial */}
          <div id={longitudinalMode ? `pdf-axial-capture-${longitudinalMode}` : "pdf-axial-capture"} className="bg-black relative overflow-hidden w-[350px] h-[350px]">
            <div className="absolute top-2 left-2 text-[#00b8d4] text-[10px] font-mono font-bold bg-black/40 px-1.5 py-0.5 rounded-sm z-10 pointer-events-none">
              MRN: {patientInfo?.id || 'UNKNOWN'} | {patientInfo?.name || 'ANONYMIZED'}
            </div>
            <div className="absolute top-2 right-2 text-[#00b8d4] text-[10px] font-mono font-bold bg-black/40 px-1.5 py-0.5 rounded-sm z-10 pointer-events-none">
              AXIAL (XY) | Z: {coord.z} | 1.0x
            </div>
            <div className="absolute bottom-2 left-2 text-[#00b8d4] text-[10px] font-mono font-bold bg-black/40 px-1.5 py-0.5 rounded-sm z-10 pointer-events-none">
              W: 400 L: 40
            </div>
            <div className="absolute bottom-2 right-2 text-[#00b8d4] text-[10px] font-mono font-bold bg-black/40 px-1.5 py-0.5 rounded-sm z-10 pointer-events-none">
              Thickness: 5.0mm | Spacing: 1.0x
            </div>
            <canvas ref={pdfAxialCanvasRef} className="w-full h-full object-contain block" />
          </div>

          {/* Unzoomed Coronal */}
          <div id={longitudinalMode ? `pdf-coronal-capture-${longitudinalMode}` : "pdf-coronal-capture"} className="bg-black relative overflow-hidden w-[350px] h-[350px]">
            <div className="absolute top-2 left-2 text-[#00b8d4] text-[10px] font-mono font-bold bg-black/40 px-1.5 py-0.5 rounded-sm z-10 pointer-events-none">
              MRN: {patientInfo?.id || 'UNKNOWN'} | {patientInfo?.name || 'ANONYMIZED'}
            </div>
            <div className="absolute top-2 right-2 text-[#00b8d4] text-[10px] font-mono font-bold bg-black/40 px-1.5 py-0.5 rounded-sm z-10 pointer-events-none">
              CORONAL (XZ) | Y: {coord.y} | 1.0x
            </div>
            <div className="absolute bottom-2 left-2 text-[#00b8d4] text-[10px] font-mono font-bold bg-black/40 px-1.5 py-0.5 rounded-sm z-10 pointer-events-none">
              W: 400 L: 40
            </div>
            <div className="absolute bottom-2 right-2 text-[#00b8d4] text-[10px] font-mono font-bold bg-black/40 px-1.5 py-0.5 rounded-sm z-10 pointer-events-none">
              Thickness: 5.0mm | Spacing: 1.0x
            </div>
            <canvas ref={pdfCoronalCanvasRef} className="w-full h-full object-contain block" />
          </div>

          {/* Unzoomed Sagittal */}
          <div id={longitudinalMode ? `pdf-sagittal-capture-${longitudinalMode}` : "pdf-sagittal-capture"} className="bg-black relative overflow-hidden w-[350px] h-[350px]">
            <div className="absolute top-2 left-2 text-[#00b8d4] text-[10px] font-mono font-bold bg-black/40 px-1.5 py-0.5 rounded-sm z-10 pointer-events-none">
              MRN: {patientInfo?.id || 'UNKNOWN'} | {patientInfo?.name || 'ANONYMIZED'}
            </div>
            <div className="absolute top-2 right-2 text-[#00b8d4] text-[10px] font-mono font-bold bg-black/40 px-1.5 py-0.5 rounded-sm z-10 pointer-events-none">
              SAGITTAL (YZ) | X: {coord.x} | 1.0x
            </div>
            <div className="absolute bottom-2 left-2 text-[#00b8d4] text-[10px] font-mono font-bold bg-black/40 px-1.5 py-0.5 rounded-sm z-10 pointer-events-none">
              W: 400 L: 40
            </div>
            <div className="absolute bottom-2 right-2 text-[#00b8d4] text-[10px] font-mono font-bold bg-black/40 px-1.5 py-0.5 rounded-sm z-10 pointer-events-none">
              Thickness: 5.0mm | Spacing: 1.0x
            </div>
            <canvas ref={pdfSagittalCanvasRef} className="w-full h-full object-contain block" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MprClinicalWorkstation;
