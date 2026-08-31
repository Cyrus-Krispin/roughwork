import type { EvaluationResult } from './contracts.ts';
import type { PersistedEvaluationRevision } from './history.ts';

const evaluationStatusLabels: Record<EvaluationResult['status'], string> = {
  demonstrated: 'Demonstrated',
  partial: 'Partial',
  misconception: 'Misconception',
  uncertain: 'Uncertain',
};

export function evaluationStatusLabel(
  status: EvaluationResult['status'],
): string {
  return evaluationStatusLabels[status];
}

export function presentEvaluationRevisions(
  history: PersistedEvaluationRevision[],
) {
  return history.map((revision, index) => ({
    ...revision,
    statusLabel: evaluationStatusLabel(revision.evaluation.status),
    latest: index === history.length - 1,
  }));
}

export function shouldShowHistoryRows(
  loading: boolean,
  error: string,
): boolean {
  return !loading && !error;
}
