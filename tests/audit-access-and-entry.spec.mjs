import {test,expect} from '@playwright/test';
import {basePath} from '../scripts/repository-path.mjs';

const openShell = async page => {
  await page.goto(basePath);
  await page.waitForFunction(() => globalThis.FlowboardApp && globalThis.FlowboardState);
};

async function openSyntheticBoard(page) {
  await openShell(page);
  await page.waitForFunction(() => ['signed-out','unavailable'].includes(FlowboardApp.getMode().kind));
  await page.evaluate(() => {
    const workspace = FlowboardState.makeEmptyWorkspace();
    const board = FlowboardState.makeBoard('blank');
    board.title = 'Keyboard audit board';
    board.lists = ['First list', 'Middle list', 'Last list'].map(title => FlowboardState.makeList(title));
    workspace.boards = [board];
    workspace.activeBoardId = board.id;
    FlowboardApp.openCloudWorkspace(workspace, {id:'audit-access-workspace', name:'Audit access workspace', role:'owner'});
  });
  await expect(page.locator('#board .list')).toHaveCount(3);
}

async function openSignedOutAccount(page) {
  await openShell(page);
  await page.waitForFunction(() => FlowboardApp.getMode().kind === 'signed-out');
  await expect(page.locator('#board').getByRole('button', {name:'Sign in with Google', exact:true})).toBeVisible();
}

test('Escape returns focus to every list action launcher without outside-click focus theft', async ({page}) => {
  await openSyntheticBoard(page);
  const lists = page.locator('#board .list');
  for (let index = 0; index < 3; index += 1) {
    const list = lists.nth(index);
    const launcher = list.locator('.list-menu');
    await launcher.focus();
    await page.keyboard.press('ArrowDown');
    await expect(list.getByRole('menu')).toBeVisible();
    await page.keyboard.press('End');
    await page.keyboard.press('Escape');
    await expect(list.getByRole('menu')).toBeHidden();
    await expect(launcher).toBeFocused();
  }

  const firstList = lists.first();
  await firstList.locator('.list-menu').click();
  await expect(firstList.getByRole('menu')).toBeVisible();
  const search = page.locator('#search');
  await search.click();
  await expect(firstList.getByRole('menu')).toBeHidden();
  await expect(search).toBeFocused();
});

test('Filters exposes its controlled, named panel and preserves Escape focus behavior', async ({page}) => {
  await openSyntheticBoard(page);
  const toggle = page.locator('#filter-toggle');
  const panel = page.locator('#filter-panel');
  await expect(toggle).toHaveAttribute('aria-controls', 'filter-panel');
  await expect(panel).toHaveAttribute('role', 'group');
  await expect(panel).toHaveAttribute('aria-labelledby', 'filter-toggle');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(panel).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(panel).toBeHidden();
  await expect(toggle).toBeFocused();
});

test('central and header sign-in entries share the safe dialog flow and preserve browser data', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem('flowboard-workspace', '{"legacy":"audit-entry"}');
    localStorage.setItem('flowboard-data', '[{"legacy":"audit-entry"}]');
  });
  await openSignedOutAccount(page);
  const central = page.locator('#board').getByRole('button', {name:'Sign in with Google', exact:true});
  const header = page.locator('#account-button');
  const dialog = page.getByRole('dialog', {name:'Sign in'});
  const before = await page.evaluate(() => ({current:localStorage.getItem('flowboard-workspace'), older:localStorage.getItem('flowboard-data')}));

  await central.click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', {name:'Close account'}).click();
  await expect(dialog).toBeHidden();
  await expect(central).toBeFocused();

  await header.click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', {name:'Close account'}).click();
  await expect(dialog).toBeHidden();
  await expect(header).toBeFocused();

  await central.click();
  await expect(dialog.getByRole('button', {name:'Continue with Google'})).toBeEnabled();
  await dialog.getByRole('button', {name:'Close account'}).click();
  await expect(central).toBeFocused();
  expect(await page.evaluate(() => ({current:localStorage.getItem('flowboard-workspace'), older:localStorage.getItem('flowboard-data')}))).toEqual(before);
  expect(errors).toEqual([]);
});
