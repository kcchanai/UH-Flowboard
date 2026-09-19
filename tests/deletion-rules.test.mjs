import test, {after, before} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {assertFails, assertSucceeds, initializeTestEnvironment} from '@firebase/rules-unit-testing';
import {
  collection, deleteDoc, doc, getDoc, getDocs, limit, query, serverTimestamp,
  setDoc, Timestamp, updateDoc, writeBatch
} from 'firebase/firestore';

const projectId = 'demo-flowboard-rules';
let env;

before(async () => {
  env = await initializeTestEnvironment({projectId, firestore:{rules:await readFile('firestore.rules','utf8')}});
});
after(async () => env?.cleanup());

const dbFor = uid => env.authenticatedContext(uid, {email:`${uid}@example.com`, email_verified:true}).firestore();
const ids = suffix => ({
  workspaceId:`delete-${suffix}`, boardId:`board-${suffix}`, owner:`owner-${suffix}`,
  editor:`editor-${suffix}`, viewer:`viewer-${suffix}`
});
const mid = prefix => `${prefix}-operation-0001`;

async function seedFixture(suffix, {commentCount = 1, secondList = false, snapshot = false} = {}) {
  const value=ids(suffix), {workspaceId,boardId,owner,editor,viewer}=value;
  await env.withSecurityRulesDisabled(async context => {
    const db=context.firestore(), now=Timestamp.now();
    await setDoc(doc(db,'workspaces',workspaceId),{name:`Fixture ${suffix}`,ownerUid:owner,schemaVersion:5,status:'ready'});
    for (const [uid,role] of [[owner,'owner'],[editor,'editor'],[viewer,'viewer']]) {
      await setDoc(doc(db,'workspaces',workspaceId,'members',uid),{uid,role,emailLower:`${uid}@example.com`});
    }
    const board={id:boardId,title:`Board ${suffix}`,rank:0,archived:false,lifecycleState:'active',revision:0,clientMutationId:`${suffix}-board-seed-0001`,updatedAt:now};
    if(snapshot) board.snapshot={id:boardId,title:board.title,lists:[{id:'list-target',title:'Target',cards:[{id:'card-target',title:'Target card'}]}]};
    await setDoc(doc(db,'workspaces',workspaceId,'boards',boardId),board);
    await setDoc(doc(db,'workspaces',workspaceId,'boards',boardId,'lists','list-target'),{id:'list-target',title:'Target',rank:0,archived:false,lifecycleState:'active',revision:0,clientMutationId:`${suffix}-list-seed-0001`,updatedAt:now});
    await setDoc(doc(db,'workspaces',workspaceId,'boards',boardId,'cards','card-target'),{id:'card-target',listId:'list-target',title:'Target card',rank:0,archived:false,lifecycleState:'active',assigneeUids:[],revision:0,clientMutationId:`${suffix}-card-seed-0001`,updatedAt:now});
    for(let i=0;i<commentCount;i++) {
      const id=`comment-${String(i).padStart(3,'0')}-0000000000`;
      await setDoc(doc(db,'workspaces',workspaceId,'boards',boardId,'cards','card-target','comments',id),{authorUid:owner,body:`Synthetic ${i}`,createdAt:now,updatedAt:now,deletedAt:i%2?now:null,revision:0,clientMutationId:id});
    }
    if(secondList) {
      await setDoc(doc(db,'workspaces',workspaceId,'boards',boardId,'lists','list-keep'),{id:'list-keep',title:'Keep',rank:1,archived:false,lifecycleState:'active',revision:0,clientMutationId:`${suffix}-list-keep-0001`,updatedAt:now});
      await setDoc(doc(db,'workspaces',workspaceId,'boards',boardId,'cards','card-keep'),{id:'card-keep',listId:'list-keep',title:'Keep card',rank:1,archived:false,lifecycleState:'active',assigneeUids:[],revision:0,clientMutationId:`${suffix}-card-keep-0001`,updatedAt:now});
      await setDoc(doc(db,'workspaces',workspaceId,'boards',boardId,'cards','card-archived'),{id:'card-archived',listId:'list-target',title:'Archived target',rank:1,archived:true,lifecycleState:'active',assigneeUids:[],revision:0,clientMutationId:`${suffix}-card-archived-0001`,updatedAt:now});
    }
  });
  return value;
}

