import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { HelpLevel } from '../learning/contracts.ts';
import { getHelpPolicy, maximumHelpResponses } from '../learning/helpPolicy.ts';
import type { PersistedHelpResponse } from '../learning/history.ts';

const labels: Record<HelpLevel, string> = {
  rephrase: 'Rephrase the question',
  smaller_question: 'Ask a smaller question',
  hint: 'Give me a hint',
  partial_example: 'Show a partial example',
  direct_explanation: 'Explain it directly',
};

export function HelpControls({
  help,
  busy,
  aiAvailable,
  onRequest,
}: {
  help: PersistedHelpResponse[];
  busy: boolean;
  aiAvailable: boolean;
  onRequest(level: HelpLevel): void;
}) {
  const { current, next, canRepeat, canAdvance, terminal } =
    getHelpPolicy(help);

  return (
    <Box component="section" aria-label="Graduated help" sx={{ mt: 4 }}>
      <Stack spacing={2}>
        {help.map((item, index) => (
          <Box
            key={item.id}
            sx={{
              p: 2.5,
              bgcolor: 'background.paper',
              borderLeft: 2,
              borderColor: 'primary.main',
            }}
            role={index === help.length - 1 ? 'status' : undefined}
            aria-live={index === help.length - 1 ? 'polite' : undefined}
            aria-atomic={index === help.length - 1 ? 'true' : undefined}
          >
            <Typography variant="overline" color="text.secondary">
              {labels[item.level]}
            </Typography>
            <Typography sx={{ mt: 1, lineHeight: 1.65 }}>
              {item.content}
            </Typography>
          </Box>
        ))}
      </Stack>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{ mt: 2 }}
      >
        {current && canRepeat && (
          <Button
            disabled={busy || !aiAvailable}
            onClick={() => onRequest(current)}
          >
            Repeat this level · uses AI
          </Button>
        )}
        {next && canAdvance && (
          <Button
            variant="outlined"
            disabled={busy || !aiAvailable}
            onClick={() => onRequest(next)}
          >
            {busy ? 'Preparing help…' : `${labels[next]} · uses AI`}
          </Button>
        )}
      </Stack>
      {(help.length >= maximumHelpResponses || terminal) && (
        <Typography color="text.secondary" sx={{ mt: 2, fontSize: '0.8rem' }}>
          No further help levels are available for this question. Try an answer
          when you are ready.
        </Typography>
      )}
    </Box>
  );
}
