import { useEffect, useReducer, useRef, useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import type { SxProps, Theme } from '@mui/material/styles';

import { FeedbackView } from './components/FeedbackView';
import { QuestionView } from './components/QuestionView';
import { StartView } from './components/StartView';
import { ThinkEdgeMark } from './components/ThinkEdgeMark';
import {
  initialLearningSession,
  learningSessionReducer,
} from './learning/session.ts';

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

  const sessionIsActive = !['idle', 'feedback', 'ended'].includes(
    session.status,
  );

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
            onClick={() => dispatch({ type: 'restart' })}
            aria-label="Return to ThinkEdge home"
            size="small"
            sx={{ p: 0.75 }}
          >
            <ThinkEdgeMark />
          </IconButton>
          {sessionIsActive && (
            <Button
              variant="text"
              color="inherit"
              type="button"
              onClick={() => dispatch({ type: 'end' })}
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

      {!provider.loading && !provider.configured && (
        <Box component="main" sx={centeredStateSx}>
          <Typography component="h1" variant="h1" sx={displayHeadingSx}>
            Add your DeepSeek key
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ maxWidth: '38rem', mt: 4, lineHeight: 1.7 }}
          >
            Add the key to your local <Box component="code">.env</Box> file.
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
            Restart the app.
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
          <Button
            variant="contained"
            type="button"
            onClick={() => dispatch({ type: 'restart' })}
          >
            New topic
          </Button>
        </Box>
      )}
    </Box>
  );
}