function deletionRefs(db,{workspaceId,boardId},operationId) {
  return {
    board:doc(db,'workspaces',workspaceId,'boards',boardId),
    control:doc(db,'workspaces',workspaceId,'boardLifecycle',boardId),
    job:doc(db,'workspaces',workspaceId,'deletionJobs',operationId)
  };
}

function addStartWrites(batch, db, fixture, {actor,targetType,targetId,operationId,expectedRevision=0,controlRevision=0}) {
  const refs=deletionRefs(db,fixture,operationId);
  batch.update(refs.board,{lifecycleState:'deleting',activeDeletionJobId:operationId,revision:expectedRevision+1,clientMutationId:operationId,updatedAt:serverTimestamp()});
  batch.set(refs.job,{schemaVersion:1,operationId,boardId:fixture.boardId,targetType,targetId,initiatorUid:actor,state:'deleting',expectedRevision,createdAt:serverTimestamp(),updatedAt:serverTimestamp(),revision:0});
  batch.set(refs.control,{schemaVersion:1,boardId:fixture.boardId,state:'deleting',operationId,targetType,targetId,initiatorUid:actor,startedAt:serverTimestamp(),completedAt:null,revision:controlRevision});
  if(targetType==='list'){batch.update(doc(db,'workspaces',fixture.workspaceId,'boards',fixture.boardId,'lists',targetId),{lifecycleState:'deleting',activeDeletionJobId:operationId,revision:1,clientMutationId:operationId,updatedAt:serverTimestamp()});batch.set(doc(db,'workspaces',fixture.workspaceId,'boardLifecycle',fixture.boardId,'deletedLists',targetId),{schemaVersion:1,entityType:'list',boardId:fixture.boardId,entityId:targetId,operationId,deletedByUid:actor,createdAt:serverTimestamp()});}
  if(targetType==='card'){batch.update(doc(db,'workspaces',fixture.workspaceId,'boards',fixture.boardId,'cards',targetId),{lifecycleState:'deleting',activeDeletionJobId:operationId,revision:1,clientMutationId:operationId,updatedAt:serverTimestamp()});batch.set(doc(db,'workspaces',fixture.workspaceId,'boardLifecycle',fixture.boardId,'deletedCards',targetId),{schemaVersion:1,entityType:'card',boardId:fixture.boardId,entityId:targetId,listId:'list-target',operationId,deletedByUid:actor,createdAt:serverTimestamp()});}
  return refs;
}

async function startDeletion(db, fixture, options) {
  const batch=writeBatch(db); addStartWrites(batch,db,fixture,options); await batch.commit();
}

async function completeEntityDeletion(db,fixture,operationId,{boardRevision=1,controlRevision=0}={}) {
  const refs=deletionRefs(db,fixture,operationId), batch=writeBatch(db);
  batch.update(refs.job,{state:'complete',updatedAt:serverTimestamp(),revision:1});
  batch.update(refs.control,{state:'active',completedAt:serverTimestamp(),revision:controlRevision+1});
  batch.update(refs.board,{lifecycleState:'active',activeDeletionJobId:null,revision:boardRevision+1,clientMutationId:operationId,updatedAt:serverTimestamp()});
  await batch.commit();
}

async function completeBoardDeletion(db,fixture,operationId,{controlRevision=0}={}) {
  const refs=deletionRefs(db,fixture,operationId), batch=writeBatch(db);
  batch.update(refs.job,{state:'complete',updatedAt:serverTimestamp(),revision:1});
  batch.update(refs.control,{state:'deleted',completedAt:serverTimestamp(),revision:controlRevision+1});
  await batch.commit();
}

async function createCardTombstone(db,fixture,{actor,operationId,cardId,listId}) {
  const batch=writeBatch(db);
  batch.update(doc(db,'workspaces',fixture.workspaceId,'boards',fixture.boardId,'cards',cardId),{lifecycleState:'deleting',activeDeletionJobId:operationId,revision:1,clientMutationId:operationId,updatedAt:serverTimestamp()});
  batch.set(doc(db,'workspaces',fixture.workspaceId,'boardLifecycle',fixture.boardId,'deletedCards',cardId),{schemaVersion:1,entityType:'card',boardId:fixture.boardId,entityId:cardId,listId,operationId,deletedByUid:actor,createdAt:serverTimestamp()});
  return batch.commit();
}

