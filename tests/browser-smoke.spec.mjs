import {test, expect} from '@playwright/test';
import {readdirSync} from 'node:fs';
import {basePath} from '../scripts/repository-path.mjs';

const builtLifecycleAsset = () => `${basePath}assets/${readdirSync('dist/assets').find(file => file.startsWith('workspace-lifecycle-ui-') && file.endsWith('.js'))}`;
const builtCloudWorkspaceAsset = () => `${basePath}assets/${readdirSync('dist/assets').find(file => file.startsWith('cloud-workspace-ui-') && file.endsWith('.js'))}`;
const builtCloudSyncAsset = () => `${basePath}assets/${readdirSync('dist/assets').find(file => file.startsWith('cloud-sync-controller-') && file.endsWith('.js'))}`;
const builtMembersAsset = () => `${basePath}assets/${readdirSync('dist/assets').find(file => file.startsWith('members-ui-') && file.endsWith('.js'))}`;
const builtActivityAsset = () => `${basePath}assets/${readdirSync('dist/assets').find(file => file.startsWith('activity-ui-') && file.endsWith('.js'))}`;
const builtAssignmentAsset = () => `${basePath}assets/${readdirSync('dist/assets').find(file => file.startsWith('assignment-ui-') && file.endsWith('.js'))}`;
const builtCommentsAsset = () => `${basePath}assets/${readdirSync('dist/assets').find(file => file.startsWith('comments-ui-') && file.endsWith('.js'))}`;
const builtAuthAsset = () => `${basePath}assets/${readdirSync('dist/assets').find(file => file.startsWith('auth-ui-') && file.endsWith('.js'))}`;
const builtRosterAsset = () => `${basePath}assets/${readdirSync('dist/assets').find(file => file.startsWith('cloud-roster-ui-') && file.endsWith('.js'))}`;
const openReady = async page => { await page.goto(basePath); await page.waitForFunction(() => globalThis.FlowboardApp && globalThis.FlowboardState); await page.waitForFunction(() => /Google sign-in available|Signed in · local workspace|Local-only workspace/.test(document.querySelector('#cloud-status')?.textContent || '')); };

test('critical local-first card workflow persists after reload', async ({page}) => {
  await openReady(page);
  await expect(page.getByRole('heading', {level: 1})).toContainText('Website Launch');
  const firstList = page.locator('.list').first();
  await firstList.getByRole('button', {name: /add a card/i}).click();
  const title = `Release smoke ${Date.now()}`;
  await firstList.getByLabel('New card title').fill(title);
  await firstList.getByRole('button', {name: 'Add card'}).click();
  const createdCard = page.locator('.card-open').filter({hasText: title});
  await expect(createdCard).toBeVisible();
  await page.reload(); await page.waitForFunction(() => globalThis.FlowboardApp && globalThis.FlowboardState);
  await expect(page.locator('.card-open').filter({hasText: title})).toBeVisible();
});

test('getting started explains local starter content and safe cloud boundaries', async ({page}) => {
  await openReady(page);
  const guide = page.locator('details').filter({hasText:'Start here'});
  await expect(guide).toBeVisible();
  await guide.locator('summary').click();
  await expect(guide).toContainText('Local starter content.');
  await expect(guide).toContainText('export, recover');
  await expect(guide).toContainText('cloud workspaces');
  await expect(guide).toContainText('retained');
  await expect(guide).toContainText('Search this board above');
  await expect(guide).toContainText('Read-only previews');
  await expect(guide).toContainText('browser-local');
  await page.getByRole('button', {name:'Board actions'}).click();
  await expect(page.getByRole('menuitem', {name:'Board data: Export this board (JSON)'})).toBeVisible();
    await expect(page.getByRole('menuitem').filter({hasText:'Workspace data:'})).toHaveCount(2);
    await expect(page.getByRole('menuitem').filter({hasText:'Recovery:'})).toHaveCount(3);
    const initialLists = await page.locator('.list').count();
    await page.getByRole('menuitem', {name:'Add a list'}).click();
    await expect(page.locator('.list')).toHaveCount(initialLists + 1);
  await page.keyboard.press('Escape');
  await page.screenshot({path:'artifacts/mvp-v2/step-10/getting-started.png', fullPage:true});
  await page.screenshot({path:'artifacts/mvp-v2/step-11/start-here.png', fullPage:true});
});

test('malformed recovery and import inputs leave local storage unchanged', async ({page}) => {
  await openReady(page);
  const before = await page.evaluate(() => {
    const current = localStorage.getItem('flowboard-workspace');
    localStorage.setItem('flowboard-workspace-backups', JSON.stringify([{createdAt:new Date().toISOString(), workspace:{schemaVersion:5, boards:'invalid'}}]));
    return current;
  });
  await page.getByRole('button', {name:'Board actions'}).click();
  await page.getByRole('menuitem', {name:/Local recovery/}).click();
  const recovery = page.getByRole('dialog', {name:/Local recovery/});
  await expect(recovery).toContainText('Snapshot 1');
  await recovery.getByRole('button', {name:'Restore snapshot 1'}).click();
  await expect(page.locator('#toast')).toContainText('not valid and was not restored');
  expect(await page.evaluate(() => localStorage.getItem('flowboard-workspace'))).toBe(before);
  await recovery.getByRole('button', {name:'Close local recovery'}).click();
  await page.getByRole('button', {name:'Board actions'}).click();
  await page.getByRole('menuitem', {name:/Import data/}).click();
  await page.locator('#import-file').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{not valid json')});
  await expect(page.locator('#import-preview')).toContainText('not a valid Flowboard JSON export');
  await expect(page.locator('#apply-import')).toBeDisabled();
  expect(await page.evaluate(() => localStorage.getItem('flowboard-workspace'))).toBe(before);
});

test('browser-local mode remains editable without a fake collaboration planner', async ({page}) => {
  await openReady(page);
  await page.evaluate(() => {
    const workspace = FlowboardState.makeWorkspace(), board = workspace.boards[0], plannedViewer = {id:'legacy-viewer', name:'Legacy viewer', role:'viewer', addedAt:new Date().toISOString()};
    board.collaboration.members.push(plannedViewer);
    board.collaboration.currentMemberId = plannedViewer.id;
    localStorage.setItem('flowboard-workspace', JSON.stringify(workspace));
  });
  await page.reload(); await page.waitForFunction(() => globalThis.FlowboardApp && globalThis.FlowboardState);
  await expect(page.locator('#collaboration-summary')).toHaveText('Browser-local workspace · editable');
  await expect(page.locator('#collaboration-button')).toHaveCount(0);
  await expect(page.locator('#collaboration-dialog')).toHaveCount(0);
  const firstList = page.locator('.list').first();
  await firstList.getByRole('button', {name: /add a card/i}).click();
  await firstList.getByLabel('New card title').fill('Legacy viewer local edit');
  await firstList.getByRole('button', {name: 'Add card'}).click();
  await expect(page.locator('.card-open').filter({hasText:'Legacy viewer local edit'})).toBeVisible();
});

test('card detail dialog closes with Escape and returns focus', async ({page}) => {
  await openReady(page);
  const card = page.locator('.card-open').first();
  await card.focus();
  await card.click();
  const dialog = page.locator('#card-dialog');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(card).toBeFocused();
});

test('viewer card dialog close button remains enabled and returns focus', async ({page}) => {
  await openReady(page);
  await page.waitForFunction(() => globalThis.FlowboardApp && globalThis.FlowboardState);
  await page.evaluate(() => FlowboardApp.openCloudPreview(FlowboardState.makeWorkspace(), {id:'viewer-test', name:'Viewer test', role:'viewer'}));
  const card = page.locator('.card-open').first();
  await card.click();
  const dialog = page.locator('#card-dialog'), close = dialog.getByRole('button', {name:'Close card details'});
  await expect(dialog).toBeVisible();
  await expect(close).toBeEnabled();
  await close.click();
  await expect(dialog).toBeHidden();
  await expect(card).toBeFocused();
});

test('remote card changes close stale details and restore focus to the refreshed card', async ({page}) => {
  await openReady(page);
  await page.waitForFunction(() => globalThis.FlowboardApp && globalThis.FlowboardState);
  await page.evaluate(() => {
    const workspace = FlowboardState.makeWorkspace(), board = workspace.boards[0], next = FlowboardState.clone(board), target = next.lists[0].cards[0];
    target.title = 'Remote replacement';
    globalThis.FlowboardApp.openCloudWorkspace(workspace, {id:'remote-card-close', name:'Remote card test', role:'editor'});
    globalThis.remoteCardPayload = {board:{...next, lists:[]}, lists:next.lists.map(list => ({...list, cards:[]})), cards:next.lists.flatMap(list => list.cards.map(card => ({...card, listId:list.id})))};
  });
  const card = page.locator('.card-open').first();
  await card.click();
  await page.locator('#card-description-input').fill('Stale draft must be discarded');
  const applied = await page.evaluate(() => FlowboardApp.applyRemoteCloudBoard(globalThis.remoteCardPayload));
  expect(applied).toBe(true);
  await expect(page.locator('#card-dialog')).toBeHidden();
  const refreshed = page.locator('.card-open').filter({hasText:'Remote replacement'});
  await expect(refreshed).toBeFocused();
  await expect(page.locator('#announcer')).toContainText('changed elsewhere');
});

test('local Recovery lists, exports, and safely restores a snapshot', async ({page}) => {
  await openReady(page);
  const firstList = page.locator('.list').first();
  const title = `Recovery smoke ${Date.now()}`;
  await firstList.getByRole('button', {name: /add a card/i}).click();
  await firstList.getByLabel('New card title').fill(title);
  await firstList.getByRole('button', {name: 'Add card'}).click();
  await page.getByRole('button', {name: 'Board actions'}).click();
  const menu = page.getByRole('menu');
  await menu.getByRole('menuitem', {name: /Local recovery/}).click();
  const dialog = page.getByRole('dialog', {name: /Local recovery/});
  await expect(dialog).toContainText('Snapshot 1');
  const downloadPromise = page.waitForEvent('download');
  await dialog.getByRole('button', {name: 'Export snapshot 1'}).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('flowboard-recovery-snapshot-1.json');
  await dialog.getByRole('button', {name: 'Restore snapshot 1'}).click();
  const confirm = page.getByRole('dialog', {name: 'Restore local snapshot?'});
  await expect(confirm).toBeVisible();
  await confirm.getByRole('button', {name: 'Restore snapshot'}).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('.card-open').filter({hasText: title})).toHaveCount(0);
});

