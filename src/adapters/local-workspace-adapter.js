import {normalizeUiPreferences, defaultUiPreferences} from '../ui-preferences.js';
import {createUnavailableCloudAdapter} from './adapter-contract.js';

const fixedTime='1970-01-01T00:00:00.000Z';
function stabilize(workspace,source){
  const boards=Array.isArray(source?.boards)?source.boards:[];
  workspace.boards.forEach((board,bi)=>{
    const raw=boards[bi]||{};board.id=raw.id||`legacy-board-${bi}`;board.createdAt=raw.createdAt||fixedTime;board.updatedAt=raw.updatedAt||board.createdAt;delete board.collaboration;
    board.lists.forEach((list,li)=>{
      const rawList=raw.lists?.[li]||{};list.id=rawList.id||`legacy-list-${bi}-${li}`;list.createdAt=rawList.createdAt||fixedTime;list.updatedAt=rawList.updatedAt||list.createdAt;
      list.cards.forEach((card,ci)=>{
        const rawCard=rawList.cards?.[ci]||{};card.id=rawCard.id||`legacy-card-${bi}-${li}-${ci}`;card.createdAt=rawCard.createdAt||fixedTime;card.updatedAt=rawCard.updatedAt||card.createdAt;
        card.labels.forEach((label,i)=>{label.id=rawCard.labels?.[i]?.id||`legacy-label-${bi}-${li}-${ci}-${i}`;});
        card.checklist.forEach((item,i)=>{item.id=rawCard.checklist?.[i]?.id||`legacy-check-${bi}-${li}-${ci}-${i}`;});
        card.activity=Array.isArray(rawCard.activity)?card.activity.map((item,i)=>({...item,id:rawCard.activity[i]?.id||`legacy-history-${bi}-${li}-${ci}-${i}`,at:rawCard.activity[i]?.at||fixedTime,source:'browser-legacy'})):[];
      });
    });
  });
  workspace.activeBoardId=workspace.boards.some(board=>board.id===source?.activeBoardId)?source.activeBoardId:workspace.boards[0]?.id||'';
  return workspace;
}

export function createLocalWorkspaceAdapter({
  storage=globalThis.localStorage,storageKey='flowboard-workspace',legacyKey='flowboard-data',appearanceKey='flowboard-appearance',
  uiPreferencesKey='flowboard-ui-preferences',migrationReceiptKey='flowboard-legacy-migration-v1',validWorkspace,normalizeWorkspace,migrateLegacy,
  clone=value=>JSON.parse(JSON.stringify(value))
}){
  if(!storage||!validWorkspace||!normalizeWorkspace||!migrateLegacy)throw new Error('LocalWorkspaceAdapter requires storage and state normalization functions.');
  const parse=value=>JSON.parse(value),loadJson=key=>{try{const value=storage.getItem(key);return value===null?null:parse(value);}catch{return null;}},saveJson=(key,value)=>{try{storage.setItem(key,JSON.stringify(value));return{ok:true};}catch(error){return{ok:false,error};}};
  return Object.freeze({
    ...createUnavailableCloudAdapter(),kind:'local',getSession(){return null;},onAuthStateChange(callback){callback?.(null);return()=>{};},
    loadAppearance(){return loadJson(appearanceKey);},saveAppearance(value){return saveJson(appearanceKey,value);},
    loadUiPreferences(){return normalizeUiPreferences(loadJson(uiPreferencesKey)||defaultUiPreferences());},
    saveUiPreferences(value){return saveJson(uiPreferencesKey,normalizeUiPreferences(value));},
    inspectLegacyWorkspace(){
      const current=storage.getItem(storageKey),legacy=storage.getItem(legacyKey),source=current!==null?'current':legacy!==null?'legacy':'';
      if(!source)return{status:'none'};
      const raw=source==='current'?current:legacy;
      try{
        const parsed=parse(raw),normalized=source==='current'&&validWorkspace(parsed)?normalizeWorkspace(clone(parsed)):source==='legacy'?migrateLegacy(clone(parsed)):null;
        if(!normalized)throw new Error('Unsupported legacy workspace');
        const workspace=stabilize(normalized,source==='current'?parsed:null),boards=workspace.boards||[],lists=boards.reduce((n,b)=>n+b.lists.length,0),cards=boards.reduce((n,b)=>n+b.lists.reduce((m,l)=>m+l.cards.length,0),0);
        return{status:'ready',source,workspace:clone(workspace),counts:{boards:boards.length,lists,cards},archives:{boards:boards.filter(b=>b.archived).length,cards:boards.reduce((n,b)=>n+b.lists.reduce((m,l)=>m+l.cards.filter(c=>c.archived).length,0),0)},backup:{filename:`flowboard-legacy-${source}.json`,content:raw}};
      }catch{return{status:'invalid',source};}
    },
    loadLegacyMigrationReceipt(){return loadJson(migrationReceiptKey);},
    saveLegacyMigrationReceipt(receipt){return saveJson(migrationReceiptKey,receipt);}
  });
}
