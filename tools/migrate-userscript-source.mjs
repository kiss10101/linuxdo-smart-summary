#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';

const repoRoot = process.cwd();
const outputArgument = process.argv[2];
if (!outputArgument) {
  throw new Error('Usage: node tools/migrate-userscript-source.mjs <output-directory-outside-repository>');
}
const outputRoot = resolve(outputArgument);
const outputRelative = relative(repoRoot, outputRoot);
if (outputRelative === '' || (!outputRelative.startsWith('..') && !isAbsolute(outputRelative))) {
  throw new Error('migration provenance output must be outside the repository');
}
const baselinePath = resolve(repoRoot, 'dist/Linux.do 智能总结-7.7-alpha.9.user.js');
const expectedSha256 = '1C605AC2639AA678320BADA6BC005B0A2418E76AADADEFF484FD01A21BE04D1D';
const source = await readFile(baselinePath, 'utf8');
const actualSha256 = createHash('sha256').update(source, 'utf8').digest('hex').toUpperCase();

if (actualSha256 !== expectedSha256) {
  throw new Error(`refusing to migrate an unverified baseline: ${actualSha256}`);
}

const lines = source.replace(/\r\n?/g, '\n').split('\n');

function slice(start, end, dedent = 0) {
  const prefix = ' '.repeat(dedent);
  return lines.slice(start - 1, end).map((line) => {
    if (!dedent || !line.startsWith(prefix)) return line;
    return line.slice(dedent);
  }).join('\n').trimEnd();
}

async function write(path, content) {
  const target = resolve(outputRoot, path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, `${String(content).replace(/\r\n?/g, '\n').trimEnd()}\n`, 'utf8');
}

function coreModule(name, start, end, imports = '') {
  const prefix = imports ? `${imports.trim()}\n\n` : '';
  return `${prefix}export const ${name} = {\n${slice(start, end, 4)}\n};`;
}

function styleFragment(name, start, end) {
  return `import { CONFIG } from '../../config.js';\nimport { Core } from '../../core/index.js';\nimport { UIRegistry } from '../registry.js';\n\nexport const ${name} = {\n${slice(start, end, 4)}\n};`;
}

let metadata = slice(1, 54)
  .replace(/^\/\/ @version\s+.*$/m, '// @version      __VERSION__')
  .replace(
    ' * 7.7-alpha.9:',
    ' * __VERSION__: 将脚本迁移为多文件源码与确定性单文件构建；按 AI、Discourse、内容、导出和 UI 职责拆分模块，并建立源码测试、生成物校验与 CI 发布门禁。\n * 7.7-alpha.9:'
  )
  .replace(
    '// ==/UserScript==\n\n/*',
    '// ==/UserScript==\n\n// Generated from src/ by tools/build-userscript.mjs. Do not edit dist directly.\n\n/*'
  );
await write('src/metadata/userscript-header.txt', metadata);

const config = slice(62, 83, 4).replace('const CONFIG =', 'export const CONFIG =');
await write('src/config.js', config);

await write('src/core/state.js', coreModule('coreState', 91, 131));
await write('src/core/ai/profiles.js', coreModule('apiProfileCore', 133, 292, "import { CONFIG } from '../../config.js';"));
await write('src/core/discourse/topic-identity.js', coreModule('topicIdentityCore', 293, 329));
await write('src/core/ai/output.js', coreModule('aiOutputCore', 330, 865));
await write('src/core/ai/summary-selection.js', coreModule('summarySelectionCore', 866, 929));
await write('src/core/ai/messages.js', coreModule('aiMessageCore', 930, 945));
await write('src/core/discourse/topic-data.js', coreModule('topicDataCore', 947, 1562));
await write('src/core/content/post-format.js', coreModule('postContentCore', 1563, 1896));
await write('src/core/discourse/post-fetcher.js', coreModule('postFetcherCore', 1897, 2087));
await write('src/core/ai/client.js', coreModule('aiClientCore', 2088, 2390, "import { CONFIG } from '../../config.js';"));
await write('src/core/rendering.js', coreModule('renderingCore', 2391, 2554));

let exportModule = coreModule('exportCore', 2555, 2701);
exportModule = exportModule
  .replace('    cookedToAiText(cookedHtml, opts) {\n', '    cookedToAiText(cookedHtml, opts) {\n        const core = this;\n')
  .replace(/\bCore\./g, 'core.');
