import {test,expect} from '@playwright/test';
import {createRequire} from 'node:module';
import {basePath} from '../scripts/repository-path.mjs';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';

const artifacts=path.resolve(process.env.AUDIT_ARTIFACTS||'artifacts/audit-implementation/visual');
const widths=[320,360,375,390,412,430,700];
const box=selector=>{
  const node=document.querySelector(selector);
  if(!node)return null;
  const rect=node.getBoundingClientRect(),style=getComputedStyle(node);
  return {left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom,width:rect.width,height:rect.height,display:style.display,visibility:style.visibility};
};

test('audit visual matrix keeps compact header clear and Appearance actions persistent',async({page})=>{
  await mkdir(artifacts,{recursive:true});
  await page.goto('/UH-Flowboard/');
  await expect(page.locator('#theme-toggle')).toBeVisible();
  for(const width of widths){
    await page.setViewportSize({width,height:844});
    const layout=await page.evaluate(()=>{const box=selector=>{const node=document.querySelector(selector),rect=node?.getBoundingClientRect(),style=node&&getComputedStyle(node);return rect&&{left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom,width:rect.width,height:rect.height,display:style.display,visibility:style.visibility};};return {brand:box('.brand'),mark:box('.brand-mark'),word:box('.brand span:last-child'),boards:box('#boards-button'),appearance:box('#theme-toggle'),documentWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth};});
    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
    expect(layout.mark.right).toBeLessThanOrEqual(layout.boards.left);
    expect(layout.boards.right).toBeLessThanOrEqual(layout.appearance.left);
    if(width<=440)expect(layout.word.display).toBe('none');
    if([320,390,700].includes(width))await page.screenshot({path:path.join(artifacts,`header-${width}x844.png`),fullPage:false});
  }
  for(const width of [960,1280,1440,1920]){
    await page.setViewportSize({width,height:720});
    const pageWidth=await page.evaluate(()=>({documentWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth}));
    expect(pageWidth.documentWidth).toBeLessThanOrEqual(pageWidth.viewportWidth);
    await page.screenshot({path:path.join(artifacts,`header-${width}x720.png`),fullPage:false});
  }
  await page.setViewportSize({width:390,height:844});
  await page.locator('#theme-toggle').click();
  await expect(page.locator('#appearance-dialog')).toBeVisible();
  const mobile=await page.evaluate(()=>{const box=selector=>{const rect=document.querySelector(selector).getBoundingClientRect();return {top:rect.top,bottom:rect.bottom};};return {dialog:box('#appearance-dialog'),form:box('#appearance-form'),header:box('#appearance-dialog .card-dialog-header'),body:box('#appearance-dialog .appearance-body'),footer:box('#appearance-dialog .appearance-actions'),save:box('#appearance-form button[type="submit"]'),bodyOverflow:getComputedStyle(document.querySelector('.appearance-body')).overflowY,bodyScroll:document.querySelector('.appearance-body').scrollHeight,bodyClient:document.querySelector('.appearance-body').clientHeight};});
  expect(mobile.dialog.bottom-mobile.dialog.top).toBeLessThanOrEqual(844);
  expect(mobile.form.bottom-mobile.form.top).toBeLessThanOrEqual(844);
  expect(mobile.bodyOverflow).toBe('auto');
  expect(mobile.bodyScroll).toBeGreaterThan(mobile.bodyClient);
  expect(mobile.header.bottom).toBeLessThanOrEqual(mobile.body.top);
  expect(mobile.body.bottom).toBeLessThanOrEqual(mobile.footer.top);
  expect(mobile.save.bottom).toBeLessThanOrEqual(mobile.footer.bottom);
  await page.screenshot({path:path.join(artifacts,'appearance-390x844-light.png'),fullPage:false});
  const end=await page.evaluate(()=>{const body=document.querySelector('.appearance-body'),header=document.querySelector('#appearance-dialog .card-dialog-header').getBoundingClientRect(),footer=document.querySelector('#appearance-dialog .appearance-actions').getBoundingClientRect();body.scrollTop=body.scrollHeight;const status=document.querySelector('#appearance-status').getBoundingClientRect(),bodyRect=body.getBoundingClientRect();return {atEnd:body.scrollTop+body.clientHeight>=body.scrollHeight,headerTop:header.top,footerBottom:footer.bottom,statusBottom:status.bottom,bodyBottom:bodyRect.bottom};});
  expect(end.atEnd).toBe(true);
  expect(end.headerTop).toBe(mobile.header.top);
  expect(end.footerBottom).toBe(mobile.footer.bottom);
  expect(end.statusBottom).toBeLessThanOrEqual(end.bodyBottom);
  await page.screenshot({path:path.join(artifacts,'appearance-390x844-light-end.png'),fullPage:false});
  await page.locator('input[name="appearance-mode"][value="dark"]').check();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await page.screenshot({path:path.join(artifacts,'appearance-390x844-dark.png'),fullPage:false});
  await page.setViewportSize({width:960,height:360});
  const short=await page.evaluate(()=>{const box=selector=>{const rect=document.querySelector(selector).getBoundingClientRect();return {top:rect.top,bottom:rect.bottom};};return {dialog:box('#appearance-dialog'),header:box('#appearance-dialog .card-dialog-header'),body:box('#appearance-dialog .appearance-body'),footer:box('#appearance-dialog .appearance-actions'),save:box('#appearance-form button[type="submit"]')};});
  expect(short.dialog.bottom-short.dialog.top).toBeLessThanOrEqual(360);
  expect(short.header.bottom).toBeLessThanOrEqual(short.body.top);
  expect(short.body.bottom).toBeLessThanOrEqual(short.footer.top);
  expect(short.save.top).toBeGreaterThanOrEqual(short.footer.top);
  expect(short.save.bottom).toBeLessThanOrEqual(short.footer.bottom);
  await page.screenshot({path:path.join(artifacts,'appearance-960x360-dark.png'),fullPage:false});
  await page.setViewportSize({width:844,height:390});
  const landscape=await page.evaluate(()=>{
    const rect=selector=>{const box=document.querySelector(selector).getBoundingClientRect();return {top:box.top,bottom:box.bottom};};
    return {header:rect('#appearance-dialog .card-dialog-header'),body:rect('#appearance-dialog .appearance-body'),footer:rect('#appearance-dialog .appearance-actions'),close:rect('#close-appearance-dialog'),save:rect('#appearance-form button[type="submit"]'),height:innerHeight};
  });
  expect(landscape.close.top).toBeGreaterThanOrEqual(0);
  expect(landscape.close.bottom).toBeLessThanOrEqual(landscape.height);
  expect(landscape.save.top).toBeGreaterThanOrEqual(landscape.footer.top);
  expect(landscape.save.bottom).toBeLessThanOrEqual(landscape.height);
  expect(landscape.body.bottom).toBeLessThanOrEqual(landscape.footer.top);
  await page.screenshot({path:path.join(artifacts,'appearance-844x390-dark.png'),fullPage:false});
});

