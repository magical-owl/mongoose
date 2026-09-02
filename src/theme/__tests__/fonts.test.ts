import { appFontOptions, getAppFontLabel, normalizeAppFontFamily, resolveAppFontFamilyForWebContent } from '@/theme/fonts';

describe('app font options', () => {
  it('includes only documented bundled font choices', () => {
    expect(appFontOptions.map((option) => option.value)).toEqual([
      'system',
      'inter',
      'nunito',
      'lora',
      'merriweather',
      'sourceCodePro',
    ]);
    expect(appFontOptions.every((option) => option.license.length > 0)).toBe(true);
  });

  it('normalizes legacy font family preferences', () => {
    expect(normalizeAppFontFamily('serif')).toBe('lora');
    expect(normalizeAppFontFamily('monospace')).toBe('sourceCodePro');
    expect(normalizeAppFontFamily('unknown')).toBe('system');
  });

  it('returns the display label for a selected font', () => {
    expect(getAppFontLabel('merriweather')).toBe('Merriweather');
    expect(getAppFontLabel('serif')).toBe('Lora');
  });

  it('resolves WebView-safe font families for rich text editing', () => {
    expect(resolveAppFontFamilyForWebContent('lora')).toContain('Georgia');
    expect(resolveAppFontFamilyForWebContent('sourceCodePro')).toContain('monospace');
  });
});
