import re
import os

files_to_update = [
    '/home/nota/Workspace/Codemotion---Play-The-City--/UI/src/components/Landingscreen.tsx',
    '/home/nota/Workspace/Codemotion---Play-The-City--/UI/src/components/OnboardingScreen.tsx'
]

for file_path in files_to_update:
    with open(file_path, 'r') as f:
        content = f.read()

    # Shared background
    content = content.replace("linear-gradient(150deg, #f8faff 0%, #f0fdff 55%, #ecfeff 100%)", "linear-gradient(150deg, #09090b 0%, #18181b 55%, #18212f 100%)")
    
    # Text colors
    content = content.replace("color: '#0f172a'", "color: '#f8fafc'")
    content = content.replace("color: '#334155'", "color: '#f8fafc'")
    content = content.replace("color: '#64748b'", "color: '#94a3b8'")
    content = content.replace("color: '#475569'", "color: '#94a3b8'")
    content = content.replace("color: '#94a3b8'", "color: '#cbd5e1'")  # Already lightish, but make it brighter
    content = content.replace("background: '#e2e8f0'", "background: '#3f3f46'")
    
    # Card / Element Backgrounds
    content = content.replace("backgroundColor: 'rgba(255, 255, 255, 0.7)'", "backgroundColor: 'rgba(24, 24, 27, 0.7)'")
    content = content.replace("linear-gradient(135deg, #ecfeff, #cffafe)", "linear-gradient(135deg, rgba(6,182,212,0.1), rgba(6,182,212,0.05))")
    content = content.replace("border: '1px solid rgba(255,255,255,0.5)'", "border: '1px solid rgba(6,182,212,0.2)'")
    content = content.replace("border: '1px solid rgba(255, 255, 255, 0.5)'", "border: '1px solid rgba(6,182,212,0.2)'")
    content = content.replace("rgba(255,255,255,0.15)", "rgba(0,0,0,0.3)")

    # XP badge color
    content = content.replace("color: '#0891b2'", "color: '#22d3ee'")
    
    with open(file_path, 'w') as f:
        f.write(content)

print('Done')
