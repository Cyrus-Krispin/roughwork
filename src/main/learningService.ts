import type {
  DiagnosticQuestion,
  EvaluationResult,
  HelpLevel,
  HelpResponse,
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
  createHelpResponse(context: {
    topic: string;
    question: string;
    level: HelpLevel;
    priorHelp: HelpResponse[];
  }): Promise<HelpResponse>;
  reconsiderEvaluation(context: {
    topic: string;
    question: string;
    answer: string;
    evaluation: EvaluationResult;
    rationale: string;
  }): Promise<EvaluationResult>;
};

type HelpInput = {
  requestId: string;
  sessionId: string;
  questionId: string;
  level: HelpLevel;
};
type ChallengeInput = {
  requestId: string;
  sessionId: string;
  questionId: string;
  evaluationId: string;
  rationale: string;
};

type SubmitAttemptInput = {
  sessionId: string;
  questionId: string;
  answer: string;
};

type AcknowledgeFeedbackInput = {
  sessionId: string;
  questionId: string;
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

    if (session.pendingFeedbackQuestionId) {
      throw new Error('Feedback must be acknowledged before continuing.');
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

  async requestHelp(input: HelpInput): Promise<PersistedLearningSession> {
    const acknowledged = this.repository.findSessionByHelpRequest(
      input.requestId,
    );
    if (acknowledged) return acknowledged;
    const session = this.repository.getSession(input.sessionId);
    if (
      !session ||
      session.status !== 'active' ||
      session.pendingFeedbackQuestionId ||
      session.currentQuestionId !== input.questionId
    )
      throw new Error('The question is not current for this learning session.');
    const turn = session.turns.find(
      (item) => item.questionId === input.questionId,
    )!;
    const levels: HelpLevel[] = [
      'rephrase',
      'smaller_question',
      'hint',
      'partial_example',
      'direct_explanation',
    ];
    const previous = turn.help.at(-1)?.level;
    const allowed = previous
      ? [previous, levels[levels.indexOf(previous) + 1]].filter(Boolean)
      : ['rephrase'];
    if (!allowed.includes(input.level))
      throw new Error('This help level is not available yet.');
    const response = await this.createProvider().createHelpResponse({
      topic: session.topic,
      question: turn.question,
      level: input.level,
      priorHelp: turn.help.map(
        ({ level, content }) => ({ level, content }) as HelpResponse,
      ),
    });
    return this.repository.recordHelp({ ...input, response });
  }

  async challengeEvaluation(
    input: ChallengeInput,
  ): Promise<PersistedLearningSession> {
    const acknowledged = this.repository.findSessionByChallengeRequest(
      input.requestId,
    );
    if (acknowledged) return acknowledged;
    const session = this.repository.getSession(input.sessionId);
    const turn = session?.turns.find(
      (item) => item.questionId === input.questionId,
    );
    const latest = turn?.evaluationHistory.at(-1);
    if (
      !session ||
      session.status !== 'active' ||
      session.pendingFeedbackQuestionId !== input.questionId ||
      !turn?.answer ||
      !latest ||
      latest.id !== input.evaluationId
    )
      throw new Error('The challenged evaluation is stale.');
    const evaluation = await this.createProvider().reconsiderEvaluation({
      topic: session.topic,
      question: turn.question,
      answer: turn.answer,
      evaluation: latest.evaluation,
      rationale: input.rationale,
    });
    return this.repository.recordChallenge({ ...input, evaluation });
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

  acknowledgeFeedback(
    input: AcknowledgeFeedbackInput,
  ): PersistedLearningSession {
    return this.repository.acknowledgeFeedback(
      input.sessionId,
      input.questionId,
    );
  }

  deleteSession(sessionId: string): boolean {
    return this.repository.deleteSession(sessionId);
  }
}
