import { jsPDF } from 'jspdf';
import type { KeyImage } from './dicomKeyImages';
import type { RecurrenceOutlook } from '../components/RecurrenceOutlookPanel';
import type { LabMeta, FindingMeta, ChildPughMeta } from '../components/ExtractedDataRows';

/**
 * A4 clinical report laid out like hospital / reference-lab result reports:
 * document header with a Code 128 report barcode and status band, boxed patient
 * demographics, numbered sections (result summary with cohort gauge and
 * impression, survival estimate, key images, contributing factors, source data,
 * model information, authorization), patient banner on every continuation page,
 * "Page x of y" footer and an end-of-report marker. All text is real PDF text.
 */

export interface ReportInput {
  patient: { name: string; mrn: string; dob: string; age: string; sex: string; attending: string };
  /** Where each header value came from (DICOM / REPORT / MANUAL), when known. */
  patientSources?: Record<string, string | null>;
  form: Record<string, unknown> & {
    lab_meta?: Record<string, LabMeta>;
    findings?: Record<string, FindingMeta>;
    child_pugh?: ChildPughMeta | null;
    evidence?: Record<string, string>;
    sources?: Record<string, string>;
    report_date?: string | null;
    lirads_category?: string;
  };
  manualOverrides: Record<string, boolean>;
  outlook: RecurrenceOutlook | null | undefined;
  inferenceId?: string;
  modelVersion?: string;
  identity?: { is_mismatch: boolean; is_unverified?: boolean } | null;
  dataDriftDetected: boolean;
  keyImages: KeyImage[];
  keyImageNote?: string;
  sliceCount: number;
  reviewer?: { name?: string; level?: string; signature?: string } | null;
}

// Layout (mm). `w.y` is always the top of the next block.
const PAGE_W = 210;
const PAGE_H = 297;
const M = 14;
const CONTENT_W = PAGE_W - 2 * M;
const TOP = 27;
const BOTTOM = PAGE_H - 19;

type RGB = readonly number[];
const C = {
  ink: [15, 23, 42] as RGB,
  body: [30, 41, 59] as RGB,
  muted: [100, 116, 139] as RGB,
  faint: [203, 213, 225] as RGB,
  line: [226, 232, 240] as RGB,
  zebra: [248, 250, 252] as RGB,
  white: [255, 255, 255] as RGB,
  navy: [17, 45, 88] as RGB,
  navyTint: [238, 243, 250] as RGB,
  brand: [8, 145, 178] as RGB,
  logoFill: [207, 250, 254] as RGB,
  logoInk: [14, 116, 144] as RGB,
  amberFill: [254, 243, 199] as RGB,
  amberInk: [146, 64, 14] as RGB,
  high: [190, 18, 60] as RGB,
  mid: [180, 83, 9] as RGB,
  low: [4, 120, 87] as RGB,
};
const GROUP_COLOR = { High: C.high, Intermediate: C.mid, Low: C.low } as const;
const GROUP_TINT = { High: [255, 228, 230], Intermediate: [254, 243, 199], Low: [209, 250, 229] } as const;

/** Characters the standard (WinAnsi) PDF fonts can draw: printable ASCII, Latin-1, dashes, bullet, ellipsis. */
const drawable = (ch: string) => {
  const n = ch.charCodeAt(0);
  return (n >= 0x20 && n <= 0x7e) || (n >= 0xa0 && n <= 0xff) || n === 0x2013 || n === 0x2014 || n === 0x2022 || n === 0x2026;
};

/** Standard PDF fonts only cover WinAnsi; replace characters they cannot draw. */
const t = (s: unknown): string =>
  Array.from(String(s ?? '')
    .replace(/[≥]/g, '>=').replace(/[≤]/g, '<=').replace(/[→]/g, '->').replace(/[≠]/g, '!=')
    .replace(/[▲↑]/g, '^').replace(/[▼↓]/g, 'v').replace(/[“”]/g, '"').replace(/[‘’]/g, "'"),
  ).filter(drawable).join('');

const missing = (v: unknown) => v === undefined || v === null || v === '' || v === '--' || v === '---' || v === '-';
const show = (v: unknown, empty = 'Not recorded') => (missing(v) ? empty : t(v));
const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;

// ---------------------------------------------------------------------------
// Code 128 (set B) barcode, drawn as vector bars
// ---------------------------------------------------------------------------
const CODE128 = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232',
];
const CODE128_STOP = '2331112';

function drawCode128(doc: jsPDF, text: string, x: number, y: number, width: number, height: number) {
  const values = Array.from(text).map(ch => ch.charCodeAt(0) - 32).filter(v => v >= 0 && v < 95);
  const codes = [104, ...values];
  const check = codes.reduce((sum, v, i) => sum + v * Math.max(1, i), 0) % 103;
  const patterns = [...codes, check].map(v => CODE128[v]).concat(CODE128_STOP);
  const modules = patterns.reduce((s, p) => s + Array.from(p).reduce((a, d) => a + Number(d), 0), 0);
  const mw = width / modules;
  let cx = x;
  doc.setFillColor(0, 0, 0);
  for (const p of patterns) {
    Array.from(p).forEach((d, i) => {
      const bw = Number(d) * mw;
      if (i % 2 === 0) doc.rect(cx, y, bw, height, 'F');
      cx += bw;
    });
  }
}

// ---------------------------------------------------------------------------
// Brand
// ---------------------------------------------------------------------------
function drawLogo(doc: jsPDF, x: number, y: number, size: number) {
  doc.setFillColor(C.logoFill[0], C.logoFill[1], C.logoFill[2]);
  doc.setDrawColor(C.logoInk[0], C.logoInk[1], C.logoInk[2]);
  doc.setLineWidth(size * 0.035);
  doc.roundedRect(x, y, size, size, size * 0.18, size * 0.18, 'FD');
  const cx = x + size / 2, cy = y + size / 2, r = size * 0.27;
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
  doc.setLineWidth(size * 0.06);
  pts.forEach((p, i) => {
    const q = pts[(i + 1) % 6];
    doc.line(p[0], p[1], q[0], q[1]);
  });
}

