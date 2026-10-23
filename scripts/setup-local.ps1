$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
if (Test-Path -LiteralPath '.env') { throw 'A .env file already exists. Nothing was changed.' }
$mysqlPath = 'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe'
if (-not (Test-Path -LiteralPath $mysqlPath)) { throw 'MySQL client not found at the expected location.' }
$random = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$passwordBytes = New-Object byte[] 32
$secretBytes = New-Object byte[] 48
$random.GetBytes($passwordBytes)
$random.GetBytes($secretBytes)
$appPassword = -join ($passwordBytes | ForEach-Object { $_.ToString('x2') })
$authSecret = [Convert]::ToBase64String($secretBytes)
$random.Dispose()
Write-Host 'Creates ONLY alkali_dev, alkali_test, and their dedicated local account.'
Write-Host 'If a target database or account exists, creation stops without replacing it.'
Write-Host 'Enter your MySQL root password only at the local MySQL prompt.'
$existing = & $mysqlPath --user=root --password --batch --skip-column-names --execute="SELECT (SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name IN ('alkali_dev','alkali_test')) + (SELECT COUNT(*) FROM mysql.user WHERE User = 'alkali_local');"
if ($LASTEXITCODE -ne 0) { throw 'Read-only preflight failed; nothing was created.' }
if ([int]$existing -ne 0) { throw 'A target database or account already exists. Nothing was changed. Tell Codex the preflight found existing resources.' }
Write-Host 'Preflight passed. MySQL will prompt once more to create the new resources.'
$sql = @"
CREATE USER 'alkali_local'@'localhost' IDENTIFIED BY '$appPassword';
CREATE DATABASE alkali_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE alkali_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON alkali_dev.* TO 'alkali_local'@'localhost';
GRANT ALL PRIVILEGES ON alkali_test.* TO 'alkali_local'@'localhost';
"@
$envLines = @(
  "DATABASE_URL=mysql://alkali_local:${appPassword}@localhost:3306/alkali_dev",
  "TEST_DATABASE_URL=mysql://alkali_local:${appPassword}@localhost:3306/alkali_test",
  "BETTER_AUTH_SECRET=$authSecret",
  'BETTER_AUTH_URL=http://localhost:3000',
  'APP_TIMEZONE=Asia/Singapore'
)
[System.IO.File]::WriteAllLines((Join-Path (Get-Location) '.env'), $envLines, (New-Object System.Text.UTF8Encoding($false)))
$sql | & $mysqlPath --user=root --password
if ($LASTEXITCODE -ne 0) { throw 'Database setup did not complete. Generated app credentials remain in ignored .env for recovery. Share the error only. Some resources may have been created; do not rerun blindly.' }
Write-Host 'Local setup complete. Secrets were saved to ignored .env; do not paste its contents.'
