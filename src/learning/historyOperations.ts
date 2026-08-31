import type { StrataAiApi } from './ipc.ts';

export type DeleteSessionOutcome = 'deleted' | 'already_absent' | 'failed';

export async function deleteLocalSession(
  api: Pick<StrataAiApi, 'deleteSession'>,
  sessionId: string,
): Promise<DeleteSessionOutcome> {
  try {
    const result = await api.deleteSession({ sessionId });
    if (!result.ok) return 'failed';
    return result.data ? 'deleted' : 'already_absent';
  } catch {
    return 'failed';
  }
}
