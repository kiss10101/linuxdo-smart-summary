#!/usr/bin/env node

import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const packageJson = JSON.parse(await readFile(resolve(process.cwd(), 'package.json'), 'utf8'));
const version = String(process.argv[2] || packageJson.version).replace(/^v/i, '');
const distPath = resolve(process.cwd(), `dist/Linux.do 智能总结-${version}.user.js`);
const source = await readFile(distPath, 'utf8');

const windowListeners = new Map();
const documentListeners = new Map();
const addListener = (registry) => (type, listener) => {
  if (!registry.has(type)) registry.set(type, new Set());
  registry.get(type).add(listener);
};
const removeListener = (registry) => (type, listener) => {
  registry.get(type)?.delete(listener);
};

const windowObject = {
  location: {
    href: 'https://linux.do/latest',
    origin: 'https://linux.do',
    protocol: 'https:'
  },
  addEventListener: addListener(windowListeners),
  removeEventListener: removeListener(windowListeners),
  alert() {}
};
const documentObject = {
  readyState: 'complete',
  visibilityState: 'visible',
  addEventListener: addListener(documentListeners),
  removeEventListener: removeListener(documentListeners),
  createElement() {
    throw new Error('non-topic bundle smoke test must not create UI elements');
  }
};
const originalPushState = function pushState() {};
const originalReplaceState = function replaceState() {};
const historyObject = {
  pushState: originalPushState,
  replaceState: originalReplaceState
};

const context = vm.createContext({
  AbortController,
  Blob,
  URL,
  TextDecoder,
  TextEncoder,
  clearTimeout,
  console,
  document: documentObject,
  fetch,
  history: historyObject,
  setTimeout,
  window: windowObject
});
windowObject.window = windowObject;
windowObject.document = documentObject;
windowObject.history = historyObject;

new vm.Script(source, { filename: `Linux.do 智能总结-${version}.user.js` }).runInContext(context);

const failures = [];
if (historyObject.pushState === originalPushState) failures.push('history.pushState was not wrapped');
if (historyObject.replaceState === originalReplaceState) failures.push('history.replaceState was not wrapped');
for (const eventName of ['popstate', 'hashchange', 'focus', 'pageshow']) {
  if (!windowListeners.get(eventName)?.size) failures.push(`window listener missing: ${eventName}`);
}
if (!documentListeners.get('visibilitychange')?.size) {
  failures.push('document listener missing: visibilitychange');
}

if (failures.length > 0) {
  console.log(`Bundle runtime smoke check failed for ${version}:`);
  for (const failure of failures) console.log(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Bundle runtime smoke check passed for ${version}.`);
}
