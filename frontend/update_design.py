import re
import os

def update_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Replace InputField, SelectField, CheckboxField
    components_regex = r'const InputField = .*?const CheckboxField = .*?\);\n'
    replacement_components = """const InputField = ({ label, name, value, type="number", unit="", step="1", onChange, autoFilled }: any) => (
  <div className="flex flex-col group relative">
    <label className="text-[10px] uppercase tracking-widest text-slate-400 mb-1 flex justify-between items-center font-bold group-focus-within:text-[#00e5ff] transition-colors duration-300">
      {label}
      {autoFilled && <span className="text-[8px] text-[#00e5ff] bg-[#00e5ff]/10 px-1.5 py-0.5 rounded border border-[#00e5ff]/30 animate-pulse shadow-[0_0_8px_rgba(0,229,255,0.3)]">AUTO</span>}
    </label>
    <div className="relative flex">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        step={step}
        className={`w-full text-xs font-mono ${autoFilled ? 'bg-[#00e5ff]/10 border-[#00e5ff]/50 text-cyan-100 shadow-[0_0_15px_rgba(0,229,255,0.15)]' : 'bg-[#0a0f18]/60 border-white/10 text-slate-200 hover:bg-[#0f1623]/80'} border rounded-lg py-2 pl-3 ${unit ? 'pr-10' : 'pr-3'} focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff]/50 focus:bg-[#0a0f18] outline-none transition-all duration-300 backdrop-blur-sm`}
      />
      {unit && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <span className="text-slate-500 text-[10px] font-bold group-focus-within:text-[#00e5ff]/70 transition-colors">{unit}</span>
        </div>
      )}
    </div>
  </div>
);

const SelectField = ({ label, name, value, options, onChange, autoFilled }: any) => (
  <div className="flex flex-col group relative">
    <label className="text-[10px] uppercase tracking-widest text-slate-400 mb-1 flex justify-between items-center font-bold group-focus-within:text-[#00e5ff] transition-colors duration-300">
      {label}
      {autoFilled && <span className="text-[8px] text-[#00e5ff] bg-[#00e5ff]/10 px-1.5 py-0.5 rounded border border-[#00e5ff]/30 animate-pulse shadow-[0_0_8px_rgba(0,229,255,0.3)]">AUTO</span>}
    </label>
    <div className="relative flex">
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full text-xs font-mono ${autoFilled ? 'bg-[#00e5ff]/10 border-[#00e5ff]/50 text-cyan-100 shadow-[0_0_15px_rgba(0,229,255,0.15)]' : 'bg-[#0a0f18]/60 border-white/10 text-slate-200 hover:bg-[#0f1623]/80'} border rounded-lg py-2 pl-3 pr-8 focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff]/50 focus:bg-[#0a0f18] outline-none transition-all duration-300 backdrop-blur-sm appearance-none cursor-pointer`}
      >
        {options.map((opt: any) => <option key={opt.value} value={opt.value} className="bg-[#0f1623] font-sans text-xs">{opt.label}</option>)}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-slate-500 group-focus-within:text-[#00e5ff] transition-colors">
        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
      </div>
    </div>
  </div>
);

const CheckboxField = ({ label, name, checked, onChange, autoFilled }: any) => (
  <label className={`flex items-center gap-2 p-2 rounded-lg border ${autoFilled ? 'bg-[#00e5ff]/10 border-[#00e5ff]/50 shadow-[0_0_15px_rgba(0,229,255,0.15)]' : 'bg-[#0a0f18]/60 border-white/10 hover:border-white/20 hover:bg-[#0f1623]/80'} cursor-pointer transition-all duration-300 backdrop-blur-sm group relative overflow-hidden`}>
    {checked && <div className="absolute inset-0 bg-gradient-to-r from-[#00e5ff]/10 to-transparent opacity-50"></div>}
    <div className="relative flex items-center justify-center flex-shrink-0">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <div className="w-3.5 h-3.5 rounded border border-slate-500 bg-black/50 peer-checked:bg-[#00e5ff] peer-checked:border-[#00e5ff] transition-all duration-300 flex items-center justify-center shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)] peer-checked:shadow-[0_0_10px_rgba(0,229,255,0.5)]">
        <svg className={`w-2.5 h-2.5 text-black transform transition-transform duration-300 ${checked ? 'scale-100' : 'scale-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    </div>
    <span className={`text-[10px] font-bold tracking-wide flex-1 leading-tight transition-colors duration-300 z-10 ${checked ? 'text-[#00e5ff]' : 'text-slate-300 group-hover:text-slate-200'}`}>{label}</span>
    {autoFilled && <span className="text-[8px] font-black text-[#00e5ff] z-10">AUTO</span>}
  </label>
);
"""
    content = re.sub(components_regex, replacement_components, content, flags=re.DOTALL)

    # 2. Add Animated Backgrounds for LongitudinalPredictPage
    if 'LongitudinalPredictPage' in file_path:
        bg_regex = r'(<div className="flex-1 flex flex-col min-h-full relative">)'
        bg_replacement = r'''\1
      <style>{`
        @keyframes slideDown {
          0% { transform: translateY(-100%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(100%); opacity: 0; }
        }
        @keyframes slideUp {
          0% { transform: translateY(100%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(-100%); opacity: 0; }
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      
      {/* Immersive Animated Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[radial-gradient(circle,rgba(0,184,212,0.08),transparent_60%)] blur-[100px] animate-[pulse_10s_ease-in-out_infinite_alternate] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-[radial-gradient(circle,rgba(0,255,157,0.05),transparent_60%)] blur-[120px] animate-[pulse_8s_ease-in-out_infinite_alternate-reverse] pointer-events-none z-0"></div>
      <div className="absolute top-[30%] left-[40%] w-[30vw] h-[30vw] rounded-full bg-[radial-gradient(circle,rgba(111,66,193,0.05),transparent_60%)] blur-[100px] animate-[pulse_12s_ease-in-out_infinite_alternate] pointer-events-none z-0"></div>
'''
        content = re.sub(bg_regex, bg_replacement, content)

    # 3. Replace Panel Styles
    content = content.replace('bg-[#131826] border border-[#1e293b]', 'bg-gradient-to-b from-[#0a0f18]/60 to-[#060b15]/80 backdrop-blur-xl border border-white/10')
    content = content.replace('bg-[#131826] border-[#1e293b]', 'bg-gradient-to-b from-[#0a0f18]/60 to-[#060b15]/80 backdrop-blur-xl border-white/10')
    content = content.replace('bg-[#1a2235] px-3 py-2 border-b border-[#1e293b]', 'bg-black/40 px-4 py-3 border-b border-white/5 backdrop-blur-md')
    content = content.replace('bg-[#070b14]', 'bg-[#030712]')
    content = content.replace('bg-[#131826] border-b border-[#1e293b]', 'bg-[#060b15]/80 backdrop-blur-xl border-b border-white/10')
    
    # Common old dark theme replacements
    content = content.replace('bg-[#1e293b]', 'bg-[#1e293b]/50')
    content = content.replace('bg-[#0a0e17]', 'bg-black/40 backdrop-blur-sm')

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Updated {file_path}')

files_to_update = [
    'd:/Multimodal-Liver-Recurrence-Net/frontend/src/pages/LongitudinalPredictPage.tsx',
    'd:/Multimodal-Liver-Recurrence-Net/frontend/src/pages/AdminDashboardPage.tsx',
    'd:/Multimodal-Liver-Recurrence-Net/frontend/src/pages/DoctorBillingPage.tsx',
    'd:/Multimodal-Liver-Recurrence-Net/frontend/src/pages/PatientSearchPage.tsx',
    'd:/Multimodal-Liver-Recurrence-Net/frontend/src/App.tsx'
]

# Note: App.tsx has PatientProfilePage and Dashboard.
# Wait, replacing bg-[#131826] might affect App.tsx too.
# Let's apply to all these files!
for f in files_to_update:
    if os.path.exists(f):
        update_file(f)

# Update DoctorMessages.tsx as well
support_file = 'd:/Multimodal-Liver-Recurrence-Net/frontend/src/components/DoctorMessages.tsx'
if os.path.exists(support_file):
    update_file(support_file)

print('All pages updated.')
