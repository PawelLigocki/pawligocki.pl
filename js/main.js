// ===== NAWIGACJA MIĘDZY ZAKŁADKAMI =====
function showPage(pageId) {
  // Ukryj wszystkie strony
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  // Pokaż wybraną
  document.getElementById(pageId).classList.add('active');

  // Navbar: ukryj na hero, pokaż na reszcie
  const navbar = document.getElementById('navbar');
  if (pageId === 'home') {
    navbar.classList.remove('visible');
  } else {
    navbar.classList.add('visible');
  }

  // Podświetl aktywny przycisk w nav
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === pageId);
  });

  // Wróć na górę strony
  window.scrollTo(0, 0);
}

// Startujemy zawsze od hero
showPage('home');

// ===== KALKULATOR TEMPA =====

function pad(n) {
  return String(Math.floor(n)).padStart(2, '0');
}

function secsToHMS(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return h > 0
    ? `${h}:${pad(m)}:${pad(sec)}`
    : `${m}:${pad(sec)}`;
}

function setDistance(d) {
  document.getElementById('distance').value = d;
  document.querySelectorAll('.preset').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
}

function setDistance2(d) {
  document.getElementById('distance2').value = d;
}

function setRefDist(d) {
  window._refDist = d;
  event.target.closest('.preset-btns')
    .querySelectorAll('.preset')
    .forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
}

// Tempo → Czas
function calcTime() {
  const min = parseFloat(document.getElementById('pace-min').value) || 0;
  const sec = parseFloat(document.getElementById('pace-sec').value) || 0;
  const dist = parseFloat(document.getElementById('distance').value) || 0;

  if (!dist || (min === 0 && sec === 0)) {
    document.getElementById('time-output').textContent = 'Uzupełnij dane';
    return;
  }

  const paceSecs = min * 60 + sec;
  const totalSecs = paceSecs * dist;
  const kmh = (3600 / paceSecs).toFixed(1);

  document.getElementById('time-output').textContent = secsToHMS(totalSecs);
  document.getElementById('time-sub').textContent = `Prędkość: ${kmh} km/h`;
}

// Czas → Tempo
function calcPace() {
  const h = parseFloat(document.getElementById('finish-h').value) || 0;
  const m = parseFloat(document.getElementById('finish-m').value) || 0;
  const s = parseFloat(document.getElementById('finish-s').value) || 0;
  const dist = parseFloat(document.getElementById('distance2').value) || 0;

  if (!dist || (h === 0 && m === 0 && s === 0)) {
    document.getElementById('pace-output').textContent = 'Uzupełnij dane';
    return;
  }

  const totalSecs = h * 3600 + m * 60 + s;
  const paceSecs = totalSecs / dist;
  const paceMin = Math.floor(paceSecs / 60);
  const paceSec = Math.floor(paceSecs % 60);
  const kmh = (dist / (totalSecs / 3600)).toFixed(1);

  document.getElementById('pace-output').textContent = `${paceMin}:${pad(paceSec)} /km`;
  document.getElementById('pace-sub').textContent = `Prędkość: ${kmh} km/h`;
}

// Prognoza – wzór Riegel: T2 = T1 * (D2/D1)^1.06
function calcPredict() {
  const h = parseFloat(document.getElementById('ref-h').value) || 0;
  const m = parseFloat(document.getElementById('ref-m').value) || 0;
  const s = parseFloat(document.getElementById('ref-s').value) || 0;
  const refDist = window._refDist || 0;

  if (!refDist || (h === 0 && m === 0 && s === 0)) {
    document.getElementById('predict-grid').innerHTML =
      '<p style="color:var(--muted);font-size:.9rem">Uzupełnij wynik i wybierz dystans.</p>';
    return;
  }

  const refSecs = h * 3600 + m * 60 + s;
  const targets = [
    { label: '5 km',        dist: 5 },
    { label: '10 km',       dist: 10 },
    { label: 'Półmaraton',  dist: 21.097 },
    { label: 'Maraton',     dist: 42.195 },
  ];

  const html = targets.map(t => {
    const predSecs = refSecs * Math.pow(t.dist / refDist, 1.06);
    const paceSecs = predSecs / t.dist;
    const paceMin  = Math.floor(paceSecs / 60);
    const paceSec  = Math.floor(paceSecs % 60);
    const isRef    = Math.abs(t.dist - refDist) < 0.01;
    return `
      <div class="predict-card" ${isRef ? 'style="border-color:#1a1a1a"' : ''}>
        <span class="predict-dist">${t.label}${isRef ? ' ★' : ''}</span>
        <span class="predict-time">${secsToHMS(predSecs)}</span>
        <span class="predict-pace">${paceMin}:${pad(paceSec)} /km</span>
      </div>`;
  }).join('');

  document.getElementById('predict-grid').innerHTML = html;
}

// ===== LICZNIK WYDARZEŃ =====

// Twoje własne wydarzenia – edytuj tę listę
const MY_EVENTS = [
  {
    name:  'SuperHalf Gdańsk',
    date:  '2025-09-14',
    emoji: '🏃',
  },
  {
    name:  'Maraton Warszawski',
    date:  '2025-10-05',
    emoji: '🏅',
  },
  {
    name:  'Korona Gór Polski – Śnieżka',
    date:  '2025-07-20',
    emoji: '⛰️',
  },
];

function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pl-PL', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}

