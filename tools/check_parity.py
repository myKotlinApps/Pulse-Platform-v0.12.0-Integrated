from pathlib import Path
import json,sys
root=Path(__file__).resolve().parents[1]
f=json.loads((root/'shared/features.json').read_text(encoding='utf-8'))
errors=[]
for x in f['features']:
 if x['status'].startswith('implemented') and (not x.get('web') or not x.get('android')): errors.append(x['id'])
print(f"Checked {len(f['features'])} features")
if errors: print('Missing parity:',errors);sys.exit(1)
