'use strict';

// Mis Turnos v4 — cómputo de horas nocturnas (21:00–05:00), feriados y modo oscuro.
const STORAGE_KEY = 'mis-turnos-data-v2';
const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DEFAULT_COLORS = { franco: '#F7D7DE', descanso: '#DDE9EA', exit: '#FFF0C2', normal: '#DCEBFF', extra: '#FFE0BD', second: '#E8E0FB', profile: '#D8E4FF' };
// Feriados nacionales 2026 y los feriados especiales aplicables en Provincia de Buenos Aires.
// Los días no laborables se registran por separado y no se computan como feriados.
const DEFAULT_HOLIDAYS_2026 = [
  ['2026-01-01','Año Nuevo','feriado'],['2026-02-16','Carnaval','feriado'],['2026-02-17','Carnaval','feriado'],
  ['2026-03-23','Día no laborable con fines turísticos','noLaborable'],['2026-03-24','Día Nacional de la Memoria por la Verdad y la Justicia','feriado'],
  ['2026-04-02','Día del Veterano y de los Caídos en la Guerra de Malvinas','feriado'],['2026-04-03','Viernes Santo','feriado'],
  ['2026-05-01','Día del Trabajador','feriado'],['2026-05-25','Revolución de Mayo','feriado'],
  ['2026-06-15','Paso a la Inmortalidad del Gral. Martín Miguel de Güemes (trasladado)','feriado'],['2026-06-20','Paso a la Inmortalidad del Gral. Manuel Belgrano','feriado'],
  ['2026-07-09','Día de la Independencia','feriado'],['2026-07-10','Día no laborable con fines turísticos','noLaborable'],
  ['2026-08-17','Paso a la Inmortalidad del Gral. José de San Martín','feriado'],['2026-10-12','Día del Respeto a la Diversidad Cultural','feriado'],
  ['2026-11-09','Feriado nacional especial por visita del Papa León XIV','feriado'],
  ['2026-11-23','Día de la Soberanía Nacional (trasladado)','feriado'],['2026-12-07','Día no laborable con fines turísticos','noLaborable'],
  ['2026-12-08','Inmaculada Concepción de María','feriado'],['2026-12-25','Navidad','feriado']
].map(([date,name,type])=>({date,name,type,origin:'default-2026'}));
const DEFAULT_HOUR_RULES = { nightStart:'21:00', nightEnd:'05:00' };
function normalizeHourRules(rules = {}) {
  const normalized = { ...DEFAULT_HOUR_RULES, ...(rules || {}) };
  // Migra el valor predeterminado anterior (06:00) al nuevo límite solicitado (05:00).
  if (normalized.nightEnd === '06:00') normalized.nightEnd = '05:00';
  delete normalized.saturday100Start;
  return normalized;
}
const clone = (value) => JSON.parse(JSON.stringify(value));
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));
const uid = (prefix = 'id') => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

function emptyPlanner(name = 'Mi calendario') {
  return {
    name,
    mode: 'manual',
    settings: { anchorFranco: '', firstShiftId: '', workDays: 5, restDays: 0, hourRules: clone(DEFAULT_HOUR_RULES) },
    shifts: [],
    holidays: clone(DEFAULT_HOLIDAYS_2026),
    colors: clone(DEFAULT_COLORS),
    fixedRules: Array.from({ length: 7 }, () => ({ type: 'none' })),
    manualEntries: {},
    dayNotes: {}
  };
}
function normalizePlanner(input, fallbackName = 'Mi calendario') {
  const base = emptyPlanner(fallbackName);
  const p = input && typeof input === 'object' ? input : {};
  return {
    ...base, ...p,
    name: String(p.name || fallbackName),
    mode: ['rotation', 'fixed', 'manual'].includes(p.mode) ? p.mode : 'manual',
    settings: { ...base.settings, ...(p.settings || {}), hourRules: normalizeHourRules(p.settings?.hourRules) },
    shifts: Array.isArray(p.shifts) ? p.shifts : [],
    holidays: Array.isArray(p.holidays) ? p.holidays : clone(DEFAULT_HOLIDAYS_2026),
    colors: { ...base.colors, ...(p.colors || {}) },
    fixedRules: Array.isArray(p.fixedRules) && p.fixedRules.length === 7 ? p.fixedRules : base.fixedRules,
    manualEntries: p.manualEntries && typeof p.manualEntries === 'object' ? p.manualEntries : {},
    dayNotes: p.dayNotes && typeof p.dayNotes === 'object' ? p.dayNotes : {}
  };
}
function newState() {
  const planner = emptyPlanner('Mi calendario');
  return { version: 2, activeProfileId: 'personal', profiles: [{ id: 'personal', name: 'Mi calendario', planner }], receivedProfiles: [], activeReceivedProfileId: '' };
}
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return newState();
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.profiles)) {
      const state = {
        version: 2,
        activeProfileId: parsed.activeProfileId || parsed.profiles[0]?.id || 'personal',
        profiles: parsed.profiles.map((p) => ({ id: p.id || uid('profile'), name: p.name || 'Perfil', planner: normalizePlanner(p.planner, p.name) })),
        receivedProfiles: Array.isArray(parsed.receivedProfiles) ? parsed.receivedProfiles : [],
        activeReceivedProfileId: parsed.activeReceivedProfileId || ''
      };
      if (!state.profiles.length) state.profiles = newState().profiles;
      if (!state.profiles.some((p) => p.id === state.activeProfileId)) state.activeProfileId = state.profiles[0].id;
      return state;
    }
    // Importación suave de respaldos v1 anteriores, pero no de los datos de demostración.
    if (parsed && Array.isArray(parsed.shifts)) {
      const old = normalizePlanner(parsed, 'Mi calendario');
      return { ...newState(), profiles: [{ id: 'personal', name: 'Mi calendario', planner: old }] };
    }
  } catch (error) { console.warn('No se pudo leer el almacenamiento local:', error); }
  return newState();
}
let appState = loadState();
let activeProfileId = appState.activeProfileId;
let activeProfile = appState.profiles.find((p) => p.id === activeProfileId) || appState.profiles[0];
let data = clone(activeProfile.planner);
let visibleMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let selectedDate = isoDate(new Date());
let toastTimer = null;
let installPrompt = null;
let dialogEditingDate = null;

function isoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
function dateFromISO(iso) {
  const [year, month, day] = String(iso).split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}
