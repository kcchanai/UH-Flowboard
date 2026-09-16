import {test, expect} from '@playwright/test';
import {readdirSync} from 'node:fs';
import {basePath} from '../scripts/repository-path.mjs';

const builtLifecycleAsset = () => `${basePath}assets/${readdirSync('dist/assets').find(file => file.startsWith('workspace-lifecycle-ui-') && file.endsWith('.js'))}`;
const builtCloudWorkspaceAsset = () => `${basePath}assets/${readdirSync('dist/assets').find(file => file.startsWith('cloud-workspace-ui-') && file.endsWith('.js'))}`;
const builtCloudSyncAsset = () => `${basePath}assets/${readdirSync('dist/assets').find(file => file.startsWith('cloud-sync-controller-') && file.endsWith('.js'))}`;

test('critical local-first card workflow persists after reload', async ({page}) => {
  await page.goto(basePath);
  await expect(page.getByRole('heading', {level: 1})).toContainText('Website Launch');
  const firstList = page.locator('.list').first();
  await firstList.getByRole('button', {name: /add a card/i}).click();
  const title = `Release smoke ${Date.now()}`;
  await firstList.getByLabel('New card title').fill(title);
  await firstList.getByRole('button', {name: 'Add card'}).click();
  const createdCard = page.locator('.card-open').filter({hasText: title});
  await expect(createdCard).toBeVisible();
  await page.reload();
  await expect(page.locator('.card-open').filter({hasText: title})).toBeVisible();
});

