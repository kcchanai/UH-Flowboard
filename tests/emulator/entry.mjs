import {initializeApp} from 'firebase/app';
import {
  connectAuthEmulator, createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword,
  signOut, updateProfile
} from 'firebase/auth';
import {
  collection, connectFirestoreEmulator, deleteDoc, doc, getDoc, getDocs, getFirestore, query,
  setDoc, serverTimestamp, updateDoc, where, writeBatch
} from 'firebase/firestore';
import {createFirebaseWorkspaceAdapter} from '../../src/adapters/firebase-workspace-adapter.js';
import {createLocalWorkspaceAdapter} from '../../src/adapters/local-workspace-adapter.js';
import {CloudNotConfiguredError} from '../../src/adapters/adapter-contract.js';
import {bootstrapFlowboard} from '../../src/runtime-bootstrap.js';
import '../../state-core.js';

const State = globalThis.FlowboardState;
const CONFIG = Object.freeze({
  apiKey: 'demo-flowboard-emulator-key',
  authDomain: 'demo-flowboard-browser.firebaseapp.com',
  projectId: 'demo-flowboard-browser',
  storageBucket: 'demo-flowboard-browser.appspot.com',
  messagingSenderId: '1234567890',
  appId: '1:1234567890:web:demo-flowboard-browser'
});
const AUTH_EMULATOR = 'http://127.0.0.1:9099';
const FIXTURE = Object.freeze({
  workspaceId: 'emulator-workflow',
  workspaceName: 'Flowboard Emulator Workflow',
  boardId: 'emulator-board',
  listId: 'emulator-list',
  secondListId: 'emulator-list-2',
  cardId: 'emulator-card'
});
const ACCOUNTS = Object.freeze({
  owner: Object.freeze({email: 'owner@flowboard.test', password: 'Flowboard-owner-123!'}),
  editor: Object.freeze({email: 'editor@flowboard.test', password: 'Flowboard-editor-123!'}),
  viewer: Object.freeze({email: 'viewer@flowboard.test', password: 'Flowboard-viewer-123!'})
});

const app = initializeApp(CONFIG);
const auth = getAuth(app);
connectAuthEmulator(auth, AUTH_EMULATOR, {disableWarnings: true});
const db = getFirestore(app);
connectFirestoreEmulator(db, '127.0.0.1', 8080);
const cloudAdapter = createFirebaseWorkspaceAdapter(CONFIG);
const localAdapter = createLocalWorkspaceAdapter({
  validWorkspace: State.validWorkspace,
  normalizeWorkspace: State.normalizeCloudWorkspace,
  migrateLegacy: State.migrateLegacy,
  clone: State.clone
});
const users = new Map();
let capturedWorkspace = null;

async function verifyEmail(user, password) {
  if (user.emailVerified) return user;
  const response = await fetch(`${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/projects/${CONFIG.projectId}/accounts:update?key=${CONFIG.apiKey}`, {
    method: 'POST',
    headers: {'content-type': 'application/json', authorization:'Bearer owner'},
    body: JSON.stringify({localId:user.uid, emailVerified:true})
  });
  if (!response.ok) throw new Error('The Auth Emulator could not verify the synthetic test account.');
  await signOut(auth);
  const refreshed=await signInWithEmailAndPassword(auth,user.email,password);
  await refreshed.user.getIdToken(true);
  return refreshed.user;
}

async function signInRole(role) {
  const account = ACCOUNTS[role];
  if (!account) throw new Error('Unknown synthetic emulator role.');
  if (auth.currentUser?.email !== account.email) await signOut(auth);
  let credential;
  try {
    credential = await signInWithEmailAndPassword(auth, account.email, account.password);
  } catch (error) {
    if (error.code !== 'auth/user-not-found') throw error;
    credential = await createUserWithEmailAndPassword(auth, account.email, account.password);
    await updateProfile(credential.user, {displayName: `${role} emulator user`});
  }
  const user = await verifyEmail(credential.user,account.password);
  users.set(role, {uid: user.uid, email: account.email});
  return user;
}

