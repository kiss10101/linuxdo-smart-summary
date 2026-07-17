# Changelog

## 7.8.0-alpha.4

- Preserves the current summary and follow-up conversation when Linux.do navigates directly between topic routes without a full page reload, including browser back/forward navigation to the source topic.
- Tracks the workspace source topic, shows a visible source notice on a different topic, and asks for confirmation before a new summary replaces a non-empty workspace from another topic.
- Keeps an in-flight summary bound to the topic and floor range that started it even when SPA navigation changes the visible topic; stale callbacks cannot update a destroyed UI lifecycle.
- Invalidates topic-bound floor metadata on route changes and recalculates `all` or `recent` summary/export ranges before using them on the destination topic.
- Retains normal teardown when navigation leaves topic pages, without adding storage migrations, provider schema changes, or background Linux.do requests.
- Adds behavior-level route, replacement-confirmation, request-ownership, stale-range, accessibility, build, and release-route regression coverage.
- Adds this explicitly approved lifecycle-fix exception to `7.8.0-alpha.1 -> 7.8.0-alpha.2 -> 7.8.0-alpha.3 -> 7.8.0-alpha.4 -> 7.8.0-beta.1 -> 7.8.0`; beta remains compatibility/defect-only.

## 7.8.0-alpha.3

- Extends the shared `Explain`, `Simplify`, and `Quote to chat` selection toolbar to final-answer text in completed assistant replies while rejecting user messages, active or incomplete replies, reasoning, status text, source metadata, and cross-message selections.
- Wraps final answer Markdown in an explicit selectable allowlist so provider-returned reasoning remains isolated from selection actions, copied answers, and later model context.
- Adds a global `floatingMenuOpacity` display setting for the selected-answer and message-action menus, normalized to `80%`–`100%` with an accessible `88%` default and opaque compatibility fallbacks.
- Compacts the message action menu around its text labels while preserving keyboard navigation, 40px touch targets, danger styling, focus restoration, and viewport-edge clamping.
- Places summary and chat reading scrollbars consistently on the left through local RTL scroll shells while restoring LTR, bidi-isolated answer content, code, tables, and horizontal scrolling.
- Extends selection-containment, configuration-sync, menu-geometry, accessibility, scrollbar-direction, build, and release-route coverage for the new contracts.
- Adds this explicitly user-approved final feature gate to `7.8.0-alpha.1 -> 7.8.0-alpha.2 -> 7.8.0-alpha.3 -> 7.8.0-beta.1 -> 7.8.0`; beta remains compatibility/defect-only.

## 7.8.0-alpha.2

- Consolidates selected-summary actions into `Explain`, `Simplify`, and `Quote to chat`; quoting preserves the current draft and never sends automatically.
- Makes message actions state-aware: an active assistant reply exposes copy, regenerate, stop, and delete, while completed messages expose copy, regenerate, edit, and delete.
- Serializes stop, regenerate, and active-message deletion through the current request lifecycle so stale provider callbacks cannot restore removed output or overwrite a replacement reply.
- Keeps partial output visible after a user stop, marks it incomplete, and continues excluding service-returned reasoning from copied answers and later model context.
- Redesigns the default Style2 with independently implemented warm-neutral and steel-blue tokens, restrained surfaces, keyboard-accessible controls, reduced-motion handling, and a narrow-screen overlay fallback; Style1 remains the compatibility theme.
- Adds focused selection-action, message-state, abort-race, accessibility, responsive-layout, and release-route regression coverage.
- Establishes the default-UI gate later followed by the explicitly approved final `alpha.3` feature gate; beta remains compatibility-only.

## 7.8.0-alpha.1

- Migrates the maintainable implementation from one userscript file into 27 responsibility-oriented ES modules under `src/`, while continuing to publish one Tampermonkey-compatible file under `dist/`.
- Adds a deterministic esbuild pipeline, a committed lockfile, direct source-module tests, generated-output verification, and a source architecture gate.
- Moves legacy regression checks from bundle formatting assumptions to source behavior and module contracts.
- Makes model-list requests cancellable, enforces a 15-second timeout, and restores both model-fetch buttons after success, failure, timeout, modal close, or UI teardown.
- Escapes provider and topic-derived status text and normalizes export filenames before inserting them into UI or download paths.
- Establishes the modular migration baseline later followed by the `alpha.2` interaction/UI gate, the explicitly approved final `alpha.3` feature gate, compatibility-only `beta.1`, and stable `7.8.0` promotion.

## 7.7-alpha.9

