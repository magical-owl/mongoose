export interface Template {
  id: string;
  title: string;
  description: string;
  type: 'reflection' | 'gratitude' | 'planning' | 'review' | 'creative';
  icon: string;
  content: string; // HTML content for RichEditor
}

export const TEMPLATES: Record<string, Template> = {
  myDay: {
    id: 'myDay',
    title: 'My Day',
    description:
      'Comprehensive daily reflection to capture key events, emotions, and achievements. Perfect for analyzing your day and identifying growth opportunities.',
    type: 'reflection',
    icon: '🌅',
    content: `<h3>🌟 What was the best thing about today and why?</h3><p></p><h3>🎭 What interesting or unusual things happened today?</h3><p></p><h3>📚 What did I learn today?</h3><p></p><h3>💖 How did I feel throughout the day?</h3>`,
  },
  gratitude: {
    id: 'gratitude',
    title: 'Gratitude Journal',
    description:
      "Focused gratitude practice to recognize and appreciate life's positive aspects. Regular gratitude improves mental health and well-being.",
    type: 'gratitude',
    icon: '💝',
    content: `<h3>🌟 Three things I'm grateful for today:</h3><p>1. </p><p>2. </p><p>3. </p><h3>🙌 Why am I grateful for these things?</h3><p></p><h3>😊 What made me smile today?</h3>`,
  },
  eveningReflection: {
    id: 'eveningReflection',
    title: 'Evening Reflection',
    description:
      'Peaceful end-of-day reflection to process events, celebrate achievements, and release stress.',
    type: 'reflection',
    icon: '✨',
    content: `<h3>🌟 What challenged me today?</h3><p></p><h3>🏆 What am I proud of accomplishing?</h3><p></p><h3>💝 How did I show kindness to others?</h3><p></p><h3>🌙 What am I looking forward to tomorrow?</h3>`,
  },
  goalSetting: {
    id: 'goalSetting',
    title: 'Goal Setting',
    description:
      'Strategic goal-setting template to define clear objectives and create actionable plans.',
    type: 'planning',
    icon: '🚀',
    content: `<h3>🎯 Short-term goals (next week):</h3><p></p><h3>🏆 Long-term goals (next 3-6 months):</h3><p></p><h3>📋 What steps can I take this week to move toward these goals?</h3>`,
  },
  weeklyReview: {
    id: 'weeklyReview',
    title: 'Weekly Review',
    description:
      'Comprehensive weekly reflection to assess progress, celebrate wins, and learn from challenges.',
    type: 'review',
    icon: '🌟',
    content: `<h3>🏆 What were my biggest accomplishments this week?</h3><p></p><h3>💪 What challenges did I face and how did I overcome them?</h3><p></p><h3>📚 What did I learn this week?</h3><p></p><h3>🎭 What am I most excited about for next week?</h3>`,
  },
  creativeWriting: {
    id: 'creativeWriting',
    title: 'Creative Writing Prompts',
    description:
      'Inspiring creative writing prompts to unlock imagination and storytelling abilities.',
    type: 'creative',
    icon: '🎨',
    content: `<h3>🦸‍♀️ If I could have any superpower for one day, it would be...</h3><p></p><h3>🌙 The most interesting dream I've had recently was...</h3><p></p><h3>⏰ If I could travel anywhere in time, I would go to...</h3><p></p><h3>🌈 My ideal perfect day would look like...</h3>`,
  },
  moodTracker: {
    id: 'moodTracker',
    title: 'Mood & Emotion Tracker',
    description:
      'Detailed emotional awareness template to track, understand, and learn from emotional patterns.',
    type: 'reflection',
    icon: '🌈',
    content: `<h3>📊 Today's mood rating (1-10):</h3><p></p><h3>🎭 What emotions did I experience today?</h3><p></p><h3>⚡ What triggered these emotions?</h3><p></p><h3>💪 How did I respond to challenging emotions?</h3>`,
  },
  mindfulness: {
    id: 'mindfulness',
    title: 'Mindfulness Moment',
    description:
      'Guided mindfulness practice to cultivate present-moment awareness and peacefulness.',
    type: 'reflection',
    icon: '🌸',
    content: `<h3>👀 Right now, I notice:</h3><p></p><h3>🌸 What am I grateful for in this moment?</h3><p></p><h3>🧘 How does this present moment feel?</h3>`,
  },
};

export const TEMPLATE_CATEGORIES: Record<string, string[]> = {
  'Daily Reflection': ['myDay', 'eveningReflection', 'moodTracker', 'mindfulness'],
  'Gratitude & Growth': ['gratitude', 'weeklyReview'],
  'Planning & Goals': ['goalSetting'],
  'Creative Writing': ['creativeWriting'],
};
