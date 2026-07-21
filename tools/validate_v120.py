from __future__ import annotations
from pathlib import Path
import hashlib, json, re, subprocess, sys, xml.etree.ElementTree as ET
from PIL import Image

BASE=Path('/mnt/data/ECU-Pulse-Platform-v0.12.0-Full-Integrated')
brands=['ikco','saipa','zamyad','bahman','kmc','mvm','fownix','farda','lamari','diar','mammut','parskhodro','bahmandiesel','ikcodiesel','modirankhodro','kermanmotor']
results=[]
def check(name, cond, detail=''):
    status='PASS' if cond else 'FAIL'
    results.append((status,name,detail))
    print(f'{status}: {name}' + (f' — {detail}' if detail else ''))
    return cond

def sha(p:Path): return hashlib.sha256(p.read_bytes()).hexdigest()

check('project root exists', BASE.is_dir(), str(BASE))
# manifests
manifest_paths=[BASE/'shared/data/brand-logos.json',BASE/'web/data/brand-logos.json',BASE/'android/app/src/main/assets/data/brand-logos.json']
manifests=[]
for p in manifest_paths:
    try:
        manifests.append(json.loads(p.read_text()))
        check(f'JSON parse {p.relative_to(BASE)}', True)
    except Exception as e:
        check(f'JSON parse {p.relative_to(BASE)}', False, str(e))
check('logo manifests version 1.3', all(m.get('version')=='1.3' for m in manifests))
check('logo manifests byte-identical', len({sha(p) for p in manifest_paths})==1)

# logo files and alpha
for brand in brands:
    paths=[BASE/f'shared/logos/{brand}-official-v120.png',BASE/f'web/assets/logos/{brand}-official-v120.png',BASE/f'android/app/src/main/assets/logos/{brand}-official-v120.png']
    check(f'{brand}: files exist on all platforms', all(p.is_file() for p in paths))
    if all(p.is_file() for p in paths):
        check(f'{brand}: files byte-identical', len({sha(p) for p in paths})==1)
        try:
            im=Image.open(paths[0]); im.load()
            alpha='A' in im.mode
            bbox=im.getbbox()
            check(f'{brand}: PNG 640x640 with alpha', im.format=='PNG' and im.size==(640,640) and alpha and bbox is not None, f'{im.format} {im.mode} {im.size}')
        except Exception as e:
            check(f'{brand}: image readable', False, str(e))

# manifest refs
for m,label,assetroot in [(manifests[0],'shared',BASE/'shared'),(manifests[1],'web',BASE/'web'),(manifests[2],'android',BASE/'android/app/src/main/assets')]:
    by={x.get('key'):x for x in m.get('brands',[])}
    check(f'{label}: contains all 16 Iranian brands', all(k in by for k in brands))
    for k in brands:
        ref=(by.get(k) or {}).get('png','')
        rel=ref.replace('assets/','',1) if label in ('shared','android') else ref
        p=assetroot/rel
        check(f'{label}: manifest ref exists for {k}', p.is_file(), ref)

# car icon
car_paths=[BASE/'shared/icons/trip-car-top.png',BASE/'web/assets/icons/trip-car-top.png',BASE/'android/app/src/main/assets/icons/trip-car-top.png']
check('trip car PNG exists on all platforms', all(p.is_file() for p in car_paths))
if all(p.is_file() for p in car_paths):
    check('trip car PNG byte-identical', len({sha(p) for p in car_paths})==1)
    im=Image.open(car_paths[0]); im.load()
    check('trip car PNG is transparent 256x256', im.format=='PNG' and im.size==(256,256) and 'A' in im.mode, f'{im.mode} {im.size}')

# Web code
web_js=(BASE/'web/app.js').read_text()
web_html=(BASE/'web/index.html').read_text()
web_css=(BASE/'web/styles.css').read_text()
check('web uses PNG trip marker', 'assets/icons/trip-car-top.png' in web_js and 'assets/icons/trip-car-top.png' in web_html)
check('web no legacy pulse marker', 'fallbackPulse' not in web_js+web_html+web_css and 'trip-car-dot' not in web_js+web_html+web_css)
check('web smooth animation via requestAnimationFrame', 'requestAnimationFrame(step)' in web_js and 'lerpHeading' in web_js and 'shortestAngle' in web_js)
check('web replay does not pan map every frame', '.panTo(' not in web_js and 'state.map.panTo' not in web_js)
check('web full-route fit uses Leaflet fitBounds', 'fitBounds(bounds' in web_js and 'maxZoom:13' in web_js)
check('web exposes whole-route button', 'id="fitTripMap"' in web_html and 'نمایش کل مسیر' in web_html)
check('web demo button visible text', 'id="activateDemo">شروع دمو<' in web_html and '#activateDemo' in web_css)
check('web logo resolver prefers manifest PNG', 'return meta?.png||meta?.file' in web_js)

