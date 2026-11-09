# Mis Turnos · PWA v7.0

Calendario general para organizar jornadas, turnos, francos y descansos. Preparado para GitHub Pages y PWABuilder.

## Cambios de la versión 7.0

- En configuración, el punto 1 se llama **Franco** y ofrece únicamente **Rotativo** o **Fijo**. Se quitó la opción de planificación manual.
- Los datos antiguos que tenían el modo manual se abren en modo Rotativo; las asignaciones manuales ya cargadas se conservan y siguen teniendo prioridad sobre el cálculo automático.
- En el punto 2 se crean turnos indicando nombre, hora Desde y hora Hasta. Ya no existe un selector de duración: se calcula a partir de esos horarios.
- Se pueden reordenar los turnos creados con las flechas ↑ y ↓. Ese orden se utiliza para la rotación.
- El botón **Invitar un Cafecito** abre directamente https://cafecito.app/jumeg en una pestaña nueva.

## Se conservan

- Rotación en orden normal o inverso, selección del primer turno tras el franco de referencia y configuración de días de trabajo/descanso.
- Turnos fijos por día de la semana.
- Vista mensual en calendario o lista vertical.
- Control para agrandar la interfaz.
- Mes y año visibles arriba; botones para cambiar de mes debajo del calendario.
- Horas nocturnas de 21:00 a 05:00 y registro de feriados.
- Modo oscuro, observaciones, asignaciones manuales puntuales y respaldo JSON.
- Almacenamiento local existente con clave `mis-turnos-data-v2`; no se borra ni se reinicia el contenido guardado.

## Publicación

Subí el contenido de `GestionTurnosPWA` a la raíz del repositorio de GitHub Pages. Conservá `Icons` con I mayúscula. El service worker utiliza la caché `mis-turnos-v7`.

## Vista previa local

`MisTurnos_v7_vista_previa.html` contiene CSS y JavaScript integrados para abrirse directamente como archivo HTML. La instalación PWA y la caché offline requieren HTTPS.

## Donaciones

El botón abre directamente el perfil público de Cafecito: https://cafecito.app/jumeg.
