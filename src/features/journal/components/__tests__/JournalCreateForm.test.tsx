import { act, fireEvent } from '@testing-library/react-native';
import { JournalCreateForm } from '@/features/journal/components/JournalCreateForm';
import { BUILTIN_JOURNAL_BACKGROUNDS } from '@/features/journal/domain/JournalBackgrounds';
import { renderWithProviders } from '@tests/helpers';

describe('JournalCreateForm', () => {
  it('submits title, description, and selected cover metadata', async () => {
    const onSubmit = jest.fn();
    const background = BUILTIN_JOURNAL_BACKGROUNDS.find((item) => item.id === 'winter');
    expect(background).toBeDefined();
    if (!background) return;
    const { getByTestId } = await renderWithProviders(
      <JournalCreateForm
        submitLabel="Create Journal"
        onSubmit={onSubmit}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    await act(async () => {
      fireEvent.changeText(getByTestId('journal-create-title-input'), 'Summer Trip');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('journal-create-description-input'), 'Beach notes and photos.');
    });
    await act(async () => {
      fireEvent.press(getByTestId(`journal-create-cover-option-${background.id}`));
    });
    await act(async () => {
      fireEvent.press(getByTestId('journal-create-submit-button'));
    });

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Summer Trip',
      description: 'Beach notes and photos.',
      coverImageUri: background.uri,
      coverImageWidth: background.width,
      coverImageHeight: background.height,
    });
  });

  it('prefills existing journal details and can remove the cover before saving', async () => {
    const onSubmit = jest.fn();
    const background = BUILTIN_JOURNAL_BACKGROUNDS[0];
    expect(background).toBeDefined();
    if (!background) return;
    const { getByTestId, queryByTestId } = await renderWithProviders(
      <JournalCreateForm
        initialValues={{
          title: 'Weekend Notes',
          description: 'Quiet thoughts.',
          coverImageUri: background.uri,
          coverImageWidth: background.width,
          coverImageHeight: background.height,
        }}
        submitLabel="Save"
        onSubmit={onSubmit}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    expect(getByTestId('journal-create-title-input').props.value).toBe('Weekend Notes');
    expect(getByTestId('journal-create-description-input').props.value).toBe('Quiet thoughts.');
    expect(getByTestId('journal-create-cover-preview')).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByTestId('journal-create-remove-cover-button'));
    });
    await act(async () => {
      fireEvent.press(getByTestId('journal-create-submit-button'));
    });

    expect(queryByTestId('journal-create-cover-preview')).toBeNull();
    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Weekend Notes',
      description: 'Quiet thoughts.',
      coverImageUri: undefined,
      coverImageWidth: undefined,
      coverImageHeight: undefined,
    });
  });
});
