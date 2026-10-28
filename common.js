'use strict';
/* Utilidades compartidas (fechas, dinero, WhatsApp, huecos libres, enlaces) */
const U = {
  DAYS: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  DAYS_S: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
  ORDER: [1, 2, 3, 4, 5, 6, 0], // semana empieza en lunes

  pad: n => String(n).padStart(2, '0'),
  ymd(d) { return d.getFullYear() + '-' + U.pad(d.getMonth() + 1) + '-' + U.pad(d.getDate()); },
  parse(s) { const p = s.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); },
  today() { return U.ymd(new Date()); },
  addDays(s, n) { const d = U.parse(s); d.setDate(d.getDate() + n); return U.ymd(d); },
  dow(s) { return U.parse(s).getDay(); },
  mm(m) { return U.pad(Math.floor(m / 60)) + ':' + U.pad(m % 60); },
  toMin(t) { if (!t) return 0; const p = String(t).split(':'); return (+p[0]) * 60 + (+p[1] || 0); },
  nowMin() { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); },
  esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },
  money(n) {
    try { return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(+n || 0); }
    catch (e) { return (+n || 0).toFixed(2) + ' €'; }
  },
  dayLong(s) { return U.parse(s).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }); },
  dayMed(s) { return U.parse(s).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }); },
  monthName(y, m) { return new Date(y, m, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }); },
  dur(m) {
    m = Math.round(m);
    if (m < 60) return m + ' min';
    const h = Math.floor(m / 60), r = m % 60;
    return r ? h + ' h ' + r + ' min' : h + ' h';
  },
  cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; },

  /* Teléfono -> formato internacional para wa.me (si son 9 cifras españolas añade 34) */
  phoneWA(p) {
    let d = String(p || '').replace(/\D/g, '');
    if (d.startsWith('00')) d = d.slice(2);
    if (d.length === 9 && /^[6-9]/.test(d)) d = '34' + d;
    return d;
  },
  waLink(phone, text) {
    const d = U.phoneWA(phone);
    return 'https://wa.me/' + d + '?text=' + encodeURIComponent(text);
  },

  /* Codificar / decodificar objetos en base64 "seguro para URL" (con tildes incluidas) */
  enc(obj) {
    const bytes = new TextEncoder().encode(JSON.stringify(obj));
    let bin = '';
    bytes.forEach(b => { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  },
  dec(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    const bin = atob(str);
    const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  },

  /* Horario de un día (en minutos) -> tramos abiertos [[desde,hasta],...] */
  segments(h) {
    if (!h || !h.open) return [];
    const f = h.from, t = h.to;
    if (!(t > f)) return [];
    if (h.bFrom != null && h.bTo != null && h.bTo > h.bFrom && h.bFrom > f && h.bTo < t) return [[f, h.bFrom], [h.bTo, t]];
    return [[f, t]];
  },
  /* Tramos libres = tramos abiertos menos huecos ocupados */
  freeWindows(segs, busy) {
    const wins = [];
    const b = busy.slice().sort((x, y) => x[0] - y[0]);
    segs.forEach(seg => {
      let cur = seg[0];
      b.forEach(iv => {
        if (iv[1] <= cur || iv[0] >= seg[1]) return;
        if (iv[0] > cur) wins.push([cur, Math.min(iv[0], seg[1])]);
        cur = Math.max(cur, iv[1]);
      });
      if (cur < seg[1]) wins.push([cur, seg[1]]);
    });
    return wins;
  },
  /* Horas de inicio posibles para una cita de 'dur' minutos */
  slots(segs, busy, dur, step, minStart) {
    const out = [];
    step = step || 30;
    segs.forEach(seg => {
      for (let t = seg[0]; t + dur <= seg[1]; t += step) {
        if (t < (minStart || 0)) continue;
        if (busy.some(iv => t < iv[1] && iv[0] < t + dur)) continue;
        out.push(t);
      }
    });
    return out;
  },
  /* Sustituye {nombre}, {salon}, ... en plantillas de mensajes */
  fill(tpl, vars) {
    return String(tpl || '').replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
  }
};
