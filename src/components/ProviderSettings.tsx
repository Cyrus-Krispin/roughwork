import { type FormEvent, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import type { ProviderStatus } from '../learning/ipc.ts';

type ProviderSettingsProps = {
  provider: ProviderStatus;
  busy: boolean;
  error: string;
  expanded: boolean;
  onExpandedChange(expanded: boolean): void;
  onSave(apiKey: string): Promise<boolean>;
  onRemove(): Promise<boolean>;
  onOpenDeepSeekKeys(): Promise<void>;
};

export function ProviderSettings({
  provider,
  busy,
  error,
  expanded,
  onExpandedChange,
  onSave,
  onRemove,
  onOpenDeepSeekKeys,
}: ProviderSettingsProps) {
  const [apiKey, setApiKey] = useState('');
  const apiKeyInputRef = useRef<HTMLInputElement>(null);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (apiKey.trim().length < 8 || busy) return;
    if (await onSave(apiKey)) {
      setApiKey('');
      onExpandedChange(false);
    }
  }

  function closeSettings() {
    setApiKey('');
    onExpandedChange(false);
  }

  async function remove() {
    if (await onRemove()) {
      setApiKey('');
      requestAnimationFrame(() => apiKeyInputRef.current?.focus());
    }
  }

  if (provider.configured && !expanded) {
    return (
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{
          mt: 5,
          pt: 3,
          borderTop: 1,
          borderColor: 'divider',
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: 700 }}>
            DeepSeek API key saved
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ mt: 0.25, fontSize: '0.8rem' }}
          >
            {provider.source === 'secure_store'
              ? 'Encrypted on this Mac · checked on your first request'
              : 'Using the development environment key'}
          </Typography>
        </Box>
        <Button
          type="button"
          variant="text"
          color="inherit"
          onClick={() => onExpandedChange(true)}
        >
          Provider settings
        </Button>
      </Stack>
    );
  }

  return (
    <Box
      component="section"
      aria-labelledby="provider-settings-heading"
      sx={{ mt: 5, py: 4, borderBlock: 1, borderColor: 'divider' }}
    >
      <Typography
        id="provider-settings-heading"
        component="h2"
        variant="h2"
        sx={{ fontSize: '1.45rem' }}
      >
        {provider.configured ? 'Provider settings' : 'Connect DeepSeek'}
      </Typography>
      <Typography
        color="text.secondary"
        sx={{ mt: 1.25, maxWidth: '46rem', lineHeight: 1.65 }}
      >
        Strata sends your topic, answers, and any help or evaluation challenges
        to DeepSeek only when you choose those actions. Your learning history
        stays on this Mac. The key is encrypted with macOS Keychain and is never
        shown again. API usage may be charged to your DeepSeek account, and
        transmitted content is processed under DeepSeek&apos;s policies.
      </Typography>
      <Button
        type="button"
        variant="text"
        onClick={() => void onOpenDeepSeekKeys()}
        sx={{ mt: 1.5, px: 0 }}
      >
        Get a DeepSeek API key
      </Button>

      {provider.problem && (
        <Typography role="alert" color="error" sx={{ mt: 2, lineHeight: 1.6 }}>
          {provider.problem}
        </Typography>
      )}
      {provider.secureStorageAvailable === false && !provider.problem && (
        <Typography role="alert" color="error" sx={{ mt: 2, lineHeight: 1.6 }}>
          Keychain encryption is unavailable. Unlock Keychain, then reopen
          Strata AI.
        </Typography>
      )}
      {error && (
        <Typography role="alert" color="error" sx={{ mt: 2, lineHeight: 1.6 }}>
          {error}
        </Typography>
      )}

      <Box component="form" onSubmit={save} sx={{ mt: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="DeepSeek API key"
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            disabled={busy || provider.secureStorageAvailable === false}
            autoFocus={!provider.configured}
            autoComplete="off"
            inputRef={apiKeyInputRef}
            fullWidth
            slotProps={{ htmlInput: { maxLength: 512 } }}
          />
          <Button
            variant="contained"
            type="submit"
            disabled={
              busy ||
              provider.secureStorageAvailable === false ||
              apiKey.trim().length < 8
            }
            sx={{ whiteSpace: 'nowrap', px: 3 }}
          >
            {busy ? 'Saving…' : 'Save key'}
          </Button>
        </Stack>
      </Box>

      {(provider.configured || provider.hasStoredCredential) && (
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          {provider.configured && (
            <Button
              type="button"
              variant="text"
              color="inherit"
              disabled={busy}
              onClick={closeSettings}
            >
              Cancel
            </Button>
          )}
          {provider.hasStoredCredential && (
            <Button
              type="button"
              variant="text"
              color="error"
              disabled={busy}
              onClick={() => void remove()}
            >
              Remove saved key
            </Button>
          )}
        </Stack>
      )}
    </Box>
  );
}
