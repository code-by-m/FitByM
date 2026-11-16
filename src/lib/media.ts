import { z } from 'zod';
export function isMediaUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}
const mediaUrl = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (value) => value === '' || isMediaUrl(value),
    'Geçerli bir HTTPS bağlantısı girin veya alanı boş bırakın.',
  );
export const exerciseMediaSchema = z.object({ imageUrl: mediaUrl, videoUrl: mediaUrl });
export function isDirectVideo(value: string) {
  return isMediaUrl(value) && /\.(mp4|webm|mov|m4v)$/i.test(new URL(value).pathname);
}
