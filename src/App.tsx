import { useEffect, useReducer, useRef, useState } from 'react';
import {
  AppBar,
  Box,
  Button,
  LinearProgress,
  Paper,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

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

const centeredStateSx: SxProps<Theme> = {
  minHeight: { xs: 'calc(100vh - 4.5rem)', sm: 'calc(100vh - 5.5rem)' },
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
  mt: 3,
  fontSize: { xs: '3rem', sm: 'clamp(3rem, 6vw, 5.5rem)' },
  lineHeight: 0.98,
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
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.paper' }}>
      <AppBar
        component="header"
        position="static"
        color="transparent"
        elevation={0}
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Toolbar
          sx={{
            minHeight: { xs: '4.5rem', sm: '5.5rem' },
            px: { xs: 2, sm: 6 },
            justifyContent: 'space-between',
          }}
        >
          <Button
            variant="text"
            color="inherit"
            type="button"
            onClick={() => dispatch({ type: 'restart' })}
            aria-label="Return to ThinkEdge home"
            sx={{
              minWidth: 0,
              p: 0,
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: '1.35rem',
              fontWeight: 700,
              letterSpacing: '-0.035em',
            }}
          >
            ThinkEdge
            <Box component="span" color="secondary.main" aria-hidden="true">
              .
            </Box>
          </Button>
          <Stack direction="row" spacing={3} sx={{ alignItems: 'center' }}>
            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: 'center',
                display: { xs: 'none', sm: 'flex' },
                color: 'text.secondary',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: '0.72rem',
                letterSpacing: '0.02em',
              }}
            >
              <Box
                component="span"
                aria-hidden="true"
                sx={{
                  width: '0.45rem',
                  height: '0.45rem',
                  border: 1,
                  borderColor: provider.configured
                    ? 'primary.main'
                    : 'text.secondary',
                  borderRadius: '50%',
                  bgcolor: provider.configured ? 'primary.main' : 'transparent',
                }}
              />
              <Box component="span">{provider.model}</Box>
            </Stack>
            {sessionIsActive && (
              <Button
                variant="text"
                color="inherit"
                type="button"
                onClick={() => dispatch({ type: 'end' })}
                sx={{ minWidth: 0, p: 0.5, fontSize: '0.8rem' }}
              >
                End session
              </Button>
            )}
          </Stack>
        </Toolbar>
      </AppBar>

      {provider.loading && (
        <Box component="main" sx={centeredStateSx} aria-busy="true">
          <Typography
            variant="overline"
            color="primary.main"
            sx={{ fontWeight: 750 }}
          >
            ThinkEdge
          </Typography>
          <Typography component="h1" variant="h1" sx={displayHeadingSx}>
            Preparing your thinking space…
          </Typography>
        </Box>
      )}

      {!provider.loading && !provider.configured && (
        <Box component="main" sx={centeredStateSx}>
          <Typography
            variant="overline"
            color="primary.main"
            sx={{ fontWeight: 750 }}
          >
            One local step
          </Typography>
          <Typography component="h1" variant="h1" sx={displayHeadingSx}>
            Connect DeepSeek to begin.
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ maxWidth: '38rem', mt: 4, lineHeight: 1.7 }}
          >
            Open the local <Box component="code">.env</Box> file, paste your key
            after <Box component="code">DEEPSEEK_API_KEY=</Box>, then restart
            ThinkEdge.
          </Typography>
          <Paper
            variant="outlined"
            aria-label="Environment configuration"
            sx={{
              width: 'min(36rem, 100%)',
              mt: 3,
              p: 2.5,
              bgcolor: 'text.primary',
              color: '#e9eedf',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: '0.82rem',
              textAlign: 'left',
            }}
          >
            <Stack spacing={0.75}>
              <Box component="span">DEEPSEEK_API_KEY=</Box>
              <Box component="span">DEEPSEEK_MODEL=deepseek-v4-flash</Box>
            </Stack>
          </Paper>
          <Typography
            color="text.secondary"
            sx={{
              maxWidth: '38rem',
              mt: 2.5,
              fontSize: '0.78rem',
              lineHeight: 1.7,
            }}
          >
            The file is ignored by Git. Your key stays in the Electron main
            process and is never sent to the interface.
          </Typography>
        </Box>
      )}

      {!provider.loading &&
        provider.configured &&
        session.status === 'idle' && <StartView onStart={startSession} />}

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
            Finding the first useful question…
          </Typography>
          <LinearProgress
            aria-hidden="true"
            sx={{ width: 'min(20rem, 70vw)', mt: 6 }}
          />
        </Box>
      )}

      {session.status === 'error' && !session.currentQuestion && (
        <Box component="main" sx={centeredStateSx} role="alert">
          <Typography
            variant="overline"
            color="error.main"
            sx={{ fontWeight: 750 }}
          >
            DeepSeek could not respond
          </Typography>
          <Typography component="h1" variant="h1" sx={displayHeadingSx}>
            The first question is still waiting.
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
            Try again
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
        <Box component="main" sx={centeredStateSx}>
          <Typography
            variant="overline"
            color="primary.main"
            sx={{ fontWeight: 750 }}
          >
            Session complete
          </Typography>
          <Typography component="h1" variant="h1" sx={displayHeadingSx}>
            You found an edge worth returning to.
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ maxWidth: '38rem', my: 4, lineHeight: 1.7 }}
          >
            {session.turn} {session.turn === 1 ? 'question' : 'questions'} on{' '}
            <Box component="strong" color="text.primary">
              {session.topic}
            </Box>
            . Session history arrives in the next persistence slice.
          </Typography>
          <Button
            variant="contained"
            type="button"
            onClick={() => dispatch({ type: 'restart' })}
          >
            Start another topic
          </Button>
        </Box>
      )}
    </Box>
  );
}
