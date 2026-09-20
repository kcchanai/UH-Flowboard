import {test, expect} from '@playwright/test';
import {readdirSync} from 'node:fs';
import {basePath} from '../scripts/repository-path.mjs';

const builtCloudAsset = () => `${basePath}assets/${readdirSync('dist/assets').find(file => file.startsWith('cloud-ui-') && file.endsWith('.js'))}`;
const openShell = async page => {
  await page.goto(basePath);
  await page.waitForFunction(() => globalThis.FlowboardApp && globalThis.FlowboardState);
};

function directoryFixture() {
  return {
    id: 'synthetic-legacy-scope', name: 'Synthetic legacy scope', ownerUid: 'synthetic-owner', role: 'owner',
    status: 'ready', personal: false, migration: {state: 'verified'}, hasMore: false,
    boards: [
      {id: 'synthetic-active-board', title: 'Synthetic active board', rank: 0, archived: false, revision: 0},
      {id: 'synthetic-archived-board', title: 'Synthetic archived board', rank: 1, archived: true, revision: 0}
    ]
  };
}

test('board manager shows boards and keeps legacy recovery rows out of normal navigation', async ({page}) => {
  await openShell(page);
  await page.evaluate(async ({asset, fixture}) => {
    globalThis.FlowboardApp = {
      getMode: () => ({kind: 'cloud', id: '', role: 'owner'}),
      getActiveBoardId: () => '', openCloudWorkspace: () => {}, openCloudPreview: () => {}, selectBoard: () => {},
      createBoard: () => false
    };
    const {initializeCloudWorkspaceUI} = await import(asset);
    initializeCloudWorkspaceUI({
      localAdapter: {inspectLegacyWorkspace: () => ({status: 'none', counts: {boards: 0}})},
      cloudAdapter: {listBoardDirectory: async () => [fixture]}
    }).setSession({uid: 'synthetic-owner'});
    document.querySelector('#boards-button').disabled = false;
  }, {asset: builtCloudAsset(), fixture: directoryFixture()});
  await page.getByRole('button', {name: 'Boards'}).click();
  const dialog = page.getByRole('dialog', {name: 'Your boards'});
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('#legacy-spaces-section')).toHaveCount(0);
  await expect(page.locator('#open-cloud-recovery')).toHaveCount(0);
  await expect(page.locator('#open-cloud-migration')).toHaveCount(0);
  await expect(dialog.locator('#workspace-board-list')).toContainText('Synthetic active board');
  await expect(dialog.locator('#new-board-form')).toBeHidden();
  await page.screenshot({path: 'artifacts/single-workspace/step-01/baseline-workspace-rows.png', fullPage: true});
});

test('New board is visible and focuses the existing form in an empty personal home', async ({page}) => {
  await openShell(page);
  await page.evaluate(async ({asset, fixture}) => {
    globalThis.FlowboardApp = {
      getMode: () => ({kind: 'cloud', id: fixture.id, personalWorkspaceId:fixture.id, role: 'owner'}),
      getActiveBoardId: () => '', openCloudWorkspace: () => {}, openCloudPreview: () => {}, selectBoard: () => {},
      createBoard: () => false
    };
    const {initializeCloudWorkspaceUI} = await import(asset);
    initializeCloudWorkspaceUI({
      localAdapter: {inspectLegacyWorkspace: () => ({status: 'none', counts: {boards: 0}})},
      cloudAdapter: {listBoardDirectory: async () => [fixture]}
    }).setSession({uid: 'synthetic-owner'});
    document.querySelector('#boards-button').disabled = false;
  }, {asset: builtCloudAsset(), fixture: {...directoryFixture(), personal: true, boards: []}});
  await page.getByRole('button', {name: 'Boards'}).click();
  const dialog = page.getByRole('dialog', {name: 'Your boards'});
  await expect(dialog.getByRole('button', {name: '+ New board'})).toBeVisible();
  await expect(dialog.getByRole('button', {name: '+ New board'})).toBeEnabled();
  await dialog.getByRole('button', {name: '+ New board'}).click();
  await expect(dialog.locator('#new-board-form')).toBeVisible();
  await expect(dialog.locator('#new-board-title')).toBeFocused();
  await expect(dialog.locator('#workspace-board-list')).toContainText('No active boards yet.');
});

test('archived owner board exposes direct Restore and Delete permanently actions', async ({page}) => {
  await openShell(page);
  await page.evaluate(async ({asset, fixture}) => {
    globalThis.FlowboardApp = {
      getMode: () => ({kind: 'cloud', id: '', role: 'owner'}),
      getActiveBoardId: () => '', openCloudWorkspace: () => {}, openCloudPreview: () => {}, selectBoard: () => {},
      createBoard: () => false
    };
    const {initializeCloudWorkspaceUI} = await import(asset);
    initializeCloudWorkspaceUI({
      localAdapter: {inspectLegacyWorkspace: () => ({status: 'none', counts: {boards: 0}})},
      cloudAdapter: {listBoardDirectory: async () => [fixture]}
    }).setSession({uid: 'synthetic-owner'});
    document.querySelector('#boards-button').disabled = false;
  }, {asset: builtCloudAsset(), fixture: directoryFixture()});
  await page.getByRole('button', {name: 'Boards'}).click();
  const archived = page.locator('#archived-board-list .workspace-entry').filter({hasText: 'Synthetic archived board'});
  await expect(archived).toBeVisible();
  await expect(archived.getByRole('button', {name: /Archived Synthetic archived board/})).toHaveCount(0);
  await expect(archived.locator('.workspace-lifecycle-actions summary')).toHaveCount(0);
  await expect(archived.getByRole('button', {name: 'Restore'})).toBeVisible();
  await expect(archived.getByRole('button', {name: 'Delete permanently'})).toBeVisible();
});
