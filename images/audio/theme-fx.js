/* Fit-N-Pack · theme-fx.js — visuals only, no game logic */
(() => {
  const body = document.body;
  const $ = (id) => document.getElementById(id);

  const SETS = {
    original: {
      float: ['phone', 'keys', 'wallet', 'lipstick', 'sunglasses', 'camera', 'passport', 'headphones', 'umbrella', 'laptop', 'tablet', 'powerbank'],
      belt: ['suitcase', 'backpack', 'duffel', 'handbag', 'tote', 'sling', 'clutch', 'trolley'],
      hero: 'suitcase',
    },
    school: {
      float: ['pencil', 'ruler', 'eraser', 'notebook', 'scissors', 'highlighter', 'ballpen', 'glue', 'calculator', 'yellowpad', 'idcard', 'lunchbox'],
      belt: ['pencil', 'ruler', 'eraser', 'ballpen', 'highlighter', 'scissors', 'glue', 'calculator'],
      hero: 'backpack',
    },
    sports: {
      float: ['ball', 'jersey', 'towel', 'tape', 'energy-drink', 'shoes', 'bottle', 'sneakers'],
      belt: ['ball', 'jersey', 'shoes', 'towel', 'energy-drink', 'tape'],
      hero: 'ball',
    },
    vacation: {
      float: ['sunglasses', 'umbrella', 'camera', 'passport', 'shoes', 'bottle', 'tablet', 'headphones'],
      belt: ['suitcase', 'duffel', 'tote', 'sling', 'sunglasses', 'umbrella'],
      hero: 'suitcase',
    },
  };

  const picture = (name) => {
    const img = new Image();
    img.src = `images/${name}.svg`;
    img.alt = '';
    img.draggable = false;
    return img;
  };

  let built = null;

  function build() {
    const key = SETS[body.dataset.theme] ? body.dataset.theme : 'original';

    if (key === built) {
      return;
    }

    built = key;
    const set = SETS[key];

    const decor = $('decor');
    decor.textContent = '';
    set.float.forEach((name, i) => {
      const img = picture(name);
      const size = 44 + ((i * 17) % 46);
      img.className = 'fx-float';
      img.style.cssText = `width:${size}px;height:${size}px;left:${(i * 83 + 7) % 92}%;top:${(i * 47 + 11) % 86}%;--r:${((i * 37) % 60) - 30}deg;--d:${7 + (i % 5) * 2}s;animation-delay:-${i * 1.3}s`;
      decor.appendChild(img);
    });

    const track = document.createElement('div');
    track.className = 'belt-track';
    [0, 1].forEach(() => set.belt.forEach((name) => track.appendChild(picture(name))));
    $('belt').textContent = '';
    $('belt').appendChild(track);

    const hero = document.querySelector('.hero');

    if (hero) {
      hero.src = `images/${set.hero}.svg`;
    }
  }

  // title letters wave one after another
  const big = document.querySelector('.big');

  if (big) {
    const text = big.textContent;
    big.setAttribute('aria-label', text);
    big.textContent = '';
    [...text].forEach((ch, i) => {
      const span = document.createElement('span');
      span.textContent = ch;
      span.setAttribute('aria-hidden', 'true');
      span.style.setProperty('--i', i);
      big.appendChild(span);
    });
  }

  // confetti when you earn 2+ stars (pencils and stars in the School theme)
  const COLORS = ['#d3ff6c', '#f2c230', '#ff7a59', '#5ad1ff', '#ff6fb5'];
  const EMOJI = ['✏️', '⭐', '📏', '📚', '🖍️'];

  function confetti() {
    const school = body.dataset.theme === 'school';

    for (let i = 0; i < 46; i += 1) {
      const bit = document.createElement('i');
      bit.className = 'confetti';
      bit.style.left = `${Math.random() * 100}%`;
      bit.style.setProperty('--x', `${Math.random() * 160 - 80}px`);
      bit.style.setProperty('--rot', `${Math.random() * 720 - 360}deg`);
      bit.style.setProperty('--t', `${1.6 + Math.random() * 1.4}s`);

      if (school) {
        bit.classList.add('emo');
        bit.textContent = EMOJI[i % EMOJI.length];
      } else {
        bit.style.background = COLORS[i % COLORS.length];
      }

      document.body.appendChild(bit);
      setTimeout(() => bit.remove(), 3200);
    }
  }

  const result = $('result');
  let wasShown = false;

  new MutationObserver(() => {
    const shown = result.classList.contains('show');
    const stars = ($('stars').textContent.match(/★/g) || []).length;

    if (shown && !wasShown && stars >= 2 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      confetti();
    }

    wasShown = shown;
  }).observe(result, { attributes: true, attributeFilter: ['class'] });

  new MutationObserver(build).observe(body, { attributes: true, attributeFilter: ['data-theme'] });
  build();
})();
