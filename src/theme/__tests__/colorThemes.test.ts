import { colorThemes } from '@/theme/colorThemes';

describe('color themes', () => {
  it('defines a usable preview and label for every theme', () => {
    Object.values(colorThemes).forEach((theme) => {
      expect(theme.label).toBeTruthy();
      expect(theme.preview).toMatch(/^#[0-9A-F]{6}$/i);
      expect(theme.light).toBeDefined();
      expect(theme.dark).toBeDefined();
    });
  });

  it('includes the warm palette used by the reference design', () => {
    expect(colorThemes.amber.dark.background).toBe('#15120E');
    expect(colorThemes.amber.dark.text).toBe('#F5E9C9');
    expect(colorThemes.amber.dark.surface).toBe('#2A2318');
  });
});
