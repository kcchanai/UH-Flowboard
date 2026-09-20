let dialog=null,titleNode,messageNode,labelNode,input,output,submit,cancel,pending=null;

function closeDialog(){
  const trigger=pending?.trigger;
  pending=null;
  dialog?.close();
  trigger?.focus?.();
}

function ensureDialog(){
  if(dialog)return;
  dialog=document.createElement('dialog');
  dialog.className='dialog';
  dialog.setAttribute('aria-labelledby','confirmation-dialog-title');
  dialog.innerHTML='<form class="dialog-card confirmation-dialog-card"><div><h2 id="confirmation-dialog-title"></h2><p></p><label class="field"><span></span><input maxlength="80" /></label><output role="status" aria-live="polite"></output></div><div class="dialog-actions"><button class="button button-quiet" type="button" data-cancel>Cancel</button><button class="button button-primary" type="submit"></button></div></form>';
  document.body.append(dialog);
  titleNode=dialog.querySelector('h2');
  messageNode=dialog.querySelector('p');
  labelNode=dialog.querySelector('label');
  input=dialog.querySelector('input');
  output=dialog.querySelector('output');
  submit=dialog.querySelector('[type="submit"]');
  cancel=dialog.querySelector('[data-cancel]');
  cancel.addEventListener('click',closeDialog);
  dialog.addEventListener('cancel',event=>{event.preventDefault();closeDialog();});
  dialog.querySelector('form').addEventListener('submit',async event=>{
    event.preventDefault();
    if(!pending)return;
    const current=pending;
    submit.disabled=true;
    cancel.disabled=true;
    output.textContent=current.waiting||'';
    try{await current.action(current.rename?input.value:undefined);closeDialog();}
    catch(error){output.textContent=error?.code==='permission-denied'?'Action denied.':error?.message||'Action failed.';submit.disabled=false;cancel.disabled=false;}
  });
}

export function requestConfirmation(options){
  ensureDialog();
  pending=options;
  titleNode.textContent=options.title||'Confirm action';
  messageNode.textContent=options.message||'';
  labelNode.hidden=!options.rename;
  labelNode.querySelector('span').textContent=options.inputLabel||'Confirmation';
  input.hidden=!options.rename;
  input.required=Boolean(options.rename);
  input.disabled=!options.rename;
  input.value=options.value||'';
  submit.textContent=options.confirm||'Confirm';
  submit.className=`button ${options.danger?'button-danger':'button-primary'}`;
  output.textContent='';
  dialog.showModal();
  requestAnimationFrame(()=>options.rename?(input.focus(),input.select()):submit.focus());
}
