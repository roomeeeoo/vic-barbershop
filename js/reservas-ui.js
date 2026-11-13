/* ═══════════════════════════════════════════════════════════════════════════
   Interfaz del formulario de reservas (solo presentación).
   No valida, no guarda y no envía nada: se limita a escribir en los mismos
   campos (#servicio y #fecha) que lee js/reservas.js y a llamar a su
   renderHoras(), igual que hacía el selector y el calendario originales.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var select = document.getElementById('servicio');
  var fecha = document.getElementById('fecha');
  var strip = document.getElementById('dayStrip');
  var opts = document.querySelectorAll('.service-opt');

  /* Servicio: botones grandes que escriben el mismo value del <select> */
  function syncServicio() {
    opts.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.value === select.value)); });
  }
  opts.forEach(function (b) {
    b.addEventListener('click', function () { select.value = b.dataset.value; syncServicio(); });
  });

  /* Día: accesos rápidos a los próximos 14 días; escriben en #fecha */
  function iso(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function syncDia() {
    strip.querySelectorAll('.day').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.value === fecha.value)); });
  }
  var hoy = new Date();
  for (var i = 0; i < 14; i++) {
    var d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i);
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'day';
    b.dataset.value = iso(d);
    b.setAttribute('aria-pressed', 'false');
    var w = i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '');
    b.setAttribute('aria-label', d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }));
    b.innerHTML = '<span class="w">' + w + '</span><span class="d">' + d.getDate() + '</span>';
    b.addEventListener('click', function () {
      fecha.value = this.dataset.value;
      renderHoras();            // misma llamada que el onchange del campo de fecha
      syncDia();
    });
    strip.appendChild(b);
  }
  fecha.addEventListener('change', syncDia);

  /* Al reiniciar el formulario original, reflejarlo en los botones */
  var resetOriginal = window.resetForm;
  window.resetForm = function () {
    resetOriginal();
    syncServicio();
    syncDia();
  };
})();
