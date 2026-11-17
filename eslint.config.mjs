// Flat ESLint config. eslint-config-next/core-web-vitals cannot be used yet: it pulls
// eslint-plugin-react@7, which calls scopeManager.addGlobals() that ESLint 10 removed.
// Restore it once eslint-plugin-react supports ESLint 10.
const nodeAndBrowserGlobals = {
  window: 'readonly', document: 'readonly', navigator: 'readonly', localStorage: 'readonly',
  sessionStorage: 'readonly', fetch: 'readonly', console: 'readonly', process: 'readonly',
  Buffer: 'readonly', URL: 'readonly', URLSearchParams: 'readonly', setTimeout: 'readonly',
  clearTimeout: 'readonly', setInterval: 'readonly', clearInterval: 'readonly',
  crypto: 'readonly', atob: 'readonly', btoa: 'readonly', Response: 'readonly',
  Request: 'readonly', Headers: 'readonly', FormData: 'readonly', Blob: 'readonly',
  structuredClone: 'readonly', AbortController: 'readonly', TextEncoder: 'readonly',
  TextDecoder: 'readonly', ServiceWorker: 'readonly', Notification: 'readonly',
  pushManager: 'readonly', self: 'readonly', globalThis: 'readonly', queueMicrotask: 'readonly',
  performance: 'readonly', global: 'readonly',
};

export default [
  {
    // Global ignores: must be their own entry or the directory walk still stats db/.
    ignores: ['src/generated/**', '.next/**', 'node_modules/**', 'db/**'],
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: nodeAndBrowserGlobals,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Would have caught the `locale is not defined` render crash.
      'no-undef': 'error',
    },
  },
  {
    // Service worker: runs in a worker scope with the SW Client API.
    files: ['public/sw.js'],
    languageOptions: {
      globals: { ...nodeAndBrowserGlobals, clients: 'readonly', importScripts: 'readonly' },
    },
  },
  {
    // Plain CommonJS build scripts.
    files: ['scripts/**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { ...nodeAndBrowserGlobals, require: 'readonly', __dirname: 'readonly', module: 'writable' },
    },
  },
];
