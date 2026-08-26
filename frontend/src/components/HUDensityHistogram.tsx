import React, { useMemo, useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const HUDensityHistogram = ({ histogramData }: { histogramData?: number[] }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    if (histogramData && histogramData.length > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [histogramData]);

  // Generate data for HU density
  const chartData = useMemo(() => {
    if (histogramData && histogramData.length > 0) {
      return histogramData.map((val, index) => {
        const hu = -100 + (index * 5);
        
        // Use a Gaussian probability to smoothly blend the tumor region
        // Tumor peak at 25 HU, std dev ~ 15
        const tumorProb = Math.exp(-Math.pow(hu - 25, 2) / 200);
        
        // Mix the normalized density value back into two separate curves
        // Scale it up by 100 for percentage visibility
        const tumorVal = val * 100 * tumorProb * 0.85;
        const healthyVal = val * 100 * (1 - tumorProb * 0.85);

        return {
          hu: hu,
          healthy: Number(healthyVal.toFixed(2)),
          tumor: Number(tumorVal.toFixed(2))
        };
      });
    }

    const data = [];
    // Empty state (Flat line at 0)
    for (let i = -50; i <= 150; i += 5) {
      data.push({
        hu: i,
        healthy: 0,
        tumor: 0
      });
    }
    return data;
  }, [histogramData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#050912]/95 border border-cyan-500/20 p-4 rounded-xl shadow-[0_0_30px_rgba(34,211,238,0.2)] backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-purple-500" />
          <p className="text-gray-200 text-xs font-mono font-bold mb-3 uppercase tracking-widest">{`HU Value: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-3 text-xs font-mono mb-2">
              <span className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: entry.color, color: entry.color }} />
              <span style={{ color: entry.color }} className="font-semibold tracking-wide">
                {entry.name}: {entry.value.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full bg-[#050912]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.3)] relative overflow-hidden group flex flex-col">
      <style>{`
        @keyframes floatBg {
          0% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          33% { transform: translate(30px, -50px) scale(1.1); opacity: 0.5; }
          66% { transform: translate(-20px, 20px) scale(0.9); opacity: 0.4; }
          100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
        }
        .animate-float-bg {
          animation: floatBg 15s ease-in-out infinite;
        }
      `}</style>
      
      {/* Animated Background accents */}
      <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full animate-float-bg pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full animate-float-bg pointer-events-none" style={{ animationDelay: '-7.5s' }} />
      <div className="absolute top-0 right-1/4 w-1/3 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
      
      <div className="mb-8 relative z-10">
        <h2 className="text-xl md:text-2xl font-bold text-gray-200 tracking-wide flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="absolute w-full h-full bg-cyan-400 rounded-full opacity-20 animate-ping" />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          Radiomics: HU Density Distribution
        </h2>
        <div className="mt-3 flex items-center gap-4">
          <p className="text-xs md:text-sm text-gray-400 font-mono tracking-wide">
            Voxel intensity analysis (Hounsfield Units)
          </p>
          <span className="px-2 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[9px] uppercase tracking-widest font-mono hidden sm:inline-block">
            MORPHOLOGY
          </span>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[300px] relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 20, right: 30, left: -20, bottom: 20 }}
          >
            <defs>
              <linearGradient id="colorHealthy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.05}/>
              </linearGradient>
              <linearGradient id="colorTumor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ec4899" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            
            <XAxis 
              dataKey="hu" 
              stroke="#4b5563" 
              tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={{ stroke: '#374151' }}
              label={{ value: 'Hounsfield Units (HU)', position: 'insideBottom', offset: -15, fill: '#9ca3af', fontSize: 11, fontFamily: 'monospace', letterSpacing: '0.1em' }}
            />
            
            <YAxis 
              stroke="#4b5563" 
              tick={false} 
              tickLine={false} 
              axisLine={false}
              label={{ value: 'VOXEL FREQUENCY', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.2em' }}
            />
            
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2, strokeDasharray: '4 4' }} />
            
            <Legend 
              verticalAlign="top" 
              height={40}
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', fontFamily: 'monospace', letterSpacing: '0.05em', color: '#d1d5db' }}
            />
            
            <Area 
              type="monotone" 
              dataKey="healthy" 
              name="HEALTHY TISSUE"
              stroke="#22d3ee" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorHealthy)" 
              activeDot={{ r: 6, fill: '#22d3ee', stroke: '#fff', strokeWidth: 2, style: { filter: 'drop-shadow(0px 0px 5px rgba(34,211,238,0.8))' } }}
              animationDuration={2500}
              animationEasing="ease-in-out"
            />
            
            <Area 
              type="monotone" 
              dataKey="tumor" 
              name="HYPODENSE TUMOR"
              stroke="#ec4899" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorTumor)" 
              activeDot={{ r: 6, fill: '#ec4899', stroke: '#fff', strokeWidth: 2, style: { filter: 'drop-shadow(0px 0px 5px rgba(236,72,153,0.8))' } }}
              animationDuration={2500}
              animationBegin={500}
              animationEasing="ease-in-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HUDensityHistogram;