function addDays(iso, days) { const d = dateFromISO(iso); d.setDate(d.getDate() + days); return isoDate(d); }
function sameMonth(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth(); }
function formatLongDate(iso) { const d = dateFromISO(iso); return `${WEEKDAYS[d.getDay()]} ${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`; }
function formatMonth(date) { const s = MONTHS[date.getMonth()]; return `${s.charAt(0).toUpperCase()}${s.slice(1)} ${date.getFullYear()}`; }
function timeMinutes(value) { const [h, m] = String(value || '00:00').split(':').map(Number); return (h || 0) * 60 + (m || 0); }
function minutesToTime(value) { const n = ((value % 1440) + 1440) % 1440; return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`; }
function durationHours(start, end) { let mins = timeMinutes(end) - timeMinutes(start); if (mins <= 0) mins += 1440; return mins / 60; }
function formatHours(minutes) { const whole=Math.floor(minutes/60), rest=minutes%60; return rest?`${whole} h ${String(rest).padStart(2,'0')} min`:`${whole} h`; }
function getHoliday(dateISO, source=data) { return (source.holidays || []).find((h)=>h.date===dateISO) || null; }
function isNightMinute(date, rules) {
  const minute=date.getHours()*60+date.getMinutes(), start=timeMinutes(rules.nightStart), end=timeMinutes(rules.nightEnd);
  return start===end ? true : start<end ? minute>=start&&minute<end : minute>=start||minute<end;
}
function eventSegments(event, source) {
  if (!event) return [];
  if (event.type==='shift') { const shift=shiftById(event.shiftId,source); return shift?[{start:shift.start,end:shift.end,kind:'normal'}]:[]; }
  return event.type==='work'&&Array.isArray(event.segments)?event.segments:[];
}
function monthHourMetrics(month) {
  const first=isoDate(new Date(month.getFullYear(),month.getMonth(),1,12));
  const last=isoDate(new Date(month.getFullYear(),month.getMonth()+1,0,12));
  const metrics={total:0,night:0,holiday:0,nonLaborable:0,holidayDays:new Set(),nonLaborableDays:new Set()};
  // Cuenta los días del calendario aunque no tengan una jornada cargada.
  for(let dayISO=first;dayISO<=last;dayISO=addDays(dayISO,1)) {
    const dayInfo=getDisplayInfo(dayISO), holiday=getHoliday(dayISO,dayInfo.source);
    if(holiday?.type==='feriado') metrics.holidayDays.add(dayISO);
    if(holiday?.type==='noLaborable') metrics.nonLaborableDays.add(dayISO);
  }
  // Incluye turnos que empiezan el último día del mes anterior y terminan dentro del mes.
  for(let dateISO=addDays(first,-1);dateISO<=last;dateISO=addDays(dateISO,1)) {
    const info=getDisplayInfo(dateISO), event=info.event, source=info.source;
    for(const seg of eventSegments(event,source)) {
      if(!seg.start||!seg.end) continue;
      const start=new Date(dateFromISO(dateISO)); start.setHours(Math.floor(timeMinutes(seg.start)/60),timeMinutes(seg.start)%60,0,0);
      const duration=Math.max(0,Math.round(durationHours(seg.start,seg.end)*60));
      for(let offset=0;offset<duration;offset++) {
        const minute=new Date(start.getTime()+offset*60000), dayISO=isoDate(minute);
        if(dayISO<first||dayISO>last) continue;
        const dayInfo=getDisplayInfo(dayISO), holiday=getHoliday(dayISO,dayInfo.source);
        metrics.total++;
        if(isNightMinute(minute,source.settings?.hourRules||DEFAULT_HOUR_RULES)) metrics.night++;
        if(holiday?.type==='feriado') metrics.holiday++;
        if(holiday?.type==='noLaborable') metrics.nonLaborable++;
      }
    }
  }
  return metrics;
}

function isOvernight(shift) { return !!shift && timeMinutes(shift.end) <= timeMinutes(shift.start); }
function shiftById(id, source = data) { return source.shifts.find((s) => s.id === id) || null; }
function safeText(value) { return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function saveData() {
  const index = appState.profiles.findIndex((p) => p.id === activeProfileId);
  const snapshot = normalizePlanner(data, activeProfile?.name || 'Mi calendario');
  if (index >= 0) appState.profiles[index] = { ...appState.profiles[index], name: snapshot.name, planner: snapshot };
  appState.activeProfileId = activeProfileId;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(appState)); }
  catch (error) { showToast('No se pudieron guardar los cambios. Exportá un respaldo y revisá el espacio disponible.'); }
}
function cloneEntry(event) { return event ? clone(event) : null; }
function eventForShift(shift) { return shift ? { type: 'shift', shiftId: shift.id, note: '' } : null; }

function rotationMap(endISO) {
  const map = new Map();
  const anchor = data.settings.anchorFranco;
  if (!anchor || endISO < anchor || !data.shifts.length) return map;
  map.set(anchor, { type: 'franco', note: 'Franco de referencia' });
  let shiftIndex = Math.max(0, data.shifts.findIndex((s) => s.id === data.settings.firstShiftId));
  let cursor = addDays(anchor, 1);
  const workDays = Math.max(1, Math.min(31, Number(data.settings.workDays) || 5));
  const restDays = Math.max(0, Math.min(14, Number(data.settings.restDays) || 0));
  let guard = 0;
  while (cursor <= endISO && guard < 5000) {
    guard += 1;
    const shift = data.shifts[shiftIndex];
    if (!shift) break;
    for (let i = 0; i < workDays; i += 1) {
      map.set(cursor, eventForShift(shift));
      if (i === workDays - 1 && isOvernight(shift)) map.set(addDays(cursor, 1), { type: 'exit', shiftId: shift.id, note: `Salida ${shift.end}` });
      cursor = addDays(cursor, 1);
    }
    if (isOvernight(shift)) cursor = addDays(cursor, 1); // la salida no es franco
    for (let i = 0; i < restDays; i += 1) { map.set(cursor, { type: 'descanso', note: 'Descanso previo al franco' }); cursor = addDays(cursor, 1); }
    map.set(cursor, { type: 'franco' });
    cursor = addDays(cursor, 1);
    shiftIndex = (shiftIndex + 1) % data.shifts.length;
  }
  return map;
}
function fixedMap(startISO, endISO) {
  const map = new Map(); let cursor = startISO;
  while (cursor <= endISO) {
    const d = dateFromISO(cursor); const rule = data.fixedRules[d.getDay()] || { type: 'none' };
    if (rule.type === 'shift') {
      const shift = shiftById(rule.shiftId);
      if (shift) {
        map.set(cursor, eventForShift(shift));
        const next = addDays(cursor, 1); const nextRule = data.fixedRules[dateFromISO(next).getDay()] || { type: 'none' };
        if (isOvernight(shift) && nextRule.type === 'none') map.set(next, { type: 'exit', shiftId: shift.id, note: `Salida ${shift.end}` });
      }
    } else if (['franco', 'descanso'].includes(rule.type)) map.set(cursor, { type: rule.type });
    cursor = addDays(cursor, 1);
  }
  return map;
}
function getBaseEvent(dateISO) {
  let generated = null;
  if (data.mode === 'rotation') generated = rotationMap(dateISO).get(dateISO) || null;
  if (data.mode === 'fixed') generated = fixedMap(addDays(dateISO, -1), dateISO).get(dateISO) || null;
  return Object.prototype.hasOwnProperty.call(data.manualEntries, dateISO) ? data.manualEntries[dateISO] : generated;
}
function activeReceivedProfile() { return appState.receivedProfiles.find((p) => p.id === appState.activeReceivedProfileId && p.enabled !== false) || null; }
function getDisplayInfo(dateISO) {
  const received = activeReceivedProfile();
  if (received && dateISO >= received.effectiveDate && dateISO <= received.endDate && Object.prototype.hasOwnProperty.call(received.entries || {}, dateISO)) {
    return { event: received.entries[dateISO] || null, source: { shifts: received.shifts || [], colors: { ...DEFAULT_COLORS, ...(received.colors || {}) }, holidays: received.holidays || data.holidays || [], settings: { ...data.settings, hourRules: normalizeHourRules(received.settings?.hourRules) } }, received, isOverlay: true };
  }
  return { event: getBaseEvent(dateISO), source: data, received: null, isOverlay: false };
}
function eventTitle(event, source = data) {
  if (!event) return '';
  if (event.type === 'franco') return 'FRANCO';
  if (event.type === 'descanso') return 'DESCANSO';
  if (event.type === 'exit') return event.note || `Salida ${shiftById(event.shiftId, source)?.end || 'del turno'}`;
  if (event.type === 'shift') { const s = shiftById(event.shiftId, source); return s ? `${s.start}–${s.end}` : 'Turno'; }
  if (event.type === 'work') {
    const segs = Array.isArray(event.segments) ? event.segments : [];
    if (!segs.length) return 'Jornada';
    const first = segs[0];
    return segs.length === 1 ? `${first.start}–${first.end}` : `${segs.length} tramos de trabajo`;
  }
  return 'Actividad';
}
function eventName(event, source = data) {
  if (!event) return 'No hay actividad asignada para este día.';
  if (event.type === 'franco') return 'Día franco.';
  if (event.type === 'descanso') return 'Día de descanso.';
  if (event.type === 'exit') return `${event.note || `Salida ${shiftById(event.shiftId, source)?.end || ''}`}. Este día no se considera franco.`;
  if (event.type === 'shift') { const s = shiftById(event.shiftId, source); return s ? `${s.name}: ${s.start} a ${s.end}${isOvernight(s) ? ' (finaliza al día siguiente)' : ''}.` : 'Turno de trabajo.'; }
  if (event.type === 'work') {
    const parts = (event.segments || []).map((s, i) => {
      const label = s.kind === 'extra' ? 'Horas extra' : s.kind === 'second' ? 'Segundo turno' : 'Jornada';
      return `${label} ${i + 1}: ${s.start}–${s.end} (${durationHours(s.start, s.end)} h)`;
    });
    return parts.join(' · ') || 'Jornada de trabajo.';
  }
  return 'Actividad programada.';
}
function eventColor(event, source = data) {
  if (!event) return '';
  const colors = { ...DEFAULT_COLORS, ...(source.colors || {}) };
  if (event.type === 'franco') return colors.franco;
  if (event.type === 'descanso') return colors.descanso;
  if (event.type === 'exit') return colors.exit;
  if (event.type === 'shift') return shiftById(event.shiftId, source)?.color || colors.normal;
  if (event.type === 'work') {
    const first = (event.segments || [])[0];
    return first?.kind === 'extra' ? colors.extra : first?.kind === 'second' ? colors.second : colors.normal;
  }
  return colors.normal;
}
function hexToRgba(hex, alpha) {
  const clean = String(hex || '#ffffff').replace('#', ''); const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const value = Number.parseInt(full, 16); if (!Number.isFinite(value)) return `rgba(230,235,250,${alpha})`;
  return `rgba(${(value >> 16) & 255},${(value >> 8) & 255},${value & 255},${alpha})`;
}
function contrastColor(hex) { const rgba = hexToRgba(hex, 1).match(/\d+/g); if (!rgba) return '#293252'; const [r,g,b] = rgba.map(Number); return (r*299+g*587+b*114)/1000 > 155 ? '#34405f' : '#ffffff'; }
function modeLabel() { return data.mode === 'rotation' ? 'Rotación automática' : data.mode === 'fixed' ? 'Turnos fijos' : 'Carga manual'; }
function renderCalendar() {
  $('#monthTitle').textContent = formatMonth(visibleMonth);
  $('#modeBadge').textContent = activeProfile.name || 'Mi calendario';
  const first = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1, 12);
  const offset = (first.getDay() + 6) % 7; const gridStart = new Date(first); gridStart.setDate(first.getDate() - offset);
  const cells = []; for (let i = 0; i < 42; i += 1) { const d = new Date(gridStart); d.setDate(gridStart.getDate() + i); cells.push(isoDate(d)); }
  const today = isoDate(new Date()); const counts = { shift: 0, work: 0, franco: 0, descanso: 0, extra: 0 };
  const grid = $('#calendarGrid'); grid.innerHTML = '';
  cells.forEach((dateISO) => {
    const info = getDisplayInfo(dateISO); const event = info.event; const holiday=getHoliday(dateISO,info.source); const date = dateFromISO(dateISO);
    if (sameMonth(date, visibleMonth) && event) {
      if (['shift','work'].includes(event.type)) counts.shift += 1;
      else if (counts[event.type] !== undefined) counts[event.type] += 1;
      if (event.type === 'work' && (event.segments || []).some((s) => s.kind === 'extra' || s.kind === 'second')) counts.extra += 1;
    }
    const cell = document.createElement('button'); cell.type = 'button'; cell.className = 'day-cell';
    if (!sameMonth(date, visibleMonth)) cell.classList.add('outside-month');
    if (dateISO === selectedDate) cell.classList.add('selected'); if (dateISO === today) cell.classList.add('today'); if(holiday) cell.classList.add(holiday.type==='feriado'?'holiday-day':'nonwork-day');
    cell.setAttribute('aria-label', `${formatLongDate(dateISO)}. ${event ? eventName(event, info.source) : 'Sin turno cargado'}`);
    const number = document.createElement('span'); number.className = 'day-number'; number.textContent = String(date.getDate()); cell.appendChild(number);
    if (info.received && dateISO === info.received.effectiveDate) {
      const marker = document.createElement('span'); marker.className = 'profile-marker'; marker.textContent = `Perfil ${info.received.name} en vigencia`; cell.appendChild(marker);
    }
    if (event) {
      const label = document.createElement('span'); label.className = 'day-event'; label.textContent = eventTitle(event, info.source);
      const color = eventColor(event, info.source); label.style.backgroundColor = color; label.style.color = contrastColor(color); cell.appendChild(label);
      if (event.note && !['franco','descanso','Franco de referencia'].includes(event.note)) { const note = document.createElement('span'); note.className = 'event-note'; note.textContent = event.note; cell.appendChild(note); }
      cell.style.borderTop = `3px solid ${color}`;
    } else { const empty = document.createElement('span'); empty.className = 'empty-day'; empty.textContent = '—'; cell.appendChild(empty); }
    if(holiday){const h=document.createElement('span');h.className=holiday.type==='feriado'?'holiday-chip':'nonwork-chip';h.textContent=holiday.type==='feriado'?'FERIADO':'NO LABORABLE';h.title=holiday.name;cell.appendChild(h);}
    if (data.dayNotes?.[dateISO]) { const dot = document.createElement('span'); dot.className = 'note-dot'; dot.textContent = 'Detalle'; cell.appendChild(dot); }
    cell.addEventListener('click', () => { selectedDate = dateISO; if (!sameMonth(date, visibleMonth)) visibleMonth = new Date(date.getFullYear(), date.getMonth(), 1); renderCalendar(); });
    grid.appendChild(cell);
  });
  $('#monthSummary').innerHTML = `
    <div class="summary-item"><span>Jornadas</span><strong>${counts.shift}</strong></div>
    <div class="summary-item"><span>Francos</span><strong>${counts.franco}</strong></div>
    <div class="summary-item"><span>Extras / dobles</span><strong>${counts.extra}</strong></div>`;
  const hours=monthHourMetrics(visibleMonth);
  $('#hoursSummary').innerHTML=`<div class="hours-summary-title">Cómputo de horas del mes <small>(según los horarios y feriados cargados)</small></div><div class="hours-summary-grid"><div class="hours-metric emphasis"><span>Horas nocturnas (21:00–05:00)</span><strong>${formatHours(hours.night)}</strong></div><div class="hours-metric"><span>Días feriados</span><strong>${hours.holidayDays.size}</strong></div><div class="hours-metric"><span>Horas trabajadas en feriados</span><strong>${formatHours(hours.holiday)}</strong></div><div class="hours-metric"><span>Días no laborables</span><strong>${hours.nonLaborableDays.size}</strong></div><div class="hours-metric"><span>Horas en días no laborables</span><strong>${formatHours(hours.nonLaborable)}</strong></div></div><p class="hours-summary-foot">Las horas nocturnas se cuentan por minuto dentro del período configurado (por defecto, de 21:00 a 05:00). Los días feriados se cuentan aunque no haya trabajo asignado; las horas de feriado incluyen únicamente el tiempo efectivamente trabajado. Los días no laborables se muestran por separado.</p>`;
  renderLegend(); renderSelectedDay();
}
function renderLegend() {
  const entries = [
    ...data.shifts.map((s) => ({ label: `${s.name} (${s.start}–${s.end})`, color: s.color })),
    { label: 'Jornada', color: data.colors.normal }, { label: 'Horas extra', color: data.colors.extra },
    { label: 'Segundo turno', color: data.colors.second }, { label: 'Franco', color: data.colors.franco },
    { label: 'Descanso', color: data.colors.descanso }, { label: 'Salida', color: data.colors.exit }, { label:'Feriado',color:'#f4b7a8' }, { label:'Día no laborable',color:'#e4d9a8' }
  ];
  $('#calendarLegend').innerHTML = entries.map((item) => `<span class="legend-item"><i class="legend-dot" style="background:${safeText(item.color)}"></i>${safeText(item.label)}</span>`).join('');
}
function renderSelectedDay() {
  const info = getDisplayInfo(selectedDate); const event = info.event;
  $('#selectedDateTitle').textContent = formatLongDate(selectedDate);
  let description = eventName(event, info.source);
  const selectedHoliday=getHoliday(selectedDate,info.source);
  if(selectedHoliday) description += ` ${selectedHoliday.type==='feriado'?'Feriado':'Día no laborable'}: ${selectedHoliday.name}.`;
  if (info.received && selectedDate === info.received.effectiveDate) description = `Perfil ${info.received.name} en vigencia. ${description}`;
  if (event?.note && !['Franco de referencia','Descanso previo al franco'].includes(event.note)) description += ` Aclaración: ${event.note}.`;
  if (info.received?.notes?.[selectedDate]) description += ` Observación del perfil: ${info.received.notes[selectedDate]}.`;
  if (Object.prototype.hasOwnProperty.call(data.manualEntries, selectedDate)) description += ' (Carga manual)';
  $('#selectedDescription').textContent = description;
  $('#dayNote').value = data.dayNotes?.[selectedDate] || '';
  const received = Boolean(info.received);
  $('#manageDayButton').textContent = event ? 'Modificar asignación' : 'Agregar asignación';
  $('#manageDayButton').disabled = received;
  $('#manageDayButton').title = received ? 'Este turno fue recibido de otro perfil. Podés agregar una observación local.' : '';
  $('#receivedDayHint').textContent = received ? `Asignación de ${info.received.name}. Para modificarla, hacé el cambio en el perfil que la generó y compartí una actualización.` : '';
}
function renderSettings() {
  $$('input[name="scheduleMode"]').forEach((r) => { r.checked = r.value === data.mode; });
  $('#rotationSettings').classList.toggle('hidden', data.mode !== 'rotation');
  $('#fixedSettings').classList.toggle('hidden', data.mode !== 'fixed');
  $('#anchorFranco').value = data.settings.anchorFranco || '';
  $('#workDays').value = data.settings.workDays; $('#restDays').value = data.settings.restDays;
  $('#firstShift').innerHTML = data.shifts.map((s) => `<option value="${safeText(s.id)}">${safeText(s.name)} (${safeText(s.start)}–${safeText(s.end)})</option>`).join('');
  $('#firstShift').value = data.settings.firstShiftId || '';
  $('#nightStart').value = data.settings.hourRules?.nightStart || DEFAULT_HOUR_RULES.nightStart;
  $('#nightEnd').value = data.settings.hourRules?.nightEnd || DEFAULT_HOUR_RULES.nightEnd;
  renderFixedRules(); renderShiftsEditor(); renderSpecialColors(); renderHolidayList();
}
function ruleValue(rule) { if (!rule || rule.type === 'none') return 'none'; if (['franco','descanso'].includes(rule.type)) return rule.type; if (rule.type === 'shift') return `shift:${rule.shiftId}`; return 'none'; }
function parseRule(value) { if (value.startsWith('shift:')) return { type: 'shift', shiftId: value.slice(6) }; if (['franco','descanso'].includes(value)) return { type: value }; return { type: 'none' }; }
function renderFixedRules() {
  const names = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  $('#fixedRules').innerHTML = names.map((name, day) => {
    const options = ['<option value="none">Sin asignar</option>','<option value="franco">Franco</option>','<option value="descanso">Descanso</option>', ...data.shifts.map((s) => `<option value="shift:${safeText(s.id)}">${safeText(s.name)} · ${safeText(s.start)}–${safeText(s.end)}</option>`)].join('');
    return `<div class="fixed-rule"><label for="fixed-${day}">${name}</label><select id="fixed-${day}" data-fixed-day="${day}">${options}</select></div>`;
  }).join('');
  data.fixedRules.forEach((rule, day) => { const el = $(`#fixed-${day}`); if (el) el.value = ruleValue(rule); });
  $$('[data-fixed-day]').forEach((el) => el.addEventListener('change', () => { data.fixedRules[Number(el.dataset.fixedDay)] = parseRule(el.value); saveData(); renderCalendar(); }));
}
function renderShiftsEditor() {
  $('#shiftsEditor').innerHTML = data.shifts.length ? data.shifts.map((s, i) => `
    <div class="shift-editor-card" data-shift-card="${safeText(s.id)}">
      <label class="field"><span>Nombre del turno</span><input data-shift-field="name" value="${safeText(s.name)}" maxlength="30"></label>
      <label class="field"><span>Desde</span><input data-shift-field="start" type="time" value="${safeText(s.start)}"></label>
      <label class="field"><span>Hasta</span><input data-shift-field="end" type="time" value="${safeText(s.end)}"></label>
      <label class="field"><span>Color</span><input data-shift-field="color" type="color" value="${safeText(s.color)}"></label>
      <div class="move-controls"><button class="mini-button" type="button" data-move="up" ${i===0?'disabled':''}>↑</button><button class="mini-button" type="button" data-move="down" ${i===data.shifts.length-1?'disabled':''}>↓</button><button class="mini-button delete-shift" type="button" data-delete-shift>×</button></div>
    </div>`).join('') : '<p class="empty-message">Todavía no hay turnos configurados. Podés crear los que necesites con jornadas de 4, 6, 8, 12 horas o cualquier duración.</p>';
  $$('[data-shift-card]').forEach((card) => {
    const id = card.dataset.shiftCard;
    card.querySelectorAll('[data-shift-field]').forEach((input) => input.addEventListener('change', () => { const s = shiftById(id); if (!s) return; s[input.dataset.shiftField] = input.value; saveData(); renderFixedRules(); renderCalendar(); }));
    card.querySelector('[data-move="up"]')?.addEventListener('click', () => moveShift(id, -1));
    card.querySelector('[data-move="down"]')?.addEventListener('click', () => moveShift(id, 1));
    card.querySelector('[data-delete-shift]')?.addEventListener('click', () => deleteShift(id));
  });
}
function refreshShiftDependentControls() { $('#firstShift').innerHTML = data.shifts.map((s) => `<option value="${safeText(s.id)}">${safeText(s.name)} (${safeText(s.start)}–${safeText(s.end)})</option>`).join(''); $('#firstShift').value = data.settings.firstShiftId || ''; renderFixedRules(); renderCalendar(); }
function moveShift(id, direction) { const i=data.shifts.findIndex(s=>s.id===id), j=i+direction; if(i<0||j<0||j>=data.shifts.length)return; [data.shifts[i],data.shifts[j]]=[data.shifts[j],data.shifts[i]]; saveData(); renderSettings(); renderCalendar(); }
function deleteShift(id) {
  if (!confirm('¿Eliminar este turno? Las asignaciones manuales que lo usaban quedarán como jornada manual.')) return;
  const replacement = data.shifts.find((s) => s.id !== id);
  data.shifts = data.shifts.filter((s) => s.id !== id);
  if (data.settings.firstShiftId === id) data.settings.firstShiftId = replacement?.id || '';
  data.fixedRules = data.fixedRules.map((r) => r.type === 'shift' && r.shiftId === id ? { type: 'none' } : r);
  for (const [date, entry] of Object.entries(data.manualEntries)) if (entry?.type === 'shift' && entry.shiftId === id) data.manualEntries[date] = { type: 'work', segments: replacement ? [{ start: replacement.start, end: replacement.end, kind: 'normal' }] : [], note: entry.note || '' };
  saveData(); renderSettings(); renderCalendar(); showToast('Turno eliminado.');
}
function renderSpecialColors() {
  const labels = { franco:'Franco', descanso:'Descanso', exit:'Salida', normal:'Jornada', extra:'Horas extra', second:'Segundo turno', profile:'Inicio de perfil' };
  $('#specialColors').innerHTML = Object.entries(labels).map(([k,v]) => `<label class="color-setting"><span>${v}</span><input type="color" data-special-color="${k}" value="${safeText(data.colors[k])}"></label>`).join('');
  $$('[data-special-color]').forEach((input) => input.addEventListener('input', () => { data.colors[input.dataset.specialColor]=input.value; saveData(); renderCalendar(); }));
}
function renderHolidayList() {
  const list=$('#holidayList');
  const holidays=[...(data.holidays||[])].sort((a,b)=>a.date.localeCompare(b.date));
  list.innerHTML=holidays.length?holidays.map((h)=>`<div class="holiday-row"><div><strong>${safeText(h.date)}</strong><span>${safeText(h.name)}</span><small>${h.type==='feriado'?'Feriado':'Día no laborable'}${h.origin==='default-2026'?' · Calendario nacional 2026':''}</small></div><button class="mini-button delete-shift" type="button" data-remove-holiday="${safeText(h.date)}" aria-label="Quitar fecha">×</button></div>`).join(''):'<p class="empty-message">No hay fechas cargadas.</p>';
  $$('[data-remove-holiday]').forEach((button)=>button.addEventListener('click',()=>{const date=button.dataset.removeHoliday;data.holidays=(data.holidays||[]).filter((h)=>h.date!==date);saveData();renderHolidayList();renderCalendar();showToast('Fecha eliminada del calendario.');}));
}
function addHoliday(date,name,type) {
  if(!date||!name.trim())return false;
  const existing=(data.holidays||[]).find((h)=>h.date===date);
  if(existing){existing.name=name.trim();existing.type=type;existing.origin='custom';}
  else data.holidays.push({date,name:name.trim(),type,origin:'custom'});
  data.holidays.sort((a,b)=>a.date.localeCompare(b.date));saveData();renderHolidayList();renderCalendar();return true;
}
function showToast(message) { const el=$('#toast'); el.textContent=message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('show'),2800); }
function setView(viewId) {
  $$('.tab').forEach((t)=>t.classList.toggle('active',t.dataset.view===viewId));
  ['calendarView','settingsView','profilesView'].forEach((id)=>$('#'+id).classList.toggle('hidden',id!==viewId));
  if(viewId==='settingsView') renderSettings(); if(viewId==='profilesView') renderProfiles();
}
function refreshAll() { saveData(); renderSettings(); renderCalendar(); }

