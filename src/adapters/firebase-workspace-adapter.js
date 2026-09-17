import {getApp, getApps, initializeApp} from 'firebase/app';
import {
  browserLocalPersistence, getAuth, GoogleAuthProvider, onAuthStateChanged,
  setPersistence, signInWithPopup, signOut as firebaseSignOut
} from 'firebase/auth';
const sessionFor = user => user ? Object.freeze({
  uid:user.uid, displayName:user.displayName || '', email:user.email || '',
  emailVerified:Boolean(user.emailVerified), photoURL:user.photoURL || ''
}) : null;

export function createFirebaseWorkspaceAdapter(config) {
  const app = getApps().length ? getApp() : initializeApp(config);
  const auth = getAuth(app);
  const persistenceReady = setPersistence(auth, browserLocalPersistence);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({prompt:'select_account'});
  let workspaceModule, lifecycleModule;
  const cloud = () => workspaceModule ||= import('./firebase-cloud-workspace.js');
  const lifecycle = () => lifecycleModule ||= import('./firebase-workspace-lifecycle.js');
  const cloudCall = (method, ...args) => cloud().then(module => module[method](app, auth, ...args));
  const lifecycleCall = (method, ...args) => lifecycle().then(module => module[method](app, auth, ...args));

  const adapter = {
    async getSession() { await persistenceReady; return sessionFor(auth.currentUser); },
    onAuthStateChange(callback) { return onAuthStateChanged(auth, user => callback(sessionFor(user))); },
    async signInWithGoogle() { await persistenceReady; return sessionFor((await signInWithPopup(auth, provider)).user); },
    async signOut() { await firebaseSignOut(auth); },
    verifyWorkspaceAccess(workspaceId) { return cloudCall('verifyWorkspaceAccess', workspaceId); },
    listWorkspaces() { return cloudCall('listCloudWorkspaces'); },
    fetchWorkspace(workspaceId) { return cloudCall('fetchCloudWorkspace', workspaceId); },
    renameWorkspace(options) { return lifecycleCall('renameCloudWorkspace', options); },
    archiveWorkspace(options) { return lifecycleCall('archiveCloudWorkspace', options); },
    restoreWorkspace(options) { return lifecycleCall('restoreCloudWorkspace', options); },
    subscribeWorkspace(options) { return cloudCall('subscribeCloudWorkspace', options); },
    listActivity(workspaceId, options) { return cloudCall('listWorkspaceActivity', workspaceId, options); },
    subscribeComments(options) { return cloudCall('subscribeCardComments', options); },
    listOlderComments(options) { return cloudCall('listOlderCardComments', options); },
    probeCommentQueryAuthorization(options) { return cloudCall('probeCommentQueryAuthorization', options); },
    async probeHardDeleteAuthorization(options) { return (await import('./firebase-phase-h-probes.js')).probeHardDeleteAuthorization(app, auth, options); },
    createComment(options) { return cloudCall('createCardComment', options); },
    updateComment(options) { return cloudCall('updateCardComment', options); },
    removeComment(options) { return cloudCall('removeCardComment', options); },
    applyWorkspaceMutation(options) { return cloudCall('applyCloudWorkspaceMutation', options); },
    migrateWorkspaceToGranular(workspaceId) { return cloudCall('migrateWorkspaceToGranular', workspaceId); },
    listMembers(workspaceId) { return cloudCall('listMembers', workspaceId); },
    listInvites(workspaceId) { return cloudCall('listInvites', workspaceId); },
    createInvite(options) { return cloudCall('createInvite', options); },
    revokeInvite(workspaceId, inviteId) { return cloudCall('revokeInvite', workspaceId, inviteId); },
    acceptInvite(options) { return cloudCall('acceptInvite', options); },
    changeMemberRole(workspaceId, uid, role) { return cloudCall('changeMemberRole', workspaceId, uid, role); },
    removeMember(workspaceId, uid) { return cloudCall('removeMember', workspaceId, uid); },
    leaveWorkspace(workspaceId) { return cloudCall('leaveWorkspace', workspaceId); },
    transferOwnership(options) { return cloudCall('transferOwnership', options); },
    uploadLocalWorkspace(options) { return cloudCall('uploadLocalWorkspace', options); }
  };

  return Object.freeze(adapter);
}
