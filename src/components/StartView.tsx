import { type FormEvent, useState } from 'react';

const suggestions = [
  'How neural networks learn',
  'The intuition behind derivatives',
  'How databases use indexes',
];

type StartViewProps = {
  onStart(topic: string): Promise<void>;
};

export function StartView({ onStart }: StartViewProps) {
  const [topic, setTopic] = useState('');

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (topic.trim()) void onStart(topic);
  }

  return (
    <main className="start-view">
      <section className="start-intro" aria-labelledby="start-heading">
        <p className="kicker">Adaptive learning, one question at a time</p>
        <h1 id="start-heading">Find the edge of what you know.</h1>
        <p className="intro-copy">
          ThinkEdge starts with your explanation—not an AI lecture. Each answer
          reveals the next useful question.
        </p>
        <ol className="principle-list">
          <li>
            <span>01</span> Attempt before assistance
          </li>
          <li>
            <span>02</span> Evidence instead of confidence scores
          </li>
          <li>
            <span>03</span> One reachable step beyond
          </li>
        </ol>
      </section>

      <section className="topic-panel" aria-labelledby="topic-heading">
        <p className="panel-number">01 / Start</p>
        <h2 id="topic-heading">What are you trying to understand?</h2>
        <form onSubmit={submit}>
          <label htmlFor="topic">Topic or idea</label>
          <textarea
            id="topic"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="e.g. How transformers use attention"
            rows={4}
            autoFocus
          />
          <button
            className="primary-button"
            type="submit"
            disabled={!topic.trim()}
          >
            Ask my first question
            <span aria-hidden="true">→</span>
          </button>
        </form>
        <div className="suggestions" aria-label="Suggested topics">
          <span>Try a topic</span>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setTopic(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
