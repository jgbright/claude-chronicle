$ErrorActionPreference = 'Stop'
Set-Location "$PSScriptRoot\.."
make build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
.\claude-chronicle.exe serve