test('browser-local mode remains editable without a fake collaboration planner', async ({page}) => {
  await page.goto(basePath);
  await page.evaluate(() => {
    const workspace = FlowboardState.makeWorkspace(), board = workspace.boards[0], plannedViewer = {id:'legacy-viewer', name:'Legacy viewer', role:'viewer', addedAt:new Date().toISOString()};
    board.collaboration.members.push(plannedViewer);
    board.collaboration.currentMemberId = plannedViewer.id;
    localStorage.setItem('flowboard-workspace', JSON.stringify(workspace));
  });
  await page.reload();
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
  await page.goto(basePath);
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
  await page.goto(basePath);
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

test('local Recovery lists, exports, and safely restores a snapshot', async ({page}) => {
  await page.goto(basePath);
  const firstList = page.locator('.list').first();
  const title = `Recovery smoke ${Date.now()}`;
  await firstList.getByRole('button', {name: /add a card/i}).click();
  await firstList.getByLabel('New card title').fill(title);
  await firstList.getByRole('button', {name: 'Add card'}).click();
  await page.getByRole('button', {name: 'Board actions'}).click();
  const menu = page.getByRole('menu');
  await menu.getByRole('menuitem', {name: 'Local recovery'}).click();
  const dialog = page.getByRole('dialog', {name: 'Local recovery'});
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
  await page.goto(basePath);
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
  await page.goto(basePath);
  await expect(page.locator('#cloud-status')).toHaveText(/Google sign-in available|Local-only workspace/);
  const account = page.getByRole('button', {name: 'Sign in with Google'});
  if (await page.locator('#cloud-status').textContent() === 'Local-only workspace') {
    await expect(account).toBeHidden();
    return;
  }
  await account.click();
  const dialog = page.getByRole('dialog', {name: 'Google sign-in'});
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("Signing in does not upload, merge, replace, or delete this browser's workspace.");
  await expect(dialog.getByRole('button', {name: 'Continue with Google'})).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(account).toBeFocused();
});

test('owner workspace lifecycle dialog renames, archives, restores, and returns focus', async ({page}) => {
  await page.goto(basePath);
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

test('owner can retry an interrupted migration and the workspace list refreshes to editable', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto(basePath);
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

test('workspace navigation remains available on a phone and searches boards', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto(basePath);
  await page.evaluate(() => {
    const workspace = FlowboardState.makeWorkspace(), launch = workspace.boards[0], editorial = FlowboardState.makeBoard('tasks'), personal = FlowboardState.makeBoard('blank');
    editorial.title = 'Editorial calendar';
    personal.title = 'Personal tasks';
    workspace.boards = [launch, editorial, personal];
    localStorage.setItem('flowboard-workspace', JSON.stringify(workspace));
  });
  await page.reload();
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
  await page.goto(basePath);
  const card = page.locator('.card-open').first();
  await card.click();
  const dialog = page.locator('#card-dialog');
  const originalTitle = await page.locator('#card-title-input').inputValue();
  const originalLabels = await dialog.locator('#label-editor .label-row').count();
  await page.locator('#add-label').click();
  await expect(dialog.locator('#label-editor .label-row')).toHaveCount(originalLabels + 1);
  await page.locator('#close-card-dialog').click();
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
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('synthetic storage failure'); }; });
  await page.locator('#card-form').getByRole('button', {name:'Save changes'}).click();
  await expect(dialog).toBeVisible();
  await expect(page.locator('#card-description-input')).toHaveValue('Draft must survive a failed local save');
});

test('card capture is IME-safe and returns focus for continued entry', async ({page}) => {
  await page.goto(basePath);
  const firstList = page.locator('.list').first();
  await firstList.getByRole('button', {name: /add a card/i}).click();
  const input = firstList.getByLabel('New card title');
  await input.fill('Line one');
  await input.press('Shift+Enter');
  await input.type('Line two');
  await expect(input).toHaveValue('Line one\nLine two');
  const before = await page.locator('.card-open').count();
  await input.fill('Composed card');
  await input.evaluate(element => element.dispatchEvent(new KeyboardEvent('keydown', {key:'Enter', bubbles:true, cancelable:true, isComposing:true})));
  await expect(page.locator('.card-open')).toHaveCount(before);
  await input.press('Enter');
  await expect(page.locator('.card-open').filter({hasText:'Composed card'})).toBeVisible();
  await expect(firstList.getByRole('button', {name: /add a card/i})).toBeFocused();
});

test('Move card dialog handles empty lists and returns focus with position', async ({page}) => {
  await page.goto(basePath);
  await page.evaluate(() => {
    const workspace = FlowboardState.makeWorkspace(), board = FlowboardState.makeBoard('blank'), card = FlowboardState.makeCard('Move me');
    board.lists = [FlowboardState.makeList('Source', [card]), FlowboardState.makeList('Empty')];
    workspace.boards = [board]; workspace.activeBoardId = board.id;
    localStorage.setItem('flowboard-workspace', JSON.stringify(workspace));
  });
  await page.reload();
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

test('whole-list drops move precisely and self-drop does not persist', async ({page}) => {
  await page.goto(basePath);
  await page.evaluate(() => {
    const workspace = FlowboardState.makeWorkspace(), board = FlowboardState.makeBoard('blank');
    board.lists = [FlowboardState.makeList('Source', [FlowboardState.makeCard('Drag me'), FlowboardState.makeCard('Stay')]), FlowboardState.makeList('Destination', [FlowboardState.makeCard('Existing')])];
    workspace.boards = [board]; workspace.activeBoardId = board.id;
    localStorage.setItem('flowboard-workspace', JSON.stringify(workspace));
  });
  await page.reload();
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
  await page.goto(basePath);
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
  await page.goto(basePath);
  const card = page.locator('.card-open').first(), dialog = page.locator('#card-dialog');
  await card.click();
  await expect(page.locator('#completed-input')).not.toBeChecked();
  await page.locator('#completed-input').check();
  await page.locator('#card-form').getByRole('button', {name:'Save changes'}).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('.card-open').first().locator('..').locator('.meta-chip.complete')).toHaveText('Complete');
  await page.reload();
  await page.locator('.card-open').first().click();
  await expect(page.locator('#completed-input')).toBeChecked();
});

test('named labels, members, and completion filters combine and clear', async ({page}) => {
  await page.goto(basePath);
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
  await page.reload();
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

test('list actions reorder locally, validate titles, and retain cloud lists', async ({page}) => {
  await page.goto(basePath);
  const firstList = page.locator('.list').first();
  await firstList.locator('.list-menu').click();
  await expect(firstList.getByRole('menu')).toBeVisible();
  await firstList.getByRole('menuitem', {name:'Move right'}).click();
  await expect(page.locator('.list-title').first()).toHaveValue('To do');
  await page.reload();
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
  await page.goto(basePath);
  const status = page.locator('#cloud-status');
  await status.evaluate(element => { element.textContent = 'Cloud copy · local'; });
  const dimensions = await status.evaluate(element => ({clientWidth:element.clientWidth, scrollWidth:element.scrollWidth}));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
});

test('responsive widths confine horizontal scrolling to the board lane', async ({page}) => {
  await page.goto(basePath);
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

test('forced colors and reduced motion retain borders, focus, and bounded motion', async ({page}) => {
  await page.emulateMedia({forcedColors:'active', reducedMotion:'reduce'});
  await page.goto(basePath);
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
