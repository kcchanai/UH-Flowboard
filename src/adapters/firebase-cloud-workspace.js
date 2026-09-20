import {granularizeBoard, rehydrateGranularWorkspace} from '../granular-workspace.js';
export {importLegacyWorkspace,exportCloudBackup,migrateWorkspaceToGranular} from './firebase-migration.js';
import {safePhotoURL} from '../person-badges.js';
import {
  arrayRemove, arrayUnion, collection, deleteDoc, doc, documentId, getDoc, getDocFromServer, getDocs, getDocsFromServer, getFirestore, limit, onSnapshot, orderBy, query, where,
  runTransaction, serverTimestamp, startAfter, Timestamp, updateDoc, writeBatch
} from 'firebase/firestore';

const requireUser = auth => {
  if (!auth.currentUser) throw Object.assign(new Error('Sign in required.'), {code:'AUTH_REQUIRED'});
  return auth.currentUser;
};
const context = (app, auth) => ({db:getFirestore(app), user:requireUser(auth)});
const pageSizeOf = value => Math.min(Math.max(Number.isInteger(value) ? value : 25, 1), 25);

const normalizeEmail = value => String(value || '').trim().toLowerCase();
const staged=(stage,run)=>run().catch(error=>{error.stage=stage;throw error;});
const randomId = () => {
  const values = new Uint8Array(16); crypto.getRandomValues(values);
  return btoa(String.fromCharCode(...values)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export async function ensurePersonalWorkspace(app,auth,{recover=false}={}){
  const user=requireUser(auth),token=await user.getIdTokenResult(true);if(user.emailVerified!==true&&token.claims.email_verified!==true)throw Object.assign(new Error('Verify your email first.'),{code:'EMAIL_NOT_VERIFIED'});
  const db=getFirestore(app),profileRef=doc(db,'users',user.uid),candidate=randomId(),emailLower=normalizeEmail(user.email),decision=await runTransaction(db,async transaction=>{const profile=await transaction.get(profileRef),data=profile.data()||{},pointer=typeof data.personalWorkspaceId==='string'?data.personalWorkspaceId:'';if(pointer&&!recover)return{state:'existing',workspaceId:pointer};if(pointer){const[workspace,membership]=await Promise.all([transaction.get(doc(db,'workspaces',pointer)),transaction.get(doc(db,'workspaces',pointer,'members',user.uid))]),d=workspace.data()||{};if(workspace.exists()&&membership.exists()&&d.ownerUid===user.uid&&d.personal===true&&d.status==='ready'&&d.migration?.state==='verified'&&membership.data().role==='owner')return{state:'existing',workspaceId:pointer};}const workspaceRef=doc(db,'workspaces',candidate),memberRef=doc(workspaceRef,'members',user.uid);transaction.set(workspaceRef,{name:'My workspace',ownerUid:user.uid,schemaVersion:5,status:'ready',personal:true,lifecycleRevision:0,activeBoardId:'',migration:{version:1,state:'verified',counts:{boards:0,lists:0,cards:0}},createdAt:serverTimestamp(),updatedAt:serverTimestamp()});transaction.set(memberRef,{uid:user.uid,role:'owner',emailLower});transaction.set(profileRef,{uid:user.uid,emailLower,workspaceIds:pointer?arrayUnion(pointer,candidate):arrayUnion(candidate),personalWorkspaceId:candidate},{merge:true});return{state:pointer?'recovered':'created',workspaceId:candidate};});try{const [workspace,membership]=await Promise.all([getDocFromServer(doc(db,'workspaces',decision.workspaceId)),getDocFromServer(doc(db,'workspaces',decision.workspaceId,'members',user.uid))]),data=workspace.data()||{};if(workspace.exists()&&membership.exists()&&data.ownerUid===user.uid&&data.personal===true&&data.status==='ready'&&data.migration?.state==='verified'&&membership.data().role==='owner')return{...decision,entry:{id:workspace.id,...data,role:'owner'}};}catch{}return{state:'needs-recovery',workspaceId:decision.workspaceId};
}

export async function listCloudWorkspaces(app, auth) {
  const {db,user}=context(app,auth);
  const userSnapshot = await getDoc(doc(db, 'users', user.uid));
  const ids = [...new Set(userSnapshot.data()?.workspaceIds || [])].filter(id => typeof id === 'string' && id).slice(0, 100);
  const results = await Promise.allSettled(ids.map(async id => {
    const [workspace, membership] = await Promise.all([
      getDoc(doc(db, 'workspaces', id)), getDoc(doc(db, 'workspaces', id, 'members', user.uid))
    ]);
    return workspace.exists() && membership.exists() ? {id:workspace.id, ...workspace.data(), role:membership.data().role} : null;
  }));
  return results.flatMap(result => result.status === 'fulfilled' && result.value ? [result.value] : []);
}

export async function listBoardDirectory(app, auth, {workspaceId='',cursor='',pageSize=25}={}) {
  const spaces=await listCloudWorkspaces(app,auth),db=getFirestore(app);
  const selected=workspaceId?spaces.filter(space=>space.id===workspaceId):spaces,safeSize=Math.min(Math.max(Number.isInteger(pageSize)?pageSize:25,1),100);
  const results=await Promise.allSettled(selected.map(async space=>{
    if(space.status==='archived'||space.migration?.state!=='verified')return{...space,boards:[],hasMore:false};
    const constraints=[where('lifecycleState','==','active')];if(space.role!=='owner')constraints.push(where('archived','==',false));constraints.push(orderBy(documentId()));if(cursor)constraints.push(startAfter(cursor));constraints.push(limit(safeSize+1));const page=await getDocsFromServer(query(collection(db,'workspaces',space.id,'boards'),...constraints)),visible=page.docs.slice(0,safeSize),boards=visible.map(item=>{const data=item.data();return{id:item.id,title:String(data.title||'Untitled board'),rank:data.rank??0,archived:Boolean(data.archived),revision:data.revision??0};}).sort((a,b)=>a.rank-b.rank||a.title.localeCompare(b.title));
    return{...space,boards,cursor:visible.at(-1)?.id||'',hasMore:page.size>safeSize};
  }));
  return results.flatMap((result,index)=>result.status==='fulfilled'?[result.value]:[{...selected[index],boards:[],cursor:'',hasMore:false,unavailable:true}]);
}

export async function setBoardArchived(app,auth,{workspaceId,boardId,expectedRevision,archived}){const {db,user}=context(app,auth),ref=doc(db,'workspaces',workspaceId,'boards',boardId),current=await getDocFromServer(ref);if(!current.exists())throw Object.assign(new Error('Board unavailable.'),{code:'BOARD_UNAVAILABLE'});const data=current.data();if((data.revision??0)!==expectedRevision)throw Object.assign(new Error('Revision conflict.'),{code:'REVISION_CONFLICT'});const clientMutationId=randomId();await updateDoc(ref,{archived:Boolean(archived),archivedAt:archived?serverTimestamp():null,archivedByUid:archived?user.uid:null,revision:expectedRevision+1,clientMutationId,updatedAt:serverTimestamp()});const verified=await getDocFromServer(ref);if(!verified.exists()||Boolean(verified.data().archived)!==Boolean(archived))throw Object.assign(new Error('Verification pending.'),{code:'VERIFICATION_PENDING'});return{id:verified.id,revision:verified.data().revision,archived:Boolean(verified.data().archived)};}

export async function fetchCloudWorkspace(app, auth, workspaceId, {serverOnly=false}={}) {
  const {db}=context(app,auth);
  const readDoc=serverOnly?getDocFromServer:getDoc,readDocs=serverOnly?getDocsFromServer:getDocs,readQuery=(stage,target)=>staged(stage,()=>readDocs(target)),metadata = await staged('workspace-root',()=>readDoc(doc(db, 'workspaces', workspaceId)));
  if (!metadata.exists()) throw Object.assign(new Error('Workspace missing.'), {code:'WORKSPACE_NOT_FOUND'});
  const boards = await readQuery('boards-query',query(collection(db, 'workspaces', workspaceId, 'boards'), where('lifecycleState', '==', 'active'), where('archived', '==', false)));
  const workspace = {...metadata.data(), id:workspaceId};
  const visibleBoards=boards.docs.filter(item=>!item.data().archived);
  if (workspace.migration?.state !== 'verified') return {...workspace, boards:visibleBoards.map(item => item.data().snapshot)};
  const records = await Promise.all(visibleBoards.map(async item => {
    const lists=await readQuery('lists-query',query(collection(item.ref, 'lists'),where('lifecycleState','==','active')));
    const cardPages=await Promise.all(lists.docs.map(list=>readQuery('cards-query',query(collection(item.ref,'cards'),where('listId','==',list.id),where('lifecycleState','==','active')))));
    return {board:{id:item.id, ...item.data()},lists:lists.docs.map(doc=>({id:doc.id,...doc.data()})),cards:cardPages.flatMap(page=>page.docs.map(doc=>({id:doc.id,...doc.data()})))};
  }));
  return rehydrateGranularWorkspace(workspace, records);
}

export async function listWorkspaceActivity(app, auth, workspaceId, {cursor = null, pageSize = 25} = {}) {
  const {db}=context(app,auth);
  const safeSize = pageSizeOf(pageSize);
  const constraints = [orderBy('createdAt', 'desc'), limit(safeSize)];
  if (cursor) constraints.splice(1, 0, startAfter(cursor));
  const snapshot = await getDocs(query(collection(db, 'workspaces', workspaceId, 'activity'), ...constraints));
  return {entries:snapshot.docs.map(item => ({id:item.id, ...item.data()})), cursor:snapshot.docs.at(-1) || null, hasMore:snapshot.size === safeSize};
}

export function subscribeCardComments(app, auth, {workspaceId, boardId, cardId, pageSize = 25, onComments, onError}) {
  const {db}=context(app,auth);
  const safeSize = pageSizeOf(pageSize);
  const reference = query(collection(db, 'workspaces', workspaceId, 'boards', boardId, 'cards', cardId, 'comments'), orderBy('createdAt', 'desc'), limit(safeSize));
  return onSnapshot(reference, snapshot => onComments?.({entries:snapshot.docs.map(item => ({id:item.id, ...item.data()})), cursor:snapshot.docs.at(-1) || null, hasMore:snapshot.size === safeSize}), onError);
}

export async function listOlderCardComments(app, auth, {workspaceId, boardId, cardId, cursor, pageSize = 25}) {
  const {db}=context(app,auth);
  const safeSize = pageSizeOf(pageSize);
  const constraints = [orderBy('createdAt', 'desc')];
  if (cursor) constraints.push(startAfter(cursor));
  constraints.push(limit(safeSize));
  const snapshot = await getDocs(query(collection(db, 'workspaces', workspaceId, 'boards', boardId, 'cards', cardId, 'comments'), ...constraints));
  return {entries:snapshot.docs.map(item => ({id:item.id, ...item.data()})), cursor:snapshot.docs.at(-1) || null, hasMore:snapshot.size === safeSize};
}


const commentRefs = (db, workspaceId, boardId, cardId, commentId, mutationId) => ({
  comment:doc(db, 'workspaces', workspaceId, 'boards', boardId, 'cards', cardId, 'comments', commentId),
  activity:doc(db, 'workspaces', workspaceId, 'activity', mutationId)
});
const commentActivity = (user, action, boardId, mutationId) => ({actorUid:user.uid, action, boardId, clientMutationId:mutationId, createdAt:serverTimestamp()});

export async function createCardComment(app, auth, {workspaceId, boardId, cardId, body}) {
  const {db,user}=context(app,auth), commentId = randomId(), cleanBody = String(body || '').trim();
  if (!cleanBody || cleanBody.length > 2000) throw Object.assign(new Error('Enter a shorter comment.'), {code:'INVALID_COMMENT'});
  const refs = commentRefs(db, workspaceId, boardId, cardId, commentId, commentId), batch = writeBatch(db);
  batch.set(refs.comment, {authorUid:user.uid, body:cleanBody, createdAt:serverTimestamp(), updatedAt:serverTimestamp(), deletedAt:null, revision:0, clientMutationId:commentId});
  batch.set(refs.activity, commentActivity(user, 'comment-created', boardId, commentId));
  await batch.commit(); return commentId;
}

async function changeCardComment(app, auth, {workspaceId, boardId, cardId, commentId, revision, body, remove = false}) {
  const {db,user}=context(app,auth), mutationId = randomId(), cleanBody = String(body || '').trim();
  if (!remove && (!cleanBody || cleanBody.length > 2000)) throw Object.assign(new Error('Enter a shorter comment.'), {code:'INVALID_COMMENT'});
  if (!Number.isInteger(revision) || revision < 0) throw Object.assign(new Error('Invalid comment revision.'), {code:'INVALID_COMMENT'});
  const refs = commentRefs(db, workspaceId, boardId, cardId, commentId, mutationId);
  await runTransaction(db, async transaction => {
    const current = await transaction.get(refs.comment);
    if (!current.exists() || current.data().deletedAt) throw Object.assign(new Error('Comment unavailable.'), {code:'COMMENT_UNAVAILABLE'});
    if ((current.data().revision ?? 0) !== revision) throw Object.assign(new Error('Comment changed. Reopen it.'), {code:'REVISION_CONFLICT'});
    transaction.update(refs.comment, {body:remove ? '' : cleanBody, deletedAt:remove ? serverTimestamp() : null, updatedAt:serverTimestamp(), revision:revision + 1, clientMutationId:mutationId});
    transaction.set(refs.activity, commentActivity(user, remove ? 'comment-deleted' : 'comment-updated', boardId, mutationId));
  });
}

export const updateCardComment = (app, auth, options) => changeCardComment(app, auth, options);
export const removeCardComment = (app, auth, options) => changeCardComment(app, auth, {...options, remove:true});

export function subscribeCloudWorkspace(app, auth, {workspaceId, boardId, onWorkspace, onBoard, onMembership, onStatus, onError}) {
  const {db,user}=context(app,auth), snapshots={board:null,lists:null}, cardSnapshots=new Map();
  let stopped=false,unsubscribers=[],cardUnsubscribers=[],cardGeneration=0;
  const stopCards=()=>{cardGeneration+=1;cardUnsubscribers.splice(0).forEach(unsubscribe=>unsubscribe());cardSnapshots.clear();};
  const stop=()=>{if(stopped)return;stopped=true;stopCards();unsubscribers.splice(0).forEach(unsubscribe=>unsubscribe());};
  const fail=error=>{if(stopped)return;stop();onError?.(error);};
  const emitBoard=()=>{if(stopped||!snapshots.board||!snapshots.lists||cardSnapshots.size!==Math.ceil(snapshots.lists.size/30))return;if(!snapshots.board.exists())return fail(Object.assign(new Error('Board unavailable.'),{code:'BOARD_NOT_FOUND'}));const board={id:snapshots.board.id,...snapshots.board.data()},lists=snapshots.lists.docs.map(item=>({id:item.id,...item.data()})),pages=[...cardSnapshots.values()],cards=pages.flatMap(page=>page.docs.map(item=>({id:item.id,...item.data()}))),all=[snapshots.board,snapshots.lists,...pages];onBoard?.({board,lists,cards});onStatus?.(all.some(item=>item.metadata.hasPendingWrites)?'saving':all.some(item=>item.metadata.fromCache)?'offline':'synced');};
  const options={includeMetadataChanges:true},watch=(reference,next)=>onSnapshot(reference,options,next,fail),cards=collection(db,'workspaces',workspaceId,'boards',boardId,'cards');
  const watchCards=listSnapshot=>{stopCards();snapshots.lists=listSnapshot;const ids=listSnapshot.docs.map(item=>item.id),generation=cardGeneration;if(!ids.length)return emitBoard();for(let index=0;index<ids.length;index+=30){const group=ids.slice(index,index+30),key=group.join('|');cardUnsubscribers.push(watch(query(cards,where('listId','in',group),where('lifecycleState','==','active')),snapshot=>{if(generation!==cardGeneration)return;cardSnapshots.set(key,snapshot);emitBoard();}));}};
  unsubscribers=[
    watch(doc(db,'workspaces',workspaceId),snapshot=>{if(!snapshot.exists())return fail(Object.assign(new Error('Access removed.'),{code:'ACCESS_REMOVED'}));onWorkspace?.(snapshot.data());}),
    watch(doc(db,'workspaces',workspaceId,'members',user.uid),snapshot=>{if(!snapshot.exists())return fail(Object.assign(new Error('Access removed.'),{code:'ACCESS_REMOVED'}));onMembership?.(snapshot.data().role);}),
    watch(doc(db,'workspaces',workspaceId,'boards',boardId),snapshot=>{snapshots.board=snapshot;emitBoard();}),
    watch(query(collection(db,'workspaces',workspaceId,'boards',boardId,'lists'),where('lifecycleState','==','active')),watchCards)
  ];
  return stop;
}

export async function verifyWorkspaceAccess(app, auth, workspaceId) {
  const {db,user}=context(app,auth);
  const membership = await getDoc(doc(db, 'workspaces', workspaceId, 'members', user.uid));
  if (!membership.exists()) throw Object.assign(new Error('Access removed.'), {code:'ACCESS_REMOVED'});
  return membership.data().role;
}



const comparable = value => JSON.stringify(value, (key, item) => ['revision', 'clientMutationId', 'updatedAt'].includes(key) ? undefined : item);
const granularDocuments = workspace => {
  const documents = new Map();
  (workspace.boards || []).forEach((snapshot, boardRank) => {
    const board = granularizeBoard(snapshot, boardRank);
    documents.set(`boards/${board.board.id}`, {data:board.board});
    board.lists.forEach(list => documents.set(`boards/${board.board.id}/lists/${list.id}`, {data:list}));
    board.cards.forEach(card => documents.set(`boards/${board.board.id}/cards/${card.id}`, {data:card}));
  });
  return documents;
};

export async function applyCloudWorkspaceMutation(app, auth, {workspaceId, before, next, clientMutationId, activityAction = null}) {
  const {db,user}=context(app,auth);
  const allowedActivityActions = ['board-created','board-updated','card-created','card-updated','card-moved','card-assigned','list-created','list-updated','workspace-updated'];
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(clientMutationId || '') || !before || !next) throw Object.assign(new Error('Invalid cloud edit.'), {code:'INVALID_MUTATION'});
  const previous = granularDocuments(before), desired = granularDocuments(next);
  const paths = [...new Set([...previous.keys(), ...desired.keys()])].filter(path => comparable(previous.get(path)?.data) !== comparable(desired.get(path)?.data));
  if (paths.length > 300) throw Object.assign(new Error('Cloud edit too large.'), {code:'MUTATION_TOO_LARGE'});
  if (!paths.length) return fetchCloudWorkspace(app, auth, workspaceId);
  const activityPath = paths.find(path => path.includes('/cards/')) || paths.find(path => path.includes('/lists/')) || paths[0];
  const activityPrior = previous.get(activityPath), activityTarget = desired.get(activityPath);
  if (!activityAction) {
    if (activityPath.includes('/cards/')) activityAction = !activityPrior && activityTarget ? 'card-created' : activityPrior && activityTarget && activityPrior.data.listId !== activityTarget.data.listId ? 'card-moved' : activityPrior && activityTarget && comparable(activityPrior.data.assigneeUids || []) !== comparable(activityTarget.data.assigneeUids || []) ? 'card-assigned' : 'card-updated';
    else if (activityPath.includes('/lists/')) activityAction = !activityPrior && activityTarget ? 'list-created' : 'list-updated';
    else if (activityPath.startsWith('boards/')) activityAction = !activityPrior && activityTarget ? 'board-created' : 'board-updated';
    else activityAction = 'workspace-updated';
  }
  if (!allowedActivityActions.includes(activityAction)) throw Object.assign(new Error('Invalid activity.'), {code:'INVALID_MUTATION'});
  const activityRef = doc(db, 'workspaces', workspaceId, 'activity', clientMutationId);
  await runTransaction(db, async transaction => {
    const ops = paths.map(path => ({prior:previous.get(path), target:desired.get(path), ref:doc(db, 'workspaces', workspaceId, ...path.split('/'))}));
    const activity = await transaction.get(activityRef);
    const docs = await Promise.all(ops.map(item => transaction.get(item.ref)));
    if (activity.exists() && activity.data().clientMutationId !== clientMutationId) throw Object.assign(new Error('Activity ID unavailable.'), {code:'ACTIVITY_IDENTIFIER_CONFLICT'});
    const writes = ops.map((item, index) => {
      const {prior, target, ref} = item, cur = docs[index], rev = prior?.data.revision ?? 0;
      if (target && cur.exists() && cur.data().clientMutationId === clientMutationId && (cur.data().revision ?? 0) === (prior ? rev + 1 : 0)) return null;
      if (!target && !cur.exists() && prior && activity.exists()) return null;
      if (!cur.exists() && prior) throw Object.assign(new Error('Cloud item missing.'), {code:'REVISION_CONFLICT'});
      if (cur.exists() && (cur.data().revision ?? 0) !== rev) throw Object.assign(new Error('Revision conflict. Reload.'), {code:'REVISION_CONFLICT'});
      if (!target) return {kind:'delete', ref};
      const data = {...target.data};
      delete data.revision; delete data.clientMutationId; delete data.updatedAt;
      if (cur.exists()) { delete data.createdAt; return {kind:'update', ref, data:{...data, revision:rev + 1, clientMutationId, updatedAt:serverTimestamp()}}; }
      return {kind:'set', ref, data:{...data, revision:0, clientMutationId, updatedAt:serverTimestamp()}};
    });
    writes.forEach(write => { if (!write) return; if (write.kind === 'delete') transaction.delete(write.ref); else if (write.kind === 'update') transaction.update(write.ref, write.data); else transaction.set(write.ref, write.data); });
    if (!activity.exists()) transaction.set(activityRef, {actorUid:user.uid, action:activityAction, boardId:next.activeBoardId || '', clientMutationId, createdAt:serverTimestamp()});
  });
  try{return await fetchCloudWorkspace(app,auth,workspaceId,{serverOnly:true});}catch(error){throw Object.assign(new Error('Verification pending.'),{code:'VERIFICATION_PENDING',cause:error});}
}



export async function listMembers(app, auth, workspaceId) {
  const {db}=context(app,auth);
  const snapshots = await getDocs(collection(db, 'workspaces', workspaceId, 'members'));
  return snapshots.docs.map(item => ({id:item.id, ...item.data()}));
}
export async function updateOwnMemberProfile(app, auth, workspaceId, {displayName = '', photoURL = ''} = {}) {
  const {db,user}=context(app,auth), cleanName=String(displayName || '').trim().slice(0,120), cleanPhoto=String(photoURL || '').trim();
  if (cleanName.length > 120 || cleanPhoto && !safePhotoURL(cleanPhoto)) throw Object.assign(new Error('Invalid profile.'), {code:'INVALID_MEMBER_PROFILE'});
  await updateDoc(doc(db, 'workspaces', workspaceId, 'members', user.uid), {displayName:cleanName, photoURL:cleanPhoto, profileUpdatedAt:serverTimestamp()});
}

export async function listInvites(app, auth, workspaceId) {
  const {db}=context(app,auth);
  const snapshots = await getDocs(collection(db, 'workspaces', workspaceId, 'invites'));
  return snapshots.docs.map(item => ({id:item.id, ...item.data()}));
}

export async function createInvite(app, auth, {workspaceId, email, role, baseUrl}) {
  const {db,user}=context(app,auth), emailLower = normalizeEmail(email);
  if (!user.emailVerified) throw Object.assign(new Error('Verify your email first.'), {code:'EMAIL_NOT_VERIFIED'});
  if (!/^\S+@\S+\.\S+$/.test(emailLower)) throw Object.assign(new Error('Enter a valid email.'), {code:'INVALID_EMAIL'});
  if (!['editor', 'viewer'].includes(role)) throw Object.assign(new Error('Choose editor or viewer.'), {code:'INVALID_ROLE'});
  const inviteId = randomId(), expiresAt = Timestamp.fromMillis(Date.now() + 7 * 86_400_000);
  await writeBatch(db).set(doc(db, 'workspaces', workspaceId, 'invites', inviteId), {
    emailLower, role, createdBy:user.uid, createdAt:serverTimestamp(), expiresAt, revokedAt:null, acceptedAt:null, acceptedBy:null
  }).commit();
  const url = new URL(baseUrl); url.searchParams.set('workspace', workspaceId); url.searchParams.set('invite', inviteId);
  return {inviteId, emailLower, role, expiresAt, url:url.toString()};
}

export async function revokeInvite(app, auth, workspaceId, inviteId) {
  const {db}=context(app,auth);
  await updateDoc(doc(db, 'workspaces', workspaceId, 'invites', inviteId), {revokedAt:serverTimestamp()});
}

export async function acceptInvite(app, auth, {workspaceId, inviteId}) {
  const {db,user}=context(app,auth);
  if (!user.emailVerified) throw Object.assign(new Error('Verify your email first.'), {code:'EMAIL_NOT_VERIFIED'});
  const invite = await getDoc(doc(db, 'workspaces', workspaceId, 'invites', inviteId));
  if (!invite.exists()) throw Object.assign(new Error('Invitation unavailable.'), {code:'INVITE_UNAVAILABLE'});
  const data = invite.data(), batch = writeBatch(db), emailLower = normalizeEmail(user.email);
  batch.set(doc(db, 'workspaces', workspaceId, 'members', user.uid), {uid:user.uid, role:data.role, emailLower, inviteId});
  batch.update(invite.ref, {acceptedAt:serverTimestamp(), acceptedBy:user.uid});
  batch.set(doc(db, 'users', user.uid), {uid:user.uid, emailLower, workspaceIds:arrayUnion(workspaceId)}, {merge:true});
  await batch.commit();
}

export async function changeMemberRole(app, auth, workspaceId, uid, role) {
  if (!['editor', 'viewer'].includes(role)) throw Object.assign(new Error('Choose editor or viewer.'), {code:'INVALID_ROLE'});
  const {db}=context(app,auth);
  await updateDoc(doc(db, 'workspaces', workspaceId, 'members', uid), {role});
}
export async function removeMember(app, auth, workspaceId, uid) { const {db}=context(app,auth); await deleteDoc(doc(db, 'workspaces', workspaceId, 'members', uid)); }
export async function leaveWorkspace(app, auth, workspaceId) {
  const {db,user}=context(app,auth), batch = writeBatch(db);
  batch.delete(doc(db, 'workspaces', workspaceId, 'members', user.uid));
  batch.set(doc(db, 'users', user.uid), {workspaceIds:arrayRemove(workspaceId)}, {merge:true});
  await batch.commit();
}
export async function transferOwnership(app, auth, {workspaceId, successorUid, formerOwnerRole = 'editor'}) {
  if (!['editor', 'viewer'].includes(formerOwnerRole)) throw Object.assign(new Error('Choose a former-owner role.'), {code:'INVALID_ROLE'});
  const {db,user}=context(app,auth), batch = writeBatch(db), workspace = doc(db, 'workspaces', workspaceId);
  batch.update(workspace, {ownerUid:successorUid, updatedAt:serverTimestamp()});
  batch.update(doc(db, 'workspaces', workspaceId, 'members', user.uid), {role:formerOwnerRole});
  batch.update(doc(db, 'workspaces', workspaceId, 'members', successorUid), {role:'owner'});
  await batch.commit();
}