function renderSegmentRow(segment = { start:'08:00', end:'14:00', kind:'normal' }) {
  const duration = durationHours(segment.start, segment.end);
  const durationValue = [4,6,8,12].includes(duration) ? String(duration) : 'custom';
  const row = document.createElement('div'); row.className='segment-row';
  row.innerHTML = `
    <label class="field"><span>Tipo de tramo</span><select data-seg-kind><option value="normal">Jornada</option><option value="extra">Horas extra</option><option value="second">Segundo turno</option></select></label>
    <label class="field"><span>Duración</span><select data-seg-duration><option value="4">4 horas</option><option value="6">6 horas</option><option value="8">8 horas</option><option value="12">12 horas</option><option value="custom">Personalizada</option></select></label>
    <label class="field"><span>Desde</span><input data-seg-start type="time" value="${safeText(segment.start)}" required></label>
    <label class="field"><span>Hasta</span><input data-seg-end type="time" value="${safeText(segment.end)}" required></label>
    <button type="button" class="mini-button delete-shift segment-remove" title="Quitar tramo">×</button>`;
  row.querySelector('[data-seg-kind]').value = segment.kind || 'normal';
  row.querySelector('[data-seg-duration]').value = durationValue;
  row.querySelector('[data-seg-duration]').addEventListener('change', () => {
    const val=row.querySelector('[data-seg-duration]').value; if(val==='custom')return;
    const start=row.querySelector('[data-seg-start]').value || '08:00';
    row.querySelector('[data-seg-end]').value=minutesToTime(timeMinutes(start)+Number(val)*60);
  });
  row.querySelector('[data-seg-start]').addEventListener('change', () => {
    const val=row.querySelector('[data-seg-duration]').value; if(val!=='custom') row.querySelector('[data-seg-end]').value=minutesToTime(timeMinutes(row.querySelector('[data-seg-start]').value)+Number(val)*60);
  });
  row.querySelector('.segment-remove').addEventListener('click',()=>{if($('#segmentsContainer').children.length>1)row.remove();});
  return row;
}
function fillSegmentEditor(segments) { const box=$('#segmentsContainer'); box.innerHTML=''; (segments?.length?segments:[{start:'08:00',end:'14:00',kind:'normal'}]).forEach((s)=>box.appendChild(renderSegmentRow(s))); }
function updateEventTypeFields() { $('#eventShiftFields').classList.toggle('hidden',$('#eventType').value!=='work'); }
function openEventDialog(dateISO=selectedDate) {
  dialogEditingDate=dateISO; const info=getDisplayInfo(dateISO); const current=info.event; const isManual=Object.prototype.hasOwnProperty.call(data.manualEntries,dateISO);
  $('#dialogTitle').textContent=current?'Modificar asignación':'Agregar asignación';
  $('#eventDate').value=dateISO; $('#eventNote').value=isManual?(current?.note||''):'';
  const type=current?.type==='shift'?'work':current?.type||'work'; $('#eventType').value=['work','franco','descanso','exit'].includes(type)?type:'work';
  let segments=[];
  if(current?.type==='shift') { const s=shiftById(current.shiftId,info.source); if(s)segments=[{start:s.start,end:s.end,kind:'normal'}]; }
  else if(current?.type==='work') segments=current.segments||[];
  fillSegmentEditor(segments); updateEventTypeFields();
  $('#autoExit').checked=current?.type==='exit' || (segments.length>0 && timeMinutes(segments[segments.length-1].end)<=timeMinutes(segments[segments.length-1].start));
  $('#deleteManualButton').hidden=!isManual;
  $('#eventDialog').showModal();
}
function closeEventDialog(){ $('#eventDialog').close(); }
function submitEvent(event) {
  event.preventDefault(); const dateISO=$('#eventDate').value; if(!dateISO){showToast('Elegí una fecha.');return;}
  const type=$('#eventType').value; const entry={type,note:$('#eventNote').value.trim()};
  if(type==='work') {
    entry.segments=$$('#segmentsContainer .segment-row').map((row)=>({start:row.querySelector('[data-seg-start]').value,end:row.querySelector('[data-seg-end]').value,kind:row.querySelector('[data-seg-kind]').value}));
    if(!entry.segments.length || entry.segments.some((s)=>!s.start||!s.end)){showToast('Completá el horario de cada tramo.');return;}
    if(entry.segments.some((s)=>durationHours(s.start,s.end)<=0 || durationHours(s.start,s.end)>24)){showToast('Revisá la duración de los tramos.');return;}
  }
  if(type==='exit') { const shift=data.shifts[0]; if(shift)entry.shiftId=shift.id; if(!entry.note)entry.note='Salida de turno'; }
  const next=addDays(dateISO,1); if(data.manualEntries[next]?.autoGeneratedFrom===dateISO)delete data.manualEntries[next];
  data.manualEntries[dateISO]=entry;
  if(type==='work' && $('#autoExit').checked) {
    const last=entry.segments[entry.segments.length-1];
    if(timeMinutes(last.end)<=timeMinutes(last.start))data.manualEntries[next]={type:'exit',note:`Salida ${last.end}`,autoGeneratedFrom:dateISO};
  }
  selectedDate=dateISO; const d=dateFromISO(dateISO); visibleMonth=new Date(d.getFullYear(),d.getMonth(),1);
  closeEventDialog(); saveData(); renderCalendar(); showToast('Asignación guardada.');
}
function deleteManualEntry() {
  const dateISO=$('#eventDate').value; delete data.manualEntries[dateISO]; const next=addDays(dateISO,1); if(data.manualEntries[next]?.autoGeneratedFrom===dateISO)delete data.manualEntries[next];
  closeEventDialog(); saveData(); renderCalendar(); showToast('Se quitó la asignación manual.');
}
function saveDayNote() {
  const value=$('#dayNote').value.trim(); if(value)data.dayNotes[selectedDate]=value; else delete data.dayNotes[selectedDate];
  saveData(); renderCalendar(); showToast('Detalle del día guardado.');
}
function exportBackup() {
  saveData(); const payload={kind:'mis-turnos-backup',...appState,exportedAt:new Date().toISOString(),app:'Mis Turnos'};
  downloadJSON(payload,`respaldo-mis-turnos-${isoDate(new Date())}.json`); showToast('Respaldo exportado.');
}
function downloadJSON(payload, filename) {
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1500);
}
async function importBackup(file) {
  if(!file)return;
  try {
    const parsed=JSON.parse(await file.text());
    if(parsed.kind==='mis-turnos-backup' && Array.isArray(parsed.profiles)) {
      appState={version:2,activeProfileId:parsed.activeProfileId||parsed.profiles[0]?.id,profiles:parsed.profiles.map((p)=>({...p,planner:normalizePlanner(p.planner,p.name)})),receivedProfiles:Array.isArray(parsed.receivedProfiles)?parsed.receivedProfiles:[],activeReceivedProfileId:parsed.activeReceivedProfileId||''};
      activeProfileId=appState.activeProfileId; activeProfile=appState.profiles.find((p)=>p.id===activeProfileId)||appState.profiles[0]; data=clone(activeProfile.planner);
    } else if(Array.isArray(parsed.shifts)&&parsed.settings) { data=normalizePlanner(parsed,'Mi calendario'); activeProfile.planner=clone(data); }
    else throw new Error('Formato');
    localStorage.setItem(STORAGE_KEY,JSON.stringify(appState)); renderEverything(); showToast('Respaldo importado.');
  }catch(error){showToast('No se pudo importar: el respaldo no tiene un formato reconocido.');}
  finally{$('#importFile').value='';}
}

