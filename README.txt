MIS TURNOS — PWA PARA PWABUILDER
Versión 6.0

CONTENIDO
- index.html: estructura de la aplicación.
- styles.css: diseño adaptable, vista ampliada, lista vertical y modo oscuro.
- app.js: calendario, jornadas, rotación y cómputo de horas.
- manifest.webmanifest: identidad PWA e iconos.
- sw.js: caché y actualización para uso sin conexión.
- Icons/: iconos PWA. Conservar la I mayúscula.

CAMBIOS DE LA VERSIÓN 6.0
1. Se agregó sentido de rotación normal o inverso. La secuencia usa el orden manual de la lista de turnos; no se ordena por la hora de inicio. El primer turno después del franco de referencia se elige expresamente.
2. La salida al día siguiente se registra automáticamente cuando la última jornada cruza la medianoche. Se quitó la tilde de la ventana porque ya no necesita intervención del usuario.
3. Se agregó una vista de lista vertical mensual y un control para agrandar textos y elementos de interfaz. Ambas preferencias se guardan por dispositivo.
4. Los controles para avanzar y retroceder de mes se movieron debajo de la vista del calendario; el mes y el año permanecen arriba.
5. Se agregó el pie de créditos y un botón de donación voluntaria. El botón queda preparado pero necesita el enlace personal de Mercado Pago para abrir el cobro.
6. Se conserva la clave de almacenamiento local mis-turnos-data-v2 para no borrar datos de v5.
7. Se actualizó la caché del service worker a mis-turnos-v6.

PUBLICACIÓN
Descomprimí el ZIP y reemplazá los archivos de la raíz del repositorio de GitHub Pages. Conservá la carpeta Icons con I mayúscula. No subas el ZIP ni una carpeta exterior anidada.

VISTA PREVIA
El archivo MisTurnos_v6_vista_previa.html es una versión autónoma para abrir localmente y probar la interfaz. Algunas capacidades PWA (instalación, caché sin conexión y compartir nativo) requieren publicarla por HTTPS.

MERCADO PAGO
Para activar las donaciones, reemplazar la constante DONATION_URL al inicio de app.js por el link de pago personal que proporcione el titular de la cuenta.
