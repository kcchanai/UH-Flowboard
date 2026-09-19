import {granularizeBoard} from '../granular-workspace.js';
import {collection,deleteField,doc,getDocFromServer,getDocsFromServer,getFirestore,limit,orderBy,query,runTransaction,serverTimestamp,startAfter,updateDoc,where,writeBatch} from 'firebase/firestore';

const fail=(message,code)=>Object.assign(new Error(message),{code});
const at=async(name,work)=>{try{return await work();}catch(error){error.flowboardStage||=name;throw error;}};
const userFor=auth=>{if(!auth.currentUser)throw fail('Sign in before migrating data.','AUTH_REQUIRED');return auth.currentUser;};
const id=value=>typeof value==='string'&&value.length>0&&value.length<=500&&!value.includes('/');
const randomId=()=>{const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');};
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&Object.getPrototypeOf(value)===Object.prototype?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
const hash=async value=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(canonical(value)))))].map(value=>value.toString(16).padStart(2,'0')).join('');
const groups=(values,size=4)=>Array.from({length:Math.ceil(values.length/size)},(_,index)=>values.slice(index*size,(index+1)*size));
const same=(actual,expected)=>Object.entries(expected).every(([key,value])=>JSON.stringify(canonical(actual[key]))===JSON.stringify(canonical(value)));
const countsEqual=(a,b)=>a?.boards===b.boards&&a?.lists===b.lists&&a?.cards===b.cards;

function clean(data){
  const value=JSON.parse(JSON.stringify(data));
  if(value.updatedAt)value.legacyUpdatedAt=value.updatedAt;
  for(const key of ['revision','clientMutationId','updatedAt','activeDeletionJobId','importOperationId','migrationOperationId','lastMigrationOperationId','snapshot','granularVersion'])delete value[key];
  return value;
}
function importedBoard(input,rank,operationId){
  const source=JSON.parse(JSON.stringify(input)),sourceId=String(source.id||'');
  source.id=`import-${operationId.slice(7,23)}-${rank}`;delete source.collaboration;
  for(const list of source.lists||[])for(const card of list.cards||[]){
    card.legacyAssignees=[...new Set([...(card.legacyAssignees||[]),...(card.assignees||[])].map(String).filter(Boolean))].slice(0,8);card.assignees=[];card.assigneeUids=[];
    card.activity=(card.activity||[]).map(item=>({...item,source:'browser-legacy'}));
  }
  const granular=granularizeBoard(source,rank);
  granular.board={...clean(granular.board),lifecycleState:'importing',legacySourceId:sourceId.slice(0,500),importProvenance:'browser-legacy'};
  granular.lists=granular.lists.map(item=>({...clean(item),lifecycleState:'active'}));
  granular.cards=granular.cards.map(item=>({...clean(item),lifecycleState:'active',importProvenance:'browser-legacy'}));
  return granular;
}
function prepareImport(workspace,operationId){
  if(!workspace||!Array.isArray(workspace.boards)||!workspace.boards.length)throw fail('The legacy workspace must contain at least one board.','INVALID_WORKSPACE');
  if(workspace.boards.length>4)throw fail('This safe browser import supports up to 4 boards at a time. Export and split larger legacy workspaces before importing.','WORKSPACE_TOO_LARGE');
  let lists=0,cards=0;
  const boards=workspace.boards.map((board,rank)=>{if(!board||!Array.isArray(board.lists))throw fail('A legacy board has an unsupported structure.','INVALID_WORKSPACE');const result=importedBoard(board,rank,operationId);lists+=result.lists.length;cards+=result.cards.length;return result;});
  if(lists>1000||cards>10000)throw fail('The legacy workspace is too large for the safe import limits.','WORKSPACE_TOO_LARGE');
  return{boards,counts:{boards:boards.length,lists,cards}};
}
const importDocs=prepared=>prepared.boards.flatMap(({board,lists,cards})=>[{path:['boards',board.id],data:board},...lists.map(data=>({path:['boards',board.id,'lists',data.id],data})),...cards.map(data=>({path:['boards',board.id,'cards',data.id],data}))]);
const reference=(root,item)=>doc(root,...item.path);
async function verifyDocuments(root,documents,marker,operationId){
  for(const group of groups(documents)){
    const snapshots=await Promise.all(group.map(item=>getDocFromServer(reference(root,item))));
    snapshots.forEach((snapshot,index)=>{const expected=group[index];if(!snapshot.exists()||snapshot.data()[marker]!==operationId||!same(snapshot.data(),expected.data))throw fail('Cloud content did not match the verified migration plan.','MIGRATION_VERIFICATION_FAILED');});
  }
}
async function writeDocuments(db,root,documents,marker,operationId,adopt=false){
  for(const group of groups(documents)){
    const reads=await Promise.allSettled(group.map(item=>getDocFromServer(reference(root,item)))),batch=writeBatch(db);let writes=0;
    group.forEach((item,index)=>{const result=reads[index];if(result.status==='rejected'&&!String(result.reason?.code||'').endsWith('permission-denied'))throw result.reason;const current=result.status==='fulfilled'?result.value:null,prior=current?.data()||{},exists=Boolean(current?.exists()),foreign=exists&&prior[marker]!==operationId;if(foreign&&!(adopt&&prior[marker]===undefined&&same(prior,item.data)))throw fail('A migration target already belongs to different data.','IMPORT_TARGET_CONFLICT');if(exists&&same(prior,item.data)&&prior[marker]===operationId)return;const revision=exists?(same(prior,item.data)?prior.revision||0:(Number.isInteger(prior.revision)?prior.revision+1:0)):0;batch.set(reference(root,item),{...item.data,[marker]:operationId,revision,clientMutationId:operationId,updatedAt:serverTimestamp()});writes+=1;});
    if(writes)await batch.commit();
  }
  await verifyDocuments(root,documents,marker,operationId);
}

