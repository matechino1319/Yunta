Add-Type -AssemblyName System.Windows.Forms

function Initialize-MonitorEnvironment {
    param([string]$BaseDir)

    foreach ($dir in @(
        (Join-Path $BaseDir 'config'),
        (Join-Path $BaseDir 'logs'),
        (Join-Path $BaseDir 'reportes'),
        (Join-Path $BaseDir 'reportes\historico')
    )) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
    }

    $configPath = Join-Path $BaseDir 'config\general.ini'
    if (-not (Test-Path $configPath)) {
        Set-IniValue -Path $configPath -Values ([ordered]@{
            FirstRunCompleted = '0'
            ReportsFolder = (Join-Path $BaseDir 'reportes')
            ScanIntervalMinutes = '6'
            ReportIntervalHours = '12'
            AutoOpenFirstReport = '1'
        })
    }

    $telegramPath = Join-Path $BaseDir 'config\telegram.ini'
    if (-not (Test-Path $telegramPath)) {
        Set-IniValue -Path $telegramPath -Values ([ordered]@{
            BotToken = ''
            ChatId = ''
            AlertsEnabled = '0'
        })
    }

    $statePath = Join-Path $BaseDir 'config\estado.ini'
    if (-not (Test-Path $statePath)) {
        Set-IniValue -Path $statePath -Values ([ordered]@{
            Mode = 'SETUP'
            WorkerPid = ''
            WorkerStartedAt = ''
            WorkerHeartbeatAt = ''
            ScanCount = '0'
            LastScanAt = ''
            LastHistoricalReportAt = ''
            LastConnectionCount = '0'
            LearningStartedAt = ''
            LearningEndsAt = ''
        })
    }

    foreach ($file in @(
        (Join-Path $BaseDir 'config\ips_aprobadas.txt'),
        (Join-Path $BaseDir 'config\ips_rechazadas.txt'),
        (Join-Path $BaseDir 'config\reglas_aprobadas.txt'),
        (Join-Path $BaseDir 'config\reglas_rechazadas.txt'),
        (Join-Path $BaseDir 'config\relation_state.json'),
        (Join-Path $BaseDir 'config\ip_state.json')
    )) {
        if (-not (Test-Path $file)) {
            New-Item -ItemType File -Path $file -Force | Out-Null
        }
    }
}

function Get-IniValue {
    param([string]$Path)

    $result = [ordered]@{}
    if (-not (Test-Path $Path)) {
        return $result
    }

    foreach ($line in Get-Content -Path $Path) {
        if ([string]::IsNullOrWhiteSpace($line)) {
            continue
        }
        if ($line.TrimStart().StartsWith('#')) {
            continue
        }
        $parts = $line -split '=', 2
        if ($parts.Count -eq 2) {
            $result[$parts[0].Trim()] = $parts[1].Trim()
        }
    }
    return $result
}

function Set-IniValue {
    param(
        [string]$Path,
        [System.Collections.IDictionary]$Values
    )

    $lines = foreach ($entry in $Values.GetEnumerator()) {
        '{0}={1}' -f $entry.Key, $entry.Value
    }
    $content = [string]::Join([Environment]::NewLine, $lines)
    if ($content.Length -gt 0) {
        $content += [Environment]::NewLine
    }
    [System.IO.File]::WriteAllText($Path, $content)
}

function Get-MonitorConfig {
    param([string]$BaseDir)
    return Get-IniValue -Path (Join-Path $BaseDir 'config\general.ini')
}

function Save-MonitorConfig {
    param(
        [string]$BaseDir,
        [System.Collections.IDictionary]$Config
    )
    Set-IniValue -Path (Join-Path $BaseDir 'config\general.ini') -Values $Config
}

function Get-TelegramConfig {
    param([string]$BaseDir)
    $config = Get-IniValue -Path (Join-Path $BaseDir 'config\telegram.ini')

    if (-not $config.Contains('BotToken')) {
        $config.BotToken = ''
    }
    if (-not $config.Contains('ChatId')) {
        $config.ChatId = ''
    }
    if (-not $config.Contains('AlertsEnabled')) {
        $config.AlertsEnabled = '0'
    }

    if ([string]::IsNullOrWhiteSpace($config.BotToken)) {
        $config.BotToken = ''
    }
    if ([string]::IsNullOrWhiteSpace($config.ChatId)) {
        $config.ChatId = ''
    }
    if ($config.AlertsEnabled -notin @('0', '1')) {
        $config.AlertsEnabled = '0'
    }

    return $config
}

function Save-TelegramConfig {
    param(
        [string]$BaseDir,
        [System.Collections.IDictionary]$Config
    )
    Set-IniValue -Path (Join-Path $BaseDir 'config\telegram.ini') -Values $Config
}

function Get-MonitorState {
    param([string]$BaseDir)
    $state = Get-IniValue -Path (Join-Path $BaseDir 'config\estado.ini')
    foreach ($pair in @(
        @{ Key = 'Mode'; Value = 'SETUP' },
        @{ Key = 'WorkerPid'; Value = '' },
        @{ Key = 'WorkerStartedAt'; Value = '' },
        @{ Key = 'WorkerHeartbeatAt'; Value = '' },
        @{ Key = 'ScanCount'; Value = '0' },
        @{ Key = 'LastScanAt'; Value = '' },
        @{ Key = 'LastHistoricalReportAt'; Value = '' },
        @{ Key = 'LastConnectionCount'; Value = '0' },
        @{ Key = 'LearningStartedAt'; Value = '' },
        @{ Key = 'LearningEndsAt'; Value = '' }
    )) {
        if (-not $state.Contains($pair.Key)) {
            $state[$pair.Key] = $pair.Value
        }
    }
    return $state
}

function Save-State {
    param(
        [string]$BaseDir,
        [System.Collections.IDictionary]$State
    )
    Set-IniValue -Path (Join-Path $BaseDir 'config\estado.ini') -Values $State
}

function Update-WorkerState {
    param(
        [string]$BaseDir,
        [int]$WorkerProcessId,
        [string]$StartedAt,
        [string]$Mode = 'MONITOREO',
        [switch]$Clear
    )

    $state = Get-MonitorState -BaseDir $BaseDir
    if ($Clear) {
        if ($state.WorkerPid -and [int]$state.WorkerPid -ne $WorkerProcessId) {
            return $state
        }
        $state.WorkerPid = ''
        $state.WorkerStartedAt = ''
        $state.WorkerHeartbeatAt = ''
    } else {
        $state.WorkerPid = "$WorkerProcessId"
        if ($StartedAt) {
            $state.WorkerStartedAt = $StartedAt
        } elseif (-not $state.WorkerStartedAt) {
            $state.WorkerStartedAt = (Get-Date).ToString('s')
        }
        $state.WorkerHeartbeatAt = (Get-Date).ToString('s')
        if ($Mode) {
            $state.Mode = $Mode
        }
    }

    Save-State -BaseDir $BaseDir -State $state
    return $state
}

function Clear-StaleWorkerState {
    param(
        [string]$BaseDir,
        [string]$Reason
    )

    $state = Get-MonitorState -BaseDir $BaseDir
    if (-not $state.WorkerPid) {
        return
    }

    $clearedPid = $state.WorkerPid
    $state.WorkerPid = ''
    $state.WorkerStartedAt = ''
    $state.WorkerHeartbeatAt = ''
    Save-State -BaseDir $BaseDir -State $state

    if ($Reason) {
        Write-Log -BaseDir $BaseDir -Name 'errores.log' -Message ("Worker limpiado del estado. PID=$clearedPid Motivo=$Reason")
    }
}

function Write-Log {
    param(
        [string]$BaseDir,
        [string]$Name,
        [string]$Message
    )

    $logPath = Join-Path $BaseDir ("logs\" + $Name)
    if (Test-Path $logPath) {
        $maxBytes = 1MB
        $logFile = Get-Item -Path $logPath -ErrorAction SilentlyContinue
        if ($logFile -and $logFile.Length -ge $maxBytes) {
            $archivePath = "$logPath.1"
            if (Test-Path $archivePath) {
                Remove-Item -Path $archivePath -Force -ErrorAction SilentlyContinue
            }
            Move-Item -Path $logPath -Destination $archivePath -Force
        }
    }
    $line = '{0} | {1}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Message
    Add-Content -Path $logPath -Value $line
}

function Pause-Short {
    Write-Host ''
    [void](Read-Host 'Presiona Enter para continuar')
}

function Select-ReportsFolder {
    param([string]$DefaultPath)

    $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
    $dialog.Description = 'Elegi la carpeta donde se guardaran los reportes CSV'
    if ($DefaultPath -and (Test-Path $DefaultPath)) {
        $dialog.SelectedPath = $DefaultPath
    }

    if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
        return $dialog.SelectedPath
    }
    return $DefaultPath
}

function Prompt-InitialApproval {
    param(
        [string]$BaseDir,
        [System.Collections.IEnumerable]$Rows
    )

    $remoteIps = $Rows |
        Where-Object { $_.RemoteAddress -and $_.RemoteAddress -notin @('0.0.0.0', '::', '127.0.0.1', '::1', '*') } |
        Select-Object -ExpandProperty RemoteAddress -Unique |
        Sort-Object

    Write-Host ''
    Write-Host 'IPs remotas detectadas en el primer arranque:' -ForegroundColor Cyan
    if (-not $remoteIps) {
        Write-Host 'No se detectaron IPs remotas activas en este momento.'
    } else {
        $index = 1
        foreach ($ip in $remoteIps) {
            Write-Host ('[{0}] {1}' -f $index, $ip)
            $index++
        }
    }

    Write-Host ''
    Write-Host 'A = aceptar todas las IPs actuales' -ForegroundColor Yellow
    Write-Host 'M = aceptar manualmente algunas IPs' -ForegroundColor Yellow
    Write-Host 'N = no aceptar ninguna por ahora' -ForegroundColor Yellow
    $choice = Read-Host 'Elegi una opcion'

    $approved = New-Object System.Collections.Generic.List[string]

    switch ($choice.ToUpperInvariant()) {
        'A' {
            foreach ($ip in $remoteIps) { [void]$approved.Add($ip) }
        }
        'M' {
            $manual = Read-Host 'Escribi las IPs a aceptar separadas por coma'
            foreach ($ip in ($manual -split ',')) {
                $value = $ip.Trim()
                if ($value) { [void]$approved.Add($value) }
            }
        }
    }

    $approved | Sort-Object -Unique | Set-Content -Path (Join-Path $BaseDir 'config\ips_aprobadas.txt')
}

