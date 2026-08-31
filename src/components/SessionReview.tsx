import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { PersistedTurn } from '../learning/history.ts';
import { SessionSummary } from './SessionSummary';

type SessionReviewProps = {
  topic: string;
  turns: PersistedTurn[];
  onDone(): void;
  headingLabel?: string;
  actionLabel?: string;
};

export function SessionReview({
  topic,
  turns,
  onDone,
  headingLabel = 'Session history',
  actionLabel = 'Back to topics',
}: SessionReviewProps) {
  return (
    <Box component="main" sx={{ px: { xs: 2.5, sm: 6 }, py: 6 }}>
      <Box sx={{ width: 'min(100%, 56rem)', mx: 'auto' }}>
        <Typography variant="overline" color="text.secondary">
          {headingLabel}
        </Typography>
        <Typography
          component="h1"
          variant="h1"
          sx={{ mt: 1, fontSize: '3rem' }}
        >
          {topic}
        </Typography>
        <SessionSummary turns={turns} />
        <Typography
          component="h2"
          variant="h2"
          sx={{ mt: 8, fontSize: '1.65rem' }}
        >
          Turn by turn
        </Typography>
        <Stack divider={<Divider flexItem />} sx={{ mt: 5 }}>
          {turns.map((turn) => (
            <Box key={turn.questionId} component="article" sx={{ py: 4 }}>
              <Typography color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                Question {turn.turn}
              </Typography>
              <Typography
                component="h3"
                variant="h2"
                sx={{ mt: 1, fontSize: '1.45rem' }}
              >
                {turn.question}
              </Typography>
              {turn.answer ? (
                <Typography sx={{ mt: 2.5, lineHeight: 1.7 }}>
                  {turn.answer}
                </Typography>
              ) : (
                <Typography color="text.secondary" sx={{ mt: 2.5 }}>
                  Not answered
                </Typography>
              )}
              {turn.evaluation && (
                <Box sx={{ mt: 3 }}>
                  <Chip size="small" label={turn.evaluation.status} />
                  <Typography
                    color="text.secondary"
                    sx={{ mt: 1.5, lineHeight: 1.6 }}
                  >
                    Gap: {turn.evaluation.unresolvedGap}
                  </Typography>
                </Box>
              )}
              {turn.help.length > 0 && (
                <Typography color="text.secondary" sx={{ mt: 2 }}>
                  Help used:{' '}
                  {turn.help
                    .map((item) => item.level.replace('_', ' '))
                    .join(' → ')}
                </Typography>
              )}
              {turn.evaluationHistory.length > 1 && (
                <Box sx={{ mt: 2 }}>
                  <Typography color="text.secondary">
                    Evaluation revisions: {turn.evaluationHistory.length}
                  </Typography>
                  {turn.evaluationHistory.slice(1).map((revision) => (
                    <Typography
                      key={revision.id}
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      Challenge: {revision.challengeRationale}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          ))}
        </Stack>
        <Button
          variant="contained"
          type="button"
          onClick={onDone}
          sx={{ mt: 4 }}
        >
          {actionLabel}
        </Button>
      </Box>
    </Box>
  );
}
