import { z } from 'zod';

import type { DiagnosticQuestion, EvaluationResult } from './contracts.ts';

const topicRequestSchema = z
  .object({
    topic: z.string().trim().min(2).max(160),
  })
  .strict();

const attemptRequestSchema = z
  .object({
    topic: z.string().trim().min(2).max(160),
    question: z.string().trim().min(10).max(320),
    answer: z.string().min(1).max(12_000),
  })
  .strict();

export type TopicRequest = z.infer<typeof topicRequestSchema>;
export type AttemptRequest = z.infer<typeof attemptRequestSchema>;

export type LearningError = {
  code: 'invalid_request' | 'not_configured' | 'provider_failed';
  message: string;
};

export type LearningResult<T> =
  { ok: true; data: T } | { ok: false; error: LearningError };

export type ThinkEdgeApi = {
  getProviderStatus(): Promise<{ configured: boolean; model: string }>;
  createDiagnosticQuestion(
    request: TopicRequest,
  ): Promise<LearningResult<DiagnosticQuestion>>;
  evaluateAttempt(
    request: AttemptRequest,
  ): Promise<LearningResult<EvaluationResult>>;
};

export function parseTopicRequest(value: unknown): TopicRequest {
  return topicRequestSchema.parse(value);
}

export function parseAttemptRequest(value: unknown): AttemptRequest {
  return attemptRequestSchema.parse(value);
}

export function toPublicLearningError(error: unknown): LearningError {
  if (
    error instanceof Error &&
    error.message.startsWith('DeepSeek is not configured.')
  ) {
    return {
      code: 'not_configured',
      message:
        'DeepSeek is not configured. Add DEEPSEEK_API_KEY to your local .env file, then restart ThinkEdge.',
    };
  }

  if (error instanceof z.ZodError) {
    return {
      code: 'invalid_request',
      message: 'This learning step contains invalid or incomplete information.',
    };
  }

  return {
    code: 'provider_failed',
    message:
      'DeepSeek could not complete this step. Your answer is still here; please try again.',
  };
}
