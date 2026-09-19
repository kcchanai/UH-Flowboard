const clean = value => value?.trim?.() || '';

export const cloudConfig = Object.freeze({
  apiKey: clean(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: clean(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: clean(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  appId: clean(import.meta.env.VITE_FIREBASE_APP_ID)
});

export const cloudConfigured = Boolean(
  cloudConfig.apiKey
  && /^[a-z0-9-]{4,30}$/i.test(cloudConfig.projectId)
  && cloudConfig.authDomain
  && cloudConfig.appId
);

export const cloudStatus = Object.freeze(cloudConfigured ? {
  message: 'Firebase public configuration is present. Boards synchronize after sign-in.'
} : {
  message: 'Firebase is not configured. Board editing is unavailable in this build. Existing legacy browser data is unchanged.'
});