function Configure-Telegram {
    param([string]$BaseDir)

    $telegram = Get-TelegramConfig -BaseDir $BaseDir

    Write-Host ''
    if ($telegram.BotToken -or $telegram.ChatId) {
        Write-Host ('Configuracion actual: AlertsEnabled={0}' -f $telegram.AlertsEnabled) -ForegroundColor Cyan
        Write-Host ('Bot Token actual: {0}' -f $(if ($telegram.BotToken) { 'CARGADO' } else { 'VACIO' }))
        Write-Host ('Chat ID actual: {0}' -f $(if ($telegram.ChatId) { $telegram.ChatId } else { 'VACIO' }))
        Write-Host ''
    }

    $enable = Read-Host 'Queres configurar alertas de Telegram ahora? (S/N)'
    $normalizedEnable = $enable.Trim().ToUpperInvariant()
    $normalizedEnableAscii = (
        $normalizedEnable.
            Replace([char]0x00CD, 'I').
            Replace([char]0x00ED, 'I').
            Replace([char]0x00CC, 'I').
            Replace([char]0x00EC, 'I')
    )
    $normalizedEnable = $normalizedEnableAscii
    if ($normalizedEnable -eq 'SÍ') {
        $normalizedEnable = 'SI'
    }
    if ($normalizedEnable -notin @('S', 'SI', 'SÍ', 'Y', 'YES')) {
        $telegram.AlertsEnabled = '0'
        Save-TelegramConfig -BaseDir $BaseDir -Config $telegram
        return
    }

    $bot = Read-Host 'Bot Token'
    $chat = Read-Host 'Chat ID'
    $botValue = $bot.Trim()
    $chatValue = $chat.Trim()
    if ($botValue) {
        $telegram.BotToken = $botValue
    }
    if ($chatValue) {
        $telegram.ChatId = $chatValue
    }
    if ($telegram.BotToken -and $telegram.ChatId) {
        $telegram.AlertsEnabled = '1'
    } else {
        $telegram.AlertsEnabled = '0'
    }
    Save-TelegramConfig -BaseDir $BaseDir -Config $telegram

    Write-Host ''
    if ($telegram.AlertsEnabled -eq '1') {
        Write-Host 'Telegram configurado y activado.' -ForegroundColor Green
    } else {
        Write-Host 'Telegram guardado sin activar porque falta Bot Token o Chat ID.' -ForegroundColor Yellow
    }
}

function Register-AutoStart {
    param([string]$BaseDir)

    $launcher = Join-Path $BaseDir 'startup_hidden.vbs'
    $worker = Join-Path $BaseDir 'monitor_loop.ps1'
    $powershellPath = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
    $wscriptPath = Join-Path $env:SystemRoot 'System32\wscript.exe'
    $startupFolder = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\Startup'
    $startupLauncher = Join-Path $startupFolder 'MonitorRedPro.vbs'

    $content = @(
        'Set WshShell = CreateObject("WScript.Shell")'
        'WshShell.CurrentDirectory = "' + $BaseDir + '"'
        'WshShell.Run ""' + $powershellPath + '"" -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File ""' + $worker + '"" -StartupSource AutoStart", 0, False'
    )
    [System.IO.File]::WriteAllLines($launcher, $content)

    if (-not (Test-Path $startupFolder)) {
        New-Item -ItemType Directory -Path $startupFolder -Force | Out-Null
    }
    Copy-Item -Path $launcher -Destination $startupLauncher -Force

    $runPath = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'
    New-Item -Path $runPath -Force | Out-Null
    Set-ItemProperty -Path $runPath -Name 'MonitorRedPro' -Value ('"' + $wscriptPath + '" "' + $launcher + '"')
}

function Ensure-InitialSetup {
    param([string]$BaseDir)

    $config = Get-MonitorConfig -BaseDir $BaseDir
    if ($config.FirstRunCompleted -eq '1') {
        return
    }

    Clear-Host
    Write-Host '============================================================' -ForegroundColor Cyan
    Write-Host '   CONFIGURACION INICIAL - MONITOR DE RED PRO' -ForegroundColor Cyan
    Write-Host '============================================================' -ForegroundColor Cyan
    Write-Host ''

    $defaultFolder = $config.ReportsFolder
    $selectedFolder = Select-ReportsFolder -DefaultPath $defaultFolder
    if (-not $selectedFolder) {
        throw 'No se eligio una carpeta para los reportes.'
    }

    if (-not (Test-Path $selectedFolder)) {
        New-Item -ItemType Directory -Path $selectedFolder -Force | Out-Null
    }

    $config.ReportsFolder = $selectedFolder
    Save-MonitorConfig -BaseDir $BaseDir -Config $config

    $rows = Get-CurrentConnections
    Export-NetworkReports -BaseDir $BaseDir -Rows $rows -OpenAfterExport
    Prompt-InitialApproval -BaseDir $BaseDir -Rows $rows
    Configure-Telegram -BaseDir $BaseDir
    Register-AutoStart -BaseDir $BaseDir
    Seed-SeenConnections -BaseDir $BaseDir -Rows $rows -TreatApprovedIpsAsBase

    $config.FirstRunCompleted = '1'
    Save-MonitorConfig -BaseDir $BaseDir -Config $config

    $state = Get-MonitorState -BaseDir $BaseDir
    $state.Mode = 'MONITOREO'
    $state.LastHistoricalReportAt = (Get-Date).ToString('s')
    $state.LearningStartedAt = (Get-Date).ToString('s')
    $state.LearningEndsAt = (Get-Date).AddHours(48).ToString('s')
    Save-State -BaseDir $BaseDir -State $state

    Write-Host ''
    Write-Host 'Configuracion inicial completada.' -ForegroundColor Green
    Pause-Short
}

function Get-CurrentConnections {
    $processMap = @{}
    foreach ($proc in Get-Process -ErrorAction SilentlyContinue) {
        $processMap["$($proc.Id)"] = $proc.ProcessName
    }

    $netstatLines = netstat -ano -p TCP
    $rows = foreach ($line in $netstatLines) {
        if ($line -notmatch '^\s*TCP\s+') {
            continue
        }

        $parts = $line -split '\s+'
        if ($parts.Count -lt 5) {
            continue
        }

        $protocol = $parts[1]
        $localEndpoint = $parts[2]
        $remoteEndpoint = $parts[3]

        if ($parts.Count -ge 6) {
            $state = $parts[4]
            $pidKey = $parts[5]
        } else {
            $state = 'UNKNOWN'
            $pidKey = $parts[4]
        }

        if ($processMap.ContainsKey($pidKey)) {
            $processName = $processMap[$pidKey]
        } else {
            $processName = 'Desconocido'
        }

        $localInfo = Split-Endpoint -Endpoint $localEndpoint
        $remoteInfo = Split-Endpoint -Endpoint $remoteEndpoint

        [pscustomobject]@{
            Protocol      = $protocol
            State         = $state
            LocalAddress  = $localInfo.Address
            LocalPort     = $localInfo.Port
            RemoteAddress = $remoteInfo.Address
            RemotePort    = $remoteInfo.Port
            Pid           = $pidKey
            ProcessName   = $processName
        }
    }

    return $rows | Sort-Object State, LocalAddress, LocalPort, RemoteAddress, RemotePort
}

function Split-Endpoint {
    param([string]$Endpoint)

    if (-not $Endpoint) {
        return [pscustomobject]@{
            Address = ''
            Port    = ''
        }
    }

    if ($Endpoint.StartsWith('[')) {
        $closing = $Endpoint.LastIndexOf(']')
        if ($closing -gt 0) {
            $address = $Endpoint.Substring(1, $closing - 1)
            $port = $Endpoint.Substring($closing + 1).TrimStart(':')
            return [pscustomobject]@{
                Address = $address
                Port    = $port
            }
        }
    }

    $index = $Endpoint.LastIndexOf(':')
    if ($index -ge 0) {
        return [pscustomobject]@{
            Address = $Endpoint.Substring(0, $index)
            Port    = $Endpoint.Substring($index + 1)
        }
    }

    return [pscustomobject]@{
        Address = $Endpoint
        Port    = ''
    }
}

function Export-CsvWithRetry {
    param(
        [System.Collections.IEnumerable]$Rows,
        [string]$Path
    )

    $attempt = 0
    while ($attempt -lt 3) {
        try {
            $Rows | Export-Csv -Path $Path -Delimiter ';' -NoTypeInformation -Encoding Default
            return
        } catch [System.IO.IOException] {
            $attempt++
            if ($attempt -ge 3) {
                $fileName = [System.IO.Path]::GetFileName($Path)
                throw "No se pudo guardar '$fileName' porque esta abierto en otro programa. Cerra ese archivo y volve a intentar."
            }
            Start-Sleep -Milliseconds 400
        }
    }
}

function Export-NetworkReports {
    param(
        [string]$BaseDir,
        [System.Collections.IEnumerable]$Rows,
        [switch]$Historical,
        [switch]$OpenAfterExport
    )

    $config = Get-MonitorConfig -BaseDir $BaseDir
    $reportsDir = $config.ReportsFolder
    if (-not (Test-Path $reportsDir)) {
        New-Item -ItemType Directory -Path $reportsDir -Force | Out-Null
    }

    $currentPath = Join-Path $reportsDir 'informe_actual.csv'
    Export-CsvWithRetry -Rows $Rows -Path $currentPath

    if ($Historical) {
        $historicalDir = Join-Path $reportsDir 'historico'
        if (-not (Test-Path $historicalDir)) {
            New-Item -ItemType Directory -Path $historicalDir -Force | Out-Null
        }
        $historicalName = 'red_{0}.csv' -f (Get-Date -Format 'yyyy-MM-dd_HH-mm-ss')
        $historicalPath = Join-Path $historicalDir $historicalName
        Export-CsvWithRetry -Rows $Rows -Path $historicalPath
    }

    if ($OpenAfterExport) {
        Start-Process $currentPath
    }
}

