import { useEffect, useReducer, useRef, useState } from 'react';

import { FeedbackView } from './components/FeedbackView';
import { QuestionView } from './components/QuestionView';
import { StartView } from './components/StartView';
import {
  initialLearningSession,
  learningSessionReducer,
} from './learning/session.ts';

type ProviderState = {
  loading: boolean;
  configured: boolean;
  model: string;
};

export function App() {
  const [provider, setProvider] = useState<ProviderState>({
    loading: true,
    configured: false,
    model: 'deepseek-v4-flash',
  });
  const [session, dispatch] = useReducer(
    learningSessionReducer,
    initialLearningSession,
  );
  const providerRequestPending = useRef(false);

  useEffect(() => {
    let active = true;
    void window.thinkEdge
      .getProviderStatus()
      .then((status) => {
        if (active) setProvider({ loading: false, ...status });
      })
      .catch(() => {
        if (active) {
          setProvider({
            loading: false,
            configured: false,
            model: 'deepseek-v4-flash',
          });
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [session.status]);

  async function requestQuestion(topic: string): Promise<void> {
    const result = await window.thinkEdge.createDiagnosticQuestion({ topic });
    if (result.ok) {
      dispatch({ type: 'question_received', question: result.data });
    } else {
      dispatch({ type: 'request_failed', message: result.error.message });
    }
  }

  async function runProviderRequest(work: () => Promise<void>): Promise<void> {
    if (providerRequestPending.current) return;

    providerRequestPending.current = true;
    try {
      await work();
    } finally {
      providerRequestPending.current = false;
    }
  }

  async function startSession(topic: string): Promise<void> {
    await runProviderRequest(async () => {
      dispatch({ type: 'start', topic });
      await requestQuestion(topic.trim());
    });
  }

  async function requestEvaluation(): Promise<void> {
    if (!session.answer.trim()) return;

    const request = {
      topic: session.topic,
      question: session.currentQuestion,
      answer: session.answer,
    };
    dispatch({ type: 'submit' });
    const result = await window.thinkEdge.evaluateAttempt(request);

    if (result.ok) {
      dispatch({ type: 'evaluation_received', evaluation: result.data });
    } else {
      dispatch({ type: 'request_failed', message: result.error.message });
    }
  }

  async function evaluateAnswer(): Promise<void> {
    await runProviderRequest(requestEvaluation);
  }

  async function retryRequest(): Promise<void> {
    await runProviderRequest(async () => {
      const retryStatus = session.retryStatus;
      dispatch({ type: 'retry' });
      if (retryStatus === 'loading_question') {
        await requestQuestion(session.topic);
      } else if (retryStatus === 'evaluating') {
        await requestEvaluation();
      }
    });
  }

  const sessionIsActive = !['idle', 'ended'].includes(session.status);

  return (
    <div className="app-shell">
      <header className="app-header">
        <button
          className="wordmark"
          type="button"
          onClick={() => dispatch({ type: 'restart' })}
          aria-label="Return to ThinkEdge home"
        >
          ThinkEdge<span aria-hidden="true">.</span>
        </button>
        <div className="header-meta">
          <span className="model-status">
            <span
              className={`status-dot ${provider.configured ? 'is-ready' : ''}`}
              aria-hidden="true"
            />
            {provider.model}
          </span>
          {sessionIsActive && (
            <button
              className="text-button"
              type="button"
              onClick={() => dispatch({ type: 'end' })}
            >
              End session
            </button>
          )}
        </div>
      </header>

      {provider.loading && (
        <main className="centered-state" aria-busy="true">
          <p className="kicker">ThinkEdge</p>
          <h1>Preparing your thinking space…</h1>
        </main>
      )}

      {!provider.loading && !provider.configured && (
        <main className="setup-view">
          <p className="kicker">One local step</p>
          <h1>Connect DeepSeek to begin.</h1>
          <p className="setup-copy">
            Open the local <code>.env</code> file, paste your key after{' '}
            <code>DEEPSEEK_API_KEY=</code>, then restart ThinkEdge.
          </p>
          <div className="setup-code" aria-label="Environment configuration">
            <span>DEEPSEEK_API_KEY=</span>
            <span>DEEPSEEK_MODEL=deepseek-v4-flash</span>
          </div>
          <p className="privacy-note">
            The file is ignored by Git. Your key stays in the Electron main
            process and is never sent to the interface.
          </p>
        </main>
      )}

      {!provider.loading &&
        provider.configured &&
        session.status === 'idle' && <StartView onStart={startSession} />}

      {session.status === 'loading_question' && (
        <main className="centered-state" aria-live="polite" aria-busy="true">
          <p className="kicker">{session.topic}</p>
          <h1>Finding the first useful question…</h1>
          <div className="thinking-line" aria-hidden="true" />
        </main>
      )}

      {session.status === 'error' && !session.currentQuestion && (
        <main className="centered-state request-error" role="alert">
          <p className="kicker">DeepSeek could not respond</p>
          <h1>The first question is still waiting.</h1>
          <p>{session.errorMessage}</p>
          <button
            className="primary-button"
            type="button"
            onClick={retryRequest}
          >
            Try again
          </button>
        </main>
      )}

      {(['answering', 'evaluating'].includes(session.status) ||
        (session.status === 'error' && Boolean(session.currentQuestion))) && (
        <QuestionView
          topic={session.topic}
          turn={session.turn}
          question={session.currentQuestion}
          answer={session.answer}
          busy={session.status === 'evaluating'}
          error={session.status === 'error' ? session.errorMessage : ''}
          canRetry={session.status === 'error'}
          onAnswerChange={(answer) =>
            dispatch({ type: 'answer_changed', answer })
          }
          onSubmit={evaluateAnswer}
          onRetry={retryRequest}
        />
      )}

      {session.status === 'feedback' && session.evaluation && (
        <FeedbackView
          topic={session.topic}
          turn={session.turn}
          question={session.currentQuestion}
          answer={session.answer}
          evaluation={session.evaluation}
          onContinue={() => dispatch({ type: 'continue' })}
          onEnd={() => dispatch({ type: 'end' })}
        />
      )}

      {session.status === 'ended' && (
        <main className="ended-view">
          <p className="kicker">Session complete</p>
          <h1>You found an edge worth returning to.</h1>
          <p>
            {session.turn} {session.turn === 1 ? 'question' : 'questions'} on{' '}
            <strong>{session.topic}</strong>. Session history arrives in the
            next persistence slice.
          </p>
          <button
            className="primary-button"
            type="button"
            onClick={() => dispatch({ type: 'restart' })}
          >
            Start another topic
          </button>
        </main>
      )}
    </div>
  );
}
