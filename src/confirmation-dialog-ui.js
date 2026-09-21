let dialog=null,titleNode,messageNode,labelNode,input,output,submit,cancel,pending=null,sequence=0;

const visible=node=>node?.isConnected&&!node.disabled&&node.getClientRects().length&&!node.closest('[hidden]');
function restoreFocus(trigger){if(visible(trigger)){trigger?.focus?.();return;}[document.querySelector('#workspace-search'),document.querySelector('#close-workspace-dialog'),document.querySelector('#boards-button')].find(visible)?.focus?.();}
function current(request){return pending===request&&request?.token===sequence;}
function resetControls(){submit.disabled=false;submit.removeAttribute('aria-busy');cancel.disabled=false;input.disabled=true;input.hidden=true;input.required=false;labelNode.hidden=true;input.value='';output.textContent='';}
function closeDialog(request,{focus=true}={}){
  if(!current(request)||request.busy)return false;
  pending=null;resetControls();if(dialog?.open)dialog.close();if(focus)restoreFocus(request.trigger);return true;
}
function ensureDialog(){
  if(dialog)return;
  dialog=document.createElement('dialog');dialog.className='dialog';dialog.setAttribute('aria-labelledby','confirmation-dialog-title');dialog.setAttribute('aria-describedby','confirmation-dialog-message');
  dialog.innerHTML='<form class="dialog-card confirmation-dialog-card"><div><h2 id="confirmation-dialog-title"></h2><p id="confirmation-dialog-message"></p><label class="field" for="confirmation-dialog-input"><span></span><input id="confirmation-dialog-input" maxlength="80" /></label><output id="confirmation-dialog-status" role="status" aria-live="polite"></output></div><div class="dialog-actions"><button class="button button-quiet" type="button" data-cancel>Cancel</button><button class="button button-primary" type="submit"></button></div></form>';
  document.body.append(dialog);titleNode=dialog.querySelector('h2');messageNode=dialog.querySelector('p');labelNode=dialog.querySelector('label');input=dialog.querySelector('input');output=dialog.querySelector('output');submit=dialog.querySelector('[type="submit"]');cancel=dialog.querySelector('[data-cancel]');
  cancel.addEventListener('click',()=>closeDialog(pending));
  dialog.addEventListener('cancel',event=>{event.preventDefault();if(!pending?.busy)closeDialog(pending);});
  dialog.querySelector('form').addEventListener('submit',async event=>{
    event.preventDefault();const request=pending;if(!request||request.busy||!current(request))return;
    request.busy=true;submit.disabled=true;cancel.disabled=true;input.disabled=true;submit.setAttribute('aria-busy','true');output.textContent=request.waiting||'Working...';
    try{await request.action(request.rename?input.value:undefined);if(!current(request))return;request.busy=false;closeDialog(request);}
    catch(error){if(!current(request))return;request.busy=false;output.textContent=error?.code==='permission-denied'?'Action denied.':error?.message||'Action failed.';submit.disabled=false;cancel.disabled=false;input.disabled=!request.rename;submit.removeAttribute('aria-busy');if(request.rename)input.focus();}
  });
}

export function requestConfirmation(options){
  ensureDialog();
  if(pending?.busy)return false;
  if(pending){pending=null;resetControls();if(dialog.open)dialog.close();}
  const request={...options,token:++sequence,busy:false};pending=request;
  titleNode.textContent=request.title||'Confirm action';messageNode.textContent=request.message||'';labelNode.hidden=!request.rename;labelNode.querySelector('span').textContent=request.inputLabel||'Confirmation';input.hidden=!request.rename;input.required=Boolean(request.rename);input.disabled=!request.rename;input.value=request.value||'';submit.textContent=request.confirm||'Confirm';submit.className=`button ${request.danger?'button-danger':'button-primary'}`;output.textContent='';dialog.showModal();
  requestAnimationFrame(()=>{if(!current(request)||!dialog.open)return;request.rename?(input.focus(),input.select()):submit.focus();});
  return request;
}
