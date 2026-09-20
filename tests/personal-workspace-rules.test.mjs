import test, {after, before} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {assertFails, assertSucceeds, initializeTestEnvironment} from '@firebase/rules-unit-testing';
import {arrayUnion, collection, deleteField, doc, getDoc, getDocs, query, runTransaction, serverTimestamp, setDoc, Timestamp, updateDoc, where} from 'firebase/firestore';

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

test('verified mixed-case token email can bootstrap with a normalized profile email',async()=>{
  const uid='personal-mixed-case',db=env.authenticatedContext(uid,{email:'Personal-Mixed-Case@Example.com',email_verified:true}).firestore();
  const result=await ensurePersonal(db,uid,'mixed-case-personal');
  assert.equal(result.state,'created');
  assert.equal((await getDoc(doc(db,'users',uid))).data().emailLower,'personal-mixed-case@example.com');
  await assertFails(updateDoc(doc(db,'users',uid),{emailLower:'another@example.com'}));
});

test('existing lowercase profile remains usable when provider token email casing differs',async()=>{
  const uid='personal-legacy-case';
  await env.withSecurityRulesDisabled(async context=>setDoc(doc(context.firestore(),'users',uid),{uid,emailLower:`${uid}@example.com`,workspaceIds:['retained-hint']}));
  const db=env.authenticatedContext(uid,{email:'Personal-Legacy-Case@Example.com',email_verified:true}).firestore();
  const result=await ensurePersonal(db,uid,'legacy-case-personal');
  assert.equal(result.state,'created');
  assert.deepEqual((await getDoc(doc(db,'users',uid))).data().workspaceIds,['retained-hint','legacy-case-personal']);
});

test('legacy profile metadata remains inert while personal bootstrap adds a canonical home',async()=>{
  const uid='personal-legacy-metadata',updatedAt=Timestamp.fromMillis(1);
  await env.withSecurityRulesDisabled(async context=>setDoc(doc(context.firestore(),'users',uid),{uid,emailLower:`${uid}@example.com`,workspaceIds:['retained-hint'],displayName:'Legacy profile name',updatedAt}));
  const db=dbFor(uid),result=await ensurePersonal(db,uid,'legacy-metadata-personal'),profile=await getDoc(doc(db,'users',uid));
  assert.equal(result.state,'created');
  assert.equal(profile.data().personalWorkspaceId,'legacy-metadata-personal');
  assert.deepEqual(profile.data().workspaceIds,['retained-hint','legacy-metadata-personal']);
  assert.equal(profile.data().displayName,'Legacy profile name');
  assert.equal(profile.data().updatedAt.toMillis(),updatedAt.toMillis());
  await assertFails(updateDoc(doc(db,'users',uid),{displayName:'Changed legacy name'}));
});

test('new profiles cannot introduce retired profile metadata',async()=>{
  const uid='personal-retired-metadata',db=dbFor(uid);
  await assertFails(setDoc(doc(db,'users',uid),{uid,emailLower:`${uid}@example.com`,workspaceIds:[],displayName:'New legacy field'}));
});

test('explicit recovery replaces an invalid canonical pointer and retains its hint',async()=>{
  const uid='personal-recovery',prior='legacy-personal-looking-scope',candidate='recovered-personal-scope';
  await env.withSecurityRulesDisabled(async context=>{
    const db=context.firestore(),root=doc(db,'workspaces',prior);
    await setDoc(doc(db,'users',uid),{uid,emailLower:`${uid}@example.com`,workspaceIds:[prior],personalWorkspaceId:prior});
    await setDoc(root,{name:'Legacy scope',ownerUid:uid,schemaVersion:5,status:'ready',personal:false,lifecycleRevision:0,activeBoardId:'',migration:{version:1,state:'verified',counts:{boards:0,lists:0,cards:0}},updatedAt:serverTimestamp()});
    await setDoc(doc(root,'members',uid),{uid,role:'owner',emailLower:`${uid}@example.com`});
  });
  const db=dbFor(uid);
  await runTransaction(db,async transaction=>{
    const profile=await transaction.get(doc(db,'users',uid));
    await Promise.all([transaction.get(doc(db,'workspaces',prior)),transaction.get(doc(db,'workspaces',prior,'members',uid))]);
    const root=doc(db,'workspaces',candidate);
    transaction.set(root,{name:'My workspace',ownerUid:uid,schemaVersion:5,status:'ready',personal:true,lifecycleRevision:0,activeBoardId:'',migration:{version:1,state:'verified',counts:{boards:0,lists:0,cards:0}},createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
    transaction.set(doc(root,'members',uid),{uid,role:'owner',emailLower:`${uid}@example.com`});
    transaction.set(doc(db,'users',uid),{uid,emailLower:`${uid}@example.com`,workspaceIds:arrayUnion(prior,candidate),personalWorkspaceId:candidate},{merge:true});
    assert.equal(profile.data().personalWorkspaceId,prior);
  });
  const profile=await getDoc(doc(db,'users',uid));
  assert.equal(profile.data().personalWorkspaceId,candidate);
  assert.deepEqual(profile.data().workspaceIds,[prior,candidate]);
  await assertSucceeds(getDoc(doc(db,'workspaces',candidate)));
});

test('unverified accounts cannot bootstrap a personal workspace',async()=>{
  await assert.rejects(ensurePersonal(dbFor('personal-unverified',false),'personal-unverified','unverified-workspace'));
});
