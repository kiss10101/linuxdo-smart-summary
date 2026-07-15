#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { readProjectSource } from './source-test-helper.mjs';

function normalizeVersion(value, fallback = '7.7-alpha.9') {
  return String(value || fallback).trim().replace(/^v/i, '');
}

function assertContains(text, fragment, label) {
  if (!String(text).includes(fragment)) {
    throw new Error(`${label}: missing ${JSON.stringify(fragment)}`);
  }
}

function assertNotContains(text, fragment, label) {
  if (String(text).includes(fragment)) {
    throw new Error(`${label}: unexpected ${JSON.stringify(fragment)}`);
  }
}

function assertMatch(text, regex, label) {
  if (!regex.test(text)) {
    throw new Error(`${label}: pattern not found: ${regex}`);
  }
}

function assertCountAtLeast(text, fragment, minimum, label) {
  const count = String(text).split(fragment).length - 1;
  if (count < minimum) {
    throw new Error(`${label}: expected at least ${minimum}, found ${count}`);
  }
}

function getBlock(text, startPattern, endPattern, label) {
  const start = text.search(startPattern);
  if (start < 0) throw new Error(`${label}: start not found`);
  const rest = text.slice(start);
  const end = rest.search(endPattern);
  if (end < 0) throw new Error(`${label}: end not found`);
  return rest.slice(0, end);
}

function assertSettingsOrder(block, label) {
  const apiIndex = block.indexOf('API 配置');
  const promptIndex = block.indexOf('提示词配置');
  const advancedIndex = block.indexOf('高级设置');
  if (!(apiIndex >= 0 && promptIndex > apiIndex && advancedIndex > promptIndex)) {
    throw new Error(`${label}: expected API 配置 -> 提示词配置 -> 高级设置 order`);
  }
  assertContains(block, 'id="cfg-profile-list"', `${label}: profile list`);
  assertContains(block, 'role="listbox"', `${label}: profile listbox role`);
  assertContains(block, 'id="cfg-profile-name"', `${label}: profile name input`);
  assertContains(block, 'id="btn-api-profile-add"', `${label}: add button`);
  assertContains(block, 'id="btn-api-profile-copy"', `${label}: copy button`);
  assertContains(block, 'id="btn-api-profile-delete"', `${label}: delete button`);
}

const version = normalizeVersion(process.argv[2]);
const distPath = resolve(process.cwd(), `dist/Linux.do 智能总结-${version}.user.js`);
const distArtifact = await readFile(distPath, 'utf8');
const distText = await readProjectSource();

assertContains(distArtifact, `// @version      ${version}`, 'userscript version');
assertContains(distText, "apiProfilesKey: 'apiProfiles'", 'profile storage key');
assertContains(distText, "activeApiProfileIdKey: 'activeApiProfileId'", 'active profile storage key');
assertContains(distText, 'loadApiProfileState()', 'profile state loader');
assertContains(distText, 'saveApiProfileState(profiles, activeId)', 'profile state saver');
assertContains(distText, 'getLegacyApiProfile()', 'legacy migration helper');
assertContains(distText, "GM_getValue('apiUrl', CONFIG.defaultApiUrl)", 'legacy apiUrl migration');
assertContains(distText, "GM_setValue(CONFIG.apiProfilesKey, normalizedProfiles)", 'new profile storage write');
assertContains(distText, "GM_setValue(CONFIG.activeApiProfileIdKey, normalizedActiveId)", 'active profile storage write');
assertContains(distText, "GM_setValue('apiUrl', activeProfile.apiUrl)", 'legacy apiUrl double-write');
assertContains(distText, "GM_setValue('apiKey', activeProfile.apiKey)", 'legacy apiKey double-write');
assertContains(distText, "GM_setValue('model', activeProfile.model)", 'legacy model double-write');

assertCountAtLeast(distText, 'id="cfg-profile-list"', 2, 'style1/style2 profile lists');
assertNotContains(distText, 'id="cfg-profile-select"', 'old profile select');
assertContains(distText, 'api-profile-card', 'clickable profile card class');
assertContains(distText, "card.type = 'button'", 'profile cards are buttons without form submission');
assertContains(distText, "card.dataset.profileId = profile.id", 'profile card id binding');
assertContains(distText, "card.setAttribute('aria-selected'", 'profile card selected state');
assertCountAtLeast(distText, 'id="cfg-profile-name"', 2, 'style1/style2 profile name inputs');
assertCountAtLeast(distText, 'loadApiProfileStateToUi();', 2, 'style1/style2 restore from profiles');

const streamBlock = getBlock(
  distText,
  /async streamChat\(messages, onOutputEvent, onDone, onError(?:, options = \{\})?\)\s*\{/,
  /\n\s*buildModelsUrl\(apiUrl\)\s*\{/,
  'streamChat block'
);
assertContains(streamBlock, 'const activeProfile = this.getActiveApiProfile();', 'streamChat active profile');
if (/GM_getValue\('api(Key|Url)'/.test(streamBlock) || /GM_getValue\('model'/.test(streamBlock)) {
  throw new Error('streamChat should not read legacy apiUrl/apiKey/model directly');
}

assertMatch(
  distText,
  /persistApiProfileState\(options = \{\}\)\s*\{[\s\S]*?Core\.saveApiProfileState\(this\.apiProfiles, this\.activeApiProfileId\)/,
  'profile state persists through shared helper'
);

assertContains(distText, 'handleApiProfileSelect(nextId)', 'profile selection handler');
assertContains(distText, "this.addManagedListener(Q('#cfg-profile-list'), 'click'", 'profile list click handler');
assertContains(distText, "this.addManagedListener(Q('#cfg-profile-list'), 'keydown'", 'profile list keyboard handler');
assertContains(distText, "this.addManagedListener(Q('#cfg-profile-name'), 'input'", 'profile name managed input handler');
assertContains(distText, "this.flushApiProfilePersist({ render: true, fill: false })", 'profile field flush on blur/model select');
assertContains(distText, 'queueApiProfilePersist()', 'profile field debounce persistence');
assertContains(distText, 'addApiProfile()', 'profile add handler');
assertContains(distText, 'copyApiProfile()', 'profile copy handler');
assertContains(distText, 'deleteApiProfile()', 'profile delete handler');
assertContains(distText, 'getActiveApiProfileIndex: UIRegistry.get', 'style2 shared profile methods');

const style1SettingsBlock = getBlock(
  distText,
  /<div id="page-settings" class="view-page settings-page">/,
  /\$\{this\.getMessageContextMenuHtml\(\)\}/,
  'style1 settings block'
);
assertSettingsOrder(style1SettingsBlock, 'style1 settings block');

const style2SettingsBlock = getBlock(
  distText.slice(distText.indexOf("UIRegistry.register('style2'")),
  /<div id="page-settings" class="view-page settings-page">/,
  /\$\{this\.getMessageContextMenuHtml\(\)\}/,
  'style2 settings block'
);
assertSettingsOrder(style2SettingsBlock, 'style2 settings block');

console.log(`API profiles check passed for ${version}.`);
