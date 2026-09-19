import {readFile} from 'node:fs/promises';
const path=process.argv[2]||'lighthouse-report.json',report=JSON.parse(await readFile(path,'utf8')),score=report.categories.accessibility.score,failed=report.categories.accessibility.auditRefs.filter(({id})=>report.audits[id]?.score===0);
if(score!==1)throw new Error(`Lighthouse accessibility budget failed: ${score}.`);
if(failed.length)throw new Error(`Lighthouse has failed accessibility audits: ${failed.map(item=>item.id).join(', ')}`);
console.log('Lighthouse accessibility passed: score 1 with zero failed audits.');
