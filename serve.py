#!/usr/bin/env python3
"""
TerraFlow Local HTTP Development Server
Runs a lightweight web server on http://localhost:8080 and opens your browser.
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8080

def run_server():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    Handler = http.server.SimpleHTTPRequestHandler
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        url = f"http://localhost:{PORT}/index.html"
        print("=" * 60)
        print("  🏔️  TerraFlow Himalayan 3D Subsurface Platform")
        print(f"  Server running at: {url}")
        print("  Press Ctrl+C to stop the server")
        print("=" * 60)
        
        try:
            webbrowser.open(url)
        except Exception:
            pass
            
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")
            httpd.server_close()

if __name__ == '__main__':
    run_server()
