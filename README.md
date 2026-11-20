<div align="center">

<img src="public/assets/favicon.svg" width="96" alt="CHECKBAN-FF">

# CHECKBAN-FF

Verifique em segundos se um jogador de Free Fire está banido, direto no navegador.

[![Site](https://img.shields.io/badge/Site-ramonmods.onrender.com-32BCAD?style=for-the-badge)](https://ramonmods.onrender.com/)
[![GitHub Pages](https://img.shields.io/badge/Pages-ramonmods.github.io%2FCHECKBAN--FF-111111?style=for-the-badge&logo=github&logoColor=white)](https://ramonmods.github.io/CHECKBAN-FF/)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](#)
[![Flask](https://img.shields.io/badge/Flask-3.1-000000?style=for-the-badge&logo=flask&logoColor=white)](#)

<br>
<a href="https://pixgg.com/ramon"><img src="https://img.shields.io/badge/Pix-pixgg.com%2Framon-32BCAD?style=for-the-badge&logo=pix&logoColor=white" alt="Apoiar o projeto" /></a>
</div>

---

# Conteúdo

- [Sobre](#sobre) · [Recursos](#recursos) · [Como funciona](#como-funciona)
- [Site](#site) · [Estrutura](#estrutura) · [Apoio](#apoio)

---

## Sobre

O CHECKBAN-FF consulta o status de banimento de uma conta de Free Fire a
partir do UID, usando o mesmo endpoint público que a página de suporte da
Garena. Não pede login, senha, token nem credencial de terceiro — só o UID.

O site é estático (HTML/CSS/JS puro, fontes self-hosted) e a consulta é feita
pela API Flask no mesmo serviço. Não armazena nada: o UID fica em cache na
memória por 5 minutos e não é gravado em banco.

## Recursos

- **Consulta instantânea**: digite o UID e veja se está limpo ou banido.
- **Duração do ban**: 1 semana, 1 mês, 3 meses, 6 meses, 1 ano ou permanente.
- **Sem cadastro**: nenhum login, senha ou dado pessoal é solicitado.
- **Rate limit**: 20 consultas por minuto por IP.
- **Cache**: 5 minutos por UID para não sobrecarregar a Garena.
- **Multiplataforma**: funciona em qualquer navegador (celular ou desktop).

## Como funciona

1. Você informa o UID do jogador.
2. A API consulta `ff.garena.com/api/antihack/check_banned` (endpoint público da Garena).
3. O campo `period` é decodificado em uma duração legível.
4. O resultado aparece na tela: limpo ou banido, e por quanto tempo.

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

Também publicado no GitHub Pages:
**https://ramonmods.github.io/CHECKBAN-FF/**

## Estrutura

```
public/                 site estático (servido pelo próprio Flask)
  index.html            landing
  checkban/             ferramenta de consulta de banimento
  assets/               favicon, preview, fontes woff2
core/
  checkban.py           função checkban(uid) — núcleo da consulta
  __init__.py
api/
  app.py                Flask: site + consulta, CORS, cache, rate limit
  requirements.txt
render.yaml             serviço único no Render
.github/
  workflows/pages.yml   deploy do site no GitHub Pages
  FUNDING.yml           apoio via Pix (pixgg.com/ramon)
```

## Apoio

Se o projeto te ajudou, apoie via Pix:

**https://pixgg.com/ramon**

---

<div align="center">
<sub>CHECKBAN-FF é um projeto independente, não afiliado nem endossado pela Garena.</sub>
</div>
