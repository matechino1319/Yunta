"""
GestorAlquileres — servidor local (sin dependencias externas)
Ejecutar: python server.py
Abrir:    http://localhost:666
"""
from http.server import HTTPServer, SimpleHTTPRequestHandler
import json, os, webbrowser
from threading import Timer

DATA_FILE = 'data.json'
PORT = 666


def read_data():
    if not os.path.exists(DATA_FILE):
        return {'TIENDAS': [], 'PAGOS': {}, 'IPC_DATA': []}
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


def write_data(data):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


class Handler(SimpleHTTPRequestHandler):

    def do_GET(self):
        if self.path == '/api/data':
            body = json.dumps(read_data(), ensure_ascii=False).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == '/api/data':
            length = int(self.headers.get('Content-Length', 0))
            raw = self.rfile.read(length)
            data = json.loads(raw)
            write_data(data)
            resp = json.dumps({'ok': True}).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(resp)))
            self.end_headers()
            self.wfile.write(resp)
        else:
            self.send_response(404)
            self.end_headers()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()


def open_browser():
    webbrowser.open(f'http://localhost:{PORT}')


if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    server = HTTPServer(('', PORT), Handler)
    print(f'\n[Servidor] GestorAlquileres corriendo en http://localhost:{PORT}\n')
    Timer(1, open_browser).start()
    server.serve_forever()

