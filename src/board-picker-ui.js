// Focus native Open buttons without changing the Boards dialog's tab order.
export function enableBoardPickerKeys(dialog,search,activeList){
  dialog.addEventListener('keydown',event=>{
    if(event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||event.isComposing)return;
    const {key,target}=event;
    if(target!==search&&(!activeList.contains(target)||!target.matches('button[data-row]')))return;
    if(key==='Escape'){event.preventDefault();dialog.close();return;}
    if(!['ArrowDown','ArrowUp','Enter'].includes(key)||key==='Enter'&&target!==search)return;
    const choices=[...activeList.querySelectorAll('button[data-row]:enabled')],index=choices.indexOf(target);
    event.preventDefault();
    if(key==='Enter'){if(choices.length===1)choices[0].click();else choices[0]?.focus();return;}
    if(key==='ArrowDown')choices[index+1]?.focus();
    else if(index===0)search.focus();
    else (index<0?choices.at(-1):choices[index-1])?.focus();
  });
}

export async function readPickedBoard(adapter,space,board,current){
  const workspace=await adapter.fetchWorkspace(space.id,{serverOnly:true});
  if(!current())return null;
  const role=await adapter.verifyWorkspaceAccess(space.id);
  if(!current()||workspace.status==='archived'||!['owner','editor','viewer'].includes(role)||!workspace.boards?.some(item=>item?.id===board.id&&item.title===board.title&&!item.archived))return null;
  const {status,migration}=workspace;
  return {workspace:{...workspace,activeBoardId:board.id},space:{...space,role,status,migration}};
}

export const sourceLabel=(directory,space,board,personal)=>{const peers=directory.flatMap(item=>(item.boards||[]).filter(candidate=>candidate.title.toLowerCase()===board.title.toLowerCase()).map(candidate=>item.id+'|'+candidate.id)),match=peers.indexOf(space.id+'|'+board.id),role=space.role,shared=personal?'':role==='viewer'?'Shared · read-only':role==='editor'?'Shared · editor':role==='owner'?'Shared':'Shared',source=peers.length>1?`Source ${match+1} of ${peers.length}`:'';return[shared,source].filter(Boolean).join(' · ')};
