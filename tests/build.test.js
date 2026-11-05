const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
test('production build includes HTML and every browser script without node_modules URLs',()=>{
 const root=path.resolve(__dirname,'..');
 execFileSync(process.execPath,['scripts/build.js'],{cwd:root});
 const html=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
 assert.ok(!html.includes('/node_modules/'));
 for(const [,url] of html.matchAll(/<script src="([^"]+)"/g)) {
  assert.ok(url.startsWith('/'));
  assert.ok(fs.statSync(path.join(root,'dist',url)).size>0,url);
 }
 assert.ok(html.includes('Calculate full shipment'));
 const config=JSON.parse(fs.readFileSync(path.join(root,'vercel.json')));
 assert.equal(config.outputDirectory,'dist');
});