test('workspace root rename converges and archive returns the cloud session to local mode', async ({page}) => {
  await openReady(page);
  await page.waitForFunction(() => globalThis.FlowboardApp && globalThis.FlowboardState);
  await expect(page.locator('#cloud-status')).toHaveText(/Google sign-in available|Local-only workspace/);
  await page.evaluate(async asset => {
    const {initializeCloudSyncController} = await import(asset);
    let listener, subscriptions = 0, stops = 0;
    const adapter = {
      verifyWorkspaceAccess:async () => 'owner',
      subscribeWorkspace:async options => { listener = options; subscriptions += 1; return () => { stops += 1; }; }
    };
    FlowboardApp.openCloudWorkspace(FlowboardState.makeWorkspace(), {id:'root-listener-fixture', name:'Before root rename', role:'owner'});
    initializeCloudSyncController(adapter).setSession({uid:'owner'});
    globalThis.lifecycleRootProbe = {
      ready:() => Boolean(listener),
      rename:() => listener.onWorkspace({status:'ready', name:'After root rename'}),
      archive:() => listener.onWorkspace({status:'archived', name:'After root rename'}),
      late:() => listener.onWorkspace({status:'ready', name:'Late root rename'}),
      counts:() => ({subscriptions, stops})
    };
  }, builtCloudSyncAsset());
  await page.waitForFunction(() => lifecycleRootProbe.ready());
  await page.evaluate(() => lifecycleRootProbe.rename());
  await expect.poll(() => page.evaluate(() => FlowboardApp.getMode().name)).toBe('After root rename');
  await page.evaluate(() => lifecycleRootProbe.archive());
  await expect.poll(() => page.evaluate(() => FlowboardApp.getMode().kind)).toBe('local');
  await page.evaluate(() => { lifecycleRootProbe.late(); window.dispatchEvent(new Event('online')); });
  await expect.poll(() => page.evaluate(() => lifecycleRootProbe.counts())).toEqual({subscriptions:1, stops:1});
  await expect(page.getByText('Browser-local workspace · editable')).toBeVisible();
});

test('Google account dialog preserves an explicit local-only boundary', async ({page}) => {
  await openReady(page);
  await expect(page.locator('#cloud-status')).toHaveText(/Google sign-in available|Local-only workspace/);
  const account = page.getByRole('button', {name: 'Sign in with Google'});
  if (await page.locator('#cloud-status').textContent() === 'Local-only workspace') {
    await expect(account).toBeHidden();
    return;
  }
  await account.click();
  const dialog = page.getByRole('dialog', {name:/Sign in|Account/});
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("Signing in does not upload, merge, replace, or delete this browser's workspace.");
  await expect(dialog.getByRole('button', {name: 'Continue with Google'})).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(account).toBeFocused();
});

