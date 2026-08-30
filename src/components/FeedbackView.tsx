import type { EvaluationResult } from '../learning/contracts.ts';

type FeedbackViewProps = {
  topic: string;
  turn: number;
  question: string;
  answer: string;
  evaluation: EvaluationResult;
  onContinue(): void;
  onEnd(): void;
};

const statusLabels: Record<EvaluationResult['status'], string> = {
  demonstrated: 'Demonstrated',
  partial: 'Partially demonstrated',
  misconception: 'Misconception surfaced',
  uncertain: 'Needs clarification',
};

export function FeedbackView({
  topic,
  turn,
  question,
  answer,
  evaluation,
  onContinue,
  onEnd,
}: FeedbackViewProps) {
  return (
    <main className="feedback-view">
      <div className="session-rail" aria-label="Session progress">
        <span>Review {String(turn).padStart(2, '0')}</span>
        <span>{topic}</span>
      </div>
      <section className="feedback-stage" aria-labelledby="feedback-heading">
        <div className="feedback-title-row">
          <div>
            <p className="kicker">What your answer shows</p>
            <h1 id="feedback-heading">{statusLabels[evaluation.status]}</h1>
          </div>
          <span className="uncertainty-tag">
            {evaluation.uncertainty} evaluation uncertainty
          </span>
        </div>

        <details className="answer-reference">
          <summary>Review the question and your answer</summary>
          <p className="reference-question">{question}</p>
          <p>{answer}</p>
        </details>

        <div className="feedback-grid">
          <section
            className="evidence-section"
            aria-labelledby="evidence-heading"
          >
            <h2 id="evidence-heading">Evidence in your answer</h2>
            {evaluation.evidence.map((evidence) => (
              <blockquote key={`${evidence.excerpt}-${evidence.finding}`}>
                <p>“{evidence.excerpt}”</p>
                <footer>{evidence.finding}</footer>
              </blockquote>
            ))}
          </section>
          <section className="edge-section" aria-labelledby="edge-heading">
            <p className="panel-number">The edge</p>
            <h2 id="edge-heading">{evaluation.unresolvedGap}</h2>
            <span className="next-move">{evaluation.proposedNextMove}</span>
          </section>
        </div>

        <section className="next-question" aria-labelledby="next-heading">
          <p className="kicker">One step beyond</p>
          <h2 id="next-heading">{evaluation.nextQuestion}</h2>
          <p>{evaluation.nextQuestionRationale}</p>
          <div className="next-actions">
            <button
              className="primary-button"
              type="button"
              onClick={onContinue}
            >
              Answer this question <span aria-hidden="true">→</span>
            </button>
            <button className="text-button" type="button" onClick={onEnd}>
              End here
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
