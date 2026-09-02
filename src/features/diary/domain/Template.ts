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
      'A simple way to remember what happened, what stayed with you, and how the day felt.',
    type: 'reflection',
    icon: '🌅',
    content: `<h3>What do I want to remember about today?</h3><p></p><h3>What felt different, small, or unexpected?</h3><p></p><h3>What did today teach me?</h3><p></p><h3>How did I feel as the day moved along?</h3>`,
  },
  gratitude: {
    id: 'gratitude',
    title: 'Gratitude Journal',
    description:
      'A quiet check-in with the good things that were easy to miss.',
    type: 'gratitude',
    icon: '💝',
    content: `<h3>Three things I am grateful for today</h3><p>1. </p><p>2. </p><p>3. </p><h3>Why did these matter to me?</h3><p></p><h3>What was one small moment I want to hold onto?</h3>`,
  },
  eveningReflection: {
    id: 'eveningReflection',
    title: 'Evening Reflection',
    description:
      'A steady end-of-day review for closing the day with more clarity.',
    type: 'reflection',
    icon: '✨',
    content: `<h3>What felt heavy today?</h3><p></p><h3>What did I handle well?</h3><p></p><h3>Where did I show care, patience, or honesty?</h3><p></p><h3>What would make tomorrow feel a little easier?</h3>`,
  },
  goalSetting: {
    id: 'goalSetting',
    title: 'Goal Setting',
    description:
      'A practical place to turn vague intentions into the next clear step.',
    type: 'planning',
    icon: '🚀',
    content: `<h3>What am I trying to move toward?</h3><p></p><h3>Why does this matter right now?</h3><p></p><h3>What is one realistic step I can take this week?</h3><p></p><h3>What might get in the way, and how can I prepare for it?</h3>`,
  },
  weeklyReview: {
    id: 'weeklyReview',
    title: 'Weekly Review',
    description:
      'A grounded review of what the week asked of you and what it gave back.',
    type: 'review',
    icon: '🌟',
    content: `<h3>What am I glad I made time for this week?</h3><p></p><h3>What was difficult, and what helped me get through it?</h3><p></p><h3>What pattern did I notice in myself?</h3><p></p><h3>What do I want to carry into next week?</h3>`,
  },
  creativeWriting: {
    id: 'creativeWriting',
    title: 'Creative Writing Prompts',
    description:
      'Open-ended prompts for writing with imagination, memory, and personal detail.',
    type: 'creative',
    icon: '🎨',
    content: `<h3>A place I remember clearly</h3><p></p><h3>A version of myself I have not met yet</h3><p></p><h3>A dream, image, or sentence that stayed with me</h3><p></p><h3>A day I would like to live slowly</h3>`,
  },
  moodTracker: {
    id: 'moodTracker',
    title: 'Mood & Emotion Tracker',
    description:
      'A focused emotional check-in for naming what is present without over-explaining it.',
    type: 'reflection',
    icon: '🌈',
    content: `<h3>What emotions were closest to the surface today?</h3><p></p><h3>Where did I feel them in my body?</h3><p></p><h3>What seemed to bring them up?</h3><p></p><h3>What did I need in those moments?</h3>`,
  },
  mindfulness: {
    id: 'mindfulness',
    title: 'Mindfulness Moment',
    description:
      'A short pause to notice your surroundings, your body, and your current state.',
    type: 'reflection',
    icon: '🌸',
    content: `<h3>Right now, I notice</h3><p></p><h3>What is my body asking for?</h3><p></p><h3>What can I soften, release, or accept for now?</h3>`,
  },
};

export const TEMPLATE_CATEGORIES: Record<string, string[]> = {
  'Daily Reflection': ['myDay', 'eveningReflection', 'moodTracker', 'mindfulness'],
  'Gratitude & Growth': ['gratitude', 'weeklyReview'],
  'Planning & Goals': ['goalSetting'],
  'Creative Writing': ['creativeWriting'],
};