test('account panel is a first-level workspace and profile hub without session fanout', async ({page}) => {
  await openReady(page);
  await page.route('https://lh3.googleusercontent.com/**', route => route.fulfill({status:200, contentType:'image/svg+xml', body:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2 2"><path d="M0 0h2v2H0z" fill="rebeccapurple"/></svg>'}));
  const before = await page.evaluate(() => { document.querySelector('#account-button').hidden = false; return localStorage.getItem('flowboard-workspace'); });
  await page.evaluate(async ({authAsset, membersAsset}) => {
    globalThis.FlowboardApp = {getMode:() => ({kind:'cloud', id:'synthetic-workspace', name:'Synthetic workspace', role:'owner', syncStatus:'Synced'})};
    const member = {uid:'synthetic-owner', displayName:'Synthetic owner', role:'owner', emailLower:'owner@example.test', photoURL:''};
    let propagations = 0;
    const adapter = {
      onAuthStateChange: callback => { globalThis.syntheticAuth = callback; return () => {}; },
      signInWithGoogle:async() => null, signOut:async() => {}, listMembers:async() => [member], listInvites:async() => [],
      updateOwnMemberProfile:async() => {}, changeMemberRole:async() => {}, removeMember:async() => {}, leaveWorkspace:async() => {},
      transferOwnership:async() => {}, revokeInvite:async() => {}, createInvite:async() => ({url:'https://example.test/invite'})
    };
    const {initializeMembersUI} = await import(membersAsset);
    const members = initializeMembersUI(adapter);
    const {initializeAuthUI} = await import(authAsset);
    initializeAuthUI(adapter, {onSessionChange: session => { propagations += 1; members.setSession(session); }});
    await globalThis.syntheticAuth({uid:'synthetic-owner', displayName:'Synthetic owner', email:'owner@example.test', photoURL:'https://lh3.googleusercontent.com/a/synthetic=s96-c'});
    globalThis.syntheticPropagationCount = () => propagations;
  }, {authAsset:builtAuthAsset(), membersAsset:builtMembersAsset()});
  await expect(page.locator('#workspace-profile-section')).not.toHaveAttribute('hidden', '');
  await page.locator('#account-button').click();
  const account = page.getByRole('dialog', {name:'Account'});
  await expect(account).toBeVisible();
  await expect(account.locator('#account-workspace-name')).toHaveText('Synthetic workspace');
  await expect(account.locator('#account-workspace-detail')).toContainText('Cloud workspace · owner · Synced');
  await expect(account.getByRole('button', {name:'Share Google profile photo'})).toBeVisible();
  await expect(page.locator('#account-button')).toHaveAttribute('aria-label', 'Account: Synthetic owner');
  await expect(page.locator('#account-button img')).toHaveCount(1);
  const count = await page.evaluate(() => globalThis.syntheticPropagationCount());
  await page.getByRole('button', {name:'Close account'}).click();
  await page.locator('#account-button').click();
  await expect.poll(() => page.evaluate(() => globalThis.syntheticPropagationCount())).toBe(count);
  await page.locator('#account-open-appearance').click();
  await expect(page.getByRole('dialog',{name:'Personalize Flowboard'})).toBeVisible();
  await page.getByRole('button',{name:'Close appearance'}).click();
  await expect(page.locator('#account-button')).toBeFocused();
  expect(await page.evaluate(() => localStorage.getItem('flowboard-workspace'))).toBe(before);
});

test('Workspace status opens cloud chooser separately from Boards', async ({page}) => {
  await openReady(page);
  await page.evaluate(async asset => {
    await new Promise(resolve => setTimeout(resolve, 50));
    globalThis.FlowboardApp = {getMode:() => ({kind:'local'}), returnToLocal:()=>{}, exportCloudPreview:()=>{}};
    const cloudAdapter={listWorkspaces:async()=>[]};
    const {initializeCloudWorkspaceUI}=await import(asset);
    initializeCloudWorkspaceUI({localAdapter:{},cloudAdapter}).setSession({uid:'owner'});
  }, builtCloudWorkspaceAsset());
  await expect(page.locator('#boards-button')).toHaveText('Boards');
  await expect(page.locator('#cloud-status')).toBeEnabled();
  await expect(page.locator('#cloud-status')).toHaveAccessibleName(/Open workspace chooser/);
  await page.locator('#cloud-status').click();
  await expect(page.getByRole('dialog', {name:'Cloud workspaces'})).toBeVisible();
  await page.getByRole('button', {name:'Close cloud workspaces'}).click();
  await expect(page.locator('#cloud-status')).toBeFocused();
});

test('cloud status feedback stays distinct and preserves local data scope', async ({page}) => {
  await openReady(page);
  const before = await page.evaluate(() => localStorage.getItem('flowboard-workspace'));
  await page.evaluate(() => FlowboardApp.openCloudWorkspace(FlowboardState.makeWorkspace(), {id:'status-fixture',name:'Status fixture',role:'editor'}));
  await page.locator('#cloud-status').evaluate(node => { node.disabled = false; });
  for (const status of ['Connecting','Saving','Synced','Offline','Conflict','Error']) {
    await page.evaluate(value => FlowboardApp.setCloudSyncStatus(value, `${value} status`), status);
    await expect(page.locator('#cloud-status')).toHaveText(`Cloud workspace · editor · ${status}`);
    await expect(page.locator('#cloud-status')).toHaveAttribute('title', `${status} status`);
  }
  await page.getByRole('button',{name:'Open appearance settings'}).click();
  await page.getByRole('button',{name:'Close appearance'}).click();
  await expect(page.locator('#cloud-status')).toHaveText('Cloud workspace · editor · Error');
  await page.evaluate(() => FlowboardApp.returnToLocal());
  await expect(page.locator('#collaboration-summary')).toHaveText('Browser-local workspace · editable');
  expect(await page.evaluate(expected => localStorage.getItem('flowboard-workspace') === expected, before)).toBe(true);
});

test('short desktop dialogs keep close actions reachable and return focus', async ({page}) => {
  await page.setViewportSize({width:960,height:720});
  await openReady(page);
  await page.getByRole('button',{name:'Open appearance settings'}).click();
  const appearance=page.getByRole('dialog',{name:'Personalize Flowboard'});
  const appearanceMetrics=await appearance.evaluate(dialog=>{const box=dialog.getBoundingClientRect(),close=dialog.querySelector('.dialog-close').getBoundingClientRect();return {top:box.top,bottom:box.bottom,closeBottom:close.bottom,height:innerHeight};});
  expect(appearanceMetrics.top).toBeGreaterThanOrEqual(0);
  expect(appearanceMetrics.bottom).toBeLessThanOrEqual(appearanceMetrics.height);
  expect(appearanceMetrics.closeBottom).toBeLessThanOrEqual(appearanceMetrics.height);
  await appearance.getByRole('button',{name:'Close appearance'}).click();
  await expect(page.getByRole('button',{name:'Open appearance settings'})).toBeFocused();
  await page.getByRole('button',{name:'Boards'}).click();
  const boards=page.getByRole('dialog',{name:'Your boards'});
  const boardMetrics=await boards.evaluate(dialog=>{const box=dialog.getBoundingClientRect(),close=dialog.querySelector('.dialog-close').getBoundingClientRect();return {top:box.top,bottom:box.bottom,closeBottom:close.bottom,height:innerHeight};});
  expect(boardMetrics.top).toBeGreaterThanOrEqual(0);
  expect(boardMetrics.bottom).toBeLessThanOrEqual(boardMetrics.height);
  expect(boardMetrics.closeBottom).toBeLessThanOrEqual(boardMetrics.height);
  await boards.getByRole('button',{name:'Close boards'}).click();
  await expect(page.getByRole('button',{name:'Boards'})).toBeFocused();
});

test('rich dialogs keep close actions reachable across office and compatibility widths', async ({page}) => {
  await openReady(page);
  await page.locator('#account-button').evaluate(button => { button.hidden = false; });
  await page.evaluate(async ({cloudAsset,authAsset}) => {
    globalThis.FlowboardApp = {getMode:() => ({kind:'local'}), returnToLocal:()=>{}, exportCloudPreview:()=>{}};
    const {initializeCloudWorkspaceUI}=await import(cloudAsset);
    initializeCloudWorkspaceUI({localAdapter:{},cloudAdapter:{listWorkspaces:async()=>[]}}).setSession({uid:'owner'});
    const {initializeAuthUI}=await import(authAsset);
    initializeAuthUI({onAuthStateChange:()=>()=>{},signInWithGoogle:async()=>{},signOut:async()=>{} });
  }, {cloudAsset:builtCloudWorkspaceAsset(),authAsset:builtAuthAsset()});
  const sizes = [{width:1280,height:720},{width:1440,height:900},{width:1920,height:1080},{width:960,height:720},{width:390,height:720},{width:320,height:720}];
  const check = async (dialog, close) => {
    await expect(dialog).toBeVisible();
    const metrics=await dialog.evaluate(node=>{const box=node.getBoundingClientRect(),button=node.querySelector('.dialog-close').getBoundingClientRect();return {top:box.top,bottom:box.bottom,right:box.right,closeBottom:button.bottom,closeRight:button.right,width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth};});
    expect(metrics.top).toBeGreaterThanOrEqual(0);
    expect(metrics.bottom).toBeLessThanOrEqual(metrics.height);
    expect(metrics.right).toBeLessThanOrEqual(metrics.width);
    expect(metrics.closeBottom).toBeLessThanOrEqual(metrics.height);
    expect(metrics.closeRight).toBeLessThanOrEqual(metrics.width);
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.width);
    await close.click();
  };
  for (const size of sizes) {
    await page.setViewportSize(size);
    const accountButton=page.locator('#account-button');
    await accountButton.click();
    await check(page.getByRole('dialog',{name:/Sign in|Account/}),page.getByRole('button',{name:'Close account'}));
    await expect(accountButton).toBeFocused();
    const appearanceButton=page.getByRole('button',{name:'Open appearance settings'});
    await appearanceButton.click();
    await check(page.getByRole('dialog',{name:'Personalize Flowboard'}),page.getByRole('button',{name:'Close appearance'}));
    await expect(appearanceButton).toBeFocused();
    const boardsButton=page.getByRole('button',{name:'Boards'});
    await boardsButton.click();
    await check(page.getByRole('dialog',{name:'Your boards'}),page.getByRole('button',{name:'Close boards'}));
    await expect(boardsButton).toBeFocused();
    const workspaceButton=page.locator('#cloud-status');
    await workspaceButton.click();
    await check(page.getByRole('dialog',{name:'Cloud workspaces'}),page.getByRole('button',{name:'Close cloud workspaces'}));
    await expect(workspaceButton).toBeFocused();
  }
});

test('owner workspace lifecycle dialog renames, archives, restores, and returns focus', async ({page}) => {
  await openReady(page);
  await page.evaluate(async asset => {
    const {createWorkspaceLifecycleControls} = await import(asset);
    const fixture = document.createElement('section'), openButton = document.createElement('button');
    const title = document.createElement('strong'), detail = document.createElement('span'), status = document.createElement('output');
    fixture.className = 'lifecycle-fixture'; openButton.textContent = 'Open fixture'; title.textContent = 'Lifecycle fixture';
    fixture.append(openButton, title, detail, status); document.body.prepend(fixture);
    const entry = {id:'fixture', name:'Lifecycle fixture', ownerUid:'owner', role:'owner', status:'ready', migration:{state:'verified'}};
    let revision=0;
    const mutate=options=>{if(options.expectedRevision!==revision)throw Object.assign(new Error('This workspace changed in another session. Refresh and try again.'),{code:'REVISION_CONFLICT'});return ++revision;};
    globalThis.advanceLifecycleRevision=()=>++revision;
    const adapter = {
      renameWorkspace:async options => ({name:options.name.trim(),lifecycleRevision:mutate(options)}),
      archiveWorkspace:async options => ({status:'archived',lifecycleRevision:mutate(options)}),
      restoreWorkspace:async options => ({status:'ready',lifecycleRevision:mutate(options)})
    };
    fixture.append(createWorkspaceLifecycleControls({entry, session:{uid:'owner'}, cloudAdapter:adapter, openButton, title, detail, lifecycleStatus:status}));
    const nonOwner = document.createElement('section'), nonOwnerOpen = document.createElement('button');
    nonOwner.className = 'non-owner-lifecycle-fixture';
    nonOwner.append(nonOwnerOpen, createWorkspaceLifecycleControls({entry:{...entry, role:'editor'}, session:{uid:'editor'}, cloudAdapter:adapter, openButton:nonOwnerOpen, title:document.createElement('strong'), detail:document.createElement('span'), lifecycleStatus:document.createElement('output')}));
    document.body.prepend(nonOwner);
  }, builtLifecycleAsset());

  const fixture = page.locator('.lifecycle-fixture');
  await expect(page.locator('.non-owner-lifecycle-fixture').getByRole('button')).toHaveCount(1);
  await fixture.getByRole('button', {name:'Rename'}).click();
  const rename = page.getByRole('dialog', {name:'Rename cloud workspace'});
  await rename.getByLabel('Workspace name').fill('Renamed lifecycle fixture');
  await rename.getByRole('button', {name:'Save name'}).click();
  await expect(fixture.locator('strong')).toHaveText('Renamed lifecycle fixture');

  const archiveButton = fixture.getByRole('button', {name:'Archive'});
  await archiveButton.click();
  const archive = page.getByRole('dialog', {name:'Archive cloud workspace?'});
  await expect(archive).toContainText('contents will be retained');
  await page.keyboard.press('Escape');
  await expect(archiveButton).toBeFocused();
  await archiveButton.click();
  await archive.getByRole('button', {name:'Archive workspace'}).click();
  await expect(fixture.getByRole('button', {name:'Open fixture'})).toBeHidden();
  await expect(fixture).toContainText('archived · retained');
  await fixture.getByRole('button', {name:'Restore'}).click();
  await expect(fixture.getByRole('button', {name:'Open fixture'})).toBeVisible();
  await page.evaluate(()=>globalThis.advanceLifecycleRevision());
  await fixture.getByRole('button', {name:'Rename'}).click();
  await rename.getByLabel('Workspace name').fill('Stale lifecycle fixture');
  await rename.getByRole('button', {name:'Save name'}).click();
  await expect(rename).toBeVisible();
  await expect(rename.getByRole('status')).toHaveText('This workspace changed in another session. Refresh and try again.');
  await expect(rename.getByRole('button', {name:'Save name'})).toBeEnabled();
  await expect(fixture.locator('strong')).toHaveText('Renamed lifecycle fixture');
  await rename.getByRole('button', {name:'Cancel'}).click();
});

test('cloud collaboration access explains roles and invitation lifecycle', async ({page}) => {
  await openReady(page);
  await page.evaluate(async asset => {
    document.body.innerHTML = `<button id="open-workspace-members">Manage members</button><dialog id="workspace-members-dialog" aria-labelledby="workspace-members-heading"><h2 id="workspace-members-heading">Members and invitations</h2><button id="close-workspace-members">Close</button><p id="workspace-members-status"></p><form id="create-invite-form" hidden><input id="invite-email"><select id="invite-role"><option value="editor">Editor</option></select><button type="submit">Create invitation</button></form><p id="invite-link-status"></p><div id="workspace-members-list"></div><section id="workspace-invites-section" hidden><h3>Pending invitations</h3><div id="workspace-invites-list"></div></section><form id="transfer-ownership-form" hidden><select id="ownership-successor"></select><select id="former-owner-role"><option value="editor">Editor</option></select><button type="submit">Transfer ownership</button></form></dialog>`;
    globalThis.FlowboardApp = {getMode:() => ({kind:'cloud', id:'collaboration-fixture', role:'owner'})};
    const now = Date.now(), stamp = value => ({toDate:() => new Date(value)});
    const invites = [
      {id:'pending', emailLower:'pending@example.test', role:'editor', expiresAt:stamp(now + 86_400_000)},
      {id:'accepted', emailLower:'accepted@example.test', role:'viewer', acceptedAt:stamp(now - 1_000), expiresAt:stamp(now + 86_400_000)},
      {id:'expired', emailLower:'expired@example.test', role:'viewer', expiresAt:stamp(now - 1_000)}
    ];
    const adapter = {
      listMembers:async() => [{uid:'owner', displayName:'Owner', role:'owner'}, {uid:'editor', displayName:'Editor', role:'editor'}],
      listInvites:async() => invites,
      createInvite:async() => ({}), revokeInvite:async() => {}, changeMemberRole:async() => {}, removeMember:async() => {}, leaveWorkspace:async() => {}, transferOwnership:async() => {}
    };
    const {initializeMembersUI} = await import(asset);
    initializeMembersUI(adapter).setSession({uid:'owner'});
  }, builtMembersAsset());
  await page.getByRole('button', {name:'Manage members'}).click();
  const dialog = page.getByRole('dialog', {name:'Members and invitations'});
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('#workspace-members-list')).toContainText('Owner');
  await expect(dialog.locator('#workspace-members-list')).toContainText('Editor');
  const invites = dialog.locator('#workspace-invites-list');
  await expect(invites).toContainText('pending@example.test');
  await expect(invites).toContainText('Pending');
  await expect(invites).toContainText('accepted@example.test');
  await expect(invites).toContainText('Accepted');
  await expect(invites).toContainText('expired@example.test');
  await expect(invites).toContainText('Expired');
  await expect(invites.locator('[data-invite-status="pending"] .button', {hasText:'Copy link'})).toHaveCount(1);
  await expect(invites.locator('[data-invite-status="pending"] .button', {hasText:'Revoke'})).toHaveCount(1);
  await expect(invites.locator('[data-invite-status="accepted"] .button')).toHaveCount(0);
  await expect(invites.locator('[data-invite-status="expired"] .button')).toHaveCount(0);
  await page.screenshot({path:'artifacts/mvp-v2/step-9/members-owner.png', fullPage:true});
});

test('viewer collaboration access stays read-only with an explicit leave action', async ({page}) => {
  await openReady(page);
  await page.evaluate(async asset => {
    document.body.innerHTML = `<button id="open-workspace-members">Manage members</button><dialog id="workspace-members-dialog" aria-labelledby="workspace-members-heading"><h2 id="workspace-members-heading">Members and invitations</h2><button id="close-workspace-members">Close</button><p id="workspace-members-status"></p><form id="create-invite-form" hidden><input id="invite-email"><select id="invite-role"><option value="viewer">Viewer</option></select><button type="submit">Create invitation</button></form><p id="invite-link-status"></p><div id="workspace-members-list"></div><section id="workspace-invites-section" hidden><div id="workspace-invites-list"></div></section><form id="transfer-ownership-form" hidden><select id="ownership-successor"></select><select id="former-owner-role"><option value="editor">Editor</option></select><button type="submit">Transfer ownership</button></form></dialog>`;
    globalThis.FlowboardApp = {getMode:() => ({kind:'cloud-preview', id:'collaboration-fixture', role:'viewer'})};
    const adapter = {
      listMembers:async() => [{uid:'owner', displayName:'Owner', role:'owner'}, {uid:'viewer', displayName:'Viewer', role:'viewer'}],
      listInvites:async() => { throw Error('viewer must not list invites'); },
      changeMemberRole:async() => {}, removeMember:async() => {}, leaveWorkspace:async() => {}, transferOwnership:async() => {}, revokeInvite:async() => {}, createInvite:async() => ({})
    };
    const {initializeMembersUI} = await import(asset);
    initializeMembersUI(adapter).setSession({uid:'viewer'});
  }, builtMembersAsset());
  await page.getByRole('button', {name:'Manage members'}).click();
  const dialog = page.getByRole('dialog', {name:'Members and invitations'});
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('You have viewer access.');
  await expect(dialog.locator('#create-invite-form')).toBeHidden();
  await expect(dialog.locator('#workspace-invites-section')).toBeHidden();
  await expect(dialog.locator('#transfer-ownership-form')).toBeHidden();
  await expect(dialog.locator('#workspace-members-list select')).toHaveCount(0);
  await expect(dialog.getByRole('button', {name:'Leave workspace'})).toBeVisible();
  await page.screenshot({path:'artifacts/mvp-v2/step-9/members-viewer.png', fullPage:true});
});

test('late member results never paint a different workspace', async ({page}) => {
  await openReady(page);
  await page.evaluate(async asset => {
    document.body.innerHTML = `<button id="open-workspace-members">Manage members</button><dialog id="workspace-members-dialog"><button id="close-workspace-members">Close</button><p id="workspace-members-status"></p><div id="workspace-members-list"></div><form id="create-invite-form"></form><input id="invite-email"><select id="invite-role"><option value="viewer">Viewer</option></select><section id="workspace-invites-section"><div id="workspace-invites-list"></div></section><p id="invite-link-status"></p><form id="transfer-ownership-form"><select id="ownership-successor"></select><select id="former-owner-role"><option value="editor">Editor</option></select></form></dialog>`;
    globalThis.memberWorkspace = 'workspace-a';
    globalThis.memberResolvers = [];
    globalThis.FlowboardApp = {getMode:() => ({kind:'cloud', id:globalThis.memberWorkspace, role:'owner'}), returnToLocal:() => {}};
    const adapter = {listMembers:async() => new Promise(resolve => { globalThis.memberResolvers.push(resolve); }), listInvites:async() => [], changeMemberRole:async() => {}, removeMember:async() => {}, leaveWorkspace:async() => {}, transferOwnership:async() => {}, createInvite:async() => ({url:'https://example.test/invite'}), revokeInvite:async() => {}};
    const {initializeMembersUI} = await import(asset);
    initializeMembersUI(adapter).setSession({uid:'owner'});
    document.querySelector('#open-workspace-members').click();
  }, builtMembersAsset());
  await page.waitForFunction(() => globalThis.memberResolvers.length > 0);
  await page.evaluate(() => { globalThis.memberWorkspace = 'workspace-b'; window.dispatchEvent(new Event('flowboard:cloud-preview-change')); globalThis.memberResolvers[0]([{uid:'owner', displayName:'Stale member', role:'owner'}]); });
  await expect(page.locator('#workspace-members-list')).not.toContainText('Stale member');
});

test('late activity results are discarded after returning local', async ({page}) => {
  await openReady(page);
  await page.evaluate(async asset => {
    document.body.innerHTML = `<button id="view-cloud-activity">View activity</button><dialog id="cloud-activity-dialog"><button id="close-cloud-activity">Close</button><p id="cloud-activity-status"></p><ol id="cloud-activity-list"></ol><button id="load-more-cloud-activity"></button></dialog>`;
    globalThis.resolveActivity = null;
    const adapter = {listActivity:async() => new Promise(resolve => { globalThis.resolveActivity = resolve; })};
    const {initializeActivityUI} = await import(asset);
    initializeActivityUI(adapter).setSession({uid:'owner'});
    window.dispatchEvent(new CustomEvent('flowboard:cloud-selection', {detail:{id:'workspace-a'}}));
    document.querySelector('#view-cloud-activity').click();
  }, builtActivityAsset());
  await page.waitForFunction(() => typeof globalThis.resolveActivity === 'function');
  await page.evaluate(() => { window.dispatchEvent(new CustomEvent('flowboard:cloud-selection', {detail:null})); globalThis.resolveActivity({entries:[{actorUid:'owner',action:'workspace-updated',createdAt:null}],cursor:null,hasMore:false}); });
  await expect(page.locator('#cloud-activity-list li')).toHaveCount(0);
});

test('late assignment members are discarded after card closure', async ({page}) => {
  await openReady(page);
  await page.evaluate(async asset => {
    document.body.innerHTML = `<dialog id="card-dialog"><div id="local-assignees-field"></div><fieldset id="cloud-assignees-field"><p id="cloud-assignees-status"></p><div id="cloud-assignees-options"></div></fieldset><input id="assignee-uids-input" value=""><input id="assignees-input" value=""><input id="legacy-assignees-input" value=""></dialog>`;
    globalThis.assignmentMode = {kind:'cloud', id:'workspace-a', role:'editor'};
    globalThis.resolveAssignment = null;
    globalThis.FlowboardApp = {getMode:() => globalThis.assignmentMode};
    const adapter = {listMembers:async() => new Promise(resolve => { globalThis.resolveAssignment = resolve; })};
    const {initializeAssignmentUI} = await import(asset);
    initializeAssignmentUI(adapter).setSession({uid:'owner'});
    const dialog = document.querySelector('#card-dialog'); dialog.dataset.cardId = 'card-a'; dialog.showModal();
  }, builtAssignmentAsset());
  await page.waitForFunction(() => typeof globalThis.resolveAssignment === 'function');
  await page.evaluate(() => { globalThis.assignmentMode = {kind:'local'}; document.querySelector('#card-dialog').close(); globalThis.resolveAssignment([{uid:'owner',displayName:'Stale member',role:'editor'}]); });
  await expect(page.locator('#cloud-assignees-options')).not.toContainText('Stale member');
});

test('late comment pagination is discarded after card closure', async ({page}) => {
  await openReady(page);
  await page.evaluate(async asset => {
    document.body.innerHTML = `<dialog id="card-dialog" data-card-id="card-a"><section id="cloud-comments-section"><p id="cloud-comments-status"></p><span id="cloud-comments-count"></span><ol id="cloud-comments-list"></ol><button id="load-older-comments" hidden>Load older</button><div id="cloud-comment-form"><textarea id="cloud-comment-input"></textarea><button id="add-cloud-comment">Comment</button></div><p id="cloud-comments-readonly"></p></section></dialog><dialog id="comment-delete-dialog"></dialog>`;
    globalThis.commentSubscription = null;
    globalThis.resolveOlderComments = null;
    globalThis.FlowboardApp = {getMode:() => ({kind:'cloud', id:'workspace-a', role:'editor'}), getActiveBoardId:() => 'board-a'};
    const adapter = {listMembers:async() => [{uid:'owner',displayName:'Owner',role:'editor'}], subscribeComments:async options => { globalThis.commentSubscription = options; return () => {}; }, listOlderComments:async() => new Promise(resolve => { globalThis.resolveOlderComments = resolve; }), createComment:async() => {}, updateComment:async() => {}, removeComment:async() => {}};
    const {initializeCommentsUI} = await import(asset);
    initializeCommentsUI(adapter).setSession({uid:'owner'});
    document.querySelector('#card-dialog').showModal();
  }, builtCommentsAsset());
  await page.waitForFunction(() => typeof globalThis.commentSubscription?.onComments === 'function');
  await page.evaluate(() => globalThis.commentSubscription.onComments({entries:[],cursor:{id:'cursor'},hasMore:true}));
  await page.locator('#load-older-comments').click();
  await page.waitForFunction(() => typeof globalThis.resolveOlderComments === 'function');
  await page.locator('#card-dialog').evaluate(dialog => dialog.close());
  await page.evaluate(() => globalThis.resolveOlderComments({entries:[{id:'stale-comment',authorUid:'owner',body:'Stale comment',createdAt:null}],cursor:null,hasMore:false}));
  await expect(page.locator('#cloud-comments-list')).not.toContainText('Stale comment');
});

test('owner can retry an interrupted migration and the workspace list refreshes to editable', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await openReady(page);
  await page.evaluate(async asset => {
    document.body.innerHTML = `<dialog id="account-dialog"></dialog><button id="open-cloud-migration"></button><dialog id="cloud-migration-dialog"><button id="close-cloud-migration"></button><input id="cloud-workspace-name"><dl id="cloud-migration-summary"></dl><p id="cloud-migration-status"></p><button id="download-migration-backup"></button><button id="create-cloud-workspace"></button></dialog><button id="open-cloud-workspaces">Cloud workspaces</button><dialog id="cloud-workspaces-dialog"><button id="close-cloud-workspaces"></button><div id="cloud-workspaces-list"></div><p id="cloud-workspaces-status"></p><button id="return-to-local-workspace"></button><button id="migrate-cloud-workspace">Migrate cloud format</button><button id="export-cloud-workspace"></button></dialog><div id="announcer"></div>`;
    let verified = false;
    const entry = () => ({id:'retry-fixture',name:'Interrupted fixture',ownerUid:'owner',role:'owner',status:verified?'ready':'migrating',migration:{state:verified?'verified':'migrating'}});
    const archivedEntry = {id:'archived-fixture',name:'Archived fixture',ownerUid:'owner',role:'owner',status:'archived',migration:{state:'verified'}};
    const cloudAdapter = {
      listWorkspaces:async()=>[entry(),archivedEntry],
      fetchWorkspace:async()=>{if(!verified)throw new Error('interrupted');return {schemaVersion:4,activeBoardId:'board',boards:[]};},
      migrateWorkspaceToGranular:async()=>{verified=true;return {boards:1,lists:1,cards:1};},
      renameWorkspace:async()=>({}),archiveWorkspace:async()=>({}),restoreWorkspace:async()=>({lifecycleRevision:1})
    };
    globalThis.FlowboardApp={getMode:()=>({kind:'local'}),openCloudPreview:()=>{},returnToLocal:()=>{},exportCloudPreview:()=>{}};
    const {initializeCloudWorkspaceUI}=await import(asset);
    initializeCloudWorkspaceUI({localAdapter:{},cloudAdapter}).setSession({uid:'owner'});
  }, builtCloudWorkspaceAsset());
  await page.getByRole('button',{name:'Cloud workspaces'}).click();
  const archivedRow=page.locator('.workspace-entry').filter({hasText:'Archived fixture'});
  await expect(archivedRow).toContainText('Cloud workspace · archived · retained');
  await expect(archivedRow.getByRole('button',{name:/Open|Rename|Archive/})).toHaveCount(0);
  await expect(archivedRow.getByRole('button',{name:'Restore'})).toBeVisible();
  const [summaryBox,restoreBox]=await Promise.all([archivedRow.locator('.workspace-board').boundingBox(),archivedRow.getByRole('button',{name:'Restore'}).boundingBox()]);

  expect(restoreBox.y).toBeGreaterThanOrEqual(summaryBox.y+summaryBox.height-1);
  await archivedRow.getByRole('button',{name:'Restore'}).click();
  await expect(archivedRow).toContainText('Cloud workspace · owner · editable');
  await expect(archivedRow.getByRole('button',{name:'Open Archived fixture'})).toBeVisible();
  await expect(archivedRow.getByRole('button',{name:'Rename'})).toBeVisible();
  await expect(archivedRow.getByRole('button',{name:'Archive',exact:true})).toBeVisible();
  await expect(archivedRow.getByRole('button',{name:'Restore'})).toHaveCount(0);
  await page.getByRole('button',{name:/Interrupted fixture/}).click();
  await expect(page.locator('#cloud-workspaces-status')).toContainText('migration was interrupted');
  await page.getByRole('button',{name:'Migrate cloud format'}).click();
  await expect(page.locator('#cloud-workspaces-list')).toContainText('owner · editable');
});

