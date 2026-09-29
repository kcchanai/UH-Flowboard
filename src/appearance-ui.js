import './appearance-ui.css';
import {applyCanvasPalette, getCanvasPalette, applyListBackground, getListBackground, LIST_BACKGROUNDS} from './canvas-palettes.js';

const DEFAULT = Object.freeze({version:1,mode:'system',canvas:'classic-flow',finish:'gradient',showPhotos:true,listColor:'standard',listFinish:'solid'});
const modes = new Set(['system','light','dark']), finishes = new Set(['gradient','solid']);
const root = document.documentElement;
let q,f,saved,d,initialized=false,rf=null;
const adapter = () => globalThis.FlowboardRuntime.localAdapter;
const valid = value => value?.version===1 && modes.has(value.mode) && globalThis.FlowboardRuntime.canvasPalettes.some(item=>item.id===value.canvas) && finishes.has(value.finish) && typeof value.showPhotos==='boolean';
function normalize(value) {
  const supported=value?.version===1,base=valid(value)?value:{...DEFAULT,mode:modes.has(root.dataset.appearanceMode)?root.dataset.appearanceMode:DEFAULT.mode};
  return {...base,listColor:supported&&getListBackground(value.listColor).id===value.listColor?value.listColor:'standard',listFinish:supported&&finishes.has(value.listFinish)?value.listFinish:'solid'};
}
function announce(text) { const node=document.querySelector('#announcer'); if(node) { node.textContent=''; requestAnimationFrame(()=>node.textContent=text); } }
function choiceGroup(title,name,options) { return `<fieldset class="appearance-group"><legend>${title}</legend><div class="appearance-options">${options.map(([value,label])=>`<label class="appearance-option"><input type="radio" name="${name}" value="${value}"><span>${label}</span></label>`).join('')}</div></fieldset>`; }
const markup=`<dialog id="appearance-dialog" class="dialog appearance-dialog" aria-labelledby="appearance-heading" aria-describedby="appearance-scope"><form id="appearance-form" class="appearance-card"><header class="card-dialog-header"><div><p class="eyebrow">Appearance</p><h2 id="appearance-heading">Personalize Flowboard</h2></div><button id="close-appearance-dialog" class="dialog-close" type="button" aria-label="Close appearance"><svg><use href="#icon-close"></use></svg></button></header><div class="appearance-body"><p id="appearance-scope" class="collaboration-notice">Applies only to this browser. Profile photos are managed in Account.</p>${choiceGroup('Theme','appearance-mode',[['system','System'],['light','Light'],['dark','Dark']])}<fieldset class="appearance-group"><legend>Canvas color</legend><div id="appearance-palettes" class="appearance-palettes"></div></fieldset>${choiceGroup('Canvas finish','appearance-finish',[['gradient','Gradient'],['solid','Solid color']])}<fieldset class="appearance-group appearance-list-group"><legend>List background color</legend><p class="appearance-group-note">One color for all lists. Standard keeps its current surface; finish is ignored. Others adapt to Light and Dark.</p><div id="appearance-list-palettes" class="appearance-palettes"></div></fieldset>${choiceGroup('List background finish','appearance-list-finish',[['gradient','Gradient'],['solid','Solid color']])}${choiceGroup('Assignee images','appearance-photos',[['photos','Show profile photos when available'],['initials','Use initials']])}<p id="appearance-status" class="account-status" role="status" aria-live="polite"></p></div><div class="dialog-actions appearance-actions"><button id="reset-appearance" class="button button-quiet" type="button">Reset to defaults</button><span class="appearance-action-spacer"></span><button id="cancel-appearance" class="button button-quiet" type="button">Cancel</button><button class="button button-primary" type="submit">Save appearance</button></div></form></dialog>`;
function apply(value) {
  const dark=value.mode==='dark'||value.mode==='system'&&matchMedia('(prefers-color-scheme: dark)').matches,theme=dark?'dark':'light';
  root.dataset.appearanceMode=value.mode;root.dataset.appearancePhotos=value.showPhotos?'photos':'initials';root.dataset.theme=theme;
  applyCanvasPalette(value.canvas,value.finish,theme);applyListBackground(value.listColor,value.listFinish,theme);
  const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=dark?'#182d54':'#0f6cbd';
  window.dispatchEvent(new CustomEvent('flowboard:appearance-change',{detail:{...value}}));
}
function checked(name,value) { const input=f.querySelector(`input[name="${name}"][value="${value}"]`);if(input)input.checked=true; }
function renderOptions(hostId,items,name,details,mode='light') {
  const host=document.querySelector(hostId);host.replaceChildren();
  for(const item of items) {
    const tones=details(item.id)[mode],label=document.createElement('label'),input=document.createElement('input'),swatch=document.createElement('span'),text=document.createElement('span'),note=document.createElement('small');
    label.className='appearance-option';input.type='radio';input.name=name;input.value=item.id;swatch.className='palette-swatch';swatch.setAttribute('aria-hidden','true');
    swatch.style.setProperty('--swatch-start',tones[0]);swatch.style.setProperty('--swatch-end',tones[1]);text.textContent=item.name;label.append(input,swatch,text);if(item.note){note.textContent=item.note;label.append(note);}host.append(label);
  }
}
function renderPalettes() { renderOptions('#appearance-palettes',globalThis.FlowboardRuntime.canvasPalettes,'appearance-canvas',getCanvasPalette); }
function renderListPalettes() { renderOptions('#appearance-list-palettes',LIST_BACKGROUNDS,'appearance-list-color',getListBackground,root.dataset.theme==='dark'?'dark':'light'); }
function updateListSwatches() {
  const mode=root.dataset.theme==='dark'?'dark':'light';
  f.querySelectorAll('input[name="appearance-list-color"]').forEach(input=>{ const tones=getListBackground(input.value)[mode],swatch=input.parentElement.querySelector('.palette-swatch');swatch.style.setProperty('--swatch-start',tones[0]);swatch.style.setProperty('--swatch-end',tones[1]); });
}
function render() {
  checked('appearance-mode',d.mode);checked('appearance-canvas',d.canvas);checked('appearance-finish',d.finish);checked('appearance-photos',d.showPhotos?'photos':'initials');
  checked('appearance-list-color',d.listColor);checked('appearance-list-finish',d.listFinish);updateListSwatches();
}
function readDraft() {
  return {version:1,mode:f.querySelector('[name="appearance-mode"]:checked')?.value||DEFAULT.mode,canvas:f.querySelector('[name="appearance-canvas"]:checked')?.value||DEFAULT.canvas,finish:f.querySelector('[name="appearance-finish"]:checked')?.value||DEFAULT.finish,showPhotos:f.querySelector('[name="appearance-photos"]:checked')?.value!=='initials',listColor:f.querySelector('[name="appearance-list-color"]:checked')?.value||'standard',listFinish:f.querySelector('[name="appearance-list-finish"]:checked')?.value||'solid'};
}
function preview() { d=readDraft();apply(d);render();document.querySelector('#appearance-status').textContent='Preview only. Save to keep these choices in this browser.'; }
function restore() { d={...saved};apply(saved);render(); }
function closeWithoutSave() { restore();q.close(); }
function initialize() {
  if(initialized)return;initialized=true;
  if(!document.querySelector('#appearance-dialog'))document.body.insertAdjacentHTML('beforeend',markup);
  q=document.querySelector('#appearance-dialog');f=document.querySelector('#appearance-form');
  renderPalettes();renderListPalettes();saved=normalize(adapter().loadAppearance?.());d={...saved};apply(saved);render();
  f.addEventListener('change',preview);
  f.addEventListener('submit',event=>{
    event.preventDefault();const next=readDraft(),result=adapter().saveAppearance?.(next);
    if(!result?.ok){const status=document.querySelector('#appearance-status');status.textContent='Appearance could not be saved. Preview remains; retry or Cancel.';status.scrollIntoView({block:'nearest'});return;}
    saved=next;d={...next};apply(saved);document.querySelector('#appearance-status').textContent='Saved in this browser.';announce('Saved in this browser.');q.close();
  });
  document.querySelector('#close-appearance-dialog').addEventListener('click',closeWithoutSave);
  document.querySelector('#cancel-appearance').addEventListener('click',closeWithoutSave);
  document.querySelector('#reset-appearance').addEventListener('click',()=>{d={...DEFAULT};render();preview();const status=document.querySelector('#appearance-status');status.textContent='Defaults previewed. Save to keep them in this browser.';status.scrollIntoView({block:'nearest'});});
  q.addEventListener('cancel',event=>{event.preventDefault();closeWithoutSave();});
  q.addEventListener('close',()=>{(rf?.offsetParent?rf:document.querySelector('#account-button')||document.querySelector('#theme-toggle'))?.focus();rf=null;});
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',()=>{if(root.dataset.appearanceMode==='system')updateListSwatches();});
}
export function openAppearance(opener=document.activeElement) { initialize();rf=opener;d={...saved};apply(saved);render();document.querySelector('#appearance-status').textContent='';q.showModal();f.querySelector('input:checked')?.focus(); }
