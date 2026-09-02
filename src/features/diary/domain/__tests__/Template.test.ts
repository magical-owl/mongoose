import { TEMPLATES } from '@/features/diary/domain/Template';

describe('Templates', () => {
  it('keeps writing templates grounded and ready for editor insertion', () => {
    const templateList = Object.values(TEMPLATES);

    expect(templateList).toHaveLength(8);
    for (const template of templateList) {
      expect(template.content).toContain('<h3>');
      expect(template.content).toContain('</h3>');
      expect(template.description).not.toMatch(/comprehensive|perfect for|unlock|improves|strategic/i);
      expect(template.content).not.toMatch(/🌟|🎭|📚|💖|🏆|🚀|🌈/u);
    }
  });
});
