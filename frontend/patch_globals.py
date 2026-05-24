import re
import os

file_path = r"c:\stage_projet\frontend\src\app\globals.css"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

replacements = [
    (r"background:\s*#f8fafc", r"background: var(--surface-2)"),
    (r"background:\s*#f9fafb", r"background: var(--surface-2)"),
    (r"background:\s*#EEF2FF", r"background: var(--primary-glow)"),
    (r"background:\s*#f3f4f6", r"background: var(--surface-2)"),
    (r"background:\s*#e2e8f0", r"background: var(--border)"),
    # Add a fallback for hover states on doc-table rows
    (r"\.doc-table tr:hover td \{ background: var\(--surface-2\); \}", r".doc-table tr:hover td { background: var(--surface-2); }"),
]

new_content = content
for pattern, replacement in replacements:
    new_content = re.sub(pattern, replacement, new_content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Globals CSS patched")
