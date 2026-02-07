param(
  [string]$Slug,
  [string]$ProjectRef,
  [string]$SupabaseUrl,
  [string]$LocationId,
  [string]$DashboardTitle,
  [string]$DashboardSubtitle,
  [string]$LogoUrl,
  [string]$DashboardTabs,
  [string]$BillingPortalUrl,
  [string]$BillingCheckoutUrl,
  [switch]$BillingCheckoutEmbed,
  [string]$GhlPrivateIntegrationToken,
  [string]$AccessToken,
  [string]$DbPassword,
  [string]$ServiceRoleKey,
  [string]$PublishableKey,
  [string]$TeamleaderClientId,
  [string]$TeamleaderClientSecret,
  [string]$TeamleaderRedirectUrl,
  [string]$TeamleaderScopes,
  [switch]$ApplyConfig,
  [switch]$CreateBranch,
  [string]$BranchName,
  [string]$BaseBranch,
  [switch]$PushBranch,
  [string]$NetlifySiteId,
  [string]$NetlifySiteName,
  [string]$NetlifyAuthToken,
  [string]$NetlifyEnvFile,
  [switch]$NetlifyReplaceEnv,
  [switch]$NetlifySyncEnv,
  [switch]$NetlifyCreateSite,
  [string]$NetlifyAccountSlug,
  [string]$NetlifyRepo,
  [string]$NetlifyRepoProvider,
  [string]$NetlifyRepoBranch,
  [string]$NetlifyBuildCommand,
  [string]$NetlifyPublishDir,
  [string]$NetlifyBaseDir,
  [switch]$NetlifySetProdBranch,
  [string]$NetlifyCustomDomain,
  [string]$NetlifyDomainAliases,
  [switch]$NetlifyCreateDnsRecord,
  [string]$NetlifyDnsZoneName,
  [string]$NetlifyDnsZoneId,
  [string]$NetlifyDnsHost,
  [string]$NetlifyDnsValue,
  [int]$NetlifyDnsTtl,
  [string]$GitHubToken,
  [switch]$NetlifyTriggerDeploy,
  [switch]$NoLayout,
  [switch]$LinkProject,
  [switch]$PushSchema,
  [switch]$DeployFunctions
)

function Read-Required($label) {
  $value = $null
  while ([string]::IsNullOrWhiteSpace($value)) {
    $value = Read-Host $label
  }
  return $value.Trim()
}

function Resolve-SupabaseInfo($projectRef, $supabaseUrl) {
  if (-not [string]::IsNullOrWhiteSpace($projectRef)) {
    $ref = $projectRef.Trim()
    return @{ Ref = $ref; Url = "https://$ref.supabase.co" }
  }

  if ([string]::IsNullOrWhiteSpace($supabaseUrl)) {
    return @{ Ref = ''; Url = '' }
  }

  $value = $supabaseUrl.Trim()
  if ($value -match '^(https?://)?([a-z0-9-]+)\.supabase\.co') {
    $ref = $Matches[2]
    return @{ Ref = $ref; Url = "https://$ref.supabase.co" }
  }

  if ($value -match '^[a-z0-9-]+$') {
    return @{ Ref = $value; Url = "https://$value.supabase.co" }
  }

  return @{ Ref = ''; Url = $value }
}

function To-SqlString($value) {
  if ([string]::IsNullOrWhiteSpace($value)) {
    return 'null'
  }
  $escaped = $value.Replace("'", "''")
  return "'$escaped'"
}

function Get-GitRemoteRepo() {
  $remote = & git remote get-url origin 2>$null
  if (-not $remote) { return '' }
  $remote = $remote.Trim()

  if ($remote -match 'github.com[:/](.+?)(\.git)?$') {
    return $Matches[1]
  }
  return ''
}

function Get-NetlifyHeaders($token) {
  if ([string]::IsNullOrWhiteSpace($token)) { return $null }
  return @{
    Authorization = "Bearer $token"
    'Content-Type' = 'application/json'
  }
}

function Invoke-NetlifyGet($path, $headers) {
  return Invoke-RestMethod -Method Get -Uri ("https://api.netlify.com/api/v1" + $path) -Headers $headers
}

function Invoke-NetlifyPost($path, $headers, $body) {
  return Invoke-RestMethod -Method Post -Uri ("https://api.netlify.com/api/v1" + $path) -Headers $headers -Body ($body | ConvertTo-Json -Depth 10)
}

function Invoke-NetlifyPut($path, $headers, $body) {
  return Invoke-RestMethod -Method Put -Uri ("https://api.netlify.com/api/v1" + $path) -Headers $headers -Body ($body | ConvertTo-Json -Depth 10)
}

function Get-GitHubHeaders($token) {
  if ([string]::IsNullOrWhiteSpace($token)) { return $null }
  return @{
    Authorization = "Bearer $token"
    Accept = 'application/vnd.github+json'
    'X-GitHub-Api-Version' = '2022-11-28'
    'User-Agent' = 'profitpulse-onboarding'
  }
}

