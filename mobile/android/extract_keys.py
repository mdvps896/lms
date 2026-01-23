
import re

with open('signing_report.txt', 'r', encoding='utf-8') as f:
    content = f.read()

sha1_matches = re.findall(r'SHA1: ([\w:]+)', content)
sha256_matches = re.findall(r'SHA-256: ([\w:]+)', content)

def print_chunks(name, key):
    print(f"--- {name} ---")
    parts = key.split(':')
    for i in range(0, len(parts), 8):
        print(":".join(parts[i:i+8]))

if sha1_matches:
    print_chunks("SHA1", sha1_matches[0])
if sha256_matches:
    print_chunks("SHA-256", sha256_matches[0])
