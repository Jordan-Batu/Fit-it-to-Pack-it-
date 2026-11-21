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
  trash: { n: 'Crumpled trash', pts: 0, junk: 1, s: [[1]] },
  receipt: { n: 'Old receipt', pts: 0, junk: 1, s: [[1], [1]] },
  wrapper: { n: 'Candy wrapper', pts: 0, junk: 1, s: [[1]] },
  sock: { n: 'Lone sock', pts: 0, junk: 1, s: [[1, 0], [1, 1]] },
};
/*sd*/
const UNLOCK_STARS = 2;

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
];

let levelIndex = 0;
let LEVEL = LEVELS[levelIndex];
let lbLevel = 1;

let items = [];
let selectedId = null;
let hoveredCell = null;
let isDone = false;
let timerId = null;
let timeLeft = 0;
let pendingScore = null;

let LB_KEY = 'fitnpack:leaderboard';
const NAME_KEY = 'fitnpack:lastName';
const LB_MAX = 10;
let PROGRESS_KEY = 'fitnpack:progress';

function loadScores() {
  try {
    const data = JSON.parse(localStorage.getItem(LB_KEY));

    if (Array.isArray(data)) {
      return data
        .filter((e) => e && typeof e.score === 'number' && typeof e.name === 'string')
        .map((e) => ({ ...e, level: Number.isInteger(e.level) && e.level >= 1 ? e.level : 1 }));
    }
  } catch (error) {
    // storage unavailable or corrupted: fall through to empty list
  }

  return [];
}

const byScore = (a, b) => b.score - a.score || a.date - b.date;

function trimScores(list) {
  const kept = [];

  LEVELS.forEach((_, index) => {
    kept.push(...list.filter((e) => e.level === index + 1).sort(byScore).slice(0, LB_MAX));
  });

  return kept;
}

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

function storeScores(list) {
  try {
    localStorage.setItem(LB_KEY, JSON.stringify(list));
    return true;
  } catch (error) {
    return false;
  }
}

function getLastName() {
  try {
    return localStorage.getItem(NAME_KEY) || '';
  } catch (error) {
    return '';
  }
}

function setLastName(name) {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch (error) {
    // ignore
  }
}

function renderLeaderboard(highlightId) {
  const all = loadScores();
  const scores = all.filter((e) => e.level === lbLevel).sort(byScore).slice(0, LB_MAX);

  const tabs = $('lbTabs');
  tabs.textContent = '';

  LEVELS.forEach((level, index) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'btn alt small tab';
    tab.dataset.level = index + 1;
    tab.textContent = `${index + 1}. ${level.n}`;
    tab.setAttribute('aria-pressed', String(index + 1 === lbLevel));
    tabs.appendChild(tab);
  });

  $('lbEmpty').style.display = scores.length ? 'none' : '';
  $('lbClear').style.display = all.length ? '' : 'none';

  const list = $('lbList');
  list.textContent = '';

  scores.forEach((entry, index) => {
    const li = document.createElement('li');
    li.className = `lb-row${entry.id === highlightId ? ' me' : ''}`;

    const rank = document.createElement('span');
    rank.className = 'lb-rank';
    rank.textContent = index + 1;

    const name = document.createElement('span');
    name.className = 'lb-name';
    name.textContent = entry.name;

    const stars = document.createElement('span');
    stars.className = 'lb-stars';
    stars.textContent = '★'.repeat(entry.stars || 0);

    const pts = document.createElement('span');
    pts.className = 'lb-score';
    pts.textContent = entry.score;

    li.append(rank, name, stars, pts);
    list.appendChild(li);
  });
}

function saveCurrentScore() {
  if (!pendingScore) {
    return;
  }

  const name = $('pname').value.trim().slice(0, 12) || 'Player';
  const entry = {
    id: Date.now() + Math.random().toString(36).slice(2, 6),
    level: pendingScore.level,
    name,
    score: pendingScore.score,
    stars: pendingScore.stars,
    date: Date.now(),
  };

  const ok = storeScores(trimScores([...loadScores(), entry]));
  lbLevel = entry.level;

  setLastName(name);
  pendingScore = null;
  $('saveScore').disabled = true;
  $('pname').disabled = true;
  $('saveScore').textContent = ok ? 'Saved ✓' : 'Not saved';
  renderLeaderboard(entry.id);
}

const $ = (id) => document.getElementById(id);

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

  return `<img src="images/${item.key}.svg" alt="" style="width:${sizeFn(width)};height:${sizeFn(height)};transform:translate(-50%,-50%) rotate(${item.rot * 90}deg)">`;
}

function boardArt(item, position, cssClass) {
  const matrix = shape(item);

  return `<div class="art ${cssClass || ''}" style="left:calc((var(--cs) + 3px) * ${position.c});top:calc((var(--cs) + 3px) * ${position.r});width:${boxSize(matrix[0].length)};height:${boxSize(matrix.length)}">${svg(item, boxSize)}</div>`;
}

function renderLevels() {
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
    art.src = `images/${level.bag}.svg`;
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
  $('saveBox').hidden = true;
  pendingScore = null;
  $('msg').textContent = 'Pick an item, then tap the bag to place it.';
  show('game');
  render();
}

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

