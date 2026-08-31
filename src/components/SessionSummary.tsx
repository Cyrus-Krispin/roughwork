import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { EvaluationResult } from '../learning/contracts.ts';
import type { PersistedTurn } from '../learning/history.ts';
import { summarizeLearningSession } from '../learning/summary.ts';

type SessionSummaryProps = {
  turns: PersistedTurn[];
};

const statusLabels: Record<EvaluationResult['status'], string> = {
  demonstrated: 'demonstrated',
  partial: 'developing',
  misconception: 'needs correction',
  uncertain: 'uncertain',
};

export function SessionSummary({ turns }: SessionSummaryProps) {
  const summary = summarizeLearningSession(turns);
  const stats = [
    summary.answeredTurns +
      (summary.answeredTurns === 1 ? ' answer examined' : ' answers examined'),
    summary.helpSteps
      ? summary.helpSteps +
        (summary.helpSteps === 1 ? ' help step' : ' help steps')
      : '',
    summary.revisedJudgments
      ? summary.revisedJudgments +
        (summary.revisedJudgments === 1
          ? ' judgment revised'
          : ' judgments revised')
      : '',
  ].filter(Boolean);

  return (
    <Box
      component="section"
      aria-labelledby="session-evidence-heading"
      sx={{ mt: 6 }}
    >
      <Typography
        id="session-evidence-heading"
        component="h2"
        variant="h2"
        sx={{ fontSize: '1.65rem' }}
      >
        Your learning edge
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1.25, lineHeight: 1.65 }}>
        This summary comes from your saved answers and Strata&apos;s latest
        provisional judgments.
      </Typography>
      <Stack
        direction="row"
        divider={<Divider orientation="vertical" flexItem />}
        spacing={1.5}
        sx={{ mt: 3, flexWrap: 'wrap', rowGap: 1 }}
      >
        {stats.map((stat) => (
          <Typography
            key={stat}
            variant="overline"
            color="text.secondary"
            sx={{ fontWeight: 700 }}
          >
            {stat}
          </Typography>
        ))}
      </Stack>

      {summary.answeredTurns === 0 ? (
        <Box sx={{ mt: 5, py: 4, borderTop: 1, borderColor: 'divider' }}>
          <Typography sx={{ fontSize: '1.15rem', lineHeight: 1.6 }}>
            No answer was submitted in this session.
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1, lineHeight: 1.6 }}>
            Return when you are ready to make an attempt—the first answer is
            what gives Strata evidence to work with.
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            mt: 5,
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'minmax(0, 1.15fr) minmax(16rem, 0.85fr)',
            },
            gap: { xs: 5, md: 7 },
          }}
        >
          <Box
            component="section"
            aria-labelledby="session-evidence-list-heading"
          >
            <Typography
              id="session-evidence-list-heading"
              component="h3"
              variant="overline"
              color="text.secondary"
              sx={{ fontWeight: 750, letterSpacing: '0.14em' }}
            >
              What your answers showed
            </Typography>
            <Stack spacing={2.5} sx={{ mt: 2.5 }}>
              {summary.evidence.map((item) => (
                <Box
                  component="blockquote"
                  key={[item.turn, item.excerpt, item.finding].join('-')}
                  sx={{
                    m: 0,
                    pl: 2.5,
                    borderLeft: 2,
                    borderColor: 'primary.main',
                  }}
                >
                  <Typography sx={{ lineHeight: 1.55 }}>
                    “{item.excerpt}”
                  </Typography>
                  <Typography
                    color="text.secondary"
                    sx={{ mt: 0.75, fontSize: '0.78rem', lineHeight: 1.55 }}
                  >
                    {item.finding} · Turn {item.turn} ·{' '}
                    {statusLabels[item.status]}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          <Box component="section" aria-labelledby="session-gaps-heading">
            <Typography
              id="session-gaps-heading"
              component="h3"
              variant="overline"
              color="text.secondary"
              sx={{ fontWeight: 750, letterSpacing: '0.14em' }}
            >
              Edges to revisit
            </Typography>
            <Stack component="ol" spacing={2} sx={{ mt: 2.5, mb: 0, pl: 2.5 }}>
              {summary.unresolvedGaps.map((item) => (
                <Typography
                  component="li"
                  key={[item.turn, item.gap].join('-')}
                  sx={{ pl: 1, lineHeight: 1.55 }}
                >
                  {item.gap}
                </Typography>
              ))}
            </Stack>
          </Box>
        </Box>
      )}

      {summary.nextQuestion && (
        <Box sx={{ mt: 6, pt: 4, borderTop: 1, borderColor: 'divider' }}>
          <Typography
            variant="overline"
            color="primary.main"
            sx={{ fontWeight: 750, letterSpacing: '0.14em' }}
          >
            A useful next step
          </Typography>
          <Typography sx={{ mt: 1.5, fontSize: '1.35rem', lineHeight: 1.45 }}>
            {summary.nextQuestion}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
