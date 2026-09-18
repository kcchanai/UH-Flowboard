export function toggleDensity() {
  const adapter = globalThis.FlowboardRuntime?.localAdapter;
  const next = document.documentElement.dataset.density === 'compact' ? 'comfortable' : 'compact';
  const current = adapter?.loadUiPreferences?.() || {version:1,density:'comfortable',view:'board'};
  const result = adapter?.saveUiPreferences?.({...current,density:next});
  document.documentElement.dataset.density = next;
  const button = document.querySelector('#density-toggle');
  if (button) { button.textContent = next === 'compact' ? 'Compact' : 'Comfortable'; button.setAttribute('aria-pressed', String(next === 'compact')); }
  const message = result?.ok === false ? 'Changed for this session; browser preference could not be saved.' : `${next[0].toUpperCase()+next.slice(1)} density enabled`;
  const announcer = document.querySelector('#announcer');
  if (announcer) { announcer.textContent = ''; requestAnimationFrame(() => { announcer.textContent = message; }); }
  const toast = document.querySelector('#toast');
  if (toast) { toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2400); }
}
