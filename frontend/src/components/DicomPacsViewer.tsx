/**
 * DicomPacsViewer.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * HepatoAI — Clinical PACS Workstation (DICOM Folder Upload + MPR Viewer)
 *
 * Architecture:
 *   1. Doctor drops / selects a folder of .dcm files via react-dropzone
 *   2. Each file is read as ArrayBuffer and parsed with dicom-parser
 *   3. Slices are sorted by (0020,0013) Instance Number → valid Z order
 *   4. Pixel data is decoded (handles Uint8, Int16, Uint16) and normalized
 *   5. A contiguous Float32Array 3D volume is assembled in memory
 *   6. Three Canvas 2D panels render Axial / Coronal / Sagittal views
 *   7. Window/Level, Zoom (Ctrl+Scroll), and crosshair navigation are
 *      handled entirely on the main thread — no Web Workers needed
 *
 * npm install commands:
 *   npm install dicom-parser react-dropzone
 *   (lucide-react and Tailwind CSS are already present in this project)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useDropzone } from 'react-dropzone';
import dicomParser from 'dicom-parser';
import {
  Activity,
  ChevronDown,
  ChevronUp,
  CloudUpload,
  Contrast,
  Crosshair,
  LayoutGrid,
  Loader2,
  Maximize2,
  Move,
  RefreshCw,
  ScanLine,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DicomSlice {
  instanceNumber: number;
  rows: number;
  cols: number;
  /** Raw HU (Hounsfield Unit) pixel values */
  pixels: Float32Array;
}

interface Volume {
  data: Float32Array;   // flat [z * rows * cols] HU values
  depth: number;        // Z (number of slices)
  rows: number;         // Y (image height)
  cols: number;         // X (image width)
  sliceCount: number;
}

interface Coord { x: number; y: number; z: number }

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Parse a single DICOM file buffer → DicomSlice.
 * Handles Uint8 / Int16 / Uint16 pixel representations and applies
 * rescale slope/intercept to convert stored values → HU.
 */
function parseDicomSlice(buffer: ArrayBuffer): DicomSlice | null {
  try {
    const byteArray = new Uint8Array(buffer);
    const dataSet = dicomParser.parseDicom(byteArray);

    // (0020,0013) Instance Number — used for Z-ordering
    const instanceNumberStr = dataSet.string('x00200013');
    const instanceNumber = instanceNumberStr ? parseInt(instanceNumberStr, 10) : 0;

    const rows = dataSet.uint16('x00280010') ?? 512;
    const cols = dataSet.uint16('x00280011') ?? 512;
    const bitsAllocated = dataSet.uint16('x00280100') ?? 16;
    const pixelRepresentation = dataSet.uint16('x00280103') ?? 0; // 0=unsigned, 1=signed
    const rescaleIntercept = parseFloat(dataSet.string('x00281052') ?? '0');
    const rescaleSlope = parseFloat(dataSet.string('x00281053') ?? '1');

    // Pixel Data element (7FE0,0010)
    const pixelDataElement = dataSet.elements.x7fe00010;
    if (!pixelDataElement) return null;

    const offset = pixelDataElement.dataOffset;
    const numPixels = rows * cols;
    const pixels = new Float32Array(numPixels);

    if (bitsAllocated === 8) {
      for (let i = 0; i < numPixels; i++) {
        pixels[i] = byteArray[offset + i] * rescaleSlope + rescaleIntercept;
      }
    } else if (bitsAllocated === 16) {
      if (pixelRepresentation === 1) {
        // Signed Int16
        const view = new DataView(buffer, offset, numPixels * 2);
        for (let i = 0; i < numPixels; i++) {
          pixels[i] = view.getInt16(i * 2, true) * rescaleSlope + rescaleIntercept;
        }
      } else {
        // Unsigned Uint16
        const view = new DataView(buffer, offset, numPixels * 2);
        for (let i = 0; i < numPixels; i++) {
          pixels[i] = view.getUint16(i * 2, true) * rescaleSlope + rescaleIntercept;
        }
      }
    } else {
      return null; // Unsupported bit depth
    }

    return { instanceNumber, rows, cols, pixels };
  } catch {
    return null;
  }
}

