# Strata AI 0.1 Checklist

Tasks are dependency-ordered. Every behavioral change follows RED → GREEN →
REFACTOR with mocked providers; live DeepSeek verification is opt-in and capped.

## Task 1: Persist pending feedback

**Acceptance criteria:**

- [x] Evaluation persistence records that learner feedback awaits acknowledgement.
- [x] Reopening returns to the exact pending feedback, answer, and revisions.
- [x] Continue acknowledges feedback once and activates the stored child question.

**Verification:** focused repository/service/reducer tests; migrated database test;
manual quit/resume check.

**Dependencies:** None. **Scope:** Medium (4–5 files).

## Task 2: Correct summaries and counts

**Acceptance criteria:**

- [x] Session lists count each attempt's latest evaluation revision.
- [x] Ended views count answered attempts, never the unanswered child question.
- [x] Challenged judgments update summaries without deleting prior provenance.

**Verification:** repository regression tests and renderer state tests.

**Dependencies:** Task 1. **Scope:** Small (2–3 files).

## Task 3: Deliver the session payoff

**Acceptance criteria:**

- [x] End and review show demonstrated evidence, unresolved gaps, help use, and corrections.
- [x] Every claim is derived from persisted data with no provider request.
- [x] Empty/short sessions receive a useful, honest next action.

**Verification:** pure summary tests and manual responsive/accessibility review.

**Dependencies:** Task 2. **Scope:** Medium (3–5 files).

## Tasks 4–7: Onboarding and visible trust

- [x] Encrypted key store with setup/remove/status IPC and tests.
- [x] First-run and settings UI with clear start action and privacy explanation.
- [x] Plain-language uncertainty, next-step rationale, and evaluation revision history.
- [x] Explicit history error/retry state and focus/live-region behavior.

**Verification:** boundary tests, mocked component/flow tests, secret scan, packaged UI review.

**Dependencies:** Task 3. **Scope:** Four small/medium increments.

## Tasks 8–10: Credit-safe adaptation

- [x] Disable SDK retries and serialize concurrent main-process provider operations.
- [x] Add bounded recent-turn context to evaluation prompts.
- [x] Cap repeated help/context and clarify when an action makes a new AI request.

**Verification:** concurrent fake-provider tests, prompt contract tests, no network.

**Dependencies:** Provider setup can proceed independently after its contract is fixed.
**Scope:** Three small/medium increments.

## Tasks 11–15: Release hardening

- [x] Explicit navigation, popup, permission, and external-content denial.
- [x] Version 0.1.0, stable bundle identity, clean plist metadata, changelog, privacy,
      release, signing/notarization, and rollback documentation.
- [x] CI runs clean install, lint, typecheck, tests, formatting, audit triage, and package.
- [x] Local session export/backup plus database recovery guidance.
- [x] Mocked component and packaged critical-flow checks cover onboarding, retry,
      pending feedback, help, challenge, end summary, deletion, and keyboard use.

**Verification:** full deterministic gate, clean artifact, audit report, independent review.

**Dependencies:** Tasks 1–10. **Scope:** Five focused increments.

## Final release-candidate gate

- [x] No unresolved Critical or Required review finding.
- [x] No secret or learner fixture in tracked output.
- [x] Runtime dependency audit is clean; reachable build advisories are fixed or explicitly blocked.
- [x] `npm run lint`, `npm run typecheck`, `npm test`, `npm run format:check`,
      `npm run package`, and `npm run make` pass after the final change.
- [x] Packaged journey works with a fake provider and a fresh local profile.
- [x] Optional live smoke uses exactly four explicit calls with fixed, non-sensitive text.
- [ ] Pull request to `main` explains product value, risks, verification, and release prerequisites.
