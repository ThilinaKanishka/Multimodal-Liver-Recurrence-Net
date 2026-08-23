import React, { useState, useRef } from 'react';
import HUDensityHistogram from '../components/HUDensityHistogram';

const FeatureExtractionStudio = () => {
  const [features, setFeatures] = useState(() => Array.from({ length: 512 }, () => 0));
  const [histogram, setHistogram] = useState([]);
  const [glcm, setGlcm] = useState(() => Array.from({ length: 64 }, () => 0));
  const [isUploading, setIsUploading] = useState(false);
  const [isPdfUploading, setIsPdfUploading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [isScanComplete, setIsScanComplete] = useState(false);
  const [scanText, setScanText] = useState("");
  const fileInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  const handlePdfUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = null;
    
    setIsPdfUploading(true);
    // Mock NLP processing delay for the Studio UI
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsPdfUploading(false);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    event.target.value = null;

    // Reset charts before new scan
    setFeatures(Array.from({ length: 512 }, () => 0));
    setHistogram([]);
    setGlcm(Array.from({ length: 64 }, () => 0));
    setIsScanComplete(false);
    
    setIsUploading(true);
    setIsScanning(true);
    setScanProgress(0);

    const totalDuration = 3500;
    const interval = 50;
    let currentProgress = 0;
    
    const progressTimer = setInterval(() => {
      currentProgress += (interval / totalDuration) * 100;
      if (currentProgress > 100) currentProgress = 100;
      setScanProgress(Math.floor(currentProgress));
      
      const texts = ["Extracting tensors...", "Normalizing HU...", "Applying 3D CNN...", "Segmenting Liver...", "Calculating Radiomics...", "Isolating ROI..."];
      setScanText(texts[Math.floor(Math.random() * texts.length)]);
      
      if (currentProgress >= 100) {
        clearInterval(progressTimer);
      }
    }, interval);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const apiPromise = fetch('http://127.0.0.1:8000/api/extract-features', {
        method: 'POST',
        body: formData,
      });

      const [response] = await Promise.all([
        apiPromise,
        new Promise(resolve => setTimeout(resolve, totalDuration))
      ]);
      
      const data = await response.json();
      
      setIsScanning(false);
      setIsScanComplete(true);
      
      if (data.features) setFeatures(data.features);
      if (data.histogram) setHistogram(data.histogram);
      if (data.glcm) setGlcm(data.glcm);
      
    } catch (error) {
      console.error('Error uploading file:', error);
      clearInterval(progressTimer);
      setIsScanning(false);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05080f] text-gray-100 p-6 md:p-10 font-sans selection:bg-cyan-500/30">
      <style>{`
        @keyframes scan {
          0% { top: -10%; }
          50% { top: 110%; }
          100% { top: -10%; }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.3); }
        }
      `}</style>
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header Section */}
        <header className="border-b border-white/10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 drop-shadow-sm">
              Advanced Image Feature Extraction
            </h1>
            <p className="mt-3 text-base md:text-lg text-blue-200/60 font-medium tracking-wide">
              Deep Learning 3D CNN & Radiomics Feature Vectorization
            </p>
          </div>
          <div className="flex-shrink-0 flex flex-wrap items-center gap-4">
            <input 
              type="file" 
              accept=".pdf" 
              className="hidden" 
              ref={pdfInputRef} 
              onChange={handlePdfUpload} 
            />
            <button 
              onClick={() => pdfInputRef.current?.click()}
              disabled={isPdfUploading}
              className={`px-6 py-3 rounded-lg font-bold uppercase tracking-widest text-sm transition-all shadow-[0_0_15px_rgba(167,139,250,0.2)] border flex items-center gap-2 ${
                isPdfUploading 
                  ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed'
                  : 'bg-purple-500/10 text-purple-400 border-purple-500/50 hover:bg-purple-500/20 hover:shadow-[0_0_25px_rgba(167,139,250,0.4)]'
              }`}
            >
              {isPdfUploading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Extracting...
                </>
              ) : 'Upload Text Report'}
            </button>

            <input 
              type="file" 
              accept=".dcm,.png,.jpg,.jpeg" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={`px-6 py-3 rounded-lg font-bold uppercase tracking-widest text-sm transition-all shadow-[0_0_15px_rgba(34,211,238,0.2)] border flex items-center gap-2 ${
                isUploading 
                  ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed'
                  : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/50 hover:bg-cyan-500/20 hover:shadow-[0_0_25px_rgba(34,211,238,0.4)]'
              }`}
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Extracting...
                </>
              ) : 'Upload CT Scan'}
            </button>
          </div>
        </header>



        {/* Scanner & Pipeline Section */}
        {(isScanning || isScanComplete) && (
          <section className="animate-in fade-in zoom-in duration-500 space-y-8">
            {/* High-Tech Scanner */}
            <div className="relative p-6 md:p-10 rounded-2xl bg-[#030407] border border-cyan-500/30 shadow-[0_0_30px_rgba(34,211,238,0.1)] overflow-hidden flex flex-col items-center">
              
              {/* Corner HUD brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-500 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-500 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500 rounded-br-lg" />

              {/* Grid Pattern Background */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

              {/* Scanner Box */}
              <div className="relative w-full max-w-md aspect-square bg-[#0a0f18] border border-cyan-500/20 rounded-xl overflow-hidden shadow-2xl flex items-center justify-center">
                <div className="text-cyan-500/20 font-black text-6xl tracking-widest uppercase">CT_VOL</div>
                
                {isScanning && (
                  <>
                    <div className="absolute left-0 w-full h-[3px] bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,1),0_0_40px_rgba(34,211,238,0.8)] animate-[scan_2s_linear_infinite]" />
                    
                    <div className="absolute bottom-4 left-4 text-cyan-400 font-mono text-xs opacity-80 z-10 flex flex-col gap-1">
                      <span>{scanText}</span>
                      <span>[0x{Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase()}] PROCESSING...</span>
                    </div>
                    
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                      <span className="text-7xl font-black text-cyan-500/20 tracking-tighter drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]">{scanProgress}%</span>
                    </div>
                  </>
                )}
                
                {isScanComplete && (
                  <div className="absolute inset-0 bg-cyan-500/10 flex items-center justify-center backdrop-blur-sm z-10 animate-in fade-in duration-1000">
                    <div className="bg-cyan-900/50 border border-cyan-400 px-6 py-2 rounded-lg text-cyan-400 font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                      Scan Complete
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Preprocessing Pipeline */}
            <div className="p-6 rounded-2xl bg-[#090d14] border border-white/5 shadow-xl">
              <h3 className="text-lg font-bold text-gray-200 mb-6 flex items-center gap-3">
                <svg className="w-5 h-5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                Automated Preprocessing & Segmentation Pipeline
              </h3>
              
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full">
                {/* Step 1 */}
                <div className={`flex-1 w-full p-4 rounded-xl border flex flex-col items-center justify-center text-center transition-all duration-500 ${scanProgress > 10 || isScanComplete ? 'border-gray-500 bg-gray-800 text-gray-200 shadow-md' : 'border-gray-800 bg-gray-900 text-gray-600'}`}>
                  <span className="text-xs font-bold uppercase tracking-widest">1. Raw DICOM Input</span>
                </div>
                
                <svg className={`w-6 h-6 hidden md:block transition-all duration-500 ${scanProgress > 25 || isScanComplete ? 'text-cyan-500' : 'text-gray-800'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                
                {/* Step 2 */}
                <div className={`flex-1 w-full p-4 rounded-xl border flex flex-col items-center justify-center text-center transition-all duration-500 ${scanProgress > 40 || isScanComplete ? 'border-gray-400 bg-gray-700 text-gray-100 shadow-lg' : 'border-gray-800 bg-gray-900 text-gray-600'}`}>
                  <span className="text-xs font-bold uppercase tracking-widest">2. HU Normalization</span>
                </div>
                
                <svg className={`w-6 h-6 hidden md:block transition-all duration-500 ${scanProgress > 60 || isScanComplete ? 'text-cyan-500' : 'text-gray-800'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                
                {/* Step 3 */}
                <div className={`flex-1 w-full p-4 rounded-xl border flex flex-col items-center justify-center text-center transition-all duration-500 ${scanProgress > 75 || isScanComplete ? 'border-cyan-500/50 bg-cyan-900/20 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'border-gray-800 bg-gray-900 text-gray-600'}`}>
                  <span className="text-xs font-bold uppercase tracking-widest">3. Liver Segmentation</span>
                </div>
                
                <svg className={`w-6 h-6 hidden md:block transition-all duration-500 ${scanProgress >= 100 || isScanComplete ? 'text-pink-500' : 'text-gray-800'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                
                {/* Step 4 */}
                <div className={`flex-1 w-full p-4 rounded-xl border flex flex-col items-center justify-center text-center transition-all duration-500 relative overflow-hidden ${scanProgress >= 100 || isScanComplete ? 'border-pink-500/50 bg-pink-900/10 text-pink-200 shadow-[0_0_20px_rgba(236,72,153,0.3)]' : 'border-gray-800 bg-gray-900 text-gray-600'}`}>
                  <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl transition-all duration-1000 ${scanProgress >= 100 || isScanComplete ? 'opacity-100 animate-[pulse-glow_2s_infinite]' : 'opacity-0'}`} />
                  <div className="flex items-center gap-2 z-10 relative">
                    <span className={`w-3 h-3 rounded-full transition-all duration-500 ${scanProgress >= 100 || isScanComplete ? 'bg-pink-500 shadow-[0_0_10px_#ec4899] animate-[pulse-glow_2s_infinite]' : 'bg-gray-700'}`} />
                    <span className="text-xs font-bold uppercase tracking-widest">4. Tumor ROI</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Neural Barcode Section */}
        <section className="space-y-4">
          <div className="p-6 md:p-8 rounded-2xl bg-[#090d14] border border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.5)] relative overflow-hidden">
            {/* Subtle top highlight */}
            <div className="absolute top-0 left-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
            
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-200 flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                Neural Activation Map
              </h2>
              <span className="text-xs font-mono text-cyan-300 bg-cyan-400/10 px-3 py-1.5 rounded border border-cyan-400/20 tracking-widest whitespace-nowrap">
                TENSOR_SHAPE: [1, 512]
              </span>
            </div>
            
            {/* The Barcode Container */}
            <div className="w-full flex items-center h-[160px] bg-[#030407] rounded-lg border border-gray-800/80 p-1.5 md:p-2 overflow-hidden shadow-inner group">
              {features.map((val, idx) => {
                let colorClass = "bg-[#111111]"; // Low values
                let shadowClass = "";

                if (val > 0.85) {
                  colorClass = "bg-pink-500"; // High values (Neon Pink)
                  shadowClass = "shadow-[0_0_12px_rgba(236,72,153,0.9)] z-10 relative";
                } else if (val > 0.7) {
                  colorClass = "bg-cyan-400"; // High values (Bright Cyan)
                  shadowClass = "shadow-[0_0_10px_rgba(34,211,238,0.8)] z-10 relative";
                } else if (val > 0.3) {
                  colorClass = "bg-indigo-500/80"; // Medium values
                  shadowClass = "shadow-[0_0_6px_rgba(99,102,241,0.5)]";
                }

                return (
                  <div
                    key={idx}
                    className={`flex-1 mx-[0.5px] md:mx-[1px] transition-all duration-300 hover:bg-white hover:shadow-[0_0_15px_rgba(255,255,255,1)] cursor-crosshair rounded-sm ${colorClass} ${shadowClass}`}
                    style={{
                      height: val > 0.7 ? '100%' : `${Math.max(10, val * 100)}%`,
                      opacity: val > 0.7 ? 1 : Math.max(0.2, val)
                    }}
                    title={`Feature ${idx}: ${val.toFixed(4)}`}
                  />
                );
              })}
            </div>
            
            {/* Scale and Label */}
            <div className="mt-8 flex flex-col items-center">
              <div className="w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-gray-600/50 to-transparent mb-4 relative">
                <div className="absolute top-[-5px] left-0 w-px h-2.5 bg-gray-500" />
                <div className="absolute top-[-5px] left-1/4 w-px h-2.5 bg-gray-600" />
                <div className="absolute top-[-5px] left-2/4 w-px h-2.5 bg-gray-500" />
                <div className="absolute top-[-5px] left-3/4 w-px h-2.5 bg-gray-600" />
                <div className="absolute top-[-5px] right-0 w-px h-2.5 bg-gray-500" />
              </div>
              <p className="text-[10px] md:text-xs text-gray-500 font-medium uppercase tracking-[0.2em] md:tracking-[0.3em]">
                512-Dimensional Extracted Feature Vector (Output Tensor)
              </p>
            </div>
          </div>
        </section>

        {/* Radiomics Features Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Intensity Histogram */}
          <div className="w-full h-full flex min-h-[400px]">
            <HUDensityHistogram histogramData={histogram} />
          </div>

          {/* Texture GLCM Matrix */}
          <div className="p-6 md:p-8 rounded-2xl bg-[#090d14] border border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.5)] relative overflow-hidden group flex flex-col">
            <div className="absolute top-0 right-1/4 w-1/3 h-px bg-gradient-to-r from-transparent via-pink-500/50 to-transparent" />
            <div className="flex items-center gap-3 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <h2 className="text-xl font-bold text-gray-200 tracking-wide">Texture (GLCM) Matrix</h2>
            </div>
            
            <div className="flex-1 w-full bg-[#030407] rounded-xl border border-gray-800/80 p-4 flex items-center justify-center shadow-inner relative">
               <div className="grid grid-cols-8 gap-[3px] w-full max-w-[180px] aspect-square relative z-10">
                 {glcm.map((val, i) => {
                    let bg = "bg-[#111111]";
                    if (val > 0.8) bg = "bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.9)] z-20";
                    else if (val > 0.6) bg = "bg-pink-400/80";
                    else if (val > 0.4) bg = "bg-purple-500/70";
                    else if (val > 0.2) bg = "bg-indigo-900/60";
                    return (
                      <div 
                        key={i} 
                        className={`w-full h-full rounded-[2px] transition-all duration-300 hover:scale-150 hover:bg-white hover:shadow-[0_0_15px_white] hover:z-30 cursor-crosshair relative ${bg}`}
                        style={{ opacity: Math.max(0.2, val) }}
                        title={`Co-occurrence Entropy: ${val.toFixed(4)}`}
                      />
                    );
                 })}
               </div>
               
               <div className="absolute top-4 left-4 flex flex-col gap-2 z-0">
                 <div className="flex items-center gap-2 text-[9px] text-gray-400 font-mono tracking-wider"><span className="w-2.5 h-2.5 bg-pink-500 rounded-sm shadow-[0_0_5px_#ec4899]"></span> HIGH ROUGHNESS</div>
                 <div className="flex items-center gap-2 text-[9px] text-gray-400 font-mono tracking-wider"><span className="w-2.5 h-2.5 bg-[#111] border border-gray-700 rounded-sm"></span> HOMOGENEOUS</div>
               </div>
            </div>
          </div>
        </section>

        {/* Vector Data Snapshot */}
        <section>
          <div className="rounded-xl bg-[#080b11] border border-gray-800/60 overflow-hidden font-mono text-sm shadow-2xl relative">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            
            <div className="flex items-center gap-2 px-4 py-3 bg-[#0c1017] border-b border-gray-800/60">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
              </div>
              <span className="ml-3 text-xs text-gray-400 font-medium tracking-wide">tensor_snapshot.json</span>
            </div>
            
            <div className="p-5 text-gray-400/90 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[180px] overflow-y-auto custom-scrollbar text-xs md:text-sm">
              <span className="text-pink-500/90">const</span> <span className="text-blue-400">featureVector</span> <span className="text-white/80">=</span> <span className="text-yellow-200/80">[</span>
              <div className="pl-4 py-1">
                {features.slice(0, 8).map(f => f.toFixed(4)).join(', ')},
                <br />
                {features.slice(8, 16).map(f => f.toFixed(4)).join(', ')},
                <br />
                {features.slice(16, 24).map(f => f.toFixed(4)).join(', ')},
                <br />
                <span className="text-gray-600 italic">... 488 more items</span>
              </div>
              <span className="text-yellow-200/80">]</span>;
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default FeatureExtractionStudio;
