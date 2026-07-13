#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

function same(a, b) {
  return a === b;
}

function escapeHtml(text) {
  return `${text ?? ''}`
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function createPostsByPostNumber(posts) {
  const map = new Map();
  for (const post of posts || []) {
    const postNumber = Number(post?.post_number);
    if (Number.isFinite(postNumber) && !map.has(postNumber)) {
      map.set(postNumber, post);
    }
  }
  return map;
}

function getReplyRelation(post, postsByPostNumber = null) {
  const replyToPostNumber = Number(post?.reply_to_post_number);
  if (!Number.isFinite(replyToPostNumber) || replyToPostNumber <= 0) {
    return null;
  }

  const replyToUser = post?.reply_to_user;
  const localReplyPost = postsByPostNumber?.get(replyToPostNumber);
  const hasReplyToUser = Boolean(replyToUser?.name || replyToUser?.username);
  const replyUser = hasReplyToUser ? replyToUser : (localReplyPost || null);

  if (replyUser) {
    return {
      postNumber: replyToPostNumber,
      available: true,
      inCurrentRange: Boolean(localReplyPost),
      name: replyUser.name || replyUser.username || '',
      username: replyUser.username || ''
    };
  }

  return {
    postNumber: replyToPostNumber,
    available: false,
    inCurrentRange: false,
    name: '',
    username: ''
  };
}

function formatReplyRelationInline(post, postsByPostNumber = null) {
  const relation = getReplyRelation(post, postsByPostNumber);
  if (!relation) return '';

  if (!relation.available) {
    return `-回复[${relation.postNumber}楼]（原帖已删除或不可见）`;
  }

  const userPart = relation.name || relation.username
    ? ` ${relation.name || relation.username}${relation.username ? `（${relation.username}）` : ''}`
    : '';
  return `-回复[${relation.postNumber}楼]${userPart}`;
}

function formatReplyRelationLine(post, postsByPostNumber = null) {
  const relation = getReplyRelation(post, postsByPostNumber);
  if (!relation) return '';

  if (!relation.available) {
    return `回复: [${relation.postNumber}楼]（原帖已删除或不可见）`;
  }

  const userPart = relation.name || relation.username
    ? ` ${relation.name || relation.username}${relation.username ? `（@${relation.username}）` : ''}`
    : '';
  return `回复: [${relation.postNumber}楼]${userPart}`;
}

function formatReplyRelationHtml(post, postsByPostNumber = null) {
  const relation = getReplyRelation(post, postsByPostNumber);
  if (!relation) return '';

  const target = `回复 #${relation.postNumber}`;
  if (!relation.available) {
    return `<span class="reply-relation reply-relation-missing">${escapeHtml(`${target}（原帖已删除或不可见）`)}</span>`;
  }

  const userPart = relation.name || relation.username
    ? ` ${relation.name || relation.username}${relation.username ? `（@${relation.username}）` : ''}`
    : '';
  const text = escapeHtml(`${target}${userPart}`);
  if (relation.inCurrentRange) {
    return `<a class="reply-relation" href="#post-${relation.postNumber}">${text}</a>`;
  }
  return `<span class="reply-relation">${text}</span>`;
}

function formatAiTextHeader(post, postsByPostNumber = null) {
  const userName = post.name || post.username;
  const username = post.username;
  const inline = formatReplyRelationInline(post, postsByPostNumber);
  return `[${post.post_number}楼] ${userName}（@${username}）${inline}`;
}

const fixturePath = process.argv[2] || 'fixtures/reply-relation.fixture.json';
const absoluteFixturePath = resolve(process.cwd(), fixturePath);
const fixture = JSON.parse(await readFile(absoluteFixturePath, 'utf8'));
const postsByPostNumber = createPostsByPostNumber(fixture.posts);

let failed = 0;
console.log(`Fixture: ${fixture.name || fixturePath}`);

for (const testCase of fixture.cases) {
  const post = postsByPostNumber.get(testCase.postNumber);
  if (!post) {
    failed += 1;
    console.log(`post ${testCase.postNumber}: FAIL - post not found`);
    continue;
  }

  const inline = formatReplyRelationInline(post, postsByPostNumber);
  const line = formatReplyRelationLine(post, postsByPostNumber);
  const html = formatReplyRelationHtml(post, postsByPostNumber);
  const aiTextHeader = formatAiTextHeader(post, postsByPostNumber);
  const htmlMatches = testCase.expectedHtmlContains
    ? html.includes(testCase.expectedHtmlContains)
    : html === '';

  console.log(`post ${testCase.postNumber}`);
  console.log(`  inline: ${JSON.stringify(inline)}`);
  console.log(`  line:   ${JSON.stringify(line)}`);
  console.log(`  header: ${JSON.stringify(aiTextHeader)}`);
  console.log(`  html:   ${JSON.stringify(html)}`);

  if (!same(inline, testCase.expectedInline)
    || !same(line, testCase.expectedLine)
    || !same(aiTextHeader, testCase.expectedAiTextHeader)
    || !htmlMatches) {
    failed += 1;
    console.log('  result: FAIL');
  } else {
    console.log('  result: PASS');
  }
}

if (failed > 0) {
  process.exitCode = 1;
} else {
  console.log('All reply relation cases passed.');
}
