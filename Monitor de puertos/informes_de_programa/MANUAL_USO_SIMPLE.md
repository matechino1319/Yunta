# Manual de Uso Simple de MonitorRed

## 1. Que es este programa

MonitorRed sirve para mirar a que direcciones de internet se conecta la computadora. Tambien puede avisar por Telegram si detecta conexiones nuevas o comportamientos raros.

No hace falta saber informatica para usarlo en lo basico. La idea es:

- abrir el programa;
- dejarlo funcionando;
- revisar alertas cuando aparezcan;
- mirar los reportes cuando haga falta.

## 2. Archivos importantes

Los mas importantes para uso normal son:

- [MonitorRed.bat](C:\Users\Mateo Martinez\Documents\New project\MonitorRed\MonitorRed.bat): se abre con doble clic;
- [reportes](C:\Users\Mateo Martinez\Documents\New project\MonitorRed\reportes): carpeta donde quedan los reportes;
- [logs](C:\Users\Mateo Martinez\Documents\New project\MonitorRed\logs): carpeta donde quedan alertas y actividad;
- [config](C:\Users\Mateo Martinez\Documents\New project\MonitorRed\config): carpeta de configuracion.

## 3. Como abrirlo

1. Entrar en la carpeta del programa.
2. Hacer doble clic en `MonitorRed.bat`.
3. Esperar a que aparezca la ventana negra.

Si ya estaba funcionando en segundo plano, igual vas a poder abrir la interfaz.

## 4. Primera vez que se usa

La primera vez, el programa te va guiando.

Te puede pedir:

- elegir la carpeta donde guardar reportes;
- revisar las IPs que aparecen en ese momento;
- decidir cuales queres aprobar;
- configurar Telegram.

### 4.1 Elegir carpeta de reportes

Si no tenes un motivo especial, conviene dejar la carpeta sugerida por el programa.

### 4.2 Aceptar IPs

Te puede ofrecer:

- aceptar todas las IPs actuales;
- aceptar solo algunas;
- no aceptar ninguna.

Si la PC esta en uso normal y no notas nada raro, aceptar las actuales suele ayudar a arrancar con menos ruido.

## 5. Que hace el programa despues

Una vez configurado:

- sigue mirando conexiones de red;
- actualiza un reporte actual;
- guarda historicos cada cierto tiempo;
- registra observaciones y alertas;
- puede seguir funcionando aunque cierres la interfaz.

## 6. Que ves en la pantalla

Cuando abris la interfaz, vas a ver:

- si el monitor esta activo;
- el PID del monitor;
- la hora del ultimo escaneo;
- la hora del ultimo historico;
- cuantas conexiones se vieron;
- donde se guardan los reportes;
- si Telegram esta activo;
- una lista de conexiones recientes.

## 7. Opciones del menu

### Opcion 1: Actualizar reporte ahora

Sirve para forzar un escaneo en ese momento.

Usala si:

- queres ver que esta pasando ahora;
- hiciste una prueba;
- queres refrescar el reporte sin esperar.

### Opcion 2: Matar proceso por PID

Sirve para cerrar un proceso por su numero interno de Windows.

Usala solo si sabes exactamente que estas cerrando.

### Opcion 3: Reiniciar monitoreo

Sirve para reiniciar el worker del monitor.

Usala si:

- hiciste cambios en el programa;
- pensas que quedo trabado;
- queres asegurarte de que cargue la version mas nueva.

### Opcion 4: Configurar Telegram

Sirve para:

- cargar o cambiar el `Bot Token`;
- cargar o cambiar el `Chat ID`;
- activar o desactivar alertas.

Tambien podes editar `telegram.ini` a mano si preferis.

### Opcion 5: Salir de la interfaz

Cierra la ventana visible, pero el monitoreo puede seguir ejecutandose en segundo plano.

## 8. Como funcionan las alertas

### 8.1 Si una IP no esta aprobada

Si aparece una conexion no aprobada:

- el programa alerta la primera vez que la ve activa;
- si sigue exactamente igual en el siguiente escaneo, no repite la misma alerta una y otra vez;
- si se corta y despues reaparece, vuelve a alertar;
- si cambia el proceso o el puerto, vuelve a alertar.

Esto evita que una IP desconocida quede “blanqueada”, pero tambien evita spam.

### 8.2 Si una IP esta aprobada

Si una IP ya esta aprobada:

- no alerta solo por existir;
- pero si aparece con una combinacion nueva de proceso y puerto, el sistema la revisa.

