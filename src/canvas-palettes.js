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
export const CANVAS_PALETTES = Object.freeze(palettes.map(palette => Object.freeze({id:palette.id,name:palette.name,note:palette.note})));
const byId = new Map(palettes.map(palette => [palette.id, palette]));
const isLightInk = ink => ink === '#fff';
export function getCanvasPalette(id = 'classic-flow') { return byId.get(id) || byId.get('classic-flow'); }
export function applyCanvasPalette(id = 'classic-flow', finish = 'gradient', mode = document.documentElement.dataset.theme || 'light') {
  const palette = getCanvasPalette(id), kind = mode === 'dark' ? 'dark' : 'light', values = palette[kind], solid = finish === 'solid', ink = values[3], lightInk = isLightInk(ink), root = document.documentElement;
  root.style.setProperty('--canvas-start', values[0]); root.style.setProperty('--canvas-end', values[1]); root.style.setProperty('--canvas-solid', values[2]); root.style.setProperty('--canvas-ink', ink);
  root.style.setProperty('--canvas-ink-soft', lightInk ? 'rgba(255,255,255,.86)' : 'rgba(23,43,77,.82)'); root.style.setProperty('--canvas-control', lightInk ? 'rgba(255,255,255,.16)' : 'rgba(255,255,255,.48)'); root.style.setProperty('--canvas-control-hover', lightInk ? 'rgba(255,255,255,.28)' : 'rgba(255,255,255,.72)'); root.style.setProperty('--canvas-border', lightInk ? 'rgba(255,255,255,.32)' : 'rgba(23,43,77,.28)'); root.style.setProperty('--canvas-focus', lightInk ? '#fff' : '#0c66e4'); root.style.setProperty('--canvas-scrollbar', lightInk ? 'rgba(255,255,255,.72)' : 'rgba(23,43,77,.48)');
  root.style.setProperty('--canvas-background', solid ? values[2] : `radial-gradient(circle at 12% 0%,${kind === 'dark' ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.12)'},transparent 34rem),linear-gradient(135deg,${values[0]},${values[1]})`); root.dataset.canvas=palette.id; root.dataset.canvasFinish=solid ? 'solid' : 'gradient'; return {id:palette.id,finish:root.dataset.canvasFinish,mode:kind};
}
