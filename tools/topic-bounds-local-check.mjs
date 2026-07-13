#!/usr/bin/env node

import { readFile } from 'node:fs/promises';

const fixturePath = process.argv[2] || 'fixtures/topic-bounds.fixture.json';
const fixture = JSON.parse(await readFile(fixturePath, 'utf8'));

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function getHighestPostNumber(topicData) {
  const highestFromTopic = Number(topicData?.highest_post_number);
  if (Number.isFinite(highestFromTopic) && highestFromTopic > 0) return highestFromTopic;

  const posts = Array.isArray(topicData?.post_stream?.posts) ? topicData.post_stream.posts : [];
  const postNumbers = posts
    .map((post) => Number(post?.post_number))
    .filter(Number.isFinite);
  return postNumbers.length > 0 ? Math.max(...postNumbers) : 0;
}

function getRange(type, highestPostNumber, recentFloors) {
  if (!highestPostNumber) return null;
  return {
    start: type === 'all' ? 1 : Math.max(1, highestPostNumber - recentFloors + 1),
    end: highestPostNumber
  };
}

function filterPosts(topicData, start, end) {
  return topicData.post_stream.posts
    .filter((post) => post.post_number >= start && post.post_number <= end)
    .map((post) => post.post_number);
}

const oldAllRange = getRange('all', fixture.timelineReplies, fixture.recentFloors);
const highestPostNumber = getHighestPostNumber(fixture.topicData);
const newAllRange = getRange('all', highestPostNumber, fixture.recentFloors);
const newRecentRange = getRange('recent', highestPostNumber, fixture.recentFloors);

assert(oldAllRange.end === 8, 'fixture should reproduce old timeline-count upper bound');
assert(highestPostNumber === 9, 'highest_post_number should be treated as true floor upper bound');
assert(newAllRange.start === 1 && newAllRange.end === 9, 'all range should end at true highest floor');
assert(newRecentRange.start === 5 && newRecentRange.end === 9, 'recent range should be based on true floor numbers');
assert(!filterPosts(fixture.topicData, oldAllRange.start, oldAllRange.end).includes(9), 'old range should miss floor 9');
assert(filterPosts(fixture.topicData, newAllRange.start, newAllRange.end).includes(9), 'new range should include floor 9');

console.log('Topic bounds local check passed.');
