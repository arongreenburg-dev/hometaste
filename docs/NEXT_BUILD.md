# HomeTaste — next-build brief

Updated October 28, 2026 after Mo tested the first prototype.

## Product intent

A virtual decorating adviser that helps a household turn differing tastes, practical needs, existing belongings, and a budget into a coherent room proposal. The adviser can supplement an interior designer. Qloo supplies taste evidence; HomeTaste must translate that evidence into room decisions.

The current app is a validated API foundation. It is too brand-centric and generic to fulfill this intent. Keep working infrastructure and the warm, restrained visual direction while replacing the shallow recommendation flow.

## Mo's direct feedback

- Users cannot change the room; they should be able to choose it.
- Allow room dimensions and potentially a photo to understand the space.
- Brand names alone are too generic and will become repetitive.
- Show a sample composition of the room with coordinated items.
- The household interview should be optional; users must be able to skip it.
- Affiliate links are a possible later topic, not current implementation scope.

## Proposed implementation order

### 1. Flexible room brief — first implementation task

Keep quick start and offer an optional guided interview. Support at least living room, bedroom, dining room, and home office. Capture room, goal, budget, optional length/width/height and unit, existing items to keep, and household needs. Do not silently treat missing dimensions as known. Preserve edits and allow going back.

Acceptance criteria:

- User changes room type and sees relevant wording and plans throughout the result and download.
- Quick start requires only the minimal room/goal/budget/taste inputs.
- User skips or exits the interview without losing existing inputs.
- Dimensions accept feet or meters with explicit units and validation.
- Items marked "keep" remain in every subsequent concept and revision.
- Budget and practical constraints reach the planning layer, not just presentation copy.

### 2. Composed visual directions

Produce 2–3 coherent room concepts, with coordinated lighting, textiles, furniture/accessory types, palette, placement, what stays, and what changes. Vary concepts based on taste evidence and room constraints, not merely a new brand label or recolored version of the same illustration.

Separate concept illustrations from identifiable purchasable products. Product references must have checked sources, dimensions and prices before being presented as verified. Illustrative placeholders must be labeled. A concept image must not imply it is an accurate reconstruction of the user's room.

### 3. Household feedback and replanning

Accept feedback such as "keep our sofa," "warmer colors," "less expensive," or "my partner dislikes that chair." Revise the relevant decisions while preserving budget, retained items, room constraints, and prior vetoes. Show what changed and why. Ask a targeted follow-up only when constraints genuinely conflict.

### 4. Optional photo support

Photo input is useful for identifying visible room features and retained furniture. Exact dimensions from a single uncalibrated image must not be claimed. Ask for measurements or a reliable scale reference and label uncertainty. Photos must remain private and be excluded from source control.

### 5. Competition packaging

Validate five synthetic household scenarios; compare against an LLM-only baseline. Demonstrate a meaningful Qloo contribution and a genuine planning/feedback loop. Prepare a demo and complete Devpost. Verify current submission requirements before final submission. The recorded deadline is October 30, 2026, 10:45 p.m. America/Chicago. Public repository/app access must be explicitly approved before changing current private access.

## Current evidence and limits

- Real Qloo `/search` and `/v2/insights` work with the deployed server secret.
- MUJI and West Elm produce different Home Goods brand lists and aesthetic tags.
- Bob Dylan + West Elm returned Anthropologie in both lists in a live test (ranks 19 and 9).
- Search, plan generation, veto/replanning, invalid-budget rejection, typecheck, logic tests, and production build passed for the first prototype.
- These are technical checks, not evidence that recommendations satisfy real users.
- No LLM reasoning, actual room understanding, product catalog, image generation, photo interpretation, room selector, dimensions, or guided interview currently exists.
- The existing SVG room is a recolored illustration; the budgets are allowances, not product quotes.

## Ready-to-use first agent task

Implement section 1 (Flexible room brief) on a feature branch. Read AGENTS.md, inspect the current source, preserve live server-side Qloo integration and existing deployment identity, add meaningful checks for the acceptance criteria, run typecheck/tests/build, and open a PR describing actual behavior and remaining limits. Do not expand into photo analysis, purchasing, affiliate links, or claim the visual-concept work is complete.
