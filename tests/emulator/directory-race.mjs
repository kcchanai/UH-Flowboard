import {initializeCloudWorkspaceUI} from '../../src/cloud-workspace-ui.js';
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const makeSpace=(id,role,boards)=>({id,name:'Same scope',ownerUid:'owner',role,status:'ready',migration:{state:'verified'},boards,hasMore:false});
const makeBoard=(id,title,rank,archived=false)=>({id,title,rank,archived,lists:[]});
const space=makeSpace('scope-a','owner',[makeBoard('board-a','Board A',0),makeBoard('board-b','Board B',1)]);
space.personal=true;
const shared=makeSpace('scope-b','editor',[makeBoard('board-shared','board b',0),makeBoard('board-unique','Only Shared',1)]);
const editor=makeSpace('scope-c','editor',[makeBoard('board-editor','Editable Shared',0)]);
const directory=[space,shared,editor];
let calls=0,active='',mode='cloud',scope='scope-a',role='owner',failure='',fetchOptions;
globalThis.FlowboardApp={getMode:()=>({kind:mode,id:scope,role,personalWorkspaceId:'scope-a'}),getActiveBoardId:()=>active,openCloudWorkspace:(_,metadata)=>{mode='cloud';scope=metadata.id;role=metadata.role;},openCloudPreview:(_,metadata)=>{mode='cloud-preview';scope=metadata.id;role=metadata.role;},selectBoard:id=>{active=id;},createBoard:()=>false};
const adapter={
  listBoardDirectory:async()=>directory,
  verifyWorkspaceAccess:async id=>{if(failure==='revoked')throw Error('Access removed');return id==='scope-b'?'viewer':id==='scope-c'?'editor':'owner';},
  fetchWorkspace:async(id,options)=>{
    fetchOptions=options;calls++;await wait(calls===1?120:10);
    if(failure==='offline')throw Error('Offline');
    const entry=directory.find(item=>item.id===id);
    return {...entry,boards:entry.boards.filter(board=>failure!=='stale'||board.id!=='board-unique').map(board=>failure==='renamed'&&board.id==='board-unique'?{...board,title:'Renamed'}:board)};
  }
};
const controller=initializeCloudWorkspaceUI({localAdapter:{inspectLegacyWorkspace:()=>({status:'none',counts:{boards:0}})},cloudAdapter:adapter});
controller.setSession({uid:'owner'});
globalThis.__directoryRace={ready:true,active:()=>active,summary:()=>({active,mode,scope,role,fetchOptions}),fail:kind=>{failure=kind;}};