Puede pasar una de dos:

- si parece normal, queda como observacion;
- si parece sospechoso, manda alerta fuerte.

## 9. Donde mirar los resultados

### 9.1 Reporte actual

[informe_actual.csv](C:\Users\Mateo Martinez\Documents\New project\MonitorRed\reportes\informe_actual.csv)

Muestra la foto mas reciente de las conexiones.

### 9.2 Historicos

[historico](C:\Users\Mateo Martinez\Documents\New project\MonitorRed\reportes\historico)

Guarda copias con fecha y hora.

### 9.3 Alertas

[alertas.log](C:\Users\Mateo Martinez\Documents\New project\MonitorRed\logs\alertas.log)

Guarda alertas importantes.

### 9.4 Actividad normal

[monitor.log](C:\Users\Mateo Martinez\Documents\New project\MonitorRed\logs\monitor.log)

Guarda:

- inicio del monitor;
- resumenes de escaneo;
- observaciones;
- acciones manuales.

### 9.5 Errores

[errores.log](C:\Users\Mateo Martinez\Documents\New project\MonitorRed\logs\errores.log)

Si algo falla, suele quedar anotado ahi.

## 10. Como entender una alerta

Una alerta suele mostrar:

- IP remota;
- puerto remoto;
- IP local;
- puerto local;
- estado;
- PID;
- aplicacion.

Traducido simple:

- `IP remota`: a donde se conecto la computadora;
- `Puerto remoto`: el canal usado del otro lado;
- `IP local`: la direccion de tu PC en esa conexion;
- `Puerto local`: el canal usado de tu lado;
- `PID`: numero interno del proceso;
- `Aplicacion`: nombre del programa que hizo la conexion.

## 11. Si Telegram no avisa

Puede pasar porque:

- falta `BotToken`;
- falta `ChatId`;
- hubo un problema de internet;
- Telegram rechazo el envio.

Revisar:

- [telegram.ini](C:\Users\Mateo Martinez\Documents\New project\MonitorRed\config\telegram.ini)
- [errores.log](C:\Users\Mateo Martinez\Documents\New project\MonitorRed\logs\errores.log)

Importante:

- si `BotToken` y `ChatId` estan cargados, el programa intenta activar Telegram automaticamente;
- tambien podes configurarlo desde la opcion `4`.

## 12. Si aparece algo raro

Si aparece una alerta que no reconoces:

1. No borres nada apurado.
2. Revisa `alertas.log`.
3. Mira `informe_actual.csv`.
4. Anota la hora.
5. Mira que aplicacion figura.
6. Si no estas seguro, no mates procesos al azar.

## 13. Cuando preocuparse mas

Conviene mirar con atencion si:

- aparece una IP que no conoces;
- la alerta vuelve despues de haberse cortado;
- cambia de proceso o puerto sin esperarlo;
- aparece algo como `powershell`, `cmd`, `wscript`, `mshta` o parecido;
- vos no estabas haciendo nada especial y aun asi aparecen conexiones raras.

## 14. Si el CSV esta abierto

Si `informe_actual.csv` esta abierto en Excel u otro programa, el sistema puede no poder guardarlo.

En ese caso:

1. Cerra el archivo.
2. Volve a usar la opcion `1`.

El programa ahora intenta mostrar un mensaje mas claro cuando pasa eso.

## 15. Uso diario simple

Para usarlo todos los dias, alcanza con esto:

1. Abrir `MonitorRed.bat`.
2. Confirmar que el worker este activo.
3. Dejarlo funcionando.
4. Usar la opcion `1` si queres actualizar a mano.
5. Revisar Telegram o `alertas.log` si hay avisos.
6. Cerrar la ventana cuando quieras si no queres verla abierta.

## 16. Consejo importante

Que una conexion salga de tu computadora no significa automaticamente que sea confiable.

Por eso el programa no aprueba solo todo lo que aparece. La decision de aprobar IPs sigue siendo manual para no perder control.

## 17. Resumen final

MonitorRed sirve para vigilar conexiones TCP de forma simple. Su version actual:

- alerta cuando aparece una conexion no aprobada;
- no repite la misma alerta en cada ciclo si sigue igual;
- vuelve a alertar si reaparece o cambia;
- observa cambios sobre IPs aprobadas;
- puede avisar por Telegram;
- guarda reportes y logs para revisar despues.

Es una herramienta de observacion y control, no un reemplazo total de un antivirus.