// Perfiles de planificación locales (un espacio independiente por empleado).
function switchPlannerProfile(id) {
  saveData(); const target=appState.profiles.find((p)=>p.id===id); if(!target)return;
  activeProfileId=id; appState.activeProfileId=id; activeProfile=target; data=clone(normalizePlanner(target.planner,target.name));
  saveData(); renderEverything(); setView('calendarView'); showToast(`Perfil ${target.name} abierto.`);
}
function renderProfiles() {
  const list=$('#localProfiles');
  list.innerHTML=appState.profiles.map((p)=>`<div class="profile-row"><div class="profile-row-copy"><strong>${safeText(p.name)}</strong><small>${p.id===activeProfileId?'En edición':'Perfil independiente'}</small></div><div class="profile-row-actions"><button type="button" class="soft-button" data-open-profile="${safeText(p.id)}">${p.id===activeProfileId?'Abierto':'Abrir'}</button>${p.id!=='personal'?`<button type="button" class="soft-button danger-outline" data-remove-profile="${safeText(p.id)}">Eliminar</button>`:''}</div></div>`).join('');
  $$('[data-open-profile]').forEach((b)=>b.addEventListener('click',()=>switchPlannerProfile(b.dataset.openProfile)));
  $$('[data-remove-profile]').forEach((b)=>b.addEventListener('click',()=>removeLocalProfile(b.dataset.removeProfile)));
  renderReceivedProfiles();
  $('#currentProfileName').textContent=activeProfile.name;
  if (!$('#shareEmployee').value) $('#shareEmployee').value=activeProfile.name;
}
function renderReceivedProfiles() {
  const received=$('#receivedProfiles');
  received.innerHTML=appState.receivedProfiles.length?appState.receivedProfiles.map((p)=>`<div class="profile-row"><div class="profile-row-copy"><strong>${safeText(p.name)}</strong><small>${safeText(p.employeeName||'Empleado')} · Vigencia desde ${safeText(p.effectiveDate)} hasta ${safeText(p.endDate)}</small></div><div class="profile-row-actions"><button type="button" class="${p.id===appState.activeReceivedProfileId?'primary-button':'soft-button'}" data-activate-received="${safeText(p.id)}">${p.id===appState.activeReceivedProfileId?'Visible en calendario':'Mostrar'}</button><button type="button" class="soft-button danger-outline" data-delete-received="${safeText(p.id)}">Quitar</button></div></div>`).join(''):'<p class="empty-message">Todavía no recibiste perfiles compartidos.</p>';
  $$('[data-activate-received]').forEach((b)=>b.addEventListener('click',()=>{appState.activeReceivedProfileId=b.dataset.activateReceived; localStorage.setItem(STORAGE_KEY,JSON.stringify(appState)); renderReceivedProfiles(); renderCalendar(); showToast('Perfil recibido visible en el calendario.');}));
  $$('[data-delete-received]').forEach((b)=>b.addEventListener('click',()=>{const id=b.dataset.deleteReceived;appState.receivedProfiles=appState.receivedProfiles.filter((p)=>p.id!==id);if(appState.activeReceivedProfileId===id)appState.activeReceivedProfileId='';localStorage.setItem(STORAGE_KEY,JSON.stringify(appState));renderReceivedProfiles();renderCalendar();showToast('Perfil recibido quitado.');}));
}
function removeLocalProfile(id) {
  if(appState.profiles.length<=1){showToast('Debe quedar al menos un perfil.');return;}
  const target=appState.profiles.find((p)=>p.id===id); if(!target)return;
  if(!confirm(`¿Eliminar el perfil ${target.name}? Se borrará su planificación local.`))return;
  appState.profiles=appState.profiles.filter((p)=>p.id!==id);
  if(activeProfileId===id){activeProfileId=appState.profiles[0].id;activeProfile=appState.profiles[0];data=clone(activeProfile.planner);appState.activeProfileId=activeProfileId;}
  localStorage.setItem(STORAGE_KEY,JSON.stringify(appState));renderEverything();renderProfiles();showToast('Perfil eliminado.');
}
function createLocalProfile(name) {
  const p={id:uid('profile'),name:name.trim(),planner:emptyPlanner(name.trim())};
  appState.profiles.push(p); switchPlannerProfile(p.id);
}
function buildSharePackage() {
  const effective=$('#shareEffective').value, end=$('#shareTo').value;
  if(!effective||!end||effective>end){showToast('Revisá la fecha de vigencia y la fecha final.');return null;}
  const employee=$('#shareEmployee').value.trim() || activeProfile.name;
  const map=new Map();
  if(data.mode==='rotation')rotationMap(end).forEach((event,date)=>map.set(date,event));
  if(data.mode==='fixed')fixedMap(addDays(effective,-1),end).forEach((event,date)=>map.set(date,event));
  for(const [date,event] of Object.entries(data.manualEntries))if(date>=effective&&date<=end)map.set(date,event);
  const entries={}; const notes={};
  for(let date=effective;date<=end;date=addDays(date,1)) { entries[date]=cloneEntry(map.get(date)||null); if(data.dayNotes[date])notes[date]=data.dayNotes[date]; }
  return {kind:'mis-turnos-profile',version:1,id:uid('shared'),name:employee,employeeName:employee,effectiveDate:effective,startDate:effective,endDate:end,entries,notes,shifts:clone(data.shifts),colors:clone(data.colors),holidays:clone(data.holidays),settings:clone(data.settings),createdAt:new Date().toISOString(),senderProfile:activeProfile.name};
}
async function shareCurrentProfile() {
  const pkg=buildSharePackage();if(!pkg)return;
  const safeName=(pkg.employeeName||pkg.name).toLowerCase().replace(/[^a-z0-9áéíóúñ_-]+/gi,'-');
  const file=new File([JSON.stringify(pkg,null,2)],`turnos-${safeName}.turnos.json`,{type:'application/json'});
  try {
    if(navigator.canShare && navigator.canShare({files:[file]})) await navigator.share({files:[file],title:`Turnos de ${pkg.employeeName}`,text:`Planificación de turnos. Vigencia desde ${pkg.effectiveDate}. Abrí Mis Turnos e importá este archivo.`});
    else {downloadJSON(pkg,file.name);showToast('Archivo preparado. Adjuntalo en WhatsApp.');}
  } catch(error) { if(error.name!=='AbortError'){downloadJSON(pkg,file.name);showToast('Archivo descargado para compartir.');} }
}
async function importSharedProfile(file) {
  if(!file)return;
  try {
    const p=JSON.parse(await file.text());
    if(p.kind!=='mis-turnos-profile'||!p.effectiveDate||!p.endDate||!p.entries||typeof p.entries!=='object')throw new Error('Formato');
    const id=uid('received');
    appState.receivedProfiles.push({...p,id,enabled:true});appState.activeReceivedProfileId=id;
    localStorage.setItem(STORAGE_KEY,JSON.stringify(appState));renderProfiles();renderReceivedProfiles();renderCalendar();showToast(`Perfil ${p.name||''} importado. Se activa desde ${p.effectiveDate}.`);
  }catch(error){console.error('Error al importar perfil:',error);showToast('No se pudo importar. Seleccioná un archivo .turnos.json válido.');}
  finally{$('#importProfileFile').value='';}
}
function renderEverything(){renderSettings();renderCalendar();renderProfiles();}

