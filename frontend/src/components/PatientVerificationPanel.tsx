import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle, XCircle } from 'lucide-react';

export interface VerificationField {
  dicom_value: string;
  report_value: string;
  match: boolean;
}

export interface VerificationData {
  name: VerificationField;
  mrn: VerificationField;
  dob: VerificationField;
  age: VerificationField;
  sex: VerificationField;
  is_all_match: boolean;
  is_partial_match: boolean;
  is_mismatch: boolean;
}

interface PatientVerificationPanelProps {
  data: VerificationData | null;
}

export const PatientVerificationPanel: React.FC<PatientVerificationPanelProps> = ({ data }) => {
  const [expanded, setExpanded] = useState(true);

  if (!data) return null;

  const getStatusColor = () => {
    if (data.is_all_match) return "border-[#00ff9d]";
    if (data.is_mismatch) return "border-rose-500";
    return "border-amber-500";
  };

  const getStatusText = () => {
    if (data.is_all_match) return "✅ ALL FIELDS MATCH";
    if (data.is_mismatch) return "❌ MISMATCH DETECTED — Review Required";
    return "⚠️ PARTIAL MATCH";
  };

  return (
    <div className={`w-full bg-[#0a0f18] border border-white/10 rounded-lg overflow-hidden flex flex-col mb-2 border-l-4 ${getStatusColor()} shadow-lg`}>
      <div 
        className="flex items-center justify-between p-3 bg-black/40 cursor-pointer hover:bg-black/60 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-black tracking-[0.1em] text-white flex items-center gap-2">
            👤 PATIENT VERIFICATION
          </span>
        </div>
        <div className="flex items-center gap-3 text-slate-400 text-xs font-mono uppercase">
          {expanded ? (
            <span className="flex items-center gap-1 hover:text-white"><ChevronDown className="w-4 h-4" /> Collapse</span>
          ) : (
            <span className="flex items-center gap-1 hover:text-white"><ChevronRight className="w-4 h-4" /> Expand</span>
          )}
        </div>
      </div>

      {expanded && (
        <div className="p-4 bg-[#0f1522] border-t border-white/5">
          <table className="w-full text-left border-collapse text-[11px] font-mono table-fixed">
            <thead>
              <tr className="text-slate-500 border-b border-white/10 uppercase tracking-wider">
                <th className="py-2 pl-2 w-1/4">Field</th>
                <th className="py-2 pl-2 w-1/3 border-l border-white/5">DICOM Source</th>
                <th className="py-2 pl-2 w-1/3 border-l border-white/5">Report Source</th>
                <th className="py-2 w-12 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {['name', 'mrn', 'dob', 'age', 'sex'].map((fieldKey, idx) => {
                const rowData = data[fieldKey as keyof VerificationData] as VerificationField;
                const fieldNameMap: Record<string, string> = {
                  name: 'Name',
                  mrn: 'MRN',
                  dob: 'Date of Birth',
                  age: 'Age',
                  sex: 'Sex'
                };
                const fieldName = fieldNameMap[fieldKey];

                return (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors h-8">
                    <td className="py-2 pl-2 text-slate-300 font-bold">{fieldName}</td>
                    <td className="py-2 pl-2 text-slate-400 border-l border-white/5 truncate pr-2" title={rowData.dicom_value}>{rowData.dicom_value || "—"}</td>
                    <td className="py-2 pl-2 text-slate-400 border-l border-white/5 truncate pr-2" title={rowData.report_value}>{rowData.report_value || "—"}</td>
                    <td className="py-2 text-center align-middle">
                      {rowData.match ? (
                        <CheckCircle className="w-4 h-4 text-[#00ff9d] mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-500 mx-auto" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="mt-4 flex items-center justify-start">
            <div className={`text-[11px] font-black tracking-widest px-3 py-1.5 rounded bg-black/30 border ${data.is_mismatch ? 'text-rose-400 border-rose-500/30' : data.is_all_match ? 'text-[#00ff9d] border-[#00ff9d]/30' : 'text-amber-400 border-amber-500/30'}`}>
              Status: {getStatusText()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
