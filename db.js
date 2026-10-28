'use strict';
/* Almacenamiento persistente con IndexedDB + copias de seguridad + migraciones */
const DB_NAME = 'agenda-peluqueria';
const DB_VERSION = 1;          // versión de la base de datos del navegador
const DATA_VERSION = 1;        // versión del formato de datos (para migrar copias antiguas)
const BACKUP_APP_ID = 'agenda-peluqueria';

const DEFAULT_SETTINGS = () => ({
  salonName: 'Mi Peluquería',
  phone: '',
  accent: 'rose',
  theme: 'auto',
  step: 30,
  minNotice: 120,
  maxDays: 21,
  hours: {
    0: { open: false, from: '10:00', to: '14:00', bFrom: '', bTo: '' },
    1: { open: true, from: '09:30', to: '20:00', bFrom: '14:00', bTo: '16:00' },
    2: { open: true, from: '09:30', to: '20:00', bFrom: '14:00', bTo: '16:00' },
    3: { open: true, from: '09:30', to: '20:00', bFrom: '14:00', bTo: '16:00' },
    4: { open: true, from: '09:30', to: '20:00', bFrom: '14:00', bTo: '16:00' },
    5: { open: true, from: '09:30', to: '20:00', bFrom: '14:00', bTo: '16:00' },
    6: { open: true, from: '09:30', to: '14:00', bFrom: '', bTo: '' }
  },
  closedDates: [],   // [{date:'2026-12-25', label:'Navidad'}]
  reminderTpl: 'Hola {nombre}, te recordamos tu cita en {salon} el {dia} a las {hora} ({servicio}). Si no puedes venir, avísanos por favor. ¡Gracias!',
  confirmTpl: 'Hola {nombre}, tu cita en {salon} queda confirmada: {dia} a las {hora} ({servicio}). ¡Te esperamos!',
  lastBackup: null,
  seeded: false,
  dataVersion: DATA_VERSION
});

const SEED_SERVICES = [
  { name: 'Corte mujer', duration: 45, price: 25, active: true },
  { name: 'Corte hombre', duration: 30, price: 14, active: true },
  { name: 'Lavar y peinar', duration: 40, price: 18, active: true },
  { name: 'Tinte', duration: 90, price: 45, active: true },
  { name: 'Mechas', duration: 120, price: 70, active: true }
];

/* Mezcla ajustes guardados con los valores por defecto (así los ajustes nuevos de versiones futuras no rompen nada) */
function normalizeSettings(s) {
  const d = DEFAULT_SETTINGS();
  const out = Object.assign({}, d, s || {});
  out.hours = {};
  for (let i = 0; i < 7; i++) out.hours[i] = Object.assign({}, d.hours[i], (s && s.hours && s.hours[i]) || {});
  if (!Array.isArray(out.closedDates)) out.closedDates = [];
  return out;
}

/* Lleva datos de cualquier versión anterior al formato actual */
function migrateData(data) {
  const v = data.dataVersion || data.version || 1;
  const out = {
    settings: normalizeSettings(data.settings),
    services: Array.isArray(data.services) ? data.services : [],
    clients: Array.isArray(data.clients) ? data.clients : [],
    appointments: Array.isArray(data.appointments) ? data.appointments : []
  };
  out.appointments.forEach(a => {
    if (!Array.isArray(a.services)) a.services = [];
    if (!a.status) a.status = 'pending';
    if (a.price == null) a.price = 0;
  });
  // (aquí se añadirán pasos "if (v < 2) {...}" cuando cambie el formato en el futuro)
  void v;
  out.settings.dataVersion = DATA_VERSION;
  return out;
}

const DB = (() => {
  let db = null;
  const STORES = ['services', 'clients', 'appointments', 'settings'];

  function open() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) return reject(new Error('IndexedDB no disponible'));
      const r = indexedDB.open(DB_NAME, DB_VERSION);
      r.onupgradeneeded = () => {
        const d = r.result;
        if (!d.objectStoreNames.contains('services')) d.createObjectStore('services', { keyPath: 'id', autoIncrement: true });
        if (!d.objectStoreNames.contains('clients')) d.createObjectStore('clients', { keyPath: 'id', autoIncrement: true });
        if (!d.objectStoreNames.contains('appointments')) {
          const s = d.createObjectStore('appointments', { keyPath: 'id', autoIncrement: true });
          s.createIndex('date', 'date');
        }
        if (!d.objectStoreNames.contains('settings')) d.createObjectStore('settings', { keyPath: 'key' });
      };
      r.onsuccess = () => { db = r.result; resolve(); };
      r.onerror = () => reject(r.error);
      r.onblocked = () => reject(new Error('Base de datos bloqueada por otra pestaña'));
    });
  }

  const all = store => new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readonly').objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  const get = (store, key) => new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readonly').objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  const put = (store, obj) => new Promise((resolve, reject) => {
    const t = db.transaction(store, 'readwrite');
    const req = t.objectStore(store).put(obj);
    t.oncomplete = () => resolve(req.result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
  const del = (store, key) => new Promise((resolve, reject) => {
    const t = db.transaction(store, 'readwrite');
    t.objectStore(store).delete(key);
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });

  async function getSettings() {
    const rec = await get('settings', 'main');
    return normalizeSettings(rec && rec.value);
  }
  const saveSettings = s => put('settings', { key: 'main', value: s });

  async function exportAll() {
    const [services, clients, appointments, settings] = await Promise.all([
      all('services'), all('clients'), all('appointments'), getSettings()
    ]);
    return {
      app: BACKUP_APP_ID,
      dataVersion: DATA_VERSION,
      exportedAt: new Date().toISOString(),
      settings, services, clients, appointments
    };
  }

  /* Sustituye TODO el contenido (usado al restaurar una copia). Una sola transacción: o entra todo o no entra nada. */
  function replaceAll(data) {
    const d = migrateData(data);
    return new Promise((resolve, reject) => {
      const t = db.transaction(['services', 'clients', 'appointments', 'settings'], 'readwrite');
      t.oncomplete = () => resolve();
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error || new Error('No se pudo restaurar'));
      ['services', 'clients', 'appointments'].forEach(n => t.objectStore(n).clear());
      d.services.forEach(x => t.objectStore('services').put(x));
      d.clients.forEach(x => t.objectStore('clients').put(x));
      d.appointments.forEach(x => t.objectStore('appointments').put(x));
      t.objectStore('settings').put({ key: 'main', value: d.settings });
    });
  }

  async function init() {
    await open();
    const rec = await get('settings', 'main');
    if (!rec) {
      const s = DEFAULT_SETTINGS();
      s.seeded = true;
      await saveSettings(s);
      for (const sv of SEED_SERVICES) await put('services', sv);
    } else {
      // Guardar de vuelta ajustes normalizados (por si hay campos nuevos tras una actualización)
      await saveSettings(normalizeSettings(rec.value));
    }
  }

  return { init, all, get, put, del, getSettings, saveSettings, exportAll, replaceAll, STORES };
})();
