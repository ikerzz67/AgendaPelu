'use strict';
/* Agenda Peluquería — aplicación principal */

const APP_VERSION = '1.0.0';
const ACC = {
  rose:  { n: 'Rosa',    c: '#c24a7b' },
  plum:  { n: 'Ciruela', c: '#7b4fb0' },
  teal:  { n: 'Turquesa', c: '#1f8a84' },
  gold:  { n: 'Dorado',  c: '#b57a1e' },
  coral: { n: 'Coral',   c: '#dd5a40' },
  ink:   { n: 'Grafito', c: '#3b4a63' }
};
const STATUS = { pending: 'Pendiente', done: 'Hecha', noshow: 'No vino', cancelled: 'Cancelada' };

const S = {
  tab: 'agenda', date: U.today(), clientQ: '', range: 'mes',
  settings: null, services: [], clients: [], appts: [], todayStamp: U.today()
};
let FORM = null; // estado del formulario de cita abierto

/* ---------- Iconos ---------- */
const ic = p => '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
const I = {
  cal: ic('<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/>'),
  users: ic('<circle cx="9" cy="8.5" r="3.5"/><path d="M2.8 20c.5-3.6 3-5.5 6.2-5.5s5.7 1.9 6.2 5.5"/><path d="M16 5.2a3.3 3.3 0 0 1 0 6.2M18 14.8c2 .6 3.2 2.3 3.5 5.2"/>'),
  scissors: ic('<circle cx="6" cy="6.5" r="2.8"/><circle cx="6" cy="17.5" r="2.8"/><path d="M8.3 8.2 20 18M8.3 15.8 20 6"/>'),
  chart: ic('<path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>'),
  sliders: ic('<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>'),
  plus: ic('<path d="M12 5v14M5 12h14"/>'),
  left: ic('<path d="m15 5-7 7 7 7"/>'),
  right: ic('<path d="m9 5 7 7-7 7"/>'),
  x: ic('<path d="M6 6l12 12M18 6 6 18"/>'),
  check: ic('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  phone: ic('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>'),
  chat: ic('<path d="M4 5h16v11H9l-5 4z"/>'),
  trash: ic('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
  download: ic('<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>'),
  upload: ic('<path d="M12 16V5M7 9l5-5 5 5M5 20h14"/>'),
  link: ic('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
  inbox: ic('<path d="M4 13l2-8h12l2 8M4 13v6h16v-6M4 13h5l1 2h4l1-2h5"/>'),
  bell: ic('<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0"/>'),
  share: ic('<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6"/>')
};

/* ---------- Utilidades de interfaz ---------- */
const $ = id => document.getElementById(id);
const val = id => { const e = $(id); return e ? e.value : ''; };
let toastTimer;
function toast(msg) {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = msg;
  requestAnimationFrame(() => t.classList.add('show'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}
function openSheet(title, html) {
  closeSheet();
  const el = document.createElement('div');
  el.className = 'sheet-wrap';
  el.innerHTML = '<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="' + U.esc(title) + '">' +
    '<div class="sheet-head"><h2>' + U.esc(title) + '</h2><button class="icon-btn sm" data-act="closeSheet" aria-label="Cerrar">' + I.x + '</button></div>' +
    '<div class="sheet-body">' + html + '</div></div>';
  document.body.appendChild(el);
  document.body.classList.add('noscroll');
  requestAnimationFrame(() => el.classList.add('show'));
  return el;
}
function closeSheet() {
  const el = document.querySelector('.sheet-wrap');
  if (el) el.remove();
  document.body.classList.remove('noscroll');
  FORM = null;
}
function applyTheme() {
  const s = S.settings, root = document.documentElement;
  const acc = (ACC[s.accent] || ACC.rose).c;
  root.style.setProperty('--accent', acc);
  const r = parseInt(acc.slice(1, 3), 16), g = parseInt(acc.slice(3, 5), 16), b = parseInt(acc.slice(5, 7), 16);
  root.style.setProperty('--accent-soft', 'rgba(' + r + ',' + g + ',' + b + ',.13)');
  root.setAttribute('data-theme', s.theme || 'auto');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', acc);
  document.title = s.salonName || 'Agenda Peluquería';
}

/* ---------- Datos ---------- */
async function loadAll() {
  S.settings = await DB.getSettings();
  S.services = (await DB.all('services')).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  S.clients = await DB.all('clients');
  S.appts = await DB.all('appointments');
}
const saveSettings = () => DB.saveSettings(S.settings);
const clientById = id => S.clients.find(c => c.id === id);
const apptsOn = d => S.appts.filter(a => a.date === d).sort((a, b) => a.start - b.start);
const phoneOf = a => { const c = clientById(a.clientId); return c ? c.phone : ''; };
const svcNames = a => (a.services || []).map(x => x.name).join(' + ');

function hoursFor(date) {
  const s = S.settings, h = s.hours[U.dow(date)];
  const closedItem = s.closedDates.find(c => c.date === date);
  return {
    closedItem,
    h: {
      open: !!h.open && !closedItem,
      from: U.toMin(h.from), to: U.toMin(h.to),
      bFrom: h.bFrom ? U.toMin(h.bFrom) : null, bTo: h.bTo ? U.toMin(h.bTo) : null
    }
  };
}
function weekOf(date) {
  const mon = U.addDays(date, -((U.dow(date) + 6) % 7));
  return [0, 1, 2, 3, 4, 5, 6].map(i => U.addDays(mon, i));
}
function isPast(a) {
  const t = U.today();
  return a.date < t || (a.date === t && a.start + a.duration <= U.nowMin());
}
function unmarkedPast() { return S.appts.filter(a => a.status === 'pending' && isPast(a)); }
function daysSinceBackup() {
  const lb = S.settings.lastBackup;
  if (!lb) return null;
  return Math.floor((Date.now() - new Date(lb).getTime()) / 86400000);
}
function waVars(a) {
  const c = clientById(a.clientId);
  const first = ((c ? c.name : a.clientName) || '').trim().split(/\s+/)[0] || '';
  return {
    nombre: first, salon: S.settings.salonName,
    dia: U.parse(a.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }),
    hora: U.mm(a.start), servicio: svcNames(a) || 'tu cita'
  };
}

/* =======================================================
   VISTAS
   ======================================================= */
function render(scrollTop) {
  const y = window.scrollY;
  const views = { agenda: viewAgenda, clientes: viewClients, servicios: viewServices, resumen: viewStats, ajustes: viewSettings };
  $('view').innerHTML = views[S.tab]();
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t.dataset.tab === S.tab));
  $('fab').classList.toggle('hide', !['agenda', 'clientes', 'servicios'].includes(S.tab));
  window.scrollTo(0, scrollTop ? 0 : y);
}

/* ----- Agenda ----- */
function viewAgenda() {
  const s = S.settings, date = S.date, today = U.today(), isToday = date === today;
  const hf = hoursFor(date), segs = U.segments(hf.h);
  const list = apptsOn(date), active = list.filter(a => a.status !== 'cancelled');
  const busy = active.map(a => [a.start, a.start + a.duration]);
  const wins = U.freeWindows(segs, busy).filter(w => w[1] - w[0] >= Math.max(15, s.step));
  const dayTotal = active.filter(a => a.status !== 'noshow').reduce((t, a) => t + (+a.price || 0), 0);

  const items = [];
  list.forEach(a => items.push({ t: a.start, k: 'a', a }));
  wins.forEach(w => items.push({ t: w[0], k: 'f', w }));
  items.sort((x, y) => x.t - y.t || (x.k === 'f' ? 1 : -1));

  const tmr = U.addDays(today, 1);
  const tmrN = apptsOn(tmr).filter(a => a.status === 'pending').length;
  const unm = unmarkedPast();
  const dsb = daysSinceBackup();
  const needBackup = S.appts.length + S.clients.length > 0 && (dsb === null || dsb >= 7);

  const week = weekOf(date).map(d => {
    const dt = U.parse(d), n = apptsOn(d).filter(a => a.status !== 'cancelled').length;
    const cl = !hoursFor(d).h.open;
    return '<button class="wd' + (d === date ? ' on' : '') + (d === today ? ' today' : '') + (cl ? ' closed' : '') + '" data-act="goDate" data-date="' + d + '" aria-label="' + U.esc(U.dayLong(d)) + '">' +
      '<small>' + U.DAYS_S[dt.getDay()] + '</small><b>' + dt.getDate() + '</b>' + (n ? '<i></i>' : '') + '</button>';
  }).join('');

  let sub;
  if (hf.h.open) sub = 'Abierto ' + segs.map(x => U.mm(x[0]) + '–' + U.mm(x[1])).join(' y ');
  else sub = hf.closedItem ? 'Cerrado · ' + (hf.closedItem.label || 'día festivo') : 'Día de descanso';
  sub += ' · ' + active.length + (active.length === 1 ? ' cita' : ' citas') + (dayTotal ? ' · ' + U.money(dayTotal) : '');

  let body = '';
  items.forEach(it => {
    if (it.k === 'a') body += apptCard(it.a);
    else body += '<button class="free" data-act="newAt" data-start="' + it.w[0] + '"><span><b>Libre</b> ' + U.mm(it.w[0]) + '–' + U.mm(it.w[1]) + ' · ' + U.dur(it.w[1] - it.w[0]) + '</span>' + I.plus + '</button>';
  });
  if (!list.length) {
    body = '<div class="empty"><b>' + (hf.h.open ? 'Sin citas este día' : 'Día sin actividad') + '</b>' +
      (hf.h.open ? 'Pulsa el botón + para apuntar la primera cita.' : 'Puedes cambiar el horario en Ajustes, o apuntar una cita igualmente con el botón +.') + '</div>' + body;
  }

  return '<div class="topbar"><div><h1>' + U.esc(s.salonName) + '</h1><div class="sub">Agenda</div></div>' +
    '<div class="top-actions">' +
    '<button class="icon-btn" data-act="remindTomorrow" aria-label="Recordatorios de mañana" title="Recordatorios de mañana">' + I.bell + '</button>' +
    '<button class="icon-btn" data-act="pasteReq" aria-label="Pegar solicitud de reserva" title="Pegar solicitud de reserva">' + I.inbox + '</button></div></div>' +
    (needBackup ? '<div class="banner"><div><b>Haz una copia de seguridad.</b><br>' + (dsb === null ? 'Aún no has guardado ninguna.' : 'La última fue hace ' + dsb + ' días.') + ' Tus datos solo viven en este móvil.</div><button class="btn sm primary" data-act="exportBackup">Copiar</button></div>' : '') +
    (unm.length ? '<div class="banner info"><div><b>' + unm.length + (unm.length === 1 ? ' cita pasada sin marcar.' : ' citas pasadas sin marcar.') + '</b><br>Márcalas como «Hecha» para que cuenten en ingresos.</div><button class="btn sm soft" data-act="reviewUnmarked">Revisar</button></div>' : '') +
    (tmrN ? '<button class="btn soft block" style="margin-bottom:12px" data-act="remindTomorrow">' + I.bell + ' Recordar a ' + tmrN + (tmrN === 1 ? ' cliente de mañana' : ' clientes de mañana') + '</button>' : '') +
    '<div class="weekstrip">' + week + '</div>' +
    '<div class="daybar"><button class="icon-btn" data-act="prevDay" aria-label="Día anterior">' + I.left + '</button>' +
    '<label class="datepick title"><b>' + U.esc(U.cap(U.dayLong(date))) + '</b><span>' + U.esc(sub) + '</span><input type="date" id="jumpdate" value="' + date + '" aria-label="Elegir fecha"></label>' +
    '<button class="icon-btn" data-act="nextDay" aria-label="Día siguiente">' + I.right + '</button></div>' +
    (!isToday ? '<div style="text-align:center;margin-bottom:12px"><button class="btn sm soft" data-act="goToday">Ir a hoy</button></div>' : '') +
    '<div class="list">' + body + '</div>';
}

function apptCard(a) {
  const phone = phoneOf(a), past = isPast(a) && a.status === 'pending';
  const badge = a.status === 'pending' ? (past ? '<span class="badge warn">Sin marcar</span>' : '') : '<span class="badge ' + a.status + '">' + STATUS[a.status] + '</span>';
  return '<div class="card appt st-' + a.status + '" data-act="editAppt" data-id="' + a.id + '" role="button" tabindex="0">' +
    '<div class="time"><b>' + U.mm(a.start) + '</b><span>' + U.mm(a.start + a.duration) + '</span></div>' +
    '<div><div class="name">' + U.esc(a.clientName) + '</div><div class="svc">' + (U.esc(svcNames(a)) || 'Sin servicio') + '</div>' +
    (a.notes ? '<div class="note">' + U.esc(a.notes) + '</div>' : '') + '</div>' +
    '<div class="side"><span class="price">' + (a.price ? U.money(a.price) : '') + '</span>' + badge + '</div>' +
    (a.status === 'pending' ? '<div class="quick"><button class="btn sm soft" data-act="quickDone" data-id="' + a.id + '">' + I.check + ' Hecha</button>' +
      (U.phoneWA(phone) ? '<button class="btn sm" data-act="waRemind" data-id="' + a.id + '">' + I.chat + ' Recordar</button>' : '') + '</div>' : '') +
    '</div>';
}

/* ----- Clientes ----- */
function clientStats() {
  const m = {};
  S.appts.forEach(a => {
    if (a.status !== 'done' || a.clientId == null) return;
    const x = m[a.clientId] || (m[a.clientId] = { n: 0, spent: 0, last: '' });
    x.n++; x.spent += +a.price || 0; if (a.date > x.last) x.last = a.date;
  });
  return m;
}
function clientListHTML() {
  const q = S.clientQ.trim().toLowerCase(), st = clientStats();
  let list = S.clients.slice().sort((a, b) => a.name.localeCompare(b.name, 'es'));
  if (q) list = list.filter(c => (c.name + ' ' + (c.phone || '')).toLowerCase().includes(q));
  if (!list.length) return '<div class="empty"><b>' + (q ? 'Sin resultados' : 'Aún no hay clientes') + '</b>' + (q ? 'Prueba con otro nombre o teléfono.' : 'Se crean solos al apuntar una cita, o con el botón +.') + '</div>';
  return '<div class="list">' + list.map(c => {
    const x = st[c.id];
    return '<button class="item" data-act="editClient" data-id="' + c.id + '"><div class="avatar">' + U.esc((c.name || '?').trim().charAt(0).toUpperCase()) + '</div>' +
      '<div><div class="t">' + U.esc(c.name) + '</div><div class="s">' + (U.esc(c.phone) || 'Sin teléfono') + '</div></div>' +
      '<div class="end small">' + (x ? x.n + (x.n === 1 ? ' visita' : ' visitas') : '<span class="muted">Nueva</span>') + '</div></button>';
  }).join('') + '</div>';
}
function viewClients() {
  return '<div class="topbar"><div><h1>Clientes</h1><div class="sub">' + S.clients.length + (S.clients.length === 1 ? ' cliente' : ' clientes') + '</div></div></div>' +
    '<div class="search"><input type="search" id="clientq" placeholder="Buscar por nombre o teléfono" value="' + U.esc(S.clientQ) + '" autocomplete="off"></div>' +
    '<div id="clientlist">' + clientListHTML() + '</div>';
}

/* ----- Servicios ----- */
function viewServices() {
  const body = S.services.length ? '<div class="list">' + S.services.map(s =>
    '<button class="item' + (s.active === false ? ' off' : '') + '" data-act="editService" data-id="' + s.id + '"><div class="avatar">' + I.scissors + '</div>' +
    '<div><div class="t">' + U.esc(s.name) + '</div><div class="s">' + U.dur(s.duration) + (s.active === false ? ' · Oculto' : '') + '</div></div>' +
    '<div class="end">' + U.money(s.price) + '</div></button>').join('') + '</div>'
    : '<div class="empty"><b>No hay servicios</b>Añade tu primer servicio con el botón +.</div>';
  return '<div class="topbar"><div><h1>Servicios</h1><div class="sub">Duración y precio de cada servicio</div></div></div>' + body +
    '<p class="help">La duración se usa para calcular los huecos libres. Los servicios ocultos no se ofrecen a los clientes en el enlace de reservas.</p>';
}

/* ----- Resumen ----- */
function rangeOf(r) {
  const t = U.today(), d = U.parse(t);
  if (r === 'sem') { const mon = U.addDays(t, -((d.getDay() + 6) % 7)); return { from: mon, to: U.addDays(mon, 6), label: 'Esta semana' }; }
  if (r === 'anio') return { from: d.getFullYear() + '-01-01', to: d.getFullYear() + '-12-31', label: 'Año ' + d.getFullYear() };
  return { from: U.ymd(new Date(d.getFullYear(), d.getMonth(), 1)), to: U.ymd(new Date(d.getFullYear(), d.getMonth() + 1, 0)), label: U.cap(U.monthName(d.getFullYear(), d.getMonth())) };
}
function viewStats() {
  const r = S.range, rg = rangeOf(r);
  const inR = S.appts.filter(a => a.date >= rg.from && a.date <= rg.to);
  const done = inR.filter(a => a.status === 'done');
  const income = done.reduce((t, a) => t + (+a.price || 0), 0);
  const pending = inR.filter(a => a.status === 'pending').reduce((t, a) => t + (+a.price || 0), 0);
  const lost = inR.filter(a => a.status === 'noshow' || a.status === 'cancelled').length;
  const avg = done.length ? income / done.length : 0;

  // barras
  let buckets = [], labels = [];
  if (r === 'anio') {
    for (let m = 0; m < 12; m++) { buckets.push(0); labels.push('EFMAMJJASOND'[m]); }
    done.forEach(a => { buckets[+a.date.slice(5, 7) - 1] += +a.price || 0; });
  } else {
    const n = Math.round((U.parse(rg.to) - U.parse(rg.from)) / 86400000) + 1;
    for (let i = 0; i < n; i++) {
      buckets.push(0);
      const d = U.addDays(rg.from, i);
      labels.push(r === 'sem' ? U.DAYS_S[U.dow(d)] : ((i + 1) % 5 === 0 || i === 0 ? String(i + 1) : ''));
    }
    done.forEach(a => { buckets[Math.round((U.parse(a.date) - U.parse(rg.from)) / 86400000)] += +a.price || 0; });
  }
  const mx = Math.max.apply(null, buckets.concat([1]));
  const bars = '<div class="bars">' + buckets.map(v => '<div class="b" title="' + U.money(v) + '"><i class="' + (v ? '' : 'zero') + '" style="height:' + (v ? Math.max(4, v / mx * 100) : 2) + '%"></i></div>').join('') + '</div>' +
    '<div class="bars-l">' + labels.map(l => '<span>' + l + '</span>').join('') + '</div>';

  // servicios más pedidos
  const sc = {};
  done.forEach(a => (a.services || []).forEach(x => { const o = sc[x.name] || (sc[x.name] = { n: 0, t: 0 }); o.n++; o.t += +x.price || 0; }));
  const top = Object.keys(sc).map(k => ({ name: k, n: sc[k].n, t: sc[k].t })).sort((a, b) => b.n - a.n).slice(0, 5);
  const topMax = top.length ? top[0].n : 1;
  // mejores clientes
  const cc = {};
  done.forEach(a => { const o = cc[a.clientName] || (cc[a.clientName] = { n: 0, t: 0 }); o.n++; o.t += +a.price || 0; });
  const best = Object.keys(cc).map(k => ({ name: k, n: cc[k].n, t: cc[k].t })).sort((a, b) => b.t - a.t).slice(0, 5);

  const unm = unmarkedPast().length;
  return '<div class="topbar"><div><h1>Resumen</h1><div class="sub">' + U.esc(rg.label) + '</div></div></div>' +
    '<div class="seg" style="margin-bottom:14px"><button class="' + (r === 'sem' ? 'on' : '') + '" data-act="setRange" data-r="sem">Semana</button><button class="' + (r === 'mes' ? 'on' : '') + '" data-act="setRange" data-r="mes">Mes</button><button class="' + (r === 'anio' ? 'on' : '') + '" data-act="setRange" data-r="anio">Año</button></div>' +
    '<div class="kpis"><div class="kpi big"><span>Ingresos (citas hechas)</span><b>' + U.money(income) + '</b></div>' +
    '<div class="kpi"><span>Citas hechas</span><b>' + done.length + '</b></div>' +
    '<div class="kpi"><span>Ticket medio</span><b>' + U.money(avg) + '</b></div>' +
    '<div class="kpi"><span>Pendiente</span><b>' + U.money(pending) + '</b></div>' +
    '<div class="kpi"><span>Canceladas / no vino</span><b>' + lost + '</b></div></div>' +
    (unm ? '<div class="banner info" style="margin-top:12px"><div>Hay <b>' + unm + '</b> citas pasadas sin marcar; no cuentan como ingresos hasta que las marques como «Hecha».</div><button class="btn sm soft" data-act="reviewUnmarked">Revisar</button></div>' : '') +
    '<div class="section-title">Ingresos</div><div class="card">' + bars + '</div>' +
    '<div class="section-title">Servicios más pedidos</div><div class="card">' + (top.length ? top.map(t =>
      '<div class="rank" style="display:block"><div class="row" style="justify-content:space-between"><b>' + U.esc(t.name) + '</b><span class="muted small">' + t.n + ' × · ' + U.money(t.t) + '</span></div><div class="meter"><i style="width:' + (t.n / topMax * 100) + '%"></i></div></div>').join('') : '<div class="muted small">Todavía no hay citas hechas en este periodo.</div>') + '</div>' +
    '<div class="section-title">Mejores clientes</div><div class="card">' + (best.length ? best.map(b =>
      '<div class="rank"><span>' + U.esc(b.name) + '</span><b>' + U.money(b.t) + ' <span class="muted small">(' + b.n + ')</span></b></div>').join('') : '<div class="muted small">Sin datos todavía.</div>') + '</div>';
}

/* ----- Ajustes ----- */
function viewSettings() {
  const s = S.settings, dsb = daysSinceBackup();
  const hours = U.ORDER.map(d => {
    const h = s.hours[d];
    return '<div class="hourrow"><div class="row"><b class="grow">' + U.DAYS[d] + '</b><span class="muted small">' + (h.open ? 'Abierto' : 'Cerrado') + '</span>' +
      '<label class="switch"><input type="checkbox" data-hour="' + d + ':open" ' + (h.open ? 'checked' : '') + ' aria-label="Abierto el ' + U.DAYS[d] + '"><span></span></label></div>' +
      (h.open ? '<div class="times"><div><label>Abre</label><input type="time" data-hour="' + d + ':from" value="' + h.from + '"></div><div><label>Cierra</label><input type="time" data-hour="' + d + ':to" value="' + h.to + '"></div>' +
        '<div><label>Pausa desde</label><input type="time" data-hour="' + d + ':bFrom" value="' + h.bFrom + '"></div><div><label>Pausa hasta</label><input type="time" data-hour="' + d + ':bTo" value="' + h.bTo + '"></div></div>' : '') + '</div>';
  }).join('');
  const closed = s.closedDates.slice().sort((a, b) => a.date.localeCompare(b.date)).map(c =>
    '<div class="kv"><span>' + U.esc(U.cap(U.dayMed(c.date))) + ' ' + U.parse(c.date).getFullYear() + (c.label ? ' · <span class="muted">' + U.esc(c.label) + '</span>' : '') + '</span>' +
    '<button class="btn sm danger" data-act="delClosed" data-date="' + c.date + '">Quitar</button></div>').join('');
  const swatches = Object.keys(ACC).map(k => '<button class="sw' + (s.accent === k ? ' on' : '') + '" data-act="setAccent" data-k="' + k + '" style="background:' + ACC[k].c + '" aria-label="' + ACC[k].n + '"></button>').join('');
  const th = t => '<button class="' + (s.theme === t[0] ? 'on' : '') + '" data-act="setTheme" data-k="' + t[0] + '">' + t[1] + '</button>';
  const persisted = S.persisted === true ? 'Activado' : (S.persisted === false ? 'No garantizado' : 'Desconocido');

  return '<div class="topbar"><div><h1>Ajustes</h1><div class="sub">Versión ' + APP_VERSION + '</div></div></div>' +
    '<div class="section-title">Tu peluquería</div><div class="card">' +
    '<label class="f" style="margin-top:0" for="s-name">Nombre</label><input type="text" id="s-name" data-set="salonName" value="' + U.esc(s.salonName) + '">' +
    '<label class="f" for="s-phone">WhatsApp de la peluquería</label><input type="tel" id="s-phone" data-set="phone" inputmode="tel" placeholder="Ej. 600 123 456" value="' + U.esc(s.phone) + '">' +
    '<p class="help">Aquí recibirás las solicitudes de reserva. Si son 9 cifras se añade el prefijo de España (+34) automáticamente.</p></div>' +

    '<div class="section-title">Reservas de clientes</div><div class="card">' +
    '<p style="margin-top:0">Genera un enlace para que tus clientes elijan servicio, día y hora, y te envíen la solicitud por WhatsApp. <b>Tú confirmas cada cita</b> (no es automático).</p>' +
    '<div class="stack"><button class="btn primary block" data-act="makeLink">' + I.link + ' Crear enlace de reservas</button>' +
    '<button class="btn block" data-act="pasteReq">' + I.inbox + ' Pegar solicitud recibida</button></div></div>' +

    '<div class="section-title">Horario</div><div class="card" style="padding-top:6px;padding-bottom:6px">' + hours + '</div>' +
    '<div class="card"><div class="two"><div><label class="f" style="margin-top:0" for="s-step">Intervalo de huecos</label><select id="s-step" data-set="step" data-num="1">' +
    [15, 20, 30, 45, 60].map(v => '<option value="' + v + '"' + (+s.step === v ? ' selected' : '') + '>' + v + ' min</option>').join('') + '</select></div>' +
    '<div><label class="f" style="margin-top:0" for="s-mn">Aviso mínimo (reservas)</label><select id="s-mn" data-set="minNotice" data-num="1">' +
    [[0, 'Sin mínimo'], [60, '1 hora'], [120, '2 horas'], [240, '4 horas'], [720, '12 horas'], [1440, '1 día']].map(o => '<option value="' + o[0] + '"' + (+s.minNotice === o[0] ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select></div></div>' +
    '<label class="f" for="s-md">Días hacia delante en el enlace de reservas</label><select id="s-md" data-set="maxDays" data-num="1">' +
    [7, 14, 21, 30].map(v => '<option value="' + v + '"' + (+s.maxDays === v ? ' selected' : '') + '>' + v + ' días</option>').join('') + '</select></div>' +

    '<div class="section-title">Días cerrados y vacaciones</div><div class="card">' + (closed || '<div class="muted small">Ningún día cerrado añadido.</div>') +
    '<div class="two" style="margin-top:10px"><div><label class="f" style="margin-top:0" for="cd-from">Desde</label><input type="date" id="cd-from"></div><div><label class="f" style="margin-top:0" for="cd-to">Hasta (opcional)</label><input type="date" id="cd-to"></div></div>' +
    '<label class="f" for="cd-label">Motivo (opcional)</label><input type="text" id="cd-label" placeholder="Vacaciones, festivo…">' +
    '<button class="btn soft block" style="margin-top:12px" data-act="addClosed">' + I.plus + ' Añadir días cerrados</button></div>' +

    '<div class="section-title">Apariencia</div><div class="card"><div class="swatches">' + swatches + '</div>' +
    '<label class="f">Modo</label><div class="seg">' + [['auto', 'Automático'], ['light', 'Claro'], ['dark', 'Oscuro']].map(th).join('') + '</div></div>' +

    '<div class="section-title">Mensajes de WhatsApp</div><div class="card">' +
    '<label class="f" style="margin-top:0" for="s-rem">Recordatorio</label><textarea id="s-rem" data-set="reminderTpl">' + U.esc(s.reminderTpl) + '</textarea>' +
    '<label class="f" for="s-conf">Confirmación de cita</label><textarea id="s-conf" data-set="confirmTpl">' + U.esc(s.confirmTpl) + '</textarea>' +
    '<p class="help">Puedes usar: {nombre} {salon} {dia} {hora} {servicio}</p></div>' +

    '<div class="section-title">Tus datos y copias de seguridad</div><div class="card">' +
    '<div class="banner' + (dsb === null || dsb >= 7 ? '' : ' info') + '" style="margin-bottom:12px"><div>' +
    (dsb === null ? '<b>Aún no has hecho ninguna copia.</b>' : '<b>Última copia:</b> ' + (dsb === 0 ? 'hoy' : 'hace ' + dsb + (dsb === 1 ? ' día' : ' días')) + '.') +
    '<br>Los datos están <b>solo en este dispositivo</b>. No se sincronizan con otros móviles.</div></div>' +
    '<div class="stack"><button class="btn primary block" data-act="exportBackup">' + I.download + ' Guardar copia de seguridad</button>' +
    '<button class="btn block" data-act="importBackup">' + I.upload + ' Restaurar desde una copia</button>' +
    (S.hasUndo ? '<button class="btn block danger" data-act="undoImport">Deshacer última restauración</button>' : '') + '</div>' +
    '<input type="file" id="importfile" accept=".json,application/json" class="hide">' +
    '<div class="kv" style="margin-top:8px"><span class="muted">Almacenamiento protegido</span><b>' + persisted + '</b></div>' +
    '<p class="help">Recomendado: guarda una copia cada semana y envíatela por WhatsApp o correo, o guárdala en Archivos / iCloud.</p></div>';
}

/* =======================================================
   HOJAS (formularios en ventana)
   ======================================================= */
function firstFreeStart(date, dur) {
  const hf = hoursFor(date), segs = U.segments(hf.h);
  const busy = apptsOn(date).filter(a => a.status !== 'cancelled').map(a => [a.start, a.start + a.duration]);
  const min = date === U.today() ? U.nowMin() : 0;
  const sl = U.slots(segs, busy, dur, S.settings.step, min);
  if (sl.length) return sl[0];
  return segs.length ? segs[0][0] : 10 * 60;
}

function apptSheet(id, preset) {
  const ex = id ? S.appts.find(a => a.id === id) : null;
  const d = ex ? JSON.parse(JSON.stringify(ex)) : Object.assign({ date: S.date, start: null, duration: 30, services: [], price: 0, status: 'pending', notes: '', clientName: '', clientId: null }, preset || {});
  if (d.start == null) d.start = firstFreeStart(d.date, d.duration);
  const c = d.clientId != null ? clientById(d.clientId) : null;
  const formState = { id: ex ? ex.id : null, services: d.services.slice(), status: d.status, createdAt: ex ? ex.createdAt : null, source: ex ? ex.source : null };

  const el = openSheet(ex ? 'Editar cita' : 'Nueva cita',
    '<datalist id="clist">' + S.clients.map(x => '<option value="' + U.esc(x.name) + '">').join('') + '</datalist>' +
    '<label class="f" style="margin-top:4px" for="f-name">Cliente</label><input type="text" id="f-name" list="clist" placeholder="Nombre y apellidos" value="' + U.esc(d.clientName) + '" autocomplete="off">' +
    '<label class="f" for="f-phone">Teléfono</label><input type="tel" id="f-phone" inputmode="tel" placeholder="Para WhatsApp (opcional)" value="' + U.esc(c ? c.phone : '') + '">' +
    '<label class="f">Servicios</label><div class="chips" id="f-svcs"></div>' +
    '<div class="two"><div><label class="f" for="f-date">Día</label><input type="date" id="f-date" value="' + d.date + '"></div>' +
    '<div><label class="f" for="f-time">Hora</label><input type="time" id="f-time" value="' + U.mm(d.start) + '"></div></div>' +
    '<div class="chips" id="f-slots" style="margin-top:10px"></div>' +
    '<div class="two"><div><label class="f" for="f-dur">Duración (min)</label><input type="number" id="f-dur" inputmode="numeric" min="5" step="5" value="' + d.duration + '"></div>' +
    '<div><label class="f" for="f-price">Precio (€)</label><input type="number" id="f-price" inputmode="decimal" min="0" step="0.5" value="' + (d.price || '') + '"></div></div>' +
    '<label class="f" for="f-notes">Notas</label><textarea id="f-notes" placeholder="Ej. tinte 6.3, alergia al amoniaco…">' + U.esc(d.notes) + '</textarea>' +
    (ex ? '<label class="f">Estado</label><div class="seg" id="f-status">' + Object.keys(STATUS).map(k => '<button class="' + (d.status === k ? 'on' : '') + '" data-act="setStatus" data-k="' + k + '">' + STATUS[k] + '</button>').join('') + '</div>' : '') +
    '<div class="stack" style="margin-top:18px"><button class="btn primary block" data-act="saveAppt">Guardar cita</button>' +
    (ex ? '<div class="two"><button class="btn block" data-act="waConfirm">' + I.chat + ' Confirmar</button><button class="btn block" data-act="waRemindForm">' + I.bell + ' Recordar</button></div>' +
      '<button class="btn block danger" data-act="delAppt">' + I.trash + ' Eliminar cita</button>' : '') + '</div>');
  FORM = formState; // (openSheet reinicia FORM, por eso se asigna después)
  renderSvcChips();
  updateSlotChips();
  return el;
}

function renderSvcChips() {
  const list = S.services.filter(s => s.active !== false);
  FORM.services.forEach(x => { if (!list.some(s => s.name === x.name)) list.push(x); }); // servicios borrados/ocultos ya elegidos
  $('f-svcs').innerHTML = list.length ? list.map(s => {
    const on = FORM.services.some(x => x.name === s.name);
    return '<button type="button" class="chip' + (on ? ' on' : '') + '" data-act="toggleSvc" data-name="' + U.esc(s.name) + '">' + U.esc(s.name) + ' <small>' + U.dur(s.duration) + ' · ' + U.money(s.price) + '</small></button>';
  }).join('') : '<span class="muted small">Primero crea servicios en la pestaña «Servicios».</span>';
}
function updateSlotChips() {
  const box = $('f-slots'); if (!box) return;
  const date = val('f-date'), dur = Math.max(5, parseInt(val('f-dur')) || 30);
  if (!date) { box.innerHTML = ''; return; }
  const hf = hoursFor(date), segs = U.segments(hf.h);
  if (!segs.length) { box.innerHTML = '<span class="muted small">Ese día la peluquería está cerrada.</span>'; return; }
  const busy = apptsOn(date).filter(a => a.status !== 'cancelled' && a.id !== (FORM && FORM.id)).map(a => [a.start, a.start + a.duration]);
  const min = date === U.today() ? U.nowMin() : 0;
  const sl = U.slots(segs, busy, dur, S.settings.step, min);
  const cur = U.toMin(val('f-time'));
  box.innerHTML = sl.length ? '<span class="muted small" style="width:100%">Huecos libres:</span>' + sl.slice(0, 16).map(t => '<button type="button" class="chip' + (t === cur ? ' on' : '') + '" data-act="pickSlot" data-t="' + U.mm(t) + '">' + U.mm(t) + '</button>').join('') : '<span class="muted small">No hay huecos de ' + U.dur(dur) + ' ese día.</span>';
}
function recalcFromServices() {
  const dur = FORM.services.reduce((t, x) => t + (+x.duration || 0), 0);
  const price = FORM.services.reduce((t, x) => t + (+x.price || 0), 0);
  if (FORM.services.length) { $('f-dur').value = dur || 30; $('f-price').value = price || ''; }
  updateSlotChips();
}

function apptFromForm() {
  return {
    date: val('f-date'), start: U.toMin(val('f-time')), duration: Math.max(5, parseInt(val('f-dur')) || 30),
    clientName: val('f-name').trim(), services: FORM.services,
    clientId: (S.clients.find(c => c.name.toLowerCase() === val('f-name').trim().toLowerCase()) || {}).id
  };
}

async function saveAppt() {
  const name = val('f-name').trim();
  if (!name) return toast('Escribe el nombre del cliente');
  const date = val('f-date'), time = val('f-time');
  if (!date || !time) return toast('Elige día y hora');
  const start = U.toMin(time), dur = Math.max(5, parseInt(val('f-dur')) || 30);
  if (!FORM.services.length && !confirm('No has elegido ningún servicio. ¿Guardar igualmente?')) return;
  if (FORM.status !== 'cancelled') {
    const clash = S.appts.filter(x => x.id !== FORM.id && x.date === date && x.status !== 'cancelled' && x.start < start + dur && start < x.start + x.duration);
    if (clash.length) {
      const c = clash[0];
      if (!confirm('Se solapa con la cita de ' + c.clientName + ' (' + U.mm(c.start) + '–' + U.mm(c.start + c.duration) + '). ¿Guardar igualmente?')) return;
    }
    const hf = hoursFor(date), segs = U.segments(hf.h);
    const inside = segs.some(sg => start >= sg[0] && start + dur <= sg[1]);
    if (!inside && !confirm(hf.h.open ? 'La cita queda fuera del horario de apertura. ¿Guardar igualmente?' : 'Ese día la peluquería está cerrada. ¿Guardar igualmente?')) return;
  }
  const phone = val('f-phone').trim();
  let client = S.clients.find(c => c.name.toLowerCase() === name.toLowerCase());
  if (!client) {
    const id = await DB.put('clients', { name, phone, notes: '', createdAt: Date.now() });
    client = { id, name, phone };
  } else if (phone && phone !== client.phone) {
    client.phone = phone; await DB.put('clients', client);
  }
  const rec = {
    date, start, duration: dur, clientId: client.id, clientName: client.name, services: FORM.services,
    price: parseFloat(String(val('f-price')).replace(',', '.')) || 0, status: FORM.status,
    notes: val('f-notes').trim(), updatedAt: Date.now(), createdAt: FORM.createdAt || Date.now()
  };
  if (FORM.source) rec.source = FORM.source;
  if (FORM.id) rec.id = FORM.id;
  await DB.put('appointments', rec);
  await loadAll();
  S.date = date; S.tab = 'agenda';
  closeSheet(); render(); toast('Cita guardada');
}

function clientSheet(id) {
  const c = id ? clientById(id) : { name: '', phone: '', notes: '' };
  const hist = id ? S.appts.filter(a => a.clientId === id).sort((a, b) => (b.date + U.mm(b.start)).localeCompare(a.date + U.mm(a.start))) : [];
  const st = id ? clientStats()[id] : null;
  openSheet(id ? 'Ficha de cliente' : 'Nuevo cliente',
    '<input type="hidden" id="c-id" value="' + (id || '') + '">' +
    '<label class="f" style="margin-top:4px" for="c-name">Nombre</label><input type="text" id="c-name" value="' + U.esc(c.name) + '" autocomplete="off">' +
    '<label class="f" for="c-phone">Teléfono</label><input type="tel" id="c-phone" inputmode="tel" value="' + U.esc(c.phone) + '">' +
    '<label class="f" for="c-notes">Notas (tintes, alergias, preferencias)</label><textarea id="c-notes">' + U.esc(c.notes) + '</textarea>' +
    (id ? '<div class="kpis" style="margin-top:14px"><div class="kpi"><span>Visitas</span><b>' + (st ? st.n : 0) + '</b></div><div class="kpi"><span>Gastado</span><b>' + U.money(st ? st.spent : 0) + '</b></div></div>' : '') +
    '<div class="stack" style="margin-top:16px"><button class="btn primary block" data-act="saveClient">Guardar</button>' +
    (id ? '<button class="btn block" data-act="newForClient" data-id="' + id + '">' + I.plus + ' Nueva cita para este cliente</button>' +
      '<div class="two">' + (c.phone ? '<a class="btn" href="tel:' + U.esc(c.phone.replace(/[^\d+]/g, '')) + '">' + I.phone + ' Llamar</a><a class="btn" target="_blank" rel="noopener" href="' + U.esc(U.waLink(c.phone, '')) + '">' + I.chat + ' WhatsApp</a>' : '') + '</div>' : '') + '</div>' +
    (id && hist.length ? '<div class="section-title">Historial</div><div class="list">' + hist.slice(0, 12).map(a =>
      '<button class="item" data-act="editAppt" data-id="' + a.id + '"><div><div class="t">' + U.esc(U.cap(U.dayMed(a.date))) + ' · ' + U.mm(a.start) + '</div><div class="s">' + (U.esc(svcNames(a)) || 'Sin servicio') + ' · ' + STATUS[a.status] + '</div></div><div class="end">' + (a.price ? U.money(a.price) : '') + '</div></button>').join('') + '</div>' : '') +
    (id ? '<button class="btn block danger" style="margin-top:18px" data-act="delClient" data-id="' + id + '">' + I.trash + ' Eliminar cliente</button>' : ''));
}
async function saveClient() {
  const name = val('c-name').trim(); if (!name) return toast('Escribe el nombre');
  const id = val('c-id') ? +val('c-id') : null;
  const dup = S.clients.find(c => c.name.toLowerCase() === name.toLowerCase() && c.id !== id);
  if (dup) return toast('Ya existe un cliente con ese nombre');
  const rec = { name, phone: val('c-phone').trim(), notes: val('c-notes').trim() };
  if (id) {
    const old = clientById(id); Object.assign(old, rec); await DB.put('clients', old);
    // mantener el nombre en las citas de este cliente
    for (const a of S.appts.filter(x => x.clientId === id && x.clientName !== name)) { a.clientName = name; await DB.put('appointments', a); }
  } else { rec.createdAt = Date.now(); await DB.put('clients', rec); }
  await loadAll(); closeSheet(); render(); toast('Cliente guardado');
}

function serviceSheet(id) {
  const s = id ? S.services.find(x => x.id === id) : { name: '', duration: 30, price: 0, active: true };
  openSheet(id ? 'Editar servicio' : 'Nuevo servicio',
    '<input type="hidden" id="sv-id" value="' + (id || '') + '">' +
    '<label class="f" style="margin-top:4px" for="sv-name">Nombre</label><input type="text" id="sv-name" value="' + U.esc(s.name) + '" placeholder="Ej. Corte y peinado">' +
    '<div class="two"><div><label class="f" for="sv-dur">Duración (min)</label><input type="number" id="sv-dur" inputmode="numeric" min="5" step="5" value="' + s.duration + '"></div>' +
    '<div><label class="f" for="sv-price">Precio (€)</label><input type="number" id="sv-price" inputmode="decimal" min="0" step="0.5" value="' + s.price + '"></div></div>' +
    '<div class="row" style="margin-top:16px"><div class="grow"><b>Visible</b><div class="help" style="margin:0">Si lo ocultas, no aparece en citas nuevas ni en el enlace de reservas.</div></div><label class="switch"><input type="checkbox" id="sv-active" ' + (s.active !== false ? 'checked' : '') + '><span></span></label></div>' +
    '<div class="stack" style="margin-top:18px"><button class="btn primary block" data-act="saveService">Guardar</button>' +
    (id ? '<button class="btn block danger" data-act="delService" data-id="' + id + '">' + I.trash + ' Eliminar servicio</button><p class="help">Las citas ya hechas conservan su servicio y precio.</p>' : '') + '</div>');
}
async function saveService() {
  const name = val('sv-name').trim(); if (!name) return toast('Escribe el nombre');
  const dur = parseInt(val('sv-dur')); if (!(dur >= 5)) return toast('La duración debe ser de 5 min o más');
  const id = val('sv-id') ? +val('sv-id') : null;
  const rec = { name, duration: dur, price: parseFloat(String(val('sv-price')).replace(',', '.')) || 0, active: $('sv-active').checked };
  if (id) rec.id = id;
  await DB.put('services', rec); await loadAll(); closeSheet(); render(); toast('Servicio guardado');
}

/* ----- Recordatorios de mañana ----- */
function remindSheet() {
  const tmr = U.addDays(U.today(), 1);
  const list = apptsOn(tmr).filter(a => a.status !== 'cancelled');
  openSheet('Recordatorios de mañana',
    '<p class="help" style="margin-top:0">' + U.esc(U.cap(U.dayLong(tmr))) + '. Se abre WhatsApp con el mensaje ya escrito; solo tienes que pulsar enviar.</p>' +
    (list.length ? '<div class="list" style="margin-top:12px">' + list.map(a => {
      const ph = phoneOf(a), ok = U.phoneWA(ph);
      return '<div class="item"><div class="avatar">' + U.mm(a.start).slice(0, 5) + '</div><div><div class="t">' + U.esc(a.clientName) + '</div><div class="s">' + (U.esc(svcNames(a)) || 'Sin servicio') + '</div></div>' +
        '<div class="end">' + (ok ? '<button class="btn sm primary" data-act="waRemind" data-id="' + a.id + '">' + I.chat + '</button>' : '<span class="muted small">Sin tel.</span>') + '</div></div>';
    }).join('') + '</div>' : '<div class="empty"><b>Nada para mañana</b>No hay citas apuntadas.</div>'));
}
function waRemind(id) {
  const a = S.appts.find(x => x.id === id); if (!a) return;
  const ph = phoneOf(a); if (!U.phoneWA(ph)) return toast('Este cliente no tiene teléfono');
  window.open(U.waLink(ph, U.fill(S.settings.reminderTpl, waVars(a))), '_blank');
}
function waFromForm(kind) {
  const phone = val('f-phone'); if (!U.phoneWA(phone)) return toast('Añade el teléfono del cliente');
  const base = apptFromForm();
  const vars = waVars(Object.assign({}, base, { clientId: base.clientId }));
  vars.nombre = (val('f-name').trim().split(/\s+/)[0]) || '';
  window.open(U.waLink(phone, U.fill(kind === 'confirm' ? S.settings.confirmTpl : S.settings.reminderTpl, vars)), '_blank');
}

/* ----- Solicitudes de reserva (mensaje de WhatsApp del cliente) ----- */
function parseRequest(text) {
  const ref = String(text).match(/Ref:\s*(\d+)\.(\d{8})\.(\d{4})\.(\d+)/);
  if (!ref) return null;
  const grab = re => { const m = String(text).match(re); return m ? m[1].trim() : ''; };
  const d = ref[2], t = ref[3];
  return {
    sid: +ref[1], date: d.slice(0, 4) + '-' + d.slice(4, 6) + '-' + d.slice(6, 8),
    start: (+t.slice(0, 2)) * 60 + (+t.slice(2)), duration: +ref[4],
    name: grab(/Nombre:\s*(.+)/), phone: grab(/Tel[eé]fono:\s*([+\d][\d ]*)/), svcName: grab(/Servicio:\s*(.+)/)
  };
}
function pasteSheet() {
  openSheet('Solicitud de reserva',
    '<p class="help" style="margin-top:0">Copia el mensaje de WhatsApp que te ha enviado el cliente, pégalo aquí y la cita se prepara sola.</p>' +
    '<label class="f" for="p-text">Mensaje del cliente</label><textarea id="p-text" style="min-height:150px" placeholder="Pega aquí el mensaje completo…"></textarea>' +
    '<button class="btn primary block" style="margin-top:14px" data-act="readReq">Leer solicitud</button><div id="p-out"></div>');
}
function readReq() {
  const r = parseRequest(val('p-text'));
  const out = $('p-out');
  if (!r || !r.name || r.start < 0 || r.start >= 1440 || isNaN(Date.parse(r.date))) {
    out.innerHTML = '<div class="banner" style="margin-top:14px">No he podido leer el mensaje. Comprueba que está copiado completo (incluida la línea «Ref:»). Si no, crea la cita a mano con el botón +.</div>';
    return;
  }
  const svc = S.services.find(s => s.id === r.sid) || S.services.find(s => s.name.toLowerCase() === (r.svcName || '').toLowerCase());
  window._REQ = { r, svc };
  const clash = S.appts.find(x => x.date === r.date && x.status !== 'cancelled' && x.start < r.start + r.duration && r.start < x.start + x.duration);
  out.innerHTML = '<div class="card" style="margin-top:14px"><b>' + U.esc(r.name) + '</b><div class="muted small">' + U.esc(r.phone) + '</div>' +
    '<div style="margin-top:8px">' + U.esc(U.cap(U.dayLong(r.date))) + ' · <b>' + U.mm(r.start) + '–' + U.mm(r.start + r.duration) + '</b></div>' +
    '<div class="muted small">' + U.esc(svc ? svc.name : (r.svcName || 'Servicio')) + (svc ? ' · ' + U.money(svc.price) : '') + '</div></div>' +
    (clash ? '<div class="banner" style="margin-top:12px"><b>Ojo:</b> se solapa con la cita de ' + U.esc(clash.clientName) + ' (' + U.mm(clash.start) + '). Ese hueco ya está ocupado.</div>' : '') +
    '<button class="btn primary block" style="margin-top:12px" data-act="createFromReq">Crear cita' + (clash ? ' igualmente' : '') + '</button>';
}
async function createFromReq() {
  const q = window._REQ; if (!q) return;
  const r = q.r, svc = q.svc;
  let client = S.clients.find(c => c.name.toLowerCase() === r.name.toLowerCase());
  if (!client) { const id = await DB.put('clients', { name: r.name, phone: r.phone, notes: '', createdAt: Date.now() }); client = { id }; }
  else if (r.phone && !client.phone) { client.phone = r.phone; await DB.put('clients', client); }
  const id = await DB.put('appointments', {
    date: r.date, start: r.start, duration: r.duration, clientId: client.id, clientName: r.name,
    services: svc ? [{ id: svc.id, name: svc.name, duration: svc.duration, price: svc.price }] : (r.svcName ? [{ name: r.svcName, duration: r.duration, price: 0 }] : []),
    price: svc ? svc.price : 0, status: 'pending', notes: 'Reserva online', source: 'online', createdAt: Date.now(), updatedAt: Date.now()
  });
  window._REQ = null;
  await loadAll(); S.date = r.date; S.tab = 'agenda'; render();
  toast('Cita creada. Confírmasela al cliente.');
  apptSheet(id);
}

/* ----- Enlace de reservas ----- */
function buildLink() {
  const s = S.settings, today = U.today(), busy = {};
  for (let i = 0; i < +s.maxDays; i++) {
    const d = U.addDays(today, i);
    const arr = apptsOn(d).filter(a => a.status !== 'cancelled').map(a => [a.start, a.start + a.duration]);
    if (arr.length) busy[d] = arr;
  }
  const payload = {
    v: 1, n: s.salonName, p: U.phoneWA(s.phone), a: (ACC[s.accent] || ACC.rose).c, g: today,
    s: S.services.filter(x => x.active !== false).map(x => [x.id, x.name, x.duration, x.price]),
    h: [0, 1, 2, 3, 4, 5, 6].map(i => { const h = s.hours[i]; return [h.open ? 1 : 0, U.toMin(h.from), U.toMin(h.to), h.bFrom ? U.toMin(h.bFrom) : -1, h.bTo ? U.toMin(h.bTo) : -1]; }),
    c: s.closedDates.map(x => x.date), st: +s.step, mn: +s.minNotice, md: +s.maxDays, b: busy
  };
  const base = new URL('reservar.html', location.href); base.hash = ''; base.search = '';
  return base.href + '#' + U.enc(payload);
}
function linkSheet() {
  const s = S.settings;
  if (!U.phoneWA(s.phone)) { toast('Primero escribe el WhatsApp de la peluquería'); return; }
  if (!S.services.some(x => x.active !== false)) { toast('Crea al menos un servicio visible'); return; }
  if (!/^https?:$/.test(location.protocol)) {
    openSheet('Enlace de reservas', '<div class="banner">Esta función solo funciona cuando la app está publicada en internet (GitHub Pages). Ahora mismo la estás abriendo desde un archivo local.</div>');
    return;
  }
  const link = buildLink();
  window._LINK = link;
  openSheet('Enlace de reservas',
    '<p style="margin-top:0">Envía este enlace a tus clientes (por WhatsApp, Instagram, en tu bio…).</p>' +
    '<div class="linkbox" id="linktxt">' + U.esc(link) + '</div>' +
    '<div class="stack" style="margin-top:12px"><button class="btn primary block" data-act="copyLink">' + I.link + ' Copiar enlace</button>' +
    (navigator.share ? '<button class="btn block" data-act="shareLink">' + I.share + ' Compartir…</button>' : '') +
    '<a class="btn block" href="' + U.esc(link) + '" target="_blank" rel="noopener">Ver cómo lo verán los clientes</a></div>' +
    '<div class="banner info" style="margin-top:16px"><div><b>Importante:</b> el enlace muestra los huecos libres <b>del momento en que lo creas</b>. Si después apuntas citas, vuelve a crear y compartir el enlace para que esté al día. En cualquier caso, la cita solo es definitiva cuando tú la confirmas.</div></div>');
}

/* =======================================================
   COPIAS DE SEGURIDAD
   ======================================================= */
async function exportBackup() {
  const data = await DB.exportAll();
  const json = JSON.stringify(data, null, 1);
  const name = 'copia-peluqueria-' + U.today() + '.json';
  const file = new File([json], name, { type: 'application/json' });
  let done = false;
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); done = true; }
    catch (e) { if (e && e.name === 'AbortError') return; }
  }
  if (!done) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }
  S.settings.lastBackup = new Date().toISOString();
  await saveSettings(); render();
  toast('Copia guardada: ' + name);
}
async function importBackupFile(file) {
  let data;
  try { data = JSON.parse(await file.text()); } catch (e) { return alert('El archivo no es una copia válida.'); }
  if (!data || data.app !== BACKUP_APP_ID || !Array.isArray(data.appointments) || !Array.isArray(data.clients) || !Array.isArray(data.services)) {
    return alert('Este archivo no parece una copia de esta aplicación.');
  }
  if ((data.dataVersion || 1) > DATA_VERSION) return alert('Esta copia es de una versión más nueva de la app. Actualiza la app antes de restaurarla.');
  const when = data.exportedAt ? new Date(data.exportedAt).toLocaleString('es-ES') : 'fecha desconocida';
  if (!confirm('Vas a REEMPLAZAR los datos actuales por esta copia:\n\n• ' + data.appointments.length + ' citas\n• ' + data.clients.length + ' clientes\n• ' + data.services.length + ' servicios\n\nCopia del: ' + when + '\n\nSe guardará una copia interna de lo actual por si quieres deshacerlo. ¿Continuar?')) return;
  const before = await DB.exportAll();
  try {
    await DB.put('settings', { key: 'undo', value: before });
    await DB.replaceAll(data);
  } catch (e) { return alert('No se pudo restaurar: ' + (e && e.message)); }
  await loadAll(); await refreshUndo(); applyTheme(); render(true);
  toast('Copia restaurada');
}
async function undoImport() {
  const rec = await DB.get('settings', 'undo');
  if (!rec) return;
  if (!confirm('¿Volver a los datos que tenías antes de la última restauración?')) return;
  await DB.replaceAll(rec.value);
  await DB.del('settings', 'undo');
  await loadAll(); await refreshUndo(); applyTheme(); render(true); toast('Restauración deshecha');
}
async function refreshUndo() { S.hasUndo = !!(await DB.get('settings', 'undo')); }

