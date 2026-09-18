import test from 'node:test';
import assert from 'node:assert/strict';
import State from '../state-core.js';
import {createLocalWorkspaceAdapter} from '../src/adapters/local-workspace-adapter.js';

function storage(seed = {}, failKey = '') {
  const values = new Map(Object.entries(seed));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { if (key === failKey) throw new Error('storage full'); values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    raw(key) { return values.get(key) || null; }
  };
}

function adapter(store) {
  return createLocalWorkspaceAdapter({storage:store,validWorkspace:State.validWorkspace,normalizeWorkspace:State.normalizeWorkspace,migrateLegacy:State.migrateLegacy,makeWorkspace:State.makeWorkspace,clone:State.clone});
}

test('UI preferences are versioned, allowlisted, and default safely', () => {
  const store = storage({'flowboard-ui-preferences': JSON.stringify({version:1,density:'compact',view:'list',secret:'discard'})});
  const local = adapter(store);
  assert.deepEqual(local.loadUiPreferences(), {version:1,density:'compact',view:'list'});
  assert.deepEqual(adapter(storage()).loadUiPreferences(), {version:1,density:'comfortable',view:'board'});
  const result = local.saveUiPreferences({version:99,density:'invalid',view:'invalid',workspaceId:'nope'});
  assert.equal(result.ok, true);
  assert.deepEqual(local.loadUiPreferences(), {version:1,density:'comfortable',view:'board'});
});

test('UI preference writes never rewrite workspace or legacy data', () => {
  const workspace = JSON.stringify(State.makeWorkspace());
  const legacy = JSON.stringify([{title:'Legacy',cards:[]}]);
  const store = storage({'flowboard-workspace':workspace,'flowboard-data':legacy});
  const local = adapter(store);
  assert.equal(local.saveUiPreferences({density:'compact',view:'list'}).ok, true);
  assert.equal(store.raw('flowboard-workspace'), workspace);
  assert.equal(store.raw('flowboard-data'), legacy);
});

test('UI preference storage failures are reported without touching workspace data', () => {
  const workspace = JSON.stringify(State.makeWorkspace());
  const store = storage({'flowboard-workspace':workspace}, 'flowboard-ui-preferences');
  const local = adapter(store);
  const result = local.saveUiPreferences({density:'compact',view:'list'});
  assert.equal(result.ok, false);
  assert.equal(store.raw('flowboard-workspace'), workspace);
  assert.deepEqual(local.loadUiPreferences(), {version:1,density:'comfortable',view:'board'});
});
