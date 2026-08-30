import { type FormEvent, useState } from 'react';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';

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
    <Box
      component="main"
      sx={{
        display: 'grid',
        minHeight: { xs: 'calc(100vh - 4.5rem)', sm: 'calc(100vh - 5.5rem)' },
        gridTemplateColumns: {
          xs: '1fr',
          md: 'minmax(0, 1.15fr) minmax(25rem, 0.85fr)',
        },
      }}
    >
      <Box
        component="section"
        aria-labelledby="start-heading"
        sx={{
          display: 'flex',
          minHeight: { xs: '70vh', md: 'auto' },
          flexDirection: 'column',
          justifyContent: 'center',
          p: { xs: 2.5, sm: 6, md: 'clamp(3rem, 7vw, 7rem)' },
          borderRight: { md: 1 },
          borderBottom: { xs: 1, md: 0 },
          borderColor: 'divider',
        }}
      >
        <Typography
          variant="overline"
          color="primary.main"
          sx={{ fontWeight: 750, letterSpacing: '0.16em' }}
        >
          Adaptive learning, one question at a time
        </Typography>
        <Typography
          id="start-heading"
          component="h1"
          variant="h1"
          sx={{
            maxWidth: '12ch',
            mt: 3,
            fontSize: {
              xs: 'clamp(3.2rem, 18vw, 5rem)',
              md: 'clamp(3.6rem, 7vw, 7rem)',
            },
            lineHeight: 0.94,
            letterSpacing: '-0.065em',
          }}
        >
          Find the edge of what you know.
        </Typography>
        <Typography
          color="text.secondary"
          sx={{
            maxWidth: '34rem',
            mt: 4,
            fontSize: '1.05rem',
            lineHeight: 1.7,
          }}
        >
          ThinkEdge starts with your explanation—not an AI lecture. Each answer
          reveals the next useful question.
        </Typography>
        <Box
          component="ol"
          sx={{
            display: 'grid',
            maxWidth: '36rem',
            mt: 7,
            mb: 0,
            pl: 0,
            borderTop: 1,
            borderColor: 'divider',
            listStyle: 'none',
          }}
        >
          {[
            'Attempt before assistance',
            'Evidence instead of confidence scores',
            'One reachable step beyond',
          ].map((principle, index) => (
            <Box
              component="li"
              key={principle}
              sx={{
                display: 'grid',
                gridTemplateColumns: '3.5rem 1fr',
                py: 1.75,
                borderBottom: 1,
                borderColor: 'divider',
                fontSize: '0.88rem',
              }}
            >
              <Box
                component="span"
                sx={{
                  color: 'text.secondary',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  fontSize: '0.72rem',
                }}
              >
                {String(index + 1).padStart(2, '0')}
              </Box>
              {principle}
            </Box>
          ))}
        </Box>
      </Box>

      <Box
        component="section"
        aria-labelledby="topic-heading"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          p: { xs: 2.5, sm: 6, md: 'clamp(3rem, 7vw, 7rem)' },
          bgcolor: '#eef0e8',
        }}
      >
        <Typography
          variant="overline"
          color="primary.main"
          sx={{ fontWeight: 750, letterSpacing: '0.16em' }}
        >
          01 / Start
        </Typography>
        <Typography
          id="topic-heading"
          component="h2"
          variant="h2"
          sx={{
            maxWidth: '14ch',
            mt: 2.5,
            mb: 5,
            fontSize: 'clamp(2.2rem, 4vw, 3.6rem)',
            lineHeight: 1.05,
          }}
        >
          What are you trying to understand?
        </Typography>
        <Box component="form" onSubmit={submit} sx={{ display: 'grid' }}>
          <TextField
            label="Topic or idea"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="e.g. How transformers use attention"
            multiline
            minRows={4}
            autoFocus
            slotProps={{
              input: {
                sx: {
                  bgcolor: '#fffdf7',
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: '1.25rem',
                  lineHeight: 1.65,
                },
              },
            }}
          />
          <Button
            variant="contained"
            type="submit"
            disabled={!topic.trim()}
            sx={{
              mt: 1.5,
              minHeight: '3.25rem',
              justifyContent: 'space-between',
            }}
          >
            Ask my first question
            <Box component="span" aria-hidden="true">
              →
            </Box>
          </Button>
        </Box>
        <Stack
          aria-label="Suggested topics"
          spacing={0.5}
          sx={{ alignItems: 'flex-start', mt: 4 }}
        >
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ mb: 0.5, fontWeight: 700 }}
          >
            Try a topic
          </Typography>
          {suggestions.map((suggestion) => (
            <Button
              key={suggestion}
              variant="text"
              color="inherit"
              type="button"
              onClick={() => setTopic(suggestion)}
              sx={{
                minWidth: 0,
                p: 0.5,
                color: 'text.secondary',
                fontSize: '0.78rem',
              }}
            >
              {suggestion}
            </Button>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