# Android trip map
trip_html=(BASE/'android/app/src/main/assets/trip-map.html').read_text()
check('android trip map uses PNG car', 'icons/trip-car-top.png' in trip_html)
check('android trip map no circular car marker', 'id="car"' in trip_html and '<circle' not in trip_html.split('id="car"',1)[1].split('</g>',1)[0])
check('android trip animation uses requestAnimationFrame', 'requestAnimationFrame(step)' in trip_html and 'angleLerp' in trip_html and 'shortest(' in trip_html)
check('android full route is statically fitted', 'viewBox="-35 -35 1070 690"' in trip_html and 'function fitAll()' in trip_html)
check('android whole-route button exists', 'id="fit"' in trip_html and '>کل مسیر<' in trip_html)

# Android demo button and logo resolver
main=(BASE/'android/app/src/main/java/com/ecupulse/app/MainActivity.kt').read_text()
resolver=(BASE/'android/app/src/main/java/com/ecupulse/app/ui/BrandLogoResolver.kt').read_text()
layouts=[BASE/'android/app/src/main/res/layout/screen_dashboard.xml',BASE/'android/app/src/main/res/layout-land/screen_dashboard.xml',BASE/'android/app/src/main/res/layout-sw600dp/screen_dashboard.xml']
for p in layouts:
    try:
        ET.parse(p); parsed=True
    except Exception: parsed=False
    txt=p.read_text()
    check(f'layout parses: {p.parent.name}/{p.name}', parsed)
    check(f'demo button readable: {p.parent.name}', 'android:text="شروع دمو"' in txt and 'android:minHeight="52dp"' in txt and 'android:textAllCaps="false"' in txt)
check('android demo button forced visible', 'demoResetButton.visibility = View.VISIBLE' in main)
check('android demo button has dynamic label', 'if (state.vehicle?.isDemo == true) "اجرای دوباره دمو" else "شروع دمو"' in main)
check('android logo resolver prefers official-v120', 'officialV120' in resolver and resolver.index('officialV120') < resolver.index('verifiedV110'))

# XML and JSON all parse
xml_files=list((BASE/'android/app/src/main/res').rglob('*.xml'))+[BASE/'android/app/src/main/AndroidManifest.xml']
xml_ok=True; xml_err=[]
for p in xml_files:
    try: ET.parse(p)
    except Exception as e: xml_ok=False; xml_err.append(f'{p.relative_to(BASE)}: {e}')
check(f'all Android XML parses ({len(xml_files)} files)', xml_ok, '; '.join(xml_err[:3]))
json_files=list(BASE.rglob('*.json'))
json_ok=True; json_err=[]
for p in json_files:
    try: json.loads(p.read_text())
    except Exception as e: json_ok=False; json_err.append(f'{p.relative_to(BASE)}: {e}')
check(f'all JSON parses ({len(json_files)} files)', json_ok, '; '.join(json_err[:3]))

# Product variants derive from main
build=(BASE/'android/app/build.gradle.kts').read_text()
platforms=re.findall(r'create\("(legacy|modern)"\)',build)
stores=re.findall(r'create\("(googlePlay|cafebazaar|myket)"\)',build)
variants=[p+s[0].upper()+s[1:] for p in platforms for s in stores]
check('all six Android variants declared', set(variants)=={'legacyGooglePlay','legacyCafebazaar','legacyMyket','modernGooglePlay','modernCafebazaar','modernMyket'}, ', '.join(variants))
check('trip/logo assets live in common src/main', (BASE/'android/app/src/main/assets/trip-map.html').exists() and (BASE/'android/app/src/main/assets/icons/trip-car-top.png').exists())

# algorithm sanity for shortest angular interpolation
shortest=lambda a,b: ((b-a+540)%360)-180
check('heading wrap 350°→10° uses +20°', shortest(350,10)==20, str(shortest(350,10)))
check('heading wrap 10°→350° uses -20°', shortest(10,350)==-20, str(shortest(10,350)))

# Syntax checks
for rel in ['web/app.js','web/ecu-console.js','web/themes/eps-themes.js']:
    cp=subprocess.run(['node','--check',str(BASE/rel)],capture_output=True,text=True)
    check(f'Node syntax: {rel}', cp.returncode==0, (cp.stderr or cp.stdout).strip())
# Extract inline Android map script
scripts=re.findall(r'<script>(.*?)</script>',trip_html,re.S)
if scripts:
    temp=Path('/tmp/trip-map-v120.js'); temp.write_text('\n'.join(scripts))
    cp=subprocess.run(['node','--check',str(temp)],capture_output=True,text=True)
    check('Node syntax: Android trip-map inline JS',cp.returncode==0,(cp.stderr or cp.stdout).strip())
else:
    check('Node syntax: Android trip-map inline JS',False,'no script found')

failed=[r for r in results if r[0]=='FAIL']
print(f'\nSUMMARY: {len(results)-len(failed)} PASS / {len(failed)} FAIL / {len(results)} total')
if failed:
    for r in failed: print('FAILED',r)
    sys.exit(1)
