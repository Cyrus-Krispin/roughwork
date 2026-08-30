import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { LearningSessionSummary } from '../learning/history.ts';

type SessionHistoryProps = {
  sessions: LearningSessionSummary[];
  loading: boolean;
  onOpen(sessionId: string): Promise<void>;
  onDelete(sessionId: string): Promise<void>;
};

function progressLabel(session: LearningSessionSummary): string {
  const counts = session.evaluationCounts;
  const parts = [
    counts.demonstrated ? `${counts.demonstrated} demonstrated` : '',
    counts.partial ? `${counts.partial} partial` : '',
    counts.misconception ? `${counts.misconception} to revisit` : '',
    counts.uncertain ? `${counts.uncertain} uncertain` : '',
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : 'No answered questions yet';
}

export function SessionHistory({
  sessions,
  loading,
  onOpen,
  onDelete,
}: SessionHistoryProps) {
  const [deleteTarget, setDeleteTarget] =
    useState<LearningSessionSummary | null>(null);

  async function confirmDelete(): Promise<void> {
    if (!deleteTarget) return;
    await onDelete(deleteTarget.id);
    setDeleteTarget(null);
  }

  return (
    <Box
      component="section"
      aria-labelledby="recent-sessions-heading"
      sx={{ mt: 8 }}
    >
      <Typography
        id="recent-sessions-heading"
        component="h2"
        variant="overline"
        color="text.secondary"
        sx={{ fontWeight: 750, letterSpacing: '0.14em' }}
      >
        Recent sessions
      </Typography>
      {loading && (
        <Typography color="text.secondary" sx={{ mt: 2, fontSize: '0.82rem' }}>
          Loading local history…
        </Typography>
      )}
      {!loading && sessions.length === 0 && (
        <Typography color="text.secondary" sx={{ mt: 2, fontSize: '0.82rem' }}>
          Your learning evidence will appear here.
        </Typography>
      )}
      <Stack divider={<Divider flexItem />} sx={{ mt: 1.5 }}>
        {sessions.map((session) => (
          <Box
            key={session.id}
            sx={{
              py: 2.25,
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr auto' },
              gap: 2,
              alignItems: 'center',
            }}
          >
            <Box>
              <Typography sx={{ fontWeight: 650 }}>{session.topic}</Typography>
              <Typography
                color="text.secondary"
                sx={{ mt: 0.6, fontSize: '0.76rem', lineHeight: 1.5 }}
              >
                {session.status === 'active' ? 'Active' : 'Ended'} ·{' '}
                {session.answeredTurns} answered · {progressLabel(session)}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                color="inherit"
                type="button"
                onClick={() => void onOpen(session.id)}
              >
                {session.status === 'active' ? 'Continue' : 'Review'}
              </Button>
              <Button
                variant="text"
                color="error"
                type="button"
                onClick={() => setDeleteTarget(session)}
                aria-label={`Delete ${session.topic} session`}
              >
                Delete
              </Button>
            </Stack>
          </Box>
        ))}
      </Stack>

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
      >
        <DialogTitle>Delete this local session?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteTarget?.topic} and all of its answers and evaluation evidence
            will be permanently deleted from this device.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            type="button"
            color="inherit"
            onClick={() => setDeleteTarget(null)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            color="error"
            onClick={() => void confirmDelete()}
          >
            Delete session
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
