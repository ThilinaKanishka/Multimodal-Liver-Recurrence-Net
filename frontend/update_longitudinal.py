import re

file_path = 'd:/Multimodal-Liver-Recurrence-Net/frontend/src/pages/LongitudinalPredictPage.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Panel wrappers
content = content.replace(
    'className="bg-gradient-to-b from-[#0a0f18]/60 to-[#060b15]/80 backdrop-blur-xl border border-white/10 rounded-md flex flex-col shadow-lg h-full relative"',
    'className="bg-[#0f1522]/60 backdrop-blur-2xl border border-white/10 rounded-2xl flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden h-full group"\n                ><div className="absolute inset-0 bg-gradient-to-br from-[#00e5ff]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>'
)

# 2. Update Headers for Panel 1
content = content.replace(
    '''<div className="bg-black/40 px-4 py-3 border-b border-white/5 backdrop-blur-md flex items-center justify-between">
                    <h2 className="text-[11px] uppercase tracking-wider text-slate-300 font-bold flex items-center gap-2">
                      <Database className="w-3.5 h-3.5 text-blue-400" />
                      1. Diagnostic Pipeline''',
    '''<div className="bg-gradient-to-r from-black/40 to-transparent px-5 py-4 border-b border-white/10 flex items-center justify-between z-10 relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#00e5ff] to-blue-600 shadow-[0_0_10px_#00e5ff]"></div>
                  <h2 className="text-[12px] uppercase tracking-[0.2em] text-white font-black flex items-center gap-3 drop-shadow-md">
                    <Database className="w-4 h-4 text-[#00e5ff] drop-shadow-[0_0_8px_rgba(0,229,255,0.6)]" />
                    1. DIAGNOSTIC PIPELINE'''
)
# In case it didn't match exactly because of my previous edit:
content = content.replace(
    '''<div className="bg-black/40 px-4 py-3 border-b border-white/5 backdrop-blur-md flex items-center justify-between">
                    <h2 className="text-[11px] uppercase tracking-wider text-slate-300 font-bold flex items-center gap-2">
                      <Database className="w-3.5 h-3.5 text-blue-400" />
                      1. DIAGNOSTIC PIPELINE''',
    '''<div className="bg-gradient-to-r from-black/40 to-transparent px-5 py-4 border-b border-white/10 flex items-center justify-between z-10 relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#00e5ff] to-blue-600 shadow-[0_0_10px_#00e5ff]"></div>
                  <h2 className="text-[12px] uppercase tracking-[0.2em] text-white font-black flex items-center gap-3 drop-shadow-md">
                    <Database className="w-4 h-4 text-[#00e5ff] drop-shadow-[0_0_8px_rgba(0,229,255,0.6)]" />
                    1. DIAGNOSTIC PIPELINE'''
)

# 3. Update Panel 2 wrapper
content = content.replace(
    'className="flex-1 bg-gradient-to-b from-[#0a0f18]/60 to-[#060b15]/80 backdrop-blur-xl border border-white/10 rounded-md shadow-lg overflow-hidden"',
    'className="flex-1 bg-[#0f1522]/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden relative group"\n                ><div className="absolute inset-0 bg-gradient-to-bl from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>'
)

# 4. Update Headers for Panel 2
content = content.replace(
    '''<div className="bg-black/40 px-4 py-3 border-b border-white/5 backdrop-blur-md flex items-center justify-between">
                    <h2 className="text-[11px] uppercase tracking-wider text-slate-300 font-bold flex items-center gap-2">
                      <Microscope className="w-3.5 h-3.5 text-indigo-400" />
                      2. RADIOLOGICAL FEATURES''',
    '''<div className="bg-gradient-to-r from-black/40 to-transparent px-5 py-4 border-b border-white/10 flex items-center z-10 relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-400 to-purple-600 shadow-[0_0_10px_rgba(129,140,248,0.5)]"></div>
                    <h2 className="text-[12px] uppercase tracking-[0.2em] text-white font-black flex items-center gap-3 drop-shadow-md">
                      <Microscope className="w-4 h-4 text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.6)]" />
                      2. RADIOLOGICAL FEATURES'''
)
content = content.replace(
    '''<div className="bg-black/40 px-4 py-3 border-b border-white/5 backdrop-blur-md flex items-center justify-between">
                    <h2 className="text-[11px] uppercase tracking-wider text-slate-300 font-bold flex items-center gap-2">
                      <Microscope className="w-3.5 h-3.5 text-indigo-400" />
                      2. Radiological Features''',
    '''<div className="bg-gradient-to-r from-black/40 to-transparent px-5 py-4 border-b border-white/10 flex items-center z-10 relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-400 to-purple-600 shadow-[0_0_10px_rgba(129,140,248,0.5)]"></div>
                    <h2 className="text-[12px] uppercase tracking-[0.2em] text-white font-black flex items-center gap-3 drop-shadow-md">
                      <Microscope className="w-4 h-4 text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.6)]" />
                      2. RADIOLOGICAL FEATURES'''
)

# 5. Update Panel 3 wrapper (Lab Markers)
content = content.replace(
    'className="flex-1 bg-gradient-to-b from-[#0a0f18]/60 to-[#060b15]/80 backdrop-blur-xl border border-white/10 rounded-md shadow-lg overflow-hidden flex flex-col h-full"',
    'className="flex-1 bg-[#0f1522]/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden relative group flex flex-col h-full"\n                ><div className="absolute inset-0 bg-gradient-to-bl from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>'
)
content = content.replace(
    'className="flex-1 bg-gradient-to-b from-[#0a0f18]/60 to-[#060b15]/80 backdrop-blur-xl border border-white/10 rounded-md shadow-lg overflow-hidden flex flex-col"',
    'className="flex-1 bg-[#0f1522]/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden relative group flex flex-col"\n                ><div className="absolute inset-0 bg-gradient-to-bl from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>'
)


# 6. Update Headers for Panel 3
content = content.replace(
    '''<div className="bg-black/40 px-4 py-3 border-b border-white/5 backdrop-blur-md">
                    <h2 className="text-[11px] uppercase tracking-wider text-slate-300 font-bold flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5 text-emerald-400" />
                      3. Lab Markers & Phenotypes''',
    '''<div className="bg-gradient-to-r from-black/40 to-transparent px-5 py-4 border-b border-white/10 flex items-center z-10 relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600 shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
                    <h2 className="text-[12px] uppercase tracking-[0.2em] text-white font-black flex items-center gap-3 drop-shadow-md">
                      <Activity className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                      3. LAB MARKERS & PHENOTYPES'''
)

# 7. Update bottom action bar in Panel 1
content = content.replace(
    'className="p-3 bg-[#060b15]/80 backdrop-blur-xl border-t border-white/10 sticky bottom-0 z-20 rounded-b-md shadow-[0_-8px_16px_rgba(0,0,0,0.4)] mt-auto"',
    'className="p-4 bg-black/40 border-t border-white/10 sticky bottom-0 z-20 rounded-b-2xl mt-auto backdrop-blur-md"'
)

# 8. Update inner padding for panel 1 contents to match PredictPage
content = content.replace(
    'className="p-3 flex flex-col gap-3 flex-1 justify-center max-h-[calc(100vh-240px)]',
    'className="p-4 flex flex-col gap-4 flex-1 justify-start max-h-[calc(100vh-260px)]'
)
content = content.replace(
    'className="p-3 grid grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-3"',
    'className="p-5 grid grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-5 relative z-10"'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated LongitudinalPredictPage panels and headers!")
