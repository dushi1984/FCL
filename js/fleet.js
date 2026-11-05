(function(root) {
const packing = typeof module !== 'undefined' ? require('./packing.js') : root.Packing;
const volume = s => s.l*s.w*s.h/1e9;
const units = items => items.reduce((n,c)=>n+c.qty,0);
// Bounded beam search over container sequences. Every branch is actually packed;
// CBM is used only to rank candidates, never as evidence that cargo fits.
function optimize(items, equipment, opts, objective='containers') {
  packing.validateShipment(items,opts);
  if (!equipment.length) throw new Error('Enable at least one container type.');
  if (!['containers','space','cost'].includes(objective)) throw new Error('Unknown planning priority.');
  for (const e of equipment) {
    if (![e.l,e.w,e.h,e.maxWeight].every(v=>Number.isFinite(v)&&v>0)) throw new Error('Every enabled type needs positive dimensions and payload.');
    if (objective==='cost' && (!Number.isFinite(e.rate)||e.rate<=0)) throw new Error('Enter a positive freight rate for every enabled container type.');
  }
  const requested=units(items);
  const rank = s => objective==='cost' ? [s.cost,s.path.length,s.volume] : objective==='space' ? [s.volume,s.path.length] : [s.path.length,s.volume];
  const compare=(a,b)=> {const x=rank(a),y=rank(b);for(let i=0;i<x.length;i++) if(x[i]!==y[i]) return x[i]-y[i];return 0;};
  let frontier=[{remaining:items.map(c=>({...c})),path:[],cost:0,volume:0}], best=frontier[0], completed=[], firstDepth=null, attempts=0;
  for(let depth=0;depth<100 && frontier.length && attempts<800;depth++) {
    if(firstDepth!==null && depth>=firstDepth+2) break;
    const next=[];
    for(const state of frontier) for(const e of equipment) {
      if(attempts++>=800) break;
      const p=packing.slicePacking(e,state.remaining,{...opts,maxWeight:e.maxWeight,summaryOnly:true});
      if(!p.totalPacked) continue;
      const remaining=state.remaining.map(c=>({...c,qty:p.skus.find(s=>s.id===c.id).remaining}));
      const child={remaining,path:[...state.path,e],cost:state.cost+(e.rate||0),volume:state.volume+volume(e)};
      if(units(remaining)<units(best.remaining) || (units(remaining)===units(best.remaining)&&compare(child,best)<0)) best=child;
      if(!units(remaining)) { completed.push(child); if(firstDepth===null) firstDepth=depth+1; }
      else next.push(child);
    }
    // Retain diverse remaining-quantity states; keep cheapest/smallest path for duplicates.
    next.sort((a,b)=>units(a.remaining)-units(b.remaining)||compare(a,b));
    const seen=new Set();
    frontier=next.filter(s=>{const key=s.remaining.map(c=>c.qty).join(',');if(seen.has(key))return false;seen.add(key);return true;}).slice(0,8);
  }
  completed.sort(compare);
  const seen=new Set();
  const choices=completed.filter(s=>{const key=s.path.map(e=>e.id).sort().join(',');if(seen.has(key))return false;seen.add(key);return true;}).slice(0,4);
  if(!choices.length) choices.push(best);
  const plans=choices.map(state=>{
    let remaining=items.map(c=>({...c}));
    const containers=state.path.map(e=>{
      const containerOpts={...opts,maxWeight:e.maxWeight};
      const p=packing.slicePacking(e,remaining,containerOpts);
      remaining=remaining.map(c=>({...c,qty:p.skus.find(s=>s.id===c.id).remaining}));
      return {...p,spec:e,opts:containerOpts};
    });
    return {containers,opts,requested,remaining:remaining.filter(c=>c.qty>0),totalCapacity:state.volume,
      cost:state.path.every(e=>Number.isFinite(e.rate)&&e.rate>0)?state.cost:null,
      loadedVolume:items.reduce((n,c)=>n+(c.qty-remaining.find(r=>r.id===c.id).qty)*volume(c),0)};
  });
  return {plans,attempts,objective,searchNote:'Bounded search: up to 800 packing trials, 8 retained states and 2 extra container levels beyond the first complete solution. Recommendations are feasible estimates, not guaranteed global optima.'};
}
const api={optimize};
if(typeof module!=='undefined') module.exports=api; else root.FleetPlanner=api;
})(globalThis);