async function createListTombstone(db,fixture,{actor,operationId,listId}) {
  const batch=writeBatch(db);
  batch.update(doc(db,'workspaces',fixture.workspaceId,'boards',fixture.boardId,'lists',listId),{lifecycleState:'deleting',activeDeletionJobId:operationId,revision:1,clientMutationId:operationId,updatedAt:serverTimestamp()});
  batch.set(doc(db,'workspaces',fixture.workspaceId,'boardLifecycle',fixture.boardId,'deletedLists',listId),{schemaVersion:1,entityType:'list',boardId:fixture.boardId,entityId:listId,operationId,deletedByUid:actor,createdAt:serverTimestamp()});
  return batch.commit();
}

async function deleteCommentPages(db,fixture,cardId) {
  const comments=collection(db,'workspaces',fixture.workspaceId,'boards',fixture.boardId,'cards',cardId,'comments');
  let removed=0;
  while(true) {
    const page=await getDocs(query(comments,limit(10)));
    if(!page.size) break;
    const batch=writeBatch(db); page.docs.forEach(item=>batch.delete(item.ref)); await batch.commit(); removed+=page.size;
  }
  return removed;
}

test('card deletion lock is coupled, role-bound, resumable after early completion, and handles multiple comment pages', async () => {
  const fixture=await seedFixture('card',{commentCount:27}), operationId=mid('card-delete');
  const viewer=dbFor(fixture.viewer), editor=dbFor(fixture.editor);
  const viewerStart=writeBatch(viewer);
  addStartWrites(viewerStart,viewer,fixture,{actor:fixture.viewer,targetType:'card',targetId:'card-target',operationId,expectedRevision:0});
  await assertFails(viewerStart.commit());
  await assertSucceeds(startDeletion(editor,fixture,{actor:fixture.editor,targetType:'card',targetId:'card-target',operationId,expectedRevision:0}));
  await assertSucceeds(getDoc(doc(editor,'workspaces',fixture.workspaceId,'boards',fixture.boardId)));
  await assertFails(getDoc(doc(viewer,'workspaces',fixture.workspaceId,'boards',fixture.boardId)));

  const cardPath=['workspaces',fixture.workspaceId,'boards',fixture.boardId,'cards','card-target'];
  await assertFails(getDoc(doc(viewer,...cardPath)));
  await assertSucceeds(getDoc(doc(editor,...cardPath)));
  await assertFails(updateDoc(doc(editor,...cardPath),{title:'Blocked while locked',revision:1,clientMutationId:'blocked-card-update-0001'}));
  const comments=collection(editor,...cardPath,'comments');
  await assertSucceeds(getDocs(query(comments,limit(25))));
  await assertFails(getDocs(query(comments)));

  // Client completion is not trusted as proof. The tombstone still hides the payload,
  // while an authorized actor can resume and remove every retained comment.
  await assertSucceeds(completeEntityDeletion(editor,fixture,operationId));
  await assertFails(getDoc(doc(viewer,...cardPath)));
  await assertSucceeds(getDoc(doc(editor,...cardPath)));
  assert.equal(await deleteCommentPages(editor,fixture,'card-target'),27);
  await assertSucceeds(deleteDoc(doc(editor,...cardPath)));
  await assertFails(setDoc(doc(editor,...cardPath),{id:'card-target',listId:'list-target',title:'Resurrection',rank:0,assigneeUids:[],revision:0,clientMutationId:'resurrection-card-0001'}));
  assert.equal((await getDoc(doc(editor,...cardPath))).exists(),false);
});

