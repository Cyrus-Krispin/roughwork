import type {
  DiagnosticQuestion,
  EvaluationResult,
} from '../learning/contracts.ts';
import type {
  LearningSessionSummary,
  PersistedLearningSession,
} from '../learning/history.ts';
import type { LearningSessionRepository } from './persistence/sessionRepository.ts';

type LearningProvider = {
  createDiagnosticQuestion(topic: string): Promise<DiagnosticQuestion>;
  evaluateAttempt(context: {
    topic: string;
    question: string;
    answer: string;
  }): Promise<EvaluationResult>;
};

type SubmitAttemptInput = {
  sessionId: string;
  questionId: string;
  answer: string;
};

export class LearningService {
  private readonly repository: LearningSessionRepository;
  private readonly createProvider: () => LearningProvider;

  constructor(
    repository: LearningSessionRepository,
    createProvider: () => LearningProvider,
  ) {
    this.repository = repository;
    this.createProvider = createProvider;
  }

  async startSession(topic: string): Promise<PersistedLearningSession> {
    const question =
      await this.createProvider().createDiagnosticQuestion(topic);
    return this.repository.createSession(topic, question);
  }

  async submitAttempt(
    input: SubmitAttemptInput,
  ): Promise<PersistedLearningSession> {
    const session = this.repository.getSession(input.sessionId);
    if (!session) throw new Error('Learning session not found.');
    const turn = session.turns.find(
      (item) => item.questionId === input.questionId,
    );
    if (!turn) throw new Error('Question not found in this learning session.');

    if (turn.answer !== null) {
      if (turn.answer !== input.answer) {
        throw new Error(
          'This question already has a different acknowledged answer.',
        );
      }
      return session;
    }

    if (session.status !== 'active') {
      throw new Error('Learning session is not active.');
    }
    if (session.currentQuestionId !== input.questionId) {
      throw new Error('The question is not current for this learning session.');
    }

    const evaluation = await this.createProvider().evaluateAttempt({
      topic: session.topic,
      question: turn.question,
      answer: input.answer,
    });
    return this.repository.recordEvaluation({ ...input, evaluation });
  }

  getSession(sessionId: string): PersistedLearningSession | null {
    return this.repository.getSession(sessionId);
  }

  listSessions(limit: number): LearningSessionSummary[] {
    return this.repository.listSessions(limit);
  }

  endSession(sessionId: string): PersistedLearningSession {
    return this.repository.endSession(sessionId);
  }

  deleteSession(sessionId: string): boolean {
    return this.repository.deleteSession(sessionId);
  }
}
