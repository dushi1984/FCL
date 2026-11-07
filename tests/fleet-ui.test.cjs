const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
test('mixed fleet summary, selected report context and CSV use each container type',async()=>{
 const html=fs.readFileSync('index.html','utf8');
 const nodes=new Map();
 const node=id=>{if(!nodes.has(id))nodes.set(id,{innerHTML:'',style:{},value:'',checked:false});return nodes.get(id);};
 const context=vm.createContext({Packing:require('../js/packing'),FleetPlanner:require('../js/fleet'),document:{getElementById:node,querySelectorAll:()=>[],addEventListener:()=>{}},window:{addEventListener:()=>{}},console});
 vm.runInContext(html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')),context);
 vm.runInContext(`
 buildContainer=()=>{};resetView=()=>{};renderCargo=p=>window.__lastPacking=p;renderLegend=()=>{};applyView=()=>{};
 downloadFile=(name,content)=>window.csv=content;
 cargoItems=[{id:1,name:'Tall',l:1000,w:1000,h:2500,weight:20,qty:24},{id:2,name:'Small',l:1000,w:1000,h:1000,weight:10,qty:8}];
 `,context);
 node('planningMode').value='auto';node('fleetObjective').value='containers';node('containerType').value='40';node('maxWeight').value='27000';node('allowRotation').checked=true;
 for(const id of ['20','40','40hc']){node('enable-'+id).checked=true;node('payload-'+id).value='27000';}
 await vm.runInContext('calculate()',context);
 assert.match(node('shipmentSummary').innerHTML,/1 × 20ft Standard/);
 assert.match(node('shipmentSummary').innerHTML,/usage-meter/);
 assert.match(node('shipmentSummary').innerHTML,/aria-pressed="true"/);
 assert.match(node('shipmentSummary').innerHTML,/Loaded cargo volume/);
 vm.runInContext('updateCargoTotals()',context);
 assert.match(node('cargoTotals').innerHTML,/32/);
 assert.match(node('shipmentSummary').innerHTML,/1 × 40ft High Cube/);
 await vm.runInContext('selectShipmentContainer(1)',context);
 assert.equal(vm.runInContext('getReportContext().spec.name',context),'20ft Standard');
 assert.match(node('report').innerHTML,/20ft Standard/);
 vm.runInContext('exportShipmentCSV()',context);
 assert.match(context.window.csv,/40ft High Cube/);assert.match(context.window.csv,/20ft Standard/);
 vm.runInContext('invalidateShipment()',context);
 assert.equal(vm.runInContext('fleetResults',context),null);
});
