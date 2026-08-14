import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { DiaryEntry } from '@/features/diary/domain/DiaryEntry';
import type { JournalExtras } from '@/features/journal/domain/JournalExtras';
import { stripHtml } from '@/shared/utils/html';

export class AnnualMemoryBookService {
  public async create(year: number, entries: DiaryEntry[], extras: JournalExtras): Promise<string> {
    const selected = entries.filter((entry) => entry.date.startsWith(`${year}-`));
    const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width"><title>Meadow ${year}</title><style>body{font-family:Georgia,serif;max-width:760px;margin:40px auto;padding:0 24px;color:#24333b}article{border-top:1px solid #d8dee1;padding:24px 0}h1{font-size:36px}h2{margin-bottom:4px}.meta{color:#71808a}.tag{color:#1e90ff}</style></head><body><h1>My ${year} Memory Book</h1><p>${selected.length} memories · ${extras.chapters.length} chapters · ${extras.milestones.length} milestones</p>${selected.map((entry) => `<article><h2>${escapeHtml(entry.title)}</h2><div class="meta">${entry.date} · ${entry.manualMoodWeather}</div><p>${escapeHtml(stripHtml(entry.content))}</p></article>`).join('')}</body></html>`;
    const file = new File(Paths.cache, `meadow-memory-book-${year}.html`);
    file.create({ overwrite: true });
    file.write(html);
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: 'text/html' });
    return file.uri;
  }
}

function escapeHtml(value: string): string { return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character); }
export const annualMemoryBookService = new AnnualMemoryBookService();
