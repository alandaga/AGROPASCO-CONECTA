#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
AGROPASCO-CONECTA - SERVIDOR MULTIUSUARIO CON API REST Y SINCRONIZACIÓN EN VIVO
Proyecto Oficial - Concurso Escolar Nacional "Crea y Emprende 2026"
Área Curricular: Educación para el Trabajo (EPT) - Computación e Informática
==============================================================================
Archivo: server.py
Propósito:
  1. Servir los archivos estáticos de la aplicación web (HTML, CSS, JS, imágenes).
  2. Proveer una API REST centralizada (/api/products) para almacenar y compartir
     todas las cosechas publicadas por los agricultores en products.json.
  3. Sincronizar en tiempo real los datos entre todos los dispositivos (computadoras,
     celulares y tablets) conectados a la misma red local o Wi-Fi escolar.
==============================================================================
"""

import http.server
import socketserver
import json
import os
import urllib.parse
import socket
import sys

PORT = 8000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PRODUCTS_FILE = os.path.join(BASE_DIR, "products.json")

def get_local_ip():
    """Detecta la dirección IP local de la computadora en la red Wi-Fi o Ethernet."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def load_products():
    """Carga los productos compartidos desde products.json de manera segura."""
    if not os.path.exists(PRODUCTS_FILE):
        return []
    try:
        with open(PRODUCTS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
    except Exception as e:
        print(f"[ERROR] Error al leer {PRODUCTS_FILE}: {e}")
    return []

def save_products(products_list):
    """Guarda los productos en products.json de forma atómica."""
    try:
        temp_file = PRODUCTS_FILE + ".tmp"
        with open(temp_file, "w", encoding="utf-8") as f:
            json.dump(products_list, f, ensure_ascii=False, indent=2)
        if os.path.exists(PRODUCTS_FILE):
            os.replace(temp_file, PRODUCTS_FILE)
        else:
            os.rename(temp_file, PRODUCTS_FILE)
        return True
    except Exception as e:
        print(f"[ERROR] Error al guardar {PRODUCTS_FILE}: {e}")
        return False

class AgroPascoRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Manejador HTTP con soporte para archivos estáticos y API REST."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def end_headers(self):
        # Cabeceras CORS para permitir peticiones desde cualquier dispositivo
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Accept")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

    def do_OPTIONS(self):
        """Maneja pre-flight requests de CORS."""
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # Endpoint: Obtener todos los productos compartidos
        if path == "/api/products":
            products = load_products()
            payload = json.dumps(products, ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return

        # Endpoint: Estado y salud del servidor
        if path == "/api/health":
            products = load_products()
            info = {
                "status": "online",
                "app": "AgroPasco-Conecta",
                "edition": "Crea y Emprende 2026",
                "products_count": len(products),
                "server_ip": get_local_ip(),
                "port": PORT
            }
            payload = json.dumps(info, ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return

        # Servir archivos estáticos normales (index.html, app.js, etc.)
        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # Endpoint: Registrar una nueva cosecha desde cualquier dispositivo
        if path == "/api/products":
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                if content_length <= 0:
                    self.send_error(400, "Cuerpo de solicitud vacío")
                    return

                raw_body = self.rfile.read(content_length).decode("utf-8")
                new_product = json.loads(raw_body)

                # Validaciones mínimas
                name = str(new_product.get("name", "")).strip()
                producer = str(new_product.get("producer", "")).strip()
                location = str(new_product.get("location", "")).strip()
                price = float(new_product.get("price", 0))

                if not name or not producer or price <= 0:
                    self.send_error(400, "Datos del producto incompletos o inválidos")
                    return

                # Normalizar objeto
                product_record = {
                    "id": new_product.get("id") or f"PROD-SERVER-{int(os.times()[4] * 1000)}",
                    "name": name,
                    "category": (new_product.get("category") or "tuberculos").lower().strip(),
                    "producer": producer,
                    "location": location or "Región Pasco, Perú",
                    "price": round(price, 2),
                    "unit": new_product.get("unit") or "kg",
                    "image": new_product.get("image") or "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80",
                    "phone": new_product.get("phone") or "51963123456",
                    "badge": new_product.get("badge") or "Cosecha del Día",
                    "description": new_product.get("description") or f"Cosecha fresca producida en {location} por {producer}.",
                    "isLocalUpload": True,
                    "createdAt": new_product.get("createdAt") or int(os.times()[4] * 1000)
                }

                current_products = load_products()
                # Insertar al inicio de la lista para que sea el primer producto
                current_products.insert(0, product_record)
                save_products(current_products)

                print(f"[INFO] Nueva cosecha registrada por '{producer}': '{name}' (Total: {len(current_products)})")

                resp = json.dumps({"success": True, "product": product_record, "total": len(current_products)}, ensure_ascii=False).encode("utf-8")
                self.send_response(201)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(resp)))
                self.end_headers()
                self.wfile.write(resp)
                return

            except Exception as e:
                print(f"[ERROR] Error al procesar POST /api/products: {e}")
                self.send_error(500, f"Error interno del servidor: {e}")
                return

        self.send_error(404, "Endpoint no encontrado")

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # Endpoint: Eliminar una cosecha por ID
        if path == "/api/products":
            query = urllib.parse.parse_qs(parsed.query)
            product_id = query.get("id", [None])[0]

            # Si no vino en query params, intentar leer el cuerpo
            if not product_id:
                try:
                    content_length = int(self.headers.get("Content-Length", 0))
                    if content_length > 0:
                        raw_body = self.rfile.read(content_length).decode("utf-8")
                        body_json = json.loads(raw_body)
                        product_id = body_json.get("id")
                except Exception:
                    pass

            if not product_id:
                self.send_error(400, "Parámetro 'id' requerido para eliminar")
                return

            current_products = load_products()
            original_len = len(current_products)
            updated = [p for p in current_products if str(p.get("id")) != str(product_id)]

            if len(updated) < original_len:
                save_products(updated)
                print(f"[INFO] Cosecha eliminada ID '{product_id}'. Total restante: {len(updated)}")
                resp = json.dumps({"success": True, "deletedId": product_id, "remaining": len(updated)}).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(resp)))
                self.end_headers()
                self.wfile.write(resp)
            else:
                resp = json.dumps({"success": False, "message": "Producto no encontrado"}).encode("utf-8")
                self.send_response(404)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(resp)))
                self.end_headers()
                self.wfile.write(resp)
            return

        self.send_error(404, "Endpoint no encontrado")


class ReusableThreadingServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True

def run():
    # Inicializar archivo de productos si no existe
    if not os.path.exists(PRODUCTS_FILE):
        save_products([])

    local_ip = get_local_ip()

    print("=" * 72)
    print("  AGROPASCO-CONECTA - SERVIDOR MULTIUSUARIO EN TIEMPO REAL")
    print("  Concurso Escolar Nacional 'Crea y Emprende 2026' - EPT")
    print("  I.E. Gerardo Patiño López (Batallón 39 - Cerro de Pasco)")
    print("=" * 72)
    print(f"  [+] Servidor local activo en:      http://localhost:{PORT}")
    print(f"  [+] Para celulares y otros equipos: http://{local_ip}:{PORT}")
    print(f"  [+] API REST compartida:          http://{local_ip}:{PORT}/api/products")
    print(f"  [+] Base de datos centralizada:   {PRODUCTS_FILE}")
    print("=" * 72)
    print("  Presiona Ctrl+C en cualquier momento para detener el servidor.")
    print("=" * 72)
    sys.stdout.flush()

    server_address = ("0.0.0.0", PORT)
    with ReusableThreadingServer(server_address, AgroPascoRequestHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[INFO] Servidor detenido de forma segura.")

if __name__ == "__main__":
    run()
