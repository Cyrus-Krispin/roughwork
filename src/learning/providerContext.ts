import type { EvaluationResult } from './contracts.ts';

export type RecentLearningEvidence = {
  question: string;
  status: EvaluationResult['status'];
  evidenceFindings: string[];
  unresolvedGap: string;
};
