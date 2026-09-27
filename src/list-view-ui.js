import {projectBoard, sortRows} from './board-view-model.js';

let root, app, last = null, sort = 'board', limit = 100, signature = '';
const esc = value => String(value ?? '').replace(/[&<>\'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));

const injectStyle = () => {
  if (document.querySelector('#list-view-style')) return;
  const style = document.createElement('style');
  style.id = 'list-view-style';
  style.textContent = `.board.list-view-active{display:block;overflow:auto;padding:2px 2px 28px}.list-view-header{display:flex;align-items:end;justify-content:space-between;gap:16px;margin:0 0 12px}.list-view-header h2{margin:0;color:var(--canvas-ink);font-size:18px}.list-view-header p{margin:2px 0 0;color:var(--canvas-ink-soft);font-size:12px}.list-view-table{width:100%;min-width:760px;border-collapse:separate;border-spacing:0 6px;color:var(--ink);font-size:13px}.list-view-table th{padding:0 11px;color:var(--canvas-ink-soft);font-size:11px;text-align:left;text-transform:uppercase;letter-spacing:.05em}.list-view-table th button{padding:4px 0;color:inherit;background:transparent;font-size:inherit;font-weight:800;text-transform:inherit;letter-spacing:inherit}.list-view-table td{padding:11px;background:var(--surface-strong);border-top:1px solid var(--line);border-bottom:1px solid var(--line);vertical-align:middle}.list-view-table td:first-child{border-left:1px solid var(--line);border-radius:8px 0 0 8px}.list-view-table td:last-child{border-right:1px solid var(--line);border-radius:0 8px 8px 0}.list-card-title{display:block;max-width:360px;padding:0;color:var(--ink);background:transparent;text-align:left;font-weight:750}.list-card-title:hover{text-decoration:underline}.list-view-muted{color:var(--muted);font-weight:500}.list-view-status{font-weight:650}.list-view-status.complete{color:var(--success)}.list-view-status.overdue{color:var(--danger)}.list-view-footer{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:12px;color:var(--canvas-ink-soft);font-size:12px}.list-view-empty{padding:28px;color:var(--canvas-ink);border:1px dashed var(--canvas-border);border-radius:var(--radius-md);text-align:center}.list-view-mobile-sort{display:none}@media (max-width:600px){.board.list-view-active{overflow-x:hidden}.list-view-header{align-items:start;margin-bottom:10px}.list-view-mobile-sort{display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin:0 0 10px;color:var(--canvas-ink-soft);font-size:12px;font-weight:700}.list-view-mobile-sort button{min-height:44px;padding:8px 12px}.list-view-mobile-sort button[aria-pressed="true"]{background:var(--surface-strong);box-shadow:inset 0 0 0 1px var(--line)}.list-view-table{display:block;min-width:0;width:100%;border-spacing:0 8px}.list-view-table caption,.list-view-table thead{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.list-view-table tbody,.list-view-table tr{display:block}.list-view-table tr{margin:0 0 8px;background:var(--surface-strong);border:1px solid var(--line);border-radius:8px}.list-view-table td,.list-view-table td:first-child,.list-view-table td:last-child{display:grid;grid-template-columns:minmax(5.5rem,32%) minmax(0,1fr);gap:6px;padding:6px 11px;background:transparent;border:0;border-radius:0;vertical-align:top}.list-view-table td:first-child{display:block;padding:10px 11px 4px}.list-view-table td:first-child::before{display:none}.list-view-table td::before{content:attr(data-label);color:var(--muted);font-size:11px;font-weight:800;letter-spacing:.04em;text-transform:uppercase}.list-card-title{display:flex;align-items:center;width:100%;min-height:44px;max-width:none;margin:-8px 0;padding:8px 0;font-size:14px}.list-view-footer{align-items:flex-start;flex-direction:column}.list-view-footer .button{min-height:44px}}`;
  document.head.append(style);
};

const summary = (shown, total) => `${shown} of ${total} cards shown`;
const sortLabel = key => sort === key ? 'ascending' : 'none';
const sortControl = key => sort === key ? 'true' : 'false';

function render(next) {
  last = next;
  const view = projectBoard(next.board, {
    search:next.search,
    filters:next.filters,
    currentUserUid:next.currentUserUid,
    cardMatches:FlowboardState.cardMatches,
    dueState:FlowboardState.dueState
  });
  const key = JSON.stringify([view.boardId, next.search, next.filters]);
  if (key !== signature) {
    signature = key;
    limit = 100;
  }
  const rows = sortRows(view.rows, sort);
  const shown = rows.slice(0, limit);
  root.classList.add('list-view-active');
  root.innerHTML = `<div id="list-view" class="list-view"><header class="list-view-header"><div><h2 id="list-view-heading">List view</h2><p id="list-view-summary" aria-live="polite">${summary(shown.length, rows.length)}. Filters and sorting affect this view only.</p></div></header><div class="list-view-mobile-sort" role="group" aria-label="Sort list view"><span>Sort by</span><button type="button" data-list-sort="title" aria-pressed="${sortControl('title')}">Task</button><button type="button" data-list-sort="due" aria-pressed="${sortControl('due')}">Due</button></div>${shown.length ? `<table id="list-view-table" class="list-view-table"><caption class="visually-hidden">${esc(view.boardTitle)} task list</caption><thead><tr><th scope="col" aria-sort="${sortLabel('title')}"><button type="button" data-list-sort="title">Task</button></th><th scope="col">List</th><th scope="col">Assignees</th><th scope="col" aria-sort="${sortLabel('due')}"><button type="button" data-list-sort="due">Due</button></th><th scope="col">Checklist</th><th scope="col">Status</th></tr></thead><tbody>${shown.map(row => {
    const card = row.card;
    const done = (card.checklist || []).filter(item => item.done).length;
    const due = card.dueDate ? `${card.dueDate}${card.dueTime ? ` · ${card.dueTime}` : ''}` : 'No due date';
    const state = card.completed ? 'Complete' : FlowboardState.dueState(card);
    const people = card.assignees?.join(', ') || (card.assigneeUids?.length ? 'Workspace member' : 'Unassigned');
    const stateLabel = state === 'today' ? 'Due today' : state[0].toUpperCase() + state.slice(1);
    return `<tr><td data-label="Task"><button class="list-card-title" type="button" data-list-card="${esc(card.id)}" aria-label="Open ${esc(card.title)} in ${esc(row.listTitle)}">${esc(card.title)}</button></td><td data-label="List">${esc(row.listTitle)}</td><td class="list-view-muted" data-label="Assignees">${esc(people)}</td><td class="list-view-muted" data-label="Due">${esc(due)}</td><td class="list-view-muted" data-label="Checklist">${card.checklist?.length ? `${done}/${card.checklist.length}` : 'None'}</td><td class="list-view-status ${esc(state)}" data-label="Status">${esc(stateLabel)}</td></tr>`;
  }).join('')}</tbody></table>` : '<p class="list-view-empty">No matching cards. Clear filters above to see the full board.</p>'}<footer class="list-view-footer"><span>${rows.length ? `Showing ${shown.length} of ${rows.length}` : 'No rows'}</span>${shown.length < rows.length ? '<button class="button button-quiet" type="button" data-list-more>Show 100 more</button>' : ''}</footer></div>`;
}

export function createListView(target, flowboardApp) {
  root = target;
  app = flowboardApp;
  injectStyle();
  root.addEventListener('click', event => {
    const card = event.target.closest('[data-list-card]');
    if (card) return app.openCardById(card.dataset.listCard, card);
    const sortButton = event.target.closest('[data-list-sort]');
    if (sortButton) {
      sort = sortButton.dataset.listSort;
      return render(last);
    }
    if (event.target.closest('[data-list-more]')) {
      limit += 100;
      return render(last);
    }
  });
  return Object.freeze({render});
}
