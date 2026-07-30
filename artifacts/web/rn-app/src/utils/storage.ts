import { supabase } from '../config/supabase';

/**
 * Ensures a bucket exists or finds a valid public bucket for uploads.
 */
async function resolveBucket(preferredBucket: string): Promise<string> {
  const candidateBuckets = Array.from(new Set([preferredBucket, 'images', 'barbershops', 'photos', 'public', 'uploads']));

  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    if (buckets && buckets.length > 0) {
      // Return matching bucket if found
      const matched = buckets.find(b => candidateBuckets.includes(b.name) || b.name === preferredBucket);
      if (matched) return matched.name;
      // If any public bucket exists, return the first bucket
      return buckets[0].name;
    }
  } catch (e) {
    console.warn('[Storage] listBuckets failed, trying createBucket fallback:', e);
  }

  // Attempt auto-creating preferred bucket if listBuckets didn't return matches
  try {
    await supabase.storage.createBucket(preferredBucket, { public: true });
    return preferredBucket;
  } catch (err) {
    // Ignore error if bucket creation is forbidden or already exists
  }

  return preferredBucket;
}

/**
 * Uploads a file from a local URI to Supabase Storage
 * @param uri Local file URI (from image picker)
 * @param bucket Storage bucket name
 * @returns Public URL of the uploaded file
 */
export async function uploadFile(uri: string, bucket: string = 'images'): Promise<string> {
  try {
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
    const filePath = `${fileName}`;

    // Standard fetch converts local file URIs to Blob/ArrayBuffer seamlessly without expo-file-system deprecation warnings
    const response = await fetch(uri);
    const blob = await response.blob();
    const arrayBuffer = await new Response(blob).arrayBuffer();

    // Resolve active bucket name
    let targetBucket = await resolveBucket(bucket);

    // Attempt upload
    let uploadResult = await supabase.storage
      .from(targetBucket)
      .upload(filePath, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    // If preferred bucket fails with "Bucket not found", auto-try candidates or auto-create
    if (uploadResult.error && (uploadResult.error.message.includes('not found') || (uploadResult.error as any).statusCode === '404' || (uploadResult.error as any).statusCode === 404)) {
      console.warn(`[Storage] Bucket '${targetBucket}' not found. Attempting to create bucket or try alternatives...`);

      // Try candidate bucket names
      for (const fallback of ['images', 'barbershops', 'photos', 'public', 'uploads']) {
        try {
          await supabase.storage.createBucket(fallback, { public: true });
        } catch (_) {}

        const fallbackResult = await supabase.storage
          .from(fallback)
          .upload(filePath, arrayBuffer, {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (!fallbackResult.error) {
          targetBucket = fallback;
          uploadResult = fallbackResult;
          break;
        }
      }
    }

    if (uploadResult.error) {
      console.error('[Storage] Upload error:', uploadResult.error);
      throw uploadResult.error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(targetBucket)
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error: any) {
    console.error('[Storage] uploadFile failed:', error.message || error);
    throw error;
  }
}
