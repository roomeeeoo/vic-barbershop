# Vic Barbershop

Web de Vic Barbershop: sitio estático (HTML, CSS y JavaScript sin compilación) con reservas online que se notifican por Telegram.

## Páginas

| Archivo | Contenido |
| --- | --- |
| `index.html` | Portada, escenas de scroll con los vídeos reales, galería, servicios destacados y acceso a reservas |
| `servicios.html` | Lista completa de servicios y precios |
| `reservar.html` | Formulario de reserva (servicio, día, hora, datos y nota) |
| `contacto.html` | Teléfono, Instagram y correo |

## Cómo verla en local

No hay dependencias que instalar. Desde la carpeta del proyecto:

```bash
python -m http.server 4173
```

y abre `http://localhost:4173`. También funciona abriendo `index.html` directamente.

## Configurar Telegram (obligatorio para que lleguen las reservas)

Las credenciales del bot **no están en el repositorio**. Para que el formulario envíe las reservas:

1. Copia `js/telegram-config.example.js` como `js/telegram-config.js`.
2. Rellena `BOT_TOKEN` (el token que da @BotFather) y `CHAT_ID` (el chat que recibe los avisos).
3. Sube `js/telegram-config.js` al hosting junto con el resto de archivos.

`js/telegram-config.js` está en `.gitignore`. Si se publica la web desde este repositorio con un despliegue automático, ese archivo hay que añadirlo en el hosting, porque Git no lo incluye.

Al ser una web sin servidor, el token viaja al navegador del visitante (igual que en la versión original). Para ocultarlo del todo haría falta una función de servidor que reenvíe el mensaje.

## Cómo funcionan las reservas

Toda la lógica está en `js/reservas.js`, copiada sin cambios de la web original:

- Horas de 10:00 a 17:30, cada 30 minutos.
- Validación de nombre, teléfono, servicio, fecha y hora.
- Las horas reservadas se guardan en el `localStorage` del navegador (clave `vicbarbershop_reservas`) y aparecen tachadas en ese mismo navegador.
- Envío a `https://api.telegram.org/bot<TOKEN>/sendMessage` con `parse_mode: Markdown`.
- Si Telegram falla, la reserva se confirma igualmente en pantalla.

`js/reservas-ui.js` solo es presentación: los botones de servicio y de día escriben en los mismos campos (`#servicio`, `#fecha`) que lee la lógica.

## Estructura

```
css/site.css            Sistema visual completo
js/site.js              Navegación, escenas de scroll y animaciones (GSAP ScrollTrigger)
js/reservas.js          Lógica de reservas y Telegram (no tocar sin motivo)
js/reservas-ui.js       Interfaz del formulario
js/telegram-config.example.js   Plantilla de credenciales
vendor/                 GSAP y ScrollTrigger (copia local)
fonts/                  Archivo variable (copia local)
media/                  Fotos y vídeos optimizados que usa la web
media-original/         Material original sin tratar (fotos, vídeos y logo)
```

## Material multimedia

Las fotos y los vídeos son trabajos reales de la barbería. Los originales están en `media-original/`; las versiones de `media/` se generan con ffmpeg (blanco y negro, WebP y H.264 con fotogramas clave cada 2 cuadros para que el vídeo responda al scroll).

## Créditos

- [GSAP](https://gsap.com) y ScrollTrigger.
- Tipografía [Archivo](https://fonts.google.com/specimen/Archivo), licencia SIL Open Font.
