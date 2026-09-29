# website-1-3-doc-calibration implementation

## Outcome

Calibrate all website documentation against the released Apple and Gateway 1.3.0 implementations and the finalized Android 1.3.0 implementation, including public API parameters and user workflows.

## Scope and acceptance

- In scope: all English, Simplified Chinese, and Traditional Chinese website documentation; generated SEO/LLM text; Apple, Android, Gateway release history; public Message/Event/Thing request and response contracts; sender status; app workflows; self-hosting configuration.
- Protected behavior: existing routes and localized URLs remain stable; examples remain copyable; Android source worktree changes and the released Apple/Gateway repositories remain untouched.
- Observable completion: every affected contract claim matches the 1.3.0 source baseline, all three locales carry equivalent technical semantics, and `npm run release` plus focused contract/parity checks pass from final bytes.

## Slices

| Slice | Outcome | Affected areas | Native completion evidence | Status |
|---|---|---|---|---|
| S1 | Establish the 1.3.0 release and implementation baseline | Apple, Android, Gateway repositories; current website docs | tags, release notes, manifests, DTOs, routes, runtime args, current Android worktree | complete |
| S2 | Correct public API and sender-status documentation in all locales | `src/content/docs/**/reference`, concepts, data models, getting started | source-to-doc contract checks and locale token parity | complete |
| S3 | Correct app, self-hosting, operational, and release documentation | guides and changelogs in all locales | source/config comparison, dates and version checks | complete |
| S4 | Regenerate derived text and verify final site | generated public text, final diff | `npm run release`, link/SEO checks, same-context final review | complete |
| S5 | Deep-audit every published claim and repair residual drift | all 78 source pages; Apple, Android, Gateway implementation surfaces | source-to-doc inventory, targeted assertions, release build, final diff review | complete |

## Ordering and dependencies

Apple and Gateway v1.3.0 tags dated 2026-08-23 are released facts. Android v1.3.0 request semantics and user workflows are taken from the finalized current Android worktree; its website release date is the user-confirmed 2026-08-24. Source DTOs/routes/runtime arguments take precedence over stale prose in embedded or website docs.

## Evidence limits

No production deployment or public-endpoint mutation is authorized. App Store, GitHub Release, live APNs/FCM/private-transport delivery, and production database upgrade drills are not part of website verification.