async function writeProfile(role, workspaceIds = [FIXTURE.workspaceId]) {
  const user = auth.currentUser;
  if (!user) throw new Error('Synthetic profile write requires an authenticated emulator user.');
  const ref=doc(db,'users',user.uid),current=await getDoc(ref),pointer=current.data()?.personalWorkspaceId;workspaceIds=[...new Set([pointer,...workspaceIds].filter(Boolean))];await setDoc(ref, {
    uid: user.uid,
    emailLower: user.email.toLowerCase(),
    workspaceIds
  }, {merge: true});
}

async function signInFreshPersonal() {
  const account={email:'personal@flowboard.test',password:'Flowboard-personal-123!'};
  if(auth.currentUser?.email!==account.email)await signOut(auth);
  const created=await fetch(`${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${CONFIG.apiKey}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:account.email,password:account.password,returnSecureToken:true})});
  if(created.ok){const {localId}=await created.json(),verified=await fetch(`${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/projects/${CONFIG.projectId}/accounts:update?key=${CONFIG.apiKey}`,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer owner'},body:JSON.stringify({localId,emailVerified:true})});if(!verified.ok)throw new Error('The Auth Emulator could not verify the synthetic personal account.');}
  else{const detail=await created.json();if(!String(detail?.error?.message||'').includes('EMAIL_EXISTS'))throw new Error('The Auth Emulator could not create the synthetic personal account.');}
  const credential=await signInWithEmailAndPassword(auth,account.email,account.password);if(!credential.user.displayName)await updateProfile(credential.user,{displayName:'Personal emulator user'});return credential.user;
}
async function signInFreshHints() {
  const account={email:'hints@flowboard.test',password:'Flowboard-hints-123!'};
  if(auth.currentUser?.email!==account.email)await signOut(auth);
  const created=await fetch(`${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${CONFIG.apiKey}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:account.email,password:account.password,returnSecureToken:true})});
  if(created.ok){const {localId}=await created.json(),verified=await fetch(`${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/projects/${CONFIG.projectId}/accounts:update?key=${CONFIG.apiKey}`,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer owner'},body:JSON.stringify({localId,emailVerified:true})});if(!verified.ok)throw new Error('The Auth Emulator could not verify the synthetic hints account.');}
  else{const detail=await created.json();if(!String(detail?.error?.message||'').includes('EMAIL_EXISTS'))throw new Error('The Auth Emulator could not create the synthetic hints account.');}
  const credential=await signInWithEmailAndPassword(auth,account.email,account.password),user=await verifyEmail(credential.user,account.password);
  await setDoc(doc(db,'users',user.uid),{uid:user.uid,emailLower:account.email,workspaceIds:['synthetic-legacy-hint']});
  return user;
}

let seedStage='start';async function seedFixture() {
  const owner = await signInRole('owner');
  const editor = await signInRole('editor');
  const viewer = await signInRole('viewer');
  await signInRole('owner');
  const root = doc(db, 'workspaces', FIXTURE.workspaceId);
  const bootstrap = writeBatch(db);
  bootstrap.set(root, {
    name: FIXTURE.workspaceName,
    ownerUid: owner.uid,
    schemaVersion: 4,
    activeBoardId: FIXTURE.boardId,
    status: 'ready',
    lifecycleRevision: 0,
    migration: {version: 1, state: 'verified', counts: {boards: 1, lists: 2, cards: 1}},
    updatedAt: serverTimestamp()
  });
  bootstrap.set(doc(root, 'members', owner.uid), {uid: owner.uid, role: 'owner', emailLower: owner.email.toLowerCase(), displayName: 'Owner emulator user'});
  seedStage='bootstrap';await bootstrap.commit();
  const members = writeBatch(db);
  members.set(doc(root, 'members', editor.uid), {uid: editor.uid, role: 'editor', emailLower: editor.email.toLowerCase(), displayName: 'Editor emulator user'});
  members.set(doc(root, 'members', viewer.uid), {uid: viewer.uid, role: 'viewer', emailLower: viewer.email.toLowerCase(), displayName: 'Viewer emulator user'});
  seedStage='members';await members.commit();
  const records = writeBatch(db);
  records.set(doc(root, 'boards', FIXTURE.boardId), {
    id: FIXTURE.boardId, title: 'Emulator board', rank: 0, archived:false, lifecycleState:'active', revision: 0,
    clientMutationId: 'seed-board-mutation-0001', updatedAt: serverTimestamp()
  });
  records.set(doc(root, 'boards', FIXTURE.boardId, 'lists', FIXTURE.listId), {
    id: FIXTURE.listId, title: 'Doing', rank: 0, lifecycleState:'active', revision: 0,
    clientMutationId: 'seed-list-mutation-0001', updatedAt: serverTimestamp()
  });
  records.set(doc(root, 'boards', FIXTURE.boardId, 'lists', FIXTURE.secondListId), {
    id: FIXTURE.secondListId, title: 'Review', rank: 1, lifecycleState:'active', revision: 0,
    clientMutationId: 'seed-list-mutation-0002', updatedAt: serverTimestamp()
  });
  records.set(doc(root, 'boards', FIXTURE.boardId, 'cards', FIXTURE.cardId), {
    id: FIXTURE.cardId, listId: FIXTURE.listId, title: 'Synthetic shared card', description: 'Emulator-only card',
    rank: 0, assigneeUids: [editor.uid], labels: [], dueDate: '', checklist: [], archived: false, lifecycleState:'active',
    revision: 0, clientMutationId: 'seed-card-mutation-0001', updatedAt: serverTimestamp()
  });
  seedStage='records';await records.commit();
  seedStage='owner-profile';await writeProfile('owner');
  seedStage='editor-profile';await signInRole('editor'); await writeProfile('editor');
  seedStage='viewer-profile';await signInRole('viewer'); await writeProfile('viewer');
  await signOut(auth);
  await signInWithEmailAndPassword(auth,ACCOUNTS.owner.email,ACCOUNTS.owner.password);
  await new Promise(resolve=>setTimeout(resolve,50));
  return {name: FIXTURE.workspaceName};
}

const workspaceFor = async () => cloudAdapter.fetchWorkspace(FIXTURE.workspaceId);
const cardFor = workspace => workspace.boards.find(board => board.id === FIXTURE.boardId)?.lists.flatMap(list => list.cards).find(card => card.id === FIXTURE.cardId);
const mutationId = () => `browser-emulator-${crypto.randomUUID()}`;

async function applyCardChange(before, title) {
  const next = State.clone(before);
  const card = cardFor(next);
  if (!card) throw new Error('The emulator fixture card was not found.');
  card.title = title;
  card.description = `Synthetic editor update ${title}`;
  return cloudAdapter.applyWorkspaceMutation({workspaceId: FIXTURE.workspaceId, before, next, clientMutationId: mutationId(), activityAction: 'card-updated'});
}

const testApi = {
  fixture: FIXTURE,
  async seedFixture() { try{return await seedFixture();}catch(error){throw Error(`${seedStage}:${error.code||'unknown'}`);} },
  async signInRole(role) { return {uid: (await signInRole(role)).uid}; },
  async captureWorkspace() { capturedWorkspace = await workspaceFor(); return {revision: cardFor(capturedWorkspace)?.revision ?? -1}; },
  async fixtureSummary(){const workspace=await workspaceFor(),uid=auth.currentUser?.uid,adapterSession=await cloudAdapter.getSession(),currentRole=[...users.entries()].find(([,value])=>value.uid===uid)?.[0]||'unknown',adapterRole=[...users.entries()].find(([,value])=>value.uid===adapterSession?.uid)?.[0]||'unknown',entryRole=(await cloudAdapter.listWorkspaces()).find(entry=>entry.id===FIXTURE.workspaceId)?.role||'missing';return{boards:workspace.boards.length,lists:workspace.boards.reduce((n,board)=>n+board.lists.length,0),cards:workspace.boards.reduce((n,board)=>n+board.lists.reduce((m,list)=>m+list.cards.length,0),0),currentRole,adapterRole,entryRole};},
  async mutationRetryFixture(){await signInRole('owner');const before=await workspaceFor(),next=State.clone(before),created=State.makeBoard('blank'),clientMutationId='idempotent-create-operation-0001';created.id='idempotent-created-board';created.title='Idempotent created board';next.boards.push(created);next.activeBoardId=created.id;const first=await cloudAdapter.applyWorkspaceMutation({workspaceId:FIXTURE.workspaceId,before,next,clientMutationId}),second=await cloudAdapter.applyWorkspaceMutation({workspaceId:FIXTURE.workspaceId,before,next,clientMutationId}),activity=await getDoc(doc(db,'workspaces',FIXTURE.workspaceId,'activity',clientMutationId));return{firstCount:first.boards.filter(board=>board.id===created.id).length,secondCount:second.boards.filter(board=>board.id===created.id).length,activity:activity.exists()};},

  async mutateCard(title) { return applyCardChange(await workspaceFor(), title); },
  async mutateCapturedCard(title) {
    if (!capturedWorkspace) throw new Error('No stale emulator snapshot has been captured.');
    return applyCardChange(capturedWorkspace, title);
  },
  async viewerWriteAttempt() {
    try { await applyCardChange(await workspaceFor(), 'Viewer should be denied'); return {result: 'unexpected-success'}; }
    catch (error) { return {result: error.code || 'unknown'}; }
  },
  async changeEditorRole(role) {
    const editor = users.get('editor');
    if (!editor) throw new Error('The editor emulator user is unavailable.');
    return cloudAdapter.changeMemberRole(FIXTURE.workspaceId, editor.uid, role);
  },
  async removeEditor() {
    const editor = users.get('editor');
    if (!editor) throw new Error('The editor emulator user is unavailable.');
    return cloudAdapter.removeMember(FIXTURE.workspaceId, editor.uid);
  },
  async archiveWorkspace() {
    const workspace = await getDoc(doc(db, 'workspaces', FIXTURE.workspaceId));
    return cloudAdapter.archiveWorkspace({workspaceId: FIXTURE.workspaceId, expectedRevision: workspace.data()?.lifecycleRevision ?? 0});
  },
  async restoreWorkspace() {
    const workspace = await getDoc(doc(db, 'workspaces', FIXTURE.workspaceId));
    return cloudAdapter.restoreWorkspace({workspaceId: FIXTURE.workspaceId, expectedRevision: workspace.data()?.lifecycleRevision ?? 0});
  },
  async signInFreshPersonal(){const user=await signInFreshPersonal();return{uid:user.uid};},
  async existingHintsContext(){try{const user=await signInFreshHints(),choice=await cloudAdapter.ensurePersonalWorkspace(),profile=await getDoc(doc(db,'users',user.uid)),workspace=await getDoc(doc(db,'workspaces',choice.workspaceId));return{state:choice.state,hasPointer:typeof profile.data()?.personalWorkspaceId==='string',hintPreserved:profile.data()?.workspaceIds?.includes('synthetic-legacy-hint')===true,workspacePersonal:workspace.data()?.personal===true,workspaceReady:workspace.data()?.status==='ready',role:choice.entry?.role||''};}catch(error){return{errorCode:error?.code||error?.name||'unknown',errorMessage:String(error?.message||'').slice(0,120)};}},
  async signInExistingPersonal(){const user=(await signInWithEmailAndPassword(auth,'personal@flowboard.test','Flowboard-personal-123!')).user;return{uid:user.uid};},

  async personalContext(){const user=await signInFreshPersonal(),choice=await cloudAdapter.ensurePersonalWorkspace();return{uid:user.uid,workspaceId:choice.workspaceId};},
  async personalSummary(){const user=auth.currentUser;if(!user)return{signedIn:false};const profile=await getDoc(doc(db,'users',user.uid)),workspaceId=profile.data()?.personalWorkspaceId;if(!workspaceId)return{signedIn:true,hasPointer:false};const [workspace,membership,boards]=await Promise.all([getDoc(doc(db,'workspaces',workspaceId)),getDoc(doc(db,'workspaces',workspaceId,'members',user.uid)),getDocs(query(collection(db,'workspaces',workspaceId,'boards'),where('lifecycleState','==','active'),where('archived','==',false)))]);return{signedIn:true,hasPointer:true,workspaceExists:workspace.exists(),role:membership.data()?.role||'',boardCount:boards.size};},
  async seedDirectoryPages(){await signInFreshPersonal();const {workspaceId}=await cloudAdapter.ensurePersonalWorkspace();for(let index=0;index<30;index++){const boardId=`paged-board-${String(index).padStart(2,'0')}`;await setDoc(doc(db,'workspaces',workspaceId,'boards',boardId),{id:boardId,title:`Paged board ${String(index+1).padStart(2,'0')}`,rank:100+index,archived:false,lifecycleState:'active',revision:0,clientMutationId:`paged-create-operation-${String(index).padStart(2,'0')}`});}return{workspaceId};},
  async importLegacyFixture(){
    const user=await signInFreshPersonal(),choice=await cloudAdapter.ensurePersonalWorkspace(),workspaceId=choice.workspaceId;let oversized='unexpected-success';try{await cloudAdapter.importLegacyWorkspace({workspaceId,workspace:{schemaVersion:5,boards:Array.from({length:5},(_,index)=>({id:`oversized-${index}`,title:'Oversized',lists:[]}))}});}catch(error){oversized=error.code||'unknown';}
    const legacy={schemaVersion:1,activeBoardId:'duplicate-board',preferences:{theme:'system'},boards:[0,1,2,3].map(index=>({id:'duplicate-board',title:'Repeated board',createdAt:'2025-01-01T00:00:00.000Z',updatedAt:'2025-01-02T00:00:00.000Z',archived:index===1,lists:[{id:'duplicate-list',title:'List',createdAt:'2025-01-01T00:00:00.000Z',updatedAt:'2025-01-02T00:00:00.000Z',archived:false,cards:[{id:'duplicate-card',title:`Imported ${index+1}`,description:'Legacy detail',labels:[],checklist:[],activity:[{id:'legacy-history',text:'Legacy note',at:'2025-01-01T00:00:00.000Z'}],assignees:['Legacy person'],archived:index===1,createdAt:'2025-01-01T00:00:00.000Z',updatedAt:'2025-01-02T00:00:00.000Z'}]}]}))};
    const raw=JSON.stringify(legacy),secondary='legacy-key-sentinel';localStorage.setItem('flowboard-workspace',raw);localStorage.setItem('flowboard-data',secondary);
    const inspected=localAdapter.inspectLegacyWorkspace();let first;try{first=await cloudAdapter.importLegacyWorkspace({workspaceId,workspace:inspected.workspace});}catch(error){return{errorStage:error.flowboardStage||'first-import',errorCode:error.code||'unknown'};}
    localAdapter.saveLegacyMigrationReceipt({version:1,accountUid:user.uid,workspaceId,source:inspected.source,operationId:first.operationId,counts:inspected.counts,state:'verified'});
    const second=await cloudAdapter.importLegacyWorkspace({workspaceId,workspace:inspected.workspace}),loaded=await cloudAdapter.fetchWorkspace(workspaceId),backup=await cloudAdapter.exportCloudBackup(workspaceId),receipt=localAdapter.loadLegacyMigrationReceipt();
    await signInRole('owner');let crossAccount='unexpected-success';try{await cloudAdapter.importLegacyWorkspace({workspaceId,workspace:inspected.workspace});}catch(error){crossAccount=error.code||'unknown';}await signInFreshPersonal();
    const imported=backup.records.filter(item=>item.board.importOperationId===first.operationId),allCards=imported.flatMap(item=>item.cards);return{oversized,firstImported:!first.alreadyImported,secondIdempotent:second.alreadyImported,sameOperation:first.operationId===second.operationId,activeVisible:loaded.boards.some(board=>board.title==='Repeated board'),boards:imported.length,activeBoards:imported.filter(item=>!item.board.archived).length,lists:imported.reduce((n,item)=>n+item.lists.length,0),cards:allCards.length,archivedBoards:imported.filter(item=>item.board.archived).length,legacyLabelsOnly:allCards.every(card=>card.assigneeUids.length===0&&card.legacyAssignees[0]==='Legacy person'),receiptVerified:receipt?.state==='verified',rawPreserved:localStorage.getItem('flowboard-workspace')===raw&&localStorage.getItem('flowboard-data')===secondary,crossAccount};
  },
  async backupAndUpgradeSnapshot(){
    await signInRole('owner');for(let index=0;index<27;index++)await cloudAdapter.createComment({workspaceId:FIXTURE.workspaceId,boardId:FIXTURE.boardId,cardId:FIXTURE.cardId,body:`Synthetic page comment ${index}`});
    const snapshotId='snapshot-upgrade-board';
    const backup=await cloudAdapter.exportCloudBackup(FIXTURE.workspaceId),fixtureRecord=backup.records.find(item=>item.board.id===FIXTURE.boardId),snapshotRecord=backup.records.find(item=>item.board.id===snapshotId),first=await cloudAdapter.migrateWorkspaceToGranular(FIXTURE.workspaceId),second=await cloudAdapter.migrateWorkspaceToGranular(FIXTURE.workspaceId),root=await getDoc(doc(db,'workspaces',FIXTURE.workspaceId,'boards',snapshotId)),lists=await getDocs(query(collection(db,'workspaces',FIXTURE.workspaceId,'boards',snapshotId,'lists'),where('lifecycleState','==','active'))),cards=await getDocs(query(collection(db,'workspaces',FIXTURE.workspaceId,'boards',snapshotId,'cards'),where('listId','==','snapshot-list'),where('lifecycleState','==','active')));
    return{backupFormat:backup.format,commentCount:fixtureRecord.cards.find(card=>card.id===FIXTURE.cardId).comments.length,snapshotBackedUp:Boolean(snapshotRecord.board.snapshot),firstMigrated:!first.alreadyMigrated,secondIdempotent:second.alreadyMigrated,sameOperation:first.operationId===second.operationId,snapshotScrubbed:root.data()?.snapshot===undefined,lists:lists.size,cards:cards.size};
  }
};

const personalMode=new URLSearchParams(location.search).get('personal')==='1';
const params=new URLSearchParams(location.search),commandRace=params.get('commandRace')==='1',verificationPending=params.get('verificationPending')==='1',staleRetry=params.get('staleRetry')==='1',mutationFailure=params.get('mutationFailure')==='1';let applyCount=0;const runtimeBase=mutationFailure?Object.freeze({...cloudAdapter,applyWorkspaceMutation:async()=>{throw Object.assign(new Error('Revision conflict.'),{code:'REVISION_CONFLICT'});}}):staleRetry?Object.freeze({...cloudAdapter,applyWorkspaceMutation:async options=>{const workspace=await cloudAdapter.applyWorkspaceMutation(options);if(!applyCount++)throw Object.assign(new Error('Verification pending.'),{code:'VERIFICATION_PENDING'});return workspace;}}):verificationPending?Object.freeze({...cloudAdapter,applyWorkspaceMutation:async()=>{throw Object.assign(new Error('Verification pending.'),{code:'VERIFICATION_PENDING'});}}):commandRace?Object.freeze({...cloudAdapter,applyWorkspaceMutation:async options=>{await new Promise(resolve=>setTimeout(resolve,120));return cloudAdapter.applyWorkspaceMutation(options);}}):cloudAdapter;
const runtimeCloudAdapter=personalMode?runtimeBase:Object.freeze({...runtimeBase,ensurePersonalWorkspace:async()=>({state:'needs-recovery',workspaceId:FIXTURE.workspaceId})});

await bootstrapFlowboard({
  cloudConfig: CONFIG,
  cloudConfigured: true,
  cloudStatus: {configured: true, provider: 'firebase', message: 'Synthetic Firebase Emulator workflow.'},
  localAdapter,
  cloudAdapter:runtimeCloudAdapter,
  CloudNotConfiguredError
});
window.__flowboardEmulatorTest = testApi;
const initialRole = new URLSearchParams(location.search).get('role');
if (initialRole) await signInRole(initialRole);
window.__flowboardEmulatorTest.ready = true;