test('desktop board discovery handles many long board names', async ({page}) => {
  await page.setViewportSize({width:1440, height:900});
  await openReady(page);
  await page.evaluate(() => {
    const workspace = FlowboardState.makeWorkspace();
    workspace.boards = Array.from({length:8}, (_, index) => { const board=FlowboardState.makeBoard('blank'); board.title=`Office planning board ${index + 1} - quarterly launch coordination`; return board; });
    workspace.activeBoardId = workspace.boards[0].id;
    localStorage.setItem('flowboard-workspace', JSON.stringify(workspace));
  });
  await page.reload(); await page.waitForFunction(() => globalThis.FlowboardApp && globalThis.FlowboardState);
  const boardsButton = page.locator('#boards-button');
  await boardsButton.click();
  const dialog = page.getByRole('dialog', {name:'Your boards'});
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('[data-board-id]')).toHaveCount(8);
  await dialog.getByLabel('Find a board').fill('board 7');
  await expect(dialog.locator('[data-board-id]')).toHaveCount(1);
  await dialog.locator('[data-board-id]').click();
  await expect(page.locator('#board-page-heading')).toHaveText('Office planning board 7 - quarterly launch coordination board');
  await expect(boardsButton).toBeFocused();
});

test('workspace navigation remains available on a phone and searches boards', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await openReady(page);
  await page.evaluate(() => {
    const workspace = FlowboardState.makeWorkspace(), launch = workspace.boards[0], editorial = FlowboardState.makeBoard('tasks'), personal = FlowboardState.makeBoard('blank');
    editorial.title = 'Editorial calendar';
    personal.title = 'Personal tasks';
    workspace.boards = [launch, editorial, personal];
    localStorage.setItem('flowboard-workspace', JSON.stringify(workspace));
  });
  await page.reload(); await page.waitForFunction(() => globalThis.FlowboardApp && globalThis.FlowboardState);
  const boardsButton = page.locator('#boards-button');
  await expect(boardsButton).toBeVisible();
  await boardsButton.click();
  const dialog = page.getByRole('dialog', {name:'Your boards'});
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel('Find a board')).toBeVisible();
  await expect(dialog.locator('[data-board-id]')).toHaveCount(3);
  await dialog.getByLabel('Find a board').fill('Editorial');
  await expect(dialog.locator('[data-board-id]')).toHaveCount(1);
  await dialog.locator('[data-board-id]').click();
  await expect(page.locator('#board-page-heading')).toHaveText('Editorial calendar board');
  await expect(boardsButton).toBeFocused();
});