export async function importLegacyWorkspace(app,auth,{workspaceId,workspace}){
  const user=userFor(auth);if(!id(workspaceId))throw fail('The legacy import destination is invalid.','INVALID_IMPORT');
  const identity=prepareImport(workspace,'legacy-identity-0000000000000000'),sourceDigest=await hash(importDocs(identity).map(item=>item.data)),operationId=`legacy-${await hash([user.uid,workspaceId,sourceDigest])}`,prepared=prepareImport(workspace,operationId),targetBoardIds=prepared.boards.map(item=>item.board.id),documents=importDocs(prepared),db=getFirestore(app),root=doc(db,'workspaces',workspaceId),record=doc(root,'imports',operationId);
  const initial=await at('receipt',()=>runTransaction(db,async transaction=>{
    const [scope,current]=await Promise.all([transaction.get(root),transaction.get(record)]),metadata=scope.data()||{};
    if(!scope.exists()||metadata.ownerUid!==user.uid||metadata.personal!==true||metadata.status!=='ready')throw fail('Legacy data can only be imported into your active personal workspace.','OWNER_REQUIRED');
    if(current.exists()){const data=current.data();if(data.createdByUid!==user.uid||data.sourceDigest!==sourceDigest||!countsEqual(data.sourceCounts,prepared.counts)||JSON.stringify(data.targetBoardIds)!==JSON.stringify(targetBoardIds))throw fail('This import identifier belongs to different legacy data.','IMPORT_IDENTIFIER_CONFLICT');return data.state;}
    transaction.set(record,{schemaVersion:1,operationId,sourceDigest,sourceCounts:prepared.counts,targetBoardIds,createdByUid:user.uid,state:'importing',createdAt:serverTimestamp(),updatedAt:serverTimestamp(),revision:0});return'importing';
  }));
  const finalized=documents.map(item=>item.path.length===2?{...item,data:{...item.data,lifecycleState:'active'}}:item);
  if(initial==='verified')await at('verified-retry',()=>verifyDocuments(root,finalized,'importOperationId',operationId));
  else{await at('content-write',()=>writeDocuments(db,root,documents,'importOperationId',operationId));await at('finalize',()=>runTransaction(db,async transaction=>{
    const [current,...boards]=await Promise.all([transaction.get(record),...targetBoardIds.map(boardId=>transaction.get(doc(root,'boards',boardId)))]),data=current.data()||{};
    if(!current.exists()||data.sourceDigest!==sourceDigest||!['importing','verified'].includes(data.state))throw fail('The import checkpoint changed unexpectedly.','IMPORT_IDENTIFIER_CONFLICT');
    if(data.state==='verified')return;
    boards.forEach(board=>{if(!board.exists()||board.data().importOperationId!==operationId||board.data().lifecycleState!=='importing')throw fail('An imported board could not be finalized.','MIGRATION_VERIFICATION_FAILED');transaction.update(board.ref,{lifecycleState:'active',revision:(board.data().revision||0)+1,clientMutationId:operationId,updatedAt:serverTimestamp()});});
    transaction.update(record,{state:'verified',updatedAt:serverTimestamp(),revision:(data.revision||0)+1});
  }));}
  await at('final-readback',()=>verifyDocuments(root,finalized,'importOperationId',operationId));
  const receipt=await getDocFromServer(record);if(!receipt.exists()||receipt.data().state!=='verified')throw fail('The import receipt could not be verified.','MIGRATION_VERIFICATION_FAILED');
  return{alreadyImported:initial==='verified',operationId,...prepared.counts,targetBoardIds,sourceDigest};
}

