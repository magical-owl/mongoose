import { resolveImportedProfilePhotoUri } from '@/features/profile/services/ProfilePhotoService';

describe('ProfilePhotoService', () => {
  it('resolves imported profile photo filenames from the document directory', () => {
    expect(resolveImportedProfilePhotoUri('file:///previous/profile-photos/avatar.jpg')).toBe('file://document/profile-photos/avatar.jpg');
  });

  it('resolves legacy diary photo avatar filenames from the document directory', () => {
    expect(resolveImportedProfilePhotoUri('file:///previous/diary-photos/avatar.jpg')).toBe('file://document/diary-photos/avatar.jpg');
  });

  it('leaves external photo uris unchanged', () => {
    expect(resolveImportedProfilePhotoUri('https://example.com/avatar.jpg')).toBe('https://example.com/avatar.jpg');
  });
});
