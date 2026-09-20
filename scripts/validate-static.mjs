import {readFile} from 'node:fs/promises';

const [html, app, core, main, runtimeBootstrap, contract, localAdapter, firebaseAdapter, cloudAdapter, migrationAdapter, deletionAdapter, lifecycleAdapter, authUI, cloudUI, legacyImportUI, lifecycleUI, inviteUI, membersUI, cloudSync, activityUI, assignmentUI, commentsUI, rules] = await Promise.all([
  'index.html', 'app.js', 'state-core.js', 'src/main.js', 'src/runtime-bootstrap.js', 'src/adapters/adapter-contract.js', 'src/adapters/local-workspace-adapter.js',
  'src/adapters/firebase-workspace-adapter.js', 'src/adapters/firebase-cloud-workspace.js', 'src/adapters/firebase-migration.js', 'src/adapters/firebase-deletion.js', 'src/adapters/firebase-workspace-lifecycle.js',
  'src/auth-ui.js', 'src/cloud-workspace-ui.js', 'src/legacy-import-ui.js', 'src/workspace-lifecycle-ui.js', 'src/invite-ui.js', 'src/members-ui.js', 'src/cloud-sync-controller.js', 'src/activity-ui.js', 'src/assignment-ui.js', 'src/comments-ui.js', 'firestore.rules'
].map(file => readFile(file, 'utf8')));

const required = [
  ['semantic main landmark', /<main\b/],
  ['primary heading', /<h1\b/],
  ['skip link', /href="#board"/],
  ['live status region', /role="status"/],
  ['native dialogs', /<dialog\b/],
  ['Vite module entry', /type="module"\s+src="\/src\/main\.js"/],
  ['honest cloud status', /id="cloud-status"/],
  ['Google account dialog', /id="account-dialog"/],
  ['unified My workspace dialog', /id="workspace-dialog"/],
  ['explicit browser-data non-mutation notice', /Browser-only legacy data stays on this device and is not imported into your boards\./]
];
for (const [label, pattern] of required) if (!pattern.test(html)) throw new Error(`Static validation failed: missing ${label}.`);
const retiredDom = ['open-cloud-recovery', 'open-cloud-migration', 'cloud-migration-dialog', 'legacy-spaces-section', 'legacy-spaces-list', 'migrate-cloud-workspace', 'export-cloud-workspace'];
for (const token of retiredDom) if (html.includes(`id="${token}"`)) throw new Error(`Static validation failed: retired DOM selector remains: ${token}.`);
for (const copy of ['Data recovery', 'Review legacy browser data', 'Older data is available in Data recovery']) if (html.includes(copy)) throw new Error(`Static validation failed: retired visible copy remains: ${copy}.`);
if (cloudUI.includes('open-cloud-recovery') || cloudUI.includes('open-cloud-migration') || cloudUI.includes('legacy-spaces-section') || cloudUI.includes('Data recovery')) throw new Error('Static validation failed: cloud UI still owns a retired recovery route.');

