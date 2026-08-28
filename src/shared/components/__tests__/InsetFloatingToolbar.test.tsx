import { Text } from 'react-native';
import { InsetFloatingToolbar } from '@shared/components/InsetFloatingToolbar';
import { renderWithProviders } from '@tests/helpers';

describe('InsetFloatingToolbar', () => {
  it('renders content and trailing content', async () => {
    const { getByText } = await renderWithProviders(
      <InsetFloatingToolbar bottom={12} trailing={<Text>3w</Text>}>
        <Text>Tools</Text>
      </InsetFloatingToolbar>,
    );

    expect(getByText('Tools')).toBeTruthy();
    expect(getByText('3w')).toBeTruthy();
  });
});
