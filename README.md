# Mis Turnos · PWA

Calendario general para organizar jornadas, turnos, francos y descansos. Preparado para GitHub Pages y PWABuilder.

## Funciones principales

- Calendario vacío al comenzar: no se cargan turnos ni francos de demostración.
- Calendario mensual y detalle escrito por fecha.
- Jornadas rápidas de 4, 6, 8 y 12 horas, además de duraciones personalizadas.
- Varios tramos de trabajo en un mismo día: jornada, horas extra y segundo turno.
- Rotación automática desde un franco confirmado, turnos fijos por día o carga manual.
- Descanso y franco como categorías separadas.
- Colores para diferenciar los tipos de jornada.
- Resumen mensual de horas nocturnas, feriados y horas efectivamente trabajadas en feriados.
- Modo oscuro con preferencia guardada en el dispositivo.
- Respaldo general para exportar o recuperar la planificación.

## Parámetros incorporados

El cómputo nocturno utiliza el tramo fijo de 21:00 a 05:00. Los controles para cambiarlo no se muestran a los usuarios.

El calendario conserva los feriados nacionales argentinos precargados para 2026 y los datos de feriados que ya estuvieran guardados en el dispositivo. Los controles para agregar, modificar o quitar fechas tampoco se muestran. Esos datos siguen utilizándose en los cálculos del calendario.

La aplicación no calcula horas al 100%, adicionales, recargos ni liquidaciones salariales. Los días no laborables se mantienen separados de los feriados.

## Configuración visible

El usuario puede elegir el tipo de planificación, administrar sus turnos y horarios, configurar la rotación o los turnos fijos y cambiar los colores del calendario. El apartado de Perfiles y los controles de cómputo nocturno y feriados no están disponibles en la interfaz.

## Publicación y actualización

Subí los archivos de esta carpeta a la raíz del repositorio de GitHub Pages. Conservá la carpeta `Icons` con I mayúscula: las rutas de `index.html`, `manifest.webmanifest` y `sw.js` usan ese nombre exacto. En GitHub Pages seleccioná la rama `main` y la carpeta raíz `/`. Ingresá la URL HTTPS publicada en PWABuilder.

Para actualizar una instalación existente, reemplazá los archivos de la raíz y la carpeta `Icons` en el mismo repositorio. El service worker usa la caché `mis-turnos-v5` para descargar la nueva versión. Se mantiene la clave de almacenamiento local de versiones anteriores, por lo que los datos ya guardados en el dispositivo no se borran por esta actualización.

## Datos y privacidad

Los calendarios y observaciones se guardan localmente en el dispositivo. No hay base de datos central ni sincronización automática. Exportá un respaldo antes de cambiar de dispositivo o borrar los datos del navegador.
