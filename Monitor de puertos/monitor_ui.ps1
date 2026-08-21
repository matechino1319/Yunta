$ErrorActionPreference = 'Stop'

$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $ScriptRoot 'monitor_lib.ps1')

Initialize-MonitorEnvironment -BaseDir $ScriptRoot

try {
    Ensure-InitialSetup -BaseDir $ScriptRoot
    Ensure-MonitorLoop -BaseDir $ScriptRoot

    while ($true) {
        Ensure-MonitorLoop -BaseDir $ScriptRoot
        Show-MonitorConsole -BaseDir $ScriptRoot
        $option = Read-Host 'Elegi una opcion'

        switch ($option.ToUpperInvariant()) {
            '1' {
                try {
                    $result = Invoke-MonitorScan -BaseDir $ScriptRoot
                    $observationCount = @($result.NoticeRows | Where-Object { $_.Status -eq 'OBSERVACION' }).Count
                    Write-Host ''
                    Write-Host ("Escaneo ejecutado. Nuevas={0} Observaciones={1} Sospechosas={2}" -f $result.NewRows.Count, $observationCount, $result.AlertRows.Count) -ForegroundColor Green
                } catch {
                    Write-Host ''
                    Write-Host ("No se pudo ejecutar el escaneo: {0}" -f $_.Exception.Message) -ForegroundColor Yellow
                }
                Pause-Short
            }
            '2' {
                $pidText = Read-Host 'Ingresa el PID a matar'
                if ($pidText -match '^\d+$') {
                    try {
                        $targetPid = [int]$pidText
                        $state = Get-MonitorState -BaseDir $ScriptRoot
                        if ($targetPid -eq $PID) {
                            throw 'No podes finalizar la consola actual.'
                        }
                        if ($state.WorkerPid -and $targetPid -eq [int]$state.WorkerPid) {
                            throw 'No podes finalizar el worker desde esta opcion. Usa "Reiniciar monitoreo".'
                        }

                        $config = Get-MonitorConfig -BaseDir $ScriptRoot
                        $reportPath = Join-Path $config.ReportsFolder 'informe_actual.csv'
                        if (-not (Test-Path $reportPath)) {
                            throw 'Todavia no existe informe_actual.csv para validar el PID.'
                        }

                        $allowedPids = Import-Csv -Path $reportPath -Delimiter ';' |
                            Where-Object { $_.Pid -match '^\d+$' } |
                            Select-Object -ExpandProperty Pid -Unique
                        if ("$targetPid" -notin $allowedPids) {
                            throw 'El PID no aparece en el ultimo reporte generado por el monitor.'
                        }

                        Stop-Process -Id $targetPid -Force -ErrorAction Stop
                        Write-Host "Proceso $pidText finalizado." -ForegroundColor Yellow
                        Write-Log -BaseDir $ScriptRoot -Name 'monitor.log' -Message "Proceso finalizado manualmente: PID=$pidText"
                    } catch {
                        Write-Host "No se pudo finalizar el proceso: $($_.Exception.Message)" -ForegroundColor Red
                    }
                } else {
                    Write-Host 'PID invalido.' -ForegroundColor Red
                }
                Pause-Short
            }
            '3' {
                Ensure-MonitorLoop -BaseDir $ScriptRoot -Restart
                Write-Host ''
                Write-Host 'Monitor reiniciado.' -ForegroundColor Green
                Pause-Short
            }
            '4' {
                Configure-Telegram -BaseDir $ScriptRoot
                Pause-Short
            }
            '5' {
                try {
                    Approve-RelationFromReport -BaseDir $ScriptRoot
                } catch {
                    Write-Host ''
                    Write-Host ("No se pudo aprobar la regla: {0}" -f $_.Exception.Message) -ForegroundColor Yellow
                }
                Pause-Short
            }
            '6' {
                Write-Host ''
                Write-Host 'Saliendo de la interfaz. El monitoreo queda ejecutandose en segundo plano.' -ForegroundColor Cyan
                break
            }
            default {
                Write-Host ''
                Write-Host 'Opcion invalida.' -ForegroundColor Red
                Pause-Short
            }
        }
    }
} catch {
    Write-Host ''
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Pause-Short
    exit 1
}
