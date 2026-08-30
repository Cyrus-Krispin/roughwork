import type { EvaluationResult } from '../learning/contracts.ts';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

type FeedbackViewProps = {
  topic: string;
  turn: number;
  question: string;
  answer: string;
  evaluation: EvaluationResult;
  onContinue(): void;
  onEnd(): void;
};

const statusLabels: Record<EvaluationResult['status'], string> = {
  demonstrated: 'Clear',
  partial: 'Partly clear',
  misconception: 'Needs correction',
  uncertain: 'Not clear yet',
};

export function FeedbackView({
  topic,
  turn,
  question,
  answer,
  evaluation,
  onContinue,
  onEnd,
}: FeedbackViewProps) {
  return (
    <Box
      component="main"
      sx={{
        minHeight: 'calc(100vh - 4.5rem)',
        px: { xs: 2.5, sm: 6 },
        py: { xs: 5, sm: 8 },
      }}
    >
      <Box
        component="section"
        aria-labelledby="feedback-heading"
        sx={{
          width: 'min(100%, 60rem)',
          mx: 'auto',
        }}
      >
        <Box
          sx={{
            pb: 3,
            borderBottom: 1,
            borderColor: 'divider',
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
            id="feedback-heading"
            component="h1"
            variant="h1"
            sx={{ mt: 1.5, fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}
          >
            {statusLabels[evaluation.status]}
          </Typography>
        </Box>

        <Accordion
          disableGutters
          elevation={0}
          sx={{
            bgcolor: 'transparent',
            borderBottom: 1,
            borderColor: 'divider',
            '&::before': { display: 'none' },
          }}
        >
          <AccordionSummary
            expandIcon={<Box aria-hidden="true">+</Box>}
            aria-controls="answer-reference-content"
            id="answer-reference-header"
            sx={{ px: 0 }}
          >
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 700 }}>
              Review
            </Typography>
          </AccordionSummary>
          <AccordionDetails id="answer-reference-content" sx={{ px: 0, pb: 3 }}>
            <Typography
              sx={{
                maxWidth: '48rem',
                color: 'text.primary',
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: '1.25rem',
                lineHeight: 1.6,
              }}
            >
              {question}
            </Typography>
            <Typography
              color="text.secondary"
              sx={{ maxWidth: '48rem', mt: 3, lineHeight: 1.6 }}
            >
              {answer}
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'minmax(0, 1.25fr) minmax(15rem, 0.75fr)',
            },
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Box
            component="section"
            aria-labelledby="evidence-heading"
            sx={{
              py: 5,
              pr: { md: 6 },
              borderRight: { md: 1 },
              borderBottom: { xs: 1, md: 0 },
              borderColor: 'divider',
            }}
          >
            <Typography
              id="evidence-heading"
              component="h2"
              variant="h2"
              sx={{ mb: 3, fontSize: '1.45rem' }}
            >
              Evidence
            </Typography>
            <Stack spacing={1.5}>
              {evaluation.evidence.map((evidence) => (
                <Box
                  component="blockquote"
                  key={`${evidence.excerpt}-${evidence.finding}`}
                  sx={{
                    m: 0,
                    py: 2,
                    pl: 2.5,
                    borderLeft: 2,
                    borderColor: 'primary.main',
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: 'Georgia, "Times New Roman", serif',
                      fontSize: '1.08rem',
                      lineHeight: 1.5,
                    }}
                  >
                    “{evidence.excerpt}”
                  </Typography>
                  <Typography
                    component="footer"
                    color="text.secondary"
                    sx={{ mt: 1.25, fontSize: '0.76rem', lineHeight: 1.5 }}
                  >
                    {evidence.finding}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
          <Box
            component="section"
            aria-labelledby="edge-heading"
            sx={{ py: 5, pl: { md: 6 } }}
          >
            <Typography
              variant="overline"
              color="primary.main"
              sx={{ fontWeight: 750, letterSpacing: '0.16em' }}
            >
              Gap
            </Typography>
            <Typography
              id="edge-heading"
              component="h2"
              variant="h2"
              sx={{ mt: 2, mb: 3, fontSize: '1.65rem', lineHeight: 1.25 }}
            >
              {evaluation.unresolvedGap}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ pt: 4 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}
          >
            <Button variant="contained" type="button" onClick={onContinue}>
              Next question
              <Box component="span" aria-hidden="true" sx={{ ml: 2 }}>
                →
              </Box>
            </Button>
            <Button
              variant="text"
              color="inherit"
              type="button"
              onClick={onEnd}
            >
              End
            </Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
