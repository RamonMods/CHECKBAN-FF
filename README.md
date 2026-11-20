# ramonmods

Site estático do RamonMods. HTML, CSS e JS puros — sem build, sem dependência.

## Rodar local

```powershell
# qualquer servidor estático serve; exemplo com Node
npx --yes serve .
```

Ou abra `index.html` direto no navegador.

## Publicar no Render

O arquivo `render.yaml` já define o serviço como site estático e publica a raiz do repositório.

1. Render → **New** → **Blueprint**
2. Conecte o repositório `RamonMods/ramonmods-site`
3. Nome do serviço: `ramonmods`
4. **Apply**

URL final: `https://ramonmods.onrender.com`

## Estrutura

```
index.html        página única
styles.css        estilos (tokens no :root)
app.js            header, revelação no scroll, ano
assets/fonts/     Sora + Manrope (woff2, self-hosted)
assets/favicon.svg
render.yaml       blueprint do Render
```

## Decisões de design

- Tipografia: Sora (títulos) + Manrope (texto), self-hosted — sem Google Fonts em runtime.
- Cor de acento única (lima `#C6F24E`) sobre carvão `#0A0A0B`.
- Contraste mínimo 4,5:1 no texto de corpo.
- Grão e halo feitos em CSS/SVG, sem imagem externa.
- Movimento respeita `prefers-reduced-motion`.
