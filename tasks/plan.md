# Implementation Plan: Strata AI 0.1 Private Alpha

## Overview

Turn the implemented adaptive learning loop into a coherent macOS product a
learner can configure and trust. The release candidate must preserve feedback
across restarts, end with an attributable evidence summary, make provider data
flow explicit, protect limited model credits, and package with deliberate release
metadata. The plan favors completing the existing promise over adding breadth.

## Architecture Decisions

- Keep SQLite and all provider/credential operations in Electron's main process.
- Persist feedback acknowledgement instead of treating it as transient React state.
- Derive session summaries locally from the latest stored evaluation revisions.
- Store packaged credentials with Electron `safeStorage`; `.env` is development-only.
- Make provider calls explicit, non-retrying, and coalesced in the main process.
- Keep telemetry out of the private alpha and verify live AI behavior with a hard
  four-call release-candidate budget.
- Record ongoing choices in `docs/decision-log.md`.

## Task List

### Phase 1: Durable learning loop

- [ ] Task 1: Persist pending feedback and acknowledge continue explicitly
- [ ] Task 2: Correct latest-revision session summaries and end-state counts
- [ ] Task 3: Add deterministic evidence-based session payoff

### Checkpoint: Trustworthy session lifecycle

- [ ] Closing after evaluation resumes at feedback
- [ ] Continuing once activates exactly one persisted next question
- [ ] Ending is instant, offline, and shows attributable evidence and gaps
- [ ] Focused repository, service, reducer, and UI behavior tests pass

### Phase 2: Real-user onboarding and trust

- [ ] Task 4: Add encrypted provider credential storage and validated IPC
- [ ] Task 5: Build first-run setup and credential-management experience
- [ ] Task 6: Expose uncertainty, next-move rationale, and revision provenance
- [ ] Task 7: Make history loading errors and privacy/data flow explicit

### Checkpoint: Packaged app usability

- [ ] A new user can configure, replace, and remove a key without a terminal
- [ ] Provider credentials never enter renderer state, logs, or tracked files
- [ ] The interface explains which explicit actions send content to DeepSeek
- [ ] The complete UI is keyboard navigable with meaningful focus transitions

### Phase 3: Credit safety and adaptive quality

- [ ] Task 8: Disable automatic provider retries and coalesce concurrent requests
- [ ] Task 9: Pass bounded recent evidence into adaptive evaluation
- [ ] Task 10: Bound repeated help and show clear cost-conscious actions

### Checkpoint: Bounded provider behavior

- [ ] Concurrent identical operations cause one provider call
- [ ] Retry behavior is explicit and tested with fakes
- [ ] Context contains only the bounded recent turns needed for adaptation
- [ ] No automated test requires a DeepSeek key or network call

### Phase 4: Release hardening

- [ ] Task 11: Deny navigation, popups, and unexpected Electron permissions
- [ ] Task 12: Add 0.1 metadata, application identity, and release documentation
- [ ] Task 13: Add deterministic CI and clean packaging gates
- [ ] Task 14: Add local export/backup and database-open recovery guidance
- [ ] Task 15: Add component and packaged critical-flow verification

### Checkpoint: Release candidate

- [ ] Lint, typecheck, tests, formatting, audit triage, package, and make pass
- [ ] Fresh and migrated databases complete the mocked packaged flow
- [ ] Packaged UI is visually reviewed at supported window sizes
- [ ] One optional live four-call smoke passes without automatic retries
- [ ] Release, rollback, privacy, and signing/notarization requirements are documented
- [ ] Independent product, architecture, security, and code reviews are resolved

## Risks and Mitigations

| Risk                                      | Impact | Mitigation                                                            |
| ----------------------------------------- | ------ | --------------------------------------------------------------------- |
| Migration skips or duplicates feedback    | High   | Additive state, transaction tests, version-1/2 migration fixtures     |
| Credential is exposed to renderer or disk | High   | Main-process adapter, `safeStorage`, IPC allowlist, secret scans      |
| Concurrent retries spend credits twice    | High   | Authoritative in-flight coalescing and SDK retries disabled           |
| Deterministic summary overstates learning | High   | Use exact latest evidence and provisional labels; no mastery score    |
| Build-chain advisories block release      | High   | Triage reachability and upgrade Forge safely; never force audit fixes |
| UI polish drifts across flows             | Medium | Shared theme, compact layout vocabulary, packaged visual review       |
| Signing credentials are unavailable       | Medium | Prepare config/docs; mark public distribution blocked until supplied  |

## Open Questions

None currently require owner input. Apple signing/notarization credentials become
an external prerequisite only when publishing beyond a private local alpha.
