import re
import os
import glob

src_dir = r"c:\stage_projet\frontend\src"

replacements = [
    # Gérer les linear-gradient hardcodés pour le fond de page
    (r"background:\s*'linear-gradient\(135deg,\s*#f6f8fb\s*0%,\s*#e9eef5\s*100%\)'", r"background: 'var(--bg)'"),
    
    # Les rgba pour les cartes
    (r"background:\s*'rgba\(255,\s*255,\s*255,\s*0\.8\)'", r"background: 'var(--surface)'"),
    (r"border:\s*'1px solid rgba\(255,\s*255,\s*255,\s*0\.6\)'", r"border: '1px solid var(--border)'"),
    
    # Les box-shadow
    (r"boxShadow:\s*'0\s*8px\s*32px\s*0\s*rgba\(31,\s*38,\s*135,\s*0\.05\)'", r"boxShadow: 'var(--shadow-sm)'"),
    (r"boxShadow:\s*'0\s*12px\s*40px\s*rgba\(0,0,0,0\.08\)'", r"boxShadow: 'var(--shadow-md)'"),
    
    # Text colors
    (r"color:\s*'#1e293b'", r"color: 'var(--text-primary)'"),
    
    # Other hardcoded stuff
    (r"background:\s*'#f6f8fb'", r"background: 'var(--bg)'"),
    (r"background:\s*'#e9eef5'", r"background: 'var(--border)'"),
]

for root, _, files in os.walk(src_dir):
    for file in files:
        if file.endswith(".tsx") or file.endswith(".ts"):
            file_path = os.path.join(root, file)
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            new_content = content
            for pattern, replacement in replacements:
                new_content = re.sub(pattern, replacement, new_content)
                
            if new_content != content:
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(new_content)
                print(f"Patched Dashboard Card Styles: {file_path}")
