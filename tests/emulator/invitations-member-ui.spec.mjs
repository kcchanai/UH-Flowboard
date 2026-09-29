import {test,expect} from '@playwright/test';
import {initializeTestEnvironment} from '@firebase/rules-unit-testing';
import {collection,doc,getDoc,getDocs,Timestamp,writeBatch} from 'firebase/firestore';
import {randomUUID} from 'node:crypto';
import {previewUrl} from '../../scripts/repository-path.mjs';

const baseURL=(process.env.PLAYWRIGHT_EMULATOR_BASE_URL||previewUrl(4174)).replace(/\/$/,'');
const adminEnvironment=()=>{const[host,port]=process.env.FIRESTORE_EMULATOR_HOST.split(':');return initializeTestEnvironment({projectId:'demo-flowboard-browser',firestore:{host,port:Number(port)}});};
const documentRows=async(admin,path)=>{let rows=[];await admin.withSecurityRulesDisabled(async context=>{const snapshot=await getDocs(collection(context.firestore(),...path.split('/')));rows=snapshot.docs.map(item=>({id:item.id,...item.data()}));});return rows;};
const createVerifiedInvitationIdentity=async email=>{const host=`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST||'127.0.0.1:9099'}`,password=`Flowboard-invite-${randomUUID()}-Aa1!`,created=await fetch(`${host}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:true})});if(!created.ok)throw new Error('The Auth Emulator could not create a disposable invitation identity.');const{localId}=await created.json(),verified=await fetch(`${host}/identitytoolkit.googleapis.com/v1/projects/demo-flowboard-browser/accounts:update?key=demo-api-key`,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer owner'},body:JSON.stringify({localId,emailVerified:true})});if(!verified.ok)throw new Error('The Auth Emulator could not verify the disposable invitation identity.');return{email,password};};
const documentValue=async(admin,path)=>{let value=null;await admin.withSecurityRulesDisabled(async context=>{const snapshot=await getDoc(doc(context.firestore(),...path.split('/')));value=snapshot.exists()?snapshot.data():null;});return value;};
const seedWorkspace=async(admin,{workspaceId,ownerUid})=>{
  await admin.withSecurityRulesDisabled(async context=>{
    const db=context.firestore(),now=Timestamp.now(),root=doc(db,'workspaces',workspaceId),boardId='invitation-board',batch=writeBatch(db);
    batch.set(root,{name:'Invitation member fixture',ownerUid,schemaVersion:5,status:'ready',personal:false,lifecycleRevision:0,activeBoardId:boardId,migration:{version:1,state:'verified',counts:{boards:1,lists:0,cards:0}},updatedAt:now});
    batch.set(doc(root,'members',ownerUid),{uid:ownerUid,role:'owner',emailLower:'owner@flowboard.test'});
    batch.set(doc(db,'users',ownerUid),{uid:ownerUid,emailLower:'owner@flowboard.test',workspaceIds:[workspaceId]});
    batch.set(doc(root,'boards',boardId),{id:boardId,title:'Invitation sample board',rank:0,archived:false,lifecycleState:'active',revision:0,clientMutationId:'invitation-board-seed-mutation',updatedAt:now});
    await batch.commit();
  });
};
const seedPersonalBoard=async(admin,workspaceId)=>{
  await admin.withSecurityRulesDisabled(async context=>{
    const db=context.firestore(),now=Timestamp.now(),{updateDoc}=await import('firebase/firestore');
    const batch=writeBatch(db);
    batch.set(doc(db,'workspaces',workspaceId,'boards','personal-board'),{id:'personal-board',title:'Recipient personal board',rank:0,archived:false,lifecycleState:'active',revision:0,clientMutationId:'personal-board-seed-mutation',updatedAt:now});
    await batch.commit();
    await updateDoc(doc(db,'workspaces',workspaceId),{activeBoardId:'personal-board',migration:{version:1,state:'verified',counts:{boards:1,lists:0,cards:0}}});
  });
};
const openOwnerAccess=async(page)=>{
  await page.locator('#boards-button').click();
  const manager=page.locator('#workspace-dialog');
  await expect(manager).toBeVisible();
  const row=manager.locator('#workspace-board-list .workspace-entry').filter({hasText:'Invitation sample board'});
  await expect(row).toBeVisible();
  await row.getByRole('button',{name:/Open Invitation sample board/}).click();
  await expect.poll(()=>page.evaluate(()=>FlowboardApp.getMode().kind)).toMatch(/cloud/);
  await page.locator('#boards-button').click();
  await expect(manager).toBeVisible();
  await expect(page.locator('#open-workspace-members')).toBeVisible();
  await page.locator('#open-workspace-members').click();
  const access=page.locator('#workspace-members-dialog');
  await expect(access).toBeVisible();
  await expect(page.locator('#create-invite-form')).toBeVisible();
  return {manager,access};
};
const invitationRecipient=async(browser,link,email,preparePersonal)=>{
  const context=await browser.newContext();
  await context.addInitScript(()=>{localStorage.setItem('flowboard-workspace','synthetic-invite-local-sentinel');localStorage.setItem('flowboard-data','synthetic-invite-secondary-sentinel');});
  const page=await context.newPage();
  await page.goto(link);
  await page.waitForFunction(()=>globalThis.__flowboardEmulatorTest?.ready===true);
  await expect(page.locator('#invite-dialog')).toBeVisible();
  const credentials=await createVerifiedInvitationIdentity(email);
  const identity=await page.evaluate(({email,password})=>globalThis.__flowboardEmulatorTest.signInInvitationIdentity(email,password),credentials);
  expect(identity.verified).toBe(true);
  await expect(page.locator('#invite-status')).toContainText('You are signed in');
  let personalWorkspaceId='';
  if(preparePersonal){
    const personal=await page.evaluate(()=>globalThis.__flowboardEmulatorTest.ensureInvitationPersonalHome());
    personalWorkspaceId=personal.workspaceId;
    expect(personal.state).toBe('created');
  }
  return {context,page,identity,personalWorkspaceId};
};

test('owners create verified Editor and Viewer invitations; recipients join and open shared boards safely',async({browser,page})=>{
  test.setTimeout(120000);
  await page.goto(`${baseURL}/tests/emulator/index.html?role=owner`);
  await page.waitForFunction(()=>globalThis.__flowboardEmulatorTest?.ready===true);
  const owner=await page.evaluate(()=>globalThis.__flowboardEmulatorTest.signInRole('owner'));
  const admin=await adminEnvironment(),workspaceId=`invitation-member-${randomUUID()}`;
  const recipients=[];
  try{
    await seedWorkspace(admin,{workspaceId,ownerUid:owner.uid});
    await page.evaluate(async id=>{
      const workspace=await FlowboardRuntime.cloudAdapter.fetchWorkspace(id);
      FlowboardApp.openCloudWorkspace(workspace,{id,name:'Invitation member fixture',ownerUid:(await FlowboardRuntime.cloudAdapter.getSession()).uid,role:'owner',status:'ready',personal:false,migration:{state:'verified'}});
    },workspaceId);
    const {access}=await openOwnerAccess(page,workspaceId);
    const inviteeEditor=`editor-${randomUUID()}@flowboard.test`,inviteeViewer=`viewer-${randomUUID()}@flowboard.test`,inviteeRevoked=`revoked-${randomUUID()}@flowboard.test`;
    const create=async(email,role)=>{
      await page.locator('#invite-email').fill(email);
      await page.locator('#invite-role').selectOption(role);
      await access.getByRole('button',{name:'Create invitation'}).click();
      await expect(page.locator('#invite-link-status')).toContainText('Invitation created.');
      const link=await page.locator('#invite-link-status a').getAttribute('href');
      expect(link).toBeTruthy();
      const parsed=new URL(link);
      expect(parsed.pathname).toBe('/UH-Flowboard/');
      expect([...parsed.searchParams.keys()].sort()).toEqual(['invite','workspace']);
      expect(parsed.searchParams.get('workspace')).toBe(workspaceId);
      const inviteId=parsed.searchParams.get('invite');
      const listed=await documentRows(admin,`workspaces/${workspaceId}/invites`);
      expect(listed.filter(item=>item.id===inviteId)).toHaveLength(1);
      expect(listed.find(item=>item.id===inviteId)).toMatchObject({emailLower:email,role,acceptedAt:null,revokedAt:null,createdBy:owner.uid});
      const expiresAt=listed.find(item=>item.id===inviteId).expiresAt.toMillis();
      expect(expiresAt-Date.now()).toBeGreaterThan(5*86_400_000);
      expect(expiresAt-Date.now()).toBeLessThanOrEqual(6*86_400_000+30_000);
      expect(await page.locator('#invite-email').inputValue()).toBe('');
      return {link,inviteId,email,role};
    };
    const editorInvite=await create(inviteeEditor,'editor');
    const viewerInvite=await create(inviteeViewer,'viewer');
    const revokedInvite=await create(inviteeRevoked,'viewer');
    const pendingCards=page.locator('#workspace-invites-list .invite-card');
    await expect(pendingCards).toHaveCount(3);
    for(const card of await pendingCards.all())await expect(card).toHaveAttribute('data-invite-status','pending');

    const editor=await invitationRecipient(browser,editorInvite.link,inviteeEditor,true);
    recipients.push(editor);
    const editorProfileBefore=await documentValue(admin,`users/${editor.identity.uid}`);
    expect(editorProfileBefore?.personalWorkspaceId).toBe(editor.personalWorkspaceId);
    await seedPersonalBoard(admin,editor.personalWorkspaceId);
    await editor.page.locator('#accept-invite').click();
    await expect(editor.page.locator('#invite-status')).toContainText('Invitation accepted. You have editor access.');
    await expect(editor.page.locator('#open-invited-workspace')).toBeVisible();
    expect(new URL(editor.page.url()).searchParams.get('invite')).toBe(editorInvite.inviteId);
    const editorMember=await documentValue(admin,`workspaces/${workspaceId}/members/${editor.identity.uid}`);
    const editorProfile=await documentValue(admin,`users/${editor.identity.uid}`);
    const editorInviteRecord=await documentValue(admin,`workspaces/${workspaceId}/invites/${editorInvite.inviteId}`);
    expect(editorMember).toMatchObject({uid:editor.identity.uid,role:'editor',emailLower:inviteeEditor,inviteId:editorInvite.inviteId});
    expect(editorProfile.personalWorkspaceId).toBe(editor.personalWorkspaceId);
    expect(editorProfile.workspaceIds).toEqual(expect.arrayContaining([editor.personalWorkspaceId,workspaceId]));
    expect(editorInviteRecord.acceptedBy).toBe(editor.identity.uid);
    expect(editorInviteRecord.acceptedAt).toBeTruthy();
    await editor.page.locator('#open-invited-workspace').click();
    await expect.poll(()=>editor.page.evaluate(()=>FlowboardApp.getMode().kind)).toBe('cloud');
    await expect(editor.page.locator('#board-title')).toHaveValue('Invitation sample board');
    expect(await editor.page.evaluate(()=>FlowboardApp.getMode().role)).toBe('editor');
    expect(new URL(editor.page.url()).searchParams.has('invite')).toBe(false);
    await editor.page.locator('#boards-button').click();
    const editorDirectory=editor.page.locator('#workspace-board-list');
    await expect(editorDirectory).toContainText('Invitation sample board');
    await expect(editorDirectory).toContainText('Recipient personal board');
    expect(await editor.page.evaluate(()=>({workspace:localStorage.getItem('flowboard-workspace'),data:localStorage.getItem('flowboard-data')}))).toEqual({workspace:'synthetic-invite-local-sentinel',data:'synthetic-invite-secondary-sentinel'});

    const viewer=await invitationRecipient(browser,viewerInvite.link,inviteeViewer,false);
    recipients.push(viewer);
    expect(await documentValue(admin,`users/${viewer.identity.uid}`)).toBeNull();
    await viewer.page.locator('#accept-invite').click();
    await expect(viewer.page.locator('#invite-status')).toContainText('Invitation accepted. You have viewer access.');
    const viewerMember=await documentValue(admin,`workspaces/${workspaceId}/members/${viewer.identity.uid}`);
    const viewerProfile=await documentValue(admin,`users/${viewer.identity.uid}`);
    expect(viewerMember).toMatchObject({uid:viewer.identity.uid,role:'viewer',emailLower:inviteeViewer,inviteId:viewerInvite.inviteId});
    expect(viewerProfile).toMatchObject({uid:viewer.identity.uid,emailLower:inviteeViewer,workspaceIds:[workspaceId]});
    await viewer.page.locator('#open-invited-workspace').click();
    await expect.poll(()=>viewer.page.evaluate(()=>FlowboardApp.getMode().kind)).toBe('cloud-preview');
    await expect(viewer.page.locator('#board-title')).toHaveValue('Invitation sample board');
    expect(await viewer.page.evaluate(()=>FlowboardApp.getMode().role)).toBe('viewer');
    expect(await viewer.page.locator('#board-title').getAttribute('readonly')).not.toBeNull();
    expect(await viewer.page.evaluate(()=>({workspace:localStorage.getItem('flowboard-workspace'),data:localStorage.getItem('flowboard-data')}))).toEqual({workspace:'synthetic-invite-local-sentinel',data:'synthetic-invite-secondary-sentinel'});

    await expect.poll(async()=>documentRows(admin,`workspaces/${workspaceId}/members`)).toHaveLength(3);
    await page.locator('#close-workspace-members').click();
    await page.locator('#open-workspace-members').click();
    await expect(access.locator('#workspace-members-list .member-card')).toHaveCount(3);
    const revokedCard=access.locator('#workspace-invites-list .invite-card').filter({hasText:inviteeRevoked});
    await revokedCard.getByRole('button',{name:'Revoke'}).click();
    const revokeDialog=page.getByRole('dialog',{name:'Revoke invitation?'});
    await expect(revokeDialog).toBeVisible();
    await revokeDialog.getByRole('button',{name:'Revoke invitation',exact:true}).click();
    const revokedRecord=await documentValue(admin,`workspaces/${workspaceId}/invites/${revokedInvite.inviteId}`);
    expect(revokedRecord.revokedAt).toBeTruthy();
    expect(revokedRecord.acceptedAt).toBeNull();
    await expect(revokedCard).toHaveAttribute('data-invite-status','revoked');
    const revokedRecipient=await invitationRecipient(browser,revokedInvite.link,inviteeRevoked,false);
    recipients.push(revokedRecipient);
    const revokedFailure=await revokedRecipient.page.evaluate(({workspaceId,inviteId})=>globalThis.__flowboardEmulatorTest.inviteFailure(workspaceId,inviteId),{workspaceId,inviteId:revokedInvite.inviteId});
    expect(revokedFailure).toEqual({code:'INVITE_UNAVAILABLE',stage:'invite-read'});
    await revokedRecipient.page.locator('#accept-invite').click();
    await expect(revokedRecipient.page.locator('#invite-status')).toContainText('This invitation is unavailable');
    expect(await documentValue(admin,`workspaces/${workspaceId}/members/${revokedRecipient.identity.uid}`)).toBeNull();
    expect(await documentValue(admin,`users/${revokedRecipient.identity.uid}`)).toBeNull();

    const editorRole=access.getByRole('combobox',{name:`Change role for ${inviteeEditor}`});
    await editorRole.selectOption('viewer');
    const roleDialog=page.getByRole('dialog',{name:'Change member role?'});
    await expect(roleDialog).toBeVisible();
    await roleDialog.getByRole('button',{name:'Change role',exact:true}).click();
    await expect.poll(async()=>(await documentValue(admin,`workspaces/${workspaceId}/members/${editor.identity.uid}`))?.role).toBe('viewer');
    await expect(access.getByRole('combobox',{name:`Change role for ${inviteeEditor}`})).toHaveValue('viewer');

    const remove=access.getByRole('button',{name:`Remove ${inviteeEditor}`});
    await remove.click();
    const removeDialog=page.getByRole('dialog',{name:'Remove member?'});
    await expect(removeDialog).toBeVisible();
    await removeDialog.getByRole('button',{name:'Remove member',exact:true}).click();
    await expect.poll(()=>documentValue(admin,`workspaces/${workspaceId}/members/${editor.identity.uid}`)).toBeNull();
    const lostAccess=await editor.page.evaluate(async id=>{try{await FlowboardRuntime.cloudAdapter.fetchWorkspace(id);return'allowed';}catch(error){return error.code||'unknown';}},workspaceId);
    expect(lostAccess).toBe('permission-denied');

    await viewer.page.goto(viewerInvite.link);
    await viewer.page.waitForFunction(()=>globalThis.__flowboardEmulatorTest?.ready===true);
    await expect(viewer.page.locator('#invite-dialog')).toBeVisible();
    await viewer.page.locator('#accept-invite').click();
    await expect(viewer.page.locator('#invite-status')).toContainText('Invitation accepted. You have viewer access.');
    await viewer.page.locator('#open-invited-workspace').click();
    await expect.poll(()=>viewer.page.evaluate(()=>FlowboardApp.getMode().kind)).toBe('cloud-preview');
    expect(await viewer.page.evaluate(()=>({workspace:localStorage.getItem('flowboard-workspace'),data:localStorage.getItem('flowboard-data')}))).toEqual({workspace:'synthetic-invite-local-sentinel',data:'synthetic-invite-secondary-sentinel'});

    await access.locator('#ownership-successor').selectOption(viewer.identity.uid);
    await access.locator('#former-owner-role').selectOption('editor');
    await access.getByRole('button',{name:'Transfer ownership'}).click();
    const transferDialog=page.getByRole('dialog',{name:'Transfer ownership?'});
    await expect(transferDialog).toBeVisible();
    await transferDialog.getByRole('button',{name:'Transfer ownership',exact:true}).click();
    await expect.poll(async()=>(await documentValue(admin,`workspaces/${workspaceId}`))?.ownerUid).toBe(viewer.identity.uid);
    expect((await documentValue(admin,`workspaces/${workspaceId}/members/${viewer.identity.uid}`)).role).toBe('owner');
    expect((await documentValue(admin,`workspaces/${workspaceId}/members/${owner.uid}`)).role).toBe('editor');
  }finally{
    await Promise.all(recipients.map(async item=>{await item.context.close();}));
    await admin.cleanup();
  }
});
