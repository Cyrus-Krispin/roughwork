# Strata AI Decision Log

This living log records consequential product, experience, architecture, testing,
privacy, and release decisions made while preparing Strata AI for real users. It
complements focused ADRs in `docs/decisions/`. New entries are appended; changed
decisions are superseded rather than silently rewritten.

## D001 — Optimize for a trustworthy private alpha

- **Status:** Accepted
- **Date:** 2026-08-31
- **Decision:** Treat version 0.1 as a private macOS alpha that a learner can
  install, configure, use, resume, and understand without editing source files.
- **Why:** The learning loop exists, but onboarding, durable feedback, session
  closure, and release hygiene are the gaps between a demo and a usable product.
- **Alternatives:** Add broader learning features now; publish the current
  unsigned `0.0.0` build. Both would increase surface area without earning trust.
- **Consequences:** Retention, sources, and the evidence graph remain deferred
  until the complete current loop is reliable and understandable.
- **Reversibility:** High. The alpha bar can expand without invalidating the core.

## D002 — Keep product decisions autonomous and auditable

- **Status:** Accepted
- **Date:** 2026-08-31
- **Decision:** Make in-scope product and engineering decisions without pausing
  for routine approval, then record the evidence, alternatives, tradeoffs, and
  reversibility here. Stop only for new authority, credentials, irreversible
  external actions, or a choice that materially changes the product thesis.
- **Why:** The owner explicitly delegated routine decisions and requested a
  durable record instead of repeated questions.
- **Alternatives:** Ask before each change. Rejected because it prevents sustained
  autonomous progress without improving safety for reversible repository work.
- **Consequences:** The implementation plan and this log become the source of
  truth for scope and rationale.
- **Reversibility:** High.

## D003 — Preserve feedback acknowledgement as durable session state

- **Status:** Accepted
- **Date:** 2026-08-31
- **Decision:** Persist whether the latest evaluation still awaits learner
  acknowledgement. Reopening the app must return to that feedback before the
  generated child question becomes active.
- **Why:** The current database advances immediately, so quitting after an
  evaluation can permanently skip the feedback and challenge opportunity.
- **Alternatives:** Infer pending feedback only in React; mark feedback seen when
  rendered. Both fail across crashes and do not represent explicit learner intent.
- **Consequences:** A small versioned migration and a named continue operation are
  required. Existing sessions migrate without rewriting attempts or evaluations.
- **Reversibility:** Medium; the schema is additive and can remain unused later.

## D004 — Build session summaries deterministically

- **Status:** Accepted
- **Date:** 2026-08-31
- **Decision:** Derive the end-of-session payoff from persisted latest evaluation
  revisions, exact evidence, unresolved gaps, help use, and challenges. Do not make
  another model call to end a session.
- **Why:** The user should receive a useful outcome even offline, and ending a
  session should never cost credits or block on the provider.
- **Alternatives:** Ask DeepSeek to synthesize a summary. Rejected for cost,
  latency, failure risk, and the possibility of introducing unsupported claims.
- **Consequences:** Copy will describe evidence, not mastery, and will remain fully
  attributable to stored turns.
- **Reversibility:** High; a later optional synthesis can layer on top.

## D005 — Store provider credentials with Electron safe storage

- **Status:** Accepted
- **Date:** 2026-08-31
- **Decision:** Add first-run in-app DeepSeek key setup. Encrypt the credential with
  Electron `safeStorage`, keep the encrypted file in the app data directory, and
  retain `.env` only as a development fallback. The key exists transiently in a
  trusted password field and crosses one validated IPC operation; it is never
  returned, logged, or persisted by React.
- **Why:** A Finder-launched packaged app cannot reasonably depend on a project
  `.env`, while `safeStorage` uses the operating system's credential protection
  without adding a production dependency.
- **Alternatives:** Plaintext settings file; a new keychain dependency; bundled
  managed credentials. They are respectively unsafe, unnecessary, or out of scope.
- **Consequences:** Setup, replace, and remove operations cross a narrow validated
  preload bridge. Stored operations are serialized, and encrypted state can be
  removed even when it cannot be decrypted. The UI discloses that explicit learning
  actions send content to DeepSeek and may incur provider charges.
- **Reversibility:** Medium; the storage adapter can later move to a managed key.

## D006 — Spend model credits only on explicit, bounded actions

- **Status:** Accepted
- **Date:** 2026-08-31
- **Decision:** Disable provider SDK automatic retries, coalesce concurrent requests
  by operation identity, bound prior-turn/help context, and keep live verification
  opt-in with a four-call release-candidate budget.
- **Why:** Silent retries and concurrent duplicates can spend credits without
  creating additional learner value.
- **Alternatives:** Rely only on disabled buttons or SDK retries. Renderer guards do
  not protect the authoritative main-process boundary, and automatic retries are
  opaque billable behavior.