// Navegación y formularios.
$$('.tab').forEach((tab)=>tab.addEventListener('click',()=>setView(tab.dataset.view)));
$('#prevMonth').addEventListener('click',()=>{visibleMonth=new Date(visibleMonth.getFullYear(),visibleMonth.getMonth()-1,1);renderCalendar();});
$('#nextMonth').addEventListener('click',()=>{visibleMonth=new Date(visibleMonth.getFullYear(),visibleMonth.getMonth()+1,1);renderCalendar();});
$('#todayButton').addEventListener('click',()=>{const d=new Date();visibleMonth=new Date(d.getFullYear(),d.getMonth(),1);selectedDate=isoDate(d);renderCalendar();});
$('#manageDayButton').addEventListener('click',()=>openEventDialog(selectedDate));
$('#closeDialog').addEventListener('click',closeEventDialog);$('#cancelDialog').addEventListener('click',closeEventDialog);
$('#eventForm').addEventListener('submit',submitEvent);$('#eventType').addEventListener('change',updateEventTypeFields);
$('#addSegmentButton').addEventListener('click',()=>$('#segmentsContainer').appendChild(renderSegmentRow({start:'14:00',end:'18:00',kind:'extra'})));
$('#deleteManualButton').addEventListener('click',deleteManualEntry);
$('#saveDayNoteButton').addEventListener('click',saveDayNote);
$('#dayNote').addEventListener('keydown',(e)=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter')saveDayNote();});
$('#addShiftForm').addEventListener('submit',(event)=>{
  event.preventDefault();const name=$('#newShiftName').value.trim(),start=$('#newShiftStart').value,end=$('#newShiftEnd').value;if(!name||!start||!end)return;
  const id=uid('shift');data.shifts.push({id,name,start,end,color:$('#newShiftColor').value});if(!data.settings.firstShiftId)data.settings.firstShiftId=id;
  $('#newShiftName').value='';saveData();renderSettings();renderCalendar();showToast('Turno agregado.');
});
$('#newShiftDuration').addEventListener('change',()=>{const duration=$('#newShiftDuration').value;if(duration!=='custom')$('#newShiftEnd').value=minutesToTime(timeMinutes($('#newShiftStart').value||'08:00')+Number(duration)*60);});
$('#newShiftStart').addEventListener('change',()=>{const duration=$('#newShiftDuration').value;if(duration!=='custom')$('#newShiftEnd').value=minutesToTime(timeMinutes($('#newShiftStart').value||'08:00')+Number(duration)*60);});
$$('input[name="scheduleMode"]').forEach((radio)=>radio.addEventListener('change',()=>{if(!radio.checked)return;data.mode=radio.value;saveData();renderSettings();renderCalendar();}));
$('#anchorFranco').addEventListener('change',()=>{data.settings.anchorFranco=$('#anchorFranco').value;refreshAll();});
$('#firstShift').addEventListener('change',()=>{data.settings.firstShiftId=$('#firstShift').value;refreshAll();});
$('#workDays').addEventListener('change',()=>{data.settings.workDays=Math.max(1,Math.min(31,Number($('#workDays').value)||5));refreshAll();});
$('#restDays').addEventListener('change',()=>{data.settings.restDays=Math.max(0,Math.min(14,Number($('#restDays').value)||0));refreshAll();});
['nightStart','nightEnd'].forEach((id)=>$('#'+id).addEventListener('change',()=>{data.settings.hourRules=normalizeHourRules({...data.settings.hourRules,[id]:$('#'+id).value});saveData();renderCalendar();}));
$('#holidayForm').addEventListener('submit',(event)=>{event.preventDefault();const ok=addHoliday($('#holidayDate').value,$('#holidayName').value,$('#holidayType').value);if(ok){$('#holidayName').value='';showToast('Fecha agregada al calendario.');}});
$('#exportButton').addEventListener('click',exportBackup);$('#importFile').addEventListener('change',(e)=>importBackup(e.target.files?.[0]));
$('#createProfileForm').addEventListener('submit',(e)=>{e.preventDefault();const name=$('#newProfileName').value.trim();if(!name)return;if(appState.profiles.some((p)=>p.name.toLowerCase()===name.toLowerCase())){showToast('Ya existe un perfil con ese nombre.');return;}$('#newProfileName').value='';createLocalProfile(name);});
$('#shareProfileButton').addEventListener('click',shareCurrentProfile);
$('#importProfileFile').addEventListener('change',(e)=>importSharedProfile(e.target.files?.[0]));
$('#exportProfileBackup').addEventListener('click',()=>{saveData();const profile=appState.profiles.find((p)=>p.id===activeProfileId);downloadJSON({kind:'mis-turnos-planner',version:1,profileName:profile.name,planner:clone(data)},`perfil-${profile.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}.json`);showToast('Perfil exportado.');});

// Modo oscuro persistente (independiente de los perfiles).
const THEME_KEY='mis-turnos-theme-v1';
function applyTheme(theme){const dark=theme==='dark';document.body.classList.toggle('dark-mode',dark);const btn=$('#themeToggle');if(btn){btn.textContent=dark?'☀ Modo claro':'☾ Modo oscuro';btn.setAttribute('aria-pressed',String(dark));}const meta=$('#themeColorMeta');if(meta)meta.setAttribute('content',dark?'#111827':'#202b57');}
applyTheme(localStorage.getItem(THEME_KEY)||'light');
$('#themeToggle').addEventListener('click',()=>{const dark=!document.body.classList.contains('dark-mode');const theme=dark?'dark':'light';localStorage.setItem(THEME_KEY,theme);applyTheme(theme);});

// PWA instalación/actualización.
window.addEventListener('beforeinstallprompt',(event)=>{event.preventDefault();installPrompt=event;$('#installButton').hidden=false;});
$('#installButton').addEventListener('click',async()=>{if(!installPrompt)return;installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$('#installButton').hidden=true;});
window.addEventListener('appinstalled',()=>showToast('Aplicación instalada.'));
if('serviceWorker'in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then((reg)=>reg.update()).catch((e)=>console.warn('No se pudo registrar el service worker:',e)));
}
renderEverything();