test('card edits stay isolated until Save and preserve drafts after a failed save', async ({page}) => {
  await openReady(page);
  const card = page.locator('.card-open').first();
  await card.click();
  const dialog = page.locator('#card-dialog');
  const originalTitle = await page.locator('#card-title-input').inputValue();
  const originalLabels = await dialog.locator('#label-editor .label-row').count();
  await page.locator('#add-label').click();
    await expect(dialog.locator('#label-editor .label-row')).toHaveCount(originalLabels + 1);
    await page.locator('#card-title-input').fill(`${originalTitle} draft`);
    await expect(page.locator('#card-draft-status')).toHaveText('Unsaved changes');
    await page.locator('#cancel-card-dialog').click();
  await expect(page.locator('#confirm-dialog')).toContainText('Discard unsaved changes?');
  await page.locator('#confirm-dialog').getByRole('button', {name:'Cancel'}).click();
  await expect(dialog).toBeVisible();
  await page.locator('#close-card-dialog').click();
  await page.locator('#confirm-dialog').getByRole('button', {name:'Discard changes'}).click();
  await expect(dialog).toBeHidden();
  await card.click();
  await expect(dialog.locator('#label-editor .label-row')).toHaveCount(originalLabels);
  await page.locator('#card-title-input').fill(`${originalTitle} saved`);
  await page.locator('#card-form').getByRole('button', {name:'Save changes'}).click();
  await expect(dialog).toBeHidden();
  await card.click();
  await expect(page.locator('#card-title-input')).toHaveValue(`${originalTitle} saved`);
  await page.locator('#card-description-input').fill('Draft must survive a failed local save');
  await page.evaluate(() => { const originalSetItem = Storage.prototype.setItem; Storage.prototype.setItem = function(key, value) { if (key === 'flowboard-workspace') throw new Error('synthetic storage failure'); return originalSetItem.call(this, key, value); }; });
  await page.locator('#card-form').getByRole('button', {name:'Save changes'}).click();
  await expect(dialog).toBeVisible();
  await expect(page.locator('#card-description-input')).toHaveValue('Draft must survive a failed local save');
});

test('desktop card editor gives assignee guidance a full-width field', async ({page}) => {
  await page.setViewportSize({width:1440, height:900});
  await openReady(page);
  const card = page.locator('.card-open').first();
  await card.click();
  const field = page.locator('#local-assignees-field');
  const metrics = await field.evaluate(element => { const box=element.getBoundingClientRect(), style=getComputedStyle(element); return {width:box.width, gridColumnEnd:style.gridColumnEnd, overflow:element.scrollWidth > element.clientWidth}; });
  expect(metrics.gridColumnEnd).toBe('-1');
  expect(metrics.width).toBeGreaterThan(500);
  expect(metrics.overflow).toBe(false);
  await expect(field.getByLabel('Assignees')).toHaveAttribute('placeholder', 'Names or initials, separated by commas');
});

test('failed Undo keeps current state and undo history', async ({page}) => {
  await openReady(page);
  const firstList = page.locator('.list').first();
  const title = `Undo failure ${Date.now()}`;
  await firstList.getByRole('button', {name:/add a card/i}).click();
  await firstList.getByLabel('New card title').fill(title);
  await firstList.getByRole('button', {name:'Add card'}).click();
  const savedAfterAdd = await page.evaluate(() => localStorage.getItem('flowboard-workspace'));
  await page.evaluate(() => { const originalSetItem = Storage.prototype.setItem; Storage.prototype.setItem = function(key, value) { if (key === 'flowboard-workspace') throw new Error('synthetic storage failure'); return originalSetItem.call(this, key, value); }; });
  await page.getByRole('button', {name:'Undo', exact:true}).click();
  await expect(page.locator('.card-open').filter({hasText:title})).toBeVisible();
  await expect(page.getByRole('button', {name:'Undo', exact:true})).toBeVisible();
  await expect(page.locator('#toast')).toContainText('Undo could not be saved');
  expect(await page.evaluate(() => localStorage.getItem('flowboard-workspace'))).toBe(savedAfterAdd);
});

test('failed import leaves local state and import review unchanged', async ({page}) => {
  await openReady(page);
  const before = await page.evaluate(() => localStorage.getItem('flowboard-workspace'));
  const imported = await page.evaluate(() => JSON.stringify({flowboardExport:'board', schemaVersion:FlowboardState.SCHEMA_VERSION, board:FlowboardState.makeBoard('blank')}));
  await page.getByRole('button', {name:'Board actions'}).click();
  await page.getByRole('menuitem', {name:/Import data/}).click();
  await page.locator('#import-file').setInputFiles({name:'valid.json', mimeType:'application/json', buffer:Buffer.from(imported)});
  await expect(page.locator('#import-preview')).toContainText('board');
  await page.locator('#import-options input[value="replace"]').check();
  await page.getByRole('button', {name:'Review import'}).click();
  const confirm = page.locator('#confirm-dialog');
  await expect(confirm).toContainText('replaced');
  await page.evaluate(() => { const originalSetItem = Storage.prototype.setItem; Storage.prototype.setItem = function(key, value) { if (key === 'flowboard-workspace') throw new Error('synthetic storage failure'); return originalSetItem.call(this, key, value); }; });
  await confirm.getByRole('button', {name:'Replace workspace'}).click();
  await expect(page.locator('#board-page-heading')).toHaveText('Website Launch board');
  await expect(page.locator('#import-dialog')).toBeVisible();
  await expect(page.locator('#toast')).toContainText('Import could not be saved');
  expect(await page.evaluate(() => localStorage.getItem('flowboard-workspace'))).toBe(before);
});

test('card capture is IME-safe and returns focus for continued entry', async ({page}) => {
  await openReady(page);
  const firstList = page.locator('.list').first();
  await firstList.getByRole('button', {name: /add a card/i}).click();
  const input = firstList.getByLabel('New card title');
  await input.fill('Line one');
  await input.press('Enter');
  await input.type('Line two');
  await expect(input).toHaveValue('Line one\nLine two');
  const before = await page.locator('.card-open').count();
  await input.fill('Composed card');
  await input.evaluate(element => element.dispatchEvent(new KeyboardEvent('keydown', {key:'Enter', bubbles:true, cancelable:true, isComposing:true})));
  await expect(page.locator('.card-open')).toHaveCount(before);
  await input.press('Control+Enter');
  await expect(page.locator('.card-open').filter({hasText:'Composed card'})).toBeVisible();
  await expect(firstList.getByRole('button', {name: /add a card/i})).toBeFocused();
});

test('quick add chooses a destination and can open existing card details', async ({page}) => {
  await openReady(page);
  await page.locator('#quick-add-card').click();
  const dialog = page.locator('#quick-add-dialog');
  await expect(dialog).toBeVisible();
  await dialog.locator('#quick-add-title').fill('Quick capture card');
  const destination = await dialog.locator('#quick-add-list').evaluate(select => select.options[1]?.value);
  await dialog.locator('#quick-add-list').selectOption(destination);
  await dialog.locator('#quick-add-open').check();
  await dialog.getByRole('button', {name:'Add card', exact:true}).click();
  await expect(page.locator('#card-dialog')).toBeVisible();
  await expect(page.locator('#card-title-input')).toHaveValue('Quick capture card');
  await page.keyboard.press('Escape');
  await expect(page.locator(`[data-list-id="${destination}"] .card-open`).filter({hasText:'Quick capture card'})).toBeVisible();
});

test('slash shortcut focuses board search outside text controls', async ({page}) => {
  await openReady(page);
  await page.locator('#board').focus();
  await page.keyboard.press('/');
  await expect(page.locator('#search')).toBeFocused();
  await page.locator('#search').fill('keep typing');
  await page.keyboard.press('/');
  await expect(page.locator('#search')).toHaveValue('keep typing/');
});

test('Move card dialog handles empty lists and returns focus with position', async ({page}) => {
  await openReady(page);
  await page.evaluate(() => {
    const workspace = FlowboardState.makeWorkspace(), board = FlowboardState.makeBoard('blank'), card = FlowboardState.makeCard('Move me');
    board.lists = [FlowboardState.makeList('Source', [card]), FlowboardState.makeList('Empty')];
    workspace.boards = [board]; workspace.activeBoardId = board.id;
    localStorage.setItem('flowboard-workspace', JSON.stringify(workspace));
  });
  await page.reload(); await page.waitForFunction(() => globalThis.FlowboardApp && globalThis.FlowboardState);
  const card = page.locator('.card-open').first(), cardId = await card.locator('xpath=..').getAttribute('data-card-id');
  await card.click();
  await page.getByRole('button', {name:'Move', exact:true}).click();
  const confirm = page.locator('#confirm-dialog'), destination = page.locator('#move-destination'), position = page.locator('#move-position');
  await expect(confirm).toContainText('Choose a destination list and position.');
  const emptyId = await page.locator('.list').nth(1).getAttribute('data-list-id');
  await destination.selectOption(emptyId);
  await expect(position).toHaveAttribute('max', '1');
  await position.fill('1');
  await confirm.getByRole('button', {name:'Move card'}).click();
  await expect(confirm).toBeHidden();
  await expect(page.locator('.list').nth(0).locator('.card-open')).toHaveCount(0);
  await expect(page.locator('.list').nth(1).locator('.card-open')).toHaveText(/Move me/);
  await expect(page.locator(`[data-card-id="${cardId}"] .card-open`)).toBeFocused();
  await expect(page.locator('#announcer')).toHaveText('Card moved to Empty, position 1');
});

test('Move card dialog permits appending after a populated destination', async ({page}) => {
  await openReady(page);
  await page.evaluate(() => {
    const workspace = FlowboardState.makeWorkspace(), board = FlowboardState.makeBoard('blank');
    board.lists = [FlowboardState.makeList('Source', [FlowboardState.makeCard('Move me')]), FlowboardState.makeList('Destination', [FlowboardState.makeCard('Existing')])];
    workspace.boards = [board]; workspace.activeBoardId = board.id;
    localStorage.setItem('flowboard-workspace', JSON.stringify(workspace));
  });
  await page.reload(); await page.waitForFunction(() => globalThis.FlowboardApp && globalThis.FlowboardState);
  const card = page.locator('.card-open').first();
  await card.click();
  await page.getByRole('button', {name:'Move', exact:true}).click();
  const confirm = page.locator('#confirm-dialog'), destination = page.locator('#move-destination'), position = page.locator('#move-position');
  const destinationId = await page.locator('.list').nth(1).getAttribute('data-list-id');
  await destination.selectOption(destinationId);
  await expect(position).toHaveAttribute('max', '2');
  await position.fill('2');
  await confirm.getByRole('button', {name:'Move card'}).click();
  await expect(page.locator('.list').nth(1).locator('.card-title')).toHaveText(['Existing', 'Move me']);
  await expect(page.locator('#announcer')).toHaveText('Card moved to Destination, position 2');
});

