import {test, expect} from '@playwright/test';
import {initializeTestEnvironment} from '@firebase/rules-unit-testing';
import {collection,doc,getDoc,getDocs,Timestamp,where,query,writeBatch} from 'firebase/firestore';
import {previewUrl} from '../../scripts/repository-path.mjs';

test.describe.configure({mode:'serial'});
const baseURL=(process.env.PLAYWRIGHT_EMULATOR_BASE_URL||previewUrl(4174)).replace(/\/$/,'');
const FIXTURE={workspaceId:'emulator-workflow',boardId:'emulator-board',listId:'emulator-list',cardId:'emulator-card'};
const localSentinels=label=>({
  'flowboard-workspace':`synthetic-workspace-sentinel:${label}:"keep exactly"`,
  'flowboard-data':`synthetic-data-sentinel:${label}:\u0000:keep`,
  'flowboard-migration':`synthetic-migration-sentinel:${label}:v1`
});

async function rolePage(browser,role,label){
  const context=await browser.newContext(),sentinels=localSentinels(label);
  await context.addInitScript(values=>{for(const [key,value] of Object.entries(values))localStorage.setItem(key,value);},sentinels);
  const page=await context.newPage();
  await page.goto(`${baseURL}/tests/emulator/index.html?role=${role}`);
  await page.waitForFunction(()=>globalThis.__flowboardEmulatorTest?.ready===true);
  await expect(page.locator('#account-button')).toBeVisible();
  return{context,page,sentinels};
}

async function addSyntheticComments(page){
  await page.evaluate(async()=>{
    const adapter=FlowboardRuntime.cloudAdapter,workspaceId=FlowboardApp.getMode().id;
    await adapter.createComment({workspaceId,boardId:'emulator-board',cardId:'emulator-card',body:'Synthetic comment one'});
    await adapter.createComment({workspaceId,boardId:'emulator-board',cardId:'emulator-card',body:'Synthetic comment two'});
  });
}

async function openFixture(page){
  await page.locator('#account-button').click();
  const account=page.locator('#account-dialog');
  await expect(account).toBeVisible();
  await account.getByRole('button',{name:'Boards'}).click();
  const row=page.locator('#workspace-dialog #workspace-board-list .workspace-entry').filter({hasText:'Emulator board'});
  await expect(row).toBeVisible();
  await row.getByRole('button',{name:/Open Emulator board/}).click();
  await expect.poll(()=>page.evaluate(()=>FlowboardApp.getMode().kind)).toMatch(/^cloud(-preview)?$/);
  await expect(page.locator('.card-open').filter({hasText:'Synthetic shared card'})).toBeVisible();
}

async function openCardStable(page,card){
  try{await card.click({timeout:3000});await expect(page.locator('#card-dialog')).toBeVisible({timeout:5000});}
  catch{await card.focus({timeout:3000});await card.press('Enter',{timeout:3000});await expect(page.locator('#card-dialog')).toBeVisible({timeout:5000});}
}

async function existingActors(page){
  return page.evaluate(async()=>{
    const api=globalThis.__flowboardEmulatorTest,actors={};
    for(const role of ['owner','editor','viewer'])actors[role]=(await api.signInRole(role)).uid;
    await api.signInRole('owner');
    return actors;
  });
}

async function seededActors(page){
  await page.evaluate(()=>globalThis.__flowboardEmulatorTest.seedFixture());
  return existingActors(page);
}

async function withAdmin(callback){
  const [host,rawPort]=String(process.env.FIRESTORE_EMULATOR_HOST||'').split(':');
  if(!host||!rawPort)throw new Error('Firestore Emulator host is not configured for this synthetic test.');
  const env=await initializeTestEnvironment({projectId:'demo-flowboard-browser',firestore:{host,port:Number(rawPort)}});
  try{let result;await env.withSecurityRulesDisabled(async context=>{result=await callback(context.firestore());});return result;}
  finally{await env.cleanup();}
}

