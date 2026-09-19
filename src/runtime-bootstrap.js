import {applyCanvasPalette, CANVAS_PALETTES} from './canvas-palettes.js';

export async function bootstrapFlowboard({cloudConfigured, cloudStatus, cloudInitializationError = null, localAdapter, cloudAdapter}) {
  globalThis.FlowboardRuntime = Object.freeze({cloudStatus, localAdapter, cloudAdapter, canvasPalettes:CANVAS_PALETTES, applyCanvasPalette});
  await import('../app.js');
  if (cloudConfigured && !cloudInitializationError) {
    const {initializeAuthUI, initializeCloudWorkspaceUI, initializeInviteUI, initializeMembersUI, initializeCloudRosterUI, initializeCloudSyncController, initializeActivityUI, initializeAssignmentUI, initializeCommentsUI} = await import('./cloud-ui.js');
    const cloudUI = initializeCloudWorkspaceUI({localAdapter, cloudAdapter});
    const inviteUI = initializeInviteUI(cloudAdapter);
    const membersUI = initializeMembersUI(cloudAdapter);
    const rosterUI = initializeCloudRosterUI(cloudAdapter);
    const syncController = initializeCloudSyncController(cloudAdapter);
    const activityUI = initializeActivityUI(cloudAdapter);
    const assignmentUI = initializeAssignmentUI(cloudAdapter);
    const commentsUI = initializeCommentsUI(cloudAdapter);
    initializeAuthUI(cloudAdapter, {onSessionChange:session => { globalThis.FlowboardApp.setSession?.(session); syncController.setSession(session); cloudUI.setSession(session); inviteUI.setSession(session); membersUI.setSession(session); rosterUI.setSession(session); activityUI.setSession(session); assignmentUI.setSession(session); commentsUI.setSession(session); }});
  } else if (cloudConfigured) {
    const accountButton = document.querySelector('#account-button');
    accountButton.disabled = true;
    accountButton.textContent = 'Unavailable';
    globalThis.FlowboardApp.showCloudUnavailable?.('Firebase could not initialize. Try again later.');
  } else {
    document.querySelector('#account-button').hidden = true;
    globalThis.FlowboardApp.showCloudUnavailable?.(cloudStatus.message);
  }
}
