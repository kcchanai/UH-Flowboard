import {test, expect} from '@playwright/test';
import {basePath} from '../scripts/repository-path.mjs';

const openReady = async page => {
  await page.goto(basePath);
  await page.waitForFunction(() => globalThis.FlowboardApp && globalThis.FlowboardState);
  await page.waitForFunction(() => ['unavailable', 'signed-out', 'cloud', 'cloud-preview', 'ready-empty'].includes(globalThis.FlowboardApp.getMode().kind));
};

const installFixture = async page => {
  await page.evaluate(() => {
    const workspace = FlowboardState.makeWorkspace();
    const board = workspace.boards[0];
    board.lists = ['Planning', 'Review'].map((title, listIndex) => FlowboardState.makeList(title, Array.from({length:listIndex ? 52 : 53}, (_, index) => {
      const card = FlowboardState.makeCard(`${title} task ${index + 1}`);
      card.assignees = index % 2 ? ['Avery Lee'] : [];
      card.dueDate = `2030-01-${String((index % 28) + 1).padStart(2, '0')}`;
      card.dueTime = index % 3 ? '09:30' : '';
      card.checklist = [{text:'First step', done:true}, {text:'Second step', done:false}];
      card.completed = index % 11 === 0;
      return card;
    })));
    workspace.boards = [board];
    workspace.activeBoardId = board.id;
    localStorage.setItem('flowboard-workspace', JSON.stringify(workspace));
    FlowboardApp.openCloudWorkspace(workspace, {id:'responsive-list-fixture', name:'Responsive list fixture', role:'owner'});
  });
};

test('List view stacks labelled task records at 390px and 320px', async ({page}) => {
  await page.setViewportSize({width:960, height:720});
  await openReady(page);
  await installFixture(page);
  await page.locator('#view-toggle').click();
  await expect(page.locator('#list-view-table')).toBeVisible();
  await expect(page.locator('#list-view-table thead')).toBeVisible();
  await expect(page.locator('#list-view-table tbody tr')).toHaveCount(100);
  await expect(page.locator('#list-view-table tbody tr').first().locator('td')).toHaveCount(6);

  for (const width of [390, 320]) {
    await page.setViewportSize({width, height:720});
    const table = page.locator('#list-view-table');
    const firstRow = table.locator('tbody tr').first();
    await expect(page.locator('.list-view-mobile-sort')).toBeVisible();
    await expect(firstRow).toBeVisible();
    await expect(firstRow.locator('td')).toHaveCount(6);
    await expect(firstRow.locator('td').first()).toHaveAttribute('data-label', 'Task');
    await expect(firstRow.locator('td').nth(1)).toHaveAttribute('data-label', 'List');
    await expect(firstRow.locator('td').nth(2)).toHaveAttribute('data-label', 'Assignees');
    await expect(firstRow.locator('td').nth(3)).toHaveAttribute('data-label', 'Due');
    await expect(firstRow.locator('td').nth(4)).toHaveAttribute('data-label', 'Checklist');
    await expect(firstRow.locator('td').nth(5)).toHaveAttribute('data-label', 'Status');
    const layout=await firstRow.evaluate(row=>({row:row.getBoundingClientRect().toJSON(),title:row.querySelector('.list-card-title').getBoundingClientRect().toJSON(),label:getComputedStyle(row.querySelector('td:nth-child(2)'),'::before').color,muted:getComputedStyle(row.querySelector('.list-view-muted')).color}));
    expect(layout.label).toBe(layout.muted);
    expect(layout.title.width).toBeGreaterThan(layout.row.width*.75);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect(await table.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
    expect(await firstRow.evaluate(node => getComputedStyle(node).display)).toBe('block');
  }

  const sortDue = page.locator('.list-view-mobile-sort [data-list-sort="due"]');
  await sortDue.click();
  await expect(sortDue).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#list-view-table th').nth(3)).toHaveAttribute('aria-sort', 'ascending');
  await expect(page.locator('#list-view-table tbody tr')).toHaveCount(100);
  await page.getByRole('button', {name:'Show 100 more'}).click();
  await expect(page.locator('#list-view-table tbody tr')).toHaveCount(105);

  const card = page.locator('[data-list-card]').first();
  await card.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#card-dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(card).toBeFocused();
});
