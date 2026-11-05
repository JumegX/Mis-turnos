# Mis Turnos · PWA

Calendario general para organizar jornadas, turnos, francos, descansos, horas extra, perfiles y cómputo de horas nocturnas y feriados. Preparado para GitHub Pages y PWABuilder.

## Funciones principales

- Calendario vacío al comenzar: no se cargan turnos ni francos de demostración.
- Calendario mensual y detalle escrito por fecha.
- Jornadas rápidas de 4, 6, 8 y 12 horas, además de duraciones personalizadas.
- Varios tramos de trabajo en un mismo día: jornada, horas extra y segundo turno.
- Turnos configurables con horarios y colores propios.
- Rotación automática desde un franco confirmado, turnos fijos por día o carga manual.
- Descanso y franco como categorías separadas.
- Perfiles locales independientes para distintos empleados.
- Exportación de una planificación por período y fecha de vigencia para compartirla como archivo JSON.
- Importación de perfiles recibidos sin borrar el calendario anterior.
- Respaldo general de perfiles y asignaciones.
- Cómputo mensual de horas nocturnas, días feriados, horas efectivamente trabajadas en feriados y días/horas no laborables.
- Modo oscuro con preferencia guardada en el dispositivo.

## Cómputo de horas

El período nocturno inicial se configura de 21:00 a 05:00. Se pueden modificar ambos límites en Configuración para adaptarlo a las necesidades de cada usuario. Las horas se cuentan minuto a minuto según los tramos de trabajo cargados.

El resumen mensual distingue: (1) horas nocturnas, (2) cantidad de días marcados como feriados, (3) horas realmente trabajadas dentro de esos feriados, (4) cantidad de días no laborables y (5) horas trabajadas en días no laborables. Un feriado se cuenta como día aunque no haya una jornada asignada; las horas trabajadas en feriado solo suman cuando existe un tramo de trabajo.

La aplicación no calcula horas al 100%, adicionales, recargos ni liquidaciones salariales. Los feriados precargados son nacionales de Argentina para 2026. Cada usuario debe agregar los feriados provinciales, municipales, sectoriales o particulares que correspondan a su lugar de trabajo. En 2026, por ejemplo, hubo feriados especiales regionales el 10 de noviembre para Córdoba y CABA y el 11 de noviembre para la Provincia de Buenos Aires; no se precargan para todos porque no rigen en todo el país.

## Perfiles compartidos

- El jefe crea un perfil local para cada empleado y carga su planificación.
- Elige el nombre del empleado, el período y la fecha de vigencia para exportar un archivo.
- El empleado descarga el adjunto de WhatsApp, abre Mis Turnos > Perfiles > Seleccionar archivo de perfil y lo importa.
- El perfil recibido queda guardado aparte y se muestra desde su fecha de vigencia, sin borrar la planificación anterior.

## Publicación y actualización

Subí los archivos de esta carpeta a la raíz del repositorio de GitHub Pages. Conservá la carpeta `Icons` con I mayúscula: las rutas de `index.html`, `manifest.webmanifest` y `sw.js` usan ese nombre exacto. En GitHub Pages seleccioná la rama `main` y la carpeta raíz `/`. Ingresá la URL HTTPS publicada en PWABuilder.

Para actualizar una instalación existente, reemplazá los archivos de la raíz y la carpeta `Icons` en el mismo repositorio. El service worker usa la caché `mis-turnos-v4` para descargar la nueva versión. En una TWA, las actualizaciones del sitio publicado llegan desde la web; no es necesario generar otra APK por cada cambio de HTML, CSS o JavaScript.

## Datos y privacidad

Los calendarios y perfiles se guardan localmente en el dispositivo. No hay base de datos central ni sincronización automática. Los perfiles compartidos viajan como archivos JSON. Exportá un respaldo antes de cambiar de dispositivo o borrar los datos del navegador.
