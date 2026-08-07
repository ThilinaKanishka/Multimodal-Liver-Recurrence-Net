import re

file_path = 'd:/Multimodal-Liver-Recurrence-Net/frontend/src/pages/LongitudinalPredictPage.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the JSX syntax error
content = content.replace('</div>>', '</div>')

# Fix Panel 1 Header
content = re.sub(
    r'<div className="bg-black/40 px-4 py-3 border-b border-white/5 backdrop-blur-md flex items-center justify-between.*?1\. Diagnostic Pipeline\s*</h2>\s*</div>',
    '''<div className="bg-gradient-to-r from-black/40 to-transparent px-5 py-4 border-b border-white/10 flex items-center justify-between z-10 relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#00e5ff] to-blue-600 shadow-[0_0_10px_#00e5ff]"></div>
                  <h2 className="text-[12px] uppercase tracking-[0.2em] text-white font-black flex items-center gap-3 drop-shadow-md">
                    <Database className="w-4 h-4 text-[#00e5ff] drop-shadow-[0_0_8px_rgba(0,229,255,0.6)]" />
                    1. DIAGNOSTIC PIPELINE
                  </h2>
                </div>''',
    content, flags=re.DOTALL
)

# Fix Panel 2 Header
content = re.sub(
    r'<div className="bg-black/40 px-4 py-3 border-b border-white/5 backdrop-blur-md.*?2\. RADIOLOGICAL FEATURES\s*</h2>\s*</div>',
    '''<div className="bg-gradient-to-r from-black/40 to-transparent px-5 py-4 border-b border-white/10 flex items-center z-10 relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-400 to-purple-600 shadow-[0_0_10px_rgba(129,140,248,0.5)]"></div>
                    <h2 className="text-[12px] uppercase tracking-[0.2em] text-white font-black flex items-center gap-3 drop-shadow-md">
                      <Microscope className="w-4 h-4 text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.6)]" />
                      2. RADIOLOGICAL FEATURES
                    </h2>
                  </div>''',
    content, flags=re.DOTALL
)

# Fix Panel 3 Header
content = re.sub(
    r'<div className="bg-black/40 px-4 py-3 border-b border-white/5 backdrop-blur-md.*?3\. Lab Markers & Phenotypes\s*</h2>\s*</div>',
    '''<div className="bg-gradient-to-r from-black/40 to-transparent px-5 py-4 border-b border-white/10 flex items-center z-10 relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600 shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
                    <h2 className="text-[12px] uppercase tracking-[0.2em] text-white font-black flex items-center gap-3 drop-shadow-md">
                      <Activity className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                      3. LAB MARKERS & PHENOTYPES
                    </h2>
                  </div>''',
    content, flags=re.DOTALL
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed headers and syntax errors')
