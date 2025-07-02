import http.server
import socketserver

PORT = 8888  # Ganti dengan port yang Anda inginkan
DIRECTORY = "C:\aWINI\"  # Ganti dengan path folder yang Anda inginkan

Handler = http.server.SimpleHTTPRequestHandler
Handler.directory = DIRECTORY

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print("Server berjalan di port:", PORT)
    httpd.serve_forever()