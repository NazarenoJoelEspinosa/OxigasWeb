# OXI-GAS — Sitio web

Sitio institucional + catálogo de **OXI-GAS** (ferretería industrial: gases comprimidos, herramientas, soldadura, seguridad).

Stack: **React 19** + **Vite** + **TypeScript** + **Tailwind CSS v4** + **framer-motion** + **wouter** (router liviano).

---

## 1. Cómo correr el proyecto

```bash
cd oxi-gas
npm install
npm run dev          # arranca Vite en http://localhost:5000
npm run build        # build de producción a dist/
npm run typecheck    # chequeo de tipos sin emitir
```

Variables relevantes:

- `PORT` — puerto del dev server (default 5173, en Replit se usa 5000).
- `BASE_PATH` — base path para deploy en subcarpeta. Default: `/`.

---

## 2. Estructura de carpetas

```
oxi-gas/
├─ public/                  # Estáticos servidos tal cual (favicon, imágenes públicas)
├─ src/
│  ├─ assets/               # (vacío por ahora; usar @assets para attached_assets)
│  ├─ components/
│  │  ├─ layout/            # Wrappers de página presentes en TODAS las vistas
│  │  │  ├─ Header.tsx
│  │  │  ├─ Footer.tsx
│  │  │  └─ WhatsAppButton.tsx
│  │  ├─ sections/          # Bloques de la home, en orden de aparición
│  │  │  ├─ Hero.tsx
│  │  │  ├─ StatsBar.tsx
│  │  │  ├─ CatalogPreview.tsx
│  │  │  ├─ Services.tsx
│  │  │  ├─ CompressedGases.tsx
│  │  │  ├─ FeaturedMachines.tsx
│  │  │  ├─ SafetyGear.tsx
│  │  │  ├─ Brands.tsx
│  │  │  ├─ TechnicalConsulting.tsx
│  │  │  └─ Hours.tsx
│  │  ├─ features/          # Features con lógica/estado propio
│  │  │  ├─ QuoteForm.tsx           # Formulario de cotización
│  │  │  └─ QuoteCart.tsx           # Carrito persistente de cotización
│  │  └─ ui/                # Primitivos shadcn/radix usados (solo los necesarios)
│  ├─ config/
│  │  └─ constants.ts       # WHATSAPP_URL, CONTACT, HOURS, etc.
│  ├─ data/
│  │  └─ products.ts        # Catálogo de productos (ver sección 4)
│  ├─ hooks/
│  │  ├─ useTheme.ts        # Toggle dark/light persistido en localStorage
│  │  └─ useQuoteCart.ts    # Carrito de cotización con sync entre pestañas
│  ├─ lib/
│  │  └─ utils.ts           # cn(), helpers genéricos
│  ├─ pages/
│  │  ├─ Home.tsx           # Compone todas las sections
│  │  ├─ Productos.tsx      # Catálogo filtrable
│  │  └─ NotFound.tsx
│  ├─ App.tsx               # Router (wouter)
│  ├─ main.tsx              # Entry point
│  ├─ index.css             # Tailwind v4 + tokens CSS (dark/light)
│  └─ vite-env.d.ts
├─ index.html
├─ vite.config.ts
├─ tsconfig.json
├─ package.json
└─ README.md                # ← este archivo
```

**Convenciones de naming:**
- Componentes: `PascalCase.tsx`.
- Hooks: `useNombre.ts`.
- Tipos exportados: `PascalCase`.
- Constantes: `UPPER_SNAKE_CASE`.

---

## 3. Sistema de diseño

### Tokens de color (en `src/index.css`)

Toda la UI consume tokens HSL. **Nunca usar hex hardcodeado**, salvo colores de marca externa (WhatsApp `#25d366`, Instagram `#e1306c`).

| Token             | Uso                                  |
| ----------------- | ------------------------------------ |
| `--surface-0`     | Fondo principal (body, hero, header) |
| `--surface-1`     | Cards y bloques elevados             |
| `--surface-2`     | Bandas alternas / fondos secundarios |
| `--surface-3`     | Bordes sutiles                       |
| `--text-main`     | Texto principal                      |
| `--text-soft`     | Texto secundario / labels            |
| `--primary`       | Color de marca (azul en dark, naranja en light) |

Cada token se redefine en `html.light` para el modo claro.

Uso típico en JSX:
```tsx
<div className="bg-[hsl(var(--surface-1))] text-[hsl(var(--text-main))] border border-[hsl(var(--surface-3))]" />
```

### Tipografía
- `Inter` para texto general.
- `Barlow` para títulos (h1–h6).
- Labels overline: `uppercase tracking-[0.2em]–[0.25em] text-xs font-semibold text-primary`.

### Modo claro/oscuro
- Toggle vía `useTheme()` (botón en Header).
- Default: **dark** (primera visita) — luego se persiste en `localStorage` (`oxi-gas-theme`).
- Para activar light en CSS se aplica la clase `.light` al `<html>`.

---

## 4. Cargar productos al catálogo

El archivo `src/data/products.ts` está intencionalmente **vacío** para ser poblado con datos reales.

Ejemplo:

```ts
export const PRODUCT_CATEGORIES: readonly ProductCategoryOption[] = [
  { value: 'soldadura', label: 'Soldadura' },
  { value: 'neumatica', label: 'Neumática' },
];

export const PRODUCT_BRANDS: readonly ProductBrand[] = [
  'Aligas',
  'Wembley',
];

export const PRODUCTS: readonly Product[] = [
  {
    id: 'al0034',
    code: 'AL0034',
    name: 'Martillo Aligas Cobre P/Soldador',
    brand: 'Aligas',
    category: 'soldadura',
    highlight: 'Más vendido', // opcional
  },
];
```

**Reglas:**
- `category` debe coincidir con un `value` de `PRODUCT_CATEGORIES`.
- `brand` debe coincidir con un string de `PRODUCT_BRANDS`.
- `id` y `code` deben ser únicos.

Mientras los arrays estén vacíos:
- `/productos` muestra el empty state.
- El bloque "CatalogPreview" del home muestra mensajes genéricos (no rompe).

---

## 5. Decisiones técnicas

- **`tsconfig.strict: false`** (heredado, no se forzó migración).
- **shadcn/ui minimo**: solo se conservan los primitivos que se usan (badge, button, card, dialog, input, label, select, separator, sheet, skeleton, textarea, toggle, tooltip).
- **No hay react-query, no hay Toaster** (se removieron por no usarse).
- **Cotización persistente**: `useQuoteCart` guarda los códigos seleccionados en `localStorage` y sincroniza entre pestañas con `storage` event.
- **Animaciones**: usar `useReducedMotion()` cuando se animen loops infinitos (respeto a `prefers-reduced-motion`).

---

## 6. Comandos útiles

```bash
npm run typecheck            # tsc --noEmit
npm run build                # build de producción
npx vite preview             # preview del build
```
