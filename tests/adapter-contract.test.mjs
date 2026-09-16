import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {createUnavailableCloudAdapter, REMOTE_METHODS} from '../src/adapters/adapter-contract.js';

const [contractSource, firebaseSource] = await Promise.all([
  readFile(new URL('../src/adapters/adapter-contract.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/adapters/firebase-workspace-adapter.js', import.meta.url), 'utf8')
]);
const contractBlock = contractSource.slice(contractSource.indexOf('REMOTE_METHODS'), contractSource.indexOf(']);', contractSource.indexOf('REMOTE_METHODS')));
const contractMethods = [...contractBlock.matchAll(/'([^']+)'/g)].map(match => match[1]);
const configuredBlock = firebaseSource.slice(firebaseSource.indexOf('const adapter = {'), firebaseSource.indexOf('\n  };', firebaseSource.indexOf('const adapter = {')));
const configuredMethods = [...configuredBlock.matchAll(/^\s{4}(?:async\s+)?([A-Za-z_$][\w$]*)\s*\(/gm)].map(match => match[1]);

function sorted(values) { return [...new Set(values)].sort(); }

test('configured and unavailable cloud adapters expose the same method contract', () => {
  assert.deepEqual(sorted(configuredMethods), sorted(contractMethods));
  assert.deepEqual(sorted(Object.keys(createUnavailableCloudAdapter())), sorted(REMOTE_METHODS));
});
