import type { DiagnosticQuestion, EvaluationResult } from './contracts.ts';

export type LearningSessionStatus =
  | 'idle'
  | 'loading_question'
  | 'answering'
  | 'evaluating'
  | 'feedback'
  | 'error'
  | 'ended';

export type LearningSession = {
  status: LearningSessionStatus;
  topic: string;
  currentQuestion: string;
  questionIntent: string;
  answer: string;
  evaluation: EvaluationResult | null;
  turn: number;
  errorMessage: string;
  retryStatus: 'loading_question' | 'evaluating' | null;
};

export type LearningSessionEvent =
  | { type: 'start'; topic: string }
  | { type: 'question_received'; question: DiagnosticQuestion }
  | { type: 'answer_changed'; answer: string }
  | { type: 'submit' }
  | { type: 'evaluation_received'; evaluation: EvaluationResult }
  | { type: 'request_failed'; message: string }
  | { type: 'retry' }
  | { type: 'continue' }
  | { type: 'end' }
  | { type: 'restart' };

export const initialLearningSession: LearningSession = {
  status: 'idle',
  topic: '',
  currentQuestion: '',
  questionIntent: '',
  answer: '',
  evaluation: null,
  turn: 1,
  errorMessage: '',
  retryStatus: null,
};

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
    case 'continue':
      if (state.status !== 'feedback' || !state.evaluation) return state;
      return {
        ...state,
        status: 'answering',
        currentQuestion: state.evaluation.nextQuestion,
        questionIntent: state.evaluation.nextQuestionRationale,
        answer: '',
        evaluation: null,
        turn: state.turn + 1,
      };
    case 'end':
      return { ...state, status: 'ended', errorMessage: '', retryStatus: null };
    case 'restart':
      return initialLearningSession;
  }
}
