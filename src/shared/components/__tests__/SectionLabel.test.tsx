import { SectionLabel } from '@shared/components/SectionLabel';
import { renderWithProviders } from '@tests/helpers';

describe('SectionLabel', () => {
  it('renders uppercase label text', async () => {
    const { getByText } = await renderWithProviders(<SectionLabel>Mood</SectionLabel>);

    expect(getByText('MOOD')).toBeTruthy();
  });
});
