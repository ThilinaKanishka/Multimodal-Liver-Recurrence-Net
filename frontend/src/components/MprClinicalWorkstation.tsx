/**
 * MprClinicalWorkstation.tsx
 * ══════════════════════════════════════════════════════════════════════════════
 * HepatoAI — Full PACS-Style MPR Viewer (rebuilt from scratch)
 *
 * OPERATING MODES (auto-detected from props):
 *  A. DICOM Upload Mode  — doctor uploads a folder of .dcm files; the component
 *     parses them with dicom-parser, sorts by ImagePositionPatient[2] (Z), builds
 *     a 3D HU volume, and renders real Axial / Coronal / Sagittal views.
 *
 *  B. AI-Result Mode     — parent passes base64Matrix (Grad-CAM) + optional
 *     dicomBase64Matrix (backend CT bytes) + dimensions. The 3D volume is decoded
 *     from those buffers and displayed with heatmap overlay.
 *
 *  C. Mock Mode          — base64Matrix === "MOCK" → synthetic procedural anatomy
 *     used in patient history cards (App.tsx).
 *
 * PRESERVED PROP INTERFACE (unchanged):
 *   base64Matrix        : string
 *   dicomBase64Matrix?  : string
 *   dimensions          : [Depth, Height, Width]
 *   tumorTarget?        : { found, x, y, z }
 *   patientInfo?        : { name, id }
 *   longitudinalMode?   : 'baseline' | 'followup'
 *
 * REQUIRED PACKAGES (already installed):
 *   dicom-parser   react-dropzone   lucide-react   tailwindcss
 * ══════════════════════════════════════════════════════════════════════════════
 */

import React, {
  useCallback, useEffect, useRef, useState,
} from 'react';
import { useDropzone } from 'react-dropzone';
import dicomParser from 'dicom-parser';
import {
  Activity, CloudUpload, Contrast, Crosshair, Loader2,
  RefreshCw, ScanLine, Target, ZoomIn, ZoomOut,
} from 'lucide-react';

// ─── Prop Interface (must match all callers) ──────────────────────────────────

interface MprClinicalWorkstationProps {
  base64Matrix: string;
  dicomBase64Matrix?: string;
  dimensions: [number, number, number]; // [Depth (Z), Height (Y), Width (X)]
  tumorTarget?: { found: boolean; x: number; y: number; z: number };
  patientInfo?: { name: string; id: string };
  longitudinalMode?: 'baseline' | 'followup';
  localDicomFiles?: File[];
}

// ─── Internal Types ───────────────────────────────────────────────────────────

type WLPreset = { label: string; wc: number; ww: number };
type LUTType  = 'Jet' | 'Viridis' | 'Magma' | 'Plasma';
type Plane    = 'Axial' | 'Coronal' | 'Sagittal';
interface Coord { x: number; y: number; z: number }
interface PanOffset { x: number; y: number }

interface DicomMeta {
  instanceNumber: number;
  imagePositionZ: number | null;
  rows: number;
  cols: number;
  pixelSpacingRow: number;
  pixelSpacingCol: number;
  sliceThickness: number;
  rescaleSlope: number;
  rescaleIntercept: number;
  windowCenter: number;
  windowWidth: number;
  bitsAllocated: number;
  pixelRepresentation: number;
  dataOffset: number;
  dataLength: number;
  byteArray: Uint8Array;
  filename: string;
  flipX: boolean;
  flipY: boolean;
}

// ─── DICOM Parsing Helpers ────────────────────────────────────────────────────

function parseDicomMeta(buffer: ArrayBuffer, filename: string): DicomMeta | null {
  try {
    const byteArray = new Uint8Array(buffer);
    const ds = dicomParser.parseDicom(byteArray);

    const pixelEl = ds.elements.x7fe00010;
    if (!pixelEl) return null; // No pixel data → skip

    // (0020,0013) Instance Number
    const instanceStr = ds.string('x00200013');
    const instanceNumber = instanceStr ? parseInt(instanceStr, 10) : 0;

    // (0020,0032) ImagePositionPatient → Z is index [2]
    let imagePositionZ: number | null = null;
    try {
      const ippStr = ds.string('x00200032');
      if (ippStr) {
        const parts = ippStr.split('\\');
        if (parts.length >= 3) imagePositionZ = parseFloat(parts[2]);
      }
    } catch { /* not present */ }

    const rows  = ds.uint16('x00280010') ?? 512;
    const cols  = ds.uint16('x00280011') ?? 512;
    const bitsAllocated       = ds.uint16('x00280100') ?? 16;
    const pixelRepresentation = ds.uint16('x00280103') ?? 0;

    // (0028,0030) PixelSpacing: "rowSpacing\colSpacing" in mm
    let pixelSpacingRow = 1.0, pixelSpacingCol = 1.0;
    try {
      const psStr = ds.string('x00280030');
      if (psStr) {
        const parts = psStr.split('\\');
        if (parts.length >= 2) {
          pixelSpacingRow = parseFloat(parts[0]);
          pixelSpacingCol = parseFloat(parts[1]);
        } else if (parts.length === 1) {
          pixelSpacingRow = pixelSpacingCol = parseFloat(parts[0]);
        }
      }
    } catch { /* not present */ }

    // (0018,0050) SliceThickness
    let sliceThickness = 1.0;
    try {
      const st = ds.string('x00180050');
      if (st) sliceThickness = parseFloat(st);
    } catch { /* ok */ }

    // (0028,1052/1053) Rescale
    const rescaleInterceptStr = ds.string('x00281052');
    const rescaleSlopeStr     = ds.string('x00281053');
    const rescaleIntercept    = rescaleInterceptStr ? parseFloat(rescaleInterceptStr) : 0;
    const rescaleSlope        = rescaleSlopeStr     ? parseFloat(rescaleSlopeStr)     : 1;

    // (0028,1050/1051) Window Center / Width (may be multi-value)
    let windowCenter = 40, windowWidth = 400;
    try {
      const wcStr = ds.string('x00281050'); if (wcStr) windowCenter = parseFloat(wcStr.split('\\')[0]);
      const wwStr = ds.string('x00281051'); if (wwStr) windowWidth  = parseFloat(wwStr.split('\\')[0]);
    } catch { /* not present */ }

    // (0020,0037) ImageOrientationPatient
    let flipX = false;
    let flipY = false;
    try {
      const iopStr = ds.string('x00200037');
      if (iopStr) {
        const parts = iopStr.split('\\').map(parseFloat);
        if (parts.length >= 6) {
          if (parts[0] < 0) flipX = true;
          if (parts[4] < 0) flipY = true;
        }
      }
    } catch { /* not present */ }

    return {
      instanceNumber, imagePositionZ, rows, cols,
      pixelSpacingRow, pixelSpacingCol, sliceThickness,
      rescaleSlope, rescaleIntercept, windowCenter, windowWidth,
      bitsAllocated, pixelRepresentation,
      dataOffset: pixelEl.dataOffset,
      dataLength: pixelEl.length,
      byteArray, filename, flipX, flipY
    };
  } catch {
    return null;
  }
}

