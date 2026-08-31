import { type FormEvent, useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import type { LearningSessionSummary } from '../learning/history.ts';
import type { ProviderStatus } from '../learning/ipc.ts';
import type {
  ExportLearningDataResult,
  LocalDataOperationResult,
  RestoreLearningDataResult,
} from '../learning/localData.ts';
import { LocalDataSection } from './LocalDataSection';
import { ProviderSettings } from './ProviderSettings';
import { SessionHistory } from './SessionHistory';

const suggestions = ['Neural networks', 'Derivatives', 'Database indexes'];

type StartViewProps = {
  provider: ProviderStatus;
  providerBusy: boolean;
  providerError: string;
  learningEnabled: boolean;
  sessions: LearningSessionSummary[];
  historyLoading: boolean;
  historyError: string;
  onStart(topic: string): Promise<void>;
  onOpenSession(sessionId: string): Promise<void>;
  onRetryHistory(): Promise<void>;
  onDeleteSession(sessionId: string): Promise<boolean>;
  onSaveProviderCredential(apiKey: string): Promise<boolean>;
  onRemoveProviderCredential(): Promise<boolean>;
  onOpenDeepSeekKeys(): Promise<void>;
  onExportLearningData(): Promise<
    LocalDataOperationResult<ExportLearningDataResult>
  >;
  onRestoreLearningData(): Promise<
    LocalDataOperationResult<RestoreLearningDataResult>
  >;
  providerSettingsInitiallyExpanded?: boolean;
};

export function StartView({
  provider,
  providerBusy,
  providerError,
  learningEnabled,
  sessions,
  historyLoading,
  historyError,
  onStart,
  onOpenSession,
  onRetryHistory,
  onDeleteSession,
  onSaveProviderCredential,
  onRemoveProviderCredential,
  onOpenDeepSeekKeys,
  onExportLearningData,
  onRestoreLearningData,
  providerSettingsInitiallyExpanded = false,
}: StartViewProps) {
  const [topic, setTopic] = useState('');
  const topicInputRef = useRef<HTMLInputElement>(null);
  const [providerSettingsExpanded, setProviderSettingsExpanded] = useState(
    !provider.configured || providerSettingsInitiallyExpanded,
  );

  useEffect(() => {
    if (learningEnabled) topicInputRef.current?.focus();
  }, [learningEnabled]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (learningEnabled && topic.trim().length >= 2) void onStart(topic);
  }

  return (
    <Box
      component="main"
      sx={{
        display: 'flex',
        minHeight: 'calc(100vh - 4rem)',
        alignItems: 'flex-start',
        justifyContent: 'center',
        px: { xs: 2.5, sm: 6 },
        py: { xs: 5, sm: 7 },
      }}
    >
      <Box
        component="section"
        aria-labelledby="start-heading"
        sx={{
          width: 'min(100%, 56rem)',
        }}
      >
        <Typography
          id="start-heading"
          component="h1"
          variant="h1"
          sx={{
            maxWidth: '18ch',
            fontSize: { xs: '2.75rem', sm: 'clamp(3rem, 6vw, 4.75rem)' },
            lineHeight: 0.98,
          }}
        >
          {learningEnabled
            ? 'What should we learn?'
            : 'First, connect DeepSeek.'}
        </Typography>
        {!learningEnabled && (
          <ProviderSettings
            provider={provider}
            busy={providerBusy}
            error={providerError}
            expanded
            onExpandedChange={setProviderSettingsExpanded}
            onSave={onSaveProviderCredential}
            onRemove={onRemoveProviderCredential}
            onOpenDeepSeekKeys={onOpenDeepSeekKeys}
          />
        )}
        <Box component="form" onSubmit={submit} sx={{ mt: { xs: 5, sm: 7 } }}>
          <TextField
            variant="standard"
            fullWidth
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            autoFocus={learningEnabled}
            inputRef={topicInputRef}
            disabled={!learningEnabled || providerBusy}
            placeholder={
              learningEnabled
                ? 'A topic or question'
                : 'Connect a provider to begin'
            }
            slotProps={{
              input: {
                sx: {
                  fontSize: { xs: '1.5rem', sm: '2rem' },
                  fontWeight: 400,
                  lineHeight: 1.4,
                  pb: 1.5,
                },
              },
              htmlInput: { 'aria-label': 'Topic or question', maxLength: 160 },
            }}
          />
          <Button
            variant="contained"
            type="submit"
            disabled={
              !learningEnabled || providerBusy || topic.trim().length < 2
            }
            sx={{ mt: 3 }}
          >
            Start session · uses AI
          </Button>
        </Box>
        <Box
          aria-label="Suggested topics"
          sx={{
            mt: { xs: 4, sm: 5 },
          }}
        >
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {suggestions.map((suggestion) => (
              <Button
                key={suggestion}
                variant="text"
                color="inherit"
                type="button"
                disabled={!learningEnabled || providerBusy}
                onClick={() => {
                  setTopic(suggestion);
                  topicInputRef.current?.focus();
                }}
                sx={{ color: 'text.secondary', fontSize: '0.78rem' }}
              >
                {suggestion}
              </Button>
            ))}
          </Box>
        </Box>
        {learningEnabled && (
          <ProviderSettings
            provider={provider}
            busy={providerBusy}
            error={providerError}
            expanded={providerSettingsExpanded}
            onExpandedChange={setProviderSettingsExpanded}
            onSave={onSaveProviderCredential}
            onRemove={onRemoveProviderCredential}
            onOpenDeepSeekKeys={onOpenDeepSeekKeys}
          />
        )}
        <SessionHistory
          sessions={sessions}
          loading={historyLoading}
          error={historyError}
          onOpen={onOpenSession}
          onDelete={onDeleteSession}
          onRetry={onRetryHistory}
        />
        <LocalDataSection
          onExport={onExportLearningData}
          onRestore={onRestoreLearningData}
        />
      </Box>
    </Box>
  );
}
