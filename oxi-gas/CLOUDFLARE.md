# Publicar OXI-GAS en Cloudflare Pages

Conectar el repositorio `NazarenoJoelEspinosa/OxigasWeb` mediante integración Git y crear un proyecto **Pages**, no un Worker.

Configuración:

- Rama de producción: `main`.
- Carpeta raíz: `oxi-gas`.
- Comando de build: `npm ci && npm run build`.
- Carpeta de salida: `dist`.
- Variables: `NODE_VERSION=24`, `SKIP_DEPENDENCY_INSTALL=1`, `BASE_PATH=/`.
- Agregar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con la URL y clave pública del proyecto real. No usar `service_role`. Repetir para vistas previas si se habilitan.

La carpeta `attached_assets` debe seguir en la raíz del repositorio, junto a `oxi-gas`: se usa para los logos importados.

Cloudflare establece `CF_PAGES=1` durante el build. La configuración usa esa variable para servir la app desde `/` y omitir `404.html`. Cloudflare ofrece entonces su fallback SPA nativo y permite recargar `/productos` y `/admin/login` sin un salto intermedio.

El workflow de GitHub Pages anterior continúa funcionando hasta completar el cambio de alojamiento; no contiene las credenciales para crear el proyecto Cloudflare.

Después de publicar:

1. Abrir la URL `pages.dev` proporcionada por Cloudflare y verificar catálogo, ofertas, imágenes y panel. La existencia de la URL no prueba que Supabase esté bien configurado.
2. En Supabase Auth → URL Configuration, agregar `https://NOMBRE.pages.dev/admin/dashboard` como URL de retorno y establecer la dirección pública definitiva como Site URL cuando corresponda.
3. Cuando exista un dominio propio, agregarlo en Custom domains de Pages y configurar DNS siguiendo las indicaciones del panel. Conservar los registros de correo existentes.
4. Actualizar las URLs de Supabase Auth y los metadatos de `index.html` al dominio definitivo.
5. Tras verificar Cloudflare, retirar el despliegue anterior de GitHub Pages si ya no se utilizará.

Verificación local (PowerShell):

```powershell
$env:CF_PAGES = '1'
npm run build
node scripts/verify-build.mjs / cloudflare
```

Referencias:
- https://developers.cloudflare.com/pages/configuration/build-configuration/
- https://developers.cloudflare.com/pages/configuration/build-image/
- https://developers.cloudflare.com/pages/configuration/serving-pages/#single-page-application-spa-rendering
