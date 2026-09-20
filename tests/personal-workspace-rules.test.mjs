import test, {after, before} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {assertFails, assertSucceeds, initializeTestEnvironment} from '@firebase/rules-unit-testing';
import {arrayUnion, collection, deleteField, doc, getDoc, getDocs, query, runTransaction, serverTimestamp, setDoc, updateDoc, where} from 'firebase/firestore';

const projectId='demo-flowboard-rules';
let env;
before(async()=>{env=await initializeTestEnvironment({projectId,firestore:{rules:await readFile('firestore.rules','utf8')}});});
after(async()=>env?.cleanup());
const dbFor=(uid,verified=true)=>env.authenticatedContext(uid,{email:`${uid}@example.com`,email_verified:verified}).firestore();

async function ensurePersonal(db,uid,candidate){
  const profileRef=doc(db,'users',uid);
  return runTransaction(db,async transaction=>{
    const profile=await transaction.get(profileRef), data=profile.data()||{}, pointer=typeof data.personalWorkspaceId==='string'?data.personalWorkspaceId:'';
    if(pointer)return{state:'existing',workspaceId:pointer};
    transaction.set(doc(db,'workspaces',candidate),{name:'My workspace',ownerUid:uid,schemaVersion:5,status:'ready',personal:true,lifecycleRevision:0,activeBoardId:'',migration:{version:1,state:'verified',counts:{boards:0,lists:0,cards:0}},createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
    transaction.set(doc(db,'workspaces',candidate,'members',uid),{uid,role:'owner',emailLower:`${uid}@example.com`});
    transaction.set(profileRef,{uid,emailLower:`${uid}@example.com`,workspaceIds:arrayUnion(candidate),personalWorkspaceId:candidate},{merge:true});
    return{state:'created',workspaceId:candidate};
  });
}

test('two concurrent first-login contexts converge on one empty personal workspace',async()=>{
  const uid='personal-race', first=dbFor(uid), second=dbFor(uid);
  const [a,b]=await Promise.all([ensurePersonal(first,uid,'personal-candidate-a'),ensurePersonal(second,uid,'personal-candidate-b')]);
  assert.equal(a.workspaceId,b.workspaceId);
  const profile=await getDoc(doc(first,'users',uid));
  assert.equal(profile.data().personalWorkspaceId,a.workspaceId);
  assert.deepEqual(profile.data().workspaceIds,[a.workspaceId]);
  assert.equal((await getDocs(query(collection(first,'workspaces',a.workspaceId,'boards'),where('lifecycleState','==','active'),where('archived','==',false)))).size,0);
  await env.withSecurityRulesDisabled(async context=>{
    const db=context.firestore();
    const roots=await Promise.all(['personal-candidate-a','personal-candidate-b'].map(id=>getDoc(doc(db,'workspaces',id))));
    assert.equal(roots.filter(item=>item.exists()).length,1);
  });
});

test('personal workspace pointer must reference an atomically created owner scope',async()=>{
  const uid='personal-owner', db=dbFor(uid), result=await ensurePersonal(db,uid,'personal-owned-workspace');
  assert.equal(result.state,'created');
  await assertFails(updateDoc(doc(db,'users',uid),{personalWorkspaceId:'forged-workspace'}));
  await assertFails(updateDoc(doc(db,'users',uid),{personalWorkspaceId:null}));
  await assertFails(updateDoc(doc(db,'users',uid),{personalWorkspaceId:deleteField()}));
  await assertFails(updateDoc(doc(db,'users',uid),{unknownField:true}));
  await assertSucceeds(updateDoc(doc(db,'users',uid),{workspaceIds:['personal-owned-workspace','stale-hint']}));
  assert.equal((await getDoc(doc(db,'users',uid))).data().personalWorkspaceId,'personal-owned-workspace');
  await assertFails(getDoc(doc(dbFor('personal-outsider'),'users',uid)));
});

test('existing workspace hints create a new personal scope without changing the hints',async()=>{
  const uid='personal-selection';
  await env.withSecurityRulesDisabled(async context=>setDoc(doc(context.firestore(),'users',uid),{uid,emailLower:`${uid}@example.com`,workspaceIds:['existing-owner-scope']}));
  const db=dbFor(uid), result=await ensurePersonal(db,uid,'must-not-create');
  assert.equal(result.state,'created');
  assert.equal(result.workspaceId,'must-not-create');
  const profile=await getDoc(doc(db,'users',uid));
  assert.equal(profile.data().personalWorkspaceId,'must-not-create');
  assert.deepEqual(profile.data().workspaceIds,['existing-owner-scope','must-not-create']);
  await assertSucceeds(getDoc(doc(db,'workspaces','must-not-create')));
});

test('verified accounts may create a hints-only profile before personal bootstrap',async()=>{
  const uid='personal-hints-create',db=dbFor(uid);
  await assertSucceeds(setDoc(doc(db,'users',uid),{uid,emailLower:`${uid}@example.com`,workspaceIds:['synthetic-hint']}));
});

test('unverified accounts cannot bootstrap a personal workspace',async()=>{
  await assert.rejects(ensurePersonal(dbFor('personal-unverified',false),'personal-unverified','unverified-workspace'));
});
