# Politica de Alertas de MonitorRed

## 1. Objetivo

Esta politica define como debe comportarse `MonitorRed` en un servidor estable, donde la red no cambia seguido y donde el objetivo es detectar:

- conexiones nuevas sanas
- conexiones ambiguas
- conexiones sospechosas
- reapariciones de patrones dormidos
- cambios de comportamiento sobre conexiones ya conocidas

La idea no es alertar por todo, sino separar ruido de riesgo real sin perder trazabilidad.

## 2. Unidad principal de analisis

La unidad principal de evaluacion no es la IP sola.

La unidad principal es:

`proceso + IP remota + puerto remoto`

La IP solo aporta contexto adicional:

- cuantos procesos la usan
- cuantas veces aparecio
- desde cuando se ve
- cuantos puertos remotos usa
- si ya fue aprobada o rechazada

Conclusion:

- la relacion decide el estado
- la IP ajusta el contexto y la severidad inicial

## 3. Datos que debe guardar el sistema

### 3.1. Por IP

Para cada IP conviene guardar:

- `ip`
- `first_seen`
- `last_seen`
- `times_seen`
- `distinct_process_count`
- `process_list`
- `distinct_port_count`
- `manual_approved`
- `manual_rejected`
- `ip_context`

Valores sugeridos de `ip_context`:

- `NORMAL`
- `AMBIGUA`
- `RIESGOSA`

### 3.2. Por relacion

Para cada relacion `proceso + ip + puerto` conviene guardar:

- `process_name`
- `remote_ip`
- `remote_port`
- `first_seen`
- `last_seen`
- `times_seen`
- `status`
- `alert_count`
- `last_alert_at`
- `manual_approved`
- `manual_rejected`
- `archived`

## 4. Estados persistentes de una relacion

Cada relacion puede estar solo en uno de estos estados:

- `BASE`
- `NUEVA`
- `OBSERVACION`
- `SOSPECHOSA`
- `RECHAZADA`

Ademas, cada relacion puede tener:

- `archived = true`
- `archived = false`

`archived` no cambia la naturaleza del estado. Solo indica si la relacion dejo de generar alertas activas hasta que reaparezca.

## 5. Regla madre del sistema

Una relacion no cambia de estado solo por cantidad de apariciones.

La cantidad sirve como apoyo, pero nunca decide sola.

Una relacion cambia de estado por una combinacion de:

- estabilidad
- persistencia
- rareza
- cambio de patron
- contexto de la IP

Resumen:

- repeticion estable puede promover
- repeticion rara puede escalar
- cantidad sola no condena

## 6. Fases del sistema

### 6.1. Base inicial

En el primer arranque:

- se detectan conexiones actuales
- se muestran IPs y relaciones visibles
- el usuario acepta lo que ya sabe que es normal
- eso forma la base inicial del servidor

### 6.2. Aprendizaje controlado

Durante una ventana inicial:

- el sistema aprende patrones sanos
- no autoaprueba todo
- diferencia entre nuevo, observacion y sospechoso

Ventana sugerida:

- `LearningWindowHours = 48`

### 6.3. Operacion normal

Despues del aprendizaje:

- lo normal ya no alerta
- lo nuevo sano entra en `NUEVA`
- lo ambiguo entra en `OBSERVACION`
- lo riesgoso entra en `SOSPECHOSA`

## 7. Clasificacion inicial de una relacion nueva

Cuando aparece una nueva relacion `proceso + IP + puerto`, el sistema decide:

### 7.1. Entra directo a `SOSPECHOSA` si:

- el proceso es sensible
- el proceso es desconocido
- la IP esta rechazada
- el puerto es raro para ese proceso
- la IP aparece con demasiados procesos distintos en poco tiempo
- el patron cambia de forma brusca

### 7.2. Entra a `NUEVA` si:

- el proceso es conocido
- el puerto es razonable
- no hay senales raras
- el comportamiento parece estable