function renderMyEvents() {
  const grid = document.getElementById('my-events');
  if (!grid) return;

  const sorted = [...MY_EVENTS].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  grid.innerHTML = sorted.map(ev => {
    const days = daysUntil(ev.date);
    const past = days < 0;
    const label = past
      ? `${Math.abs(days)} dni temu`
      : days === 0 ? 'Dziś!' : 'dni pozostało';
    const displayDays = past ? Math.abs(days) : days;

    return `
      <div class="countdown-card ${past ? 'past' : ''}">
        <span class="countdown-emoji">${ev.emoji}</span>
        <span class="countdown-name">${ev.name}</span>
        <span class="countdown-date-label">${formatDate(ev.date)}</span>
        <span class="countdown-days">${days === 0 ? '🎉' : displayDays}</span>
        <span class="countdown-days-label">${label}</span>
      </div>`;
  }).join('');
}

// Licznik użytkownika
function createUserCountdown() {
  const name  = document.getElementById('user-event-name').value.trim();
  const date  = document.getElementById('user-event-date').value;
  const emoji = document.getElementById('user-event-emoji').value.trim() || '📅';

  if (!name || !date) {
    alert('Podaj nazwę i datę wydarzenia.');
    return;
  }

  const days = daysUntil(date);
  const past = days < 0;

  document.getElementById('user-countdown-display').textContent =
    past ? 'Wydarzenie minęło' : `${days} dni`;
  document.getElementById('user-countdown-sub').textContent =
    `${emoji} ${name} · ${formatDate(date)}`;

  // Generuj link z parametrami w URL
  const params = new URLSearchParams({ n: name, d: date, e: emoji });
  const link = `${window.location.origin}${window.location.pathname}?countdown#countdown&${params}`;
  document.getElementById('share-link').value = link;
  document.getElementById('user-countdown-result').style.display = 'block';
}

function copyLink() {
  const input = document.getElementById('share-link');
  navigator.clipboard.writeText(input.value).then(() => {
    const btn = document.getElementById('copy-btn');
    btn.textContent = 'Skopiowano!';
    setTimeout(() => btn.textContent = 'Kopiuj', 2000);
  });
}

// Wczytaj licznik z URL (gdy ktoś otworzy udostępniony link)
function loadCountdownFromURL() {
  const params = new URLSearchParams(window.location.search);
  if (!params.has('n') || !params.has('d')) return;

  const name  = params.get('n');
  const date  = params.get('d');
  const emoji = params.get('e') || '📅';

  document.getElementById('user-event-name').value  = name;
  document.getElementById('user-event-date').value  = date;
  document.getElementById('user-event-emoji').value = emoji;

  showPage('countdown');
  createUserCountdown();
}

// Uruchom po załadowaniu strony
renderMyEvents();
loadCountdownFromURL();

// ===== AKTYWNOŚCI STRAVA =====

const API = 'https://pawligockipl-production.up.railway.app';
let allActivities = [];

const ACTIVITY_ICONS = {
  Run:         '🏃',
  VirtualRide: '🚴',
  Ride:        '🚴',
  Swim:        '🏊',
  Workout:     '💪',
  Walk:        '🚶',
  Hike:        '🥾',
};

function activityIcon(type) {
  return ACTIVITY_ICONS[type] || '🏅';
}

function formatActivityDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pl-PL', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0
    ? `${h}h ${m}min`
    : `${m}min ${s}s`;
}

function renderActivities(list) {
  const container = document.getElementById('activities-list');
  if (!container) return;

  if (!list.length) {
    container.innerHTML = '<div class="activity-loading">Brak aktywności.</div>';
    return;
  }

  container.innerHTML = list.map(a => {
    const hasDistance = a.distance > 0;
    return `
      <div class="activity-item" data-type="${a.type}">
        <div class="activity-icon">${activityIcon(a.type)}</div>
        <div class="activity-main">
          <span class="activity-name">${a.name}</span>
          <div class="activity-meta">
            <span>${formatActivityDate(a.date)}</span>
            <span>${formatTime(a.moving_time)}</span>
            ${a.elevation ? `<span>↑ ${a.elevation} m</span>` : ''}
          </div>
        </div>
        <div class="activity-stats">
          <span class="activity-distance">
            ${hasDistance ? a.distance + ' km' : '—'}
          </span>
          ${a.pace && hasDistance
            ? `<span class="activity-pace">${a.pace} /km</span>`
            : ''}
          <span class="activity-kudos">♥ ${a.kudos}</span>
        </div>
      </div>`;
  }).join('');
}

function filterActivities(type, btn) {
  document.querySelectorAll('.activity-filters .preset')
    .forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const filtered = type === 'all'
    ? allActivities
    : allActivities.filter(a => a.type === type);

  renderActivities(filtered);
}

async function loadActivities() {
  try {
    const res = await fetch(`${API}/api/activities?per_page=20`);
    allActivities = await res.json();
    renderActivities(allActivities);
  } catch (err) {
    document.getElementById('activities-list').innerHTML =
      '<div class="activity-loading">Nie można pobrać aktywności. Sprawdź czy backend działa.</div>';
  }
}

async function loadStats() {
  try {
    const res = await fetch(`${API}/api/stats`);
    const s = await res.json();
    document.getElementById('stat-runs').textContent     = s.ytd_runs;
    document.getElementById('stat-distance').textContent = s.ytd_distance;
    document.getElementById('stat-elevation').textContent = s.ytd_elevation;
    document.getElementById('stat-all').textContent      = s.all_distance;
  } catch (err) {
    console.log('Błąd ładowania statystyk');
  }
}

// Ładuj dane gdy użytkownik wejdzie w zakładkę
const originalShowPage = showPage;
window.showPage = function(pageId) {
  originalShowPage(pageId);
  if (pageId === 'activities' && !allActivities.length) {
    loadActivities();
    loadStats();
  }
};

