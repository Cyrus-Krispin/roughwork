import { type FormEvent, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

const suggestions = ['Neural networks', 'Derivatives', 'Database indexes'];

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
    <Box
      component="main"
      sx={{
        display: 'flex',
        minHeight: 'calc(100vh - 4rem)',
        alignItems: 'center',
        justifyContent: 'center',
        px: { xs: 2.5, sm: 6 },
        py: 6,
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
                onClick={() => void onStart(suggestion)}
                sx={{ color: 'text.secondary', fontSize: '0.78rem' }}
              >
                {suggestion}
              </Button>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
