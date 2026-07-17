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
  <a href="https://github.com/kiss10101/linuxdo-smart-summary/releases/download/v7.8.0-alpha.3/linuxdo-smart-summary-7.8.0-alpha.3.user.js">Preview 7.8.0-alpha.3</a> ·
  <a href="https://github.com/kiss10101/linuxdo-smart-summary/releases">Releases</a> ·
  <a href="./CHANGELOG.md">Changelog</a>
</p>

<p align="center">
  <img alt="stable" src="https://img.shields.io/badge/stable-7.6.1-2563eb">
  <img alt="preview" src="https://img.shields.io/badge/preview-7.8.0--alpha.3-f59e0b">
  <img alt="platform" src="https://img.shields.io/badge/platform-linux.do-16a34a">
  <img alt="license" src="https://img.shields.io/badge/license-MIT-64748b">
</p>

## What This Is

`Linux.do Smart Summary` is a browser userscript that helps summarize Linux.do
topics, export topic content, and continue follow-up conversations with an
OpenAI-compatible model provider configured by the user.

This repository is the public release workspace. Maintainable ES modules live
under `src/`; deterministic tooling bundles them into one installable userscript
under `dist/`. Synthetic fixtures and direct source tests live under `fixtures/`
and `tests/`.

## Release Channels

| Channel | Version | Use when | Notes |
| --- | --- | --- | --- |
| Stable | `7.6.1` | You want the safest install target | Repackages the verified `7.6` runtime with pinned marked/DOMPurify dependencies and privacy-clean public fixtures |
| Preview | `7.8.0-alpha.3` | You want the final interaction preview before beta | Extends the answer-only selection toolbar to completed AI replies, adds adjustable floating-menu opacity, compacts message actions, and consistently places summary/chat reading scrollbars on the left |

Release line:

```text
7.8.0-alpha.1 -> 7.8.0-alpha.2 -> 7.8.0-alpha.3 -> 7.8.0-beta.1 -> 7.8.0
```

GitHub marks the latest non-prerelease as `Latest`; stable `7.6.1` remains the
default install target while `7.8.0-alpha.3` is the current prerelease preview.
`alpha.3` is the final feature gate added with explicit user approval after the
modular and default-UI alphas. After it, `beta.1` is compatibility/defect-only and
`7.8.0` is the stable promotion; no further feature alpha is planned.
Historical `7.7` entries remain in the changelog for auditability, not as
additional migration stops.

## Core Behavior