/** "HEPATOAI" wordmark with the AI in brand colour; returns its width. */
function drawWordmark(doc: jsPDF, x: number, y: number, size: number): number {
  const cs = size * 0.06;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(size);
  doc.setTextColor(C.ink[0], C.ink[1], C.ink[2]);
  doc.text('HEPATO', x, y, { charSpace: cs });
  const w1 = doc.getTextWidth('HEPATO') + cs * 6;
  doc.setTextColor(C.logoInk[0], C.logoInk[1], C.logoInk[2]);
  doc.text('AI', x + w1, y, { charSpace: cs });
  return w1 + doc.getTextWidth('AI') + cs * 2;
}

// ---------------------------------------------------------------------------
// Writer
// ---------------------------------------------------------------------------
class ReportWriter {
  doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  y = TOP;
  sectionNo = 0;

  font(size: number, style: 'normal' | 'bold' | 'italic' = 'normal', color: RGB = C.ink, family: 'helvetica' | 'courier' = 'helvetica') {
    this.doc.setFont(family, style);
    this.doc.setFontSize(size);
    this.doc.setTextColor(color[0], color[1], color[2]);
  }

  fill(c: RGB) { this.doc.setFillColor(c[0], c[1], c[2]); }
  stroke(c: RGB, width: number) { this.doc.setDrawColor(c[0], c[1], c[2]); this.doc.setLineWidth(width); }

  ensure(height: number) {
    if (this.y + height > BOTTOM) {
      this.doc.addPage();
      this.y = TOP;
    }
  }

  /** Numbered section heading: navy number tile, title, navy rule. */
  section(title: string, keepWith = 18) {
    this.ensure(13 + keepWith);
    this.y += 3;
    this.sectionNo += 1;
    this.fill(C.navy);
    this.doc.rect(M, this.y, 6, 6, 'F');
    this.font(8.5, 'bold', C.white);
    this.doc.text(String(this.sectionNo), M + 3, this.y + 4.3, { align: 'center' });
    this.font(10.5, 'bold', C.navy);
    this.doc.text(t(title).toUpperCase(), M + 9, this.y + 4.4, { charSpace: 0.35 });
    this.stroke(C.navy, 0.5);
    this.doc.line(M, this.y + 8, M + CONTENT_W, this.y + 8);
    this.y += 12;
  }

  subheading(title: string, keepWith = 14) {
    this.ensure(7 + keepWith);
    this.font(8.5, 'bold', C.ink);
    this.doc.text(t(title), M, this.y + 3);
    this.y += 5.5;
  }

  /** Small uppercase field label with its baseline at `y`. */
  label(text: string, x: number, y: number, color: RGB = C.muted, size = 6) {
    this.font(size, 'bold', color);
    this.doc.text(t(text).toUpperCase(), x, y, { charSpace: 0.35 });
  }

  paragraph(text: string, opts: { size?: number; color?: RGB; style?: 'normal' | 'italic' | 'bold'; indent?: number; width?: number } = {}) {
    const size = opts.size ?? 8.2;
    const indent = opts.indent ?? 0;
    this.font(size, opts.style ?? 'normal', opts.color ?? C.body);
    const lines = this.doc.splitTextToSize(t(text), (opts.width ?? CONTENT_W) - indent) as string[];
    const lh = size * 0.44;
    for (const line of lines) {
      this.ensure(lh + 1);
      this.doc.text(line, M + indent, this.y + size * 0.35);
      this.y += lh;
    }
    this.y += 1.4;
  }

  /** Table with navy header, zebra rows and wrapped cells; `widths` must sum to CONTENT_W. */
  table(headers: string[], rows: string[][], widths: number[], opts: { size?: number; colors?: (RGB | null)[][]; boldFirst?: boolean } = {}) {
    const size = opts.size ?? 7.6;
    const lh = size * 0.42;
    const padX = 1.8, padY = 1.4, headH = 5.8;
    const header = () => {
      this.fill(C.navy);
      this.doc.rect(M, this.y, CONTENT_W, headH, 'F');
      this.font(size - 1.2, 'bold', C.white);
      let x = M;
      headers.forEach((h, i) => {
        this.doc.text(t(h).toUpperCase(), x + padX, this.y + 3.9, { charSpace: 0.3 });
        x += widths[i];
      });
      this.y += headH;
    };
    this.ensure(headH + lh + 2 * padY + 1);
    header();
    rows.forEach((row, r) => {
      const cells = row.map((cell, i) => this.doc.splitTextToSize(t(cell), widths[i] - 2 * padX) as string[]);
      const height = Math.max(...cells.map(c => c.length)) * lh + 2 * padY;
      if (this.y + height > BOTTOM) {
        this.doc.addPage();
        this.y = TOP;
        header();
      }
      if (r % 2 === 1) {
        this.fill(C.zebra);
        this.doc.rect(M, this.y, CONTENT_W, height, 'F');
      }
      let x = M;
      cells.forEach((lines, i) => {
        this.font(size, i === 0 && opts.boldFirst !== false ? 'bold' : 'normal', opts.colors?.[r]?.[i] ?? C.body);
        lines.forEach((line, k) => this.doc.text(line, x + padX, this.y + padY + size * 0.33 + k * lh));
        x += widths[i];
      });
      this.y += height;
      this.stroke(C.line, 0.2);
      this.doc.line(M, this.y, M + CONTENT_W, this.y);
    });
    this.stroke(C.navy, 0.3);
    this.doc.line(M, this.y, M + CONTENT_W, this.y);
    this.y += 4;
  }

  /** Value text with optional source tag (e.g. REPORT) after it; baseline at `y`. */
  value(text: string, x: number, y: number, maxW: number, size: number, style: 'normal' | 'bold', tag?: string) {
    const empty = text.startsWith('Not ');
    this.font(size, empty ? 'normal' : style, empty ? C.muted : C.ink);
    const tagW = tag ? 13 : 0;
    const line = (this.doc.splitTextToSize(t(text), maxW - tagW) as string[])[0] ?? '';
    this.doc.text(line, x, y);
    if (tag && !empty) {
      const tx = x + this.doc.getTextWidth(line) + 1.6;
      this.font(4.8, 'bold', C.muted);
      const tw = this.doc.getTextWidth(tag) + 2.2;
      this.stroke(C.faint, 0.2);
      this.doc.roundedRect(tx, y - 2.5, tw, 3.2, 1, 1, 'S');
      this.doc.text(tag, tx + 1.1, y - 0.2);
    }
  }
}

