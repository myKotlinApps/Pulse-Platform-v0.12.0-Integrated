from __future__ import annotations
import subprocess, sys, time, webbrowser, signal
from pathlib import Path
ROOT=Path(__file__).resolve().parent
processes=[]
def start(cmd,cwd):
    p=subprocess.Popen(cmd,cwd=cwd)
    processes.append(p);return p
try:
    node=start(['node','dev-server.js'],ROOT/'server')
    time.sleep(0.8)
    web=start([sys.executable,'server.py','--no-browser'],ROOT/'web')
    time.sleep(0.8)
    webbrowser.open('http://127.0.0.1:8080/index.html')
    print('ECU Pulse Web: http://127.0.0.1:8080/index.html')
    print('Analysis API:  http://127.0.0.1:4030')
    print('Admin panel:   http://127.0.0.1:4030/admin/')
    print('Development Pro auth is enabled only by this launcher. Press Ctrl+C to stop.')
    while all(p.poll() is None for p in processes): time.sleep(0.5)
except KeyboardInterrupt: pass
finally:
    for p in reversed(processes):
        if p.poll() is None: p.terminate()
    for p in reversed(processes):
        try:p.wait(timeout=3)
        except: p.kill()
