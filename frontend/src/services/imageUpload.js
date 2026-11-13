import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../config/supabase';

const IMAGE_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export async function uploadImage({ bucket, path, asset }) {
  if (!asset?.uri) throw new Error('No se encontró el archivo de imagen seleccionado.');

  const contentType = asset.mimeType || 'image/jpeg';
  const extension = IMAGE_TYPES[contentType];
  if (!extension) throw new Error('El formato de imagen no es compatible. Usa JPG, PNG, WEBP o GIF.');

  const filePath = `${path}.${extension}`;
  const bytes = await new File(asset.uri).arrayBuffer();
  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, bytes, { contentType, upsert: true });

  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

export async function selectImage() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Necesitas permitir el acceso a tus fotos para seleccionar una imagen.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
  return result.canceled ? null : result.assets?.[0] || null;
}
