import {test} from 'node:test';
import assert from 'node:assert/strict';
import {qlooApi} from '../lib/qloo.ts';
const ids=['00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003'];
const people=ids.slice(0,2).map((id,i)=>({name:'Person '+i,entities:[{id}]}));
const entity=(id,name)=>({entity_id:id,name,tags:[{type:'urn:tag:aesthetic_property:qloo',name:'Natural Materials'}],properties:{description:'Home goods brand'}});
const request=(overrides={})=>new Request('https://example.com/api/plan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({people,budget:1500,focus:'Lighting',vetoes:[],...overrides})});
test('real response schema: shared ranking, veto, budget and source separation',async()=>{
 const original=globalThis.fetch;
 globalThis.fetch=async(url,opts)=>{const u=new URL(url);assert.equal(opts.headers['X-Api-Key'],'test-key');assert.equal(u.origin,'https://hackathon.api.qloo.com');assert.equal(u.searchParams.get('filter.tags'),'urn:tag:industry:qloo:home_goods');assert(!u.href.includes('Person'));const first=u.searchParams.get('signal.interests.entities')===ids[0];return Response.json({success:true,results:{entities:first?[entity(ids[0],'A'),entity(ids[2],'Shared')]:[entity(ids[1],'B'),entity(ids[2],'Shared')]}})};
 try{let r=await qlooApi(request(),'test-key');assert.equal(r.status,200);let d=await r.json();assert.equal(d.directions[0].name,'Shared');assert.deepEqual(d.directions[0].ranks,[2,2]);assert.equal(d.plan.reduce((s,p)=>s+p.amount,0),1500);assert(d.directions[0].tags.includes('Natural Materials'));assert(!JSON.stringify(d).includes('test-key'));r=await qlooApi(request({vetoes:[ids[2]]}),'test-key');d=await r.json();assert(!d.directions.some(x=>x.id===ids[2]));assert(d.directions.every(x=>x.ranks.includes(null)));}finally{globalThis.fetch=original}
});
test('invalid inputs and missing configuration fail without calling Qloo',async()=>{assert.equal((await qlooApi(request())).status,503);for(const b of [{budget:0},{budget:Infinity},{people:[]},{focus:'Construction'}])assert.equal((await qlooApi(request(b),'test-key')).status,400)});
test('API failure produces an honest error, not fallback recommendations',async()=>{const original=globalThis.fetch;globalThis.fetch=async()=>new Response('rate limited',{status:429});try{const r=await qlooApi(request(),'test-key');assert.equal(r.status,502);const d=await r.json();assert.match(d.error,/busy/);assert(!d.directions)}finally{globalThis.fetch=original}});