/** Decode raw pixel bytes → Float32Array of HU values */
function decodePixels(meta: DicomMeta): Float32Array {
  const { rows, cols, bitsAllocated, pixelRepresentation,
          rescaleSlope, rescaleIntercept, dataOffset, dataLength, byteArray, flipX, flipY } = meta;
  const n = rows * cols;
  const hu = new Float32Array(n);

  if (bitsAllocated === 8) {
    for (let py = 0; py < rows; py++) {
      for (let px = 0; px < cols; px++) {
        const srcX = flipX ? cols - 1 - px : px;
        const srcY = flipY ? rows - 1 - py : py;
        const srcIdx = srcY * cols + srcX;
        const dstIdx = py * cols + px;
        hu[dstIdx] = byteArray[dataOffset + srcIdx] * rescaleSlope + rescaleIntercept;
      }
    }
  } else if (bitsAllocated === 16) {
    // Use DataView for correct endianness (DICOM is always little-endian)
    const dv = new DataView(byteArray.buffer, byteArray.byteOffset + dataOffset,
      Math.min(dataLength, n * 2));
    const isSigned = pixelRepresentation === 1;
    for (let py = 0; py < rows; py++) {
      for (let px = 0; px < cols; px++) {
        const srcX = flipX ? cols - 1 - px : px;
        const srcY = flipY ? rows - 1 - py : py;
        const srcIdx = srcY * cols + srcX;
        const dstIdx = py * cols + px;
        
        const offset = srcIdx * 2;
        if (offset + 2 > dv.byteLength) continue;
        const raw = isSigned ? dv.getInt16(offset, true) : dv.getUint16(offset, true);
        hu[dstIdx] = raw * rescaleSlope + rescaleIntercept;
      }
    }
  }
  return hu;
}

// ─── Window / Level ───────────────────────────────────────────────────────────

const WL_PRESETS: WLPreset[] = [
  { label: 'LIVER',        wc: 30,   ww: 150  },
  { label: 'SOFT TISSUE',  wc: 40,   ww: 400  },
  { label: 'BONE',         wc: 400,  ww: 2000 },
  { label: 'LUNG',         wc: -600, ww: 1500 },
  { label: 'BRAIN',        wc: 40,   ww: 80   },
];

/** Map a HU value → [0, 255] gray byte using DICOM standard W/L formula */
function applyWL(hu: number, wc: number, ww: number): number {
  // DICOM PS3.3 C.11.2.1.2: standard linear VOI LUT
  const val = ((hu - (wc - 0.5)) / (ww - 1)) + 0.5;
  if (val <= 0) return 0;
  if (val >= 1) return 255;
  return Math.round(val * 255);
}

// ─── Heatmap / LUT ───────────────────────────────────────────────────────────

function lutColor(v: number, lut: LUTType): [number, number, number] {
  v = Math.max(0, Math.min(1, v));
  switch (lut) {
    case 'Jet':
      if (v >= 0.75) { const t = (v - 0.75) * 4; return [255, Math.round(255 * (1 - t)), 0]; }
      if (v >= 0.5)  { const t = (v - 0.5)  * 4; return [Math.round(255 * t), 255, 0]; }
      if (v >= 0.25) { const t = (v - 0.25) * 4; return [0, 255, Math.round(255 * (1 - t))]; }
      return [0, Math.round(255 * v * 4), 255];
    case 'Viridis': return [Math.round(v * 253), Math.round(v * 231), Math.round(36 + v * 219)];
    case 'Magma':   return [Math.round(v * 252), Math.round(v * 78 * v), Math.round(164 - v * 100)];
    case 'Plasma':  return [Math.round(v * 240), Math.round(v * 120 * v), Math.round(33 + v * 220)];
    default:        return [0, 0, 0];
  }
}

// ─── Synthetic CT Anatomy (Mock Mode) ────────────────────────────────────────

function generateMockHU(
  mapX: number, mapY: number, mapZ: number,
  Width: number, Height: number, Depth: number,
  tumorTarget?: { found: boolean; x: number; y: number; z: number },
  longitudinalMode?: string,
): number {
  const cx = Width / 2.0, cy = Height / 2.0, cz = Depth / 2.0;
  const nx = (mapX - cx) / cx, ny = (mapY - cy) / cy, nz = (mapZ - cz) / cz;
  const warp1 = Math.sin(ny * 8 + nz * 4) * Math.cos(nx * 8) * 0.08;
  const warp2 = Math.sin(nx * 12) * Math.sin(ny * 12) * 0.03;
  const wnx = nx + warp1, wny = ny + warp2, wnz = nz + warp1 * 0.5;

  const bodyShape = (wnx * wnx) / 0.8 + (wny * wny) / 0.6 + (wnz * wnz) / 0.9;
  if (bodyShape > 1.0) return -1000; // Air

  let huVal = 35 + Math.sin(mapX * 0.8) * Math.cos(mapY * 0.8) * 12;

  // Spine
  const spineShape = (wnx * wnx) / 0.03 + Math.pow(wny - 0.5, 2) / 0.06;
  if (spineShape < 1.0) { huVal = spineShape < 0.4 ? 200 + Math.random() * 40 : 700 + Math.random() * 150; }

  // Liver
  const liverShape = Math.pow(wnx + 0.3, 2) / 0.35 + Math.pow(wny + 0.05, 2) / 0.25 + (wnz * wnz) / 0.5;
  if (liverShape < 1.0) {
    huVal = -30 + Math.sin(mapX * 1.5) * Math.cos(mapY * 1.5) * 8;
    if (Math.sin(wnx * 20 + wny * 10) * Math.cos(wny * 15) > 0.8) huVal -= 45;
    // Tumor void
    if (tumorTarget?.found) {
      const dx = mapX - tumorTarget.x, dy = mapY - tumorTarget.y, dz = mapZ - tumorTarget.z;
      const d = Math.sqrt(dz * dz * 2 + dy * dy + dx * dx);
      const r = longitudinalMode === 'baseline' ? 18 : longitudinalMode === 'followup' ? 8 : 14;
      if (d < r) { huVal = d > r - 2 ? 120 + Math.random() * 30 : -80 + Math.random() * 15; }
    }
  }

  // Aorta / IVC
  const aortaDist = Math.sqrt(Math.pow(wnx + 0.05, 2) + Math.pow(wny - 0.25, 2));
  const ivcDist   = Math.sqrt(Math.pow(wnx - 0.10, 2) + Math.pow(wny - 0.20, 2));
  if (aortaDist < 0.05 || ivcDist < 0.06) huVal = 120 + Math.random() * 15;

  // Stomach (air)
  const stomachShape = Math.pow(wnx - 0.4, 2) / 0.1 + Math.pow(wny + 0.1, 2) / 0.15 + Math.pow(wnz - 0.1, 2) / 0.2;
  if (stomachShape < 1.0) huVal = stomachShape > 0.7 ? 20 + Math.sin(mapX * 3) * 20 : -900;

  // Subcutaneous fat at body edge
  if (bodyShape > 0.85) huVal = bodyShape > 0.98 ? 50 : -120 + Math.random() * 15;

  return huVal;
}

// ─── Helper: get source image dimensions for each plane ──────────────────────

function getPlaneSourceDims(plane: Plane, depth: number, rows: number, cols: number) {
  switch (plane) {
    case 'Axial':    return { srcW: cols,  srcH: rows  }; // XY
    case 'Coronal':  return { srcW: cols,  srcH: depth }; // XZ
    case 'Sagittal': return { srcW: rows,  srcH: depth }; // YZ
  }
}

// ─── Single MPR Canvas Panel ──────────────────────────────────────────────────

