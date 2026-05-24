import re
import os
import glob

src_dir = r"c:\stage_projet\frontend\src"

replacements = [
    (r"background:\s*'white'", r"background: 'var(--surface)'"),
    (r"backgroundColor:\s*'white'", r"backgroundColor: 'var(--surface)'"),
    (r"background:\s*'#ffffff'", r"background: 'var(--surface)'"),
    (r"background:\s*'#fff'", r"background: 'var(--surface)'"),
    (r"background:\s*'#f8fafc'", r"background: 'var(--surface-2)'"),
    (r"background:\s*'#f1f5f9'", r"background: 'var(--surface-2)'"),
    (r"color:\s*'#0f172a'", r"color: 'var(--text-primary)'"),
    (r"color:\s*'#374151'", r"color: 'var(--text-primary)'"),
    (r"color:\s*'#111827'", r"color: 'var(--text-primary)'"),
    (r"color:\s*'#4b5563'", r"color: 'var(--text-secondary)'"),
    (r"color:\s*'#64748b'", r"color: 'var(--text-secondary)'"),
    (r"color:\s*'#94a3b8'", r"color: 'var(--text-muted)'"),
    (r"border:\s*'1px solid #e2e8f0'", r"border: '1px solid var(--border)'"),
    (r"border:\s*'1px solid #e5e7eb'", r"border: '1px solid var(--border)'"),
    (r"border:\s*'1px solid #f1f5f9'", r"border: '1px solid var(--border-light)'"),
    (r"borderBottom:\s*'1px solid #e2e8f0'", r"borderBottom: '1px solid var(--border)'"),
    (r"borderBottom:\s*'1px solid #e5e7eb'", r"borderBottom: '1px solid var(--border)'"),
    (r"borderBottom:\s*'1px solid #f1f5f9'", r"borderBottom: '1px solid var(--border-light)'"),
    (r"borderTop:\s*'1px solid #e2e8f0'", r"borderTop: '1px solid var(--border)'"),
    (r"borderTop:\s*'1px solid #e5e7eb'", r"borderTop: '1px solid var(--border)'"),
    # Replace inline styles missing quotes like background: '#ffffff' => background: 'var(--surface)' is already covered if quoted.
    # What about double quotes?
    (r'background:\s*"white"', r'background: "var(--surface)"'),
    (r'background:\s*"#ffffff"', r'background: "var(--surface)"'),
    (r'background:\s*"#f8fafc"', r'background: "var(--surface-2)"'),
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
                print(f"Patched: {file_path}")
