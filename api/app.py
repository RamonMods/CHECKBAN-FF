# -*- coding: utf-8 -*-
"""API HTTP do CheckBan (Flask) — serve o endpoint público usado pelo site."""

from __future__ import annotations

import os
import re
import sys
import time
from pathlib import Path

from flask import Flask, jsonify, request

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from core.checkban import CheckBanError, checkban  # noqa: E402

app = Flask(__name__)

ALLOWED_ORIGINS = {
    "https://ramonmods.onrender.com",
    "https://ramonmods.github.io",
}
LOCAL_ORIGIN = re.compile(r"^http://(?:localhost|127\.0\.0\.1)(?::\d+)?$")

# cache simples: uid -> (expira_em, resultado)
_CACHE: dict[str, tuple[float, dict]] = {}
_CACHE_TTL = 300  # 5 minutos

# limite simples por IP: 20 consultas por minuto
_HITS: dict[str, list[float]] = {}
_LIMIT = 20
_WINDOW = 60


def _client_ip() -> str:
    forwarded = request.headers.get("X-Forwarded-For", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.remote_addr or "?"


def _rate_limited(ip: str) -> bool:
    now = time.time()
    marcas = [t for t in _HITS.get(ip, []) if now - t < _WINDOW]
    marcas.append(now)
    _HITS[ip] = marcas
    return len(marcas) > _LIMIT


def _origin_allowed(origin: str) -> bool:
    return (
        origin in ALLOWED_ORIGINS
        or origin.endswith(".onrender.com")
        or bool(LOCAL_ORIGIN.match(origin))
        or origin == "null"
    )


@app.after_request
def _cors(resp):
    origin = request.headers.get("Origin", "")
    if origin and _origin_allowed(origin):
        resp.headers["Access-Control-Allow-Origin"] = origin
        resp.headers["Vary"] = "Origin"
    resp.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
    resp.headers["Cache-Control"] = "no-store"
    return resp


@app.get("/")
def home():
    return jsonify({
        "servico": "CheckBan API",
        "status": "online",
    })


@app.get("/checkban")
def handle_checkban():
    uid = (request.args.get("uid") or "").strip()

    if not uid:
        return jsonify({"error": "Parâmetro 'uid' é obrigatório."}), 400
    if not uid.isdigit() or not (6 <= len(uid) <= 12):
        return jsonify({"error": "UID inválido: use de 6 a 12 dígitos."}), 400

    if _rate_limited(_client_ip()):
        return jsonify({"error": "Muitas consultas. Tente em um minuto."}), 429

    agora = time.time()
    cached = _CACHE.get(uid)
    if cached and cached[0] > agora:
        return jsonify({**cached[1], "cached": True})

    try:
        resultado = checkban(uid)
    except CheckBanError as exc:
        return jsonify({"error": str(exc)}), 404

    _CACHE[uid] = (agora + _CACHE_TTL, resultado)
    return jsonify(resultado)


@app.errorhandler(404)
def _404(_):
    return jsonify({"error": "não encontrado"}), 404


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "5000")), debug=False)
