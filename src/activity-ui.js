const actions = Object.freeze({
  'board-created':'created a board', 'board-updated':'updated a board',
  'card-created':'created a card', 'card-updated':'updated a card', 'card-moved':'moved a card', 'card-assigned':'updated card assignments', 'comment-created':'commented on a card', 'comment-updated':'edited a card comment', 'comment-deleted':'removed a card comment',
  'list-created':'created a list', 'list-updated':'updated a list', 'workspace-updated':'updated shared board access'
});

const formatTime = value => {
  const date = value?.toDate?.();
  return date instanceof Date && !Number.isNaN(date.valueOf()) ? date.toLocaleString() : 'Time unavailable';
};

export function initializeActivityUI(cloudAdapter) {
  const open = document.querySelector('#view-cloud-activity');
  const dialog = document.querySelector('#cloud-activity-dialog');
  const close = document.querySelector('#close-cloud-activity');
  const status = document.querySelector('#cloud-activity-status');
  const list = document.querySelector('#cloud-activity-list');
  const more = document.querySelector('#load-more-cloud-activity');
  let session = null, workspace = null, cursor = null, loading = false, generation = 0;

  const load = async reset => {
    if (!session || !workspace || loading) return;
    const token = ++generation, targetWorkspace = workspace, targetSession = session;
    loading = true; more.disabled = true; status.textContent = reset ? 'Loading authenticated activity…' : 'Loading more activity…';
    if (reset) { cursor = null; list.replaceChildren(); }
    try {
      const page = await cloudAdapter.listActivity(targetWorkspace.id, {cursor, pageSize:25});
      if (token !== generation || workspace !== targetWorkspace || session !== targetSession || !dialog.open) return;
      page.entries.forEach(entry => {
        const item = document.createElement('li'), text = document.createElement('span'), time = document.createElement('time');
        text.textContent = `${entry.actorUid === targetSession.uid ? 'You' : 'Another board member'} ${actions[entry.action] || 'updated shared board access'}.`;
        time.textContent = formatTime(entry.createdAt); time.dateTime = entry.createdAt?.toDate?.().toISOString?.() || '';
        item.append(text, time); list.append(item);
      });
      cursor = page.cursor;
      more.hidden = !page.hasMore;
      status.textContent = list.children.length ? `Showing ${list.children.length} authenticated event${list.children.length === 1 ? '' : 's'}, newest first.` : 'No activity yet.';
    } catch (error) {
      if (token !== generation || workspace !== targetWorkspace || session !== targetSession || !dialog.open) return;
      console.error('Activity load failed.', error);
      status.textContent = error?.code === 'permission-denied' ? 'Activity is unavailable.' : 'Activity could not load.';
      more.hidden = true;
    } finally { if (token === generation) { loading = false; more.disabled = false; } }
  };

  window.addEventListener('flowboard:cloud-selection', event => {
    generation += 1; loading = false; more.disabled = false; workspace = event.detail || null; open.hidden = !session || !workspace;
    if (!workspace && dialog.open) dialog.close();
  });
  open.addEventListener('click', async () => { if (!workspace) return; dialog.showModal(); await load(true); if (dialog.open) close.focus(); });
  more.addEventListener('click', () => load(false));
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('cancel', event => { event.preventDefault(); dialog.close(); });
  dialog.addEventListener('close', () => { generation += 1; loading = false; more.disabled = false; open.focus(); });

  return {setSession(next) { generation += 1; session = next; if (!session) { workspace = null; open.hidden = true; if (dialog.open) dialog.close(); } }};
}
