import { normalizeHtmlContent, stripHtml } from '@/shared/utils/html';

describe('html utils', () => {
  it('normalizes empty rich text editor markup to an empty string', () => {
    expect(normalizeHtmlContent('<p><br></p>')).toBe('');
    expect(normalizeHtmlContent('<p>&nbsp;</p>')).toBe('');
    expect(normalizeHtmlContent('<div><br /></div>')).toBe('');
  });

  it('keeps meaningful rich text markup intact', () => {
    expect(normalizeHtmlContent('<p>Today felt calm.</p>')).toBe('<p>Today felt calm.</p>');
    expect(stripHtml('<p>Today felt calm.</p>')).toBe('Today felt calm.');
  });
});
