import { supabase } from './supabaseClient';

const extensions: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export function validateImage(file: File): void {
  if (!extensions[file.type] || file.size === 0 || file.size > 5 * 1024 * 1024) {
    throw new Error('Elegí una imagen JPG, PNG o WebP de hasta 5 MB.');
  }
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
