import {initializeCloudWorkspaceUI} from '../../src/cloud-workspace-ui.js';
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const space={id:'scope-a',name:'Same scope',ownerUid:'owner',role:'owner',status:'ready',migration:{state:'verified'},boards:[{id:'board-a',title:'Board A',rank:0,archived:false},{id:'board-b',title:'Board B',rank:1,archived:false}],hasMore:false};
let calls=0,active='';
globalThis.FlowboardApp={getMode:()=>({kind:'cloud',id:'scope-a',role:'owner'}),getActiveBoardId:()=>active,openCloudWorkspace:()=>{},openCloudPreview:()=>{},selectBoard:id=>{active=id;},createBoard:()=>false};
const adapter={listBoardDirectory:async()=>[space],fetchWorkspace:async()=>{calls+=1;await wait(calls===1?120:10);return{id:'scope-a',boards:[{id:'board-a',lists:[]},{id:'board-b',lists:[]}]};},exportCloudBackup:async()=>({}),migrateWorkspaceToGranular:async()=>({}),renameWorkspace:async()=>{},archiveWorkspace:async()=>{},restoreWorkspace:async()=>{}};
const controller=initializeCloudWorkspaceUI({localAdapter:{inspectLegacyWorkspace:()=>({status:'none',counts:{boards:0}})},cloudAdapter:adapter});
controller.setSession({uid:'owner'});
globalThis.__directoryRace={ready:true,active:()=>active};
