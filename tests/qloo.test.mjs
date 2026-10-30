import {test,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {qlooApi,clearQlooCache} from '../lib/qloo.ts';
beforeEach(()=>clearQlooCache());
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

test('room briefs survive every direction, veto revision and download without reaching Qloo',async()=>{
 const original=globalThis.fetch;
 globalThis.fetch=async(url)=>{assert(!String(url).includes('oak'));assert(!String(url).includes('pets'));return Response.json({results:{entities:[entity(ids[2],'Shared'),entity(ids[0],'Alternative')]}})};
 try {
  const {downloadPlan}=await import('../lib/room-brief.ts');
  for(const room of ['Living room','Bedroom','Dining room','Home office']) for(const unit of ['ft','m']) {
   const brief={room,dimensions:{unit,length:5,width:4},keep:'oak table',needs:'pets; clear walking routes'};
   for(const vetoes of [[],[ids[2]]]) {
    const r=await qlooApi(request({...brief,vetoes,budget:1701,focus:'Room refresh'}),'test-key');assert.equal(r.status,200);const d=await r.json();
    assert.deepEqual(d.brief,brief);assert(d.directions.every(x=>x.brief.keep==='oak table'));assert(d.directions.every(x=>!vetoes.includes(x.id)));
    assert(d.plan.every(x=>x.detail.includes('oak table')&&x.detail.includes('pets')&&x.detail.includes(room)));
    const text=downloadPlan(d,0);for(const value of [room,'oak table','pets','1701','height: not supplied',unit]) assert(text.includes(value));
   }
  }
  const d=await (await qlooApi(request(),'test-key')).json();assert.equal(d.brief.room,'Living room');assert.equal(d.brief.dimensions.length,undefined);
 } finally {globalThis.fetch=original}
});
test('invalid room constraints are rejected before fetching recommendations',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>{throw Error('must not call Qloo')};
 try {for(const input of [{room:'Kitchen'},{dimensions:{unit:'yards'}},{dimensions:{unit:'ft',length:-1}},{dimensions:{unit:'m',width:101}},{dimensions:{unit:'ft',height:null}},{dimensions:{unit:'m',length:'5'}},{keep:'a'.repeat(1001)},{needs:[]}]) assert.equal((await qlooApi(request(input),'test-key')).status,400)}finally{globalThis.fetch=original}
});
