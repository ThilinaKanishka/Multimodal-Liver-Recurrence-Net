import React, { useState } from "react";
import { FileText, Check, Loader2, Edit, Trash2, Clock, ShieldCheck } from "lucide-react";

export const PhysicianVerificationNotes: React.FC<{ inferenceId?: string }> = ({ inferenceId }) => {
  const [noteText, setNoteText] = useState("");
  const [verified, setVerified] = useState(false);
  const [saveState, setSaveState] = useState<"IDLE" | "SAVING" | "COMMITTED">("IDLE");
  const [timestamp, setTimestamp] = useState<string>("");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim() || saveState === "SAVING") return;

    setSaveState("SAVING");

    // Simulate database / EHR ledger save
    setTimeout(() => {
      const now = new Date();
      setTimestamp(now.toLocaleDateString() + " " + now.toLocaleTimeString());
      setSaveState("COMMITTED");
    }, 1200);
  };

  const handleEdit = () => {
    setSaveState("IDLE");
  };

  const handleDelete = () => {
    setNoteText("");
    setVerified(false);
    setSaveState("IDLE");
  };

  return (
    <div className="w-full bg-[#252841] border border-gray-700 rounded-md shadow-lg overflow-hidden mt-4 font-sans">
      {/* Header */}
      <div className="bg-[#1a1c2e] px-4 py-2.5 border-b border-gray-700 flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-wider text-slate-200 font-bold flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-blue-400" />
          Attending Physician's Clinical Evaluation
        </h3>
        {inferenceId && (
          <span className="text-[10px] font-mono text-slate-400 bg-[#131524] px-2 py-0.5 rounded border border-gray-700">
            REF: {inferenceId.substring(0, 12)}...
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-4">
        {saveState === "COMMITTED" ? (
          <div className="flex flex-col gap-4 animate-in fade-in duration-300">
            {/* Success Banner */}
            <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-500/40 p-3 rounded text-emerald-300 text-xs font-mono shadow-inner">
              <div className="flex items-center gap-2 font-bold tracking-wider">
                <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                SECURELY RECORDED IN EHR LEDGER
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-300 font-medium">
                <Clock className="w-3.5 h-3.5 text-emerald-500" />
                {timestamp}
              </div>
            </div>

            {/* Note Content Display */}
            <div className="bg-[#131524] border border-gray-700 rounded p-4 text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed shadow-inner">
              {noteText}
            </div>

            {/* Verified Badge */}
            {verified && (
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 bg-blue-950/30 border border-blue-500/30 p-2 rounded w-fit">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                Clinically Verified by Attending Physician
              </div>
            )}

            {/* Doctor Controls: Edit & Delete */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-700/60">
              <button
                type="button"
                onClick={handleEdit}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-widest px-4 py-2 rounded-sm shadow-lg transition-colors flex items-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" />
                Edit Note
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-widest px-4 py-2 rounded-sm shadow-lg transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Note
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Clinical Notes / Assessment
              </label>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                disabled={saveState === "SAVING"}
                placeholder="e.g., AI result verified. High suspicion of HCC. Proceeding with ultrasound-guided biopsy..."
                className="w-full bg-[#131524] border border-gray-700 focus:border-blue-500 rounded-sm p-3 text-xs text-slate-200 placeholder-slate-500 font-mono outline-none shadow-inner resize-y min-h-[100px] transition-colors focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-gray-700/60">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={verified}
                  onChange={(e) => setVerified(e.target.checked)}
                  disabled={saveState === "SAVING"}
                  className="w-4 h-4 rounded-sm border-gray-600 bg-[#131524] text-blue-600 focus:ring-1 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-200 group-hover:text-white transition-colors">
                  I clinically verify this AI prognosis.
                </span>
              </label>

              <button
                type="button"
                onClick={handleSave}
                disabled={!noteText.trim() || saveState === "SAVING"}
                className={`px-5 py-2 rounded-sm font-bold text-xs uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 min-w-[180px] ${
                  !noteText.trim()
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed border border-gray-600"
                    : "bg-blue-600 hover:bg-blue-700 text-white border border-blue-500/80 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                }`}
              >
                {saveState === "SAVING" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save to EHR Ledger"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default PhysicianVerificationNotes;
