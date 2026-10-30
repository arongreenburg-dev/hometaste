// Pure client-side planning state: separates the editable brief from the last generated plan.
import {preferences as allPreferences, type Preference} from './design-agent.ts';

export type Ref = {id: string; name: string; type: string; tags?: string[]};
export type Person = {name: string; entities: Ref[]};
export type Unit = 'ft' | 'm';
export type DimensionText = {length: string; width: string; height: string};
export type BriefForm = {people: Person[]; room: string; focus: string; budget: number; unit: Unit; dimensions: DimensionText; keep: string; needs: string};
export type PlanRequest = {
 people: {name: string; entities: {id: string; name: string; type: string}[]}[];
 room: string; focus: string; budget: number;
 dimensions: {unit: Unit; length?: number; width?: number; height?: number};
 keep: string; needs: string; preferences: Preference[]; vetoes: string[];
};

export const BUDGET_MIN = 100;
export const BUDGET_MAX = 50000;
const axes = ['length', 'width', 'height'] as const;

export function planRequest(form: BriefForm, preferences: Preference[] = [], vetoes: string[] = []): PlanRequest {
 const dimensions: PlanRequest['dimensions'] = {unit: form.unit};
 for (const axis of axes) if (form.dimensions[axis].trim() !== '') dimensions[axis] = Number(form.dimensions[axis]);
 return {
  people: form.people.map(p => ({name: p.name.trim(), entities: p.entities.map(e => ({id: e.id, name: e.name, type: e.type}))})),
  room: form.room, focus: form.focus, budget: form.budget, dimensions,
  keep: form.keep.trim(), needs: form.needs.trim(),
  preferences: sortPreferences(preferences), vetoes: [...vetoes],
 };
}

// Everything the user edits in the brief; refinements (preferences, vetoes) are deliberately excluded.
export function briefKey(r: PlanRequest) {
 return JSON.stringify([r.people.map(p => [p.name, p.entities.map(e => e.id)]), r.room, r.focus, r.budget, r.dimensions.unit, axes.map(a => r.dimensions[a] ?? null), r.keep, r.needs]);
}

export function briefChanged(form: BriefForm, applied: PlanRequest | undefined) {
 return !!applied && briefKey(planRequest(form)) !== briefKey(applied);
}

export function sortPreferences(list: Preference[]) {
 return allPreferences.filter(p => list.includes(p));
}

export function togglePreference(list: Preference[], p: Preference) {
 return sortPreferences(list.includes(p) ? list.filter(x => x !== p) : [...list, p]);
}

// Keep the user's chosen direction by stable entity ID; fall back only when it is gone (vetoed or no longer returned).
export function resolveSelection(previousId: string | null | undefined, directions: {id: string}[]) {
 if (previousId && directions.some(d => d.id === previousId)) return {id: previousId, lost: false};
 return {id: directions[0]?.id ?? null, lost: !!previousId};
}

// Only the most recently started request may apply its response.
export function createRequestGuard() {
 let latest = 0;
 return {
  start() { const id = ++latest; return {isCurrent: () => id === latest}; },
  invalidate() { latest++; },
 };
}

export function validateBudget(text: string): {value?: number; error?: string} {
 const value = Number(text.replace(/[$,\s]/g, ''));
 if (text.trim() === '' || !Number.isFinite(value)) return {error: 'Enter a budget in dollars.'};
 if (value < BUDGET_MIN || value > BUDGET_MAX) return {error: `Choose a budget between $${BUDGET_MIN} and $${BUDGET_MAX.toLocaleString()}.`};
 return {value: Math.round(value)};
}

export function dimensionError(unit: Unit, dimensions: DimensionText) {
 const max = unit === 'ft' ? 300 : 100;
 for (const axis of axes) {
  const text = dimensions[axis].trim();
  if (text === '') continue;
  const value = Number(text);
  if (!Number.isFinite(value) || value <= 0 || value > max) return `Measurements must be positive numbers, up to ${max} ${unit === 'ft' ? 'feet' : 'meters'}. Leave unknown values blank.`;
 }
 return '';
}

export function convertDimensions(dimensions: DimensionText, to: Unit): DimensionText {
 const factor = to === 'm' ? 0.3048 : 1 / 0.3048;
 const out = {...dimensions};
 for (const axis of axes) {
  const value = Number(dimensions[axis]);
  if (dimensions[axis].trim() !== '' && Number.isFinite(value)) out[axis] = String(Number((value * factor).toFixed(4)));
 }
 return out;
}

type Concept = {palette: string[]; items: {name: string; amount: number; detail: string}[]; contingency: number};
// Plain-language comparison between the previous and the new composition for the same direction.
export function describeConceptChanges(prev: Concept | undefined, next: Concept | undefined) {
 if (!prev || !next) return [];
 const money = (n: number) => '$' + n.toLocaleString();
 const out: string[] = [];
 if (prev.palette.join() !== next.palette.join()) out.push('Palette updated.');
 next.items.forEach((item, i) => {
  const before = prev.items[i];
  if (!before) return;
  if (before.name !== item.name) out.push(`${before.name} → ${item.name}.`);
  if (before.amount !== item.amount) out.push(`${item.name}: ${money(before.amount)} → ${money(item.amount)}.`);
  else if (before.detail !== item.detail) out.push(`${item.name}: guidance revised.`);
 });
 if (prev.contingency !== next.contingency) out.push(`Unspent contingency: ${money(prev.contingency)} → ${money(next.contingency)}.`);
 return out;
}