async function commentsFor(db,workspaceId,boardId,cardId){
  const source=collection(db,'workspaces',workspaceId,'boards',boardId,'cards',cardId,'comments'),items=[];let cursor;
  do{const constraints=[orderBy('createdAt','desc')];if(cursor)constraints.push(startAfter(cursor));constraints.push(limit(25));const page=await getDocsFromServer(query(source,...constraints));items.push(...page.docs.map(item=>({id:item.id,...item.data()})));cursor=page.size===25?page.docs.at(-1):null;}while(cursor);
  return items;
}
export async function exportCloudBackup(app,auth,workspaceId){
  userFor(auth);const db=getFirestore(app),root=doc(db,'workspaces',workspaceId),scope=await getDocFromServer(root);if(!scope.exists())throw fail('The cloud workspace was not found.','WORKSPACE_NOT_FOUND');
  const boards=await getDocsFromServer(query(collection(root,'boards'),where('lifecycleState','==','active'))),records=[];
  for(const board of boards.docs){const lists=await getDocsFromServer(query(collection(board.ref,'lists'),where('lifecycleState','==','active'))),cards=[];for(const list of lists.docs){const page=await getDocsFromServer(query(collection(board.ref,'cards'),where('listId','==',list.id),where('lifecycleState','==','active')));for(const card of page.docs)cards.push({id:card.id,...card.data(),comments:await commentsFor(db,workspaceId,board.id,card.id)});}records.push({board:{id:board.id,...board.data()},lists:lists.docs.map(item=>({id:item.id,...item.data()})),cards});}
  const metadata=scope.data();return{format:'flowboard-cloud-backup',version:1,createdAt:new Date().toISOString(),workspace:{name:metadata.name||'My workspace',schemaVersion:metadata.schemaVersion||5,activeBoardId:metadata.activeBoardId||'',status:metadata.status||'ready',migration:metadata.migration||null},records,excluded:['members','invitations','workspace-activity','lifecycle-control']};
}