/* =======================================================
   EVENTOS
   ======================================================= */
const A = {
  closeSheet,
  goDate: e => { S.date = e.date; render(); },
  prevDay: () => { S.date = U.addDays(S.date, -1); render(); },
  nextDay: () => { S.date = U.addDays(S.date, 1); render(); },
  goToday: () => { S.date = U.today(); render(); },
  newAt: e => apptSheet(null, { start: +e.start }),
  editAppt: e => apptSheet(+e.id),
  quickDone: async e => {
    const a = S.appts.find(x => x.id === +e.id); if (!a) return;
    a.status = 'done'; a.updatedAt = Date.now(); await DB.put('appointments', a); render(); toast('Marcada como hecha');
  },
  waRemind: e => waRemind(+e.id),
  waConfirm: () => waFromForm('confirm'),
  waRemindForm: () => waFromForm('remind'),
  remindTomorrow: remindSheet,
  pasteReq: pasteSheet,
  readReq, createFromReq,
  reviewUnmarked: () => {
    const u = unmarkedPast().sort((a, b) => a.date.localeCompare(b.date))[0];
    if (u) { S.date = u.date; S.tab = 'agenda'; closeSheet(); render(true); }
  },
  toggleSvc: e => {
    const name = e.name, i = FORM.services.findIndex(x => x.name === name);
    if (i >= 0) FORM.services.splice(i, 1);
    else {
      const s = S.services.find(x => x.name === name);
      if (s) FORM.services.push({ id: s.id, name: s.name, duration: s.duration, price: s.price });
    }
    renderSvcChips(); recalcFromServices();
  },
  pickSlot: e => { $('f-time').value = e.t; updateSlotChips(); },
  setStatus: e => {
    FORM.status = e.k;
    document.querySelectorAll('#f-status button').forEach(b => b.classList.toggle('on', b.dataset.k === e.k));
  },
  saveAppt,
  delAppt: async () => {
    if (!FORM || !FORM.id) return;
    if (!confirm('¿Eliminar esta cita? Si solo ha sido cancelada, mejor márcala como «Cancelada».')) return;
    await DB.del('appointments', FORM.id); await loadAll(); closeSheet(); render(); toast('Cita eliminada');
  },
  editClient: e => clientSheet(+e.id),
  saveClient,
  newForClient: e => { const c = clientById(+e.id); closeSheet(); apptSheet(null, { clientId: c.id, clientName: c.name }); },
  delClient: async e => {
    const id = +e.id, n = S.appts.filter(a => a.clientId === id).length;
    if (!confirm('¿Eliminar este cliente?' + (n ? '\n\nSus ' + n + ' citas se conservan con su nombre.' : ''))) return;
    await DB.del('clients', id);
    for (const a of S.appts.filter(x => x.clientId === id)) { a.clientId = null; await DB.put('appointments', a); }
    await loadAll(); closeSheet(); render(); toast('Cliente eliminado');
  },
  editService: e => serviceSheet(+e.id),
  saveService,
  delService: async e => {
    if (!confirm('¿Eliminar este servicio? Las citas existentes lo conservan.')) return;
    await DB.del('services', +e.id); await loadAll(); closeSheet(); render(); toast('Servicio eliminado');
  },
  setRange: e => { S.range = e.r; render(); },
  setAccent: async e => { S.settings.accent = e.k; await saveSettings(); applyTheme(); render(); },
  setTheme: async e => { S.settings.theme = e.k; await saveSettings(); applyTheme(); render(); },
  addClosed: async () => {
    const from = val('cd-from'); if (!from) return toast('Elige la fecha de inicio');
    const to = val('cd-to') || from; if (to < from) return toast('La fecha final es anterior a la inicial');
    const label = val('cd-label').trim();
    let n = 0;
    for (let d = from; d <= to && n < 400; d = U.addDays(d, 1), n++) {
      if (!S.settings.closedDates.some(c => c.date === d)) S.settings.closedDates.push({ date: d, label });
    }
    await saveSettings(); render(); toast('Días cerrados añadidos');
  },
  delClosed: async e => { S.settings.closedDates = S.settings.closedDates.filter(c => c.date !== e.date); await saveSettings(); render(); },
  makeLink: linkSheet,
  copyLink: async () => {
    try { await navigator.clipboard.writeText(window._LINK); toast('Enlace copiado'); }
    catch (e) { const r = document.createRange(); r.selectNodeContents($('linktxt')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast('Mantén pulsado y copia el texto seleccionado'); }
  },
  shareLink: async () => { try { await navigator.share({ title: S.settings.salonName, text: 'Reserva tu cita en ' + S.settings.salonName, url: window._LINK }); } catch (e) { /* cancelado */ } },
  exportBackup,
  importBackup: () => $('importfile').click(),
  undoImport
};

document.addEventListener('click', ev => {
  const t = ev.target.closest('[data-act]');
  if (!t) return;
  const fn = A[t.dataset.act];
  if (fn) { ev.preventDefault(); Promise.resolve(fn(t.dataset)).catch(err => { console.error(err); toast('Algo ha fallado: ' + (err && err.message)); }); }
});
document.addEventListener('keydown', ev => {
  if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches && ev.target.matches('.card[data-act]')) { ev.preventDefault(); ev.target.click(); }
  if (ev.key === 'Escape') closeSheet();
});
document.addEventListener('input', ev => {
  const t = ev.target;
  if (t.id === 'clientq') { S.clientQ = t.value; $('clientlist').innerHTML = clientListHTML(); }
  if (t.id === 'f-name') {
    const c = S.clients.find(x => x.name.toLowerCase() === t.value.trim().toLowerCase());
    if (c && c.phone && !val('f-phone')) $('f-phone').value = c.phone;
  }
  if (t.id === 'f-date' || t.id === 'f-dur' || t.id === 'f-time') updateSlotChips();
});
document.addEventListener('change', async ev => {
  const t = ev.target;
  try {
    if (t.id === 'jumpdate' && t.value) { S.date = t.value; render(); }
    else if (t.id === 'importfile') { const f = t.files && t.files[0]; t.value = ''; if (f) await importBackupFile(f); }
    else if (t.dataset && t.dataset.set) {
      let v = t.type === 'checkbox' ? t.checked : t.value;
      if (t.dataset.num) v = +v;
      S.settings[t.dataset.set] = v; await saveSettings();
      if (t.dataset.set === 'salonName') applyTheme();
    } else if (t.dataset && t.dataset.hour) {
      const p = t.dataset.hour.split(':'), h = S.settings.hours[p[0]];
      h[p[1]] = t.type === 'checkbox' ? t.checked : t.value;
      await saveSettings();
      if (p[1] === 'open') render();
    }
  } catch (err) { console.error(err); toast('No se pudo guardar: ' + (err && err.message)); }
});

/* =======================================================
   ARRANQUE
   ======================================================= */
async function boot() {
  document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => { S.tab = t.dataset.tab; render(true); }));
  $('fab').addEventListener('click', () => {
    if (S.tab === 'clientes') clientSheet(null);
    else if (S.tab === 'servicios') serviceSheet(null);
    else apptSheet(null);
  });
  try {
    await DB.init();
    await loadAll();
    await refreshUndo();
  } catch (e) {
    $('view').innerHTML = '<div class="banner" style="margin-top:20px"><div><b>No se puede guardar información en este navegador.</b><br>' + U.esc(e && e.message) + '<br>Si estás en una ventana privada, ábrela en una normal. Sin almacenamiento la app no puede funcionar.</div></div>';
    return;
  }
  applyTheme();
  render(true);
  if (navigator.storage && navigator.storage.persist) {
    try { S.persisted = (await navigator.storage.persisted()) || (await navigator.storage.persist()); if (S.tab === 'ajustes') render(); } catch (e) { /* ignorar */ }
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && U.today() !== S.todayStamp) {
      if (S.date === S.todayStamp) S.date = U.today();
      S.todayStamp = U.today(); render();
    }
  });
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* sin modo sin conexión */ });
  }
}
boot();
