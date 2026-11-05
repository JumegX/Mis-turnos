# Mis Turnos · PWA

Calendario adaptable para planificar turnos de trabajo, francos, descansos, horas extra y dobles turnos. Preparado para publicarse en GitHub Pages y empaquetarse con [PWABuilder](https://www.pwabuilder.com/).

## Funciones principales

- Inicio vacío: no se cargan turnos ni francos de demostración.
- Calendario mensual y detalle escrito por fecha.
- Jornadas rápidas de 4, 6, 8 y 12 horas, además de duraciones personalizadas.
- Varias franjas de trabajo en un mismo día: jornada, horas extra y segundo turno.
- Turnos configurables con horarios y colores propios.
- Rotación automática desde un franco confirmado, turnos fijos por día o carga manual.
- Descanso y franco como categorías separadas.
- Perfiles locales independientes para organizar la planificación de distintos empleados.
- Exportación de una planificación por período y fecha de vigencia para compartirla por WhatsApp como archivo JSON.
- Importación de perfiles recibidos sin borrar el calendario anterior; el calendario muestra “Perfil [nombre] en vigencia” desde la fecha indicada.
- Respaldo general de perfiles y asignaciones.

## Publicación

Subí los archivos de esta carpeta a la raíz del repositorio de GitHub Pages. Conservá la carpeta `Icons` con I mayúscula, porque las rutas de `index.html`, `manifest.webmanifest` y `sw.js` usan ese nombre exacto.

En GitHub Pages seleccioná la rama `main` y la carpeta raíz `/`. Ingresá la URL HTTPS publicada en PWABuilder para generar el paquete Android.

## Datos

Los calendarios y perfiles se guardan localmente en el dispositivo. No existe una base de datos central ni sincronización automática. Los perfiles compartidos viajan como archivos JSON, que el destinatario importa desde la sección **Perfiles**.
