import type {RoomBrief} from './room-brief.ts';
export type Preference='warmer'|'less-spend'|'easy-care';
// Legacy single-revision name, still accepted by the API.
export type Revision='original'|Preference;
export const preferences:Preference[]=['warmer','less-spend','easy-care'];
export const revisions:Revision[]=['original',...preferences];
export const preferenceLabels:Record<Preference,string>={warmer:'Warmer finishes','less-spend':'Spend about 25% less','easy-care':'Easier to clean'};

// Accepts the combinable `preferences` array, or the legacy single `revision`. Returns canonical order.
export function normalizePreferences(list:unknown,legacy?:unknown):Preference[]{
 if(list===undefined||list===null){
  if(legacy===undefined||legacy===null||legacy==='original')return [];
  list=[legacy];
 }
 if(!Array.isArray(list)||list.length>preferences.length||!list.every(p=>preferences.includes(p)))throw Error('Choose a supported revision.');
 return preferences.filter(p=>list.includes(p));
}

// Narrow, deterministic keyword reading of the household notes. Anything unmatched is kept in the brief but not interpreted.
export type NeedsReading={easyCare:boolean;warmLight:boolean;glare:boolean;reading:boolean;videoCalls:boolean;compact:boolean;clearPath:boolean;applied:string[]};
export function interpretNeeds(needs:string,keep=''):NeedsReading{
 const n=needs.toLowerCase();const k=keep.toLowerCase();
 const r:NeedsReading={
  easyCare:/\b(dogs?|cats?|pets?|child|children|kids?|toddlers?|bab(y|ies)|washable|wipeable|durab|spill)/.test(n+' '+k),
  warmLight:/\bwarm|cosy|cozy|calm/.test(n),
  glare:/glare|reflection/.test(n),
  reading:/\bread(ing)?\b/.test(n),
  videoCalls:/video|zoom|calls?\b|webcam|camera/.test(n),
  compact:/no (extra )?large|small (room|space)|compact|limited space|tight space/.test(n),
  clearPath:/clear (desk |door )?(path|walk|route|access)|walkway|wheelchair|walker|mobility|accessib|trip/.test(n),
  applied:[]
 };
 if(r.easyCare)r.applied.push('Pets, children, or washable materials → easy-care finishes');
 if(r.warmLight)r.applied.push('Warm or calm mood → warm-white light first');
 if(r.glare)r.applied.push('Glare concern → shaded or diffused light, placed out of sightlines');
 if(r.reading)r.applied.push('Reading → adjustable, directional main light');
 if(r.videoCalls)r.applied.push('Video calls → soft light in front of the face');
 if(r.compact)r.applied.push('No large furniture → compact footprints on existing surfaces');
 if(r.clearPath)r.applied.push('Clear paths or access → no floor-standing items or cords in routes');
 return r;
}