test('whole-list drops move precisely and self-drop does not persist', async ({page}) => {
  await openReady(page);
  await page.evaluate(() => {
    const workspace = FlowboardState.makeWorkspace(), board = FlowboardState.makeBoard('blank');
    board.lists = [FlowboardState.makeList('Source', [FlowboardState.makeCard('Drag me'), FlowboardState.makeCard('Stay')]), FlowboardState.makeList('Destination', [FlowboardState.makeCard('Existing')])];
    workspace.boards = [board]; workspace.activeBoardId = board.id;
    localStorage.setItem('flowboard-workspace', JSON.stringify(workspace));
  });
  await page.reload(); await page.waitForFunction(() => globalThis.FlowboardApp && globalThis.FlowboardState);
  const result = await page.evaluate(() => {
    const sourceCard = document.querySelector('.list .card'), destination = document.querySelectorAll('.list')[1], dataTransfer = new DataTransfer();
    sourceCard.dispatchEvent(new DragEvent('dragstart', {bubbles:true, cancelable:true, dataTransfer}));
    const over = new DragEvent('dragover', {bubbles:true, cancelable:true, dataTransfer});
    destination.querySelector('.list-head').dispatchEvent(over);
    const drop = new DragEvent('drop', {bubbles:true, cancelable:true, dataTransfer});
    destination.querySelector('.list-head').dispatchEvent(drop);
    const moved = [...document.querySelectorAll('.list')[1].querySelectorAll('.card-title')].map(element => element.textContent);
    const before = localStorage.getItem('flowboard-workspace'), selfCard = document.querySelector('.list .card'), selfTransfer = new DataTransfer();
    selfCard.dispatchEvent(new DragEvent('dragstart', {bubbles:true, cancelable:true, dataTransfer:selfTransfer}));
    const selfDrop = new DragEvent('drop', {bubbles:true, cancelable:true, dataTransfer:selfTransfer});
    selfCard.querySelector('.card-open').dispatchEvent(selfDrop);
    return {dropPrevented:drop.defaultPrevented, moved, sourceCount:document.querySelectorAll('.list')[0].querySelectorAll('.card').length, destinationCount:document.querySelectorAll('.list')[1].querySelectorAll('.card').length, selfDropPrevented:selfDrop.defaultPrevented, storageUnchanged:before === localStorage.getItem('flowboard-workspace')};
  });
  expect(result).toEqual({dropPrevented:true, moved:['Existing','Drag me'], sourceCount:1, destinationCount:2, selfDropPrevented:true, storageUnchanged:true});
});

test('filtered cards use explicit Move instead of ambiguous drag reorder', async ({page}) => {
  await openReady(page);
  await page.locator('#search').fill('Write homepage copy');
  await expect(page.locator('#search-count')).toContainText('use Move to reposition filtered cards');
  const card = page.locator('.card').first();
  await expect(card).toHaveAttribute('draggable', 'false');
  const result = await card.evaluate(element => {
    const before = localStorage.getItem('flowboard-workspace'), dataTransfer = new DataTransfer();
    const event = new DragEvent('dragstart', {bubbles:true, cancelable:true, dataTransfer});
    element.dispatchEvent(event);
    return {defaultPrevented:event.defaultPrevented, storageUnchanged:before === localStorage.getItem('flowboard-workspace')};
  });
  expect(result).toEqual({defaultPrevented:true, storageUnchanged:true});
});

test('explicit completion saves independently from checklist progress', async ({page}) => {
  await openReady(page);
  const card = page.locator('.card-open').first(), dialog = page.locator('#card-dialog');
  await card.click();
  await expect(page.locator('#completed-input')).not.toBeChecked();
  await page.locator('#completed-input').check();
  await page.locator('#card-form').getByRole('button', {name:'Save changes'}).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('.card-open').first().locator('..').locator('.meta-chip.complete')).toHaveText('Complete');
  await page.reload(); await page.waitForFunction(() => globalThis.FlowboardApp && globalThis.FlowboardState);
  await page.locator('.card-open').first().click();
  await expect(page.locator('#completed-input')).toBeChecked();
});

test('named labels, members, and completion filters combine and clear', async ({page}) => {
  await openReady(page);
  await page.evaluate(() => {
    const workspace = FlowboardState.makeWorkspace(), board = FlowboardState.makeBoard('blank');
    const launch = FlowboardState.makeCard('Launch task'), qa = FlowboardState.makeCard('QA task'), unassigned = FlowboardState.makeCard('Unassigned task');
    launch.labels = [{id:'label-launch', color:'green', name:'Launch'}]; launch.assignees = ['Alice']; launch.completed = true;
    qa.labels = [{id:'label-qa', color:'green', name:'QA'}]; qa.assignees = ['Alice'];
    unassigned.labels = []; unassigned.assignees = [];
    board.lists = [FlowboardState.makeList('Work', [launch, qa, unassigned])];
    workspace.boards = [board]; workspace.activeBoardId = board.id;
    localStorage.setItem('flowboard-workspace', JSON.stringify(workspace));
  });
  await page.reload(); await page.waitForFunction(() => globalThis.FlowboardApp && globalThis.FlowboardState);
  await page.getByRole('button', {name:'Filters'}).click();
  const label = page.locator('#label-filter');
  await expect(label.locator('option')).toHaveCount(3);
  await expect(label).toContainText('Launch');
  await expect(label).toContainText('QA');
  await label.selectOption('label-launch');
  await page.locator('#member-filter').selectOption('assigned');
  await page.locator('#completion-filter').selectOption('complete');
  await expect(page.locator('.card-open')).toHaveCount(1);
  await expect(page.locator('.card-open').first()).toContainText('Launch task');
  await expect(page.locator('#filter-chips')).toContainText('Launch');
  await expect(page.locator('#filter-chips')).toContainText('Assigned');
  await expect(page.locator('#filter-chips')).toContainText('Complete');
  await page.getByRole('button', {name:'Clear Launch filter'}).click();
  await expect(page.locator('#filter-chips')).not.toContainText('Launch');
  await page.locator('#clear-filters').click();
  await expect(page.locator('.card-open')).toHaveCount(3);
  await expect(page.locator('#filter-chips')).toBeEmpty();
});

test('clearing all filters resets every control and chip', async ({page}) => {
  await openReady(page);
  await page.getByRole('button', {name:'Filters'}).click();
  await page.locator('#due-filter').selectOption('today');
  await page.locator('#member-filter').selectOption('assigned');
  await page.locator('#completion-filter').selectOption('complete');
  await expect(page.locator('#due-filter')).toHaveValue('today');
  await expect(page.locator('#filter-chips')).toContainText('Due today');
  await page.locator('#clear-filters').click();
  await expect(page.locator('#due-filter')).toHaveValue('all');
  await expect(page.locator('#label-filter')).toHaveValue('all');
  await expect(page.locator('#member-filter')).toHaveValue('all');
  await expect(page.locator('#completion-filter')).toHaveValue('all');
  await expect(page.locator('#filter-chips')).toBeEmpty();
  await expect(page.locator('.card-open')).toHaveCount(10);
});

test('list actions reorder locally, validate titles, and retain cloud lists', async ({page}) => {
  await openReady(page);
  const firstList = page.locator('.list').first();
  await firstList.locator('.list-menu').click();
  await expect(firstList.getByRole('menu')).toBeVisible();
  await firstList.getByRole('menuitem', {name:'Move right'}).click();
  await expect(page.locator('.list-title').first()).toHaveValue('To do');
  await page.reload(); await page.waitForFunction(() => globalThis.FlowboardApp && globalThis.FlowboardState);
  await expect(page.locator('.list-title').first()).toHaveValue('To do');
  const invalidList = page.locator('.list').first().locator('.list-title');
  await invalidList.fill('');
  await invalidList.press('Tab');
  await expect(page.locator('.list-error:visible')).toContainText('List title must be between 1 and 80 characters.');
  await page.evaluate(() => FlowboardApp.openCloudWorkspace(FlowboardState.makeWorkspace(), {id:'list-retention-test', name:'Retention test', role:'editor'}));
  const cloudList = page.locator('.list').first();
  await cloudList.locator('.list-menu').click();
  await expect(cloudList.getByRole('menuitem', {name:/Delete list unavailable/})).toBeDisabled();
});

test('compact cloud-copy status fits the responsive top bar', async ({page}) => {
  await page.setViewportSize({width: 573, height: 500});
  await openReady(page);
  const status = page.locator('#cloud-status');
  await status.evaluate(element => { element.textContent = 'Cloud copy · local'; });
  const dimensions = await status.evaluate(element => ({clientWidth:element.clientWidth, scrollWidth:element.scrollWidth}));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
});

test('desktop board structure keeps navigation separate and controls reachable', async ({page}) => {
  await openReady(page);
  for (const width of [1280, 1440, 1920, 960]) {
    await page.setViewportSize({width, height:720});
    const layout = await page.evaluate(() => {
      const main = document.querySelector('#main-content'), header = document.querySelector('.board-header'), board = document.querySelector('#board'), menu = document.querySelector('#board-menu'), search = document.querySelector('#search'), firstList = document.querySelector('.list');
      const box = element => { const value = element?.getBoundingClientRect(); return value ? {left:value.left, right:value.right, top:value.top, bottom:value.bottom, width:value.width, height:value.height} : null; };
      return {boardIsMainChild:board?.parentElement === main, boardNestedInHeader:header?.contains(board), searchInBoardHeader:header?.contains(search), searchInTopbar:Boolean(document.querySelector('.topbar #search')), pageFits:document.documentElement.scrollWidth <= document.documentElement.clientWidth, boardOverflow:getComputedStyle(board).overflowX, boardScrollable:board.scrollWidth > board.clientWidth, menu:box(menu), search:box(search), firstList:box(firstList)};
    });
    expect(layout.boardIsMainChild, `board structure at ${width}px`).toBe(true);
    expect(layout.boardNestedInHeader, `board nesting at ${width}px`).toBe(false);
    expect(layout.searchInBoardHeader, `search scope at ${width}px`).toBe(true);
    expect(layout.searchInTopbar, `global search duplication at ${width}px`).toBe(false);
    expect(layout.pageFits, `page overflow at ${width}px`).toBe(true);
    expect(layout.boardOverflow).toBe('auto');
    if (width <= 1440) expect(layout.boardScrollable, `board scroll at ${width}px`).toBe(true);
    expect(layout.menu.width).toBeGreaterThan(0);
    expect(layout.search.width).toBeGreaterThan(0);
    expect(layout.firstList.right).toBeGreaterThan(layout.firstList.left);
  }
});

