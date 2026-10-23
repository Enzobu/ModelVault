"""ModelVault Bridge for Windows. Requires Python 3.11+ (standard library only)."""
import json
import os
import pathlib
import re
import subprocess
import sys
import time
import uuid
import shutil
import urllib.parse
import urllib.request
import winreg
import zipfile

APP_DIR = pathlib.Path(os.environ["LOCALAPPDATA"]) / "ModelVaultBridge"
CONFIG_PATH = APP_DIR / "config.json"
ALLOWED_HOSTS = {"modelvault-preprod.enzo-palermo.com", "modelvault.enzo-palermo.com"}
SUPPORTED_EXTENSIONS = {".stl", ".obj", ".3mf"}
MAX_ZIP_BYTES = 1_000_000_000
MAX_UNCOMPRESSED = 1_500_000_000

def detect_cura():
    roots = [pathlib.Path(p) for p in (os.getenv('PROGRAMFILES'), os.getenv('PROGRAMFILES(X86)'), os.getenv('LOCALAPPDATA')) if p]
    for root in roots:
        for pattern in ('UltiMaker Cura*/UltiMaker-Cura.exe', 'Cura*/Cura.exe'):
            for path in sorted(root.glob(pattern), reverse=True):
                if path.is_file():
                    return path
    return None

def install(cura=None):
    exe = pathlib.Path(cura).resolve(strict=True) if cura else detect_cura()
    if exe is not None and exe.suffix.lower() != ".exe":
        raise ValueError("Cura doit être un fichier .exe")
    APP_DIR.mkdir(parents=True, exist_ok=True)
    CONFIG_PATH.write_text(json.dumps({"cura": str(exe) if exe else ""}), encoding="utf-8")
    command = subprocess.list2cmdline(([sys.executable] if getattr(sys, "frozen", False) else [sys.executable, str(pathlib.Path(__file__).resolve())]) + ["%1"])
    with winreg.CreateKey(winreg.HKEY_CURRENT_USER, r"Software\Classes\modelvault") as key:
        winreg.SetValueEx(key, "", 0, winreg.REG_SZ, "URL:ModelVault Protocol")
        winreg.SetValueEx(key, "URL Protocol", 0, winreg.REG_SZ, "")
    with winreg.CreateKey(winreg.HKEY_CURRENT_USER, r"Software\Classes\modelvault\shell\open\command") as key:
        winreg.SetValueEx(key, "", 0, winreg.REG_SZ, command)
    print("ModelVault Bridge installé pour l'utilisateur actuel.")

def uninstall():
    for path in [r"Software\Classes\modelvault\shell\open\command",
                 r"Software\Classes\modelvault\shell\open",
                 r"Software\Classes\modelvault\shell",
                 r"Software\Classes\modelvault"]:
        try:
            winreg.DeleteKey(winreg.HKEY_CURRENT_USER, path)
        except FileNotFoundError:
            pass
    print("Protocole ModelVault désinstallé.")

def open_model(uri):
    parsed = urllib.parse.urlsplit(uri)
    if parsed.scheme != "modelvault" or parsed.netloc != "open":
        raise ValueError("Lien ModelVault invalide")
    params = urllib.parse.parse_qs(parsed.query)
    base = params.get("base", [""])[0]
    token = params.get("token", [""])[0]
    origin = urllib.parse.urlsplit(base)
    if (origin.scheme != "https" or origin.hostname not in ALLOWED_HOSTS
            or origin.username or origin.password or origin.port not in (None, 443)
            or origin.path not in ("", "/") or origin.query or origin.fragment
            or not re.fullmatch(r"[A-Za-z0-9_-]{43}", token)):
        raise ValueError("Origine ou ticket de transfert non autorisé")
    cura_value = json.loads(CONFIG_PATH.read_text(encoding="utf-8")).get("cura", "")
    cura = pathlib.Path(cura_value) if cura_value else detect_cura()
    if cura is None or not cura.is_file():
        raise FileNotFoundError("Chemin Cura invalide : réinstallez le Bridge")
    url = "https://" + origin.hostname + "/api/bridge/download?token=" + urllib.parse.quote(token)
    storage = APP_DIR / "models"
    storage.mkdir(parents=True, exist_ok=True)
    for old in storage.iterdir():
        if old.is_dir() and old.stat().st_mtime < time.time() - 7 * 86400:
            shutil.rmtree(old, ignore_errors=True)
    target = storage / uuid.uuid4().hex
    target.mkdir(mode=0o700)
    zip_path = target / "parts.zip"
    request = urllib.request.Request(url, headers={"User-Agent": "ModelVaultBridge/1"})
    with urllib.request.urlopen(request, timeout=120) as response, zip_path.open("wb") as output:
        written = 0
        while chunk := response.read(1024 * 1024):
            written += len(chunk)
            if written > MAX_ZIP_BYTES:
                raise ValueError("Archive trop volumineuse")
            output.write(chunk)
    parts_dir = target / "parts"
    parts_dir.mkdir()
    files = []
    with zipfile.ZipFile(zip_path) as archive:
        total_size = 0
        for idx, member in enumerate(archive.infolist()):
            if member.is_dir():
                continue
            total_size += member.file_size
            if idx >= 500 or total_size > MAX_UNCOMPRESSED:
                raise ValueError("Archive trop volumineuse")
            filename = pathlib.PurePosixPath(member.filename)
            if (len(filename.parts) != 1 or filename.name in ("", ".", "..")
                    or filename.suffix.lower() not in SUPPORTED_EXTENSIONS):
                raise ValueError("Nom de fichier non autorisé dans l'archive")
            path = parts_dir / (str(idx) + "_" + filename.name)
            with archive.open(member) as source, path.open("wb") as destination:
                import shutil
                shutil.copyfileobj(source, destination)
            files.append(str(path))
    if not files:
        raise ValueError("Aucune pièce compatible dans le modèle")
    process = subprocess.Popen([str(cura), *files])
    # Cura may load the files asynchronously; wait briefly before the temporary directory disappears.
    # Files remain in the cache while Cura loads them.
    if process.poll() not in (None, 0):
        raise RuntimeError("Cura n'a pas démarré correctement")
    print("Fichiers envoyés à Cura.")

def main():
    try:
        if len(sys.argv) >= 2 and sys.argv[1] == "install":
            install(sys.argv[2] if len(sys.argv) == 3 else None)
        elif len(sys.argv) == 2 and sys.argv[1] == "uninstall":
            uninstall()
        elif len(sys.argv) == 2:
            open_model(sys.argv[1])
        else:
            print("Usage : python modelvault_bridge.py install \"C:\\...\\UltiMaker-Cura.exe\" | uninstall")
            return 2
        return 0
    except Exception as exc:
        print("Erreur ModelVault Bridge :", str(exc), file=sys.stderr)
        return 1

if __name__ == "__main__":
    sys.exit(main())
