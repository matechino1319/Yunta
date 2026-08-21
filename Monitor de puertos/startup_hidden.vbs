Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\Mateo Martinez\Documents\New project\MonitorRed"
WshShell.Run """C:\WINDOWS\System32\WindowsPowerShell\v1.0\powershell.exe"" -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File ""C:\Users\Mateo Martinez\Documents\New project\MonitorRed\monitor_loop.ps1"" -StartupSource AutoStart", 0, False
