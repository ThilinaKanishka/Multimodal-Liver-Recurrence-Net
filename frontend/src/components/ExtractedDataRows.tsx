import React from 'react';

/** Provenance shown in the source popup when a row is clicked. */
export interface RowEvidence {
  source: string;
  evidence?: string;
  details?: string[];
}

export interface OverrideOption {
  label: string;
  value: string | number | boolean;
}

export interface LabMeta {
  value: number;
  unit: string;
  reported_value: number;
  reported_unit: string | null;
  unit_assumed: boolean;
  reference: { low: number | null; high: number | null; text: string } | null;
  flag: 'H' | 'L' | null;
  evidence: string;
}

export interface FindingMeta {
  status: 'present' | 'absent' | 'possible' | 'not_mentioned';
  mentions: number;
  evidence: string | null;
  conflicting: boolean;
}

export interface ChildPughMeta {
  class: string;
  score: number | null;
  method: 'reported' | 'calculated';
  evidence: string;
}

type ClickHandler = (e: React.MouseEvent, label: string, value: unknown, info: RowEvidence) => void;
type OverrideHandler = (e: React.MouseEvent, label: string, value: unknown, field: string, options?: OverrideOption[]) => void;

interface BaseRowProps {
  label: string;
  field: string;
  overridden: boolean;
  extractionDone: boolean;
  source?: string;
  evidence?: string;
  onClick: ClickHandler;
  onOverride: OverrideHandler;
}

const isMissing = (v: unknown) => v === undefined || v === null || v === '' || v === '--';

const SOURCE_BADGE: Record<string, string> = {
  DICOM: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
  NLP: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  PDF: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  MANUAL: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
};

const MissingText: React.FC<{ extractionDone: boolean; text?: string }> = ({ extractionDone, text = 'Not in report' }) =>
  extractionDone ? <span className="text-slate-500 italic font-sans font-normal">{text}</span> : <span className="text-slate-600 font-sans font-normal">Awaiting data…</span>;

const rowClass = 'flex items-center justify-between gap-2 py-1.5 border-b border-white/5 hover:bg-white/5 px-2 -mx-2 rounded transition-colors group cursor-pointer min-h-[32px]';

