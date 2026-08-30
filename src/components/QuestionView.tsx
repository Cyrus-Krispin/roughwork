import type { FormEvent } from 'react';

type QuestionViewProps = {
  topic: string;
  turn: number;
  question: string;
  answer: string;
  busy: boolean;
  error: string;
  canRetry: boolean;
  onAnswerChange(answer: string): void;
  onSubmit(): Promise<void>;
  onRetry(): Promise<void>;
};

export function QuestionView({
  topic,
  turn,
  question,
  answer,
  busy,
  error,
  canRetry,
  onAnswerChange,
  onSubmit,
  onRetry,
}: QuestionViewProps) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!busy && answer.trim()) void onSubmit();
  }

  return (
    <main className="question-view">
      <div className="session-rail" aria-label="Session progress">
        <span>Question {String(turn).padStart(2, '0')}</span>
        <span>{topic}</span>
      </div>
      <section className="question-stage" aria-labelledby="active-question">
        <p className="kicker">Think it through in your own words</p>
        <h1 id="active-question">{question}</h1>
        <form className="answer-form" onSubmit={submit}>
          <label htmlFor="answer">Your explanation</label>
          <textarea
            id="answer"
            value={answer}
            onChange={(event) => onAnswerChange(event.target.value)}
            placeholder="Start with what you believe is happening. It is okay to be incomplete."
            rows={8}
            disabled={busy}
            autoFocus
          />
          <div className="answer-actions">
            <p>ThinkEdge will evaluate only what this answer demonstrates.</p>
            <button
              className="primary-button"
              type="submit"
              disabled={busy || !answer.trim()}
            >
              {busy ? 'Reading your reasoning…' : 'Review my answer'}
              {!busy && <span aria-hidden="true">→</span>}
            </button>
          </div>
        </form>
        {error && (
          <div className="error-banner" role="alert">
            <div>
              <strong>The connection broke, not your work.</strong>
              <p>{error}</p>
            </div>
            {canRetry && (
              <button type="button" onClick={() => void onRetry()}>
                Try again
              </button>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