- **Consequences:** Most tests remain deterministic and network-free. One targeted
  release smoke may use a diagnostic, evaluation, help, and challenge call.
- **Reversibility:** High; limits can be tuned from observed product use.

## D007 — Ship with local-only diagnostics and no telemetry

- **Status:** Accepted
- **Date:** 2026-08-31
- **Decision:** Do not add analytics or remote crash reporting for the private
  alpha. Provide clear local recovery messages and an exportable diagnostic path
  that the learner must choose to share.
- **Why:** Local-first trust is part of the product promise, and telemetry is not
  required to validate the core loop with a small alpha cohort.
- **Alternatives:** Add hosted analytics before launch. Rejected because it adds a
  new data recipient, consent surface, and service dependency.
- **Consequences:** Product learning comes from explicit alpha feedback until a
  later telemetry decision is made.
- **Reversibility:** High.

## D008 — Use 0.1.0 as the first coherent product version

- **Status:** Accepted
- **Date:** 2026-08-31
- **Decision:** Set the application version to `0.1.0`, use a stable Strata AI
  bundle identifier and macOS application metadata, and prepare signing and
  notarization configuration without inventing credentials.
- **Why:** `0.0.0`, generic Electron metadata, and an unsigned artifact do not
  communicate a deliberate release boundary.
- **Alternatives:** Wait for every long-term feature before versioning. Rejected
  because versioning describes product maturity, not feature completeness.
- **Consequences:** The pull request can produce a release candidate; public
  distribution still requires the owner's Apple signing/notarization credentials.
- **Reversibility:** Low for the version number and bundle identity; both should be
  treated as stable once distributed.

## D009 — Adapt from bounded persisted evidence

- **Status:** Accepted
- **Date:** 2026-08-31
- **Decision:** Give evaluation at most the three latest prior questions, provisional
  statuses, evidence findings, and unresolved gaps. Do not resend prior raw answers.
  Send at most five prior help responses, allow two responses per help level (one
  direct explanation), cap help at nine responses per question, and allow two
  evaluation reconsiderations per answer. Run only one provider operation at a time.
- **Why:** Recent evidence makes follow-up questions genuinely adaptive without
  allowing session length, repeated clicks, or SDK behavior to create unbounded
  context and credit spend.
- **Alternatives:** Send the full transcript or summarize it with another model call.
  Rejected because both scale cost with session length and increase disclosure.
- **Consequences:** The UI labels every action that uses AI and explains when a
  per-question limit is reached. Older evidence remains available locally in review
  but does not enter the current prompt.
- **Reversibility:** High; bounds can change after measured private-alpha use.

## D010 — Make learning backups portable and additive

- **Status:** Accepted
- **Date:** 2026-08-31
- **Decision:** Export complete visible learning provenance as a versioned,
  owner-private JSON file. Restore only after whole-file validation and native
  confirmation; import missing sessions, skip identical IDs, and reject any
  conflict without mutation. Never include credentials or filesystem paths. If
  the live database cannot open, move its database/WAL/SHM set into a timestamped
  private recovery folder before creating clean local history; roll back partial
  moves.
- **Why:** A local-first product needs a user-controlled exit and recovery path.
  Copying the live WAL-mode SQLite file is neither portable nor reliably complete.
- **Alternatives:** One-way JSON export or raw database copying. Rejected because
  neither gives ordinary learners a safe restore workflow.
- **Consequences:** Backups are readable and portable but unencrypted, so the UI
  and privacy documentation tell users to keep them private.
- **Reversibility:** Medium; format version 1 becomes a compatibility promise.

## D011 — Release 0.1 as a hardened private macOS alpha

- **Status:** Accepted; architecture scope partially superseded by D015
- **Date:** 2026-08-31
- **Decision:** Support macOS 13+ on arm64 and x64, use `ai.strata.learning`, strict
  Electron fuses, architecture-verified native ZIP artifacts for both targets,
  deterministic CI, and a structurally valid
  ad-hoc signature for internal builds. Require Developer ID signing and Apple
  notarization before public distribution.
- **Why:** Product identity and artifact invariants must be verifiable without
  pretending unavailable Apple credentials exist.
- **Alternatives:** Keep generic Electron metadata or claim unsigned builds are
  publicly releasable. Both fail the trust boundary.
- **Consequences:** Internal users can evaluate a coherent release candidate;
  public release remains an explicit external prerequisite. Forge currently loads
  the packaged renderer with `file://`, so the file-protocol extra-privileges fuse
  remains enabled for the private alpha behind ASAR integrity, sandboxing, strict
  CSP, and navigation/permission denial. Move the renderer to a privileged custom
  `app://` protocol and disable that fuse before public distribution. The
  browser-specific V8 snapshot fuse remains disabled because this package does not
  ship the snapshot it requires.
