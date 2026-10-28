# Agenda Peluquería — instrucciones

App de agenda para peluquería: citas, clientes, servicios, resumen de ingresos, horario, días cerrados y enlace de reservas para clientes (por WhatsApp). Funciona sin internet una vez abierta y se instala en la pantalla de inicio.

## 1. Publicarla gratis en GitHub Pages

Necesitas una cuenta gratuita en github.com.

1. Descomprime el ZIP. Verás archivos sueltos (no hay carpetas): `index.html`, `app.js`, `styles.css`, etc. **Hay que subirlos todos.**
2. En github.com pulsa **+** (arriba a la derecha) → **New repository**.
3. Ponle un nombre sin espacios (por ejemplo `agenda`), déjalo en **Public** y pulsa **Create repository**.
4. En la página del repositorio pulsa **uploading an existing file** (o **Add file → Upload files**).
5. Selecciona/arrastra **todos los archivos** descomprimidos. En iPhone: pulsa «choose your files», elige «Elegir archivos» y marca todos.
6. Espera a que terminen de subir y pulsa **Commit changes**.
7. Ve a **Settings → Pages**. En «Branch» elige **main** y la carpeta **/ (root)** → **Save**.
8. Espera 1–2 minutos y recarga. Arriba aparecerá tu dirección: `https://TU-USUARIO.github.io/agenda/`

## 2. Instalarla en el iPhone

1. Abre tu dirección **con Safari**.
2. Pulsa el botón **Compartir** (cuadrado con flecha) → **Añadir a pantalla de inicio** → **Añadir**.
3. **Abre la app desde el icono nuevo** y empieza a meter datos desde ahí.

> **Muy importante:** la app instalada y Safari guardan los datos por separado. Si pruebas cosas en Safari, esos datos NO aparecerán en la app instalada. Instálala primero y usa siempre el icono.

## 3. Primeros pasos

1. **Ajustes** → escribe el nombre de la peluquería y su **WhatsApp** (donde llegarán las reservas).
2. **Ajustes → Horario**: revisa días y horas (hay un horario de ejemplo).
3. **Servicios**: cambia los 5 servicios de ejemplo por los tuyos (duración y precio).
4. **Agenda → botón +** para apuntar citas.

## 4. Reservas de clientes (cómo funciona de verdad)

1. **Ajustes → Crear enlace de reservas** → cópialo o compártelo (WhatsApp, Instagram…).
2. El cliente elige servicio, día y hora libre, y pulsa «Enviar solicitud por WhatsApp». Te llega un mensaje.
3. Tú **copias ese mensaje**, abres en la Agenda el botón de la bandeja (arriba a la derecha) y lo pegas. La app prepara la cita; después puedes **confirmársela por WhatsApp** con un toque.

Limitaciones (sin servidor no se puede más, y es gratis):
- La reserva **no es automática**: la confirmas tú.
- El enlace muestra los huecos libres **del momento en que lo creaste**. Si apuntas citas nuevas, vuelve a crear y compartir el enlace para actualizarlo. Dos clientes podrían pedir el mismo hueco; al pegar la solicitud la app te avisa si se solapa.
- No hay notificaciones automáticas. Los recordatorios se hacen con el botón «Recordar» (abre WhatsApp con el mensaje escrito).

## 5. Proteger tus datos (léelo)

Los datos se guardan **solo en el móvil** donde usas la app. No se sincronizan con otros dispositivos.

Se pueden perder si: borras la app/icono, borras datos de Safari, cambias de móvil o se restaura el teléfono.

**Qué hacer:**
- **Ajustes → Guardar copia de seguridad** cada semana. Se genera un archivo `.json`: guárdalo en **Archivos/iCloud** o envíatelo por WhatsApp/correo.
- La app te avisa con un cartel cuando llevas 7 días sin copia.
- **Antes de borrar el icono o cambiar de móvil, haz una copia.**
- Para restaurar: **Ajustes → Restaurar desde una copia** y elige el archivo. Antes de sustituir, la app guarda una copia interna y puedes pulsar **Deshacer última restauración**.

## 6. Actualizar la app más adelante

Sube los archivos nuevos al mismo repositorio (reemplazando). Tus datos **no se tocan**: viven en el móvil, no en los archivos. Cierra y vuelve a abrir la app (a veces dos veces) para ver la versión nueva.

## Contenido del ZIP

`index.html` (agenda) · `reservar.html` + `reservar.js` (página de clientes) · `app.js`, `common.js`, `db.js`, `styles.css` · `sw.js` (modo sin conexión) · `manifest.webmanifest` + iconos (PWA)
