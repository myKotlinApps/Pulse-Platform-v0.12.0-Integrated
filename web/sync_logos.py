#!/usr/bin/env python3
"""Download configured brand SVGs into assets/logos. Fallback badges remain when unavailable."""
from __future__ import annotations
import json, urllib.request, concurrent.futures
from pathlib import Path
ROOT=Path(__file__).resolve().parent
manifest=json.loads((ROOT/'data/brand-logos.json').read_text(encoding='utf-8'))

def fetch(brand):
    url=brand.get('url')
    dest=ROOT/brand['file']
    if dest.exists(): return brand['key'], 'bundled' if brand.get('local') else 'already-downloaded'
    if not url: return brand['key'], 'fallback'
    req=urllib.request.Request(url, headers={'User-Agent':'ECU-Pulse/0.5 (+local-development)'})
    try:
        with urllib.request.urlopen(req, timeout=6) as response:
            raw=response.read(200_000)
        if b'<svg' not in raw[:2000].lower(): return brand['key'], 'not-svg'
        dest.write_bytes(raw)
        return brand['key'], 'downloaded'
    except Exception as exc:
        return brand['key'], f'fallback ({exc.__class__.__name__})'

def main():
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        for key,status in pool.map(fetch, manifest['brands']): print(f'{key}: {status}')
if __name__=='__main__': main()