// ---------------------------------------------------------------------------
// Page 1 blocks
// ---------------------------------------------------------------------------
interface DocMeta { reportId: string; generated: string; modelVersion?: string }

function drawDocumentHeader(w: ReportWriter, meta: DocMeta) {
  const doc = w.doc;
  drawLogo(doc, M, 9, 14);
  drawWordmark(doc, M + 17.5, 17.6, 18);
  w.label('Clinical Decision Support Service', M + 17.8, 22.2, C.muted, 6.3);

  // Report barcode (scannable report ID), top right
  const bw = 46, bx = M + CONTENT_W - bw;
  drawCode128(doc, meta.reportId, bx, 9, bw, 9);
  w.font(7, 'normal', C.ink, 'courier');
  doc.text(`RPT ${meta.reportId}`, bx + bw / 2, 21.4, { align: 'center', charSpace: 0.8 });

  // Title / status band
  const by = 26;
  w.fill(C.navy);
  doc.rect(M, by, CONTENT_W, 10, 'F');
  w.font(11.5, 'bold', C.white);
  doc.text('RECURRENCE RISK ASSESSMENT', M + 4, by + 6.6, { charSpace: 0.5 });
  const titleW = doc.getTextWidth('RECURRENCE RISK ASSESSMENT') + 0.5 * 26;
  w.font(7.5, 'normal', [191, 219, 254]);
  doc.text('Hepatocellular carcinoma  |  post-treatment', M + 4 + titleW + 4, by + 6.4);
  const chip = 'PRELIMINARY';
  w.font(7, 'bold', C.amberInk);
  const cw = doc.getTextWidth(chip) + 8;
  w.fill(C.amberFill);
  doc.roundedRect(M + CONTENT_W - 4 - cw, by + 2.4, cw, 5.2, 1, 1, 'F');
  doc.text(chip, M + CONTENT_W - 4 - cw / 2, by + 6, { align: 'center' });

  w.font(7, 'normal', C.muted, 'courier');
  doc.text(`Report ID: ${meta.reportId}`, M, by + 14.2);
  doc.text(`Generated: ${meta.generated}`, M + CONTENT_W / 2, by + 14.2, { align: 'center' });
  doc.text(`Model: v${t(meta.modelVersion ?? 'n/a')}`, M + CONTENT_W, by + 14.2, { align: 'right' });
  w.y = by + 18;
}

function drawDemographics(w: ReportWriter, input: ReportInput) {
  const doc = w.doc;
  const { patient } = input;
  const y0 = w.y, rowH = 12.5, cols = 4, colW = CONTENT_W / cols;
  const tag = (k: string) => {
    const s = input.patientSources?.[k];
    return s === 'REPORT' || s === 'MANUAL' || s === 'DICOM' ? s : undefined;
  };
  const sources = [input.sliceCount ? 'CT (DICOM)' : '', input.form.report_date || Object.keys(input.form.evidence ?? {}).length ? 'clinical report' : ''].filter(Boolean);
  const cells: [string, string, string | undefined, 'bold' | 'normal'][] = [
    ['Patient name', show(patient.name === 'AWAITING DATA...' ? '' : patient.name), tag('name'), 'bold'],
    ['MRN / Hospital ID', show(patient.mrn), tag('mrn'), 'bold'],
    ['Date of birth (age)', missing(patient.dob) ? 'Not recorded' : `${t(patient.dob)}${missing(patient.age) ? '' : ` (${t(patient.age)} y)`}`, tag('dob'), 'normal'],
    ['Sex', show(patient.sex), tag('sex'), 'normal'],
    ['Attending physician', missing(patient.attending) ? 'Not recorded' : `Dr. ${t(patient.attending).replace(/^Dr\.?\s*/i, '')}`, tag('attending'), 'normal'],
    ['Clinical report date', show(input.form.report_date), undefined, 'normal'],
    ['Imaging study', input.sliceCount ? `CT, ${input.sliceCount} slice${input.sliceCount > 1 ? 's' : ''}` : 'Not analysed', undefined, 'normal'],
    ['Data sources', sources.length ? sources.join(' + ') : 'Manual entry', undefined, 'normal'],
  ];

  w.fill(C.white);
  w.stroke(C.navy, 0.4);
  doc.rect(M, y0, CONTENT_W, rowH * 2, 'FD');
  w.fill(C.navyTint);
  doc.rect(M + 0.2, y0 + 0.2, CONTENT_W - 0.4, rowH - 0.2, 'F');
  w.stroke(C.faint, 0.2);
  doc.line(M, y0 + rowH, M + CONTENT_W, y0 + rowH);
  for (let i = 1; i < cols; i++) doc.line(M + i * colW, y0, M + i * colW, y0 + rowH * 2);

  cells.forEach(([label, value, src, style], i) => {
    const x = M + (i % cols) * colW + 2.5;
    const top = y0 + Math.floor(i / cols) * rowH;
    w.label(label, x, top + 4.2);
    w.value(value, x, top + 9.6, colW - 4, i === 0 ? 10.5 : 9, style, src);
  });
  w.y = y0 + rowH * 2 + 4;

  if (input.identity?.is_mismatch || input.identity?.is_unverified) {
    const bad = !!input.identity.is_mismatch;
    const col = bad ? C.high : C.mid;
    w.fill(bad ? GROUP_TINT.High : C.amberFill);
    doc.rect(M, w.y, CONTENT_W, 7, 'F');
    w.fill(col);
    doc.rect(M, w.y, 1.4, 7, 'F');
    w.font(7.8, 'bold', col);
    doc.text(bad
      ? 'IDENTITY MISMATCH: identifiers differ between the DICOM header and the clinical report. Do not use until resolved.'
      : 'IDENTITY NOT VERIFIED: name or MRN is missing from the DICOM header or the clinical report.', M + 4, w.y + 4.6);
    w.y += 10;
  }
}

