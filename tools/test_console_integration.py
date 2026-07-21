from __future__ import annotations
import json, re, subprocess, sys, tempfile, textwrap
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]

def check_node(path: Path) -> None:
    subprocess.run(['node', '--check', str(path)], check=True)

def main() -> int:
    for path in ROOT.rglob('*.json'):
        json.loads(path.read_text(encoding='utf-8'))
    for path in (ROOT / 'android/app/src/main/res').rglob('*.xml'):
        ET.parse(path)
    ET.parse(ROOT / 'android/app/src/main/AndroidManifest.xml')

    check_node(ROOT / 'web/app.js')
    check_node(ROOT / 'web/ecu-console.js')
    check_node(ROOT / 'server/server.js')

    html = (ROOT / 'web/index.html').read_text(encoding='utf-8')
    js = (ROOT / 'web/ecu-console.js').read_text(encoding='utf-8')
    html_ids = set(re.findall(r'id="([A-Za-z0-9_-]+)"', html))
    js_ids = set(re.findall(r"\$\('#([A-Za-z0-9_-]+)'\)", js))
    missing = sorted(js_ids - html_ids)
    assert not missing, f'Missing Web IDs: {missing}'

    activity = (ROOT / 'android/app/src/main/java/com/ecupulse/app/MainActivity.kt').read_text(encoding='utf-8')
    scanner_xml = (ROOT / 'android/app/src/main/res/layout/screen_scanner.xml').read_text(encoding='utf-8')
    refs = set(re.findall(r'binding\.scannerScreen\.([A-Za-z0-9_]+)', activity))
    xml_ids = set(re.findall(r'android:id="@\+id/([A-Za-z0-9_]+)"', scanner_xml))
    missing = sorted(refs - xml_ids - {'root'})
    assert not missing, f'Missing Android scanner IDs: {missing}'

    profiles = json.loads((ROOT / 'shared/data/elm327-protocol-profiles.json').read_text(encoding='utf-8'))
    assert profiles['count'] == 49 == len(profiles['profiles'])
    assert 'data-page="trips"' in html and 'id="leafletMap"' in html
    assert (ROOT / 'android/app/src/main/assets/trip-map.html').exists()

    for source in (ROOT / 'android/app/src/main/java').rglob('*.kt'):
        text = source.read_text(encoding='utf-8')
        assert text.count('{') == text.count('}'), f'Brace mismatch: {source}'

    subprocess.run([sys.executable, str(ROOT / 'tools/check_parity.py')], check=True)
    print('ECU Console integration checks passed.')
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
