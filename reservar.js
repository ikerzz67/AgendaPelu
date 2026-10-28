'use strict';
/* Página pública de reservas: el cliente elige servicio, día y hora y envía la solicitud por WhatsApp. */
(function () {
  const root = document.getElementById('app');
  let cfg = null;
  try { cfg = U.dec(location.hash.slice(1)); } catch (e) { cfg = null; }

  if (!cfg || !Array.isArray(cfg.s) || !cfg.s.length || !Array.isArray(cfg.h)) {
    root.innerHTML = '<div class="hero"><h1>Enlace no válido</h1></div><div class="empty">Este enlace está incompleto o ha caducado.<br>Pide a la peluquería que te envíe uno nuevo.</div>';
    return;
  }

  const hours = cfg.h.map(a => ({ open: !!a[0], from: a[1], to: a[2], bFrom: a[3] >= 0 ? a[3] : null, bTo: a[4] >= 0 ? a[4] : null }));
  const services = cfg.s.map(a => ({ id: a[0], name: a[1], duration: a[2], price: a[3] }));
  const closed = new Set(cfg.c || []);
  const busyMap = cfg.b || {};
  const step = cfg.st || 30, notice = cfg.mn || 0;
  const today = U.today();
  const gen = cfg.g || today;
  const lastDay = U.addDays(gen, (cfg.md || 14) - 1);

  if (cfg.a && /^#[0-9a-f]{6}$/i.test(cfg.a)) {
    const h = cfg.a, r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16);
    document.documentElement.style.setProperty('--accent', h);
    document.documentElement.style.setProperty('--accent-soft', 'rgba(' + r + ',' + g + ',' + b + ',.13)');
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', h);
  }
  document.documentElement.setAttribute('data-theme', 'auto');
  document.title = 'Reserva tu cita · ' + cfg.n;

  if (today > lastDay) {
    root.innerHTML = '<div class="hero"><h1>' + U.esc(cfg.n) + '</h1></div><div class="empty"><b>Este enlace ha caducado</b>Pide a la peluquería que te envíe uno actualizado.</div>';
    return;
  }

  const st = { svc: null, date: null, time: null, name: '', phone: '' };

  function daySlots(date, svc) {
    if (closed.has(date)) return [];
    const h = hours[U.dow(date)];
    const segs = U.segments(h);
    const busy = busyMap[date] || [];
    const min = date === today ? U.nowMin() + notice : 0;
    return U.slots(segs, busy, svc.duration, step, min);
  }
  function dayList() {
    const out = [];
    for (let d = today; d <= lastDay && out.length < 60; d = U.addDays(d, 1)) out.push(d);
    return out;
  }

  function buildMessage() {
    const s = st.svc;
    const code = s.id + '.' + st.date.replace(/-/g, '') + '.' + U.pad(Math.floor(st.time / 60)) + U.pad(st.time % 60) + '.' + s.duration;
    return 'Hola, quisiera reservar una cita en ' + cfg.n + ':\n' +
      'Servicio: ' + s.name + '\n' +
      'Día: ' + U.cap(U.dayLong(st.date)) + '\n' +
      'Hora: ' + U.mm(st.time) + '\n' +
      'Nombre: ' + st.name.trim() + '\n' +
      'Teléfono: ' + st.phone.trim() + '\n' +
      'Ref: ' + code;
  }

  function render() {
    const stale = (Date.now() - U.parse(gen).getTime()) > 3 * 86400000;
    let html = '<div class="hero"><h1>' + U.esc(cfg.n) + '</h1><div class="muted">Reserva tu cita en unos toques</div></div>';
    if (stale) html += '<div class="banner info"><div>Los huecos pueden haber cambiado desde que se creó este enlace. La peluquería te confirmará la cita.</div></div>';

    // 1. Servicio
    html += '<div class="section-title"><span class="stepn">1</span>Elige el servicio</div><div class="list">' +
      services.map((s, i) => '<button class="opt' + (st.svc && st.svc.id === s.id && st.svc.name === s.name ? ' on' : '') + '" data-svc="' + i + '"><div><div class="t">' + U.esc(s.name) + '</div><div class="s">' + U.dur(s.duration) + '</div></div><b>' + U.money(s.price) + '</b></button>').join('') + '</div>';

    // 2. Día
    if (st.svc) {
      html += '<div class="section-title"><span class="stepn">2</span>Elige el día</div><div class="days">' + dayList().map(d => {
        const n = daySlots(d, st.svc).length, dt = U.parse(d);
        return '<button class="day' + (st.date === d ? ' on' : '') + (n ? '' : ' dis') + '" data-day="' + d + '"' + (n ? '' : ' disabled') + '><small>' + U.DAYS_S[dt.getDay()] + (d === today ? ' · hoy' : '') + '</small><b>' + dt.getDate() + '</b><em>' + dt.toLocaleDateString('es-ES', { month: 'short' }) + '</em></button>';
      }).join('') + '</div>';
      if (!dayList().some(d => daySlots(d, st.svc).length)) html += '<div class="banner">No quedan huecos libres para este servicio en los próximos días. Escribe directamente a la peluquería.</div>';
    }

    // 3. Hora
    if (st.svc && st.date) {
      const sl = daySlots(st.date, st.svc);
      html += '<div class="section-title"><span class="stepn">3</span>Elige la hora</div><div class="slots">' +
        sl.map(t => '<button class="slot' + (st.time === t ? ' on' : '') + '" data-time="' + t + '">' + U.mm(t) + '</button>').join('') + '</div>';
    }

    // 4. Datos
    if (st.svc && st.date && st.time != null) {
      html += '<div class="section-title"><span class="stepn">4</span>Tus datos</div><div class="card">' +
        '<label class="f" style="margin-top:0" for="r-name">Nombre</label><input type="text" id="r-name" autocomplete="name" value="' + U.esc(st.name) + '">' +
        '<label class="f" for="r-phone">Tu teléfono</label><input type="tel" id="r-phone" inputmode="tel" autocomplete="tel" value="' + U.esc(st.phone) + '"></div>' +
        '<div class="card" style="margin-top:12px"><div><b>' + U.esc(st.svc.name) + '</b> · ' + U.money(st.svc.price) + '</div>' +
        '<div class="muted">' + U.esc(U.cap(U.dayLong(st.date))) + ' a las <b style="color:var(--ink)">' + U.mm(st.time) + '</b> (' + U.dur(st.svc.duration) + ')</div></div>' +
        '<button class="btn primary block" style="margin-top:14px;min-height:54px" id="send" ' + (cfg.p ? '' : 'disabled') + '>Enviar solicitud por WhatsApp</button>' +
        (cfg.p ? '' : '<div class="banner" style="margin-top:12px">La peluquería aún no ha configurado su WhatsApp.</div>') +
        '<button class="btn block" style="margin-top:10px" id="copy">Copiar el mensaje</button>' +
        '<p class="help" style="text-align:center">Se abrirá WhatsApp con el mensaje ya escrito. <b>Tu cita no queda confirmada hasta que ' + U.esc(cfg.n) + ' te responda.</b></p>';
    }
    root.innerHTML = html;
  }

  function valid() {
    if (st.name.trim().length < 2) { alert('Escribe tu nombre.'); return false; }
    if (U.phoneWA(st.phone).length < 9) { alert('Escribe un teléfono válido para que podamos confirmarte la cita.'); return false; }
    return true;
  }

  root.addEventListener('click', ev => {
    const t = ev.target.closest('button'); if (!t) return;
    if (t.dataset.svc != null) { st.svc = services[+t.dataset.svc]; st.date = null; st.time = null; render(); }
    else if (t.dataset.day) { st.date = t.dataset.day; st.time = null; render(); }
    else if (t.dataset.time) { st.time = +t.dataset.time; render(); setTimeout(() => { const s = document.getElementById('send'); if (s) s.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 50); }
    else if (t.id === 'send') { if (valid()) location.href = U.waLink(cfg.p, buildMessage()); }
    else if (t.id === 'copy') {
      if (!valid()) return;
      const msg = buildMessage();
      (navigator.clipboard ? navigator.clipboard.writeText(msg) : Promise.reject()).then(() => alert('Mensaje copiado. Pégalo en WhatsApp.'), () => prompt('Copia este mensaje:', msg));
    }
  });
  root.addEventListener('input', ev => {
    if (ev.target.id === 'r-name') st.name = ev.target.value;
    if (ev.target.id === 'r-phone') st.phone = ev.target.value;
  });

  render();
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
