const {test}=require('node:test');
const assert=require('node:assert/strict');
const {optimize}=require('../js/fleet');
const equipment=[{id:'20',name:'20ft',l:5898,w:2352,h:2393,maxWeight:27000,rate:800},{id:'40',name:'40ft',l:12032,w:2352,h:2393,maxWeight:27000,rate:1400},{id:'40hc',name:'40ft HC',l:12032,w:2352,h:2698,maxWeight:27000,rate:1600}];
const opts={maxWeight:27000,allowRotation:true};
const items=[{id:1,name:'Tall cartons',l:1000,w:1000,h:2500,weight:20,qty:24},{id:2,name:'Small cartons',l:1000,w:1000,h:1000,weight:10,qty:8}];
test('recommends 40ft High Cube plus 20ft instead of two large containers',()=>{
 const p=optimize(items,equipment,opts).plans[0];
 assert.deepEqual(p.containers.map(c=>c.spec.id).sort(),['20','40hc']);
 assert.equal(p.remaining.length,0);
});
test('small order selects one 20ft',()=>{
 assert.equal(optimize([items[1]],equipment,opts).plans[0].containers[0].spec.id,'20');
});
test('cost priority can prefer two cheaper containers over one larger',()=>{
 const e=[{...equipment[0],rate:100},{...equipment[1],rate:1000}];
 const cargo=[{...items[1],qty:30}];
 const p=optimize(cargo,e,opts,'cost').plans[0];
 assert.deepEqual(p.containers.map(c=>c.spec.id),['20','20']);assert.equal(p.cost,200);
});
test('enabled types, per-type payloads and missing rates respected',()=>{
 assert.throws(()=>optimize(items,[],opts));
 assert.throws(()=>optimize(items,[{...equipment[0],rate:null}],opts,'cost'));
 const p=optimize([{...items[1],qty:5}],[{...equipment[0],maxWeight:20}],opts).plans[0];
 assert.equal(p.containers.length,3);assert.ok(p.containers.every(c=>c.totalWeight<=20));
});
test('impossible cargo remains explicit and no fake complete plan',()=>{
 const p=optimize([{...items[0],h:9000}],equipment,opts).plans[0];
 assert.equal(p.containers.length,0);assert.equal(p.remaining[0].qty,24);
});
test('all alternatives conserve quantities, bounds and payload',()=>{
 for(const p of optimize(items,equipment,opts).plans) {
  for(const item of items) {
   const count=p.containers.reduce((n,c)=>n+c.skus.filter(s=>s.id===item.id).reduce((a,s)=>a+s.qty-s.remaining,0),0)+p.remaining.filter(s=>s.id===item.id).reduce((n,s)=>n+s.qty,0);
   assert.equal(count,item.qty);
  }
  for(const c of p.containers) {
   assert.ok(c.totalWeight<=c.spec.maxWeight);
   for(const b of c.slices.flatMap(s=>s.placementCells)) assert.ok(b.x+b.l<=c.spec.l && b.y+b.h<=c.spec.h && b.z+b.w<=c.spec.w);
  }
 }
});
