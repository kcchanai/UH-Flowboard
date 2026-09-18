const DEFAULT = Object.freeze({version:1, density:'comfortable', view:'board'});
const DENSITIES = new Set(['comfortable','compact']);
const VIEWS = new Set(['board','list']);

export function normalizeUiPreferences(value) {
  return {
    version:1,
    density:DENSITIES.has(value?.density) ? value.density : DEFAULT.density,
    view:VIEWS.has(value?.view) ? value.view : DEFAULT.view
  };
}

export function isUiPreferences(value) {
  return value?.version === 1 && DENSITIES.has(value.density) && VIEWS.has(value.view)
    && Object.keys(value).every(key => ['version','density','view'].includes(key));
}

export function defaultUiPreferences() { return {...DEFAULT}; }
