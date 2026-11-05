const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
test('shipment UI calculation, container switching, export and invalidation',async()=>{
 const html=fs.readFileSync('index','utf8');
 const dom=new JSDOM(html,{runScripts:'outside-only',url:'http://localhost'});
 const w=dom.window;
 w.FCLPlanner=require('../planner');
 let script=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
 script=script.slice(0,script.lastIndexOf("window.addEventListener('load'"));

 // WebGL is not available in jsdom; exercise real DOM/report logic with rendering stubs.
 w.eval(script + `
buildContainer=()=>{};resetView=()=>{};renderCargo=p=>window.__lastPacking=p;renderLegend=()=>{};applyView=()=>{};
 cargoItems=[{id:1,name:'Test <carton>',l:1000,w:1000,h:1000,weight:10,qty:60}];renderCargoList();`);
 await w.calculate();
 assert.match(w.document.querySelector('#shipmentSummary').textContent,/Shipment fits in 2 containers/);
 await w.selectContainer(1);
 assert.match(w.document.querySelector('#report').textContent,/Container 2 of 2/);
 assert.ok(w.document.querySelector('#report').textContent.includes('Test <carton>'));
 w.eval('downloadFile=(name,content)=>window.exported=content');
 w.exportShipmentCSV();
 assert.match(w.exported,/Test <carton>/);
 w.updateCargo(1,'qty',20);
 assert.match(w.document.querySelector('#shipmentSummary').textContent,/Recalculate/);
 assert.equal(w.__lastPacking,null);
 dom.window.close();
});