- Separates provider-returned reasoning from answer content throughout streaming and non-streaming response handling instead of serializing reasoning into synthetic `<think>` markup.
- Adds a conservative compatibility parser for response-leading reasoning tags while preserving tag-shaped text in normal answers and code samples.
- Displays service-returned reasoning in an accessible collapsible panel, expands it while reasoning, and auto-collapses it when answer content starts unless the user has chosen a panel state.
- Preserves partial reasoning and answer output when generation is stopped, filtered, length-limited, or interrupted by an upstream error.
- Treats reasoning as untrusted model output: streams it as plain text, strictly sanitizes completed rendering, and forbids remote media in the reasoning panel.
- Adds structured reasoning, interleaved delta, split-tag, partial-output, accessibility, sanitization, and performance regression coverage.

## 7.7-alpha.8

- Routes AI-context HTML conversion through one inert-DOM text extraction path and removes the regex tag-stripping fallback from the active preview runtime.
- Adds malformed-markup, unsafe-element, and single-pass nested-entity regression fixtures for HTML-to-text conversion.
- Replaces fixed URL substring checks with parsed fixture URL policy enforcement covering hosts, HTTPS, credentials, sensitive Linux.do paths, synthetic IDs, and sensitive query keys.
- Preserves each main post and reply `created_at` value in summary and follow-up AI context as a normalized ISO 8601 UTC timestamp, without adding Linux.do requests.

## 7.7-alpha.7

- Publishes the first privacy-clean public repository snapshot without internal audit artifacts or live Linux.do topic snapshots.
- Replaces linkable forum fixture data with explicit synthetic identities, topic IDs, content, and reserved-domain avatar URLs.
- Pins marked, DOMPurify, and GitHub Actions dependencies to immutable versions, integrity hashes, or commit SHAs, and narrows release workflow permissions.

## 7.6.1

- Repackages the verified `7.6` runtime as the first privacy-clean public stable release.
- Pins marked and DOMPurify to immutable versions with integrity hashes without changing Linux.do request behavior or 7.6 runtime features.
- Uses synthetic fixtures and hardened release automation for the new public repository history.

## 7.7-alpha.6

- Makes the chat page fill the available content height and disables the outer content-area scrollbar while chat is active, so `chat-messages` becomes the only vertical scrolling container.
- Keeps the chat message container RTL only for native left-side scrollbar placement while restoring the separate jump controls to the right edge.
- Adds regression assertions for chat scroll ownership, flex shrink constraints, and tab-driven outer-scroll suppression.

## 7.7-alpha.5

- Moves the summary/chat jump-to-latest floating controls to the left edge so they align with the left-side reading scrollbars.
- Keeps the native left scrollbar layout from 7.7-alpha.4 and adds a little left padding so content does not sit under the scrollbar or controls.

## 7.7-alpha.4

- Rebinds cross-tab settings storage listeners after every UI rebuild so route/style recreation no longer loses remote settings sync.
- Tracks real settings edits with an explicit dirty key set instead of treating mere focus/activeElement as an in-progress edit, so idle focused fields no longer block remote sync.
- Adds a unified jump-to-latest control for both summary and chat content, and moves the main reading-area scrollbar to the left side for denser reading.

## 7.7-alpha.3

- Adds AI-only stop generation for summary and follow-up chat requests. The stop control aborts only the user-configured AI provider request and does not cancel Linux.do topic metadata or posts fetches.
- Captures an API profile snapshot when each AI request starts, then uses that same source information for success, empty-output, abort, and error UI instead of reading a later active profile.
- Syncs API profiles, prompts, recent-floor count, streaming, and autoscroll settings across open tabs through Tampermonkey storage listeners without triggering Linux.do, model-list, summary, export, or range refresh requests.
- Adds a local AI control/source/settings sync regression check and updates release verification to derive the README release line from release history instead of hard-coded 7.7 alpha assumptions.

## 7.7-alpha.2

- Shows upstream HTTP status, provider error code/type, and a short explanation when AI summary or chat requests fail.
- Detects stream error frames, non-JSON API responses, invalid response schemas, and `finish_reason` values such as `content_filter`, `length`, and unsupported tool-call output.
- Applies the same structured diagnostics to model list loading and prevents stale model list requests from overwriting newer picker state.
- Adds a local upstream error diagnostics regression check.

## 7.7-alpha.1

- Added topic JSON metadata prewarming on topic routes, route changes, and visible-page resume so range shortcuts can respond faster after initial page entry or long idle periods.
- Lets summary/export `all` and `recent` shortcuts optimistically fill from cached topic metadata while a no-store topic JSON confirmation remains the final source for `highest_post_number`.
- Reuses force in-flight topic metadata requests across prewarm, range initialization, and range shortcut clicks, reducing duplicate topic JSON requests without prefetching `posts.json`.
- Makes summary/export wait for pending range confirmation and cancels stale confirmation writes after manual range edits.
- Extended local range-refresh and runtime checks to cover prewarm throttling, hidden-page guards, confirmation state, and the no-posts prewarm boundary.

