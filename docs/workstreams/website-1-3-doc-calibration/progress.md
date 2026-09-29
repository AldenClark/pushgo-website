# website-1-3-doc-calibration progress

## Status

- State: complete
- Updated: 2026-08-24T08:50:00+08:00

## Completed outcomes

- Resolved four Git roots and preserved the dirty Android worktree as user-owned finalized source.
- Confirmed Apple and Gateway v1.3.0 release tags and 2026-08-23 dates.
- Confirmed Android default `versionName=v1.3.0`, stable release notes, finalized current worktree behavior, and user-owned 2026-08-24 website date.
- Traced Gateway v1.3.0 public DTOs, route table, response envelope, sender-status states, body limit, auth middleware, runtime arguments, private transports, and upgrade boundary.
- Traced Apple deployment targets and 1.3.0 system integrations, plus Android 1.3.0 provider ingress, ACK, search, deletion, accessibility, and documentation-entry behavior.
- Corrected Message/Event/Thing requests, response envelopes, Message idempotency, sender status, validation boundaries, and timestamps in all three locales.
- Corrected Apple platform requirements, Android/Gateway private transports, runtime environment names/defaults, token-service authentication, and schema-v12 rollback guidance.
- Added 1.3.0 release history with the user-confirmed Android release date and filled the missing intervening stable releases.
- Regenerated SEO/LLM artifacts and built 79 static pages; search indexing, sitemap output, and SEO/GEO verification passed.
- Passed focused contract/locale assertions, internal-link checks across 78 source pages, `git diff --check`, and stale-token scans.
- Deep-audited the 78 source pages plus generated SEO/LLM content and repaired residual drift in generated `op_id` format, timestamp defaults, TTL, byte-based limits, channel-ID parsing, password trimming, request/rate limits, compatibility routes, Event aliases, MCP inputs, auth scope, and private-transport parsing.
- Corrected the architectural ownership model: Gateway persists submissions and operational delivery state, while subscribed clients persist/project canonical Event/Thing history and current state; updated database backup guidance accordingly.
- Replaced the non-product App Store redirect with the verified PushGo product URL and corrected percent encoding in localized Bark examples.
- Updated the SEO/GEO generator itself so regenerated self-hosting pages and `llms-full.txt` retain the corrected state-ownership, backup, and MCP loopback semantics.
- Rebuilt 79 static pages and passed SEO/GEO generation verification, 60 JSON example parses, 156 internal-link checks, locale-set parity, focused stale-contract assertions, generator idempotence, external release/download URL checks, and `git diff --check`.
- Passed 40 focused Gateway unit tests covering Message/Event/Thing decoding, timestamp normalization, generated operation IDs, unknown-field handling, channel IDs, and password boundaries.

## Current slice

S5 complete. No remaining implementation slice is open.

## Next

Review, commit, and deploy the website changes when authorized.

## Blockers and decisions needed

- Independent review was required by the Dev Flow compatibility route but delegation was not authorized in the current task. A same-context final diff and generated-output review found no remaining actionable issue; common-mode review risk remains.

## Evidence limits

- Production writes, stores, device runtimes, provider delivery, and database upgrades are not exercised by this documentation-only change. Public download/release links and Gateway roots were checked read-only.
