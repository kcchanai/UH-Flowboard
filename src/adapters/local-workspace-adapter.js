import {normalizeUiPreferences, defaultUiPreferences} from '../ui-preferences.js';
import {createUnavailableCloudAdapter} from './adapter-contract.js';

export function createLocalWorkspaceAdapter({
  storage = globalThis.localStorage,
  storageKey = 'flowboard-workspace',
  legacyKey = 'flowboard-data',
  backupKey = 'flowboard-workspace-backups',
  backupLimit = 5,
  appearanceKey = 'flowboard-appearance',
  uiPreferencesKey = 'flowboard-ui-preferences',
  validWorkspace,
  normalizeWorkspace,
  migrateLegacy,
  makeWorkspace,
  clone = value => JSON.parse(JSON.stringify(value))
}) {
  if (!storage || !validWorkspace || !normalizeWorkspace || !migrateLegacy || !makeWorkspace) {
    throw new Error('LocalWorkspaceAdapter requires storage and state normalization functions.');
  }

  const parse = (value) => JSON.parse(value);
  const readBackups = () => {
    try {
      const value = parse(storage.getItem(backupKey) || '[]');
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  };

  const save = workspace => storage.setItem(storageKey, JSON.stringify(workspace));
  const loadAppearance = () => { try { const value = storage.getItem(appearanceKey); return value ? parse(value) : null; } catch { return null; } };
  const saveAppearance = appearance => { try { storage.setItem(appearanceKey, JSON.stringify(appearance)); return {ok:true}; } catch (error) { return {ok:false,error}; } };
  const loadUiPreferences = () => { try { const value = storage.getItem(uiPreferencesKey); return value ? normalizeUiPreferences(parse(value)) : defaultUiPreferences(); } catch { return defaultUiPreferences(); } };
  const saveUiPreferences = preferences => { try { storage.setItem(uiPreferencesKey, JSON.stringify(normalizeUiPreferences(preferences))); return {ok:true}; } catch (error) { return {ok:false,error}; } };

  const backupWorkspace = (workspace, createdAt = new Date().toISOString()) => {
    try {
      const next = [{createdAt, workspace:clone(workspace)}, ...readBackups()].slice(0, backupLimit);
      storage.setItem(backupKey, JSON.stringify(next));
      return {ok:true, backups:next};
    } catch (error) {
      return {ok:false, error};
    }
  };

  return Object.freeze({
    ...createUnavailableCloudAdapter(),
    kind: 'local',
    getSession() { return null; },
    onAuthStateChange(callback) { callback?.(null); return () => {}; },
    loadWorkspace() {
      try {
        const saved = storage.getItem(storageKey);
        if (saved) {
          const parsed = parse(saved);
          if (!validWorkspace(parsed)) throw new Error('Unsupported workspace schema');
          const workspace = normalizeWorkspace(parsed);
          if (parsed.schemaVersion !== workspace.schemaVersion) save(workspace);
          return {workspace, migrated:parsed.schemaVersion !== workspace.schemaVersion, source:'current'};
        }
        const legacy = storage.getItem(legacyKey);
        if (legacy) {
          const workspace = migrateLegacy(parse(legacy));
          if (workspace) {
            save(workspace);
            storage.removeItem(legacyKey);
            return {workspace, migrated:true, source:'legacy'};
          }
        }
      } catch (error) {
        return {workspace:makeWorkspace(), migrated:false, source:'recovery', error};
      }
      const workspace = makeWorkspace();
      try { save(workspace); } catch (error) { return {workspace, migrated:false, source:'fresh', error}; }
      return {workspace, migrated:false, source:'fresh'};
    },
    saveWorkspace(workspace, {createBackup = true, announceAt = new Date().toISOString()} = {}) {
      if (createBackup) backupWorkspace(workspace, announceAt);
      try {
        save(workspace);
        return {ok:true};
      } catch (error) {
        return {ok:false, error};
      }
    },
    backupWorkspace,
    listRecoveryBackups: readBackups,
    loadAppearance,
    saveAppearance,
    loadUiPreferences,
    saveUiPreferences,
    exportLocalWorkspace(workspace) { return clone(workspace); }
  });
}