/**
 * Apply Window / Level to a HU value → [0, 255] gray byte.
 * Standard DICOM sigmoid mapping.
 */
function applyWindowLevel(hu: number, wc: number, ww: number): number {
  const lower = wc - ww / 2;
  const upper = wc + ww / 2;
  if (hu <= lower) return 0;
  if (hu >= upper) return 255;
  return Math.round(((hu - lower) / ww) * 255);
}

// ─── Sub-component: Single MPR Panel ─────────────────────────────────────────

interface MprPanelProps {
  label: string;
  plane: 'Axial' | 'Coronal' | 'Sagittal';
  volume: Volume;
  coord: Coord;
  windowCenter: number;
  windowWidth: number;
  onCoordChange: (c: Partial<Coord>) => void;
  zoom: number;
  onZoomChange: (z: number) => void;
}

const MprPanel: React.FC<MprPanelProps> = ({
  label, plane, volume, coord, windowCenter, windowWidth,
  onCoordChange, zoom, onZoomChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { data, depth, rows, cols } = volume;

  // Source image dimensions for this plane
  const srcW = plane === 'Sagittal' ? depth : cols;
  const srcH = plane === 'Axial' ? rows : depth;

  // Re-render whenever any dependency changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Render at a fixed high-quality internal resolution
    const INTERNAL = 512;
    canvas.width = INTERNAL;
    canvas.height = INTERNAL;

    const imageData = ctx.createImageData(srcW, srcH);
    const d = imageData.data;

    for (let py = 0; py < srcH; py++) {
      for (let px = 0; px < srcW; px++) {
        let mapX: number, mapY: number, mapZ: number;

        if (plane === 'Axial') {
          mapX = px; mapY = py; mapZ = coord.z;
        } else if (plane === 'Coronal') {
          mapX = px; mapY = coord.y; mapZ = py;
        } else {
          // Sagittal: X axis = Z (depth), Y axis = Y (rows)
          mapX = coord.x; mapY = py; mapZ = px;
        }

        // Clamp to volume bounds
        mapX = Math.max(0, Math.min(cols - 1, mapX));
        mapY = Math.max(0, Math.min(rows - 1, mapY));
        mapZ = Math.max(0, Math.min(depth - 1, mapZ));

        const flatIdx = mapZ * rows * cols + mapY * cols + mapX;
        const hu = data[flatIdx] ?? 0;
        const gray = applyWindowLevel(hu, windowCenter, windowWidth);

        const i = (py * srcW + px) * 4;
        d[i] = gray; d[i + 1] = gray; d[i + 2] = gray; d[i + 3] = 255;
      }
    }

    // Blit through an OffscreenCanvas for zoom/pan support
    const off = new OffscreenCanvas(srcW, srcH);
    const offCtx = off.getContext('2d')!;
    offCtx.putImageData(imageData, 0, 0);

    const viewW = srcW / zoom;
    const viewH = srcH / zoom;

    // Centre the viewport around the current crosshair
    const crossSrcX = plane === 'Sagittal' ? coord.z : coord.x;
    const crossSrcY = plane === 'Axial'    ? coord.y : (plane === 'Coronal' ? coord.z : coord.y);

    let panX = crossSrcX - viewW / 2;
    let panY = crossSrcY - viewH / 2;
    panX = Math.max(0, Math.min(srcW - viewW, panX));
    panY = Math.max(0, Math.min(srcH - viewH, panY));

    ctx.clearRect(0, 0, INTERNAL, INTERNAL);
    ctx.imageSmoothingEnabled = zoom < 3;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(off, panX, panY, viewW, viewH, 0, 0, INTERNAL, INTERNAL);

    // Draw crosshair overlay
    const cxPx = (crossSrcX - panX) / viewW * INTERNAL;
    const cyPx = (crossSrcY - panY) / viewH * INTERNAL;

    ctx.save();
    ctx.strokeStyle = 'rgba(0, 210, 255, 0.80)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(cxPx, 0);    ctx.lineTo(cxPx, INTERNAL);
    ctx.moveTo(0, cyPx);    ctx.lineTo(INTERNAL, cyPx);
    ctx.stroke();
    ctx.restore();

  }, [volume, coord, windowCenter, windowWidth, zoom, plane, srcW, srcH, cols, rows, depth]);

  // Click → set crosshair at that image coordinate
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const fracX = (e.clientX - rect.left) / rect.width;
    const fracY = (e.clientY - rect.top) / rect.height;

    const viewW = srcW / zoom;
    const viewH = srcH / zoom;
    const crossSrcX = plane === 'Sagittal' ? coord.z : coord.x;
    const crossSrcY = plane === 'Axial'    ? coord.y : (plane === 'Coronal' ? coord.z : coord.y);

    let panX = crossSrcX - viewW / 2;
    let panY = crossSrcY - viewH / 2;
    panX = Math.max(0, Math.min(srcW - viewW, panX));
    panY = Math.max(0, Math.min(srcH - viewH, panY));

    const imgX = Math.round(panX + fracX * viewW);
    const imgY = Math.round(panY + fracY * viewH);

    if (plane === 'Axial') {
      onCoordChange({
        x: Math.max(0, Math.min(cols - 1, imgX)),
        y: Math.max(0, Math.min(rows - 1, imgY)),
      });
    } else if (plane === 'Coronal') {
      onCoordChange({
        x: Math.max(0, Math.min(cols - 1, imgX)),
        z: Math.max(0, Math.min(depth - 1, imgY)),
      });
    } else {
      onCoordChange({
        z: Math.max(0, Math.min(depth - 1, imgX)),
        y: Math.max(0, Math.min(rows - 1, imgY)),
      });
    }
  }, [coord, srcW, srcH, zoom, plane, onCoordChange, cols, rows, depth]);

  // Wheel: Ctrl+Scroll = zoom, plain scroll = advance perpendicular slice
  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      onZoomChange(Math.max(1, Math.min(8, zoom - e.deltaY * 0.005)));
    } else {
      const delta = e.deltaY > 0 ? 1 : -1;
      if (plane === 'Axial') {
        onCoordChange({ z: Math.max(0, Math.min(depth - 1, coord.z + delta)) });
      } else if (plane === 'Coronal') {
        onCoordChange({ y: Math.max(0, Math.min(rows - 1, coord.y + delta)) });
      } else {
        onCoordChange({ x: Math.max(0, Math.min(cols - 1, coord.x + delta)) });
      }
    }
  }, [zoom, plane, coord, depth, rows, cols, onZoomChange, onCoordChange]);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const sliceLabel = plane === 'Axial'
    ? `Z: ${coord.z + 1} / ${depth}`
    : plane === 'Coronal'
    ? `Y: ${coord.y + 1} / ${rows}`
    : `X: ${coord.x + 1} / ${cols}`;

  const accentColor = {
    Axial:    'text-sky-400 border-sky-500/30',
    Coronal:  'text-emerald-400 border-emerald-500/30',
    Sagittal: 'text-amber-400 border-amber-500/30',
  }[plane];

  return (
    <div className={`relative bg-black border ${accentColor.split(' ')[1]} rounded-xl overflow-hidden flex flex-col group`}>
      {/* Panel header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-950 border-b border-white/5 select-none flex-shrink-0">
        <div className="flex items-center gap-2">
          <ScanLine className={`w-3.5 h-3.5 ${accentColor.split(' ')[0]}`} />
          <span className={`text-xs font-bold tracking-widest uppercase ${accentColor.split(' ')[0]}`}>{label}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-white/50 font-mono">{sliceLabel}</span>
          <span className="text-[10px] text-white/30 font-mono">{zoom.toFixed(1)}×</span>
        </div>
      </div>

      {/* Main canvas */}
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className="w-full flex-1 cursor-crosshair block"
        style={{ imageRendering: 'pixelated' }}
      />

      {/* Zoom buttons (visible on hover) */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
        <button
          onClick={() => onZoomChange(Math.min(8, zoom + 0.5))}
          className="w-6 h-6 flex items-center justify-center rounded bg-black/70 border border-white/20 text-white/60 hover:text-sky-400 hover:border-sky-400/50 transition-colors"
        >
          <ZoomIn className="w-3 h-3" />
        </button>
        <button
          onClick={() => onZoomChange(Math.max(1, zoom - 0.5))}
          className="w-6 h-6 flex items-center justify-center rounded bg-black/70 border border-white/20 text-white/60 hover:text-sky-400 hover:border-sky-400/50 transition-colors"
        >
          <ZoomOut className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

// ─── Slider Sub-component ─────────────────────────────────────────────────────

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  accentClass: string;
  displayValue: string;
}

const SliderControl: React.FC<SliderControlProps> = ({
  label, value, min, max, onChange, accentClass, displayValue,
}) => (
  <div className="mb-3">
    <div className="flex justify-between items-center mb-1">
      <span className="text-[10px] text-gray-500 font-semibold">{label}</span>
      <span className="text-[10px] text-gray-700 font-mono font-bold">{displayValue}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className={`w-full h-1.5 rounded-full outline-none appearance-none bg-gray-200 cursor-pointer ${accentClass}`}
    />
  </div>
);

// ─── Zoom Row Sub-component ───────────────────────────────────────────────────

interface ZoomRowProps {
  label: string;
  zoom: number;
  onZoom: (z: number) => void;
}

const ZoomRow: React.FC<ZoomRowProps> = ({ label, zoom, onZoom }) => (
  <div className="flex items-center gap-2 mb-2">
    <span className="text-[10px] text-gray-500 font-semibold w-14 flex-shrink-0">{label}</span>
    <button
      onClick={() => onZoom(Math.max(1, zoom - 0.5))}
      className="w-5 h-5 rounded flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
    >
      <ChevronDown className="w-3 h-3" />
    </button>
    <span className="text-[10px] font-mono font-bold text-gray-700 w-8 text-center">{zoom.toFixed(1)}×</span>
    <button
      onClick={() => onZoom(Math.min(8, zoom + 0.5))}
      className="w-5 h-5 rounded flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
    >
      <ChevronUp className="w-3 h-3" />
    </button>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const DicomPacsViewer: React.FC<{ initialFiles?: File[]; onClose?: () => void }> = ({ initialFiles, onClose }) => {
  // ── Volume state ──
  const [volume, setVolume] = useState<Volume | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fileCount, setFileCount] = useState(0);

  // ── PACS interaction state ──
  const [coord, setCoord] = useState<Coord>({ x: 0, y: 0, z: 0 });

  // Window / Level — default: Abdomen soft-tissue
  const [windowCenter, setWindowCenter] = useState(40);
  const [windowWidth, setWindowWidth]   = useState(400);

  // Per-plane zoom
  const [zoomAxial,    setZoomAxial]    = useState(1);
  const [zoomCoronal,  setZoomCoronal]  = useState(1);
  const [zoomSagittal, setZoomSagittal] = useState(1);

  // Active tool indicator (visual only)
  const [activeTool, setActiveTool] = useState<'crosshair' | 'wl' | 'zoom' | 'pan'>('crosshair');

  const handleCoordChange = useCallback((c: Partial<Coord>) => {
    setCoord(prev => ({ ...prev, ...c }));
  }, []);

  // ── W/L Presets ──────────────────────────────────────────────────────────
  const wlPresets = useMemo(() => [
    { label: 'Abdomen', wc: 40,   ww: 400  },
    { label: 'Liver',   wc: 60,   ww: 150  },
    { label: 'Lung',    wc: -600, ww: 1500 },
    { label: 'Bone',    wc: 400,  ww: 2000 },
    { label: 'Brain',   wc: 40,   ww: 80   },
  ], []);

  // ── Folder Upload & DICOM Parsing ────────────────────────────────────────

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    setVolume(null);

    // Filter out system/hidden files
    const dicomFiles = acceptedFiles.filter(f =>
      f.size > 128 &&
      !f.name.startsWith('.') &&
      !f.name.toLowerCase().endsWith('.xml') &&
      !f.name.toLowerCase().endsWith('.txt') &&
      !f.name.toLowerCase().endsWith('.json')
    );

    if (dicomFiles.length === 0) {
      setError('No valid DICOM files found in the selected folder.');
      return;
    }

    setFileCount(dicomFiles.length);
    setIsLoading(true);
    setLoadProgress(0);

    try {
      // ── Step 1: Parse in batches of 20 to avoid memory pressure ──
      const BATCH = 20;
      const parsed: DicomSlice[] = [];

      for (let i = 0; i < dicomFiles.length; i += BATCH) {
        const batch = dicomFiles.slice(i, i + BATCH);
        const results = await Promise.all(
          batch.map(file => file.arrayBuffer().then(buf => parseDicomSlice(buf)))
        );
        results.forEach(s => { if (s) parsed.push(s); });
        setLoadProgress(Math.round(((i + BATCH) / dicomFiles.length) * 80));
      }

      if (parsed.length === 0) {
        throw new Error(
          'Could not decode any valid DICOM slices. ' +
          'Ensure files are uncompressed standard DICOMs.'
        );
      }

      // ── Step 2: Sort by Instance Number → correct anatomical Z order ──
      parsed.sort((a, b) => a.instanceNumber - b.instanceNumber);
      setLoadProgress(85);

      // ── Step 3: Validate uniform geometry and reject outlier slices ──
      const rows = parsed[0].rows;
      const cols = parsed[0].cols;
      const uniform = parsed.filter(s => s.rows === rows && s.cols === cols);
      const depth = uniform.length;

      if (depth < 2) {
        throw new Error(`Only ${depth} compatible slice(s) found — need ≥2 to form a volume.`);
      }

      setLoadProgress(90);

      // ── Step 4: Assemble 3D volume — Z × Y × X memory layout ──
      const volumeData = new Float32Array(depth * rows * cols);
      for (let z = 0; z < depth; z++) {
        volumeData.set(uniform[z].pixels, z * rows * cols);
      }

      setLoadProgress(100);

      const vol: Volume = { data: volumeData, depth, rows, cols, sliceCount: depth };
      setVolume(vol);

      // Centre the initial crosshair on the volume midpoint
      setCoord({
        x: Math.floor(cols  / 2),
        y: Math.floor(rows  / 2),
        z: Math.floor(depth / 2),
      });

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred while processing the DICOM files.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: false,
    noKeyboard: false,
  });

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0 && !volume && !isLoading) {
      onDrop(initialFiles);
    }
  }, [initialFiles, onDrop, volume, isLoading]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  useEffect(() => {
    if (!volume) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp')   setCoord(p => ({ ...p, z: Math.min(volume.depth - 1, p.z + 1) }));
      if (e.key === 'ArrowDown') setCoord(p => ({ ...p, z: Math.max(0,               p.z - 1) }));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [volume]);

  // ── Reset all state ───────────────────────────────────────────────────────

  const resetAll = () => {
    if (!volume) return;
    setCoord({ x: Math.floor(volume.cols / 2), y: Math.floor(volume.rows / 2), z: Math.floor(volume.depth / 2) });
    setZoomAxial(1); setZoomCoronal(1); setZoomSagittal(1);
    setWindowCenter(40); setWindowWidth(400);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col w-full h-full bg-gray-50 font-sans rounded-2xl overflow-hidden border border-gray-200 shadow-xl shadow-gray-200/60">

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100 shadow-sm z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-md shadow-sky-500/30 flex-shrink-0">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-800 tracking-tight leading-none">HepatoAI PACS</h1>
            <p className="text-[11px] text-gray-400 font-medium mt-0.5 uppercase tracking-wider">
              Clinical Imaging Workstation
            </p>
          </div>
          {/* Volume badge */}
          {volume && (
            <div className="ml-3 flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-3 py-1">
              <LayoutGrid className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-xs font-semibold whitespace-nowrap">
                {volume.sliceCount} slices · {volume.cols}×{volume.rows}×{volume.depth}
              </span>
            </div>
          )}
        </div>

        {/* Tool Selector + Reset */}
        <div className="flex items-center gap-2">
          {volume && (
            <>
              <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                {([
                  { id: 'crosshair' as const, Icon: Crosshair, label: 'Navigate' },
                  { id: 'wl'        as const, Icon: Contrast,  label: 'W/L'      },
                  { id: 'zoom'      as const, Icon: Maximize2, label: 'Zoom'     },
                  { id: 'pan'       as const, Icon: Move,      label: 'Pan'      },
                ]).map(({ id, Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTool(id)}
                    title={label}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTool === id
                        ? 'bg-white text-sky-600 shadow-sm border border-sky-100'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={resetAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all border border-gray-200"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-all shadow-sm"
            >
              Close
            </button>
          )}
        </div>
      </header>

      {/* ── BODY ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── SIDEBAR ─────────────────────────────────────────────────── */}
        {volume && (
          <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col gap-5 p-4 overflow-y-auto">

            {/* Slice Navigation */}
            <section>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <ScanLine className="w-3 h-3" /> Navigation
              </h3>
              <SliderControl
                label="Axial (Z)"
                value={coord.z}
                min={0}
                max={volume.depth - 1}
                onChange={z => setCoord(p => ({ ...p, z }))}
                accentClass="accent-sky-500"
                displayValue={`${coord.z + 1} / ${volume.depth}`}
              />
              <SliderControl
                label="Coronal (Y)"
                value={coord.y}
                min={0}
                max={volume.rows - 1}
                onChange={y => setCoord(p => ({ ...p, y }))}
                accentClass="accent-emerald-500"
                displayValue={`${coord.y + 1} / ${volume.rows}`}
              />
              <SliderControl
                label="Sagittal (X)"
                value={coord.x}
                min={0}
                max={volume.cols - 1}
                onChange={x => setCoord(p => ({ ...p, x }))}
                accentClass="accent-amber-500"
                displayValue={`${coord.x + 1} / ${volume.cols}`}
              />
            </section>

            {/* Window / Level */}
            <section>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Contrast className="w-3 h-3" /> Window / Level
              </h3>
              <SliderControl
                label="Window Center"
                value={windowCenter}
                min={-1024}
                max={3072}
                onChange={setWindowCenter}
                accentClass="accent-blue-500"
                displayValue={`${windowCenter} HU`}
              />
              <SliderControl
                label="Window Width"
                value={windowWidth}
                min={1}
                max={4000}
                onChange={setWindowWidth}
                accentClass="accent-purple-500"
                displayValue={`${windowWidth} HU`}
              />
              {/* Clinical presets */}
              <div className="mt-2">
                <p className="text-[10px] text-gray-400 font-semibold mb-1.5">Presets</p>
                <div className="grid grid-cols-2 gap-1">
                  {wlPresets.map(p => (
                    <button
                      key={p.label}
                      onClick={() => { setWindowCenter(p.wc); setWindowWidth(p.ww); }}
                      className={`text-[10px] font-semibold py-1 px-2 rounded-md border transition-all ${
                        windowCenter === p.wc && windowWidth === p.ww
                          ? 'bg-sky-50 border-sky-300 text-sky-700'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Per-panel zoom */}
            <section>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Maximize2 className="w-3 h-3" /> Zoom
              </h3>
              <ZoomRow label="Axial"    zoom={zoomAxial}    onZoom={setZoomAxial} />
              <ZoomRow label="Coronal"  zoom={zoomCoronal}  onZoom={setZoomCoronal} />
              <ZoomRow label="Sagittal" zoom={zoomSagittal} onZoom={setZoomSagittal} />
            </section>

            {/* Keyboard hint */}
            <div className="mt-auto bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-[10px] text-gray-500 leading-[1.6]">
              <p className="font-bold text-gray-600 mb-1">Keyboard Shortcuts</p>
              <p>↑ / ↓ — Axial slice</p>
              <p>Ctrl + Scroll — Zoom</p>
              <p>Scroll — Advance slice</p>
              <p>Click — Set crosshair</p>
            </div>
          </aside>
        )}

        {/* ── VIEWER CANVAS AREA ───────────────────────────────────────── */}
        <main className="flex-1 min-w-0 min-h-0 bg-gray-950 p-3 overflow-hidden">

          {/* Upload zone */}
          {!volume && !isLoading && (
            <div
              {...getRootProps()}
              className={`h-full flex flex-col items-center justify-center rounded-xl border-2 border-dashed cursor-pointer transition-all duration-300 ${
                isDragActive
                  ? 'border-sky-400 bg-sky-950/40 scale-[1.01]'
                  : 'border-gray-700 bg-gray-900/50 hover:border-gray-500 hover:bg-gray-900'
              }`}
            >
              {/* Inject folder selection attributes */}
              <input
                {...getInputProps()}
                {...{ webkitdirectory: 'true', directory: 'true' } as React.InputHTMLAttributes<HTMLInputElement>}
              />

              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 transition-all duration-300 ${
                isDragActive
                  ? 'bg-sky-500/20 border-2 border-sky-400'
                  : 'bg-gray-800 border-2 border-gray-700'
              }`}>
                <CloudUpload className={`w-9 h-9 transition-colors ${isDragActive ? 'text-sky-400' : 'text-gray-500'}`} />
              </div>

              <h2 className="text-white text-2xl font-bold mb-2">
                {isDragActive ? 'Release to Upload' : 'Upload CT Scan Folder'}
              </h2>
              <p className="text-gray-500 text-sm text-center max-w-sm leading-relaxed mb-6 px-4">
                Drag & drop a folder of DICOM slices (.dcm), or click to browse. Slices
                are automatically sorted by Instance Number and bundled into a 3D volume.
              </p>

              {error && (
                <div className="bg-red-950 border border-red-500/40 text-red-400 text-xs rounded-lg px-4 py-2 mb-4 max-w-sm text-center">
                  ⚠ {error}
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-gray-600">
                <span className="flex items-center gap-1.5">
                  <ScanLine className="w-3.5 h-3.5 text-sky-600" /> Axial MPR
                </span>
                <span className="text-gray-700">•</span>
                <span className="flex items-center gap-1.5">
                  <ScanLine className="w-3.5 h-3.5 text-emerald-600" /> Coronal MPR
                </span>
                <span className="text-gray-700">•</span>
                <span className="flex items-center gap-1.5">
                  <ScanLine className="w-3.5 h-3.5 text-amber-600" /> Sagittal MPR
                </span>
              </div>
            </div>
          )}

          {/* Loading spinner + progress bar */}
          {isLoading && (
            <div className="h-full flex flex-col items-center justify-center gap-5">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full border-4 border-sky-500/20 animate-pulse" />
                <div className="absolute inset-2 rounded-full border-4 border-sky-400 border-t-transparent animate-spin" />
                <Loader2
                  className="absolute inset-0 m-auto w-8 h-8 text-sky-500 animate-spin"
                  style={{ animationDirection: 'reverse' }}
                />
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-lg">Bundling 3D Volume</p>
                <p className="text-gray-500 text-sm mt-1">
                  Parsing DICOM metadata from {fileCount} slices…
                </p>
              </div>
              <div className="w-64 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-blue-500 transition-all duration-300 ease-out"
                  style={{ width: `${loadProgress}%` }}
                />
              </div>
              <p className="text-gray-600 text-xs font-mono">{loadProgress}%</p>
            </div>
          )}

          {/* MPR 2×2 grid */}
          {volume && !isLoading && (
            <div className="h-full grid grid-cols-2 grid-rows-2 gap-2">

              {/* Axial */}
              <MprPanel
                label="Axial"
                plane="Axial"
                volume={volume}
                coord={coord}
                windowCenter={windowCenter}
                windowWidth={windowWidth}
                onCoordChange={handleCoordChange}
                zoom={zoomAxial}
                onZoomChange={setZoomAxial}
              />

              {/* Coronal */}
              <MprPanel
                label="Coronal"
                plane="Coronal"
                volume={volume}
                coord={coord}
                windowCenter={windowCenter}
                windowWidth={windowWidth}
                onCoordChange={handleCoordChange}
                zoom={zoomCoronal}
                onZoomChange={setZoomCoronal}
              />

              {/* Sagittal */}
              <MprPanel
                label="Sagittal"
                plane="Sagittal"
                volume={volume}
                coord={coord}
                windowCenter={windowCenter}
                windowWidth={windowWidth}
                onCoordChange={handleCoordChange}
                zoom={zoomSagittal}
                onZoomChange={setZoomSagittal}
              />

              {/* 4th quadrant: Volume Info Panel */}
              <div className="bg-gray-900 border border-white/5 rounded-xl p-4 flex flex-col gap-3 overflow-hidden">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5 flex-shrink-0">
                  <Activity className="w-3 h-3" /> Volume Summary
                </h3>
                <div className="grid grid-cols-2 gap-2 flex-shrink-0">
                  {[
                    { label: 'Dimensions',   value: `${volume.cols} × ${volume.rows}` },
                    { label: 'Slices',       value: `${volume.sliceCount}` },
                    { label: 'Window Ctr.',  value: `${windowCenter} HU` },
                    { label: 'Window Wid.',  value: `${windowWidth} HU` },
                    { label: 'Axial Z',      value: `${coord.z + 1} / ${volume.depth}` },
                    { label: 'Zoom (Axl.)',  value: `${zoomAxial.toFixed(1)}×` },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-gray-800/60 rounded-lg px-3 py-2">
                      <p className="text-[9px] text-gray-600 font-semibold uppercase tracking-wider">{label}</p>
                      <p className="text-sm text-white font-bold font-mono mt-0.5 truncate">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Presets in info panel */}
                <div className="flex-shrink-0">
                  <p className="text-[9px] text-gray-600 uppercase tracking-wider font-bold mb-2">W/L Presets</p>
                  <div className="flex flex-wrap gap-1.5">
                    {wlPresets.map(p => (
                      <button
                        key={p.label}
                        onClick={() => { setWindowCenter(p.wc); setWindowWidth(p.ww); }}
                        className={`text-[10px] font-bold py-1 px-2.5 rounded-md border transition-all ${
                          windowCenter === p.wc && windowWidth === p.ww
                            ? 'bg-sky-500/20 border-sky-500/50 text-sky-400'
                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Load new study */}
                <button
                  onClick={() => { setVolume(null); setError(null); setLoadProgress(0); }}
                  className="mt-auto w-full py-2 text-xs font-semibold text-gray-500 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <CloudUpload className="w-3.5 h-3.5" /> Load New Study
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DicomPacsViewer;
