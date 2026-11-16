/**
 * Resource images (rooms, stations, benches, equipment, licenses).
 *
 * Contract: `PUT /api/labs/<resource>/{id}/image` takes multipart/form-data with one `file` part
 * (JPEG, PNG, GIF or WebP, at most 5 MB, type detected from content); `DELETE` removes the image;
 * the read side exposes `image_url` on the resource.
 */

export const RESOURCE_IMAGE_ACCEPT = 'image/jpeg,image/png,image/gif,image/webp';
export const RESOURCE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const RESOURCE_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

export type ResourceImageResource = 'rooms' | 'stations' | 'benches' | 'equipment' | 'licenses';

/** Returns a user-facing message when the file cannot be uploaded, otherwise `null`. */
export function validateResourceImage(file: Pick<File, 'type' | 'size'>): string | null {
  if (!RESOURCE_IMAGE_TYPES.has(file.type)) return 'Choose a JPG, PNG, GIF or WEBP image.';
  if (file.size > RESOURCE_IMAGE_MAX_BYTES) return 'Image must be smaller than 5 MB.';
  return null;
}

export function resourceImageUrl(resource: ResourceImageResource, id: number): string {
  return `/api/labs/${resource}/${id}/image`;
}

export function resourceImageFormData(file: File): FormData {
  const body = new FormData();
  body.append('file', file);
  return body;
}
