import type { Result } from '@/shared/types/architecture';
import { DiaryEntry } from '../domain/DiaryEntry';
import { Sentiment } from '../domain/Sentiment';
import { CompanionType, COMPANION_OPTIONS } from '../domain/Companion';
import { IDiaryRepository } from '../repositories/IDiaryRepository';
import { diaryRepository } from '../repositories/DiaryRepository';
import { analyzeSentiment as scoreContent } from '@/ai/SentimentAnalyzer';
import { getCompanionResponse } from '@/ai/companionResponses';

export class DiaryService {
  constructor(private repo: IDiaryRepository = diaryRepository) {}

  public async getEntries(): Promise<Result<DiaryEntry[]>> {
    return await this.repo.getAll();
  }

  public async getEntryById(id: string): Promise<Result<DiaryEntry | null>> {
    return await this.repo.getById(id);
  }

  public async saveEntry(entry: DiaryEntry): Promise<Result<DiaryEntry>> {
    // Generate AI sentiment analysis if not present
    if (!entry.sentiment) {
      entry.sentiment = this.analyzeSentiment(entry.content, entry.companion);
    }
    return await this.repo.save(entry);
  }

  public async deleteEntry(id: string): Promise<Result<boolean>> {
    return await this.repo.delete(id);
  }

  /**
   * Generates AI Companion Sentiment Analysis.
   * All processing is on-device — no text is sent to any external service.
   * Per AGENTS.md: zero PII logging, zero external data transmission.
   */
  public analyzeSentiment(content: string, companionType: CompanionType): Sentiment {
    const companion = COMPANION_OPTIONS.find((c) => c.id === companionType) || COMPANION_OPTIONS[0]!;
    const sentimentResult = scoreContent(content);
    const response = getCompanionResponse(companionType, sentimentResult);

    return {
      mood: sentimentResult.mood,
      summary: `You wrote ${sentimentResult.wordCount} words today. ${sentimentResult.isShortEntry ? 'Even a short entry counts.' : 'A meaningful reflection.'}`,
      emotional_analysis: response.emotional_analysis,
      supportive_message: `${companion.name}: ${response.supportive_message}`,
      suggestion: response.suggestion,
    };
  }

  /**
   * Calculates writing streaks.
   */
  public calculateStreak(entries: DiaryEntry[]): { currentStreak: number; longestStreak: number } {
    if (entries.length === 0) return { currentStreak: 0, longestStreak: 0 };

    const uniqueDates = Array.from(new Set(entries.map((e) => e.date))).sort().reverse();
    let currentStreak = 0;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    let checkIndex = 0;
    if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
      currentStreak = 1;
      checkIndex = 1;
    }

    for (let i = checkIndex; i < uniqueDates.length; i++) {
      const prevDate = new Date(uniqueDates[i - 1]!);
      const currDate = new Date(uniqueDates[i]!);
      const diffDays = Math.round((prevDate.getTime() - currDate.getTime()) / (1000 * 3600 * 24));

      if (diffDays === 1) {
        currentStreak++;
      } else {
        break;
      }
    }

    return { currentStreak, longestStreak: Math.max(currentStreak, uniqueDates.length) };
  }
}

export const diaryService = new DiaryService();
