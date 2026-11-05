(function(root) {
function validateShipment(items, opts) {
  if (!items.length) throw new Error('Add at least one cargo item.');
  if (!Number.isFinite(opts.maxWeight) || opts.maxWeight <= 0) throw new Error('Enter a positive payload in kg.');
  let total = 0;
  for (const c of items) {
    if (![c.l,c.w,c.h,c.weight].every(n => Number.isFinite(n) && n > 0)) throw new Error('Every SKU needs positive dimensions and weight.');
    if (!Number.isSafeInteger(c.qty) || c.qty < 0) throw new Error('Quantities must be whole numbers, zero or greater.');
    total += c.qty;
  }
  if (!total) throw new Error('Enter at least one unit to load.');
  if (total > 50000) throw new Error('Plan up to 50,000 units at a time. Split larger shipments.');
}
function slicePacking(spec, items, opts) {
  const skus = items.map((c,i)=>({...c,remaining:c.qty,colorIndex:i%8,eL:c.l,eW:c.w,eH:c.h}));
  const slices = [];
  let x = 0, totalWeight = 0, totalPacked = 0;
  for (const sku of [...skus].sort((a,b)=>b.weight-a.weight || b.l*b.w*b.h-a.l*a.w*a.h)) {
    while (sku.remaining > 0) {
      const orientations = [[sku.l,sku.w,sku.h]];
      if (opts.allowRotation) orientations.push([sku.w,sku.l,sku.h]);
      let best = null;
      for (const [l,w,h] of orientations) {
        const cols = Math.floor(spec.w/w), rows = Math.floor(spec.h/h);
        if (l > spec.l-x || !cols || !rows) continue;
        const count = Math.min(cols*rows,sku.remaining,Math.floor((opts.maxWeight-totalWeight+1e-8)/sku.weight));
        if (count > 0 && (!best || count/l > best.count/best.l)) best = {l,w,h,cols,count};
      }
      if (!best) break;
      const {l,w,h,cols,count} = best;
      const placementCells = Array.from({length:opts.summaryOnly ? 0 : count},(_,i)=>({x,y:Math.floor(i/cols)*h,z:(i%cols)*w,l,w,h,skuId:sku.id,skuName:sku.name,colorIndex:sku.colorIndex,col:i%cols+1,row:Math.floor(i/cols)+1}));
      slices.push({index:slices.length+1,depth:l,xStart:x,cols,rowsMax:Math.ceil(count/cols),rowsUsed:Math.ceil(count/cols),totalCartons:count,placementCells,
        items:[{skuId:sku.id,name:sku.name,colorIndex:sku.colorIndex,qty:count,orientation:`${l}x${w}x${h}`}]});
      Object.assign(sku,{eL:l,eW:w,eH:h});
      sku.remaining -= count; totalWeight += count*sku.weight; totalPacked += count; x += l;
    }
  }
  return {slices,skus,totalWeight,totalPacked};
}
function planShipment(spec, items, opts) {
  validateShipment(items,opts);
  const containers = [];
  let remaining = items.map(c=>({...c}));
  while (remaining.some(c=>c.qty>0) && containers.length < 100) {
    const packing = slicePacking(spec,remaining,opts);
    if (!packing.totalPacked) break;
    containers.push({...packing,spec,opts});
    remaining = remaining.map(c=>({...c,qty:packing.skus.find(s=>s.id===c.id).remaining}));
  }
  return {spec,opts,containers,remaining:remaining.filter(c=>c.qty>0),requested:items.reduce((n,c)=>n+c.qty,0)};
}


const api={validateShipment,slicePacking,planShipment};
if(typeof module!=="undefined") module.exports=api; else root.Packing=api;
})(globalThis);