function Get-ApprovedIpsPath {
    param([string]$BaseDir)
    return (Join-Path $BaseDir 'config\ips_aprobadas.txt')
}

function Get-RejectedIpsPath {
    param([string]$BaseDir)
    return (Join-Path $BaseDir 'config\ips_rechazadas.txt')
}

function Get-ApprovedRulesPath {
    param([string]$BaseDir)
    return (Join-Path $BaseDir 'config\reglas_aprobadas.txt')
}

function Get-RejectedRulesPath {
    param([string]$BaseDir)
    return (Join-Path $BaseDir 'config\reglas_rechazadas.txt')
}

function Get-RelationStatePath {
    param([string]$BaseDir)
    return (Join-Path $BaseDir 'config\relation_state.json')
}

function Get-IpStatePath {
    param([string]$BaseDir)
    return (Join-Path $BaseDir 'config\ip_state.json')
}

function Get-MonitorPolicy {
    return [ordered]@{
        LearningWindowHours            = 48
        NewAutoApproveHits             = 3
        NewWindowHours                 = 48
        NewMaxAlerts                   = 3
        ObservationReminderScans       = 3
        ObservationMaxAlerts           = 10
        ObservationAlertWindowHours    = 12
        ObservationActiveDays          = 7
        ObservationAutoApproveHits     = 6
        SuspiciousReminderMinutes      = 10
        SuspiciousMaxAlertsPerDay      = 12
        SuspiciousQuietHours           = 72
        SharedIpKnownProcessLimit24h   = 5
        DormantRelationDays            = 30
        NormalPorts                    = @('53', '80', '123', '443')
    }
}

function Read-LinesAsSet {
    param([string]$Path)

    $set = New-Object 'System.Collections.Generic.HashSet[string]'
    if (Test-Path $Path) {
        foreach ($line in Get-Content -Path $Path) {
            $value = $line.Trim()
            if ($value) {
                [void]$set.Add($value.ToLowerInvariant())
            }
        }
    }
    return ,$set
}

function Read-JsonRecords {
    param([string]$Path)

    if (-not (Test-Path $Path)) {
        return @()
    }

    $raw = Get-Content -Path $Path -Raw
    if ([string]::IsNullOrWhiteSpace($raw)) {
        return @()
    }

    $data = $raw | ConvertFrom-Json
    if ($null -eq $data) {
        return @()
    }
    if ($data -is [System.Array]) {
        return @($data)
    }
    return @($data)
}

function Normalize-RelationRecord {
    param($Record)

    if (-not $Record.Key) {
        if ($Record.LocalPort -and ($Record.RemoteAddress -in @('', '0.0.0.0', '::', '*'))) {
            $Record.Key = ('listen|{0}|{1}|{2}' -f $Record.ProcessName, $Record.LocalAddress, $Record.LocalPort).ToLowerInvariant()
        } else {
            $Record.Key = ('remote|{0}|{1}|{2}' -f $Record.ProcessName, $Record.RemoteAddress, $Record.RemotePort).ToLowerInvariant()
        }
    } elseif ($Record.Key -notmatch '^(remote|listen)\|') {
        $Record.Key = ('remote|{0}|{1}|{2}' -f $Record.ProcessName, $Record.RemoteAddress, $Record.RemotePort).ToLowerInvariant()
    }

    if ($null -eq $Record.PSObject.Properties['LocalAddress']) {
        $Record | Add-Member -NotePropertyName LocalAddress -NotePropertyValue ''
    }
    if ($null -eq $Record.PSObject.Properties['LocalPort']) {
        $Record | Add-Member -NotePropertyName LocalPort -NotePropertyValue ''
    }
    if ($null -eq $Record.PSObject.Properties['LastObservationAlertReset']) {
        $fallbackReset = ''
        if ($null -ne $Record.PSObject.Properties['LastAlertAt'] -and $Record.LastAlertAt) {
            $fallbackReset = $Record.LastAlertAt
        } elseif ($null -ne $Record.PSObject.Properties['LastStatusChangeAt'] -and $Record.LastStatusChangeAt) {
            $fallbackReset = $Record.LastStatusChangeAt
        }
        $Record | Add-Member -NotePropertyName LastObservationAlertReset -NotePropertyValue $fallbackReset
    }
    if ($null -eq $Record.PSObject.Properties['ObservationWindowAlertCount']) {
        $fallbackObservationCount = 0
        if ($null -ne $Record.PSObject.Properties['Status'] -and $Record.Status -eq 'OBSERVACION' -and
            $null -ne $Record.PSObject.Properties['AlertCount']) {
            $fallbackObservationCount = [int]$Record.AlertCount
        }
        $Record | Add-Member -NotePropertyName ObservationWindowAlertCount -NotePropertyValue $fallbackObservationCount
    }
    if ($null -eq $Record.PSObject.Properties['LastObservationAlertScan']) {
        $Record | Add-Member -NotePropertyName LastObservationAlertScan -NotePropertyValue 0
    }
    return $Record
}

function Merge-RelationRecords {
    param([System.Collections.IEnumerable]$Records)

    $mergedMap = @{}
    foreach ($rawRecord in $Records) {
        $record = Normalize-RelationRecord -Record $rawRecord
        if (-not $mergedMap.ContainsKey($record.Key)) {
            $mergedMap[$record.Key] = $record
            continue
        }

        $existing = $mergedMap[$record.Key]

        if ($record.FirstSeenAt -and ((-not $existing.FirstSeenAt) -or ([datetime]$record.FirstSeenAt -lt [datetime]$existing.FirstSeenAt))) {
            $existing.FirstSeenAt = $record.FirstSeenAt
        }
        if ($record.LastSeenAt -and ((-not $existing.LastSeenAt) -or ([datetime]$record.LastSeenAt -gt [datetime]$existing.LastSeenAt))) {
            $existing.LastSeenAt = $record.LastSeenAt
        }
        if ($record.LastAlertAt -and ((-not $existing.LastAlertAt) -or ([datetime]$record.LastAlertAt -gt [datetime]$existing.LastAlertAt))) {
            $existing.LastAlertAt = $record.LastAlertAt
        }
        if ($record.LastStatusChangeAt -and ((-not $existing.LastStatusChangeAt) -or ([datetime]$record.LastStatusChangeAt -gt [datetime]$existing.LastStatusChangeAt))) {
            $existing.LastStatusChangeAt = $record.LastStatusChangeAt
            $existing.Status = $record.Status
        }
        $dailyResetComparison = 0
        if ($record.LastDailyAlertReset -and -not $existing.LastDailyAlertReset) {
            $dailyResetComparison = 1
        } elseif (-not $record.LastDailyAlertReset -and $existing.LastDailyAlertReset) {
            $dailyResetComparison = -1
        } elseif ($record.LastDailyAlertReset -and $existing.LastDailyAlertReset) {
            $recordDailyReset = [datetime]$record.LastDailyAlertReset
            $existingDailyReset = [datetime]$existing.LastDailyAlertReset
            if ($recordDailyReset -gt $existingDailyReset) {
                $dailyResetComparison = 1
            } elseif ($recordDailyReset -lt $existingDailyReset) {
                $dailyResetComparison = -1
            }
        }
        if ($dailyResetComparison -gt 0) {
            $existing.LastDailyAlertReset = $record.LastDailyAlertReset
            $existing.DailyAlertCount = $record.DailyAlertCount
        }
        $observationResetComparison = 0
        if ($record.LastObservationAlertReset -and -not $existing.LastObservationAlertReset) {
            $observationResetComparison = 1
        } elseif (-not $record.LastObservationAlertReset -and $existing.LastObservationAlertReset) {
            $observationResetComparison = -1
        } elseif ($record.LastObservationAlertReset -and $existing.LastObservationAlertReset) {
            $recordObservationReset = [datetime]$record.LastObservationAlertReset
            $existingObservationReset = [datetime]$existing.LastObservationAlertReset
            if ($recordObservationReset -gt $existingObservationReset) {
                $observationResetComparison = 1
            } elseif ($recordObservationReset -lt $existingObservationReset) {
                $observationResetComparison = -1
            }
        }
        if ($observationResetComparison -gt 0) {
            $existing.LastObservationAlertReset = $record.LastObservationAlertReset
            $existing.ObservationWindowAlertCount = $record.ObservationWindowAlertCount
        }

        $existing.TimesSeen = [Math]::Max([int]$existing.TimesSeen, [int]$record.TimesSeen)
        $existing.AlertCount = [Math]::Max([int]$existing.AlertCount, [int]$record.AlertCount)
        if ($dailyResetComparison -eq 0) {
            $existing.DailyAlertCount = [Math]::Max([int]$existing.DailyAlertCount, [int]$record.DailyAlertCount)
        }
        if ($observationResetComparison -eq 0) {
            $existing.ObservationWindowAlertCount = [Math]::Max([int]$existing.ObservationWindowAlertCount, [int]$record.ObservationWindowAlertCount)
        }
        $existing.LastObservationAlertScan = [Math]::Max([int]$existing.LastObservationAlertScan, [int]$record.LastObservationAlertScan)
        $existing.Archived = [bool]$existing.Archived -and [bool]$record.Archived
        $existing.ManualApproved = [bool]$existing.ManualApproved -or [bool]$record.ManualApproved
        $existing.ManualRejected = [bool]$existing.ManualRejected -or [bool]$record.ManualRejected

        if (-not $existing.LocalAddress -and $record.LocalAddress) {
            $existing.LocalAddress = $record.LocalAddress
        }
        if (-not $existing.LocalPort -and $record.LocalPort) {
            $existing.LocalPort = $record.LocalPort
        }
    }

    return @($mergedMap.Values)
}

