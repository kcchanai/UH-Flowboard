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

// Step 1 reproduction. These assertions intentionally describe the pre-fix behavior.
test('baseline existing workspace hints expose a workspace chooser and hide New board', async ({page}) => {
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
  await expect(dialog.locator('#legacy-spaces-list')).toContainText('Cloud workspace');
  await expect(dialog.locator('#workspace-board-list')).toContainText('Synthetic active board');
  await expect(dialog.locator('#new-board-form')).toBeHidden();
  await page.screenshot({path: 'artifacts/single-workspace/step-01/baseline-workspace-rows.png', fullPage: true});
});

test('baseline archived board exposes disabled Archived and More instead of two direct actions', async ({page}) => {
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
  await expect(archived.getByRole('button', {name: /Archived Synthetic archived board/})).toBeDisabled();
  await expect(archived.locator('.workspace-lifecycle-actions summary')).toHaveText('More');
  await expect(archived.getByRole('button', {name: 'Restore'})).toHaveCount(0);
  await expect(archived.getByRole('button', {name: 'Delete permanently'})).toHaveCount(0);
});
