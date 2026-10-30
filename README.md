# HomeTaste

Two tastes, one room, one budget. HomeTaste helps a household compare home-brand aesthetics before buying anything.

## Working with Codex or Claude Code

Read [AGENTS.md](AGENTS.md) and [the next-build brief](docs/NEXT_BUILD.md). Claude Code also has a `CLAUDE.md` entrypoint. The brief separates implemented features from Mo’s feedback and proposed acceptance criteria. Work on a feature branch and submit a PR.

GitHub is the collaboration source. The deployed app currently uses a separate Sites source repository; merging a GitHub PR does not automatically redeploy it. No GitHub deployment automation is configured.

## Judge quick start

Live demo: https://hometaste-household.arongreenburg.chatgpt.site

1. Choose **Music meets modern** in the fictional-household panel.
2. Review the bedroom, $800 lighting budget, retained bed/tables, and Bob Dylan / West Elm taste references.
3. Click **Find our common ground** for real Qloo recommendations.
4. Select a direction and inspect its coordinated item brief and Qloo evidence.
5. Click **Warmer finishes**, **Spend about 25% less**, or **Easier to clean**. Inspect the changes and preserved constraints.
6. Veto a brand or change the taste reference to explore other results. Download the plan.

All three sample households contain fictional people and room details. Their taste references are real Qloo entities. API results are live; samples do not contain canned recommendation responses.

## Current prototype

- Two named profiles, up to three favorite brands, artists, movies or books each.
- Entity search with explicit selection; no invented Qloo IDs.
- Separate real Qloo `/v2/insights` calls for each profile, restricted to the Home Goods tag.
- Shared-list ranking, three aesthetic directions, explicit handling of missing overlap.
- Four room types, optional measurements and household interview, retained furniture, brand vetoes, composed item-type boards, material revisions, exact budget allocations and downloadable plans.
- Qloo key stays in the Worker runtime. No credentials or Qloo response datasets are committed.

## Development

Node 24. Install pnpm, then run `pnpm install --frozen-lockfile`. In a managed Sites environment, use its dependency installer. This repository includes the lockfile.

Set `QLOO_API_KEY` as a server runtime secret. Hackathon keys use `https://hackathon.api.qloo.com` with `X-Api-Key`. For local development, use an ignored `.dev.vars` with `QLOO_API_KEY`.

Run `npm run dev`. Production build: `npm run build`. Typecheck: `node node_modules/typescript/bin/tsc --noEmit`. Logic checks: `node --test tests/*.test.mjs`.

The supplied Sites build integration and `.openai/hosting.json` handle deployment. Hosting identifiers are specific to this private deployment; use your own when forking.

## How the recommendations work

Qloo supplies each person's recommended brands and their aesthetic tags. HomeTaste ranks the union with `sum(1 / (20 + rank))`, adding 0.015 when the brand appears in both lists. This is an explicit heuristic, not a calibrated household compatibility probability. Unreturned means outside the selected top-20 list, not dislike.

Palettes use a small deterministic mapping from Qloo tags (natural/warm, bold/colorful, or neutral). The same room illustration is recolored; it is not a generated room or product photo. Planning steps and budget allocations are HomeTaste rules. Selecting a brand changes the aesthetic brief, not verified shopping inventory.

## Validation and limitations

Authenticated search and Insights calls were verified on October 28, 2026 with MUJI and West Elm. They returned materially different Home Goods recommendations and aesthetic tags. A live deployed test with Bob Dylan and West Elm also returned Anthropologie in both recommendation lists (ranks 19 and 9). Live search, plan generation, brand veto/replanning, and invalid budget rejection passed. These checks validate the technical discovery path; they do not establish that cultural interests reliably determine an individual’s interior-design preferences.

This is a bounded, deterministic planning workflow with visible steps and a feedback/replanning loop. It does not use an LLM or an agent framework. Qloo drives cultural brand discovery and aesthetic inputs; HomeTaste rules compose illustrative item briefs and apply explicit constraints. Broader autonomous reasoning is not implemented. Product pricing, availability, regional suitability and delivery are not verified. Some returned brands span homeware and apparel or operate outside the user's market. No retailer integrations, whole-house planning, real family accounts, construction advice, or photorealistic generation.

The public app requires no login. No profiles are persisted by the application. Private server-side Qloo response caching lasts five minutes per Worker instance and is never committed to this repository. A best-effort per-instance IP rate limit protects the demo; it is not a durable global quota. Runtime operators and Qloo may still process requests under their own policies. Only entity IDs are sent to Qloo; household names and budgets are not sent to Qloo.

## Next submission work

- Test non-home cultural references and five household scenarios.
- Strengthen the negotiated design brief and genuine agentic reasoning loop.
- Add relevant practical constraints with explicit handling of conflict.
- Keep the public GitHub code and hosted source aligned before releasing changes.
- Record demo, finish Devpost fields and verify all final submission requirements.

## License

MIT; see LICENSE. Qloo data remains subject to Qloo's API terms and is not licensed by this repository.
