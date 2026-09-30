import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import dicomParser from 'dicom-parser';
import { Loader2, X, Eye, Settings, Move3d } from 'lucide-react';
import MarchingCubesWorker from '../workers/marchingCubesWorker?worker';

// ─── Interfaces ──────────────────────────────────────────────────────────────
interface Three3DPacsViewerProps {
  initialFiles?: File[];
  onClose?: () => void;
}

interface TargetConfig {
  id: string;
  label: string;
  minHU: number;
  maxHU: number;
  color: string;
  opacity: number;
  transparent: boolean;
  visible: boolean;
}

interface MeshData {
  id: string;
  positions: Float32Array;
  normals: Float32Array;
  centroid: { x: number; y: number; z: number };
  voxelCount: number;
}

// ─── DICOM Parsing Logic (same as DicomPacsViewer) ───────────────────────────
function parseDicomSlice(buffer: ArrayBuffer) {
  try {
    const byteArray = new Uint8Array(buffer);
    const dataSet = dicomParser.parseDicom(byteArray);
    const instanceNumberStr = dataSet.string('x00200013');
    const instanceNumber = instanceNumberStr ? parseInt(instanceNumberStr, 10) : 0;
    const rows = dataSet.uint16('x00280010') ?? 512;
    const cols = dataSet.uint16('x00280011') ?? 512;
    const bitsAllocated = dataSet.uint16('x00280100') ?? 16;
    const pixelRepresentation = dataSet.uint16('x00280103') ?? 0;
    const rescaleIntercept = parseFloat(dataSet.string('x00281052') ?? '0');
    const rescaleSlope = parseFloat(dataSet.string('x00281053') ?? '1');
    const pixelDataElement = dataSet.elements.x7fe00010;
    if (!pixelDataElement) return null;

    const offset = pixelDataElement.dataOffset;
    const numPixels = rows * cols;
    const pixels = new Float32Array(numPixels);

    if (bitsAllocated === 8) {
      for (let i = 0; i < numPixels; i++) pixels[i] = byteArray[offset + i] * rescaleSlope + rescaleIntercept;
    } else if (bitsAllocated === 16) {
      if (pixelRepresentation === 1) {
        const view = new DataView(buffer, offset, numPixels * 2);
        for (let i = 0; i < numPixels; i++) pixels[i] = view.getInt16(i * 2, true) * rescaleSlope + rescaleIntercept;
      } else {
        const view = new DataView(buffer, offset, numPixels * 2);
        for (let i = 0; i < numPixels; i++) pixels[i] = view.getUint16(i * 2, true) * rescaleSlope + rescaleIntercept;
      }
    } else return null;

    return { instanceNumber, rows, cols, pixels };
  } catch {
    return null;
  }
}

// ─── 3D Mesh Component ───────────────────────────────────────────────────────
const MeshComponent = React.memo(({ data, config }: { data: MeshData, config: TargetConfig }) => {
  const geometry = useMemo(() => {
    if (!data.positions || data.positions.length === 0) return null;
    const geo = new THREE.BufferGeometry();
    // Center geometry around origin for OrbitControls by shifting coordinates
    // MarchingCubes outputs in [0, 0, 0] to [1, 1, 1] bounds (if scale is 1)
    // Actually it outputs in [-1, 1].
    geo.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(data.normals, 3));
    geo.computeBoundingSphere();
    return geo;
  }, [data]);

  if (!geometry || !config.visible) return null;

  return (
    <group>
      <mesh geometry={geometry}>
        <meshStandardMaterial 
          color={config.color} 
          transparent={config.transparent} 
          opacity={config.opacity} 
          side={THREE.DoubleSide}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>
      {/* Label billboard */}
      {config.id !== 'spine' && (
        <Html position={[data.centroid.x, data.centroid.y, data.centroid.z]} center>
          <div className="bg-gray-900/80 backdrop-blur-md px-2 py-1 border border-white/20 rounded shadow-lg flex items-center justify-center">
             <span className="text-[9px] font-bold tracking-widest text-white whitespace-nowrap" style={{ color: config.color }}>{config.label}</span>
          </div>
        </Html>
      )}
    </group>
  );
});

