import os

def update_all_inputs():
    target_files = [
        'd:/Multimodal-Liver-Recurrence-Net/frontend/src/pages/AdminDashboardPage.tsx',
        'd:/Multimodal-Liver-Recurrence-Net/frontend/src/pages/DoctorBillingPage.tsx',
        'd:/Multimodal-Liver-Recurrence-Net/frontend/src/pages/PatientSearchPage.tsx',
    ]
    
    for file_path in target_files:
        if not os.path.exists(file_path):
            continue
            
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Replace dark mode input backgrounds
        content = content.replace("bg-[#131826] border-[#1a1c2c]", "bg-[#0a0f18]/60 backdrop-blur-sm border-white/10")
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
            
    # Also add a visual indicator to PredictPage and LongitudinalPredictPage
    for page in ['PredictPage.tsx', 'LongitudinalPredictPage.tsx']:
        path = f'd:/Multimodal-Liver-Recurrence-Net/frontend/src/pages/{page}'
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                c = f.read()
            c = c.replace("1. DIAGNOSTIC PIPELINE", "1. ⚡ DIAGNOSTIC PIPELINE")
            with open(path, 'w', encoding='utf-8') as f:
                f.write(c)
                
    print("Updated all inputs and added ⚡ indicator!")

update_all_inputs()
