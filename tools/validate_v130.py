from pathlib import Path
from PIL import Image
import json, hashlib, subprocess, sys, xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
errs=[]
def check(name,ok):
    print(('PASS' if ok else 'FAIL')+': '+name)
    if not ok: errs.append(name)
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
manifest_paths=[ROOT/'shared/data/brand-logos.json',ROOT/'web/data/brand-logos.json',ROOT/'android/app/src/main/assets/data/brand-logos.json']
ms=[]
for p in manifest_paths:
    try: ms.append(json.loads(p.read_text(encoding='utf-8'))); check(f'JSON {p.relative_to(ROOT)}',True)
    except Exception: check(f'JSON {p.relative_to(ROOT)}',False)
check('manifests identical',len(ms)==3 and ms[0]==ms[1]==ms[2])
check('manifest v1.4',len(ms)==3 and all(m.get('version')=='1.4' for m in ms))
active=[b for b in ms[0]['brands'] if b.get('verifiedVersion')=='v130'] if ms else []
check('30 active v130 logos',len(active)==30)
for b in active:
    key=b['key']; paths=[ROOT/'shared/logos'/f'{key}-pack-v130.png',ROOT/'web/assets/logos'/f'{key}-pack-v130.png',ROOT/'android/app/src/main/assets/logos'/f'{key}-pack-v130.png']
    ok=all(p.exists() for p in paths)
    if ok:
        ok=len({sha(p) for p in paths})==1 and all(Image.open(p).size==(256,256) for p in paths)
    check(f'{key} synchronized PNG',ok)
check('93 raw pack assets',len(list((ROOT/'shared/logos/pack-v130-raw').glob('*.png')))==93)
resolver=(ROOT/'android/app/src/main/java/com/ecupulse/app/ui/BrandLogoResolver.kt').read_text(encoding='utf-8')
check('Android resolver v130-first','packV130' in resolver and resolver.index('exists(context, packV130)') < resolver.index('exists(context, officialV120)'))
check('Web v0.13',"APP_VERSION='0.13.0'" in (ROOT/'web/app.js').read_text(encoding='utf-8'))
check('Android v0.13','versionName = "0.13.0"' in (ROOT/'android/app/build.gradle.kts').read_text(encoding='utf-8'))
check('GitHub Android SDK setup','android-actions/setup-android@v3' in (ROOT/'.github/workflows/android-apk.yml').read_text(encoding='utf-8'))
for p in ROOT.rglob('*.json'):
    try: json.loads(p.read_text(encoding='utf-8'))
    except Exception: check(f'parse {p.relative_to(ROOT)}',False)
for p in list((ROOT/'android/app/src/main/res').rglob('*.xml'))+[ROOT/'android/app/src/main/AndroidManifest.xml']:
    try: ET.parse(p)
    except Exception: check(f'parse {p.relative_to(ROOT)}',False)
for rel in ['web/app.js','web/ecu-console.js','server/server.js']:
    check('node '+rel,subprocess.run(['node','--check',str(ROOT/rel)],capture_output=True).returncode==0)
print(f'SUMMARY: {len(errs)} failure(s)')
sys.exit(1 if errs else 0)