function Invoke-GitHubGet($path, $headers) {
  return Invoke-RestMethod -Method Get -Uri ("https://api.github.com" + $path) -Headers $headers
}

function Invoke-GitHubPost($path, $headers, $body) {
  return Invoke-RestMethod -Method Post -Uri ("https://api.github.com" + $path) -Headers $headers -Body ($body | ConvertTo-Json -Depth 10)
}

function Resolve-RepoSlug($repo) {
  if ([string]::IsNullOrWhiteSpace($repo)) { return @{ owner = ''; name = '' } }
  $parts = $repo.Trim().Split('/')
  if ($parts.Length -lt 2) { return @{ owner = ''; name = '' } }
  return @{ owner = $parts[0]; name = $parts[1] }
}

function Ensure-NetlifyDeployKey($authHeader, $githubToken, $repoSlug, $keyTitle) {
  if (-not $authHeader) { return $null }
  if ([string]::IsNullOrWhiteSpace($githubToken)) { return $null }
  if ([string]::IsNullOrWhiteSpace($repoSlug)) { return $null }

  $repoParts = Resolve-RepoSlug $repoSlug
  if ([string]::IsNullOrWhiteSpace($repoParts.owner) -or [string]::IsNullOrWhiteSpace($repoParts.name)) {
    Write-Host 'GitHub repo slug ongeldig, deploy key automation gestopt.'
    return $null
  }

  $ghHeaders = Get-GitHubHeaders $githubToken
  if (-not $ghHeaders) { return $null }

  $repoInfo = $null
  try {
    $repoInfo = Invoke-GitHubGet -path "/repos/$($repoParts.owner)/$($repoParts.name)" -headers $ghHeaders
  } catch {
    Write-Host "GitHub repo info ophalen faalde: $($_.Exception.Message)"
    return $null
  }

  $deployKey = $null
  try {
    $deployKey = Invoke-NetlifyPost -path '/deploy_keys' -headers $authHeader -body @{}
  } catch {
    Write-Host "Netlify deploy key create failed: $($_.Exception.Message)"
    return @{ RepoId = $repoInfo.id }
  }

  if (-not $deployKey?.public_key -or -not $deployKey?.id) {
    Write-Host 'Netlify deploy key response ongeldig.'
    return @{ RepoId = $repoInfo.id }
  }

  try {
    $existing = Invoke-GitHubGet -path "/repos/$($repoParts.owner)/$($repoParts.name)/keys" -headers $ghHeaders
    $already = $existing | Where-Object { $_.key -eq $deployKey.public_key } | Select-Object -First 1
    if ($already) {
      Write-Host 'GitHub deploy key bestaat al.'
    } else {
      $title = if ([string]::IsNullOrWhiteSpace($keyTitle)) { "netlify-$($repoParts.name)" } else { "netlify-$keyTitle" }
      Invoke-GitHubPost -path "/repos/$($repoParts.owner)/$($repoParts.name)/keys" -headers $ghHeaders -body @{
        title = $title
        key = $deployKey.public_key
        read_only = $true
      } | Out-Null
      Write-Host 'GitHub deploy key toegevoegd.'
    }
  } catch {
    Write-Host "GitHub deploy key toevoegen faalde: $($_.Exception.Message)"
  }

  return @{ DeployKeyId = $deployKey.id; RepoId = $repoInfo.id }
}

function Build-SupabaseRestHeaders($publishableKey, $serviceRoleKey) {
  $headers = @{
    Prefer = 'resolution=merge-duplicates'
    'Content-Type' = 'application/json'
  }

  $isSecret = $false
  if (-not [string]::IsNullOrWhiteSpace($serviceRoleKey)) {
    $isSecret = $serviceRoleKey.Trim().StartsWith('sb_secret_')
  }

  $apiKeyValue = $null
  if ($isSecret) {
    $apiKeyValue = $serviceRoleKey
  } elseif (-not [string]::IsNullOrWhiteSpace($publishableKey)) {
    $apiKeyValue = $publishableKey
  } elseif (-not [string]::IsNullOrWhiteSpace($serviceRoleKey)) {
    $apiKeyValue = $serviceRoleKey
  }

  if (-not [string]::IsNullOrWhiteSpace($apiKeyValue)) {
    $headers.apikey = $apiKeyValue
  }

  if (-not [string]::IsNullOrWhiteSpace($serviceRoleKey)) {
    $trimmed = $serviceRoleKey.Trim()
    if ($trimmed.StartsWith('eyJ')) {
      $headers.Authorization = "Bearer $trimmed"
    }
  }

  return $headers
}

function Split-Domain($domain) {
  if ([string]::IsNullOrWhiteSpace($domain)) { return @{ apex = ''; host = '' } }
  $parts = $domain.Trim().Split('.')
  if ($parts.Length -lt 2) { return @{ apex = $domain.Trim(); host = '' } }
  $apex = ($parts[$parts.Length - 2] + '.' + $parts[$parts.Length - 1])
  $hostParts = $parts[0..($parts.Length - 3)]
  $host = if ($hostParts.Length -gt 0) { ($hostParts -join '.') } else { '' }
  return @{ apex = $apex; host = $host }
}

