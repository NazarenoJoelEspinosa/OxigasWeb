# OXI-GAS — Tienda y sitio institucional

React 19, TypeScript estricto, Vite 7, Tailwind 4 y Supabase. La aplicación vigente está en esta carpeta (`oxi-gas`). No se usa la antigua carpeta `OxigasWeb`.

## Arranque

Requiere Node 24 (o una versión compatible desde 22.18), npm y un proyecto Supabase.

1. Ejecutar `npm ci` dentro de `oxi-gas`.
2. Copiar `.env.example` a `.env.local` y completar URL y clave pública anon/publishable de Supabase. Nunca colocar una clave service_role en el frontend.
3. Ejecutar `npm run dev`. Dirección predeterminada: http://localhost:3000.

Si falta configuración, aparece un aviso de tienda temporalmente no disponible con acceso a WhatsApp. El sitio no intenta consultar un cliente nulo ni promete datos locales inexistentes.

## Verificaciones

- `npm run typecheck`: TypeScript sin emitir archivos.
- `npm test`: validaciones y PostgreSQL local con PGlite. No toca la base real.
- `npm run test:browser`: pruebas de navegación, búsqueda, carrito, formulario y teclado, con respuestas ficticias. Usa Chrome instalado; para Chromium ejecutar `npx playwright install chromium` y definir `PLAYWRIGHT_CHANNEL=chromium`.
- `npm run build`: verifica tipos y genera `dist`.
- `npm run check`: tipos, pruebas de lógica/base y build.

Las pruebas de navegador levantan su propio servidor en el puerto 4173. Las variables ficticias se aplican sólo a ese servidor. CI ejecuta las pruebas antes de publicar.

## Supabase: aplicar las correcciones de permisos

Las migraciones están preparadas y probadas localmente, pero **no se aplicaron a tu Supabase**. La actualización del frontend por sí sola no cambia sus políticas.

1. Obtener una copia de seguridad y trabajar primero en una copia de la base. Ejecutar `supabase/preflight.sql` para inspeccionar estructura, políticas, administradores y códigos repetidos. Si una tabla todavía no existe, ejecutar las consultas correspondientes a las tablas existentes por separado.
2. Comparar la estructura real con `src/lib/database.types.ts`. Es un contrato escrito a partir del código, no un esquema generado desde tu cuenta. Al conectar el proyecto, regenerar tipos con Supabase CLI y revisar diferencias. Las tablas existentes no se alteran automáticamente para añadir columnas faltantes.
3. Confirmar la membresía de administradores. Como en el código original, cualquier fila en `admin_users` representa un administrador; `role` es descriptivo. Las altas/bajas se hacen desde un operador de la base, nunca desde un cliente web.
4. Revisar y aplicar `supabase/migrations/202610230001_security_and_transactions.sql` mediante SQL Editor o el flujo de migraciones habitual. Sustituye las políticas de `products`, `offers`, `category_groups` y `admin_users`. Si existen otras aplicaciones que consumen estas tablas, revisar sus necesidades antes de aplicar.
5. Si hay códigos de productos repetidos, resolverlos antes: el índice único aborta la migración completa en ese caso. Los controles de nombre y precio son `NOT VALID` para no borrar filas antiguas, pero nuevas escrituras deben cumplirlos. Corregir los datos históricos antes de validar esas restricciones.
6. Probar visitante, usuario común y administrador directamente contra la API. Sólo administradores pueden modificar datos; visitantes sólo leen productos/ofertas visibles. Verificar también revocación de permisos con una sesión ya iniciada.
7. Verificar el bucket `product-images`: debe existir y servir imágenes públicas si se usa `getPublicUrl`. La migración restringe escrituras a administradores, límite 5 MB y tipos JPG/PNG/WebP. Conserva imágenes existentes y no modifica políticas de otros buckets.
8. Añadir en la lista de URLs permitidas de Supabase Auth la ruta real de retorno del enlace mágico, por ejemplo `https://TU-DOMINIO/OxigasWeb/admin/dashboard`.

Las funciones RPC de restauración y orden se incluyen en esa migración. Sin aplicarla, la interfaz muestra un error y no ejecuta el antiguo borrado seguido de inserciones independientes.

La prueba PostgreSQL simula `auth.uid()`, roles y tablas Storage en una base nueva. Comprueba RLS, transacciones e idempotencia; no sustituye probar el esquema, triggers y permisos reales de tu proyecto.

Documentación: https://supabase.com/docs/guides/database/postgres/row-level-security

## Publicación y rutas

La base predeterminada es `/`. Definir `BASE_PATH=/OxigasWeb/` en el entorno al generar el sitio para GitHub Pages. El flujo `.github/workflows/deploy.yml` ya lo hace. Para dominio propio alojado en raíz, usar `/` y revisar los metadatos de `index.html` (actualmente apuntan a `https://oxigas.com.ar`).

PowerShell:

```powershell
$env:BASE_PATH = '/OxigasWeb/'
npm run build
node scripts/verify-build.mjs /OxigasWeb/
npm run serve
```

La página 404 se genera usando la misma base; las rutas profundas se restauran mediante `?__route=...`, sin depender de sessionStorage. Los enlaces del sitio usan el router y los recursos respetan `BASE_URL`.

Si se desarrolla desde un dominio remoto propio, definir `DEV_ALLOWED_HOSTS` como una lista separada por comas. No se permiten todos los hosts indiscriminadamente.

Documentación de base pública: https://vite.dev/guide/build.html#public-base-path

## Organización y reglas útiles

- `src/lib/database.types.ts`: contrato de tablas y funciones RPC.
- `src/lib/models.ts`: modelos normalizados y validación de datos externos.
- `src/lib/catalog.ts`, `pagination.ts`: acceso a productos y lectura por páginas, comprobando errores y sin depender del límite por defecto del servidor.
- `src/lib/cart-storage.ts`: validación completa y eliminación de duplicados del almacenamiento persistido.
- `src/lib/format.ts`: cantidades válidas y formato monetario compartido.
- `src/components/features/ProductCard.tsx`, `ProductModal.tsx`: presentación del producto separada de la página de filtros. El modal controla foco, Escape y navegación por teclado.
- `src/components/Admin`: edición protegida. El contenido y sus consultas se montan después de verificar membresía.
- `src/hooks`: estado de carrito, ofertas y categorías con cancelación de cargas cuando corresponde.

Las claves de campos personalizados son estables; no deben recalcularse desde sus etiquetas. Los campos anteriores conservan sus claves. Si ya había claves duplicadas, corregirlas con un plan de compatibilidad de carritos existentes.

La tienda mantiene `/productos` para conservar enlaces anteriores. Las categorías son filtros internos, no un menú desplegable del encabezado.

## Límites y mantenimiento

El catálogo necesita el conjunto completo para calcular filtros y contadores locales. Se descarga por páginas para no truncarlo por el límite de Supabase; para catálogos muy grandes conviene llevar búsqueda, filtros, conteos y paginación a consultas de servidor. El carrito sólo consulta los códigos seleccionados, en lotes.

Subir imagen y guardar producto son operaciones de servicios distintos: si falla guardar, se intenta eliminar la imagen recién subida. No hay transacción distribuida entre Storage y Postgres; si falla también la limpieza, queda registrado para conciliación. Quitar una imagen de un producto no borra automáticamente el archivo remoto para evitar eliminar recursos compartidos.

No distribuir `.env`, `node_modules`, cachés ni `dist` como fuente. Instalar dependencias con el lockfile en cada plataforma. Las capturas de prueba usan productos ficticios y no representan el inventario real.
