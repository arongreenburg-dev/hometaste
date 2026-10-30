# HomeTaste

Two tastes, one room, one budget. HomeTaste helps a household compare home-brand aesthetics before buying anything.

## Working with Codex or Claude Code

Read [AGENTS.md](AGENTS.md) and [the next-build brief](docs/NEXT_BUILD.md). Claude Code also has a `CLAUDE.md` entrypoint. The brief separates implemented features from Mo’s feedback and proposed acceptance criteria. Work on a feature branch and submit a PR.

GitHub is the collaboration source. The deployed app currently uses a separate Sites source repository; merging a GitHub PR does not automatically redeploy it. No GitHub deployment automation is configured.

## Judge quick start

Live demo: https://hometaste-household.arongreenburg.chatgpt.site

1. Choose **Music meets modern** under *Start with a sample household*. The brief is marked as a fictional sample.
2. Review the bedroom, $800 lighting budget, retained bed/tables, household needs, and Bob Dylan / West Elm taste references.
3. Click **Find our common ground** for real Qloo recommendations (step 2, *Compare directions*).
4. Select any direction. Its palette board, Qloo ranks, and tags appear on the card.
5. In step 3, combine **Warmer finishes**, **Spend about 25% less**, and **Easier to clean**. The selected direction is kept; the active set, what changed, and an exact allowance table are shown. **Reset to original brief** clears them.
6. Edit a measurement: the plan stays visible with an *Inputs changed — update plan* banner. Choose **Update plan**.
7. Hide a brand with **Not us — hide this brand** (restore it from *Hidden brands*). Choose **View and print plan**, then **Print / save as PDF**.

All three sample households contain fictional people and room details. Their taste references are real Qloo entities. API results are live; samples do not contain canned recommendation responses.

## Current prototype

- Two named profiles, up to three favorite brands, artists, movies or books each.
- Entity search with explicit selection; no invented Qloo IDs.
- Separate real Qloo `/v2/insights` calls for each profile, restricted to the Home Goods tag.
- Shared-list ranking, three aesthetic directions, explicit handling of missing overlap.
- Four room types, optional measurements and household interview, retained furniture, brand vetoes with restore, composed item-type boards, combinable revisions, exact budget allocations, and a browser plan preview with print / save-as-PDF.
- Three-step journey (Your brief → Compare directions → Refine and keep your plan). The last generated plan stays visible while the brief is edited; outdated plans are flagged on screen and in print. Only the newest request may update the page; errors keep the previous plan and offer a retry.
- Household needs are read with a small, explicit keyword set (pets/children/washable, reading, glare, video calls, warm/calm light, clear paths/access, no large furniture) that changes item guidance. Other notes are kept in the brief but not interpreted, and the UI says so.
- Qloo key stays in the Worker runtime. No credentials or Qloo response datasets are committed.

## Development

Node 24. Install pnpm, then run `pnpm install --frozen-lockfile`. In a managed Sites environment, use its dependency installer. This repository includes the lockfile.

Set `QLOO_API_KEY` as a server runtime secret. Hackathon keys use `https://hackathon.api.qloo.com` with `X-Api-Key`. For local development, use an ignored `.dev.vars` with `QLOO_API_KEY`.

Run `npm run dev`. Production build: `npm run build`. Typecheck: `node node_modules/typescript/bin/tsc --noEmit`. Logic checks: `node --test tests/*.test.mjs`.

The supplied Sites build integration and `.openai/hosting.json` handle deployment. Hosting identifiers are specific to this private deployment; use your own when forking.

## How the recommendations work

Qloo supplies each person's recommended brands and their aesthetic tags. HomeTaste ranks the union with `sum(1 / (20 + rank))`, adding 0.015 when the brand appears in both lists. This is an explicit heuristic, not a calibrated household compatibility probability. Unreturned means outside the selected top-20 list, not dislike.

Palettes use a small deterministic mapping from Qloo tags (natural/warm, bold/colorful, or neutral). Each direction shows an abstract palette and material board labeled with the selected room type; it is not a generated room, a reconstruction of your space, or a product photo. The hero illustration is decorative. Planning steps and budget allocations are HomeTaste rules. Selecting a brand changes the aesthetic brief, not verified shopping inventory.

The plan API accepts `preferences` (any combination of `warmer`, `less-spend`, `easy-care`); the older single `revision` field is still accepted.

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
