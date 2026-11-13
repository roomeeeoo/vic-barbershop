// ═══════════════════════════════════════════════════════════════════════════
// LÓGICA DE RESERVAS — VicBarbershop
// Copiada sin cambios de la web original (reservar.html). Lo único distinto:
// el token y el chat de Telegram se leen de js/telegram-config.js en lugar de
// estar escritos aquí, para no subirlos a GitHub. Mismo endpoint, mismo
// formato de mensaje, mismas validaciones, mismo localStorage.
// NO modificar sin motivo: de este archivo dependen las reservas reales.
// ═══════════════════════════════════════════════════════════════════════════

  // ─── CONFIGURACIÓN ─────────────────────────────────────────────────────────
  const TELEGRAM_BOT_TOKEN = window.VIC_TELEGRAM.BOT_TOKEN;
  const TELEGRAM_CHAT_ID   = window.VIC_TELEGRAM.CHAT_ID;
  const STORAGE_KEY        = 'vicbarbershop_reservas';

  // Horas disponibles: 10:00 → 17:30 cada 30 min
  const HORAS = [];
  for (let h = 10; h < 18; h++) {
    HORAS.push(`${String(h).padStart(2,'0')}:00`);
    if (h < 17) HORAS.push(`${String(h).padStart(2,'0')}:30`);
    else if (h === 17) HORAS.push('17:30');
  }

  // ─── RESERVAS EN LOCALSTORAGE ──────────────────────────────────────────────
  function getReservas() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { return {}; }
  }
  function saveReserva(fecha, hora) {
    const r = getReservas();
    if (!r[fecha]) r[fecha] = [];
    if (!r[fecha].includes(hora)) r[fecha].push(hora);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(r));
  }
  function isOcupada(fecha, hora) {
    const r = getReservas();
    return r[fecha] && r[fecha].includes(hora);
  }

  // ─── RENDER HORAS ──────────────────────────────────────────────────────────
  let horaSeleccionada = null;

  function renderHoras() {
    const fecha = document.getElementById('fecha').value;
    horaSeleccionada = null;
    document.getElementById('horaError').classList.remove('show');

    if (!fecha) { document.getElementById('horasWrap').style.display = 'none'; return; }

    document.getElementById('horasWrap').style.display = 'grid';
    const grid = document.getElementById('timeGrid');
    grid.innerHTML = '';

    HORAS.forEach(hora => {
      const btn = document.createElement('button');
      btn.className = 'time-btn' + (isOcupada(fecha, hora) ? ' occupied' : '');
      btn.textContent = hora;
      btn.type = 'button';
      if (!isOcupada(fecha, hora)) {
        btn.onclick = () => selectHora(fecha, hora, btn);
      }
      grid.appendChild(btn);
    });
  }

  function selectHora(fecha, hora, btn) {
    document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    horaSeleccionada = hora;
    document.getElementById('horaError').classList.remove('show');
  }

  // ─── ENVIAR RESERVA ────────────────────────────────────────────────────────
  async function enviarReserva() {
    const nombre   = document.getElementById('nombre').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const servicio = document.getElementById('servicio').value;
    const fecha    = document.getElementById('fecha').value;
    const nota     = document.getElementById('nota').value.trim();
    const errEl    = document.getElementById('formError');

    errEl.classList.remove('show');

    // Validaciones
    if (!nombre) { showError('Por favor, introduce tu nombre.'); return; }
    if (!telefono) { showError('Por favor, introduce tu teléfono.'); return; }
    if (!servicio) { showError('Por favor, elige un servicio.'); return; }
    if (!fecha) { showError('Por favor, selecciona una fecha.'); return; }
    if (!horaSeleccionada) {
      document.getElementById('horaError').classList.add('show');
      return;
    }

    // Doble check anti-duplicado (por si alguien abrió la web en dos pestañas)
    if (isOcupada(fecha, horaSeleccionada)) {
      showError('Esta hora ya ha sido reservada. Por favor, elige otra.');
      renderHoras();
      return;
    }

    // Guardar reserva localmente
    saveReserva(fecha, horaSeleccionada);

    // Formatear fecha legible
    const fechaObj = new Date(fecha + 'T12:00:00');
    const fechaLegible = fechaObj.toLocaleDateString('es-ES', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

    // Enviar a Telegram
    const msg = `🗓 *Nueva reserva — VicBarbershop*\n\n` +
                `👤 *Nombre:* ${nombre}\n` +
                `📞 *Teléfono:* ${telefono}\n` +
                `✂️ *Servicio:* ${servicio}\n` +
                `📅 *Fecha:* ${fechaLegible}\n` +
                `🕐 *Hora:* ${horaSeleccionada}\n` +
                (nota ? `📝 *Nota:* ${nota}` : '');

    try {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: msg,
          parse_mode: 'Markdown'
        })
      });
    } catch (e) {
      // Si falla Telegram la reserva igual queda guardada localmente
      console.warn('Telegram no disponible:', e);
    }

    // Mostrar éxito
    document.getElementById('successText').textContent =
      `${nombre}, tu cita para ${servicio} el ${fechaLegible} a las ${horaSeleccionada} está confirmada. ¡Hasta pronto!`;
    document.getElementById('reservaForm').style.display = 'none';
    document.getElementById('successBox').classList.add('show');
  }

  function showError(msg) {
    const el = document.getElementById('formError');
    el.textContent = msg;
    el.classList.add('show');
  }

  function resetForm() {
    document.getElementById('reservaForm').style.display = 'grid';
    document.getElementById('successBox').classList.remove('show');
    document.getElementById('nombre').value = '';
    document.getElementById('telefono').value = '';
    document.getElementById('servicio').value = '';
    document.getElementById('fecha').value = '';
    document.getElementById('nota').value = '';
    document.getElementById('horasWrap').style.display = 'none';
    horaSeleccionada = null;
  }

  // Fijar fecha mínima a hoy
  document.addEventListener('DOMContentLoaded', () => {
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fecha').min = hoy;
  });
