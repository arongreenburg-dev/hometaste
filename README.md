# HomeTaste

Two tastes, one room, one budget. HomeTaste helps a household compare home-brand aesthetics before buying anything.

## Working with Codex or Claude Code

Read [AGENTS.md](AGENTS.md) and [the next-build brief](docs/NEXT_BUILD.md). Claude Code also has a `CLAUDE.md` entrypoint. The brief separates implemented features from Mo’s feedback and proposed acceptance criteria. Work on a feature branch and submit a PR.

GitHub is the collaboration source. The deployed app currently uses a separate Sites source repository; merging a GitHub PR does not automatically redeploy it. No GitHub deployment automation is configured.

## Current prototype

- Two named profiles, up to three favorite brands, artists, movies or books each.
- Entity search with explicit selection; no invented Qloo IDs.
- Separate real Qloo `/v2/insights` calls for each profile, restricted to the Home Goods tag.
- Shared-list ranking, three aesthetic directions, explicit handling of missing overlap.
- Brand veto and replanning, living-room refresh or lighting focus, budget allowances, downloadable plan.
- Qloo key stays in the Worker runtime. No credentials or Qloo response datasets are committed.

## Development

Node 24; install dependencies with the Sites installer or `npm install` in a standalone clone. This checkout uses pnpm.

Set `QLOO_API_KEY` as a server runtime secret. Hackathon keys use `https://hackathon.api.qloo.com` with `X-Api-Key`. For local development, use an ignored `.dev.vars` with `QLOO_API_KEY`.

Run `npm run dev`. Production build: `npm run build`. Typecheck: `node node_modules/typescript/bin/tsc --noEmit`. Logic checks: `node --test tests/qloo.test.mjs`.

The supplied Sites build integration and `.openai/hosting.json` handle deployment. Hosting identifiers are specific to this private deployment; use your own when forking.

## How the recommendations work

Qloo supplies each person's recommended brands and their aesthetic tags. HomeTaste ranks the union with `sum(1 / (20 + rank))`, adding 0.015 when the brand appears in both lists. This is an explicit heuristic, not a calibrated household compatibility probability. Unreturned means outside the selected top-20 list, not dislike.

Palettes use a small deterministic mapping from Qloo tags (natural/warm, bold/colorful, or neutral). The same room illustration is recolored; it is not a generated room or product photo. Planning steps and budget allocations are HomeTaste rules. Selecting a brand changes the aesthetic brief, not verified shopping inventory.

## Validation and limitations

Authenticated search and Insights calls were verified on October 28, 2026 with MUJI and West Elm. They returned materially different Home Goods recommendations and aesthetic tags. A live deployed test with Bob Dylan and West Elm also returned Anthropologie in both recommendation lists (ranks 19 and 9). Live search, plan generation, brand veto/replanning, and invalid budget rejection passed. These checks validate the technical discovery path; they do not establish that cultural interests reliably determine an individual’s interior-design preferences.

This is an early prototype, not yet a final hackathon entry. It uses deterministic orchestration; no LLM or autonomous agent is currently integrated. Product pricing, availability, regional suitability and delivery are not verified. Some returned brands span homeware and apparel or operate outside the user's market. No retailer integrations, whole-house planning, real family accounts, construction advice, or photorealistic generation.

No profiles are persisted by the application. Runtime operators and Qloo may still process requests under their own policies. Only entity IDs are sent to Qloo; household names and budgets are not sent to Qloo.

## Next submission work

- Test non-home cultural references and five household scenarios.
- Strengthen the negotiated design brief and genuine agentic reasoning loop.
- Add relevant practical constraints with explicit handling of conflict.
- Publish a public licensed source repository; the current hosting repository is private.
- Record demo, finish Devpost fields and verify all final submission requirements.

## License

MIT; see LICENSE. Qloo data remains subject to Qloo's API terms and is not licensed by this repository.
