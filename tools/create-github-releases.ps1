param(
    [string]$Version = "7.8.0-beta.1",
    [switch]$All,
    [switch]$SkipVerify
)

$ErrorActionPreference = "Stop"

$repo = "kiss10101/linuxdo-smart-summary"
$releases = @(
    @{
        Tag          = "v7.8.0-beta.1"
        Name         = "v7.8.0-beta.1"
        AssetPattern = "*7.8.0-beta.1.user.js"
        AssetName    = "linuxdo-smart-summary-7.8.0-beta.1.user.js"
        Prerelease   = $true
        Body         = @"
7.8.0-beta.1 compatibility and resource-use closure preview.

- Keeps the completed 7.8 alpha feature set without adding settings, provider schemas, or background Linux.do requests.
- Reduces streaming work with lightweight previews, adaptive render cadence, direct active-message updates, and coalesced scrolling.
- Tightens IME, visual-viewport, model-picker focus, and teardown behavior across browser lifecycle paths.
- Bounds topic caches and offline image embedding by count, bytes, timeout, and cancellation while preserving remote URLs when an image cannot be embedded.
- Adds focused lifecycle, abort-race, resource-budget, accessibility, build, and release regression coverage.
"@
    },
    @{
        Tag          = "v7.8.0-alpha.4"
        Name         = "v7.8.0-alpha.4"
        AssetPattern = "*7.8.0-alpha.4.user.js"
        AssetName    = "linuxdo-smart-summary-7.8.0-alpha.4.user.js"
        Prerelease   = $true
        Body         = @"
7.8.0-alpha.4 SPA workspace-lifecycle correction preview.

- Preserves the active summary and follow-up conversation across direct Linux.do topic-to-topic navigation, including browser back and forward.
- Shows the retained workspace source and confirms before a summary on another topic replaces it.
- Keeps in-flight summaries bound to their source topic and rejects stale callbacks after UI teardown.
- Recalculates automatic summary and export ranges for the destination topic while retaining normal teardown outside topic routes.
- Adds focused route, replacement, request-ownership, range-lifecycle, accessibility, and release regression coverage.
"@
    },
    @{
        Tag          = "v7.8.0-alpha.3"
        Name         = "v7.8.0-alpha.3"
        AssetPattern = "*7.8.0-alpha.3.user.js"
        AssetName    = "linuxdo-smart-summary-7.8.0-alpha.3.user.js"
        Prerelease   = $true
        Body         = @"
7.8.0-alpha.3 selected-answer actions and floating-menu refinement preview.

- Enables explain, simplify, and quote-to-chat actions for completed AI answer selections while excluding reasoning, streaming, incomplete, error, and cross-message ranges.
- Adds a saved 80-100% floating-menu opacity preference with accessible blur fallbacks for selection and message menus.
- Compacts the message action menu and moves summary, chat, and reasoning scrollbars to the left without changing document text direction.
- Preserves strict separation between provider reasoning and final answer content.
- Completes the feature scope before compatibility-only 7.8.0-beta.1 validation.
"@
    },
    @{
        Tag          = "v7.8.0-alpha.2"
        Name         = "v7.8.0-alpha.2"
        AssetPattern = "*7.8.0-alpha.2.user.js"
        AssetName    = "linuxdo-smart-summary-7.8.0-alpha.2.user.js"
        Prerelease   = $true
        Body         = @"
7.8.0-alpha.2 interaction and default UI preview.

- Consolidates selected-summary actions into explain, simplify, and quote-to-chat workflows.
- Makes message actions state-aware during and after generation, including safe stop, regenerate, and delete behavior that rejects stale request updates.
- Redesigns the default Style2 with a restrained warm-neutral and steel-blue system while preserving Style1 as the compatibility theme.
- Adds keyboard-accessible menus, reduced-motion handling, and a narrow-screen overlay fallback without changing stored settings.
- Acts as the one-time feature and UI gate before compatibility-only 7.8.0-beta.1 validation.
"@
    },
    @{
        Tag          = "v7.8.0-alpha.1"
        Name         = "v7.8.0-alpha.1"
        AssetPattern = "*7.8.0-alpha.1.user.js"
        AssetName    = "linuxdo-smart-summary-7.8.0-alpha.1.user.js"
        Prerelease   = $true
        Body         = @"
7.8.0-alpha.1 modular source and deterministic build preview.

- Moves maintainable runtime code into 27 responsibility-oriented ES modules while preserving one-file Tampermonkey installation.
- Adds a locked esbuild pipeline, direct source tests, generated-artifact verification, and read-only pull-request CI.
- Makes model-list requests cancellable and time-bounded, with controls restored after every terminal path.
- Starts the modular migration route that continues through the one-time alpha.2 feature/UI gate, compatibility-only beta.1, and stable 7.8.0.
"@
    },
    @{
        Tag          = "v7.7-alpha.9"
        Name         = "v7.7-alpha.9"
        AssetPattern = "*7.7-alpha.9.user.js"
        AssetName    = "linuxdo-smart-summary-7.7-alpha.9.user.js"
        Prerelease   = $true
        Body         = @"
7.7-alpha.9 structured reasoning display and partial-output resilience preview.

- Keeps provider reasoning fields separate from answer content across streaming and non-streaming responses, with a conservative compatibility parser for response-leading reasoning tags.
- Shows service-returned reasoning in an accessible collapsible panel that expands while reasoning and auto-collapses when answer content starts unless the user overrides it.
- Preserves partial reasoning and answer text when generation stops, is filtered, reaches a length limit, or fails after output has started.
- Treats model output as untrusted: streaming reasoning is plain text, completed reasoning is strictly sanitized, and remote media is forbidden in the reasoning panel.
"@
    },
    @{
        Tag          = "v7.7-alpha.8"
        Name         = "v7.7-alpha.8"
        AssetPattern = "*7.7-alpha.8.user.js"
        AssetName    = "linuxdo-smart-summary-7.7-alpha.8.user.js"
        Prerelease   = $true
        Body         = @"
7.7-alpha.8 HTML-to-text, timestamp, and public fixture privacy-gate hardening preview.

- Routes active preview HTML-to-text conversion through inert DOM parsing instead of regex tag stripping.
- Adds malformed HTML and nested-entity regression coverage.
- Validates fixture URLs with parsed protocol, host, credential, synthetic-ID, path, and query policies.
- Preserves main-post and reply created_at timestamps in summary and follow-up AI context without adding Linux.do requests.
"@
    },
    @{
        Tag          = "v7.7-alpha.7"
        Name         = "v7.7-alpha.7"
        AssetPattern = "*7.7-alpha.7.user.js"
        AssetName    = "linuxdo-smart-summary-7.7-alpha.7.user.js"
        Prerelease   = $true
        Body         = @"
7.7-alpha.7 public repository privacy and supply-chain hardening preview.

- Removes internal audit artifacts and replaces live forum fixture data with explicit synthetic examples.
- Pins marked and DOMPurify to immutable versions with integrity hashes.
- Pins GitHub Actions to commit SHAs and narrows release workflow permissions.
"@
    },
    @{
        Tag          = "v7.6.1"
        Name         = "v7.6.1"
        AssetPattern = "*7.6.1.user.js"
        AssetName    = "linuxdo-smart-summary-7.6.1.user.js"
        Prerelease   = $false
        Body         = @"
7.6.1 privacy-clean public stable release.

- Repackages the verified 7.6 runtime as the first public stable baseline.
- Pins marked and DOMPurify to immutable versions with integrity hashes.
- Does not change Linux.do request behavior or 7.6 runtime features.
"@
    }
)

