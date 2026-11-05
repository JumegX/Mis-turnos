'use strict';

const STORAGE_KEY = 'mis-turnos-data-v1';
const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DEFAULT_DATA = {
  version: 1,
  mode: 'rotation',
  settings: { anchorFranco: '2026-11-03', firstShiftId: 'tarde', workDays: 5, restDays: 0 },
  shifts: [
    { id: 'manana', name: 'Mañana', start: '06:00', end: '12:00', color: '#DCEBFF' },
    { id: 'tarde', name: 'Tarde', start: '12:00', end: '18:00', color: '#DDF3E5' },
    { id: 'vespertino', name: 'Vespertino', start: '18:00', end: '23:00', color: '#FCE9CC' },
    { id: 'noche', name: 'Noche', start: '23:00', end: '06:00', color: '#E8E0FB' }
  ],
  colors: { franco: '#F7D7DE', descanso: '#DDE9EA', exit: '#FFF0C2' },
  fixedRules: [
    { type: 'none' }, { type: 'none' }, { type: 'none' }, { type: 'none' }, { type: 'none' }, { type: 'none' }, { type: 'none' }
  ],
  manualEntries: {}
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));
let data = loadData();
let visibleMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let selectedDate = isoDate(new Date());
let toastTimer = null;
let installPrompt = null;
let dialogEditingDate = null;

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return clone(DEFAULT_DATA);
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.shifts) || !parsed.settings) return clone(DEFAULT_DATA);
    return {
      ...clone(DEFAULT_DATA), ...parsed,
      settings: { ...clone(DEFAULT_DATA.settings), ...(parsed.settings || {}) },
      colors: { ...clone(DEFAULT_DATA.colors), ...(parsed.colors || {}) },
      fixedRules: Array.isArray(parsed.fixedRules) && parsed.fixedRules.length === 7 ? parsed.fixedRules : clone(DEFAULT_DATA.fixedRules),
      manualEntries: parsed.manualEntries && typeof parsed.manualEntries === 'object' ? parsed.manualEntries : {}
    };
  } catch (error) {
    console.warn('No se pudo leer el respaldo local:', error);
    return clone(DEFAULT_DATA);
  }
}
function saveData() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  catch (error) { showToast('No se pudieron guardar los cambios. Revisá el espacio disponible.'); }
}
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
function addDays(iso, days) {
  const date = dateFromISO(iso);
  date.setDate(date.getDate() + days);
  return isoDate(date);
}
function sameMonth(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth(); }
function formatLongDate(iso) {
  const date = dateFromISO(iso);
  return `${WEEKDAYS[date.getDay()]} ${date.getDate()} de ${MONTHS[date.getMonth()]} de ${date.getFullYear()}`;
}
function formatMonth(date) { return `${MONTHS[date.getMonth()].charAt(0).toUpperCase()}${MONTHS[date.getMonth()].slice(1)} ${date.getFullYear()}`; }
function shiftById(id) { return data.shifts.find((shift) => shift.id === id) || data.shifts[0] || null; }
function isOvernight(shift) {
  if (!shift || !shift.start || !shift.end) return false;
  return timeMinutes(shift.end) <= timeMinutes(shift.start);
}
function timeMinutes(value) {
  const [h, m] = String(value || '00:00').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}