## 7.6

- Promoted the verified `7.6-alpha.6` preview line to stable `7.6`.
- Includes selected-summary quick actions, meaningful short selection triggers, throttled streaming/drag/scroll runtime paths, topic-page gated sidebar initialization, and large-range Linux.do request guards.
- Includes API configuration profiles with immediate card-based switching and persistence for edits, add, copy, and delete actions.
- Keeps all/recent summary and export range shortcuts on explicit topic metadata refreshes so highest floor detection does not depend on stale DOM timeline counts.
- Confirmed the 7.6 line has no release-blocking performance, hardware-cost, or Microsoft Edge `148.0.3967.96` compatibility issues in local/static audits.

## 7.6-alpha.6

- Forces the summary/export `all` and `recent` range shortcuts to refresh Linux.do topic metadata before filling the upper floor.
- Disables DOM timeline fallback for explicit range shortcuts and empty-end summary/export actions, so the script does not reuse stale visible timeline counts as the latest floor.
- Adds loading feedback and stale-request guards for range shortcut clicks, and rebuilds the sidebar when Linux.do switches between topic routes in the same SPA session.
- Changes API profile selection from a compact select box to clickable profile cards, with immediate persistence on switch, edit, add, copy, and delete.
- Added a local range-refresh regression check covering forced topic refresh, no-store fetches, in-flight de-duplication, range loading state, and topic-route rebuilds.

## 7.6-alpha.5

- Added selectable API configuration profiles inside the existing API settings group.
- Supports adding, copying, deleting, and switching API profiles while keeping prompt configuration and advanced settings in their existing layout.
- Migrates legacy `apiUrl`, `apiKey`, and `model` settings into a default profile and double-writes the legacy keys for rollback compatibility.
- Keeps model-list fetching tied to the currently edited API URL and key.
- Added a local API profile regression check covering storage shape, style1/style2 settings markup, active profile requests, and release metadata wiring.

## 7.6-alpha.4

- Removed the minimum selected-character threshold from the selected-summary quick action menu.
- Allows meaningful short selections, including one Chinese character, short Latin acronyms such as `AI`/`CF`, usernames, and floor references such as `7楼`.
- Keeps empty, whitespace-only, punctuation-only, symbol-only, and emoji-only selections ignored.
- Extended the summary-selection local fixture to cover short meaningful selections and reject future length-based gates.

## 7.6-alpha.3

- Stabilized the selected-summary quick action menu by cancelling stale delayed open timers before scheduling a new one.
- Added a request sequence guard so old selection work cannot reopen or close the menu after tab switches or repeated quick actions.
- Allows the selected-summary menu to open while follow-up chat is generating; actions still avoid starting a concurrent request and only fill the draft when needed.
- Adds a `finally` loading reset around follow-up chat requests so an exceptional path cannot leave the menu blocked by stale generating state.
- Clears the browser selection after applying a selected-summary action, preventing stale selection state from blocking later menu activation.
- Extended the summary-selection local fixture to assert the lifecycle guard wiring.

## 7.6-alpha.2

- Throttled streaming summary/chat rendering so incoming AI chunks are coalesced before Markdown parsing and DOM replacement.
- Gated sidebar initialization to Linux.do topic routes and kept non-topic pages on a lightweight SPA route bootstrap only.
- Throttled global mousemove/scroll handlers with managed animation-frame scheduling and cleaned pending timers/frames on UI destroy.
- Added a hard Linux.do posts request budget for large ranges, with a clear error asking users to split oversized summaries or exports.
- Added a local runtime-performance guard covering the four fixes above.

## 7.6-alpha.1

- Added quick actions for selected AI summary text: explain, ask, summarize, or insert into the follow-up chat.
- Keeps the feature in the sidebar UI layer and reuses the existing chat context, input, streaming, and error handling paths.
- Does not add Linux.do requests; quick actions only call the configured AI provider when the user sends an action.
- Added a local summary-selection fixture covering prompt generation, text normalization, truncation, and dist wiring.

## 7.5

- Promoted the verified `7.5-alpha.6` line to stable `7.5`.
- Kept the 7.5 series fixes for topic upper-bound detection, post-number range mapping, boosts, reply metadata, chat recovery, context-menu positioning, and Discourse quote attribution.
- Stopped the summary content cache cleanup timer when the current-tab cache becomes empty.
- Reused the HTML parser for repeated cooked-content text conversion to reduce small runtime allocations.