function drawResultPanel(w: ReportWriter, outlook: RecurrenceOutlook) {
  const doc = w.doc;
  const r = outlook.risk_2yr;
  const g = outlook.risk_group.label;
  const col = GROUP_COLOR[g];
  const h = 47, leftW = 60;
  w.ensure(h + 4);
  const y0 = w.y;

  w.stroke(C.faint, 0.3);
  doc.rect(M, y0, CONTENT_W, h, 'S');
  w.fill(GROUP_TINT[g]);
  doc.rect(M + 0.15, y0 + 0.15, leftW, h - 0.3, 'F');
  w.fill(col);
  doc.rect(M, y0, 1.5, h, 'F');

  // Left: headline number
  const lx = M + 6;
  w.label('2-year recurrence risk', lx, y0 + 7, C.body, 6.5);
  w.font(34, 'bold', col);
  doc.text(`${Math.round(r.risk)}%`, lx, y0 + 22);
  w.font(8.5, 'normal', C.body);
  doc.text(`95% CI ${Math.round(r.lower)}-${Math.round(r.upper)}%`, lx, y0 + 28.5);
  const chip = `${g.toUpperCase()} RISK`;
  w.font(7.5, 'bold', C.white);
  const cw = doc.getTextWidth(chip) + 0.3 * chip.length + 7;
  w.fill(col);
  doc.roundedRect(lx, y0 + 32, cw, 6, 1, 1, 'F');
  doc.text(chip, lx + cw / 2, y0 + 36, { align: 'center', charSpace: 0.3 });
  w.font(6.2, 'normal', C.muted);
  doc.text(`Cohort average ${Math.round(r.cohort_average)}%`, lx, y0 + 43);

  // Right: cohort position gauge (risk groups are tertiles of the model score)
  const gx = M + leftW + 7, gw = M + CONTENT_W - 7 - gx;
  w.label(`Position within reference cohort (n=${outlook.model.n_patients.toLocaleString()})`, gx, y0 + 7, C.body, 6.5);
  const barY = y0 + 12, barH = 6.5;
  (['Low', 'Intermediate', 'High'] as const).forEach((band, i) => {
    w.fill(GROUP_TINT[band]);
    doc.rect(gx + (gw / 3) * i, barY, gw / 3, barH, 'F');
    w.font(6.3, 'bold', GROUP_COLOR[band]);
    doc.text(band.toUpperCase(), gx + (gw / 3) * (i + 0.5), barY + 4.4, { align: 'center', charSpace: 0.3 });
  });
  w.stroke(C.faint, 0.2);
  doc.rect(gx, barY, gw, barH, 'S');
  const pct = Math.max(0, Math.min(100, outlook.cohort_percentile));
  const mx = gx + (pct / 100) * gw;
  w.stroke(C.ink, 0.6);
  doc.line(mx, barY - 1.5, mx, barY + barH + 1.5);
  w.fill(C.ink);
  doc.triangle(mx, barY + barH + 1.2, mx - 1.8, barY + barH + 4, mx + 1.8, barY + barH + 4, 'F');
  w.font(7, 'bold', C.ink);
  const tag = `This patient: ${ordinal(Math.round(pct))} percentile`;
  const tw = doc.getTextWidth(tag);
  doc.text(tag, Math.max(gx, Math.min(gx + gw - tw, mx - tw / 2)), barY + barH + 7.6);
  w.font(5.8, 'normal', C.muted);
  doc.text('0', gx, barY + barH + 3.4);
  doc.text('100', gx + gw, barY + barH + 3.4, { align: 'right' });

  w.stroke(C.line, 0.2);
  doc.line(gx, y0 + 31, gx + gw, y0 + 31);
  const med = outlook.median_rfs;
  const rh = outlook.relative_hazard;
  const stats: [string, string, string][] = [
    ['Median RFS', med.months === null ? 'Not reached' : `${Math.round(med.months)} months`, med.months === null ? '' : `95% CI ${med.lower === null ? 'NR' : Math.round(med.lower)}-${med.upper === null ? 'NR' : Math.round(med.upper)}`],
    ['Hazard vs. average', `${rh.value.toFixed(2)}x`, `95% CI ${rh.lower.toFixed(2)}-${rh.upper.toFixed(2)}`],
    ['1-year RFS', outlook.milestones[0] ? `${Math.round(outlook.milestones[0].rfs)}%` : '-', outlook.milestones[0] ? `95% CI ${Math.round(outlook.milestones[0].lower)}-${Math.round(outlook.milestones[0].upper)}%` : ''],
  ];
  const sw = gw / stats.length;
  stats.forEach(([k, v, sub], i) => {
    const sx = gx + i * sw;
    w.label(k, sx, y0 + 35.5);
    w.font(9.5, 'bold', C.ink);
    doc.text(t(v), sx, y0 + 40.5);
    w.font(6.2, 'normal', C.muted);
    doc.text(t(sub), sx, y0 + 44);
  });
  w.y = y0 + h + 4;
}

function impressionLines(input: ReportInput, outlook: RecurrenceOutlook): string[] {
  const r = outlook.risk_2yr;
  const lines = [
    `Estimated 2-year recurrence risk ${Math.round(r.risk)}% (95% CI ${Math.round(r.lower)}-${Math.round(r.upper)}%): ${outlook.risk_group.label.toLowerCase()} risk group, ${ordinal(outlook.cohort_percentile)} percentile of the reference cohort (cohort average ${Math.round(r.cohort_average)}%).`,
  ];
  const factors = outlook.explanation.contributions.filter(c => c.available);
  const fmt = (c: (typeof factors)[number]) => `${t(c.label)}${missing(c.value) ? '' : `: ${t(c.value)}`} (${c.points > 0 ? '+' : '-'}${Math.abs(c.points).toFixed(1)} pts)`;
  const up = factors.filter(c => c.points >= 0.5).sort((a, b) => b.points - a.points).slice(0, 3);
  const down = factors.filter(c => c.points <= -0.5).sort((a, b) => a.points - b.points).slice(0, 3);
  if (up.length) lines.push(`Main factors raising the estimate: ${up.map(fmt).join('; ')}.`);
  if (down.length) lines.push(`Main factors lowering the estimate: ${down.map(fmt).join('; ')}.`);
  const med = outlook.median_rfs;
  const m2 = outlook.milestones.find(m => m.months === 24);
  lines.push(`Median recurrence-free survival ${med.months === null ? 'not reached within follow-up' : `${Math.round(med.months)} months (95% CI ${med.lower === null ? 'NR' : Math.round(med.lower)}-${med.upper === null ? 'NR' : Math.round(med.upper)})`}${m2 ? `; recurrence-free at 2 years ${Math.round(m2.rfs)}%` : ''}.`);
  if (outlook.imputed_inputs.length) lines.push(`${outlook.imputed_inputs.length} model input${outlook.imputed_inputs.length > 1 ? 's were' : ' was'} unavailable and set to the cohort average (${outlook.imputed_inputs.join(', ')}).`);
  if (input.identity?.is_mismatch) lines.push('Patient identity mismatch between imaging and report: result must not be used until resolved.');
  return lines;
}