- **Reversibility:** Low for bundle identity and backup compatibility; high for CI
  and maker details.

## D012 — Keep Forge's file renderer only for the private alpha

- **Status:** Accepted
- **Date:** 2026-09-01
- **Decision:** Disable the browser-specific V8 snapshot fuse because the package
  does not ship its required snapshot. Keep file-protocol extra privileges enabled
  only while Forge loads the private-alpha renderer through `file://`; require a
  privileged custom `app://` protocol and disable that fuse before public release.
- **Why:** Packaged launch testing proved that the opposite fuse settings either
  crash the app or prevent its renderer from loading. The current functional path
  is bounded by ASAR integrity, renderer sandboxing, strict CSP, exact IPC sender
  checks, and navigation, popup, network, and permission denial.
- **Alternatives:** Ship the broken strict settings or migrate protocols inside the
  private-alpha release. The former is unusable; the latter expands this release's
  surface after the rest of its architecture has stabilized.
- **Consequences:** The private alpha accepts a documented defense-in-depth gap.
  Packaged critical-flow and exact fuse verification remain release gates.
- **Reversibility:** High; the custom protocol is a contained main-process change.

## D013 — Gate releases on native current runners and recoverable interactions

- **Status:** Accepted; Intel runner scope superseded by D015
- **Date:** 2026-09-01
- **Decision:** Build and execute arm64 on `macos-15` and x64 on
  `macos-15-intel`. When a provider credential fails, disable only AI-backed
  actions until it is replaced while keeping local Continue, End, history, export,
  and recovery available. Announce generated help and deletion completion, restore
  focus after deletion, and surface End failures next to the action.
- **Why:** A deterministic release cannot depend on a runner already in retirement,
  and a recoverable product must prevent repeated known-bad requests without
  trapping keyboard or assistive-technology users.
- **Alternatives:** Keep cross-architecture emulation and rely on generic errors.
  Rejected because native CI proves the actual binaries and generic errors leave
  important state changes ambiguous.
- **Consequences:** CI uses two explicit macOS runner labels. Provider outages do
  not block offline ownership actions, and accessible completion becomes part of
  the packaged journey.
- **Reversibility:** High; runner and interaction policies can evolve independently.

## D014 — Keep CI actions on supported Node runtimes

- **Status:** Accepted
- **Date:** 2026-09-01
- **Decision:** Use the current Node 24 releases of `actions/checkout`,
  `actions/setup-node`, and `actions/upload-artifact`, pin every use to its reviewed
  full commit SHA, retain the semantic version in a comment, and enforce the exact
  action set in the release configuration test.
- **Why:** GitHub-hosted runners warned that the previous action majors used a
  deprecated Node 20 action runtime. The selected majors use Node 24 and are
  compatible with the hosted runner version already executing this release.
- **Alternatives:** Accept the warning until GitHub force-upgrades the actions.
  Rejected because release automation should not depend on an announced fallback.
- **Consequences:** Action code cannot change without a repository diff. Future
  action updates must change the executable workflow and its release invariant
  together, after compatibility and provenance review.
- **Reversibility:** High; the pins can advance through another reviewed, verified
  configuration change.

## D015 — Release only native Apple Silicon artifacts

- **Status:** Accepted
- **Date:** 2026-09-01
- **Decision:** Support macOS 13+ only on Apple Silicon, produce only an `arm64`
  ZIP, require native execution in the application metadata, and reject every
  non-arm64 Mach-O file anywhere in the packaged bundle. Remove the Intel CI job,
  artifact, installation guidance, and Rosetta accommodation together.
- **Why:** Apple has announced the end of general-purpose Rosetta support after
  macOS 27. The product has no known Intel users, while carrying a second release
  doubles packaging and verification cost and leaves users able to open the wrong
  artifact. The credential implementation is not implicated: Electron safeStorage
  uses macOS Keychain, which remains the platform security mechanism.
- **Alternatives:** Continue separate Intel and Apple Silicon artifacts, or ship a
  universal binary. Rejected because neither adds product value for the intended
  audience, and both retain Intel code that the release does not need.
- **Consequences:** Intel Macs cannot run Strata AI 0.1. Every shipped executable,
  helper, framework, updater, and native library is proven arm64-only before the
  ZIP is created. Existing local learning data and Keychain-backed credentials are
  unchanged because the bundle identifier and storage formats remain stable.
- **Sources:** [Apple's Rosetta support timeline and architecture identification](https://support.apple.com/102527),
  [Apple's native execution and complete-bundle architecture guidance](https://developer.apple.com/documentation/apple-silicon/building-a-universal-macos-binary),
  and [Electron safeStorage's macOS Keychain behavior](https://www.electronjs.org/docs/latest/api/safe-storage).
- **Reversibility:** Medium; Intel support could return through a separately tested
  artifact, but it is no longer part of the supported release contract.
