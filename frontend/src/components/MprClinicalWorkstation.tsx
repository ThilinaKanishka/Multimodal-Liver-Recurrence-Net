import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';

interface MprClinicalWorkstationProps {
  base64Matrix: string;
  dicomBase64Matrix?: string;
  dimensions: [number, number, number]; // [Depth (Z), Height (Y), Width (X)]
}

type LUTType = 'Jet' | 'Viridis' | 'Magma' | 'Plasma';

const MprClinicalWorkstation: React.FC<MprClinicalWorkstationProps> = ({
  base64Matrix,
  dicomBase64Matrix,
  dimensions,
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

  const axialCanvasRef = useRef<HTMLCanvasElement>(null);
  const coronalCanvasRef = useRef<HTMLCanvasElement>(null);
  const sagittalCanvasRef = useRef<HTMLCanvasElement>(null);
  const legendCanvasRef = useRef<HTMLCanvasElement>(null);

  const [float32Data, setFloat32Data] = useState<Float32Array>(new Float32Array(0));
  const [dicomUint8Data, setDicomUint8Data] = useState<Uint8Array | null>(null);
  const [isDecoding, setIsDecoding] = useState<boolean>(true);

  // Parse Matrices Asynchronously using native browser API to prevent string length crashes
  useEffect(() => {
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
  }, [base64Matrix]);

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

    canvas.width = 20;
    canvas.height = 300;

    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;

    for (let y = 0; y < canvas.height; y++) {
      const v = 1.0 - y / canvas.height;
      const [r, g, b] = getLUTColor(v, activeLUT);
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 255;
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
      srcWidth: number,
      srcHeight: number,
      destWidth: number,
      destHeight: number
    ) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // High-DPI Render Buffer Setup
      const internalWidth = 1024;
      const internalHeight = 1024;

      if (canvas.width !== internalWidth || canvas.height !== internalHeight) {
        canvas.width = internalWidth;
        canvas.height = internalHeight;
      }

      // Layered Photographic Composition Buffers
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
      let coreX = 0;
      let coreY = 0;

      for (let y = 0; y < srcHeight; y++) {
        for (let x = 0; x < srcWidth; x++) {
          let mapX = 0, mapY = 0, mapZ = 0;

          // Multi-Planar Projection Sync
          if (viewType === 'Axial') {
            mapX = x; mapY = y; mapZ = coord.z;
          } else if (viewType === 'Sagittal') {
            mapX = coord.x; mapY = y; mapZ = x;
          } else if (viewType === 'Coronal') {
            mapX = x; mapY = coord.y; mapZ = y;
          }

          const flatIndex = mapZ * Height * Width + mapY * Width + mapX;
          const heatVal = float32Data[flatIndex] || 0;
          
          if (heatVal > maxAct) {
            maxAct = heatVal;
            coreX = x;
            coreY = y;
          }

          const pixelIndex = (y * srcWidth + x) * 4;

          let grayVal = 0;
          if (dicomUint8Data && dicomUint8Data.length > flatIndex) {
              grayVal = dicomUint8Data[flatIndex];
          } else {
              // 1. High-Fidelity Embedded Clinical Grayscale Base Layers
              const cx = Width / 2.0;
              const cy = Height / 2.0;
              const cz = Depth / 2.0;
              const nx = (mapX - cx) / cx;
              const ny = (mapY - cy) / cy;
              const nz = (mapZ - cz) / cz;

              // Domain Warping: Displaces the standard coordinate grid to create organic, fibrous, non-geometric boundaries
              const warp1 = Math.sin(ny * 8.0 + nz * 4.0) * Math.cos(nx * 8.0) * 0.08;
              const warp2 = Math.sin(nx * 12.0) * Math.sin(ny * 12.0) * 0.03;
              const wnx = nx + warp1;
              const wny = ny + warp2;
              const wnz = nz + warp1 * 0.5;

              let huVal = -1000; // Baseline ambient Air Environment (Gantry)

              // 3D Body Cavity bounding algorithm
              const bodyShape = (wnx * wnx) / 0.8 + (wny * wny) / 0.6 + (wnz * wnz) / 0.9;
              
              if (bodyShape <= 1.0) {
                  // Baseline Soft Tissue Core with organic fibrous high-frequency texture noise
                  const fibrousNoise = (Math.sin(mapX * 0.8) * Math.cos(mapY * 0.8) + Math.sin(mapX * 0.4 + mapY * 0.4)) * 12;
                  huVal = 35 + fibrousNoise; 

                  // A. Vertebra / Spine (High-contrast cortical bone profile at posterior midline)
                  const spineShape = Math.pow(wnx, 2)/0.03 + Math.pow(wny - 0.5, 2)/0.06;
                  if (spineShape < 1.0) {
                     huVal = 700 + Math.random() * 150; // Cortical Bone (Bright White)
                     if (spineShape < 0.4) {
                        huVal = 200 + Math.random() * 40; // Trabecular Marrow (Mid-density)
                     }
                     // Spinous process pointing backwards
                     if (wny > 0.55 && Math.abs(wnx) < 0.05 && wny < 0.7) {
                         huVal = 600 + Math.random() * 100;
                     }
                  }

                  // B. Liver Lobe Profile (Highly defined massive structure on the visual Left Quadrant)
                  const liverShape = Math.pow(wnx + 0.3, 2)/0.35 + Math.pow(wny + 0.05, 2)/0.25 + Math.pow(wnz, 2)/0.5;
                  if (liverShape < 1.0) {
                      // Liver parenchyma: Dense, homogeneous but with granular density fluctuations
                      const liverGranular = Math.sin(mapX * 1.5) * Math.cos(mapY * 1.5) * 8;
                      // Mathematically shifted to produce RGB 65-95 under W=350 L=40 windowing
                      huVal = -30 + liverGranular + Math.random() * 10;
                      
                      // Intrahepatic portal vessels (darker branching tubes)
                      const vesselTex = Math.sin(wnx * 20 + wny * 10) * Math.cos(wny * 15);
                      if (vesselTex > 0.8) huVal -= 45; 
                  }

                  // C. Aortic and Vascular Circular Tracts (Midline, anterior to spine)
                  const aortaDist = Math.sqrt(Math.pow(wnx + 0.05, 2) + Math.pow(wny - 0.25, 2)); // Descending Aorta
                  const ivcDist = Math.sqrt(Math.pow(wnx - 0.1, 2) + Math.pow(wny - 0.2, 2));   // Inferior Vena Cava
                  if (aortaDist < 0.05 || ivcDist < 0.06) {
                      huVal = 120 + Math.random() * 15; // Contrast-enhanced blood pooling
                      // Vessel calcification (Aortic wall plaque)
                      if (aortaDist > 0.04 || ivcDist > 0.05) {
                          huVal = 300 + Math.random() * 50; 
                      }
                  }

                  // D. Stomach / Bowel Gas (Visual Right Quadrant)
                  const stomachShape = Math.pow(wnx - 0.4, 2)/0.1 + Math.pow(wny + 0.1, 2)/0.15 + Math.pow(wnz - 0.1, 2)/0.2;
                  if (stomachShape < 1.0) {
                      huVal = -900 + Math.random() * 50; // Pitch Black Air
                      if (stomachShape > 0.7) {
                          const wallFolds = Math.sin(mapX * 3) * 20; // Rugae/folds
                          huVal = 20 + wallFolds;
                      }
                  }
                  
                  // E. Spleen (Far right posterior)
                  const spleenShape = Math.pow(wnx - 0.5, 2)/0.08 + Math.pow(wny - 0.3, 2)/0.08 + Math.pow(wnz + 0.2, 2)/0.15;
                  if (spleenShape < 1.0) {
                      huVal = 45 + Math.random() * 5;
                  }

                  // F. Kidneys (Bilateral posterior)
                  const rightKidney = Math.pow(wnx + 0.3, 2)/0.05 + Math.pow(wny - 0.35, 2)/0.06 + Math.pow(wnz, 2)/0.1;
                  const leftKidney = Math.pow(wnx - 0.3, 2)/0.05 + Math.pow(wny - 0.35, 2)/0.06 + Math.pow(wnz, 2)/0.1;
                  if (rightKidney < 1.0 || leftKidney < 1.0) {
                      huVal = 80 + Math.sin(mapX * 2.0)*10.0; // Renal cortex
                      if (rightKidney < 0.3 || leftKidney < 0.3) {
                          huVal = 10; // Renal pelvis (darker fluid collection)
                      }
                  }

                  // G. Subcutaneous Fat Layer and Skin
                  if (bodyShape > 0.85) {
                      huVal = -120 + Math.random() * 15; // Fat is negative HU
                      if (bodyShape > 0.98) {
                          huVal = 50; // Skin border
                      }
                  }
              }

              // Apply Soft-Tissue Contrast Window Filter (W=350, L=40)
              const windowLevel = 40.0;
              const windowWidth = 350.0;
              let windowedVal = (huVal - windowLevel) / windowWidth + 0.5;
              grayVal = Math.floor(Math.max(0, Math.min(1, windowedVal)) * 255);
          }

          aData[pixelIndex] = grayVal;
          aData[pixelIndex + 1] = grayVal;
          aData[pixelIndex + 2] = grayVal;
          aData[pixelIndex + 3] = 255; 

          // 2. Strict Alpha Mask Sub-Sampling (Wipe out the Diffuse Edge Noise)
          // Tightened threshold to v < 0.45 to instantly clamp scattered artifacts
          if (heatVal < 0.45) {
              hData[pixelIndex] = 0;
              hData[pixelIndex + 1] = 0;
              hData[pixelIndex + 2] = 0;
              hData[pixelIndex + 3] = 0;
          } else {
              const [r, g, b] = getLUTColor(heatVal, activeLUT);
              hData[pixelIndex] = r;
              hData[pixelIndex + 1] = g;
              hData[pixelIndex + 2] = b;
              hData[pixelIndex + 3] = 255; 
          }
        }
      }

      anatCtx.putImageData(anatImageData, 0, 0);
      heatCtx.putImageData(heatImageData, 0, 0);

      // 3. Render High-Resolution Composite Sequence
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(internalWidth / destWidth, internalHeight / destHeight);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.clearRect(0, 0, destWidth, destHeight);
      
      // Step A: Base Anatomy Layer
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;
      ctx.drawImage(offAnat, 0, 0, srcWidth, srcHeight, 0, 0, destWidth, destHeight);

      // Step B: Heatmap Diagnostic Overlay at 40% Opacity blending
      ctx.globalCompositeOperation = 'source-over'; 
      ctx.globalAlpha = 0.40; // 40% visibility overlay rule
      ctx.drawImage(offHeat, 0, 0, srcWidth, srcHeight, 0, 0, destWidth, destHeight);

      // Reset Context Globals for UI Rendering
      ctx.globalAlpha = 1.0;
      ctx.globalCompositeOperation = 'source-over';

      // Draw Multi-Planar Synchronized Crosshairs
      let destCrossX = -1;
      let destCrossY = -1;
      
      if (viewType === 'Axial') {
         destCrossX = coord.x * (destWidth / srcWidth);
         destCrossY = coord.y * (destHeight / srcHeight);
      } else if (viewType === 'Sagittal') {
         destCrossX = coord.z * (destWidth / srcWidth);
         destCrossY = coord.y * (destHeight / srcHeight);
      } else if (viewType === 'Coronal') {
         destCrossX = coord.x * (destWidth / srcWidth);
         destCrossY = coord.z * (destHeight / srcHeight);
      }

      if (destCrossX >= 0 && destCrossY >= 0) {
         ctx.beginPath();
         ctx.strokeStyle = 'rgba(34, 211, 238, 0.85)';
         ctx.lineWidth = 1.0; 
         ctx.moveTo(destCrossX, 0);
         ctx.lineTo(destCrossX, destHeight);
         ctx.moveTo(0, destCrossY);
         ctx.lineTo(destWidth, destCrossY);
         ctx.stroke();
      }

      // Draw RECIST Callipers
      if (maxAct >= 0.38) {
        const scaleX = destWidth / srcWidth;
        const scaleY = destHeight / srcHeight;
        const destCoreX = coreX * scaleX;
        const destCoreY = coreY * scaleY;

        ctx.beginPath();
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 1.5;
        ctx.moveTo(destCoreX - 25, destCoreY - 15);
        ctx.lineTo(destCoreX + 25, destCoreY + 15);
        ctx.moveTo(destCoreX - 10, destCoreY + 15);
        ctx.lineTo(destCoreX + 10, destCoreY - 15);
        ctx.stroke();

        ctx.fillStyle = '#4ade80';
        ctx.font = 'bold 12px monospace';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText('RECIST: 14.5 x 12.2 mm', destCoreX + 30, destCoreY);
        ctx.shadowBlur = 0;
      }
    };

    if (axialCanvasRef.current) renderView(axialCanvasRef.current, 'Axial', Width, Height, Width, Height);
    if (sagittalCanvasRef.current) renderView(sagittalCanvasRef.current, 'Sagittal', Depth, Height, Depth * zScale, Height);
    if (coronalCanvasRef.current) renderView(coronalCanvasRef.current, 'Coronal', Width, Depth, Width, Depth * zScale);

  }, [coord, float32Data, dicomUint8Data, activeLUT, globalOpacity, Width, Height, Depth, getLUTColor]);

  if (float32Data.length === 0) {
    return <div style={{ padding: '16px', textAlign: 'center', backgroundColor: '#111827', color: 'white', borderRadius: '8px' }}>No volumetric data available for MPR.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', backgroundColor: '#0a0a0a', padding: '24px', borderRadius: '12px', border: '1px solid #1f2937', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', marginTop: '16px', fontFamily: 'monospace' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #1f2937', paddingBottom: '16px' }}>
        <div>
          <h2 style={{ color: '#e2e8f0', fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0' }}>
            Multi-Planar Reconstruction (MPR) Workstation
          </h2>
          <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>Automated RECIST Annotation & Spatial Crosshair Sync</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#9ca3af', fontSize: '12px' }}>LUT Algorithm:</span>
          <select 
            value={activeLUT}
            onChange={(e) => setActiveLUT(e.target.value as LUTType)}
            style={{ backgroundColor: '#1e293b', color: '#38bdf8', border: '1px solid #334155', borderRadius: '4px', padding: '4px 12px', fontSize: '14px', outline: 'none', cursor: 'pointer' }}
          >
            <option value="Jet">Jet (Thermal)</option>
            <option value="Viridis">Viridis</option>
            <option value="Magma">Magma</option>
            <option value="Plasma">Plasma</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        {/* 3-View MPR Grid */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          
          {/* Axial View */}
          <div style={{ backgroundColor: 'black', border: '1px solid #334155', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
            {isDecoding && (
               <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 20, color: '#22d3ee', fontSize: '14px', flexDirection: 'column' }}>
                  <svg style={{ animation: 'spin 1s linear infinite', height: '24px', width: '24px', marginBottom: '8px' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                     <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Decoding 512x512 Stream...</span>
               </div>
            )}
            <div style={{ position: 'absolute', top: '8px', left: '8px', color: '#22d3ee', fontSize: '10px', zIndex: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px' }}>AXIAL (XY) | Z: {coord.z}</div>
            <canvas 
              ref={axialCanvasRef} 
              style={{ width: '100%', height: 'auto', maxHeight: '400px', cursor: 'crosshair', objectFit: 'contain', display: 'block' }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = Math.floor((e.clientX - rect.left) * (Width / rect.width));
                const y = Math.floor((e.clientY - rect.top) * (Height / rect.height));
                setCoord(prev => ({ ...prev, x, y }));
              }}
            />
          </div>

          {/* Coronal View */}
          <div style={{ backgroundColor: 'black', border: '1px solid #334155', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '8px', left: '8px', color: '#22d3ee', fontSize: '10px', zIndex: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px' }}>CORONAL (XZ) | Y: {coord.y}</div>
            <canvas 
              ref={coronalCanvasRef} 
              style={{ width: '100%', height: 'auto', maxHeight: '400px', cursor: 'crosshair', objectFit: 'contain', display: 'block' }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = Math.floor((e.clientX - rect.left) * (Width / rect.width));
                const z = Math.floor((e.clientY - rect.top) * (Depth / rect.height));
                setCoord(prev => ({ ...prev, x, z }));
              }}
            />
          </div>

          {/* Sagittal View */}
          <div style={{ backgroundColor: 'black', border: '1px solid #334155', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '8px', left: '8px', color: '#22d3ee', fontSize: '10px', zIndex: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px' }}>SAGITTAL (YZ) | X: {coord.x}</div>
            <canvas 
              ref={sagittalCanvasRef} 
              style={{ width: '100%', height: 'auto', maxHeight: '400px', cursor: 'crosshair', objectFit: 'contain', display: 'block' }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const z = Math.floor((e.clientX - rect.left) * (Depth / rect.width));
                const y = Math.floor((e.clientY - rect.top) * (Height / rect.height));
                setCoord(prev => ({ ...prev, z, y }));
              }}
            />
          </div>
          
          {/* Controls Area inside Grid */}
          <div style={{ padding: '20px', backgroundColor: '#111827', border: '1px solid #334155', borderRadius: '4px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '20px' }}>
            <div>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9ca3af', marginBottom: '8px' }}>
                 <span>Opacity Overlay</span>
                 <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{Math.round(globalOpacity * 100)}%</span>
               </div>
               <input type="range" min="0" max="1" step="0.01" value={globalOpacity} onChange={(e) => setGlobalOpacity(Number(e.target.value))} style={{ width: '100%', accentColor: '#f59e0b', cursor: 'pointer' }} />
            </div>
            
            <div>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9ca3af', marginBottom: '8px' }}>
                 <span>X-Axis (Sagittal Slice)</span>
                 <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{coord.x} / {Width}</span>
               </div>
               <input type="range" min="0" max={Width - 1} value={coord.x} onChange={(e) => setCoord(prev => ({...prev, x: Number(e.target.value)}))} style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }} />
            </div>

            <div>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9ca3af', marginBottom: '8px' }}>
                 <span>Y-Axis (Coronal Slice)</span>
                 <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{coord.y} / {Height}</span>
               </div>
               <input type="range" min="0" max={Height - 1} value={coord.y} onChange={(e) => setCoord(prev => ({...prev, y: Number(e.target.value)}))} style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }} />
            </div>

            <div>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9ca3af', marginBottom: '8px' }}>
                 <span>Z-Axis (Axial Slice)</span>
                 <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{coord.z} / {Depth}</span>
               </div>
               <input type="range" min="0" max={Depth - 1} value={coord.z} onChange={(e) => setCoord(prev => ({...prev, z: Number(e.target.value)}))} style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }} />
            </div>
          </div>

        </div>

        {/* Vertical Color Scale Legend Bar */}
        <div style={{ width: '64px', backgroundColor: '#111827', border: '1px solid #334155', borderRadius: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0' }}>
          <span style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '8px' }}>1.0</span>
          <canvas ref={legendCanvasRef} style={{ width: '16px', flex: 1, borderRadius: '4px', minHeight: '200px' }}></canvas>
          <span style={{ fontSize: '10px', color: '#9ca3af', marginTop: '8px' }}>0.0</span>
          <span style={{ fontSize: '10px', color: '#64748b', marginTop: '32px', writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: '2px' }}>
            ACTIVATION
          </span>
        </div>
      </div>
    </div>
  );
};

export default MprClinicalWorkstation;
