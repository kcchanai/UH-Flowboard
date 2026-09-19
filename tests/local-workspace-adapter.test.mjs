import test from 'node:test';
import assert from 'node:assert/strict';
import State from '../state-core.js';
import {createLocalWorkspaceAdapter} from '../src/adapters/local-workspace-adapter.js';
import {CloudNotConfiguredError} from '../src/adapters/adapter-contract.js';

function memoryStorage(seed={}){const values=new Map(Object.entries(seed));return{getItem:key=>values.has(key)?values.get(key):null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};}
function makeAdapter(storage){return createLocalWorkspaceAdapter({storage,validWorkspace:State.validWorkspace,normalizeWorkspace:State.normalizeCloudWorkspace,migrateLegacy:State.migrateLegacy,clone:State.clone});}

test('legacy inspection is read-only, count-verified, and stores receipts separately',()=>{
  const workspace=State.makeWorkspace();workspace.boards[0].archived=true;workspace.boards[0].lists[0].cards[0].archived=true;
  const raw=JSON.stringify(workspace),legacy='legacy-sentinel',storage=memoryStorage({'flowboard-workspace':raw,'flowboard-data':legacy}),adapter=makeAdapter(storage),result=adapter.inspectLegacyWorkspace();
  assert.equal(result.status,'ready');assert.equal(result.source,'current');assert.equal(result.counts.boards,1);assert.equal(result.archives.boards,1);assert.equal(result.archives.cards,1);assert.equal(result.backup.content,raw);
  assert.equal(storage.getItem('flowboard-workspace'),raw);assert.equal(storage.getItem('flowboard-data'),legacy);
  assert.equal(adapter.saveLegacyMigrationReceipt({operationId:'migration-operation-0001'}).ok,true);assert.deepEqual(adapter.loadLegacyMigrationReceipt(),{operationId:'migration-operation-0001'});
  assert.equal(storage.getItem('flowboard-workspace'),raw);assert.equal(storage.getItem('flowboard-data'),legacy);
});

test('empty current cloud-compatible data stays empty and missing data is not seeded',()=>{
  const empty=JSON.stringify(State.makeEmptyWorkspace()),storage=memoryStorage({'flowboard-workspace':empty}),adapter=makeAdapter(storage);
  assert.equal(adapter.inspectLegacyWorkspace().counts.boards,0);assert.equal(storage.getItem('flowboard-workspace'),empty);
  assert.deepEqual(makeAdapter(memoryStorage()).inspectLegacyWorkspace(),{status:'none'});
});

test('current export versions 1 through 5 preview without rewriting source bytes',()=>{
  for(let version=1;version<=5;version++){
    const workspace=State.makeWorkspace();workspace.schemaVersion=version;if(version<5){delete workspace.boards[0].lifecycleState;delete workspace.boards[0].lists[0].lifecycleState;}
    const raw=JSON.stringify(workspace),storage=memoryStorage({'flowboard-workspace':raw}),result=makeAdapter(storage).inspectLegacyWorkspace();
    assert.equal(result.status,'ready');assert.equal(result.counts.boards,1);assert.equal(storage.getItem('flowboard-workspace'),raw);
  }
});

test('old flowboard-data inspection is deterministic without rewriting raw bytes',()=>{
  const raw=JSON.stringify([{title:'Inbox',cards:[{title:'Migrated task'}]}]),storage=memoryStorage({'flowboard-data':raw}),adapter=makeAdapter(storage);
  const first=adapter.inspectLegacyWorkspace(),second=adapter.inspectLegacyWorkspace();
  assert.equal(first.status,'ready');assert.deepEqual(first.workspace,second.workspace);assert.equal(first.workspace.boards[0].lists[0].cards[0].title,'Migrated task');assert.equal(storage.getItem('flowboard-data'),raw);
});

test('malformed preferred source is reported without falling through or rewriting either key',()=>{
  const current='{invalid',legacy=JSON.stringify([{title:'Inbox',cards:[]}]),storage=memoryStorage({'flowboard-workspace':current,'flowboard-data':legacy}),adapter=makeAdapter(storage);
  assert.deepEqual(adapter.inspectLegacyWorkspace(),{status:'invalid',source:'current'});assert.equal(storage.getItem('flowboard-workspace'),current);assert.equal(storage.getItem('flowboard-data'),legacy);
});

test('LocalWorkspaceAdapter does not impersonate cloud functionality',async()=>{
  const adapter=makeAdapter(memoryStorage());assert.equal(adapter.getSession(),null);await assert.rejects(adapter.signInWithGoogle(),CloudNotConfiguredError);await assert.rejects(adapter.listWorkspaces(),CloudNotConfiguredError);
});