function Write-JsonRecords {
    param(
        [string]$Path,
        [System.Collections.IEnumerable]$Records
    )

    $recordsArray = @($Records)
    if ($recordsArray.Count -eq 0) {
        [System.IO.File]::WriteAllText($Path, '[]')
        return
    }

    $json = [string]($recordsArray | ConvertTo-Json -Depth 6)
    [System.IO.File]::WriteAllText($Path, $json)
}

function ConvertTo-IniContent {
    param([System.Collections.IDictionary]$Values)

    $lines = foreach ($entry in $Values.GetEnumerator()) {
        '{0}={1}' -f $entry.Key, $entry.Value
    }

    if (@($lines).Count -eq 0) {
        return ''
    }

    return ([string]::Join([Environment]::NewLine, $lines) + [Environment]::NewLine)
}

function ConvertTo-JsonContent {
    param([System.Collections.IEnumerable]$Records)

    $recordsArray = @($Records)
    if ($recordsArray.Count -eq 0) {
        return '[]'
    }

    return [string]($recordsArray | ConvertTo-Json -Depth 6)
}

function Save-ScanSnapshot {
    param(
        [string]$BaseDir,
        [System.Collections.IDictionary]$State,
        [System.Collections.IEnumerable]$RelationRecords,
        [System.Collections.IEnumerable]$IpRecords
    )

    $targets = @(
        [pscustomobject]@{
            Path        = (Join-Path $BaseDir 'config\estado.ini')
            TempPath    = (Join-Path $BaseDir 'config\estado.ini.tmp')
            BackupPath  = (Join-Path $BaseDir 'config\estado.ini.bak')
            HadOriginal = (Test-Path (Join-Path $BaseDir 'config\estado.ini'))
            Content     = (ConvertTo-IniContent -Values $State)
        },
        [pscustomobject]@{
            Path        = (Get-RelationStatePath -BaseDir $BaseDir)
            TempPath    = ((Get-RelationStatePath -BaseDir $BaseDir) + '.tmp')
            BackupPath  = ((Get-RelationStatePath -BaseDir $BaseDir) + '.bak')
            HadOriginal = (Test-Path (Get-RelationStatePath -BaseDir $BaseDir))
            Content     = (ConvertTo-JsonContent -Records (Merge-RelationRecords -Records $RelationRecords))
        },
        [pscustomobject]@{
            Path        = (Get-IpStatePath -BaseDir $BaseDir)
            TempPath    = ((Get-IpStatePath -BaseDir $BaseDir) + '.tmp')
            BackupPath  = ((Get-IpStatePath -BaseDir $BaseDir) + '.bak')
            HadOriginal = (Test-Path (Get-IpStatePath -BaseDir $BaseDir))
            Content     = (ConvertTo-JsonContent -Records $IpRecords)
        }
    )

    try {
        foreach ($target in $targets) {
            [System.IO.File]::WriteAllText($target.TempPath, [string]$target.Content)
        }

        foreach ($target in $targets) {
            if ($target.HadOriginal) {
                Copy-Item -LiteralPath $target.Path -Destination $target.BackupPath -Force
            }
        }

        foreach ($target in $targets) {
            Move-Item -LiteralPath $target.TempPath -Destination $target.Path -Force
        }
    } catch {
        foreach ($target in $targets) {
            if ($target.HadOriginal -and (Test-Path $target.BackupPath)) {
                Copy-Item -LiteralPath $target.BackupPath -Destination $target.Path -Force
            }
        }
        throw
    } finally {
        foreach ($target in $targets) {
            if (Test-Path $target.TempPath) {
                Remove-Item -LiteralPath $target.TempPath -Force -ErrorAction SilentlyContinue
            }
            if (Test-Path $target.BackupPath) {
                Remove-Item -LiteralPath $target.BackupPath -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

function Get-ApprovedIps {
    param([string]$BaseDir)
    return Read-LinesAsSet -Path (Get-ApprovedIpsPath -BaseDir $BaseDir)
}

function Get-RejectedIps {
    param([string]$BaseDir)
    return Read-LinesAsSet -Path (Get-RejectedIpsPath -BaseDir $BaseDir)
}

function Get-ApprovedRules {
    param([string]$BaseDir)
    return Read-LinesAsSet -Path (Get-ApprovedRulesPath -BaseDir $BaseDir)
}

function Get-RejectedRules {
    param([string]$BaseDir)
    return Read-LinesAsSet -Path (Get-RejectedRulesPath -BaseDir $BaseDir)
}

function Add-ApprovedRule {
    param(
        [string]$BaseDir,
        [string]$RuleKey
    )

    if (-not $RuleKey) {
        return
    }

    $path = Get-ApprovedRulesPath -BaseDir $BaseDir
    $rules = Get-ApprovedRules -BaseDir $BaseDir
    [void]$rules.Add($RuleKey.ToLowerInvariant())
    ($rules.ToArray() | Sort-Object) | Set-Content -Path $path
}

function Remove-RejectedRule {
    param(
        [string]$BaseDir,
        [string]$RuleKey
    )

    if (-not $RuleKey) {
        return
    }

    $path = Get-RejectedRulesPath -BaseDir $BaseDir
    $rules = Get-RejectedRules -BaseDir $BaseDir
    [void]$rules.Remove($RuleKey.ToLowerInvariant())
    ($rules.ToArray() | Sort-Object) | Set-Content -Path $path
}

function Use-MonitorScanLock {
    param(
        [scriptblock]$Action
    )

    $scanMutex = $null
    $hasScanLock = $false
    try {
        $mutexName = 'Global\MonitorRed_ScanLock'
        $scanMutex = New-Object System.Threading.Mutex($false, $mutexName)
        try {
            $hasScanLock = $scanMutex.WaitOne([TimeSpan]::FromSeconds(5))
        } catch [System.Threading.AbandonedMutexException] {
            $hasScanLock = $true
        }

        if (-not $hasScanLock) {
            throw 'Ya hay un escaneo en progreso. Espera unos segundos e intenta de nuevo.'
        }

        return & $Action
    } finally {
        if ($hasScanLock -and $scanMutex) {
            [void]$scanMutex.ReleaseMutex()
        }
        if ($scanMutex) {
            $scanMutex.Dispose()
        }
    }
}

function Get-RelationRecords {
    param([string]$BaseDir)
    $records = @(Read-JsonRecords -Path (Get-RelationStatePath -BaseDir $BaseDir))
    return @(Merge-RelationRecords -Records $records)
}

function Save-RelationRecords {
    param(
        [string]$BaseDir,
        [System.Collections.IEnumerable]$Records
    )
    Write-JsonRecords -Path (Get-RelationStatePath -BaseDir $BaseDir) -Records (Merge-RelationRecords -Records $Records)
}

function Get-IpRecords {
    param([string]$BaseDir)
    return Read-JsonRecords -Path (Get-IpStatePath -BaseDir $BaseDir)
}

function Save-IpRecords {
    param(
        [string]$BaseDir,
        [System.Collections.IEnumerable]$Records
    )
    Write-JsonRecords -Path (Get-IpStatePath -BaseDir $BaseDir) -Records $Records
}

function Test-SuspiciousProcessName {
    param([string]$ProcessName)

    if (-not $ProcessName) {
        return $true
    }

    $normalized = $ProcessName.Trim().ToLowerInvariant()
    if (-not $normalized -or $normalized -eq 'desconocido') {
        return $true
    }

    return $normalized -in @(
        'powershell',
        'pwsh',
        'cmd',
        'wscript',
        'cscript',
        'rundll32',
        'mshta',
        'regsvr32'
    )
}

function Test-IsListeningRow {
    param($Row)

    return $Row.State -in @('LISTENING', 'Listening')
}

function Test-TrackableRemoteIp {
    param($Row)

    return $Row.RemoteAddress -and $Row.RemoteAddress -notin @('0.0.0.0', '::', '127.0.0.1', '::1', '*')
}

function Get-ActiveConnectionRows {
    param([System.Collections.IEnumerable]$Rows)

    return @(
        $Rows | Where-Object {
            if (Test-IsListeningRow -Row $_) {
                return ($_.LocalPort -and $_.LocalPort -ne '0')
            }

            return (
                (Test-TrackableRemoteIp -Row $_) -and
                $_.RemotePort -and
                $_.RemotePort -ne '0' -and
                $_.State -in @('ESTABLISHED', 'Established')
            )
        }
    )
}

function New-RelationKey {
    param($Row)
    if (Test-IsListeningRow -Row $Row) {
        return ('listen|{0}|{1}|{2}' -f $Row.ProcessName, $Row.LocalAddress, $Row.LocalPort).ToLowerInvariant()
    }
    return ('remote|{0}|{1}|{2}' -f $Row.ProcessName, $Row.RemoteAddress, $Row.RemotePort).ToLowerInvariant()
}

function New-RuleKey {
    param($Row)
    if (Test-IsListeningRow -Row $Row) {
        return ('listen|{0}|{1}|{2}' -f $Row.ProcessName, $Row.LocalAddress, $Row.LocalPort).ToLowerInvariant()
    }
    return ('remote|{0}|{1}|{2}' -f $Row.ProcessName, $Row.RemoteAddress, $Row.RemotePort).ToLowerInvariant()
}

function New-RelationRecord {
    param(
        $Row,
        [string]$Status,
        [datetime]$Now
    )

    return [pscustomobject]@{
        Key                 = (New-RelationKey -Row $Row)
        ProcessName         = $Row.ProcessName
        LocalAddress        = $Row.LocalAddress
        LocalPort           = $Row.LocalPort
        RemoteAddress       = $Row.RemoteAddress
        RemotePort          = $Row.RemotePort
        FirstSeenAt         = $Now.ToString('s')
        LastSeenAt          = $Now.ToString('s')
        TimesSeen           = 1
        Status              = $Status
        Archived            = $false
        AlertCount          = 0
        LastAlertAt         = ''
        LastStatusChangeAt  = $Now.ToString('s')
        LastDailyAlertReset = $Now.ToString('s')
        DailyAlertCount     = 0
        LastObservationAlertReset = $Now.ToString('s')
        ObservationWindowAlertCount = 0
        LastObservationAlertScan = 0
        ManualApproved      = $false
        ManualRejected      = $false
    }
}

function New-IpRecord {
    param(
        [string]$Ip,
        [datetime]$Now
    )

    return [pscustomobject]@{
        Ip                   = $Ip
        FirstSeenAt          = $Now.ToString('s')
        LastSeenAt           = $Now.ToString('s')
        TimesSeen            = 0
        DistinctProcessCount = 0
        ProcessList          = ''
        DistinctPortCount    = 0
        IpContext            = 'NORMAL'
        ManualApproved       = $false
        ManualRejected       = $false
    }
}

function Get-RelationRecordMap {
    param([System.Collections.IEnumerable]$Records)

    $map = @{}
    foreach ($record in $Records) {
        $map[$record.Key] = $record
    }
    return $map
}

function Get-IpRecordMap {
    param([System.Collections.IEnumerable]$Records)

    $map = @{}
    foreach ($record in $Records) {
        $map[$record.Ip] = $record
    }
    return $map
}

function Get-LearningModeState {
    param([string]$BaseDir)

    $state = Get-MonitorState -BaseDir $BaseDir
    $config = Get-MonitorConfig -BaseDir $BaseDir
    $policy = Get-MonitorPolicy
    $now = Get-Date

    if (-not $state.LearningStartedAt) {
        $state.LearningStartedAt = if ($config.FirstRunCompleted -eq '1') { $now.AddHours(-$policy.LearningWindowHours).ToString('s') } else { $now.ToString('s') }
    }
    if (-not $state.LearningEndsAt) {
        $state.LearningEndsAt = if ($config.FirstRunCompleted -eq '1') { $now.ToString('s') } else { $now.AddHours($policy.LearningWindowHours).ToString('s') }
    }
    Save-State -BaseDir $BaseDir -State $state

    $learningEndsAt = [datetime]$state.LearningEndsAt
    return [pscustomobject]@{
        Enabled = ($now -lt $learningEndsAt)
        EndsAt  = $learningEndsAt
    }
}

function Get-IpContext {
    param(
        [string]$Ip,
        [System.Collections.IEnumerable]$RelationRecords,
        [hashtable]$RelationMap,
        [datetime]$Now,
        [System.Collections.IDictionary]$Policy
    )

    $recentProcessNames = @(
        $RelationRecords |
            Where-Object { $_.RemoteAddress -eq $Ip } |
            Where-Object { $_.LastSeenAt } |
            Where-Object { ($Now - [datetime]$_.LastSeenAt).TotalHours -le 24 } |
            Select-Object -ExpandProperty ProcessName -Unique
    )

    if ($recentProcessNames.Count -gt $Policy.SharedIpKnownProcessLimit24h) {
        return 'AMBIGUA'
    }
    return 'NORMAL'
}

function Update-IpRecord {
    param(
        [pscustomobject]$IpRecord,
        [System.Collections.IEnumerable]$RowsForIp,
        [datetime]$Now,
        [System.Collections.IEnumerable]$RelationRecords,
        [hashtable]$RelationMap,
        [System.Collections.IDictionary]$Policy,
        [System.Collections.Generic.HashSet[string]]$ApprovedIps,
        [System.Collections.Generic.HashSet[string]]$RejectedIps
    )

    $IpRecord.LastSeenAt = $Now.ToString('s')
    $IpRecord.TimesSeen = [int]$IpRecord.TimesSeen + (@($RowsForIp).Count)
    $recentRelationsForIp = @(
        $RelationRecords |
            Where-Object { $_.RemoteAddress -eq $IpRecord.Ip } |
            Where-Object { $_.LastSeenAt } |
            Where-Object { ($Now - [datetime]$_.LastSeenAt).TotalHours -le 24 }
    )
    $processes = @($recentRelationsForIp | Select-Object -ExpandProperty ProcessName -Unique)
    $ports = @($recentRelationsForIp | Select-Object -ExpandProperty RemotePort -Unique)
    $IpRecord.DistinctProcessCount = $processes.Count
    $IpRecord.DistinctPortCount = $ports.Count
    $IpRecord.ProcessList = ($processes | Sort-Object) -join ','
    $IpRecord.IpContext = Get-IpContext -Ip $IpRecord.Ip -RelationRecords $RelationRecords -RelationMap $RelationMap -Now $Now -Policy $Policy
    $IpRecord.ManualApproved = $ApprovedIps.Contains($IpRecord.Ip.ToLowerInvariant())
    $IpRecord.ManualRejected = $RejectedIps.Contains($IpRecord.Ip.ToLowerInvariant())
}

function Test-NormalPort {
    param(
        [string]$Port,
        [System.Collections.IDictionary]$Policy
    )

    return $Port -in $Policy.NormalPorts
}

function Set-RelationStatus {
    param(
        [pscustomobject]$Record,
        [string]$Status,
        [datetime]$Now
    )

    if ($Record.Status -ne $Status) {
        $Record.Status = $Status
        $Record.LastStatusChangeAt = $Now.ToString('s')
        $Record.Archived = $false
    }
}

function Test-ShouldEmitAlert {
    param(
        [pscustomobject]$Record,
        [datetime]$Now,
        [System.Collections.IDictionary]$Policy,
        [int]$CurrentScanCount = 0
    )

    switch ($Record.Status) {
        'NUEVA' {
            return ([int]$Record.AlertCount -lt $Policy.NewMaxAlerts) -and ([int]$Record.TimesSeen -le $Policy.NewMaxAlerts)
        }
        'OBSERVACION' {
            $lastObservationReset = if ($Record.LastObservationAlertReset) { [datetime]$Record.LastObservationAlertReset } else { $Now }
            if ((New-TimeSpan -Start $lastObservationReset -End $Now).TotalHours -ge $Policy.ObservationAlertWindowHours) {
                $Record.LastObservationAlertReset = $Now.ToString('s')
                $Record.ObservationWindowAlertCount = 0
            }
            if ([int]$Record.ObservationWindowAlertCount -ge $Policy.ObservationMaxAlerts) {
                return $false
            }
            if (-not $Record.LastAlertAt) {
                return $true
            }
            $scansSinceLastAlert = $CurrentScanCount - [int]$Record.LastObservationAlertScan
            return ($scansSinceLastAlert -ge $Policy.ObservationReminderScans)
        }
        'SOSPECHOSA' {
            $lastReset = if ($Record.LastDailyAlertReset) { [datetime]$Record.LastDailyAlertReset } else { $Now }
            if ((New-TimeSpan -Start $lastReset -End $Now).TotalHours -ge 24) {
                $Record.LastDailyAlertReset = $Now.ToString('s')
                $Record.DailyAlertCount = 0
            }
            if ([int]$Record.DailyAlertCount -ge $Policy.SuspiciousMaxAlertsPerDay) {
                return $false
            }
            if (-not $Record.LastAlertAt) {
                return $true
            }
            return ((New-TimeSpan -Start ([datetime]$Record.LastAlertAt) -End $Now).TotalMinutes -ge $Policy.SuspiciousReminderMinutes)
        }
        'RECHAZADA' {
            $lastReset = if ($Record.LastDailyAlertReset) { [datetime]$Record.LastDailyAlertReset } else { $Now }
            if ((New-TimeSpan -Start $lastReset -End $Now).TotalHours -ge 24) {
                $Record.LastDailyAlertReset = $Now.ToString('s')
                $Record.DailyAlertCount = 0
            }
            if ([int]$Record.DailyAlertCount -ge $Policy.SuspiciousMaxAlertsPerDay) {
                return $false
            }
            if (-not $Record.LastAlertAt) {
                return $true
            }
            return ((New-TimeSpan -Start ([datetime]$Record.LastAlertAt) -End $Now).TotalMinutes -ge $Policy.SuspiciousReminderMinutes)
        }
        default {
            return $false
        }
    }
}

function Register-AlertEmission {
    param(
        [pscustomobject]$Record,
        [datetime]$Now,
        [int]$CurrentScanCount = 0
    )

    $Record.AlertCount = [int]$Record.AlertCount + 1
    $Record.LastAlertAt = $Now.ToString('s')
    if ($Record.Status -eq 'OBSERVACION') {
        if (-not $Record.LastObservationAlertReset) {
            $Record.LastObservationAlertReset = $Now.ToString('s')
        }
        $Record.ObservationWindowAlertCount = [int]$Record.ObservationWindowAlertCount + 1
        $Record.LastObservationAlertScan = $CurrentScanCount
    } elseif ($Record.Status -in @('SOSPECHOSA', 'RECHAZADA')) {
        if (-not $Record.LastDailyAlertReset) {
            $Record.LastDailyAlertReset = $Now.ToString('s')
        }
        $Record.DailyAlertCount = [int]$Record.DailyAlertCount + 1
    }
}

function New-EventMessage {
    param(
        [string]$Title,
        $Row,
        [pscustomobject]$Record
    )

    $extraLines = @()
    if ($Record.Status -in @('OBSERVACION', 'SOSPECHOSA') -and -not [bool]$Record.ManualApproved) {
        if ([int]$Record.TimesSeen -gt 1) {
            $extraLines += 'Ya fue vista antes y sigue fuera de BASE.'
        }
        if ($Record.Status -eq 'OBSERVACION') {
            $extraLines += 'Sigue en observacion con alertas controladas.'
        }
        $extraLines += 'Requiere aprobacion manual para pasar a BASE.'
    }

    if (Test-IsListeningRow -Row $Row) {
        return @(
            $Title
            ('Estado monitor: {0}' -f $Record.Status)
            'Tipo: PUERTO EN ESCUCHA'
            ('IP local: {0}' -f $Row.LocalAddress)
            ('Puerto local: {0}' -f $Row.LocalPort)
            ('Estado TCP: {0}' -f $Row.State)
            ('PID: {0}' -f $Row.Pid)
            ('Aplicacion: {0}' -f $Row.ProcessName)
            ('Veces vista: {0}' -f $Record.TimesSeen)
            $extraLines
        ) -join [Environment]::NewLine
    }

    return @(
        $Title
        ('Estado monitor: {0}' -f $Record.Status)
        ('IP remota: {0}' -f $Row.RemoteAddress)
        ('Puerto remoto: {0}' -f $Row.RemotePort)
        ('IP local: {0}' -f $Row.LocalAddress)
        ('Puerto local: {0}' -f $Row.LocalPort)
        ('Estado TCP: {0}' -f $Row.State)
        ('PID: {0}' -f $Row.Pid)
        ('Aplicacion: {0}' -f $Row.ProcessName)
        ('Veces vista: {0}' -f $Record.TimesSeen)
        $extraLines
    ) -join [Environment]::NewLine
}

function New-TelegramBatchMessage {
    param(
        [System.Collections.IEnumerable]$Events,
        [datetime]$Now
    )

    $eventArray = @($Events)
    if ($eventArray.Count -eq 0) {
        return ''
    }

    $maxLength = 3500
    $lines = @(
        'ALERTAS MONITORRED'
        ('Hora: {0}' -f $Now.ToString('yyyy-MM-dd HH:mm:ss'))
        ('Eventos incluidos: {0}' -f $eventArray.Count)
        ''
    )

    for ($i = 0; $i -lt $eventArray.Count; $i++) {
        $event = $eventArray[$i]
        $block = @(
            '[{0}/{1}] {2}' -f ($i + 1), $eventArray.Count, $event.Status
            $event.Message
            ''
        ) -join [Environment]::NewLine
        $candidate = (@($lines) + $block) -join [Environment]::NewLine
        if ($candidate.Length -gt $maxLength) {
            $remaining = $eventArray.Count - $i
            if ($remaining -gt 0) {
                $lines += ('... y {0} evento(s) mas no incluidos por limite de tamano.' -f $remaining)
            }
            break
        }
        $lines += $block
    }

    return $lines -join [Environment]::NewLine
}

function Classify-NewRelation {
    param(
        $Row,
        [string]$IpContext,
        [System.Collections.IDictionary]$Policy,
        [System.Collections.Generic.HashSet[string]]$ApprovedIps,
        [System.Collections.Generic.HashSet[string]]$RejectedIps,
        [System.Collections.Generic.HashSet[string]]$ApprovedRules,
        [System.Collections.Generic.HashSet[string]]$RejectedRules,
        [bool]$LearningMode
    )

    $ruleKey = New-RuleKey -Row $Row
    $isListening = Test-IsListeningRow -Row $Row
    $ipKey = if (Test-TrackableRemoteIp -Row $Row) { $Row.RemoteAddress.ToLowerInvariant() } else { '' }
    $isSuspiciousProcess = Test-SuspiciousProcessName -ProcessName $Row.ProcessName
    $isNormalPort = Test-NormalPort -Port $(if ($isListening) { $Row.LocalPort } else { $Row.RemotePort }) -Policy $Policy

    if ($RejectedRules.Contains($ruleKey) -or ($ipKey -and $RejectedIps.Contains($ipKey))) {
        return 'RECHAZADA'
    }
    if ($ApprovedRules.Contains($ruleKey)) {
        return 'BASE'
    }
    if ($isSuspiciousProcess) {
        return 'SOSPECHOSA'
    }
    if ($isListening) {
        return 'OBSERVACION'
    }
    if ($IpContext -eq 'AMBIGUA') {
        return 'OBSERVACION'
    }
    if ($ipKey -and $ApprovedIps.Contains($ipKey) -and $isNormalPort) {
        return 'NUEVA'
    }
    if ($LearningMode -and $isNormalPort) {
        return 'NUEVA'
    }
    if ($isNormalPort) {
        return 'NUEVA'
    }
    return 'OBSERVACION'
}

function Seed-SeenConnections {
    param(
        [string]$BaseDir,
        [System.Collections.IEnumerable]$Rows,
        [switch]$TreatApprovedIpsAsBase
    )

    $now = Get-Date
    $approvedIps = Get-ApprovedIps -BaseDir $BaseDir
    $rejectedIps = Get-RejectedIps -BaseDir $BaseDir
    $approvedRules = Get-ApprovedRules -BaseDir $BaseDir
    $rejectedRules = Get-RejectedRules -BaseDir $BaseDir
    $policy = Get-MonitorPolicy
    $activeRows = Get-ActiveConnectionRows -Rows $Rows
    $relationRecords = @()
    $ipRecords = @()
    $ipMap = @{}

    foreach ($row in $activeRows) {
        $ruleKey = New-RuleKey -Row $row
        $ipKey = if (Test-TrackableRemoteIp -Row $row) { $row.RemoteAddress.ToLowerInvariant() } else { '' }
        $status = if ($rejectedRules.Contains($ruleKey) -or $rejectedIps.Contains($ipKey)) {
            'RECHAZADA'
        } elseif ($approvedRules.Contains($ruleKey)) {
            'BASE'
        } elseif ($TreatApprovedIpsAsBase -and $approvedIps.Contains($ipKey)) {
            'BASE'
        } elseif ($approvedIps.Contains($ipKey) -and (Test-NormalPort -Port $row.RemotePort -Policy $policy)) {
            'NUEVA'
        } elseif ($approvedIps.Contains($ipKey)) {
            'OBSERVACION'
        } elseif (Test-IsListeningRow -Row $row) {
            if (Test-SuspiciousProcessName -ProcessName $row.ProcessName) { 'SOSPECHOSA' } else { 'OBSERVACION' }
        } elseif (Test-SuspiciousProcessName -ProcessName $row.ProcessName) {
            'SOSPECHOSA'
        } elseif (Test-NormalPort -Port $row.RemotePort -Policy $policy) {
            'NUEVA'
        } else {
            'OBSERVACION'
        }

        $record = New-RelationRecord -Row $row -Status $status -Now $now
        if ($status -eq 'BASE') {
            $record.ManualApproved = $true
        }
        if ($status -eq 'RECHAZADA') {
            $record.ManualRejected = $true
        }
        $relationRecords += $record

        if ((Test-TrackableRemoteIp -Row $row) -and (-not $ipMap.ContainsKey($row.RemoteAddress))) {
            $ipRecord = New-IpRecord -Ip $row.RemoteAddress -Now $now
            $ipMap[$row.RemoteAddress] = $ipRecord
            $ipRecords += $ipRecord
        }
    }

    $relationMap = Get-RelationRecordMap -Records $relationRecords
    foreach ($ipRecord in $ipRecords) {
        $rowsForIp = @($activeRows | Where-Object { $_.RemoteAddress -eq $ipRecord.Ip })
        Update-IpRecord -IpRecord $ipRecord -RowsForIp $rowsForIp -Now $now -RelationRecords $relationRecords -RelationMap $relationMap -Policy $policy -ApprovedIps $approvedIps -RejectedIps $rejectedIps
    }

    Save-RelationRecords -BaseDir $BaseDir -Records $relationRecords
    Save-IpRecords -BaseDir $BaseDir -Records $ipRecords
}

function Approve-RelationFromReport {
    param([string]$BaseDir)

    $config = Get-MonitorConfig -BaseDir $BaseDir
    $reportPath = Join-Path $config.ReportsFolder 'informe_actual.csv'
    if (-not (Test-Path $reportPath)) {
        throw 'Todavia no existe informe_actual.csv para aprobar una regla.'
    }

    $rows = @(
        Import-Csv -Path $reportPath -Delimiter ';' |
            Where-Object { $_.MonitorStatus -in @('NUEVA', 'OBSERVACION', 'SOSPECHOSA', 'RECHAZADA') }
    )

    if ($rows.Count -eq 0) {
        Write-Host ''
        Write-Host 'No hay relaciones pendientes para aprobar en el reporte actual.' -ForegroundColor Yellow
        return
    }

    Write-Host ''
    Write-Host 'Relaciones disponibles para aprobar:' -ForegroundColor Cyan
    for ($i = 0; $i -lt $rows.Count; $i++) {
        $row = $rows[$i]
        $remoteLabel = if ($row.RemoteAddress -and $row.RemoteAddress -notin @('0.0.0.0', '::', '*')) {
            ($row.RemoteAddress + ':' + $row.RemotePort)
        } else {
            ('LISTEN ' + $row.LocalAddress + ':' + $row.LocalPort)
        }
        Write-Host ('[{0}] {1} | {2} | {3} | {4}' -f ($i + 1), $row.MonitorStatus, $row.ProcessName, $remoteLabel, ('PID ' + $row.Pid))
    }

    $choice = Read-Host 'Escribi el numero de la relacion a aprobar'
    if ($choice -notmatch '^\d+$') {
        throw 'Numero invalido.'
    }

    $index = [int]$choice - 1
    if ($index -lt 0 -or $index -ge $rows.Count) {
        throw 'Numero fuera de rango.'
    }

    $selectedRow = $rows[$index]
    $rowObject = [pscustomobject]@{
        Protocol      = $selectedRow.Protocol
        State         = $selectedRow.State
        LocalAddress  = $selectedRow.LocalAddress
        LocalPort     = $selectedRow.LocalPort
        RemoteAddress = $selectedRow.RemoteAddress
        RemotePort    = $selectedRow.RemotePort
        Pid           = $selectedRow.Pid
        ProcessName   = $selectedRow.ProcessName
    }

    $ruleKey = New-RuleKey -Row $rowObject

    Use-MonitorScanLock -Action {
        Add-ApprovedRule -BaseDir $BaseDir -RuleKey $ruleKey
        Remove-RejectedRule -BaseDir $BaseDir -RuleKey $ruleKey

        $relationRecords = @(Get-RelationRecords -BaseDir $BaseDir)
        $relationMap = Get-RelationRecordMap -Records $relationRecords
        if ($relationMap.ContainsKey($ruleKey)) {
            $record = $relationMap[$ruleKey]
            $record.ManualApproved = $true
            $record.ManualRejected = $false
            Set-RelationStatus -Record $record -Status 'BASE' -Now (Get-Date)
            Save-RelationRecords -BaseDir $BaseDir -Records $relationRecords
        }
    } | Out-Null

    Write-Log -BaseDir $BaseDir -Name 'monitor.log' -Message ("Regla aprobada manualmente: {0}" -f $ruleKey)
    Write-Host ''
    Write-Host 'Regla aprobada y pasada a BASE.' -ForegroundColor Green
}

function Compare-NewConnections {
    param(
        [string]$BaseDir,
        [System.Collections.IEnumerable]$Rows,
        [int]$CurrentScanCount = 0
    )

    $now = Get-Date
    $policy = Get-MonitorPolicy
    $learning = Get-LearningModeState -BaseDir $BaseDir
    $approvedIps = Get-ApprovedIps -BaseDir $BaseDir
    $rejectedIps = Get-RejectedIps -BaseDir $BaseDir
    $approvedRules = Get-ApprovedRules -BaseDir $BaseDir
    $rejectedRules = Get-RejectedRules -BaseDir $BaseDir
    $relationRecords = @(Get-RelationRecords -BaseDir $BaseDir)
    $ipRecords = @(Get-IpRecords -BaseDir $BaseDir)
    $monitorConfig = Get-MonitorConfig -BaseDir $BaseDir
    if ($relationRecords.Count -eq 0 -and $ipRecords.Count -eq 0 -and $monitorConfig.FirstRunCompleted -eq '1') {
        Seed-SeenConnections -BaseDir $BaseDir -Rows $Rows
        $relationRecords = @(Get-RelationRecords -BaseDir $BaseDir)
        $ipRecords = @(Get-IpRecords -BaseDir $BaseDir)
    }
    $relationMap = Get-RelationRecordMap -Records $relationRecords
    $ipMap = Get-IpRecordMap -Records $ipRecords
    $activeRows = @(Get-ActiveConnectionRows -Rows $Rows)
    $activeKeys = New-Object 'System.Collections.Generic.HashSet[string]'
    $events = New-Object System.Collections.Generic.List[object]
    $rowsForReport = New-Object System.Collections.Generic.List[object]

    foreach ($row in $activeRows) {
        $key = New-RelationKey -Row $row
        $ruleKey = New-RuleKey -Row $row
        [void]$activeKeys.Add($key)

        if ((Test-TrackableRemoteIp -Row $row) -and (-not $ipMap.ContainsKey($row.RemoteAddress))) {
            $newIpRecord = New-IpRecord -Ip $row.RemoteAddress -Now $now
            $ipMap[$row.RemoteAddress] = $newIpRecord
            $ipRecords += $newIpRecord
        }

        $record = $null
        if ($relationMap.ContainsKey($key)) {
            $record = $relationMap[$key]
            $previousLastSeenAt = if ($record.LastSeenAt) { [datetime]$record.LastSeenAt } else { $null }
            $record.LastSeenAt = $now.ToString('s')
            $record.TimesSeen = [int]$record.TimesSeen + 1
            $record.Archived = $false
            if ($record.Status -eq 'BASE') {
                if ($previousLastSeenAt -and ((New-TimeSpan -Start $previousLastSeenAt -End $now).TotalDays -ge $policy.DormantRelationDays)) {
                    Set-RelationStatus -Record $record -Status 'OBSERVACION' -Now $now
                }
            } elseif ($record.Status -eq 'OBSERVACION' -and ($approvedRules.Contains($ruleKey) -or $record.ManualApproved)) {
                Set-RelationStatus -Record $record -Status 'BASE' -Now $now
                $record.ManualApproved = $true
            } elseif ((Test-IsListeningRow -Row $row) -and $record.Status -eq 'SOSPECHOSA' -and -not $record.ManualRejected -and -not (Test-SuspiciousProcessName -ProcessName $row.ProcessName)) {
                Set-RelationStatus -Record $record -Status 'OBSERVACION' -Now $now
            } elseif ($record.Status -eq 'NUEVA') {
                $firstSeenAt = [datetime]$record.FirstSeenAt
                if ([int]$record.TimesSeen -ge $policy.NewAutoApproveHits -and ((New-TimeSpan -Start $firstSeenAt -End $now).TotalHours -le $policy.NewWindowHours)) {
                    Set-RelationStatus -Record $record -Status 'BASE' -Now $now
                } elseif ((New-TimeSpan -Start $firstSeenAt -End $now).TotalHours -gt $policy.NewWindowHours) {
                    Set-RelationStatus -Record $record -Status 'OBSERVACION' -Now $now
                }
            }
        } else {
            $ipContext = if (Test-TrackableRemoteIp -Row $row) { Get-IpContext -Ip $row.RemoteAddress -RelationRecords $relationRecords -RelationMap $relationMap -Now $now -Policy $policy } else { 'NORMAL' }
            $status = Classify-NewRelation -Row $row -IpContext $ipContext -Policy $policy -ApprovedIps $approvedIps -RejectedIps $rejectedIps -ApprovedRules $approvedRules -RejectedRules $rejectedRules -LearningMode $learning.Enabled
            $record = New-RelationRecord -Row $row -Status $status -Now $now
            if ($status -eq 'BASE') {
                $record.ManualApproved = $true
            }
            if ($status -eq 'RECHAZADA') {
                $record.ManualRejected = $true
            }
            $relationMap[$key] = $record
            $relationRecords += $record
        }

        if ($record.Status -eq 'NUEVA' -and [int]$record.TimesSeen -ge $policy.NewAutoApproveHits) {
            $firstSeenAt = [datetime]$record.FirstSeenAt
            if ((New-TimeSpan -Start $firstSeenAt -End $now).TotalHours -le $policy.NewWindowHours) {
                Set-RelationStatus -Record $record -Status 'BASE' -Now $now
            }
        }

        if ($record.Status -in @('NUEVA', 'OBSERVACION', 'SOSPECHOSA', 'RECHAZADA')) {
            if (Test-ShouldEmitAlert -Record $record -Now $now -Policy $policy -CurrentScanCount $CurrentScanCount) {
                Register-AlertEmission -Record $record -Now $now -CurrentScanCount $CurrentScanCount
                $title = switch ($record.Status) {
                    'NUEVA' { 'NUEVA CONEXION DETECTADA' }
                    'OBSERVACION' { 'OBSERVACION DE RED' }
                    'RECHAZADA' { 'CONEXION RECHAZADA DETECTADA' }
                    default { 'ALERTA DE RED' }
                }
                $severity = if ($record.Status -in @('SOSPECHOSA', 'RECHAZADA')) { 'ALERTA' } else { 'OBSERVACION' }
                $message = New-EventMessage -Title $title -Row $row -Record $record
                $events.Add([pscustomobject]@{
                    Severity = $severity
                    Status   = $record.Status
                    Message  = $message
                    Row      = $row
                }) | Out-Null
            }
        }

        $rowsForReport.Add([pscustomobject]@{
            Protocol      = $row.Protocol
            State         = $row.State
            LocalAddress  = $row.LocalAddress
            LocalPort     = $row.LocalPort
            RemoteAddress = $row.RemoteAddress
            RemotePort    = $row.RemotePort
            Pid           = $row.Pid
            ProcessName   = $row.ProcessName
            MonitorStatus = $record.Status
        }) | Out-Null
    }

    foreach ($record in $relationRecords) {
        if ($activeKeys.Contains($record.Key)) {
            continue
        }
        if (-not $record.LastSeenAt) {
            continue
        }
        $lastSeenAt = [datetime]$record.LastSeenAt
        switch ($record.Status) {
            'OBSERVACION' {
                if ((New-TimeSpan -Start $lastSeenAt -End $now).TotalDays -ge $policy.ObservationActiveDays) {
                    $record.Archived = $true
                }
            }
            'SOSPECHOSA' {
                if ((New-TimeSpan -Start $lastSeenAt -End $now).TotalHours -ge $policy.SuspiciousQuietHours) {
                    $record.Archived = $true
                }
            }
            'RECHAZADA' {
                if ((New-TimeSpan -Start $lastSeenAt -End $now).TotalHours -ge $policy.SuspiciousQuietHours) {
                    $record.Archived = $true
                }
            }
            'NUEVA' {
                if ((New-TimeSpan -Start $lastSeenAt -End $now).TotalHours -ge $policy.NewWindowHours) {
                    Set-RelationStatus -Record $record -Status 'OBSERVACION' -Now $now
                    $record.Archived = $true
                }
            }
        }
    }

    foreach ($ipRecord in $ipRecords) {
        $rowsForIp = @($activeRows | Where-Object { $_.RemoteAddress -eq $ipRecord.Ip })
        if ($rowsForIp.Count -gt 0) {
            Update-IpRecord -IpRecord $ipRecord -RowsForIp $rowsForIp -Now $now -RelationRecords $relationRecords -RelationMap $relationMap -Policy $policy -ApprovedIps $approvedIps -RejectedIps $rejectedIps
        }
    }

    return [pscustomobject]@{
        Events          = $events.ToArray()
        RowsForReport   = $rowsForReport.ToArray()
        ActiveRows      = $activeRows
        LearningMode    = $learning.Enabled
        RelationRecords = $relationRecords
        IpRecords       = $ipRecords
    }
}

function Invoke-MonitorScan {
    param(
        [string]$BaseDir,
        [switch]$ForceHistorical
    )

    return Use-MonitorScanLock -Action {
        $config = Get-MonitorConfig -BaseDir $BaseDir
        $state = Get-MonitorState -BaseDir $BaseDir
        $currentScanCount = [int]$state.ScanCount + 1
        $state.ScanCount = "$currentScanCount"
        $rows = Get-CurrentConnections
        $comparison = Compare-NewConnections -BaseDir $BaseDir -Rows $rows -CurrentScanCount $currentScanCount
        $events = @($comparison.Events)
        $alertEvents = @($events | Where-Object { $_.Status -in @('OBSERVACION', 'SOSPECHOSA', 'RECHAZADA') })

        foreach ($event in $events) {
            $logName = if ($event.Status -in @('SOSPECHOSA', 'RECHAZADA')) { 'alertas.log' } else { 'monitor.log' }
            Write-Log -BaseDir $BaseDir -Name $logName -Message $event.Message
        }

        if ($alertEvents.Count -gt 0) {
            $telegramMessage = New-TelegramBatchMessage -Events $alertEvents -Now (Get-Date)
            if ($telegramMessage) {
                [void](Send-TelegramAlert -BaseDir $BaseDir -Message $telegramMessage)
            }
        }

        $exportRows = if ($comparison.RowsForReport.Count -gt 0) { $comparison.RowsForReport } else { $rows }

        $exportHistorical = $false
        if ($ForceHistorical) {
            $exportHistorical = $true
        } else {
            $lastHistorical = $null
            if ($state.LastHistoricalReportAt) {
                $lastHistorical = [datetime]$state.LastHistoricalReportAt
            }
            $hours = [double]$config.ReportIntervalHours
            if (-not $lastHistorical -or ((Get-Date) - $lastHistorical).TotalHours -ge $hours) {
                $exportHistorical = $true
            }
        }

        if ($exportHistorical) {
            Export-NetworkReports -BaseDir $BaseDir -Rows $exportRows -Historical:$true
            $state.LastHistoricalReportAt = (Get-Date).ToString('s')
        } else {
            Export-NetworkReports -BaseDir $BaseDir -Rows $exportRows
        }

        $state.LastScanAt = (Get-Date).ToString('s')
        $state.LastConnectionCount = "$($exportRows.Count)"
        Save-ScanSnapshot -BaseDir $BaseDir -State $state -RelationRecords $comparison.RelationRecords -IpRecords $comparison.IpRecords

        $alertCount = @($events | Where-Object { $_.Status -in @('SOSPECHOSA', 'RECHAZADA') }).Count
        $noticeCount = @($events | Where-Object { $_.Status -in @('NUEVA', 'OBSERVACION') }).Count
        Write-Log -BaseDir $BaseDir -Name 'monitor.log' -Message "Escaneo completado. Conexiones=$($rows.Count) Alertas=$alertCount Observaciones=$noticeCount LearningMode=$($comparison.LearningMode)"

        return [pscustomobject]@{
            Rows       = $exportRows
            EventRows  = @($events)
            NewRows    = @($events | Where-Object { $_.Status -eq 'NUEVA' })
            AlertRows  = @($events | Where-Object { $_.Status -in @('SOSPECHOSA', 'RECHAZADA') })
            NoticeRows = @($events | Where-Object { $_.Status -in @('NUEVA', 'OBSERVACION') })
        }
    }
}

function Send-TelegramAlert {
    param(
        [string]$BaseDir,
        [string]$Message
    )

    $telegram = Get-TelegramConfig -BaseDir $BaseDir
    if ($telegram.AlertsEnabled -ne '1') {
        return [pscustomobject]@{
            Attempted = $false
            Sent      = $false
            Reason    = 'Disabled'
        }
    }
    if (-not $telegram.BotToken -or -not $telegram.ChatId) {
        Write-Log -BaseDir $BaseDir -Name 'errores.log' -Message 'Telegram habilitado pero faltan BotToken o ChatId.'
        return [pscustomobject]@{
            Attempted = $false
            Sent      = $false
            Reason    = 'MissingCredentials'
        }
    }

    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        $uri = "https://api.telegram.org/bot$($telegram.BotToken)/sendMessage"
        Invoke-RestMethod -Method Post -Uri $uri -Body @{
            chat_id = $telegram.ChatId
            text    = $Message
        } -TimeoutSec 15 | Out-Null
        return [pscustomobject]@{
            Attempted = $true
            Sent      = $true
            Reason    = 'Sent'
        }
    } catch {
        Write-Log -BaseDir $BaseDir -Name 'errores.log' -Message ('Fallo Telegram: ' + $_.Exception.Message)
        return [pscustomobject]@{
            Attempted = $true
            Sent      = $false
            Reason    = 'RequestFailed'
        }
    }
}

function Send-TelegramAlertWithRetry {
    param(
        [string]$BaseDir,
        [string]$Message,
        [int]$Attempts = 3,
        [int]$DelaySeconds = 10
    )

    for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
        $result = Send-TelegramAlert -BaseDir $BaseDir -Message $Message
        if ($result.Sent) {
            return $true
        }
        if (-not $result.Attempted) {
            return $false
        }

        if ($attempt -lt $Attempts) {
            Start-Sleep -Seconds $DelaySeconds
        }
    }

    return $false
}

function Test-WorkerAlive {
    param([string]$BaseDir)

    $state = Get-MonitorState -BaseDir $BaseDir
    if (-not $state.WorkerPid) {
        return $false
    }

    $proc = Get-Process -Id ([int]$state.WorkerPid) -ErrorAction SilentlyContinue
    if (-not $proc) {
        Clear-StaleWorkerState -BaseDir $BaseDir -Reason 'PID inexistente'
        return $false
    }

    if ($proc.ProcessName -notmatch 'powershell|pwsh') {
        Clear-StaleWorkerState -BaseDir $BaseDir -Reason ('Proceso inesperado: ' + $proc.ProcessName)
        return $false
    }

    return $true
}

function Ensure-MonitorLoop {
    param(
        [string]$BaseDir,
        [switch]$Restart
    )

    $state = Get-MonitorState -BaseDir $BaseDir
    if ($Restart -and $state.WorkerPid) {
        Stop-Process -Id ([int]$state.WorkerPid) -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
        Clear-StaleWorkerState -BaseDir $BaseDir -Reason 'Reinicio solicitado desde la interfaz'
    } elseif (Test-WorkerAlive -BaseDir $BaseDir) {
        return
    }

    $ps = Join-Path $BaseDir 'monitor_loop.ps1'
    $proc = Start-Process -FilePath 'powershell.exe' -ArgumentList @(
        '-NoProfile',
        '-ExecutionPolicy', 'Bypass',
        '-WindowStyle', 'Hidden',
        '-File', $ps,
        '-StartupSource', 'ManualStart'
    ) -WindowStyle Hidden -PassThru

    [void](Update-WorkerState -BaseDir $BaseDir -WorkerProcessId $proc.Id -StartedAt (Get-Date).ToString('s') -Mode 'MONITOREO')
    Write-Log -BaseDir $BaseDir -Name 'monitor.log' -Message "Worker lanzado desde la interfaz. PID=$($proc.Id)"
}

function Show-MonitorConsole {
    param([string]$BaseDir)

    $config = Get-MonitorConfig -BaseDir $BaseDir
    $state = Get-MonitorState -BaseDir $BaseDir
    $reportPath = Join-Path $config.ReportsFolder 'informe_actual.csv'
    $workerActive = 'NO'
    if (Test-WorkerAlive -BaseDir $BaseDir) {
        $workerActive = 'SI'
    }

    $workerPidValue = 'N/D'
    if ($state.WorkerPid) {
        $workerPidValue = $state.WorkerPid
    }

    $workerHeartbeatValue = 'N/D'
    if ($state.WorkerHeartbeatAt) {
        $workerHeartbeatValue = $state.WorkerHeartbeatAt
    }

    $lastScanValue = 'N/D'
    if ($state.LastScanAt) {
        $lastScanValue = $state.LastScanAt
    }

    $lastHistoricalValue = 'N/D'
    if ($state.LastHistoricalReportAt) {
        $lastHistoricalValue = $state.LastHistoricalReportAt
    }

    $lastConnectionCountValue = '0'
    if ($state.LastConnectionCount) {
        $lastConnectionCountValue = $state.LastConnectionCount
    }

    Clear-Host
    Write-Host '=====================================================================' -ForegroundColor Cyan
    Write-Host '   MONITOR TOTAL TCP (IPv4 + IPv6) - MODO RESIDENTE' -ForegroundColor Cyan
    Write-Host '=====================================================================' -ForegroundColor Cyan
    Write-Host ('Worker activo: {0}' -f $workerActive)
    Write-Host ('PID worker: {0}' -f $workerPidValue)
    Write-Host ('Heartbeat worker: {0}' -f $workerHeartbeatValue)
    Write-Host ('Ultimo escaneo: {0}' -f $lastScanValue)
    Write-Host ('Ultimo historico: {0}' -f $lastHistoricalValue)
    Write-Host ('Conexiones vistas: {0}' -f $lastConnectionCountValue)
    Write-Host ('Reportes: {0}' -f $config.ReportsFolder)
    $telegramState = Get-TelegramConfig -BaseDir $BaseDir
    $telegramStatus = if ($telegramState.AlertsEnabled -eq '1') { 'SI' } else { 'NO' }
    if ($telegramState.AlertsEnabled -eq '1' -and (-not $telegramState.BotToken -or -not $telegramState.ChatId)) {
        $telegramStatus = 'CONFIG INCOMPLETA'
    }
    Write-Host ('Telegram activo: {0}' -f $telegramStatus)
    Write-Host ''
    Write-Host 'PID      ESTADO         LOCAL                             REMOTA                            APP'
    Write-Host '---------------------------------------------------------------------------------------------'

    if (Test-Path $reportPath) {
        $rows = Import-Csv -Path $reportPath -Delimiter ';' | Select-Object -First 20
        foreach ($row in $rows) {
            $line = '{0,-8} {1,-13} {2,-32} {3,-32} {4}' -f $row.Pid, $row.State, ($row.LocalAddress + ':' + $row.LocalPort), ($row.RemoteAddress + ':' + $row.RemotePort), $row.ProcessName
            Write-Host $line
        }
    } else {
        Write-Host 'Todavia no hay reporte generado.'
    }

    Write-Host '---------------------------------------------------------------------------------------------'
    Write-Host '1 = Actualizar reporte ahora'
    Write-Host '2 = Matar proceso por PID'
    Write-Host '3 = Reiniciar monitoreo'
    Write-Host '4 = Configurar Telegram'
    Write-Host '5 = Aprobar regla del reporte actual'
    Write-Host '6 = Salir de la interfaz'
    Write-Host ''
}
