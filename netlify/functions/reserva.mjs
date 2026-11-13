// Reenvía las reservas a Telegram sin exponer el token en el navegador.
// El token y el chat se leen de las variables de entorno del sitio en Netlify:
//   TELEGRAM_BOT_TOKEN  y  TELEGRAM_CHAT_ID
// El texto del mensaje llega ya formado desde js/reservas.js y se envía tal cual.

const CABECERA = '🗓 *Nueva reserva — VicBarbershop*';
const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });

export default async (req) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const activo = Boolean(token && chatId);
  const api = (metodo) => `https://api.telegram.org/bot${token}/${metodo}`;

  if (req.method === 'GET') {
    const url = new URL(req.url);
    // ?comprobar=1 valida token y chat contra Telegram sin enviar ningún mensaje.
    if (activo && url.searchParams.get('comprobar') === '1') {
      const [bot, chat] = await Promise.all([
        fetch(api('getMe')).then((r) => r.json()).catch(() => ({ ok: false })),
        fetch(api('getChat') + '?chat_id=' + encodeURIComponent(chatId)).then((r) => r.json()).catch(() => ({ ok: false }))
      ]);
      return json(200, { activo, tokenValido: bot.ok === true, chatAccesible: chat.ok === true });
    }
    return json(200, { activo });
  }

  if (req.method !== 'POST') return json(405, { ok: false, error: 'Método no permitido' });
  if (!activo) return json(503, { ok: false, error: 'Reservas sin configurar' });

  let datos;
  try { datos = await req.json(); } catch { return json(400, { ok: false, error: 'JSON no válido' }); }

  const text = datos && datos.text;
  if (typeof text !== 'string' || !text.startsWith(CABECERA) || text.length > 1500) {
    return json(400, { ok: false, error: 'Mensaje no válido' });
  }

  const r = await fetch(api('sendMessage'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' })
  });
  const resultado = await r.json().catch(() => ({ ok: false }));
  return json(resultado.ok ? 200 : 502, { ok: resultado.ok === true });
};
