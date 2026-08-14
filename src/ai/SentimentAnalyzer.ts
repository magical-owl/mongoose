/**
 * Sentiment Analyzer
 *
 * Offline, privacy-safe emotion scoring engine.
 * No text is sent to any external service — all processing is on-device.
 *
 * Scores content across 8 emotion dimensions using weighted keyword matching,
 * then resolves to a stable mood key for storage and UI rendering.
 */

import type { MoodKey } from './Mood';

export type EmotionDimension =
  | 'joy'
  | 'sadness'
  | 'stress'
  | 'love'
  | 'excitement'
  | 'fatigue'
  | 'gratitude'
  | 'anger';

export interface EmotionScores {
  readonly joy: number;
  readonly sadness: number;
  readonly stress: number;
  readonly love: number;
  readonly excitement: number;
  readonly fatigue: number;
  readonly gratitude: number;
  readonly anger: number;
}

export type MoodLabel = MoodKey;

export interface SentimentResult {
  readonly mood: MoodLabel;
  readonly dominantEmotion: EmotionDimension;
  readonly scores: EmotionScores;
  readonly wordCount: number;
  readonly isShortEntry: boolean;
}

// ---------------------------------------------------------------------------
// Keyword dictionaries — weighted terms per dimension
// ---------------------------------------------------------------------------

const LEXICON: Record<EmotionDimension, string[]> = {
  joy: [
    'happy', 'happiness', 'joyful', 'wonderful', 'amazing', 'great', 'good',
    'fantastic', 'excellent', 'beautiful', 'lovely', 'delightful', 'cheerful',
    'pleased', 'thrilled', 'bliss', 'blissful', 'ecstatic', 'laugh', 'laughter',
    'smile', 'smiled', 'sunny', 'bright', 'fun', 'enjoy', 'enjoyed', 'enjoying',
    'blessed', 'glad', 'peaceful', 'content', 'satisfied', 'grateful',
  ],
  excitement: [
    'excited', 'exciting', 'thrilling', 'incredible', 'unbelievable', 'wow',
    'awesome', 'epic', 'can\'t wait', 'hyped', 'pumped', 'stoked', 'electric',
    'energized', 'inspired', 'motivated', 'ambitious', 'passionate', 'fired up',
    'exhilarating', 'breathtaking', 'adventure', 'new', 'start', 'began',
  ],
  love: [
    'love', 'loved', 'loving', 'miss', 'missed', 'missing', 'heart', 'dear',
    'care', 'cared', 'caring', 'hug', 'hugged', 'kiss', 'family', 'friend',
    'friends', 'together', 'connection', 'bonding', 'relationship', 'partner',
    'warmth', 'tender', 'affection', 'fond', 'cherish', 'adore', 'appreciate',
  ],
  gratitude: [
    'grateful', 'gratitude', 'thankful', 'thanks', 'thank you', 'appreciate',
    'appreciated', 'appreciation', 'blessed', 'fortune', 'fortunate', 'lucky',
    'privilege', 'privileged', 'gift', 'given', 'received', 'glad for',
    'tribute', 'honour', 'recognize',
  ],
  sadness: [
    'sad', 'sadness', 'unhappy', 'cry', 'cried', 'crying', 'tears', 'sob',
    'sobbing', 'heartbreak', 'heartbroken', 'grief', 'grieve', 'grieving',
    'loss', 'lost', 'lonely', 'loneliness', 'alone', 'isolated', 'empty',
    'hopeless', 'depressed', 'depression', 'melancholy', 'gloomy', 'sorrow',
    'miss', 'missed', 'wish things were different', 'hurt', 'pain',
  ],
  stress: [
    'stressed', 'stress', 'anxious', 'anxiety', 'worried', 'worry', 'worrying',
    'overwhelmed', 'overwhelming', 'pressure', 'deadline', 'busy', 'hectic',
    'chaotic', 'chaos', 'panic', 'panicking', 'nervous', 'tense', 'tension',
    'can\'t cope', 'too much', 'not enough time', 'behind', 'behind schedule',
    'burden', 'burdened', 'struggle', 'struggling', 'difficult', 'hard day',
  ],
  fatigue: [
    'tired', 'exhausted', 'exhaustion', 'drained', 'worn out', 'burnt out',
    'burnout', 'sleepy', 'sleep deprived', 'no energy', 'low energy', 'fatigued',
    'fatigue', 'need rest', 'need sleep', 'haven\'t slept', 'insomnia', 'heavy',
    'sluggish', 'lethargic', 'can\'t keep up', 'overworked', 'too much work',
  ],
  anger: [
    'angry', 'anger', 'furious', 'frustrated', 'frustration', 'annoyed',
    'irritated', 'irritating', 'rage', 'raging', 'mad', 'upset', 'outraged',
    'unfair', 'resentful', 'resentment', 'bitter', 'bitterness', 'hate',
    'hated', 'hating', 'fed up', 'sick of', 'cannot stand', 'disgusted',
  ],
};

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

function scoreContent(text: string): EmotionScores {
  const lower = text.toLowerCase();
  const scores: Record<EmotionDimension, number> = {
    joy: 0, sadness: 0, stress: 0, love: 0,
    excitement: 0, fatigue: 0, gratitude: 0, anger: 0,
  };

  for (const [dimension, keywords] of Object.entries(LEXICON) as [EmotionDimension, string[]][]) {
    for (const kw of keywords) {
      // Count occurrences — multi-word phrases count more
      const regex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = lower.match(regex);
      if (matches) {
        const weight = kw.includes(' ') ? 2 : 1; // phrases are stronger signals
        scores[dimension] += matches.length * weight;
      }
    }
  }

  return scores as EmotionScores;
}

function dominantEmotion(scores: EmotionScores): EmotionDimension {
  let top: EmotionDimension = 'joy';
  let topScore = -1;

  for (const [dim, score] of Object.entries(scores) as [EmotionDimension, number][]) {
    if (score > topScore) {
      topScore = score;
      top = dim;
    }
  }

  return top;
}

function resolveMood(dominant: EmotionDimension, scores: EmotionScores): MoodLabel {
  // Special combined cases
  const total = Object.values(scores).reduce((a, b) => a + b, 0);

  if (total === 0) return 'calm'; // No emotion detected

  switch (dominant) {
    case 'joy':       return 'happy';
    case 'excitement': return 'excited';
    case 'love':      return 'happy';
    case 'gratitude': return 'grateful';
    case 'sadness':   return 'sad';
    case 'stress':    return 'anxious';
    case 'fatigue':   return 'tired';
    case 'anger':     return 'angry';
    default:          return 'neutral';
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function analyzeSentiment(content: string): SentimentResult {
  const words = content.trim().split(/\s+/);
  const wordCount = words.length;
  const isShortEntry = wordCount < 20;

  const scores = scoreContent(content);
  const dominant = dominantEmotion(scores);
  const mood = resolveMood(dominant, scores);

  return { mood, dominantEmotion: dominant, scores, wordCount, isShortEntry };
}
