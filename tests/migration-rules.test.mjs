import test,{after,before,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {assertFails,assertSucceeds,initializeTestEnvironment} from '@firebase/rules-unit-testing';
import {collection,deleteField,doc,getDoc,getDocs,getDocsFromServer,query,serverTimestamp,setDoc,Timestamp,updateDoc,where,writeBatch} from 'firebase/firestore';

const projectId='demo-flowboard-rules';let env;
before(async()=>{env=await initializeTestEnvironment({projectId,firestore:{rules:await readFile('firestore.rules','utf8')}});});
after(async()=>env?.cleanup());beforeEach(async()=>env.clearFirestore());
const dbFor=(uid,email=`${uid}@example.com`)=>env.authenticatedContext(uid,{email,email_verified:true}).firestore();
async function seed(workspaceId='personal',personal=true){await env.withSecurityRulesDisabled(async context=>{const db=context.firestore();await setDoc(doc(db,'workspaces',workspaceId),{name:'My workspace',ownerUid:'owner',schemaVersion:5,status:'ready',personal,lifecycleRevision:0,migration:{version:1,state:'verified',counts:{boards:0,lists:0,cards:0}}});for(const [uid,role]of[['owner','owner'],['editor','editor'],['viewer','viewer']])await setDoc(doc(db,'workspaces',workspaceId,'members',uid),{uid,role,emailLower:`${uid}@example.com`});});}
const operationId='legacy-0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const boardId='import-0123456789abcdef-0';
const receipt=()=>({schemaVersion:1,operationId,sourceDigest:'a'.repeat(64),sourceCounts:{boards:1,lists:1,cards:1},targetBoardIds:[boardId],createdByUid:'owner',state:'importing',createdAt:serverTimestamp(),updatedAt:serverTimestamp(),revision:0});

test('personal owner import stays hidden until atomic verification',async()=>{
  await seed();const owner=dbFor('owner'),viewer=dbFor('viewer'),record=doc(owner,'workspaces','personal','imports',operationId),board=doc(owner,'workspaces','personal','boards',boardId);
  await assertFails(setDoc(doc(dbFor('editor'),'workspaces','personal','imports',operationId),receipt()));
  await assertSucceeds(setDoc(record,receipt()));
  await assertSucceeds(setDoc(board,{id:boardId,title:'Imported',rank:0,archived:false,lifecycleState:'importing',importOperationId:operationId,revision:0,clientMutationId:operationId}));
  await assertSucceeds(setDoc(doc(board,'lists','list-1'),{id:'list-1',title:'List',rank:0,lifecycleState:'active',importOperationId:operationId,revision:0,clientMutationId:operationId}));
  await assertSucceeds(setDoc(doc(board,'cards','card-1'),{id:'card-1',listId:'list-1',title:'Card',rank:0,lifecycleState:'active',assigneeUids:[],importOperationId:operationId,revision:0,clientMutationId:operationId}));
  await assertSucceeds(getDoc(board));await assertFails(getDoc(doc(viewer,'workspaces','personal','boards',boardId)));
  const hidden=await assertSucceeds(getDocs(query(collection(viewer,'workspaces','personal','boards'),where('lifecycleState','==','active'),where('archived','==',false))));assert.equal(hidden.size,0);
  const finalize=writeBatch(owner);finalize.update(record,{state:'verified',updatedAt:serverTimestamp(),revision:1});finalize.update(board,{lifecycleState:'active',revision:1,clientMutationId:operationId,updatedAt:serverTimestamp()});await assertSucceeds(finalize.commit());
  await assertSucceeds(getDoc(doc(viewer,'workspaces','personal','boards',boardId)));
  await assertFails(updateDoc(doc(dbFor('editor'),'workspaces','personal','boards',boardId),{importOperationId:'forged-import-operation-0001',revision:2,clientMutationId:'forged-import-update-0001'}));
});

test('import scope, provenance, destination, and immutable receipt are enforced',async()=>{
  await seed();await seed('shared',false);const owner=dbFor('owner');
  await assertFails(setDoc(doc(owner,'workspaces','shared','imports',operationId),receipt()));
  const record=doc(owner,'workspaces','personal','imports',operationId);await assertSucceeds(setDoc(record,receipt()));
  const oversizedId='legacy-oversized-import-operation-0001';await assertFails(setDoc(doc(owner,'workspaces','personal','imports',oversizedId),{...receipt(),operationId:oversizedId,sourceCounts:{boards:5,lists:0,cards:0},targetBoardIds:['b1','b2','b3','b4','b5']}));
  await assertFails(updateDoc(record,{targetBoardIds:['sibling'],updatedAt:serverTimestamp(),revision:1}));
  await assertFails(setDoc(doc(owner,'workspaces','personal','boards','sibling'),{id:'sibling',title:'Wrong scope',rank:0,lifecycleState:'importing',importOperationId:operationId,revision:0,clientMutationId:operationId}));
  await assertFails(setDoc(doc(owner,'workspaces','personal','boards','forged-active'),{id:'forged-active',title:'Forged provenance',rank:0,lifecycleState:'active',importOperationId:operationId,revision:0,clientMutationId:operationId}));
  await assertFails(getDoc(doc(dbFor('editor'),'workspaces','personal','imports',operationId)));
});

test('snapshot migration is owner-only, operation-bound, and blocks ordinary edits',async()=>{
  await seed('upgrade');const now=Timestamp.now();await env.withSecurityRulesDisabled(async context=>setDoc(doc(context.firestore(),'workspaces','upgrade','boards','legacy-board'),{id:'legacy-board',title:'Legacy',rank:0,archived:false,lifecycleState:'active',snapshot:{id:'legacy-board',title:'Legacy',lists:[{id:'list-1',title:'List',cards:[{id:'card-1',title:'Card'}]}]},revision:0,clientMutationId:'legacy-board-seed-0001',updatedAt:now}));
  const owner=dbFor('owner'),viewer=dbFor('viewer'),root=doc(owner,'workspaces','upgrade'),board=doc(owner,'workspaces','upgrade','boards','legacy-board'),migrationId='snapshot-migration-operation-0001';
  await assertFails(updateDoc(doc(dbFor('editor'),'workspaces','upgrade'),{status:'migrating',migration:{version:2,state:'migrating',operationId:migrationId,counts:{boards:1,lists:1,cards:1},startedAt:serverTimestamp()},updatedAt:serverTimestamp()}));
  await assertSucceeds(updateDoc(root,{status:'migrating',migration:{version:2,state:'migrating',operationId:migrationId,counts:{boards:1,lists:1,cards:1},startedAt:serverTimestamp()},updatedAt:serverTimestamp()}));
  await assertFails(getDoc(doc(viewer,'workspaces','upgrade','boards','legacy-board')));
  await assertFails(updateDoc(board,{title:'Ordinary edit',revision:1,clientMutationId:'ordinary-migration-edit-0001'}));
  await assertFails(updateDoc(board,{snapshot:deleteField(),granularVersion:1,lastMigrationOperationId:'wrong-migration-operation-0001',revision:1,clientMutationId:'wrong-migration-operation-0001',updatedAt:serverTimestamp()}));
  await assertSucceeds(setDoc(doc(board,'lists','list-1'),{id:'list-1',title:'List',rank:0,lifecycleState:'active',migrationOperationId:migrationId,revision:0,clientMutationId:migrationId}));
  await assertSucceeds(setDoc(doc(board,'cards','card-1'),{id:'card-1',listId:'list-1',title:'Card',rank:0,lifecycleState:'active',assigneeUids:['former-member'],migrationOperationId:migrationId,revision:0,clientMutationId:migrationId}));
  await assertSucceeds(updateDoc(board,{snapshot:deleteField(),granularVersion:1,lastMigrationOperationId:migrationId,revision:1,clientMutationId:migrationId,updatedAt:serverTimestamp()}));
  await assertSucceeds(updateDoc(root,{status:'ready',migration:{version:2,state:'verified',operationId:migrationId,counts:{boards:1,lists:1,cards:1},verifiedAt:serverTimestamp()},updatedAt:serverTimestamp()}));
  await assertSucceeds(getDoc(doc(viewer,'workspaces','upgrade','boards','legacy-board')));
});

test('archived board payloads stay owner-maintenance-only in list queries',async()=>{
  await seed();await env.withSecurityRulesDisabled(async context=>setDoc(doc(context.firestore(),'workspaces','personal','boards','archived-board'),{id:'archived-board',title:'Archived',rank:3,archived:true,lifecycleState:'active',snapshot:{id:'archived-board',title:'Archived',lists:[]},revision:0,clientMutationId:'archived-board-seed-0001'}));
  const viewer=dbFor('viewer'),owner=dbFor('owner'),boards=collection(viewer,'workspaces','personal','boards');
  await assertFails(getDoc(doc(boards,'archived-board')));
  await assertFails(getDocsFromServer(query(boards,where('lifecycleState','==','active'))));
  assert.equal((await assertSucceeds(getDocsFromServer(query(boards,where('lifecycleState','==','active'),where('archived','==',false))))).size,0);
  assert.equal((await assertSucceeds(getDocsFromServer(query(collection(owner,'workspaces','personal','boards'),where('lifecycleState','==','active'))))).size,1);
});

test('only owners restore and rearchive granular boards while editor and viewer stay filtered',async()=>{
  await seed();await env.withSecurityRulesDisabled(async context=>setDoc(doc(context.firestore(),'workspaces','personal','boards','editor-archived'),{id:'editor-archived',title:'Archived',rank:2,archived:true,archivedAt:Timestamp.now(),archivedByUid:'owner',lifecycleState:'active',revision:0,clientMutationId:'editor-archive-seed-0001'}));const owner=dbFor('owner'),editor=dbFor('editor'),viewer=dbFor('viewer'),board=doc(owner,'workspaces','personal','boards','editor-archived');await assertFails(getDoc(doc(editor,'workspaces','personal','boards','editor-archived')));await assertSucceeds(updateDoc(board,{archived:false,archivedAt:null,archivedByUid:null,revision:1,clientMutationId:'owner-restore-operation-0001',updatedAt:serverTimestamp()}));assert.equal((await assertSucceeds(getDocs(query(collection(viewer,'workspaces','personal','boards'),where('lifecycleState','==','active'),where('archived','==',false))))).size,1);await assertFails(updateDoc(doc(editor,'workspaces','personal','boards','editor-archived'),{archived:true,archivedAt:serverTimestamp(),archivedByUid:'editor',revision:2,clientMutationId:'editor-archive-operation-0001',updatedAt:serverTimestamp()}));await assertSucceeds(updateDoc(board,{archived:true,archivedAt:serverTimestamp(),archivedByUid:'owner',revision:2,clientMutationId:'owner-archive-operation-0001',updatedAt:serverTimestamp()}));await assertFails(getDoc(doc(viewer,'workspaces','personal','boards','editor-archived')));
});

test('migration bounds, operation changes, archived starts, and generic snapshot mutation are denied',async()=>{
  await seed('bounds');const owner=dbFor('owner'),root=doc(owner,'workspaces','bounds');
  await assertFails(updateDoc(root,{status:'migrating',migration:{version:2,state:'migrating',operationId:'bounded-migration-operation-0001',counts:{boards:101,lists:0,cards:0},startedAt:serverTimestamp()},updatedAt:serverTimestamp()}));
  const editor=dbFor('editor'),boards=collection(editor,'workspaces','bounds','boards');
  await assertFails(setDoc(doc(boards,'snapshot-create'),{id:'snapshot-create',title:'Injected snapshot',rank:0,archived:false,lifecycleState:'active',snapshot:{secret:'injected'},revision:0,clientMutationId:'snapshot-create-operation-0001'}));
  await assertFails(setDoc(doc(boards,'granular-version-create'),{id:'granular-version-create',title:'Injected version',rank:0,archived:false,lifecycleState:'active',granularVersion:1,revision:0,clientMutationId:'version-create-operation-0001'}));
  await env.withSecurityRulesDisabled(async context=>setDoc(doc(context.firestore(),'workspaces','bounds','boards','board'),{id:'board',title:'Board',rank:0,lifecycleState:'active',revision:0,clientMutationId:'board-seed-operation-0001'}));
  await assertFails(updateDoc(doc(owner,'workspaces','bounds','boards','board'),{snapshot:{id:'board',title:'Forged',lists:[]},revision:1,clientMutationId:'snapshot-add-operation-0001'}));
  await assertFails(updateDoc(doc(owner,'workspaces','bounds','boards','board'),{granularVersion:1,revision:1,clientMutationId:'version-add-operation-0001'}));
  await env.withSecurityRulesDisabled(context=>updateDoc(doc(context.firestore(),'workspaces','bounds'),{status:'archived'}));
  await assertFails(updateDoc(root,{status:'migrating',migration:{version:2,state:'migrating',operationId:'archived-migration-operation-0001',counts:{boards:1,lists:0,cards:0},startedAt:serverTimestamp()},updatedAt:serverTimestamp()}));
});