if (!app.includes('FlowboardState.cardMatches') || !app.includes('FlowboardState.csvForBoard')) throw new Error('App does not use tested state helpers.');
if (app.includes('localStorage.')) throw new Error('App bypasses the local workspace adapter.');
if (!app.includes('FlowboardRuntime?.localAdapter')) throw new Error('App does not use the local workspace adapter.');
if (html.includes('id="collaboration-button"') || html.includes('id="collaboration-dialog"') || app.includes('showCollaboration') || app.includes('saveCollaboration') || app.includes('collaborationDraft')) throw new Error('Obsolete local collaboration planner remains wired into the application.');
if (contract.includes("'applyMutation'") || contract.includes("'createWorkspace'") || contract.includes("'inviteMember'") || contract.includes("'exportRemoteWorkspace'") || firebaseAdapter.includes('applyMutation') || cloudAdapter.includes('export async function applyCloudMutation')) throw new Error('Obsolete cloud adapter mutation surface remains exposed.');
if (!runtimeBootstrap.includes('Object.freeze({cloudStatus, localAdapter, cloudAdapter, canvasPalettes:CANVAS_PALETTES, applyCanvasPalette})') || runtimeBootstrap.includes('CloudNotConfiguredError') || /\{cloudConfig(?:[,}])/.test(runtimeBootstrap)) throw new Error('Runtime bootstrap exposes an obsolete or sensitive property.');
if (!core.includes('module.exports')) throw new Error('State helpers are not testable in Node.');
if (!main.includes('createLocalWorkspaceAdapter') || !localAdapter.includes('inspectLegacyWorkspace') || localAdapter.includes('loadWorkspace()')) throw new Error('Inert legacy recovery adapter boundary is incomplete.');
if (!main.includes('createFirebaseWorkspaceAdapter') || !firebaseAdapter.includes('signInWithPopup')) throw new Error('Firebase Authentication boundary is incomplete.');
if (!authUI.includes('Browser-only data was not changed') || !html.includes('Browser-only legacy data stays on this device and is not imported into your boards.')) throw new Error('Authentication UI lacks browser-data safety handling.');
if (!cloudAdapter.includes('firebase-migration.js') || !migrationAdapter.includes('getDocFromServer') || !migrationAdapter.includes('getDocsFromServer') || !migrationAdapter.includes('importLegacyWorkspace') || !migrationAdapter.includes('exportCloudBackup') || !migrationAdapter.includes('groups=(values,size=4)') || !migrationAdapter.includes('alreadyMigrated')) throw new Error('Verified cloud migration adapter is incomplete, unbounded, or not safely retryable.');
if (!lifecycleAdapter.includes('firebase-deletion.js') || !deletionAdapter.includes('preflightDeletion') || !deletionAdapter.includes('resumeDeletion') || !deletionAdapter.includes('getDocFromServer') || !deletionAdapter.includes('getDocsFromServer') || !deletionAdapter.includes("limit(10)") || !deletionAdapter.includes('deletedCards') || !deletionAdapter.includes('deletedLists')) throw new Error('Bounded resumable deletion adapter is incomplete.');
if (!app.includes("'verification-pending'") || !app.includes('contextGeneration') || !app.includes('retryLastCommand') || !app.includes("dialog.returnValue=''")) throw new Error('Awaitable command or reentrant confirmation boundary is incomplete.');
if (!cloudAdapter.includes('orderBy(documentId())') || !cloudAdapter.includes('startAfter(cursor)') || !cloudUI.includes('async function loadMore') || !cloudUI.includes("async function openSpace(space,boardId=''){const request=++generation") || html.includes('cloud-workspaces-dialog') || html.includes('return-to-local-workspace')) throw new Error('Unified My workspace pagination, stale-request protection, or obsolete-route removal is incomplete.');
if (!firebaseAdapter.includes('firebase-workspace-lifecycle.js') || !firebaseAdapter.includes('renameWorkspace') || !firebaseAdapter.includes('archiveWorkspace') || !firebaseAdapter.includes('restoreWorkspace') || !/status:["']archived["']/.test(lifecycleAdapter) || !lifecycleAdapter.includes('archivedByUid:') || !lifecycleAdapter.includes('runTransaction') || !lifecycleAdapter.includes('REVISION_CONFLICT')) throw new Error('Owner workspace lifecycle adapter is incomplete or not revision-safe.');
if (!lifecycleUI.includes('archived') || !lifecycleUI.includes('retained') || !lifecycleUI.includes('will be retained') || lifecycleUI.includes('confirm(')) throw new Error('Workspace lifecycle confirmation safety is incomplete.');
if (!cloudUI.includes('u.append(t,d)') || !lifecycleUI.includes('l.append(x)')) throw new Error('Archived identity and restored Open controls must survive lifecycle refreshes.');
if (cloudUI.includes('legacyUI') || cloudUI.includes('spacesList') || cloudUI.includes('backupWorkspaceId') || cloudUI.includes('migrate-cloud-workspace') || cloudUI.includes('export-cloud-workspace')) throw new Error('Customer cloud UI still contains retired recovery state.');
if (!rules.includes('validWorkspaceOwnerUpdate') || !rules.includes('canReadWorkspaceContent') || !rules.includes('isActiveWorkspace(workspaceId)') || !rules.includes("request.resource.data.status == 'archived'") || !rules.includes('allow delete: if false;')) throw new Error('Workspace lifecycle Rules are incomplete or allow hard deletion.');
if (!legacyImportUI.includes('inspection.backup.content') || !legacyImportUI.includes('The original browser data remains unchanged') || !legacyImportUI.includes('saveLegacyMigrationReceipt')) throw new Error('Legacy import UI lacks exact-backup and receipt safety handling.');
if (!app.includes('openCloudPreview') || !app.includes('normalizeCloudWorkspace') || !app.includes("['cloud','cloud-preview']") || !cloudUI.includes('read-only')) throw new Error('Cloud preview or cloud-only mode boundary is incomplete.');
if (app.includes("activeWorkspace = {kind:'local'}") || /state\s*=\s*loadState\(\)/.test(app) || !app.includes("{kind:'auth-loading'}") || !firebaseAdapter.includes('ensurePersonalWorkspace')) throw new Error('Cloud-first bootstrap must not activate an editable local workspace.');
if (!html.includes('workspace-members-dialog') || !html.includes('workspace-profile-section') || !inviteUI.includes('acceptInvite') || !membersUI.includes('transferOwnership') || !membersUI.includes('updateOwnMemberProfile')) throw new Error('Secure membership administration UI is incomplete.');
if (!firebaseAdapter.includes('updateOwnMemberProfile') || !cloudAdapter.includes('safePhotoURL') || !rules.includes('validOwnMemberProfileUpdate') || !rules.includes('profileUpdatedAt')) throw new Error('Workspace profile-photo authorization boundary is incomplete.');
if (!firebaseAdapter.includes('subscribeWorkspace') || !firebaseAdapter.includes('verifyWorkspaceAccess') || !cloudAdapter.includes('onSnapshot') || !cloudSync.includes("window.addEventListener('offline'") || !cloudSync.includes('start(true)') || !cloudSync.includes('handleCloudAccessRemoved')) throw new Error('Realtime cloud lifecycle boundary is incomplete.');
if (!app.includes("$('#close-card-dialog').disabled = false")) throw new Error('Viewer card dialogs must retain a working visible close button.');
if (!html.includes('cloud-activity-dialog') || !activityUI.includes('listActivity') || !activityUI.includes('pageSize:25') || !activityUI.includes('text.textContent')) throw new Error('Authenticated activity feed is incomplete or unbounded.');
if (!html.includes('cloud-assignees-field') || !app.includes('assigneeUids') || !assignmentUI.includes('listMembers') || !assignmentUI.includes('checked.length>8') || !assignmentUI.includes('text.textContent')) throw new Error('Member-backed cloud assignment controls are incomplete or unsafe.');
if (!html.includes('cloud-comments-section') || !firebaseAdapter.includes('subscribeComments') || !cloudAdapter.includes("limit(safeSize)") || !commentsUI.includes('pageSize:25') || !commentsUI.includes('textContent') || !commentsUI.includes('MutationObserver') || !commentsUI.includes('member.emailLower')) throw new Error('Authenticated card comments are incomplete, unsafe, not active-card scoped, or missing active-member label fallback.');

const workspaceMutationStart = cloudAdapter.indexOf('export async function applyCloudWorkspaceMutation');
const workspaceMutationEnd = cloudAdapter.indexOf('\nexport async function listMembers', workspaceMutationStart);
const workspaceMutation = cloudAdapter.slice(workspaceMutationStart, workspaceMutationEnd);
const readPhase = workspaceMutation.indexOf('await Promise.all(ops.map(item => transaction.get(item.ref)))');
const writePhase = workspaceMutation.indexOf('writes.forEach(write =>');
if (workspaceMutationStart < 0 || workspaceMutationEnd < 0 || readPhase < 0 || writePhase < 0 || readPhase > writePhase || workspaceMutation.slice(writePhase).includes('transaction.get(')) throw new Error('Workspace transactions must complete every document read before the write phase.');
if (!app.includes("removeCloud('card'") || !deletionAdapter.includes('deleteEntity') || !rules.includes('validDeletionJobCreate') || !rules.includes('validBoardPurgeDelete')) throw new Error('Cloud permanent deletion lifecycle guards are incomplete.');
const cloudSources = [firebaseAdapter, cloudAdapter, migrationAdapter, lifecycleAdapter, cloudSync, main].join('\n');
if (/enableIndexedDbPersistence|persistentLocalCache|persistentMultipleTabManager|CACHE_SIZE_UNLIMITED/.test(cloudSources)) throw new Error('Persistent Firestore caching is approval-gated and must remain disabled.');
console.log(`Static validation passed: ${required.length} semantic/runtime guards plus adapter-boundary checks.`);
