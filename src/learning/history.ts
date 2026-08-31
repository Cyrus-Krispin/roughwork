import type { EvaluationResult, HelpResponse } from './contracts.ts';

export type PersistedSessionStatus = 'active' | 'ended';

export type PersistedTurn = {
  questionId: string;
  turn: number;
  question: string;
  intent: string;
  answer: string | null;
  evaluation: EvaluationResult | null;
  evaluationHistory: PersistedEvaluationRevision[];
  help: PersistedHelpResponse[];
};

export type PersistedEvaluationRevision = {
  id: string;
  revision: number;
  evaluation: EvaluationResult;
  challengeRationale: string | null;
  createdAt: string;
};

export type PersistedHelpResponse = HelpResponse & {
  id: string;
  requestId: string;
  ordinal: number;
  createdAt: string;
};

export type PersistedLearningSession = {
  id: string;
  topic: string;
  status: PersistedSessionStatus;
  startedAt: string;
  updatedAt: string;
  endedAt: string | null;
  currentQuestionId: string;
  pendingFeedbackQuestionId: string | null;
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
