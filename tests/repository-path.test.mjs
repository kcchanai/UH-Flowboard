import assert from 'node:assert/strict';
import test from 'node:test';
import {previewUrl, repositoryName, repositoryNameFromEnvironment} from '../scripts/repository-path.mjs';

test('repository path derives the local fallback and future rename', () => {
  assert.equal(repositoryNameFromEnvironment({}), 'UH-Trello');
  assert.equal(repositoryNameFromEnvironment({FLOWBOARD_REPOSITORY_NAME:'UH-Flowboard'}), 'UH-Flowboard');
  assert.equal(repositoryNameFromEnvironment({GITHUB_REPOSITORY:'kcchanai/UH-Flowboard'}), 'UH-Flowboard');
  assert.equal(previewUrl(4173), `http://127.0.0.1:4173/${repositoryName}/`);
});

test('repository path rejects unsafe or malformed repository names', () => {
  for (const env of [
    {FLOWBOARD_REPOSITORY_NAME:'../UH-Flowboard'},
    {FLOWBOARD_REPOSITORY_NAME:'UH Flowboard'},
    {FLOWBOARD_REPOSITORY_NAME:'https://example.test'},
    {GITHUB_REPOSITORY:'kcchanai'}
  ]) assert.throws(() => repositoryNameFromEnvironment(env), /invalid/);
});
