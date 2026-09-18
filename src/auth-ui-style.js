const styleId='auth-ui-style';
if(!document.querySelector(`#${styleId}`)){
  const style=document.createElement('style');
  style.id=styleId;
  style.textContent='.account-dialog{width:min(650px,calc(100vw - 32px))}.account-profile{display:flex;align-items:center;gap:12px;margin-bottom:20px}.account-profile-mark{display:grid;place-items:center;width:42px;height:42px;color:#fff;border-radius:50%;background:#4285f4;font-size:19px;font-weight:800}.account-profile div{min-width:0;display:grid;gap:2px}.account-profile strong,.account-profile span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.account-profile div span{color:var(--muted);font-size:13px}.account-dialog #account-workspace-name{display:block;margin-top:4px;font-size:15px}.account-dialog #workspace-profile-section .dialog-actions{justify-content:flex-start;margin-top:12px}.account-dialog #account-safety{margin-top:20px!important;margin-bottom:0!important}.account-dialog .dialog-actions:last-child{justify-content:space-between;margin-top:20px}#account-sign-out{margin-right:auto}';
  document.head.append(style);
}