function Get-DefaultBaseBranch() {
  & git fetch origin | Out-Null
  $templateExists = & git show-ref --verify --quiet refs/remotes/origin/template
  if ($LASTEXITCODE -eq 0) { return 'template' }
  return 'main'
}

function Ensure-Branch($branchName, $baseName, $shouldPush) {
  if ([string]::IsNullOrWhiteSpace($branchName)) {
    Write-Host 'Skip branch create: branch name ontbreekt.'
    return
  }

  if ([string]::IsNullOrWhiteSpace($baseName)) {
    $baseName = Get-DefaultBaseBranch
  }

  & git fetch origin | Out-Null

  & git show-ref --verify --quiet "refs/heads/$branchName"
  $localExists = $LASTEXITCODE -eq 0
  $remoteExists = $false
  & git ls-remote --heads origin $branchName | Out-Null
  if ($LASTEXITCODE -eq 0) { $remoteExists = $true }

  if (-not $localExists -and -not $remoteExists) {
    & git branch $branchName "origin/$baseName" | Out-Null
    Write-Host "Branch aangemaakt: $branchName (base: $baseName)"
  } elseif (-not $localExists -and $remoteExists) {
    & git branch $branchName "origin/$branchName" | Out-Null
    Write-Host "Lokale branch aangemaakt: $branchName (origin/$branchName)"
  } else {
    Write-Host "Branch bestaat al: $branchName"
  }

  if ($shouldPush) {
    & git push -u origin $branchName
  }
}

if ([string]::IsNullOrWhiteSpace($Slug)) {
  $Slug = Read-Host 'Client slug (bv. immobeguin)'
}
$slugValue = ''
if ($Slug) {
  $slugValue = $Slug
}
$Slug = $slugValue.Trim().ToLower() -replace '\s+', '-' -replace '[^a-z0-9\-]', ''
if ([string]::IsNullOrWhiteSpace($Slug)) {
  throw 'Ongeldige slug. Gebruik enkel letters, cijfers en "-"'
}

if ([string]::IsNullOrWhiteSpace($ProjectRef) -and [string]::IsNullOrWhiteSpace($SupabaseUrl)) {
  $SupabaseUrl = Read-Required 'Supabase URL (https://PROJECT_REF.supabase.co) of project ref'
}

$supabaseInfo = Resolve-SupabaseInfo -projectRef $ProjectRef -supabaseUrl $SupabaseUrl
$ProjectRef = $supabaseInfo.Ref
$SupabaseUrl = $supabaseInfo.Url

if ([string]::IsNullOrWhiteSpace($ProjectRef)) {
  throw 'Supabase project ref kon niet worden afgeleid. Gebruik een geldige Supabase URL.'
}

if ([string]::IsNullOrWhiteSpace($LocationId)) {
  $LocationId = Read-Required 'GHL Location ID'
} else {
  $LocationId = $LocationId.Trim()
}

if ([string]::IsNullOrWhiteSpace($BranchName)) {
  $BranchName = $Slug
}

if ([string]::IsNullOrWhiteSpace($BaseBranch)) {
  $BaseBranch = Get-DefaultBaseBranch
}

if ([string]::IsNullOrWhiteSpace($DashboardTitle)) {
  $DashboardTitle = Read-Host 'Dashboard titel (optioneel)'
}
if ([string]::IsNullOrWhiteSpace($DashboardSubtitle)) {
  $DashboardSubtitle = Read-Host 'Dashboard subtitel (optioneel)'
}
if ([string]::IsNullOrWhiteSpace($LogoUrl)) {
  $LogoUrl = Read-Host 'Logo URL (optioneel, bv. /assets/logos/client.png)'
}

$repoRoot = Join-Path $PSScriptRoot '..'
$clientDir = Join-Path $repoRoot "clients\\$Slug"
New-Item -ItemType Directory -Force -Path $clientDir | Out-Null

$layoutJson = $null
if (-not $NoLayout) {
  $selectedTabs = @()
  if (-not [string]::IsNullOrWhiteSpace($DashboardTabs)) {
    $selectedTabs = $DashboardTabs.Split(',') | ForEach-Object { $_.Trim().ToLower() } | Where-Object { $_ }
  }
  if ($selectedTabs.Count -eq 0) {
    $selectedTabs = @('lead', 'sales', 'call-center')
  }

  $dashboards = @(
    [ordered]@{ id = 'lead'; label = 'Leadgeneratie'; enabled = $selectedTabs -contains 'lead' },
    [ordered]@{ id = 'sales'; label = 'Sales Resultaten'; enabled = $selectedTabs -contains 'sales' },
    [ordered]@{ id = 'call-center'; label = 'Call Center'; enabled = $selectedTabs -contains 'call-center' }
  )

  $layoutObject = [ordered]@{
    dashboards = $dashboards
    sections = @(
      [ordered]@{
        kind = 'funnel_metrics'
        title = 'Leads & afspraken'
        metric_labels = @('Totaal Leads', 'Totaal Afspraken', 'Confirmed', 'Cancelled', 'No-Show', 'Lead -> Afspraak')
      },
      [ordered]@{ kind = 'source_breakdown'; title = 'Kanalen' },
      [ordered]@{
        kind = 'finance_metrics'
        title = 'Kosten'
        metric_labels = @('Totale Leadkosten', 'Kost per Lead')
      },
      [ordered]@{ kind = 'hook_performance'; title = 'Ad Hook Performance' },
      [ordered]@{ kind = 'lost_reasons'; title = 'Verliesredenen' }
    )
  }

  $layoutJson = $layoutObject | ConvertTo-Json -Depth 8
}