async function seedCardLock(db,ownerUid){
  const root=doc(db,'workspaces',FIXTURE.workspaceId),board=doc(root,'boards',FIXTURE.boardId),card=doc(board,'cards',FIXTURE.cardId),control=doc(root,'boardLifecycle',FIXTURE.boardId),operationId='deterministic-card-access-lock-0001';
  const [boardSnap,cardSnap,controlSnap]=await Promise.all([getDoc(board),getDoc(card),getDoc(control)]);
  if(!boardSnap.exists()||!cardSnap.exists())throw new Error('Synthetic lock fixture is incomplete.');
  const now=Timestamp.now(),revision=boardSnap.data().revision??0,cardRevision=cardSnap.data().revision??0,controlRevision=controlSnap.exists()?(controlSnap.data().revision??0)+1:0;
  const batch=writeBatch(db);
  batch.update(board,{lifecycleState:'deleting',activeDeletionJobId:operationId,revision:revision+1,clientMutationId:operationId,updatedAt:now});
  batch.update(card,{lifecycleState:'deleting',activeDeletionJobId:operationId,revision:cardRevision+1,clientMutationId:operationId,updatedAt:now});
  batch.set(doc(root,'deletionJobs',operationId),{schemaVersion:1,operationId,boardId:FIXTURE.boardId,targetType:'card',targetId:FIXTURE.cardId,initiatorUid:ownerUid,state:'deleting',expectedRevision:revision,createdAt:now,updatedAt:now,revision:0});
  batch.set(control,{schemaVersion:1,boardId:FIXTURE.boardId,state:'deleting',operationId,targetType:'card',targetId:FIXTURE.cardId,initiatorUid:ownerUid,startedAt:now,completedAt:null,revision:controlRevision});
  batch.set(doc(control,'deletedCards',FIXTURE.cardId),{schemaVersion:1,entityType:'card',boardId:FIXTURE.boardId,entityId:FIXTURE.cardId,listId:FIXTURE.listId,operationId,deletedByUid:ownerUid,createdAt:now});
  await batch.commit();
  return operationId;
}

async function clearSyntheticComments(db){
  const comments=await getDocs(collection(db,'workspaces',FIXTURE.workspaceId,'boards',FIXTURE.boardId,'cards',FIXTURE.cardId,'comments'));
  if(comments.empty)return;
  const batch=writeBatch(db);comments.docs.forEach(comment=>batch.delete(comment.ref));await batch.commit();
}

async function clearCardLock(db,operationId){
  const root=doc(db,'workspaces',FIXTURE.workspaceId),board=doc(root,'boards',FIXTURE.boardId),card=doc(board,'cards',FIXTURE.cardId),control=doc(root,'boardLifecycle',FIXTURE.boardId),job=doc(root,'deletionJobs',operationId);
  const [boardSnap,cardSnap,controlSnap,jobSnap]=await Promise.all([getDoc(board),getDoc(card),getDoc(control),getDoc(job)]);
  if(!boardSnap.exists()||!cardSnap.exists()||!controlSnap.exists()||!jobSnap.exists())throw new Error('Synthetic lock checkpoint could not be restored.');
  const now=Timestamp.now(),batch=writeBatch(db);
  batch.update(board,{lifecycleState:'active',activeDeletionJobId:null,revision:(boardSnap.data().revision??0)+1,clientMutationId:operationId,updatedAt:now});
  batch.update(card,{lifecycleState:'active',activeDeletionJobId:null,revision:(cardSnap.data().revision??0)+1,clientMutationId:`${operationId}-restore`,updatedAt:now});
  batch.update(control,{state:'active',completedAt:now,revision:(controlSnap.data().revision??0)+1});
  batch.update(job,{state:'complete',updatedAt:now,revision:(jobSnap.data().revision??0)+1});
  batch.delete(doc(control,'deletedCards',FIXTURE.cardId));
  await batch.commit();
}

async function sentinelValues(page){
  return page.evaluate(keys=>Object.fromEntries(Object.keys(keys).map(key=>[key,localStorage.getItem(key)])),localSentinels('owner'));
}