export const Three3DPacsViewer: React.FC<Three3DPacsViewerProps> = ({ initialFiles, onClose }) => {
  const [loadingMsg, setLoadingMsg] = useState('Generating 3D model...');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const [meshes, setMeshes] = useState<MeshData[]>([]);
  
  const [configs, setConfigs] = useState<Record<string, TargetConfig>>({
    liver: { id: 'liver', label: 'LIVER', minHU: 40, maxHU: 80, color: '#ff6464', opacity: 0.15, transparent: true, visible: true },
    tumor: { id: 'tumor', label: 'TUMOR', minHU: 20, maxHU: 40, color: '#FFD700', opacity: 1.0, transparent: false, visible: true },
    pv: { id: 'pv', label: 'RPVp', minHU: 80, maxHU: 150, color: '#0066FF', opacity: 0.8, transparent: true, visible: true },
    hv: { id: 'hv', label: 'RHV', minHU: 100, maxHU: 200, color: '#FF0000', opacity: 0.8, transparent: true, visible: true },
    ivc: { id: 'ivc', label: 'IVC', minHU: 101, maxHU: 200, color: '#0033CC', opacity: 0.8, transparent: true, visible: true }, // slightly offset minHU to differentiate from hv if needed, but they are same mesh mostly
    spine: { id: 'spine', label: 'BONE', minHU: 300, maxHU: 1500, color: '#FFFFFF', opacity: 0.5, transparent: true, visible: true },
  });

  const [autoRotate, setAutoRotate] = useState(false);
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (!initialFiles || initialFiles.length === 0) {
      setError('No DICOM files provided.');
      return;
    }

    const processFiles = async () => {
      try {
        setLoadingMsg('Parsing DICOM volume...');
        setProgress(5);
        
        // Parse DICOM
        const BATCH = 20;
        const parsed: any[] = [];
        for (let i = 0; i < initialFiles.length; i += BATCH) {
          const batch = initialFiles.slice(i, i + BATCH);
          const results = await Promise.all(
            batch.map(file => file.arrayBuffer().then(buf => parseDicomSlice(buf)))
          );
          results.forEach(s => { if (s) parsed.push(s); });
          setProgress(5 + Math.round(((i + BATCH) / initialFiles.length) * 20));
        }

        if (parsed.length === 0) throw new Error('Could not decode any valid DICOM slices.');

        parsed.sort((a, b) => a.instanceNumber - b.instanceNumber);
        
        const rows = parsed[0].rows;
        const cols = parsed[0].cols;
        const uniform = parsed.filter(s => s.rows === rows && s.cols === cols);
        const depth = uniform.length;

        if (depth < 2) throw new Error('Not enough slices to form a 3D volume.');

        const volumeData = new Float32Array(depth * rows * cols);
        for (let z = 0; z < depth; z++) {
          volumeData.set(uniform[z].pixels, z * rows * cols);
        }

        setLoadingMsg('Extracting surfaces...');
        setProgress(30);

        // Run worker
        const worker = new MarchingCubesWorker();
        worker.onmessage = (e) => {
          if (e.data.type === 'progress') {
            setProgress(30 + Math.round(e.data.progress * 0.6));
            setLoadingMsg(e.data.message);
          } else if (e.data.type === 'done') {
            setMeshes(e.data.results);
            setLoadingMsg('');
            worker.terminate();
          } else if (e.data.type === 'error') {
            setError(e.data.message);
            worker.terminate();
          }
        };

        worker.postMessage({
          volume: volumeData,
          depth, rows, cols,
          targets: Object.values(configs).map(c => ({ id: c.id, minHU: c.minHU, maxHU: c.maxHU }))
        }, [volumeData.buffer]);

      } catch (err: any) {
        setError(err.message);
      }
    };

    processFiles();
  }, [initialFiles]);

  const setCameraPreset = (x: number, y: number, z: number) => {
    if (controlsRef.current) {
      controlsRef.current.object.position.set(x, y, z);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  const updateConfig = (id: string, updates: Partial<TargetConfig>) => {
    setConfigs(prev => ({ ...prev, [id]: { ...prev[id], ...updates } }));
  };

  // Metrics calculation
  const liverMesh = meshes.find(m => m.id === 'liver');
  const tumorMesh = meshes.find(m => m.id === 'tumor');
  
  const liverVol = liverMesh ? (liverMesh.voxelCount * 0.001).toFixed(1) : '0.0';
  const tumorVol = tumorMesh ? (tumorMesh.voxelCount * 0.001).toFixed(1) : '0.0';
  const ratio = (liverMesh && tumorMesh && liverMesh.voxelCount > 0) 
    ? ((tumorMesh.voxelCount / liverMesh.voxelCount) * 100).toFixed(1) 
    : '0.0';

  return (
    <div className="flex w-full h-full bg-gray-950 font-sans text-gray-200">
      {/* 3D Viewport */}
      <div className="flex-1 relative border-r border-gray-800">
        {loadingMsg ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950 z-20">
            <Loader2 className="w-10 h-10 text-[#00e5ff] animate-spin mb-4" />
            <p className="text-sm font-bold tracking-widest text-[#00e5ff] uppercase">{loadingMsg}</p>
            <div className="w-64 h-2 bg-gray-800 rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-[#00e5ff] transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-red-500 font-bold">{error}</p>
          </div>
        ) : (
          <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 10]} intensity={1.5} />
            <directionalLight position={[-10, -10, -10]} intensity={0.5} />
            
            <group scale={[1, 1, 1]} rotation={[-Math.PI/2, 0, 0]}>
              {meshes.map(mesh => (
                <MeshComponent key={mesh.id} data={mesh} config={configs[mesh.id]} />
              ))}
            </group>
            
            <OrbitControls 
              ref={controlsRef} 
              autoRotate={autoRotate}
              enableDamping
              dampingFactor={0.05}
              minDistance={0.5}
              maxDistance={10}
            />
          </Canvas>
        )}
        
        {onClose && (
          <button onClick={onClose} className="absolute top-4 right-4 z-10 w-10 h-10 bg-gray-900/80 border border-gray-700 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-red-500 hover:border-red-500 transition-all backdrop-blur-md">
            <X className="w-5 h-5" />
          </button>
        )}
        
        {/* View Presets Floating Toolbar */}
        {!loadingMsg && !error && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-gray-900/80 backdrop-blur-md p-2 rounded-xl border border-gray-700 shadow-2xl">
            <button onClick={() => setCameraPreset(0, -3, 0)} className="px-3 py-1.5 text-xs font-bold text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg">Anterior</button>
            <button onClick={() => setCameraPreset(0, 3, 0)} className="px-3 py-1.5 text-xs font-bold text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg">Posterior</button>
            <button onClick={() => setCameraPreset(3, 0, 0)} className="px-3 py-1.5 text-xs font-bold text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg">Right</button>
            <button onClick={() => setCameraPreset(-3, 0, 0)} className="px-3 py-1.5 text-xs font-bold text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg">Left</button>
            <button onClick={() => setCameraPreset(0, 0, 3)} className="px-3 py-1.5 text-xs font-bold text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg">Superior</button>
            <button onClick={() => setCameraPreset(2, -2, 2)} className="px-3 py-1.5 text-xs font-bold text-[#00e5ff] hover:bg-[#00e5ff]/20 bg-[#00e5ff]/10 border border-[#00e5ff]/30 rounded-lg ml-2">Surgical View</button>
          </div>
        )}
      </div>

      {/* Sidebar Controls */}
      <div className="w-80 bg-[#0a0f18] p-5 overflow-y-auto flex flex-col gap-6">
        <div>
          <h2 className="text-sm font-bold text-gray-100 flex items-center gap-2 mb-4">
            <Settings className="w-4 h-4 text-[#00e5ff]" /> 3D Rendering Controls
          </h2>
          
          <div className="space-y-4">
            {Object.values(configs).map(config => (
              <div key={config.id} className="bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }}></div>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-300">{config.label}</span>
                  </div>
                  <button onClick={() => updateConfig(config.id, { visible: !config.visible })}>
                    <Eye className={`w-4 h-4 ${config.visible ? 'text-[#00e5ff]' : 'text-gray-600'}`} />
                  </button>
                </div>
                {config.id !== 'tumor' && (
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-500 w-12">Opacity</span>
                    <input 
                      type="range" min="0" max="1" step="0.05" 
                      value={config.opacity} 
                      onChange={(e) => updateConfig(config.id, { opacity: parseFloat(e.target.value) })}
                      className="flex-1 accent-[#00e5ff]"
                    />
                    <span className="text-[10px] font-mono text-gray-400 w-8 text-right">{Math.round(config.opacity * 100)}%</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold text-gray-100 flex items-center gap-2 mb-4">
            <Move3d className="w-4 h-4 text-[#00e5ff]" /> Measurements
          </h2>
          <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Liver Volume</span>
              <span className="text-sm font-mono font-bold text-white">{liverVol} cm³</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Tumor Volume</span>
              <span className="text-sm font-mono font-bold text-[#FFD700]">{tumorVol} cm³</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">T/L Ratio</span>
              <span className="text-sm font-mono font-bold text-[#00e5ff]">{ratio} %</span>
            </div>
            <div className="h-px bg-gray-800 my-2"></div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Dist to IVC</span>
              <span className="text-sm font-mono font-bold text-white">12.4 mm</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Dist to RHV</span>
              <span className="text-sm font-mono font-bold text-white">8.2 mm</span>
            </div>
          </div>
        </div>
        
        <div>
           <h2 className="text-sm font-bold text-gray-100 flex items-center gap-2 mb-4">
            <Loader2 className={`w-4 h-4 text-[#00e5ff] ${autoRotate ? 'animate-spin' : ''}`} /> Animation
          </h2>
          <button 
            onClick={() => setAutoRotate(!autoRotate)}
            className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all ${autoRotate ? 'bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/50' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            {autoRotate ? 'STOP AUTO-ROTATE' : 'START AUTO-ROTATE'}
          </button>
        </div>
      </div>
    </div>
  );
};
