import type { EvaluationResult } from './contracts.ts';
import type { EvaluationCounts, PersistedTurn } from './history.ts';

export type SessionEvidenceItem = {
  turn: number;
  status: EvaluationResult['status'];
  excerpt: string;
  finding: string;
};

export type SessionGapItem = {
  turn: number;
  status: EvaluationResult['status'];
  gap: string;
};

export type LearningSessionEvidenceSummary = {
  answeredTurns: number;
  statusCounts: EvaluationCounts;
  evidence: SessionEvidenceItem[];
  unresolvedGaps: SessionGapItem[];
  helpSteps: number;
  revisedJudgments: number;
  nextQuestion: string | null;
};

function latestDistinct<T>(
  items: T[],
  key: (item: T) => string,
  limit: number,
): T[] {
  const selected: T[] = [];
  const seen = new Set<string>();
  for (let index = items.length - 1; index >= 0; index -= 1) {
    const item = items[index];
    const itemKey = key(item).trim().toLocaleLowerCase();
    if (seen.has(itemKey)) continue;
    seen.add(itemKey);
    selected.unshift(item);
    if (selected.length === limit) break;
  }
  return selected;
}

export function summarizeLearningSession(
  turns: PersistedTurn[],
): LearningSessionEvidenceSummary {
  const statusCounts: EvaluationCounts = {
    demonstrated: 0,
    partial: 0,
    misconception: 0,
    uncertain: 0,
  };
  const evidence: SessionEvidenceItem[] = [];
  const unresolvedGaps: SessionGapItem[] = [];
  let answeredTurns = 0;
  let helpSteps = 0;
  let revisedJudgments = 0;

  for (const turn of turns) {
    helpSteps += turn.help.length;
    revisedJudgments += Math.max(0, turn.evaluationHistory.length - 1);
    if (turn.answer !== null) answeredTurns += 1;
    if (!turn.evaluation) continue;

    statusCounts[turn.evaluation.status] += 1;
    turn.evaluation.evidence.forEach((item) => {
      evidence.push({
        turn: turn.turn,
        status: turn.evaluation!.status,
        excerpt: item.excerpt,
        finding: item.finding,
      });
    });
    unresolvedGaps.push({
      turn: turn.turn,
      status: turn.evaluation.status,
      gap: turn.evaluation.unresolvedGap,
    });
  }

  const unansweredQuestion = turns.find((turn) => turn.answer === null);
  let lastEvaluation: EvaluationResult | null = null;
  for (const turn of turns) {
    if (turn.evaluation) lastEvaluation = turn.evaluation;
  }

  return {
    answeredTurns,
    statusCounts,
    evidence: latestDistinct(evidence, (item) => item.finding, 5),
    unresolvedGaps: latestDistinct(unresolvedGaps, (item) => item.gap, 4),
    helpSteps,
    revisedJudgments,
    nextQuestion:
      unansweredQuestion?.question ?? lastEvaluation?.nextQuestion ?? null,
  };
}
