/* خريطة الكوكب — The Planet Crafter
   محرك: OpenLayers 6.15.1 (BSD)
   بيانات المواقع: خريطة المجتمع map.fistshake.net (حقائق إحداثيات، مع الإسناد)
   الأيقونات والواجهة: من تصميمنا. */
(function () {
  'use strict';

  const STORE = 'pc2';
  const TILE_BASE = 'https://map.fistshake.net/PlanetCrafter';
  const PIXEL_PROJECTION = new ol.proj.Projection({ code: 'pixels', units: 'pixels' });

  const PLANETS = {
    Prime:    { ar: 'برايم',     file: 'prime' },
    Humble:   { ar: 'هامبل',     file: 'humble' },
    Selenea:  { ar: 'سيلينيا',   file: 'selenea' },
    Aqualis:  { ar: 'أكواليس',   file: 'aqualis' },
    Toxicity: { ar: 'توكسيسيتي', file: 'toxicity' }
  };

  const CATS = {
    chest:   { ar: 'صناديق عادية',    color: '#3b9dff' },
    gold:    { ar: 'صناديق ذهبية',    color: '#f4b53f' },
    altar:   { ar: 'مذابح وشيفرات',   color: '#b97cff' },
    landing: { ar: 'مواقع هبوط',      color: '#ff7a59' },
    seed:    { ar: 'بذور ونباتات',    color: '#63d471' },
    supply:  { ar: 'مؤن وحطام',       color: '#94a3b8' },
    ore:     { ar: 'معادن وكوارتز',   color: '#2dd4bf' }
  };
  const CAT_ORDER = ['chest', 'gold', 'altar', 'landing', 'seed', 'supply', 'ore'];
  const TRACK = ['chest', 'gold', 'altar'];

  const GA = {
    Container1: 'صندوق مؤونة', Container2: 'خزانة معدات', GoldenContainer: 'صندوق ذهبي',
    WardenAustel: 'مذبح الحُرّاس', WardenAustelHidden: 'مذبح مخفي', BlueprintWardensChip: 'مذبح كاشف المفاتيح',
    Aluminium: 'ألمنيوم', Iridium: 'إيريديوم', Osmium: 'أوسميوم', Sulfur: 'كبريت', Zeolite: 'زيوليت',
    PulsarQuartz: 'كوارتز نابض', BalzarQuartz: 'كوارتز بلازار', SolarQuartz: 'كوارتز شمسي',
    MagnetarQuartz: 'كوارتز مغناطيسي', QuasarQuartz: 'كوارتز كوازار', Uranim: 'يورانيوم',
    Obsidian: 'أوبسيديان', Alloy: 'سبيكة خارقة', 'Rod-iridium': 'قضيب إيريديوم',
    Seed0: 'بذرة', Seed1: 'بذرة', Seed2: 'بذرة', Seed3: 'بذرة', Seed4: 'نبات توسكا', Seed5: 'بذرة',
    Seed6: 'بذرة', SeedGold: 'نبات ذهبي', Vegetable0Seed: 'بذور خضار', Vegetable1Seed: 'بذور خضار',
    Vegetable2Seed: 'بذور خضار', Tree1Seed: 'بذرة شجرة', Vegetube1: 'أنبوب نبات',
    canister: 'عبوة تخزين', OxygenCapsule1: 'كبسولة أكسجين', MethanCapsule1: 'كبسولة ميثان',
    FusionGenerator1: 'مفاعل اندماج', RocketReactor: 'محرك صاروخ', WreckSafe: 'خزنة حطام',
    WreckWardrobe: 'خزانة حطام', Server: 'خادم', Landing: 'موقع هبوط'
  };

  const GLYPHS = {
    chest: '<g fill="none" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"><rect x="7.4" y="9.5" width="11.2" height="8.2" rx="1.3"/><path d="M7.4 12.6h11.2M13 15.6v2.1"/></g>',
    gold: '<path d="M7.2 16.1l-1-7.1 4.2 3L13 7l2.6 5 4.2-3-1 7.1z" fill="#fff" opacity=".96"/><path d="M8.2 17.6h9.6" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>',
    altar: '<path d="M13 5.1l5.8 6.9-5.8 6.9-5.8-6.9z" fill="none" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/><circle cx="13" cy="12" r="1.7" fill="#fff"/>',
    ore: '<path d="M13 4.7l4.3 4.4-1.7 8.3H9.4L7.7 9.1z" fill="none" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/><path d="M13 4.7v6.6M7.7 9.1l5.3 2.2 5.3-2.2" fill="none" stroke="#fff" stroke-width="1"/>',
    seed: '<path d="M8.1 17.7c0-6.1 4.6-9.4 10.7-9.4 0 6.1-3.7 10.2-8.7 10.2-1.1 0-2-.3-2-.8z" fill="#fff" opacity=".94"/><path d="M8.8 17.4c1-3.5 3-5.7 6.5-7.1" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="1.2"/>',
    supply: '<g fill="none" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"><rect x="8.1" y="10.3" width="9.8" height="7.8" rx="1.2"/><path d="M10.6 10.3V8.1h4.8v2.2M8.1 13.4h9.8"/></g>',
    landing: '<g fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M13 4.8v7.3M9.8 9.2l3.2 3.2 3.2-3.2"/><path d="M7.3 18.1h11.4"/></g>'
  };

  const $ = id => document.getElementById(id);
  const appwrap = $('appwrap');
  const stage = $('stage');
  const planetSel = $('planetSel');
  const catsEl = $('cats');
  const progText = $('progText');
  const progBar = $('progBar');
  const progCats = $('progCats');
  const searchEl = $('search');
  const searchResults = $('searchResults');
  const pinListEl = $('pinList');
  const pinsCount = $('pinsCount');
  const popupEl = $('popup');
  const toastEl = $('toast');
  const loadingEl = $('loading');
  const loadingText = $('loadingText');
  const pinDlg = $('pinDlg');
  const pinTitle = $('pinTitle');
  const pinName = $('pinName');
  const pinNote = $('pinNote');
  const pinX = $('pinX');
  const pinZ = $('pinZ');
  const pinSave = $('pinSave');
  const pinDel = $('pinDel');
  const nearDlg = $('nearDlg');
  const nearX = $('nearX');
  const nearZ = $('nearZ');
  const nearResults = $('nearResults');

  const isCompact = new URLSearchParams(location.search).get('compact') === '1';
  const isMobile = () => window.matchMedia('(max-width: 900px)').matches;

  const state = {
    planet: 'Prime',
    data: null,
    cfg: null,
    counts: {},
    items: [],
    byId: new Map(),
    source: null,
    found: {},
    pins: {},
    hidden: new Set(['ore', 'seed', 'supply']),
    onlyUndiscovered: false,
    lush: false,
    showPins: true,
    pinMode: false,
    selectedId: null,
    popupItem: null,
    editingPin: null,
    lastNear: null,
    ready: false
  };

  /* ================= تخزين ================= */
  function loadJSON(key, def) {
    try {
      const raw = localStorage.getItem(STORE + '.' + key);
      return raw ? JSON.parse(raw) : def;
    } catch (e) { return def; }
  }
  function saveJSON(key, value) {
    try { localStorage.setItem(STORE + '.' + key, JSON.stringify(value)); } catch (e) {}
  }
  function loadPrefs() {
    const p = loadJSON('prefs', {}) || {};
    if (p.planet && PLANETS[p.planet]) state.planet = p.planet;
    if (Array.isArray(p.hidden)) state.hidden = new Set(p.hidden.filter(c => CATS[c]));
    state.onlyUndiscovered = !!p.onlyUndiscovered;
    state.lush = !!p.lush;
    state.showPins = p.showPins !== false;
    if (Array.isArray(p.lastNear)) state.lastNear = p.lastNear;
  }
  function savePrefs() {
    saveJSON('prefs', {
      planet: state.planet,
      hidden: [...state.hidden],
      onlyUndiscovered: state.onlyUndiscovered,
      lush: state.lush,
      showPins: state.showPins,
      lastNear: state.lastNear
    });
  }
  function ensureFound(planet) {
    if (!state.found[planet]) {
      const arr = loadJSON('found.' + planet, []);
      state.found[planet] = new Set(Array.isArray(arr) ? arr : []);
    }
    return state.found[planet];
  }
  function saveFound(planet) {
    saveJSON('found.' + planet, [...ensureFound(planet)]);
  }
  function ensurePins(planet) {
    if (!state.pins[planet]) {
      const arr = loadJSON('pins.' + planet, []);
      state.pins[planet] = Array.isArray(arr) ? arr.filter(p => p && isFinite(p.x) && isFinite(p.z)) : [];
    }
    return state.pins[planet];
  }
  function savePins(planet) {
    saveJSON('pins.' + planet, ensurePins(planet));
  }

  /* ================= أدوات ================= */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }
  function fmt(v) {
    if (!isFinite(v)) return '—';
    return (Math.round(v * 10) / 10).toLocaleString('en-US', { maximumFractionDigits: 1 });
  }
  function inputNum(v) {
    return isFinite(v) ? String(Math.round(v * 10) / 10) : '';
  }
  function normAr(s) {
    return String(s == null ? '' : s).toLowerCase()
      .replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/[ًٌٍَُِّْ]/g, '')
      .replace(/\s+/g, ' ').trim();
  }
  let toastTimer = null;
  function toast(msg, kind) {
    toastEl.textContent = msg;
    toastEl.className = kind === 'warn' ? 'show warn' : 'show';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.className = ''; }, 3200);
  }
  function closeDrawer() {
    if (isMobile() || isCompact) appwrap.classList.remove('sideOpen');
  }

  /* ================= أيقونات ================= */
  const iconCache = new Map();
  function iconBucket() {
    const r = map.getView().getResolution() || 1;
    if (r >= 5) return 0.62;
    if (r >= 3) return 0.74;
    if (r >= 1.6) return 0.88;
    return 1;
  }
  function markerIcon(cat, found, selected, bucket) {
    const key = cat + '|' + (found ? '1' : '0') + '|' + (selected ? '1' : '0') + '|' + bucket;
    if (iconCache.has(key)) return iconCache.get(key);
    const color = found ? '#20b26b' : (CATS[cat] ? CATS[cat].color : '#9bb7c8');
    const glyph = GLYPHS[cat] || GLYPHS.ore;
    const badge = found
      ? '<circle cx="19.6" cy="19.6" r="4.7" fill="#22c55e" stroke="#06121c" stroke-width="1.3"/>' +
        '<path d="M17.5 19.7l1.5 1.5 3-3.2" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>'
      : '';
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26">' +
      '<path d="M13 1.4l9.5 4.2v7.4c0 4.7-3.8 8.3-9.5 10.2C7.3 21.3 3.5 17.7 3.5 13V5.6L13 1.4z" fill="' + color + '" stroke="' + (found ? '#0b5c37' : '#04121c') + '" stroke-width="1.3"/>' +
      glyph + badge + '</svg>';
    const icon = new ol.style.Icon({
      src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg),
      anchor: [0.5, 0.5],
      scale: (selected ? 1.35 : 1) * bucket
    });
    iconCache.set(key, icon);
    return icon;
  }
  let pinIconBase = null;
  function pinIcon() {
    if (pinIconBase) return pinIconBase;
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">' +
      '<path d="M15 2.8c4.3 0 7.6 3.2 7.6 7.2 0 5.3-7.6 13.6-7.6 13.6S7.4 15.3 7.4 10c0-4 3.3-7.2 7.6-7.2z" fill="#ff5c8a" stroke="#3a0c1c" stroke-width="1.3"/>' +
      '<circle cx="15" cy="10" r="2.7" fill="#fff"/></svg>';
    pinIconBase = new ol.style.Icon({
      src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg),
      anchor: [0.5, 1]
    });
    return pinIconBase;
  }

  /* ================= الخريطة ================= */
  const barrenLayer = new ol.layer.Tile({ zIndex: 0 });
  const lushLayer = new ol.layer.Tile({ zIndex: 1, visible: false });
  const poiLayer = new ol.layer.Vector({
    zIndex: 10,
    updateWhileAnimating: false,
    updateWhileInteracting: false,
    style: function (feature) {
      const cat = feature.get('cat');
      if (!cat || state.hidden.has(cat)) return null;
      const id = feature.get('gid');
      const found = TRACK.indexOf(cat) >= 0 && ensureFound(state.planet).has(id);
      if (state.onlyUndiscovered && found) return null;
      const selected = state.selectedId === id;
      return new ol.style.Style({
        image: markerIcon(cat, found, selected, iconBucket()),
        zIndex: selected ? 500 : (found ? 1 : 2)
      });
    }
  });
  const meSource = new ol.source.Vector();
  const meLayer = new ol.layer.Vector({
    zIndex: 40,
    source: meSource,
    style: new ol.style.Style({
      image: new ol.style.Circle({
        radius: 8,
        fill: new ol.style.Fill({ color: '#ff3d6e' }),
        stroke: new ol.style.Stroke({ color: '#fff', width: 2 })
      }),
      text: new ol.style.Text({
        text: 'موقعي',
        offsetY: -17,
        font: '11px Tahoma, sans-serif',
        fill: new ol.style.Fill({ color: '#fff' }),
        stroke: new ol.style.Stroke({ color: '#210610', width: 3 })
      })
    })
  });
  const pinLayer = new ol.layer.Vector({
    zIndex: 30,
    style: function (feature) {
      return new ol.style.Style({ image: pinIcon(), zIndex: 10 });
    }
  });

  const initialRes = [25.6, 12.8, 6.4, 3.2, 1.6, 0.8, 0.4];
  const map = new ol.Map({
    target: 'map',
    layers: [barrenLayer, lushLayer, poiLayer, meLayer, pinLayer],
    view: new ol.View({
      projection: PIXEL_PROJECTION,
      center: [500, 500],
      resolutions: initialRes.slice()
    }),
    controls: ol.control.defaults({
      zoom: false,
      rotate: false,
      attribution: false
    }),
    interactions: ol.interaction.defaults({ altShiftDragRotate: false, pinchRotate: false })
  });

  const popupOverlay = new ol.Overlay({
    element: popupEl,
    positioning: 'bottom-center',
    offset: [0, -12],
    stopEvent: true
  });
  map.addOverlay(popupOverlay);

  /* ================= بلاطات الخريطة ================= */
  const tilebar = $('tilebar');
  let tilePending = 0;
  let tilebarTimer = null;
  function tileStart() {
    tilePending++;
    if (tilePending === 1) {
      clearTimeout(tilebarTimer);
      tilebarTimer = setTimeout(function () {
        if (tilePending > 0) tilebar.hidden = false;
      }, 180);
    }
  }
  function tileEnd() {
    tilePending = Math.max(0, tilePending - 1);
    if (tilePending === 0) {
      clearTimeout(tilebarTimer);
      tilebar.hidden = true;
    }
  }
  function watchTileSource(source) {
    source.on('tileloadstart', tileStart);
    source.on('tileloadend', tileEnd);
    source.on('tileloaderror', tileEnd);
  }
  function fitPlanet() {
    if (!state.cfg) return;
    map.getView().fit(state.cfg.extent, { padding: [26, 26, 26, 26], duration: 250 });
  }
  function makeTileSource(cfg, kind) {
    const ver = kind === 'lush' ? cfg.lush : cfg.barren;
    const name = kind === 'lush' ? 'Lush' : 'Barren';
    return new ol.source.TileImage({
      tileGrid: new ol.tilegrid.TileGrid({
        extent: cfg.extent,
        origin: cfg.origin,
        resolutions: cfg.resolutions,
        tileSize: [256, 256]
      }),
      tileUrlFunction: function (tileCoord) {
        const orig = TILE_BASE + '/Planet/' + cfg.planet + '/Tiles/' + name + '_' + ver + '/' +
          tileCoord[0] + '/' + tileCoord[1] + '/' + (-1 - tileCoord[2]) + '.png';
        return 'https://wsrv.nl/?url=' + encodeURIComponent(orig) + '&output=webp&q=88';
      },
      attributions: 'خريطة: <a href="https://map.fistshake.net/PlanetCrafter/" target="_blank" rel="noopener">map.fistshake.net</a>'
    });
  }

  /* ================= تحميل الكوكب ================= */
  let loadSeq = 0;
  function buildItems(data) {
    const totals = {};
    for (const row of data.items) totals[row[2]] = (totals[row[2]] || 0) + 1;
    const seen = {};
    const items = data.items.map(function (row) {
      const id = row[0], cat = row[1], grp = row[2], x = row[3], z = row[4];
      seen[grp] = (seen[grp] || 0) + 1;
      const base = GA[grp] || grp;
      const label = totals[grp] > 1 ? base + ' ' + seen[grp] : base;
      return { id, cat, grp, x, z, label, _s: normAr(label + ' ' + grp + ' ' + (CATS[cat] ? CATS[cat].ar : '')) };
    });
    (data.landings || []).forEach(function (row, i) {
      const x = row[0], z = row[1], name = row[2];
      const label = name && name !== 'Standard' ? name : 'هبوط قياسي';
      items.push({ id: 'L' + (i + 1), cat: 'landing', grp: 'Landing', x, z, label, _s: normAr(label + ' موقع هبوط ' + name) });
    });
    return items;
  }
  function buildPlanetSelect() {
    planetSel.innerHTML = Object.keys(PLANETS).map(function (p) {
      return '<option value="' + p + '">' + PLANETS[p].ar + '</option>';
    }).join('');
    planetSel.value = state.planet;
  }
  async function loadPlanet(name) {
    if (!PLANETS[name]) name = 'Prime';
    const seq = ++loadSeq;
    state.ready = false;
    state.planet = name;
    planetSel.value = name;
    loadingEl.hidden = false;
    loadingText.textContent = 'جارٍ تحميل ' + PLANETS[name].ar + '…';
    hidePopup();
    try {
      const res = await fetch('data/' + PLANETS[name].file + '.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (seq !== loadSeq) return;
      state.data = data;
      state.cfg = {
        planet: name,
        extent: data.extent,
        origin: [data.extent[0], data.extent[1]],
        resolutions: data.resolutions,
        barren: data.barren,
        lush: data.lush
      };
      state.counts = {};
      Object.keys(data.counts || {}).forEach(k => { state.counts[k] = data.counts[k]; });
      state.counts.landing = (data.landings || []).length;
      state.items = buildItems(data);
      state.byId = new Map();
      state.items.forEach(it => state.byId.set(it.id, it));

      const barrenSrc = makeTileSource(state.cfg, 'barren');
      const lushSrc = makeTileSource(state.cfg, 'lush');
      watchTileSource(barrenSrc);
      watchTileSource(lushSrc);
      barrenLayer.setSource(barrenSrc);
      lushLayer.setSource(lushSrc);
      barrenLayer.setVisible(!state.lush);
      lushLayer.setVisible(state.lush);

      const view = new ol.View({
        projection: PIXEL_PROJECTION,
        center: [(data.extent[0] + data.extent[2]) / 2, (data.extent[1] + data.extent[3]) / 2],
        resolutions: data.resolutions.slice()
      });
      map.setView(view);
      const mapSize = map.getSize();
      if (mapSize && mapSize[0] && mapSize[1]) {
        const coverRes = Math.min(
          (data.extent[2] - data.extent[0]) / mapSize[0],
          (data.extent[3] - data.extent[1]) / mapSize[1]
        );
        const minRes = data.resolutions[data.resolutions.length - 1];
        const maxRes = data.resolutions[0];
        view.setCenter([(data.extent[0] + data.extent[2]) / 2, (data.extent[1] + data.extent[3]) / 2]);
        view.setResolution(Math.max(minRes, Math.min(maxRes, coverRes)));
      } else {
        view.fit(data.extent, { padding: [26, 26, 26, 26] });
      }

      state.source = new ol.source.Vector({ features: state.items.map(toFeature) });
      poiLayer.setSource(state.source);
      meSource.clear();
      ensureFound(name);
      ensurePins(name);
      refreshPinSource();
      hidePopup();
      searchEl.value = '';
      searchResults.hidden = true;

      renderCats();
      renderProgress();
      renderPins();
      savePrefs();
      loadingEl.hidden = true;
      state.ready = true;
    } catch (err) {
      if (seq !== loadSeq) return;
      loadingText.innerHTML = 'تعذّر تحميل بيانات ' + esc(PLANETS[name].ar) + '.<br>تحقق من الاتصال ثم أعد المحاولة.<br><button id="btnReload" class="mini" style="margin-top:10px">إعادة المحاولة</button>';
      const b = $('btnReload');
      if (b) b.onclick = function () { loadPlanet(name); };
      toast('تعذّر تحميل بيانات الكوكب', 'warn');
    }
  }
  function toFeature(it) {
    const f = new ol.Feature({
      geometry: new ol.geom.Point([it.x, it.z]),
      gid: it.id,
      cat: it.cat,
      grp: it.grp,
      label: it.label
    });
    f.setId(state.planet + ':' + it.id);
    return f;
  }

  /* ================= العرض الجانبي ================= */
  function foundByCat() {
    const set = ensureFound(state.planet), out = {};
    for (const it of state.items) {
      if (set.has(it.id)) out[it.cat] = (out[it.cat] || 0) + 1;
    }
    return out;
  }
  function renderCats() {
    const fc = foundByCat();
    catsEl.innerHTML = CAT_ORDER.filter(cat => (state.counts[cat] || 0) > 0).map(function (cat) {
      const on = !state.hidden.has(cat);
      const total = state.counts[cat] || 0;
      const count = TRACK.indexOf(cat) >= 0 ? (fc[cat] || 0) + '/' + total : String(total);
      return '<label class="catrow' + (on ? '' : ' off') + '">' +
        '<input type="checkbox" data-cat="' + cat + '"' + (on ? ' checked' : '') + '>' +
        '<span class="dot" style="--c:' + CATS[cat].color + '"></span>' +
        '<span class="catname">' + esc(CATS[cat].ar) + '</span>' +
        '<span class="catcount num">' + count + '</span>' +
        '</label>';
    }).join('');
  }
  function renderProgress() {
    const fc = foundByCat();
    let total = 0, got = 0;
    const rows = [];
    for (const cat of TRACK) {
      const t = state.counts[cat] || 0;
      if (!t) continue;
      const f = fc[cat] || 0;
      total += t; got += f;
      rows.push('<div class="progcat"><span class="dot" style="--c:' + CATS[cat].color + '"></span>' +
        '<span>' + esc(CATS[cat].ar) + '</span><b class="num" dir="ltr">' + f + ' / ' + t + '</b></div>');
    }
    progText.textContent = got + ' / ' + total;
    progBar.style.width = total ? Math.round(got * 100 / total) + '%' : '0%';
    progCats.innerHTML = rows.join('');
  }
  function renderPins() {
    const pins = ensurePins(state.planet);
    pinsCount.textContent = pins.length + ' دبوس';
    if (!pins.length) {
      pinListEl.innerHTML = '<div class="empty">لا دبابيس في هذا الكوكب بعد</div>';
      return;
    }
    pinListEl.innerHTML = pins.map(function (p) {
      return '<div class="pinrow" data-id="' + esc(p.id) + '">' +
        '<span class="pin-dot"></span>' +
        '<div class="pin-info"><b>' + esc(p.name || 'دبوس') + '</b>' +
        '<small>X ' + fmt(p.x) + ' · Z ' + fmt(p.z) + (p.note ? ' · ' + esc(p.note) : '') + '</small></div>' +
        '<button class="mini" data-act="edit">تعديل</button>' +
        '<button class="mini" data-act="del">حذف</button>' +
        '</div>';
    }).join('');
  }
  function refreshPinSource() {
    const pins = ensurePins(state.planet);
    const features = pins.map(function (p) {
      const f = new ol.Feature({
        geometry: new ol.geom.Point([p.x, p.z]),
        kind: 'pin',
        pinid: p.id,
        label: p.name || 'دبوس'
      });
      f.setId('pin:' + state.planet + ':' + p.id);
      return f;
    });
    pinLayer.setSource(new ol.source.Vector({ features }));
    pinLayer.setVisible(state.showPins);
    const b = $('btnPinsToggle');
    b.textContent = state.showPins ? 'إخفاء' : 'إظهار';
    b.setAttribute('aria-pressed', state.showPins ? 'true' : 'false');
  }

  /* ================= البحث ================= */
  function hideSearchResults() {
    searchResults.hidden = true;
    searchResults.innerHTML = '';
  }
  function renderSearchResults() {
    const q = normAr(searchEl.value);
    if (!q) { hideSearchResults(); return; }
    const out = [];
    for (const it of state.items) {
      if (it._s.indexOf(q) >= 0) {
        out.push({ kind: 'poi', it });
        if (out.length >= 26) break;
      }
    }
    const pins = ensurePins(state.planet);
    for (const p of pins) {
      if (normAr((p.name || '') + ' ' + (p.note || '')).indexOf(q) >= 0) out.push({ kind: 'pin', p });
    }
    if (!out.length) {
      searchResults.hidden = false;
      searchResults.innerHTML = '<div class="empty">لا نتائج مطابقة</div>';
      return;
    }
    searchResults.hidden = false;
    searchResults.innerHTML = out.slice(0, 30).map(function (o) {
      if (o.kind === 'pin') {
        return '<button class="res" data-kind="pin" data-id="' + esc(o.p.id) + '">' +
          '<span class="pin-dot"></span><span class="resmain"><b>' + esc(o.p.name || 'دبوس') + '</b>' +
          '<small>دبوسي · X ' + fmt(o.p.x) + ' · Z ' + fmt(o.p.z) + '</small></span></button>';
      }
      const it = o.it;
      return '<button class="res" data-kind="poi" data-id="' + esc(it.id) + '">' +
        '<span class="dot" style="--c:' + CATS[it.cat].color + '"></span>' +
        '<span class="resmain"><b>' + esc(it.label) + '</b>' +
        '<small>' + esc(CATS[it.cat].ar) + ' · X ' + fmt(it.x) + ' · Z ' + fmt(it.z) + '</small></span>' +
        '</button>';
    }).join('');
  }

  /* ================= التركيز على موقع ================= */
  function enableCat(cat) {
    if (!state.hidden.has(cat)) return;
    state.hidden.delete(cat);
    savePrefs();
    renderCats();
    poiLayer.changed();
  }
  function focusItem(it) {
    if (!it) return;
    enableCat(it.cat);
    const view = map.getView();
    const cur = view.getResolution() || 2;
    closeDrawer();
    view.animate({ center: [it.x, it.z], resolution: Math.min(cur, 1.6), duration: 260 });
    const planet = state.planet;
    setTimeout(function () {
      if (state.planet !== planet) return;
      const f = state.source && state.source.getFeatureById(planet + ':' + it.id);
      if (f) showPopup(f);
    }, 300);
  }
  function focusPin(pin) {
    if (!pin) return;
    const view = map.getView();
    const cur = view.getResolution() || 1.2;
    closeDrawer();
    view.animate({ center: [pin.x, pin.z], resolution: Math.min(cur, 1.2), duration: 260 });
  }

  /* ================= فقاعة الموقع ================= */
  function showPopup(feature) {
    const it = state.byId.get(feature.get('gid'));
    if (!it) return;
    state.popupItem = it;
    state.selectedId = it.id;
    const found = TRACK.indexOf(it.cat) >= 0 && ensureFound(state.planet).has(it.id);
    const cat = CATS[it.cat] || { ar: it.cat, color: '#9bb7c8' };
    const group = it.cat === 'landing' ? 'موقع هبوط' : (GA[it.grp] || it.grp);
    popupEl.innerHTML = '<div class="pp">' +
      '<div class="pp-top"><span class="dot" style="--c:' + cat.color + '"></span>' +
      '<div class="pp-title"><b>' + esc(it.label) + '</b><small>' + esc(cat.ar) + ' · ' + esc(group) + '</small></div>' +
      '<button class="xbtn" data-act="close" aria-label="إغلاق">×</button></div>' +
      '<div class="pp-coords num">X ' + fmt(it.x) + ' &nbsp;·&nbsp; Z ' + fmt(it.z) + '</div>' +
      (TRACK.indexOf(it.cat) >= 0
        ? '<div class="pp-state ' + (found ? 'on' : 'off') + '">' + (found ? 'مسجّل كمُجمَّع' : 'غير مُجمَّع') + '</div>'
        : '') +
      '<div class="pp-btns">' +
      (TRACK.indexOf(it.cat) >= 0
        ? '<button class="pp-btn ' + (found ? 'done' : '') + '" data-act="toggle">' + (found ? '↺ تراجع عن التسجيل' : '✓ تم التجميع') + '</button>'
        : '') +
      '<button class="pp-btn ghost" data-act="pin">دبوس هنا</button>' +
      '</div></div>';
    popupEl.hidden = false;
    popupOverlay.setPosition(feature.getGeometry().getCoordinates());
    ensurePopupVisible();
    poiLayer.changed();
  }
  function ensurePopupVisible() {
    if (popupEl.hidden) return;
    const size = map.getSize();
    const pos = popupOverlay.getPosition();
    if (!size || !pos) return;
    const p = map.getPixelFromCoordinate(pos);
    if (!p) return;
    const w = popupEl.offsetWidth || 240;
    const h = popupEl.offsetHeight || 140;
    const m = 10;
    const left = p[0] - w / 2;
    const right = p[0] + w / 2;
    const bottom = p[1] - 12;
    const top = bottom - h;
    let panX = 0, panY = 0;
    if (left < m) panX = left - m;
    else if (right > size[0] - m) panX = right - (size[0] - m);
    if (top < m) panY = top - m;
    else if (bottom > size[1] - m) panY = bottom - (size[1] - m);
    if (panX || panY) {
      const c = map.getCoordinateFromPixel([size[0] / 2 + panX, size[1] / 2 + panY]);
      map.getView().setCenter(c);
    }
  }
  function hidePopup() {
    popupEl.hidden = true;
    popupEl.innerHTML = '';
    popupOverlay.setPosition(undefined);
    state.popupItem = null;
    state.selectedId = null;
    poiLayer.changed();
  }
  function toggleFound(id) {
    const set = ensureFound(state.planet);
    const now = !set.has(id);
    if (now) set.add(id); else set.delete(id);
    saveFound(state.planet);
    renderProgress();
    renderCats();
    const f = state.source && state.source.getFeatureById(state.planet + ':' + id);
    if (f) showPopup(f); else hidePopup();
    toast(now ? 'سُجّل الموقع كمُجمَّع' : 'أُزيل تسجيل الموقع');
  }

  /* ================= الدبابيس ================= */
  function openPinDialog(x, z, pin) {
    state.editingPin = pin || null;
    pinTitle.textContent = pin ? 'تعديل الدبوس' : 'دبوس جديد';
    pinName.value = pin ? (pin.name || '') : '';
    pinNote.value = pin ? (pin.note || '') : '';
    pinX.value = pin ? inputNum(pin.x) : inputNum(x);
    pinZ.value = pin ? inputNum(pin.z) : inputNum(z);
    pinDel.hidden = !pin;
    if (pinDlg.open) pinDlg.close();
    pinDlg.showModal();
    setTimeout(function () { pinName.focus(); }, 40);
  }
  function startPinMode() {
    if (state.pinMode) { stopPinMode(); return; }
    state.pinMode = true;
    appwrap.classList.add('pinmode');
    closeDrawer();
    toast('اضغط على الموقع المطلوب في الخريطة لوضع الدبوس');
  }
  function stopPinMode() {
    state.pinMode = false;
    appwrap.classList.remove('pinmode');
  }
  function savePinFromDialog() {
    const name = pinName.value.trim() || 'دبوس';
    const note = pinNote.value.trim();
    const x = parseFloat(pinX.value);
    const z = parseFloat(pinZ.value);
    if (!isFinite(x) || !isFinite(z)) { toast('أدخل إحداثيات صحيحة', 'warn'); return; }
    const pins = ensurePins(state.planet);
    if (state.editingPin) {
      const p = pins.find(v => v.id === state.editingPin.id);
      if (p) { p.name = name; p.note = note; p.x = x; p.z = z; }
    } else {
      pins.push({ id: 'p' + Date.now().toString(36) + Math.floor(Math.random() * 90 + 10), name, note, x, z });
    }
    savePins(state.planet);
    refreshPinSource();
    renderPins();
    pinDlg.close();
    focusPin({ x, z });
    toast('حُفظ الدبوس');
  }
  function deleteEditingPin() {
    if (!state.editingPin) return;
    if (!confirm('حذف الدبوس «' + (state.editingPin.name || 'دبوس') + '»؟')) return;
    const pins = ensurePins(state.planet);
    const i = pins.findIndex(v => v.id === state.editingPin.id);
    if (i >= 0) pins.splice(i, 1);
    savePins(state.planet);
    refreshPinSource();
    renderPins();
    pinDlg.close();
    toast('حُذف الدبوس');
  }

  /* ================= أقرب المواقع ================= */
  function openNear() {
    nearX.value = state.lastNear ? inputNum(state.lastNear[0]) : inputNum(map.getView().getCenter()[0]);
    nearZ.value = state.lastNear ? inputNum(state.lastNear[1]) : inputNum(map.getView().getCenter()[1]);
    nearResults.innerHTML = '';
    if (!nearDlg.open) nearDlg.showModal();
  }
  function computeNear() {
    const x = parseFloat(nearX.value), z = parseFloat(nearZ.value);
    if (!isFinite(x) || !isFinite(z)) { toast('أدخل إحداثيات X و Z', 'warn'); return; }
    state.lastNear = [x, z];
    savePrefs();
    const view = map.getView();
    view.animate({ center: [x, z], resolution: Math.min(view.getResolution() || 2, 1.6), duration: 260 });
    meSource.clear();
    meSource.addFeature(new ol.Feature({ geometry: new ol.geom.Point([x, z]) }));
    const arr = state.items
      .filter(it => it.cat !== 'ore')
      .map(it => ({ it, d: Math.hypot(it.x - x, it.z - z) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 20);
    nearResults.innerHTML = arr.map(function (row) {
      const it = row.it;
      return '<button class="res" data-id="' + esc(it.id) + '">' +
        '<span class="dot" style="--c:' + CATS[it.cat].color + '"></span>' +
        '<span class="resmain"><b>' + esc(it.label) + '</b>' +
        '<small>' + esc(CATS[it.cat].ar) + ' · X ' + fmt(it.x) + ' · Z ' + fmt(it.z) + '</small></span>' +
        '<span class="resgo num" dir="ltr">' + Math.round(row.d) + ' م</span></button>';
    }).join('') || '<div class="empty">لا مواقع ضمن البيانات</div>';
  }

  /* ================= التصدير والاستيراد ================= */
  function exportData() {
    const found = {}, pins = {};
    for (const p of Object.keys(PLANETS)) {
      ensureFound(p); ensurePins(p);
      found[p] = [...state.found[p]];
      pins[p] = state.pins[p];
    }
    const blob = new Blob([JSON.stringify({ app: 'pcmap', version: 2, exported: new Date().toISOString(), found, pins }, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'pcmap-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    toast('نُزّلت نسخة من بياناتك');
  }
  async function importData(file) {
    try {
      const obj = JSON.parse(await file.text());
      let nf = 0, np = 0;
      if (obj && obj.found && typeof obj.found === 'object') {
        for (const p of Object.keys(obj.found)) {
          if (!PLANETS[p] || !Array.isArray(obj.found[p])) continue;
          const set = ensureFound(p);
          for (const id of obj.found[p]) if (typeof id === 'string' && !set.has(id)) { set.add(id); nf++; }
          saveFound(p);
        }
      }
      if (obj && obj.pins && typeof obj.pins === 'object') {
        for (const p of Object.keys(obj.pins)) {
          if (!PLANETS[p] || !Array.isArray(obj.pins[p])) continue;
          const pins = ensurePins(p);
          for (const pin of obj.pins[p]) {
            if (!pin || !isFinite(pin.x) || !isFinite(pin.z)) continue;
            if (pins.some(v => v.id === pin.id)) continue;
            pins.push({
              id: pin.id || ('p' + Date.now().toString(36) + Math.floor(Math.random() * 900 + 100)),
              name: String(pin.name || 'دبوس').slice(0, 60),
              note: String(pin.note || '').slice(0, 300),
              x: +pin.x, z: +pin.z
            });
            np++;
          }
          savePins(p);
        }
      }
      renderProgress(); renderCats(); refreshPinSource(); renderPins();
      toast('استُوردت ' + nf + ' علامة و' + np + ' دبوس');
    } catch (e) {
      toast('ملف غير صالح', 'warn');
    }
  }

  /* ================= نافذة فوق اللعبة ================= */
  function openOverlay() {
    const w = window.open(location.pathname + '?compact=1', 'pcmapOverlay', 'popup=yes,width=520,height=800');
    if (!w) toast('اسمح بالنوافذ المنبثقة ثم أعد المحاولة', 'warn');
  }
  function copyStylesTo(win) {
    document.querySelectorAll('link[rel="stylesheet"]').forEach(function (l) {
      const c = win.document.createElement('link');
      c.rel = 'stylesheet';
      c.href = l.href;
      win.document.head.appendChild(c);
    });
    document.querySelectorAll('style').forEach(function (s) {
      const c = win.document.createElement('style');
      c.textContent = s.textContent;
      win.document.head.appendChild(c);
    });
  }
  let pipWin = null;
  async function enterPip() {
    if (pipWin) return;
    const dpip = window.documentPictureInPicture;
    if (!dpip || !dpip.requestWindow) {
      toast('التثبيت فوق النوافذ مدعوم في Chrome أو Edge على الحاسوب', 'warn');
      return;
    }
    try {
      const win = await dpip.requestWindow({
        width: Math.max(380, Math.round((window.innerWidth || 500) * 0.5)),
        height: Math.max(560, Math.round((window.innerHeight || 800) * 0.82))
      });
      pipWin = win;
      copyStylesTo(win);
      win.document.documentElement.lang = 'ar';
      win.document.documentElement.dir = 'rtl';
      win.document.documentElement.style.height = '100%';
      win.document.body.style.margin = '0';
      win.document.body.style.height = '100%';
      win.document.body.style.background = '#06111a';
      win.document.body.appendChild(appwrap);
      const b = $('btnPip');
      b.textContent = 'مثبتة فوق النوافذ';
      b.disabled = true;
      setTimeout(function () { map.updateSize(); }, 80);
      win.addEventListener('resize', function () { map.updateSize(); });
      win.addEventListener('pagehide', function () {
        document.body.appendChild(appwrap);
        pipWin = null;
        const btn = $('btnPip');
        btn.textContent = 'ثبّت فوق اللعبة';
        btn.disabled = false;
        setTimeout(function () { map.updateSize(); }, 80);
      });
      toast('النافذة مثبتة فوق النوافذ');
    } catch (e) {
      toast('تعذّر فتح نافذة التثبيت', 'warn');
    }
  }

  /* ================= ربط الواجهة ================= */
  function bindUI() {
    if (isCompact) {
      appwrap.classList.add('compact');
      $('btnPip').hidden = false;
    }

    planetSel.addEventListener('change', function () {
      loadPlanet(planetSel.value);
    });
    $('btnMenu').addEventListener('click', function () { appwrap.classList.toggle('sideOpen'); });
    $('drawerBackdrop').addEventListener('click', function () { appwrap.classList.remove('sideOpen'); });

    catsEl.addEventListener('change', function (e) {
      const cb = e.target.closest('input[data-cat]');
      if (!cb) return;
      if (cb.checked) state.hidden.delete(cb.dataset.cat);
      else state.hidden.add(cb.dataset.cat);
      savePrefs();
      renderCats();
      poiLayer.changed();
    });
    $('btnAllCats').addEventListener('click', function () {
      state.hidden.clear();
      savePrefs();
      renderCats();
      poiLayer.changed();
    });
    $('onlyUndiscovered').addEventListener('change', function (e) {
      state.onlyUndiscovered = e.target.checked;
      savePrefs();
      poiLayer.changed();
    });
    $('lushToggle').addEventListener('change', function (e) {
      state.lush = e.target.checked;
      barrenLayer.setVisible(!state.lush);
      lushLayer.setVisible(state.lush);
      savePrefs();
    });
    $('btnZoomIn').addEventListener('click', function () { map.getView().adjustZoom(1, { duration: 180 }); });
    $('btnZoomOut').addEventListener('click', function () { map.getView().adjustZoom(-1, { duration: 180 }); });
    $('btnFit').addEventListener('click', fitPlanet);

    searchEl.addEventListener('input', renderSearchResults);
    searchEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        const first = searchResults.querySelector('.res');
        if (first) first.click();
      }
    });
    searchResults.addEventListener('click', function (e) {
      const btn = e.target.closest('.res');
      if (!btn || !btn.dataset.id) return;
      if (btn.dataset.kind === 'pin') {
        const pin = ensurePins(state.planet).find(p => p.id === btn.dataset.id);
        if (pin) { hideSearchResults(); focusPin(pin); openPinDialog(pin.x, pin.z, pin); }
      } else {
        const it = state.byId.get(btn.dataset.id);
        if (it) { hideSearchResults(); focusItem(it); }
      }
    });

    $('btnAddPin').addEventListener('click', startPinMode);
    $('btnAddPinTop').addEventListener('click', startPinMode);
    $('btnPinsToggle').addEventListener('click', function () {
      state.showPins = !state.showPins;
      pinLayer.setVisible(state.showPins);
      savePrefs();
      refreshPinSource();
    });
    pinListEl.addEventListener('click', function (e) {
      const row = e.target.closest('.pinrow');
      if (!row) return;
      const pin = ensurePins(state.planet).find(p => p.id === row.dataset.id);
      if (!pin) return;
      const act = e.target.closest('[data-act]');
      if (act && act.dataset.act === 'del') {
        if (!confirm('حذف الدبوس «' + (pin.name || 'دبوس') + '»؟')) return;
        const pins = ensurePins(state.planet);
        const i = pins.findIndex(p => p.id === pin.id);
        if (i >= 0) pins.splice(i, 1);
        savePins(state.planet);
        refreshPinSource();
        renderPins();
        toast('حُذف الدبوس');
      } else if (act && act.dataset.act === 'edit') {
        openPinDialog(pin.x, pin.z, pin);
      } else {
        focusPin(pin);
        closeDrawer();
      }
    });

    $('btnExport').addEventListener('click', exportData);
    $('btnImport').addEventListener('click', function () { $('importFile').click(); });
    $('importFile').addEventListener('change', function (e) {
      const f = e.target.files && e.target.files[0];
      if (f) importData(f);
      e.target.value = '';
    });

    $('btnNear').addEventListener('click', function () { closeDrawer(); openNear(); });
    $('btnNearest').addEventListener('click', openNear);
    $('nearCloseX').addEventListener('click', function () { nearDlg.close(); });
    $('nearGo').addEventListener('click', computeNear);
    nearX.addEventListener('keydown', function (e) { if (e.key === 'Enter') computeNear(); });
    nearZ.addEventListener('keydown', function (e) { if (e.key === 'Enter') computeNear(); });
    nearResults.addEventListener('click', function (e) {
      const btn = e.target.closest('.res[data-id]');
      if (!btn) return;
      const it = state.byId.get(btn.dataset.id);
      nearDlg.close();
      if (it) focusItem(it);
    });

    pinSave.addEventListener('click', savePinFromDialog);
    pinCancel.addEventListener('click', function () { pinDlg.close(); });
    $('pinCancelX').addEventListener('click', function () { pinDlg.close(); });
    pinDel.addEventListener('click', deleteEditingPin);
    pinDlg.addEventListener('click', function (e) {
      if (e.target === pinDlg) pinDlg.close();
    });
    nearDlg.addEventListener('click', function (e) {
      if (e.target === nearDlg) nearDlg.close();
    });

    popupEl.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      const act = btn.dataset.act;
      if (act === 'close') { hidePopup(); return; }
      if (!state.popupItem) return;
      if (act === 'toggle') { toggleFound(state.popupItem.id); return; }
      if (act === 'pin') {
        const it = state.popupItem;
        hidePopup();
        openPinDialog(it.x, it.z, null);
      }
    });

    $('btnOverlay').addEventListener('click', openOverlay);
    $('btnPip').addEventListener('click', enterPip);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (state.pinMode) { stopPinMode(); toast('أُلغي وضع الدبوس'); return; }
        if (!popupEl.hidden) { hidePopup(); return; }
        appwrap.classList.remove('sideOpen');
      }
    });

    let deferred = null;
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferred = e;
      const b = $('btnInstall');
      b.hidden = false;
      b.onclick = async function () {
        if (!deferred) return;
        deferred.prompt();
        await deferred.userChoice;
        deferred = null;
        b.hidden = true;
      };
    });

    /* أحداث الخريطة */
    map.on('singleclick', function (evt) {
      if (state.pinMode) {
        stopPinMode();
        openPinDialog(evt.coordinate[0], evt.coordinate[1], null);
        return;
      }
      const feature = map.forEachFeatureAtPixel(evt.pixel, function (f) { return f; }, {
        hitTolerance: 7,
        layerFilter: function (l) { return l === poiLayer || l === pinLayer; }
      });
      if (!feature) { hidePopup(); return; }
      if (feature.get('kind') === 'pin') {
        const pin = ensurePins(state.planet).find(p => p.id === feature.get('pinid'));
        if (pin) openPinDialog(pin.x, pin.z, pin);
        return;
      }
      showPopup(feature);
    });
    map.on('pointermove', function (evt) {
      if (evt.dragging) return;
      let cursor = '';
      if (state.pinMode) cursor = 'crosshair';
      else if (map.hasFeatureAtPixel(evt.pixel, { hitTolerance: 5, layerFilter: function (l) { return l === poiLayer || l === pinLayer; } })) cursor = 'pointer';
      const el = map.getTargetElement();
      if (el && el.style.cursor !== cursor) el.style.cursor = cursor;
    });
  }

  /* ================= الإقلاع ================= */
  function applyPrefsToUI() {
    $('onlyUndiscovered').checked = state.onlyUndiscovered;
    $('lushToggle').checked = state.lush;
    $('btnPinsToggle').textContent = state.showPins ? 'إخفاء' : 'إظهار';
    $('btnPinsToggle').setAttribute('aria-pressed', state.showPins ? 'true' : 'false');
  }

  function boot() {
    loadPrefs();
    buildPlanetSelect();
    bindUI();
    applyPrefsToUI();
    if (isCompact) {
      appwrap.classList.add('compact');
      $('btnPip').hidden = false;
    }
    loadPlanet(state.planet);
  }

  window.__pc = {
    map: map,
    state: state,
    loadPlanet: loadPlanet,
    openById: function (id) {
      const f = state.source && state.source.getFeatureById(state.planet + ':' + id);
      if (!f) return false;
      const c = f.getGeometry().getCoordinates();
      map.getView().setCenter(c);
      const r = map.getView().getResolution();
      if (!r || r > 1.6) map.getView().setResolution(1.6);
      showPopup(f);
      return true;
    },
    foundIds: function () { return [...ensureFound(state.planet)]; }
  };

  boot();
})();
