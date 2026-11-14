#!/usr/bin/env python3
"""MenuXpeng - lanceur de liens pour le navigateur de la XPeng G6.

Serveur sans dépendance (stdlib) :
  GET  /                 l'interface (public/)
  GET  /api/data         catégories + liens (data/menu.json)
  PUT  /api/data         enregistre (en-tête X-Pin si MENU_PIN est défini)
  GET  /api/meta?url=    titre + meilleure icône du site, mise en cache dans data/icons/
  GET  /icons/<fichier>  icônes en cache

Variables : MENU_PORT (8420), MENU_HOST (0.0.0.0), MENU_PIN (vide = pas de code),
MENU_DATA (dossier des données, ./data par défaut ; /data dans le conteneur).
"""
import hashlib
import json
import os
import re
import ssl
import struct
import threading
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
PUBLIC = os.path.join(ROOT, "public")
DATA = os.environ.get("MENU_DATA", os.path.join(ROOT, "data"))
ICONS = os.path.join(DATA, "icons")
MENU_FILE = os.path.join(DATA, "menu.json")
SEED_FILE = os.path.join(ROOT, "seed.json")
PIN = os.environ.get("MENU_PIN", "")
UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/130.0 Safari/537.36")
LOCK = threading.Lock()
try:
    os.makedirs(ICONS, exist_ok=True)
except PermissionError:
    raise SystemExit(f"Impossible d'écrire dans {DATA} : donnez ce dossier à l'utilisateur {os.getuid()} "
                     f"(chown -R {os.getuid()}:{os.getgid()} <dossier monté>)")


def fetch(url, limit=2_000_000, timeout=8):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "fr-FR,fr;q=0.9"})
    ctx = ssl.create_default_context()
    with urllib.request.urlopen(req, timeout=timeout, context=ctx) as r:
        return r.geturl(), r.headers.get("Content-Type", ""), r.read(limit)


class HeadParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.icons, self.title, self.og_title, self.manifest = [], "", "", None
        self._in_title = False

    def handle_starttag(self, tag, attrs):
        a = {k.lower(): (v or "") for k, v in attrs}
        if tag == "link":
            rel = a.get("rel", "").lower()
            href = a.get("href")
            if not href:
                return
            if "manifest" in rel:
                self.manifest = href
            elif "icon" in rel:  # icon, shortcut icon, apple-touch-icon, mask-icon
                size = 0
                m = re.search(r"(\d+)x\d+", a.get("sizes", ""))
                if m:
                    size = int(m.group(1))
                elif "apple-touch-icon" in rel:
                    size = 180
                elif "mask-icon" in rel:
                    return  # monochrome, peu lisible
                elif href.lower().endswith(".svg") or "svg" in a.get("type", ""):
                    size = 300
                self.icons.append((size, href))
        elif tag == "meta" and a.get("property", "").lower() == "og:site_name":
            self.og_title = a.get("content", "")
        elif tag == "title":
            self._in_title = True

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False

    def handle_data(self, data):
        if self._in_title and not self.title:
            self.title = data.strip()


def image_size(blob):
    """Largeur approximative d'une image (png, ico, jpeg) pour classer les icônes."""
    if blob[:8] == b"\x89PNG\r\n\x1a\n" and len(blob) > 24:
        return struct.unpack(">I", blob[16:20])[0]
    if blob[:4] == b"\x00\x00\x01\x00" and len(blob) > 6:
        n = struct.unpack("<H", blob[4:6])[0]
        ws = [blob[6 + 16 * i] or 256 for i in range(min(n, 20)) if 6 + 16 * i < len(blob)]
        return max(ws or [0])
    if b"<svg" in blob[:2000]:
        return 300
    if blob[:2] == b"\xff\xd8":
        return 128
    if blob[:4] == b"RIFF" and blob[8:12] == b"WEBP":
        return 128
    return 0


