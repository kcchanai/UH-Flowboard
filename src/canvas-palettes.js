const palettes = [
  {id:'classic-flow',name:'Classic Flow',note:'Familiar blue and indigo',light:['#135fa8','#3e4ca8','#28569f','#fff'],dark:['#172b50','#34275f','#24385d','#fff']},
  {id:'ocean-slate',name:'Ocean Slate',note:'Calm office default',light:['#2b5d88','#3b4e7a','#33567f','#fff'],dark:['#182c41','#28354e','#213b55','#fff']},
  {id:'lagoon',name:'Lagoon',note:'Blue and deep teal',light:['#155e75','#246b67','#205f69','#fff'],dark:['#102f3c','#183d37','#143843','#fff']},
  {id:'sage-studio',name:'Sage Studio',note:'Soft sage and cool mint',light:['#dce9df','#c8deda','#d5e4dc','#203d36'],dark:['#1c302b','#293b35','#233a33','#fff']},
  {id:'warm-sand',name:'Warm Sand',note:'Warm ivory and pale clay',light:['#f1e7d7','#e7d5c7','#ebddcf','#45372f'],dark:['#302923','#3d302b','#352d29','#fff']},
  {id:'lavender-mist',name:'Lavender Mist',note:'Pale lilac and periwinkle',light:['#e8e3f3','#d6dff0','#dfe1f1','#34334f'],dark:['#28263c','#303551','#2b3048','#fff']},
  {id:'dusk-plum',name:'Dusk Plum',note:'Muted plum and dusky blue',light:['#59416f','#3b527d','#4c4977','#fff'],dark:['#302339','#24334b','#2a2d45','#fff']},
  {id:'graphite',name:'Graphite',note:'Neutral slate, minimal distraction',light:['#465567','#303c4c','#3a485a','#fff'],dark:['#191f28','#252c38','#202733','#fff']}
];
const listBackgrounds = Object.freeze([
  {id:'standard',name:'Standard',light:['#edf1f6','#edf1f6'],dark:['#1d293b','#1d293b']},
  {id:'frost-blue',name:'Frost Blue',light:['#d5e2ef','#dcdfef'],dark:['#132033','#1e1e39']},
  {id:'soft-sage',name:'Soft Sage',light:['#f6faf7','#f1f7f6'],dark:['#152224','#1a2628']},
  {id:'warm-sand',name:'Warm Sand',light:['#fcf9f5','#f9f5f1'],dark:['#1d1f21','#222224']},
  {id:'lavender',name:'Lavender',light:['#f9f8fc','#f5f7fb'],dark:['#1a1e2b','#1d2434']},
  {id:'mist-slate',name:'Mist Slate',light:['#d9e2ea','#dcdfe7'],dark:['#13202d','#1a2432']}
].map(Object.freeze));
export const CANVAS_PALETTES = Object.freeze(palettes.map(({id,name,note}) => Object.freeze({id,name,note})));
export const LIST_BACKGROUNDS = listBackgrounds;
const byId = new Map(palettes.map(palette => [palette.id,palette])), listById = new Map(listBackgrounds.map(palette => [palette.id,palette]));
const isLightInk = ink => ink === '#fff';
export const getCanvasPalette = id => byId.get(id)||byId.get('classic-flow');
export const getListBackground = id => listById.get(id)||listById.get('standard');
export function applyCanvasPalette(id = 'classic-flow', finish = 'gradient', mode = document.documentElement.dataset.theme || 'light') {
  const palette=getCanvasPalette(id),kind=mode==='dark'?'dark':'light',values=palette[kind],solid=finish==='solid',ink=values[3],lightInk=isLightInk(ink),root=document.documentElement;
  root.style.setProperty('--canvas-start',values[0]);root.style.setProperty('--canvas-end',values[1]);root.style.setProperty('--canvas-solid',values[2]);root.style.setProperty('--canvas-ink',ink);
  root.style.setProperty('--canvas-ink-soft',lightInk?'rgba(255,255,255,.86)':'rgba(23,43,77,.82)');root.style.setProperty('--canvas-control',lightInk?'rgba(255,255,255,.12)':'rgba(255,255,255,.48)');root.style.setProperty('--canvas-control-hover',lightInk?'rgba(255,255,255,.22)':'rgba(255,255,255,.72)');root.style.setProperty('--canvas-border',lightInk?'rgba(255,255,255,.32)':'rgba(23,43,77,.28)');root.style.setProperty('--canvas-focus',lightInk?'#fff':'#0c66e4');root.style.setProperty('--canvas-scrollbar',lightInk?'rgba(255,255,255,.72)':'rgba(23,43,77,.48)');
  root.style.setProperty('--canvas-background',solid?values[2]:`radial-gradient(circle at 12% 0%,${kind==='dark'?'rgba(255,255,255,.06)':'rgba(255,255,255,.12)'},transparent 34rem),linear-gradient(135deg,${values[0]},${values[1]})`);root.dataset.canvas=palette.id;root.dataset.canvasFinish=solid?'solid':'gradient';applyListBackground(undefined,undefined,kind);return{id:palette.id,finish:root.dataset.canvasFinish,mode:kind};
}
export function applyListBackground(id,finish,mode=document.documentElement.dataset.theme||'light') {
  const root=document.documentElement,appearance=globalThis.FlowboardRuntime?.localAdapter?.loadAppearance?.(),stored=appearance?.version===1?appearance:{},palette=getListBackground(id||root.dataset.listColor||stored.listColor),kind=mode==='dark'?'dark':'light',values=palette[kind],choice=finish||root.dataset.listFinish||stored.listFinish,gradient=choice==='gradient'&&palette.id!=='standard';
  root.style.setProperty('--list-background',gradient?`linear-gradient(135deg,${values[0]},${values[1]})`:palette.id==='standard'?values[0]:`color-mix(in srgb,${values[0]} 50%,${values[1]})`);root.dataset.listColor=palette.id;root.dataset.listFinish=choice==='gradient'?'gradient':'solid';
}
