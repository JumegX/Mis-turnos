MIS TURNOS — PWA PARA PWABUILDER
Versión 2.0

CONTENIDO
- index.html: estructura de la aplicación.
- styles.css: diseño adaptable a celulares y computadoras.
- app.js: calendario, jornadas, perfiles y cálculos.
- manifest.webmanifest: identidad PWA e iconos.
- sw.js: caché y actualización para uso sin conexión.
- README.md: descripción general del proyecto.
- README.txt: guía detallada de uso y publicación.
- Icons/: iconos PWA de 192 y 512 px.

INICIO VACÍO
La aplicación comienza sin turnos, francos ni descansos precargados. El primer uso no presupone una rotación específica ni carga horarios de ejemplo.

FUNCIONES
1. Calendario mensual con selección de fecha y detalle diario escrito.
2. Una sola acción para agregar o modificar la asignación del día.
3. Jornadas de 4, 6, 8 y 12 horas, más duración personalizada.
4. Varios tramos por día: jornada principal, horas extra y segundo turno.
5. Turnos configurables con nombre, inicio, fin y color.
6. Rotación automática desde un franco confirmado, con cantidad configurable de días trabajados y descansos previos. La salida de un turno nocturno no se considera franco.
7. Turnos fijos por día de la semana o carga completamente manual.
8. Colores configurables para jornada, extras, segundo turno, franco, descanso y salida.
9. Perfiles locales independientes: permite crear un calendario de cada empleado y cambiar entre ellos.
10. Compartir un perfil por el menú nativo de Android (por ejemplo WhatsApp), como archivo JSON con período y fecha de vigencia.
11. Importar perfiles recibidos sin borrar el calendario actual. El perfil importado se muestra desde su fecha de vigencia, con la leyenda “Perfil [nombre] en vigencia”.
12. Exportación e importación de respaldo completo de todos los perfiles.
13. Datos locales en el dispositivo; no hay servidor ni sincronización automática.

CÓMO USAR LOS PERFILES COMPARTIDOS
- El jefe crea un perfil local para cada empleado desde la sección Perfiles.
- Abre ese perfil, configura turnos y asignaciones y elige el período que desea compartir.
- Completa nombre del empleado, fecha de vigencia y fecha final. Usa “Compartir perfil por WhatsApp”.
- El empleado descarga el archivo adjunto en WhatsApp, abre Mis Turnos > Perfiles > Seleccionar archivo de perfil y elige el archivo .turnos.json.
- El perfil recibido queda almacenado aparte. El calendario actual se mantiene hasta la fecha de vigencia y luego muestra las asignaciones recibidas durante el período incluido.
- Se puede tener más de un perfil recibido guardado, aunque se muestra uno por vez en el calendario. Se cambia con el botón “Mostrar” en la lista de perfiles recibidos.

PUBLICAR / ACTUALIZAR EN GITHUB PAGES
1. Descomprimí el ZIP.
2. En el repositorio ya creado, reemplazá los archivos de la raíz por los nuevos: index.html, app.js, styles.css, manifest.webmanifest, sw.js, README.md y README.txt.
3. Subí también la carpeta Icons completa, conservando el nombre exacto con I mayúscula. Este paquete usa ese mismo nombre para coincidir con el repositorio que ya creaste. Los nombres distinguen mayúsculas y minúsculas.
4. Confirmá los cambios con Commit changes.
5. Abrí la URL publicada de GitHub Pages y recargá. La nueva versión usa otra clave de almacenamiento (v2), por lo que empieza limpia y no mezcla la configuración de ejemplo de la versión anterior.

PWABUILDER Y ACTUALIZACIONES
Esta PWA se sirve desde GitHub Pages por HTTPS. Para compilar, ingresá esa URL en https://www.pwabuilder.com/.
Si el paquete Android generado es una Trusted Web Activity (TWA), el contenido se carga desde la web: al publicar nuevas versiones del sitio, estas se reflejan en la aplicación instalada cuando actualiza su service worker/contenido. No hace falta regenerar el APK por cada cambio de HTML, CSS o JavaScript. El service worker de esta versión cambia su caché a mis-turnos-v2 para forzar la actualización de recursos.
Si modificás la identidad nativa de Android (nombre/ícono/Package ID), permisos o el envoltorio Android, puede requerirse compilar y distribuir una nueva versión del APK. Para publicar una actualización en Google Play, se debe generar un paquete con versión y código de versión mayores y firmarlo con la misma clave de la aplicación existente.

IMPORTANTE SOBRE DATOS Y PRIVACIDAD
Los archivos de la PWA se publican en GitHub Pages, pero los horarios y perfiles se guardan en el almacenamiento local del navegador/dispositivo. Los perfiles compartidos viajan como archivos JSON y contienen las asignaciones y el nombre que se indique. No incluyas datos sensibles innecesarios. No hay sincronización automática entre dispositivos ni un servidor central.
