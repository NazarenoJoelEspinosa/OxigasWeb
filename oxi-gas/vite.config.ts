import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { writeFileSync, rmSync, readFileSync } from "node:fs";

const port = Number(process.env.PORT || 3000);

// Cloudflare sirve la aplicación en raíz. GitHub Pages conserva su base configurable.
const cloudflarePages = process.env.CF_PAGES === '1';
const requestedBase = cloudflarePages ? '/' : process.env.BASE_PATH || process.env.VITE_BASE_PATH || '/';
const segments = requestedBase.split('/').filter(Boolean);
const basePath = segments.length ? '/' + segments.join('/') + '/' : '/';

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'pages-fallback',
      apply: 'build',
      closeBundle() {
        if (cloudflarePages) {
          // Las rutas públicas tienen su propia canonical desde el HTML inicial.
          const html = readFileSync(path.resolve(import.meta.dirname, 'dist/index.html'), 'utf8');
          for (const route of ['productos', 'ofertas']) {
            writeFileSync(path.resolve(import.meta.dirname, 'dist', `${route}.html`), html.replace(
              /<link rel="canonical" href="[^"]*"\s*\/>/,
              `<link rel="canonical" href="https://oxigas.com.ar/${route}" />`,
            ));
          }
          // Un 404.html desactiva el fallback SPA nativo de Cloudflare Pages.
          rmSync(path.resolve(import.meta.dirname, 'dist/404.html'), { force: true });
          return;
        }
        const base = JSON.stringify(basePath).replace(/</g, '\u003c');
        writeFileSync(path.resolve(import.meta.dirname, 'dist/404.html'), '<!doctype html><html lang="es"><meta charset="utf-8"><title>OXI-GAS</title><script>const base=' + base + ';const route=location.pathname.slice(base.length-1)+location.search+location.hash;location.replace(base+"?__route="+encodeURIComponent(route));</script><p>Abriendo la tienda...</p></html>');
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: { output: { manualChunks(id) {
      if (!id.includes('node_modules')) return;
      if (id.includes('supabase')) return 'supabase';
      if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils')) return 'motion';
      if (id.includes('/zod/') || id.includes('\\zod\\')) return 'validation';
    } } },
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: process.env.DEV_ALLOWED_HOSTS?.split(',').map(host => host.trim()).filter(Boolean),
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
