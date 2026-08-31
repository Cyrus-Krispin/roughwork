import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type {
  ExportLearningDataResult,
  LocalDataOperationResult,
  RestoreLearningDataResult,
} from '../learning/localData.ts';

export function LocalDataSection({
  onExport,
  onRestore,
}: {
  onExport(): Promise<LocalDataOperationResult<ExportLearningDataResult>>;
  onRestore(): Promise<LocalDataOperationResult<RestoreLearningDataResult>>;
}) {
  const [busy, setBusy] = useState<'export' | 'restore' | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [privacyOpen, setPrivacyOpen] = useState(false);

  async function exportData(): Promise<void> {
    setBusy('export');
    setMessage('');
    setError('');
    try {
      const result = await onExport();
      if (!result.ok) setError(result.error.message);
      else if (result.data.status === 'saved') {
        setMessage(
          `Backup saved with ${result.data.sessionCount} ${result.data.sessionCount === 1 ? 'session' : 'sessions'}. Keep it private—it contains your answers and AI feedback.`,
        );
      }
    } catch {
      setError(
        "The backup couldn't be saved. Your local history is unchanged.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function restoreData(): Promise<void> {
    setBusy('restore');
    setMessage('');
    setError('');
    try {
      const result = await onRestore();
      if (!result.ok) setError(result.error.message);
      else if (result.data.status === 'restored') {
        setMessage(
          `${result.data.imported} ${result.data.imported === 1 ? 'session' : 'sessions'} added; ${result.data.skipped} already existed. Existing sessions were not changed.`,
        );
      }
    } catch {
      setError(
        "This backup couldn't be restored. Your current history is unchanged.",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <Box
      component="section"
      aria-labelledby="local-data-heading"
      sx={{ mt: 7 }}
    >
      <Typography
        id="local-data-heading"
        component="h2"
        variant="overline"
        color="text.secondary"
        sx={{ fontWeight: 750, letterSpacing: '0.14em' }}
      >
        Local data
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.65 }}>
        Your sessions are stored on this Mac. Export a backup to move or recover
        them. Backups include questions, answers, feedback, help, and
        challenges— never your API key. This works offline and does not use AI.
      </Typography>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{ mt: 2 }}
      >
        <Button
          variant="outlined"
          color="inherit"
          disabled={busy !== null}
          onClick={() => void exportData()}
        >
          {busy === 'export' ? 'Exporting…' : 'Export backup…'}
        </Button>
        <Button
          variant="outlined"
          color="inherit"
          disabled={busy !== null}
          onClick={() => void restoreData()}
        >
          {busy === 'restore' ? 'Checking backup…' : 'Restore backup…'}
        </Button>
        <Button
          color="inherit"
          onClick={() => setPrivacyOpen((open) => !open)}
          aria-expanded={privacyOpen}
        >
          Privacy and data
        </Button>
      </Stack>
      <Collapse in={privacyOpen}>
        <Typography color="text.secondary" sx={{ mt: 2, lineHeight: 1.65 }}>
          Strata AI has no account, sync, telemetry, or remote crash reporting.
          Starting, checking, requesting help, and challenging feedback send the
          visible learning content and bounded recent evidence to DeepSeek.
          Backup files are unencrypted and may sync if you save them to a cloud
          folder. Deleting a session does not remove exported or
          operating-system copies.
        </Typography>
      </Collapse>
      {message && (
        <Alert severity="success" role="status" sx={{ mt: 2 }}>
          {message}
        </Alert>
      )}
      {error && (
        <Alert severity="error" role="alert" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
