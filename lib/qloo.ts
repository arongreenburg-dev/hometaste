type Entity = {entity_id:string;name:string;types?:string[];tags?:{name:string;type:string;tag_id:string}[];properties?:{description?:string;short_description?:string;image?:{url:string}};affinity?:number};
const base='https://hackathon.api.qloo.com';
async function qloo(path:string,params:Record<string,string>,key:string){
 const response=await fetch(base+path+'?'+new URLSearchParams(params),{headers:{'X-Api-Key':key},signal:AbortSignal.timeout(25000)});
 if(!response.ok) throw new Error(response.status===429?'Qloo is busy. Please wait a minute and try again.':`Qloo request failed (${response.status}). Please try again.`);
 return response.json() as Promise<any>;
}
const compact=(e:Entity)=>({id:e.entity_id,name:e.name,type:e.types?.[0]?.replace('urn:entity:','')||'brand',description:e.properties?.short_description||e.properties?.description?.slice(0,240)||'',tags:(e.tags||[]).filter(t=>/aesthetic_property|emotional_tone|lifestyle/.test(t.type)).map(t=>t.name).slice(0,8)});
export async function qlooApi(request:Request,key?:string){
 const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
 if(!key)return json({error:'Qloo access is not configured yet.'},503);
 try{
 const url=new URL(request.url);
 if(url.pathname==='/api/search'&&request.method==='GET'){
  const q=(url.searchParams.get('q')||'').trim(); if(q.length<2||q.length>100)return json({error:'Enter between 2 and 100 characters.'},400);
  const d=await qloo('/search',{query:q,take:'8'},key);
  return json({results:(d.results||[]).filter((e:Entity)=>e.types?.some(t=>['brand','artist','book','destination','movie','person','podcast','tv_show','video_game'].some(k=>t==='urn:entity:'+k))).map(compact)});
 }
 if(url.pathname==='/api/plan'&&request.method==='POST'){
  if(Number(request.headers.get('Content-Length')||0)>12000)return json({error:'Request too large.'},413);
  const b=await request.json() as any;
  if(!Array.isArray(b.people)||b.people.length!==2||!b.people.every((p:any)=>Array.isArray(p.entities)&&p.entities.length>0&&p.entities.length<=3&&p.entities.every((e:any)=>/^[a-f0-9-]{36}$/i.test(e.id))))return json({error:'Choose at least one taste reference for each person.'},400);
  if(!['Lighting','Room refresh'].includes(b.focus))return json({error:'Choose a supported project focus.'},400);
  const budget=Number(b.budget);if(!Number.isFinite(budget)||budget<100||budget>50000)return json({error:'Choose a budget between $100 and $50,000.'},400);
  const lists:Entity[][]=await Promise.all(b.people.map(async(p:any)=>{
   const d=await qloo('/v2/insights',{'filter.type':'urn:entity:brand','signal.interests.entities':p.entities.map((e:any)=>e.id).join(','),'filter.tags':'urn:tag:industry:qloo:home_goods',take:'20'},key);
   return d.results?.entities||[];
  }));
  const vetoes=Array.isArray(b.vetoes)?b.vetoes.filter((x:unknown)=>typeof x==='string').slice(0,50):[];
  const candidates=new Map<string,{e:Entity;ranks:(number|null)[]}>();
  lists.forEach((list,p)=>list.forEach((e,i)=>{if(vetoes.includes(e.entity_id))return; const c=candidates.get(e.entity_id)||{e,ranks:[null,null]};c.ranks[p]=i+1;candidates.set(e.entity_id,c)}));
  const ranked=[...candidates.values()].map(c=>({...c,score:c.ranks.reduce<number>((s,r)=>s+(r?1/(20+r):0),0)+(c.ranks.every(Boolean)?0.015:0)})).sort((a,b)=>b.score-a.score).slice(0,3);
  const names=b.people.map((p:any,i:number)=>String(p.name||`Person ${i+1}`).slice(0,40));
  const directions=ranked.map((c,i)=>{
   const e=compact(c.e);const tags=e.tags; const natural=tags.some(t=>/natural|warm|organic|wood|earth/i.test(t));const bold=tags.some(t=>/bold|color|eclectic|vibrant/i.test(t));
   const palette=bold?['#b75e48','#e4bb75','#394c53','#ece1d2']:natural?['#b4a17e','#d9cdb9','#707d66','#f2ede2']:['#b7b5af','#e5e0d6','#434c48','#d0bc9b'];
   return {...e,ranks:c.ranks,title:tags.filter(t=>!/living|lifestyle|hospitality/i.test(t)).slice(0,2).join(' · ')||`Explore ${e.name}`,palette,
    why:c.ranks.every(Boolean)?`${e.name} appears in both Qloo recommendation lists: #${c.ranks[0]} for ${names[0]} and #${c.ranks[1]} for ${names[1]}.`:`${e.name} appears for ${names[c.ranks[0]?0:1]}; Qloo did not return it in the other person's top 20. Treat this as a compromise to discuss.`,
    tradeoff:i===0?(c.ranks.every(Boolean)?'Strongest shared ranking among the returned brands. Brand affinity does not establish product fit or price.':'No shared ranking for this brand. Use this as one person’s aesthetic reference rather than a proven household match.'):'An alternate aesthetic reference. Compare the tags together before choosing a direction.'};
  });
  const lighting=b.focus==='Lighting';const allocations=lighting?[['Choose the mood together',0,'Use the direction’s aesthetic tags to agree on light, materials, and finishes.'],['Add a floor or reading lamp',.4,'Start with one movable lamp; check dimensions, bulb compatibility, and return policy.'],['Layer table or accent lighting',.25,'Add a second light source after trying the first in the room.'],['Test bulbs and finishing details',.15,'Compare warm bulb options in your actual room before committing.'],['Hold a contingency',.2,'Keep this amount unspent for tax, shipping, and changes.']]:[['Choose the mood together',0,'Use the direction’s aesthetic tags to agree on the room’s overall feel.'],['Improve the lighting first',.3,'Try one movable floor or table lamp in the room.'],['Add one textile layer',.3,'Compare rug or curtain samples against the furniture you are keeping.'],['Finish with small accents',.2,'Choose cushions or a small accessory only after testing the larger changes.'],['Hold a contingency',.2,'Keep this amount unspent for tax, shipping, and changes.']];
  return json({directions,people:names,counts:lists.map(x=>x.length),generatedAt:new Date().toISOString(),plan:allocations.map(([title,fraction,detail])=>({title,amount:Math.floor(budget*Number(fraction)),detail})),method:'Qloo supplies separate brand recommendations and aesthetic tags for each person. HomeTaste favors brands returned for both people, using reciprocal rank (1 / (20 + rank)) plus a shared-list bonus. These are discovery signals, not personal confidence scores. Palettes and project steps are HomeTaste heuristics; budget amounts are planning allowances, not retailer quotes.'});
 }
 return json({error:'Not found'},404);
 }catch(e){return json({error:e instanceof Error?e.message:'Unable to reach Qloo. Please try again.'},502)}
}
