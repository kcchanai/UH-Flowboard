import {renderPersonBadge} from './person-badges.js';

export function initializeCloudRosterUI(adapter) {
  let session = null, members = new Map(), generation = 0, scheduled = false;
  const mode = () => globalThis.FlowboardApp?.getMode?.() || {kind:'local'};
  const paint = () => {
    scheduled = false;
    const preference = document.documentElement.dataset.appearancePhotos !== 'initials';
    document.querySelectorAll('.assignees[data-assignee-uids]').forEach(container => {
      const ids = container.dataset.assigneeUids.split(',').filter(Boolean), key = `${generation}:${preference}:${ids.join(',')}`;
      if (container.dataset.rosterPaint === key) return;
      container.dataset.rosterPaint = key; container.replaceChildren();
      const people = ids.map(uid => members.get(uid) || {uid, displayName:'Former member'}), visible = people.slice(0,3);
      container.setAttribute('aria-label', `Assigned to ${people.map(person => person.displayName || person.emailLower || 'Former member').join(', ')}`);
      visible.forEach(person => { const badge=document.createElement('span'); badge.className='assignee person-badge'; container.append(badge); renderPersonBadge(badge, person, {photoPreference:preference, decorative:true}); });
      if (people.length > 3) { const more=document.createElement('span'); more.className='assignee assignee-overflow'; more.textContent=`+${people.length - 3}`; more.setAttribute('aria-hidden','true'); container.append(more); }
    });
  };
  const schedulePaint = () => { if (scheduled) return; scheduled=true; queueMicrotask(paint); };
  const refresh = async () => {
    const active=mode(), token=++generation;
    if (!session || !['cloud','cloud-preview'].includes(active.kind) || !active.id) { members=new Map(); schedulePaint(); return; }
    try { const list=await adapter.listMembers(active.id); if (token !== generation) return; members=new Map(list.map(member => [member.uid, member])); schedulePaint(); }
    catch { if (token === generation) { members=new Map(); schedulePaint(); } }
  };
  const board=document.querySelector('#board');
  const observer=board ? new MutationObserver(schedulePaint) : null;
  observer?.observe(board,{childList:true,subtree:true});
  window.addEventListener('flowboard:cloud-selection', refresh);
  window.addEventListener('flowboard:cloud-preview-change', refresh);
  window.addEventListener('flowboard:appearance-change', schedulePaint);
  return Object.freeze({setSession(next){session=next; refresh();}});
}
