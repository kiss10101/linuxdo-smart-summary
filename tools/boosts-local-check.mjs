#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

function escapeHtml(text) {
  return `${text ?? ''}`
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function decodeEntities(text) {
  return `${text ?? ''}`
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

function normalizePlainText(text) {
  return `${text ?? ''}`
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([,.!?;:，。！？；：])/g, '$1')
    .trim();
}

function plainTextFromHtml(html) {
  const withoutUnsafeBlocks = `${html ?? ''}`
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, ' ')
    .replace(/<object[\s\S]*?<\/object>/gi, ' ')
    .replace(/<embed[\s\S]*?>/gi, ' ');
  return normalizePlainText(decodeEntities(withoutUnsafeBlocks.replace(/<[^>]+>/g, ' ')));
}

function truncatePlainText(text, maxLength = 160) {
  const value = normalizePlainText(text);
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trim()}...`;
}

function getBoosts(post) {
  const boosts = Array.isArray(post?.boosts) ? post.boosts : [];
  return boosts.map((boost) => {
    const user = boost?.user || {};
    const username = user.username || boost?.username || '';
    const name = user.name || boost?.name || username;
    return {
      id: boost?.id ?? null,
      name,
      username,
      text: truncatePlainText(plainTextFromHtml(boost?.cooked || boost?.text || boost?.raw || ''))
    };
  });
}

function formatBoostAuthor(boost, atPrefix = false) {
  const name = boost?.name || boost?.username || '未知用户';
  const username = boost?.username || '';
  if (username && username !== name) {
    return `${name}（${atPrefix ? '@' : ''}${username}）`;
  }
  return atPrefix && username ? `@${username}` : name;
}

function formatBoostsText(post, options = {}) {
  const boosts = getBoosts(post);
  if (boosts.length === 0) return '';

  const maxItems = options.maxItems || 5;
  const lines = boosts.slice(0, maxItems).map((boost) => {
    const author = formatBoostAuthor(boost, options.atPrefix === true);
    return boost.text ? `- ${author}: ${boost.text}` : `- ${author}`;
  });
  if (boosts.length > maxItems) {
    lines.push(`- 另有 ${boosts.length - maxItems} 条 boost 未展开`);
  }

  return `Boosts: ${boosts.length} 条\n${lines.join('\n')}`;
}

function formatBoostsHtml(post) {
  const boosts = getBoosts(post);
  if (boosts.length === 0) return '';

  const maxItems = 10;
  const items = boosts.slice(0, maxItems).map((boost) => {
    const author = escapeHtml(formatBoostAuthor(boost, true));
    const text = boost.text ? `<span class="boost-text">${escapeHtml(boost.text)}</span>` : '';
    return `<li><span class="boost-author">${author}</span>${text}</li>`;
  }).join('');
  const overflow = boosts.length > maxItems
    ? `<li class="boost-more">另有 ${boosts.length - maxItems} 条 boost 未展开</li>`
    : '';

  return `<div class="post-boosts"><div class="boosts-title">Boosts · ${boosts.length}</div><ul>${items}${overflow}</ul></div>`;
}

const fixturePath = process.argv[2] || 'fixtures/boosts.fixture.json';
const absoluteFixturePath = resolve(process.cwd(), fixturePath);
const fixture = JSON.parse(await readFile(absoluteFixturePath, 'utf8'));

let failed = 0;
console.log(`Fixture: ${fixture.name || fixturePath}`);

for (const testCase of fixture.cases) {
  const post = fixture.posts.find((item) => item.post_number === testCase.postNumber);
  if (!post) {
    failed += 1;
    console.log(`post ${testCase.postNumber}: FAIL - post not found`);
    continue;
  }

  const text = formatBoostsText(post);
  const html = formatBoostsHtml(post);
  console.log(`post ${testCase.postNumber}`);
  console.log(`  text: ${JSON.stringify(text)}`);
  console.log(`  html: ${JSON.stringify(html)}`);

  const textOk = testCase.expectedText !== undefined
    ? text === testCase.expectedText
    : testCase.expectedTextContains.every((needle) => text.includes(needle));
  const htmlOk = testCase.expectedHtml !== undefined
    ? html === testCase.expectedHtml
    : testCase.expectedHtmlContains.every((needle) => html.includes(needle));
  const forbiddenOk = (testCase.forbiddenHtmlContains || []).every((needle) => !html.includes(needle));

  if (!textOk || !htmlOk || !forbiddenOk) {
    failed += 1;
    console.log('  result: FAIL');
  } else {
    console.log('  result: PASS');
  }
}

if (failed > 0) {
  process.exitCode = 1;
} else {
  console.log('All boost formatting cases passed.');
}
