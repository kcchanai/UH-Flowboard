import {requestLifecycleConfirmation as ask} from './workspace-lifecycle-ui.js';
const el=t=>document.createElement(t),button=(text,css='button button-quiet')=>Object.assign(el('button'),{type:'button',className:css,textContent:text});
export function createBoardLifecycleActions({space:s,board:b,cloudAdapter:a,status,refresh}){
  if(s.role!=='owner')return[];
  const act=(remove,trigger)=>{
    if(remove){
      status.textContent='Check';
      a.preflightDeletion({workspaceId:s.id,boardId:b.id,targetType:'board',targetId:b.id}).then(p=>ask({trigger,title:'Delete board permanently?',message:`“${b.title}” contains ${p.counts.lists} lists, ${p.counts.cards} cards and ${p.counts.comments} comments. This cannot be undone.`,rename:true,inputLabel:`Type ${b.title} to confirm`,confirm:'Delete permanently',danger:true,waiting:'Deleting...',action:async value=>{if(value!==b.title)throw Error('Name mismatch.');await a.deleteEntity(p);await refresh(s);}})).catch(error=>status.textContent=error?.message||'Delete check failed');
      return;
    }
    const archived=!b.archived;
    ask({trigger,title:archived?'Archive board?':'Restore board?',message:archived?'Board content will be retained.':'Return board to Active boards.',confirm:archived?'Archive board':'Restore board',waiting:archived?'Archiving...':'Restoring...',action:async()=>{await a.setBoardArchived({workspaceId:s.id,boardId:b.id,expectedRevision:b.revision,archived});await refresh(s);}});
  };
  if(b.archived){
    const restore=button('Restore','button button-primary'),remove=button('Delete permanently','button button-danger');
    restore.onclick=()=>act(false,restore);remove.onclick=()=>act(true,remove);
    return[restore,remove];
  }
  const box=el('details'),more=el('summary'),toggle=button('Archive');
  box.className='workspace-lifecycle-actions';more.textContent='More';more.setAttribute('aria-label',`More actions for ${b.title}`);
  toggle.onclick=()=>act(false,toggle);
  const remove=button('Delete permanently','button button-danger');remove.onclick=()=>act(true,remove);
  box.append(more,toggle,remove);
  return[box];
}