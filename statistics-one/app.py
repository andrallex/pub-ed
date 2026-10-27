from flask import Flask, render_template, send_file, jsonify, abort
import json
import os
from pathlib import Path
from urllib.parse import unquote

BASE_DIR = Path(__file__).resolve().parent
CONTENT_FILE = BASE_DIR / "content.json"
SOURCE_DIR = Path(r"E:\Statistics One")

app = Flask(__name__, template_folder=str(BASE_DIR), static_folder=None)

_file_index = {"exact": {}, "lower": {}}


def build_file_index():
    _file_index["exact"].clear()
    _file_index["lower"].clear()
    if not SOURCE_DIR.exists():
        return
    for root, _dirs, files in os.walk(SOURCE_DIR):
        for name in files:
            full = os.path.join(root, name)
            _file_index["exact"].setdefault(name, full)
            _file_index["lower"].setdefault(name.lower(), full)


def resolve_file(route_value):
    name = os.path.basename(unquote(route_value or ""))
    if not name:
        return None
    if not _file_index["exact"]:
        build_file_index()
    path = _file_index["exact"].get(name) or _file_index["lower"].get(name.lower())
    if path and os.path.isfile(path):
        return path
    build_file_index()
    path = _file_index["exact"].get(name) or _file_index["lower"].get(name.lower())
    if path and os.path.isfile(path):
        return path
    return None


def load_content():
    with open(CONTENT_FILE, "r", encoding="utf-8") as fh:
        return json.load(fh)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/content")
def api_content():
    return jsonify(load_content())


@app.route("/style.css")
def stylesheet():
    return send_file(BASE_DIR / "style.css", mimetype="text/css", conditional=True)


@app.route("/script.js")
def script():
    return send_file(BASE_DIR / "script.js", mimetype="text/javascript", conditional=True)


@app.route("/media/<path:filename>")
def media(filename):
    path = resolve_file(filename)
    if not path:
        abort(404)
    return send_file(path, conditional=True, etag=True)


@app.route("/download/<path:filename>")
def download(filename):
    path = resolve_file(filename)
    if not path:
        abort(404)
    return send_file(path, as_attachment=True, download_name=os.path.basename(path))


@app.errorhandler(404)
def not_found(_error):
    return render_template("index.html"), 404


if __name__ == "__main__":
    build_file_index()
    app.run(debug=True, host="127.0.0.1", port=5000)
