# Manual de Uso Completo de MonitorRed

## 1. Que es MonitorRed

MonitorRed es una herramienta de monitoreo de conexiones TCP hecha en PowerShell para Windows.

Sirve para:

- ver conexiones activas de la PC;
- guardar reportes CSV;
- detectar relaciones nuevas o sospechosas;
- registrar actividad en logs;
- enviar alertas por Telegram;
- mantener un worker en segundo plano aunque cierres la ventana principal.

La unidad principal que analiza el sistema no es solo la IP.

La relacion que mira es:

`proceso + IP remota + puerto remoto`

En puertos `LISTENING`, la relacion equivalente es:

`proceso + IP local + puerto local`

## 2. Archivos principales

- [MonitorRed.bat](/C:/Users/Mateo%20Martinez/Documents/New%20project/MonitorRed/MonitorRed.bat): lanzador principal con doble clic.
- [monitor_ui.ps1](/C:/Users/Mateo%20Martinez/Documents/New%20project/MonitorRed/monitor_ui.ps1): interfaz visible por consola.
- [monitor_loop.ps1](/C:/Users/Mateo%20Martinez/Documents/New%20project/MonitorRed/monitor_loop.ps1): worker oculto en segundo plano.
- [monitor_lib.ps1](/C:/Users/Mateo%20Martinez/Documents/New%20project/MonitorRed/monitor_lib.ps1): logica central del programa.
- [startup_hidden.vbs](/C:/Users/Mateo%20Martinez/Documents/New%20project/MonitorRed/startup_hidden.vbs): soporte para autoarranque oculto.

## 3. Carpetas importantes

- [config](/C:/Users/Mateo%20Martinez/Documents/New%20project/MonitorRed/config): configuracion y memoria interna.
- [logs](/C:/Users/Mateo%20Martinez/Documents/New%20project/MonitorRed/logs): actividad, alertas y errores.
- [reportes](/C:/Users/Mateo%20Martinez/Documents/New%20project/MonitorRed/reportes): reporte actual e historicos.

## 4. Como abrirlo

1. Entrar en la carpeta del programa.
2. Hacer doble clic en [MonitorRed.bat](/C:/Users/Mateo%20Martinez/Documents/New%20project/MonitorRed/MonitorRed.bat).
3. Esperar a que aparezca la consola.

Si el worker ya estaba corriendo, igual vas a poder abrir la interfaz.

## 5. Primera configuracion

La primera vez, MonitorRed hace este flujo:

1. Pide carpeta para guardar reportes.
2. Detecta conexiones actuales.
3. Exporta el primer `informe_actual.csv`.
4. Te muestra las IPs remotas visibles.
5. Te deja aceptar todas, aceptar algunas o no aceptar ninguna.
6. Ofrece configurar Telegram.
7. Registra autoarranque.
8. Crea el baseline inicial.

### 5.1 Que pasa si aceptas las IPs actuales

Si aceptas las IPs actuales durante el primer arranque, el sistema usa esa foto inicial para sembrar una base tranquila de partida.

Eso sirve para que lo ya visible en ese momento no empiece a alertar enseguida en el siguiente escaneo.

### 5.2 Que pasa si no aceptas ninguna

El programa arranca igual, pero va a ser mas estricto y probablemente marque mas relaciones como `NUEVA` o `OBSERVACION`.

## 6. Cada cuanto escanea

Ahora esta configurado para escanear cada `10` minutos.

Eso sale de:

[general.ini](/C:/Users/Mateo%20Martinez/Documents/New%20project/MonitorRed/config/general.ini)

Clave:

`ScanIntervalMinutes=10`

## 7. Que hace en segundo plano

El worker:

- ejecuta un escaneo periodico;
- actualiza el reporte actual;
- genera historicos segun configuracion;
- actualiza estados internos;
- escribe logs;
- puede mandar Telegram si hay eventos.

## 8. Que ves en la pantalla principal

La consola muestra:

- si el worker esta activo;
- PID del worker;
- hora del ultimo escaneo;
- hora del ultimo historico;
- cantidad de conexiones vistas;
- carpeta de reportes;
- si Telegram esta activo;
- una tabla con conexiones recientes.

## 9. Menu de opciones

### Opcion 1: Actualizar reporte ahora

Fuerza un escaneo manual en ese momento.

Muestra resumen:

- `Nuevas`
- `Observaciones`
- `Sospechosas`

Si el worker esta escaneando al mismo tiempo, puede avisar que ya hay un escaneo en progreso.

### Opcion 2: Matar proceso por PID

Permite cerrar un proceso que figure en el ultimo `informe_actual.csv`.

Protecciones:

- no te deja matar la consola actual;
- no te deja matar el worker desde esta opcion;
- el PID tiene que estar en el ultimo reporte.

