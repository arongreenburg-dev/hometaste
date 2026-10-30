# HomeTaste — coding-agent instructions

Read `docs/NEXT_BUILD.md` before proposing or implementing the next product change. It records Mo's latest feedback and the intended decorating-adviser experience.

## Current system

- React 19 / Vinext / Vite / Cloudflare Worker. Preserve the existing Sites build and authentication integration.
- `app/page.tsx`: client experience; `app/globals.css`: responsive styling.
- `lib/qloo.ts`: server-side search, taste calls, ranking, and budget plan.
- `worker/index.ts`: intercepts `/api/*` and reads `QLOO_API_KEY` from Worker runtime secrets.
- This is a working prototype with deterministic orchestration, not a completed agentic decorating product.

## Non-negotiable behavior

- The guided interview is optional and skippable. A quick-start path must remain usable.
- Qloo must materially inform recommendations; expose the actual contribution and distinguish model/heuristic interpretation.
- Do not invent product prices, dimensions, stock, Qloo data, household compatibility percentages, or exact measurements from a single photo.
- Preserve household constraints, existing items, and vetoes when revising. New brand names alone are not a meaningful revision.
- No affiliate, purchasing, retailer-account, construction-advice, or whole-house features in the current sprint.
- Do not expose or commit keys, `.env*`, `.dev.vars*`, credentials, household photos, or raw Qloo response datasets. The API key is already stored in the deployed runtime; agents must obtain separate secure local configuration when needed.
- Mo authorized a public demo and public repository for the hackathon on October 29, 2026. Preserve server-side secrets and existing Site identity; do not create a replacement Site.

## Work and validation

Use a feature branch and a reviewable pull request for the next build. Check existing changes before editing. Avoid concurrent agents editing the same files.

From the repository root:

- Install with the package manager recorded by `pnpm-lock.yaml` (or the supplied environment installer where available).
- `npm run dev` starts the portable local preview.
- `node node_modules/typescript/bin/tsc --noEmit`
- `node --test tests/qloo.test.mjs`
- `npm run build`

Use mocked API responses in unit tests; use real API calls only with authorized server-side configuration. Label actual verification separately from proposed work. Recheck room selection, interview skipping, budget changes, retained items, and feedback/replanning when those features are implemented.

## GitHub and deployment

GitHub is the collaboration source. The current hosted app uses a separate Sites source repository. A GitHub commit or PR merge does not automatically update the deployed app; no GitHub-to-Sites CI/CD connection has been configured. Reconcile and deploy through the existing Sites workflow when requested. Preserve `.openai/hosting.json` identity.
