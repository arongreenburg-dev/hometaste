import type {RoomBrief} from './room-brief.ts';
export type Revision='original'|'warmer'|'less-spend'|'easy-care';
export const revisions:Revision[]=['original','warmer','less-spend','easy-care'];
export function composeConcept(tags:string[],brief:RoomBrief,budget:number,focus:string,revision:Revision='original'){
 const signals=tags.join(' ').toLowerCase();
 const style=/eclectic|bold|vibrant|colorful/.test(signals)?'expressive':/natural|earth|warm|organic|wood/.test(signals)?'natural':'streamlined';
 const warm=revision==='warmer'||style==='natural';
 const palette=revision==='warmer'?['#bc9d76','#e8d5b7','#957455','#faf0dd']:style==='expressive'?['#b75e48','#e4bb75','#394c53','#ece1d2']:warm?['#b4a17e','#d9cdb9','#707d66','#f2ede2']:['#b7b5af','#e5e0d6','#434c48','#d0bc9b'];
 const cost=revision==='less-spend'?0.75:1;const spend=Math.floor(budget*cost);const reserve=budget-spend;
 const notes=(brief.needs+' '+brief.keep).toLowerCase();const easy=revision==='easy-care'||/dog|pet|child|wash|durab/.test(notes);
 const room=brief.room; const area=brief.dimensions.length&&brief.dimensions.width?brief.dimensions.length*brief.dimensions.width*(brief.dimensions.unit==='ft'?0.092903:1):undefined;const small=!!area&&area<12;
 const material=style==='expressive'?'a sculptural shape and one restrained accent color':warm?'wood or woven texture with a warm neutral finish':'simple lines, matte finishes, and restrained contrast';
 const placement=room==='Bedroom'?'beside the existing bed':room==='Home office'?'at the existing desk, outside the screen reflection':room==='Dining room'?'on a sideboard or perimeter surface, away from table sightlines':'next to the seating area';
 const textile=room==='Bedroom'?'Bedding or curtain sample':room==='Home office'?'Window treatment sample':room==='Dining room'?'Table linen or curtain sample':'Rug or curtain sample';
 const lighting=focus==='Lighting';
 const specs=lighting?[
  {name:room==='Home office'?'Adjustable task lamp':room==='Bedroom'?'Bedside reading light':'Movable reading or floor lamp',role:'Main light',fraction:.4,detail:`Try ${material} ${placement}. ${small?'Use an existing surface or compact footprint. ':''}Measure available space and verify bulb compatibility.`},
  {name:'Secondary ambient light',role:'Layer',fraction:.25,detail:`Test a small table lamp on an existing surface. ${warm?'Try warm light first.':'Compare light warmth against your existing finishes.'} Check actual glare in the room.`},
  {name:'Bulbs and small finishing details',role:'Finish',fraction:.15,detail:`Match the selected palette with one small accent. ${easy?'Choose wipeable or washable finishes.':'Use samples before buying.'}`}
 ]:[
  {name:room==='Home office'?'Adjustable desk light':room==='Bedroom'?'Bedside lamp':'Movable accent lamp',role:'Light',fraction:.3,detail:`Use ${material} ${placement}. ${small?'Avoid adding a large furniture footprint.':'Keep walking routes clear.'}`},
  {name:textile,role:'Texture',fraction:.3,detail:`${easy?'Choose washable, low-pile, or wipeable materials.':'Try tactile fabric or a textured sample.'} Echo ${warm?'warm neutrals':'the concept palette'}; compare it directly with the items you are keeping.`},
  {name:room==='Home office'?'Small desk organizer':room==='Dining room'?'Tabletop accent':room==='Bedroom'?'Small bedside accent':'Cushion or small decorative accent',role:'Accent',fraction:.2,detail:`Choose ${style==='expressive'?'one expressive color or pattern':'one quiet accent with a simple form'}. ${small?'Use existing surfaces.':'Keep the composition uncluttered.'}`}
 ];
 const items=specs.map(s=>({...s,amount:Math.floor(spend*s.fraction)}));const used=items.reduce((s,x)=>s+x.amount,0);const contingency=budget-used;
 return {style,palette,items,contingency,spend,revision,changes:revision==='original'?['Initial composition from Qloo aesthetic tags and the room brief.']:revision==='warmer'?['Shifted the illustrative palette and finish guidance toward warm neutrals.']:revision==='less-spend'?[`Reduced item allowances by about 25%; retained the original $${budget} ceiling and increased the unspent reserve.`]:['Prioritized washable, low-pile, or wipeable materials.'],constraints:[`Keep: ${brief.keep||'No retained items specified.'}`,`Room: ${room}. ${area?`Approximate floor area: ${area.toFixed(1)} m²; furniture fit is not verified.`:'Measurements not supplied; fit cannot be assessed.'}`,`Household needs: ${brief.needs||'Not supplied.'}`],rationale:`Qloo tags (${tags.slice(0,4).join(', ')||'no aesthetic tags returned'}) inform the ${style} finish direction. HomeTaste applies the room, ${easy?'easy-care needs, ':''}${small?'compact-space guidance, ':''}retained items, and budget rules.`,label:'Illustrative item brief — not actual products, prices, or a measured layout',reserve};
}
