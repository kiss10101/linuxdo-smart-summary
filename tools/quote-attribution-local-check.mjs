#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const fixturePath = process.argv[2] || 'fixtures/quote-attribution.fixture.json';

function decodeEntities(str) {
  return String(str ?? '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number.parseInt(dec, 10)));
}

function normalizePlainText(text) {
  return String(text ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([,.!?;:，。！？；：])/g, '$1')
    .trim();
}

function plainTextFromHtml(html) {
  const withoutUnsafeBlocks = String(html ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, ' ')
    .replace(/<object[\s\S]*?<\/object>/gi, ' ')
    .replace(/<embed[\s\S]*?>/gi, ' ');
  return normalizePlainText(decodeEntities(withoutUnsafeBlocks.replace(/<[^>]+>/g, ' ')));
}

function absoluteUrl(src) {
  if (!src) return '';
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  if (src.startsWith('//')) return `https:${src}`;
  if (src.startsWith('/')) return `https://linux.do${src}`;
  return `https://linux.do/${src.replace(/^\.?\//, '')}`;
}

function getHtmlAttribute(html, attrName) {
  const escapedName = String(attrName).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = String(html ?? '').match(new RegExp(`\\s${escapedName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return decodeEntities(match?.[1] || match?.[2] || match?.[3] || '').trim();
}

function extractFirstLinkInfo(html) {
  const match = String(html ?? '').match(/<a\b[^>]*href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/i);
  if (!match) return { href: '', text: '' };
  const href = decodeEntities(match[1] || match[2] || match[3] || '').trim();
  return {
    href: href ? absoluteUrl(href) : '',
    text: plainTextFromHtml(match[4] || '')
  };
}

function formatDiscourseQuoteForAiText(asideHtml, quoteInner, sourcePost = null) {
  const username = getHtmlAttribute(asideHtml, 'data-username');
  const quotedTopic = getHtmlAttribute(asideHtml, 'data-topic');
  const quotedPost = getHtmlAttribute(asideHtml, 'data-post');
  const link = extractFirstLinkInfo(asideHtml);
  const quoteText = plainTextFromHtml(quoteInner);
  const sourceTopic = sourcePost?.topic_id ?? sourcePost?.topicId ?? '';
  const hasTopicContext = quotedTopic && sourceTopic;
  const quoteLabel = hasTopicContext && String(quotedTopic) !== String(sourceTopic)
    ? '跨主题引用/转发'
    : quotedTopic && !sourceTopic
      ? '引用/转发'
      : '引用';

  const sourceParts = [];
  if (username) sourceParts.push(`@${username}`);
  if (link.text) sourceParts.push(`《${link.text}》`);
  if (quotedTopic || quotedPost) {
    const location = [
      quotedTopic ? `topic ${quotedTopic}` : '',
      quotedPost ? `#${quotedPost}` : ''
    ].filter(Boolean).join(' ');
    if (location) sourceParts.push(location);
  }
  if (link.href) sourceParts.push(`链接 ${link.href}`);

  const header = sourceParts.length ? `${quoteLabel}: ${sourceParts.join('，')}` : quoteLabel;
  return `\n[${header}]\n${quoteText}\n[/${quoteLabel}]\n`;
}

function formatPostForAiContext(post) {
  let content = post.cooked;
  content = content.replace(/<aside\b(?=[^>]*\bclass=["'][^"']*\bquote(?:-modified)?\b)[^>]*>[\s\S]*?<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>[\s\S]*?<\/aside>/gi, (match, quoteInner) => {
    return formatDiscourseQuoteForAiText(match, quoteInner, post);
  });
  content = plainTextFromHtml(content);
  const userName = post.name || post.username;
  return `[${post.post_number}楼] ${userName}（${post.username}）:\n${content}`;
}

function assertContains(text, fragment, label) {
  if (!text.includes(fragment)) throw new Error(`${label}: missing ${JSON.stringify(fragment)}`);
}

function assertNotContains(text, fragment, label) {
  if (text.includes(fragment)) throw new Error(`${label}: forbidden ${JSON.stringify(fragment)}`);
}

const fixture = JSON.parse(await readFile(resolve(process.cwd(), fixturePath), 'utf8'));
const output = formatPostForAiContext(fixture.post);

console.log(`Fixture: ${fixture.name}`);
console.log(output);

for (const fragment of fixture.expectedContains || []) {
  assertContains(output, fragment, fixture.name);
}

for (const fragment of fixture.forbiddenContains || []) {
  assertNotContains(output, fragment, fixture.name);
}

console.log('All quote attribution cases passed.');
