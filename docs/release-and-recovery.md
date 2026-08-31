# Release, Recovery, and Rollback

## Release scope

Strata AI 0.1.0 is a private macOS alpha for macOS 13 Ventura or later on Apple
Silicon and Intel Macs. The repository produces a native-architecture ZIP. There
are no Windows or Linux release claims in 0.1.

Local builds receive a structurally valid ad-hoc signature and are intended only
for development and internal evaluation. Public distribution is blocked until a
Developer ID Application certificate and Apple notarization credentials are
available.

For private-alpha evaluation, download the ZIP matching the Mac (`arm64` for
Apple Silicon or `x64` for Intel), unzip it, and move **Strata AI.app** to
Applications. Confirm the published version and artifact-verification result. An
internal ad-hoc build may require Control-clicking the app in Finder and choosing
**Open** on first launch; do not disable Gatekeeper. Export a backup before every
upgrade and report issues through
[GitHub Issues](https://github.com/Cyrus-Krispin/strata-ai/issues) without attaching
secrets or unredacted backups.

Signed release builds use these environment variables:

- `APPLE_SIGN_IDENTITY`
- `APPLE_ID`
- `APPLE_APP_SPECIFIC_PASSWORD`
- `APPLE_TEAM_ID`

The build must pass `codesign --verify --deep --strict`. A public artifact must
also pass Gatekeeper assessment, notarization, and stapling verification before
distribution. Credentials must be injected by the release environment and never
committed.

Before public distribution, migrate Forge's packaged renderer from `file://` to a
privileged custom `app://` protocol and disable Electron's file-protocol
extra-privileges fuse. The private alpha keeps that fuse enabled only because its
packaged renderer currently depends on it; ASAR integrity, renderer sandboxing,
strict CSP, and navigation, popup, and permission denial bound the interim risk.

## Backup and restore

Use **Export backup…** on the home screen before upgrading, testing a migration,
or moving to another Mac. Backup format version 1 includes complete visible
learning provenance and excludes provider credentials and local paths.

Use **Restore backup…** to validate and preview a backup. Restore imports missing
sessions and skips identical sessions. Unsupported formats, malformed data, and
conflicting session IDs are rejected before mutation. The current database is
unchanged if restore fails.

If Strata AI cannot open or migrate the local database, it displays a recovery
notice. The user can quit, reveal the application-data folder, or explicitly move
the database, `-wal`, and `-shm` files together into a timestamped private recovery
folder and start with empty local history. Nothing is silently reset or deleted;
if any move fails, already moved files are rolled back. After a clean start, use
**Restore backup…** on the home screen to import a JSON backup.

## Upgrade and rollback

Migrations are versioned and transactional. Gapped or newer migration histories,
failed integrity checks, and foreign-key corruption are rejected. Downgrading may
not support a database written by a newer Strata AI version.

Before rollback:

1. Export a learning backup with the newer app.
2. Quit Strata AI completely.
3. Preserve the complete application-data folder.
4. Install the earlier app only if its documented database version is compatible.

If compatibility is uncertain, keep 0.1.0 installed and restore into that version
instead of replacing the database manually.

## Release gate

Run `npm run verify`, `npm run package`, `npm run verify:artifact`, and
`npm run make:from-package`. Runtime dependency audit must have no high or critical
findings. Build-chain advisories require the documented, unexpired triage in
`docs/security-audit.md`. The optional live DeepSeek smoke is manual, never CI,
and capped at four explicit requests.

CI first builds a test-only package with `npm run package:e2e` and drives the
complete packaged learning journey through an isolated Chrome DevTools profile.
That build uses a deterministic in-process provider and never contacts DeepSeek.
CI then rebuilds the normal production package, verifies that the fake-provider
marker is absent, checks fresh-profile onboarding, and only then creates the ZIP.
