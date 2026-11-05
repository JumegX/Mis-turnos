MIS TURNOS — PWA PARA PWABUILDER
Versión 4.0

CONTENIDO
- index.html: estructura de la aplicación.
- styles.css: diseño adaptable y modo oscuro.
- app.js: calendario, jornadas, perfiles y cómputo de horas.
- manifest.webmanifest: identidad PWA e iconos.
- sw.js: caché y actualización para uso sin conexión.
- README.md: descripción general del proyecto.
- README.txt: esta guía.
- Icons/: iconos PWA. Conservar la I mayúscula.

NOVEDADES DE LA VERSIÓN 4.0
1. Horario nocturno predeterminado de 21:00 a 05:00. El inicio y el fin se pueden personalizar desde Configuración.
2. Migración automática del antiguo fin predeterminado 06:00 a 05:00. Si el usuario había configurado otro horario de fin, se conserva.
3. Resumen mensual con cantidad de días feriados, horas efectivamente trabajadas en feriados, cantidad de días no laborables y horas trabajadas en días no laborables.
4. Se eliminó el cómputo de horas al 100% y toda clasificación asociada. La aplicación no calcula recargos ni adicionales salariales.
5. Se mantiene el modo oscuro y el texto de alto contraste.
6. Se mantiene la clave de almacenamiento local para conservar perfiles, turnos y observaciones ya guardados.

CÓMPUTO
- Las horas nocturnas se suman minuto a minuto dentro del período indicado en Configuración (por defecto 21:00 inclusive a 05:00 exclusive).
- Los días feriados se cuentan aunque no tengan una jornada asignada.
- Las horas en feriados suman solo los minutos realmente trabajados que caen dentro de una fecha marcada como feriado.
- Los días no laborables se muestran por separado; no se tratan automáticamente como feriados.
- El calendario precarga feriados nacionales argentinos de 2026. Cada persona debe agregar las fechas provinciales, municipales, sectoriales o propias de su lugar de trabajo. Por ejemplo, en 2026 hubo fechas especiales regionales el 10/11 para Córdoba y CABA y el 11/11 para la Provincia de Buenos Aires; no se aplican a todo el país.

CÓMO ACTUALIZAR GITHUB PAGES DESDE ANDROID
1. Descomprimí el ZIP.
2. Abrí el repositorio existente y mantené la rama main.
3. Reemplazá en la raíz: index.html, app.js, styles.css, manifest.webmanifest, sw.js, README.md y README.txt.
4. Reemplazá los tres PNG dentro de la carpeta Icons si el paquete los incluye. Conservá exactamente `Icons` con I mayúscula.
5. Confirmá con Commit changes. No subas el ZIP ni una carpeta exterior anidada.
6. Abrí la URL de GitHub Pages y recargá. El service worker cambia a mis-turnos-v4 para actualizar los recursos.

APK Y DATOS
En una Trusted Web Activity (TWA), la APK muestra el sitio publicado: los cambios web suelen llegar mediante la actualización del service worker y no requieren compilar otra APK por cada cambio de contenido. Puede requerirse una APK nueva si cambia la identidad nativa, el package ID, permisos o configuración del envoltorio Android.

Los datos se guardan localmente en cada dispositivo. Exportá un respaldo JSON antes de limpiar datos o migrar de dispositivo. No hay sincronización automática ni servidor central.
