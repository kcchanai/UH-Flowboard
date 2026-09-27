import {test,expect} from '@playwright/test';
import {basePath} from '../scripts/repository-path.mjs';

async function openSyntheticBoard(page,role='owner') {
  await page.goto(basePath);
  await page.waitForFunction(()=>globalThis.FlowboardApp&&globalThis.FlowboardState&&['unavailable','signed-out','cloud','cloud-preview','ready-empty'].includes(FlowboardApp.getMode().kind));
  await page.evaluate(role=>{
    const w=FlowboardState.makeWorkspace(),b=w.boards[0];
    b.title='Fixture board';b.lists=[FlowboardState.makeList('Fixture queue',[FlowboardState.makeCard('Synthetic task')]),FlowboardState.makeList('Fixture next',[])];
    w.activeBoardId=b.id;
    const scope={id:'demo-two-row',name:'Fixture workspace',role};
    if(role==='viewer')FlowboardApp.openCloudPreview(w,scope);
    else FlowboardApp.openCloudWorkspace(w,scope);
  },role);
  await expect(page.locator('#board .list')).toHaveCount(2);
}

const geometry=page=>page.evaluate(()=>{
  const box=selector=>{const {top,bottom,left,right,height}=document.querySelector(selector).getBoundingClientRect();return{top,bottom,left,right,height};};
  const toolbar=document.querySelector('.board-header');
  return {top:box('.topbar'),toolbar:box('.board-header'),board:box('#board'),title:box('.board-heading'),search:box('.board-search'),filters:box('#filter-toggle'),view:box('#view-toggle'),archive:box('#archived-cards-button'),pageFits:document.documentElement.scrollWidth<=document.documentElement.clientWidth,toolbarScroll:toolbar.scrollWidth>toolbar.clientWidth};
});

test('navigation and board controls use only two compact rows at desktop and narrow widths',async({page})=>{
  await openSyntheticBoard(page);
  await expect(page.locator('#quick-add-card')).toHaveCount(0);
  for(const [width,height] of [[1920,1080],[1440,900],[1280,720],[960,540],[700,720],[390,844],[320,720]]){
    await page.setViewportSize({width,height});
    await page.locator('.board-header').evaluate(node=>node.scrollLeft=0);
    const g=await geometry(page);
    expect(g.pageFits,`document overflow at ${width}`).toBe(true);
    expect(g.top.bottom).toBeLessThanOrEqual(g.toolbar.top+1);
    expect(g.toolbar.bottom).toBeLessThanOrEqual(g.board.top);
    expect(g.toolbar.height,`toolbar wrapped at ${width}`).toBeLessThanOrEqual(54);
    expect(g.search.top).toBeGreaterThanOrEqual(g.toolbar.top);
    expect(Math.abs(g.view.top-g.filters.top)).toBeLessThan(15);
    expect(Math.abs(g.archive.top-g.filters.top)).toBeLessThan(15);
    if(width<=390){expect(g.toolbarScroll).toBe(true);await expect(page.locator('#toolbar-scroll-cue')).toBeVisible();const cue=await page.locator('#toolbar-scroll-cue').boundingBox();expect(cue.x).toBeGreaterThanOrEqual(g.filters.right);}
    if(width===960){expect(g.archive.right).toBeLessThanOrEqual(width);await expect(page.locator('#quick-filters')).toBeHidden();}
    if(width>=1280)await expect(page.locator('#quick-filters')).toBeVisible();
    const add=page.locator('#board .list').first().locator('.add-card');
    await expect(add).toBeVisible();
  }
});

test('narrow toolbar scrolls to real actions; popup, search, List view and archive work',async({page})=>{
  await openSyntheticBoard(page);
  await page.setViewportSize({width:390,height:844});
  await expect(page.locator('#toolbar-scroll-cue')).toBeVisible();
  await page.locator('.board-header').evaluate(node=>node.scrollLeft=node.scrollWidth);
  await expect(page.locator('#toolbar-scroll-cue')).toBeHidden();
  await page.locator('.board-header').evaluate(node=>node.scrollLeft=0);
  await expect(page.locator('#toolbar-scroll-cue')).toBeVisible();
  await page.locator('#search').fill('Synthetic task');
  await expect(page.locator('.card-open')).toHaveCount(1);
  await page.locator('#filter-toggle').click();
  const panel=page.locator('#filter-panel');await expect(panel).toBeVisible();
  const bounds=await panel.boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.x+bounds.width).toBeLessThanOrEqual(390);
  expect(bounds.y+bounds.height).toBeLessThanOrEqual(844);
  await panel.locator('#due-filter').selectOption('today');
  await expect(page.locator('.card-open')).toHaveCount(0);
  await expect(page.locator('#search-count')).toHaveAttribute('data-short-summary','0 of 1 cards');
  await page.keyboard.press('Escape');await expect(panel).toBeHidden();
  await page.locator('#filter-toggle').click();await panel.locator('#clear-filters').click();
  await page.locator('#clear-search').click();
  await page.locator('#view-toggle').click();await expect(page.locator('#list-view-table')).toBeVisible();
  await page.locator('#archived-cards-button').click();await expect(page.locator('#archive-dialog')).toBeVisible();
  await page.locator('#close-archive-dialog').click();await expect(page.locator('#archive-dialog')).toBeHidden();
  await page.locator('#view-toggle').click();await expect(page.locator('.add-card').first()).toBeVisible();
});

