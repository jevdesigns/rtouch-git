param(
    [Parameter(Mandatory=$true)] [string]$LocalPath,
    [Parameter(Mandatory=$true)] [string]$RemotePath
)

function Write-ErrAndExit($msg, $code=1) {
    Write-Host $msg -ForegroundColor Red
    exit $code
}

if (-not (Test-Path -Path $LocalPath)) {
    Write-ErrAndExit "Local path '$LocalPath' not found." 2
}

if (-not (Test-Path -Path $RemotePath)) {
    Write-Host "Remote path '$RemotePath' does not exist; attempting to create..."
    try {
        New-Item -ItemType Directory -Path $RemotePath -Force | Out-Null
    } catch {
        Write-ErrAndExit "Failed to create remote path '$RemotePath': $_" 3
    }
}

Write-Host "Computing local file hashes..."
$localFiles = Get-ChildItem -Path $LocalPath -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring((Get-Item -Path $LocalPath).FullName.Length).TrimStart('\')
    [PSCustomObject]@{ Path = $rel; Hash = (Get-FileHash -Algorithm SHA256 -Path $_.FullName).Hash }
}

Write-Host "Computing remote file hashes..."
$remoteFiles = Get-ChildItem -Path $RemotePath -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring((Get-Item -Path $RemotePath).FullName.Length).TrimStart('\')
    [PSCustomObject]@{ Path = $rel; Hash = (Get-FileHash -Algorithm SHA256 -Path $_.FullName).Hash }
}

$localMap = @{}
foreach ($f in $localFiles) { $localMap[$f.Path.ToLower()] = $f.Hash }
$remoteMap = @{}
foreach ($f in $remoteFiles) { $remoteMap[$f.Path.ToLower()] = $f.Hash }

$missingRemote = @()
$mismatched = @()
$extraRemote = @()

foreach ($k in $localMap.Keys) {
    if (-not $remoteMap.ContainsKey($k)) { $missingRemote += $k }
    elseif ($localMap[$k] -ne $remoteMap[$k]) { $mismatched += $k }
}

foreach ($k in $remoteMap.Keys) {
    if (-not $localMap.ContainsKey($k)) { $extraRemote += $k }
}

Write-Host "Verification results:"
Write-Host "  Local files : $($localMap.Keys.Count)"
Write-Host "  Remote files: $($remoteMap.Keys.Count)"

if ($missingRemote.Count -eq 0 -and $mismatched.Count -eq 0) {
    Write-Host "All files verified successfully." -ForegroundColor Green
    exit 0
}

if ($missingRemote.Count -gt 0) {
    Write-Host "Files missing on remote:" -ForegroundColor Yellow
    $missingRemote | ForEach-Object { Write-Host "  $_" }
}
if ($mismatched.Count -gt 0) {
    Write-Host "Files with mismatched content:" -ForegroundColor Yellow
    $mismatched | ForEach-Object { Write-Host "  $_" }
}
if ($extraRemote.Count -gt 0) {
    Write-Host "Extra files on remote (not present locally):" -ForegroundColor Yellow
    $extraRemote | ForEach-Object { Write-Host "  $_" }
}

# Exit non-zero to indicate verification failure
exit 4