await write('src/core/export.js', exportModule);

await write('src/core/index.js', `import { aiClientCore } from './ai/client.js';
import { aiMessageCore } from './ai/messages.js';
import { aiOutputCore } from './ai/output.js';
import { apiProfileCore } from './ai/profiles.js';
import { summarySelectionCore } from './ai/summary-selection.js';
import { postContentCore } from './content/post-format.js';
import { postFetcherCore } from './discourse/post-fetcher.js';
import { topicDataCore } from './discourse/topic-data.js';
import { topicIdentityCore } from './discourse/topic-identity.js';
import { exportCore } from './export.js';
import { renderingCore } from './rendering.js';
import { coreState } from './state.js';

export const Core = Object.assign(
  {},
  coreState,
  apiProfileCore,
  topicIdentityCore,
  aiOutputCore,
  summarySelectionCore,
  aiMessageCore,
  topicDataCore,
  postContentCore,
  postFetcherCore,
  aiClientCore,
  renderingCore,
  exportCore
);`);

const registry = slice(2708, 2719, 4).replace('const UIRegistry =', 'export const UIRegistry =');
await write('src/ui/registry.js', registry);

await write('src/ui/style1/lifecycle.js', styleFragment('style1Lifecycle', 2730, 2981));
await write('src/ui/style1/presentation.js', styleFragment('style1Presentation', 2982, 3603));
await write('src/ui/style1/events.js', styleFragment('style1Events', 3604, 4287));
await write('src/ui/style1/state.js', styleFragment('style1State', 4290, 4504));
await write('src/ui/style1/interactions.js', styleFragment('style1Interactions', 4507, 5530));
await write('src/ui/style1/helpers.js', styleFragment('style1Helpers', 5533, 6276));
await write('src/ui/style1/index.js', `import { UIRegistry } from '../registry.js';
import { style1Events } from './events.js';
import { style1Helpers } from './helpers.js';
import { style1Interactions } from './interactions.js';
import { style1Lifecycle } from './lifecycle.js';
import { style1Presentation } from './presentation.js';
import { style1State } from './state.js';

export const style1 = Object.assign(
  {},
  style1Lifecycle,
  style1Presentation,
  style1Events,
  style1State,
  style1Interactions,
  style1Helpers
);

UIRegistry.register('style1', style1);`);

const style2 = `import { CONFIG } from '../config.js';
import { Core } from '../core/index.js';
import { UIRegistry } from './registry.js';

${slice(6282, 7024, 4)}`;
await write('src/ui/style2.js', style2);

await write('src/app/runtime.js', `export const uiRuntime = {
  activeUIManager: null,
  activeTopicId: null,
  routeBootstrapCleanup: null,
  activeTopicPrewarmTimer: null
};`);

let uiManager = slice(7031, 7113, 4)
  .replace('class UIManager', 'export class UIManager')
  .replace(/\bactiveUIManager\b/g, 'uiRuntime.activeUIManager');
uiManager = `import { CONFIG } from '../config.js';
import { Core } from '../core/index.js';
import { uiRuntime } from '../app/runtime.js';
import { UIRegistry } from './registry.js';

${uiManager}`;
await write('src/ui/ui-manager.js', uiManager);

let bootstrap = slice(7124, 7220, 4)
  .replace(/\bactiveUIManager\b/g, 'uiRuntime.activeUIManager')
  .replace(/\bactiveTopicId\b/g, 'uiRuntime.activeTopicId')
  .replace(/\brouteBootstrapCleanup\b/g, 'uiRuntime.routeBootstrapCleanup')
  .replace(/\bactiveTopicPrewarmTimer\b/g, 'uiRuntime.activeTopicPrewarmTimer')
  .replace('const start = () =>', 'export const startUserscript = () =>');
bootstrap = `import { Core } from '../core/index.js';
import { UIManager } from '../ui/ui-manager.js';
import { uiRuntime } from './runtime.js';

${bootstrap}`;
await write('src/app/bootstrap.js', bootstrap);

await write('src/index.js', `import './ui/style1/index.js';
import './ui/style2.js';
import { startUserscript } from './app/bootstrap.js';

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', startUserscript, { once: true });
} else {
  startUserscript();
}`);

console.log(`Migrated verified 7.7-alpha.9 userscript into ${resolve(outputRoot, 'src')}.`);
