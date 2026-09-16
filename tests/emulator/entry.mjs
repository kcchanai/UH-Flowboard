import {initializeApp} from 'firebase/app';
import {
  connectAuthEmulator, createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword,
  signOut, updateProfile
} from 'firebase/auth';
import {
  collection, connectFirestoreEmulator, deleteDoc, doc, getDoc, getFirestore, query,
  setDoc, serverTimestamp, updateDoc, writeBatch
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
  normalizeWorkspace: State.normalizeWorkspace,
  migrateLegacy: State.migrateLegacy,
  makeWorkspace: State.makeWorkspace,
  clone: State.clone
});
const users = new Map();
let capturedWorkspace = null;

async function verifyEmail(user) {
  if (user.emailVerified) return user;
  const token = await user.getIdToken();
  const response = await fetch(`${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:update?key=${CONFIG.apiKey}`, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({idToken: token, emailVerified: true, returnSecureToken: true})
  });
  if (!response.ok) throw new Error('The Auth Emulator could not verify the synthetic test account.');
  await user.reload();
  await user.getIdToken(true);
  return user;
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
  const user = await verifyEmail(credential.user);
  users.set(role, {uid: user.uid, email: account.email});
  return user;
}

async function writeProfile(role, workspaceIds = [FIXTURE.workspaceId]) {
  const user = auth.currentUser;
  if (!user) throw new Error('Synthetic profile write requires an authenticated emulator user.');
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    emailLower: user.email.toLowerCase(),
    displayName: user.displayName || `${role} emulator user`,
    workspaceIds
  }, {merge: true});
}

async function seedFixture() {
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
  await bootstrap.commit();
  const members = writeBatch(db);
  members.set(doc(root, 'members', editor.uid), {uid: editor.uid, role: 'editor', emailLower: editor.email.toLowerCase(), displayName: 'Editor emulator user'});
  members.set(doc(root, 'members', viewer.uid), {uid: viewer.uid, role: 'viewer', emailLower: viewer.email.toLowerCase(), displayName: 'Viewer emulator user'});
  await members.commit();
  const records = writeBatch(db);
  records.set(doc(root, 'boards', FIXTURE.boardId), {
    id: FIXTURE.boardId, title: 'Emulator board', rank: 0, revision: 0,
    clientMutationId: 'seed-board-mutation-0001', updatedAt: serverTimestamp()
  });
  records.set(doc(root, 'boards', FIXTURE.boardId, 'lists', FIXTURE.listId), {
    id: FIXTURE.listId, title: 'Doing', rank: 0, revision: 0,
    clientMutationId: 'seed-list-mutation-0001', updatedAt: serverTimestamp()
  });
  records.set(doc(root, 'boards', FIXTURE.boardId, 'lists', FIXTURE.secondListId), {
    id: FIXTURE.secondListId, title: 'Review', rank: 1, revision: 0,
    clientMutationId: 'seed-list-mutation-0002', updatedAt: serverTimestamp()
  });
  records.set(doc(root, 'boards', FIXTURE.boardId, 'cards', FIXTURE.cardId), {
    id: FIXTURE.cardId, listId: FIXTURE.listId, title: 'Synthetic shared card', description: 'Emulator-only card',
    rank: 0, assigneeUids: [editor.uid], labels: [], dueDate: '', checklist: [], archived: false,
    revision: 0, clientMutationId: 'seed-card-mutation-0001', updatedAt: serverTimestamp()
  });
  await records.commit();
  await writeProfile('owner');
  await signInRole('editor'); await writeProfile('editor');
  await signInRole('viewer'); await writeProfile('viewer');
  await signInRole('owner');
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
  async seedFixture() { return seedFixture(); },
  async signInRole(role) { return {uid: (await signInRole(role)).uid}; },
  async captureWorkspace() { capturedWorkspace = await workspaceFor(); return {revision: cardFor(capturedWorkspace)?.revision ?? -1}; },
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
  }
};

await bootstrapFlowboard({
  cloudConfig: CONFIG,
  cloudConfigured: true,
  cloudStatus: {configured: true, provider: 'firebase', message: 'Synthetic Firebase Emulator workflow.'},
  localAdapter,
  cloudAdapter,
  CloudNotConfiguredError
});
window.__flowboardEmulatorTest = testApi;
const initialRole = new URLSearchParams(location.search).get('role');
if (initialRole) await signInRole(initialRole);
window.__flowboardEmulatorTest.ready = true;