if ($layoutJson) {
  Set-Content -Path (Join-Path $clientDir 'dashboard_layout.json') -Value $layoutJson -Encoding utf8
}

$layoutSql = 'null'
if ($layoutJson) {
  $layoutSql = "`$$`n$layoutJson`n`$$::jsonb"
}

$dashboardSql = @"
-- Client dashboard_config for $Slug
-- Run this in Supabase SQL editor (or via CLI).
insert into public.dashboard_config (
  id,
  location_id,
  dashboard_title,
  dashboard_subtitle,
  dashboard_logo_url,
  dashboard_layout,
  billing_portal_url,
  billing_checkout_url,
  billing_checkout_embed
)
values (
  1,
  $(To-SqlString $LocationId),
  $(To-SqlString $DashboardTitle),
  $(To-SqlString $DashboardSubtitle),
  $(To-SqlString $LogoUrl),
  $layoutSql,
  $(To-SqlString $BillingPortalUrl),
  $(To-SqlString $BillingCheckoutUrl),
  $(if ($BillingCheckoutEmbed) { 'true' } else { 'false' })
)
on conflict (id) do update set
  location_id = excluded.location_id,
  dashboard_title = excluded.dashboard_title,
  dashboard_subtitle = excluded.dashboard_subtitle,
  dashboard_logo_url = excluded.dashboard_logo_url,
  dashboard_layout = excluded.dashboard_layout,
  billing_portal_url = excluded.billing_portal_url,
  billing_checkout_url = excluded.billing_checkout_url,
  billing_checkout_embed = excluded.billing_checkout_embed,
  updated_at = now();
"@

Set-Content -Path (Join-Path $clientDir 'dashboard_config.sql') -Value $dashboardSql -Encoding utf8

$publishableValue = $PublishableKey
if ([string]::IsNullOrWhiteSpace($publishableValue)) {
  $publishableValue = 'YOUR_SUPABASE_PUBLISHABLE_KEY'
}

$dashboardEnv = @"
VITE_SUPABASE_URL=$SupabaseUrl
VITE_SUPABASE_PUBLISHABLE_KEY=$publishableValue
VITE_GHL_LOCATION_ID=$LocationId
"@
Set-Content -Path (Join-Path $clientDir 'env.dashboard.example') -Value $dashboardEnv -Encoding utf8

$syncEnv = @"
GHL_LOCATION_ID=$LocationId
GHL_PRIVATE_INTEGRATION_TOKEN=YOUR_GHL_PRIVATE_INTEGRATION_TOKEN
SUPABASE_URL=$SupabaseUrl
SUPABASE_PUBLISHABLE_KEY=$publishableValue
SUPABASE_SECRET_KEY=YOUR_SUPABASE_SECRET_KEY
"@
Set-Content -Path (Join-Path $clientDir 'env.sync.example') -Value $syncEnv -Encoding utf8

if (-not [string]::IsNullOrWhiteSpace($AccessToken)) {
  & supabase login --token $AccessToken --no-browser
}

