import { config } from '@/config/ConfigService';
import { useAppStore } from '@/stores/useAppStore';
import { failure, success } from '@/shared/utils/result';
import type { Result } from '@/shared/types/architecture';

export interface AiSummaryResponse {
  readonly summary: string;
}

export interface LabeledAiSummary extends AiSummaryResponse {
  readonly isAiGenerated: true;
  readonly label: 'AI-generated summary';
}

export type RemoteSummaryRequest = (input: { content: string; headers: { 'X-Zero-Data-Retention': 'true' } }) => Promise<AiSummaryResponse>;

export class RemoteAiSummaryService {
  public async summarize(content: string, request: RemoteSummaryRequest): Promise<Result<LabeledAiSummary>> {
    if (!useAppStore.getState().remoteAiConsent) {
      return failure({ code: 'AI_CONSENT_REQUIRED', message: 'Remote AI summaries require explicit consent.' });
    }
    if (!config.remoteAiBaseUrl || !config.remoteAiBaseUrl.startsWith('https://') || !config.remoteAiZdrConfigured) {
      return failure({ code: 'AI_ZDR_NOT_CONFIGURED', message: 'Remote AI is unavailable without an HTTPS ZDR-configured endpoint.' });
    }
    if (!content.trim()) {
      return failure({ code: 'AI_CONTENT_REQUIRED', message: 'Summary content cannot be empty.' });
    }
    const response = await request({ content, headers: { 'X-Zero-Data-Retention': 'true' } });
    return success({ ...response, isAiGenerated: true, label: 'AI-generated summary' });
  }
}

export const remoteAiSummaryService = new RemoteAiSummaryService();
