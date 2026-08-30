import type { EvaluationResult } from '../learning/contracts.ts';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
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
  demonstrated: 'Demonstrated',
  partial: 'Partially demonstrated',
  misconception: 'Misconception surfaced',
  uncertain: 'Needs clarification',
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
        <Box component="span">Review {String(turn).padStart(2, '0')}</Box>
        <Box component="span">{topic}</Box>
      </Box>
      <Box
        component="section"
        aria-labelledby="feedback-heading"
        sx={{
          width: 'min(100%, 70rem)',
          mx: 'auto',
          p: { xs: 2.5, sm: 4, md: 'clamp(3rem, 7vw, 6.5rem)' },
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={3}
          sx={{
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            pb: 4,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Box>
            <Typography
              variant="overline"
              color="primary.main"
              sx={{ fontWeight: 750, letterSpacing: '0.16em' }}
            >
              What your answer shows
            </Typography>
            <Typography
              id="feedback-heading"
              component="h1"
              variant="h1"
              sx={{ mt: 1.5, fontSize: 'clamp(2.8rem, 5vw, 4.6rem)' }}
            >
              {statusLabels[evaluation.status]}
            </Typography>
          </Box>
          <Chip
            variant="outlined"
            size="small"
            label={`${evaluation.uncertainty} evaluation uncertainty`}
            sx={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: '0.65rem',
              textTransform: 'uppercase',
            }}
          />
        </Stack>

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
              Review the question and your answer
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
              Evidence in your answer
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
              The edge
            </Typography>
            <Typography
              id="edge-heading"
              component="h2"
              variant="h2"
              sx={{ mt: 2, mb: 3, fontSize: '1.65rem', lineHeight: 1.25 }}
            >
              {evaluation.unresolvedGap}
            </Typography>
            <Chip
              variant="outlined"
              color="primary"
              size="small"
              label={evaluation.proposedNextMove}
              sx={{
                height: 'auto',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: '0.65rem',
                textTransform: 'uppercase',
                '& .MuiChip-label': { whiteSpace: 'normal', py: 0.75 },
              }}
            />
          </Box>
        </Box>

        <Box component="section" aria-labelledby="next-heading" sx={{ pt: 6 }}>
          <Typography
            variant="overline"
            color="primary.main"
            sx={{ fontWeight: 750, letterSpacing: '0.16em' }}
          >
            One step beyond
          </Typography>
          <Typography
            id="next-heading"
            component="h2"
            variant="h2"
            sx={{
              maxWidth: '24ch',
              mt: 2,
              mb: 2,
              fontSize: 'clamp(2rem, 4vw, 3.5rem)',
              lineHeight: 1.08,
            }}
          >
            {evaluation.nextQuestion}
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ maxWidth: '38rem', lineHeight: 1.6 }}
          >
            {evaluation.nextQuestionRationale}
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={3}
            sx={{ mt: 4, alignItems: { xs: 'stretch', sm: 'center' } }}
          >
            <Button variant="contained" type="button" onClick={onContinue}>
              Answer this question
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
              End here
            </Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
