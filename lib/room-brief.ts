export const rooms = ['Living room', 'Bedroom', 'Dining room', 'Home office'] as const;
export type RoomBrief = {room: string; dimensions: {unit: 'ft' | 'm'; length?: number; width?: number; height?: number}; keep: string; needs: string};
export function parseBrief(input: any): RoomBrief {
 const room = input.room ?? 'Living room';
 if (!rooms.includes(room)) throw Error('Choose a supported room.');
 const d = input.dimensions ?? {unit: 'ft'};
 if (!d || !['ft', 'm'].includes(d.unit)) throw Error('Choose feet or meters.');
 const dimensions: RoomBrief['dimensions'] = {unit: d.unit};
 for (const axis of ['length', 'width', 'height'] as const) {
  const value = d[axis];
  if (value === undefined || value === '') continue;
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value > (d.unit === 'ft' ? 300 : 100)) throw Error('Measurements must be positive numbers, up to 300 feet or 100 meters.');
  dimensions[axis] = value;
 }
 for (const field of ['keep', 'needs']) if (input[field] !== undefined && (typeof input[field] !== 'string' || input[field].length > 1000)) throw Error('Keep furniture and household notes under 1,000 characters each.');
 return {room, dimensions, keep: (input.keep ?? '').trim(), needs: (input.needs ?? '').trim()};
}
export function briefSummary(b: RoomBrief) {
 const measurements = (['length','width','height'] as const).map(k => `${k}: ${b.dimensions[k] === undefined ? 'not supplied' : b.dimensions[k] + ' ' + b.dimensions.unit}`).join(', ');
 return `${b.room}. Measurements — ${measurements}. Keep: ${b.keep.replace(/[.\s]+$/, '') || 'no specific items supplied'}. Household needs: ${b.needs.replace(/[.\s]+$/, '') || 'not supplied'}.`;
}
export function downloadPlan(data: any, selected: number) {
 const direction = data.directions[selected];
 const c=direction.concept;const conceptText=c?`\nComposition: ${c.style}\n${c.rationale}\n${c.items.map((x:any)=>`${x.name}: $${x.amount} allowance — ${x.detail}`).join('\n')}\nUnspent contingency: $${c.contingency}\nRevision: ${c.changes.join(' ')}\n${c.constraints.join('\n')}\n${c.label}\n`:'';
 return `HomeTaste — ${data.brief.room}\n${direction.name}: ${direction.title}\n${direction.why}\n${conceptText}\n${briefSummary(data.brief)}\nGoal: ${data.focus}\nBudget: $${data.budget}\n\n${(c?[]:data.plan).map((p: any) => `${p.title}: $${p.amount}\n${p.detail}`).join('\n\n')}\n\n${data.method}`;
}
