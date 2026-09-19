
export const REMOTE_METHODS = Object.freeze([
  'getSession', 'onAuthStateChange', 'signInWithGoogle', 'signOut', 'verifyWorkspaceAccess', 'ensurePersonalWorkspace',
  'listWorkspaces', 'listBoardDirectory', 'fetchWorkspace', 'renameWorkspace', 'archiveWorkspace', 'restoreWorkspace', 'migrateWorkspaceToGranular', 'importLegacyWorkspace', 'exportCloudBackup', 'subscribeWorkspace', 'subscribeComments', 'listActivity', 'listOlderComments',
  'createComment', 'updateComment', 'removeComment', 'probeCommentQueryAuthorization', 'probeHardDeleteAuthorization',
  'applyWorkspaceMutation', 'createInvite', 'listMembers', 'listInvites', 'revokeInvite', 'acceptInvite',
  'changeMemberRole', 'removeMember', 'leaveWorkspace', 'transferOwnership', 'updateOwnMemberProfile'
]);

export class CloudNotConfiguredError extends Error {
  constructor() {
    super('Cloud workspaces are not configured. Flowboard is operating locally in this browser.');
    this.name = 'CloudNotConfiguredError';
    this.code = 'CLOUD_NOT_CONFIGURED';
  }
}


export function createUnavailableCloudAdapter() {
  const unavailable = async () => { throw new CloudNotConfiguredError(); };
  return Object.freeze(Object.fromEntries(REMOTE_METHODS.map(method => [method, unavailable])));
}
