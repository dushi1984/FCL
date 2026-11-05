const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const {planShipment}=require('../js/packing.js');
const spec={l:1000,w:1000,h:1000},opts={maxWeight:1000,allowRotation:true};
const box=(qty,extra={})=>({id:1,name:'Carton',l:500,w:500,h:500,weight:10,qty,...extra});
test('inline application syntax',()=>new Function(html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'))));
test('exact capacity and overflow',()=>{
 assert.equal(planShipment(spec,[box(8)],opts).containers.length,1);
 assert.deepEqual(planShipment(spec,[box(9)],opts).containers.map(c=>c.totalPacked),[8,1]);
});
test('payload splits quantities',()=>assert.deepEqual(planShipment(spec,[box(8)],{...opts,maxWeight:30}).containers.map(c=>c.totalPacked),[3,3,2]));
test('oversize cargo remains unallocated',()=>assert.equal(planShipment(spec,[box(2,{l:2000,w:2000})],opts).remaining[0].qty,2));
test('invalid input rejected',()=>{
 for(const values of [{qty:-1},{qty:1.2},{qty:50001},{weight:0},{h:NaN},{l:0}]) assert.throws(()=>planShipment(spec,[box(1,values)],opts));
 assert.throws(()=>planShipment(spec,[box(1)],{...opts,maxWeight:0}));
});
test('rotation stays upright',()=>{
 const s={l:400,w:700,h:300},items=[box(1,{l:600,w:300,h:200})];
 assert.equal(planShipment(s,items,opts).containers[0].slices[0].placementCells[0].h,200);
 assert.equal(planShipment(s,items,{...opts,allowRotation:false}).containers.length,0);
});
test('mixed SKUs conserve quantities and placements are in bounds without overlaps',()=>{
 const items=[box(17),box(12,{id:2,l:300,w:200,h:250,weight:15})];
 const p=planShipment(spec,items,opts);
 assert.equal(p.remaining.length,0);
 for(const item of items) assert.equal(p.containers.reduce((n,c)=>{const s=c.skus.find(s=>s.id===item.id);return n+s.qty-s.remaining;},0),item.qty);
 for(const c of p.containers) {
  assert.ok(c.totalWeight<=opts.maxWeight);
  const cells=c.slices.flatMap(s=>s.placementCells);
  cells.forEach((a,i)=>{
   assert.ok(a.x+a.l<=spec.l && a.y+a.h<=spec.h && a.z+a.w<=spec.w);
   for(const b of cells.slice(i+1)) assert.ok(a.x+a.l<=b.x || b.x+b.l<=a.x || a.y+a.h<=b.y || b.y+b.h<=a.y || a.z+a.w<=b.z || b.z+b.w<=a.z);
  });
 }
});
