MIS TURNOS — PWA PARA PWABUILDER
Versión 1.0

CONTENIDO
- index.html: aplicación.
- styles.css: diseño adaptable a celular y computadora.
- app.js: calendario, cálculo de rotación, turnos fijos y carga manual.
- manifest.webmanifest: identidad PWA e iconos.
- sw.js: caché para funcionamiento sin conexión.
- icons/: iconos Android/PWA de 192 y 512 px.

FUNCIONES INCLUIDAS
1. Vista de calendario mensual, con navegación entre meses y selección de cada fecha.
2. Modo Rotación: fecha de un franco confirmado, turno que comienza después de ese franco, cantidad de días trabajados y descansos previos al siguiente franco.
3. Tratamiento de turnos nocturnos: si el bloque termina en un turno que cruza la medianoche, marca la salida al día siguiente y NO la toma como franco.
4. Modo Turnos fijos: reglas semanales configurables de domingo a sábado.
5. Modo Solo carga manual: permite cargar turnos, francos, descansos y salidas en cualquier fecha.
6. Colores independientes por turno, franco, descanso y salida.
7. Agregar, editar, ordenar y eliminar tipos de turno.
8. Exportar/importar respaldo JSON.
9. Datos guardados en el almacenamiento local del dispositivo; no se envían a un servidor.
10. Caché PWA para abrir la aplicación sin conexión después de la primera carga.

DATOS DE ARRANQUE
Se precargó como ejemplo el franco del 03/11/2026 y el turno 12:00–18:00 como primer bloque posterior, siguiendo la última rotación calculada en la conversación. Revisá Configuración antes de usarlo como calendario definitivo.

PUBLICAR Y COMPILAR CON PWABUILDER
PWABuilder necesita que la PWA esté publicada en una dirección HTTPS accesible. No alcanza con seleccionar el archivo index.html desde el teléfono o la computadora.

Opción sencilla: GitHub Pages
1. Creá un repositorio para esta aplicación.
2. Subí TODOS los archivos y carpetas de este paquete, conservando la estructura (index.html, app.js, styles.css, manifest.webmanifest, sw.js e icons/).
3. En GitHub, entrá a Settings > Pages.
4. En Build and deployment, elegí Deploy from a branch; seleccioná la rama y la carpeta raíz (/) y guardá.
5. Esperá a que GitHub Pages publique el sitio y abrí la dirección HTTPS que te informa.
6. Probá que cargue el calendario y que Configuración permita guardar cambios.
7. Abrí https://www.pwabuilder.com/ e ingresá la URL HTTPS publicada.
8. Elegí Package for stores / Android y generá el paquete. Para instalar fuera de Play Store, elegí la opción de Android correspondiente a instalación/prueba y revisá si PWABuilder ofrece APK firmado. Para Play Store, seguí el flujo Google Play y conservá la clave de firma.

IMPORTANTE SOBRE LOS DATOS
Los archivos de la PWA pueden estar alojados en GitHub Pages, pero los horarios que cargues quedan en el almacenamiento local del navegador/dispositivo. Si usás la app en otro teléfono, importá allí el respaldo JSON. No hay sincronización automática entre dispositivos en esta versión.

RECOMENDACIÓN
Antes de cargar datos reales, probá el ciclo con un franco de referencia conocido y comprobá especialmente la secuencia de turno nocturno, salida y franco. La fecha de ejemplo puede modificarse desde Configuración.
