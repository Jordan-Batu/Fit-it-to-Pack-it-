/* ------------------------------- ITEM DATA ------------------------------ */
// Each item has a display name, points, and a shape made from 1/0 grid cells.
// A 1 is a filled square; a 0 is an empty corner or hole in the shape.
const ITEMS = {
  phone: { n: 'Phone', pts: 25, s: [[1], [1]] },
  lipstick: { n: 'Lipstick', pts: 10, s: [[1], [1]] },
  wallet: { n: 'Wallet', pts: 20, s: [[1, 1]] },
  keys: { n: 'Keys', pts: 10, s: [[1]] },
  earbuds: { n: 'Earbuds', pts: 10, s: [[1]] },
  charger: { n: 'Charger', pts: 5, s: [[1]] },
  sunglasses: { n: 'Sunglasses', pts: 15, s: [[1, 1]] },
  powerbank: { n: 'Power bank', pts: 15, s: [[1], [1]] },
  bottle: { n: 'Water bottle', pts: 20, s: [[1], [1], [1]] },
  cable: { n: 'Cable', pts: 10, s: [[1, 0], [1, 1]] },
  umbrella: { n: 'Umbrella', pts: 20, s: [[1, 0], [1, 0], [1, 1]] },
  tablet: { n: 'Tablet', pts: 30, s: [[1, 1], [1, 1]] },
  headphones: { n: 'Headphones', pts: 25, s: [[1, 1, 1], [1, 0, 1]] },
  laptop: { n: 'Laptop', pts: 40, s: [[1, 1, 1], [1, 1, 1]] },
  shoes: { n: 'Sneakers', pts: 25, s: [[1, 1, 0], [1, 1, 1]] },
  camera: { n: 'Camera', pts: 35, s: [[1, 1, 1], [0, 1, 0]] },
  book: { n: 'Book', pts: 30, s: [[1, 1], [1, 1], [1, 1]] },
  passport: { n: 'Passport', pts: 20, s: [[1]] },
  trash: { n: 'Crumpled trash', pts: 0, junk: 1, s: [[1]] },
  receipt: { n: 'Old receipt', pts: 0, junk: 1, s: [[1], [1]] },
  wrapper: { n: 'Candy wrapper', pts: 0, junk: 1, s: [[1]] },
  sock: { n: 'Lone sock', pts: 0, junk: 1, s: [[1, 0], [1, 1]] },
};
const UNLOCK_STARS = 2;

// Original theme: each object describes one bag size, timer, requirements, and junk.
const LEVELS = [
  {
    n: 'Clutch',
    bag: 'clutch',
    w: 4,
    h: 3,
    time: 45,
    penalty: 25,
    req: ['phone', 'lipstick', 'keys', 'wallet'],
    extra: ['earbuds', 'charger'],
    junk: ['trash'],
  },
  {
    n: 'Handbag',
    bag: 'handbag',
    w: 5,
    h: 4,
    time: 50,
    penalty: 30,
    req: ['phone', 'wallet', 'sunglasses', 'lipstick', 'keys'],
    extra: ['cable', 'powerbank', 'bottle'],
    junk: ['trash', 'receipt'],
  },
  {
    n: 'Backpack',
    bag: 'backpack',
    w: 6,
    h: 5,
    time: 55,
    penalty: 40,
    req: ['phone', 'wallet', 'tablet', 'umbrella', 'lipstick', 'keys', 'sunglasses'],
    extra: ['headphones', 'bottle', 'charger'],
    junk: ['trash', 'receipt', 'wrapper'],
  },
  {
    n: 'Suitcase',
    bag: 'suitcase',
    w: 7,
    h: 6,
    time: 60,
    penalty: 50,
    req: ['phone', 'wallet', 'tablet', 'umbrella', 'laptop', 'shoes', 'lipstick', 'keys', 'sunglasses'],
    extra: ['headphones', 'bottle', 'charger', 'earbuds'],
    junk: ['trash', 'receipt', 'wrapper', 'sock'],
  },
  {
    n: 'Tote Bag',
    bag: 'tote',
    w: 6,
    h: 5,
    time: 50,
    penalty: 45,
    blocked: [[0, 5], [1, 5], [4, 0]],
    req: ['phone', 'wallet', 'passport', 'book', 'sunglasses', 'keys', 'umbrella', 'cable'],
    extra: ['powerbank', 'charger', 'earbuds'],
    junk: ['trash', 'receipt', 'wrapper', 'sock'],
  },
  {
    n: 'Sling Bag',
    bag: 'sling',
    w: 5,
    h: 5,
    time: 35,
    penalty: 50,
    blocked: [[0, 0], [0, 4], [2, 2]],
    req: ['camera', 'tablet', 'headphones', 'wallet', 'keys', 'earbuds', 'phone'],
    extra: ['passport', 'charger'],
    junk: ['sock', 'trash', 'receipt', 'wrapper'],
  },
  {
    n: 'Duffel of Doom',
    bag: 'duffel',
    w: 8,
    h: 6,
    time: 80,
    penalty: 60,
    blocked: [[2, 3], [2, 4], [3, 3], [3, 4]],
    req: ['laptop', 'shoes', 'tablet', 'umbrella', 'camera', 'headphones', 'wallet', 'phone', 'keys', 'sunglasses'],
    extra: ['bottle', 'powerbank', 'charger', 'earbuds'],
    junk: ['sock', 'receipt', 'trash', 'wrapper'],
  },
];

/* ------------------------------- GAME STATE ----------------------------- */
// These variables remember the currently selected level, theme, items, and timer.
let levelIndex = 0;
let LEVEL = LEVELS[levelIndex];
let lbTheme = 'original';
let currentTheme = 'original';

let items = [];
let selectedId = null;
let hoveredCell = null;
let isDone = false;
let timerId = null;
let timeLeft = 0;
let lastHighlight = null;

// Local Storage keys keep progress, names, and scores after the page is refreshed.
const BOARD_KEY = 'fitnpack:board:v2';
const NAME_KEY = 'fitnpack:lastName';
const LB_MAX = 10;
let PROGRESS_KEY = 'fitnpack:progress';
let playerName = '';