$targetVersion = $Version.TrimStart("v")
$targetTag = "v$targetVersion"

if (-not $All) {
    $releases = @($releases | Where-Object { $_.Tag -eq $targetTag })
    if ($releases.Count -ne 1) {
        throw "Release spec not found for $targetTag."
    }
}

if (-not $SkipVerify) {
    foreach ($releaseSpec in $releases) {
        $releaseVersion = $releaseSpec.Tag.TrimStart("v")
        & node "tools/verify-release.mjs" $releaseVersion
        if ($LASTEXITCODE -ne 0) {
            throw "Release verification failed for $releaseVersion."
        }
    }
}

$token = $env:GITHUB_TOKEN
if (-not $token) {
    throw "GITHUB_TOKEN is not set in this PowerShell session."
}

$headers = @{
    "Authorization"         = "Bearer $token"
    "Accept"                = "application/vnd.github+json"
    "X-GitHub-Api-Version"  = "2022-11-28"
    "User-Agent"            = "linuxdo-smart-summary-release-helper"
}

foreach ($releaseSpec in $releases) {
    Write-Host "Publishing release $($releaseSpec.Tag)..."

    $prerelease = [bool]$releaseSpec.Prerelease
    $makeLatest = if ($prerelease) { "false" } else { "true" }
    $payload = @{
        tag_name         = $releaseSpec.Tag
        target_commitish = "master"
        name             = $releaseSpec.Name
        body             = $releaseSpec.Body
        draft            = $false
        prerelease       = $prerelease
        make_latest      = $makeLatest
    } | ConvertTo-Json -Depth 5

    $release = $null
    try {
        $release = Invoke-RestMethod `
            -Method Get `
            -Uri "https://api.github.com/repos/$repo/releases/tags/$($releaseSpec.Tag)" `
            -Headers $headers

        $release = Invoke-RestMethod `
            -Method Patch `
            -Uri "https://api.github.com/repos/$repo/releases/$($release.id)" `
            -Headers $headers `
            -Body $payload `
            -ContentType "application/json"
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -ne 404) {
            throw
        }

        $release = Invoke-RestMethod `
            -Method Post `
            -Uri "https://api.github.com/repos/$repo/releases" `
            -Headers $headers `
            -Body $payload `
            -ContentType "application/json"
    }

    $assets = @(Get-ChildItem -LiteralPath "dist" -File | Where-Object {
        $_.Name -like $releaseSpec.AssetPattern
    })

    if ($assets.Count -ne 1) {
        throw "Release asset not found for pattern: dist/$($releaseSpec.AssetPattern)"
    }

    $asset = $assets[0]
    $assetName = $releaseSpec.AssetName
    $existingAsset = $release.assets | Where-Object { $_.name -eq $assetName }

    if ($existingAsset) {
        Invoke-RestMethod `
            -Method Delete `
            -Uri "https://api.github.com/repos/$repo/releases/assets/$($existingAsset.id)" `
            -Headers $headers
    }

    $uploadBase = ([string]$release.upload_url) -replace "\{\?name,label\}", ""
    $uploadUrl = "${uploadBase}?name=$([uri]::EscapeDataString($assetName))"

    Invoke-RestMethod `
        -Method Post `
        -Uri ([uri]$uploadUrl) `
        -Headers $headers `
        -InFile $asset.FullName `
        -ContentType "application/javascript"

    Write-Host "Published $($releaseSpec.Tag): $assetName"
}
