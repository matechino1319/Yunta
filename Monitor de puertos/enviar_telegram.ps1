param(
    [Parameter(Mandatory = $true)]
    [string]$BaseDir,

    [Parameter(Mandatory = $true)]
    [string]$Message
)

$ErrorActionPreference = 'Stop'
. (Join-Path $BaseDir 'monitor_lib.ps1')

Initialize-MonitorEnvironment -BaseDir $BaseDir
Send-TelegramAlert -BaseDir $BaseDir -Message $Message
