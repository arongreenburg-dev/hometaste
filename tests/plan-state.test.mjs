import {test} from 'node:test';
import assert from 'node:assert/strict';
import {planRequest, briefChanged, resolveSelection, togglePreference, createRequestGuard, validateBudget, dimensionError, convertDimensions, describeConceptChanges} from '../lib/plan-state.ts';
import {composeConcept, interpretNeeds, normalizePreferences} from '../lib/design-agent.ts';
import {parseBrief} from '../lib/room-brief.ts';
import {demoHouseholds} from '../lib/demo-households.ts';
import {qlooApi, clearQlooCache} from '../lib/qloo.ts';

const form = () => ({people: [{name: 'Sam', entities: [{id: 'a', name: 'A', type: 'brand'}]}, {name: 'Casey', entities: [{id: 'b', name: 'B', type: 'brand'}]}], room: 'Bedroom', focus: 'Lighting', budget: 800, unit: 'ft', dimensions: {length: '12', width: '11', height: ''}, keep: 'Queen bed', needs: 'Reading'});

test('selection is retained by stable entity ID through revisions, even when order changes', () => {
 const before = [{id: 'x'}, {id: 'y'}, {id: 'z'}];
 const after = [{id: 'z'}, {id: 'x'}, {id: 'y'}];
 assert.deepEqual(resolveSelection('y', after), {id: 'y', lost: false});
 assert.deepEqual(resolveSelection(null, before), {id: 'x', lost: false});
});

test('selection falls back only when the chosen direction is vetoed or unavailable', () => {
 assert.deepEqual(resolveSelection('y', [{id: 'x'}, {id: 'z'}]), {id: 'x', lost: true});
 assert.deepEqual(resolveSelection('y', []), {id: null, lost: true});
});

test('preferences combine, keep canonical order, and can be reset', () => {
 let p = togglePreference([], 'easy-care');
 p = togglePreference(p, 'warmer');
 p = togglePreference(p, 'less-spend');
 assert.deepEqual(p, ['warmer', 'less-spend', 'easy-care']);
 assert.deepEqual(togglePreference(p, 'warmer'), ['less-spend', 'easy-care']);
 assert.deepEqual(normalizePreferences(undefined, 'warmer'), ['warmer']);
 assert.deepEqual(normalizePreferences(undefined, 'original'), []);
 assert.throws(() => normalizePreferences(['louder']));
 assert.throws(() => normalizePreferences('warmer'));
});

test('combined preferences all take effect and every budget dollar is accounted for', () => {
 const brief = parseBrief({room: 'Living room', keep: 'Blue sofa', dimensions: {unit: 'ft'}});
 const base = composeConcept(['Clean Lines'], brief, 1500, 'Room refresh', []);
 const all = composeConcept(['Clean Lines'], brief, 1500, 'Room refresh', ['warmer', 'less-spend', 'easy-care']);
 const warmOnly = composeConcept(['Clean Lines'], brief, 1500, 'Room refresh', ['warmer']);
 assert.deepEqual(all.palette, warmOnly.palette);
 assert.notDeepEqual(all.palette, base.palette);
 assert.equal(all.spend, Math.floor(1500 * .75));
 assert.match(all.items[1].detail, /washable|wipeable/);
 assert.equal(all.items.reduce((s, x) => s + x.amount, 0) + all.contingency, 1500);
 assert.equal(all.changes.length, 3);
 assert(all.constraints.some(c => c.includes('Blue sofa')));
});

test('editing the brief marks the plan stale; refinements and unchanged inputs do not', () => {
 const f = form();
 const applied = planRequest(f, ['warmer'], ['vetoed-id']);
 assert.equal(briefChanged(f, applied), false);
 assert.equal(briefChanged(f, {...applied, preferences: [], vetoes: []}), false);
 assert.equal(briefChanged({...f, dimensions: {...f.dimensions, length: '13'}}, applied), true);
 assert.equal(briefChanged({...f, needs: 'Reading; a dog'}, applied), true);
 assert.equal(briefChanged({...f, budget: 900}, applied), true);
 assert.equal(briefChanged({...f, keep: ' Queen bed  '}, applied), false, 'whitespace-only edits are not changes');
 assert.equal(briefChanged(f, undefined), false);
 assert.deepEqual(applied.dimensions, {unit: 'ft', length: 12, width: 11});
});

