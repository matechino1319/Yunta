# Informe de archivos de config - MonitorRed

Fecha: 2026-04-28

## Objetivo

Este informe explica para que sirve cada archivo dentro de:

`C:\Users\Mateo Martinez\Documents\New project\MonitorRed\config`

La idea es distinguir:

- archivos de configuracion manual;
- archivos de estado interno del monitor;
- archivos de reglas;
- archivos heredados que hoy no tienen uso activo en el codigo.

## Resumen rapido

### Configuracion manual

- `general.ini`
- `telegram.ini`

### Estado interno del monitor

- `estado.ini`
- `ip_state.json`
- `relation_state.json`

### Listas de aprobacion o rechazo

- `ips_aprobadas.txt`
- `ips_rechazadas.txt`
- `reglas_aprobadas.txt`
- `reglas_rechazadas.txt`

### Archivos heredados o sin uso activo actual

- `conexiones_no_aprobadas_activas.txt`
- `conexiones_vistas.txt`
- `relaciones_aprobadas_vistas.txt`

---

## Detalle archivo por archivo

### 1) `general.ini`

Define la configuracion general del programa.

Campos actuales:

- `FirstRunCompleted`: indica si ya se hizo la configuracion inicial.
- `ReportsFolder`: carpeta donde se guardan los reportes CSV.
- `ScanIntervalMinutes`: cada cuantos minutos corre el escaneo automatico.
- `ReportIntervalHours`: cada cuantas horas genera historico.
- `AutoOpenFirstReport`: indica si abre automaticamente el primer reporte exportado.

Uso:

- lo lee el worker;
- lo usa la interfaz;
- controla el comportamiento base del monitoreo.

Se puede editar a mano:

- si, con cuidado.

No conviene tocar mientras el monitor esta trabajando:

- `FirstRunCompleted`, salvo que quieras forzar una configuracion inicial nueva.

---

### 2) `telegram.ini`

Guarda la configuracion del canal de alertas por Telegram.

Campos actuales:

- `BotToken`: token del bot.
- `ChatId`: destino donde se mandan los mensajes.
- `AlertsEnabled`: `1` activo, `0` desactivado.

Uso:

- lo consulta el monitor cuando tiene que enviar avisos;
- tambien se usa para el aviso de autoarranque.

Se puede editar a mano:

- si.

Importante:

- contiene datos sensibles;
- no conviene compartirlo tal cual;
- si alguna vez se expuso el token, lo correcto es regenerarlo.

---

### 3) `estado.ini`

Es el estado vivo del monitor.

Campos actuales:

- `Mode`: modo general, por ejemplo `SETUP` o `MONITOREO`.
- `WorkerPid`: PID del proceso worker que hace los escaneos automaticos.
- `WorkerStartedAt`: fecha y hora en que arranco el worker.
- `WorkerHeartbeatAt`: ultima marca de vida del worker.
- `LastScanAt`: ultimo escaneo completado.
- `LastHistoricalReportAt`: ultimo historico exportado.
- `LastConnectionCount`: cantidad de conexiones del ultimo escaneo exportado.
- `LearningStartedAt`: inicio de la ventana de aprendizaje.
- `LearningEndsAt`: fin de la ventana de aprendizaje.

Uso:

- la UI lo usa para mostrar si el worker esta activo;
- el worker lo actualiza durante la ejecucion;
- ayuda a detectar workers caidos o PID viejos.

Se puede editar a mano:

- mejor no.

Si se altera mal:

- el monitor puede creer que hay un worker vivo cuando no lo hay;
- o puede perder referencias del ultimo escaneo.

---

### 4) `ips_aprobadas.txt`

Lista de IPs remotas aprobadas manualmente como conocidas o permitidas.

Uso:

- ayuda a bajar friccion con destinos ya conocidos;
- no reemplaza la logica completa por relacion, pero suma contexto.

Formato:

- una IP por linea.

Se puede editar a mano:

- si.

Conviene hacerlo con criterio:

- aprobar una IP no significa aprobar automaticamente cualquier proceso nuevo que la use.

---

### 5) `ips_rechazadas.txt`

Lista de IPs remotas rechazadas manualmente.

Uso:

- marca IPs que deben tratarse como negativas o no permitidas;
- influye en la clasificacion de nuevas conexiones.

Formato:

- una IP por linea.

Se puede editar a mano:

- si.

---

### 6) `reglas_aprobadas.txt`

