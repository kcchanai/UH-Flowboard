const $ = selector => document.querySelector(selector);
const on = (target, type, handler) => target.addEventListener(type, handler);
const el = tag => document.createElement(tag);
const countWorkspace = workspace => {
  const boards = workspace.boards || [];
  const lists = boards.reduce((sum, board) => sum + (board.lists?.length || 0), 0);
  const cards = boards.reduce((sum, board) => sum + (board.lists || []).reduce((n, list) => n + (list.cards?.length || 0), 0), 0);
  return {boards:boards.length, lists, cards, bytes:new TextEncoder().encode(JSON.stringify(workspace)).length};
};
const formatBytes = value => value < 1024 ? `${value} bytes` : `${(value / 1024).toFixed(1)} KB`;
const safeStamp = () => new Date().toISOString().replace(/[:.]/g, '-');

function downloadJson(workspace) {
  const blob = new Blob([JSON.stringify(workspace, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob), link = el('a');
  link.href = url; link.download = `flowboard-before-cloud-${safeStamp()}.json`;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function messageFor(error) {
  if (error?.code === 'permission-denied') return 'Firebase denied the migration. Your local workspace was not changed.';
  if (error?.code === 'unavailable') return 'Firebase is temporarily unavailable. Your local workspace was not changed.';
  if (error?.code === 'EMAIL_NOT_VERIFIED') return error.message;
  if (error?.code === 'BOARD_TOO_LARGE' || error?.code === 'WORKSPACE_TOO_LARGE') return error.message;
  if (error?.code === 'MIGRATION_VERIFICATION_FAILED') return 'The cloud write could not be verified. A partial cloud copy may exist; your local workspace is unchanged.';
  return 'The cloud copy could not be created. Your local workspace was not changed.';
}

export function initializeCloudWorkspaceUI({localAdapter, cloudAdapter}) {
  const accountDialog = $('#account-dialog');
  const open = $('#open-cloud-migration');
  const dialog = $('#cloud-migration-dialog');
  const close = $('#close-cloud-migration');
  const name = $('#cloud-workspace-name');
  const summary = $('#cloud-migration-summary');
  const status = $('#cloud-migration-status');
  const backup = $('#download-migration-backup');
  const create = $('#create-cloud-workspace');
  const workspaceButton = $('#open-cloud-workspaces');
  const workspacesDialog = $('#cloud-workspaces-dialog');
  const closeWorkspaces = $('#close-cloud-workspaces');
  const workspacesList = $('#cloud-workspaces-list');
  const workspacesStatus = $('#cloud-workspaces-status');
  const returnLocal = $('#return-to-local-workspace');
  const migrateCloud = $('#migrate-cloud-workspace');
  const exportCloud = $('#export-cloud-workspace');
  const announcer = $('#announcer');
  let session = null, workspace = null, backupDownloaded = false, completed = false, selectedCloudEntry = null;

  const announce = text => { status.textContent = text; announcer.textContent = ''; requestAnimationFrame(() => { announcer.textContent = text; }); };
  const prepare = () => {
    workspace = localAdapter.exportLocalWorkspace(localAdapter.loadWorkspace().workspace);
    const counts = countWorkspace(workspace);
    summary.replaceChildren(...[
      ['Boards', counts.boards], ['Lists', counts.lists], ['Cards', counts.cards], ['JSON size', formatBytes(counts.bytes)]
    ].flatMap(([label, value]) => {
      const term = el('dt'), detail = el('dd');
      term.textContent = label; detail.textContent = String(value); return [term, detail];
    }));
    backupDownloaded = false; completed = false; create.disabled = true; create.textContent = '2. Create cloud workspace';
    backup.disabled = false; announce('Download a local backup before creating the cloud copy.');
  };

  on(open,'click', () => {
    if(!session)return;
    prepare(); accountDialog.close(); dialog.showModal(); name.focus(); name.select();
  });
  on(close,'click', () => dialog.close());
  on(dialog,'cancel', event => { event.preventDefault(); dialog.close(); });
  on(dialog,'close', () => open.focus());
  on(backup,'click', () => {
    localAdapter.backupWorkspace(workspace); downloadJson(workspace); backupDownloaded = true;
    create.disabled = false; announce('Backup downloaded. Review the summary, then create the separate cloud workspace.');
  });
  on(create,'click', async () => {
    if (!session || !backupDownloaded || completed) return;
    create.disabled = true; backup.disabled = true; name.disabled = true; announce('Creating and verifying the Firebase workspace…');
    try {
      const result = await cloudAdapter.uploadLocalWorkspace({name:name.value, workspace});
      completed = true; create.textContent = 'Cloud copy created';
      announce(`Cloud workspace “${result.name}” created and verified with ${result.boardCount} board${result.boardCount === 1 ? '' : 's'}. This browser is still using the local original.`);
      const cloudStatus = $('#cloud-status');
      cloudStatus.textContent = 'Cloud copy · local';
      cloudStatus.title = 'Cloud workspace created and verified. The browser-local original remains active.';
      cloudStatus.setAttribute('aria-label', cloudStatus.title);
    } catch (error) {
      console.error('Flowboard cloud migration failed.', error); announce(messageFor(error));
      create.disabled = false; backup.disabled = false; name.disabled = false;
    }
  });

  on(workspaceButton,'click', async () => {
    if(!session)return;
    if (accountDialog.open) accountDialog.close(); workspacesDialog.showModal(); workspacesList.replaceChildren();
    workspacesStatus.textContent = 'Loading cloud workspaces…';
    returnLocal.hidden = !['cloud-preview','cloud'].includes(globalThis.FlowboardApp?.getMode().kind);
    exportCloud.hidden = returnLocal.hidden;
    try {
      const entries = await cloudAdapter.listWorkspaces();
      const {createWorkspaceLifecycleControls} = await import('./workspace-lifecycle-ui.js');
      if (!entries.length) {
        if (globalThis.FlowboardApp?.getMode().kind === 'cloud-preview') globalThis.FlowboardApp.returnToLocal();
        returnLocal.hidden = true; exportCloud.hidden = true;
        workspacesStatus.textContent = 'No cloud workspaces are available to this account yet.';
        return;
      }
      workspacesStatus.textContent = 'Choose a verified workspace to open. Owners and editors can explicitly enter cloud edit mode.';
      entries.forEach(entry=>{
        const row=el('div'),button=el('button'),summary=el('div');
        row.className='workspace-entry';Object.assign(button,{type:'button',className:'button button-quiet',textContent:'Open'});summary.className='workspace-board';
        const title=el('strong'),detail=el('span');
        title.textContent=entry.name||'Untitled cloud workspace';button.setAttribute('aria-label',`Open ${title.textContent}`);
        const archived=entry.status==='archived',editable=!archived&&['owner','editor'].includes(entry.role)&&entry.migration?.state==='verified';
        detail.textContent=archived?'Cloud workspace · archived · retained':editable?`Cloud workspace · ${entry.role} · editable`:'Cloud workspace · read-only preview';
        button.hidden=archived;summary.append(title,detail);
        on(button,'click',async()=>{
          button.disabled = true; workspacesStatus.textContent = editable ? 'Opening editable cloud workspace…' : 'Opening read-only cloud preview…';
          try {
            const cloudWorkspace = await cloudAdapter.fetchWorkspace(entry.id);
            if (editable) globalThis.FlowboardApp.openCloudWorkspace(cloudWorkspace, entry);
            else globalThis.FlowboardApp.openCloudPreview(cloudWorkspace, entry);
            selectedCloudEntry = entry; window.dispatchEvent(new CustomEvent('flowboard:cloud-selection', {detail:entry})); returnLocal.hidden = false; exportCloud.hidden = editable;
            migrateCloud.hidden = entry.ownerUid !== session.uid || entry.migration?.state === 'verified';
            workspacesStatus.textContent = editable ? `Editing “${entry.name || 'Untitled cloud workspace'}” in cloud mode. Local data is unchanged.` : `Viewing “${entry.name || 'Untitled cloud workspace'}” as a read-only preview. Local data is unchanged.`;
          } catch (error) {
            console.error('Flowboard could not open cloud workspace preview.', error);
            if (entry.ownerUid === session.uid && entry.status === 'migrating') {
              selectedCloudEntry = entry; migrateCloud.hidden = false;
              workspacesStatus.textContent = 'This migration was interrupted. Retry the verified cloud-format migration; your local workspace is unchanged.';
            } else workspacesStatus.textContent = 'This cloud workspace could not be opened. Your local workspace is unchanged.';
          } finally { button.disabled = false; }
        });
        const actions = createWorkspaceLifecycleControls({entry, session, cloudAdapter, openButton:button, title, detail, lifecycleStatus:workspacesStatus, onArchived:archivedEntry => {
          if (selectedCloudEntry?.id !== archivedEntry.id) return;
          globalThis.FlowboardApp.returnToLocal(); selectedCloudEntry = null; window.dispatchEvent(new CustomEvent('flowboard:cloud-selection')); returnLocal.hidden = true; exportCloud.hidden = true;
        }}); row.append(summary, actions);
        workspacesList.append(row);
      });
    } catch (error) {
      console.error('Flowboard could not list cloud workspaces.', error);
      workspacesStatus.textContent = 'Cloud workspaces could not be loaded. Your local workspace is unchanged.';
    }
  });
  on(closeWorkspaces,'click', () => workspacesDialog.close());
  on(workspacesDialog,'cancel', event => { event.preventDefault(); workspacesDialog.close(); });
  on(workspacesDialog,'close', () => workspaceButton.focus());
  on(returnLocal,'click', () => {
    globalThis.FlowboardApp.returnToLocal(); selectedCloudEntry = null; window.dispatchEvent(new CustomEvent('flowboard:cloud-selection')); returnLocal.hidden = true; exportCloud.hidden = true;
    workspacesStatus.textContent = 'Returned to the browser-local workspace.';
  });
  on(migrateCloud,'click', async () => {
    if (!selectedCloudEntry || selectedCloudEntry.ownerUid !== session?.uid) return;
    migrateCloud.disabled = true; workspacesStatus.textContent = 'Migrating and verifying granular cloud documents. Legacy snapshots are preserved.';
    try {
      const result = await cloudAdapter.migrateWorkspaceToGranular(selectedCloudEntry.id);
      const cloudWorkspace = await cloudAdapter.fetchWorkspace(selectedCloudEntry.id);
      globalThis.FlowboardApp.openCloudPreview(cloudWorkspace, selectedCloudEntry);
      migrateCloud.hidden = true;
      workspacesStatus.textContent = result.alreadyMigrated ? 'This workspace was already verified in the granular cloud format.' : `Granular migration verified: ${result.boards} boards, ${result.lists} lists, and ${result.cards} cards. Legacy snapshots remain available.`;
      workspacesDialog.close(); workspaceButton.click();
    } catch (error) { console.error('Flowboard granular migration failed.', error); workspacesStatus.textContent = 'Granular migration could not be verified. Legacy cloud snapshots remain available.'; }
    finally { migrateCloud.disabled = false; }
  });
  on(exportCloud,'click', () => {
    try { globalThis.FlowboardApp.exportCloudPreview(); workspacesStatus.textContent = 'Cloud preview JSON export downloaded.'; }
    catch (error) { workspacesStatus.textContent = 'Open a cloud preview before exporting it.'; }
  });

  window.addEventListener('flowboard:cloud-preview-change', () => {
    const mode = globalThis.FlowboardApp?.getMode().kind, cloudMode = ['cloud-preview','cloud'].includes(mode);
    returnLocal.hidden = !cloudMode; exportCloud.hidden = !cloudMode; migrateCloud.hidden = true;
    if (!cloudMode) { selectedCloudEntry = null; window.dispatchEvent(new CustomEvent('flowboard:cloud-selection')); }
    if (!cloudMode && workspacesDialog.open) { workspacesList.replaceChildren(); workspacesStatus.textContent = 'Workspace access ended. Your browser-local workspace is active.'; }
  });

  return {
    setSession(next) {
      session = next;
      if (!session && dialog.open) dialog.close();
      open.hidden = !session;
    }
  };
}
