import {renderPersonBadge} from './person-badges.js';
export {personInitials, safePhotoURL, renderPersonBadge} from './person-badges.js';

function messageFor(error) {
  const code = error?.code || '';
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return 'Google sign-in was cancelled.';
  if (code === 'auth/popup-blocked') return 'Allow popups, then try again.';
  if (code === 'auth/unauthorized-domain') return 'This site is not authorized for sign-in.';
  if (code === 'auth/operation-not-allowed') return 'Google sign-in is not enabled.';
  if (code === 'auth/network-request-failed') return 'Check your connection and retry.';
  return 'Google sign-in could not be completed. Existing legacy browser data was not changed.';
}

const currentMode = () => globalThis.FlowboardApp?.getMode?.() || {kind:'auth-loading'};
const remoteMode = mode => ['cloud','cloud-preview'].includes(mode.kind);

export function accountSetupActions(retry,recovery,label='Retry setup'){
  const group=document.createElement('span');group.className='dialog-actions';group.dataset.setupActions='';
  for(const [text,action] of [[label,retry],['Data recovery',recovery]]){
    const button=document.createElement('button');Object.assign(button,{type:'button',className:'button button-quiet',textContent:text});
    button.addEventListener('click',action);group.append(button);
  }
  return group;
}

export function initializeAuthUI(adapter, {onSessionChange = () => {}} = {}) {
  const styleReady = import('./auth-ui-style.js');
  const button = document.querySelector('#account-button');
  const dialog = document.querySelector('#account-dialog');
  const close = document.querySelector('#close-account-dialog');
  const signIn = document.querySelector('#google-sign-in');
  const signOut = document.querySelector('#account-sign-out');
  const workspaces = document.querySelector('#open-cloud-workspaces');
  const recovery = document.querySelector('#open-cloud-recovery');
  const appearance = document.querySelector('#account-open-appearance');
  const name = document.querySelector('#account-name');
  const email = document.querySelector('#account-email');
  const heading = document.querySelector('#account-heading');
  const eyebrow = dialog?.querySelector('.eyebrow');
  const profileMark = document.querySelector('#account-profile-mark');
  const status = document.querySelector('#account-status');
  const cloudStatus = document.querySelector('#cloud-status');
  const announcer = document.querySelector('#announcer');
  let currentSession = null;

  const announce = text => {
    status.textContent = text;
    announcer.textContent = '';
    requestAnimationFrame(() => { announcer.textContent = text; });
  };
  const renderContext = signedIn => {
    const mode = currentMode();
    if (!signedIn) {
      cloudStatus.textContent = 'Sign in required';
      cloudStatus.title = 'Sign in to view your boards.';
      return;
    }
    if (remoteMode(mode)) {
      const preview = mode.kind === 'cloud-preview';
      cloudStatus.textContent = preview ? `Boards preview · read-only · ${mode.syncStatus || 'Connecting'}` : `Boards · ${mode.role || 'member'} · ${mode.syncStatus || 'Connecting'}`;
      cloudStatus.title = preview ? 'Viewing a read-only board preview.' : 'Viewing synchronized boards.';
    } else {
      const recovery = mode.kind === 'needs-recovery';
      cloudStatus.textContent = mode.kind === 'loading' ? 'Loading boards' : recovery ? 'Account setup needed' : 'Boards unavailable';
      cloudStatus.title = mode.message || 'Account setup needs attention. Retry or open Data recovery.';
    }
  };
  const render = (session, notify = true) => {
    currentSession = session;
    const signedIn = Boolean(session), mode = currentMode(), photoPreference = document.documentElement.dataset.appearancePhotos !== 'initials';
    if (signedIn) renderPersonBadge(button, session, {photoPreference});
    else { button.replaceChildren(document.createTextNode('Sign in')); button.classList.remove('person-badge'); button.removeAttribute('aria-hidden'); }
    button.classList.toggle('signed-out', !signedIn);
    button.setAttribute('aria-label', signedIn ? `Account: ${session.displayName || session.email}` : 'Sign in with Google');
    renderPersonBadge(profileMark, session || {displayName:'Google'}, {photoPreference, decorative:true});
    heading.textContent = signedIn ? 'Account' : 'Sign in';
    if (eyebrow) eyebrow.textContent = signedIn ? 'Flowboard account' : 'Google sign-in';
    name.textContent = signedIn ? (session.displayName || 'Google account') : 'Not signed in';
    email.textContent = signedIn ? session.email : 'Sign in to access synchronized boards.';
    signIn.hidden = signedIn;
    signOut.hidden = !signedIn;
    workspaces.hidden = !signedIn;
    if (recovery) recovery.hidden = !signedIn;
    renderContext(signedIn);
    if (!signedIn && !remoteMode(mode)) cloudStatus.textContent = 'Sign in required';
    if (notify) onSessionChange(session);
  };

  button.addEventListener('click', async () => { await styleReady; render(currentSession, false); dialog.showModal(); close.focus(); });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('cancel', event => { event.preventDefault(); dialog.close(); });
  dialog.addEventListener('close', () => button.focus());
  signIn.addEventListener('click', async () => {
    signIn.disabled = true;
    announce('Opening Google sign-in…');
    try { await adapter.signInWithGoogle(); announce('Signed in with Google. Loading your boards...'); }
    catch (error) { console.error('Flowboard Google sign-in failed.', error); announce(messageFor(error)); }
    finally { signIn.disabled = false; }
  });
  signOut.addEventListener('click', async () => {
    signOut.disabled = true;
    try { await adapter.signOut(); announce('Signed out. Synced boards are no longer visible.'); }
    catch (error) { console.error('Flowboard sign-out failed.', error); announce('Sign-out failed. Try again.'); }
    finally { signOut.disabled = false; }
  });
  appearance?.addEventListener('click', () => {
    dialog.close();
    import('./appearance-ui.js').then(({openAppearance}) => openAppearance(appearance)).catch(error => { console.error('Flowboard appearance settings failed.', error); announce('Appearance could not load.'); });
  });
  ['flowboard:appearance-change','flowboard:cloud-preview-change','flowboard:cloud-selection'].forEach(eventName => window.addEventListener(eventName, () => render(currentSession, false)));
  render(null, false);
  return adapter.onAuthStateChange(session => render(session, true));
}