// This checkpoint deliberately holds a valid emulator-only lock open. It is not
// a production pause and it is not the real-adapter deletion acceptance test.
test('a live peer recovers from a deterministic valid card lock without reload or access-ended gating',async({browser})=>{
  const owner=await rolePage(browser,'owner','checkpoint-owner'),editor=await rolePage(browser,'editor','checkpoint-editor'),viewer=await rolePage(browser,'viewer','checkpoint-viewer');
  try{
    const actors=await seededActors(owner.page);
    await openFixture(owner.page);await addSyntheticComments(owner.page);await openFixture(editor.page);await openFixture(viewer.page);
    await owner.page.evaluate(()=>{window.__cardLockMarker='still-mounted';});
    await editor.page.evaluate(()=>{window.__cardLockMarker='still-mounted';});
    await viewer.page.evaluate(()=>{window.__cardLockMarker='still-mounted';});
    await openCardStable(viewer.page,viewer.page.locator('.card-open').filter({hasText:'Synthetic shared card'}));
    await expect(viewer.page.locator('#card-dialog')).toBeVisible();
    await expect(viewer.page.locator('#cloud-comments-list .comment-item')).toHaveCount(2,{timeout:15000});
    await withAdmin(db=>seedCardLock(db,actors.owner));
    const membershipDuringLock=await viewer.page.evaluate(id=>FlowboardRuntime.cloudAdapter.verifyWorkspaceAccess(id),FIXTURE.workspaceId);
    expect(membershipDuringLock).toBe('viewer');
    await expect.poll(()=>viewer.page.evaluate(()=>FlowboardApp.getMode().kind)).toBe('cloud-preview');
    await expect(viewer.page.locator('#board .cloud-gate')).toHaveCount(0);
    await expect.poll(()=>viewer.page.evaluate(()=>{const dialog=document.querySelector('#card-dialog'),message=document.querySelector('#cloud-comments-status')?.textContent||'';return !dialog.open||(!/permission-denied|insufficient permissions/i.test(message)&&message.length>0);})).toBe(true);
    await expect(viewer.page.locator('#cloud-comments-status')).not.toContainText('permission-denied');
    expect(await viewer.page.evaluate(()=>window.__cardLockMarker)).toBe('still-mounted');
    const checkedRole=await viewer.page.evaluate(()=>FlowboardRuntime.cloudAdapter.verifyWorkspaceAccess(FlowboardApp.getMode().id));
    expect(checkedRole).toBe('viewer');
    await withAdmin(db=>clearCardLock(db,'deterministic-card-access-lock-0001'));
    await expect.poll(()=>viewer.page.locator('#cloud-status').textContent(),{timeout:15000}).toContain('Synced');
    if(!await viewer.page.locator('#card-dialog').evaluate(dialog=>dialog.open))await openCardStable(viewer.page,viewer.page.locator('.card-open').filter({hasText:'Synthetic shared card'}));
    await expect(viewer.page.locator('#cloud-comments-list .comment-item')).toHaveCount(2,{timeout:10000});
    await expect(viewer.page.locator('#cloud-comments-status')).not.toContainText('temporarily unavailable');
    await expect(viewer.page.locator('#board .cloud-gate')).toHaveCount(0);
    await expect.poll(()=>viewer.page.evaluate(()=>FlowboardApp.getMode().kind)).toBe('cloud-preview');
    expect(await editor.page.evaluate(()=>window.__cardLockMarker)).toBe('still-mounted');
    await viewer.page.locator('#close-card-dialog').click();
    await withAdmin(db=>clearSyntheticComments(db));
  }finally{await Promise.all([owner.context.close(),editor.context.close(),viewer.context.close()]);}
});

