import { useEffect, useReducer, useRef, useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import type { SxProps, Theme } from '@mui/material/styles';

import { FeedbackView } from './components/FeedbackView';
import { QuestionView } from './components/QuestionView';
import { SessionReview } from './components/SessionReview';
import { StartView } from './components/StartView';
import { StrataAiMark } from './components/StrataAiMark';
import {
  initialLearningSession,
  learningSessionReducer,
} from './learning/session.ts';
import type { LearningSessionSummary } from './learning/history.ts';
import type { HelpLevel } from './learning/contracts.ts';

type ProviderState = {
  loading: boolean;
  configured: boolean;
};

const centeredStateSx: SxProps<Theme> = {
  minHeight: 'calc(100vh - 4rem)',
  px: { xs: 2.5, sm: 6 },
  py: 6,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
};

const displayHeadingSx: SxProps<Theme> = {
  maxWidth: '14ch',
  fontSize: { xs: '2.5rem', sm: 'clamp(2.75rem, 5vw, 4.5rem)' },
  lineHeight: 1,
};

export function App() {
  const [provider, setProvider] = useState<ProviderState>({
    loading: true,
    configured: false,
  });
  const [session, dispatch] = useReducer(
    learningSessionReducer,
    initialLearningSession,
  );
  const [recentSessions, setRecentSessions] = useState<
    LearningSessionSummary[]
  >([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [localError, setLocalError] = useState('');
  const [helpBusy, setHelpBusy] = useState(false);
  const [challengeBusy, setChallengeBusy] = useState(false);
  const [challengeError, setChallengeError] = useState('');
  const providerRequestPending = useRef(false);

  useEffect(() => {
    let active = true;
    void window.strataAi
      .getProviderStatus()
      .then((status) => {
        if (active) setProvider({ loading: false, ...status });
      })
      .catch(() => {
        if (active) {
          setProvider({
            loading: false,
            configured: false,
          });
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void window.strataAi
      .listSessions()
      .then((result) => {
        if (active && result.ok) setRecentSessions(result.data);
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [session.status]);

  async function refreshSessions(): Promise<void> {
    const result = await window.strataAi.listSessions();
    if (result.ok) setRecentSessions(result.data);
  }

  async function requestSessionStart(topic: string): Promise<void> {
    const result = await window.strataAi.startSession({ topic });
    if (result.ok) {
      dispatch({ type: 'session_started', session: result.data });
      await refreshSessions();
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
      await requestSessionStart(topic.trim());
    });
  }

  async function requestEvaluation(): Promise<void> {
    if (!session.answer.trim()) return;

    const request = {
      sessionId: session.sessionId,
      questionId: session.questionId,
      answer: session.answer,
    };
    dispatch({ type: 'submit' });
    const result = await window.strataAi.submitAttempt(request);

    if (result.ok) {
      dispatch({
        type: 'evaluation_persisted',
        session: result.data,
        submittedQuestionId: request.questionId,
      });
      await refreshSessions();
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
        await requestSessionStart(session.topic);
      } else if (retryStatus === 'evaluating') {
        await requestEvaluation();
      }
    });
  }

  async function openSession(sessionId: string): Promise<void> {
    setLocalError('');
    const result = await window.strataAi.getSession({ sessionId });
    if (result.ok && result.data) {
      dispatch({ type: 'session_loaded', session: result.data });
      return;
    }
    setLocalError(
      result.ok ? 'That local session no longer exists.' : result.error.message,
    );
    await refreshSessions();
  }

  async function endSession(): Promise<void> {
    if (!session.sessionId) return;
    const result = await window.strataAi.endSession({
      sessionId: session.sessionId,
    });
    if (result.ok) {
      dispatch({ type: 'session_ended', session: result.data });
      await refreshSessions();
    } else {
      setLocalError(result.error.message);
    }
  }

  async function deleteSession(sessionId: string): Promise<void> {
    setLocalError('');
    const result = await window.strataAi.deleteSession({ sessionId });
    if (!result.ok) setLocalError(result.error.message);
    await refreshSessions();
  }

  async function requestHelp(level: HelpLevel): Promise<void> {
    if (
      level === 'direct_explanation' &&
      !window.confirm(
        'Show the direct explanation? This is the final help level.',
      )
    )
      return;
    setHelpBusy(true);
    setLocalError('');
    const result = await window.strataAi.requestHelp({
      requestId: crypto.randomUUID(),
      sessionId: session.sessionId,
      questionId: session.questionId,
      level,
    });
    if (result.ok) {
      dispatch({ type: 'help_persisted', session: result.data });
      setLocalError('');
    } else setLocalError(result.error.message);
    setHelpBusy(false);
  }

  async function challengeEvaluation(rationale: string): Promise<void> {
    const turn = session.history.find(
      (item) => item.questionId === session.questionId,
    );
    const evaluationId = turn?.evaluationHistory.at(-1)?.id;
    if (!evaluationId) return;
    setChallengeBusy(true);
    setChallengeError('');
    const result = await window.strataAi.challengeEvaluation({
      requestId: crypto.randomUUID(),
      sessionId: session.sessionId,
      questionId: session.questionId,
      evaluationId,
      rationale,
    });
    if (result.ok)
      dispatch({
        type: 'challenge_persisted',
        session: result.data,
        questionId: session.questionId,
      });
    else setChallengeError(result.error.message);
    setChallengeBusy(false);
  }

  function returnHome(): void {
    dispatch({ type: 'restart' });
    setLocalError('');
    void refreshSessions();
  }

  const sessionIsActive =
    Boolean(session.sessionId) &&
    !['idle', 'reviewing', 'ended'].includes(session.status);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        component="header"
        position="static"
        color="transparent"
        elevation={0}
      >
        <Toolbar
          sx={{
            minHeight: '4rem',
            px: { xs: 2, sm: 3 },
            justifyContent: 'space-between',
          }}
        >
          <IconButton
            color="inherit"
            onClick={returnHome}
            aria-label="Return to Strata AI home"
            size="small"
            sx={{ p: 0.75 }}
          >
            <StrataAiMark />
          </IconButton>
          {sessionIsActive && (
            <Button
              variant="text"
              color="inherit"
              type="button"
              onClick={() => void endSession()}
              sx={{
                minWidth: 0,
                p: 0.5,
                color: 'text.secondary',
                fontSize: '0.8rem',
              }}
            >
              End
            </Button>
          )}
        </Toolbar>
      </AppBar>

      {provider.loading && (
        <Box component="main" sx={centeredStateSx} aria-busy="true">
          <Typography component="h1" variant="h1" sx={displayHeadingSx}>
            Getting ready…
          </Typography>
        </Box>
      )}

      {!provider.loading && session.status === 'idle' && (
        <>
          {localError && (
            <Typography role="alert" color="error" sx={{ px: 3, pt: 2 }}>
              {localError}
            </Typography>
          )}
          <StartView
            providerConfigured={provider.configured}
            sessions={recentSessions}
            historyLoading={historyLoading}
            onStart={startSession}
            onOpenSession={openSession}
            onDeleteSession={deleteSession}
          />
        </>
      )}

      {session.status === 'loading_question' && (
        <Box
          component="main"
          sx={centeredStateSx}
          aria-live="polite"
          aria-busy="true"
        >
          <Typography
            variant="overline"
            color="primary.main"
            sx={{ fontWeight: 750 }}
          >
            {session.topic}
          </Typography>
          <Typography component="h1" variant="h1" sx={displayHeadingSx}>
            Thinking…
          </Typography>
          <LinearProgress
            aria-hidden="true"
            sx={{ width: 'min(20rem, 70vw)', mt: 6 }}
          />
        </Box>
      )}

      {session.status === 'error' && !session.currentQuestion && (
        <Box component="main" sx={centeredStateSx} role="alert">
          <Typography component="h1" variant="h1" sx={displayHeadingSx}>
            Couldn't load a question
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ maxWidth: '38rem', mt: 3, lineHeight: 1.7 }}
          >
            {session.errorMessage}
          </Typography>
          <Button
            variant="contained"
            type="button"
            onClick={retryRequest}
            sx={{ mt: 3 }}
          >
            Retry
          </Button>
        </Box>
      )}

      {(['answering', 'evaluating'].includes(session.status) ||
        (session.status === 'error' && Boolean(session.currentQuestion))) && (
        <QuestionView
          topic={session.topic}
          turn={session.turn}
          question={session.currentQuestion}
          answer={session.answer}
          busy={session.status === 'evaluating'}
          error={
            localError ||
            (session.status === 'error' ? session.errorMessage : '')
          }
          canRetry={session.status === 'error'}
          onAnswerChange={(answer) =>
            dispatch({ type: 'answer_changed', answer })
          }
          onSubmit={evaluateAnswer}
          onRetry={retryRequest}
          help={
            session.history.find(
              (item) => item.questionId === session.questionId,
            )?.help ?? []
          }
          helpBusy={helpBusy}
          onRequestHelp={(level) => void requestHelp(level)}
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
          onEnd={() => void endSession()}
          evaluationHistory={
            session.history.find(
              (item) => item.questionId === session.questionId,
            )?.evaluationHistory ?? []
          }
          challengeBusy={challengeBusy}
          challengeError={challengeError}
          onChallenge={(rationale) => void challengeEvaluation(rationale)}
        />
      )}

      {session.status === 'reviewing' && (
        <SessionReview
          topic={session.topic}
          turns={session.history}
          onDone={returnHome}
        />
      )}

      {session.status === 'ended' && (
        <Box component="main" sx={centeredStateSx}>
          <Typography component="h1" variant="h1" sx={displayHeadingSx}>
            Done
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ maxWidth: '38rem', my: 4, lineHeight: 1.7 }}
          >
            {session.turn} {session.turn === 1 ? 'question' : 'questions'} ·{' '}
            <Box component="strong" color="text.primary">
              {session.topic}
            </Box>
          </Typography>
          <Button variant="contained" type="button" onClick={returnHome}>
            New topic
          </Button>
        </Box>
      )}
    </Box>
  );
}