test('board header actions align and Start here disclosure stays bounded', async ({page}) => {
  await openReady(page);
  for (const width of [1440, 960, 390, 320]) {
    await page.setViewportSize({width, height:720});
    const layout = await page.evaluate(() => {
      const actions = document.querySelector('.board-actions').getBoundingClientRect();
      const guide = document.querySelector('details.collaboration-notice').getBoundingClientRect();
      return {pageFits:document.documentElement.scrollWidth <= document.documentElement.clientWidth, actions:{top:actions.top,bottom:actions.bottom,center:actions.top + actions.height / 2}, guide:{top:guide.top,bottom:guide.bottom,center:guide.top + guide.height / 2}};
    });
    expect(layout.pageFits, `header page overflow at ${width}px`).toBe(true);
    if (width >= 960) expect(Math.abs(layout.actions.center - layout.guide.center), `header centerline at ${width}px`).toBeLessThanOrEqual(1);
    else expect(layout.guide.top, `stacked disclosure at ${width}px`).toBeGreaterThanOrEqual(layout.actions.bottom - 1);
    await page.locator('details.collaboration-notice summary').click();
    await expect(page.locator('#start-here-copy')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await page.locator('details.collaboration-notice summary').click();
  }
});

test('density toggle is browser-local and preserves workspace bytes', async ({page}) => {
  await openReady(page);
  const before = await page.evaluate(() => localStorage.getItem('flowboard-workspace'));
  const toggle = page.locator('#density-toggle');
  await toggle.click();
  await expect(toggle).toHaveText('Compact');
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.density)).toBe('compact');
  const compact = await page.evaluate(() => ({workspace:localStorage.getItem('flowboard-workspace'),preference:JSON.parse(localStorage.getItem('flowboard-ui-preferences'))}));
  expect(compact.workspace).toBe(before);
  expect(compact.preference.density).toBe('compact');
  await toggle.click();
  await expect(toggle).toHaveText('Comfortable');
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.density)).toBe('comfortable');
});

test('List view lazy-loads with parity, sorting, pagination, and card focus return', async ({page}) => {
  await openReady(page);
  const fixture = await page.evaluate(() => {
    const workspace = FlowboardState.makeWorkspace(), board = workspace.boards[0];
    board.lists = [FlowboardState.makeList('Review', Array.from({length:105}, (_, index) => FlowboardState.makeCard(`List fixture ${index + 1}`)))];
    workspace.boards = [board]; workspace.activeBoardId = board.id;
    localStorage.setItem('flowboard-workspace', JSON.stringify(workspace));
    return board.lists[0].cards.length;
  });
  await page.reload(); await page.waitForFunction(() => globalThis.FlowboardApp && globalThis.FlowboardState);
  expect(fixture).toBe(105);
  expect(await page.evaluate(() => performance.getEntriesByType('resource').some(entry => entry.name.includes('list-view-ui')))).toBe(false);
  await page.locator('#view-toggle').click();
  await expect(page.locator('#list-view-table')).toBeVisible();
  await expect(page.locator('#list-view-table tbody tr')).toHaveCount(100);
  await expect(page.locator('#list-view-summary')).toContainText('100 of 105 cards shown');
  await expect(page.locator('#list-view-table th').nth(0)).toHaveAttribute('aria-sort', 'none');
  await page.locator('[data-list-sort="title"]').click();
  await expect(page.locator('#list-view-table th').nth(0)).toHaveAttribute('aria-sort', 'ascending');
  await page.getByRole('button', {name:'Show 100 more'}).click();
  await expect(page.locator('#list-view-table tbody tr')).toHaveCount(105);
  const rowCard = page.locator('[data-list-card]').first();
  await rowCard.click();
  await expect(page.locator('#card-dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(rowCard).toBeFocused();
  await page.locator('#view-toggle').click();
  await expect(page.locator('.card-open')).toHaveCount(105);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('flowboard-ui-preferences')).view)).toBe('board');
});

test('responsive widths confine horizontal scrolling to the board lane', async ({page}) => {
  await openReady(page);
  for (const width of [1280, 700, 440, 320]) {
    await page.setViewportSize({width, height:720});
    const layout = await page.evaluate(() => {
      const root = document.documentElement, board = document.querySelector('#board');
      return {
        pageFits:root.scrollWidth <= root.clientWidth,
        boardOverflow:getComputedStyle(board).overflowX,
        boardScrollable:board.scrollWidth > board.clientWidth
      };
    });
    expect(layout.pageFits, `page overflow at ${width}px`).toBe(true);
    expect(layout.boardOverflow).toBe('auto');
    if (width === 320) expect(layout.boardScrollable).toBe(true);
  }
});

test('board actions support keyboard traversal and Escape focus return', async ({page}) => {
  await openReady(page);
  const button = page.getByRole('button', {name:'Board actions'});
  await button.focus();
  await page.keyboard.press('ArrowDown');
  const menu = page.getByRole('menu');
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('menuitem').first()).toBeFocused();
  await page.keyboard.press('End');
  await expect(menu.getByRole('menuitem').last()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(button).toBeFocused();
});

test('touch controls meet 44px targets and the board keeps intentional scrolling', async ({browser}) => {
  const context = await browser.newContext({viewport:{width:390,height:844}, hasTouch:true, isMobile:true});
  const page = await context.newPage();
  try {
    await openReady(page);
    const evidence = await page.locator('button:visible').evaluateAll(elements => elements.map(element => {
      const box = element.getBoundingClientRect();
      return {name:element.getAttribute('aria-label') || element.textContent.trim().slice(0,30), width:box.width, height:box.height};
    }));
    expect(evidence.length).toBeGreaterThan(0);
    expect(evidence.every(item => item.width >= 44 && item.height >= 44), JSON.stringify(evidence)).toBe(true);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await expect(page.locator('#board')).toHaveCSS('overflow-x', 'auto');
  } finally { await context.close(); }
});

test('200 percent reflow keeps page width bounded while the board remains scrollable', async ({page}) => {
  await openReady(page);
  await page.setViewportSize({width:640,height:900});
  const layout = await page.evaluate(() => ({pageFits:document.documentElement.scrollWidth <= document.documentElement.clientWidth, boardOverflow:getComputedStyle(document.querySelector('#board')).overflowX, boardScrollable:document.querySelector('#board').scrollWidth > document.querySelector('#board').clientWidth}));
  expect(layout.pageFits, JSON.stringify(layout)).toBe(true);
  expect(layout.boardOverflow).toBe('auto');
  expect(layout.boardScrollable).toBe(true);
});

test('forced colors and reduced motion retain borders, focus, and bounded motion', async ({page}) => {
  await page.emulateMedia({forcedColors:'active', reducedMotion:'reduce'});
  await openReady(page);
  await page.keyboard.press('Tab');
  const card = page.locator('.card').first();
  const evidence = await card.evaluate(element => {
    const cardStyle = getComputedStyle(element), focusStyle = getComputedStyle(document.activeElement);
    return {
      forcedColors:matchMedia('(forced-colors: active)').matches,
      reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,
      borderStyle:cardStyle.borderStyle,
      transitionSeconds:Math.max(...cardStyle.transitionDuration.split(',').map(value => parseFloat(value) || 0)),
      focusVisible:focusStyle.outlineStyle !== 'none' && parseFloat(focusStyle.outlineWidth) > 0
    };
  });
  expect(evidence.forcedColors).toBe(true);
  expect(evidence.reducedMotion).toBe(true);
  expect(evidence.borderStyle).toBe('solid');
  expect(evidence.transitionSeconds).toBeLessThanOrEqual(0.001);
  expect(evidence.focusVisible).toBe(true);
});

test('canvas tokens preserve board controls across light and dark modes', async ({page}) => {
  await openReady(page);
  for (const theme of ['light', 'dark']) {
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    const evidence = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement), header = getComputedStyle(document.querySelector('.board-header')), title = getComputedStyle(document.querySelector('.board-title')), addList = getComputedStyle(document.querySelector('.add-list'));
      return {canvasInk:root.getPropertyValue('--canvas-ink').trim(), headerColor:header.color, titleColor:title.color, addListBackground:addList.backgroundColor};
    });
    expect(evidence.canvasInk).not.toBe('');
    expect(evidence.headerColor).toBe(evidence.titleColor);
    expect(evidence.addListBackground).not.toBe('rgba(0, 0, 0, 0)');
  }
});

test('curated canvas palettes render gradient and solid finishes', async ({page}) => {
  await openReady(page);
  const evidence = await page.evaluate(() => {
    const results = [];
    for (const palette of globalThis.FlowboardRuntime.canvasPalettes) {
      const gradient = globalThis.FlowboardRuntime.applyCanvasPalette(palette.id, 'gradient', 'light');
      const gradientImage = getComputedStyle(document.body).backgroundImage;
      const solid = globalThis.FlowboardRuntime.applyCanvasPalette(palette.id, 'solid', 'dark');
      const solidImage = getComputedStyle(document.body).backgroundImage;
      results.push({id:palette.id, gradientMode:gradient.mode, gradientFinish:gradient.finish, gradientImage, solidMode:solid.mode, solidFinish:solid.finish, solidImage, canvas:document.documentElement.dataset.canvas});
    }
    globalThis.FlowboardRuntime.applyCanvasPalette('classic-flow', 'gradient', 'light');
    return results;
  });
  expect(evidence).toHaveLength(8);
  for (const item of evidence) {
    expect(item.gradientMode).toBe('light');
    expect(item.gradientFinish).toBe('gradient');
    expect(item.gradientImage).toContain('linear-gradient');
    expect(item.solidMode).toBe('dark');
    expect(item.solidFinish).toBe('solid');
    expect(item.solidImage).toBe('none');
    expect(item.canvas).toBe(item.id);
  }
});

test('appearance preview is lazy, draft-only, and cancel preserves workspace bytes', async ({page}) => {
  await openReady(page);
  const before = await page.evaluate(() => localStorage.getItem('flowboard-workspace'));
  await page.getByRole('button', {name:'Open appearance settings'}).click();
  const dialog = page.locator('#appearance-dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('radio')).toHaveCount(15);
  await expect(page.locator('#appearance-palettes input[type="radio"]')).toHaveCount(8);
  await expect(page.locator('#appearance-scope')).toContainText('changes only your view');
  await page.getByRole('radio', {name:/Ocean Slate/}).check();
  await page.getByRole('radio', {name:'Dark', exact:true}).check();
  await page.getByRole('radio', {name:'Solid color', exact:true}).check();
  await expect(page.locator('#appearance-status')).toContainText('Preview only');
  await expect.poll(() => page.evaluate(() => ({canvas:document.documentElement.dataset.canvas,finish:document.documentElement.dataset.canvasFinish,theme:document.documentElement.dataset.theme}))).toEqual({canvas:'ocean-slate',finish:'solid',theme:'dark'});
  await page.getByRole('button', {name:'Cancel', exact:true}).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('button', {name:'Open appearance settings'})).toBeFocused();
  const after = await page.evaluate(() => ({workspace:localStorage.getItem('flowboard-workspace'),appearance:localStorage.getItem('flowboard-appearance'),canvas:document.documentElement.dataset.canvas,finish:document.documentElement.dataset.canvasFinish}));
  expect(after.workspace).toBe(before);
  expect(after.appearance).toBeNull();
  expect(after.canvas).toBe('classic-flow');
  expect(after.finish).toBe('gradient');
});