interface MprPanelProps {
  plane: Plane;
  volume: Float32Array;
  depth: number; rows: number; cols: number;
  spacingX: number; spacingY: number; spacingZ: number;
  coord: Coord;
  wc: number; ww: number;
  heatmapVolume: Float32Array | null;
  heatmapOpacity: number;
  lut: LUTType;
  tumorTarget?: { found: boolean; x: number; y: number; z: number };
  zoom: number;
  pan: PanOffset;
  onZoomChange: (z: number) => void;
  onPanChange: (p: PanOffset) => void;
  onCoordChange: (c: Partial<Coord>) => void;
  isMockMode: boolean;
  longitudinalMode?: string;
}

const CANVAS_SIZE = 512; // Internal canvas resolution

const MprPanel: React.FC<MprPanelProps> = ({
  plane, volume, depth, rows, cols,
  spacingX, spacingY, spacingZ,
  coord, wc, ww, heatmapVolume, heatmapOpacity, lut,
  tumorTarget, zoom, pan, onZoomChange, onPanChange, onCoordChange,
  isMockMode, longitudinalMode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef<{ x: number; y: number } | null>(null);
  const animFrameRef = useRef<number>(0);

  const { srcW, srcH } = getPlaneSourceDims(plane, depth, rows, cols);

  // ── Compute the visible viewport and canvas rendering metrics ──
  const getRenderMetrics = useCallback(() => {
    const viewW = srcW / zoom;
    const viewH = srcH / zoom;

    let crossSrcX: number, crossSrcY: number;
    if (plane === 'Axial')         { crossSrcX = coord.x; crossSrcY = coord.y; }
    else if (plane === 'Coronal')  { crossSrcX = coord.x; crossSrcY = coord.z; }
    else /* Sagittal */            { crossSrcX = coord.y; crossSrcY = coord.z; }

    let panX = crossSrcX - viewW / 2 + pan.x;
    let panY = crossSrcY - viewH / 2 + pan.y;
    panX = Math.max(0, Math.min(srcW - viewW, panX));
    panY = Math.max(0, Math.min(srcH - viewH, panY));

    let physW = viewW, physH = viewH;
    if (plane === 'Axial') {
       physW = viewW * spacingX;
       physH = viewH * spacingY;
    } else if (plane === 'Coronal') {
       physW = viewW * spacingX;
       physH = viewH * spacingZ;
    } else { // Sagittal
       physW = viewW * spacingY;
       physH = viewH * spacingZ;
    }

    const scale = Math.min(CANVAS_SIZE / physW, CANVAS_SIZE / physH);
    const drawW = physW * scale;
    const drawH = physH * scale;
    const drawX = (CANVAS_SIZE - drawW) / 2;
    const drawY = (CANVAS_SIZE - drawH) / 2;

    return { viewW, viewH, panX, panY, drawX, drawY, drawW, drawH, scale };
  }, [srcW, srcH, zoom, plane, coord, pan, spacingX, spacingY, spacingZ]);

  // ── Render the slice to canvas ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Cancel any pending animation frame
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    animFrameRef.current = requestAnimationFrame(() => {
      canvas.width  = CANVAS_SIZE;
      canvas.height = CANVAS_SIZE;

      // Create the source-size image
      const imgData = ctx.createImageData(srcW, srcH);
      const d = imgData.data;

      for (let py = 0; py < srcH; py++) {
        for (let px = 0; px < srcW; px++) {
          let mapX: number, mapY: number, mapZ: number;

          if (plane === 'Axial') {
            // Axial (XY): image(px=X col, py=Y row), fixed Z
            mapX = px; mapY = py; mapZ = coord.z;
          } else if (plane === 'Coronal') {
            // Coronal (XZ): image(px=X col, py=Z depth), fixed Y
            mapX = px; mapY = coord.y; mapZ = py;
          } else {
            // Sagittal (YZ): image(px=Y row, py=Z depth), fixed X
            mapX = coord.x; mapY = px; mapZ = py;
          }

          mapX = Math.max(0, Math.min(cols  - 1, mapX));
          mapY = Math.max(0, Math.min(rows  - 1, mapY));
          mapZ = Math.max(0, Math.min(depth - 1, mapZ));

          // volume layout: volume[z * rows * cols + y * cols + x]
          const flatIdx = mapZ * rows * cols + mapY * cols + mapX;

          // ── CT pixel ──
          let hu: number;
          if (isMockMode) {
            hu = generateMockHU(mapX, mapY, mapZ, cols, rows, depth, tumorTarget, longitudinalMode);
          } else {
            hu = volume[flatIdx] ?? 0;
          }
          const gray = applyWL(hu, wc, ww);

          // ── Heatmap overlay ──
          let r = gray, g = gray, b = gray;
          if (heatmapVolume && heatmapVolume.length > 0 && heatmapOpacity > 0) {
            const hv = heatmapVolume[flatIdx] ?? 0;
            if (hv > 0.05) {
              const [hr, hg, hb] = lutColor(hv, lut);
              const a = heatmapOpacity;
              r = Math.round(gray * (1 - a) + hr * a);
              g = Math.round(gray * (1 - a) + hg * a);
              b = Math.round(gray * (1 - a) + hb * a);
            }
          }

          const i = (py * srcW + px) * 4;
          d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255;
        }
      }

      // ── Blit to canvas with zoom/pan and aspect ratio ──
      const off = new OffscreenCanvas(srcW, srcH);
      const offCtx = off.getContext('2d')!;
      offCtx.putImageData(imgData, 0, 0);

      const { viewW, viewH, panX, panY, drawX, drawY, drawW, drawH } = getRenderMetrics();

      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.imageSmoothingEnabled = zoom < 3;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(off, panX, panY, viewW, viewH, drawX, drawY, drawW, drawH);

      // ── Cyan crosshair ──
      let crossSrcX: number, crossSrcY: number;
      if (plane === 'Axial')         { crossSrcX = coord.x; crossSrcY = coord.y; }
      else if (plane === 'Coronal')  { crossSrcX = coord.x; crossSrcY = coord.z; }
      else /* Sagittal */            { crossSrcX = coord.y; crossSrcY = coord.z; }

      const cxPx = drawX + ((crossSrcX - panX) / viewW) * drawW;
      const cyPx = drawY + ((crossSrcY - panY) / viewH) * drawH;

      ctx.save();
      ctx.strokeStyle = 'rgba(0, 220, 255, 0.75)';
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      // Only draw crosshair within the letterboxed area
      ctx.moveTo(cxPx, drawY);    ctx.lineTo(cxPx, drawY + drawH);
      ctx.moveTo(drawX, cyPx);    ctx.lineTo(drawX + drawW, cyPx);
      ctx.stroke();
      ctx.restore();

      // ── Tumor marker (yellow circle + label + yellow crosshair) ──
      if (tumorTarget?.found) {
        let tSrcX: number, tSrcY: number, perpDist: number;
        if (plane === 'Axial') {
          tSrcX = tumorTarget.x; tSrcY = tumorTarget.y;
          perpDist = Math.abs(coord.z - tumorTarget.z);
        } else if (plane === 'Coronal') {
          tSrcX = tumorTarget.x; tSrcY = tumorTarget.z;
          perpDist = Math.abs(coord.y - tumorTarget.y);
        } else {
          tSrcX = tumorTarget.y; tSrcY = tumorTarget.z;
          perpDist = Math.abs(coord.x - tumorTarget.x);
        }

        // Always draw the marker (visible even when heatmap is off)
        const tPxX = drawX + ((tSrcX - panX) / viewW) * drawW;
        const tPxY = drawY + ((tSrcY - panY) / viewH) * drawH;
        const baseRadius = longitudinalMode === 'baseline' ? 18 : longitudinalMode === 'followup' ? 8 : 14;
        
        // Use average scale for circle radius to prevent oval shapes, although technically
        // aspect ratio might require ellipse if pixels aren't square. We'll use a circular representation.
        const avgDrawDim = (drawW + drawH) / 2;
        const avgViewDim = (viewW + viewH) / 2;
        const canvasRadius = (baseRadius / avgViewDim) * avgDrawDim;

        // Yellow crosshair at tumor center (separate from cyan)
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
        ctx.lineWidth = 0.5;
        ctx.setLineDash([3, 6]);
        ctx.beginPath();
        ctx.moveTo(tPxX, drawY);    ctx.lineTo(tPxX, drawY + drawH);
        ctx.moveTo(drawX, tPxY);    ctx.lineTo(drawX + drawW, tPxY);
        ctx.stroke();
        ctx.restore();

        // Only draw circle when within a sensible range of the perpendicular axis
        const maxPerpDist = Math.max(5, baseRadius);
        if (perpDist <= maxPerpDist) {
          const fadeAlpha = perpDist <= 3 ? 1.0 : 1.0 - ((perpDist - 3) / (maxPerpDist - 3));

          ctx.save();
          ctx.globalAlpha = fadeAlpha;
          // Glow
          ctx.shadowColor = 'rgba(255, 220, 0, 0.7)';
          ctx.shadowBlur = 12;
          // Circle
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          ctx.beginPath();
          ctx.arc(tPxX, tPxY, canvasRadius, 0, Math.PI * 2);
          ctx.stroke();
          // Label
          ctx.setLineDash([]);
          ctx.shadowBlur = 8;
          ctx.fillStyle = '#FFD700';
          ctx.font = 'bold 11px Inter, system-ui, sans-serif';
          ctx.fillText('TUMOR', tPxX + canvasRadius + 5, tPxY - 4);
          // Center dot
          ctx.beginPath();
          ctx.arc(tPxX, tPxY, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    });

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [volume, depth, rows, cols, coord, wc, ww, heatmapVolume, heatmapOpacity, lut,
      tumorTarget, zoom, pan, plane, srcW, srcH, isMockMode, longitudinalMode, getRenderMetrics]);

  // ── Click → update crosshair in other views ──
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current) return; // Don't update on drag end
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect  = canvas.getBoundingClientRect();
    const { viewW, viewH, panX, panY, drawX, drawY, drawW, drawH } = getRenderMetrics();

    // Map screen click to letterboxed canvas coords
    const scaleX = rect.width / CANVAS_SIZE;
    const scaleY = rect.height / CANVAS_SIZE;
    const screenDrawX = drawX * scaleX;
    const screenDrawY = drawY * scaleY;
    const screenDrawW = drawW * scaleX;
    const screenDrawH = drawH * scaleY;

    const fracX = (e.clientX - rect.left - screenDrawX) / screenDrawW;
    const fracY = (e.clientY - rect.top - screenDrawY) / screenDrawH;

    if (fracX < 0 || fracX > 1 || fracY < 0 || fracY > 1) return; // Ignored if outside letterbox

    const imgX = Math.round(panX + fracX * viewW);
    const imgY = Math.round(panY + fracY * viewH);

    if (plane === 'Axial') {
      onCoordChange({
        x: Math.max(0, Math.min(cols  - 1, imgX)),
        y: Math.max(0, Math.min(rows  - 1, imgY)),
      });
    } else if (plane === 'Coronal') {
      onCoordChange({
        x: Math.max(0, Math.min(cols  - 1, imgX)),
        z: Math.max(0, Math.min(depth - 1, imgY)),
      });
    } else { // Sagittal
      onCoordChange({
        y: Math.max(0, Math.min(rows  - 1, imgX)),
        z: Math.max(0, Math.min(depth - 1, imgY)),
      });
    }
  }, [getRenderMetrics, plane, onCoordChange, cols, rows, depth]);

  // ── Mouse drag for panning ──
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isDraggingRef.current = false;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };

    const onMouseMove = (ev: MouseEvent) => {
      if (!lastMouseRef.current) return;
      const dx = ev.clientX - lastMouseRef.current.x;
      const dy = ev.clientY - lastMouseRef.current.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) isDraggingRef.current = true;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const { viewW, viewH, drawW, drawH } = getRenderMetrics();
      
      const scaleX = rect.width / CANVAS_SIZE;
      const scaleY = rect.height / CANVAS_SIZE;
      const screenDrawW = drawW * scaleX;
      const screenDrawH = drawH * scaleY;

      // Convert screen-pixel delta to source-pixel delta
      const srcDx = -(dx / screenDrawW) * viewW;
      const srcDy = -(dy / screenDrawH) * viewH;

      onPanChange({ x: pan.x + srcDx, y: pan.y + srcDy });
      lastMouseRef.current = { x: ev.clientX, y: ev.clientY };
    };

    const onMouseUp = () => {
      lastMouseRef.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [pan, getRenderMetrics, onPanChange]);

  // ── Mouse wheel: Ctrl+scroll = zoom, plain scroll = advance slice ──
  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const newZoom = Math.max(0.5, Math.min(5, zoom - e.deltaY * 0.003));
      onZoomChange(newZoom);
    } else {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 1 : -1;
      if      (plane === 'Axial')    onCoordChange({ z: Math.max(0, Math.min(depth - 1, coord.z + delta)) });
      else if (plane === 'Coronal')  onCoordChange({ y: Math.max(0, Math.min(rows  - 1, coord.y + delta)) });
      else                           onCoordChange({ x: Math.max(0, Math.min(cols  - 1, coord.x + delta)) });
    }
  }, [zoom, plane, coord, depth, rows, cols, onZoomChange, onCoordChange]);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // ── Double-click → reset zoom/pan for this view ──
  const handleDoubleClick = useCallback(() => {
    onZoomChange(1);
    onPanChange({ x: 0, y: 0 });
  }, [onZoomChange, onPanChange]);

  // Panel accent colors
  const accentMap: Record<Plane, { text: string; border: string; bg: string }> = {
    Axial:    { text: 'text-sky-400',     border: 'border-sky-500/40',     bg: 'bg-sky-500/10' },
    Coronal:  { text: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-500/10' },
    Sagittal: { text: 'text-amber-400',   border: 'border-amber-500/40',   bg: 'bg-amber-500/10' },
  };
  const accent = accentMap[plane];

  const sliceLabel =
    plane === 'Axial'    ? `Z: ${coord.z + 1} / ${depth}` :
    plane === 'Coronal'  ? `Y: ${coord.y + 1} / ${rows}`  :
                           `X: ${coord.x + 1} / ${cols}`;

  const planeSuffix: Record<Plane, string> = { Axial: 'XY', Coronal: 'XZ', Sagittal: 'YZ' };

  // Capture element IDs for PDF export
  const captureId = `${plane.toLowerCase()}-view-capture${longitudinalMode ? `-${longitudinalMode}` : ''}`;

  return (
    <div id={captureId} className={`relative bg-black border ${accent.border} rounded-lg overflow-hidden flex flex-col group min-h-0`}>
      {/* Panel header */}
      <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#0a0e17]/90 border-b border-white/5 select-none flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <ScanLine className={`w-3 h-3 ${accent.text}`} />
          <span className={`text-[10px] font-bold tracking-widest uppercase ${accent.text}`}>
            {plane}
          </span>
          <span className={`text-[8px] ${accent.text} opacity-50 font-mono`}>({planeSuffix[plane]})</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-[9px] text-white/50 font-mono font-medium">{sliceLabel}</span>
          <span className="text-[9px] text-white/30 font-mono">{zoom.toFixed(1)}×</span>
          <span className="text-[9px] text-white/30 font-mono">W:{ww} L:{wc}</span>
        </div>
      </div>
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        className="w-full flex-1 cursor-crosshair block min-h-0"
        style={{ imageRendering: zoom >= 3 ? 'pixelated' : 'auto' }}
      />
      {/* Hover zoom buttons */}
      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
        <button onClick={() => onZoomChange(Math.min(5, zoom + 0.5))} className="w-5 h-5 flex items-center justify-center rounded bg-black/70 border border-white/20 text-white/60 hover:text-sky-400 transition-colors">
          <ZoomIn className="w-2.5 h-2.5" />
        </button>
        <button onClick={() => onZoomChange(Math.max(0.5, zoom - 0.5))} className="w-5 h-5 flex items-center justify-center rounded bg-black/70 border border-white/20 text-white/60 hover:text-sky-400 transition-colors">
          <ZoomOut className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  );
};

