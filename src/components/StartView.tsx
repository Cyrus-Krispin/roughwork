import { type FormEvent, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

const suggestions = [
  'How do neural networks learn?',
  'What does a derivative actually measure?',
  'Why do database indexes make queries faster?',
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
    <Box
      component="main"
      sx={{
        display: 'flex',
        minHeight: { xs: 'calc(100vh - 4.5rem)', sm: 'calc(100vh - 5.5rem)' },
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
            maxWidth: '16ch',
            fontSize: { xs: '3rem', sm: 'clamp(3.5rem, 7vw, 6rem)' },
            lineHeight: 0.98,
          }}
        >
          What do you want to understand?
        </Typography>
        <Box component="form" onSubmit={submit} sx={{ mt: { xs: 5, sm: 7 } }}>
          <TextField
            variant="standard"
            fullWidth
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="Type a topic or question"
            autoFocus
            slotProps={{
              input: {
                sx: {
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: { xs: '1.5rem', sm: '2rem' },
                  lineHeight: 1.4,
                  pb: 1.5,
                },
              },
              htmlInput: { 'aria-label': 'Topic or question' },
            }}
          />
          <Typography
            color="text.secondary"
            sx={{ mt: 1.5, fontSize: '0.72rem', textAlign: 'right' }}
          >
            Press Enter
          </Typography>
        </Box>
        <Box
          aria-label="Suggested questions"
          sx={{
            mt: { xs: 6, sm: 9 },
            pt: 3,
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ fontWeight: 700 }}
          >
            Try one
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
            {suggestions.map((suggestion) => (
              <Button
                key={suggestion}
                variant="outlined"
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
