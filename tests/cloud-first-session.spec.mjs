import {test,expect} from '@playwright/test';
import {basePath} from '../scripts/repository-path.mjs';

test('unconfigured build is honestly unavailable and never activates or rewrites legacy task data',async({page})=>{
  const errors=[];
  page.on('pageerror',()=>errors.push('page'));
  page.on('console',message=>{if(message.type()==='error')errors.push('console');});
  const current='{"legacy":"workspace"}',older='[{"legacy":"data"}]';
  await page.addInitScript(({current,older})=>{localStorage.setItem('flowboard-workspace',current);localStorage.setItem('flowboard-data',older);},{current,older});
  await page.goto(basePath);
  await page.waitForFunction(()=>globalThis.FlowboardApp?.getMode?.().kind==='unavailable');
  await expect(page.locator('#board').getByRole('heading',{name:'Boards unavailable'})).toBeVisible();
  await expect(page.locator('.list')).toHaveCount(0);
  await expect(page.locator('.card')).toHaveCount(0);
  await expect(page.getByText('Start here',{exact:true})).toHaveCount(0);
  await expect(page.locator('#boards-button')).toBeDisabled();
  await expect(page.locator('#account-button')).toBeHidden();
  expect(await page.evaluate(()=>({current:localStorage.getItem('flowboard-workspace'),older:localStorage.getItem('flowboard-data')}))).toEqual({current,older});
  await page.evaluate(()=>FlowboardApp.setSession(null));
  await expect(page.locator('#board').getByRole('heading',{name:'Sign in to access your boards'})).toBeVisible();
  expect(await page.evaluate(()=>({current:localStorage.getItem('flowboard-workspace'),older:localStorage.getItem('flowboard-data')}))).toEqual({current,older});
  expect(errors).toEqual([]);
});

test('cloud normalization renders a genuine empty workspace without a sample board',async({page})=>{
  await page.goto(basePath);
  await page.waitForFunction(()=>globalThis.FlowboardApp&&globalThis.FlowboardState);
  await page.evaluate(()=>FlowboardApp.openCloudWorkspace(FlowboardState.makeEmptyWorkspace(),{id:'synthetic-empty',name:'My workspace',role:'owner'}));
  await expect(page.locator('#board').getByRole('heading',{name:'Your boards are ready'})).toBeVisible();
  await expect(page.locator('.list')).toHaveCount(0);
  expect(await page.evaluate(()=>FlowboardApp.getActiveBoardSnapshot())).toBeNull();
});