test('saved appearance persists independently through reload', async ({page}) => {
  await openReady(page);
  const before = await page.evaluate(() => localStorage.getItem('flowboard-workspace'));
  await page.getByRole('button', {name:'Open appearance settings'}).click();
  await page.getByRole('radio', {name:/Lagoon/}).check();
  await page.getByRole('radio', {name:'Light', exact:true}).check();
  await page.getByRole('radio', {name:'Solid color', exact:true}).check();
  await page.getByRole('radio', {name:'Use initials', exact:true}).check();
  await page.getByRole('button', {name:'Save appearance'}).click();
  await expect(page.locator('#appearance-dialog')).toBeHidden();
  const saved = await page.evaluate(() => ({workspace:localStorage.getItem('flowboard-workspace'),appearance:JSON.parse(localStorage.getItem('flowboard-appearance')),canvas:document.documentElement.dataset.canvas,finish:document.documentElement.dataset.canvasFinish,photos:document.documentElement.dataset.appearancePhotos}));
  expect(saved.workspace).toBe(before);
  expect(saved.appearance).toEqual({version:1,mode:'light',canvas:'lagoon',finish:'solid',showPhotos:false});
  expect(saved.canvas).toBe('lagoon');
  expect(saved.finish).toBe('solid');
  expect(saved.photos).toBe('initials');
  await page.reload();
  await page.waitForFunction(() => globalThis.FlowboardApp && globalThis.FlowboardRuntime);
  await expect.poll(() => page.evaluate(() => ({canvas:document.documentElement.dataset.canvas,finish:document.documentElement.dataset.canvasFinish,photos:document.documentElement.dataset.appearancePhotos}))).toEqual({canvas:'lagoon',finish:'solid',photos:'initials'});
  await page.getByRole('button', {name:'Open appearance settings'}).click();
  await expect(page.locator('input[name="appearance-canvas"][value="lagoon"]')).toBeChecked();
  await expect(page.locator('input[name="appearance-finish"][value="solid"]')).toBeChecked();
  await expect(page.locator('input[name="appearance-photos"][value="initials"]')).toBeChecked();
});

test('appearance save failure keeps draft open and workspace unchanged', async ({page}) => {
  await openReady(page);
  const before = await page.evaluate(() => { const workspace=localStorage.getItem('flowboard-workspace'); const original=Storage.prototype.setItem; Storage.prototype.setItem=function(key,value){ if(key==='flowboard-appearance') throw new Error('synthetic appearance storage failure'); return original.call(this,key,value); }; return workspace; });
  await page.getByRole('button', {name:'Open appearance settings'}).click();
  await page.getByRole('radio', {name:/Warm Sand/}).check();
  await page.getByRole('button', {name:'Save appearance'}).click();
  await expect(page.locator('#appearance-dialog')).toBeVisible();
  await expect(page.locator('#appearance-status')).toContainText('could not be saved');
  const after = await page.evaluate(() => ({workspace:localStorage.getItem('flowboard-workspace'),appearance:localStorage.getItem('flowboard-appearance')}));
  expect(after.workspace).toBe(before);
  expect(after.appearance).toBeNull();
});

test('person badges validate photos and preserve initials-only fallback', async ({page}) => {
  await openReady(page);
  const evidence = await page.evaluate(async url => {
    const {personInitials, safePhotoURL, renderPersonBadge} = await import(url);
    const host = document.createElement('div'); document.body.append(host);
    renderPersonBadge(host, {displayName:'Avery Lee', photoURL:'https://lh3.googleusercontent.com/a/synthetic=s96-c'}, {photoPreference:false});
    const initialsOnly = {text:host.textContent, hasImage:Boolean(host.querySelector('img')), safe:Boolean(safePhotoURL('https://lh3.googleusercontent.com/a/synthetic=s96-c')), unsafe:safePhotoURL('https://evil.example.test/avatar.png'), initials:personInitials({displayName:'Avery Lee'})};
    renderPersonBadge(host, {displayName:'Avery Lee', photoURL:'https://lh3.googleusercontent.com/a/synthetic=s96-c'}, {photoPreference:true});
    const image=host.querySelector('img'); image?.dispatchEvent(new Event('error')); const broken={text:host.textContent,hasImage:Boolean(host.querySelector('img'))};
    host.remove();
    return {...initialsOnly,broken};
  }, builtAuthAsset());
  expect(evidence).toEqual({text:'AL',hasImage:false,safe:true,unsafe:'',initials:'AL',broken:{text:'AL',hasImage:false}});
});

test('member profile controls share and stop the current account photo', async ({page}) => {
  await openReady(page);
  await page.evaluate(async asset => {
    document.body.innerHTML = `<button id="open-workspace-members">Manage members</button><dialog id="workspace-members-dialog" aria-labelledby="workspace-members-heading"><h2 id="workspace-members-heading">Members and invitations</h2><button id="close-workspace-members">Close</button><p id="workspace-members-status"></p><section id="workspace-profile-section"><h3>My profile</h3><p id="workspace-profile-status"></p><div><button id="share-profile-photo">Share Google profile photo</button><button id="refresh-profile-photo">Refresh shared photo</button><button id="stop-profile-photo">Stop sharing photo</button></div></section><form id="create-invite-form" hidden><input id="invite-email"><select id="invite-role"><option value="editor">Editor</option></select><button type="submit">Create invitation</button></form><p id="invite-link-status"></p><div id="workspace-members-list"></div><section id="workspace-invites-section" hidden><div id="workspace-invites-list"></div></section><form id="transfer-ownership-form" hidden><select id="ownership-successor"></select><select id="former-owner-role"><option value="editor">Editor</option></select><button type="submit">Transfer ownership</button></form></dialog>`;
    globalThis.FlowboardApp = {getMode:() => ({kind:'cloud',id:'profile-fixture',role:'owner'})};
    let member={uid:'owner',displayName:'Owner',role:'owner',emailLower:'owner@example.test',photoURL:''};
    globalThis.profileWrites=[];
    const adapter={listMembers:async()=>[member],listInvites:async()=>[],updateOwnMemberProfile:async(workspaceId,options)=>{globalThis.profileWrites.push({workspaceId,options});member={...member,...options};},changeMemberRole:async()=>{},removeMember:async()=>{},leaveWorkspace:async()=>{},transferOwnership:async()=>{},revokeInvite:async()=>{},createInvite:async()=>({})};
    const {initializeMembersUI}=await import(asset); initializeMembersUI(adapter).setSession({uid:'owner',displayName:'Owner',email:'owner@example.test',photoURL:'https://lh3.googleusercontent.com/a/synthetic=s96-c'});
  }, builtMembersAsset());
  await page.getByRole('button',{name:'Manage members'}).click();
  await expect(page.locator('#workspace-profile-section')).toBeVisible();
  await expect(page.getByRole('button',{name:'Share Google profile photo'})).toBeEnabled();
  await page.getByRole('button',{name:'Share Google profile photo'}).click();
  await expect.poll(() => page.evaluate(() => globalThis.profileWrites.length)).toBe(1);
  expect(await page.evaluate(() => globalThis.profileWrites[0].options.photoURL)).toContain('lh3.googleusercontent.com');
  await expect(page.getByRole('button',{name:'Stop sharing photo'})).toBeVisible();
  await page.getByRole('button',{name:'Stop sharing photo'}).click();
  await page.getByRole('button',{name:'Stop sharing',exact:true}).click();
  await expect.poll(() => page.evaluate(() => globalThis.profileWrites.length)).toBe(2);
  expect(await page.evaluate(() => globalThis.profileWrites[1].options.photoURL)).toBe('');
});

test('profile sharing reports readback failure without claiming success', async ({page}) => {
  await openReady(page);
  await page.evaluate(async asset => {
    document.body.innerHTML = `<button id="open-workspace-members">Manage members</button><dialog id="workspace-members-dialog" aria-labelledby="workspace-members-heading"><h2 id="workspace-members-heading">Members and invitations</h2><button id="close-workspace-members">Close</button><p id="workspace-members-status"></p><section id="workspace-profile-section"><h3>Your photo</h3><p id="workspace-profile-status"></p><div><button id="share-profile-photo">Share Google profile photo</button><button id="refresh-profile-photo">Refresh shared photo</button><button id="stop-profile-photo">Stop sharing photo</button><button id="retry-profile-photo">Retry</button></div></section><form id="create-invite-form" hidden><input id="invite-email"><select id="invite-role"><option value="editor">Editor</option></select><button type="submit">Create invitation</button></form><p id="invite-link-status"></p><div id="workspace-members-list"></div><section id="workspace-invites-section" hidden><div id="workspace-invites-list"></div></section><form id="transfer-ownership-form" hidden><select id="ownership-successor"></select><select id="former-owner-role"><option value="editor">Editor</option></select><button type="submit">Transfer ownership</button></form></dialog>`;
    globalThis.FlowboardApp = {getMode:() => ({kind:'cloud',id:'readback-fixture',name:'Readback workspace',role:'owner'})};
    globalThis.profileWrites=[];
    const member={uid:'owner',displayName:'Owner',role:'owner',emailLower:'owner@example.test',photoURL:''};
    const adapter={listMembers:async()=>[member],listInvites:async()=>[],updateOwnMemberProfile:async(workspaceId,options)=>{globalThis.profileWrites.push({workspaceId,options});},changeMemberRole:async()=>{},removeMember:async()=>{},leaveWorkspace:async()=>{},transferOwnership:async()=>{},revokeInvite:async()=>{},createInvite:async()=>({})};
    const {initializeMembersUI}=await import(asset); initializeMembersUI(adapter).setSession({uid:'owner',displayName:'Owner',email:'owner@example.test',photoURL:'https://lh3.googleusercontent.com/a/synthetic=s96-c'});
  }, builtMembersAsset());
  await page.getByRole('button',{name:'Manage members'}).click();
  await page.getByRole('button',{name:'Share Google profile photo'}).click();
  await expect.poll(() => page.evaluate(() => globalThis.profileWrites.length)).toBe(1);
  await expect(page.locator('#workspace-profile-status')).toContainText('could not be verified');
  await expect(page.getByRole('button',{name:'Retry'})).toBeVisible();
  await expect(page.locator('#workspace-profile-status')).not.toContainText('Profile photo shared with');
});

test('cloud roster maps assignment UIDs to three badges, overflow, and profile refresh', async ({page}) => {
  await openReady(page);
  await page.evaluate(async asset => {
    document.body.innerHTML = '<div id="board"><div class="assignees" data-assignee-uids="a,b,c,d"></div></div>';
    globalThis.FlowboardApp = {getMode:() => ({kind:'cloud',id:'roster-fixture',role:'editor'})};
    globalThis.rosterReads=0; globalThis.rosterPhoto='';
    const adapter={listMembers:async()=>{globalThis.rosterReads+=1;return [
      {uid:'a',displayName:'Avery Lee',emailLower:'avery@example.test',photoURL:globalThis.rosterPhoto},
      {uid:'b',displayName:'Sam Rivera',emailLower:'sam@example.test',photoURL:''},
      {uid:'c',displayName:'Mina Chen',emailLower:'mina@example.test',photoURL:''},
      {uid:'d',displayName:'Jordan Patel',emailLower:'jordan@example.test',photoURL:''}
    ];}};
    const {initializeCloudRosterUI}=await import(asset); initializeCloudRosterUI(adapter).setSession({uid:'a'}); window.dispatchEvent(new Event('flowboard:cloud-selection'));
  }, builtRosterAsset());
  await expect(page.locator('.assignees .person-badge')).toHaveCount(3);
  await expect(page.locator('.assignee-overflow')).toHaveText('+1');
  await expect(page.locator('.assignees')).toHaveAttribute('aria-label','Assigned to Avery Lee, Sam Rivera, Mina Chen, Jordan Patel');
  const reads=await page.evaluate(() => globalThis.rosterReads);
  await page.evaluate(() => { globalThis.rosterPhoto='https://lh3.googleusercontent.com/a/synthetic=s96-c'; window.dispatchEvent(new Event('flowboard:profile-change')); });
  await expect.poll(() => page.evaluate(() => globalThis.rosterReads)).toBeGreaterThan(reads);
  await expect(page.locator('.assignees img')).toHaveCount(1);
});