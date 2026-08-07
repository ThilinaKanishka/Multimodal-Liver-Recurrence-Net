import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, User, FileText, Calendar, Activity, ChevronRight, ArrowLeft, Image as ImageIcon } from 'lucide-react';

interface PatientSearchPageProps {
  onBack: () => void;
}

export default function PatientSearchPage({ onBack }: PatientSearchPageProps) {
  const [patients, setPatients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [patientHistory, setPatientHistory] = useState<any | null>(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://127.0.0.1:8000/api/v1/patients");
      setPatients(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadPatientHistory = async (pseudoId: string) => {
    try {
      setSelectedPatient(pseudoId);
      setPatientHistory(null);
      const res = await axios.get(`http://127.0.0.1:8000/api/v1/patients/${pseudoId}`);
      setPatientHistory(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredPatients = patients.filter(p => p.pseudo_id.toLowerCase().includes(searchTerm.toLowerCase()));

  // If a patient is selected, show their detailed history
  if (selectedPatient) {
    return (
      <div className="flex-1 bg-[#0a0f18] text-slate-300 font-sans h-screen flex flex-col overflow-hidden relative z-0">
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#00e5ff]/5 blur-[120px] rounded-full animate-pulse-slow"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#00ff9d]/5 blur-[150px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="flex-1 p-8 flex flex-col relative z-10 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-6 relative z-10">
            <button onClick={() => setSelectedPatient(null)} className="p-2 bg-[#0f1522]/60 hover:bg-[#00e5ff]/10 rounded-xl transition-all border border-white/10 hover:border-[#00e5ff]/50 shadow-lg group">
              <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-[#00e5ff] transition-colors" />
            </button>
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-black text-white uppercase tracking-[0.2em] drop-shadow-md flex items-center gap-3">
                Patient History <span className="text-slate-500 font-normal">/</span> <span className="text-[#00e5ff]">{selectedPatient}</span>
              </h1>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00ff9d] animate-pulse shadow-[0_0_5px_#00ff9d]"></span> Longitudinal Clinical Records
              </p>
            </div>
          </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent relative z-10 grid grid-cols-3 gap-8">
          <div className="col-span-2 space-y-4">
            <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#00e5ff]" /> Diagnostic Timeline
            </h2>
            {!patientHistory ? (
              <div className="flex justify-center items-center h-40">
                <div className="w-6 h-6 border-2 border-[#00e5ff] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              patientHistory.history.map((record: any, idx: number) => (
                <div key={idx} className="bg-[#0f1522]/60 backdrop-blur-2xl border border-white/10 p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex items-start gap-4 hover:border-[#00e5ff]/30 hover:shadow-[0_8px_40px_rgba(0,229,255,0.15)] transition-all group">
                  <div className="p-3 bg-black/40 rounded-xl border border-white/10 text-[#00e5ff] group-hover:bg-[#00e5ff]/10 group-hover:border-[#00e5ff]/30 transition-all shadow-inner">
                    <Activity className="w-5 h-5 drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-black text-white uppercase tracking-[0.1em] text-xs">AI Inference Evaluation</h3>
                      <span className="text-[9px] font-black tracking-widest text-[#00e5ff] bg-[#00e5ff]/10 px-2.5 py-1 rounded-md border border-[#00e5ff]/20">
                        {new Date(record.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="bg-black/40 p-4 rounded-xl border border-white/10 shadow-inner">
                        <span className="text-[9px] uppercase text-slate-400 font-black tracking-[0.2em] block mb-2">Recurrence Risk</span>
                        <span className={`text-sm font-black ${record.recurrence_risk === 'HIGH' ? 'text-[#ff0055] drop-shadow-[0_0_5px_rgba(255,0,85,0.5)]' : record.recurrence_risk === 'MEDIUM' ? 'text-[#ffaa00] drop-shadow-[0_0_5px_rgba(255,170,0,0.5)]' : 'text-[#00ff9d] drop-shadow-[0_0_5px_rgba(0,255,157,0.5)]'}`}>
                          {record.recurrence_risk} ({(record.probability).toFixed(1)}%)
                        </span>
                      </div>
                      <div className="bg-black/40 p-4 rounded-xl border border-white/10 shadow-inner">
                        <span className="text-[9px] uppercase text-slate-400 font-black tracking-[0.2em] block mb-2">Tumor Size</span>
                        <span className="text-sm font-bold text-white">
                          {record.clinical_inputs?.tumor_size_cm || 'N/A'} cm
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="col-span-1">
             <div className="bg-[#0f1522]/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-6 sticky top-0">
               <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                 <ImageIcon className="w-4 h-4 text-[#9d00ff]" /> Reference Scan Preview
               </h2>
               <div className="w-full aspect-square bg-black/60 rounded-xl border border-white/10 overflow-hidden relative group shadow-inner">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f1522] to-transparent z-10 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 border-b-2 border-[#00e5ff]">
                     <span className="text-[10px] font-black tracking-widest text-[#00e5ff] uppercase">Axial Slice 34/64</span>
                     <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Archived Preview</span>
                  </div>
                  {/* Mock Image for Patient History CT Preview */}
                  <img src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=600&auto=format&fit=crop" alt="CT Scan" className="w-full h-full object-cover mix-blend-luminosity opacity-40 group-hover:opacity-80 transition-opacity duration-500" />
               </div>
               <p className="text-[9px] text-slate-400 mt-5 leading-relaxed uppercase tracking-widest font-bold">
                 Historical CT volumetric scans are archived in the hospital PACS. This preview serves as a visual reference for the past diagnostic inference.
               </p>
             </div>
          </div>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#0a0f18] text-slate-300 font-sans h-screen flex flex-col overflow-hidden relative z-0">
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#00e5ff]/5 blur-[120px] rounded-full animate-pulse-slow"></div>
      </div>

      <div className="flex-1 p-8 flex flex-col relative z-10 overflow-hidden">
        <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6 relative z-10">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <Search className="w-6 h-6 text-[#00e5ff] drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]" />
              <h1 className="text-2xl font-black text-white uppercase tracking-[0.2em] drop-shadow-md">
                Patient Directory
              </h1>
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Search & Review Historical Clinical Inferences</p>
          </div>
          
          <div className="relative w-96">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00e5ff]" />
             <input 
               type="text" 
               placeholder="SEARCH BY PATIENT ID..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full bg-[#0f1522]/80 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-xs font-black tracking-widest text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00e5ff]/50 focus:ring-1 focus:ring-[#00e5ff]/50 transition-all backdrop-blur-2xl shadow-inner"
             />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent relative z-10 pr-2">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="text-center py-20">
            <User className="w-12 h-12 text-slate-600 mx-auto mb-4 opacity-50" />
            <p className="text-slate-500">No patients found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPatients.map((patient, idx) => (
              <div 
                key={idx} 
                onClick={() => loadPatientHistory(patient.pseudo_id)}
                className="bg-[#0f1522]/60 backdrop-blur-2xl border border-white/10 p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.15)] hover:border-[#00e5ff]/30 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-slate-400 shadow-inner group-hover:bg-[#00e5ff]/10 group-hover:text-[#00e5ff] group-hover:border-[#00e5ff]/30 transition-all">
                    <User className="w-5 h-5 group-hover:drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]" />
                  </div>
                  <span className="text-[9px] font-black tracking-widest text-[#00ff9d] bg-[#00ff9d]/10 px-2.5 py-1 rounded-md border border-[#00ff9d]/30 uppercase">
                    {patient.total_scans} Records
                  </span>
                </div>
                <h3 className="text-[13px] text-white font-black uppercase tracking-[0.1em] mb-1 truncate" title={patient.pseudo_id}>
                  {patient.pseudo_id}
                </h3>
                <div className="flex items-center gap-2 text-[9px] text-slate-500 uppercase font-bold tracking-widest mt-4 pt-4 border-t border-white/10 group-hover:border-[#00e5ff]/20 transition-colors">
                  <Calendar className="w-3 h-3 text-[#00e5ff]" />
                  Last Scan: <span className="text-slate-300">{new Date(patient.last_scan).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
