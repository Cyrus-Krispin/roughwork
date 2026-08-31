import type { EvaluationResult } from '../learning/contracts.ts';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import { useEffect, useRef, useState } from 'react';
import type { PersistedEvaluationRevision } from '../learning/history.ts';
import {
  evaluationStatusLabel,
  presentEvaluationRevisions,
} from '../learning/presentation.ts';

type FeedbackViewProps = {
  topic: string;
  turn: number;
  question: string;
  answer: string;
  evaluation: EvaluationResult;
  onContinue(): void;
  continueBusy: boolean;
  continueError: string;
  onEnd(): void;
  evaluationHistory: PersistedEvaluationRevision[];
  challengeBusy: boolean;
  challengeError: string;
  onChallenge(rationale: string): void;
};

const nextMoveLabels: Record<EvaluationResult['proposedNextMove'], string> = {
  probe: 'Probe this gap',
  advance: 'Advance to the next idea',
  prerequisite: 'Revisit a prerequisite',
  hint: 'Offer more support',
};

export function FeedbackView({
  topic,
  turn,
  question,
  answer,
  evaluation,
  onContinue,
  continueBusy,
  continueError,
  onEnd,
  evaluationHistory,
  challengeBusy,
  challengeError,
  onChallenge,
}: FeedbackViewProps) {
  const [rationale, setRationale] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousRevisionCount = useRef(evaluationHistory.length);
  const presentedRevisions = presentEvaluationRevisions(evaluationHistory);
  const challengeLimitReached = evaluationHistory.length >= 3;

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    setRationale('');
    if (evaluationHistory.length > previousRevisionCount.current) {
      headingRef.current?.focus();
    }
    previousRevisionCount.current = evaluationHistory.length;
  }, [evaluationHistory.length]);
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
        aria-labelledby="feedback-heading"
        sx={{
          width: 'min(100%, 60rem)',
          mx: 'auto',
        }}
      >
        <Box
          sx={{
            pb: 2,
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
            ref={headingRef}
            tabIndex={-1}
            sx={{ mt: 1.5, fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}
          >
            Provisional evaluation: {evaluationStatusLabel(evaluation.status)}
          </Typography>
        </Box>

        <Accordion
          disableGutters
          elevation={0}
          sx={{
            bgcolor: 'transparent',
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
            columnGap: { md: 6 },
          }}
        >
          <Box
            component="section"
            aria-labelledby="evidence-heading"
            sx={{
              py: 5,
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
            sx={{ py: 5 }}
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
            <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
              Evaluation uncertainty: {evaluation.uncertainty}
            </Typography>
          </Box>
        </Box>

        <Box
          component="section"
          aria-labelledby="next-move-heading"
          sx={{ py: 4, borderTop: 1, borderColor: 'divider' }}
        >
          <Typography
            variant="overline"
            color="primary.main"
            sx={{ fontWeight: 750, letterSpacing: '0.16em' }}
          >
            {nextMoveLabels[evaluation.proposedNextMove]}
          </Typography>
          <Typography
            id="next-move-heading"
            component="h2"
            variant="h2"
            sx={{ mt: 1.5, fontSize: '1.65rem', lineHeight: 1.35 }}
          >
            {evaluation.nextQuestion}
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ mt: 1.25, maxWidth: '46rem', lineHeight: 1.65 }}
          >
            Why this question: {evaluation.nextQuestionRationale}
          </Typography>
        </Box>

        {evaluationHistory.length > 1 && (
          <Accordion
            disableGutters
            elevation={0}
            sx={{ bgcolor: 'transparent', '&::before': { display: 'none' } }}
          >
            <AccordionSummary
              expandIcon={<Box aria-hidden="true">+</Box>}
              sx={{ px: 0 }}
            >
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 700 }}>
                Evaluation history · {evaluationHistory.length} revisions
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 0 }}>
              <Stack spacing={3}>
                {presentedRevisions.map((revision) => (
                  <Box
                    key={revision.id}
                    sx={{ pl: 2.5, borderLeft: 2, borderColor: 'divider' }}
                  >
                    <Typography sx={{ fontWeight: 700 }}>
                      Revision {revision.revision} · {revision.statusLabel}
                      {revision.latest ? ' · latest' : ''}
                    </Typography>
                    <Typography
                      color="text.secondary"
                      sx={{ mt: 0.75, lineHeight: 1.6 }}
                    >
                      {revision.challengeRationale
                        ? `Your challenge: ${revision.challengeRationale}`
                        : 'Original evaluation'}
                    </Typography>
                    <Typography
                      color="text.secondary"
                      sx={{ mt: 0.75, lineHeight: 1.6 }}
                    >
                      Gap recorded: {revision.evaluation.unresolvedGap}
                    </Typography>
                    <Stack
                      component="ul"
                      spacing={0.75}
                      sx={{ mt: 1, mb: 0, pl: 2.5 }}
                    >
                      {revision.evaluation.evidence.map((item) => (
                        <Typography
                          component="li"
                          key={`${revision.id}-${item.excerpt}-${item.finding}`}
                          color="text.secondary"
                          sx={{ lineHeight: 1.55 }}
                        >
                          “{item.excerpt}” — {item.finding}
                        </Typography>
                      ))}
                    </Stack>
                    <Typography
                      color="text.secondary"
                      sx={{ mt: 1, lineHeight: 1.6 }}
                    >
                      Evaluation uncertainty: {revision.evaluation.uncertainty}
                      {' · '}
                      {nextMoveLabels[revision.evaluation.proposedNextMove]}
                    </Typography>
                    <Typography sx={{ mt: 1, lineHeight: 1.6 }}>
                      Next question: {revision.evaluation.nextQuestion}
                    </Typography>
                    <Typography
                      color="text.secondary"
                      sx={{ mt: 0.5, lineHeight: 1.6 }}
                    >
                      Why: {revision.evaluation.nextQuestionRationale}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </AccordionDetails>
          </Accordion>
        )}

        <Box sx={{ pt: 4 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}
          >
            <Button
              variant="contained"
              type="button"
              onClick={onContinue}
              disabled={continueBusy || challengeBusy}
            >
              {continueBusy ? 'Opening…' : 'Next question'}
              <Box component="span" aria-hidden="true" sx={{ ml: 2 }}>
                →
              </Box>
            </Button>
            <Button
              variant="text"
              color="inherit"
              type="button"
              onClick={onEnd}
              disabled={continueBusy || challengeBusy}
            >
              End
            </Button>
          </Stack>
          {continueError && (
            <Typography role="alert" color="error" sx={{ mt: 2 }}>
              {continueError}
            </Typography>
          )}
          <Box component="section" sx={{ mt: 5, maxWidth: '40rem' }}>
            <Typography component="h2" variant="h2" sx={{ fontSize: '1.2rem' }}>
              Think this judgment missed something?
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={2}
              label="Why should Strata reconsider?"
              value={rationale}
              onChange={(event) => setRationale(event.target.value)}
              disabled={challengeBusy || continueBusy || challengeLimitReached}
              helperText={
                challengeLimitReached
                  ? 'Reconsideration limit reached for this answer.'
                  : 'Submitting a challenge uses AI.'
              }
              sx={{ mt: 2 }}
            />
            {challengeError && (
              <Typography role="alert" color="error" sx={{ mt: 1 }}>
                {challengeError}
              </Typography>
            )}
            <Button
              type="button"
              disabled={
                challengeBusy ||
                continueBusy ||
                rationale.trim().length < 2 ||
                challengeLimitReached
              }
              onClick={() => onChallenge(rationale.trim())}
              sx={{ mt: 1.5 }}
            >
              {challengeBusy
                ? 'Reconsidering…'
                : 'Challenge evaluation · uses AI'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
