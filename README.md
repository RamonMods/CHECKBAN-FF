# ramonmods

Site do RamonMods + API do CheckBan. HTML/CSS/JS puro no front, Flask no back.

## Estrutura

```
public/                 site estático (Render Static Site / GitHub Pages)
  index.html
  styles.css
  app.js
  checkban/             ferramenta de consulta de banimento
  assets/fonts/         Sora + Manrope (woff2, self-hosted)
checkban.py             função checkban(uid) — núcleo da consulta
server/
  app.py                API Flask (CORS, cache, rate limit)
  requirements.txt
render.yaml             blueprint: site estático + API
.github/workflows/      deploy do site no GitHub Pages
```

## Rodar local

Site:

```powershell
node serve.js 8080   # ou qualquer servidor estático apontando para public/
```

API:

```powershell
pip install -r server/requirements.txt
python server/app.py
```

A página `checkban/` usa `http://127.0.0.1:5000` quando aberta em localhost.

## A função

```python
from checkban import checkban

r = checkban("123456789")
# {
#   "uid": "123456789",
#   "banned": True,
#   "is_banned": 1,
#   "period_months": 6,
#   "status": "banned",
#   "message": "Banido por 6 meses.",
#   "nickname": "NOME",
#   "region": "BR",
#   "elapsed_ms": 640
# }
```

Fonte: `https://ff.garena.com/api/antihack/check_banned` — o mesmo endpoint
público usado pela página de suporte da Garena. Não usa login, token ou
credencial de terceiro.

## Publicar no Render

1. Render → **New** → **Blueprint**
2. Conecte `RamonMods/ramonmods-site`
3. **Apply**

O `render.yaml` cria:

| Serviço | URL | Tipo |
|---|---|---|
| `ramonmods` | https://ramonmods.onrender.com | Static (não dorme) |
| `ramonmods-api` | https://ramonmods-api.onrender.com | Python free (dorme após 15 min) |

O site funciona sozinho; a ferramenta CheckBan depende da API acordar
(primeira consulta pode levar ~50 s).

## Design

- Sora (títulos) + Manrope (texto), self-hosted, 121 KB no total.
- Acento único lima `#C6F24E` sobre carvão `#0A0A0B`.
- Contraste mínimo 4,5:1 no corpo.
- Grão e halo em CSS/SVG, sem imagem externa.
- Movimento respeita `prefers-reduced-motion`.
