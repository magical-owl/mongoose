import { ProfilePhotoService, resolveImportedProfilePhotoUri } from '@/features/profile/services/ProfilePhotoService';

const fileSystem = jest.requireMock('expo-file-system') as {
  __deletedUris: string[];
};

describe('ProfilePhotoService', () => {
  beforeEach(() => {
    fileSystem.__deletedUris.length = 0;
  });

  it('resolves imported profile photo filenames from the document directory', () => {
    expect(resolveImportedProfilePhotoUri('file:///previous/profile-photos/avatar.jpg')).toBe('file://document/profile-photos/avatar.jpg');
  });

  it('resolves legacy diary photo avatar filenames from the document directory', () => {
    expect(resolveImportedProfilePhotoUri('file:///previous/diary-photos/avatar.jpg')).toBe('file://document/diary-photos/avatar.jpg');
  });

  it('leaves external photo uris unchanged', () => {
    expect(resolveImportedProfilePhotoUri('https://example.com/avatar.jpg')).toBe('https://example.com/avatar.jpg');
  });

  it('clears imported profile photos from the document directory', async () => {
    const service = new ProfilePhotoService();

    await service.clearImportedProfilePhotos();

    expect(fileSystem.__deletedUris).toContain('file://document/profile-photos');
  });
});
