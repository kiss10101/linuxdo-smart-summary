# Security Policy

## Supported Releases

Security fixes target the current stable release and the current preview release listed in `README.md`.

## Reporting A Vulnerability

Use GitHub's private vulnerability reporting feature from the repository Security tab. Do not open a public issue for an unpatched vulnerability.

Do not include real API keys, cookies, session tokens, Cloudflare clearance values, private Linux.do exports, or restricted topic snapshots in a report. Replace identities, topic IDs, URLs, and post content with synthetic examples whenever the original data is not required to reproduce the defect.

## Data Boundary

The userscript reads Linux.do content through the active browser session and sends selected summary or chat context only to the AI provider configured by the user. That context includes the `created_at` timestamp for each included post. It does not send browser cookies to that provider and does not download and re-upload image binaries. Extracted image or attachment URLs may be included as text, and a provider may independently fetch a URL when that URL is reachable without the user's browser session.

Repository fixtures must use synthetic identities and topic IDs. Reserved domains such as `example.invalid` are used for non-live URLs.

## Implementation Safeguards

- The current preview converts Discourse cooked HTML to AI-context text with an inert `DOMParser` document, removes `script`, `style`, `iframe`, `object`, and `embed` nodes, and reads only `textContent`. If `DOMParser` is unavailable, the fallback preserves the source as uninterpreted text instead of attempting regex-based HTML filtering.
- The public-repository gate recursively inspects JSON fixture strings, extracts real `src`/`href` attributes and URL-shaped references, parses them with `URL`, and enforces HTTPS, credential-free URLs, reserved synthetic hosts, synthetic Linux.do identities/IDs, and sensitive path/query rejection.
- Versioned `dist/` assets are immutable release artifacts. Security changes are published as new versions rather than rewriting an existing version or tag.
