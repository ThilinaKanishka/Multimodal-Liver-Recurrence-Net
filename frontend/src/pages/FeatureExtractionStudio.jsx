import React, { useState, useRef, useEffect } from 'react';
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
  const [dataStream, setDataStream] = useState([]);
  const fileInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  // Background random data stream effect during scan
  useEffect(() => {
    let interval;
    if (isScanning) {
      interval = setInterval(() => {
        setDataStream(prev => {
          const newStream = [...prev, Math.random().toString(36).substring(2, 10).toUpperCase()];
          return newStream.slice(-5); // Keep last 5
        });
      }, 200);
    }
    return () => clearInterval(interval);
  }, [isScanning]);

  const handlePdfUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = null;
    
    setIsPdfUploading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsPdfUploading(false);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = null;

    setFeatures(Array.from({ length: 512 }, () => 0));
    setHistogram([]);
    setGlcm(Array.from({ length: 64 }, () => 0));
    setIsScanComplete(false);
    setIsUploading(true);
    setIsScanning(true);
    setScanProgress(0);

    const totalDuration = 4000;
    const interval = 40;
    let currentProgress = 0;
    
    const progressTimer = setInterval(() => {
      currentProgress += (interval / totalDuration) * 100;
      if (currentProgress > 100) currentProgress = 100;
      setScanProgress(Math.floor(currentProgress));
      
      const texts = [
        "INITIALIZING TENSOR CORE...", 
        "EXTRACTING SPATIAL FEATURES...", 
        "NORMALIZING HU VALUES...", 
        "APPLYING 3D CONVOLUTION...", 
        "SEGMENTING HEPATIC REGIONS...", 
        "CALCULATING RADIOMICS...", 
        "ISOLATING TUMOR ROI..."
      ];
      setScanText(texts[Math.floor((currentProgress / 100) * (texts.length - 1))]);
      
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

  const renderSteps = () => {
    const steps = [
      { id: 1, label: "RAW DICOM INPUT", icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" },
      { id: 2, label: "HU NORMALIZATION", icon: "M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" },
      { id: 3, label: "LIVER SEGMENTATION", icon: "M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" },
      { id: 4, label: "TUMOR ROI ISOLATION", icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" }
    ];

    return steps.map((step, index) => {
      const isActive = scanProgress > (index * 25) || isScanComplete;
      const isCurrent = scanProgress > (index * 25) && scanProgress <= ((index + 1) * 25) && !isScanComplete;
      
      return (
        <div key={step.id} className="relative flex flex-col items-center flex-1 z-10 group">
          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-[2px] bg-gray-800 -z-10 overflow-hidden">
              <div className={`h-full transition-all duration-1000 ${isActive ? 'bg-cyan-500' : 'bg-transparent'} w-full origin-left ${isActive ? 'scale-x-100' : 'scale-x-0'}`} />
              {isCurrent && <div className="absolute top-0 left-0 h-full w-[20%] bg-cyan-300 shadow-[0_0_10px_cyan] animate-[slide_1.5s_linear_infinite]" />}
            </div>
          )}
          
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-700 transform ${isActive ? 'bg-gradient-to-br from-cyan-900 to-blue-900 border border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)] rotate-45 scale-110' : 'bg-gray-900 border border-gray-800 rotate-0 scale-100'}`}>
             <div className="-rotate-45 text-white">
                <svg className={`w-6 h-6 transition-colors duration-500 ${isActive ? 'text-cyan-300' : 'text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={step.icon} />
                </svg>
             </div>
             {isCurrent && (
               <div className="absolute inset-0 border-2 border-cyan-400 rounded-2xl animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite] opacity-50" />
             )}
          </div>
          
          <div className={`mt-6 text-center transition-all duration-500 ${isActive ? 'opacity-100 transform translate-y-0' : 'opacity-40 transform translate-y-2'}`}>
            <span className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] ${isCurrent ? 'text-cyan-400' : (isActive ? 'text-gray-300' : 'text-gray-600')}`}>
              {step.label}
            </span>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-[#020509] text-gray-100 p-4 md:p-8 font-sans selection:bg-cyan-500/30 overflow-hidden relative">
      <style>{`
        @keyframes scanLaser {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(300%); }
        }
        @keyframes spinSlow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(500%); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 15px rgba(236, 72, 153, 0.5); }
          50% { box-shadow: 0 0 30px rgba(236, 72, 153, 0.9); }
        }
        @keyframes matrixScroll {
          0% { transform: translateY(-100%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(100%); opacity: 0; }
        }
        .hex-bg {
          background-image: radial-gradient(rgba(34, 211, 238, 0.1) 1px, transparent 1px);
          background-size: 30px 30px;
        }
        .perspective-tilt {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .barcode-hover:hover {
          transform: rotateX(10deg) rotateY(-5deg) scale(1.02);
        }
      `}</style>

      {/* Animated Background Mesh */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan-900/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-900/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute inset-0 hex-bg opacity-30" />
      </div>

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        
        {/* Header Section */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-white/5 relative">
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-cyan-500/50 via-purple-500/50 to-transparent" />
          
          <div className="animate-[float_6s_ease-in-out_infinite]">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono tracking-widest">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              SYSTEM ONLINE // MODULE: EXTRACTION
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white via-cyan-100 to-cyan-600 drop-shadow-[0_0_20px_rgba(34,211,238,0.2)]">
              Radiomics Studio
            </h1>
            <p className="mt-4 text-sm md:text-base text-cyan-200/50 font-mono tracking-wide max-w-xl leading-relaxed">
              &gt; EXECUTING 3D CONVOLUTIONAL NEURAL NETWORK VECTORIZATION & MULTI-MODAL GLCM TEXTURE ANALYSIS.
            </p>
          </div>
          
          <div className="flex-shrink-0 flex flex-col sm:flex-row items-center gap-4">
            <input type="file" accept=".pdf" className="hidden" ref={pdfInputRef} onChange={handlePdfUpload} />
            <button 
              onClick={() => pdfInputRef.current?.click()}
              disabled={isPdfUploading}
              className={`relative overflow-hidden px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all duration-300 flex items-center gap-3 backdrop-blur-md ${
                isPdfUploading 
                  ? 'bg-gray-900/50 text-gray-500 border border-gray-800 cursor-not-allowed'
                  : 'bg-purple-900/20 text-purple-300 border border-purple-500/30 hover:bg-purple-800/40 hover:border-purple-400 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:-translate-y-1 group'
              }`}
            >
              {isPdfUploading ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : (
                <svg className="w-5 h-5 text-purple-400 group-hover:animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              )}
              {isPdfUploading ? 'Parsing NLP...' : 'Upload Report'}
              
              {!isPdfUploading && <div className="absolute inset-0 rounded-xl border border-purple-400/0 group-hover:border-purple-400/50 transition-colors duration-500" />}
            </button>

            <input type="file" accept=".dcm,.png,.jpg,.jpeg" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={`relative overflow-hidden px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all duration-300 flex items-center gap-3 backdrop-blur-md ${
                isUploading 
                  ? 'bg-gray-900/50 text-gray-500 border border-gray-800 cursor-not-allowed'
                  : 'bg-cyan-900/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-800/40 hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:-translate-y-1 group'
              }`}
            >
              {isUploading ? (
                 <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : (
                <svg className="w-5 h-5 text-cyan-400 group-hover:animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              )}
              {isUploading ? 'Initializing...' : 'Inject Scan'}
              
              {!isUploading && (
                <div className="absolute top-0 -left-[100%] w-1/2 h-full bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent skew-x-[45deg] group-hover:animate-[slide_1s_ease-in-out]" />
              )}
            </button>
          </div>
        </header>

        {/* Scanner & Pipeline Section */}
        {(isScanning || isScanComplete) && (
          <section className="animate-in fade-in zoom-in duration-700 space-y-10">
            
            {/* Holographic Pipeline UI */}
            <div className="relative p-8 md:p-12 rounded-3xl bg-black/40 backdrop-blur-2xl border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
              
              {/* Decorative corners */}
              <div className="absolute top-0 left-0 w-16 h-16 border-t border-l border-cyan-500/50 rounded-tl-3xl opacity-50" />
              <div className="absolute top-0 right-0 w-16 h-16 border-t border-r border-cyan-500/50 rounded-tr-3xl opacity-50" />
              <div className="absolute bottom-0 left-0 w-16 h-16 border-b border-l border-cyan-500/50 rounded-bl-3xl opacity-50" />
              <div className="absolute bottom-0 right-0 w-16 h-16 border-b border-r border-cyan-500/50 rounded-br-3xl opacity-50" />

              <div className="flex flex-col xl:flex-row gap-12 items-center">
                
                {/* 3D Scanner Visualization */}
                <div className="w-full xl:w-1/3 flex justify-center perspective-tilt">
                  <div className="relative w-64 h-64 sm:w-80 sm:h-80 preserve-3d transform rotate-x-12">
                    {/* Inner Cylinder/Core */}
                    <div className="absolute inset-4 rounded-full border-[2px] border-dashed border-cyan-900 animate-[spinSlow_20s_linear_infinite]" />
                    <div className="absolute inset-8 rounded-full border border-cyan-800/50 animate-[spinSlow_15s_linear_infinite_reverse]" />
                    
                    {/* Data Rings */}
                    <div className="absolute inset-0 rounded-full border border-cyan-500/20 bg-cyan-950/20 flex items-center justify-center overflow-hidden shadow-[inset_0_0_50px_rgba(34,211,238,0.1)]">
                      
                      {isScanning && (
                        <>
                          <div className="absolute top-0 left-0 w-full h-[4px] bg-cyan-400 shadow-[0_0_30px_rgba(34,211,238,1),0_0_60px_rgba(34,211,238,0.8)] animate-[scanLaser_2.5s_ease-in-out_infinite_alternate] z-20" />
                          
                          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 text-cyan-400 font-mono">
                            <span className="text-6xl font-black tracking-tighter drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                              {scanProgress}<span className="text-3xl text-cyan-600">%</span>
                            </span>
                            <span className="text-[10px] uppercase tracking-[0.3em] mt-2 text-cyan-200/70 animate-pulse">
                              {scanText}
                            </span>
                          </div>
                          
                          {/* Matrix Data Stream */}
                          <div className="absolute top-4 left-4 text-[8px] text-cyan-500/40 font-mono flex flex-col gap-1 text-left z-0">
                            {dataStream.map((str, i) => <div key={i}>0x{str}</div>)}
                          </div>
                          <div className="absolute bottom-4 right-4 text-[8px] text-cyan-500/40 font-mono flex flex-col gap-1 text-right z-0">
                             {dataStream.map((str, i) => <div key={i}>VEC_{str}</div>)}
                          </div>
                        </>
                      )}

                      {isScanComplete && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-cyan-900/30 backdrop-blur-sm z-20 animate-in fade-in duration-1000">
                          <svg className="w-16 h-16 text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-cyan-400 font-bold uppercase tracking-[0.2em] text-sm drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                            Extraction Complete
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Outer Rotating Rings */}
                    {isScanning && (
                      <>
                        <div className="absolute -inset-4 rounded-full border-t-2 border-cyan-400/50 animate-[spinSlow_3s_linear_infinite]" />
                        <div className="absolute -inset-8 rounded-full border-b-2 border-purple-500/40 animate-[spinSlow_4s_linear_infinite_reverse]" />
                      </>
                    )}
                  </div>
                </div>

                {/* Pipeline Nodes */}
                <div className="w-full xl:w-2/3 flex flex-col sm:flex-row items-center justify-between gap-8 sm:gap-2">
                  {renderSteps()}
                </div>
                
              </div>
            </div>
          </section>
        )}

        {/* Results Sections - Rendered when complete or initializing */}
        <div className={`transition-all duration-1000 ${isScanComplete || !isScanning ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-10 pointer-events-none blur-sm'} space-y-12`}>
          
          {/* Neural Barcode Section */}
          <section className="relative perspective-tilt">
            <div className="p-8 md:p-10 rounded-3xl bg-[#050912]/80 backdrop-blur-xl border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-transform duration-500 barcode-hover preserve-3d">
              
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4 transform translate-z-10">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 flex items-center gap-4">
                    <div className="relative flex items-center justify-center w-6 h-6">
                      <span className="absolute w-full h-full rounded-full bg-cyan-500/20 animate-ping" />
                      <span className="relative w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_15px_cyan]" />
                    </div>
                    Deep Feature Activation Map
                  </h2>
                  <p className="mt-2 text-gray-500 font-mono text-xs tracking-widest uppercase">
                    Latent Space Representation // 512 Dimensions
                  </p>
                </div>
                <div className="px-4 py-2 rounded-lg bg-black/50 border border-gray-800 font-mono text-cyan-400 text-xs tracking-widest shadow-inner">
                  SHAPE: [1, 512, 1, 1]
                </div>
              </div>
              
              {/* High-Fidelity Barcode */}
              <div className="w-full h-48 md:h-64 bg-black/80 rounded-2xl border border-gray-800/80 p-2 overflow-hidden shadow-[inset_0_10px_30px_rgba(0,0,0,1)] relative flex items-center group">
                
                {/* Scanning sweep effect on hover */}
                <div className="absolute top-0 left-0 w-[5%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] -translate-x-[200%] group-hover:animate-[slide_2s_ease-in-out_infinite] z-20 pointer-events-none" />

                <div className="w-full h-full flex items-end justify-between gap-[1px] md:gap-[2px]">
                  {features.map((val, idx) => {
                    let baseClass = "bg-[#1a1a24]"; 
                    let height = Math.max(5, val * 100);
                    let shadow = "";
                    let zIndex = "z-0";

                    if (val > 0.85) {
                      baseClass = "bg-pink-500"; 
                      shadow = "shadow-[0_0_20px_rgba(236,72,153,1)]";
                      height = 100;
                      zIndex = "z-10";
                    } else if (val > 0.7) {
                      baseClass = "bg-cyan-400"; 
                      shadow = "shadow-[0_0_15px_rgba(34,211,238,0.8)]";
                      height = 90;
                      zIndex = "z-10";
                    } else if (val > 0.4) {
                      baseClass = "bg-indigo-500"; 
                    }

                    return (
                      <div
                        key={idx}
                        className={`flex-1 rounded-t-sm transition-all duration-300 hover:bg-white hover:shadow-[0_0_20px_white] cursor-crosshair relative ${baseClass} ${shadow} ${zIndex}`}
                        style={{ height: `${height}%`, opacity: val > 0.7 ? 1 : Math.max(0.1, val) }}
                        title={`Feature[${idx}] = ${val.toFixed(4)}`}
                      >
                         {val > 0.85 && (
                           <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white shadow-[0_0_5px_white]" />
                         )}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Axis markers */}
              <div className="mt-6 flex justify-between px-2 text-[10px] font-mono text-gray-600">
                <span>0</span>
                <span>128</span>
                <span>256</span>
                <span>384</span>
                <span>512</span>
              </div>
            </div>
          </section>

          {/* Radiomics Grids Section */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            
            {/* Density Histogram */}
            <div className="w-full h-full flex flex-col">
               <h3 className="text-xl font-bold text-gray-200 mb-6 flex items-center gap-3">
                 <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>

               </h3>
               <div className="h-[450px] w-full">
                 <HUDensityHistogram histogramData={histogram} />
               </div>
            </div>

            {/* GLCM Matrix */}
            <div className="w-full bg-[#050912]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.3)] flex flex-col relative overflow-hidden group">
              
              <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 blur-[100px] rounded-full pointer-events-none" />
              
              <div className="flex items-center justify-between mb-8 z-10">
                <h3 className="text-xl font-bold text-gray-200 flex items-center gap-3">
                  <svg className="w-5 h-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                  Co-occurrence Matrix (GLCM)
                </h3>
                <span className="px-3 py-1 bg-pink-500/10 text-pink-400 rounded border border-pink-500/20 text-[10px] font-mono tracking-widest uppercase">
                  Texture Analytics
                </span>
              </div>
              
              <div className="flex-1 w-full bg-black/60 rounded-2xl border border-gray-800/80 p-6 flex items-center justify-center shadow-inner relative z-10">
                
                {/* Matrix Grid */}
                <div className="grid grid-cols-8 gap-1 w-full max-w-[240px] aspect-square relative z-10 perspective-tilt transform rotate-x-12 rotate-y-6 group-hover:rotate-x-0 group-hover:rotate-y-0 transition-transform duration-700 preserve-3d">
                  {glcm.map((val, i) => {
                    let bg = "bg-[#1a1a24]";
                    let z = "translate-z-0";
                    if (val > 0.8) {
                      bg = "bg-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.9)]";
                      z = "translate-z-6";
                    } else if (val > 0.6) {
                      bg = "bg-pink-400";
                      z = "translate-z-4";
                    } else if (val > 0.4) {
                      bg = "bg-purple-500";
                      z = "translate-z-2";
                    } else if (val > 0.2) {
                      bg = "bg-indigo-700";
                    }
                    
                    return (
                      <div 
                        key={i} 
                        className={`w-full h-full rounded-[2px] transition-all duration-300 hover:scale-150 hover:bg-white hover:shadow-[0_0_20px_white] hover:z-50 cursor-crosshair relative transform ${bg} ${z}`}
                        style={{ opacity: Math.max(0.15, val) }}
                        title={`Entropy: ${val.toFixed(4)}`}
                      />
                    );
                  })}
                </div>
                
                {/* Legend */}
                <div className="absolute bottom-6 left-6 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 bg-pink-500 rounded-sm shadow-[0_0_8px_#ec4899] animate-pulse"></span> 
                    <span className="text-[10px] text-gray-400 font-mono tracking-widest">HIGH HETEROGENEITY</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 bg-[#1a1a24] border border-gray-700 rounded-sm"></span> 
                    <span className="text-[10px] text-gray-500 font-mono tracking-widest">HOMOGENEOUS TISSUE</span>
                  </div>
                </div>
              </div>
            </div>
            
          </section>

          {/* Raw Data Output */}
          <section>
            <div className="rounded-2xl bg-[#03060a]/90 backdrop-blur-md border border-gray-800/80 overflow-hidden shadow-2xl relative">
              <div className="flex items-center justify-between px-6 py-4 bg-[#070b14] border-b border-gray-800/80">
                <div className="flex items-center gap-4">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-400 transition-colors" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-400 transition-colors" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-400 transition-colors" />
                  </div>
                  <span className="text-xs text-gray-400 font-mono tracking-wider flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    extracted_vector.json
                  </span>
                </div>
                <button className="text-gray-500 hover:text-cyan-400 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </button>
              </div>
              
              <div className="p-6 text-gray-300 font-mono text-sm leading-loose max-h-[250px] overflow-y-auto custom-scrollbar relative">
                
                {isScanning && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="text-cyan-500 flex items-center gap-3">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      STREAMING DATA...
                    </div>
                  </div>
                )}
                
                <div className="space-y-1">
                  <div><span className="text-pink-400">const</span> <span className="text-blue-300">latentVector</span> <span className="text-white">=</span> <span className="text-yellow-300">[</span></div>
                  <div className="pl-6 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-x-4 gap-y-1 text-gray-400">
                    {features.slice(0, 64).map((f, i) => (
                      <span key={i} className="hover:text-cyan-400 cursor-default transition-colors">
                        {f.toFixed(4)},
                      </span>
                    ))}
                  </div>
                  <div className="pl-6 text-gray-600 italic py-2">
                    // ... 448 dimensional parameters omitted for display
                  </div>
                  <div><span className="text-yellow-300">]</span>;</div>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default FeatureExtractionStudio;