function drawImpression(w: ReportWriter, lines: string[]) {
  const doc = w.doc;
  const size = 8.2, lh = size * 0.44, textW = CONTENT_W - 14;
  w.font(size, 'normal');
  const wrapped = lines.map(l => doc.splitTextToSize(t(l), textW) as string[]);
  const h = 9 + wrapped.reduce((s, l) => s + l.length * lh + 1.6, 0) + 1.5;
  w.ensure(h + 3);
  const y0 = w.y;
  w.fill(C.navyTint);
  doc.rect(M, y0, CONTENT_W, h, 'F');
  w.fill(C.navy);
  doc.rect(M, y0, 1.5, h, 'F');
  w.label('Impression', M + 5, y0 + 5.5, C.navy, 7.5);
  let y = y0 + 9;
  wrapped.forEach((ls, i) => {
    w.font(size, 'bold', C.navy);
    doc.text(`${i + 1}.`, M + 5, y + size * 0.35);
    w.font(size, 'normal', C.body);
    ls.forEach((l, k) => doc.text(l, M + 10, y + size * 0.35 + k * lh));
    y += ls.length * lh + 1.6;
  });
  w.y = y0 + h + 4;
}

// ---------------------------------------------------------------------------
// Charts and images
// ---------------------------------------------------------------------------
function drawSurvivalChart(w: ReportWriter, outlook: RecurrenceOutlook) {
  const doc = w.doc;
  const h = 58;
  w.ensure(h + 14);
  const x0 = M + 12, y0 = w.y + 1, cw = CONTENT_W - 16, ch = h - 10;
  const px = (m: number) => x0 + (m / 60) * cw;
  const py = (v: number) => y0 + ch - (v / 100) * ch;

  w.stroke(C.line, 0.15);
  w.font(6.5, 'normal', C.muted);
  for (const v of [0, 25, 50, 75, 100]) {
    doc.line(x0, py(v), x0 + cw, py(v));
    doc.text(`${v}%`, x0 - 2, py(v) + 1, { align: 'right' });
  }
  for (const m of [0, 12, 24, 36, 48, 60]) doc.text(String(m), px(m), y0 + ch + 4, { align: 'center' });
  doc.text('Months since treatment', x0 + cw / 2, y0 + ch + 8, { align: 'center' });

  // Cohort Kaplan-Meier curves by risk group (dashed, observed)
  const months = outlook.cohort_curves.months;
  (['Low', 'Intermediate', 'High'] as const).forEach(g => {
    w.stroke(GROUP_COLOR[g], 0.3);
    doc.setLineDashPattern([1.2, 1], 0);
    const series = outlook.cohort_curves[g];
    for (let i = 1; i < months.length; i++) {
      doc.line(px(months[i - 1]), py(series[i - 1]), px(months[i]), py(series[i - 1]));
      doc.line(px(months[i]), py(series[i - 1]), px(months[i]), py(series[i]));
    }
  });
  doc.setLineDashPattern([], 0);

  // Patient curve with 95% CI band (stepped)
  doc.setFillColor(191, 219, 254);
  const pts = outlook.curve;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    doc.rect(px(a.month), py(a.upper), px(pts[i].month) - px(a.month), Math.max(0.05, py(a.lower) - py(a.upper)), 'F');
  }
  w.stroke(C.navy, 0.7);
  for (let i = 1; i < pts.length; i++) {
    doc.line(px(pts[i - 1].month), py(pts[i - 1].rfs), px(pts[i].month), py(pts[i - 1].rfs));
    doc.line(px(pts[i].month), py(pts[i - 1].rfs), px(pts[i].month), py(pts[i].rfs));
  }
  w.stroke(C.muted, 0.2);
  doc.setLineDashPattern([0.6, 0.8], 0);
  doc.line(px(24), y0, px(24), y0 + ch);
  doc.setLineDashPattern([], 0);
  w.stroke(C.faint, 0.3);
  doc.rect(x0, y0, cw, ch, 'S');

  // Legend
  const ly = y0 + ch + 13;
  w.font(6.5, 'normal', C.muted);
  w.fill(C.navy);
  doc.rect(x0, ly - 1.6, 5, 1.2, 'F');
  doc.text('This patient (shaded: 95% CI)', x0 + 6.5, ly);
  let lx = x0 + 46;
  (['Low', 'Intermediate', 'High'] as const).forEach(g => {
    w.stroke(GROUP_COLOR[g], 0.3);
    doc.setLineDashPattern([1.2, 1], 0);
    doc.line(lx, ly - 1, lx + 5, ly - 1);
    doc.setLineDashPattern([], 0);
    doc.text(g, lx + 6.5, ly);
    lx += 8 + doc.getTextWidth(g) + 3;
  });
  doc.text('risk groups: observed cohort Kaplan-Meier (dashed)', lx + 1, ly);
  w.y = ly + 5;
}

