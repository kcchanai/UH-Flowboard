export const SOURCE_CAP_BYTES = 300_000;
export const SOURCE_WARNING_BYTES = 210_000;
export const DIST_GZIP_LIMITS = Object.freeze({'initial shell':26_250, 'first-party lazy':58_000});

export const PRODUCTION_SOURCE_FILES = Object.freeze([
  'index.html', 'styles.css', 'state-core.js', 'app.js',
  'src/main.js', 'src/runtime-bootstrap.js', 'src/config.js', 'src/canvas-palettes.js', 'src/ui-preferences.js', 'src/board-view-model.js', 'src/density-ui.js', 'src/list-view-ui.js', 'src/quick-add-ui.js', 'src/appearance-ui.js', 'src/person-badges.js', 'src/cloud-roster-ui.js', 'src/cloud-sync-controller.js', 'src/activity-ui.js', 'src/assignment-ui.js', 'src/comments-ui.js',
  'src/auth-ui.js', 'src/cloud-workspace-ui.js', 'src/workspace-lifecycle-ui.js', 'src/invite-ui.js', 'src/members-ui.js', 'src/adapters/adapter-contract.js', 'src/adapters/local-workspace-adapter.js',
  'src/adapters/firebase-workspace-adapter.js', 'src/adapters/firebase-cloud-workspace.js', 'src/adapters/firebase-workspace-lifecycle.js', 'src/adapters/firebase-phase-h-probes.js', 'src/granular-workspace.js'
]);

export const SOURCE_LIMITS = Object.freeze({
  'index.html': 27_250, 'styles.css': 40_000, 'state-core.js': 20_000, 'app.js': 80_000,
  'src/main.js': 8_000, 'src/runtime-bootstrap.js': 4_000, 'src/config.js': 4_000, 'src/canvas-palettes.js': 6_000, 'src/ui-preferences.js': 4_000, 'src/board-view-model.js': 8_000, 'src/density-ui.js': 4_000, 'src/list-view-ui.js': 8_000, 'src/quick-add-ui.js': 6_000, 'src/appearance-ui.js': 10_000, 'src/person-badges.js': 5_000, 'src/cloud-roster-ui.js': 6_000, 'src/cloud-sync-controller.js': 5_000, 'src/activity-ui.js': 5_000, 'src/assignment-ui.js': 5_000, 'src/comments-ui.js': 9_000,
  'src/auth-ui.js': 8_000, 'src/cloud-workspace-ui.js': 13_000, 'src/workspace-lifecycle-ui.js': 4_500, 'src/invite-ui.js': 8_000, 'src/members-ui.js': 12_000, 'src/adapters/adapter-contract.js': 8_000,
  'src/adapters/local-workspace-adapter.js': 12_000, 'src/adapters/firebase-workspace-adapter.js': 8_000,
  'src/adapters/firebase-cloud-workspace.js': 28_000, 'src/adapters/firebase-workspace-lifecycle.js': 3_000, 'src/adapters/firebase-phase-h-probes.js': 4_000, 'src/granular-workspace.js': 6_000
});