// This exercises actual card deletion UI, the real adapter and subsequent
// multi-member realtime convergence, including a peer with comments open.
test('shared card deletion preserves peer sessions, target privacy and later realtime convergence',async({browser})=>{
  const owner=await rolePage(browser,'owner','delete-owner'),editor=await rolePage(browser,'editor','delete-editor'),viewer=await rolePage(browser,'viewer','delete-viewer');
  try{
    const actors=await seededActors(owner.page);
    await withAdmin(async db=>{
      const board=doc(db,'workspaces',FIXTURE.workspaceId,'boards',FIXTURE.boardId),now=Timestamp.now();
      await writeBatch(db).set(doc(board,'cards','card-survivor'),{id:'card-survivor',listId:FIXTURE.listId,title:'Survivor shared card',description:'Synthetic unaffected card',rank:1,assigneeUids:[],labels:[],dueDate:'',checklist:[],archived:false,lifecycleState:'active',revision:0,clientMutationId:'synthetic-survivor-card-0001',updatedAt:now}).commit();
    });
    await openFixture(owner.page);
    await owner.page.evaluate(async()=>{
      const adapter=FlowboardRuntime.cloudAdapter,workspaceId=FlowboardApp.getMode().id;
      await adapter.createComment({workspaceId,boardId:'emulator-board',cardId:'emulator-card',body:'Synthetic comment one'});
      await adapter.createComment({workspaceId,boardId:'emulator-board',cardId:'emulator-card',body:'Synthetic comment two'});
    });
    await openFixture(editor.page);await openFixture(viewer.page);
    await expect(owner.page.locator('.card-open').filter({hasText:'Survivor shared card'})).toBeVisible();
    await expect(editor.page.locator('.card-open').filter({hasText:'Survivor shared card'})).toBeVisible();
    await expect(viewer.page.locator('.card-open').filter({hasText:'Survivor shared card'})).toBeVisible();
    await openCardStable(viewer.page,viewer.page.locator('.card-open').filter({hasText:'Synthetic shared card'}));
    await expect(viewer.page.locator('#card-dialog')).toBeVisible();
    await expect(viewer.page.locator('#cloud-comments-list .comment-item')).toHaveCount(2,{timeout:15000});
    const countsBefore=await withAdmin(async db=>{
      const root=doc(db,'workspaces',FIXTURE.workspaceId),[jobs,activity]=await Promise.all([getDocs(collection(root,'deletionJobs')),getDocs(collection(root,'activity'))]);
      return{cardJobs:jobs.docs.filter(item=>item.data().boardId===FIXTURE.boardId&&item.data().targetType==='card'&&item.data().targetId===FIXTURE.cardId).length,activity:activity.size};
    });
    await openCardStable(owner.page,owner.page.locator('.card-open').filter({hasText:'Synthetic shared card'}));
    await expect(owner.page.locator('#card-dialog')).toBeVisible();
    await owner.page.locator('#delete-card').click();
    const confirm=owner.page.locator('#confirm-dialog');
    await expect(confirm).toBeVisible();
    await expect(confirm.locator('#confirm-action')).toContainText('Delete');
    await confirm.locator('#confirm-action').click();
    await expect(owner.page.locator('#card-dialog')).toBeHidden({timeout:15000});
    for(const peer of [owner.page,editor.page,viewer.page]){
      await expect.poll(()=>peer.evaluate(()=>FlowboardApp.getMode().kind),{timeout:20000}).toMatch(/^cloud(-preview)?$/);
      await expect(peer.locator('#board .cloud-gate')).toHaveCount(0);
      await expect(peer.locator('.card-open').filter({hasText:'Synthetic shared card'})).toHaveCount(0,{timeout:20000});
      await expect(peer.locator('.card-open').filter({hasText:'Survivor shared card'})).toBeVisible();
    }
    await expect(viewer.page.locator('#card-dialog')).toBeHidden({timeout:15000});
    const editResult=await editor.page.evaluate(async()=>{
      const api=FlowboardRuntime.cloudAdapter,workspaceId=FlowboardApp.getMode().id,before=await api.fetchWorkspace(workspaceId),next=FlowboardState.clone(before),card=next.boards.find(board=>board.id==='emulator-board')?.lists.flatMap(list=>list.cards).find(item=>item.id==='card-survivor');
      if(!card)throw new Error('Synthetic survivor card missing before peer edit.');
      card.title='Realtime survivor updated';
      await api.applyWorkspaceMutation({workspaceId,before,next,clientMutationId:`peer-survivor-edit-${crypto.randomUUID()}`,activityAction:'card-updated'});
      return true;
    });
    expect(editResult).toBe(true);
    for(const peer of [owner.page,editor.page,viewer.page])await expect(peer.locator('.card-open').filter({hasText:'Realtime survivor updated'})).toBeVisible({timeout:15000});
    const state=await withAdmin(async db=>{
      const root=doc(db,'workspaces',FIXTURE.workspaceId),board=doc(root,'boards',FIXTURE.boardId),control=doc(root,'boardLifecycle',FIXTURE.boardId),target=doc(board,'cards',FIXTURE.cardId),survivor=doc(board,'cards','card-survivor'),commentDocs=await getDocs(collection(target,'comments')),[boardSnap,controlSnap,targetSnap,survivorSnap,tombstone,jobs,activity,ownerMember,editorMember,viewerMember]=await Promise.all([
        getDoc(board),getDoc(control),getDoc(target),getDoc(survivor),getDoc(doc(control,'deletedCards',FIXTURE.cardId)),getDocs(collection(root,'deletionJobs')),getDocs(collection(root,'activity')),
        getDoc(doc(root,'members',actors.owner)),getDoc(doc(root,'members',actors.editor)),getDoc(doc(root,'members',actors.viewer))
      ]);
      const matching=jobs.docs.filter(item=>item.data().boardId===FIXTURE.boardId&&item.data().targetType==='card'&&item.data().targetId===FIXTURE.cardId);
      return{boardState:boardSnap.data()?.lifecycleState,activeJob:boardSnap.data()?.activeDeletionJobId,controlState:controlSnap.data()?.state,operationId:controlSnap.data()?.operationId,jobState:matching.at(-1)?.data().state,jobCount:matching.length,targetExists:targetSnap.exists(),targetTombstone:tombstone.exists(),commentCount:commentDocs.size,survivorTitle:survivorSnap.data()?.title,activityCount:activity.size,ownerRole:ownerMember.data()?.role,editorRole:editorMember.data()?.role,viewerRole:viewerMember.data()?.role};
    });
    expect(state).toMatchObject({boardState:'active',activeJob:null,controlState:'active',jobState:'complete',targetExists:false,targetTombstone:true,commentCount:0,survivorTitle:'Realtime survivor updated',ownerRole:'owner',editorRole:'editor',viewerRole:'viewer'});
    expect(state.jobCount).toBe(countsBefore.cardJobs+1);
    expect(state.activityCount).toBe(countsBefore.activity+1);
    for(const item of [owner,editor,viewer]){
      const raw=await item.page.evaluate(keys=>Object.fromEntries(Object.keys(keys).map(key=>[key,localStorage.getItem(key)])),item.sentinels);
      expect(raw).toEqual(item.sentinels);
    }
  }finally{await Promise.all([owner.context.close(),editor.context.close(),viewer.context.close()]);}
});