function drawContributions(w: ReportWriter, outlook: RecurrenceOutlook) {
  const ex = outlook.explanation;
  const factors = ex.contributions.filter(c => c.available);
  const doc = w.doc;
  const maxAbs = Math.max(0.5, ...factors.map(c => Math.abs(c.points)));
  const labelW = 52, valueW = 40, effW = 20, barW = CONTENT_W - labelW - valueW - effW - 4;
  const center = M + labelW + valueW + barW / 2;
  const rowH = 5;

  w.paragraph(`Starting from a patient with every input at the cohort average (${ex.base_risk.toFixed(0)}% 2-year risk), each factor below moves the estimate to this patient's ${ex.final_risk.toFixed(0)}%. Contributions are exact Shapley values in percentage points and add up to the difference.`, { size: 7.8, color: C.muted });

  const header = () => {
    w.fill(C.navy);
    doc.rect(M, w.y, CONTENT_W, 5.8, 'F');
    w.font(6.4, 'bold', C.white);
    doc.text('FACTOR', M + 1.8, w.y + 3.9);
    doc.text('PATIENT VALUE', M + labelW, w.y + 3.9);
    doc.text('<- LOWERS RISK', center - 2, w.y + 3.9, { align: 'right' });
    doc.text('RAISES RISK ->', center + 2, w.y + 3.9);
    doc.text('EFFECT', M + CONTENT_W - 1.8, w.y + 3.9, { align: 'right' });
    w.y += 5.8;
  };
  w.ensure(6 + rowH * Math.min(4, factors.length));
  header();

  factors.forEach((c, i) => {
    if (w.y + rowH > BOTTOM) { doc.addPage(); w.y = TOP; header(); }
    if (i % 2 === 1) { w.fill(C.zebra); doc.rect(M, w.y, CONTENT_W, rowH, 'F'); }
    const base = w.y + 3.4;
    w.font(7.8, 'bold', C.body);
    doc.text(t(c.label), M + 1.8, base);
    w.font(7.8, 'normal', C.muted);
    doc.text(show(c.value, '-'), M + labelW, base, { maxWidth: valueW - 2 });
    const len = (Math.abs(c.points) / maxAbs) * (barW / 2 - 2);
    const col = c.points > 0 ? C.high : C.low;
    w.fill(col);
    doc.rect(c.points > 0 ? center : center - len, w.y + 1.2, Math.max(0.3, len), 2.6, 'F');
    w.stroke(C.faint, 0.2);
    doc.line(center, w.y, center, w.y + rowH);
    w.font(7.8, 'bold', col);
    doc.text(`${c.points > 0 ? '+' : c.points < 0 ? '-' : ''}${Math.abs(c.points).toFixed(1)} pts`, M + CONTENT_W - 1.8, base, { align: 'right' });
    w.y += rowH;
  });
  w.stroke(C.navy, 0.3);
  doc.line(M, w.y, M + CONTENT_W, w.y);
  w.y += 3;
  w.paragraph('Positive values raise and negative values lower the 2-year risk relative to the cohort average. Associations learned by the model, not causal effects.', { size: 6.8, color: C.muted, style: 'italic' });
}

