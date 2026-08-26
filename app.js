'use strict';
document.getElementById('deepButton').addEventListener('click',()=>Spooks.deepScan(),{once:true});
Spooks.passiveScan().catch(e=>{Spooks.log(`passive scan error: ${e.name||e}`,'warn');document.getElementById('scanStatus').textContent='Passive scan partially completed';Spooks.render(Spooks.factRoot,Spooks.facts);});
