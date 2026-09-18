const GOOGLE_PHOTO_HOST = 'lh3.googleusercontent.com';
const personName = person => String(person?.displayName || person?.email || person?.emailLower || 'Account').trim() || 'Account';
export const safePhotoURL = value => { if (typeof value !== 'string' || !value) return ''; try { const url = new URL(value); return url.protocol === 'https:' && url.hostname === GOOGLE_PHOTO_HOST && !url.username && !url.password && !url.port ? url.href : ''; } catch { return ''; } };
export const personInitials = person => personName(person).split(/\s+/).map(part => part[0]).join('').slice(0,2).toUpperCase() || 'A';
export function renderPersonBadge(container, person = {}, {photoPreference = true, decorative = false} = {}) {
  if (!container) return;
  const name = personName(person), fallback = () => { container.replaceChildren(); const span = document.createElement('span'); span.className = 'person-badge-fallback'; span.textContent = personInitials(person); span.setAttribute('aria-hidden', String(decorative)); container.append(span); if (decorative) container.setAttribute('aria-hidden', 'true'); else container.setAttribute('aria-label', name); };
  container.classList.add('person-badge'); container.removeAttribute('role'); container.removeAttribute('aria-label');
  const source = photoPreference ? safePhotoURL(person.photoURL) : '';
  if (!source) return fallback();
  container.replaceChildren(); const image = document.createElement('img'); image.src = source; image.alt = decorative ? '' : name; image.referrerPolicy = 'no-referrer'; image.decoding = 'async'; image.loading = 'lazy'; image.addEventListener('error', fallback, {once:true}); container.append(image); if (decorative) container.setAttribute('aria-hidden', 'true'); else container.setAttribute('aria-label', name);
}
