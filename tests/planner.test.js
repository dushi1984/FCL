const {test}=require('node:test');
const assert=require('node:assert/strict');
const {plan}=require('../planner');
const spec={l:1000,w:1000,h:1000};
const opts={maxWeight:1000,allowRotation:true};
const box=(qty,extra={})=>({id:1,name:'Carton',l:500,w:500,h:500,weight:10,qty,...extra});
test('exact single-container capacity',()=>assert.equal(plan(spec,[box(8)],opts).containers.length,1));
test('whole quantities roll into second container',()=>{
 const p=plan(spec,[box(9)],opts);
 assert.deepEqual(p.containers.map(c=>c.totalPacked),[8,1]);assert.equal(p.remaining.length,0);
});
test('payload limits split cargo',()=>assert.deepEqual(plan(spec,[box(8)],{...opts,maxWeight:30}).containers.map(c=>c.totalPacked),[3,3,2]));
test('oversize and overweight cargo is explicitly unallocated',()=>{
 assert.equal(plan(spec,[box(2,{l:2000,w:2000})],opts).remaining[0].qty,2);
 assert.equal(plan(spec,[box(2,{weight:1001})],opts).containers.length,0);
});
test('invalid input is rejected',()=>{
 for(const change of [{qty:1.5},{qty:-1},{l:0},{h:NaN},{weight:0},{qty:50001}]) assert.throws(()=>plan(spec,[box(1,change)],opts));
 assert.throws(()=>plan(spec,[box(1)],{...opts,maxWeight:0}));
});
test('rotation stays upright and fits floor',()=>{
 const p=plan({l:400,w:700,h:300},[box(1,{l:600,w:300,h:200})],opts);
 assert.equal(p.containers.length,1);
 assert.equal(p.containers[0].slices[0].placementCells[0].h,200);
 assert.equal(plan({l:400,w:700,h:300},[box(1,{l:600,w:300,h:200})],{...opts,allowRotation:false}).containers.length,0);
});
test('mixed SKU placements conserve quantity and never overlap or exceed boundaries',()=>{
 const items=[box(17),box(12,{id:2,l:300,w:200,h:250,weight:15})];
 const p=plan(spec,items,opts);
 assert.equal(p.remaining.length,0);
 for(const item of items) assert.equal(p.containers.reduce((n,c)=>n+c.skus.find(s=>s.id===item.id).qty-c.skus.find(s=>s.id===item.id).remaining,0),item.qty);
 for(const container of p.containers) {
  assert.ok(container.totalWeight<=opts.maxWeight);
  const cells=container.slices.flatMap(s=>s.placementCells);
  cells.forEach((a,i)=>{
   assert.ok(a.x+a.l<=spec.l && a.y+a.h<=spec.h && a.z+a.w<=spec.w);
   for(const b of cells.slice(i+1)) assert.ok(a.x+a.l<=b.x || b.x+b.l<=a.x || a.y+a.h<=b.y || b.y+b.h<=a.y || a.z+a.w<=b.z || b.z+b.w<=a.z);
  });
 }
});
