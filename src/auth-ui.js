import {renderPersonBadge} from './person-badges.js';
export {personInitials, safePhotoURL, renderPersonBadge} from './person-badges.js';

function messageFor(error) {
  const code = error?.code || '';
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return 'Google sign-in was cancelled.';
  if (code === 'auth/popup-blocked') return 'Your browser blocked the Google sign-in window. Allow popups for this site and try again.';
  if (code === 'auth/unauthorized-domain') return 'This site is not authorized for Google sign-in. Check Firebase authorized domains.';
  if (code === 'auth/operation-not-allowed') return 'Google sign-in is not enabled for this Firebase project.';
  if (code === 'auth/network-request-failed') return 'Google sign-in could not reach the network. Check your connection and try again.';
  return 'Google sign-in could not be completed. Your local workspace was not changed.';
}

const currentMode = () => globalThis.FlowboardApp?.getMode?.() || {kind:'local'};
const remoteMode = mode => ['cloud','cloud-preview'].includes(mode.kind);

export function initializeAuthUI(adapter, {onSessionChange = () => {}} = {}) {
  const button = document.querySelector('#account-button');
  const dialog = document.querySelector('#account-dialog');
  const close = document.querySelector('#close-account-dialog');
  const signIn = document.querySelector('#google-sign-in');
  const signOut = document.querySelector('#account-sign-out');
  const migrate = document.querySelector('#open-cloud-migration');
  const workspaces = document.querySelector('#open-cloud-workspaces');
  const appearance = document.querySelector('#account-open-appearance');
  const name = document.querySelector('#account-name');
  const email = document.querySelector('#account-email');
  const heading = document.querySelector('#account-heading');
  const eyebrow = dialog?.querySelector('.eyebrow');
  const profileMark = document.querySelector('#account-profile-mark');
  const workspaceSection = document.querySelector('#account-workspace-section');
  const workspaceName = document.querySelector('#account-workspace-name');
  const workspaceDetail = document.querySelector('#account-workspace-detail');
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
    workspaceSection.hidden = !signedIn;
    if (!signedIn) {
      workspaceName.textContent = 'Browser-local workspace';
      workspaceDetail.textContent = 'Sign in to browse cloud workspaces. Your local data remains in this browser.';
      return;
    }
    if (remoteMode(mode)) {
      const preview = mode.kind === 'cloud-preview';
      workspaceName.textContent = mode.name || 'Cloud workspace';
      workspaceDetail.textContent = `${preview ? 'Read-only cloud preview' : 'Cloud workspace'} · ${mode.role || 'member'} · ${mode.syncStatus || 'Connecting'}`;
      cloudStatus.textContent = preview ? `Cloud preview · read-only · ${mode.syncStatus || 'Connecting'}` : `Cloud workspace · ${mode.role || 'member'} · ${mode.syncStatus || 'Connecting'}`;
      cloudStatus.title = preview ? `Viewing ${mode.name || 'this cloud workspace'} in read-only mode. Your browser-local workspace is unchanged.` : `Editing ${mode.name || 'this cloud workspace'}. Your browser-local workspace is unchanged.`;
    } else {
      workspaceName.textContent = 'Browser-local workspace';
      workspaceDetail.textContent = 'Open a cloud workspace to share your photo with its members.';
      cloudStatus.textContent = 'Signed in · local workspace';
      cloudStatus.title = 'Signed in with Google. This browser-local workspace has not been uploaded or synchronized.';
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
    email.textContent = signedIn ? session.email : 'Your local workspace remains available without an account.';
    signIn.hidden = signedIn;
    signOut.hidden = !signedIn;
    migrate.hidden = !signedIn || remoteMode(mode);
    workspaces.hidden = !signedIn;
    renderContext(signedIn);
    if (!signedIn && !remoteMode(mode)) cloudStatus.textContent = 'Google sign-in available';
    if (notify) onSessionChange(session);
  };

  button.addEventListener('click', () => { render(currentSession, false); dialog.showModal(); close.focus(); });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('cancel', event => { event.preventDefault(); dialog.close(); });
  dialog.addEventListener('close', () => button.focus());
  signIn.addEventListener('click', async () => {
    signIn.disabled = true;
    announce('Opening Google sign-in…');
    try { await adapter.signInWithGoogle(); announce('Signed in with Google. Your local workspace was not uploaded.'); }
    catch (error) { console.error('Flowboard Google sign-in failed.', error); announce(messageFor(error)); }
    finally { signIn.disabled = false; }
  });
  signOut.addEventListener('click', async () => {
    signOut.disabled = true;
    try { await adapter.signOut(); announce('Signed out. Your local workspace remains in this browser.'); }
    catch (error) { console.error('Flowboard sign-out failed.', error); announce('Sign-out could not be completed. Try again.'); }
    finally { signOut.disabled = false; }
  });
  appearance?.addEventListener('click', () => {
    dialog.close();
    import('./appearance-ui.js').then(({openAppearance}) => openAppearance(appearance)).catch(error => { console.error('Flowboard appearance settings failed.', error); announce('Appearance settings could not be loaded.'); });
  });
  ['flowboard:appearance-change','flowboard:cloud-preview-change','flowboard:cloud-selection'].forEach(eventName => window.addEventListener(eventName, () => render(currentSession, false)));
  render(null, false);
  return adapter.onAuthStateChange(session => render(session, true));
}
