import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { writeFileSync } from "node:fs";

const port = Number(process.env.PORT || 3000);

// Para GitHub Pages: si el repo se llama "oxi-gas", el base debe ser "/oxi-gas/"
// Cambiá VITE_BASE_PATH en tu entorno o directamente acá si el nombre del repo es fijo.
const requestedBase = process.env.BASE_PATH || process.env.VITE_BASE_PATH || '/';
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
