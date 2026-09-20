import type { ImagePickerAsset } from 'expo-image-picker';
import {
  getDiaryPhotoLibraryPickerOptions,
  getSingleDiaryPhotoAsset,
} from '@/features/diary/services/DiaryPhotoPickerService';

describe('DiaryPhotoPickerService', () => {
  it('configures single-photo library picking for cover and profile photos', () => {
    expect(getDiaryPhotoLibraryPickerOptions('single')).toEqual({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: false,
      allowsMultipleSelection: false,
      preferredAssetRepresentationMode: 'compatible',
      exif: false,
    });
  });

  it('keeps general diary photo picking in multi-selection mode', () => {
    expect(getDiaryPhotoLibraryPickerOptions('multiple')).toEqual({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: false,
      allowsMultipleSelection: true,
      preferredAssetRepresentationMode: 'compatible',
      exif: false,
    });
  });

  it('caps multi-photo selection when a remaining slot limit is provided', () => {
    expect(getDiaryPhotoLibraryPickerOptions('multiple', 2)).toEqual({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: false,
      allowsMultipleSelection: true,
      preferredAssetRepresentationMode: 'compatible',
      exif: false,
      selectionLimit: 2,
    });
  });

  it('defensively keeps only the first asset for single-photo flows', () => {
    const firstAsset = { uri: 'file:///one.jpg' } as ImagePickerAsset;
    const secondAsset = { uri: 'file:///two.jpg' } as ImagePickerAsset;

    expect(getSingleDiaryPhotoAsset([firstAsset, secondAsset])).toEqual([firstAsset]);
  });
});
