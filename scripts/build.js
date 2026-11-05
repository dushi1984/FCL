const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
fs.mkdirSync(path.join(output, 'assets'), { recursive: true });
const html = fs.readFileSync(path.join(root, 'index'), 'utf8')
  .replace('/node_modules/three/build/three.min.js', '/assets/three.min.js')
  .replace('/node_modules/three/examples/js/controls/OrbitControls.js', '/assets/OrbitControls.js');
fs.writeFileSync(path.join(output, 'index.html'), html);
for (const [source, destination] of [
  ['planner.js', 'planner.js'],
  ['node_modules/three/build/three.min.js', 'assets/three.min.js'],
  ['node_modules/three/examples/js/controls/OrbitControls.js', 'assets/OrbitControls.js'],
  ['node_modules/three/LICENSE', 'assets/THREE-LICENSE.txt']
]) fs.copyFileSync(path.join(root, source), path.join(output, destination));
console.log('Static production build created in dist/');