def ext_for(blob, ctype):
    if blob[:8] == b"\x89PNG\r\n\x1a\n":
        return "png"
    if b"<svg" in blob[:2000]:
        return "svg"
    if blob[:2] == b"\xff\xd8":
        return "jpg"
    if blob[:4] == b"RIFF":
        return "webp"
    if blob[:4] == b"\x00\x00\x01\x00":
        return "ico"
    return None


def norm(t):
    return re.sub(r"[^a-z0-9]", "", (t or "").lower().replace("+", "plus"))


def appstore_icons(term, limit=6):
    """Icônes 512 px des applications App Store correspondant au nom (bonne qualité pour un écran de voiture)."""
    if not term:
        return []
    q = urllib.parse.urlencode({"term": term, "entity": "software", "country": "fr", "limit": limit})
    try:
        _, _, body = fetch("https://itunes.apple.com/search?" + q, 1_000_000, 6)
        res = json.loads(body).get("results", [])
    except Exception:
        return []
    return [{"name": r.get("trackName", ""), "src": r.get("artworkUrl512") or r.get("artworkUrl100")}
            for r in res if r.get("artworkUrl512") or r.get("artworkUrl100")]


def save_icon(host, blob, ext, tag=""):
    name = hashlib.sha1((host + tag).encode()).hexdigest()[:16] + "." + ext
    with open(os.path.join(ICONS, name), "wb") as f:
        f.write(blob)
    return "/icons/" + name


def icon_from(src, host):
    _, ctype, blob = fetch(src, 3_000_000, 8)
    ext = ext_for(blob, ctype)
    if not ext:
        raise ValueError("ce n'est pas une image")
    return {"icon": save_icon(host, blob, ext, src), "iconSize": image_size(blob)}


def site_meta(url):
    if not re.match(r"^https?://", url, re.I):
        url = "https://" + url
    host = urllib.parse.urlparse(url).hostname or ""
    if not host:
        raise ValueError("adresse invalide")
    title, candidates = "", []
    try:
        final, _, body = fetch(url)
        p = HeadParser()
        p.feed(body.decode("utf-8", "ignore"))
        title = p.og_title or p.title
        candidates += [(s, urllib.parse.urljoin(final, h)) for s, h in p.icons]
        if p.manifest:
            try:
                _, _, mbody = fetch(urllib.parse.urljoin(final, p.manifest), 300_000)
                man = json.loads(mbody)
                title = title or man.get("short_name") or man.get("name", "")
                for ic in man.get("icons", []):
                    m = re.search(r"(\d+)x\d+", ic.get("sizes", ""))
                    if ic.get("src") and "monochrome" not in ic.get("purpose", ""):
                        candidates.append((int(m.group(1)) if m else 0,
                                           urllib.parse.urljoin(urllib.parse.urljoin(final, p.manifest), ic["src"])))
            except Exception:
                pass
    except Exception:
        pass
    origin = f"https://{host}"
    candidates += [(180, origin + "/apple-touch-icon.png"), (32, origin + "/favicon.ico")]
    # services publics en dernier recours
    candidates.append((256, f"https://www.google.com/s2/favicons?domain={host}&sz=256"))
    candidates.append((64, f"https://icons.duckduckgo.com/ip3/{host}.ico"))

    best = None  # (taille réelle, blob, ext)
    seen = set()
    for _, src in sorted(candidates, key=lambda c: -c[0]):
        if src in seen:
            continue
        seen.add(src)
        try:
            _, ctype, blob = fetch(src, 1_500_000, 6)
        except Exception:
            continue
        ext = ext_for(blob, ctype)
        if not ext:
            continue
        size = image_size(blob)
        # l'icône par défaut "globe" de Google fait ~ 16 px : on l'ignore
        if "google.com/s2" in src and size < 48:
            continue
        if not best or size > best[0]:
            best = (size, blob, ext)
        if size >= 180:
            break
    clean = re.split(r"\s+[|\-–—:·]\s+", title or "")[0].strip()[:40]
    brand = host.removeprefix("www.").split(".")[0]
    if not clean:
        clean = brand.capitalize()
    icon, size = None, 0
    if best:
        icon, size = save_icon(host, best[1], best[2]), best[0]
    # logo du site trop petit (< 128 px) : icône de l'appli App Store si son nom correspond au site
    alts = appstore_icons(brand)
    if size < 128:
        for a in alts:
            n = norm(a["name"])
            if norm(brand) and (n.startswith(norm(brand)) or norm(brand) in n[:len(norm(brand)) + 4]):
                try:
                    r = icon_from(a["src"], host)
                    icon, size = r["icon"], r["iconSize"]
                    break
                except Exception:
                    pass
    return {"url": url, "title": clean, "icon": icon, "iconSize": size, "alternatives": alts}