## 7.5-alpha.6

- Preserves Discourse quote attribution in AI summary context, including quoted username, topic ID, post number, title, and link.
- Marks cross-topic quotes as forwarded/cross-topic references so AI does not attribute quoted content to the current floor author.
- Adds a local regression fixture for Linux.do quoted topic links.

## 7.5-alpha.5

- Fixed right-click chat message menu positioning inside the transformed right sidebar.
- Anchored the context menu to sidebar-local coordinates so it stays visible on both left and right panels.
- Hardened delegated click/contextmenu handling against non-Element event targets.

## 7.5-alpha.4

- Reworked post-summary chat state so UI metadata is stripped before OpenAI-compatible API requests.
- Treats AI empty responses and thinking-only responses as recoverable chat errors instead of committing blank assistant turns.
- Added right-click message actions for follow-up chat: copy, edit, regenerate, and delete.
- Added a local chat message action check covering empty/thinking-only output, edit/delete/regenerate state transitions, and dist wiring.

## 7.5-alpha.3

- Fixed all/recent range shortcuts using the right-side timeline reply count as the floor upper bound.
- Switched summary and export range defaults to Discourse `highest_post_number` from topic JSON, with DOM count only as a fallback.
- Added a short-lived topic JSON cache so range setup, summary, and export can share the same topic payload instead of adding extra Linux.do requests.
- Added a local regression check for hidden/deleted floor gaps where visible counts are lower than the true highest floor.

## 7.5-alpha.2

- Added broader Linux.do/Discourse topic route parsing for `/t/<slug>/<id>`, `/t/-/<id>.json`, and `/topic/<id>`.
- Added a summary coverage report with requested range, visible post count, cache status, and bounded look-behind status.
- Kept reply relation and boost metadata in AI context without adding Linux.do requests.
- Preserved summary cache metadata on cache hits so AI empty/error retries can show the same coverage facts.
- Added local topic identity, cache metadata, check-all, and release consistency checks.

## 7.5-alpha.1

- Added Linux.do/Discourse boosts support using the existing `post.boosts` field from topic/post JSON payloads.
- Included boost metadata in AI summary context without adding Linux.do requests.
- Added boost sections to HTML export and AI text export.
- Escaped generated boost metadata in exported HTML.
- Added a local boosts formatting check.

## 7.4

- Promoted the verified `7.4-alpha.4` build to stable `7.4`.
- Kept safe `post.post_number` range mapping and bounded look-behind calibration.
- Kept 200-ID serial `posts.json` batches with a 600 ms batch start delay.
- Kept in-memory summary content caching for AI empty/error retries.

## 7.4-alpha.4

- Changed the normal Linux.do post batch policy to 200 post IDs per request, serial concurrency, and 600 ms batch start delay.
- Kept the 7.4 safe range mapping logic based on `post.post_number`; the old stream-index slice logic was not restored.
- Added in-memory summary content caching per topic/range/user key so AI empty/error retries do not re-fetch Linux.do floors.
- Added a sidebar action to force the next summary to re-fetch floor content.
- Added local checks for 200-ID batching and AI-failure cache reuse.

## 7.4-alpha.3

- Preserved Discourse reply relationship metadata in summary and exports.
- Added fallback text for replies whose target floor is deleted or invisible to the current session.
- Reused the same reply relation formatter for AI context, AI text export, and HTML export.
- Sanitized exported HTML post content before writing it into offline HTML files.
- Added local fixtures for visible, missing, and serialized reply target cases.
- Kept Linux.do request cadence unchanged; this release does not add parent-post fetches.

## 7.4-alpha.2

- Released the floor range mapping fix as an installable alpha build.
- Final post selection is now filtered by `post.post_number`, not by topic stream array index.
- Added bounded look-behind calibration for ranges affected by deleted or hidden floors.
- Kept the normal request path at the `7.3` small-batch cadence; fallback calibration is serial and slower.

## 7.4-alpha.1

- Started an isolated validation workspace for the floor range mapping audit.
- Based the alpha userscript on `7.3`.
- Added local fixtures and a range-mapping check tool for post number gaps.
- Implemented the first real range mapping fix before cutting `7.4-alpha.2`.

## 7.3

- Replaced very large `post_ids.json?limit=99999` fetching with topic stream plus small-batch posts fetching.
- Added a controlled request policy: batch size 40, concurrency 2, batch start delay 250 ms.
- Added basic Linux.do JSON response validation.

## 7.2

- Added model list retrieval in the sidebar model picker.
- Kept manual model name input.
- Fixed user chat input rendering by using `textContent` instead of direct `innerHTML`.
