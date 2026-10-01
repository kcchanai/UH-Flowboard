import test from 'node:test';
import assert from 'node:assert/strict';
import {initializeCloudSyncController} from '../src/cloud-sync-controller.js';

const tick = () => new Promise(resolve => setImmediate(resolve));

function harness({verifyWorkspaceAccess = async () => 'editor'} = {}) {
  const events = new EventTarget();
  globalThis.window = events;
  Object.defineProperty(globalThis, 'navigator', {value:{onLine:true}, configurable:true});
  const calls = {subscriptions:[], unsubscribed:0, statuses:[], boards:[], roles:[], names:[], removed:[], verifications:[]};
  let mode = {kind:'local'}, boardId = 'board-a';
  globalThis.FlowboardApp = {
    getMode:() => ({...mode}), getActiveBoardId:() => boardId,
    setCloudSyncStatus:(...args) => calls.statuses.push(args),
    applyRemoteCloudBoard:value => calls.boards.push(value),
    updateCloudRole:role => calls.roles.push(role),
    updateCloudWorkspaceName:(...args) => calls.names.push(args),
    handleCloudAccessRemoved:message => { calls.removed.push(message); mode = {kind:'local'}; }
  };
  const adapter = {async verifyWorkspaceAccess(workspaceId) { calls.verifications.push(workspaceId); return verifyWorkspaceAccess(workspaceId); }, async subscribeWorkspace(options) { calls.subscriptions.push(options); return () => { calls.unsubscribed += 1; }; }};
  const controller = initializeCloudSyncController(adapter);
  return {calls, controller, setMode:value => { mode = value; }, getMode:() => ({...mode}), setBoard:value => { boardId = value; }, events};
}

test('cloud sync scopes listeners to the active workspace and board and restarts on board change', async () => {
  const h = harness();
  h.controller.setSession({uid:'member-a'});
  h.setMode({kind:'cloud', id:'workspace-a', role:'editor'});
  h.events.dispatchEvent(new Event('flowboard:cloud-preview-change'));
  await tick();
  assert.equal(h.calls.subscriptions.length, 1);
  assert.equal(h.calls.subscriptions[0].workspaceId, 'workspace-a');
  assert.equal(h.calls.subscriptions[0].boardId, 'board-a');
  h.calls.subscriptions[0].onStatus('synced');
  h.calls.subscriptions[0].onWorkspace({status:'ready', name:'Renamed workspace'});
  h.calls.subscriptions[0].onMembership('viewer');
  h.calls.subscriptions[0].onBoard({board:{id:'board-a'}});
  assert.deepEqual(h.calls.statuses.at(-1), ['Synced', '']);
  assert.deepEqual(h.calls.names, [['workspace-a', 'Renamed workspace']]);
  assert.deepEqual(h.calls.roles, ['viewer']);
  assert.equal(h.calls.boards.length, 1);

  h.setBoard('board-b');
  h.events.dispatchEvent(new Event('flowboard:active-board-change'));
  await tick();
  assert.equal(h.calls.unsubscribed, 1);
  assert.equal(h.calls.subscriptions.at(-1).boardId, 'board-b');
});

test('cloud sync reports offline state and clears cloud mode on sign-out', async () => {
  const h = harness();
  h.setMode({kind:'cloud-preview', id:'workspace-a'});
  h.controller.setSession({uid:'member-a'});
  await tick();
  h.events.dispatchEvent(new Event('offline'));
  assert.deepEqual(h.calls.statuses.at(-1), ['Offline', '']);
  h.controller.setSession(null);
  assert.equal(h.calls.unsubscribed, 1);
  assert.match(h.calls.removed.at(-1), /Signed out/);
});

test('cloud sync verifies membership on reconnect and clears revoked cloud mode', async () => {
  let revoked = false;
  const h = harness({verifyWorkspaceAccess:async () => {
    if (revoked) throw Object.assign(new Error('denied'), {code:'ACCESS_REMOVED'});
    return 'editor';
  }});
  h.setMode({kind:'cloud', id:'workspace-a', role:'editor'});
  h.controller.setSession({uid:'member-a'});
  await tick();
  assert.equal(h.calls.subscriptions.length, 1);
  revoked = true;
  h.events.dispatchEvent(new Event('online'));
  await tick();
  assert.equal(h.calls.unsubscribed, 1);
  assert.match(h.calls.removed.at(-1), /access was removed/i);
});

