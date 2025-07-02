import http.server
import socketserver
import os

PORT = 80  # Change to your desired port
DIRECTORY = "C:\\aWINI\\"  # Change to your desired directory

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.path = 'index.html'  # Redirect root URL to index.html
        return super().do_GET()  # Call the parent class's do_GET method

Handler = CustomHTTPRequestHandler
os.chdir(DIRECTORY)  # Change the current working directory to serve files from it

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print("Server running on port:", PORT)
    httpd.serve_forever()
