# Informe Completo del Programa MonitorRed

## 1. Resumen general

MonitorRed es una herramienta de monitoreo de conexiones TCP hecha en PowerShell para Windows. Su objetivo es observar las conexiones de red activas de la computadora, generar reportes CSV, registrar eventos en archivos de log y enviar alertas por Telegram cuando detecta situaciones relevantes.

El programa trabaja en dos planos:

- una interfaz visible por consola para operar manualmente;
- un worker en segundo plano que sigue monitoreando aunque la ventana principal se cierre.

Su comportamiento actual busca un equilibrio entre dos extremos:

- no dejar pasar IPs no aprobadas como si fueran confiables;
- no repetir la misma alerta en cada escaneo cuando una conexion sigue exactamente igual.

## 2. Objetivo funcional

El programa intenta responder estas preguntas:

- que conexiones TCP estan activas en este momento;
- que proceso esta usando cada conexion;
- a que IP remota se conecta cada proceso;
- si esa IP esta aprobada o no;
- si una IP aprobada aparece con una combinacion nueva de proceso y puerto;
- si una conexion no aprobada es realmente nueva o simplemente sigue activa desde el escaneo anterior.

## 3. Archivos principales del proyecto

### 3.1 [MonitorRed.bat](C:\Users\Mateo Martinez\Documents\New project\MonitorRed\MonitorRed.bat)

Es el lanzador principal. Hace lo siguiente:

- detecta la carpeta base;
- verifica que exista `monitor_ui.ps1`;
- ejecuta la interfaz principal con PowerShell.

Es el archivo pensado para abrir con doble clic.

### 3.2 [monitor_ui.ps1](C:\Users\Mateo Martinez\Documents\New project\MonitorRed\monitor_ui.ps1)

Es la interfaz por consola. Hace lo siguiente:

- carga la libreria principal `monitor_lib.ps1`;
- asegura la existencia de carpetas y archivos base;
- ejecuta la configuracion inicial si es la primera vez;
- asegura que el worker residente este corriendo;
- muestra el estado actual del sistema;
- permite lanzar un escaneo manual;
- permite matar un proceso por PID;
- permite reiniciar el monitoreo;
- permite configurar Telegram;
- permite salir sin apagar el worker.

### 3.3 [monitor_loop.ps1](C:\Users\Mateo Martinez\Documents\New project\MonitorRed\monitor_loop.ps1)

Es el worker oculto que monitorea en segundo plano. Hace lo siguiente:

- carga `monitor_lib.ps1`;
- inicializa el entorno;
- guarda su PID y hora de inicio en `estado.ini`;
- entra en un bucle infinito;
- ejecuta `Invoke-MonitorScan`;
- registra errores en `errores.log`;
- espera el intervalo configurado antes del siguiente ciclo.

### 3.4 [monitor_lib.ps1](C:\Users\Mateo Martinez\Documents\New project\MonitorRed\monitor_lib.ps1)

Es el nucleo del programa. Contiene:

- inicializacion de carpetas y archivos;
- lectura y escritura de archivos INI;
- escritura de logs;
- configuracion inicial;
- lectura de conexiones por `netstat`;
- resolucion PID -> nombre de proceso;
- logica de comparacion y alertas;
- exportacion de reportes CSV;
- envio de mensajes a Telegram;
- manejo del worker;
- armado de la pantalla de consola.

### 3.5 [startup_hidden.vbs](C:\Users\Mateo Martinez\Documents\New project\MonitorRed\startup_hidden.vbs)

Lanza el worker de forma oculta para el autoarranque.

### 3.6 [enviar_telegram.ps1](C:\Users\Mateo Martinez\Documents\New project\MonitorRed\enviar_telegram.ps1)

Permite invocar el envio de Telegram reutilizando la logica central.

## 4. Estructura de carpetas

### 4.1 `config`

Guarda configuracion y memorias internas del programa:

- `general.ini`: parametros generales;
- `estado.ini`: estado operativo del worker;
- `telegram.ini`: configuracion del bot y del chat;
- `ips_aprobadas.txt`: lista manual de IPs confiables;
- `conexiones_vistas.txt`: linea base inicial de conexiones detectadas;
- `relaciones_aprobadas_vistas.txt`: combinaciones aprobadas ya observadas;
- `conexiones_no_aprobadas_activas.txt`: snapshot del escaneo anterior para conexiones no aprobadas activas.