function fits(item, origin) {
  const occupied = occupiedCells(item.id);

  return shape(item).every((row, rowIndex) =>
    row.every((value, colIndex) => {
      if (!value) {
        return true;
      }

      const y = origin.r + rowIndex;
      const x = origin.c + colIndex;

      return y >= 0 && x >= 0 && y < LEVEL.h && x < LEVEL.w && !occupied[`${y},${x}`];
    }),
  );
}

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

  for (let row = 0; row < LEVEL.h; row += 1) {
    for (let col = 0; col < LEVEL.w; col += 1) {
      let className = 'cell';

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

        return `<button class="item" data-id="${item.id}" aria-pressed="${item.id === selectedId}"><div class="mini" style="width:${tileSize(matrix[0].length)};height:${tileSize(matrix.length)}">${svg(item, tileSize)}</div><span class="nm">${ITEMS[item.key].n}</span>${item.req ? '<span class="req">MUST</span>' : ''}</button>`;
      }).join('')
    : '<span class="nm">Everything is packed!</span>';

  const requiredItems = items.filter((item) => item.req);
  const requiredPacked = requiredItems.filter((item) => item.at).length;

  $('reqTxt').textContent = `Must-pack: ${requiredPacked} of ${requiredItems.length}`;
  $('bar').style.width = `${(requiredPacked / requiredItems.length) * 100}%`;
  $('done').disabled = requiredPacked < requiredItems.length || isDone;
}

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

function rotateSelected() {
  const item = items.find((entry) => entry.id === selectedId);

  if (!item) {
    return;
  }

  item.rot = (item.rot + 1) % 4;
  sfx.rotate();
  render();
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
  stopTimer();
  sfx.lose();
  isDone = true;
  selectedId = null;
  hoveredCell = null;
  render();

  $('stars').textContent = '☆☆☆';
  $('rTitle').textContent = 'Time’s up!';
  $('rText').textContent = 'The bag wasn’t packed in time. Try again, a little faster.';
  $('saveBox').hidden = true;
  $('next').hidden = true;
  $('again').className = 'btn play';
  pendingScore = null;
  $('result').classList.add('show');
}

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
  pendingScore = { score, stars, level: levelIndex + 1 };
  $('pname').value = getLastName();
  $('pname').disabled = false;
  $('saveScore').disabled = false;
  $('saveScore').textContent = 'Save score';
  $('saveBox').hidden = false;
  $('result').classList.add('show');
  render();
  $('pname').focus();
};

$('saveScore').onclick = saveCurrentScore;
$('pname').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    saveCurrentScore();
  }
});

$('lbClear').onclick = () => {
  if (confirm('Clear all saved scores?')) {
    storeScores([]);
    renderLeaderboard();
  }
};

function show(nextScreen) {
  document.body.dataset.s = nextScreen;

  if (nextScreen !== 'game') {
    stopTimer();
  }

  if (nextScreen === 'lb') {
    renderLeaderboard();
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

$('play').onclick = () => show('levels');
$('toLb').onclick = () => {
  $('result').classList.remove('show');
  lbLevel = levelIndex + 1;
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
    lbLevel = +tab.dataset.level;
    renderLeaderboard();
  }
});

const bgm = new Audio('images/audio/intro.mp3');
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
   THEMES (added): Sports theme items, levels and the Themes buttons
   ===================================================================== */

// Sports items go into the same ITEMS table the game already uses,
// so placing, scoring, the tray and the images all work without changes.
// ('shoes' already exists above and is reused as the sneakers.)
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

const ORIGINAL_LEVELS = [...LEVELS];

// Each theme has its own levels, progress (stars/unlocks) and leaderboard.
const THEMES = {
  original: {
    levels: ORIGINAL_LEVELS,
    progressKey: 'fitnpack:progress',
    lbKey: 'fitnpack:leaderboard',
  },
  sports: {
    levels: SPORTS_LEVELS,
    progressKey: 'fitnpack:progress:sports',
    lbKey: 'fitnpack:leaderboard:sports',
  },
};

function applyTheme(name) {
  const theme = THEMES[name] || THEMES.original;

  // swap the contents of LEVELS in place so the rest of the game uses them
  LEVELS.splice(0, LEVELS.length, ...theme.levels);
  PROGRESS_KEY = theme.progressKey;
  LB_KEY = theme.lbKey;

  levelIndex = 0;
  lbLevel = 1;
  LEVEL = LEVELS[0];
  document.body.dataset.theme = name;
}

document.addEventListener('click', (event) => {
  // 'button' matters: applyTheme() puts data-theme on <body>, and a bare
  // '[data-theme]' would then match EVERY click and reset the screen to levels.
  const button = event.target.closest('button[data-theme]');

  if (button) {
    applyTheme(button.dataset.theme);
    show('levels');
  }
});

// Going back to the main menu resets to the Original theme, so Play
// shows the original levels again. (Capture phase = runs before show().)
document.addEventListener(
  'click',
  (event) => {
    if (event.target.closest('[data-go="title"]')) {
      applyTheme('original');
    }
  },
  true,
);

show('title');