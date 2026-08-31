# Privacy and Data

Strata AI 0.1 is a local-first private alpha. It has no account, cloud sync,
telemetry, analytics, or remote crash reporting.

## Data stored on this Mac

Strata AI stores topics, generated questions, learner answers, model evaluations,
evidence excerpts, uncertainty, next-step rationale, requested help, evaluation
challenges, and session state in its application-data directory. A DeepSeek API
key entered in the app is stored separately using Electron secure storage. The
plaintext key is never included in learning backups.

## Data sent to DeepSeek

Starting a session, checking an answer, requesting help, and challenging an
evaluation are explicit AI actions. Those actions send the visible topic,
question, answer or rationale needed for the request. Evaluation may also send
bounded summaries of the three latest prior questions, provisional statuses,
evidence findings, and unresolved gaps. Prior raw answers are not resent. Help
may include at most the five latest help responses.

Strata AI does not make provider calls while reviewing, ending, exporting,
restoring, opening, or deleting local sessions. Provider processing and retention
are governed by the [DeepSeek privacy policy](https://cdn.deepseek.com/policies/en-US/deepseek-privacy-policy.html?os=___).

## Backups and deletion

Learning backups are versioned, human-readable JSON files chosen by the user.
They contain questions, answers, evaluations, help, and challenges. They are not
encrypted. A backup may leave the Mac if the selected destination is synced by
macOS or another service.

Removing a session removes it from Strata AI's current database. It does not
remove exported backups, operating-system backups, synced copies, or guarantee
forensic secure erasure. Uninstalling Strata AI may leave its application-data
directory behind.

Restore is additive: missing sessions are imported, identical sessions are
skipped, and an ID conflict rejects the restore without changing current history.
