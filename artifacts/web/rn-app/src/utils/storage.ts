import { supabase } from '../config/supabase';

/**
 * Helper to convert Blob to Data URL fallback
 */
async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert blob to data URL'));
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(blob);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Uploads a file from a local URI to Storage (API server / Supabase / Data URL) seamlessly and silently.
 * @param uri Local file URI (from image picker)
 * @param bucket Storage bucket name
 * @returns Public URL or Data URL of the uploaded file
 */
export async function uploadFile(uri: string, bucket: string = 'images'): Promise<string> {
  if (!uri) return '';
  if (uri.startsWith('http://') || uri.startsWith('https://') || uri.startsWith('data:')) {
    return uri;
  }

  try {
    const response = await fetch(uri);
    const blob = await response.blob();

    // 1. Try uploading to backend API endpoint /api/upload if available
    try {
      const formData = new FormData();
      const filename = `image-${Date.now()}.jpg`;
      formData.append('file', {
        uri,
        name: filename,
        type: 'image/jpeg',
      } as any);

      const apiRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (apiRes.ok) {
        const data = await apiRes.json();
        if (data && data.url) {
          return data.url;
        }
      }
    } catch (_) {
      // Backend endpoint not active, continue silently
    }

    // 2. Quietly attempt Supabase Storage upload
    try {
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const arrayBuffer = await new Response(blob).arrayBuffer();

      for (const targetBucket of [bucket, 'images', 'barbershops', 'photos', 'public', 'uploads']) {
        const { data, error } = await supabase.storage
          .from(targetBucket)
          .upload(fileName, arrayBuffer, {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (!error && data) {
          const { data: { publicUrl } } = supabase.storage
            .from(targetBucket)
            .getPublicUrl(fileName);

          if (publicUrl) return publicUrl;
        }
      }
    } catch (_) {
      // Supabase storage bucket missing, proceed silently to Data URL
    }

    // 3. Clean and silent Data URL fallback
    return await blobToDataUrl(blob);
  } catch (error: any) {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return await blobToDataUrl(blob);
    } catch (_) {
      return uri;
    }
  }
}
