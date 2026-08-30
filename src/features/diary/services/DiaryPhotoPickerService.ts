import type { ImagePickerAsset, ImagePickerOptions } from 'expo-image-picker';

type ImagePickerModule = typeof import('expo-image-picker');
type DiaryPhotoPickerError = 'native-module-missing' | 'camera-permission-denied' | 'library-permission-denied';
type DiaryPhotoPickerResult =
  | { readonly success: true; readonly assets: ImagePickerAsset[] }
  | { readonly success: false; readonly error: DiaryPhotoPickerError };
type DiaryPhotoLibrarySelectionMode = 'single' | 'multiple';

async function loadImagePicker(): Promise<ImagePickerModule | null> {
  try {
    return await import('expo-image-picker');
  } catch {
    return null;
  }
}

export async function takeDiaryPhoto(): Promise<DiaryPhotoPickerResult> {
  const ImagePicker = await loadImagePicker();
  if (!ImagePicker) return { success: false, error: 'native-module-missing' };
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return { success: false, error: 'camera-permission-denied' };
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 0.85,
    allowsEditing: false,
    exif: false,
  });
  return result.canceled ? { success: true, assets: [] } : { success: true, assets: result.assets };
}

export function getDiaryPhotoLibraryPickerOptions(mode: DiaryPhotoLibrarySelectionMode): ImagePickerOptions {
  return {
    mediaTypes: ['images'],
    quality: 0.85,
    allowsEditing: false,
    allowsMultipleSelection: mode === 'multiple',
    exif: false,
  };
}

export function getSingleDiaryPhotoAsset(assets: readonly ImagePickerAsset[]): ImagePickerAsset[] {
  return assets.slice(0, 1);
}

export async function chooseDiaryPhotos(): Promise<DiaryPhotoPickerResult> {
  const ImagePicker = await loadImagePicker();
  if (!ImagePicker) return { success: false, error: 'native-module-missing' };
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync(false);
  if (!permission.granted) return { success: false, error: 'library-permission-denied' };
  const result = await ImagePicker.launchImageLibraryAsync(getDiaryPhotoLibraryPickerOptions('multiple'));
  return result.canceled ? { success: true, assets: [] } : { success: true, assets: result.assets };
}

export async function chooseDiaryPhoto(): Promise<DiaryPhotoPickerResult> {
  const ImagePicker = await loadImagePicker();
  if (!ImagePicker) return { success: false, error: 'native-module-missing' };
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync(false);
  if (!permission.granted) return { success: false, error: 'library-permission-denied' };
  const result = await ImagePicker.launchImageLibraryAsync(getDiaryPhotoLibraryPickerOptions('single'));
  return result.canceled ? { success: true, assets: [] } : { success: true, assets: getSingleDiaryPhotoAsset(result.assets) };
}