/* ---------- Saved progress: stars and unlocked levels ---------- */
function loadProgress() {
  const fresh = { unlocked: 1, stars: LEVELS.map(() => 0) };

  try {
    const data = JSON.parse(localStorage.getItem(PROGRESS_KEY));

    if (data && typeof data === 'object') {
      const stars = Array.isArray(data.stars) ? data.stars : [];

      return {
        unlocked: Math.min(LEVELS.length, Math.max(1, Number(data.unlocked) || 1)),
        stars: LEVELS.map((_, index) => Math.min(3, Math.max(0, Number(stars[index]) || 0))),
      };
    }
  } catch (error) {
    // storage unavailable or corrupted: start fresh
  }

  return fresh;
}

function saveProgress(progress) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch (error) {
    // ignore
  }
}

/* ---------- Player nickname ---------- */
function getLastName() {
  if (playerName) {
    return playerName;
  }

  try {
    return localStorage.getItem(NAME_KEY) || '';
  } catch (error) {
    return '';
  }
}

function setLastName(name) {
  playerName = name;

  try {
    localStorage.setItem(NAME_KEY, name);
  } catch (error) {
    // ignore: the name still lives in memory for this session
  }
}

/* ---------- Leaderboard: one score per player per theme ----------
   board = { themeKey: { 'nickname-lowercase': { name, date, levels: { '0': { score, stars }, ... } } } }
   A theme score is the sum of the player's best score on each level of that theme. */
function loadBoard() {
  try {
    const data = JSON.parse(localStorage.getItem(BOARD_KEY));

    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return data;
    }
  } catch (error) {
    // fall through
  }

  return migrateOldBoard();
}

function storeBoard(board) {
  try {
    localStorage.setItem(BOARD_KEY, JSON.stringify(board));
    return true;
  } catch (error) {
    return false;
  }
}

// Old versions saved one entry per level (Original = 1-4, Sports = 5-8). Fold them into theme totals once.
function migrateOldBoard() {
  const board = {};

  try {
    const old = JSON.parse(localStorage.getItem('fitnpack:leaderboard'));

    if (Array.isArray(old)) {
      old.forEach((e) => {
        if (!e || typeof e.score !== 'number' || typeof e.name !== 'string') {
          return;
        }

        const level = Math.max(1, Number(e.level) || 1);
        const theme = level > 4 ? 'sports' : 'original';
        const index = level > 4 ? level - 5 : level - 1;
        const key = e.name.trim().toLowerCase();

        board[theme] = board[theme] || {};
        board[theme][key] = board[theme][key] || { name: e.name, date: e.date || 0, levels: {} };

        const slot = board[theme][key].levels[index];

        if (!slot || e.score > slot.score) {
          board[theme][key].levels[index] = { score: e.score, stars: e.stars || 0 };
        }
      });

      storeBoard(board);
    }
  } catch (error) {
    // nothing to migrate
  }

  return board;
}

function themeTotals(entry) {
  const levels = Object.values((entry && entry.levels) || {});

  return {
    score: levels.reduce((sum, l) => sum + l.score, 0),
    stars: levels.reduce((sum, l) => sum + l.stars, 0),
    done: levels.length,
  };
}

function recordScore(theme, name, levelIdx, score, stars) {
  const board = loadBoard();
  const key = name.trim().toLowerCase();

  board[theme] = board[theme] || {};
  board[theme][key] = board[theme][key] || { name, date: Date.now(), levels: {} };

  const entry = board[theme][key];
  const old = entry.levels[levelIdx];

  entry.name = name;
  entry.date = Date.now();
  entry.levels[levelIdx] = {
    score: old ? Math.max(old.score, score) : score,
    stars: old ? Math.max(old.stars, stars) : stars,
  };

  const saved = storeBoard(board);

  return { saved, key, levelBest: entry.levels[levelIdx].score, ...themeTotals(entry) };
}

const byTotal = (a, b) => b.score - a.score || a.date - b.date;

function renderLeaderboard(highlightKey) {
  const board = loadBoard();
  const themeKeys = Object.keys(THEMES);
  const rows = Object.entries(board[lbTheme] || {})
    .map(([key, entry]) => ({ key, name: entry.name, date: entry.date, ...themeTotals(entry) }))
    .sort(byTotal)
    .slice(0, LB_MAX);

  const tabs = $('lbTabs');
  tabs.textContent = '';

  themeKeys.forEach((key) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'btn alt small tab';
    tab.dataset.theme = key;
    tab.textContent = THEMES[key].label;
    tab.setAttribute('aria-pressed', String(key === lbTheme));
    tabs.appendChild(tab);
  });

  $('lbEmpty').style.display = rows.length ? 'none' : '';
  $('lbClear').style.display = Object.keys(board).length ? '' : 'none';

  const list = $('lbList');
  list.textContent = '';

  rows.forEach((entry, index) => {
    const li = document.createElement('li');
    li.className = `lb-row${entry.key === highlightKey ? ' me' : ''}`;

    const rank = document.createElement('span');
    rank.className = 'lb-rank';
    rank.textContent = index + 1;

    const name = document.createElement('span');
    name.className = 'lb-name';
    name.textContent = entry.name;

    const lvls = document.createElement('span');
    lvls.className = 'lb-lvls';
    lvls.textContent = `${entry.done}/${THEMES[lbTheme].levels.length} lvls`;

    const stars = document.createElement('span');
    stars.className = 'lb-stars';
    stars.textContent = `★${entry.stars}`;

    const pts = document.createElement('span');
    pts.className = 'lb-score';
    pts.textContent = entry.score;

    li.append(rank, name, lvls, stars, pts);
    list.appendChild(li);
  });
}

/* ---------- nickname popup (asked BEFORE playing) ---------- */
let afterName = null;

function updateNameBtn() {
  const name = getLastName();
  $('nameBtn').textContent = name ? `👤 ${name}` : '👤 Set nickname';
}

function openName(next) {
  afterName = next || null;
  $('nameErr').textContent = '';
  $('pname').value = getLastName();
  $('nameModal').classList.add('show');
  $('pname').focus();
  $('pname').select();
}

