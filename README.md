# Linux.do Smart Summary

<p align="center">
  <strong>A public Tampermonkey userscript for Linux.do topic summarization, export, and follow-up chat.</strong>
</p>

<p align="center">
  <a href="./README.md">English</a> ·
  <a href="./README.zh-CN.md">简体中文</a>
</p>

<p align="center">
  <a href="https://github.com/kiss10101/linuxdo-smart-summary/releases/download/v7.6.1/linuxdo-smart-summary-7.6.1.user.js">Install stable 7.6.1</a> ·
  <a href="https://github.com/kiss10101/linuxdo-smart-summary/releases/download/v7.7-alpha.7/linuxdo-smart-summary-7.7-alpha.7.user.js">Preview 7.7-alpha.7</a> ·
  <a href="https://github.com/kiss10101/linuxdo-smart-summary/releases">Releases</a> ·
  <a href="./CHANGELOG.md">Changelog</a>
</p>

<p align="center">
  <img alt="stable" src="https://img.shields.io/badge/stable-7.6.1-2563eb">
  <img alt="preview" src="https://img.shields.io/badge/preview-7.7--alpha.7-f59e0b">
  <img alt="platform" src="https://img.shields.io/badge/platform-linux.do-16a34a">
  <img alt="license" src="https://img.shields.io/badge/license-MIT-64748b">
</p>

## What This Is

`Linux.do Smart Summary` is a browser userscript that helps summarize Linux.do
topics, export topic content, and continue follow-up conversations with an
OpenAI-compatible model provider configured by the user.

This repository is the public release workspace. It keeps installable builds
under `dist/`, deterministic local checks under `tools/`, and synthetic test
data under `fixtures/`.

## Release Channels

| Channel | Version | Use when | Notes |
| --- | --- | --- | --- |
| Stable | `7.6.1` | You want the safest install target | Repackages the verified `7.6` runtime with pinned marked/DOMPurify dependencies and privacy-clean public fixtures |
| Preview | `7.7-alpha.7` | You want the privacy-clean public build | Replaces live fixture data with synthetic examples and pins runtime/release dependencies without changing Linux.do request behavior |

Release line:

```text
7.6.1 -> 7.7-alpha.7
```

GitHub marks the latest non-prerelease as `Latest`; stable `7.6.1` remains the
default install target while `7.7-alpha.7` is the current prerelease preview.

The public Git history starts from a privacy-clean `7.6.1` stable baseline and
then continues with `7.7-alpha.7`. Earlier development commits and prerelease
tags remain in the private archive; their release semantics are retained here
in the changelog without importing the private history.

## Core Behavior

| Area | Current behavior |
| --- | --- |
| Floor range mapping | Uses `post.post_number`; range shortcuts can prefill from cached topic metadata but still confirm all/recent with no-store topic `highest_post_number` |
| Linux.do request cadence | Fetches posts in serial `posts.json` batches |
| Large range guard | Stops oversized summary/export ranges before unbounded `posts.json` batch growth |
| Runtime scheduling | Coalesces streaming Markdown renders and throttles high-frequency drag/scroll handlers |
| Topic-page bootstrap | Creates the sidebar only on Linux.do topic routes, with a lightweight SPA route watcher elsewhere |
| AI retry path | Reuses current-tab summary text after AI empty/error responses |
| Follow-up chat | Keeps UI metadata out of API payloads, treats AI empty/thinking-only replies as recoverable errors, and supports right-click copy/edit/regenerate/delete |
| Upstream error diagnostics | Shows HTTP status, provider error code/type, non-JSON response hints, SSE error frames, and `finish_reason` explanations without exposing API keys |
| AI control and source | Stops only the active AI provider request, keeps Linux.do fetches uncancelled, and displays the API profile snapshot used by each AI request |
| Settings sync | Applies remote Tampermonkey setting changes to the current tab's settings UI and chat prompt memory without triggering topic, range, summary, export, or model-list requests |
| Summary selection | Selected summary text can be sent to follow-up chat for explain, ask, summarize, or insert actions |
| Reply metadata | Keeps replied-to floor context, including deleted or invisible targets |
| Quote attribution | Preserves quoted/forwarded Discourse link source user, topic, post number, title, and URL in AI context |
| Boosts | Reads boosts from existing Discourse JSON payloads |
| Summary coverage | Shows requested range, true topic upper bound, visible post count, cache status, and look-behind status |
| Export | Exports the explicitly fetched post set as HTML or AI-readable text |
| Model picker | Fetches model names from the user-configured OpenAI-compatible API |
| API profiles | Clickable profile cards switch immediately and persist edits/add/copy/delete actions |

## Network Model

Linux.do requests run in the browser page context with the active user session
and same-origin credentials. The script does not use a separate crawler session
or try to bypass Cloudflare.

| Purpose | Request |
| --- | --- |
| Topic metadata | `GET https://linux.do/t/-/{topicId}.json` |
| Post batches | `GET https://linux.do/t/{topicId}/posts.json?post_ids[]=...` |
| Model list | User-configured `{apiUrl}/models`, not Linux.do |
| AI chat | User-configured OpenAI-compatible chat completion endpoint |

Normal Linux.do post-fetch policy:

| Setting | Value |
| --- | --- |
| Batch size | `200` post IDs |
| Concurrency | `1` |
| Batch start delay | `600ms` |

Bounded fallback calibration:

| Setting | Value |
| --- | --- |
| Concurrency | `1` |
| Batch delay | `600ms` |
| Look-behind step | `40` stream IDs |
| Maximum look-behind | `240` stream IDs |

