import React, { useState } from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { ManualMoodPicker } from '@/features/diary/components/ManualMoodPicker';
import type { ManualMood } from '@/features/diary/domain/DiaryEntry';
import { renderWithProviders } from '@tests/helpers';

describe('ManualMoodPicker', () => {
  it('toggles multiple moods and keeps neutral exclusive', async () => {
    const onChangeValues = jest.fn();

    function StatefulPicker(): React.JSX.Element {
      const [values, setValues] = useState<ManualMood[]>(['neutral']);
      return (
        <ManualMoodPicker
          values={values}
          onChangeValues={(nextValues) => {
            setValues(nextValues);
            onChangeValues(nextValues);
          }}
          multiple
        />
      );
    }

    const { getByLabelText } = await renderWithProviders(<StatefulPicker />, { wrapperOptions: { initialThemeMode: 'dark' } });

    fireEvent.press(getByLabelText(/Happy emotion/i));
    expect(onChangeValues).toHaveBeenLastCalledWith(['happy']);
    await waitFor(() => expect(getByLabelText(/Happy emotion, selected/i)).toBeTruthy());

    fireEvent.press(getByLabelText(/Grateful emotion/i));
    expect(onChangeValues).toHaveBeenLastCalledWith(['happy', 'grateful']);
    await waitFor(() => expect(getByLabelText(/Grateful emotion, selected/i)).toBeTruthy());

    fireEvent.press(getByLabelText(/Neutral emotion/i));
    expect(onChangeValues).toHaveBeenLastCalledWith(['neutral']);
  });
});
