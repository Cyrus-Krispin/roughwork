import type { DiagnosticQuestion, EvaluationResult } from './contracts.ts';
import type { PersistedLearningSession, PersistedTurn } from './history.ts';

export type LearningSessionStatus =
  | 'idle'
  | 'loading_question'
  | 'answering'
  | 'evaluating'
  | 'feedback'
  | 'reviewing'
  | 'error'
  | 'ended';

export type LearningSession = {
  sessionId: string;
  questionId: string;
  nextQuestionId: string;
  status: LearningSessionStatus;
  topic: string;
  currentQuestion: string;
  questionIntent: string;
  answer: string;
  evaluation: EvaluationResult | null;
  turn: number;
  errorMessage: string;
  retryStatus: 'loading_question' | 'evaluating' | null;
  history: PersistedTurn[];
};

export type LearningSessionEvent =
  | { type: 'start'; topic: string }
  | { type: 'question_received'; question: DiagnosticQuestion }
  | { type: 'session_started'; session: PersistedLearningSession }
  | { type: 'session_loaded'; session: PersistedLearningSession }
  | {
      type: 'evaluation_persisted';
      session: PersistedLearningSession;
      submittedQuestionId: string;
    }
  | { type: 'session_ended'; session: PersistedLearningSession }
  | { type: 'feedback_acknowledged'; session: PersistedLearningSession }
  | { type: 'help_persisted'; session: PersistedLearningSession }
  | {
      type: 'challenge_persisted';
      session: PersistedLearningSession;
      questionId: string;
    }
  | { type: 'answer_changed'; answer: string }
  | { type: 'submit' }
  | { type: 'evaluation_received'; evaluation: EvaluationResult }
  | { type: 'request_failed'; message: string }
  | { type: 'retry' }
  | { type: 'end' }
  | { type: 'restart' };

export const initialLearningSession: LearningSession = {
  sessionId: '',
  questionId: '',
  nextQuestionId: '',
  status: 'idle',
  topic: '',
  currentQuestion: '',
  questionIntent: '',
  answer: '',
  evaluation: null,
  turn: 1,
  errorMessage: '',
  retryStatus: null,
  history: [],
};

function activeSessionState(
  session: PersistedLearningSession,
): LearningSession {
  if (session.pendingFeedbackQuestionId) {
    const feedbackTurn = session.turns.find(
      (item) => item.questionId === session.pendingFeedbackQuestionId,
    );
    if (!feedbackTurn?.answer || !feedbackTurn.evaluation) {
      throw new Error('Persisted session has incomplete pending feedback.');
    }
    return {
      ...initialLearningSession,
      sessionId: session.id,
      questionId: feedbackTurn.questionId,
      nextQuestionId: session.currentQuestionId,
      status: 'feedback',
      topic: session.topic,
      currentQuestion: feedbackTurn.question,
      questionIntent: feedbackTurn.intent,
      answer: feedbackTurn.answer,
      evaluation: feedbackTurn.evaluation,
      turn: feedbackTurn.turn,
      history: session.turns,
    };
  }
  const turn = session.turns.find(
    (item) => item.questionId === session.currentQuestionId,
  );
  if (!turn) throw new Error('Persisted session has no current question.');
  return {
    ...initialLearningSession,
    sessionId: session.id,
    questionId: turn.questionId,
    status: 'answering',
    topic: session.topic,
    currentQuestion: turn.question,
    questionIntent: turn.intent,
    turn: turn.turn,
    history: session.turns,
  };
}

export function learningSessionReducer(
  state: LearningSession,
  event: LearningSessionEvent,
): LearningSession {
  switch (event.type) {
    case 'start': {
      const topic = event.topic.trim();
      if (!topic) return state;
      return {
        ...initialLearningSession,
        status: 'loading_question',
        topic,
      };
    }
    case 'question_received':
      if (state.status !== 'loading_question') return state;
      return {
        ...state,
        status: 'answering',
        currentQuestion: event.question.question,
        questionIntent: event.question.intent,
        errorMessage: '',
        retryStatus: null,
      };
    case 'session_started':
      return activeSessionState(event.session);
    case 'session_loaded':
      if (event.session.status === 'active') {
        return activeSessionState(event.session);
      }
      return {
        ...initialLearningSession,
        sessionId: event.session.id,
        status: 'reviewing',
        topic: event.session.topic,
        turn: event.session.turns.length,
        history: event.session.turns,
      };
    case 'evaluation_persisted': {
      const submitted = event.session.turns.find(
        (item) => item.questionId === event.submittedQuestionId,
      );
      if (state.status !== 'evaluating' || !submitted?.evaluation) return state;
      return {
        ...state,
        status: 'feedback',
        evaluation: submitted.evaluation,
        nextQuestionId: event.session.currentQuestionId,
        history: event.session.turns,
      };
    }
    case 'session_ended':
      return {
        ...state,
        status: 'ended',
        errorMessage: '',
        retryStatus: null,
        history: event.session.turns,
      };
    case 'feedback_acknowledged':
      return activeSessionState(event.session);
    case 'help_persisted':
      return { ...state, history: event.session.turns };
    case 'challenge_persisted': {
      const turn = event.session.turns.find(
        (item) => item.questionId === event.questionId,
      );
      if (!turn?.evaluation) return state;
      return {
        ...state,
        status: 'feedback',
        evaluation: turn.evaluation,
        history: event.session.turns,
      };
    }
    case 'answer_changed':
      if (state.status !== 'answering' && state.status !== 'error')
        return state;
      return { ...state, answer: event.answer };
    case 'submit':
      if (
        (state.status !== 'answering' && state.status !== 'error') ||
        !state.currentQuestion ||
        !state.answer.trim()
      ) {
        return state;
      }
      return {
        ...state,
        status: 'evaluating',
        evaluation: null,
        errorMessage: '',
        retryStatus: null,
      };
    case 'evaluation_received':
      if (state.status !== 'evaluating') return state;
      return {
        ...state,
        status: 'feedback',
        evaluation: event.evaluation,
      };
    case 'request_failed':
      if (
        state.status !== 'loading_question' &&
        state.status !== 'evaluating'
      ) {
        return state;
      }
      return {
        ...state,
        status: 'error',
        errorMessage: event.message,
        retryStatus: state.status,
      };
    case 'retry':
      if (state.status !== 'error' || !state.retryStatus) return state;
      return {
        ...state,
        status: state.retryStatus,
        errorMessage: '',
      };
    case 'end':
      return { ...state, status: 'ended', errorMessage: '', retryStatus: null };
    case 'restart':
      return initialLearningSession;
  }
}