The short-lived summary content cache is intentionally limited to the AI retry
path. A separate 60-second topic JSON cache is used only to share the topic
metadata request between range setup, summary, and export; neither cache is a
persistent topic database.

## Repository Layout

| Path | Purpose |
| --- | --- |
| `dist/` | Installable userscript builds |
| `tools/` | Local checks and release helpers |
| `fixtures/` | Deterministic synthetic test data |
| `.github/` | Release workflow and repository automation |

## Verification

Run from the repository root:

```bash
node --check "dist/Linux.do 智能总结-7.6.1.user.js"
node --check "dist/Linux.do 智能总结-7.7-alpha.7.user.js"
node --check tools/range-mapping-local-check.mjs
node --check tools/reply-relation-local-check.mjs
node --check tools/fetch-posts-batch-local-check.mjs
node --check tools/summary-content-cache-local-check.mjs
node --check tools/chat-message-actions-local-check.mjs
node --check tools/ai-upstream-errors-local-check.mjs
node --check tools/ai-control-source-sync-local-check.mjs
node --check tools/api-profiles-local-check.mjs
node --check tools/range-refresh-local-check.mjs
node --check tools/summary-selection-local-check.mjs
node --check tools/runtime-performance-local-check.mjs
node --check tools/quote-attribution-local-check.mjs
node --check tools/boosts-local-check.mjs
node --check tools/topic-identity-local-check.mjs
node --check tools/topic-bounds-local-check.mjs
node --check tools/public-repository-local-check.mjs
node --check tools/verify-release.mjs
node --check tools/check-all.mjs

node tools/range-mapping-local-check.mjs fixtures/post-stream-gap.fixture.json
node tools/reply-relation-local-check.mjs fixtures/reply-relation.fixture.json
node tools/fetch-posts-batch-local-check.mjs fixtures/fetch-posts-batch.fixture.json
node tools/summary-content-cache-local-check.mjs fixtures/summary-content-cache.fixture.json
node tools/chat-message-actions-local-check.mjs fixtures/chat-message-actions.fixture.json 7.7-alpha.7
node tools/ai-upstream-errors-local-check.mjs 7.7-alpha.7
node tools/ai-control-source-sync-local-check.mjs 7.7-alpha.7
node tools/api-profiles-local-check.mjs 7.7-alpha.7
node tools/range-refresh-local-check.mjs 7.7-alpha.7
node tools/summary-selection-local-check.mjs fixtures/summary-selection.fixture.json 7.7-alpha.7
node tools/runtime-performance-local-check.mjs 7.7-alpha.7
node tools/quote-attribution-local-check.mjs fixtures/quote-attribution.fixture.json
node tools/boosts-local-check.mjs fixtures/boosts.fixture.json
node tools/topic-identity-local-check.mjs fixtures/topic-identity.fixture.json
node tools/topic-bounds-local-check.mjs fixtures/topic-bounds.fixture.json
node tools/public-repository-local-check.mjs 7.7-alpha.7
node tools/verify-release.mjs 7.7-alpha.7
node tools/check-all.mjs 7.7-alpha.7
```

Expected fixture output:

```text
All cases passed. Old slice mismatches demonstrated: 4
All reply relation cases passed.
All fetch batch cases passed.
All summary content cache cases passed.
All chat message action cases passed.
AI upstream errors check passed for 7.7-alpha.7.
AI control/source/settings sync check passed for 7.7-alpha.7.
API profiles check passed for 7.7-alpha.7.
Range refresh check passed for 7.7-alpha.7.
All summary selection cases passed.
Runtime performance check passed for 7.7-alpha.7.
All quote attribution cases passed.
All boost formatting cases passed.
All topic identity cases passed.
Topic bounds local check passed.
Public repository check passed for 7.7-alpha.7.
Release verification passed for 7.7-alpha.7.
All local checks passed.
```

## Release Automation

GitHub Releases are published by `.github/workflows/release.yml`.

- Push a new tag like `v7.7-alpha.7` to trigger an automatic release.
- Use the manual `Release` workflow with input `7.7-alpha.7` to publish or repair an existing tag release.
- A normal `master` push does not publish a release; the release job is tag/manual only.
- The workflow runs `node tools/check-all.mjs <version>`, prepares a renamed asset from `release-manifest.json`, and uploads it with GitHub Actions' `GITHUB_TOKEN`.

## Privacy And Safety

Do not commit real API keys, browser cookies, session tokens, Cloudflare
clearance values, exported topic artifacts, live user avatars, restricted topic
snapshots, or machine-specific local paths. Repository fixtures use synthetic
identities and topic IDs, with reserved URLs such as `example.invalid`.

Runtime settings stay in the user's browser extension storage. The configured
API key is sent only to the provider endpoint selected by the user. Linux.do
content is sent to that provider only when the user triggers summarization or
follow-up chat; this can include content visible through the user's account.

The userscript sends extracted text and image or attachment URLs. It does not
send browser cookies to the AI provider and does not download and re-upload
image binaries. A provider may independently fetch a URL when that URL is
reachable without the user's browser session.

See `SECURITY.md` for private vulnerability reporting and repository data rules.

## Attribution

This project is based on the GreasyFork userscript:

- Page: <https://greasyfork.org/zh-CN/scripts/558028-linux-do-%E6%99%BA%E8%83%BD%E6%80%BB%E7%BB%93>
- Publisher: `Passerby1011`
- Original metadata author: `半杯无糖、WolfHolo、LD Export`
- Original license: `MIT`

The distributed userscript keeps the original `@author` and `@license`
metadata and records local release changes in the userscript update summary
block.
