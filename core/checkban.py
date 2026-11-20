# -*- coding: utf-8 -*-
"""CheckBan — verifica se um jogador de Free Fire está banido.

Fonte do status: endpoint público usado pela própria página de suporte da
Garena (``ff.garena.com/api/antihack/check_banned``). Não usa login, token,
conta ou credencial de terceiro — só o UID.

O campo ``period`` da Garena é um código, não uma quantidade de meses:

    1 = 1 semana
    2 = 1 mês
    3 = 3 meses
    4 = 6 meses
    5 = 1 ano
    6 = banimento permanente

    from core.checkban import checkban
    r = checkban("123456789")
    if r["banned"]:
        print(r["period_label"])

CLI:
    python core/checkban.py 123456789
"""

from __future__ import annotations

import sys
import time
from typing import Any

import requests

GARENA_BAN_URL = "https://ff.garena.com/api/antihack/check_banned"
SHOP2GAME_URL = "https://shop2game.com/api/auth/player_id_login"

GARENA_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
    ),
    "Accept": "application/json, text/plain, */*",
    "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
    "referer": "https://ff.garena.com/en/support/",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    # token exigido pelo endpoint; é o mesmo valor público da página de suporte
    "x-requested-with": "B6FksShzIgjfrYImLpTsadjS86sddhFH",
}

SHOP2GAME_HEADERS = {
    "Accept-Language": "en-US,en;q=0.9",
    "Connection": "keep-alive",
    "Origin": "https://shop2game.com",
    "Referer": "https://shop2game.com/app/100067/idlogin",
    "User-Agent": (
        "Mozilla/5.0 (Linux; Android 11; Redmi Note 8) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/107.0.0.0 Mobile Safari/537.36"
    ),
    "accept": "application/json",
    "content-type": "application/json",
}

SHOP2GAME_COOKIES = {
    "source": "mb",
    "region": "MA",
    "language": "ar",
    "session_key": "efwfzwesi9ui8drux4pmqix4cosane0y",
}

# códigos de duração usados pela página de suporte da Garena
PERIOD_LABELS = {
    1: "1 semana",
    2: "1 mês",
    3: "3 meses",
    4: "6 meses",
    5: "1 ano",
    6: "permanente",
}


class CheckBanError(Exception):
    """UID inválido, conta inexistente ou falha de rede/API."""


def _parse_uid(uid: str) -> str:
    uid = str(uid).strip()
    if not uid.isdigit() or not (6 <= len(uid) <= 12):
        raise CheckBanError("UID inválido: use de 6 a 12 dígitos.")
    return uid


def _get(session: requests.Session, url: str, *, params: dict, headers: dict,
         timeout: float, retries: int) -> requests.Response:
    last: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            resp = session.get(url, params=params, headers=headers, timeout=timeout)
            if resp.status_code < 500:
                return resp
            last = CheckBanError(f"Servidor respondeu {resp.status_code}.")
        except requests.RequestException as exc:
            last = exc
        if attempt < retries:
            time.sleep(0.6 * (2 ** (attempt - 1)))
    raise CheckBanError(f"Falha ao consultar a API: {last}")


def _player_info(session: requests.Session, uid: str) -> tuple[str | None, str | None]:
    """Nickname e região via Shop2Game. Best-effort: não derruba o checkban."""
    try:
        resp = session.post(
            SHOP2GAME_URL,
            json={"app_id": 100067, "login_id": uid, "app_server_id": 0},
            headers=SHOP2GAME_HEADERS,
            cookies=SHOP2GAME_COOKIES,
            timeout=4,
        )
        if resp.status_code != 200:
            return None, None
        data = resp.json()
        nickname = data.get("nickname") or None
        region = (data.get("region") or "").upper() or None
        return nickname, region
    except (requests.RequestException, ValueError):
        return None, None


def checkban(uid: str, *, lang: str = "en", timeout: float = 15,
             retries: int = 3) -> dict[str, Any]:
    """Verifica o banimento de um jogador de Free Fire pelo UID.

    Args:
        uid: ID do jogador (6 a 12 dígitos).
        lang: idioma da resposta da Garena (``en``, ``pt``, ...).
        timeout: timeout de cada requisição, em segundos.
        retries: tentativas em caso de erro 5xx ou de rede.

    Returns:
        dict com ``uid``, ``banned``, ``is_banned``, ``period`` (código de 1 a
        6), ``period_label``, ``status``, ``message``, ``nickname``, ``region``
        e ``elapsed_ms``.

    Raises:
        CheckBanError: UID inválido, conta inexistente ou falha na API.
    """
    uid = _parse_uid(uid)
    started = time.time()

    with requests.Session() as session:
        resp = _get(
            session,
            GARENA_BAN_URL,
            params={"lang": lang, "uid": uid},
            headers=GARENA_HEADERS,
            timeout=timeout,
            retries=retries,
        )

        if resp.status_code != 200:
            raise CheckBanError(f"Garena respondeu HTTP {resp.status_code}.")

        try:
            payload = resp.json()
        except ValueError as exc:
            raise CheckBanError("Resposta da Garena não é JSON.") from exc

        if payload.get("status") != "success" or "data" not in payload:
            motivo = payload.get("msg", "resposta sem status")
            if motivo == "T_P_WRONG_ACCOUNT":
                raise CheckBanError("UID não encontrado.")
            raise CheckBanError(f"Garena recusou a consulta: {motivo}")

        # nickname/região são opcionais: nunca atrasam nem derrubam a consulta
        nickname, region = _player_info(session, uid)

    data = payload["data"]
    is_banned = int(data.get("is_banned", 0) or 0)
    period = int(data.get("period", 0) or 0) if is_banned else 0
    period_label = PERIOD_LABELS.get(period, "não informado") if is_banned else ""

    if is_banned:
        message = f"Banido: {period_label}."
    else:
        message = "Conta limpa: nenhum banimento ativo."

    return {
        "uid": uid,
        "banned": bool(is_banned),
        "is_banned": is_banned,
        "period": period,
        "period_label": period_label,
        "status": "banned" if is_banned else "clean",
        "message": message,
        "nickname": nickname,
        "region": region,
        "elapsed_ms": int((time.time() - started) * 1000),
    }


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("uso: python checkban.py <uid>")
        raise SystemExit(2)
    try:
        print(checkban(sys.argv[1]))
    except CheckBanError as exc:
        print(f"erro: {exc}")
        raise SystemExit(1)
