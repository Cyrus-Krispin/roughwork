# Dependency Security Audit

## 2026-08-31 release-candidate triage

- `npm audit --omit=dev`: 0 vulnerabilities.
- Full build graph: 29 advisories (1 critical, 22 high, 3 moderate, 3 low).
- Runtime package graph is internally consistent under `npm ls --all --omit=optional`.

The high and critical findings are transitive through Electron Forge 7.11.2's
packaging, extraction, rebuild, and development-server toolchain. They are absent
from the pruned ASAR and runtime dependency audit. npm currently suggests invalid
or regressive major-version replacements rather than a supported patched Forge
release; automatic or forced audit fixes are prohibited.

The private-alpha build mitigation is to run packaging only from a clean lockfile
and trusted repository on controlled CI, never process user-supplied archives,
verify the resulting ASAR/fuses/signature, and block public distribution until
signing/notarization prerequisites are met. This waiver expires on 2026-10-31 or
immediately when a compatible Electron Forge release resolves the findings. The
full audit must be re-run for every release candidate.
