from __future__ import annotations
import argparse, http.server, socketserver, webbrowser
from pathlib import Path

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control','no-store')
        self.send_header('X-Content-Type-Options','nosniff')
        self.send_header('Referrer-Policy','no-referrer')
        self.send_header('Permissions-Policy','geolocation=(self)')
        super().end_headers()

def main():
    p=argparse.ArgumentParser();p.add_argument('--host',default='127.0.0.1');p.add_argument('--port',type=int,default=8080);p.add_argument('--no-browser',action='store_true');a=p.parse_args()
    root=Path(__file__).resolve().parent
    class Rooted(Handler):
        def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(root),**kwargs)
    with socketserver.ThreadingTCPServer((a.host,a.port),Rooted) as server:
        url=f'http://{a.host}:{a.port}/index.html';print(f'ECU Pulse Web: {url}')
        if not a.no_browser:webbrowser.open(url)
        try:server.serve_forever()
        except KeyboardInterrupt:pass
if __name__=='__main__':main()
