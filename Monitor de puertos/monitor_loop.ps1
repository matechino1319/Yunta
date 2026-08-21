param(
    [string]$StartupSource = 'Unknown'
)

$ErrorActionPreference = 'Stop'

$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $ScriptRoot 'monitor_lib.ps1')

$workerMutexName = 'Global\MonitorRed_WorkerLock'
$workerMutex = $null
$hasWorkerMutex = $false

$workerMutex = New-Object System.Threading.Mutex($false, $workerMutexName)
try {
    try {
        $hasWorkerMutex = $workerMutex.WaitOne([TimeSpan]::FromSeconds(1))
    } catch [System.Threading.AbandonedMutexException] {
        $hasWorkerMutex = $true
    }

    if (-not $hasWorkerMutex) {
        Write-Log -BaseDir $ScriptRoot -Name 'monitor.log' -Message 'Inicio omitido: ya existe otro worker activo.'
        exit 0
    }
} catch {
    if ($workerMutex) {
        $workerMutex.Dispose()
    }
    throw
}

Initialize-MonitorEnvironment -BaseDir $ScriptRoot
$workerStartedAt = (Get-Date).ToString('s')
[void](Update-WorkerState -BaseDir $ScriptRoot -WorkerProcessId $PID -StartedAt $workerStartedAt -Mode 'MONITOREO')

Write-Log -BaseDir $ScriptRoot -Name 'monitor.log' -Message "Worker iniciado. PID=$PID Origen=$StartupSource"
if ($StartupSource -eq 'AutoStart') {
    $startupMessage = @(
        'MONITORRED AUTOARRANCADO'
        ('Equipo: {0}' -f $env:COMPUTERNAME)
        ('Usuario: {0}' -f $env:USERNAME)
        ('Hora: {0}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))
        ('PID worker: {0}' -f $PID)
        'El monitoreo en segundo plano se inicio automaticamente.'
    ) -join [Environment]::NewLine
    $notificationSent = Send-TelegramAlertWithRetry -BaseDir $ScriptRoot -Message $startupMessage -Attempts 4 -DelaySeconds 15
    if ($notificationSent) {
        Write-Log -BaseDir $ScriptRoot -Name 'monitor.log' -Message 'Aviso de autoarranque enviado por Telegram.'
    } else {
        Write-Log -BaseDir $ScriptRoot -Name 'errores.log' -Message 'No se pudo enviar el aviso de autoarranque por Telegram luego de varios intentos.'
    }
}

try {
    while ($true) {
        $cycleStartedAt = Get-Date
        $scanIntervalSeconds = 600

        try {
            $config = Get-MonitorConfig -BaseDir $ScriptRoot
            if ($config.ScanIntervalMinutes) {
                $scanIntervalSeconds = [Math]::Max(1, [int]([double]$config.ScanIntervalMinutes * 60))
            }

            [void](Update-WorkerState -BaseDir $ScriptRoot -WorkerProcessId $PID -StartedAt $workerStartedAt -Mode 'MONITOREO')
            [void](Invoke-MonitorScan -BaseDir $ScriptRoot)
        } catch {
            Write-Log -BaseDir $ScriptRoot -Name 'errores.log' -Message ("Worker error en ciclo. PID=$PID Detalle=" + $_.Exception.Message)
        }

        try {
            [void](Update-WorkerState -BaseDir $ScriptRoot -WorkerProcessId $PID -StartedAt $workerStartedAt -Mode 'MONITOREO')
        } catch {
            Write-Log -BaseDir $ScriptRoot -Name 'errores.log' -Message ("No se pudo actualizar el heartbeat del worker. PID=$PID Detalle=" + $_.Exception.Message)
        }

        $elapsedSeconds = [int][Math]::Floor(((Get-Date) - $cycleStartedAt).TotalSeconds)
        $sleepSeconds = [Math]::Max(1, $scanIntervalSeconds - $elapsedSeconds)
        Start-Sleep -Seconds $sleepSeconds
    }
} catch {
    Write-Log -BaseDir $ScriptRoot -Name 'errores.log' -Message ("Fallo fatal del worker. PID=$PID Detalle=" + $_.Exception.Message)
    throw
} finally {
    try {
        [void](Update-WorkerState -BaseDir $ScriptRoot -WorkerProcessId $PID -Clear)
    } catch {
    }
    if ($hasWorkerMutex -and $workerMutex) {
        try {
            [void]$workerMutex.ReleaseMutex()
        } catch {
        }
    }
    if ($workerMutex) {
        $workerMutex.Dispose()
    }
    Write-Log -BaseDir $ScriptRoot -Name 'errores.log' -Message "Worker detenido. PID=$PID"
}