| Area | Current behavior |
| --- | --- |
| Floor range mapping | Uses `post.post_number`; range shortcuts can prefill from cached topic metadata but still confirm all/recent with no-store topic `highest_post_number` |
| Linux.do request cadence | Fetches posts in serial `posts.json` batches |
| Large range guard | Stops oversized summary/export ranges before unbounded `posts.json` batch growth |
| Runtime scheduling | Coalesces streaming Markdown renders and throttles high-frequency drag/scroll handlers |
| Topic-page bootstrap | Creates the sidebar only on Linux.do topic routes, with a lightweight SPA route watcher elsewhere |
| AI retry path | Reuses current-tab summary text after AI empty/error responses |
| Follow-up chat | Keeps UI metadata and service-returned reasoning out of API payloads; message actions adapt to completed, active, stopped, and failed states, with guarded stop/regenerate/delete handling for the active reply |
| Reasoning display | Keeps structured provider reasoning separate from answer text, supports conservative response-leading tag compatibility, uses an accessible collapsible panel, and preserves partial output on stop, filtering, length limits, or upstream failure |
| Upstream error diagnostics | Shows HTTP status, provider error code/type, non-JSON response hints, SSE error frames, and `finish_reason` explanations without exposing API keys |
| AI control and source | Stops only the active AI provider request, keeps Linux.do fetches uncancelled, and displays the API profile snapshot used by each AI request |
| Settings sync | Applies remote Tampermonkey setting changes to the current tab's settings UI and chat prompt memory without triggering topic, range, summary, export, or model-list requests |
| Answer selection | Selected final-answer text in the summary or a completed AI reply offers explain, simplify, and quote-to-chat actions; reasoning, status, and source metadata remain outside the selectable answer boundary, and quote-to-chat never sends automatically |
| Floating menus | Selection and message-action menus use an adjustable `80%`–`100%` surface opacity (default `88%`) without changing modal, toast, tooltip, or sidebar opacity |
| Reading scrollbars | Summary and chat reading scrollbars stay on the left through local scroll shells while answer text, code, tables, and horizontal scrolling retain their normal direction |
| Default UI | Style2 uses a restrained warm-neutral and steel-blue system with keyboard-accessible controls, reduced-motion support, and a narrow-screen overlay fallback; Style1 remains available as the compatibility theme |
| Reply metadata | Keeps replied-to floor context, including deleted or invisible targets |
| Quote attribution | Preserves quoted/forwarded Discourse link source user, topic, post number, title, and URL in AI context |
| HTML-to-text safety | Converts cooked post HTML through an inert DOM, removes non-content embedded elements, and reads text without regex tag stripping |
| Post timestamps | Preserves each main post and reply `created_at` value in summary/follow-up AI context as ISO 8601 UTC; HTML and AI-text exports continue to include post times |
| Boosts | Reads boosts from existing Discourse JSON payloads |
| Summary coverage | Shows requested range, true topic upper bound, visible post count, cache status, and look-behind status |
| Export | Exports the explicitly fetched post set as HTML or AI-readable text |
| Model picker | Disables both fetch controls only while its provider request is active; close, timeout (15 seconds), success, failure, and UI teardown all cancel or restore the controls |
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
| `src/` | Maintainable ES modules and userscript metadata template |
| `dist/` | Installable userscript builds |
| `tests/` | Direct source-module and lifecycle tests |
| `tools/` | Local checks and release helpers |
| `fixtures/` | Deterministic synthetic test data |
| `.github/` | Release workflow and repository automation |
| `package.json` | Reproducible build and verification entry points |

## Verification

Install the locked toolchain, build the one-file userscript, and run every
source, behavior, architecture, privacy, and release check:

```bash
npm ci
npm run build
npm run verify
node --check "dist/Linux.do 智能总结-7.8.0-alpha.3.user.js"
node tools/verify-release.mjs 7.8.0-alpha.3
node tools/check-all.mjs 7.8.0-alpha.3
```

`dist/` is generated. Make changes in `src/`, run `npm run build`, and commit the
matching source and generated userscript together. `npm run verify` fails when
the generated file is stale or nondeterministic.

## Release Automation

GitHub Releases are published by `.github/workflows/release.yml`.

- Pull requests and `master` pushes run the read-only `CI` workflow.
- Push a new tag like `v7.8.0-alpha.3` to trigger an automatic release.
- Use the manual `Release` workflow with input `7.8.0-alpha.3` to publish or repair an existing tag release.
- A normal `master` push does not publish a release; the release job is tag/manual only.
- The workflow installs from `package-lock.json`, rebuilds `dist/`, rejects generated drift, runs the complete verification suite, and uploads the manifest-selected asset with GitHub Actions' `GITHUB_TOKEN`.

## Privacy And Safety

Do not commit real API keys, browser cookies, session tokens, Cloudflare
clearance values, exported topic artifacts, live user avatars, restricted topic
snapshots, or machine-specific local paths. Repository fixtures use synthetic
identities and topic IDs, with reserved URLs such as `example.invalid`.

Runtime settings stay in the user's browser extension storage. The configured
API key is sent only to the provider endpoint selected by the user. Linux.do
content is sent to that provider only when the user triggers summarization or
follow-up chat; this can include content visible through the user's account and
the `created_at` timestamp attached to each included post.

The userscript sends extracted text and image or attachment URLs. It does not
send browser cookies to the AI provider and does not download and re-upload
image binaries. A provider may independently fetch a URL when that URL is
reachable without the user's browser session.

Provider-returned reasoning and answer fields are treated as untrusted model
output. Reasoning is escaped as plain text while streaming and is strictly
sanitized before completed Markdown rendering; remote media and active embedded
content are forbidden in the reasoning panel. UI labels call this
service-returned reasoning or a reasoning summary and do not claim that it is a
model's complete or authentic private chain of thought.

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
