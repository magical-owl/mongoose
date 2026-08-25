import { normalizeDiaryTag, normalizeDiaryTags, toggleDiaryTagSelection } from '../DiaryTagService';

describe('DiaryTagService', () => {
  it('normalizes a single tag for stable matching', () => {
    expect(normalizeDiaryTag('  ##Morning   Pages  ')).toBe('morning pages');
  });

  it('removes empty and duplicate tags', () => {
    expect(normalizeDiaryTags(['Work', '#work', ' ', 'Personal'])).toEqual(['work', 'personal']);
  });

  it('toggles tags without duplicating equivalent values', () => {
    expect(toggleDiaryTagSelection(['work'], '#WORK')).toEqual([]);
    expect(toggleDiaryTagSelection(['work'], 'Ideas')).toEqual(['work', 'ideas']);
  });
});
