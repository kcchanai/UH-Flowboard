import {getApp, getApps, initializeApp} from 'firebase/app';
import {
  browserLocalPersistence, getAuth, GoogleAuthProvider, onAuthStateChanged,
  setPersistence, signInWithPopup, signOut as firebaseSignOut
} from 'firebase/auth';
import {arrayUnion,doc,getDoc,getFirestore,runTransaction,serverTimestamp} from 'firebase/firestore';
const sessionFor = user => user ? Object.freeze({
  uid:user.uid, displayName:user.displayName || '', email:user.email || '',
  emailVerified:Boolean(user.emailVerified), photoURL:user.photoURL || ''
}) : null;
const randomId=()=>{const values=new Uint8Array(16);crypto.getRandomValues(values);return btoa(String.fromCharCode(...values)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');};
async function ensurePersonal(app,auth){const user=auth.currentUser;if(!user)throw Object.assign(new Error('Sign in before loading your workspace.'),{code:'AUTH_REQUIRED'});const token=await user.getIdTokenResult(true);if(user.emailVerified!==true&&token.claims.email_verified!==true)throw Object.assign(new Error('Verify your Google email before creating your workspace.'),{code:'EMAIL_NOT_VERIFIED'});const db=getFirestore(app),profileRef=doc(db,'users',user.uid),candidate=randomId(),emailLower=String(user.email||'').trim().toLowerCase(),decision=await runTransaction(db,async transaction=>{const profile=await transaction.get(profileRef),data=profile.data()||{},pointer=typeof data.personalWorkspaceId==='string'?data.personalWorkspaceId:'',hints=[...new Set(Array.isArray(data.workspaceIds)?data.workspaceIds:[])].filter(id=>typeof id==='string'&&id).slice(0,100);if(pointer)return{state:'existing',workspaceId:pointer};if(hints.length)return{state:'needs-selection',workspaceIds:hints};const workspaceRef=doc(db,'workspaces',candidate),memberRef=doc(db,'workspaces',candidate,'members',user.uid);transaction.set(workspaceRef,{name:'My workspace',ownerUid:user.uid,schemaVersion:5,status:'ready',personal:true,lifecycleRevision:0,activeBoardId:'',migration:{version:1,state:'verified',counts:{boards:0,lists:0,cards:0}},createdAt:serverTimestamp(),updatedAt:serverTimestamp()});transaction.set(memberRef,{uid:user.uid,role:'owner',emailLower});transaction.set(profileRef,{uid:user.uid,emailLower,workspaceIds:arrayUnion(candidate),personalWorkspaceId:candidate},{merge:true});return{state:'created',workspaceId:candidate};});if(decision.state==='needs-selection')return decision;try{const [workspace,membership]=await Promise.all([getDoc(doc(db,'workspaces',decision.workspaceId)),getDoc(doc(db,'workspaces',decision.workspaceId,'members',user.uid))]);if(workspace.exists()&&membership.exists()&&membership.data().role==='owner')return{...decision,entry:{id:workspace.id,...workspace.data(),role:'owner'}};}catch{}return{state:'needs-recovery',workspaceId:decision.workspaceId};}

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
    ensurePersonalWorkspace() { return ensurePersonal(app,auth); },
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
    updateOwnMemberProfile(workspaceId, options) { return cloudCall('updateOwnMemberProfile', workspaceId, options); },
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