### 7.3. Entra a `OBSERVACION` si:

- no alcanza para `SOSPECHOSA`
- pero tampoco esta lo bastante limpia para `NUEVA`

## 8. Procesos sensibles

Estos procesos no deben tratarse como inocentes por defecto:

- `powershell`
- `pwsh`
- `cmd`
- `wscript`
- `cscript`
- `mshta`
- `rundll32`

Tambien debe considerarse sensible:

- un proceso desconocido con salida externa sin contexto claro

Si una relacion nueva usa uno de estos procesos, debe entrar como `SOSPECHOSA`.

## 9. Estado `BASE`

### 9.1. Significado

Una relacion `BASE` es una relacion aceptada como normal.

Comportamiento:

- no alerta
- se considera confiable
- sigue registrando actividad para historial

### 9.2. Como entra en `BASE`

Una relacion entra en `BASE` por dos caminos:

- aprobacion manual
- autoaprobacion desde `NUEVA`

### 9.3. Cuando deja de considerarse la misma relacion

Si cambia cualquiera de estos campos:

- `proceso`
- `IP remota`
- `puerto remoto`

entonces ya no es la misma relacion y se crea una nueva entrada para evaluar desde cero.

### 9.4. Cambio de frecuencia sobre una relacion `BASE`

Si se mantiene:

- mismo proceso
- misma IP
- mismo puerto

pero aumenta mucho la frecuencia:

- no se crea una nueva relacion
- no pierde automaticamente la base
- se abre una `OBSERVACION` de comportamiento

Esto es importante:

- la frecuencia cambia la confianza operativa
- la frecuencia no cambia la identidad del patron

## 10. Estado `NUEVA`

### 10.1. Cuando entra

Una relacion entra en `NUEVA` si:

- el proceso es conocido
- el puerto es esperado
- no hay senales sensibles
- el comportamiento parece estable
- no esta ya en la base

### 10.2. Cuantas veces alerta

Una relacion `NUEVA` alerta:

- maximo `3` veces
- no una por cada escaneo
- una por aparicion relevante

Parametro sugerido:

- `NewMaxAlerts = 3`

### 10.3. Cuando pasa a `BASE`

Una relacion `NUEVA` pasa automaticamente a `BASE` si:

- aparece `3` veces
- dentro de `48` horas
- con el mismo `proceso + IP + puerto`
- sin cambios raros
- sin puertos nuevos
- sin proceso sensible asociado a esa IP en ese contexto

Parametros sugeridos:

- `NewAutoApproveHits = 3`
- `NewWindowHours = 48`

### 10.4. Cuando pasa a `OBSERVACION`

Una relacion `NUEVA` pasa a `OBSERVACION` si:

- pasan `48` horas y no consolida
- cambia el comportamiento
- sube raro la frecuencia
- la IP se vuelve ambigua
- empieza a aparecer con demasiados procesos distintos

### 10.5. Regla importante

`NUEVA` nunca pasa a `SOSPECHOSA` solo por cantidad de apariciones.

Solo puede escalar por rareza nueva o cambio de patron.

## 11. Estado `OBSERVACION`

### 11.1. Cuando entra

Una relacion entra en `OBSERVACION` si:

- una `NUEVA` no consolido
- una IP conocida aparece con una relacion nueva
- una relacion `BASE` mantiene identidad pero cambia mucho su frecuencia
- una IP compartida por varios procesos recibe una relacion no del todo limpia
- reaparece una relacion dormida no sensible

### 11.2. Cuantas veces alerta

Una relacion en `OBSERVACION` alerta:

- 1 vez al inicio
- luego 1 recordatorio cada `6` horas
- con maximo `10` alertas

Parametros sugeridos:

- `ObservationReminderHours = 6`
- `ObservationMaxAlerts = 10`

### 11.3. Duracion activa

Una `OBSERVACION` se considera activa por:

- maximo `7` dias