Lista de reglas aprobadas manualmente.

Aca una regla es una relacion concreta del tipo:

- proceso + IP remota + puerto remoto

Uso:

- sirve para promover una relacion puntual a `BASE`;
- lo usa la opcion de aprobacion manual desde la interfaz.

Formato:

- una firma de regla por linea.

Se puede editar a mano:

- si, pero es facil equivocarse en el formato.

Mejor:

- aprobar desde la UI cuando sea posible.

---

### 7) `reglas_rechazadas.txt`

Lista de reglas rechazadas manualmente.

Uso:

- bloquea o marca como rechazada una relacion especifica;
- tiene prioridad alta en la clasificacion.

Formato:

- una firma de regla por linea.

Se puede editar a mano:

- si, con el mismo cuidado que `reglas_aprobadas.txt`.

---

### 8) `ip_state.json`

Memoria historica por IP remota.

No guarda cada conexion completa, sino el contexto por IP.

Uso:

- recordar IPs vistas;
- mantener historial minimo por destino remoto;
- ayudar al motor a decidir si una IP ya tiene contexto previo;
- complementar a `relation_state.json`.

Se actualiza automaticamente:

- si.

Se puede borrar:

- si, pero el monitor pierde memoria historica por IP y reevalua mas cosas como nuevas o sin contexto.

No conviene editarlo a mano:

- no.

---

### 9) `relation_state.json`

Memoria historica por relacion concreta.

Este es uno de los archivos mas importantes del monitor.

Guarda relaciones del tipo:

- proceso + IP remota + puerto remoto

Tambien puede guardar metadatos como:

- estado actual;
- cantidad de veces vista;
- ultima vez vista;
- contadores de alerta;
- aprobacion o rechazo manual;
- archivado.

Uso:

- es la base principal para saber si algo es `BASE`, `NUEVA`, `OBSERVACION`, `SOSPECHOSA` o `RECHAZADA`.

Se actualiza automaticamente:

- si, en cada escaneo.

Se puede borrar:

- si, pero reinicias la memoria fina del sistema.

No conviene editarlo a mano:

- no.

---

### 10) `conexiones_no_aprobadas_activas.txt`

Archivo heredado.

Revision actual:

- existe en `config`;
- no aparece referenciado en el codigo activo actual.

Interpretacion:

- probablemente fue usado en versiones anteriores como lista temporal o cache auxiliar.

Uso real hoy:

- no parece tener uso operativo actual.

---

### 11) `conexiones_vistas.txt`

Archivo heredado.

Revision actual:

- existe en `config`;
- no aparece referenciado en el codigo activo actual.

Interpretacion:

- probablemente fue una memoria anterior antes de pasar a `ip_state.json` y `relation_state.json`.

Uso real hoy:

- no parece tener uso operativo actual.

---

### 12) `relaciones_aprobadas_vistas.txt`

Archivo heredado.

Revision actual:

- existe en `config`;
- no aparece referenciado en el codigo activo actual.

Interpretacion:

- posiblemente fue una cache vieja de relaciones ya conocidas.

Uso real hoy:

- no parece tener uso operativo actual.

---

## Que conviene tocar y que no

### Se puede tocar manualmente

- `general.ini`
- `telegram.ini`
- `ips_aprobadas.txt`
- `ips_rechazadas.txt`
- `reglas_aprobadas.txt`
- `reglas_rechazadas.txt`

### Mejor no tocar manualmente

- `estado.ini`
- `ip_state.json`
- `relation_state.json`

### Se pueden conservar o limpiar si queres ordenar

- `conexiones_no_aprobadas_activas.txt`
- `conexiones_vistas.txt`
- `relaciones_aprobadas_vistas.txt`

Esos tres hoy parecen remanentes. Antes de borrarlos definitivamente, conviene hacerlo como limpieza controlada y probar una corrida completa del monitor.

---

## Conclusion

La carpeta `config` mezcla tres cosas:

1. configuracion editable del programa;
2. memoria viva del monitoreo;
3. archivos viejos que quedaron de iteraciones anteriores.

Los archivos mas delicados de verdad son:

- `estado.ini`
- `ip_state.json`
- `relation_state.json`

Los mas normales para administrar a mano son:

- `general.ini`
- `telegram.ini`
- las listas `ips_*` y `reglas_*`

Los tres `.txt` heredados no parecen formar parte del flujo actual y podrian revisarse para futura limpieza.
