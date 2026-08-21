# Cambios V2 - MonitorRed

Fecha: 2026-04-27

## Objetivo de esta pasada

Se corrigieron dos problemas operativos criticos:

1. Evitar escaneos concurrentes entre worker y UI.
2. Corregir el conteo mostrado como "nuevas conexiones" en la interfaz.

## Cambios aplicados

### 1) Bloqueo global de escaneo (concurrencia)

Archivo: `monitor_lib.ps1`

- Se agrego un bloqueo global con `System.Threading.Mutex` dentro de `Invoke-MonitorScan`.
- Nombre del lock: `Global\MonitorRed_ScanLock`.
- Comportamiento:
  - si no hay otro escaneo, entra normal;
  - si ya hay uno en curso, espera hasta 5 segundos;
  - si no consigue lock, corta con mensaje claro: "Ya hay un escaneo en progreso...".
- Se libera lock en `finally` para evitar que quede tomado por error.

Resultado:
- evita que worker y UI pisen en paralelo `relation_state.json`, `ip_state.json`, `estado.ini` y `informe_actual.csv`.

### 2) Conteo real de nuevas en la UI

Archivos: `monitor_lib.ps1`, `monitor_ui.ps1`

- En `Invoke-MonitorScan`:
  - `NewRows` ahora contiene solo eventos con estado `NUEVA`.
  - se agrego `EventRows` para conservar todos los eventos emitidos en una propiedad separada.
- En `monitor_ui.ps1` (opcion 1):
  - el resumen ahora muestra:
    - `Nuevas` = `result.NewRows.Count`
    - `Observaciones` = conteo real de `NoticeRows` filtrado por `Status = OBSERVACION`
    - `Sospechosas` = `result.AlertRows.Count`

Resultado:
- la consola ya no reporta "nuevas conexiones" cuando en realidad eran observaciones o sospechosas.

## Verificacion realizada

- Validacion de sintaxis de `monitor_lib.ps1`: OK.
- Validacion de sintaxis de `monitor_ui.ps1`: OK.
- Ejecucion de escaneo manual con la nueva logica: OK.
- Reinicio de worker para cargar version actualizada: OK.

## Ajuste adicional post-revision

Archivo: `monitor_ui.ps1`

- Se agrego `try/catch` en la opcion `1` (escaneo manual).
- Motivo:
  - con el lock global nuevo, si el worker esta escaneando al mismo tiempo,
    `Invoke-MonitorScan` puede devolver "Ya hay un escaneo en progreso".
  - sin `try/catch`, la UI podia salir por el `catch` global.
- Resultado:
  - la UI ya no se cierra por ese caso;
  - muestra un mensaje amigable y sigue operativa.

## Estado de los hallazgos cubiertos

- Hallazgo 13: corregido.
- Hallazgo 14: corregido.

## Ajustes posteriores a V2

Archivo: `monitor_lib.ps1`

- Se corrigio el tratamiento de relaciones nuevas sobre IPs ya aprobadas.
- Antes:
  - una relacion nueva sobre IP aprobada podia quedar demasiado blanqueada;
  - luego del primer ajuste post-review habia quedado en `OBSERVACION` hasta aprobacion manual.
- Ahora:
  - si aparece una relacion nueva `proceso + IP + puerto` sobre una IP aprobada y el puerto es normal,
    entra en `NUEVA`;
  - si se repite de forma estable dentro de la ventana configurada,
    pasa sola a `BASE` por la logica de autoaprobacion ya existente;
  - si no se estabiliza, sigue el flujo normal hacia `OBSERVACION`.

Resultado:
- se evita autoaprobar de golpe una relacion nueva solo porque la IP ya era conocida;
- pero tambien se evita depender siempre de aprobacion manual para relaciones sanas repetidas.

## Otros ajustes post-review

Archivo: `monitor_lib.ps1`

- El estado `RECHAZADA` ahora queda persistido como estado real y no se convierte automaticamente en `SOSPECHOSA`.
- Las alertas a Telegram para eventos sospechosos/rechazados ahora se agrupan en un solo mensaje por escaneo.

Resultado:
- las reglas rechazadas quedan distinguibles en el estado interno y en las alertas;
- cuando Telegram falla, ya no se dispara un intento por cada evento del mismo ciclo.

## Ajustes adicionales de baseline y aprobacion manual

Archivos: `monitor_lib.ps1`, `monitor_ui.ps1`

- Se corrigio el comportamiento del primer arranque para que vuelva a respetar la idea de baseline inicial.
- Ahora, cuando en la configuracion inicial el usuario acepta las IPs actuales, `Seed-SeenConnections` puede sembrar esas relaciones visibles como `BASE` solo en ese contexto de setup.
- Esto deja una base silenciosa inicial sin cambiar la logica semiautomatica usada despues durante operacion normal.

- Se agrego una via real de aprobacion manual de reglas concretas `proceso + IP + puerto`.
- Nueva opcion en la interfaz:
  - `5 = Aprobar regla del reporte actual`
- La opcion:
  - toma relaciones del `informe_actual.csv` con estado `NUEVA`, `OBSERVACION`, `SOSPECHOSA` o `RECHAZADA`;
  - deja elegir una por numero;
  - guarda la firma en `reglas_aprobadas.txt`;
  - marca la relacion como `BASE` en `relation_state.json`.

Resultado:
- el primer arranque vuelve a generar una base inicial coherente con lo que promete la configuracion;
- las relaciones que no suben solas a `BASE` ya pueden aprobarse manualmente desde la UI sin editar archivos a mano.

## Ajustes finales sobre aprobacion manual

Archivo: `monitor_lib.ps1`

- La aprobacion manual de reglas ahora limpia cualquier rechazo previo de la misma firma en `reglas_rechazadas.txt`.
- Tambien actualiza la relacion en memoria persistida dejando:
  - `ManualApproved = true`
  - `ManualRejected = false`
  - `Status = BASE`

- La aprobacion manual ahora usa el mismo lock global `Global\MonitorRed_ScanLock` que `Invoke-MonitorScan`.
- Para eso se extrajo el manejo del mutex a una funcion comun reutilizable.

Resultado:
- una regla aprobada manualmente ya no puede quedar bloqueada por un rechazo viejo;
- la aprobacion manual ya no compite contra el worker ni contra un escaneo de UI al guardar archivos de estado.
