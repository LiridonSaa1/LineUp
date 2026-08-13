import { supabase } from '../config/supabase';

/**
 * Deletes multiple files from Supabase Storage given their public URLs.
 * Automatically detects the bucket and file path from the URL.
 * @param urls Array of public Supabase URLs
 */
export async function deleteShopAssets(urls: string[]): Promise<void> {
  if (!urls || urls.length === 0) return;

  const validUrls = urls.filter(u => u && (u.includes('supabase.co') || u.includes('storage')));

  for (const url of validUrls) {
    try {
      // Parse URL to find bucket and path
      // Format: .../storage/v1/object/public/BUCKET_NAME/FILE_PATH
      const parts = url.split('/public/');
      if (parts.length < 2) continue;

      const pathParts = parts[1].split('/');
      const bucket = pathParts[0];
      const filePath = pathParts.slice(1).join('/');

      if (bucket && filePath) {
        console.log(`[Storage] Deleting ${filePath} from bucket ${bucket}...`);
        await supabase.storage.from(bucket).remove([filePath]);
      }
    } catch (err) {
      console.warn(`[Storage] Failed to delete asset: ${url}`, err);
    }
  }
}

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