### 4.2 `logs`

Guarda registros del sistema:

- `monitor.log`: actividad normal, observaciones y resumenes;
- `alertas.log`: alertas relevantes;
- `errores.log`: errores de ejecucion.

### 4.3 `reportes`

Guarda los CSV:

- `informe_actual.csv`: estado mas reciente;
- `historico\`: copias historicas con fecha y hora.

## 5. Configuracion inicial

La primera vez que corre, `Ensure-InitialSetup` hace este flujo:

1. Muestra la pantalla inicial.
2. Pide elegir carpeta de reportes.
3. Obtiene las conexiones actuales.
4. Exporta el primer reporte.
5. Muestra las IPs remotas detectadas.
6. Permite aceptarlas todas, aceptar algunas o no aceptar ninguna.
7. Ofrece configurar Telegram.
8. Registra el autoarranque en Windows.
9. Guarda una linea base inicial.
10. Marca `FirstRunCompleted=1`.

## 6. Como obtiene la informacion de red

La funcion `Get-CurrentConnections` ejecuta:

```powershell
netstat -ano -p TCP
```

De ahi extrae:

- protocolo;
- direccion local;
- puerto local;
- direccion remota;
- puerto remoto;
- estado;
- PID.

Luego cruza eso con `Get-Process` para obtener el nombre del proceso.

El resultado de cada fila contiene:

- `Protocol`
- `State`
- `LocalAddress`
- `LocalPort`
- `RemoteAddress`
- `RemotePort`
- `Pid`
- `ProcessName`

## 7. Sistema de memoria interna

El programa no trabaja solo con la foto actual: usa varios archivos para recordar contexto.

### 7.1 `ips_aprobadas.txt`

Lista de IPs que el usuario marca como confiables.

### 7.2 `conexiones_vistas.txt`

Guarda firmas tipo:

`Protocolo|IPRemota`

Hoy se usa como linea base inicial e historial simple. Ya no es la pieza principal que decide si una IP no aprobada deja de alertar.

### 7.3 `relaciones_aprobadas_vistas.txt`

Guarda firmas tipo:

`Protocolo|IPRemota|PuertoRemoto|Proceso`

Sirve para recordar combinaciones ya observadas sobre IPs aprobadas.

### 7.4 `conexiones_no_aprobadas_activas.txt`

Guarda firmas tipo:

`Protocolo|IPRemota|PuertoRemoto|Proceso`

Sirve para recordar que conexiones no aprobadas estaban activas en el escaneo inmediatamente anterior.

Esta es la pieza clave de la logica nueva:

- evita repetir la misma alerta en cada ciclo;
- pero no convierte esa IP en confiable.

## 8. Logica de deteccion actual

La logica actual trabaja por niveles.

### 8.1 Caso 1: IP no aprobada

Si la conexion:

- tiene IP remota valida;
- tiene puerto remoto valido;
- esta en estado `ESTABLISHED`;
- y la IP no esta en `ips_aprobadas.txt`;

entonces se arma esta firma:

`Protocolo|IPRemota|PuertoRemoto|Proceso`

Luego se compara contra `conexiones_no_aprobadas_activas.txt`.

Si esa firma no estaba activa en el ciclo anterior:

- se genera alerta;
- se escribe en `alertas.log`;
- se intenta enviar a Telegram.

Si esa firma ya estaba activa en el ciclo anterior:

- no se vuelve a alertar en ese escaneo;
- pero sigue considerandose no aprobada.

Si la conexion desaparece y despues reaparece:

- vuelve a alertar.

Si la IP sigue siendo la misma pero cambia el proceso o el puerto:

- tambien vuelve a alertar.

### 8.2 Caso 2: IP aprobada

Si la IP remota esta en `ips_aprobadas.txt`, no se alerta por el simple hecho de existir.

En cambio, se analiza la combinacion:

`Protocolo|IPRemota|PuertoRemoto|Proceso`

Si esa combinacion no habia sido observada antes:

- si el proceso parece normal, se registra como observacion en `monitor.log`;
- si el proceso parece sospechoso o desconocido, escala a alerta fuerte.

Si la combinacion ya habia sido observada:

- no vuelve a alertar ni a observar mientras siga siendo la misma.

### 8.3 Criterios de proceso sospechoso

Actualmente se considera sospechoso si el nombre del proceso es:

- vacio;
- `Desconocido`;
- `powershell`;
- `pwsh`;
- `cmd`;
- `wscript`;
- `cscript`;
- `rundll32`;
- `mshta`;
- `regsvr32`.

Esto no significa automaticamente malware. Significa que, si una IP aprobada aparece asociada a una combinacion nueva con uno de esos procesos, se prefiere escalar la alerta.

## 9. Generacion de reportes

La funcion `Export-NetworkReports` exporta CSV con separador `;`.

### 9.1 Reporte actual

Siempre actualiza:

- `reportes\informe_actual.csv`

### 9.2 Reporte historico

Cada cierta cantidad de horas definida por `ReportIntervalHours`, genera una copia adicional en:

- `reportes\historico\red_yyyy-MM-dd_HH-mm-ss.csv`

### 9.3 Manejo de archivo bloqueado

Si el CSV esta abierto en Excel u otro programa:

- el sistema reintenta guardar;
- si no puede, devuelve un mensaje claro indicando que hay que cerrar el archivo antes de volver a intentar.

## 10. Logs

### 10.1 `monitor.log`

Registra:

- inicio del worker;
- resumen de cada escaneo;
- observaciones sobre IPs aprobadas con combinacion nueva;
- reinicios;
- finalizacion manual de procesos.

### 10.2 `alertas.log`

Registra:

- IPs no aprobadas que aparecieron nuevas respecto del escaneo anterior;
- combinaciones sospechosas nuevas sobre IPs aprobadas.

### 10.3 `errores.log`

Registra:

- fallos de Telegram;
- errores del escaneo;
- excepciones atrapadas por el worker.

## 11. Telegram

El sistema usa:

- `BotToken`
- `ChatId`
- `AlertsEnabled`

La logica actual corrige automaticamente el estado:

- si `BotToken` y `ChatId` existen, `AlertsEnabled` pasa a `1`;
- si faltan credenciales, queda en `0`.

Ademas, la configuracion interactiva acepta respuestas:

- `S`
- `SI`
- `SÍ`
- `Y`
- `YES`

Esto evita que Telegram quede desactivado por error solo por haber escrito otra variante de “si”.

## 12. Estado interno

`estado.ini` guarda:

- `Mode`
- `WorkerPid`
- `WorkerStartedAt`
- `LastScanAt`
- `LastHistoricalReportAt`
- `LastConnectionCount`

Esto permite mostrar si el worker sigue activo y cuando hizo su ultimo trabajo.

## 13. Interfaz visible

La pantalla principal muestra:

- si el worker esta activo;
- el PID del worker;
- el ultimo escaneo;
- el ultimo historico;
- la cantidad de conexiones vistas;
- la carpeta de reportes;
- si Telegram esta activo;
- hasta 20 filas del reporte actual.

Opciones del menu:

- `1`: actualizar reporte ahora;
- `2`: matar proceso por PID;
- `3`: reiniciar monitoreo;
- `4`: configurar Telegram;
- `5`: salir de la interfaz.

Salir de la interfaz no apaga el worker residente.

## 14. Autoarranque

En la configuracion inicial:

- se crea `startup_hidden.vbs`;
- se registra una entrada en `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`;
- al iniciar sesion, se lanza el worker oculto.

En la version actual, el autoarranque fue reforzado para quedar cubierto por dos mecanismos:

- la clave `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`;
- una copia del lanzador en la carpeta de Inicio del usuario.

Archivo de inicio adicional:

- `C:\Users\Mateo Martinez\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\MonitorRedPro.vbs`

La entrada de registro actual apunta a:

- `"C:\WINDOWS\System32\wscript.exe" "C:\Users\Mateo Martinez\Documents\New project\MonitorRed\startup_hidden.vbs"`

### 14.1 Error detectado en el autoarranque

Se detecto un problema por el cual, despues de apagar y volver a encender la computadora, el monitoreo no quedaba funcionando automaticamente.

### 14.2 Causa tecnica del problema

El autoarranque original tenia varios puntos fragiles:

- dependia solo de la clave `Run` del usuario;
- el archivo `startup_hidden.vbs` llamaba a `powershell` sin ruta absoluta;
- no fijaba explicitamente el directorio de trabajo del proyecto;
- si Windows resolvia distinto el entorno al iniciar sesion, el worker podia no arrancar correctamente o no encontrar el contexto esperado.

Eso hacia que el autoarranque pudiera funcionar en algunas situaciones, pero fallar al reiniciar la PC o al iniciar sesion en condiciones distintas a una ejecucion manual.

### 14.3 Correccion aplicada

Para resolverlo, se hicieron estos cambios:

- `startup_hidden.vbs` ahora define `WshShell.CurrentDirectory` con la carpeta del proyecto;
- `startup_hidden.vbs` ahora invoca la ruta completa de `powershell.exe`:
  - `C:\WINDOWS\System32\WindowsPowerShell\v1.0\powershell.exe`
- la clave `Run` ahora invoca la ruta completa de `wscript.exe`;
- se agrego una copia del lanzador en la carpeta de Inicio del usuario, como respaldo adicional al registro;
- la funcion `Register-AutoStart` de `monitor_lib.ps1` fue actualizada para generar este esquema reforzado.

### 14.4 Resultado esperado despues de la correccion

Despues de esta correccion, al iniciar sesion en Windows el sistema deberia:

- ejecutar `wscript.exe`;
- abrir `startup_hidden.vbs` en modo silencioso;
- lanzar `monitor_loop.ps1` con PowerShell oculto;
- iniciar nuevamente el monitoreo residente sin intervencion manual del usuario.

## 15. Fortalezas del diseno actual

- no depende de software externo complejo;
- usa herramientas nativas de Windows y PowerShell;
- deja evidencia en CSV y logs;
- conserva historico;
- permite operar manualmente;
- no silencia para siempre una IP no aprobada por haber sido vista una sola vez;
- no repite en bucle la misma alerta mientras la conexion sigue igual;
- vuelve a alertar si la conexion no aprobada reaparece o cambia;
- diferencia entre IP desconocida e IP aprobada con comportamiento nuevo;
- permite configurar Telegram por interfaz o por archivo.

## 16. Limitaciones actuales

- monitorea TCP y no UDP;
- depende de `netstat`;
- usa nombre de proceso, no ruta completa ni hash;
- una IP aprobada sigue siendo una confianza relativamente amplia;
- no usa reputacion externa ni inteligencia adicional;
- la interfaz es de consola, no grafica moderna.

## 17. Cambios realizados sobre la version original

Sobre la version original, se hicieron estas mejoras:

- se agrego memoria de combinaciones aprobadas en `relaciones_aprobadas_vistas.txt`;
- se agrego memoria del escaneo anterior de conexiones no aprobadas en `conexiones_no_aprobadas_activas.txt`;
- se corrigio el problema por el cual una IP no aprobada podia dejar de alertar para siempre solo por haber sido vista una vez;
- se implemento una logica mejor para IPs no aprobadas:
  - alerta cuando aparecen;
  - no repite mientras siguen iguales;
  - vuelve a alertar si reaparecen;
  - vuelve a alertar si cambian de proceso o puerto;
- se mejoro la activacion de Telegram para que se autocorrija con credenciales validas;
- se agrego la opcion de configurar Telegram desde la interfaz;
- se mejoro el manejo del error cuando el CSV esta abierto;
- se corrigio y reforzo el sistema de autoarranque para que no dependa de una sola via y use rutas completas;
- se corrigieron errores intermedios surgidos durante los cambios.

## 18. Flujo completo resumido

1. El usuario abre `MonitorRed.bat`.
2. Se carga `monitor_ui.ps1`.
3. Se aseguran carpetas y archivos base.
4. Si es la primera vez, se ejecuta la configuracion inicial.
5. Se verifica o inicia el worker oculto.
6. El worker obtiene conexiones TCP con `netstat`.
7. El sistema compara conexiones actuales contra aprobadas, relaciones vistas y snapshot anterior.
8. Se generan alertas, observaciones, reportes y logs.
9. La interfaz permite revisar estado y ejecutar acciones manuales.
10. Aunque la interfaz se cierre, el worker puede seguir funcionando.

## 19. Conclusion

MonitorRed es un monitor residente de conexiones TCP con enfoque practico. Su logica actual combina una lista manual de IPs aprobadas, una memoria de relaciones vistas sobre IPs aprobadas y una memoria del escaneo inmediatamente anterior para conexiones no aprobadas. Eso permite detectar cambios reales sin caer ni en el silenciamiento permanente ni en el spam continuo de alertas.
