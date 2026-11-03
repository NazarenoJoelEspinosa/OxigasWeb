import { supabase } from './supabaseClient';

const extensions: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export function validateImage(file: File): void {
  if (!extensions[file.type] || file.size === 0 || file.size > 5 * 1024 * 1024) {
    throw new Error('Elegí una imagen JPG, PNG o WebP de hasta 5 MB.');
  }
}

/** Reduce dimensiones y peso sin agrandar imágenes pequeñas. */
export async function optimizeImage(file: File): Promise<File> {
  validateImage(file);
  let bitmap: ImageBitmap;
  try { bitmap = await createImageBitmap(file); } catch { throw new Error('No se pudo leer la foto. Elegí otro archivo JPG, PNG o WebP.'); }
  try {
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo preparar la imagen.');
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', 0.85));
    if (!blob) throw new Error('No se pudo optimizar la imagen. Elegí otra foto.');
    if (scale === 1 && blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: blob.type });
  } finally { bitmap.close(); }
}

export async function uploadOfferImage(file: File) {
  validateImage(file);
  const path = `offers/${crypto.randomUUID()}.${extensions[file.type]}`;
  const bucket = supabase.storage.from('product-images');
  const { error } = await bucket.upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw new Error('No se pudo subir la imagen. Revisá tu conexión y volvé a intentar.');
  return { path, url: bucket.getPublicUrl(path).data.publicUrl };
}

export async function discardUploadedImage(path: string) {
  const { error } = await supabase.storage.from('product-images').remove([path]);
  if (error) console.error('No se pudo limpiar la imagen pendiente:', error.message);
}
