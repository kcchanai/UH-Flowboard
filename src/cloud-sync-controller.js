const ACCESS_CODES = new Set(['ACCESS_REMOVED', 'WORKSPACE_NOT_FOUND', 'WORKSPACE_ARCHIVED']);
const RETRY_DELAYS = [250, 750, 1500, 3000, 6000, 12000];

const isCloud = mode => ['cloud-preview', 'cloud'].includes(mode?.kind);

export function initializeCloudSyncController(adapter) {
  let session = null, unsubscribe = null, generation = 0, retryTimer = null, recoveryAttempts = 0;
  const app = () => globalThis.FlowboardApp;
  const clearRetry = () => { clearTimeout(retryTimer); retryTimer = null; };
  const stop = () => { generation += 1; clearRetry(); unsubscribe?.(); unsubscribe = null; };
  const status = (name, message = '') => app()?.setCloudSyncStatus(name, message);
  const accessRemoved = message => { stop(); app()?.handleCloudAccessRemoved(message || 'Board access was removed.'); };
  const reportError = (error, message) => ACCESS_CODES.has(error?.code)
    ? accessRemoved(error?.code === 'WORKSPACE_ARCHIVED' ? 'These boards are archived.' : undefined)
    : status(error?.code === 'unavailable' || !navigator.onLine ? 'Offline' : 'Error', message);

  async function recoverListener(error, current) {
    const stage = ['workspace','membership','board','lists','cards'].includes(error?.stage) ? error.stage : 'unknown';
    status(navigator.onLine ? 'Connecting' : 'Offline', `Checking ${stage}.`);
    try {
      const role = await adapter.verifyWorkspaceAccess(app()?.getMode()?.id);
      if (current !== generation) return;
      app()?.updateCloudRole(role);
    } catch (verificationError) {
      if (current !== generation) return;
      if (ACCESS_CODES.has(verificationError?.code)) return reportError(verificationError);
      return status(verificationError?.code === 'unavailable' || !navigator.onLine ? 'Offline' : 'Error', 'Retry via Boards.');
    }
    if (recoveryAttempts >= RETRY_DELAYS.length) return status('Error', 'Sync paused. Retry Boards.');
    const delay = RETRY_DELAYS[recoveryAttempts++];
    clearRetry();
    retryTimer = setTimeout(() => { retryTimer = null; if (current === generation) start(); }, delay);
  }

  async function start(verifyAccess = false) {
    stop();
    if (verifyAccess) recoveryAttempts = 0;
    const mode = app()?.getMode();
    const boardId = app()?.getActiveBoardId();
    if (!session || !isCloud(mode) || !mode.id || !boardId) return;
    const current = generation, active = () => current === generation;
    status(navigator.onLine ? 'Connecting' : 'Offline');
    try {
      if (verifyAccess) await adapter.verifyWorkspaceAccess(mode.id);
      if (!active()) return;
      const next = await adapter.subscribeWorkspace({
        workspaceId:mode.id,
        boardId,
        onWorkspace:workspace => {
          if (!active()) return;
          if (workspace.status === 'archived') accessRemoved('These boards are archived.');
          else app()?.updateCloudWorkspaceName(mode.id, workspace.name);
        },
        onBoard:payload => { if (active()) app()?.applyRemoteCloudBoard(payload); },
        onMembership:role => { if (active()) app()?.updateCloudRole(role); },
        onStatus:name => { if (active()) { if (name === 'synced') recoveryAttempts = 0; status(name === 'saving' ? 'Saving' : name === 'offline' ? 'Offline' : 'Synced'); } },
        onError:error => {
          if (!active()) return;
          if (error?.code === 'permission-denied') { void recoverListener(error, current); return; }
          reportError(error, 'Sync stopped. Reopen Boards.');
        }
      });
      if (!active()) next(); else unsubscribe = next;
    } catch (error) {
      if (!active()) return;
      if (error?.code === 'permission-denied') { void recoverListener(error, current); return; }
      reportError(error, 'Sync could not start.');
    }
  }

  ['flowboard:cloud-preview-change', 'flowboard:active-board-change'].forEach(name => window.addEventListener(name, () => start()));
  window.addEventListener('flowboard:lifecycle-start',stop);
  window.addEventListener('offline', () => status('Offline'));
  window.addEventListener('online', () => start(true));

  return Object.freeze({
    setSession(next) {
      session = next;
      if (!session) isCloud(app()?.getMode()) ? accessRemoved('Signed out.') : stop();
      else if (isCloud(app()?.getMode())) start();
    },
    stop
  });
}
