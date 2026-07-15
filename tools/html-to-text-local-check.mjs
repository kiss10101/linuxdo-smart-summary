#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Core } from '../src/core/index.js';
import { readProjectSource } from './source-test-helper.mjs';

function normalizeVersion(value, fallback = '7.7-alpha.9') {
  return String(value || fallback).trim().replace(/^v/i, '');
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}\nexpected: ${JSON.stringify(expected)}\nactual:   ${JSON.stringify(actual)}`);
  }
}

function assertContains(text, fragment, label) {
  if (!String(text).includes(fragment)) throw new Error(`${label}: missing ${JSON.stringify(fragment)}`);
}

function assertNotContains(text, fragment, label) {
  if (String(text).includes(fragment)) throw new Error(`${label}: forbidden ${JSON.stringify(fragment)}`);
}

const namedEntities = new Map([
  ['amp', '&'],
  ['lt', '<'],
  ['gt', '>'],
  ['quot', '"'],
  ['apos', "'"],
  ['nbsp', '\u00a0']
]);

function decodeEntitiesOnce(source) {
  let result = '';
  for (let index = 0; index < source.length; index += 1) {
    if (source[index] !== '&') {
      result += source[index];
      continue;
    }

    const semicolon = source.indexOf(';', index + 1);
    if (semicolon < 0 || semicolon - index > 32) {
      result += '&';
      continue;
    }

    const token = source.slice(index + 1, semicolon);
    let decoded = namedEntities.get(token) ?? null;
    if (/^#x[0-9a-f]+$/i.test(token)) decoded = String.fromCodePoint(Number.parseInt(token.slice(2), 16));
    if (/^#\d+$/.test(token)) decoded = String.fromCodePoint(Number.parseInt(token.slice(1), 10));

    if (decoded === null) {
      result += '&';
      continue;
    }

    result += decoded;
    index = semicolon;
  }
  return result;
}

function readTag(source, start) {
  if (source[start] !== '<') return null;
  if (source.startsWith('<!--', start)) {
    const commentEnd = source.indexOf('-->', start + 4);
    return { name: '', closing: false, selfClosing: true, next: commentEnd < 0 ? source.length : commentEnd + 3 };
  }

  let cursor = start + 1;
  let closing = false;
  if (source[cursor] === '/') {
    closing = true;
    cursor += 1;
  }
  while (/\s/.test(source[cursor] || '')) cursor += 1;

  const nameStart = cursor;
  while (/[A-Za-z0-9:-]/.test(source[cursor] || '')) cursor += 1;
  const name = source.slice(nameStart, cursor).toLowerCase();
  if (!name) return null;

  let quote = '';
  for (; cursor < source.length; cursor += 1) {
    const char = source[cursor];
    if (quote) {
      if (char === quote) quote = '';
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === '>') {
      let tail = cursor - 1;
      while (tail > start && /\s/.test(source[tail])) tail -= 1;
      return { name, closing, selfClosing: source[tail] === '/', next: cursor + 1 };
    }
  }
  return null;
}

function browserLikeTextContent(source, removedTags) {
  const suppressed = [];
  let text = '';
  let index = 0;

  while (index < source.length) {
    if (source[index] === '<') {
      const tag = readTag(source, index);
      if (tag) {
        if (tag.closing) {
          const matchIndex = suppressed.lastIndexOf(tag.name);
          if (matchIndex >= 0) suppressed.splice(matchIndex, 1);
        } else if (removedTags.has(tag.name) && !tag.selfClosing) {
          suppressed.push(tag.name);
        }
        index = tag.next;
        continue;
      }
    }

    if (suppressed.length === 0) text += source[index];
    index += 1;
  }

  return decodeEntitiesOnce(text);
}

class FixtureDOMParser {
  parseFromString(source) {
    const removedTags = new Set();
    return {
      querySelectorAll(selector) {
        return selector.split(',').map((tag) => ({
          remove() {
            removedTags.add(tag.trim());
          }
        }));
      },
      body: {
        get textContent() {
          return browserLikeTextContent(String(source ?? ''), removedTags);
        }
      }
    };
  }
}

function extractBlock(text, startMarker, endMarker, label) {
  const start = text.indexOf(startMarker);
  if (start < 0) throw new Error(`${label}: start marker not found`);
  const end = text.indexOf(endMarker, start);
  if (end < 0) throw new Error(`${label}: end marker not found`);
  return text.slice(start, end);
}

const fixturePath = process.argv[2] || 'fixtures/html-to-text.fixture.json';
const version = normalizeVersion(process.argv[3]);
const fixture = JSON.parse(await readFile(resolve(process.cwd(), fixturePath), 'utf8'));
const distArtifact = await readFile(resolve(process.cwd(), `dist/Linux.do 智能总结-${version}.user.js`), 'utf8');
const sourceText = await readProjectSource();
assertContains(distArtifact, `// @version      ${version}`, 'userscript version');

const plainTextMethods = extractBlock(
  sourceText,
  '    getHtmlParser() {',
  '    truncatePlainText(',
  'HTML-to-text methods'
);
assertContains(plainTextMethods, "parser.parseFromString(source, 'text/html')", 'inert DOM parsing');
assertContains(plainTextMethods, "querySelectorAll('script, style, iframe, object, embed')", 'unsafe block removal');
assertContains(plainTextMethods, 'if (!parser) return this.normalizePlainText(source);', 'non-regex fallback');
assertNotContains(plainTextMethods, '.replace(/<', 'HTML regex stripping');

const formatPostBlock = extractBlock(
  sourceText,
  '    formatPostForAiContext(',
  '    formatPostsForAiContext(',
  'formatPostForAiContext'
);
assertContains(formatPostBlock, "let content = `${post?.cooked ?? ''}`;", 'nullable cooked normalization');
assertContains(formatPostBlock, 'content = this.plainTextFromHtml(content);', 'shared HTML-to-text path');
assertNotContains(formatPostBlock, ".replace(/<[^>]+>/g, '')", 'legacy tag-stripping regex');

const originalDOMParser = globalThis.DOMParser;
globalThis.DOMParser = FixtureDOMParser;
Core.htmlParser = null;
for (const testCase of fixture.cases) {
  const actual = Core.plainTextFromHtml(testCase.html);
  console.log(`${testCase.name}: ${JSON.stringify(actual)}`);
  assertEqual(actual, testCase.expected, testCase.name);
}

globalThis.DOMParser = undefined;
Core.htmlParser = null;
assertEqual(
  Core.plainTextFromHtml('<b>raw</b>  text'),
  '<b>raw</b> text',
  'DOMParser-unavailable fallback preserves text without interpreting HTML'
);
globalThis.DOMParser = originalDOMParser;
Core.htmlParser = null;

console.log(`HTML-to-text check passed for ${version}.`);
