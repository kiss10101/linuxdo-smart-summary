param(
    [string]$Version = "7.6.1",
    [switch]$All,
    [switch]$SkipVerify
)

$ErrorActionPreference = "Stop"

$repo = "kiss10101/linuxdo-smart-summary"
$releases = @(
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
