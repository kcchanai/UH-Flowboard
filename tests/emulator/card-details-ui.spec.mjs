import {test,expect} from '@playwright/test';
import {previewUrl} from '../../scripts/repository-path.mjs';

test.describe.configure({mode:'serial'});
const baseURL=(process.env.PLAYWRIGHT_EMULATOR_BASE_URL||previewUrl(4174)).replace(/\/$/,'');
const cardName='Synthetic shared card';

async function openRole(page,role){await page.goto(`${baseURL}/tests/emulator/index.html?role=${role}`);await page.waitForFunction(()=>globalThis.__flowboardEmulatorTest?.ready===true);await expect(page.locator('#account-button')).toBeVisible();}
async function openFixture(page,expectedCardTitle=cardName){await page.locator('#account-button').click();const account=page.locator('#account-dialog');await expect(account).toBeVisible();await account.getByRole('button',{name:'Boards'}).click();const picker=page.locator('#workspace-dialog'),row=picker.locator('#workspace-board-list .workspace-entry').filter({hasText:'Emulator board'});await expect(row).toBeVisible();await row.getByRole('button',{name:/Open Emulator board/}).click();await expect.poll(()=>page.evaluate(()=>globalThis.FlowboardApp.getMode().kind)).toMatch(/cloud/);expect(await page.evaluate(()=>{const board=FlowboardApp.getActiveBoardSnapshot();return{lists:board?.lists.length||0,cards:board?.lists.reduce((sum,list)=>sum+list.cards.length,0)||0};})).toEqual({lists:2,cards:1});await expect(page.locator('.card-open').filter({hasText:expectedCardTitle})).toBeVisible();}
async function openCardStable(page,card){try{await card.click({timeout:3000});await expect(page.locator('#card-dialog')).toBeVisible({timeout:5000});}catch{await card.focus({timeout:3000});await card.press('Enter',{timeout:3000});await expect(page.locator('#card-dialog')).toBeVisible({timeout:5000});}}
async function editCommentStable(page){
  const item=page.locator('.comment-item').first(),updated='Emulator UI edited comment';
  for(let attempt=0;attempt<3;attempt++){
    if(await item.getByText(updated,{exact:true}).isVisible())return;
    try{
      await item.getByRole('button',{name:'Edit'}).click({timeout:3000});
      await item.locator('.comment-edit-input').fill(updated,{timeout:3000});
      await item.locator('[data-action="save-edit"]').click({timeout:3000});
      await expect(item).toContainText(updated,{timeout:5000});return;
    }catch(error){
      if(await item.getByText(updated,{exact:true}).isVisible())return;
      if(attempt===2)throw error;
      // A realtime snapshot can replace the inline editor between Edit and Save.
      await expect(item.getByRole('button',{name:'Edit'})).toBeVisible({timeout:5000});
    }
  }
}

test('card details UI preserves Emulator card and comment permissions',async({browser})=>{
  test.setTimeout(90000);const ownerContext=await browser.newContext(),editorContext=await browser.newContext(),viewerContext=await browser.newContext(),owner=await ownerContext.newPage(),editor=await editorContext.newPage(),viewer=await viewerContext.newPage();
  try{
    await test.step('owner opens card and closes details',async()=>{await openRole(owner,'owner');await owner.evaluate(()=>globalThis.__flowboardEmulatorTest.seedFixture());await openFixture(owner);await owner.setViewportSize({width:1440,height:900});const ownerCard=owner.locator('.card-open').filter({hasText:cardName});await openCardStable(owner,ownerCard);const ownerDialog=owner.locator('#card-dialog');await expect(ownerDialog).toBeVisible();await expect(ownerDialog.locator('#cloud-comments-section')).toBeVisible();await expect(ownerDialog).not.toContainText('Authenticated cloud comments are separate from older card-local activity.');await expect(ownerDialog.locator('#cloud-comments-status')).not.toHaveText('Comments are current.');await expect(ownerDialog.locator('#close-card-dialog')).toBeEnabled();await owner.locator('#close-card-dialog').click();await expect(ownerDialog).toBeHidden();});
    await test.step('editor updates title',async()=>{await openRole(editor,'editor');await openFixture(editor);await editor.setViewportSize({width:1440,height:900});const editedTitle='Emulator UI edited card',editorCard=editor.locator('.card-open').filter({hasText:cardName});await openCardStable(editor,editorCard);await expect(editor.locator('#card-dialog')).toBeVisible();await editor.locator('#card-title-input').fill(editedTitle);await editor.getByRole('button',{name:'Save changes'}).click();await expect(editor.locator('#card-dialog')).toBeHidden();await expect(owner.locator('.card-open').filter({hasText:editedTitle})).toBeVisible();});
    const editedTitle='Emulator UI edited card';
    await test.step('editor creates and edits comment',async()=>{await openCardStable(editor,editor.locator('.card-open').filter({hasText:editedTitle}));await expect(editor.locator('#card-dialog')).toBeVisible();await expect(editor.locator('#cloud-comments-section')).toBeVisible();await editor.locator('#cloud-comment-input').fill('Emulator UI comment');await editor.getByRole('button',{name:'Comment'}).click();const item=editor.locator('.comment-item').first();await expect(item).toContainText('Emulator UI comment');await editCommentStable(editor);await expect(item).toContainText('Emulator UI edited comment');await editor.locator('#close-card-dialog').click();await expect(editor.locator('#card-dialog')).toBeHidden();});
    await test.step('viewer sees read-only comment and closes details',async()=>{await openRole(viewer,'viewer');await openFixture(viewer,editedTitle);await viewer.setViewportSize({width:1440,height:900});const viewerCard=viewer.locator('.card-open').filter({hasText:editedTitle});await openCardStable(viewer,viewerCard);const viewerDialog=viewer.locator('#card-dialog');await expect(viewerDialog).toBeVisible();await expect(viewerDialog.locator('#cloud-comments-section')).toContainText('Emulator UI edited comment');await expect(viewerDialog.locator('#cloud-comment-form')).toBeHidden();await expect(viewerDialog.locator('#cloud-comments-readonly')).toBeVisible();await expect(viewerDialog.locator('#close-card-dialog')).toBeEnabled();await viewer.locator('#close-card-dialog').click();await expect(viewerDialog).toBeHidden();await expect(viewerCard).toBeFocused();});
    await test.step('owner reads edited comment',async()=>{await openCardStable(owner,owner.locator('.card-open').filter({hasText:editedTitle}));await expect(owner.locator('#cloud-comments-section')).toContainText('Emulator UI edited comment');await owner.locator('#close-card-dialog').click();});
    await test.step('editor removes comment',async()=>{await openCardStable(editor,editor.locator('.card-open').filter({hasText:editedTitle}));const item=editor.locator('.comment-item').first();await editor.locator('[data-action="remove-comment"]').click();await editor.locator('#comment-delete-dialog').getByRole('button',{name:'Remove comment'}).click();await expect(item).toContainText('Comment removed.');await editor.locator('#close-card-dialog').click();});
    await test.step('owner observes removed comment',async()=>{await openCardStable(owner,owner.locator('.card-open').filter({hasText:editedTitle}));await expect(owner.locator('#cloud-comments-section')).toContainText('Comment removed.');await owner.locator('#close-card-dialog').click();});
  }finally{await Promise.all([ownerContext.close(),editorContext.close(),viewerContext.close()]);}
});