def load_menu():
    path = MENU_FILE if os.path.exists(MENU_FILE) else SEED_FILE
    with open(path, encoding="utf-8") as f:
        return json.load(f)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=PUBLIC, **kw)

    def log_message(self, fmt, *args):
        pass

    def send_json(self, obj, code=200):
        body = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        u = urllib.parse.urlparse(self.path)
        if u.path == "/healthz":
            return self.send_json({"ok": True})
        if u.path == "/api/data":
            return self.send_json({**load_menu(), "pinRequired": bool(PIN)})
        if u.path == "/api/meta":
            q = urllib.parse.parse_qs(u.query).get("url", [""])[0].strip()
            try:
                return self.send_json(site_meta(q))
            except Exception as e:
                return self.send_json({"error": str(e)}, 400)
        if u.path == "/api/icon-from":
            qs = urllib.parse.parse_qs(u.query)
            src, page = qs.get("src", [""])[0], qs.get("url", [""])[0]
            try:
                if not re.match(r"^https?://", src, re.I):
                    raise ValueError("adresse d'image invalide")
                host = urllib.parse.urlparse(page if "://" in page else "https://" + page).hostname or "x"
                return self.send_json(icon_from(src, host))
            except Exception as e:
                return self.send_json({"error": str(e)}, 400)
        if u.path == "/api/search-icons":
            q = urllib.parse.parse_qs(u.query).get("q", [""])[0]
            return self.send_json({"alternatives": appstore_icons(q, 12)})
        if u.path.startswith("/icons/"):
            name = os.path.basename(u.path)
            path = os.path.join(ICONS, name)
            if not os.path.isfile(path):
                self.send_error(404)
                return
            types = {"png": "image/png", "svg": "image/svg+xml", "jpg": "image/jpeg",
                     "webp": "image/webp", "ico": "image/x-icon"}
            with open(path, "rb") as f:
                blob = f.read()
            self.send_response(200)
            self.send_header("Content-Type", types.get(name.rsplit(".", 1)[-1], "application/octet-stream"))
            self.send_header("Cache-Control", "public, max-age=604800")
            self.send_header("Content-Length", str(len(blob)))
            self.end_headers()
            self.wfile.write(blob)
            return
        return super().do_GET()

    def do_PUT(self):
        if urllib.parse.urlparse(self.path).path != "/api/data":
            return self.send_error(404)
        if PIN and self.headers.get("X-Pin", "") != PIN:
            return self.send_json({"error": "code incorrect"}, 403)
        try:
            n = int(self.headers.get("Content-Length", 0))
            data = json.loads(self.rfile.read(min(n, 2_000_000)))
            assert isinstance(data.get("categories"), list)
        except Exception:
            return self.send_json({"error": "données invalides"}, 400)
        data.pop("pinRequired", None)
        with LOCK:
            tmp = MENU_FILE + ".tmp"
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=1)
            os.replace(tmp, MENU_FILE)
        return self.send_json({"ok": True})


if __name__ == "__main__":
    host = os.environ.get("MENU_HOST", "0.0.0.0")
    port = int(os.environ.get("MENU_PORT", "8420"))
    print(f"MenuXpeng sur http://{host}:{port}")
    ThreadingHTTPServer((host, port), Handler).serve_forever()