// ─── DICOM Upload Panel ───────────────────────────────────────────────────────

interface DicomUploadResult {
  volume: Float32Array;
  depth: number; rows: number; cols: number;
  defaultWC: number; defaultWW: number;
}

interface DicomUploadPanelProps {
  onVolumeReady: (r: DicomUploadResult) => void;
}

const DicomUploadPanel: React.FC<DicomUploadPanelProps> = ({ onVolumeReady }) => {
  const [isLoading, setIsLoading]   = useState(false);
  const [progress, setProgress]     = useState(0);
  const [fileCount, setFileCount]   = useState(0);
  const [error, setError]           = useState<string | null>(null);
  const [statusMsg, setStatusMsg]   = useState('');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);

    // Filter out OS junk files; accept files with .dcm extension OR no extension (common for DICOM)
    const dicomFiles = acceptedFiles.filter(f =>
      f.size > 128 &&
      !f.name.startsWith('.') &&
      !/\.(xml|txt|json|html|DS_Store|csv|pdf|png|jpg|jpeg)$/i.test(f.name)
    );

    if (dicomFiles.length === 0) {
      setError('No valid DICOM files found in the selected folder.');
      return;
    }
    if (dicomFiles.length < 10) {
      setError(`Not enough slices for MPR (need 10+, got ${dicomFiles.length}).`);
      return;
    }

    setFileCount(dicomFiles.length);
    setIsLoading(true);
    setProgress(0);
    setStatusMsg('Reading DICOM files…');

    try {
      // ── Parse all files in batches of 20 ──
      const BATCH = 20;
      const metas: DicomMeta[] = [];
      const errors: string[] = [];

      for (let i = 0; i < dicomFiles.length; i += BATCH) {
        const batch = dicomFiles.slice(i, i + BATCH);
        const results = await Promise.all(
          batch.map(f => f.arrayBuffer().then(
            buf => parseDicomMeta(buf, f.name),
            () => null // File read error
          ))
        );
        results.forEach((m, idx) => {
          if (m) metas.push(m);
          else errors.push(batch[idx]?.name ?? `file-${i + idx}`);
        });
        const pct = Math.round(((i + batch.length) / dicomFiles.length) * 70);
        setProgress(pct);
        setStatusMsg(`Parsed ${Math.min(i + batch.length, dicomFiles.length)} / ${dicomFiles.length} slices…`);
      }

      if (metas.length === 0) {
        throw new Error('DICOM has no pixel data — could not decode any slices.');
      }

      setStatusMsg('Sorting slices by Z-position…');
      setProgress(72);

      // ── Sort by ImagePositionPatient[2] (Z), fall back to InstanceNumber, then filename ──
      const hasIPP = metas.every(m => m.imagePositionZ !== null);
      if (hasIPP) {
        metas.sort((a, b) => (a.imagePositionZ ?? 0) - (b.imagePositionZ ?? 0));
      } else {
        const hasInstance = metas.every(m => m.instanceNumber > 0);
        if (hasInstance) {
          metas.sort((a, b) => a.instanceNumber - b.instanceNumber);
        } else {
          metas.sort((a, b) => a.filename.localeCompare(b.filename, undefined, { numeric: true }));
        }
      }

      // ── Validate uniform geometry ──
      const refRows = metas[0].rows;
      const refCols = metas[0].cols;
      const uniform = metas.filter(m => m.rows === refRows && m.cols === refCols);
      if (uniform.length !== metas.length) {
        throw new Error(`Slices have inconsistent dimensions — only ${uniform.length}/${metas.length} match ${refCols}×${refRows}.`);
      }
      if (uniform.length < 10) {
        throw new Error(`Not enough slices for MPR (need 10+, got ${uniform.length}).`);
      }

      setStatusMsg('Building 3D volume…');
      setProgress(80);

      // ── Assemble 3D volume (Z × Y × X flat layout) ──
      const volumeDepth = uniform.length;
      const volumeRows  = refRows;
      const volumeCols  = refCols;
      const volume = new Float32Array(volumeDepth * volumeRows * volumeCols);

      for (let z = 0; z < volumeDepth; z++) {
        const pixels = decodePixels(uniform[z]);
        volume.set(pixels, z * volumeRows * volumeCols);
        if (z % 20 === 0) {
          const pct = 80 + Math.round((z / volumeDepth) * 18);
          setProgress(pct);
          setStatusMsg(`Decoding slice ${z + 1} / ${volumeDepth}…`);
        }
      }

      setProgress(100);
      setStatusMsg('Volume ready!');

      // Use W/L from first slice's metadata (or soft-tissue default)
      const defaultWC = uniform[0].windowCenter || 40;
      const defaultWW = uniform[0].windowWidth  || 400;

      onVolumeReady({ volume, depth: volumeDepth, rows: volumeRows, cols: volumeCols, defaultWC, defaultWW });

    } catch (err) {
      console.error('[DICOM Parse Error]', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [onVolumeReady]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, noClick: false, noKeyboard: false });

  return (
    <div
      {...getRootProps()}
      className={`flex-1 flex flex-col items-center justify-center rounded-lg border-2 border-dashed cursor-pointer transition-all duration-300 ${
        isDragActive
          ? 'border-sky-400 bg-sky-950/30 scale-[1.005]'
          : 'border-[#2a364a] bg-[#080c14] hover:border-[#334155] hover:bg-[#0a0e17]'
      }`}
    >
      <input
        {...getInputProps()}
        {...{ webkitdirectory: 'true', directory: 'true' } as React.InputHTMLAttributes<HTMLInputElement>}
      />

      {isLoading ? (
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-4 border-sky-500/20 animate-pulse" />
            <div className="absolute inset-2 rounded-full border-4 border-sky-400 border-t-transparent animate-spin" />
            <Loader2 className="absolute inset-0 m-auto w-6 h-6 text-sky-500 animate-spin" style={{ animationDirection: 'reverse' }} />
          </div>
          <div className="text-center">
            <p className="text-white text-sm font-bold">Building 3D Volume</p>
            <p className="text-slate-500 text-xs mt-0.5">{statusMsg}</p>
          </div>
          <div className="w-48 h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-sky-500 to-blue-500 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[#2a364a] text-[10px] font-mono">{progress}% — {fileCount} files</p>
        </div>
      ) : (
        <>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-all ${isDragActive ? 'bg-sky-500/20 border-2 border-sky-400' : 'bg-[#131826] border-2 border-[#2a364a]'}`}>
            <CloudUpload className={`w-7 h-7 ${isDragActive ? 'text-sky-400' : 'text-slate-500'}`} />
          </div>
          <p className="text-white text-sm font-bold mb-1">
            {isDragActive ? 'Release to Upload' : 'Upload DICOM CT Series'}
          </p>
          <p className="text-slate-500 text-[11px] text-center max-w-xs leading-relaxed mb-4 px-2">
            Drag a folder of .dcm slices, or click to browse.
            Slices are sorted by Z-position and bundled into a 3D volume for MPR.
          </p>
          {error && (
            <div className="bg-red-950/60 border border-red-500/40 text-red-400 text-[10px] rounded px-3 py-1.5 mb-3 max-w-xs text-center font-mono">
              ⚠ {error}
            </div>
          )}
          <div className="flex items-center gap-3 text-[10px] text-slate-600 font-mono">
            <span>AXIAL</span><span className="text-[#1e293b]">•</span>
            <span>CORONAL</span><span className="text-[#1e293b]">•</span>
            <span>SAGITTAL MPR</span>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Legend Canvas ────────────────────────────────────────────────────────────

const LegendCanvas: React.FC<{ lut: LUTType }> = ({ lut }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = 16; canvas.height = 300;
    const id = ctx.createImageData(16, 300);
    const d  = id.data;
    for (let y = 0; y < 300; y++) {
      const v = 1 - y / 299;
      const [r, g, b] = lutColor(v, lut);
      for (let x = 0; x < 16; x++) {
        const i = (y * 16 + x) * 4;
        d[i] = r; d[i+1] = g; d[i+2] = b; d[i+3] = 255;
      }
    }
    ctx.putImageData(id, 0, 0);
  }, [lut]);
  return <canvas ref={ref} className="w-3 flex-1 rounded-sm border border-[#1e293b]" />;
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const MprClinicalWorkstation: React.FC<MprClinicalWorkstationProps> = ({
  base64Matrix,
  dicomBase64Matrix,
  dimensions,
  tumorTarget,
  patientInfo,
  longitudinalMode,
  localDicomFiles,
}) => {
  const [Depth, Height, Width] = dimensions;

  // ── Determine operating mode ──
  const isMockMode   = base64Matrix === 'MOCK' && (!localDicomFiles || localDicomFiles.length === 0);
  const isUploadMode = (!base64Matrix || base64Matrix === '') && (!localDicomFiles || localDicomFiles.length === 0);

  // ── Shared viewer state ──
  const [coord, setCoord] = useState<Coord>({
    x: Math.floor(Width  / 2),
    y: Math.floor(Height / 2),
    z: Math.floor(Depth  / 2),
  });
  const [wlPreset, setWlPreset]         = useState<WLPreset>(WL_PRESETS[0]);
  const [heatmapOpacity, setHeatmapOp]  = useState(0.5);
  const [activeLUT, setActiveLUT]       = useState<LUTType>('Jet');
  const [zoomAxial,    setZoomAxial]     = useState(1);
  const [zoomCoronal,  setZoomCoronal]   = useState(1);
  const [zoomSagittal, setZoomSagittal]  = useState(1);
  const [panAxial,    setPanAxial]       = useState<PanOffset>({ x: 0, y: 0 });
  const [panCoronal,  setPanCoronal]     = useState<PanOffset>({ x: 0, y: 0 });
  const [panSagittal, setPanSagittal]    = useState<PanOffset>({ x: 0, y: 0 });
  const [isDecoding,  setIsDecoding]     = useState(true);

  // ── Volume data ──
  const [mainVolume,    setMainVolume]    = useState<Float32Array | null>(null);
  const [heatmapVolume, setHeatmapVolume] = useState<Float32Array | null>(null);
  const [volDims, setVolDims]             = useState({ 
    depth: Depth, rows: Height, cols: Width, 
    spacingX: 1.0, spacingY: 1.0, spacingZ: 1.0 
  });

  // ── Decode AI base64 buffers or Local Files ──
  useEffect(() => {
    if (localDicomFiles && localDicomFiles.length > 0) {
      setIsDecoding(true);
      const doLoadLocal = async () => {
        try {
          const BATCH = 20;
          const metas: DicomMeta[] = [];
          for (let i = 0; i < localDicomFiles.length; i += BATCH) {
            const batch = localDicomFiles.slice(i, i + BATCH);
            const results = await Promise.all(
              batch.map(f => f.arrayBuffer().then(buf => parseDicomMeta(buf, f.name), () => null))
            );
            results.forEach(m => { if (m) metas.push(m); });
          }
          if (metas.length === 0) throw new Error('No valid DICOM');

          const hasIPP = metas.every(m => m.imagePositionZ !== null);
          if (hasIPP) {
            metas.sort((a, b) => (a.imagePositionZ ?? 0) - (b.imagePositionZ ?? 0));
          } else {
            const hasInstance = metas.every(m => m.instanceNumber > 0);
            if (hasInstance) metas.sort((a, b) => a.instanceNumber - b.instanceNumber);
            else metas.sort((a, b) => a.filename.localeCompare(b.filename, undefined, { numeric: true }));
          }

          const refRows = metas[0].rows;
          const refCols = metas[0].cols;
          const volumeDepth = metas.length;
          console.log(`[MPR] Volume loaded: depth=${volumeDepth}, rows=${refRows}, cols=${refCols}`);

          const spacingX = metas[0].pixelSpacingCol || 0.7;
          const spacingY = metas[0].pixelSpacingRow || 0.7;
          const spacingZ = metas[0].sliceThickness || 2.5;

          const volume = new Float32Array(volumeDepth * refRows * refCols);
          for (let z = 0; z < volumeDepth; z++) {
            const pixels = decodePixels(metas[z]);
            volume.set(pixels, z * refRows * refCols);
          }
          
          setMainVolume(volume);
          setVolDims({ depth: volumeDepth, rows: refRows, cols: refCols, spacingX, spacingY, spacingZ });
          setCoord({
            x: Math.floor(refCols / 2),
            y: Math.floor(refRows / 2),
            z: Math.floor(volumeDepth / 2),
          });
          
          if (base64Matrix && base64Matrix !== 'MOCK') {
            const res = await fetch(`data:application/octet-stream;base64,${base64Matrix}`);
            const hmBuf = await res.arrayBuffer();
            setHeatmapVolume(new Float32Array(hmBuf));
          } else {
             setHeatmapVolume(new Float32Array(0));
          }
        } catch (e) {
          console.error(e);
          setMainVolume(null);
          setHeatmapVolume(null);
        } finally {
          setIsDecoding(false);
        }
      };
      doLoadLocal();
      return;
    }

    if (isMockMode) {
      setMainVolume(null);
      setHeatmapVolume(new Float32Array(0));
      setIsDecoding(false);
      return;
    }
    if (isUploadMode) {
      setIsDecoding(false);
      return;
    }

    setIsDecoding(true);

    const decodeBase64 = async (b64: string): Promise<ArrayBuffer> => {
      const res = await fetch(`data:application/octet-stream;base64,${b64}`);
      return res.arrayBuffer();
    };

    const doLoad = async () => {
      try {
        // Grad-CAM heatmap
        const hmBuf  = await decodeBase64(base64Matrix);
        const hmData = new Float32Array(hmBuf);
        setHeatmapVolume(hmData);

        // Raw DICOM CT pixels (optional)
        if (dicomBase64Matrix) {
          const ctBuf  = await decodeBase64(dicomBase64Matrix);
          const ctData = new Uint8Array(ctBuf);
          // Convert byte-normalized [0,255] → HU approx via soft-tissue W/L
          const huApprox = new Float32Array(ctData.length);
          for (let i = 0; i < ctData.length; i++) {
            huApprox[i] = (ctData[i] / 255) * wlPreset.ww + (wlPreset.wc - wlPreset.ww / 2);
          }
          setMainVolume(huApprox);
        } else {
          setMainVolume(null);
        }

      } catch {
        setHeatmapVolume(null);
        setMainVolume(null);
      } finally {
        setIsDecoding(false);
      }
    };

    doLoad();
  }, [base64Matrix, dicomBase64Matrix, isMockMode, isUploadMode, localDicomFiles]);

  // ── Handle DICOM folder upload ──
  const handleDicomVolume = useCallback((result: DicomUploadResult) => {
    setMainVolume(result.volume);
    setHeatmapVolume(null);
    setVolDims({ 
      depth: result.depth, rows: result.rows, cols: result.cols,
      spacingX: 1.0, spacingY: 1.0, spacingZ: 1.0 
    });
    setWlPreset({ label: 'LIVER', wc: 30, ww: 150 }); // Default to LIVER preset for liver CT
    setCoord({
      x: Math.floor(result.cols  / 2),
      y: Math.floor(result.rows  / 2),
      z: Math.floor(result.depth / 2),
    });
    setZoomAxial(1); setZoomCoronal(1); setZoomSagittal(1);
    setPanAxial({ x: 0, y: 0 }); setPanCoronal({ x: 0, y: 0 }); setPanSagittal({ x: 0, y: 0 });
  }, []);

  const { depth, rows, cols } = (isUploadMode || (localDicomFiles && localDicomFiles.length > 0)) && mainVolume
    ? volDims
    : { depth: Depth, rows: Height, cols: Width };

  const handleCoordChange = useCallback((c: Partial<Coord>) => {
    setCoord(prev => ({
      x: Math.max(0, Math.min(cols  - 1, c.x ?? prev.x)),
      y: Math.max(0, Math.min(rows  - 1, c.y ?? prev.y)),
      z: Math.max(0, Math.min(depth - 1, c.z ?? prev.z)),
    }));
  }, [cols, rows, depth]);

  // ── Keyboard: ↑↓ scroll axial slice ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp')   setCoord(p => ({ ...p, z: Math.min(depth - 1, p.z + 1) }));
      if (e.key === 'ArrowDown') setCoord(p => ({ ...p, z: Math.max(0,         p.z - 1) }));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [depth]);

  const resetAll = () => {
    setCoord({ x: Math.floor(cols / 2), y: Math.floor(rows / 2), z: Math.floor(depth / 2) });
    setZoomAxial(1); setZoomCoronal(1); setZoomSagittal(1);
    setPanAxial({ x: 0, y: 0 }); setPanCoronal({ x: 0, y: 0 }); setPanSagittal({ x: 0, y: 0 });
  };

  const centerOnTumor = () => {
    if (tumorTarget?.found) {
      setCoord({ x: tumorTarget.x, y: tumorTarget.y, z: tumorTarget.z });
      setPanAxial({ x: 0, y: 0 }); setPanCoronal({ x: 0, y: 0 }); setPanSagittal({ x: 0, y: 0 });
    }
  };

  const resetZoom = () => {
    setZoomAxial(1); setZoomCoronal(1); setZoomSagittal(1);
    setPanAxial({ x: 0, y: 0 }); setPanCoronal({ x: 0, y: 0 }); setPanSagittal({ x: 0, y: 0 });
  };

  // ── Volume for rendering ──
  const renderVolume = mainVolume ?? new Float32Array(0);
  const isMockRender = isMockMode || (!mainVolume && !isUploadMode);

  // PDF export canvases (hidden, unzoomed — preserve existing IDs)
  const pdfAxialRef    = useRef<HTMLCanvasElement>(null);
  const pdfCoronalRef  = useRef<HTMLCanvasElement>(null);
  const pdfSagittalRef = useRef<HTMLCanvasElement>(null);

  // ── Not-yet-uploaded state ──
  const showUploadPanel = isUploadMode && !mainVolume;

  if (isDecoding) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0a0e1a] min-h-[200px]">
        <div className="flex flex-col items-center gap-3">
          <span className="text-[#00b8d4] animate-spin text-2xl">◌</span>
          <span className="text-[#00b8d4] text-[10px] font-mono font-bold uppercase tracking-widest">Decoding Volume…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full bg-black font-sans relative min-h-0">

      {/* ── Main 2×2 Grid ─────────────────────────────────────────────── */}
      <div className="flex-1 flex gap-[2px] bg-[#111827] p-[2px] min-h-0">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 grid-rows-2 gap-[2px] min-h-0">

          {/* AXIAL (top-left) or Upload Panel */}
          {showUploadPanel ? (
            <div className="bg-black rounded-lg overflow-hidden flex flex-col col-span-2 row-span-2 min-h-[300px]">
              <DicomUploadPanel onVolumeReady={handleDicomVolume} />
            </div>
          ) : (
            <>
              <MprPanel
                plane="Axial"
                volume={renderVolume} depth={depth} rows={rows} cols={cols}
                spacingX={volDims.spacingX} spacingY={volDims.spacingY} spacingZ={volDims.spacingZ}
                coord={coord} wc={wlPreset.wc} ww={wlPreset.ww}
                heatmapVolume={heatmapVolume} heatmapOpacity={heatmapOpacity} lut={activeLUT}
                tumorTarget={tumorTarget}
                zoom={zoomAxial} pan={panAxial}
                onZoomChange={setZoomAxial} onPanChange={setPanAxial}
                onCoordChange={handleCoordChange}
                isMockMode={isMockRender} longitudinalMode={longitudinalMode}
              />

              {/* CORONAL (top-right) */}
              <MprPanel
                plane="Coronal"
                volume={renderVolume} depth={depth} rows={rows} cols={cols}
                spacingX={volDims.spacingX} spacingY={volDims.spacingY} spacingZ={volDims.spacingZ}
                coord={coord} wc={wlPreset.wc} ww={wlPreset.ww}
                heatmapVolume={heatmapVolume} heatmapOpacity={heatmapOpacity} lut={activeLUT}
                tumorTarget={tumorTarget}
                zoom={zoomCoronal} pan={panCoronal}
                onZoomChange={setZoomCoronal} onPanChange={setPanCoronal}
                onCoordChange={handleCoordChange}
                isMockMode={isMockRender} longitudinalMode={longitudinalMode}
              />

              {/* SAGITTAL (bottom-left) */}
              <MprPanel
                plane="Sagittal"
                volume={renderVolume} depth={depth} rows={rows} cols={cols}
                spacingX={volDims.spacingX} spacingY={volDims.spacingY} spacingZ={volDims.spacingZ}
                coord={coord} wc={wlPreset.wc} ww={wlPreset.ww}
                heatmapVolume={heatmapVolume} heatmapOpacity={heatmapOpacity} lut={activeLUT}
                tumorTarget={tumorTarget}
                zoom={zoomSagittal} pan={panSagittal}
                onZoomChange={setZoomSagittal} onPanChange={setPanSagittal}
                onCoordChange={handleCoordChange}
                isMockMode={isMockRender} longitudinalMode={longitudinalMode}
              />

              {/* ── Slider / Control Panel (bottom-right quadrant) ── */}
              <div id="mpr-controls-area" className="bg-[#0c1019] p-3 flex flex-col justify-between gap-2 border border-[#1e293b] rounded-lg min-h-0 overflow-y-auto">

                {/* Volume info header */}
                <div className="flex items-center justify-between pb-1.5 border-b border-[#1e293b] mb-1">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3 h-3 text-sky-400" />
                    <span className="text-[9px] text-sky-400 font-bold uppercase tracking-widest">MPR Controls</span>
                  </div>
                  <span className="text-[8px] text-slate-600 font-mono">
                    {cols}×{rows}×{depth} voxels
                  </span>
                </div>

                {/* Axis sliders */}
                <div className="space-y-1.5">
                  <SliderRow label="X — Sagittal" value={coord.x} max={cols  - 1} color="text-amber-400"
                    display={`${coord.x} / ${cols}`}  onChange={x => setCoord(p => ({ ...p, x }))} />
                  <SliderRow label="Y — Coronal"  value={coord.y} max={rows  - 1} color="text-emerald-400"
                    display={`${coord.y} / ${rows}`}  onChange={y => setCoord(p => ({ ...p, y }))} />
                  <SliderRow label="Z — Axial"    value={coord.z} max={depth - 1} color="text-sky-400"
                    display={`${coord.z} / ${depth}`} onChange={z => setCoord(p => ({ ...p, z }))} />
                </div>

                {/* W/L Preset dropdown */}
                <div className="flex items-center gap-2 mt-1">
                  <Contrast className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex-shrink-0">W/L</span>
                  <select
                    value={wlPreset.label}
                    onChange={e => {
                      const p = WL_PRESETS.find(pr => pr.label === e.target.value);
                      if (p) setWlPreset(p);
                    }}
                    className="flex-1 bg-[#0a0e17] text-sky-400 border border-[#2a364a] rounded px-2 py-1 text-[10px] font-mono outline-none cursor-pointer"
                  >
                    {WL_PRESETS.map(p => <option key={p.label} value={p.label}>{p.label} (W:{p.ww} L:{p.wc})</option>)}
                  </select>
                </div>

                {/* Heatmap opacity (only when heatmap exists) */}
                {heatmapVolume && heatmapVolume.length > 0 && (
                  <div className="space-y-1">
                    <SliderRow label="Heatmap Opacity" value={Math.round(heatmapOpacity * 100)} max={100}
                      color="text-amber-500" display={`${Math.round(heatmapOpacity * 100)}%`}
                      onChange={v => setHeatmapOp(v / 100)} />

                    {/* LUT selector */}
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex-shrink-0">LUT</span>
                      <select
                        value={activeLUT}
                        onChange={e => setActiveLUT(e.target.value as LUTType)}
                        className="flex-1 bg-[#0a0e17] text-blue-400 border border-[#2a364a] rounded px-2 py-1 text-[10px] font-mono outline-none cursor-pointer"
                      >
                        {(['Jet', 'Viridis', 'Magma', 'Plasma'] as LUTType[]).map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  <CtrlBtn icon={<RefreshCw className="w-3 h-3" />} label="Reset Zoom" onClick={resetZoom} />
                  <CtrlBtn icon={<Crosshair className="w-3 h-3" />} label="Center MPR" onClick={resetAll} />
                  {tumorTarget?.found && (
                    <CtrlBtn icon={<Target className="w-3 h-3" />} label="Center Tumor" onClick={centerOnTumor} />
                  )}
                  {isUploadMode && mainVolume && (
                    <CtrlBtn icon={<CloudUpload className="w-3 h-3" />} label="New Study"
                      onClick={() => { setMainVolume(null); setHeatmapVolume(null); }} />
                  )}
                </div>

                {/* Legend */}
                <div className="mt-1 pt-2 border-t border-[#1e293b] text-[8px] text-slate-500 leading-5 space-y-0.5">
                  <p><span className="text-sky-400 font-bold">──</span> Cyan crosshair = current slice position</p>
                  {tumorTarget?.found && <p><span className="text-yellow-400 font-bold">○</span> Yellow circle = tumor location</p>}
                  {heatmapVolume && heatmapVolume.length > 0 && <p><span className="text-rose-400 font-bold">▓</span> Heatmap = Grad-CAM activation (adjustable opacity)</p>}
                  <p className="text-[7px] text-slate-600 mt-1">Scroll=Slice · Ctrl+Scroll=Zoom · Click=Navigate · Drag=Pan · DblClick=Reset</p>
                </div>

                {/* Patient info */}
                {patientInfo && (
                  <div className="mt-1 text-[8px] font-mono text-[#00b8d4] bg-black/30 px-1.5 py-1 rounded border border-[#1e293b] truncate">
                    MRN: {patientInfo.id} | {patientInfo.name}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Color legend bar */}
        {heatmapVolume && heatmapVolume.length > 0 && (
          <div className="w-8 bg-[#0c1019] flex flex-col items-center py-2 flex-shrink-0 border border-[#1e293b] rounded-lg">
            <span className="text-[7px] text-slate-500 font-bold mb-1">1.0</span>
            <LegendCanvas lut={activeLUT} />
            <span className="text-[7px] text-slate-500 font-bold mt-1">0.0</span>
            <span className="text-[7px] text-slate-600 mt-4 [writing-mode:vertical-rl] rotate-180 tracking-[0.2em] font-bold uppercase">ACTIVATION</span>
          </div>
        )}
      </div>

      {/* ── Hidden unzoomed views for PDF export (preserve existing IDs) ── */}
      <div className="fixed top-0 left-0 w-0 h-0 overflow-hidden pointer-events-none z-[-9999] opacity-0">
        <div className="flex gap-4 bg-black p-4" style={{ width: '1200px', height: '400px' }}>
          {(['axial', 'coronal', 'sagittal'] as const).map((view, vi) => (
            <div
              key={view}
              id={longitudinalMode ? `pdf-${view}-capture-${longitudinalMode}` : `pdf-${view}-capture`}
              className="bg-black relative overflow-hidden w-[350px] h-[350px]"
            >
              <canvas
                ref={vi === 0 ? pdfAxialRef : vi === 1 ? pdfCoronalRef : pdfSagittalRef}
                className="w-full h-full object-contain block"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Mini shared sub-components ───────────────────────────────────────────────

const SliderRow: React.FC<{
  label: string; value: number; max: number; color: string;
  display: string; onChange: (v: number) => void;
}> = ({ label, value, max, color, display, onChange }) => (
  <div>
    <div className="flex justify-between text-[9px] font-mono mb-0.5">
      <span className="text-slate-400 font-bold uppercase tracking-wider">{label}</span>
      <span className={`${color} font-bold`}>{display}</span>
    </div>
    <input
      type="range" min={0} max={max} value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="enterprise-slider w-full"
    />
  </div>
);

const CtrlBtn: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex-1 py-1 text-[8px] font-bold tracking-wider text-slate-300 bg-[#1e293b] hover:bg-[#2a364a] border border-[#334155] rounded transition-colors uppercase flex items-center justify-center gap-1 min-w-0"
  >
    {icon}{label}
  </button>
);

export default MprClinicalWorkstation;