Parametro sugerido:

- `ObservationActiveDays = 7`

### 11.4. Salida de `OBSERVACION`

Una `OBSERVACION` puede:

1. pasar a `BASE`
2. pasar a `SOSPECHOSA`
3. quedar archivada

### 11.5. Cuando pasa a `BASE`

`OBSERVACION` no se autoaprueba nunca.

Solo pasa a `BASE` por aprobacion manual.

Esta regla es deliberadamente conservadora por tratarse de un servidor.

### 11.6. Cuando pasa a `SOSPECHOSA`

Una `OBSERVACION` pasa a `SOSPECHOSA` si:

- llega a `10` alertas y sigue igual de rara
- cambia de proceso sobre la misma IP
- cambia mucho de puerto
- aumenta mucho la frecuencia
- sigue sin aclararse durante `7` dias
- la IP empieza a ser usada por demasiados procesos

### 11.7. Cuando queda archivada

Si una `OBSERVACION` desaparece y no reaparece durante su ventana activa:

- no entra en `BASE`
- no se borra
- queda `archived = true`
- deja de alertar activamente

Si reaparece:

- si reaparece igual, reactiva `OBSERVACION`
- si reaparece peor, escala a `SOSPECHOSA`

## 12. Estado `SOSPECHOSA`

### 12.1. Cuando entra

Una relacion entra a `SOSPECHOSA` si:

- usa un proceso sensible
- usa un proceso desconocido
- usa un puerto raro
- viene de una IP rechazada
- presenta demasiados cambios de patron
- escala desde `OBSERVACION`
- reaparece una relacion dormida con peor contexto

### 12.2. Cuantas veces alerta

Una relacion `SOSPECHOSA` alerta:

- inmediatamente en la primera aparicion
- luego 1 recordatorio cada `10` minutos
- con maximo `12` alertas por `24` horas para la misma relacion

Parametros sugeridos:

- `SuspiciousReminderMinutes = 10`
- `SuspiciousMaxAlertsPerDay = 12`

### 12.3. Cuando realerta de inmediato

Ademas del cooldown, debe volver a alertar de inmediato si:

- cambia el puerto
- cambia el proceso
- desaparece y vuelve
- aumenta mucho la frecuencia
- la misma IP empieza a recibir varios procesos sensibles o raros

### 12.4. Cuando deja de alertar activamente

Si una relacion `SOSPECHOSA` no reaparece durante:

- `72` horas

entonces:

- sigue siendo `SOSPECHOSA`
- queda `archived = true`
- deja de alertar activamente

Parametro sugerido:

- `SuspiciousQuietHours = 72`

### 12.5. Regla de seguridad

Una relacion `SOSPECHOSA` nunca pasa sola a `BASE`.

Solo puede ser aprobada manualmente.

## 13. Estado `RECHAZADA`

### 13.1. Como entra

Una relacion pasa a `RECHAZADA` solo por decision manual.

### 13.2. Comportamiento

Si una relacion `RECHAZADA` reaparece:

- alerta de inmediato
- nunca se autoaprueba
- nunca baja sola de estado

## 14. Contexto de IP compartida entre varios procesos

Una IP no debe marcarse como peligrosa solo porque la usen varios procesos.

La evaluacion correcta es:

- hasta `5` procesos conocidos distintos en `24h`: contexto normal
- mas de `5` procesos conocidos distintos en `24h`: contexto ambiguo
- presencia de procesos sensibles en esa IP: contexto de mayor riesgo

Parametro sugerido:

- `SharedIpKnownProcessLimit24h = 5`

### 14.1. Regla operativa

Casos tipicos:

- `IP nueva + proceso conocido` -> `NUEVA`
- `IP conocida + proceso conocido nuevo` -> `OBSERVACION`
- `IP conocida + proceso sensible` -> `SOSPECHOSA`
- `IP nueva + proceso sensible` -> `SOSPECHOSA`

