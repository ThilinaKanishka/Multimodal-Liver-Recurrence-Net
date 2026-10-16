import dicomParser from 'dicom-parser';

/**
 * Key CT images for reports, rendered directly from the uploaded DICOM files
 * (not from screenshots of the viewer). Uses a standard abdominal soft-tissue
 * window and annotates orientation, slice position and a 5 cm scale bar.
 */

export interface KeyImage {
  plane: 'Axial' | 'Coronal' | 'Sagittal';
  dataUrl: string;
  /** Width / height of the image in physical space, for undistorted placement. */
  aspect: number;
  caption: string;
}

interface Slice {
  rows: number;
  cols: number;
  hu: Float32Array;
  spacingRow: number;
  spacingCol: number;
  position: number;
  thickness: number;
}

const WINDOW = { center: 40, width: 400, label: 'W400 / L40 (abdomen)' };
const OUT_SIZE = 512;

function parseSlice(buffer: ArrayBuffer): Slice | null {
  try {
    const bytes = new Uint8Array(buffer);
    const ds = dicomParser.parseDicom(bytes);
    const pixel = ds.elements.x7fe00010;
    if (!pixel) return null;
    const rows = ds.uint16('x00280010') ?? 0;
    const cols = ds.uint16('x00280011') ?? 0;
    if (!rows || !cols) return null;
    const bits = ds.uint16('x00280100') ?? 16;
    const signed = (ds.uint16('x00280103') ?? 0) === 1;
    const slope = parseFloat(ds.string('x00281053') ?? '1') || 1;
    const intercept = parseFloat(ds.string('x00281052') ?? '0') || 0;
    const [spacingRow, spacingCol] = (ds.string('x00280030') ?? '1\\1').split('\\').map(Number);
    const ipp = (ds.string('x00200032') ?? '').split('\\').map(Number);
    const instance = parseInt(ds.string('x00200013') ?? '0', 10) || 0;
    const thickness = parseFloat(ds.string('x00180050') ?? '') || 1;

    const n = rows * cols;
    const hu = new Float32Array(n);
    const view = new DataView(bytes.buffer, bytes.byteOffset + pixel.dataOffset, Math.min(pixel.length, n * (bits / 8)));
    for (let i = 0; i < n; i++) {
      const raw = bits === 8 ? view.getUint8(i) : signed ? view.getInt16(i * 2, true) : view.getUint16(i * 2, true);
      hu[i] = raw * slope + intercept;
    }
    return {
      rows, cols, hu,
      spacingRow: spacingRow || 1,
      spacingCol: spacingCol || spacingRow || 1,
      position: ipp.length >= 3 && !Number.isNaN(ipp[2]) ? ipp[2] : instance,
      thickness,
    };
  } catch {
    return null;
  }
}

/** Draw a windowed grey image with annotations; `pxPerMm` is horizontal pixels per mm in the output. */
function renderPlane(
  width: number,
  height: number,
  sample: (x: number, y: number) => number,
  physicalW: number,
  physicalH: number,
  labels: { top: string; bottom: string; left: string; right: string },
  info: string,
): { dataUrl: string; aspect: number } {
  const aspect = physicalW / physicalH;
  const outW = aspect >= 1 ? OUT_SIZE : Math.round(OUT_SIZE * aspect);
  const outH = aspect >= 1 ? Math.round(OUT_SIZE / aspect) : OUT_SIZE;
  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(outW, outH);
  const lo = WINDOW.center - WINDOW.width / 2;
  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < outW; x++) {
      const v = sample(Math.min(width - 1, Math.floor((x / outW) * width)), Math.min(height - 1, Math.floor((y / outH) * height)));
      const g = Math.max(0, Math.min(255, ((v - lo) / WINDOW.width) * 255));
      const i = (y * outW + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = g;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  // Orientation labels
  ctx.fillStyle = '#f5c542';
  ctx.font = 'bold 18px Helvetica, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(labels.top, outW / 2, 6);
  ctx.textBaseline = 'bottom';
  ctx.fillText(labels.bottom, outW / 2, outH - 6);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(labels.left, 6, outH / 2);
  ctx.textAlign = 'right';
  ctx.fillText(labels.right, outW - 6, outH / 2);

  // 5 cm scale bar
  const pxPerMm = outW / physicalW;
  const bar = 50 * pxPerMm;
  if (bar < outW * 0.6) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(outW - 14 - bar, outH - 22);
    ctx.lineTo(outW - 14, outH - 22);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Helvetica, Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('5 cm', outW - 14, outH - 26);
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = '13px Helvetica, Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText(info, 8, outH - 8);
  return { dataUrl: canvas.toDataURL('image/jpeg', 0.92), aspect };
}

export async function renderKeyImages(files: File[]): Promise<{ images: KeyImage[]; sliceCount: number; note?: string }> {
  const parsed = (await Promise.all(files.map(async f => parseSlice(await f.arrayBuffer())))).filter((s): s is Slice => !!s);
  if (parsed.length === 0) return { images: [], sliceCount: 0, note: 'No readable DICOM pixel data.' };

  const { rows, cols } = parsed[0];
  const series = parsed.filter(s => s.rows === rows && s.cols === cols).sort((a, b) => a.position - b.position);
  const n = series.length;
  const mid = series[Math.floor(n / 2)];
  const window = WINDOW.label;
  const images: KeyImage[] = [];

  const axial = renderPlane(
    cols, rows, (x, y) => mid.hu[y * cols + x],
    cols * mid.spacingCol, rows * mid.spacingRow,
    { top: 'A', bottom: 'P', left: 'R', right: 'L' },
    `Axial ${Math.floor(n / 2) + 1}/${n} · ${window}`,
  );
  images.push({ plane: 'Axial', ...axial, caption: `Axial, representative slice ${Math.floor(n / 2) + 1} of ${n}` });

  if (n >= 8) {
    const zSpacing = Math.abs(series[n - 1].position - series[0].position) / (n - 1) || mid.thickness;
    // Superior is the highest z position, shown at the top
    const coronal = renderPlane(
      cols, n, (x, z) => series[n - 1 - z].hu[Math.floor(rows / 2) * cols + x],
      cols * mid.spacingCol, n * zSpacing,
      { top: 'S', bottom: 'I', left: 'R', right: 'L' },
      `Coronal reconstruction · ${window}`,
    );
    images.push({ plane: 'Coronal', ...coronal, caption: `Coronal reconstruction through the volume centre (${n} slices)` });
    const sagittal = renderPlane(
      rows, n, (y, z) => series[n - 1 - z].hu[y * cols + Math.floor(cols / 2)],
      rows * mid.spacingRow, n * zSpacing,
      { top: 'S', bottom: 'I', left: 'A', right: 'P' },
      `Sagittal reconstruction · ${window}`,
    );
    images.push({ plane: 'Sagittal', ...sagittal, caption: 'Sagittal reconstruction through the volume centre' });
    return { images, sliceCount: n };
  }
  return {
    images,
    sliceCount: n,
    note: n === 1 ? 'Single-slice study: coronal and sagittal reconstructions are not available.' : `Only ${n} slices: too few for coronal/sagittal reconstruction.`,
  };
}
