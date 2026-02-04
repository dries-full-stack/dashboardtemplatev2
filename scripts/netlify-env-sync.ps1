param(
  [string]$SiteId,
  [string]$SiteName,
  [string]$EnvFile,
  [string]$AuthToken,
  [switch]$ReplaceExisting
)

function Read-Required($label) {
  $value = $null
  while ([string]::IsNullOrWhiteSpace($value)) {
    $value = Read-Host $label
  }
  return $value.Trim()
}

if ([string]::IsNullOrWhiteSpace($SiteId) -and [string]::IsNullOrWhiteSpace($SiteName)) {
  $SiteId = Read-Host 'Netlify Site ID (laat leeg om naam te gebruiken)'
  if ([string]::IsNullOrWhiteSpace($SiteId)) {
    $SiteName = Read-Required 'Netlify Site Name'
  }
}

if ([string]::IsNullOrWhiteSpace($EnvFile)) {
  $EnvFile = Read-Required 'Pad naar env file (bv. clients\\immobeguin\\env.dashboard.example)'
}

if (-not (Test-Path $EnvFile)) {
  throw "Env file niet gevonden: $EnvFile"
}

if (-not [string]::IsNullOrWhiteSpace($AuthToken)) {
  & netlify login --auth $AuthToken
}

if (-not [string]::IsNullOrWhiteSpace($SiteId)) {
  & netlify link --id $SiteId
} else {
  & netlify link --name $SiteName
}

if ($ReplaceExisting) {
  & netlify env:import $EnvFile --replace-existing
} else {
  & netlify env:import $EnvFile
}

& netlify unlink

Write-Host 'Netlify env vars geimporteerd.'
