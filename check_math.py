import os
import re

math_symbols = ['\\frac', '\\partial', '\\sum', '\\alpha', '\\beta', '\\gamma', '\\lambda', '\\theta', '\\mu', '\\sigma', '\\pi', '\\infty', '\\int', '\\prod', '\\mathbf', '\\mathcal', '\\mathbb', '_{', '^{']

path = "/Users/kanishkk/Library/Mobile Documents/com~apple~CloudDocs/notes"
for root, dirs, files in os.walk(path):
    for f in files:
        if f.endswith(".md") and ".obsidian" not in root:
            with open(os.path.join(root, f), "r") as file:
                content = file.read()
                
                # Remove code blocks
                content = re.sub(r'```.*?```', '', content, flags=re.DOTALL)
                # Remove display math
                content = re.sub(r'\$\$.*?\$\$', '', content, flags=re.DOTALL)
                # Remove inline math
                content = re.sub(r'\$.*?\$', '', content)
                
                lines = content.split('\n')
                for i, line in enumerate(lines):
                    for sym in math_symbols:
                        if sym in line:
                            # Skip some false positives
                            if '_{' in sym or '^{' in sym:
                                if 'http' in line or '<' in line or '->' in line:
                                    continue
                            print(f"{os.path.join(root, f)}:{line.strip()}")
                            break
