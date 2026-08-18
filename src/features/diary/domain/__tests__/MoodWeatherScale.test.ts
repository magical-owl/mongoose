import { getManualMoodWeatherScore, MANUAL_MOOD_WEATHER_OPTIONS } from '@/features/diary/domain/DiaryEntry';

describe('manual mood weather scale', () => {
  it('exposes five selectable weather states', () => {
    expect(MANUAL_MOOD_WEATHER_OPTIONS).toEqual(['sunny', 'calm', 'neutral', 'cloudy', 'stormy']);
  });

  it('maps weather to signed scores', () => {
    expect(getManualMoodWeatherScore('stormy')).toBe(-2);
    expect(getManualMoodWeatherScore('cloudy')).toBe(-1);
    expect(getManualMoodWeatherScore('neutral')).toBe(0);
    expect(getManualMoodWeatherScore('calm')).toBe(1);
    expect(getManualMoodWeatherScore('sunny')).toBe(2);
  });
});