export function composeConcept(tags:string[],brief:RoomBrief,budget:number,focus:string,requested:Preference[]|Revision=[]){
 const prefs=typeof requested==='string'?normalizePreferences(undefined,requested):normalizePreferences(requested);
 const warmer=prefs.includes('warmer'),lessSpend=prefs.includes('less-spend'),easyCarePref=prefs.includes('easy-care');
 const needs=interpretNeeds(brief.needs,brief.keep);
 const signals=tags.join(' ').toLowerCase();
 const style=/eclectic|bold|vibrant|colorful/.test(signals)?'expressive':/natural|earth|warm|organic|wood/.test(signals)?'natural':'streamlined';
 const warm=warmer||style==='natural';
 const palette=warmer?['#bc9d76','#e8d5b7','#957455','#faf0dd']:style==='expressive'?['#b75e48','#e4bb75','#394c53','#ece1d2']:warm?['#b4a17e','#d9cdb9','#707d66','#f2ede2']:['#b7b5af','#e5e0d6','#434c48','#d0bc9b'];
 const cost=lessSpend?0.75:1;const spend=Math.floor(budget*cost);const reserve=budget-spend;
 const easy=easyCarePref||needs.easyCare;
 const room=brief.room; const area=brief.dimensions.length&&brief.dimensions.width?brief.dimensions.length*brief.dimensions.width*(brief.dimensions.unit==='ft'?0.092903:1):undefined;const small=(!!area&&area<12)||needs.compact;
 const material=style==='expressive'?'a sculptural shape and one restrained accent color':warm?'wood or woven texture with a warm neutral finish':'simple lines, matte finishes, and restrained contrast';
 const placement=room==='Bedroom'?'beside the existing bed':room==='Home office'?'at the existing desk, outside the screen reflection':room==='Dining room'?'on a sideboard or perimeter surface, away from table sightlines':'next to the seating area';
 const textile=room==='Bedroom'?'Bedding or curtain sample':room==='Home office'?'Window treatment sample':room==='Dining room'?'Table linen or curtain sample':'Rug or curtain sample';
 const lighting=focus==='Lighting';
 // Household-need guidance that changes item choices, not just the summary.
 const lightNeeds=[
  needs.reading&&'Choose an adjustable or directional head aimed at the page.',
  needs.glare&&(room==='Home office'?'Use a shaded or diffused head placed to the side of the screen, not behind it.':'Use a shaded or diffused head so the bulb is not visible from seats or the bed.'),
  needs.clearPath&&'Prefer a table, clamp, or plug-in wall light over a floor lamp; keep cords out of walking routes.'
 ].filter(Boolean).join(' ');
 const ambientNeeds=[
  needs.videoCalls&&'For video calls, place soft light in front of you, behind the camera.',
  (warmer||needs.warmLight)?'Use warm-white bulbs (around 2700K) for a calm evening mood.':''
 ].filter(Boolean).join(' ');
 const mainName=room==='Home office'?'Adjustable task lamp':room==='Bedroom'?'Bedside reading light':needs.clearPath?'Table or wall-mounted reading light':'Movable reading or floor lamp';
 const specs=lighting?[
  {name:mainName,role:'Main light',fraction:.4,detail:`Try ${material} ${placement}. ${lightNeeds?lightNeeds+' ':''}${small?'Use an existing surface or compact footprint. ':''}Measure available space and verify bulb compatibility.`},
  {name:needs.videoCalls?'Soft front fill light':'Secondary ambient light',role:'Layer',fraction:.25,detail:`${needs.videoCalls?'Add a diffused light on the desk or wall facing you.':'Test a small table lamp on an existing surface.'} ${ambientNeeds||(warm?'Try warm light first.':'Compare light warmth against your existing finishes.')} Check actual glare in the room.`},
  {name:'Bulbs and small finishing details',role:'Finish',fraction:.15,detail:`Match the selected palette with one small accent. ${easy?'Choose wipeable or washable finishes.':'Use samples before buying.'}`}
 ]:[
  {name:room==='Home office'?'Adjustable desk light':room==='Bedroom'?'Bedside lamp':needs.clearPath?'Table or wall-mounted accent light':'Movable accent lamp',role:'Light',fraction:.3,detail:`Use ${material} ${placement}. ${lightNeeds?lightNeeds+' ':''}${ambientNeeds?ambientNeeds+' ':''}${small?'Avoid adding a large furniture footprint.':'Keep walking routes clear.'}`},
  {name:textile,role:'Texture',fraction:.3,detail:`${easy?'Choose washable, low-pile, or wipeable materials.':'Try tactile fabric or a textured sample.'} ${needs.clearPath&&/Rug/.test(textile)?'Keep rug edges flat and secured, or choose curtains instead. ':''}Echo ${warm?'warm neutrals':'the concept palette'}; compare it directly with the items you are keeping.`},
  {name:room==='Home office'?'Small desk organizer':room==='Dining room'?'Tabletop accent':room==='Bedroom'?'Small bedside accent':'Cushion or small decorative accent',role:'Accent',fraction:.2,detail:`Choose ${style==='expressive'?'one expressive color or pattern':'one quiet accent with a simple form'}. ${small?'Use existing surfaces.':'Keep the composition uncluttered.'}`}
 ];
 const items=specs.map(s=>({...s,amount:Math.floor(spend*s.fraction)}));const used=items.reduce((s,x)=>s+x.amount,0);const contingency=budget-used;
 const changes=prefs.length?prefs.map(p=>p==='warmer'?'Warmer finishes: shifted the palette and finish guidance toward warm neutrals and warm-white light.':p==='less-spend'?`Spend less: reduced item allowances by about 25% (to $${spend.toLocaleString()} of $${budget.toLocaleString()}); the unspent reserve grows and the ceiling is unchanged.`:'Easier to clean: prioritized washable, low-pile, or wipeable materials.'):['Initial composition from Qloo aesthetic tags and the room brief.'];
 return {style,palette,items,contingency,spend,preferences:prefs,revision:prefs.length?prefs.join('+'):'original',needsApplied:needs.applied,changes,constraints:[`Keep: ${brief.keep||'No retained items specified.'}`,`Room: ${room}. ${area?`Approximate floor area: ${area.toFixed(1)} m²; furniture fit is not verified.`:'Measurements not supplied; fit cannot be assessed.'}`,`Household needs: ${brief.needs||'Not supplied.'}`],rationale:`Qloo tags (${tags.slice(0,4).join(', ')||'no aesthetic tags returned'}) inform the ${style} finish direction. HomeTaste applies the room, ${needs.applied.length?'household needs, ':easy?'easy-care needs, ':''}${small?'compact-space guidance, ':''}retained items, and budget rules.`,label:'Illustrative item brief — not actual products, prices, or a measured layout',reserve};
}
