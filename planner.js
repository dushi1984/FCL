/* Conservative, supported, single-SKU rows. Dimensions in mm, mass in kg.
   This is a feasible heuristic plan, not a proof of the minimum fleet size. */
(function(root) {
function validate(items, opts) {
  if (!items.length) throw new Error('Add at least one cargo item.');
  if (!Number.isFinite(opts.maxWeight) || opts.maxWeight <= 0) throw new Error('Payload must be greater than zero.');
  let total = 0;
  items.forEach(c => {
    if (![c.l,c.w,c.h,c.weight].every(n => Number.isFinite(n) && n > 0)) throw new Error('Every item needs positive dimensions and weight.');
    if (!Number.isSafeInteger(c.qty) || c.qty < 0) throw new Error('Quantities must be whole numbers, zero or greater.');
    total += c.qty;
  });
  if (!total) throw new Error('Enter a quantity for at least one item.');
  if (total > 50000) throw new Error('Plan up to 50,000 cartons at a time. Split larger shipments.');
}
function pack(spec, items, opts) {
  const skus = items.map((s,i)=>({...s, remaining:s.qty, colorIndex:i%8}));
  const slices=[];
  let x=0, totalWeight=0, totalPacked=0;
  for(const sku of [...skus].sort((a,b)=> b.weight-a.weight || b.l*b.w*b.h-a.l*a.w*a.h)) {
    while(sku.remaining > 0) {
      // Rotation is on the floor only: keep cartons upright and stacks supported.
      const orientations = [[sku.l,sku.w,sku.h]];
      if(opts.allowRotation) orientations.push([sku.w,sku.l,sku.h]);
      let best;
      for(const [l,w,h] of orientations) {
        const cols=Math.floor(spec.w/w), rows=Math.floor(spec.h/h);
        if(l > spec.l-x || !cols || !rows) continue;
        const count=Math.min(cols*rows,sku.remaining,Math.floor((opts.maxWeight-totalWeight+1e-8)/sku.weight));
        const score=count/l;
        if(count>0 && (!best || score>best.score)) best={l,w,h,cols,rows,count,score};
      }
      if(!best) break;
      const {l,w,h,cols,rows,count}=best;
      const cells=Array.from({length:count},(_,i)=>({x,y:Math.floor(i/cols)*h,z:(i%cols)*w,l,w,h,skuId:sku.id,skuName:sku.name,colorIndex:sku.colorIndex,col:i%cols+1,row:Math.floor(i/cols)+1}));
      slices.push({index:slices.length+1,depth:l,xStart:x,cols,rowsMax:Math.ceil(count/cols),rowsUsed:Math.ceil(count/cols),totalCartons:count,placementCells:cells,items:[{skuId:sku.id,name:sku.name,colorIndex:sku.colorIndex,qty:count,orientation:`${l}x${w}x${h}`}]});
      Object.assign(sku,{eL:l,eW:w,eH:h});
      sku.remaining-=count; totalWeight+=count*sku.weight; totalPacked+=count; x+=l;
    }
  }
  return {slices,skus,totalWeight,totalPacked};
}
function plan(spec,items,opts) {
  validate(items,opts);
  let remaining=items.map(c=>({...c}));
  const containers=[];
  while(remaining.some(c=>c.qty>0) && containers.length<100) {
    const packing=pack(spec,remaining,opts);
    if(!packing.totalPacked) break;
    containers.push(packing);
    remaining=remaining.map(c=>({...c,qty:packing.skus.find(s=>s.id===c.id).remaining}));
  }
  return {containers,remaining:remaining.filter(c=>c.qty>0),requested:items.reduce((s,c)=>s+c.qty,0)};
}
const api={pack,plan,validate};
if(typeof module!=='undefined') module.exports=api;
else root.FCLPlanner=api;
})(globalThis);
