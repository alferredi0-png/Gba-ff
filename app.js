/* GBA Play — interfaz y mando táctil sobre EmulatorJS (https://emulatorjs.org)
 * Licencia MIT. No incluye ningún juego. */
(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);

  // Índices del joypad libretro (los que usa el núcleo mGBA de EmulatorJS)
  const BTN = { B: 0, SELECT: 2, START: 3, UP: 4, DOWN: 5, LEFT: 6, RIGHT: 7, A: 8, L: 10, R: 11 };
  const EMU_LOCAL = 'emulator/data/';                    // para uso sin internet (ver README)
  const EMU_CDN = 'https://cdn.emulatorjs.org/stable/data/';

  /* ---------- Guardado del juego elegido (IndexedDB) ---------- */
  const DB = 'gba-play', STORE = 'roms', KEY = 'last';
  const idb = () => new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  async function saveRom(file) {
    try {
      const db = await idb();
      db.transaction(STORE, 'readwrite').objectStore(STORE).put({ name: file.name, blob: file }, KEY);
    } catch (e) { console.warn('No se pudo guardar el juego', e); }
  }
  async function loadRom() {
    try {
      const db = await idb();
      return await new Promise((res) => {
        const q = db.transaction(STORE).objectStore(STORE).get(KEY);
        q.onsuccess = () => res(q.result || null);
        q.onerror = () => res(null);
      });
    } catch (e) { return null; }
  }

  /* ---------- Entrada: botones virtuales -> emulador ---------- */
  const held = {};
  function setBtn(name, down) {
    if (!!held[name] === down) return;
    held[name] = down;
    try {
      const gm = window.EJS_emulator && window.EJS_emulator.gameManager;
      if (gm) gm.simulateInput(0, BTN[name], down ? 1 : 0);
    } catch (e) { /* emulador aún no listo */ }
    if (down && navigator.vibrate) navigator.vibrate(8);
  }

  function bindButton(el) {
    const name = el.dataset.btn;
    const on = (e) => { e.preventDefault(); el.setPointerCapture(e.pointerId); el.classList.add('active'); setBtn(name, true); };
    const off = (e) => { e.preventDefault(); el.classList.remove('active'); setBtn(name, false); };
    el.addEventListener('pointerdown', on);
    el.addEventListener('pointerup', off);
    el.addEventListener('pointercancel', off);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  function bindDpad(el) {
    const arrows = {
      UP: el.querySelector('.up'), DOWN: el.querySelector('.down'),
      LEFT: el.querySelector('.left'), RIGHT: el.querySelector('.right'),
    };
    const DEAD = 0.28;
    const apply = (dirs) => {
      for (const k of Object.keys(arrows)) {
        setBtn(k, !!dirs[k]);
        arrows[k].classList.toggle('on', !!dirs[k]);
      }
    };
    const update = (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const y = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      const ax = Math.abs(x), ay = Math.abs(y);
      apply({
        LEFT: x < -DEAD && ax >= ay * 0.6,
        RIGHT: x > DEAD && ax >= ay * 0.6,
        UP: y < -DEAD && ay >= ax * 0.6,
        DOWN: y > DEAD && ay >= ax * 0.6,
      });
    };
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); el.setPointerCapture(e.pointerId); update(e); });
    el.addEventListener('pointermove', (e) => { if (el.hasPointerCapture(e.pointerId)) update(e); });
    const end = (e) => { e.preventDefault(); apply({}); };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /* ---------- Arranque del emulador ---------- */
  async function emulatorPath() {
    try {
      const r = await fetch(EMU_LOCAL + 'loader.js', { method: 'HEAD' });
      if (r.ok) return EMU_LOCAL;
    } catch (e) { /* sin copia local */ }
    return EMU_CDN;
  }

  const FILTERS = [
    { id: 'none', label: 'Original' },
    { id: '2xScaleHQ.glslp', label: 'Suavizado HD 2x' },
    { id: '4xScaleHQ.glslp', label: 'Suavizado HD 4x' },
    { id: 'sharp-bilinear-simple.glslp', label: 'Píxel nítido' },
  ];

  async function startGame(blob, name) {
    $('#menu').hidden = true;
    $('#player').hidden = false;
    $('#game-title').textContent = name.replace(/\.[^.]+$/, '');

    const path = await emulatorPath();
    const filter = localStorage.getItem('gba-filter') || '2xScaleHQ.glslp';

    window.EJS_player = '#game';
    window.EJS_core = 'gba';
    window.EJS_gameUrl = URL.createObjectURL(blob);
    window.EJS_gameName = name.replace(/\.[^.]+$/, '');
    window.EJS_pathtodata = path;
    window.EJS_startOnLoaded = true;
    window.EJS_color = '#7c5cff';
    window.EJS_threads = false;
    window.EJS_defaultOptions = filter === 'none' ? {} : { shader: filter };
    window.EJS_VirtualGamepadSettings = []; // sin mando virtual propio del emulador

    const s = document.createElement('script');
    s.src = path + 'loader.js';
    s.onerror = () => alert('No se pudo cargar el emulador. Comprueba tu conexión a internet.');
    document.body.appendChild(s);
  }

  /* ---------- Interfaz ---------- */
  document.querySelectorAll('[data-btn]').forEach(bindButton);
  bindDpad($('#dpad'));

  const fileInput = $('#file');
  $('#btn-pick').onclick = () => fileInput.click();
  fileInput.onchange = async () => {
    const f = fileInput.files[0];
    if (!f) return;
    await saveRom(f);
    startGame(f, f.name);
  };

  $('#btn-continue').onclick = async () => {
    const rec = await loadRom();
    if (rec) startGame(rec.blob, rec.name);
  };

  // Velocidad x4 (interruptor)
  const FF_RATIO = 4;
  let ffOn = false;
  $('#btn-ff').onclick = () => {
    const gm = window.EJS_emulator && window.EJS_emulator.gameManager;
    if (!gm) return;
    ffOn = !ffOn;
    try {
      if (gm.setFastForwardRatio) gm.setFastForwardRatio(FF_RATIO);
      gm.toggleFastForward(ffOn ? 1 : 0);
    } catch (e) { console.warn('Avance rápido no disponible', e); ffOn = false; }
    $('#btn-ff').classList.toggle('on', ffOn);
    $('#btn-ff').textContent = ffOn ? 'x4 ON' : 'x4';
    if (navigator.vibrate) navigator.vibrate(12);
  };

  $('#btn-back').onclick = () => location.reload(); // el emulador solo se inicia una vez por carga

  $('#btn-fs').onclick = () => {
    const d = document;
    if (d.fullscreenElement) d.exitFullscreen();
    else (d.documentElement.requestFullscreen || (() => {})).call(d.documentElement);
  };

  $('#btn-filter').onclick = () => {
    const cur = localStorage.getItem('gba-filter') || '2xScaleHQ.glslp';
    const i = FILTERS.findIndex((f) => f.id === cur);
    const next = FILTERS[(i + 1) % FILTERS.length];
    localStorage.setItem('gba-filter', next.id);
    if (confirm('Filtro: ' + next.label + '\nSe aplicará al reiniciar la app. ¿Reiniciar ahora?')) location.reload();
  };

  // Menú: ¿hay un juego guardado?
  loadRom().then((rec) => {
    if (!rec) return;
    $('#btn-continue').hidden = false;
    $('#continue-name').textContent = rec.name;
  });

  // Vista previa del diseño sin emulador:  index.html?preview
  if (location.search.includes('preview')) {
    $('#menu').hidden = true;
    $('#player').hidden = false;
    $('#game-title').textContent = 'Vista previa';
  }
})();
