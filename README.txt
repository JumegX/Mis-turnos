MIS TURNOS — PWA PARA PWABUILDER
Versión 5.0

CONTENIDO
- index.html: estructura de la aplicación.
- styles.css: diseño adaptable y modo oscuro.
- app.js: calendario, jornadas y cómputo de horas.
- manifest.webmanifest: identidad PWA e iconos.
- sw.js: caché y actualización para uso sin conexión.
- README.md: descripción general del proyecto.
- README.txt: esta guía.
- Icons/: iconos PWA. Conservar la I mayúscula.

CAMBIOS DE LA VERSIÓN 5.0
1. Se quitó el acceso visible al apartado Perfiles; el bloque interno se conserva oculto para no borrar datos locales existentes.
2. Se invirtieron los puntos 2 y 3 de Configuración: primero se administran los turnos y horarios; después se configuran la rotación o los turnos fijos.
3. Se ocultaron los apartados de cómputo nocturno y feriados. Sus valores continúan cargados y se usan en los cálculos.
4. El cómputo nocturno predeterminado permanece en 21:00 a 05:00.
5. Se mantienen los feriados precargados de 2026 y los feriados ya guardados en cada dispositivo.
6. El respaldo de datos continúa disponible y pasa a ser el punto 5 de Configuración.
7. Se actualizó la caché del service worker a mis-turnos-v5. La clave de almacenamiento local no se modificó.

CÓMO ACTUALIZAR GITHUB PAGES DESDE ANDROID
1. Descomprimí el ZIP.
2. Abrí el repositorio existente y mantené la rama main.
3. Reemplazá en la raíz: index.html, app.js, styles.css, manifest.webmanifest, sw.js, README.md y README.txt.
4. Reemplazá los tres PNG dentro de la carpeta Icons si el paquete los incluye. Conservá exactamente `Icons` con I mayúscula.
5. Confirmá con Commit changes. No subas el ZIP ni una carpeta exterior anidada.
6. Abrí la URL de GitHub Pages y recargá. El service worker cambia a mis-turnos-v5 para actualizar los recursos.

DATOS
Los datos del calendario se guardan localmente en cada dispositivo. No hay sincronización automática ni servidor central. La actualización mantiene la clave de almacenamiento local para conservar los turnos y observaciones ya guardados. Exportá un respaldo JSON antes de limpiar datos o migrar de dispositivo.
