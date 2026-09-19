import {test,expect} from '@playwright/test';
import {createRequire} from 'node:module';
import {basePath} from '../scripts/repository-path.mjs';
const require=createRequire(import.meta.url),axePath=require.resolve('axe-core/axe.min.js');
const audit=async page=>{await page.addScriptTag({path:axePath});return page.evaluate(async()=>{const result=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return result.violations.map(item=>({id:item.id,nodes:item.nodes.length}));});};

test('loaded cloud board and card dialog have no axe violations',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.name));page.on('console',message=>{if(message.type()==='error')errors.push('console');});await page.goto(basePath);await page.waitForFunction(()=>globalThis.FlowboardApp&&globalThis.FlowboardState);await page.evaluate(()=>{const workspace=FlowboardState.makeEmptyWorkspace(),board=FlowboardState.makeBoard('blank'),card=FlowboardState.makeCard('Accessible card');board.title='Accessibility board';board.lists=[FlowboardState.makeList('Accessible list',[card])];workspace.boards=[board];workspace.activeBoardId=board.id;FlowboardApp.openCloudWorkspace(workspace,{id:'a11y-workspace',name:'Accessibility workspace',role:'owner'});});expect(await audit(page)).toEqual([]);await page.locator('.card-open').click();await expect(page.locator('#card-dialog')).toBeVisible();expect(await audit(page)).toEqual([]);expect(errors).toEqual([]);
});
