import { supabase } from '../config/supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

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

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, decode(base64), {
        contentType: 'image/jpeg',
      });

    if (error) {
      console.error('[Storage] Upload error:', error);
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error: any) {
    console.error('[Storage] uploadFile failed:', error.message);
    throw error;
  }
}
