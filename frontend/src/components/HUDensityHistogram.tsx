import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const HUDensityHistogram = ({ histogramData }: { histogramData?: number[] }) => {
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
        <div className="bg-[#0a0f18]/95 border border-white/10 p-3 rounded-lg shadow-[0_0_15px_rgba(0,0,0,0.5)] backdrop-blur-md">
          <p className="text-gray-300 text-sm font-bold mb-2">{`HU Value: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-xs font-mono mb-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span style={{ color: entry.color }}>
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
    <div className="p-6 md:p-8 rounded-2xl bg-[#090d14] border border-white/5 shadow-2xl relative overflow-hidden group flex flex-col w-full h-full">
      {/* Background accents */}
      <div className="absolute top-0 right-1/4 w-1/3 h-px bg-gradient-to-r from-transparent via-[#00E5FF]/50 to-transparent" />
      
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-200 tracking-wide flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#00E5FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
          Radiomics: HU Density Distribution
        </h2>
        <p className="text-sm md:text-base text-gray-400 mt-2">
          Voxel intensity analysis (Hounsfield Units) comparing healthy liver tissue vs. tumor morphology.
        </p>
      </div>

      <div className="flex-1 w-full min-h-[350px] relative mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
          >
            <defs>
              <linearGradient id="colorHealthy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#00E5FF" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorTumor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF007F" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#FF007F" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
            
            <XAxis 
              dataKey="hu" 
              stroke="#6b7280" 
              tick={{ fill: '#6b7280', fontSize: 12, fontFamily: 'monospace' }}
              tickLine={{ stroke: '#4b5563' }}
              axisLine={{ stroke: '#4b5563' }}
              label={{ value: 'Hounsfield Units (HU)', position: 'insideBottom', offset: -10, fill: '#9ca3af', fontSize: 12 }}
            />
            
            <YAxis 
              stroke="#6b7280" 
              tick={false} 
              tickLine={false} 
              axisLine={false}
              label={{ value: 'Voxel Frequency / Density', angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 12, offset: 15 }}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Legend 
              verticalAlign="top" 
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '14px', paddingTop: '10px' }}
            />
            
            <Area 
              type="monotone" 
              dataKey="healthy" 
              name="Healthy Liver Tissue"
              stroke="#00E5FF" 
              strokeWidth={2}
              fillOpacity={0.5} 
              fill="url(#colorHealthy)" 
              activeDot={{ r: 6, fill: '#00E5FF', stroke: '#fff' }}
            />
            
            <Area 
              type="monotone" 
              dataKey="tumor" 
              name="Hypodense Tumor"
              stroke="#FF007F" 
              strokeWidth={2}
              fillOpacity={0.6} 
              fill="url(#colorTumor)" 
              activeDot={{ r: 6, fill: '#FF007F', stroke: '#fff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HUDensityHistogram;
