import type { FormEvent } from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

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
    <Box
      component="main"
      sx={{
        display: { xs: 'block', sm: 'grid' },
        minHeight: { xs: 'calc(100vh - 4.5rem)', sm: 'calc(100vh - 5.5rem)' },
        gridTemplateColumns: {
          sm: '4rem minmax(0, 1fr)',
          md: '9rem minmax(0, 1fr)',
        },
      }}
    >
      <Box
        aria-label="Session progress"
        sx={{
          display: 'flex',
          flexDirection: { xs: 'row', sm: 'column' },
          justifyContent: 'space-between',
          p: { xs: 1.5, sm: 2.5, md: 3 },
          borderRight: { sm: 1 },
          borderBottom: { xs: 1, sm: 0 },
          borderColor: 'divider',
          color: 'text.secondary',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: '0.68rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          writingMode: { sm: 'vertical-rl' },
        }}
      >
        <Box component="span">Question {String(turn).padStart(2, '0')}</Box>
        <Box component="span">{topic}</Box>
      </Box>
      <Box
        component="section"
        aria-labelledby="active-question"
        sx={{
          width: 'min(100%, 70rem)',
          mx: 'auto',
          p: { xs: 2.5, sm: 4, md: 'clamp(3rem, 7vw, 6.5rem)' },
        }}
      >
        <Typography
          variant="overline"
          color="primary.main"
          sx={{ fontWeight: 750, letterSpacing: '0.16em' }}
        >
          Think it through in your own words
        </Typography>
        <Typography
          id="active-question"
          component="h1"
          variant="h1"
          sx={{
            maxWidth: '19ch',
            mt: 3,
            mb: { xs: 5, sm: 7 },
            fontSize: {
              xs: 'clamp(2.5rem, 13vw, 3.6rem)',
              sm: 'clamp(2.8rem, 5.5vw, 5.2rem)',
            },
            lineHeight: 1.03,
          }}
        >
          {question}
        </Typography>
        <Box component="form" onSubmit={submit} sx={{ display: 'grid' }}>
          <TextField
            label="Your explanation"
            value={answer}
            onChange={(event) => onAnswerChange(event.target.value)}
            placeholder="Start with what you believe is happening. It is okay to be incomplete."
            multiline
            minRows={8}
            disabled={busy}
            autoFocus
            slotProps={{
              input: {
                sx: {
                  bgcolor: '#fffdf7',
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: '1.18rem',
                  lineHeight: 1.65,
                },
              },
            }}
          />
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={3}
            sx={{
              mt: 2,
              alignItems: { xs: 'stretch', sm: 'center' },
              justifyContent: 'space-between',
            }}
          >
            <Typography
              color="text.secondary"
              sx={{ maxWidth: '28rem', fontSize: '0.75rem', lineHeight: 1.5 }}
            >
              ThinkEdge will evaluate only what this answer demonstrates.
            </Typography>
            <Button
              variant="contained"
              type="submit"
              disabled={busy || !answer.trim()}
              sx={{ minHeight: '3.25rem', minWidth: { sm: '14rem' } }}
            >
              {busy ? 'Reading your reasoning…' : 'Review my answer'}
              {!busy && (
                <Box component="span" aria-hidden="true" sx={{ ml: 2 }}>
                  →
                </Box>
              )}
            </Button>
          </Stack>
        </Box>
        {error && (
          <Alert
            severity="error"
            variant="outlined"
            role="alert"
            action={
              canRetry ? (
                <Button
                  color="error"
                  size="small"
                  type="button"
                  onClick={() => void onRetry()}
                >
                  Try again
                </Button>
              ) : undefined
            }
            sx={{ mt: 3, bgcolor: '#f3e3dc' }}
          >
            <AlertTitle>The connection broke, not your work.</AlertTitle>
            {error}
          </Alert>
        )}
      </Box>
    </Box>
  );
}