const require=createRequire(import.meta.url);
const axePath=require.resolve('axe-core/axe.min.js');
const contrast=async(page,selector)=>{
  await page.waitForTimeout(350);
  return page.evaluate(async target=>{
    const report=await axe.run(document.querySelector(target),{runOnly:['color-contrast']});
    return report.violations.map(item=>({id:item.id,targets:item.nodes.map(node=>node.target)}));
  },selector);
};

test('all selected Appearance palettes and dark card actions meet text contrast',async({page})=>{
  await page.goto(basePath);
  await page.waitForFunction(()=>globalThis.FlowboardApp&&globalThis.FlowboardState);
  await page.addScriptTag({path:axePath});
  await page.locator('#theme-toggle').click();
  const canvases=await page.locator('input[name="appearance-canvas"]').evaluateAll(inputs=>inputs.map(input=>input.value));
  for(const mode of ['light','dark']){
    await page.locator(`input[name="appearance-mode"][value="${mode}"]`).check();
    for(const canvas of canvases){
      await page.locator(`input[name="appearance-canvas"][value="${canvas}"]`).check();
      expect(await contrast(page,'#appearance-dialog'),`${mode}/${canvas} Appearance`).toEqual([]);
    }
  }
  await page.locator('#close-appearance-dialog').click();
  await page.locator('#theme-toggle').click();
  await page.locator('input[name="appearance-mode"][value="dark"]').check();
  await page.locator('#appearance-form button[type="submit"]').click();
  await page.evaluate(()=>{
    const workspace=FlowboardState.makeEmptyWorkspace(),board=FlowboardState.makeBoard('blank');
    board.title='Contrast test';board.lists=[FlowboardState.makeList('Test list',[FlowboardState.makeCard('Test card')])];
    workspace.boards=[board];workspace.activeBoardId=board.id;
    FlowboardApp.openCloudWorkspace(workspace,{id:'synthetic-contrast',name:'Contrast test',role:'owner'});
  });
  await expect(page.locator('.card-open')).toBeVisible();
  await page.setViewportSize({width:390,height:844});
  const narrow=await page.evaluate(()=>{
    const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width}};
    return {search:rect('.board-search'),summary:rect('#search-count'),list:getComputedStyle(document.querySelector('.list')).backgroundColor,card:getComputedStyle(document.querySelector('.card')).backgroundColor,passiveToast:document.querySelector('#toast').classList.contains('passive'),viewport:innerWidth};
  });
  expect(Math.abs(narrow.summary.top-narrow.search.top)).toBeLessThan(15);
  expect(narrow.summary.left).toBeGreaterThan(narrow.search.right);
  expect(narrow.search.width).toBeGreaterThanOrEqual(75);
  expect(narrow.list).not.toBe(narrow.card);
  expect(narrow.passiveToast).toBe(true);
  await page.locator('.add-card').click();
  expect(await contrast(page,'#board'),'dark board and Add card').toEqual([]);
  await page.locator('.composer-cancel').click();
  await page.locator('.card-open').click();
  expect(await contrast(page,'#card-dialog'),'dark card details').toEqual([]);
});