function migrationDocuments(plan,operationId){return[...plan.lists.map(data=>({refPath:['boards',plan.board.id,'lists',data.id],data:{...clean(data),lifecycleState:'active'}})),...plan.cards.map(data=>({refPath:['boards',plan.board.id,'cards',data.id],data:{...clean(data),lifecycleState:'active',assigneeUids:Array.isArray(data.assigneeUids)?data.assigneeUids:[]}}))].map(item=>({path:item.refPath,data:item.data,operationId}));}
async function scanWorkspace(db,root){
  const boardPage=await getDocsFromServer(query(collection(root,'boards'),where('lifecycleState','==','active'))),plans=[],counts={boards:boardPage.size,lists:0,cards:0};
  for(const board of boardPage.docs){if(board.data().snapshot){const granular=granularizeBoard(board.data().snapshot,board.data().rank??plans.length);plans.push({source:board,...granular});counts.lists+=granular.lists.length;counts.cards+=granular.cards.length;}else{const lists=await getDocsFromServer(query(collection(board.ref,'lists'),where('lifecycleState','==','active')));counts.lists+=lists.size;for(const list of lists.docs)counts.cards+=(await getDocsFromServer(query(collection(board.ref,'cards'),where('listId','==',list.id),where('lifecycleState','==','active')))).size;}}
  if(counts.boards>100||counts.lists>1000||counts.cards>10000)throw fail('This workspace is too large for the safe granular upgrade.','WORKSPACE_TOO_LARGE');return{plans,counts,boards:boardPage.docs};
}
export async function migrateWorkspaceToGranular(app,auth,workspaceId){
  const user=userFor(auth),db=getFirestore(app),root=doc(db,'workspaces',workspaceId),first=await getDocFromServer(root);if(!first.exists()||first.data().ownerUid!==user.uid)throw fail('Only the workspace owner can upgrade this cloud workspace.','OWNER_REQUIRED');if(first.data().status==='archived')throw fail('Restore this retained workspace before upgrading it.','MIGRATION_UNAVAILABLE');if(!['ready','migrating'].includes(first.data().status))throw fail('This workspace cannot be upgraded in its current state.','MIGRATION_UNAVAILABLE');
  if(first.data().status==='ready'&&first.data().migration?.state==='verified'){const current=await scanWorkspace(db,root);if(!current.plans.length)return{alreadyMigrated:true,...current.counts,operationId:first.data().migration.operationId||''};}
  const candidate=randomId(),operationId=await runTransaction(db,async transaction=>{const current=await transaction.get(root),data=current.data();if(data.ownerUid!==user.uid||!['ready','migrating'].includes(data.status))throw fail('The migration state changed.','MIGRATION_UNAVAILABLE');if(data.status==='migrating'){if(data.migration?.version!==2||!id(data.migration.operationId))throw fail('The interrupted migration cannot be resumed safely.','MIGRATION_UNAVAILABLE');return data.migration.operationId;}transaction.update(root,{status:'migrating',migration:{version:2,state:'migrating',operationId:candidate,counts:{boards:0,lists:0,cards:0},startedAt:serverTimestamp()},updatedAt:serverTimestamp()});return candidate;});
  const locked=await getDocFromServer(root);if(!locked.exists()||locked.data().status!=='migrating'||locked.data().migration?.operationId!==operationId)throw fail('The migration lock could not be verified.','MIGRATION_VERIFICATION_FAILED');
  const scan=await scanWorkspace(db,root);await updateDoc(root,{migration:{version:2,state:'migrating',operationId,counts:scan.counts,startedAt:locked.data().migration.startedAt},updatedAt:serverTimestamp()});
  for(const plan of scan.plans){const documents=migrationDocuments(plan,operationId);await writeDocuments(db,root,documents,'migrationOperationId',operationId,true);const board=await getDocFromServer(plan.source.ref);if(!board.exists()||!board.data().snapshot)continue;await updateDoc(plan.source.ref,{snapshot:deleteField(),granularVersion:1,lastMigrationOperationId:operationId,revision:(board.data().revision??-1)+1,clientMutationId:operationId,updatedAt:serverTimestamp()});const scrubbed=await getDocFromServer(plan.source.ref);if(!scrubbed.exists()||scrubbed.data().snapshot!==undefined)throw fail('The verified legacy snapshot could not be scrubbed.','MIGRATION_VERIFICATION_FAILED');}
  const finalScan=await scanWorkspace(db,root);if(finalScan.plans.length||!countsEqual(finalScan.counts,scan.counts))throw fail('The granular cloud counts could not be verified.','MIGRATION_VERIFICATION_FAILED');
  await updateDoc(root,{status:'ready',migration:{version:2,state:'verified',operationId,counts:finalScan.counts,verifiedAt:serverTimestamp()},updatedAt:serverTimestamp()});const verified=await getDocFromServer(root);if(!verified.exists()||verified.data().status!=='ready'||verified.data().migration?.state!=='verified')throw fail('The cloud upgrade completion could not be verified.','MIGRATION_VERIFICATION_FAILED');
  return{alreadyMigrated:!scan.plans.length,...finalScan.counts,operationId};
}