Regla clave:

- muchos procesos no condenan por si solos
- pero si elevan la sensibilidad de las relaciones nuevas en esa IP

## 15. Relaciones dormidas y reaparicion

### 15.1. Definicion

Una relacion dormida es una relacion conocida que no aparecio durante mucho tiempo.

Parametro sugerido:

- `DormantRelationDays = 30`

### 15.2. Regla

Si una relacion `BASE` no aparece durante `30` dias y luego vuelve:

- si vuelve exactamente igual y con proceso no sensible -> `OBSERVACION`
- si vuelve con peor frecuencia -> `OBSERVACION`
- si vuelve con puerto distinto -> nueva relacion a evaluar
- si vuelve con proceso sensible -> `SOSPECHOSA`

Esto evita dos errores:

- ignorar una reaparicion relevante
- disparar alerta maxima por algo legitimo que solo llevaba mucho sin verse

## 16. Anti-spam de alertas

La politica anti-spam debe ser parte central del sistema.

### 16.1. Para `NUEVA`

- maximo `3` alertas totales

### 16.2. Para `OBSERVACION`

- 1 alerta inicial
- 1 alerta cada `6h`
- maximo `10`

### 16.3. Para `SOSPECHOSA`

- 1 alerta inmediata
- 1 alerta cada `10 min`
- maximo `12` por dia

### 16.4. Regla de archivado

Si una relacion esta archivada:

- no vuelve a alertar hasta reaparecer

Si reaparece:

- reactiva su ciclo de alertas segun el estado

## 17. Base manual y base automatica

### 17.1. Base manual

El operador debe poder:

- aprobar IP
- aprobar relacion `proceso|ip|puerto`
- rechazar IP
- rechazar relacion
- mover una observacion a `BASE`
- mover una observacion o sospechosa a `RECHAZADA`

### 17.2. Base automatica

Solo se autoaprueba:

- `NUEVA`

Y solo si cumple:

- `3` apariciones estables
- en `48h`
- sin rarezas

Nunca se autoaprueba:

- `OBSERVACION`
- `SOSPECHOSA`
- `RECHAZADA`

## 18. Parametros finales propuestos

- `LearningWindowHours = 48`
- `NewAutoApproveHits = 3`
- `NewWindowHours = 48`
- `NewMaxAlerts = 3`
- `ObservationReminderHours = 6`
- `ObservationMaxAlerts = 10`
- `ObservationActiveDays = 7`
- `SuspiciousReminderMinutes = 10`
- `SuspiciousMaxAlertsPerDay = 12`
- `SuspiciousQuietHours = 72`
- `SharedIpKnownProcessLimit24h = 5`
- `DormantRelationDays = 30`

## 19. Resumen operativo final

La politica completa queda asi:

1. La relacion `proceso + IP + puerto` es la unidad principal.
2. La IP solo agrega contexto.
3. `NUEVA` puede autoaprobarse.
4. `OBSERVACION` no se autoaprueba nunca.
5. `SOSPECHOSA` nunca se limpia sola a base.
6. `RECHAZADA` siempre alerta al reaparecer.
7. Cambios de frecuencia alteran confianza, no identidad.
8. Cambios de proceso, IP o puerto crean una nueva relacion.
9. Las relaciones dormidas que reaparecen deben revisarse.
10. Las relaciones archivadas no hacen ruido hasta reaparecer.

## 20. Resultado esperado

Con esta politica, `MonitorRed` deberia lograr:

- aprender lo normal sin pedir aprobacion por cada detalle
- evitar spam de Telegram por repeticiones identicas
- mantener seguimiento sobre patrones ambiguos
- alertar fuerte ante procesos sensibles o cambios raros
- conservar historial sin convertir cada caso viejo en ruido constante

En resumen:

- lo sano y estable se vuelve base
- lo ambiguo queda observado
- lo sospechoso alerta
- lo rechazado nunca se normaliza solo
