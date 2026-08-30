import { type FormEvent, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import type { LearningSessionSummary } from '../learning/history.ts';
import { SessionHistory } from './SessionHistory';

const suggestions = ['Neural networks', 'Derivatives', 'Database indexes'];

type StartViewProps = {
  providerConfigured: boolean;
  sessions: LearningSessionSummary[];
  historyLoading: boolean;
  onStart(topic: string): Promise<void>;
  onOpenSession(sessionId: string): Promise<void>;
  onDeleteSession(sessionId: string): Promise<void>;
};

export function StartView({
  providerConfigured,
  sessions,
  historyLoading,
  onStart,
  onOpenSession,
  onDeleteSession,
}: StartViewProps) {
  const [topic, setTopic] = useState('');

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (providerConfigured && topic.trim()) void onStart(topic);
  }

  return (
    <Box
      component="main"
      sx={{
        display: 'flex',
        minHeight: 'calc(100vh - 4rem)',
        alignItems: 'flex-start',
        justifyContent: 'center',
        px: { xs: 2.5, sm: 6 },
        py: { xs: 5, sm: 7 },
      }}
    >
      <Box
        component="section"
        aria-labelledby="start-heading"
        sx={{
          width: 'min(100%, 56rem)',
        }}
      >
        <Typography
          id="start-heading"
          component="h1"
          variant="h1"
          sx={{
            maxWidth: '18ch',
            fontSize: { xs: '2.75rem', sm: 'clamp(3rem, 6vw, 4.75rem)' },
            lineHeight: 0.98,
          }}
        >
          What should we learn?
        </Typography>
        <Box component="form" onSubmit={submit} sx={{ mt: { xs: 5, sm: 7 } }}>
          <TextField
            variant="standard"
            fullWidth
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            autoFocus
            disabled={!providerConfigured}
            placeholder={
              providerConfigured ? '' : 'Add DEEPSEEK_API_KEY, then restart'
            }
            slotProps={{
              input: {
                sx: {
                  fontSize: { xs: '1.5rem', sm: '2rem' },
                  fontWeight: 400,
                  lineHeight: 1.4,
                  pb: 1.5,
                },
              },
              htmlInput: { 'aria-label': 'Topic or question' },
            }}
          />
        </Box>
        <Box
          aria-label="Suggested topics"
          sx={{
            mt: { xs: 4, sm: 5 },
          }}
        >
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {suggestions.map((suggestion) => (
              <Button
                key={suggestion}
                variant="text"
                color="inherit"
                type="button"
                disabled={!providerConfigured}
                onClick={() => void onStart(suggestion)}
                sx={{ color: 'text.secondary', fontSize: '0.78rem' }}
              >
                {suggestion}
              </Button>
            ))}
          </Box>
        </Box>
        {!providerConfigured && (
          <Typography
            role="status"
            color="text.secondary"
            sx={{ mt: 3, fontSize: '0.82rem', lineHeight: 1.6 }}
          >
            Starting a new session needs a DeepSeek key. Your local history is
            still available below.
          </Typography>
        )}
        <SessionHistory
          sessions={sessions}
          loading={historyLoading}
          onOpen={onOpenSession}
          onDelete={onDeleteSession}
        />
      </Box>
    </Box>
  );
}