### Opcion 3: Reiniciar monitoreo

Reinicia el worker de fondo.

Sirve si:

- cambiaste el codigo;
- pensas que quedo trabado;
- queres recargar configuracion.

### Opcion 4: Configurar Telegram

Permite:

- cargar `BotToken`;
- cargar `ChatId`;
- activar o desactivar alertas.

Archivo involucrado:

[telegram.ini](/C:/Users/Mateo%20Martinez/Documents/New%20project/MonitorRed/config/telegram.ini)

### Opcion 5: Aprobar regla del reporte actual

Esta opcion sirve para aprobar una relacion concreta.

No aprueba solo la IP: aprueba la firma de la relacion.

Ejemplo conceptual:

`proceso + IP remota + puerto remoto`

Flujo:

1. Lee [informe_actual.csv](/C:/Users/Mateo%20Martinez/Documents/New%20project/MonitorRed/reportes/informe_actual.csv).
2. Lista relaciones con estado `NUEVA`, `OBSERVACION`, `SOSPECHOSA` o `RECHAZADA`.
3. Elegis una por numero.
4. Guarda esa firma en [reglas_aprobadas.txt](/C:/Users/Mateo%20Martinez/Documents/New%20project/MonitorRed/config/reglas_aprobadas.txt).
5. La relacion pasa a `BASE`.

Si esa regla estaba rechazada antes, el programa limpia el rechazo previo.

### Opcion 6: Salir de la interfaz

Cierra la ventana visible, pero el worker puede seguir activo en segundo plano.

## 10. Estados que usa el monitor

### `BASE`

Relacion conocida y aceptada como normal.

Comportamiento:

- no alerta;
- se considera parte del comportamiento esperado;
- sigue quedando registrada.

### `NUEVA`

Relacion nueva que todavia no fue absorbida por la base.

Comportamiento:

- puede alertar un numero acotado de veces;
- si se repite de forma estable dentro de la ventana esperada, sube sola a `BASE`;
- si no se estabiliza, puede pasar a `OBSERVACION`.

### `OBSERVACION`

Relacion que necesita seguimiento.

Comportamiento:

- no es tratada como normal todavia;
- puede seguir generando avisos controlados;
- puede pasar a `BASE` si se aprueba manualmente o si el sistema la promueve por reglas existentes.

### `SOSPECHOSA`

Relacion con senales mas raras o mas sensibles.

Comportamiento:

- se registra como alerta fuerte;
- puede disparar Telegram;
- tiene control de frecuencia para no hacer spam.

### `RECHAZADA`

Relacion explicitamente bloqueada por rechazo.

Comportamiento:

- se mantiene como estado propio;
- no se degrada automaticamente a `SOSPECHOSA`;
- si despues la aprobas manualmente, deja de estar rechazada.

## 11. Como decide si algo es normal o no

De forma simplificada:

- una IP aprobada no significa que todo proceso nuevo sobre esa IP quede aprobado;
- una relacion nueva sobre IP aprobada puede entrar como `NUEVA`;
- si esa relacion se repite estable, puede pasar sola a `BASE`;
- si no parece suficientemente limpia, puede quedar en `OBSERVACION`;
- procesos sensibles o casos raros pueden entrar como `SOSPECHOSA`.

## 12. Como funcionan las aprobaciones

Hay dos niveles distintos:

- aprobacion de IP;
- aprobacion de regla.

### 12.1 Aprobacion de IP

Se guarda en:

[ips_aprobadas.txt](/C:/Users/Mateo%20Martinez/Documents/New%20project/MonitorRed/config/ips_aprobadas.txt)

Sirve como contexto favorable, pero ya no blanquea por si sola cualquier relacion nueva.

### 12.2 Aprobacion de regla

Se guarda en:

[reglas_aprobadas.txt](/C:/Users/Mateo%20Martinez/Documents/New%20project/MonitorRed/config/reglas_aprobadas.txt)

Es la aprobacion mas precisa porque acepta una firma concreta.

### 12.3 Rechazos

Se guardan en:

- [ips_rechazadas.txt](/C:/Users/Mateo%20Martinez/Documents/New%20project/MonitorRed/config/ips_rechazadas.txt)
- [reglas_rechazadas.txt](/C:/Users/Mateo%20Martinez/Documents/New%20project/MonitorRed/config/reglas_rechazadas.txt)

## 13. Reportes y logs

### Reporte actual

[informe_actual.csv](/C:/Users/Mateo%20Martinez/Documents/New%20project/MonitorRed/reportes/informe_actual.csv)

Es la foto mas reciente.

Columnas principales:

- `Protocol`
- `State`
- `LocalAddress`
- `LocalPort`
- `RemoteAddress`
- `RemotePort`
- `Pid`
- `ProcessName`
- `MonitorStatus`

