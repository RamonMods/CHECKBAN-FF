<div align="center">

<img src="public/assets/favicon.svg" width="96" alt="CHECKBAN-FF">

# CHECKBAN-FF

Verifique em segundos se um jogador de Free Fire está banido, direto no navegador.

[![Site](https://img.shields.io/badge/Site-ramonmods.onrender.com-32BCAD?style=for-the-badge)](https://ramonmods.onrender.com/)
[![API](https://img.shields.io/badge/API-ramonmods--api.onrender.com-1F883D?style=for-the-badge)](https://ramonmods-api.onrender.com/)
[![GitHub Pages](https://img.shields.io/badge/Pages-ramonmods.github.io%2FCHECKBAN--FF-111111?style=for-the-badge&logo=github&logoColor=white)](https://ramonmods.github.io/CHECKBAN-FF/)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](#)
[![Flask](https://img.shields.io/badge/Flask-3.1-000000?style=for-the-badge&logo=flask&logoColor=white)](#)
[![License](https://img.shields.io/badge/Licen%C3%A7a-Apache%202.0-6750A4?style=for-the-badge)](LICENSE)

<br>
<a href="https://pixgg.com/ramon"><img src="https://img.shields.io/badge/Pix-pixgg.com%2Framon-32BCAD?style=for-the-badge&logo=pix&logoColor=white" alt="Apoiar o projeto" /></a>
</div>

---

# Conteúdo

- [Sobre](#sobre) · [Recursos](#recursos) · [Como funciona](#como-funciona)
- **Uso**: [Site](#site) · [API](#api) · [Função em Python](#função-em-python)
- [Rodar local](#rodar-local) · [Deploy no Render](#deploy-no-render) · [Estrutura](#estrutura)
- [Apoio](#apoio)

---

## Sobre

O CHECKBAN-FF consulta o status de banimento de uma conta de Free Fire a
partir do UID, usando o mesmo endpoint público que a página de suporte da
Garena. Não pede login, senha, token nem credencial de terceiro — só o UID.

O site é estático (HTML/CSS/JS puro, fontes self-hosted) e a consulta é feita
por uma API Flask hospedada no Render. A ferramenta não armazena nada: o UID
fica em cache na memória por 5 minutos e não é gravado em banco.

## Recursos

- **Consulta instantânea**: digite o UID e veja se está limpo ou banido.
- **Duração do ban**: 1 semana, 1 mês, 3 meses, 6 meses, 1 ano ou permanente.
- **Sem cadastro**: nenhum login, senha ou dado pessoal é solicitado.
- **API pública**: endpoint `/checkban?uid=...` para integrar em outros projetos.
- **Rate limit**: 20 consultas por minuto por IP.
- **Cache**: 5 minutos por UID para não sobrecarregar a Garena.
- **Multiplataforma**: funciona em qualquer navegador (celular ou desktop).

## Como funciona

1. Você informa o UID do jogador.
2. A API consulta `ff.garena.com/api/antihack/check_banned` (endpoint público da Garena).
3. O campo `period` é decodificado em uma duração legível.
4. (Opcional) nickname e região são buscados via Shop2Game — best-effort, não
   derrubam a consulta.

### Códigos de duração

| Código | Duração |
|---|---|
| 1 | 1 semana |
| 2 | 1 mês |
| 3 | 3 meses |
| 4 | 6 meses |
| 5 | 1 ano |
| 6 | Banimento permanente |

## Site

Acesse: **https://ramonmods.onrender.com/**

A página também está publicada no GitHub Pages:
**https://ramonmods.github.io/CHECKBAN-FF/**

## API

Endpoint base: `https://ramonmods-api.onrender.com`

### `GET /`

Health check.

```json
{"servico":"CheckBan API","status":"online","endpoint":"/checkban?uid=123456789"}
```

### `GET /checkban?uid=<UID>`

Verifica o banimento de um jogador.

**Exemplo:**

```bash
curl "https://ramonmods-api.onrender.com/checkban?uid=1235669332"
```

**Resposta (conta limpa):**

```json
{
  "uid": "1235669332",
  "banned": false,
  "is_banned": 0,
  "period": 0,
  "period_label": "",
  "status": "clean",
  "message": "Conta limpa: nenhum banimento ativo.",
  "nickname": null,
  "region": null,
  "elapsed_ms": 640,
  "cached": true
}
```

**Resposta (banido):**

```json
{
  "uid": "6900966558",
  "banned": true,
  "is_banned": 1,
  "period": 6,
  "period_label": "permanente",
  "status": "banned",
  "message": "Banido: permanente.",
  "nickname": null,
  "region": null,
  "elapsed_ms": 1137
}
```

**Erros:**

| HTTP | Motivo |
|---|---|
| 400 | UID inválido (não é dígito ou fora de 6–12 caracteres) |
| 404 | UID não encontrado ou falha na API da Garena |
| 429 | Muitas consultas (limite: 20/min por IP) |

## Função em Python

```python
from core.checkban import checkban

r = checkban("123456789")
# {
#   "uid": "123456789",
#   "banned": True,
#   "is_banned": 1,
#   "period": 6,
#   "period_label": "permanente",
#   "status": "banned",
#   "message": "Banido: permanente.",
#   "nickname": "NOME",
#   "region": "BR",
#   "elapsed_ms": 640
# }

if r["banned"]:
    print(r["period_label"])
```

CLI:

```bash
python core/checkban.py 123456789
```

Fonte: `https://ff.garena.com/api/antihack/check_banned` — o mesmo endpoint
público usado pela página de suporte da Garena. Não usa login, token ou
credencial de terceiro.

## Rodar local

**Site:**

```powershell
# qualquer servidor estático apontando para public/
npx serve public
```

**API:**

```powershell
pip install -r api/requirements.txt
python api/app.py
```

A página `checkban/` usa `http://127.0.0.1:5000` quando aberta em localhost.

## Deploy no Render

1. Render → **New** → **Blueprint**
2. Conecte `RamonMods/CHECKBAN-FF`
3. **Apply**

O `render.yaml` cria:

| Serviço | URL | Tipo |
|---|---|---|
| `ramonmods` | https://ramonmods.onrender.com | Static (não dorme) |
| `ramonmods-api` | https://ramonmods-api.onrender.com | Python free (dorme após 15 min) |

O site funciona sozinho; a ferramenta CheckBan depende da API acordar
(primeira consulta pode levar ~50 s).

## Estrutura

```
public/                 site estático (Render Static Site / GitHub Pages)
  index.html
  styles.css
  app.js
  checkban/             ferramenta de consulta de banimento
  assets/               favicon, preview, fontes woff2
core/
  checkban.py           função checkban(uid) — núcleo da consulta
  __init__.py
api/
  app.py                API Flask (CORS, cache, rate limit)
  requirements.txt
render.yaml             blueprint: site estático + API
.github/
  workflows/pages.yml   deploy do site no GitHub Pages
  FUNDING.yml           apoio via Pix (pixgg.com/ramon)
```

## Design

- Sora (títulos) + Manrope (texto), self-hosted, 121 KB no total.
- Acento único lima `#C6F24E` sobre carvão `#0A0A0B`.
- Contraste mínimo 4,5:1 no corpo.
- Grão e halo em CSS/SVG, sem imagem externa.
- Movimento respeita `prefers-reduced-motion`.

## Apoio

Se o projeto te ajudou, apoie via Pix:

**https://pixgg.com/ramon**

---

<div align="center">
<sub>CHECKBAN-FF é um projeto independente, não afiliado nem endossado pela Garena.</sub>
</div>
