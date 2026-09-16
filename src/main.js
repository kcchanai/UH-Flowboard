import '../state-core.js';
import {createLocalWorkspaceAdapter} from './adapters/local-workspace-adapter.js';
import {createUnavailableCloudAdapter} from './adapters/adapter-contract.js';
import {cloudConfig, cloudConfigured, cloudStatus} from './config.js';
import {bootstrapFlowboard} from './runtime-bootstrap.js';

const State = globalThis.FlowboardState;
if (!State) throw new Error('Flowboard state domain failed to initialize.');

let cloudAdapter = createUnavailableCloudAdapter();
let cloudInitializationError = null;
const localAdapter = createLocalWorkspaceAdapter({
  validWorkspace: State.validWorkspace,
  normalizeWorkspace: State.normalizeWorkspace,
  migrateLegacy: State.migrateLegacy,
  makeWorkspace: State.makeWorkspace,
  clone: State.clone
});
if (cloudConfigured) {
  try {
    const {createFirebaseWorkspaceAdapter} = await import('./adapters/firebase-workspace-adapter.js');
    cloudAdapter = createFirebaseWorkspaceAdapter(cloudConfig);
  } catch (error) {
    cloudInitializationError = error;
    console.error('Flowboard could not initialize Firebase Authentication.', error);
  }
}

await bootstrapFlowboard({cloudConfigured, cloudStatus, cloudInitializationError, localAdapter, cloudAdapter});
