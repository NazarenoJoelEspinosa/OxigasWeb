# Mejoras del catálogo — noviembre de 2026

- **Cantidades:** Mi cotización permite editar la cantidad sin perder los demás campos. Se conserva al recargar y el mensaje de WhatsApp recibe un entero positivo.
- **Ofertas:** buscá un producto por nombre o código para completar nombre, marca, descripción y foto. Si el formulario ya tiene datos, se pide confirmar su reemplazo; los precios se conservan. También se pueden crear publicaciones independientes dejando vacío el código. Se advierte si el código no existe o ya tiene una publicación visible.
- **Fotos nuevas:** productos y ofertas preparan una vista previa, limitan el lado mayor a 1600 píxeles y usan WebP con calidad 0,85 cuando corresponde. Las fotos pequeñas no se agrandan; si la conversión sin reducción de dimensiones pesaría más, se conserva el original. Las imágenes cargadas anteriormente no se modifican. Una foto dañada bloquea el guardado hasta elegir otra o descartarla.
- **Fichas:** cada producto tiene `/producto/CODIGO`, enlaces rastreables desde la tienda y contenido HTML con título, descripción, imagen y datos Product. Cloudflare Pages Functions consulta usando la misma clave pública de la web y los permisos de lectura pública; nunca usa claves administrativas. Los productos ocultos/inexistentes responden 404 y no se incluyen en el sitemap. Ante errores del catálogo se responde 503, sin simular un producto inexistente. Las rutas antiguas con `?producto=` siguen funcionando.
- **Sitemap:** conserva `/sitemap.xml`; en Cloudflare incorpora automáticamente los productos visibles y pagina las consultas. Inicio, Tienda y Ofertas permanecen incluidos. En GitHub Pages estático sigue disponible el mapa básico.
- **Presentación:** se conservan siglas técnicas y unidades frecuentes, como PVC, MIG, TIG, SDS, mm, kg, W y V. Los nombres guardados no se modifican. Se retiraron San Justo y Villa Lugano de `areaServed` para coincidir con las zonas visibles.

## Copia de seguridad

En el panel de administración, usar **Descargar respaldo ZIP**. Guardar el archivo en un lugar privado y hacer copias periódicas, sobre todo antes de grandes cambios.

El ZIP contiene catálogo JSON sin perder columnas, ofertas, categorías, asociaciones, todos los archivos listados del bucket `product-images`, inventario con SHA-256, `restaurar.sql` y una guía. Si no se puede leer una tabla o descargar un archivo, no se entrega una copia parcial como si fuera completa.

La restauración SQL es transaccional y fue probada con las migraciones reales en una base local. Se utiliza sobre el mismo proyecto y esquema, revisándola primero; no elimina productos nuevos ajenos al respaldo. Las imágenes deben reponerse conservando sus rutas. El respaldo no incluye usuarios, contraseñas, permisos, funciones SQL ni configuración de Supabase. Las imágenes externas se conservan como enlaces y se enumeran como no incluidas.

La lectura del respaldo usa varias consultas y no es una instantánea transaccional: evitá editar desde otro dispositivo durante la descarga. La descarga web se limita a 250 MB para no agotar memoria; para catálogos mayores corresponde una herramienta externa de respaldo. No se ejecuta ninguna restauración automáticamente.

## Publicación

Cloudflare compila las funciones desde `oxi-gas/functions`. El build genera `catalog-config.json` con la misma configuración pública utilizada por el navegador, y `_routes.json` limita las funciones a fichas y sitemap. Los recursos estáticos no pasan por esas funciones. No se requieren migraciones nuevas en Supabase.