test('list deletion covers active and archived sibling cards without touching another list', async () => {
  const fixture=await seedFixture('list',{commentCount:2,secondList:true}), operationId=mid('list-delete'), editor=dbFor(fixture.editor);
  await assertSucceeds(startDeletion(editor,fixture,{actor:fixture.editor,targetType:'list',targetId:'list-target',operationId,expectedRevision:0}));
  const cards=collection(editor,'workspaces',fixture.workspaceId,'boards',fixture.boardId,'cards');
  assert.equal((await assertSucceeds(getDoc(doc(cards,'card-target')))).exists(),true);
  assert.equal((await assertSucceeds(getDoc(doc(cards,'card-archived')))).exists(),true);
  await assertFails(setDoc(doc(cards,'new-target-card'),{id:'new-target-card',listId:'list-target',title:'Blocked',rank:2,assigneeUids:[],revision:0,clientMutationId:'blocked-target-create-0001'}));
  await assertFails(updateDoc(doc(cards,'card-keep'),{listId:'list-target',revision:1,clientMutationId:'blocked-target-move-0001'}));

  await assertSucceeds(createCardTombstone(editor,fixture,{actor:fixture.editor,operationId,cardId:'card-target',listId:'list-target'}));
  await assertSucceeds(createCardTombstone(editor,fixture,{actor:fixture.editor,operationId,cardId:'card-archived',listId:'list-target'}));
  await assertFails(createCardTombstone(editor,fixture,{actor:fixture.editor,operationId,cardId:'card-keep',listId:'list-target'}));
  assert.equal(await deleteCommentPages(editor,fixture,'card-target'),2);
  await assertSucceeds(deleteDoc(doc(cards,'card-target')));
  await assertSucceeds(deleteDoc(doc(cards,'card-archived')));
  await assertSucceeds(deleteDoc(doc(editor,'workspaces',fixture.workspaceId,'boards',fixture.boardId,'lists','list-target')));
  await assertSucceeds(completeEntityDeletion(editor,fixture,operationId));

  assert.equal((await getDoc(doc(cards,'card-keep'))).exists(),true);
  assert.equal((await getDoc(doc(editor,'workspaces',fixture.workspaceId,'boards',fixture.boardId,'lists','list-keep'))).exists(),true);
  await assertFails(setDoc(doc(editor,'workspaces',fixture.workspaceId,'boards',fixture.boardId,'lists','list-target'),{id:'list-target',title:'Resurrection',rank:2,revision:0,clientMutationId:'resurrection-list-0001'}));
});

test('board owner may delete parent first while durable control keeps leftovers hidden and cleanable', async () => {
  const fixture=await seedFixture('board',{commentCount:3,snapshot:true}), operationId=mid('board-delete');
  const editor=dbFor(fixture.editor), owner=dbFor(fixture.owner), viewer=dbFor(fixture.viewer);
  const editorStart=writeBatch(editor); addStartWrites(editorStart,editor,fixture,{actor:fixture.editor,targetType:'board',targetId:fixture.boardId,operationId,expectedRevision:0});
  await assertFails(editorStart.commit());
  await assertSucceeds(startDeletion(owner,fixture,{actor:fixture.owner,targetType:'board',targetId:fixture.boardId,operationId,expectedRevision:0}));
  const board=doc(owner,'workspaces',fixture.workspaceId,'boards',fixture.boardId);
  await assertFails(getDoc(doc(viewer,'workspaces',fixture.workspaceId,'boards',fixture.boardId)));
  await assertSucceeds(getDoc(board));

  await assertSucceeds(deleteDoc(board));
  await assertSucceeds(completeBoardDeletion(owner,fixture,operationId));
  const viewerCard=doc(viewer,'workspaces',fixture.workspaceId,'boards',fixture.boardId,'cards','card-target');
  await assertFails(getDoc(viewerCard));

  // Job-complete maintenance access remains available to the current owner.
  const ownerCards=collection(owner,'workspaces',fixture.workspaceId,'boards',fixture.boardId,'cards');
  assert.equal((await assertSucceeds(getDoc(doc(ownerCards,'card-target')))).exists(),true);
  await assertSucceeds(createCardTombstone(owner,fixture,{actor:fixture.owner,operationId,cardId:'card-target',listId:'list-target'}));
  await assertSucceeds(createListTombstone(owner,fixture,{actor:fixture.owner,operationId,listId:'list-target'}));
  assert.equal(await deleteCommentPages(owner,fixture,'card-target'),3);
  await assertSucceeds(deleteDoc(doc(ownerCards,'card-target')));
  await assertSucceeds(deleteDoc(doc(owner,'workspaces',fixture.workspaceId,'boards',fixture.boardId,'lists','list-target')));
  await assertFails(setDoc(board,{id:fixture.boardId,title:'Resurrection',rank:0,archived:false,revision:0,clientMutationId:'resurrection-board-0001'}));
  await assertFails(deleteDoc(doc(owner,'workspaces',fixture.workspaceId)));
});