test('Appearance contained actions preserve preview, failed draft, and explicit Reset save',async({page})=>{
  await page.goto(basePath);
  await page.waitForFunction(()=>globalThis.FlowboardApp&&globalThis.FlowboardRuntime);
  await page.evaluate(()=>localStorage.setItem('flowboard-workspace','{"synthetic": "raw,  unchanged"}'));
  const raw=await page.evaluate(()=>localStorage.getItem('flowboard-workspace'));
  await page.locator('#theme-toggle').click();
  await page.locator('input[name="appearance-mode"][value="dark"]').check();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await page.locator('#cancel-appearance').click();
  await expect(page.locator('html')).not.toHaveAttribute('data-appearance-mode','dark');
  await page.locator('#theme-toggle').click();
  await page.locator('input[name="appearance-mode"][value="dark"]').check();
  await page.evaluate(()=>{
    const original=Storage.prototype.setItem;
    window.__restoreAuditStorage=()=>{Storage.prototype.setItem=original};
    Storage.prototype.setItem=function(key,value){
      if(key==='flowboard-appearance')throw new DOMException('Synthetic storage denial','QuotaExceededError');
      return original.call(this,key,value);
    };
  });
  await page.evaluate(()=>document.querySelector('#appearance-dialog .appearance-body').scrollTop=0);
  await page.locator('#appearance-form button[type="submit"]').click();
  await expect(page.locator('#appearance-dialog')).toBeVisible();
  await expect(page.locator('#appearance-status')).toContainText('could not be saved');
  const failureVisibility=await page.evaluate(()=>{
    const body=document.querySelector('#appearance-dialog .appearance-body'),status=document.querySelector('#appearance-status');
    return {scrollTop:body.scrollTop,statusBottom:status.getBoundingClientRect().bottom,bodyBottom:body.getBoundingClientRect().bottom};
  });
  expect(failureVisibility.scrollTop).toBeGreaterThan(0);
  expect(failureVisibility.statusBottom).toBeLessThanOrEqual(failureVisibility.bodyBottom+1);
  await expect(page.locator('input[name="appearance-mode"][value="dark"]')).toBeChecked();
  await page.evaluate(()=>window.__restoreAuditStorage());
  await page.locator('#appearance-form button[type="submit"]').click();
  await expect(page.locator('#appearance-dialog')).toBeHidden();
  await page.locator('#theme-toggle').click();
  await page.locator('#reset-appearance').click();
  await expect(page.locator('input[name="appearance-mode"][value="system"]')).toBeChecked();
  await page.locator('#cancel-appearance').click();
  await expect(page.locator('html')).toHaveAttribute('data-appearance-mode','dark');
  await page.locator('#theme-toggle').click();
  await page.locator('#reset-appearance').click();
  await page.locator('#appearance-form button[type="submit"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-appearance-mode','system');
  expect(await page.evaluate(()=>localStorage.getItem('flowboard-workspace'))).toBe(raw);
});
