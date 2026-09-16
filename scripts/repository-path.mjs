const FALLBACK_REPOSITORY_NAME = 'UH-Flowboard';
const REPOSITORY_NAME_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9._-]{0,99})$/;

function candidateFromEnvironment(env = process.env) {
  const explicit = String(env.FLOWBOARD_REPOSITORY_NAME || '').trim();
  if (explicit) return explicit;
  const workflowRepository = String(env.GITHUB_REPOSITORY || '').trim();
  if (workflowRepository && !/^[^/]+\/[^/]+$/.test(workflowRepository)) throw new Error('The GitHub repository environment value is invalid.');
  return workflowRepository ? workflowRepository.split('/').at(-1) : FALLBACK_REPOSITORY_NAME;
}

export function repositoryNameFromEnvironment(env = process.env) {
  const candidate = candidateFromEnvironment(env);
  if (!REPOSITORY_NAME_PATTERN.test(candidate) || candidate === '.' || candidate === '..') throw new Error('The Flowboard repository name is invalid.');
  return candidate;
}

export const repositoryName = repositoryNameFromEnvironment();
export const basePath = `/${repositoryName}/`;
export const previewUrl = (port = 4173) => `http://127.0.0.1:${port}${basePath}`;