/** Radiology measurement or descriptor stated in the report. */
export const RadiologyRow: React.FC<BaseRowProps & { value: unknown; unit?: string; display?: string }> = ({
  label, field, value, unit, display, overridden, extractionDone, source, evidence, onClick, onOverride,
}) => {
  const src = overridden ? 'MANUAL' : source;
  const missing = isMissing(value);
  return (
    <div
      className={rowClass}
      title={evidence ? `“${evidence}”` : undefined}
      onClick={e => onClick(e, label, value, { source: src || 'Not extracted', evidence })}
      onContextMenu={e => onOverride(e, label, missing ? '' : value, field)}
    >
      <div className="text-[11px] text-slate-400 font-sans group-hover:text-slate-300 flex-shrink-0">{label}</div>
      <div className="flex items-center gap-2 min-w-0">
        <div className="font-mono text-white font-bold text-[11px] text-right truncate" title={String(display ?? value)}>
          {missing && !display ? <MissingText extractionDone={extractionDone} /> : (
            <>{display ?? String(value)}{!display && unit && <span className="text-slate-500 text-[10px] ml-1 font-normal">{unit}</span>}</>
          )}
        </div>
        <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border w-14 text-center flex-shrink-0 ${src && !missing ? SOURCE_BADGE[src] ?? SOURCE_BADGE.MANUAL : 'bg-slate-500/10 text-slate-500 border-slate-500/30'}`}>
          {src && (!missing || display) ? (src === 'NLP' ? 'REPORT' : src) : '—'}
        </span>
      </div>
    </div>
  );
};

/** Lab value with the report's reference range (or a typical range, marked as such) and H/L flag. */
export const LabRow: React.FC<BaseRowProps & { value: unknown; unit: string; typicalMin: number; typicalMax: number; meta?: LabMeta }> = ({
  label, field, value, unit, typicalMin, typicalMax, meta, overridden, extractionDone, evidence, onClick, onOverride,
}) => {
  const missing = isMissing(value);
  const num = Number(value);
  const useReport = !!meta?.reference && !overridden;
  const low = useReport ? meta!.reference!.low : typicalMin;
  const high = useReport ? meta!.reference!.high : typicalMax;
  let flag: 'H' | 'L' | null = null;
  if (!missing && !Number.isNaN(num)) {
    if (!overridden && meta?.flag) flag = meta.flag;
    else if (high !== null && num > high) flag = 'H';
    else if (low !== null && num < low) flag = 'L';
  }
  const rangeText = low !== null && high !== null ? `${low}–${high}` : high !== null ? `<${high}` : low !== null ? `>${low}` : '';
  const details = meta && !overridden
    ? [
        `Reported: ${meta.reported_value} ${meta.reported_unit ?? '(no unit)'}${meta.unit_assumed ? ' (unit inferred from magnitude)' : ''}`,
        meta.reported_unit && meta.reported_unit.toLowerCase() !== meta.unit.toLowerCase() ? `Converted to ${meta.value} ${meta.unit}` : '',
        meta.reference ? `Reference (report): ${meta.reference.text}` : `Reference: typical adult range ${typicalMin}–${typicalMax} ${unit} (not printed in report)`,
      ].filter(Boolean)
    : undefined;

  return (
    <div
      className={rowClass}
      title={evidence ? `“${evidence}”` : undefined}
      onClick={e => onClick(e, label, value, { source: overridden ? 'MANUAL' : meta ? 'PDF' : 'Not extracted', evidence, details })}
      onContextMenu={e => onOverride(e, label, missing ? '' : value, field)}
    >
      <div className="text-[11px] text-slate-400 font-sans group-hover:text-slate-300 w-[22%] flex-shrink-0">{label}</div>
      <div className="font-mono text-white font-bold text-xs w-[30%] truncate">
        {missing ? <MissingText extractionDone={extractionDone} text="Not reported" /> : <>{String(value)} <span className="text-slate-500 text-[10px] font-normal">{unit}</span></>}
      </div>
      <div className="text-[10px] text-slate-500 font-mono w-[26%] text-center truncate" title={useReport ? 'Reference range printed in the report' : 'Typical adult range; the report did not print one'}>
        {missing ? '' : <>{rangeText}{!useReport && <span className="text-slate-600"> typ.</span>}</>}
      </div>
      <div className={`text-[10px] font-bold w-[22%] text-right flex items-center justify-end gap-1 ${missing ? 'text-slate-600' : flag === 'H' ? 'text-rose-400' : flag === 'L' ? 'text-amber-400' : 'text-emerald-400'}`}>
        {missing ? '—' : flag === 'H' ? '▲ High' : flag === 'L' ? '▼ Low' : 'Normal'}
        {overridden && <span className="ml-1 text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-1 rounded-full">MANUAL</span>}
      </div>
    </div>
  );
};

const FINDING_OPTIONS: OverrideOption[] = [
  { label: 'Present', value: true },
  { label: 'Absent', value: false },
  { label: 'Unknown', value: '--' },
];

/** Clinical finding with three states and the report sentence it came from. */
export const FindingRow: React.FC<BaseRowProps & { value: unknown; meta?: FindingMeta }> = ({
  label, field, value, meta, overridden, extractionDone, evidence, onClick, onOverride,
}) => {
  const status: FindingMeta['status'] | null = overridden
    ? value === true ? 'present' : value === false ? 'absent' : 'not_mentioned'
    : meta?.status ?? (value === true ? 'present' : value === false ? 'absent' : null);
  const look = {
    present: { icon: '●', cls: 'text-rose-300', text: 'Present' },
    absent: { icon: '○', cls: 'text-slate-300', text: 'Absent' },
    possible: { icon: '◐', cls: 'text-amber-300', text: 'Possible' },
    not_mentioned: { icon: '–', cls: 'text-slate-500', text: 'Not mentioned' },
  } as const;
  const s = status ? look[status] : null;
  return (
    <div
      className={rowClass}
      title={evidence ? `“${evidence}”` : undefined}
      onClick={e => onClick(e, label, s?.text ?? value, {
        source: overridden ? 'MANUAL' : meta && meta.mentions > 0 ? 'NLP' : 'Not extracted',
        evidence,
        details: meta && !overridden ? [`${meta.mentions} mention${meta.mentions === 1 ? '' : 's'} in report`, meta.conflicting ? 'Report contains conflicting statements: please verify' : ''].filter(Boolean) : undefined,
      })}
      onContextMenu={e => onOverride(e, label, value, field, FINDING_OPTIONS)}
    >
      <span className="text-[11px] text-slate-300 font-sans">{label}</span>
      <div className="flex items-center gap-2 text-[10.5px] font-semibold">
        {!s ? <MissingText extractionDone={extractionDone} text="Not mentioned" /> : (
          <span className={`flex items-center gap-1.5 ${s.cls}`}>
            <span aria-hidden>{s.icon}</span>{s.text}
          </span>
        )}
        {meta?.conflicting && !overridden && <span className="text-[8px] font-bold uppercase text-amber-400 border border-amber-500/30 bg-amber-500/10 px-1 rounded">Conflict</span>}
        {overridden && <span className="text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-1 rounded-full">MANUAL</span>}
      </div>
    </div>
  );
};

/** Staging value (Child-Pugh / BCLC) with how it was obtained. */
export const StagingRow: React.FC<BaseRowProps & { value: unknown; display?: string; method?: string; options: OverrideOption[] }> = ({
  label, field, value, display, method, options, overridden, extractionDone, evidence, onClick, onOverride,
}) => {
  const missing = isMissing(value);
  return (
    <div
      className={rowClass}
      title={evidence ? `“${evidence}”` : undefined}
      onClick={e => onClick(e, label, display ?? value, { source: overridden ? 'MANUAL' : missing ? 'Not extracted' : 'NLP', evidence, details: method && !overridden ? [method] : undefined })}
      onContextMenu={e => onOverride(e, label, value, field, options)}
    >
      <span className="text-[11px] text-slate-300 font-sans">{label}</span>
      <div className="flex items-center gap-2 text-[10.5px]">
        {missing ? <MissingText extractionDone={extractionDone} text="Not stated" /> : (
          <>
            <span className="font-mono font-bold text-white">{display ?? String(value)}</span>
            {method && !overridden && <span className="text-[9px] text-slate-500">{method}</span>}
          </>
        )}
        {overridden && <span className="text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-1 rounded-full">MANUAL</span>}
      </div>
    </div>
  );
};
