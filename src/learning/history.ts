import type { EvaluationResult } from './contracts.ts';

export type PersistedSessionStatus = 'active' | 'ended';

export type PersistedTurn = {
  questionId: string;
  turn: number;
  question: string;
  intent: string;
  answer: string | null;
  evaluation: EvaluationResult | null;
};

export type PersistedLearningSession = {
  id: string;
  topic: string;
  status: PersistedSessionStatus;
  startedAt: string;
  updatedAt: string;
  endedAt: string | null;
  currentQuestionId: string;
  turns: PersistedTurn[];
};

export type EvaluationCounts = Record<EvaluationResult['status'], number>;

export type LearningSessionSummary = {
  id: string;
  topic: string;
  status: PersistedSessionStatus;
  startedAt: string;
  updatedAt: string;
  endedAt: string | null;
  answeredTurns: number;
  totalQuestions: number;
  evaluationCounts: EvaluationCounts;
};