function addImages(w: ReportWriter, images: KeyImage[], note?: string) {
  if (images.length === 0) {
    w.paragraph(note ?? 'No CT images available for this report.', { color: C.muted, style: 'italic' });
    return;
  }
  const doc = w.doc;
  const gap = 4;
  const per = images.length;
  const cellW = per === 1 ? CONTENT_W * 0.5 : (CONTENT_W - gap * (per - 1)) / per;
  const maxH = per === 1 ? 78 : 60;
  const dims = images.map(img => {
    let iw = cellW, ih = cellW / img.aspect;
    if (ih > maxH) { ih = maxH; iw = ih * img.aspect; }
    return { iw, ih };
  });
  const rowH = Math.max(...dims.map(d => d.ih));
  w.ensure(rowH + 14);
  images.forEach((img, i) => {
    const cx = M + i * (cellW + gap);
    doc.setFillColor(0, 0, 0);
    doc.rect(cx, w.y, cellW, rowH, 'F');
    doc.addImage(img.dataUrl, 'JPEG', cx + (cellW - dims[i].iw) / 2, w.y + (rowH - dims[i].ih) / 2, dims[i].iw, dims[i].ih);
    w.stroke(C.navy, 0.4);
    doc.rect(cx, w.y, cellW, rowH, 'S');
    w.fill(C.navy);
    doc.rect(cx, w.y + rowH, cellW, 5, 'F');
    w.font(6.8, 'bold', C.white);
    doc.text(`FIG. ${i + 1}  ${img.plane.toUpperCase()}`, cx + 2, w.y + rowH + 3.4, { charSpace: 0.3 });
    w.font(6.8, 'normal', C.muted);
    doc.text((doc.splitTextToSize(t(img.caption), cellW) as string[])[0], cx, w.y + rowH + 8.6);
  });
  w.y += rowH + 12;
  if (note) w.paragraph(note, { size: 7.2, color: C.muted, style: 'italic' });
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
export function buildClinicalReportPdf(input: ReportInput): jsPDF {
  const w = new ReportWriter();
  const { doc } = w;
  const { patient, form, outlook } = input;
  const generated = new Date();
  const generatedText = `${generated.toISOString().slice(0, 16).replace('T', ' ')} UTC`;
  const reportId = input.inferenceId ? input.inferenceId.replace(/[^A-Za-z0-9]/g, '').slice(0, 8).toUpperCase() : 'NA';
  const patientName = patient.name === 'AWAITING DATA...' ? 'Unknown patient' : t(patient.name);

  doc.setProperties({
    title: `Recurrence risk assessment - ${patient.mrn || 'unknown MRN'} - ${reportId}`,
    subject: 'AI-assisted hepatocellular carcinoma recurrence risk assessment',
    author: 'HepatoAI Clinical Decision Support',
    creator: 'HepatoAI',
    keywords: 'HCC, recurrence, risk, decision support',
  });

  // ---- Page 1: header, demographics, result summary ----
  drawDocumentHeader(w, { reportId, generated: generatedText, modelVersion: input.modelVersion });
  drawDemographics(w, input);

  w.section('Result summary', 50);
  if (outlook) {
    drawResultPanel(w, outlook);
    drawImpression(w, impressionLines(input, outlook));
  } else {
    w.paragraph('The recurrence-free survival model was unavailable for this patient; no time-based risk estimate is reported.', { color: C.mid, style: 'italic' });
  }

  // ---- Survival estimate ----
  if (outlook) {
    w.section('Recurrence-free survival estimate', 30);
    w.table(
      ['Horizon', 'Recurrence-free survival', 'Cumulative recurrence risk'],
      outlook.milestones.map(m => [
        `${m.months / 12} year${m.months > 12 ? 's' : ''}`,
        `${Math.round(m.rfs)}% (95% CI ${Math.round(m.lower)}-${Math.round(m.upper)}%)`,
        `${Math.round(100 - m.rfs)}% (95% CI ${Math.round(100 - m.upper)}-${Math.round(100 - m.lower)}%)`,
      ]),
      [42, 70, 70],
    );
    w.subheading('Recurrence-free survival over time', 70);
    drawSurvivalChart(w, outlook);
  }

  // ---- Key images ----
  w.section('Key CT images', input.keyImages.length === 1 ? 92 : input.keyImages.length ? 75 : 8);
  addImages(w, input.keyImages, input.keyImageNote);

  // ---- Explanation ----
  if (outlook) {
    w.section('Factors contributing to this estimate', 30);
    drawContributions(w, outlook);
  }

  // ---- Source data ----
  w.section('Clinical data used', 25);
  const srcLabel = (field: string) => (input.manualOverrides[field] ? 'Manual' : form.sources?.[field] === 'PDF' || form.sources?.[field] === 'NLP' ? 'Report' : form.sources?.[field] ?? '-');
  const radiology: [string, string, string][] = [
    ['Tumor size', 'tumor_size_cm', 'cm'], ['Tumor count', 'tumor_number', ''], ['Tumor density', 'tumor_density_hu', 'HU'],
    ['Margin', 'margin_definition', ''], ['Enhancement', 'enhancement_pattern', ''],
  ];
  w.subheading('Imaging findings');
  w.table(
    ['Feature', 'Value', 'Source', 'Evidence (report text)'],
    [
      ...radiology.map(([label, f, unit]) => [label, missing(form[f]) ? 'Not in report' : `${t(form[f])}${unit ? ` ${unit}` : ''}`, missing(form[f]) ? '-' : srcLabel(f), form.evidence?.[f] ?? '']),
      ...(form.lirads_category ? [['LI-RADS', t(form.lirads_category), 'Report', '']] : []),
    ],
    [30, 36, 18, 98],
    { size: 7.4, colors: radiology.map(([, f]) => [null, missing(form[f]) ? C.muted : null, null, C.muted]) },
  );

  const labs: [string, string, string, number, number][] = [
    ['AFP', 'afp_ngml', 'ng/mL', 0, 10], ['ALP', 'alp_iul', 'IU/L', 40, 120], ['ALT', 'alt_iul', 'IU/L', 7, 56], ['AST', 'ast_iul', 'IU/L', 10, 40],
    ['Bilirubin', 'bilirubin_mgdl', 'mg/dL', 0.1, 1.2], ['Albumin', 'albumin_gdl', 'g/dL', 3.5, 5.0], ['Platelets', 'platelet_k_ul', 'x10³/µL', 150, 400],
  ];
  w.subheading('Laboratory results');
  const labColors: (RGB | null)[][] = [];
  const labRows = labs.map(([label, f, unit, lo, hi]) => {
    const meta = input.manualOverrides[f] ? undefined : form.lab_meta?.[f];
    const v = form[f];
    if (missing(v)) { labColors.push([null, C.muted, null, null, null]); return [label, 'Not reported', '', '', '']; }
    const num = Number(v);
    const ref = meta?.reference ? meta.reference.text : `${lo}-${hi} (typical)`;
    const low = meta?.reference ? meta.reference.low : lo;
    const high = meta?.reference ? meta.reference.high : hi;
    const flag = meta?.flag ?? (high !== null && num > high ? 'H' : low !== null && num < low ? 'L' : '');
    labColors.push([null, flag ? (flag === 'H' ? C.high : C.mid) : null, C.muted, null, flag === 'H' ? C.high : flag === 'L' ? C.mid : C.low]);
    const reported = meta && meta.reported_unit && Math.abs(meta.reported_value - meta.value) > 1e-6 ? ` (reported ${meta.reported_value} ${meta.reported_unit})` : '';
    return [label, `${t(v)} ${unit}${reported}`, t(ref), srcLabel(f), flag === 'H' ? 'H  High' : flag === 'L' ? 'L  Low' : 'Normal'];
  });
  w.table(['Test', 'Result', 'Reference range', 'Source', 'Flag'], labRows, [26, 66, 46, 22, 22], { size: 7.4, colors: labColors });

  w.subheading('Clinical findings and staging');
  const statusText = (f: string) => {
    if (input.manualOverrides[f]) return form[f] === true ? 'Present (manual)' : form[f] === false ? 'Absent (manual)' : 'Unknown (manual)';
    const s = form.findings?.[f]?.status;
    return s === 'present' ? 'Present' : s === 'absent' ? 'Absent' : s === 'possible' ? 'Possible' : form[f] === true ? 'Present' : form[f] === false ? 'Absent' : 'Not mentioned';
  };
  const cp = form.child_pugh;
  const findingRows = [
    ...([['Cirrhosis', 'cirrhosis_present'], ['Microvascular invasion', 'mvi_pathology'], ['Hepatitis B', 'hepatitis_b'], ['Hepatitis C', 'hepatitis_c']] as const)
      .map(([label, f]) => [label, statusText(f) + (form.findings?.[f]?.conflicting ? ' - conflicting statements' : ''), form.evidence?.[f] ?? '']),
    ['Child-Pugh', missing(form.child_pugh_score) ? 'Not stated' : cp && !input.manualOverrides.child_pugh_score ? `Class ${cp.class}${cp.score ? ` (${cp.score})` : ''}, ${cp.method}` : `Class ${String(form.child_pugh_score).charAt(0)}`, form.evidence?.child_pugh_score ?? ''],
    ['BCLC stage', missing(form.bclc_stage) ? 'Not stated' : `Stage ${t(form.bclc_stage)}`, form.evidence?.bclc_stage ?? ''],
  ];
  w.table(['Finding', 'Status', 'Evidence (report text)'], findingRows, [42, 44, 96], {
    size: 7.4,
    colors: findingRows.map(r => [null, r[1].startsWith('Present') ? C.high : r[1].startsWith('Not') ? C.muted : null, C.muted]),
  });

  // ---- Model information and limitations ----
  w.section('Model information and limitations', 30);
  if (outlook) {
    const mc = outlook.model;
    w.table(['Item', 'Detail'], [
      ['Model', `${mc.name}, version ${mc.version}`],
      ['Training cohort', `${mc.n_patients.toLocaleString()} patients, ${mc.n_events.toLocaleString()} recurrences, follow-up to ${mc.follow_up_months} months`],
      ['Discrimination', `Concordance index ${mc.c_index_holdout.toFixed(2)} on the hold-out set`],
      ['Validation', mc.validation],
      ['Risk groups', outlook.risk_group.definition],
      ['Uncertainty', '95% confidence intervals from 100 bootstrap refits of the model'],
    ], [42, 140], { size: 7.4 });
    const cal = mc.calibration.filter(c => c.months === 24);
    if (cal.length) {
      w.subheading('Calibration at 2 years (hold-out set)');
      w.table(['Risk group', 'Predicted recurrence-free', 'Observed recurrence-free', 'Difference'],
        cal.map(c => [c.group, `${c.predicted_rfs.toFixed(1)}%`, `${c.observed_rfs.toFixed(1)}%`, `${(c.predicted_rfs - c.observed_rfs) >= 0 ? '+' : ''}${(c.predicted_rfs - c.observed_rfs).toFixed(1)} pts`]),
        [42, 50, 50, 40], { size: 7.4 });
    }
  }
  const limits: string[] = [];
  if (outlook?.imputed_inputs.length) limits.push(`Not available and set to the cohort average (no effect on the estimate): ${outlook.imputed_inputs.join(', ')}.`);
  if (!input.sliceCount) limits.push('No CT scan was analysed; imaging-derived inputs come from the report text only.');
  if (input.dataDriftDetected) limits.push("The imaging profile differs from the model's training population.");
  limits.push('Values were extracted automatically from the uploaded documents and must be checked against the source records.');
  limits.push('The model has not been externally validated; estimates apply to populations similar to the training cohort.');
  w.ensure(8);
  limits.forEach(l => w.paragraph(`•  ${l}`, { size: 7.8, indent: 0 }));

  // ---- Authorization ----
  w.section('Authorization', 52);
  const rev = input.reviewer;
  const boxH = 44;
  const by = w.y;
  w.stroke(C.faint, 0.3);
  doc.rect(M, by, CONTENT_W, boxH, 'S');
  const third = CONTENT_W / 3;
  const meta: [string, string, RGB][] = [
    ['Report status', 'PRELIMINARY - pending review', C.amberInk],
    ['Generated by', `HepatoAI CDS, model v${t(input.modelVersion ?? 'n/a')}`, C.ink],
    ['Generated at', generatedText, C.ink],
  ];
  meta.forEach(([k, v, col], i) => {
    w.label(k, M + 3 + i * third, by + 5);
    w.font(8, 'bold', col);
    doc.text(t(v), M + 3 + i * third, by + 9.5);
  });
  w.stroke(C.line, 0.2);
  doc.line(M, by + 13, M + CONTENT_W, by + 13);
  w.font(7.4, 'italic', C.muted);
  doc.text(doc.splitTextToSize('This assessment is clinical decision support and is not a diagnosis. It becomes final only after review and signature by the responsible physician, who remains accountable for interpretation and management decisions.', CONTENT_W - 6), M + 3, by + 17.5);

  const sigY = by + 36;
  if (rev?.signature?.startsWith('data:image')) {
    const fmt = rev.signature.startsWith('data:image/png') ? 'PNG' : 'JPEG';
    try { doc.addImage(rev.signature, fmt, M + 3, sigY - 12, 36, 11); } catch { /* unreadable signature image */ }
  }
  w.stroke(C.ink, 0.3);
  const sig: [string, string][] = [
    ['Reviewing physician', rev?.name ? `Dr. ${t(rev.name)}${rev.level ? `, ${t(rev.level)}` : ''}` : ''],
    ['Signature', ''],
    ['Date / time', ''],
  ];
  sig.forEach(([k, v], i) => {
    const sx = M + 3 + i * third;
    doc.line(sx, sigY, sx + third - 8, sigY);
    if (v) { w.font(8, 'normal', C.ink); doc.text(v, sx, sigY - 1.5); }
    w.label(k, sx, sigY + 3.8);
  });
  w.y = by + boxH + 6;
  w.font(7.5, 'bold', C.muted);
  doc.text('***  END OF REPORT  ***', PAGE_W / 2, w.y, { align: 'center', charSpace: 0.6 });

  // ---- Continuation header and footer on every page ----
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    if (i > 1) {
      drawLogo(doc, M, 7.5, 8);
      drawWordmark(doc, M + 10.5, 12.6, 10.5);
      w.label('Recurrence risk assessment', M + 10.6, 16.6, C.muted, 5.8);
      const bx = M + CONTENT_W - 96;
      w.fill(C.zebra);
      w.stroke(C.faint, 0.25);
      doc.rect(bx, 7, 96, 11, 'FD');
      w.font(8, 'bold', C.ink);
      doc.text((doc.splitTextToSize(patientName, 90) as string[])[0], bx + 3, 11.4);
      w.font(6.8, 'normal', C.body, 'courier');
      doc.text(`MRN ${show(patient.mrn, '-')} | DOB ${show(patient.dob, '-')} | ${show(patient.sex, '-')} | RPT ${reportId}`, bx + 3, 15.6);
      w.stroke(C.navy, 0.5);
      doc.line(M, 20.5, M + CONTENT_W, 20.5);
    }

    w.stroke(C.navy, 0.4);
    doc.line(M, PAGE_H - 14, M + CONTENT_W, PAGE_H - 14);
    w.font(6.3, 'normal', C.muted);
    doc.text(`HepatoAI Clinical Decision Support  |  Report ${reportId}  |  Generated ${generatedText}`, M, PAGE_H - 10.3);
    w.font(7, 'bold', C.navy);
    doc.text(`Page ${i} of ${pages}`, M + CONTENT_W, PAGE_H - 10.3, { align: 'right' });
    w.font(6, 'normal', C.muted);
    doc.text('AI-assisted decision support, not a diagnosis. Verify all values against the source records.', M, PAGE_H - 6.5);
    w.font(6, 'bold', C.navy);
    doc.text('CONFIDENTIAL - PROTECTED HEALTH INFORMATION', M + CONTENT_W, PAGE_H - 6.5, { align: 'right' });
  }
  return doc;
}