### Historicos

[historico](/C:/Users/Mateo%20Martinez/Documents/New%20project/MonitorRed/reportes/historico)

Guarda copias por fecha y hora.

### Log de actividad

[monitor.log](/C:/Users/Mateo%20Martinez/Documents/New%20project/MonitorRed/logs/monitor.log)

Guarda:

- inicios;
- resumenes de escaneo;
- observaciones;
- acciones manuales;
- aprobaciones manuales.

### Log de alertas

[alertas.log](/C:/Users/Mateo%20Martinez/Documents/New%20project/MonitorRed/logs/alertas.log)

Guarda alertas fuertes, incluyendo sospechosas y rechazadas.

### Log de errores

[errores.log](/C:/Users/Mateo%20Martinez/Documents/New%20project/MonitorRed/logs/errores.log)

Guarda errores de ejecucion, por ejemplo fallos de Telegram o problemas operativos.

## 14. Telegram

### Que necesita

- `BotToken`
- `ChatId`
- `AlertsEnabled=1`

### Como se usa ahora

- no manda un mensaje por cada evento sospechoso del mismo ciclo;
- agrupa eventos sospechosos o rechazados en un solo mensaje por escaneo;
- si el mensaje se hace demasiado largo, recorta y avisa que hubo mas eventos.

### Donde revisar si falla

- [telegram.ini](/C:/Users/Mateo%20Martinez/Documents/New%20project/MonitorRed/config/telegram.ini)
- [errores.log](/C:/Users/Mateo%20Martinez/Documents/New%20project/MonitorRed/logs/errores.log)

## 15. Archivos internos de estado

### Estado operativo

[estado.ini](/C:/Users/Mateo%20Martinez/Documents/New%20project/MonitorRed/config/estado.ini)

Guarda:

- modo;
- PID del worker;
- ultimo escaneo;
- ultimo historico;
- aprendizaje inicial.

### Estado de relaciones

[relation_state.json](/C:/Users/Mateo%20Martinez/Documents/New%20project/MonitorRed/config/relation_state.json)

Guarda memoria persistente de relaciones vistas.

### Estado de IPs

[ip_state.json](/C:/Users/Mateo%20Martinez/Documents/New%20project/MonitorRed/config/ip_state.json)

Guarda memoria persistente de IPs vistas.

## 16. Si queres revisar algo raro

Orden recomendado:

1. Mirar [informe_actual.csv](/C:/Users/Mateo%20Martinez/Documents/New%20project/MonitorRed/reportes/informe_actual.csv).
2. Mirar [monitor.log](/C:/Users/Mateo%20Martinez/Documents/New%20project/MonitorRed/logs/monitor.log).
3. Si fue alerta fuerte, mirar [alertas.log](/C:/Users/Mateo%20Martinez/Documents/New%20project/MonitorRed/logs/alertas.log).
4. Si algo fallo, mirar [errores.log](/C:/Users/Mateo%20Martinez/Documents/New%20project/MonitorRed/logs/errores.log).
5. Si queres absorber una relacion sana, usar opcion `5`.

## 17. Si el reporte CSV esta abierto

Si `informe_actual.csv` esta abierto en Excel u otro programa, el monitor puede no poder guardarlo.

En ese caso:

1. Cerra el archivo.
2. Volve a usar la opcion `1`.

El programa intenta dar un mensaje claro cuando pasa eso.

## 18. Uso diario recomendado

1. Abrir [MonitorRed.bat](/C:/Users/Mateo%20Martinez/Documents/New%20project/MonitorRed/MonitorRed.bat).
2. Confirmar que el worker este activo.
3. Dejarlo correr.
4. Revisar `Nuevas`, `Observaciones` y `Sospechosas` cuando actualices.
5. Si una relacion te parece sana pero sigue saliendo, aprobarla con opcion `5`.
6. Si algo es raro, revisar logs antes de matar procesos.

## 19. Que no hace el programa

MonitorRed no reemplaza:

- antivirus;
- firewall completo;
- EDR;
- analisis forense profundo.

Es una herramienta de monitoreo, memoria y criterio operativo para conexiones TCP.

## 20. Resumen corto

MonitorRed hoy funciona asi:

- crea una base inicial en el primer arranque si aceptas lo actual;
- escanea cada 10 minutos;
- clasifica relaciones en `BASE`, `NUEVA`, `OBSERVACION`, `SOSPECHOSA` y `RECHAZADA`;
- sube algunas relaciones nuevas a `BASE` de forma semiautomatica si se estabilizan;
- permite aprobar reglas concretas desde la UI;
- guarda reportes, estado y logs;
- puede mandar alertas por Telegram.