test('standalone, stale, cross-scope, same-batch bypass, and mutable-control attempts are denied', async () => {
  const fixture=await seedFixture('forgery',{commentCount:1,secondList:true}), owner=dbFor(fixture.owner), operationId=mid('forgery-delete');
  const refs=deletionRefs(owner,fixture,operationId);
  await assertFails(setDoc(refs.job,{schemaVersion:1,operationId,boardId:fixture.boardId,targetType:'card',targetId:'card-target',initiatorUid:fixture.owner,state:'deleting',expectedRevision:0,createdAt:serverTimestamp(),updatedAt:serverTimestamp(),revision:0}));

  const stale=writeBatch(owner); addStartWrites(stale,owner,fixture,{actor:fixture.owner,targetType:'card',targetId:'card-target',operationId,expectedRevision:2});
  await assertFails(stale.commit());

  const bypass=writeBatch(owner); addStartWrites(bypass,owner,fixture,{actor:fixture.owner,targetType:'card',targetId:'card-target',operationId,expectedRevision:0});
  bypass.set(doc(owner,'workspaces',fixture.workspaceId,'boards',fixture.boardId,'cards','bypass-card'),{id:'bypass-card',listId:'list-keep',title:'Bypass',rank:2,assigneeUids:[],revision:0,clientMutationId:'bypass-card-create-0001'});
  await assertFails(bypass.commit());

  await assertSucceeds(startDeletion(owner,fixture,{actor:fixture.owner,targetType:'card',targetId:'card-target',operationId,expectedRevision:0}));
  const tombstone=doc(owner,'workspaces',fixture.workspaceId,'boardLifecycle',fixture.boardId,'deletedCards','card-target');
  await assertFails(updateDoc(refs.job,{targetId:'card-keep'}));
  await assertFails(updateDoc(tombstone,{entityId:'card-keep'}));
  await assertFails(deleteDoc(tombstone));
  const competing=writeBatch(owner); addStartWrites(competing,owner,fixture,{actor:fixture.owner,targetType:'list',targetId:'list-keep',operationId:mid('competing-delete'),expectedRevision:1,controlRevision:1});
  await assertFails(competing.commit());
});

test('legacy snapshot boards must be converted before card or list deletion, while whole-board deletion remains valid', async () => {
  const fixture=await seedFixture('snapshot-gate',{snapshot:true}), owner=dbFor(fixture.owner);
  const cardStart=writeBatch(owner);
  addStartWrites(cardStart,owner,fixture,{actor:fixture.owner,targetType:'card',targetId:'card-target',operationId:mid('snapshot-card'),expectedRevision:0});
  await assertFails(cardStart.commit());
  await assertFails(updateDoc(doc(owner,'workspaces',fixture.workspaceId,'boards',fixture.boardId),{snapshot:{id:fixture.boardId,title:'Forged scrub',lists:[]},revision:1,clientMutationId:'snapshot-forged-update-0001'}));
  const listStart=writeBatch(owner);
  addStartWrites(listStart,owner,fixture,{actor:fixture.owner,targetType:'list',targetId:'list-target',operationId:mid('snapshot-list'),expectedRevision:0});
  await assertFails(listStart.commit());
  await assertSucceeds(startDeletion(owner,fixture,{actor:fixture.owner,targetType:'board',targetId:fixture.boardId,operationId:mid('snapshot-board'),expectedRevision:0}));
});

test('revoking an initiating editor stops cleanup while the owner can safely take over', async () => {
  const fixture=await seedFixture('revoke',{commentCount:1}), editor=dbFor(fixture.editor), owner=dbFor(fixture.owner), operationId=mid('revoke-delete');
  await assertSucceeds(startDeletion(editor,fixture,{actor:fixture.editor,targetType:'card',targetId:'card-target',operationId,expectedRevision:0}));
  await assertSucceeds(deleteDoc(doc(owner,'workspaces',fixture.workspaceId,'members',fixture.editor)));
  const comment=doc(editor,'workspaces',fixture.workspaceId,'boards',fixture.boardId,'cards','card-target','comments','comment-000-0000000000');
  await assertFails(deleteDoc(comment));
  assert.equal(await deleteCommentPages(owner,fixture,'card-target'),1);
  await assertSucceeds(deleteDoc(doc(owner,'workspaces',fixture.workspaceId,'boards',fixture.boardId,'cards','card-target')));
  await assertSucceeds(completeEntityDeletion(owner,fixture,operationId));
});