function eventForShift(shift, note = '') {
  return shift ? { type: 'shift', shiftId: shift.id, note: note || '' } : null;
}
function rotationMap(endISO) {
  const map = new Map();
  const anchor = data.settings.anchorFranco;
  if (!anchor || endISO < anchor) return map;
  map.set(anchor, { type: 'franco', note: 'Franco de referencia' });
  if (!data.shifts.length) return map;
  let shiftIndex = Math.max(0, data.shifts.findIndex((shift) => shift.id === data.settings.firstShiftId));
  let cursor = addDays(anchor, 1);
  const workDays = Math.max(1, Math.min(31, Number(data.settings.workDays) || 5));
  const restDays = Math.max(0, Math.min(14, Number(data.settings.restDays) || 0));
  let guard = 0;
  while (cursor <= endISO && guard < 2000) {
    guard += 1;
    const shift = data.shifts[shiftIndex];
    if (!shift) break;
    for (let index = 0; index < workDays; index += 1) {
      map.set(cursor, eventForShift(shift));
      const isLastWorkDay = index === workDays - 1;
      if (isLastWorkDay && isOvernight(shift)) {
        const exitDate = addDays(cursor, 1);
        map.set(exitDate, { type: 'exit', note: `Salida ${shift.end}`, shiftId: shift.id });
      }
      cursor = addDays(cursor, 1);
    }
    if (isOvernight(shift)) cursor = addDays(cursor, 1); // Salida nocturna: no es franco.
    for (let rest = 0; rest < restDays; rest += 1) {
      map.set(cursor, { type: 'descanso', note: 'Descanso previo al franco' });
      cursor = addDays(cursor, 1);
    }
    map.set(cursor, { type: 'franco' });
    cursor = addDays(cursor, 1);
    shiftIndex = (shiftIndex + 1) % data.shifts.length;
  }
  return map;
}
function fixedMap(startISO, endISO) {
  const map = new Map();
  let cursor = startISO;
  while (cursor <= endISO) {
    const date = dateFromISO(cursor);
    const rule = data.fixedRules[date.getDay()] || { type: 'none' };
    if (rule.type === 'shift') {
      const shift = shiftById(rule.shiftId);
      if (shift) {
        map.set(cursor, eventForShift(shift));
        const nextDate = addDays(cursor, 1);
        const nextRule = data.fixedRules[dateFromISO(nextDate).getDay()] || { type: 'none' };
        if (isOvernight(shift) && nextRule.type === 'none') map.set(nextDate, { type: 'exit', shiftId: shift.id, note: `Salida ${shift.end}` });
      }
    } else if (rule.type === 'franco' || rule.type === 'descanso') {
      map.set(cursor, { type: rule.type });
    }
    cursor = addDays(cursor, 1);
  }
  return map;
}
function scheduleMap(startISO, endISO) {
  let map = new Map();
  if (data.mode === 'rotation') map = rotationMap(endISO);
  if (data.mode === 'fixed') map = fixedMap(startISO, endISO);
  for (const [date, event] of Object.entries(data.manualEntries)) map.set(date, event);
  return map;
}
function getEvent(dateISO) {
  if (data.mode === 'rotation') {
    const map = rotationMap(dateISO);
    const generated = map.get(dateISO) || null;
    return Object.prototype.hasOwnProperty.call(data.manualEntries, dateISO) ? data.manualEntries[dateISO] : generated;
  }
  if (data.mode === 'fixed') {
    // Miramos también el día anterior para detectar la salida de un turno nocturno fijo.
    const map = fixedMap(addDays(dateISO, -1), dateISO);
    const generated = map.get(dateISO) || null;
    return Object.prototype.hasOwnProperty.call(data.manualEntries, dateISO) ? data.manualEntries[dateISO] : generated;
  }
  return Object.prototype.hasOwnProperty.call(data.manualEntries, dateISO) ? data.manualEntries[dateISO] : null;
}
function eventTitle(event) {
  if (!event) return 'Sin turno cargado';
  if (event.type === 'franco') return 'FRANCO';
  if (event.type === 'descanso') return 'DESCANSO';
  if (event.type === 'exit') return event.note || `Salida ${shiftById(event.shiftId)?.end || 'del turno'}`;
  if (event.type === 'shift') {
    const shift = shiftById(event.shiftId);
    return shift ? `${shift.start}–${shift.end}` : 'Turno';
  }
  return 'Día cargado';
}
function eventName(event) {
  if (!event) return 'No hay actividad asignada para este día.';
  if (event.type === 'franco') return 'Día franco';
  if (event.type === 'descanso') return 'Día de descanso';
  if (event.type === 'exit') return `Salida de turno nocturno${event.shiftId && shiftById(event.shiftId) ? ` (${shiftById(event.shiftId).end})` : ''}. Este día no se considera franco.`;
  if (event.type === 'shift') {
    const shift = shiftById(event.shiftId);
    return shift ? `${shift.name}: ${shift.start} a ${shift.end}${isOvernight(shift) ? ' (finaliza al día siguiente)' : ''}.` : 'Turno de trabajo.';
  }
  return 'Actividad programada.';
}
function eventColor(event) {
  if (!event) return '';
  if (event.type === 'franco') return data.colors.franco;
  if (event.type === 'descanso') return data.colors.descanso;
  if (event.type === 'exit') return data.colors.exit;
  if (event.type === 'shift') return shiftById(event.shiftId)?.color || '#dbeafe';
  return '';
}
function hexToRgba(hex, alpha) {
  const clean = String(hex || '#ffffff').replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const value = Number.parseInt(full, 16);
  if (!Number.isFinite(value)) return `rgba(230,235,250,${alpha})`;
  return `rgba(${(value >> 16) & 255},${(value >> 8) & 255},${value & 255},${alpha})`;
}
function contrastColor(hex) {
  const rgba = hexToRgba(hex, 1).match(/\d+/g);
  if (!rgba) return '#293252';
  const [r, g, b] = rgba.map(Number);
  return (r * 299 + g * 587 + b * 114) / 1000 > 155 ? '#34405f' : '#ffffff';
}
function safeText(text) {
  return String(text ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
function modeLabel() {
  return data.mode === 'rotation' ? 'Rotación automática' : data.mode === 'fixed' ? 'Turnos fijos' : 'Carga manual';
}
function renderCalendar() {
  $('#monthTitle').textContent = formatMonth(visibleMonth);
  $('#modeBadge').textContent = modeLabel();
  const firstOfMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1, 12);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - startOffset);
  const cells = [];
  for (let index = 0; index < 42; index += 1) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    cells.push(isoDate(date));
  }
  const map = scheduleMap(cells[0], cells[cells.length - 1]);
  const today = isoDate(new Date());
  const counts = { shift: 0, franco: 0, descanso: 0 };
  const grid = $('#calendarGrid');
  grid.innerHTML = '';
  cells.forEach((dateISO) => {
    const event = map.get(dateISO) || null;
    const date = dateFromISO(dateISO);
    if (sameMonth(date, visibleMonth) && event && counts[event.type] !== undefined) counts[event.type] += 1;
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'day-cell';
    if (!sameMonth(date, visibleMonth)) cell.classList.add('outside-month');
    if (dateISO === selectedDate) cell.classList.add('selected');
    if (dateISO === today) cell.classList.add('today');
    cell.setAttribute('aria-label', `${formatLongDate(dateISO)}. ${event ? eventName(event) : 'Sin turno cargado'}`);
    const number = document.createElement('span');
    number.className = 'day-number';
    number.textContent = String(date.getDate());
    cell.appendChild(number);
    if (event) {
      const label = document.createElement('span');
      label.className = 'day-event';
      label.textContent = eventTitle(event);
      const color = eventColor(event);
      label.style.backgroundColor = color;
      label.style.color = contrastColor(color);
      cell.appendChild(label);
      if (event.note && !['franco', 'descanso'].includes(event.type)) {
        const note = document.createElement('span');
        note.className = 'event-note';
        note.textContent = event.note;
        cell.appendChild(note);
      }
      cell.style.borderTop = `3px solid ${color}`;
    } else {
      const empty = document.createElement('span');
      empty.className = 'empty-day';
      empty.textContent = '—';
      cell.appendChild(empty);
    }
    cell.addEventListener('click', () => {
      selectedDate = dateISO;
      if (!sameMonth(date, visibleMonth)) visibleMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      renderCalendar();
    });
    grid.appendChild(cell);
  });
  $('#monthSummary').innerHTML = `
    <div class="summary-item"><span>Turnos de trabajo</span><strong>${counts.shift}</strong></div>
    <div class="summary-item"><span>Francos</span><strong>${counts.franco}</strong></div>
    <div class="summary-item"><span>Descansos</span><strong>${counts.descanso}</strong></div>`;
  renderLegend();
  renderSelectedDay();
}
function renderLegend() {
  const entries = [
    ...data.shifts.map((shift) => ({ label: `${shift.name} (${shift.start}–${shift.end})`, color: shift.color })),
    { label: 'Franco', color: data.colors.franco },
    { label: 'Descanso', color: data.colors.descanso },
    { label: 'Salida', color: data.colors.exit }
  ];
  $('#calendarLegend').innerHTML = entries.map((item) => `<span class="legend-item"><i class="legend-dot" style="background:${safeText(item.color)}"></i>${safeText(item.label)}</span>`).join('');
}
function renderSelectedDay() {
  const event = getEvent(selectedDate);
  $('#selectedDateTitle').textContent = formatLongDate(selectedDate);
  let description = eventName(event);
  if (event?.note && !['Franco de referencia', 'Descanso previo al franco'].includes(event.note)) description += ` Aclaración: ${event.note}.`;
  if (Object.prototype.hasOwnProperty.call(data.manualEntries, selectedDate)) description += ' (Carga manual)';
  $('#selectedDescription').textContent = description;
}
function renderSettings() {
  $$('input[name="scheduleMode"]').forEach((radio) => { radio.checked = radio.value === data.mode; });
  $('#rotationSettings').classList.toggle('hidden', data.mode !== 'rotation');
  $('#fixedSettings').classList.toggle('hidden', data.mode !== 'fixed');
  $('#anchorFranco').value = data.settings.anchorFranco || '';
  $('#workDays').value = data.settings.workDays;
  $('#restDays').value = data.settings.restDays;
  $('#firstShift').innerHTML = data.shifts.map((shift) => `<option value="${safeText(shift.id)}">${safeText(shift.name)} (${safeText(shift.start)}–${safeText(shift.end)})</option>`).join('');
  $('#firstShift').value = data.settings.firstShiftId;
  renderFixedRules();
  renderShiftsEditor();
  renderSpecialColors();
}
function ruleValue(rule) {
  if (!rule || rule.type === 'none') return 'none';
  if (rule.type === 'franco' || rule.type === 'descanso') return rule.type;
  if (rule.type === 'shift') return `shift:${rule.shiftId}`;
  return 'none';
}
function parseRule(value) {
  if (value.startsWith('shift:')) return { type: 'shift', shiftId: value.slice(6) };
  if (['franco', 'descanso'].includes(value)) return { type: value };
  return { type: 'none' };
}
function renderFixedRules() {
  const names = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  $('#fixedRules').innerHTML = names.map((name, day) => {
    const options = [
      '<option value="none">Sin asignar</option>',
      '<option value="franco">Franco</option>',
      '<option value="descanso">Descanso</option>',
      ...data.shifts.map((shift) => `<option value="shift:${safeText(shift.id)}">${safeText(shift.name)} · ${safeText(shift.start)}–${safeText(shift.end)}</option>`)
    ].join('');
    return `<div class="fixed-rule"><label for="fixed-${day}">${name}</label><select id="fixed-${day}" data-fixed-day="${day}">${options}</select></div>`;
  }).join('');
  data.fixedRules.forEach((rule, day) => {
    const select = $(`#fixed-${day}`);
    if (select) select.value = ruleValue(rule);
  });
  $$('[data-fixed-day]').forEach((select) => select.addEventListener('change', () => {
    data.fixedRules[Number(select.dataset.fixedDay)] = parseRule(select.value);
    saveData(); renderCalendar();
  }));
}
function renderShiftsEditor() {
  $('#shiftsEditor').innerHTML = data.shifts.map((shift, index) => `
    <div class="shift-editor-card" data-shift-card="${safeText(shift.id)}">
      <label class="field"><span>Nombre del turno</span><input data-shift-field="name" value="${safeText(shift.name)}" maxlength="30"></label>
      <label class="field"><span>Desde</span><input data-shift-field="start" type="time" value="${safeText(shift.start)}"></label>
      <label class="field"><span>Hasta</span><input data-shift-field="end" type="time" value="${safeText(shift.end)}"></label>
      <label class="field"><span>Color</span><input data-shift-field="color" type="color" value="${safeText(shift.color)}"></label>
      <div class="move-controls"><button class="mini-button" type="button" data-move="up" title="Subir" ${index === 0 ? 'disabled' : ''}>↑</button><button class="mini-button" type="button" data-move="down" title="Bajar" ${index === data.shifts.length - 1 ? 'disabled' : ''}>↓</button><button class="mini-button delete-shift" type="button" data-delete-shift title="Eliminar turno" ${data.shifts.length <= 1 ? 'disabled' : ''}>×</button></div>
    </div>`).join('');
  $$('[data-shift-card]').forEach((card) => {
    const id = card.dataset.shiftCard;
    card.querySelectorAll('[data-shift-field]').forEach((input) => {
      input.addEventListener('change', () => {
        const shift = shiftById(id);
        if (!shift) return;
        shift[input.dataset.shiftField] = input.value;
        saveData();
        refreshShiftDependentControls();
        renderCalendar();
      });
    });
    card.querySelector('[data-move="up"]')?.addEventListener('click', () => moveShift(id, -1));
    card.querySelector('[data-move="down"]')?.addEventListener('click', () => moveShift(id, 1));
    card.querySelector('[data-delete-shift]')?.addEventListener('click', () => deleteShift(id));
  });
}
function refreshShiftDependentControls() {
  const firstShift = $('#firstShift');
  const currentFirst = data.settings.firstShiftId;
  firstShift.innerHTML = data.shifts.map((shift) => `<option value="${safeText(shift.id)}">${safeText(shift.name)} (${safeText(shift.start)}–${safeText(shift.end)})</option>`).join('');
  firstShift.value = currentFirst;
  renderFixedRules();
  renderCalendar();
}
function moveShift(id, direction) {
  const index = data.shifts.findIndex((shift) => shift.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= data.shifts.length) return;
  [data.shifts[index], data.shifts[target]] = [data.shifts[target], data.shifts[index]];
  saveData(); renderSettings(); renderCalendar();
}
function deleteShift(id) {
  if (data.shifts.length <= 1) return;
  data.shifts = data.shifts.filter((shift) => shift.id !== id);
  if (data.settings.firstShiftId === id) data.settings.firstShiftId = data.shifts[0].id;
  data.fixedRules = data.fixedRules.map((rule) => rule.type === 'shift' && rule.shiftId === id ? { type: 'none' } : rule);
  for (const event of Object.values(data.manualEntries)) if (event?.shiftId === id) event.shiftId = data.shifts[0].id;
  saveData(); renderSettings(); renderCalendar(); showToast('Turno eliminado.');
}
function renderSpecialColors() {
  const labels = { franco: 'Franco', descanso: 'Descanso', exit: 'Salida' };
  $('#specialColors').innerHTML = Object.entries(labels).map(([key, label]) => `
    <label class="color-setting"><span>${label}</span><input type="color" data-special-color="${key}" value="${safeText(data.colors[key])}"></label>`).join('');
  $$('[data-special-color]').forEach((input) => input.addEventListener('input', () => {
    data.colors[input.dataset.specialColor] = input.value;
    saveData(); renderCalendar();
  }));
}
function refreshAll() { saveData(); renderSettings(); renderCalendar(); }
function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}
function setView(viewId) {
  $$('.tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.view === viewId));
  $('#calendarView').classList.toggle('hidden', viewId !== 'calendarView');
  $('#settingsView').classList.toggle('hidden', viewId !== 'settingsView');
  if (viewId === 'settingsView') renderSettings();
}
function fillEventShiftOptions() {
  $('#eventShift').innerHTML = data.shifts.map((shift) => `<option value="${safeText(shift.id)}">${safeText(shift.name)} · ${safeText(shift.start)}–${safeText(shift.end)}</option>`).join('');
}
function updateEventTypeFields() {
  const type = $('#eventType').value;
  $('#eventShiftFields').classList.toggle('hidden', type !== 'shift');
  if (type === 'shift') {
    const shift = shiftById($('#eventShift').value);
    $('#autoExit').checked = Boolean(shift && isOvernight(shift));
  }
}
function openEventDialog(dateISO = selectedDate) {
  dialogEditingDate = dateISO;
  const current = getEvent(dateISO);
  const isManual = Object.prototype.hasOwnProperty.call(data.manualEntries, dateISO);
  $('#dialogTitle').textContent = isManual ? 'Editar carga manual' : current ? 'Modificar día' : 'Agregar día';
  $('#eventDate').value = dateISO;
  $('#eventNote').value = isManual ? (current?.note || '') : '';
  fillEventShiftOptions();
  const type = current?.type || 'shift';
  $('#eventType').value = ['shift', 'franco', 'descanso', 'exit'].includes(type) ? type : 'shift';
  if (current?.shiftId) $('#eventShift').value = current.shiftId;
  updateEventTypeFields();
  $('#deleteManualButton').hidden = !isManual;
  $('#eventDialog').showModal();
}
function closeEventDialog() { $('#eventDialog').close(); }
function submitEvent(event) {
  event.preventDefault();
  const dateISO = $('#eventDate').value;
  if (!dateISO) { showToast('Elegí una fecha.'); return; }
  const type = $('#eventType').value;
  let entry = { type, note: $('#eventNote').value.trim() };
  if (type === 'shift') {
    const shift = shiftById($('#eventShift').value);
    if (!shift) { showToast('Primero agregá un turno en Configuración.'); return; }
    entry.shiftId = shift.id;
  }
  if (type === 'exit') {
    const shift = shiftById($('#eventShift').value);
    if (shift) entry.shiftId = shift.id;
    if (!entry.note && shift) entry.note = `Salida ${shift.end}`;
  }
  // Si se cambia una carga nocturna previa, retiramos su salida automática anterior.
  const nextDate = addDays(dateISO, 1);
  if (data.manualEntries[nextDate]?.autoGeneratedFrom === dateISO) delete data.manualEntries[nextDate];
  data.manualEntries[dateISO] = entry;
  const shift = type === 'shift' ? shiftById(entry.shiftId) : null;
  if (type === 'shift' && shift && isOvernight(shift) && $('#autoExit').checked) {
    data.manualEntries[nextDate] = { type: 'exit', shiftId: shift.id, note: `Salida ${shift.end}`, autoGeneratedFrom: dateISO };
  }
  selectedDate = dateISO;
  const selected = dateFromISO(dateISO);
  visibleMonth = new Date(selected.getFullYear(), selected.getMonth(), 1);
  closeEventDialog();
  saveData(); renderCalendar(); showToast('Día guardado.');
}
function deleteManualEntry() {
  const dateISO = $('#eventDate').value;
  delete data.manualEntries[dateISO];
  const nextDate = addDays(dateISO, 1);
  if (data.manualEntries[nextDate]?.autoGeneratedFrom === dateISO) delete data.manualEntries[nextDate];
  closeEventDialog();
  saveData(); renderCalendar(); showToast('Se quitó la carga manual.');
}
function exportBackup() {
  const payload = { ...data, exportedAt: new Date().toISOString(), app: 'Mis Turnos' };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `respaldo-mis-turnos-${isoDate(new Date())}.json`;
  document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  showToast('Respaldo exportado.');
}
async function importBackup(file) {
  if (!file) return;
  try {
    const text = await file.text();
    const imported = JSON.parse(text);
    if (!imported || !Array.isArray(imported.shifts) || !imported.settings || !imported.manualEntries) throw new Error('Formato no válido');
    data = {
      ...clone(DEFAULT_DATA), ...imported,
      settings: { ...clone(DEFAULT_DATA.settings), ...(imported.settings || {}) },
      colors: { ...clone(DEFAULT_DATA.colors), ...(imported.colors || {}) },
      fixedRules: Array.isArray(imported.fixedRules) && imported.fixedRules.length === 7 ? imported.fixedRules : clone(DEFAULT_DATA.fixedRules),
      manualEntries: imported.manualEntries
    };
    if (!data.shifts.length) data.shifts = clone(DEFAULT_DATA.shifts);
    if (!data.shifts.some((shift) => shift.id === data.settings.firstShiftId)) data.settings.firstShiftId = data.shifts[0].id;
    saveData(); renderSettings(); renderCalendar(); showToast('Respaldo importado correctamente.');
  } catch (error) {
    showToast('No se pudo importar: el archivo no parece ser un respaldo válido.');
  } finally { $('#importFile').value = ''; }
}

// Navegación principal y calendario.
$$('.tab').forEach((tab) => tab.addEventListener('click', () => setView(tab.dataset.view)));
$('#prevMonth').addEventListener('click', () => { visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1); renderCalendar(); });
$('#nextMonth').addEventListener('click', () => { visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1); renderCalendar(); });
$('#todayButton').addEventListener('click', () => { const today = new Date(); visibleMonth = new Date(today.getFullYear(), today.getMonth(), 1); selectedDate = isoDate(today); renderCalendar(); });
$('#addEventButton').addEventListener('click', () => openEventDialog(selectedDate));
$('#editSelectedButton').addEventListener('click', () => openEventDialog(selectedDate));
$('#closeDialog').addEventListener('click', closeEventDialog);
$('#cancelDialog').addEventListener('click', closeEventDialog);
$('#eventForm').addEventListener('submit', submitEvent);
$('#eventType').addEventListener('change', updateEventTypeFields);
$('#eventShift').addEventListener('change', () => {
  const shift = shiftById($('#eventShift').value);
  $('#autoExit').checked = Boolean(shift && isOvernight(shift));
});
$('#deleteManualButton').addEventListener('click', deleteManualEntry);
$('#addShiftForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const name = $('#newShiftName').value.trim();
  const start = $('#newShiftStart').value;
  const end = $('#newShiftEnd').value;
  if (!name || !start || !end) return;
  const id = `turno-${Date.now().toString(36)}`;
  data.shifts.push({ id, name, start, end, color: $('#newShiftColor').value });
  if (!data.settings.firstShiftId) data.settings.firstShiftId = id;
  $('#newShiftName').value = '';
  saveData(); renderSettings(); renderCalendar(); showToast('Turno agregado.');
});
$$('input[name="scheduleMode"]').forEach((radio) => radio.addEventListener('change', () => {
  if (!radio.checked) return;
  data.mode = radio.value; saveData(); renderSettings(); renderCalendar();
}));
$('#anchorFranco').addEventListener('change', () => { data.settings.anchorFranco = $('#anchorFranco').value; refreshAll(); });
$('#firstShift').addEventListener('change', () => { data.settings.firstShiftId = $('#firstShift').value; refreshAll(); });
$('#workDays').addEventListener('change', () => { data.settings.workDays = Math.max(1, Math.min(31, Number($('#workDays').value) || 5)); refreshAll(); });
$('#restDays').addEventListener('change', () => { data.settings.restDays = Math.max(0, Math.min(14, Number($('#restDays').value) || 0)); refreshAll(); });
$('#exportButton').addEventListener('click', exportBackup);
$('#importFile').addEventListener('change', (event) => importBackup(event.target.files?.[0]));

// Instalación como PWA.
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault(); installPrompt = event; $('#installButton').hidden = false;
});
$('#installButton').addEventListener('click', async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null; $('#installButton').hidden = true;
});
window.addEventListener('appinstalled', () => showToast('Aplicación instalada.'));
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch((error) => console.warn('No se pudo registrar el service worker:', error)));
}

// Inicialización: se deja precargado el franco del 03/11/2026 y el bloque 12–18,
// de acuerdo con la última rotación calculada en esta conversación. Se puede cambiar.
renderCalendar();
