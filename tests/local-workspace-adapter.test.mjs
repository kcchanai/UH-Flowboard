import test from 'node:test';
import assert from 'node:assert/strict';
import State from '../state-core.js';
import {createLocalWorkspaceAdapter} from '../src/adapters/local-workspace-adapter.js';
import {CloudNotConfiguredError} from '../src/adapters/adapter-contract.js';
import {loadListAppearance,loadListAppearances,saveListAppearance} from '../src/list-appearance-store.js';

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

test('per-list appearance overrides use a separate bounded allowlisted key',()=>{
  const workspace='{"synthetic":"workspace-raw-sentinel"}',appearance='{"synthetic":"appearance-raw-sentinel"}',storage=memoryStorage({'flowboard-workspace':workspace,'flowboard-appearance':appearance}),one={workspaceId:'space-a',boardId:'board-a',listId:'list-a'},sameIdsOtherSpace={...one,workspaceId:'space-b'},other={workspaceId:'space-a',boardId:'board-a',listId:'list-b'};
  assert.equal(loadListAppearance(one,storage),null);assert.equal(storage.getItem('flowboard-list-appearances'),null);
  assert.equal(saveListAppearance(one,{color:'blush-clay',finish:'gradient'},storage).ok,true);assert.deepEqual(loadListAppearance(one,storage),{...one,color:'blush-clay',finish:'gradient'});
  assert.equal(saveListAppearance(sameIdsOtherSpace,{color:'pale-aqua',finish:'solid'},storage).ok,true);assert.equal(saveListAppearance(other,{color:'mist-slate',finish:'solid'},storage).ok,true);
  assert.equal(saveListAppearance(one,{color:'url(javascript:alert(1))',finish:'gradient'},storage).ok,false);assert.equal(saveListAppearance({...one,listId:'unsafe/list'},{color:'standard',finish:'solid'},storage).ok,false);
  assert.equal(saveListAppearance(one,null,storage).ok,true);assert.equal(loadListAppearance(one,storage),null);assert.deepEqual(loadListAppearance(sameIdsOtherSpace,storage),{...sameIdsOtherSpace,color:'pale-aqua',finish:'solid'});assert.deepEqual(loadListAppearance(other,storage),{...other,color:'mist-slate',finish:'solid'});
  assert.equal(storage.getItem('flowboard-workspace'),workspace);assert.equal(storage.getItem('flowboard-appearance'),appearance);
});

test('malformed or over-limit list appearance storage is read-only and save failure is reported',()=>{
  const malformed='{"version":2,"overrides":[]}',storage=memoryStorage({'flowboard-list-appearances':malformed}),scope={workspaceId:'space',boardId:'board',listId:'list'};
  assert.deepEqual(loadListAppearances(storage),[]);assert.equal(saveListAppearance(scope,{color:'soft-sage',finish:'solid'},storage).ok,false);assert.equal(storage.getItem('flowboard-list-appearances'),malformed);
  const overCount=JSON.stringify({version:1,overrides:Array.from({length:501},(_,index)=>({workspaceId:'space',boardId:'board',listId:`list-${index}`,color:'standard',finish:'solid'}))}),many=memoryStorage({'flowboard-list-appearances':overCount});assert.deepEqual(loadListAppearances(many),[]);assert.equal(saveListAppearance(scope,{color:'soft-sage',finish:'solid'},many).ok,false);assert.equal(many.getItem('flowboard-list-appearances'),overCount);
  const oversized='x'.repeat(200001),large=memoryStorage({'flowboard-list-appearances':oversized});assert.deepEqual(loadListAppearances(large),[]);assert.equal(saveListAppearance(scope,{color:'soft-sage',finish:'solid'},large).ok,false);assert.equal(large.getItem('flowboard-list-appearances'),oversized);
  const blocked={getItem:()=>null,setItem:()=>{throw new Error('storage unavailable');},removeItem(){}};assert.equal(saveListAppearance(scope,{color:'soft-sage',finish:'solid'},blocked).ok,false);
});

test('LocalWorkspaceAdapter does not impersonate cloud functionality',async()=>{
  const adapter=makeAdapter(memoryStorage());assert.equal(adapter.getSession(),null);await assert.rejects(adapter.signInWithGoogle(),CloudNotConfiguredError);await assert.rejects(adapter.listWorkspaces(),CloudNotConfiguredError);
});