test('descendant permission denial verifies membership and retries without ending cloud access', async () => {
  const h = harness();
  h.setMode({kind:'cloud', id:'workspace-a', role:'editor'});
  h.controller.setSession({uid:'member-a'});
  await tick();
  h.calls.subscriptions[0].onError(Object.assign(new Error('denied'), {code:'permission-denied',stage:'cards'}));
  await new Promise(resolve => setTimeout(resolve, 300));
  await tick();
  assert.deepEqual(h.calls.verifications, ['workspace-a']);
  assert.equal(h.calls.subscriptions.length, 2);
  assert.equal(h.calls.removed.length, 0);
  assert.equal(h.getMode().kind, 'cloud');
  assert(h.calls.statuses.some(([name,message]) => name === 'Connecting' && message === 'Checking cards.'));
  h.calls.subscriptions[1].onBoard({board:{id:'board-a'}});
  assert.equal(h.calls.boards.length, 1);
});

test('transient permission denials receive bounded retries and finish as error, not access-lost', async () => {
  const h = harness(), delays=[250,750,1500,3000,6000,12000], scheduled=[];
  const setTimeoutOriginal=globalThis.setTimeout,clearTimeoutOriginal=globalThis.clearTimeout;
  globalThis.setTimeout=(callback,delay)=>{scheduled.push({callback,delay});return scheduled.length;};
  globalThis.clearTimeout=()=>{};
  try {
    h.setMode({kind:'cloud', id:'workspace-a', role:'editor'});
    h.controller.setSession({uid:'member-a'});
    await tick();
    for(let attempt=0;attempt<delays.length;attempt++){
      h.calls.subscriptions[attempt].onError(Object.assign(new Error('denied'),{code:'permission-denied',stage:'board'}));
      await tick();
      assert.equal(scheduled.length,1);
      const retry=scheduled.shift();
      assert.equal(retry.delay,delays[attempt]);
      retry.callback();
      await tick();
      assert.equal(h.calls.subscriptions.length,attempt+2);
    }
    h.calls.subscriptions.at(-1).onError(Object.assign(new Error('denied'),{code:'permission-denied',stage:'board'}));
    await tick();
    assert.equal(scheduled.length,0);
    assert.equal(h.calls.subscriptions.length,delays.length+1);
    assert.equal(h.calls.removed.length,0);
    assert.equal(h.getMode().kind,'cloud');
    assert.equal(h.calls.statuses.at(-1)[0],'Error');
  } finally {
    globalThis.setTimeout=setTimeoutOriginal;
    globalThis.clearTimeout=clearTimeoutOriginal;
  }
});

test('permission denial with unavailable server verification remains an offline error, not access-lost', async () => {
  const h = harness({verifyWorkspaceAccess:async () => {throw Object.assign(new Error('unavailable'), {code:'unavailable'});}});
  h.setMode({kind:'cloud-preview', id:'workspace-a', role:'viewer'});
  h.controller.setSession({uid:'member-a'});
  await tick();
  h.calls.subscriptions[0].onError(Object.assign(new Error('denied'), {code:'permission-denied',stage:'board'}));
  await tick();
  assert.equal(h.calls.removed.length, 0);
  assert.equal(h.getMode().kind, 'cloud-preview');
  assert.equal(h.calls.statuses.at(-1)[0], 'Offline');
});

test('permission denial with confirmed missing membership still ends access', async () => {
  const h = harness({verifyWorkspaceAccess:async () => {throw Object.assign(new Error('removed'), {code:'ACCESS_REMOVED'});}});
  h.setMode({kind:'cloud', id:'workspace-a', role:'editor'});
  h.controller.setSession({uid:'member-a'});
  await tick();
  h.calls.subscriptions[0].onError(Object.assign(new Error('denied'), {code:'permission-denied',stage:'board'}));
  await tick();
  assert.equal(h.calls.removed.length, 1);
  assert.equal(h.getMode().kind, 'local');
});

test('archived workspace snapshot stops once and does not reconnect', async () => {
  const h = harness();
  h.setMode({kind:'cloud', id:'workspace-a', role:'editor'});
  h.controller.setSession({uid:'member-a'});
  await tick();
  assert.equal(h.calls.subscriptions.length, 1);

  const listener = h.calls.subscriptions[0];
  listener.onWorkspace({status:'archived', name:'Archived workspace'});
  assert.equal(h.calls.unsubscribed, 1);
  assert.equal(h.calls.removed.length, 1);
  assert.match(h.calls.removed[0], /archived/i);
  assert.equal(h.getMode().kind, 'local');

  listener.onWorkspace({status:'ready', name:'Late workspace name'});
  listener.onError(Object.assign(new Error('late archived callback'), {code:'permission-denied'}));
  assert.equal(h.calls.unsubscribed, 1);
  assert.equal(h.calls.removed.length, 1);
  assert.equal(h.calls.names.length, 0);

  h.events.dispatchEvent(new Event('online'));
  await tick();
  assert.equal(h.calls.subscriptions.length, 1);
});
