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
      <div className="flex-1 p-8 bg-[#030712] text-slate-300 font-sans flex flex-col h-screen overflow-hidden relative">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[150px] rounded-full pointer-events-none"></div>
        
        <div className="flex items-center gap-4 mb-8 border-b border-white/5 pb-6 relative z-10">
          <button onClick={() => setSelectedPatient(null)} className="p-2 hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/10">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 uppercase tracking-widest">
              Patient History
            </h1>
            <p className="text-slate-500 text-xs font-mono mt-1">ID: {selectedPatient}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Diagnostic Timeline</h2>
            {!patientHistory ? (
              <div className="flex justify-center items-center h-40">
                <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              patientHistory.history.map((record: any, idx: number) => (
                <div key={idx} className="bg-gradient-to-b from-white/[0.04] to-transparent backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-xl flex items-start gap-4 hover:border-cyan-500/30 transition-all">
                  <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-slate-200">AI Inference Evaluation</h3>
                      <span className="text-[10px] font-mono text-slate-500 bg-black/30 px-2 py-1 rounded border border-white/5">
                        {new Date(record.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                        <span className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Recurrence Risk</span>
                        <span className={`text-sm font-black ${record.recurrence_risk === 'HIGH' ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {record.recurrence_risk} ({(record.probability).toFixed(1)}%)
                        </span>
                      </div>
                      <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                        <span className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Tumor Size</span>
                        <span className="text-sm font-bold text-slate-300">
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
             <div className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-5 sticky top-0">
               <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <ImageIcon className="w-4 h-4" /> Reference Scan Preview
               </h2>
               <div className="w-full aspect-square bg-black/50 rounded-xl border border-white/10 overflow-hidden relative group">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                     <span className="text-xs font-mono text-cyan-400">Axial Slice 34/64</span>
                     <span className="text-[10px] text-slate-400">Archived Preview</span>
                  </div>
                  {/* Mock Image for Patient History CT Preview */}
                  <img src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=600&auto=format&fit=crop" alt="CT Scan" className="w-full h-full object-cover mix-blend-luminosity opacity-60" />
               </div>
               <p className="text-[10px] text-slate-500 mt-4 leading-relaxed">
                 Historical CT volumetric scans are archived in the hospital PACS. This preview serves as a visual reference for the past diagnostic inference.
               </p>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 bg-[#030712] text-slate-300 font-sans flex flex-col h-screen overflow-hidden relative">
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/30 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <Search className="w-7 h-7 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight uppercase drop-shadow-md">
              Patient Directory
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Search & Review Historical Clinical Inferences</p>
          </div>
        </div>
        
        <div className="relative w-80">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
           <input 
             type="text" 
             placeholder="Search by Patient ID..." 
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all backdrop-blur-md"
           />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
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
                className="bg-gradient-to-b from-white/[0.04] to-transparent backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-xl hover:shadow-[0_0_20px_rgba(6,182,212,0.1)] hover:border-cyan-500/30 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-full bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner group-hover:bg-cyan-500/20 transition-colors">
                    <User className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-1 rounded border border-white/10">
                    {patient.total_scans} Records
                  </span>
                </div>
                <h3 className="font-mono text-sm text-slate-300 font-bold mb-1 truncate" title={patient.pseudo_id}>
                  {patient.pseudo_id}
                </h3>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest mt-3 pt-3 border-t border-white/5">
                  <Calendar className="w-3 h-3" />
                  Last Scan: {new Date(patient.last_scan).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