test('unit conversion round-trips and dimension validation names the unit', () => {
 const m = convertDimensions({length: '16', width: '12', height: ''}, 'm');
 assert.deepEqual(m, {length: '4.8768', width: '3.6576', height: ''});
 assert.deepEqual(convertDimensions(m, 'ft'), {length: '16', width: '12', height: ''});
 assert.equal(dimensionError('m', {length: '101', width: '', height: ''}).includes('100 meters'), true);
 assert.equal(dimensionError('ft', {length: '-2', width: '', height: ''}) !== '', true);
 assert.equal(dimensionError('ft', {length: '', width: '9', height: ''}), '');
});

test('budget text input validates and normalizes', () => {
 assert.deepEqual(validateBudget('$2,500'), {value: 2500});
 assert.ok(validateBudget('50').error);
 assert.ok(validateBudget('60000').error);
 assert.ok(validateBudget('abc').error);
});

test('stale asynchronous responses cannot overwrite a newer request', async () => {
 const guard = createRequestGuard();
 let shown = 'none';
 const respond = async (label, ms) => {const req = guard.start(); await new Promise(r => setTimeout(r, ms)); if (req.isCurrent()) shown = label;};
 await Promise.all([respond('older-slow', 30), respond('newer-fast', 5)]);
 assert.equal(shown, 'newer-fast');
 const req = guard.start(); guard.invalidate();
 assert.equal(req.isCurrent(), false, 'loading a sample household invalidates in-flight requests');
});

test('change descriptions explain what a revision changed', () => {
 const brief = parseBrief({room: 'Bedroom', keep: 'Queen bed'});
 const a = composeConcept(['Clean Lines'], brief, 800, 'Lighting', []);
 const b = composeConcept(['Clean Lines'], brief, 800, 'Lighting', ['less-spend']);
 const notes = describeConceptChanges(a, b);
 assert(notes.some(n => n.startsWith('Unspent contingency')));
 assert(notes.some(n => /\$320 → \$240/.test(n)));
});

test('household needs change item guidance, not just the summary', () => {
 for (const d of demoHouseholds) {
  const withNeeds = parseBrief({room: d.room, keep: d.keep, needs: d.needs, dimensions: {unit: 'ft'}});
  const without = parseBrief({room: d.room, keep: d.keep, needs: '', dimensions: {unit: 'ft'}});
  const a = composeConcept(['Clean Lines'], withNeeds, d.budget, d.focus);
  const b = composeConcept(['Clean Lines'], without, d.budget, d.focus);
  assert.notDeepEqual(a.items.map(i => i.name + i.detail), b.items.map(i => i.name + i.detail), d.id);
  assert(a.needsApplied.length > 0, d.id);
 }
 const office = interpretNeeds('Video calls, screen glare control, clear desk access; no extra large furniture.');
 assert.deepEqual([office.videoCalls, office.glare, office.compact, office.clearPath], [true, true, true, true]);
 const bedroom = composeConcept(['Clean Lines'], parseBrief({room: 'Bedroom', needs: 'Reading before bed; warm, calm light; avoid glare.'}), 800, 'Lighting');
 assert.match(bedroom.items[0].detail, /adjustable or directional/);
 assert.match(bedroom.items[0].detail, /shaded or diffused/);
 assert.match(bedroom.items[1].detail, /2700K/);
 assert.deepEqual(interpretNeeds('We like plants').applied, [], 'unsupported notes are not claimed as interpreted');
});

test('API accepts combined preferences, rejects unsupported ones, and keeps the legacy revision field', async () => {
 const original = globalThis.fetch;
 const id = n => `00000000-0000-0000-0000-00000000000${n}`;
 globalThis.fetch = async () => Response.json({results: {entities: [{entity_id: id(3), name: 'Shared', tags: [{type: 'urn:tag:aesthetic_property:qloo', name: 'Clean Lines'}]}]}});
 const req = body => new Request('https://example.com/api/plan', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({people: [{name: 'A', entities: [{id: id(1)}]}, {name: 'B', entities: [{id: id(2)}]}], budget: 1000, focus: 'Room refresh', room: 'Home office', needs: 'video calls', ...body})});
 try {
  clearQlooCache();
  const d = await (await qlooApi(req({preferences: ['easy-care', 'warmer']}), 'k')).json();
  assert.deepEqual(d.preferences, ['warmer', 'easy-care']);
  assert.equal(d.directions[0].concept.changes.length, 2);
  assert(d.agentTrace.some(t => t.step === 'Apply household needs' && /Video calls/.test(t.detail)));
  assert.equal((await qlooApi(req({preferences: ['cheaper']}), 'k')).status, 400);
  const legacy = await (await qlooApi(req({revision: 'less-spend'}), 'k')).json();
  assert.deepEqual(legacy.preferences, ['less-spend']);
 } finally {globalThis.fetch = original;}
});
