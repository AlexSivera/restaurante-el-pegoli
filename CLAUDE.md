# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Web de **Restaurante El Pegolí** (Les Rotes, Dénia; desde 1943). Es un sitio estático HTML/CSS/JS vanilla, **sin build ni dependencias en runtime**. Bilingüe: `/` (ES) y `/en/` (EN).

Antes de tocar copy o diseño, lee `docs/business-brief.md` (hechos verificados y sus fuentes) y `docs/design-direction.md` (concepto «Rotulado en el muro»). `docs/qa-report.md` lista lo pendiente del cliente.

## Comandos

```bash
npm run dev      # servidor local en http://localhost:4173 (scripts/serve.mjs, sin caché; sirve 404.html)
npm run check    # comprobación estática: recursos, anclas, ids, alt, h1, JSON-LD, paridad ES/EN
npm run images   # regenera assets/img/ desde _src/img/ (necesita la devDependency sharp)
node scripts/set-domain.mjs https://dominio.es   # al publicar: URLs absolutas + sitemap.xml + robots.txt
```

No hay tests unitarios. La verificación visual y funcional se hace con Playwright contra `npm run dev`.

## Arquitectura

- `index.html` y `en/index.html` son **la misma página en dos idiomas**, mantenidas a mano. Cualquier cambio de estructura, clase o sección va en ambas (`npm run check` falla si las secciones difieren). Los ids de ancla son los mismos en los dos idiomas (en español).
- `assets/css/styles.css` es una sola hoja. Los tokens de color y tipografía están en `:root`, y los nombres de clase van en español según el concepto (`muro`, `placa`, `pizarra`, `barra`, `carta`, `azulejo`, `pulgar`…).
- `assets/js/main.js` (IIFE, sin dependencias) hace tres cosas: el **parte del mediodía** (estado abierto o cerrado calculado con la zona `Europe/Madrid`; el horario está en las constantes `ABRE`/`CIERRA`), el índice móvil (`<dialog>`) y la aparición de `[data-aparece]`. Añade `.js` al `<html>`: el CSS solo oculta o anima cuando esa clase existe, así que la página funciona sin JS.
- Los recursos gráficos son SVG inline en el HTML: el borde de roca, la barra a listones (`<pattern>`), la balaustrada (con `viewBox` para escalar), la etiqueta de cerillas y el croquis. Un cambio en uno de ellos se replica en ES y EN.
- Las URLs de SEO (`canonical`, `hreflang`, `og:image`, JSON-LD) son **relativas a propósito** hasta que exista dominio. No se inventa un dominio: se usa `set-domain.mjs`.
- `_src/` guarda las imágenes originales (no se publica; `serve.mjs` bloquea `_src`, `docs`, `scripts` y `node_modules`).

## Reglas del proyecto

- **No inventar datos.** Cada afirmación del copy (horario, platos, historia, servicios) sale de una fuente del brief. Lo no verificado está en «Pendiente del cliente» de `docs/qa-report.md`. No hay precios publicados: la gamba y el pescado van «al peso / según lonja».
- **Imágenes:** solo fotos con licencia verificada (hoy: Wikimedia Commons CC0/CC BY-SA con crédito visible junto a la imagen o en el pie, y el grabado de 1902 de dominio público). Las fotos de la web antigua o de Instagram del restaurante son solo referencia hasta que el cliente las ceda. Al añadir una foto: original en `_src/img/`, entrada en `photos` de `scripts/images.mjs`, `npm run images` y `<picture>` con avif/webp/jpg + `width`/`height`.
- **Acción principal: llamar** (`tel:+34965781035`). No hay reserva online y no se debe simular.
- Las fuentes (Young Serif, Yellowtail, Libre Franklin) están alojadas en `assets/fonts/`. No se cargan desde Google. Yellowtail se reserva para la marca y unos pocos acentos.
- Mantener AA de contraste, foco visible y `prefers-reduced-motion`. Tras cambios visuales, revisar 375, 768 y 1440 px.
