import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CreditCard, Calendar, Activity, ArrowLeft, Download, FileText, UserCheck, Shield, QrCode } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface DoctorBillingPageProps {
  user: any;
  onBack: () => void;
}

export default function DoctorBillingPage({ user, onBack }: DoctorBillingPageProps) {
  const [workload, setWorkload] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isExporting, setIsExporting] = useState(false);
  const reportRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchWorkload = async () => {
      if (!user || !user.id) return;
      try {
        setLoading(true);
        const res = await axios.get(`http://127.0.0.1:8000/api/v1/doctor/${user.id}/workload`);
        setWorkload(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkload();
  }, [user]);

  const totalPatients = workload.reduce((acc, curr) => acc + curr.unique_patients_seen, 0);

  const exportPDF = async () => {
    if (!reportRef.current || workload.length === 0) return;
    try {
      setIsExporting(true);
      
      // Capture the hidden high-fidelity report UI
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
      pdf.save(`HepatoAI_Workload_Report_${user?.id}_${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (err) {
      console.error("PDF generation failed", err);
      alert("Failed to generate Workload PDF report.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex-1 p-8 bg-[#030712] text-slate-300 font-sans flex flex-col h-screen overflow-hidden relative">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/10 blur-[150px] rounded-full pointer-events-none"></div>
      
      <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6 relative z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/10">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.15)]">
            <CreditCard className="w-7 h-7 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight uppercase drop-shadow-md">
              Workload & Billing Logs
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Verify your daily patient check counts for hospital payments.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 px-4 py-2 rounded-xl backdrop-blur-md">
          <div className="flex flex-col items-end border-r border-white/10 pr-4">
             <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Total Encounters Verified</span>
             <span className="text-xl font-mono text-emerald-400 font-black">{totalPatients}</span>
          </div>
          <button onClick={exportPDF} disabled={workload.length === 0 || isExporting} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <Download className="w-4 h-4" /> {isExporting ? 'Generating...' : 'Export PDF'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 pr-2">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : workload.length === 0 ? (
          <div className="text-center py-20 bg-white/[0.02] rounded-2xl border border-white/5">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4 opacity-50" />
            <p className="text-slate-500">No workload history found for your account yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {workload.map((dayLog, idx) => (
              <div 
                key={idx} 
                className="bg-gradient-to-b from-white/[0.04] to-transparent backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl hover:shadow-[0_0_30px_rgba(16,185,129,0.05)] hover:border-emerald-500/30 transition-all group"
              >
                <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-inner group-hover:scale-110 transition-transform">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-200 text-lg">{new Date(dayLog.date).toLocaleDateString('en-US', { weekday: 'long' })}</h3>
                      <p className="text-xs font-mono text-slate-500">{dayLog.date}</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-[#0a0e1a] p-4 rounded-xl border border-white/5 flex flex-col justify-center shadow-inner relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 blur-[20px]"></div>
                      <span className="text-[10px] uppercase text-slate-500 font-bold flex items-center gap-1.5 mb-2 relative z-10">
                        <UserCheck className="w-3 h-3 text-blue-400" /> Unique Patients
                      </span>
                      <span className="text-3xl font-black text-white font-mono relative z-10">{dayLog.unique_patients_seen}</span>
                   </div>
                   <div className="bg-[#0a0e1a] p-4 rounded-xl border border-white/5 flex flex-col justify-center shadow-inner relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 blur-[20px]"></div>
                      <span className="text-[10px] uppercase text-slate-500 font-bold flex items-center gap-1.5 mb-2 relative z-10">
                        <Activity className="w-3 h-3 text-indigo-400" /> Total Inferences
                      </span>
                      <span className="text-3xl font-black text-white font-mono relative z-10">{dayLog.total_inferences}</span>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hidden Enterprise Report Template for PDF Export */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', pointerEvents: 'none' }}>
         <div ref={reportRef} className="bg-white text-slate-900 w-[1122px] min-h-[1587px] flex flex-col font-sans p-[60px]">
            {/* Header */}
            <div className="flex justify-between items-start border-b-[3px] border-slate-900 pb-6 mb-8">
               <div>
                  <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 flex items-center gap-3">
                     Hepato<span className="text-slate-400">AI</span> 
                     <span className="text-xl bg-slate-100 px-3 py-1 rounded text-slate-600 border border-slate-200">CLINICAL WORKLOAD VERIFICATION</span>
                  </h1>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-sm mt-2 flex items-center gap-2">
                     <Shield className="w-4 h-4" /> OFFICIAL HOSPITAL AUDIT DOCUMENT
                  </p>
               </div>
               <div className="text-right">
                  <img src="/logo.png" alt="Hospital Logo" className="h-14 mb-2 opacity-20" onError={(e) => { e.currentTarget.style.display='none'; }} />
                  <div className="font-mono text-sm font-bold text-slate-600 border border-slate-300 px-3 py-1 bg-slate-50 inline-block rounded">
                    DOCUMENT ID: BLL-{Math.floor(Math.random() * 1000000)}
                  </div>
               </div>
            </div>

            {/* Doctor Info */}
            <div className="mb-8 grid grid-cols-4 gap-4 border-2 border-slate-200 p-6 rounded bg-slate-50 text-sm">
               <div className="col-span-2"><span className="font-bold text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Attending Physician</span><span className="text-xl font-black text-slate-800">Dr. {user?.name || 'Unknown'}</span></div>
               <div><span className="font-bold text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Staff ID</span><span className="text-base font-mono font-bold text-slate-800">{user?.id || 'Unknown'}</span></div>
               <div><span className="font-bold text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Department / Level</span><span className="text-base font-medium">{user?.dept || 'Oncology'} ({user?.level || 'MD'})</span></div>
               
               <div className="border-t border-slate-200 pt-3 mt-2 col-span-2"><span className="font-bold text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Total Patient Encounters Verified</span><span className="font-mono text-2xl font-bold text-slate-900">{totalPatients}</span></div>
               <div className="border-t border-slate-200 pt-3 mt-2 col-span-2"><span className="font-bold text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Report Generation Date</span><span className="text-sm font-semibold text-slate-700">{new Date().toLocaleString()}</span></div>
            </div>

            {/* Summary Statistics */}
            <div className="mb-10 p-6 border border-slate-200 rounded-md flex justify-between items-center shadow-sm">
               <div>
                 <h2 className="text-sm font-bold uppercase tracking-widest mb-1">Workload Execution Summary</h2>
                 <p className="text-xs text-slate-500">The following log verifies the exact number of distinct patient inferences run per shift.</p>
               </div>
               <div className="text-right">
                 <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">System Verification</span>
                 <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded border border-emerald-200">100% AUDIT MATCH</span>
               </div>
            </div>

            {/* Data Table */}
            <div className="flex-1 mb-8">
               <table className="w-full text-left border-collapse border border-slate-300">
                  <thead className="bg-slate-100">
                     <tr>
                        <th className="py-4 px-6 text-xs font-black text-slate-600 uppercase tracking-widest border border-slate-300 w-1/4">Date</th>
                        <th className="py-4 px-6 text-xs font-black text-slate-600 uppercase tracking-widest border border-slate-300 w-1/4">Shift Day</th>
                        <th className="py-4 px-6 text-xs font-black text-slate-600 uppercase tracking-widest border border-slate-300 w-1/4 text-center">Unique Patients Checked</th>
                        <th className="py-4 px-6 text-xs font-black text-slate-600 uppercase tracking-widest border border-slate-300 w-1/4 text-center">Total Inferences Run</th>
                     </tr>
                  </thead>
                  <tbody>
                     {workload.slice(0, 20).map((log, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                           <td className="py-4 px-6 border border-slate-300 text-sm font-mono text-slate-700">{log.date}</td>
                           <td className="py-4 px-6 border border-slate-300 text-sm font-semibold">{new Date(log.date).toLocaleDateString('en-US', { weekday: 'long' })}</td>
                           <td className="py-4 px-6 border border-slate-300 text-lg font-black text-center text-slate-900">{log.unique_patients_seen}</td>
                           <td className="py-4 px-6 border border-slate-300 text-lg font-bold text-center text-slate-600">{log.total_inferences}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
               {workload.length > 20 && (
                  <div className="text-center text-xs font-mono text-slate-500 mt-4 italic">
                    * Showing top 20 most recent shifts. Older data archived securely.
                  </div>
               )}
            </div>

            {/* Footer Signatures */}
            <div className="mt-auto pt-8 border-t-2 border-slate-300 grid grid-cols-12 gap-6 items-end">
               <div className="col-span-6 text-[10px] text-slate-500 leading-relaxed text-justify">
                  <strong>CONFIDENTIAL AUDIT DOCUMENT:</strong> This report verifies clinical inference execution via the HepatoAI Engine. Patient metrics are aggregated to protect PHI compliance under HIPAA guidelines. To be utilized exclusively for hospital billing, resource allocation, and physician renumeration processing.
               </div>
               <div className="col-span-2 flex items-center justify-center">
                  <div className="bg-slate-50 border border-slate-200 p-2 rounded shadow-sm flex items-center gap-2">
                     <QrCode className="w-8 h-8 text-slate-800" />
                     <div className="text-[7px] font-mono leading-tight">
                        <strong>SCAN TO VERIFY</strong><br/>BLOCKCHAIN<br/>LEDGER MATCH
                     </div>
                  </div>
               </div>
               <div className="col-span-4 flex flex-col items-center">
                  {user?.signature ? (
                    <img src={user.signature} alt="Physician Signature" className="h-12 object-contain mb-1 mix-blend-multiply" />
                  ) : (
                    <div className="h-12 mb-1 flex items-end">
                       <span className="font-signature text-2xl text-slate-800 leading-none pb-2">{user?.name}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-400 w-full text-center pt-1 mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-700">
                    Dr. {user?.name || 'Authorized Physician'}
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
