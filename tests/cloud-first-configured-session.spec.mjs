import {test,expect} from '@playwright/test';
import {basePath} from '../scripts/repository-path.mjs';

test('configured signed-out build shows the account gate without activating legacy data',async({page})=>{
  const errors=[];
  page.on('pageerror',()=>errors.push('page'));
  page.on('console',message=>{if(message.type()==='error')errors.push('console');});
  const current='{"legacy":"configured-workspace"}',older='[{"legacy":"configured-data"}]';
  await page.addInitScript(({current,older})=>{localStorage.setItem('flowboard-workspace',current);localStorage.setItem('flowboard-data',older);},{current,older});
  await page.goto(basePath);
  await page.waitForFunction(()=>globalThis.FlowboardApp?.getMode?.().kind==='signed-out');
  await expect(page.locator('#board').getByRole('heading',{name:'Sign in to access your boards'})).toBeVisible();
  await expect(page.locator('#account-button')).toBeVisible();
  await expect(page.locator('.list,.card')).toHaveCount(0);
  expect(await page.evaluate(()=>({current:localStorage.getItem('flowboard-workspace'),older:localStorage.getItem('flowboard-data')}))).toEqual({current,older});
  expect(errors).toEqual([]);
});
