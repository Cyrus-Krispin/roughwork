import type { FormEvent } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { HelpLevel } from '../learning/contracts.ts';
import type { PersistedHelpResponse } from '../learning/history.ts';
import { HelpControls } from './HelpControls';

type QuestionViewProps = {
  topic: string;
  turn: number;
  question: string;
  answer: string;
  busy: boolean;
  aiBusy: boolean;
  error: string;
  canRetry: boolean;
  onAnswerChange(answer: string): void;
  onSubmit(): Promise<void>;
  onRetry(): Promise<void>;
  help: PersistedHelpResponse[];
  helpBusy: boolean;
  onRequestHelp(level: HelpLevel): void;
};

export function QuestionView({
  topic,
  turn,
  question,
  answer,
  busy,
  aiBusy,
  error,
  canRetry,
  onAnswerChange,
  onSubmit,
  onRetry,
  help,
  helpBusy,
  onRequestHelp,
}: QuestionViewProps) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!aiBusy && answer.trim()) void onSubmit();
  }

  return (
    <Box
      component="main"
      sx={{
        minHeight: 'calc(100vh - 4rem)',
        px: { xs: 2.5, sm: 6 },
        py: { xs: 5, sm: 8 },
      }}
    >
      <Box
        component="section"
        aria-labelledby="active-question"
        sx={{
          width: 'min(100%, 56rem)',
          mx: 'auto',
        }}
      >
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ fontWeight: 700 }}
        >
          {topic} · {String(turn).padStart(2, '0')}
        </Typography>
        <Typography
          id="active-question"
          component="h1"
          variant="h1"
          sx={{
            maxWidth: '22ch',
            mt: 2,
            mb: { xs: 5, sm: 6 },
            fontSize: {
              xs: 'clamp(2.25rem, 10vw, 3.25rem)',
              sm: 'clamp(2.5rem, 5vw, 4.25rem)',
            },
            lineHeight: 1.08,
          }}
        >
          {question}
        </Typography>
        <Box component="form" onSubmit={submit} sx={{ display: 'grid' }}>
          <TextField
            label="Your answer"
            value={answer}
            onChange={(event) => onAnswerChange(event.target.value)}
            multiline
            minRows={5}
            disabled={busy}
            autoFocus
            slotProps={{
              input: {
                sx: {
                  fontSize: '1.18rem',
                  lineHeight: 1.65,
                },
              },
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              type="submit"
              disabled={aiBusy || !answer.trim()}
              sx={{ minHeight: '3rem', width: { xs: '100%', sm: 'auto' } }}
            >
              {busy ? 'Checking…' : 'Check answer · uses AI'}
              {!busy && (
                <Box component="span" aria-hidden="true" sx={{ ml: 2 }}>
                  →
                </Box>
              )}
            </Button>
          </Box>
        </Box>
        <HelpControls help={help} busy={helpBusy} onRequest={onRequestHelp} />
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
                  Try again · uses AI
                </Button>
              ) : undefined
            }
            sx={{ mt: 3, bgcolor: '#f3e3dc' }}
          >
            {error}
          </Alert>
        )}
      </Box>
    </Box>
  );
}