function closeName() {
  $('nameModal').classList.remove('show');
  afterName = null;
}

function confirmName() {
  const name = $('pname').value.trim().slice(0, 12);

  if (!name) {
    $('nameErr').textContent = 'Please type a nickname first.';
    $('pname').focus();
    return;
  }

  const next = afterName;
  setLastName(name);
  // Set up the first screen and the saved nickname when the page finishes loading.
  updateNameBtn();
  closeName();

  if (next) {
    next();
  }
}

// Short helper used throughout the file to find an element by its HTML id.
const $ = (id) => document.getElementById(id);

/* ---------- Sound effects ---------- */
let audioCtx = null;

function playTone(freq, duration, type = 'sine', volume = 0.12) {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

const sfx = {
  pick: () => playTone(520, 0.06, 'sine', 0.1),
  rotate: () => playTone(660, 0.05, 'triangle', 0.08),
  place: () => playTone(440, 0.1, 'sine', 0.14),
  bad: () => playTone(160, 0.18, 'sawtooth', 0.1),
  win: () => {
    playTone(523, 0.12, 'triangle', 0.12);
    setTimeout(() => playTone(659, 0.12, 'triangle', 0.12), 110);
    setTimeout(() => playTone(784, 0.22, 'triangle', 0.14), 220);
  },
  lose: () => {
    playTone(300, 0.18, 'sawtooth', 0.1);
    setTimeout(() => playTone(200, 0.3, 'sawtooth', 0.1), 180);
  },
};

/* ---------- Item shape and size helpers ---------- */
// Turning a matrix 90 degrees is used to rotate an item.
const rotate = (matrix) =>
  matrix[0].map((_, index) => matrix.map((row) => row[index]).reverse());

const shape = (item) => {
  let matrix = ITEMS[item.key].s.map((row) => [...row]);

  for (let i = 0; i < item.rot; i += 1) {
    matrix = rotate(matrix);
  }

  return matrix;
};

const boxSize = (n) => `calc(var(--cs) * ${n} + 3px * ${n - 1})`;
const tileSize = (n) => `${n * 24}px`;
const formatTime = (totalSeconds) =>
  `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;

function svg(item, sizeFn) {
  const base = ITEMS[item.key].s;
  const width = base[0].length;
  const height = base.length;

  return `<img src="Images/${item.key}.svg" alt="" draggable="false" style="width:${sizeFn(width)};height:${sizeFn(height)};transform:translate(-50%,-50%) rotate(${item.rot * 90}deg)">`;
}

// Builds the HTML picture used by a packed item or a placement preview.
function boardArt(item, position, cssClass) {
  const matrix = shape(item);

  return `<div class="art ${cssClass || ''}" style="left:calc((var(--cs) + 3px) * ${position.c});top:calc((var(--cs) + 3px) * ${position.r});width:${boxSize(matrix[0].length)};height:${boxSize(matrix.length)}">${svg(item, boxSize)}</div>`;
}

/* ---------- Screen and level rendering ---------- */
// Creates the level-card buttons for the selected theme.
function renderLevels() {
  $('levelsTitle').textContent = `Select level · ${THEMES[currentTheme].label}`;
  const progress = loadProgress();
  const list = $('levelList');
  list.textContent = '';

  LEVELS.forEach((level, index) => {
    const locked = index >= progress.unlocked;
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'level-card';
    card.dataset.level = index;
    card.disabled = locked;

    const art = document.createElement('img');
    art.src = `Images/${level.bag}.svg`;
    art.alt = '';

    const title = document.createElement('b');
    title.textContent = `Level ${index + 1}`;

    const name = document.createElement('span');
    name.className = 'nm';
    name.textContent = `${level.n} · ${level.w}×${level.h} · ${formatTime(level.time)}`;

    const best = document.createElement('span');
    best.className = 'lv-stars';
    best.textContent = locked
      ? '🔒 Locked'
      : `${'★'.repeat(progress.stars[index])}${'☆'.repeat(3 - progress.stars[index])}`;

    card.append(art, title, name, best);
    list.appendChild(card);
  });
}

// Starts or restarts a level with a fresh set of shuffled items.
function start() {
  let id = 0;
  LEVEL = LEVELS[levelIndex];

  $('lvlTitle').textContent = `Level ${levelIndex + 1}: Pack the ${LEVEL.n.toLowerCase()}`;
  $('bagTag').textContent = LEVEL.n.toUpperCase();
  $('bag').dataset.bag = LEVEL.bag;
  document.querySelector('.prog').setAttribute('aria-valuemax', LEVEL.req.length);

  items = [
    ...LEVEL.req.map((key) => ({ key, req: 1 })),
    ...LEVEL.extra.map((key) => ({ key, req: 0 })),
    ...LEVEL.junk.map((key) => ({ key, req: 0 })),
  ]
    .sort(() => Math.random() - 0.5)
    .map((entry) => ({
      id: id += 1,
      key: entry.key,
      req: entry.req,
      junk: ITEMS[entry.key].junk ? 1 : 0,
      rot: 0,
      at: null,
    }));

  stopTimer();
  timeLeft = LEVEL.time;
  updateTimer();

  selectedId = null;
  hoveredCell = null;
  isDone = false;
  $('result').classList.remove('show');
  $('msg').textContent = 'Drag an item into the bag, or tap it and then tap a cell.';
  show('game');
  render();
}

/* ---------- Bag placement rules ---------- */
// Returns a map of every bag cell already occupied by a packed item.
function occupiedCells(skipId) {
  const cells = {};

  items.forEach((item) => {
    if (item.at && item.id !== skipId) {
      shape(item).forEach((row, rowIndex) => {
        row.forEach((value, colIndex) => {
          if (value) {
            cells[`${item.at.r + rowIndex},${item.at.c + colIndex}`] = item.id;
          }
        });
      });
    }
  });

  return cells;
}

function originPoint(item, row, column) {
  const matrix = shape(item);

  return {
    r: row - Math.floor(matrix.length / 2),
    c: column - Math.floor(matrix[0].length / 2),
  };
}

const isBlocked = (row, col) => (LEVEL.blocked || []).some(([r, c]) => r === row && c === col);

// Checks whether an item fits inside the bag, inside blocked cells, and not on another item.
function fits(item, origin) {
  const occupied = occupiedCells(item.id);

  return shape(item).every((row, rowIndex) =>
    row.every((value, colIndex) => {
      if (!value) {
        return true;
      }

      const y = origin.r + rowIndex;
      const x = origin.c + colIndex;

      return y >= 0 && x >= 0 && y < LEVEL.h && x < LEVEL.w && !isBlocked(y, x) && !occupied[`${y},${x}`];
    }),
  );
}

// Recreates the grid and item tray from the current game state.
function render() {
  const grid = $('grid');
  grid.style.setProperty('--w', LEVEL.w);

  const previewCells = {};
  let validPlacement = false;
  let ghost = '';

  const selectedItem = items.find((item) => item.id === selectedId);

  if (selectedItem && hoveredCell) {
    const origin = originPoint(selectedItem, hoveredCell.r, hoveredCell.c);
    validPlacement = fits(selectedItem, origin);

    shape(selectedItem).forEach((row, rowIndex) => {
      row.forEach((value, colIndex) => {
        if (value) {
          previewCells[`${origin.r + rowIndex},${origin.c + colIndex}`] = 1;
        }
      });
    });

    ghost = boardArt(selectedItem, origin, 'ghost');
  }

  let markup = '';
  const occupiedNow = occupiedCells();

  for (let row = 0; row < LEVEL.h; row += 1) {
    for (let col = 0; col < LEVEL.w; col += 1) {
      let className = isBlocked(row, col) ? 'cell blocked' : 'cell';

      if (occupiedNow[`${row},${col}`] !== undefined) {
        className += ' occ';
      }

      if (previewCells[`${row},${col}`]) {
        className += validPlacement ? ' ok' : ' no';
      }

      markup += `<div class="${className}" data-r="${row}" data-c="${col}" role="gridcell"></div>`;
    }
  }

  markup += items.filter((item) => item.at).map((item) => boardArt(item, item.at)).join('') + ghost;
  grid.innerHTML = markup;

  const remainingItems = items.filter((item) => !item.at);
  $('tray').innerHTML = remainingItems.length
    ? remainingItems.map((item) => {
        const matrix = shape(item);

        return `<button class="item${drag && drag.id === item.id ? ' ghosted' : ''}" data-id="${item.id}" aria-pressed="${item.id === selectedId}"><div class="mini" style="width:${tileSize(matrix[0].length)};height:${tileSize(matrix.length)}">${svg(item, tileSize)}</div><span class="nm">${ITEMS[item.key].n}</span>${item.req ? '<span class="req">MUST</span>' : ''}</button>`;
      }).join('')
    : '<span class="nm">Everything is packed!</span>';

  const requiredItems = items.filter((item) => item.req);
  const requiredPacked = requiredItems.filter((item) => item.at).length;

  $('reqTxt').textContent = `Must-pack: ${requiredPacked} of ${requiredItems.length}`;
  $('bar').style.width = `${(requiredPacked / requiredItems.length) * 100}%`;
  $('done').disabled = requiredPacked < requiredItems.length || isDone;
}

// Places the selected item when the player uses the click-to-place controls.
function placeAt(row, column) {
  const item = items.find((entry) => entry.id === selectedId);

  if (!item || isDone) {
    return;
  }

  const origin = originPoint(item, row, column);

  if (fits(item, origin)) {
    item.at = origin;
    selectedId = null;
    sfx.place();
    hoveredCell = null;
    $('msg').textContent = 'Packed.';
    render();

    if (items.filter((entry) => entry.req).every((entry) => entry.at)) {
      $('msg').textContent = 'Must-packs done. Add extras or finish.';
    }
  } else {
    sfx.bad();
    $('msg').textContent = 'Doesn’t fit there. Try rotating it or another spot.';
    const targetCell = document.querySelector(`[data-r="${row}"][data-c="${column}"]`);

    if (targetCell) {
      targetCell.classList.add('shake');
    }
  }
}

$('grid').addEventListener('click', (event) => {
  const cell = event.target.closest('.cell');

  if (!cell || isDone) {
    return;
  }

  const row = +cell.dataset.r;
  const column = +cell.dataset.c;
  const occupiedId = occupiedCells()[`${row},${column}`];

  if (selectedId !== null) {
    placeAt(row, column);
    return;
  }

  if (occupiedId !== undefined) {
    startTimer();
    const pickedItem = items.find((entry) => entry.id === occupiedId);
    pickedItem.at = null;
    selectedId = pickedItem.id;
    sfx.pick();
    hoveredCell = { r: row, c: column };
    $('msg').textContent = `Picked up ${ITEMS[pickedItem.key].n}.`;
    render();
  }
});

$('grid').addEventListener('mouseover', (event) => {
  const cell = event.target.closest('.cell');

  if (!cell || selectedId === null) {
    return;
  }

  const nextCell = { r: +cell.dataset.r, c: +cell.dataset.c };

  if (!hoveredCell || hoveredCell.r !== nextCell.r || hoveredCell.c !== nextCell.c) {
    hoveredCell = nextCell;
    render();
  }
});

$('grid').addEventListener('mouseleave', () => {
  if (hoveredCell) {
    hoveredCell = null;
    render();
  }
});

/* ---------- Tray selection ---------- */
$('tray').addEventListener('click', (event) => {
  const button = event.target.closest('.item');

  if (!button || isDone) {
    return;
  }

  startTimer();
  selectedId = +button.dataset.id;
  sfx.pick();
  hoveredCell = null;
  $('msg').textContent = `${ITEMS[items.find((entry) => entry.id === selectedId).key].n} selected. Tap the bag to place it.`;
  render();
});

/* =====================================================================
   Drag & drop: hold the left mouse button on an item, drag it over the bag and let go.
   - from the item list  -> into the bag
   - from inside the bag -> to another spot (a bad spot sends it back where it was)
   - from inside the bag -> out of the bag = put it back in the item list
   Clicking still works too: click an item, then click a cell.
   ===================================================================== */
const DRAG_THRESHOLD = 6;
let press = null; // pointer is down on an item, but has not moved far enough to be a drag yet
let drag = null; // { id, fromAt, rot0 } while an item is being dragged
let suppressClick = false;
let dragGhost = null;

function cellFromPoint(x, y) {
  const el = document.elementFromPoint(x, y);
  const cell = el && el.closest ? el.closest('#grid .cell') : null;

  return cell ? { r: +cell.dataset.r, c: +cell.dataset.c } : null;
}

function cellPx() {
  const cell = document.querySelector('#grid .cell');

  return cell ? cell.getBoundingClientRect().width : 64;
}

function refreshGhost() {
  const item = drag && items.find((entry) => entry.id === drag.id);

  if (!item || !dragGhost) {
    return;
  }

  const cs = cellPx();
  const matrix = shape(item);
  const px = (n) => n * cs + 3 * (n - 1);

  dragGhost.dataset.w = px(matrix[0].length);
  dragGhost.dataset.h = px(matrix.length);
  dragGhost.style.width = `${dragGhost.dataset.w}px`;
  dragGhost.style.height = `${dragGhost.dataset.h}px`;
  dragGhost.innerHTML = svg(item, (n) => `${px(n)}px`);
}

function moveGhost(x, y) {
  if (!dragGhost) {
    return;
  }

  dragGhost.style.left = `${x - dragGhost.dataset.w / 2}px`;
  dragGhost.style.top = `${y - dragGhost.dataset.h / 2}px`;
  dragGhost.style.display = hoveredCell ? 'none' : 'block'; // over the bag the snapped preview takes over
}

function beginDrag(event) {
  const item = items.find((entry) => entry.id === press.id);

  if (!item || isDone) {
    press = null;
    return;
  }

  startTimer();
  drag = { id: item.id, fromAt: item.at ? { ...item.at } : null, rot0: item.rot };
  press = null;
  item.at = null;
  selectedId = item.id;
  sfx.pick();

  dragGhost = document.createElement('div');
  dragGhost.className = 'dragghost';
  document.body.appendChild(dragGhost);
  document.body.classList.add('dragging');
  refreshGhost();
  $('msg').textContent = `Dragging ${ITEMS[item.key].n}. Press R or scroll to rotate.`;
}

function updateDrag(event) {
  const next = cellFromPoint(event.clientX, event.clientY);
  const changed = (next && next.r) !== (hoveredCell && hoveredCell.r) || (next && next.c) !== (hoveredCell && hoveredCell.c) || !next !== !hoveredCell;

  hoveredCell = next;

  if (changed) {
    render();
  }

  moveGhost(event.clientX, event.clientY);
}

function closeDrag() {
  drag = null;
  press = null;
  hoveredCell = null;

  if (dragGhost) {
    dragGhost.remove();
    dragGhost = null;
  }

  document.body.classList.remove('dragging');
}

function abortDrag() {
  if (!drag) {
    return;
  }

  const item = items.find((entry) => entry.id === drag.id);

  if (item && drag.fromAt) {
    item.at = drag.fromAt;
    item.rot = drag.rot0;
  }

  closeDrag();
  selectedId = null;
  render();
}

function endDrag(event) {
  const item = items.find((entry) => entry.id === drag.id);
  const { fromAt, rot0 } = drag;
  const cell = cellFromPoint(event.clientX, event.clientY);
  const name = ITEMS[item.key].n;
  let shakeCell = null;

  closeDrag();
  suppressClick = true;
  setTimeout(() => {
    suppressClick = false;
  }, 80);
  selectedId = null;

  if (cell) {
    const origin = originPoint(item, cell.r, cell.c);

    if (fits(item, origin)) {
      item.at = origin;
      sfx.place();
      $('msg').textContent = fromAt ? `Moved ${name}.` : 'Packed.';

      if (items.filter((entry) => entry.req).every((entry) => entry.at)) {
        $('msg').textContent = 'Must-packs done. Add extras or finish.';
      }
    } else {
      sfx.bad();
      shakeCell = cell;

      if (fromAt) {
        item.at = fromAt;
        item.rot = rot0;
        $('msg').textContent = `Doesn’t fit there, so ${name} went back.`;
      } else {
        $('msg').textContent = 'Doesn’t fit there. Try rotating it (R) or another spot.';
      }
    }
  } else {
    $('msg').textContent = fromAt ? `Put ${name} back in your items.` : 'Dropped outside the bag. Try again.';
  }

  render();

  if (shakeCell) {
    const target = document.querySelector(`[data-r="${shakeCell.r}"][data-c="${shakeCell.c}"]`);

    if (target) {
      target.classList.add('shake');
    }
  }
}

document.addEventListener('pointerdown', (event) => {
  if (isDone || !event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) {
    return;
  }

  if (document.body.dataset.s !== 'game' || !event.target.closest) {
    return;
  }

  const trayItem = event.target.closest('#tray .item');
  const cell = event.target.closest('#grid .cell');
  let id;

  if (trayItem) {
    id = +trayItem.dataset.id;
  } else if (cell) {
    id = occupiedCells()[`${cell.dataset.r},${cell.dataset.c}`];
  }

  if (id === undefined) {
    return;
  }

  try {
    event.target.releasePointerCapture(event.pointerId);
  } catch (error) {
    // not captured: fine
  }

  press = { id, x: event.clientX, y: event.clientY };
});

document.addEventListener('pointermove', (event) => {
  if (drag && isDone) {
    abortDrag();
    return;
  }

  if (press && !drag) {
    if (Math.hypot(event.clientX - press.x, event.clientY - press.y) < DRAG_THRESHOLD) {
      return;
    }

    beginDrag(event);
  }

  if (drag) {
    updateDrag(event);
  }
});

document.addEventListener('pointerup', (event) => {
  if (drag) {
    if (isDone) {
      abortDrag();
    } else {
      endDrag(event);
    }
  }

  press = null; // a press that never turned into a drag is just a click
});

document.addEventListener('pointercancel', () => {
  abortDrag();
  press = null;
});

window.addEventListener('blur', () => {
  abortDrag();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && drag) {
    abortDrag();
  }
});

document.addEventListener('wheel', (event) => {
  if (drag) {
    event.preventDefault();
    rotateSelected();
  }
}, { passive: false });

document.addEventListener('dragstart', (event) => {
  event.preventDefault(); // no browser image-dragging; we do our own
});

// The click that follows a drag must not also select/place anything.
document.addEventListener('click', (event) => {
  if (suppressClick) {
    event.stopPropagation();
    event.preventDefault();
    suppressClick = false;
  }
}, true);

/* ---------- Rotation, timer, and result handling ---------- */
// Turns the selected item and rebuilds its preview.
function rotateSelected() {
  const item = items.find((entry) => entry.id === selectedId);

  if (!item) {
    return;
  }

  item.rot = (item.rot + 1) % 4;
  sfx.rotate();
  render();

  if (drag) {
    refreshGhost();
  }
}

$('rot').onclick = rotateSelected;
document.addEventListener('keydown', (event) => {
  if (event.target.tagName === 'INPUT') {
    return;
  }

  if (event.key === 'r' || event.key === 'R') {
    rotateSelected();
  }
});

document.addEventListener('contextmenu', (event) => {
  if (selectedId !== null && !isDone) {
    event.preventDefault();
    rotateSelected();
  }
});

$('reset').onclick = start;
$('again').onclick = start;

// Displays the remaining time and changes the timer style near the end.
function updateTimer() {
  const timer = $('timer');
  timer.textContent = `⏱ ${formatTime(Math.max(0, timeLeft))}`;
  timer.classList.toggle('low', timeLeft <= 10);
}

function stopTimer() {
  clearInterval(timerId);
  timerId = null;
}

function startTimer() {
  if (timerId || isDone) {
    return;
  }

  timerId = setInterval(() => {
    timeLeft -= 1;
    updateTimer();

    if (timeLeft <= 0) {
      timeUp();
    }
  }, 1000);
}

function timeUp() {
  abortDrag();
  stopTimer();
  sfx.lose();
  isDone = true;
  selectedId = null;
  hoveredCell = null;
  render();

  $('stars').textContent = '☆☆☆';
  $('rTitle').textContent = 'Time’s up!';
  $('rText').textContent = 'The bag wasn’t packed in time. Try again, a little faster.';
  $('rTotal').textContent = '';
  $('next').hidden = true;
  $('again').className = 'btn play';
  $('result').classList.add('show');
}

// Finishes the level, calculates points and stars, unlocks progress, and saves the score.
$('done').onclick = () => {
  stopTimer();
  sfx.win();
  isDone = true;
  selectedId = null;
  hoveredCell = null;

  const packedItems = items.filter((item) => item.at);
  const goodItems = packedItems.filter((item) => !item.junk);
  const junkCount = packedItems.length - goodItems.length;

  const baseScore = goodItems.reduce((total, item) => total + ITEMS[item.key].pts, 0);
  const bonus = Math.max(0, timeLeft) * 2;
  const penalty = junkCount * LEVEL.penalty;
  const score = Math.max(0, baseScore + bonus - penalty);
  const extraItems = items.filter((item) => !item.req && !item.junk);
  const placedExtras = extraItems.filter((item) => item.at).length;

  let stars = placedExtras === extraItems.length ? 3 : placedExtras > 0 ? 2 : 1;

  if (junkCount) {
    stars = Math.max(1, stars - 1);
  }

  $('stars').textContent = `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}`;
  $('rTitle').textContent = junkCount ? 'Bag closed, with junk' : stars === 3 ? 'Perfect pack!' : 'Bag closed!';
  const progress = loadProgress();
  const hasNext = levelIndex + 1 < LEVELS.length;
  let note = '';

  progress.stars[levelIndex] = Math.max(progress.stars[levelIndex], stars);

  if (stars >= UNLOCK_STARS) {
    if (hasNext && progress.unlocked < levelIndex + 2) {
      progress.unlocked = levelIndex + 2;
      note = ` Level ${levelIndex + 2} unlocked!`;
    } else if (!hasNext) {
      note = ' You cleared every level!';
    }
  } else if (hasNext && progress.unlocked < levelIndex + 2) {
    note = ` Earn ${UNLOCK_STARS} ★ to unlock the next level.`;
  }

  saveProgress(progress);

  const canNext = hasNext && progress.unlocked > levelIndex + 1;
  $('next').hidden = !canNext;
  $('again').className = canNext ? 'btn alt small' : 'btn play';

  $('rText').textContent = `Items +${baseScore}, time bonus +${bonus}${junkCount ? `, junk −${penalty}` : ''}. Total ${score} points.${note}`;

  const name = getLastName() || 'Player';
  const result = recordScore(currentTheme, name, levelIndex, score, stars);
  const label = THEMES[currentTheme].label;

  $('rTotal').textContent = result.saved
    ? `${name} · ${label} total: ${result.score} pts (${result.done}/${LEVELS.length} levels). Best on this level: ${result.levelBest}.`
    : 'Could not save your score on this device.';
  lbTheme = currentTheme;
  lastHighlight = result.key;
  $('result').classList.add('show');
  render();
};

$('saveName').onclick = confirmName;
$('cancelName').onclick = closeName;
$('pname').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    confirmName();
  } else if (event.key === 'Escape') {
    closeName();
  }
});
$('nameBtn').onclick = () => openName();

$('lbClear').onclick = () => {
  if (confirm('Clear all saved scores?')) {
    storeBoard({});
    renderLeaderboard();
  }
};

/* ---------- Navigation and theme switching ---------- */
// Changes the visible screen by updating the data-s value on the page body.
function show(nextScreen) {
  document.body.dataset.s = nextScreen;

  if (nextScreen !== 'game') {
    stopTimer();
  }

  if (nextScreen === 'lb') {
    renderLeaderboard(lastHighlight);
  }

  if (nextScreen === 'levels') {
    renderLevels();
  }

  window.scrollTo(0, 0);
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-go]');

  if (button) {
    show(button.dataset.go);
  }
});

$('play').onclick = () => {
  if (getLastName()) {
    show('levels');
  } else {
    openName(() => show('levels'));
  }
};
$('toLb').onclick = () => {
  $('result').classList.remove('show');
  lbTheme = currentTheme;
  show('lb');
};
$('gameBack').onclick = $('toLevels').onclick = () => {
  $('result').classList.remove('show');
  show('levels');
};

$('next').onclick = () => {
  levelIndex = Math.min(levelIndex + 1, LEVELS.length - 1);
  start();
};

$('levelList').addEventListener('click', (event) => {
  const card = event.target.closest('.level-card');

  if (card && !card.disabled) {
    levelIndex = +card.dataset.level;
    start();
  }
});

$('lbTabs').addEventListener('click', (event) => {
  const tab = event.target.closest('.tab');

  if (tab) {
    lbTheme = tab.dataset.theme;
    lastHighlight = null;
    renderLeaderboard();
  }
});

/* ---------- Background music ---------- */
const bgm = new Audio('Images/audio/intro.mp3');
bgm.loop = true;
bgm.volume = 0.3;
let musicOn = true;

function tryPlayMusic() {
  if (musicOn && bgm.paused) {
    bgm.play().catch(() => {});
  }
}

document.addEventListener('click', tryPlayMusic, { once: true });

if ($('musicBtn')) {
  $('musicBtn').onclick = () => {
    musicOn = !musicOn;
    if (musicOn) {
      bgm.play();
      $('musicBtn').textContent = '🔊 Music: ON';
    } else {
      bgm.pause();
      $('musicBtn').textContent = '🔇 Music: OFF';
    }
  };
}

/* =====================================================================
    THEME DATA
    Sports, School, and Vacation have separate items and level lists.
   ===================================================================== */

const SPORTS_ITEMS = {
  ball: { n: 'Ball', pts: 25, s: [[1, 1], [1, 1]] },
  tape: { n: 'Athletic tape', pts: 10, s: [[1]] },
  'energy-drink': { n: 'Energy drink', pts: 20, s: [[1], [1], [1]] },
  jersey: { n: 'Jersey', pts: 20, s: [[1, 1], [1, 1]] },
  towel: { n: 'Towel', pts: 15, s: [[1], [1]] },
  'beer-can': { n: 'Beer can', pts: 0, junk: 1, s: [[1], [1]] },
  chips: { n: 'Chips', pts: 0, junk: 1, s: [[1], [1]] },
};

Object.assign(ITEMS, SPORTS_ITEMS);

const SPORTS_LEVELS = [
  {
    n: 'Gym Bag',
    bag: 'clutch',
    w: 4,
    h: 3,
    time: 45,
    penalty: 25,
    req: ['ball', 'tape', 'towel'],
    extra: ['energy-drink'],
    junk: ['beer-can'],
  },
  {
    n: 'Duffel',
    bag: 'handbag',
    w: 5,
    h: 4,
    time: 50,
    penalty: 30,
    req: ['ball', 'shoes', 'jersey', 'tape'],
    extra: ['towel'],
    junk: ['beer-can', 'chips'],
  },
  {
    n: 'Locker Pack',
    bag: 'backpack',
    w: 6,
    h: 5,
    time: 55,
    penalty: 40,
    req: ['ball', 'shoes', 'tape', 'energy-drink', 'jersey', 'towel'],
    extra: [],
    junk: ['beer-can', 'chips'],
  },
  {
    n: 'Team Trunk',
    bag: 'suitcase',
    w: 7,
    h: 6,
    time: 60,
    penalty: 50,
    req: ['ball', 'shoes', 'tape', 'energy-drink', 'jersey', 'towel'],
    extra: [],
    junk: ['beer-can', 'chips'],
  },
];

const SCHOOL_ITEMS = {
  ballpen: { n: 'Ball pen', pts: 10, s: [[1], [1]] },
  pencil: { n: 'Pencil', pts: 10, s: [[1], [1], [1]] },
  eraser: { n: 'Eraser', pts: 5, s: [[1]] },
  ruler: { n: 'Ruler', pts: 10, s: [[1, 1, 1]] },
  glue: { n: 'Glue stick', pts: 5, s: [[1]] },
  highlighter: { n: 'Highlighter', pts: 10, s: [[1], [1]] },
  calculator: { n: 'Calculator', pts: 20, s: [[1], [1]] },
  scissors: { n: 'Scissors', pts: 10, s: [[1, 1], [1, 0]] },
  idcard: { n: 'School ID', pts: 15, s: [[1, 1]] },
  notebook: { n: 'Notebook', pts: 25, s: [[1, 1], [1, 1]] },
  yellowpad: { n: 'Yellow pad', pts: 30, s: [[1, 1], [1, 1], [1, 1]] },
  lunchbox: { n: 'Lunchbox', pts: 25, s: [[1, 1, 1], [1, 1, 1]] },
  paperball: { n: 'Crumpled paper', pts: 0, junk: 1, s: [[1]] },
  gum: { n: 'Old gum', pts: 0, junk: 1, s: [[1]] },
  slip: { n: 'Detention slip', pts: 0, junk: 1, s: [[1], [1]] },
};

Object.assign(ITEMS, SCHOOL_ITEMS);

const SCHOOL_LEVELS = [
  {
    n: 'Pencil Case',
    bag: 'pencilcase',
    w: 4,
    h: 3,
    time: 45,
    penalty: 25,
    req: ['ballpen', 'pencil', 'eraser'],
    extra: ['ruler', 'glue'],
    junk: ['paperball'],
  },
  {
    n: 'Satchel',
    bag: 'satchel',
    w: 5,
    h: 4,
    time: 50,
    penalty: 30,
    req: ['notebook', 'ballpen', 'pencil', 'idcard', 'calculator'],
    extra: ['highlighter', 'eraser', 'glue'],
    junk: ['paperball', 'gum'],
  },
  {
    n: 'Backpack',
    bag: 'backpack',
    w: 6,
    h: 5,
    time: 55,
    penalty: 40,
    req: ['laptop', 'yellowpad', 'notebook', 'ballpen', 'pencil', 'eraser'],
    extra: ['bottle', 'glue'],
    junk: ['paperball', 'gum', 'slip'],
  },
  {
    n: 'Locker',
    bag: 'locker',
    w: 7,
    h: 6,
    time: 60,
    penalty: 50,
    blocked: [[0, 3], [1, 3]],
    req: ['laptop', 'book', 'yellowpad', 'notebook', 'calculator', 'ballpen', 'pencil', 'idcard'],
    extra: ['bottle', 'highlighter'],
    junk: ['paperball', 'gum', 'slip', 'wrapper'],
  },
  {
    n: 'Finals Day',
    bag: 'trolley',
    w: 8,
    h: 6,
    time: 85,
    penalty: 60,
    blocked: [[0, 0], [0, 7], [5, 0], [5, 7]],
    req: ['laptop', 'book', 'yellowpad', 'notebook', 'lunchbox', 'calculator', 'ballpen', 'pencil', 'idcard', 'ruler'],
    extra: ['eraser', 'glue'],
    junk: ['paperball', 'gum', 'slip', 'wrapper'],
  },
];
const VACATION_ITEMS = {
  // new items (need Images/<key>.svg)
  sunscreen: { n: 'Sunscreen', pts: 15, s: [[1], [1]] },
  flipflops: { n: 'Flip-flops', pts: 20, s: [[1, 1], [1, 1]] },
  snorkel: { n: 'Snorkel', pts: 20, s: [[1, 0], [1, 0], [1, 1]] },
  // new junk
  meltedicecream: { n: 'Melted ice cream', pts: 0, junk: 1, s: [[1], [1]] },
  seashell: { n: 'Seashell', pts: 0, junk: 1, s: [[1]] },
  seaweed: { n: 'Tangled seaweed', pts: 0, junk: 1, s: [[1, 1]] },
  coconut: { n: 'Empty coconut', pts: 0, junk: 1, s: [[1]] },
};

Object.assign(ITEMS, VACATION_ITEMS);

const VACATION_LEVELS = [
  {
    n: 'Beach Pouch',
    bag: 'beachpouch',
    w: 4,
    h: 3,
    time: 45,
    penalty: 25,
    req: ['phone', 'wallet', 'sunglasses', 'keys'],
    extra: ['sunscreen', 'earbuds'],
    junk: ['seashell'],
  },
  {
    n: 'Beach Tote',
    bag: 'beachtote',
    w: 5,
    h: 4,
    time: 50,
    penalty: 30,
    req: ['phone', 'wallet', 'sunglasses', 'towel', 'keys'],
    extra: ['sunscreen', 'flipflops', 'earbuds'],
    junk: ['seashell', 'meltedicecream'],
  },
  {
    n: 'Day Backpack',
    bag: 'daybackpack',
    w: 6,
    h: 5,
    time: 55,
    penalty: 40,
    req: ['phone', 'wallet', 'sunglasses', 'towel', 'passport', 'keys', 'umbrella'],
    extra: ['camera', 'snorkel', 'flipflops'],
    junk: ['seashell', 'meltedicecream', 'coconut'],
  },
  {
    n: 'Carry-On',
    bag: 'carryon',
    w: 7,
    h: 6,
    time: 60,
    penalty: 50,
    blocked: [[0, 6], [5, 0]],
    req: ['phone', 'wallet', 'passport', 'sunglasses', 'towel', 'umbrella', 'camera', 'shoes', 'keys'],
    extra: ['snorkel', 'flipflops', 'bottle'],
    junk: ['seashell', 'meltedicecream', 'coconut', 'seaweed'],
  },
  {
    n: 'Grand Getaway',
    bag: 'getaway',
    w: 8,
    h: 6,
    time: 85,
    penalty: 60,
    blocked: [[2, 3], [2, 4], [3, 3], [3, 4]],
    req: ['tablet', 'umbrella', 'camera', 'shoes', 'towel', 'wallet', 'phone', 'passport', 'sunglasses', 'keys'],
    extra: ['flipflops', 'snorkel', 'sunscreen'],
    junk: ['seashell', 'meltedicecream', 'coconut', 'seaweed'],
  },
];

const ORIGINAL_LEVELS = [...LEVELS];

// Each theme has its own levels, progress (stars/unlocks) and leaderboard.
const THEMES = {
  original: {
    label: 'Original',
    levels: ORIGINAL_LEVELS,
    progressKey: 'fitnpack:progress',
  },
  school: {
    label: 'School',
    levels: SCHOOL_LEVELS,
    progressKey: 'fitnpack:progress:school',
  },
  sports: {
    label: 'Sports',
    levels: SPORTS_LEVELS,
    progressKey: 'fitnpack:progress:sports',
  },
   vacation: {
    label: 'Vacation',
    levels: VACATION_LEVELS,
    progressKey: 'fitnpack:progress:vacation',
  },
};

// Every theme can use a matching background-music file.
const THEME_MUSIC = {
  original: 'Images/audio/intro.mp3',
  school: 'Images/audio/school.mp3',
  sports: 'Images/audio/sports.mp3',
  vacation: 'Images/audio/vacation.mp3',
};
let bgmSrc = THEME_MUSIC.original;

function setThemeMusic(key) {
  const src = THEME_MUSIC[key] || THEME_MUSIC.original;

  if (src === bgmSrc) {
    return;
  }

  bgmSrc = src;
  bgm.src = src;
  bgm.load();

  if (musicOn) {
    bgm.play().catch(() => {});
  }
}

// Applies a theme by changing levels, progress storage, music, and body styles.
function applyTheme(name) {
  const key = THEMES[name] ? name : 'original';
  const theme = THEMES[key];

  currentTheme = key;
  setThemeMusic(key);

  LEVELS.splice(0, LEVELS.length, ...theme.levels);
  PROGRESS_KEY = theme.progressKey;

  levelIndex = 0;
  lbTheme = key;
  LEVEL = LEVELS[0];
  document.body.dataset.theme = name;
}

document.addEventListener('click', (event) => {
  
  const button = event.target.closest('button[data-theme]');

  if (button) {
    applyTheme(button.dataset.theme);
    show('levels');
  }
});

document.addEventListener(
  'click',
  (event) => {
    if (event.target.closest('[data-go="title"]')) {
      applyTheme('original');
    }
  },
  true,
);

updateNameBtn();
show('title');