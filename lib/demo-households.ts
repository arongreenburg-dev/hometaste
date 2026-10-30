// Fictional people and room details. Taste references are real, verified Qloo entity IDs.
const muji={id:'E12201A5-CC50-40AF-97AE-C54A2CA303F7',name:'Muji',type:'brand'};
const westElm={id:'18D4B0BC-4E4F-4563-809C-1A4B0AC9D39C',name:'West Elm',type:'brand'};
const dylan={id:'54652BC1-43E5-4A00-AA7F-57F79D369CA3',name:'Bob Dylan',type:'artist'};
export const demoHouseholds=[
 {id:'shared-living',label:'Shared living room',description:'Different tastes, a sofa to keep, and a $1,500 refresh.',people:[{name:'Alex',entities:[muji]},{name:'Jordan',entities:[westElm]}],room:'Living room',focus:'Room refresh',budget:1500,dimensions:{length:'16',width:'12',height:'8'},keep:'Blue three-seat sofa and oak coffee table',needs:'Two adults, a dog, washable textiles, and a clear path to the door.'},
 {id:'music-bedroom',label:'Music meets modern',description:'Bob Dylan + West Elm, a bedroom, and an $800 lighting budget.',people:[{name:'Sam',entities:[dylan]},{name:'Casey',entities:[westElm]}],room:'Bedroom',focus:'Lighting',budget:800,dimensions:{length:'12',width:'11',height:'8'},keep:'Queen bed and two existing bedside tables',needs:'Reading before bed; warm, calm light; avoid glare.'},
 {id:'small-office',label:'Small home office',description:'A 10 × 9 ft room, an existing desk, and a $500 limit.',people:[{name:'Taylor',entities:[muji]},{name:'Morgan',entities:[westElm]}],room:'Home office',focus:'Room refresh',budget:500,dimensions:{length:'10',width:'9',height:'8'},keep:'Oak desk and ergonomic chair',needs:'Video calls, screen glare control, clear desk access; no extra large furniture.'}
];