test('quick filters are self-clearing and compact without duplicate chips or long helper copy',async({page})=>{
  await openSyntheticBoard(page);
  await page.setViewportSize({width:1440,height:900});
  const overdue=page.locator('[data-quick-filter="overdue"]'),filters=page.locator('#filter-toggle');
  await expect(filters).toHaveAttribute('data-active','false');
  await overdue.click();
  await expect(overdue).toHaveAttribute('aria-pressed','true');
  await expect(filters).toHaveAttribute('aria-label','Filters active');
  await expect(page.locator('#filter-chips')).toHaveCount(0);
  await expect(page.locator('#search-count')).toHaveText('0 of 1 cards shown · 0 overdue · 0 due today · 0 complete');
  await expect(page.locator('#topbar-summary')).toHaveText('0 of 1 cards shown · 0 overdue · 0 due today · 0 complete');
  await expect(page.locator('#topbar-summary')).toBeVisible();
  await expect(page.locator('#search-count')).toBeHidden();
  const activeBorder=await overdue.evaluate(node=>getComputedStyle(node).borderTopColor);
  await overdue.click();
  await expect(overdue).toHaveAttribute('aria-pressed','false');
  expect(await overdue.evaluate(node=>getComputedStyle(node).borderTopColor)).not.toBe(activeBorder);
  await expect(filters).toHaveAttribute('data-active','false');
  await overdue.click();
  for(const width of [1280,960,390,320]){
    await page.setViewportSize({width,height:720});
    await expect(filters).toHaveAttribute('data-active','true');
    const geometry=await page.evaluate(()=>({top:document.querySelector('.topbar').getBoundingClientRect().bottom,toolbar:document.querySelector('.board-header').getBoundingClientRect(),overflow:document.documentElement.scrollWidth>innerWidth}));
    expect(geometry.overflow).toBe(false);
    expect(geometry.toolbar.top).toBeGreaterThanOrEqual(geometry.top);
    expect(geometry.toolbar.height).toBeLessThanOrEqual(54);
    if(width>1100){
      const top=await page.locator('#topbar-summary').evaluate(node=>{const r=node.getBoundingClientRect(),boards=document.querySelector('#boards-button').getBoundingClientRect(),appearance=document.querySelector('#theme-toggle').getBoundingClientRect();return{left:r.left,right:r.right,boardsRight:boards.right,appearanceLeft:appearance.left,fullyVisible:node.scrollWidth<=node.clientWidth};});
      expect(top.fullyVisible).toBe(true);
      expect(top.left).toBeGreaterThanOrEqual(top.boardsRight);
      expect(top.right).toBeLessThanOrEqual(top.appearanceLeft);
    } else {
      await expect(page.locator('#topbar-summary')).toBeHidden();
      await expect(page.locator('#search-count')).toBeVisible();
    }
    if(width<=960)await expect(page.locator('#quick-filters')).toBeHidden();
  }
  await filters.click();
  await expect(page.locator('#due-filter')).toHaveValue('overdue');
  await page.locator('#clear-filters').click();
  await expect(filters).toHaveAttribute('aria-label','Filters');
  await expect(page.locator('#due-filter')).toHaveValue('all');
  await expect(page.locator('.card-open')).toHaveCount(1);
  await page.locator('#completion-filter').selectOption('complete');
  await expect(filters).toHaveAttribute('data-active','true');
  await expect(page.locator('.card-open')).toHaveCount(0);
  await page.locator('#completion-filter').selectOption('all');
  await expect(filters).toHaveAttribute('data-active','false');
  await expect(page.locator('.card-open')).toHaveCount(1);
});

test('per-list composer reserves Enter for submission, Shift+Enter for a newline, and ignores IME',async({page})=>{
  await openSyntheticBoard(page);
  const list=page.locator('#board .list').first();
  await list.locator('.add-card').click();
  const title=list.getByLabel('New card title');
  await title.press('Enter');
  await expect(title).toBeVisible();
  await expect(title).toHaveValue('');
  await title.fill('First line');
  await title.press('Shift+Enter');
  await title.type('Second line');
  await expect(title).toHaveValue('First line\nSecond line');
  await title.fill('Composed card');
  await title.evaluate(element=>element.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true,isComposing:true})));
  await expect(title).toHaveValue('Composed card');
  const handled=await title.evaluate(element=>{const event=new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true});element.dispatchEvent(event);return event.defaultPrevented;});
  expect(handled).toBe(true);
});

test('signed-out and viewer controls retain their access boundaries',async({page})=>{
  await page.setViewportSize({width:320,height:720});await page.goto(basePath);
  await page.waitForFunction(()=>globalThis.FlowboardApp&&globalThis.FlowboardState&&['unavailable','signed-out','cloud','cloud-preview','ready-empty'].includes(FlowboardApp.getMode().kind));
  await expect(page.locator('.cloud-gate')).toBeVisible();
  expect((await geometry(page)).pageFits).toBe(true);
  await page.locator('#theme-toggle').click();await expect(page.locator('#appearance-dialog')).toBeVisible();
  await page.locator('#cancel-appearance').click();
  await openSyntheticBoard(page,'viewer');
  await expect(page.locator('.add-card').first()).toBeHidden();
  await page.locator('#view-toggle').click();await expect(page.locator('#list-view-table')).toBeVisible();
  await page.locator('#archived-cards-button').click();await expect(page.locator('#archive-dialog')).toBeVisible();
});
