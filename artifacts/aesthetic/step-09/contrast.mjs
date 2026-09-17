import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const out='artifacts/aesthetic/step-09'; await mkdir(out,{recursive:true});
const parse=value=>{const m=String(value).match(/rgba?\(([^)]+)\)/);if(!m)return null;const p=m[1].split(',').map(x=>Number.parseFloat(x.trim()));return {r:p[0],g:p[1],b:p[2],a:p[3]??1};};
const hex=value=>{let s=value.replace('#','');if(s.length===3)s=[...s].map(x=>x+x).join('');return {r:parseInt(s.slice(0,2),16),g:parseInt(s.slice(2,4),16),b:parseInt(s.slice(4,6),16),a:1};};
const color=value=>String(value).startsWith('#')?hex(value):parse(value);
const mix=(a,b,t)=>({r:a.r+(b.r-a.r)*t,g:a.g+(b.g-a.g)*t,b:a.b+(b.b-a.b)*t,a:1});
const over=(fg,bg)=>({r:fg.r*fg.a+bg.r*(1-fg.a),g:fg.g*fg.a+bg.g*(1-fg.a),b:fg.b*fg.a+bg.b*(1-fg.a),a:1});
const lum=c=>{const f=v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4};return .2126*f(c.r)+.7152*f(c.g)+.0722*f(c.b)};
const contrast=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'});
const results=[];
try {const page=await browser.newPage({viewport:{width:1440,height:900}});await page.goto('http://127.0.0.1:4211/UH-Flowboard/',{waitUntil:'networkidle'});await page.waitForFunction(()=>globalThis.FlowboardApp&&globalThis.FlowboardRuntime);
 const ids=await page.evaluate(()=>globalThis.FlowboardRuntime.canvasPalettes.map(p=>p.id));
 for(const mode of ['light','dark']) for(const finish of ['gradient','solid']) for(const id of ids){
  const data=await page.evaluate(({id,finish,mode})=>{document.documentElement.dataset.theme=mode;const applied=globalThis.FlowboardRuntime.applyCanvasPalette(id,finish,mode),root=getComputedStyle(document.documentElement),title=getComputedStyle(document.querySelector('.board-title')),card=getComputedStyle(document.querySelector('.card-title')),surface=getComputedStyle(document.querySelector('.card'));return {id,mode,finish,applied,ink:root.getPropertyValue('--canvas-ink').trim(),start:root.getPropertyValue('--canvas-start').trim(),end:root.getPropertyValue('--canvas-end').trim(),solid:root.getPropertyValue('--canvas-solid').trim(),control:root.getPropertyValue('--canvas-control').trim(),focus:root.getPropertyValue('--canvas-focus').trim(),titleColor:title.color,cardColor:card.color,cardBackground:surface.backgroundColor};},{id,finish,mode});
  const ink=color(data.ink),start=color(data.start),end=color(data.end),solid=color(data.solid),control=color(data.control),focus=color(data.focus),title=color(data.titleColor),card=color(data.cardColor),cardBg=color(data.cardBackground); let canvasText=Infinity,controlText=Infinity,focusMin=Infinity;for(let i=0;i<=20;i++){const bg=finish==='solid'?solid:mix(start,end,i/20);canvasText=Math.min(canvasText,contrast(ink,bg));controlText=Math.min(controlText,contrast(ink,over(control,bg)));focusMin=Math.min(focusMin,contrast(focus,bg));} results.push({...data,minCanvasText:canvasText,minControlText:controlText,minFocus:focusMin,cardText:contrast(card,cardBg)});
 }
 await writeFile(`${out}/contrast.json`,JSON.stringify({thresholds:{normalText:4.5,focusOrUi:3},results},null,2));
 const min={canvasText:Math.min(...results.map(x=>x.minCanvasText)),controlText:Math.min(...results.map(x=>x.minControlText)),focus:Math.min(...results.map(x=>x.minFocus)),cardText:Math.min(...results.map(x=>x.cardText))};console.log(JSON.stringify({states:results.length,min}));
 if(min.canvasText<4.5||min.controlText<4.5||min.focus<3||min.cardText<4.5)process.exitCode=2;
} finally {await browser.close();}