$hasTeamleaderSecrets = -not [string]::IsNullOrWhiteSpace($TeamleaderClientId) `
  -or -not [string]::IsNullOrWhiteSpace($TeamleaderClientSecret) `
  -or -not [string]::IsNullOrWhiteSpace($TeamleaderRedirectUrl) `
  -or -not [string]::IsNullOrWhiteSpace($TeamleaderScopes)

if ($hasTeamleaderSecrets) {
  if ([string]::IsNullOrWhiteSpace($AccessToken)) {
    Write-Host 'Skip Teamleader secrets: Supabase access token ontbreekt.'
  } elseif ([string]::IsNullOrWhiteSpace($TeamleaderClientId) -or [string]::IsNullOrWhiteSpace($TeamleaderClientSecret)) {
    Write-Host 'Skip Teamleader secrets: client id/secret ontbreken.'
  } else {
    if ([string]::IsNullOrWhiteSpace($TeamleaderRedirectUrl)) {
      $TeamleaderRedirectUrl = "https://$ProjectRef.supabase.co/functions/v1/teamleader-oauth/callback"
    }

    $secretArgs = @(
      "TEAMLEADER_CLIENT_ID=$TeamleaderClientId",
      "TEAMLEADER_CLIENT_SECRET=$TeamleaderClientSecret",
      "TEAMLEADER_REDIRECT_URL=$TeamleaderRedirectUrl"
    )
    if (-not [string]::IsNullOrWhiteSpace($TeamleaderScopes)) {
      $secretArgs += "TEAMLEADER_SCOPES=$TeamleaderScopes"
    }

    & supabase secrets set --project-ref $ProjectRef @secretArgs
    Write-Host 'Teamleader secrets gezet via Supabase.'
  }
}

$shouldCreateBranch = $false
if ($PSBoundParameters.ContainsKey('CreateBranch')) {
  $shouldCreateBranch = $CreateBranch
}
if ($shouldCreateBranch) {
  Ensure-Branch -branchName $BranchName -baseName $BaseBranch -shouldPush:$PushBranch
}

$resolvedRepo = $NetlifyRepo
if ([string]::IsNullOrWhiteSpace($resolvedRepo)) {
  $resolvedRepo = Get-GitRemoteRepo
}
if ([string]::IsNullOrWhiteSpace($NetlifyRepoProvider)) {
  $NetlifyRepoProvider = 'github'
}
if ([string]::IsNullOrWhiteSpace($NetlifyRepoBranch)) {
  $NetlifyRepoBranch = $BranchName
}
if ([string]::IsNullOrWhiteSpace($NetlifyBuildCommand)) {
  $NetlifyBuildCommand = 'npm run build'
}
if ([string]::IsNullOrWhiteSpace($NetlifyPublishDir)) {
  $NetlifyPublishDir = 'dist'
}
if ([string]::IsNullOrWhiteSpace($NetlifyBaseDir)) {
  $NetlifyBaseDir = 'dashboard'
}

$authHeader = Get-NetlifyHeaders $NetlifyAuthToken
$deployKeyId = $null
$repoId = $null

if (($NetlifyCreateSite -or $NetlifySetProdBranch) -and $authHeader -and -not [string]::IsNullOrWhiteSpace($GitHubToken) -and -not [string]::IsNullOrWhiteSpace($resolvedRepo)) {
  $deployKeyTitle = if ([string]::IsNullOrWhiteSpace($NetlifySiteName)) { $Slug } else { $NetlifySiteName }
  $deployInfo = Ensure-NetlifyDeployKey -authHeader $authHeader -githubToken $GitHubToken -repoSlug $resolvedRepo -keyTitle $deployKeyTitle
  if ($deployInfo) {
    $deployKeyId = $deployInfo.DeployKeyId
    $repoId = $deployInfo.RepoId
  }
}

if ($NetlifyCreateSite) {
  if (-not $authHeader) {
    Write-Host 'Skip Netlify site create: Netlify auth token ontbreekt.'
  } else {
    if ([string]::IsNullOrWhiteSpace($NetlifySiteName)) {
      $NetlifySiteName = "dashboard-$Slug"
    }

    $siteBody = @{
      name = $NetlifySiteName
    }

    if (-not [string]::IsNullOrWhiteSpace($resolvedRepo)) {
      $repoBody = @{
        provider = $NetlifyRepoProvider
        repo = $resolvedRepo
        repo_branch = $NetlifyRepoBranch
      }
      if ($repoId) { $repoBody.repo_id = $repoId }
      if ($deployKeyId) { $repoBody.deploy_key_id = $deployKeyId }
      $siteBody.repo = $repoBody
      $siteBody.build_settings = @{
        cmd = $NetlifyBuildCommand
        dir = $NetlifyPublishDir
        base = $NetlifyBaseDir
        allowed_branches = @($NetlifyRepoBranch)
        repo_branch = $NetlifyRepoBranch
      }
    } else {
      Write-Host 'Waarschuwing: repo niet gevonden, Netlify site wordt zonder repo aangemaakt.'
    }
    if (-not [string]::IsNullOrWhiteSpace($NetlifyAccountSlug)) {
      $siteBody.account_slug = $NetlifyAccountSlug
    }

    try {
      $site = Invoke-NetlifyPost -path '/sites' -headers $authHeader -body $siteBody
      if ($site?.id) {
        $NetlifySiteId = $site.id
        $NetlifySiteName = $site.name
        Write-Host "Netlify site aangemaakt: $NetlifySiteName ($NetlifySiteId)"
      }
    } catch {
      Write-Host "Netlify site create failed: $($_.Exception.Message)"
    }
  }
}

if ($NetlifySetProdBranch -and -not [string]::IsNullOrWhiteSpace($NetlifySiteId)) {
  if (-not $authHeader) {
    Write-Host 'Skip Netlify production branch: Netlify auth token ontbreekt.'
  } else {
    if ([string]::IsNullOrWhiteSpace($resolvedRepo)) {
      Write-Host 'Skip Netlify production branch: repo niet gevonden.'
    } else {
      $repoBody = @{
        provider = $NetlifyRepoProvider
        repo = $resolvedRepo
        repo_branch = $NetlifyRepoBranch
      }
      if ($repoId) { $repoBody.repo_id = $repoId }
      if ($deployKeyId) { $repoBody.deploy_key_id = $deployKeyId }

      $updateBody = @{
        repo = $repoBody
        build_settings = @{
          cmd = $NetlifyBuildCommand
          dir = $NetlifyPublishDir
          base = $NetlifyBaseDir
          allowed_branches = @($NetlifyRepoBranch)
          repo_branch = $NetlifyRepoBranch
        }
      }
      try {
        Invoke-NetlifyPut -path "/sites/$NetlifySiteId" -headers $authHeader -body $updateBody | Out-Null
        Write-Host "Netlify production branch gezet op $NetlifyRepoBranch"
      } catch {
        Write-Host "Netlify production branch update failed: $($_.Exception.Message)"
      }
    }
  }
}

if (-not [string]::IsNullOrWhiteSpace($NetlifyCustomDomain) -and -not [string]::IsNullOrWhiteSpace($NetlifySiteId)) {
  if (-not $authHeader) {
    Write-Host 'Skip Netlify custom domain: Netlify auth token ontbreekt.'
  } else {
    $domainBody = @{
      custom_domain = $NetlifyCustomDomain
    }
    if (-not [string]::IsNullOrWhiteSpace($NetlifyDomainAliases)) {
      $aliases = $NetlifyDomainAliases.Split(',') | ForEach-Object { $_.Trim() } | Where-Object { $_ }
      if ($aliases.Count -gt 0) {
        $domainBody.domain_aliases = $aliases
      }
    }

    try {
      Invoke-NetlifyPut -path "/sites/$NetlifySiteId" -headers $authHeader -body $domainBody | Out-Null
      Write-Host "Netlify custom domain gezet: $NetlifyCustomDomain"
    } catch {
      Write-Host "Netlify custom domain update failed: $($_.Exception.Message)"
    }
  }
}

$shouldCreateDns = $false
if ($PSBoundParameters.ContainsKey('NetlifyCreateDnsRecord')) {
  $shouldCreateDns = $NetlifyCreateDnsRecord
} elseif (-not [string]::IsNullOrWhiteSpace($NetlifyDnsHost) -and (-not [string]::IsNullOrWhiteSpace($NetlifyDnsZoneName) -or -not [string]::IsNullOrWhiteSpace($NetlifyDnsZoneId))) {
  $shouldCreateDns = $true
} elseif (-not [string]::IsNullOrWhiteSpace($NetlifyCustomDomain)) {
  $shouldCreateDns = $true
}

if ($shouldCreateDns -and -not [string]::IsNullOrWhiteSpace($NetlifyAuthToken)) {
  if (-not $authHeader) {
    Write-Host 'Skip Netlify DNS: Netlify auth token ontbreekt.'
  } else {
    $dnsHost = $NetlifyDnsHost
    $dnsZoneName = $NetlifyDnsZoneName
    if ([string]::IsNullOrWhiteSpace($dnsHost) -or [string]::IsNullOrWhiteSpace($dnsZoneName)) {
      $split = Split-Domain $NetlifyCustomDomain
      if ([string]::IsNullOrWhiteSpace($dnsHost)) { $dnsHost = $split.host }
      if ([string]::IsNullOrWhiteSpace($dnsZoneName)) { $dnsZoneName = $split.apex }
    }

    if ([string]::IsNullOrWhiteSpace($dnsHost)) {
      Write-Host 'Skip Netlify DNS: host ontbreekt (apex CNAME wordt niet automatisch gezet).'
    } else {
      $dnsValue = $NetlifyDnsValue
      if ([string]::IsNullOrWhiteSpace($dnsValue)) {
        if (-not [string]::IsNullOrWhiteSpace($NetlifySiteId)) {
          try {
            $siteInfo = Invoke-NetlifyGet -path "/sites/$NetlifySiteId" -headers $authHeader
            if ($siteInfo?.default_domain) {
              $dnsValue = $siteInfo.default_domain
            } elseif ($siteInfo?.name) {
              $dnsValue = "$($siteInfo.name).netlify.app"
            }
          } catch {
            Write-Host "Netlify site fetch failed: $($_.Exception.Message)"
          }
        }
      }

      if ([string]::IsNullOrWhiteSpace($dnsValue)) {
        Write-Host 'Skip Netlify DNS: target ontbreekt.'
      } else {
        $zoneId = $NetlifyDnsZoneId
        if ([string]::IsNullOrWhiteSpace($zoneId) -and -not [string]::IsNullOrWhiteSpace($NetlifySiteId)) {
          try {
            $dnsInfo = Invoke-NetlifyGet -path "/sites/$NetlifySiteId/dns" -headers $authHeader
            if ($dnsInfo?.zones) {
              $zoneMatch = $dnsInfo.zones | Where-Object { $_.name -eq $dnsZoneName -or $_.domain -eq $dnsZoneName } | Select-Object -First 1
              if ($zoneMatch) { $zoneId = $zoneMatch.id }
            }
          } catch {
            Write-Host "Netlify DNS lookup failed: $($_.Exception.Message)"
          }
        }

        if ([string]::IsNullOrWhiteSpace($zoneId) -and -not [string]::IsNullOrWhiteSpace($dnsZoneName)) {
          try {
            $zones = Invoke-NetlifyGet -path "/dns_zones" -headers $authHeader
            $zoneMatch = $zones | Where-Object { $_.name -eq $dnsZoneName -or $_.domain -eq $dnsZoneName } | Select-Object -First 1
            if ($zoneMatch) { $zoneId = $zoneMatch.id }
          } catch {
            Write-Host "Netlify DNS zones fetch failed: $($_.Exception.Message)"
          }
        }

        if ([string]::IsNullOrWhiteSpace($zoneId) -and -not [string]::IsNullOrWhiteSpace($dnsZoneName) -and -not [string]::IsNullOrWhiteSpace($NetlifyAccountSlug)) {
          try {
            $zoneCreateBody = @{
              name = $dnsZoneName
              account_slug = $NetlifyAccountSlug
            }
            $zone = Invoke-NetlifyPost -path '/dns_zones' -headers $authHeader -body $zoneCreateBody
            if ($zone?.id) {
              $zoneId = $zone.id
              if ($zone?.dns_servers) {
                Write-Host "DNS zone aangemaakt. Update nameservers naar: $($zone.dns_servers -join ', ')"
              }
            }
          } catch {
            Write-Host "Netlify DNS zone create failed: $($_.Exception.Message)"
          }
        }

        if ([string]::IsNullOrWhiteSpace($zoneId)) {
          Write-Host 'Skip Netlify DNS: zone id niet gevonden.'
        } else {
          try {
            $zoneInfo = Invoke-NetlifyGet -path "/dns_zones/$zoneId" -headers $authHeader
            $existing = $null
            if ($zoneInfo?.records) {
              $existing = $zoneInfo.records | Where-Object { $_.type -eq 'CNAME' -and $_.hostname -eq $dnsHost } | Select-Object -First 1
            }

            if ($existing) {
              if ($existing.value -eq $dnsValue) {
                Write-Host "Netlify DNS record bestaat al: $dnsHost -> $dnsValue"
              } else {
                Write-Host "Netlify DNS record bestaat al met andere value. Update handmatig: $dnsHost -> $dnsValue"
              }
            } else {
              $recordBody = @{
                type = 'CNAME'
                hostname = $dnsHost
                value = $dnsValue
              }
              if ($NetlifyDnsTtl -gt 0) {
                $recordBody.ttl = $NetlifyDnsTtl
              }
              Invoke-NetlifyPost -path "/dns_zones/$zoneId/dns_records" -headers $authHeader -body $recordBody | Out-Null
              Write-Host "Netlify DNS record aangemaakt: $dnsHost -> $dnsValue"
            }
          } catch {
            Write-Host "Netlify DNS record create failed: $($_.Exception.Message)"
          }
        }
      }
    }
  }
}

$shouldSyncNetlify = $false
if ($PSBoundParameters.ContainsKey('NetlifySyncEnv')) {
  $shouldSyncNetlify = $NetlifySyncEnv
} elseif (-not [string]::IsNullOrWhiteSpace($NetlifySiteId) -or -not [string]::IsNullOrWhiteSpace($NetlifySiteName)) {
  $shouldSyncNetlify = $true
}

if ($shouldSyncNetlify) {
  if (-not [string]::IsNullOrWhiteSpace($NetlifyAuthToken)) {
    & netlify login --auth $NetlifyAuthToken
  }

  if (-not [string]::IsNullOrWhiteSpace($NetlifySiteId)) {
    & netlify link --id $NetlifySiteId
  } elseif (-not [string]::IsNullOrWhiteSpace($NetlifySiteName)) {
    & netlify link --name $NetlifySiteName
  } else {
    Write-Host 'Skip Netlify env sync: site id/naam ontbreekt.'
  }

  $envFilePath = $NetlifyEnvFile
  if ([string]::IsNullOrWhiteSpace($envFilePath)) {
    $envFilePath = Join-Path $clientDir 'env.dashboard.example'
  }

  if (Test-Path $envFilePath) {
    if ($NetlifyReplaceEnv) {
      & netlify env:import $envFilePath --replace-existing
    } else {
      & netlify env:import $envFilePath
    }
  } else {
    Write-Host "Netlify env file niet gevonden: $envFilePath"
  }

  & netlify unlink
}

if ($NetlifyTriggerDeploy) {
  if (-not $authHeader) {
    Write-Host 'Skip Netlify deploy trigger: Netlify auth token ontbreekt.'
  } else {
    $targetSite = if (-not [string]::IsNullOrWhiteSpace($NetlifySiteId)) { $NetlifySiteId } else { $NetlifySiteName }
    if ([string]::IsNullOrWhiteSpace($targetSite)) {
      Write-Host 'Skip Netlify deploy trigger: site id/naam ontbreekt.'
    } else {
      try {
        Invoke-NetlifyPost -path "/sites/$targetSite/builds" -headers $authHeader -body @{} | Out-Null
        Write-Host "Netlify build gestart voor $targetSite"
      } catch {
        Write-Host "Netlify deploy trigger failed: $($_.Exception.Message)"
      }
    }
  }
}

Write-Host "Client scaffold aangemaakt in $clientDir"
Write-Host 'Volgende stappen:'
Write-Host "1) Run base schema: supabase login (1x) -> supabase link --project-ref $ProjectRef -> supabase db push"
Write-Host "2) Run client config: clients\\$Slug\\dashboard_config.sql (of -ApplyConfig met ServiceRoleKey)"
Write-Host "3) Deploy functions: supabase functions deploy ghl-sync --project-ref $ProjectRef (idem voor meta-sync/google-sync/google-sheet-sync/teamleader-oauth/teamleader-sync)"
Write-Host "4) Netlify env sync (optioneel): netlify env:import clients\\$Slug\\env.dashboard.example"
Write-Host "5) Git branch (optioneel): git branch $BranchName origin/$BaseBranch && git push -u origin $BranchName"

if ($LinkProject -or $PushSchema -or $DeployFunctions) {
  if ($LinkProject -or $PushSchema) {
    if ([string]::IsNullOrWhiteSpace($DbPassword)) {
      & supabase link --project-ref $ProjectRef
    } else {
      & supabase link --project-ref $ProjectRef --password $DbPassword
    }
  }
  if ($PushSchema) {
    if ([string]::IsNullOrWhiteSpace($DbPassword)) {
      & supabase --yes db push
    } else {
      & supabase --yes db push --password $DbPassword
    }
  }
  if ($DeployFunctions) {
    & supabase functions deploy ghl-sync --project-ref $ProjectRef
    & supabase functions deploy meta-sync --project-ref $ProjectRef
    & supabase functions deploy google-sync --project-ref $ProjectRef
    & supabase functions deploy google-sheet-sync --project-ref $ProjectRef
    & supabase functions deploy teamleader-oauth --project-ref $ProjectRef
    & supabase functions deploy teamleader-sync --project-ref $ProjectRef
  }
}

$shouldApplyConfig = $false
if ($PSBoundParameters.ContainsKey('ApplyConfig')) {
  $shouldApplyConfig = $ApplyConfig
} elseif (-not [string]::IsNullOrWhiteSpace($ServiceRoleKey)) {
  $shouldApplyConfig = $true
}

if ($shouldApplyConfig) {
  if ([string]::IsNullOrWhiteSpace($ServiceRoleKey)) {
    Write-Host 'Skip config apply: ServiceRoleKey ontbreekt.'
  } else {
    $payload = @{
      id = 1
      location_id = $LocationId
    }
    if (-not [string]::IsNullOrWhiteSpace($DashboardTitle)) {
      $payload.dashboard_title = $DashboardTitle
    }
    if (-not [string]::IsNullOrWhiteSpace($DashboardSubtitle)) {
      $payload.dashboard_subtitle = $DashboardSubtitle
    }
    if (-not [string]::IsNullOrWhiteSpace($LogoUrl)) {
      $payload.dashboard_logo_url = $LogoUrl
    }
    if ($layoutJson) {
      $payload.dashboard_layout = $layoutJson | ConvertFrom-Json
    }
    if (-not [string]::IsNullOrWhiteSpace($BillingPortalUrl)) {
      $payload.billing_portal_url = $BillingPortalUrl
    }
    if (-not [string]::IsNullOrWhiteSpace($BillingCheckoutUrl)) {
      $payload.billing_checkout_url = $BillingCheckoutUrl
    }
    if ($BillingCheckoutEmbed) {
      $payload.billing_checkout_embed = $true
    }

    $apiUrl = "$SupabaseUrl/rest/v1/dashboard_config?on_conflict=id"
    $headers = Build-SupabaseRestHeaders -publishableKey $PublishableKey -serviceRoleKey $ServiceRoleKey
    $body = @($payload) | ConvertTo-Json -Depth 20
    try {
      Invoke-RestMethod -Method Post -Uri $apiUrl -Headers $headers -Body $body -ErrorAction Stop | Out-Null
      Write-Host 'dashboard_config geupdatet via REST.'
    } catch {
      Write-Host "dashboard_config update faalde: $($_.Exception.Message)"
    }
  }
}

$shouldApplyGhl = $false
if (-not [string]::IsNullOrWhiteSpace($GhlPrivateIntegrationToken)) {
  $shouldApplyGhl = $true
}

if ($shouldApplyGhl) {
  if ([string]::IsNullOrWhiteSpace($ServiceRoleKey)) {
    Write-Host 'Skip GHL integratie: ServiceRoleKey ontbreekt.'
  } else {
    $payload = @{
      location_id = $LocationId
      private_integration_token = $GhlPrivateIntegrationToken
      active = $true
      updated_at = (Get-Date).ToString('o')
    }
    $apiUrl = "$SupabaseUrl/rest/v1/ghl_integrations?on_conflict=location_id"
    $headers = Build-SupabaseRestHeaders -publishableKey $PublishableKey -serviceRoleKey $ServiceRoleKey
    $body = @($payload) | ConvertTo-Json -Depth 5
    try {
      Invoke-RestMethod -Method Post -Uri $apiUrl -Headers $headers -Body $body -ErrorAction Stop | Out-Null
      Write-Host 'GHL integratie opgeslagen via REST.'
    } catch {
      Write-Host "GHL integratie opslaan faalde: $($_.Exception.Message)"
    }
  }
}
