// ============ СОСТОЯНИЕ ============
let state = {
  money: 0,
  unlockedCarWash: false,
  unlockedCourier: false,
  isStanding: false,
  soundOn: true,
  path: null
};

let lastGoalReached = -1;
let upgradesState = {};
let pendingGoals = [];

// ============ ЗВУКИ ============
let audioCtx = null;
let soundOn = true;

function initAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch(e) { soundOn = false; }
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}

function beep(freq, duration, type = 'sine', vol = 0.1, delay = 0) {
  if (!soundOn || !audioCtx) return;
  const start = audioCtx.currentTime + delay;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(vol, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.start(start); osc.stop(start + duration);
}

function soundTap()      { initAudio(); beep(700 + Math.random() * 300, 0.06, 'sine', 0.12); }
function soundCollect()  { initAudio(); beep(880, 0.07, 'triangle', 0.15); beep(1320, 0.1, 'triangle', 0.1, 0.05); }
function soundCoin()     { initAudio(); beep(1200, 0.08, 'square', 0.1); beep(1600, 0.12, 'square', 0.1, 0.06); beep(2000, 0.15, 'square', 0.08, 0.12); }
function soundUpgrade()  { initAudio(); [523, 659, 784, 1047].forEach((f, i) => beep(f, 0.15, 'triangle', 0.12, i * 0.08)); }
function soundDrone()    { initAudio(); beep(180, 0.4, 'sawtooth', 0.06); beep(280, 0.3, 'sine', 0.05, 0.1); }
function soundError()    { initAudio(); beep(150, 0.25, 'sawtooth', 0.1); }
function soundGoal()     { initAudio(); [523, 659, 784, 1047, 1319].forEach((f, i) => beep(f, 0.35, 'triangle', 0.15, i * 0.12)); }
function soundCombo(n)   { initAudio(); beep(600 + n * 100, 0.1, 'square', 0.15); }
function soundWash()     { initAudio(); beep(700 + Math.random() * 400, 0.04, 'sine', 0.06); }
function soundEngine()   { initAudio(); beep(80, 1.2, 'sawtooth', 0.08); beep(120, 1.0, 'sawtooth', 0.06, 0.1); }
function soundWinner()   { initAudio(); [523, 659, 784, 1047, 1319, 1568, 2093].forEach((f, i) => beep(f, 0.5, 'triangle', 0.18, i * 0.15)); }
function soundShine()    { initAudio(); [1047, 1319, 1568, 2093].forEach((f, i) => beep(f, 0.1, 'triangle', 0.1, i * 0.05)); }

// ===== ЗВУКИ ВЕТКИ ПРОГРАММИСТА =====
function soundType()     { initAudio(); beep(1300 + Math.random() * 700, 0.025, 'square', 0.045); }
function soundBugSquash(){ initAudio(); beep(320, 0.05, 'square', 0.1); beep(900, 0.09, 'triangle', 0.11, 0.04); }
function soundKeyboard() { initAudio(); [523, 659, 784].forEach((f, i) => beep(f, 0.09, 'square', 0.07, i * 0.05)); }

function soundStandUp() {
  if (!soundOn || !audioCtx) return;
  const now = audioCtx.currentTime;
  beep(90, 0.4, 'sawtooth', 0.1);
  beep(110, 0.5, 'triangle', 0.08, 0.1);
  const bufferSize = audioCtx.sampleRate * 0.5;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
  }
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 800;
  filter.Q.value = 1.5;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.15, now + 0.3);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
  noise.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
  noise.start(now + 0.3);
}

function screenFlash() {
  const el = document.getElementById('screen-flash');
  if (!el) return;
  el.classList.add('on');
  setTimeout(() => el.classList.remove('on'), 60);
}

// ============ МУЗЫКА ============
let musicPlaying = false;
let currentMusic = null;
let musicToken = 0;

function startMusic(type = 'street') {
  if (!soundOn || !audioCtx) return;
  if (musicPlaying && currentMusic === type) return;

  musicToken++;
  const myToken = musicToken;

  musicPlaying = false;
  currentMusic = type;

  setTimeout(() => {
    if (myToken !== musicToken) return;
    if (!soundOn || !audioCtx) return;
    musicPlaying = true;

    if (type === 'street') {
      const bassNotes = [130.81, 130.81, 146.83, 130.81, 155.56, 130.81, 146.83, 123.47];
      const arpNotes = [261.63, 311.13, 392.00, 523.25, 392.00, 311.13];
      let bassStep = 0;
      let arpStep = 0;

      function playBass() {
        if (!musicPlaying || currentMusic !== 'street' || !soundOn || !audioCtx) return;
        const freq = bassNotes[bassStep % bassNotes.length];
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 0.6);
        bassStep++;
        setTimeout(playBass, 650);
      }

      function playArp() {
        if (!musicPlaying || currentMusic !== 'street' || !soundOn || !audioCtx) return;
        const freq = arpNotes[arpStep % arpNotes.length];
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 0.45);
        arpStep++;
        setTimeout(playArp, 325);
      }

      playBass();
      playArp();

    } else if (type === 'wash') {
      const bassNotes = [110.00, 110.00, 130.81, 110.00, 87.31, 110.00, 123.47, 98.00];
      const melodyNotes = [440.00, 523.25, 587.33, 523.25, 440.00, 392.00, 349.23, 392.00];
      const padNotes = [220.00, 261.63, 220.00, 174.61];
      let bassStep = 0;
      let melodyStep = 0;
      let padStep = 0;

      function playBass() {
        if (!musicPlaying || currentMusic !== 'wash' || !soundOn || !audioCtx) return;
        const freq = bassNotes[bassStep % bassNotes.length];
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.10, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.4);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 1.4);
        bassStep++;
        setTimeout(playBass, 1400);
      }

      function playMelody() {
        if (!musicPlaying || currentMusic !== 'wash' || !soundOn || !audioCtx) return;
        const freq = melodyNotes[melodyStep % melodyNotes.length];
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.07, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.0);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 1.0);
        melodyStep++;
        setTimeout(playMelody, 900);
      }

      function playPad() {
        if (!musicPlaying || currentMusic !== 'wash' || !soundOn || !audioCtx) return;
        const freq = padNotes[padStep % padNotes.length];
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 3.5);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 3.5);
        padStep++;
        setTimeout(playPad, 3500);
      }

      playBass();
      playMelody();
      playPad();
    }
  }, 100);
}

function stopMusic() {
  // Токен гасит отложенный setTimeout из прошлого startMusic:
  // иначе старый цикл мог проснуться и играть поверх нового (зомби-музыка)
  musicToken++;
  musicPlaying = false;
  currentMusic = null;
}

// ============ ДОЖДЬ (ЗВУК) ============
let rainSoundNode = null;

function startRainSound() {
  if (!soundOn || !audioCtx || rainSoundNode) return;

  const bufferSize = 4 * audioCtx.sampleRate;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);

  let lastOut = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    lastOut = (lastOut + 0.015 * white) / 1.015;
    data[i] = lastOut * 3.0;
  }

  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1800;
  filter.Q.value = 0.7;

  const hp = audioCtx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 100;

  const gain = audioCtx.createGain();
  gain.gain.value = 0.055;

  noise.connect(hp); hp.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
  noise.start();

  let dropletTimer = null;
  function scheduleDroplet() {
    if (!rainSoundNode) return;
    dropletTimer = setTimeout(() => {
      if (!rainSoundNode || !soundOn || !audioCtx) return;
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      const f = audioCtx.createBiquadFilter();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200 + Math.random() * 800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);
      f.type = 'bandpass';
      f.frequency.value = 1500;
      f.Q.value = 8;
      g.gain.setValueAtTime(0.04 + Math.random() * 0.03, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(f); f.connect(g); g.connect(audioCtx.destination);
      osc.start(now); osc.stop(now + 0.1);
      scheduleDroplet();
    }, 200 + Math.random() * 800);
  }
  scheduleDroplet();

  rainSoundNode = { noise, gain, dropletTimer };
}

function stopRainSound() {
  if (rainSoundNode) {
    try { rainSoundNode.noise.stop(); } catch(e) {}
    if (rainSoundNode.dropletTimer) clearTimeout(rainSoundNode.dropletTimer);
    rainSoundNode = null;
  }
}

// ============ ЗВУК ВКЛ/ВЫКЛ ============
function toggleSound() {
  soundOn = !soundOn;
  state.soundOn = soundOn;
  save();

  const btn = document.getElementById('btn-sound');
  if (btn) btn.innerText = soundOn ? '🔊 ЗВУК: ВКЛ' : '🔇 ЗВУК: ВЫКЛ';

  if (soundOn) {
    initAudio();
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    musicPlaying = false;
    currentMusic = null;
    if (rainSoundNode) {
      try { rainSoundNode.noise.stop(); } catch(e) {}
      if (rainSoundNode.dropletTimer) clearTimeout(rainSoundNode.dropletTimer);
      rainSoundNode = null;
    }
    if (state.path === 'programmer') {
      startMusic(upgradesState.job ? 'wash' : 'street');
    } else if (state.unlockedCarWash) {
      startMusic('wash');
    } else {
      startMusic('street');
      startRainSound();
    }
  } else {
    stopMusic();
    stopRainSound();
  }
}

function enableAudioOnFirstClick() {
  document.addEventListener('click', function () {
    initAudio();
    if (!soundOn) return;

    const carwash = document.getElementById('mg-carwash');
    if (carwash && carwash.classList.contains('active')) return;

    const mgScene = document.getElementById('mg-scene');
    if (mgScene && mgScene.classList.contains('active')) return;

    if (!musicPlaying) {
      if (state.path === 'programmer') startMusic(upgradesState.job ? 'wash' : 'street');
      else if (state.unlockedCarWash) startMusic('wash');
      else startMusic('street');
    }
    if (!state.unlockedCarWash && !state.path && !rainSoundNode) startRainSound();
  });
}

// ============ SVG МОНЕТА ============
const COIN_SVG = `
  <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
    <rect x="5" y="0" width="6" height="1" fill="#7c3a00"/>
    <rect x="3" y="1" width="10" height="1" fill="#7c3a00"/>
    <rect x="2" y="2" width="12" height="1" fill="#7c3a00"/>
    <rect x="1" y="3" width="14" height="1" fill="#7c3a00"/>
    <rect x="1" y="4" width="14" height="8" fill="#7c3a00"/>
    <rect x="1" y="12" width="14" height="1" fill="#7c3a00"/>
    <rect x="2" y="13" width="12" height="1" fill="#7c3a00"/>
    <rect x="3" y="14" width="10" height="1" fill="#7c3a00"/>
    <rect x="5" y="15" width="6" height="1" fill="#7c3a00"/>
    <rect x="2" y="3" width="12" height="10" fill="#ffcc00"/>
    <rect x="3" y="2" width="10" height="12" fill="#ffcc00"/>
    <rect x="3" y="3" width="10" height="1" fill="#ffe680"/>
    <rect x="2" y="4" width="12" height="1" fill="#ffe680"/>
    <rect x="2" y="12" width="12" height="1" fill="#b37700"/>
    <rect x="3" y="13" width="10" height="1" fill="#b37700"/>
    <rect x="4" y="4" width="2" height="2" fill="#fff8b0"/>
    <rect x="4" y="6" width="1" height="1" fill="#fff8b0"/>
    <rect x="6" y="5" width="1" height="6" fill="#7c3a00"/>
    <rect x="7" y="5" width="3" height="1" fill="#7c3a00"/>
    <rect x="9" y="6" width="1" height="1" fill="#7c3a00"/>
    <rect x="8" y="7" width="2" height="1" fill="#7c3a00"/>
    <rect x="7" y="8" width="3" height="1" fill="#7c3a00"/>
    <rect x="6" y="9" width="1" height="2" fill="#7c3a00"/>
  </svg>
`;

// ============ МАШИНЫ ============
const CARS = [
  { id: 1, name: 'Спорткар' },
  { id: 2, name: 'Внедорожник' },
  { id: 3, name: 'Минивэн' },
  { id: 4, name: 'Седан' }
];

function getRandomCar() {
  return CARS[Math.floor(Math.random() * CARS.length)];
}

// ============ УЛУЧШЕНИЯ ============
const ALL_UPGRADES = [
  { id: 'sneakers', icon: '👟', name: 'Кроссовки',    desc: '+30% к цене мусора',       price: 100,   tier: 'trash', bonus: 0.3 },
  { id: 'cart',     icon: '🛒', name: 'Тележка',      desc: '+60% к цене мусора',       price: 500,   tier: 'trash', bonus: 0.6 },
  { id: 'phone',    icon: '📱', name: 'Телефон',      desc: '+120% к цене мусора',      price: 1500,  tier: 'trash', bonus: 1.2 },
  { id: 'dog',      icon: '🐕', name: 'Собака',       desc: 'Пассив +25 ₽/сек',         price: 3000,  tier: 'trash', passive: 25 },
  { id: 'oldcar',   icon: '🚗', name: 'СТАРАЯ ТАЧКА', desc: '🎉 ОТКРЫВАЕТ АВТОМОЙКУ!',  price: 8000,  tier: 'trash', special: 'carwash' },

  { id: 'sponge',   icon: '🧼', name: 'Моющее средство', desc: '+50% к цене за машину',   price: 3000,   tier: 'wash', bonus: 0.5 },
  { id: 'hose',     icon: '💦', name: 'Шланг высокого давления', desc: 'Губка стирает в 2 раза быстрее!', price: 7000, tier: 'wash', speed: 2.0 },
  { id: 'foam',     icon: '🫧', name: 'Пена-шампунь',  desc: '+100% к цене за машину',   price: 15000,  tier: 'wash', bonus: 1.0 },
  { id: 'wax',      icon: '🧴', name: 'Воск',          desc: 'Каждая 5-я машина даёт x2!', price: 30000, tier: 'wash', bonus5: 2.0 },
  { id: 'manager',  icon: '🕴️', name: 'Менеджер',      desc: 'Пассив +800 ₽/сек',        price: 45000, tier: 'wash', passive: 800 },
  { id: 'fork',     icon: '🌟', name: 'РАЗВИЛКА',      desc: '🎉 ВЫБЕРИ СВОЙ ПУТЬ!',      price: 100000, tier: 'wash', special: 'fork' },

  // ===== ЭТАП ФРИЛАНС =====
  { id: 'keyboard', icon: '👨💻', name: 'Клавиатура',        desc: '+50% к цене заказа',        price: 12000,  tier: 'freelance', bonus: 0.5 },
  { id: 'monitor',  icon: '🖥️', name: 'Второй монитор',     desc: '+100% к цене заказа',       price: 35000,  tier: 'freelance', bonus: 1.0 },
  { id: 'ai',       icon: '🤖', name: 'Нейронка-ассистент', desc: 'Тап пишет сразу 2 слова!',  price: 80000,  tier: 'freelance', speed: 2.0 },
  { id: 'pc',       icon: '🖲️', name: 'Новый ПК',           desc: 'Пассив +2 000 ₽/сек',       price: 180000, tier: 'freelance', passive: 2000 },
  { id: 'job',      icon: '💼', name: 'УСТРОЙСЯ В IT',      desc: '🎉 ОТКРЫВАЕТ ОФИС!',        price: 300000, tier: 'freelance', special: 'job' },

  // ===== ЭТАП ОФИС (АЙТИШНИК) =====
  { id: 'debugger', icon: '🐞', name: 'Отладчик',      desc: '+50% к зарплате',             price: 350000, tier: 'office', bonus: 0.5 },
  { id: 'mentor',   icon: '🧑🏫', name: 'Сеньор-ментор', desc: 'Чинишь баги в 2 раза быстрее', price: 500000, tier: 'office', speed: 2.0 },
  { id: 'lead',     icon: '📊', name: 'Тимлид',        desc: 'Пассив +5 000 ₽/сек',         price: 650000, tier: 'office', passive: 5000 },
  { id: 'product',  icon: '🚀', name: 'СВОЙ ПРОДУКТ',  desc: '🎉 ЗАПУСКАЕТ ПРОДУКТ!',       price: 800000, tier: 'office', special: 'product' },

  // ===== ЭТАП СВОЙ ПРОДУКТ =====
  { id: 'users',    icon: '👥', name: 'Первые юзеры',  desc: 'Пассив +20 000 ₽/сек',        price: 150000, tier: 'product', passive: 20000 },
  { id: 'server',   icon: '☁️', name: 'Серверы',       desc: '+100% к доходу продукта',     price: 250000, tier: 'product', bonus: 1.0 },
  { id: 'invest',   icon: '💰', name: 'Инвестиции',    desc: 'Пассив +40 000 ₽/сек',        price: 400000, tier: 'product', passive: 40000 }
];

// Активный тир улучшений. Ветка программиста идёт freelance → office → product,
// до неё — мусорка → автомойка.
function getCurrentTier() {
  if (state.path === 'programmer') {
    if (upgradesState.product) return 'product';
    if (upgradesState.job)     return 'office';
    return 'freelance';
  }
  return state.unlockedCarWash ? 'wash' : 'trash';
}

function getActiveUpgrades() {
  const tier = getCurrentTier();
  return ALL_UPGRADES.filter(u => u.tier === tier);
}

// Множитель считается ТОЛЬКО по улучшениям активного тира:
// кроссовки с помойки больше не подкручивают цены на автомойке.
function getMoneyMultiplier() {
  const tier = getCurrentTier();
  let mult = 1;
  ALL_UPGRADES.forEach(u => {
    if (u.tier === tier && u.bonus && upgradesState[u.id]) mult += u.bonus;
  });
  return mult;
}

// Пассивка — глобальная: кого нанял, тот работает всегда.
// Плюс сам продукт приносит деньги, а «Серверы» удваивают его отдачу.
function getPassiveIncome() {
  let income = 0;
  ALL_UPGRADES.forEach(u => {
    if (u.passive && upgradesState[u.id]) income += u.passive;
  });
  if (upgradesState.product) {
    let prodBase = 10000;
    if (upgradesState.server) prodBase *= 2;
    income += prodBase;
  }
  return income;
}

function getWashSpeed() {
  let speed = 0.003;
  if (upgradesState.hose) speed *= 2.0;
  return speed;
}

const GOALS = [
  // ===== ЭТАП МУСОРКИ =====
  { type: 'money',   money: 100,    title: 'НАКОПИ 100 ₽' },
  { type: 'upgrade', upgrade: 'sneakers', title: 'КУПИ КРОССОВКИ' },
  { type: 'money',   money: 500,    title: 'НАКОПИ 500 ₽' },
  { type: 'upgrade', upgrade: 'cart',     title: 'КУПИ ТЕЛЕЖКУ' },
  { type: 'money',   money: 1500,   title: 'НАКОПИ 1 500 ₽' },
  { type: 'upgrade', upgrade: 'phone',    title: 'КУПИ ТЕЛЕФОН' },
  { type: 'money',   money: 3000,   title: 'НАКОПИ 3 000 ₽' },
  { type: 'upgrade', upgrade: 'dog',      title: 'ЗАВЕДИ СОБАКУ' },
  { type: 'money',   money: 8000,   title: 'НАКОПИ 8 000 ₽' },
  { type: 'upgrade', upgrade: 'oldcar',   title: '🚗 КУПИ СТАРУЮ ТАЧКУ' },

  // ===== ЭТАП АВТОМОЙКИ =====
  { type: 'money',   money: 3000,   title: 'НАКОПИ 3 000 ₽' },
  { type: 'upgrade', upgrade: 'sponge',   title: 'КУПИ МОЮЩЕЕ СРЕДСТВО' },
  { type: 'money',   money: 7000,   title: 'НАКОПИ 7 000 ₽' },
  { type: 'upgrade', upgrade: 'hose',     title: 'КУПИ ШЛАНГ' },
  { type: 'money',   money: 15000,  title: 'НАКОПИ 15 000 ₽' },
  { type: 'upgrade', upgrade: 'foam',     title: 'КУПИ ПЕНУ' },
  { type: 'money',   money: 30000,  title: 'НАКОПИ 30 000 ₽' },
  { type: 'upgrade', upgrade: 'wax',      title: 'КУПИ ВОСК' },
  { type: 'money',   money: 45000,  title: 'НАКОПИ 45 000 ₽' },
  { type: 'upgrade', upgrade: 'manager',  title: 'НАЙМИ МЕНЕДЖЕРА' },
  
  // ===== ФИНАЛЬНАЯ ЦЕЛЬ (заменено с 500 000 на 100 000) =====
  { type: 'money',   money: 100000, title: 'НАКОПИ 100 000 ₽' },
  
  { type: 'upgrade', upgrade: 'fork',     title: '🌟 РАЗВИЛКА (выбери путь)' },

  // ===== ВЕТКА ПРОГРАММИСТА: ФРИЛАНС =====
  { type: 'money',   money: 30000,  title: 'НАКОПИ 30 000 ₽' },
  { type: 'upgrade', upgrade: 'keyboard', title: 'КУПИ КЛАВИАТУРУ' },
  { type: 'money',   money: 60000,  title: 'НАКОПИ 60 000 ₽' },
  { type: 'upgrade', upgrade: 'monitor',  title: 'КУПИ ВТОРОЙ МОНИТОР' },
  { type: 'money',   money: 120000, title: 'НАКОПИ 120 000 ₽' },
  { type: 'upgrade', upgrade: 'ai',       title: 'ПОДКЛЮЧИ НЕЙРОНКУ' },
  { type: 'money',   money: 200000, title: 'НАКОПИ 200 000 ₽' },
  { type: 'upgrade', upgrade: 'pc',       title: 'КУПИ НОВЫЙ ПК' },
  { type: 'money',   money: 300000, title: 'НАКОПИ 300 000 ₽' },
  { type: 'upgrade', upgrade: 'job',      title: '💼 УСТРОЙСЯ В IT-КОМПАНИЮ' },

  // ===== ВЕТКА ПРОГРАММИСТА: ОФИС =====
  { type: 'money',   money: 400000, title: 'НАКОПИ 400 000 ₽' },
  { type: 'upgrade', upgrade: 'debugger', title: 'КУПИ ОТЛАДЧИК' },
  { type: 'money',   money: 550000, title: 'НАКОПИ 550 000 ₽' },
  { type: 'upgrade', upgrade: 'mentor',   title: 'НАЙДИ СЕНЬОРА-МЕНТОРА' },
  { type: 'money',   money: 700000, title: 'НАКОПИ 700 000 ₽' },
  { type: 'upgrade', upgrade: 'lead',     title: '🏆 СТАНЬ ТИМЛИДОМ' },
  { type: 'money',   money: 850000, title: 'НАКОПИ 850 000 ₽' },
  { type: 'upgrade', upgrade: 'product',  title: '🚀 ЗАПУСТИ СВОЙ ПРОДУКТ' },

  // ===== ВЕТКА ПРОГРАММИСТА: СВОЙ ПРОДУКТ =====
  { type: 'money',   money: 300000, title: 'НАКОПИ 300 000 ₽' },
  { type: 'upgrade', upgrade: 'users',    title: 'ПРИВЛЕКИ ПЕРВЫХ ЮЗЕРОВ' },
  { type: 'money',   money: 400000, title: 'НАКОПИ 400 000 ₽' },
  { type: 'upgrade', upgrade: 'server',   title: 'ПОДНЯТЬ СЕРВЕРЫ' },
  { type: 'money',   money: 600000, title: 'НАКОПИ 600 000 ₽' },
  { type: 'upgrade', upgrade: 'invest',   title: 'ВЛОЖИ В ИНВЕСТИЦИИ' },

  // ===== ФИНАЛ =====
  { type: 'money',   money: 1000000, final: true, title: 'НАКОПИ 1 000 000 ₽' }
];


function isGoalDone(goal) {
  if (goal.type === 'money') return state.money >= goal.money;
  if (goal.type === 'upgrade') return !!upgradesState[goal.upgrade];
  return false;
}
function getCurrentGoalIndex() { return Math.min(lastGoalReached + 1, GOALS.length - 1); }

// Тихо проматывает цели, которые уже выполнены на момент смены этапа.
// Нужно, чтобы после покупки «Старой тачки» или «Устройся в IT» не вылетала
// плашка «ЦЕЛЬ ДОСТИГНУТА» за деньги, которые ты просто перенёс с прошлого этапа.
function syncGoalsSilently() {
  let next = lastGoalReached + 1;
  while (next < GOALS.length && isGoalDone(GOALS[next])) {
    lastGoalReached = next;
    next++;
  }
  save();
  updateGoalPanel();
}

function updateGoalPanel() {
  const panel = document.getElementById('goal-panel');
  if (!panel) return;
  panel.style.display = 'block';

  const titleEl = document.getElementById('goal-title');
  const hintEl = document.getElementById('goal-hint');
  const fillEl = document.getElementById('goal-progress');
  if (!titleEl || !hintEl || !fillEl) return;

  // Всё пройдено — вместо цели вешаем табличку победителя
  if (lastGoalReached >= GOALS.length - 1) {
    titleEl.innerText = '🏆 ТЫ МИЛЛИОНЕР!';
    fillEl.style.width = '100%';
    hintEl.innerText = 'Игра пройдена — ты в 1%';
    return;
  }

  const goal = GOALS[getCurrentGoalIndex()];
  titleEl.innerText = goal.title;

  if (goal.type === 'money') {
    const progress = Math.min(100, (state.money / goal.money) * 100);
    fillEl.style.width = progress + '%';
    hintEl.innerText = `${Math.min(state.money, goal.money).toLocaleString()} / ${goal.money.toLocaleString()} ₽`;
  } else if (goal.type === 'upgrade') {
    const upg = ALL_UPGRADES.find(u => u.id === goal.upgrade);
    if (upg) {
      const progress = Math.min(100, (state.money / upg.price) * 100);
      fillEl.style.width = progress + '%';
      hintEl.innerText = `${Math.min(state.money, upg.price).toLocaleString()} / ${upg.price.toLocaleString()} ₽ — открой ⚙️`;
    }
  }
}

function checkGoalComplete() {
  let nextIndex = lastGoalReached + 1;
  if (nextIndex >= GOALS.length) return;

  let newGoals = false;
  while (nextIndex < GOALS.length && isGoalDone(GOALS[nextIndex])) {
    lastGoalReached = nextIndex;
    pendingGoals.push(nextIndex);
    newGoals = true;
    nextIndex++;
  }

  if (newGoals) {
    save();
    const mgScene = document.getElementById('mg-scene');
    const shopScene = document.getElementById('shop-scene');
    const carwashScene = document.getElementById('mg-carwash');
    const bossScene = document.getElementById('boss-scene');
    const directorScene = document.getElementById('director-scene');
    const mgActive = mgScene && mgScene.classList.contains('active');
    const shopActive = shopScene && shopScene.classList.contains('active');
    const carwashActive = carwashScene && carwashScene.classList.contains('active');
    const bossActive = bossScene && bossScene.classList.contains('active');
    const directorActive = directorScene && directorScene.classList.contains('active');

    // Плашку не поднимаем, пока открыт любой экранный оверлей:
    // закрытие босс-/директор-сцены само вызовет checkGoalComplete
    if (!mgActive && !shopActive && !carwashActive && !bossActive && !directorActive && !cutsceneRunning) {
      processPendingGoals();
    }
  }
}

function processPendingGoals() {
  if (cutsceneRunning) return;
  if (pendingGoals.length === 0) return;
  const screen = document.getElementById('goal-complete');
  if (screen && screen.classList.contains('active')) return;
  // Не вылезаем поверх босса/директора — их закрытие вернёт нас сюда
  for (const id of ['boss-scene', 'director-scene']) {
    const el = document.getElementById(id);
    if (el && el.classList.contains('active')) return;
  }

  const idx = pendingGoals.shift();
  showGoalComplete(GOALS[idx]);
}

function showGoalComplete(goal) {
  const screen = document.getElementById('goal-complete');
  const textEl = document.getElementById('goal-complete-text');
  const rewardEl = document.getElementById('goal-complete-reward');

  let text = '';
  if (goal.type === 'money') text = `Надо накопить ${goal.money.toLocaleString()} ₽`;
  else if (goal.type === 'upgrade') {
    const upg = ALL_UPGRADES.find(u => u.id === goal.upgrade);
    text = `Ты купил: ${upg ? upg.name : ''}`;
  }

  textEl.innerText = text;
  rewardEl.innerText = '';
  rewardEl.style.display = 'none';

  if (goal.final) {
    soundWinner();
    textEl.innerText = '🏆 ТЫ СТАЛ МИЛЛИОНЕРОМ!';
    rewardEl.innerText = 'ИГРА ПРОЙДЕНА!';
    rewardEl.style.display = 'block';
    screenFlash();
  } else {
    soundGoal();
  }

  save();
  screen.classList.add('active');
  setTimeout(() => screen.classList.add('visible'), 50);
}

function closeGoalComplete() {
  const screen = document.getElementById('goal-complete');
  screen.classList.remove('visible');
  setTimeout(() => {
    screen.classList.remove('active');
    updateGoalPanel();
    const bal = document.getElementById('balance');
    if (bal) bal.innerText = state.money.toLocaleString() + ' ₽';
    if (state.isStanding) showWork();

    if (pendingGoals.length > 0) {
      setTimeout(processPendingGoals, 300);
    }
  }, 400);
}

// ============ СОХРАНЕНИЕ ============
function save() {
  localStorage.setItem('bomzh_save', JSON.stringify({
    ...state,
    soundOn,
    lastGoalReached,
    upgradesState,
    releaseCooldown,
    releaseReady
  }));
}
function load() {
  const saved = localStorage.getItem('bomzh_save');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      state = { ...state, ...parsed };
      if (parsed.soundOn !== undefined) {
        soundOn = parsed.soundOn;
        state.soundOn = parsed.soundOn;
      }
      if (parsed.lastGoalReached !== undefined) lastGoalReached = parsed.lastGoalReached;
      if (parsed.upgradesState) upgradesState = { ...upgradesState, ...parsed.upgradesState };
      if (parsed.releaseCooldown !== undefined) releaseCooldown = parsed.releaseCooldown;
      if (parsed.releaseReady !== undefined) releaseReady = !!parsed.releaseReady;
    } catch(e) {}
  }
}
function reset() { localStorage.removeItem('bomzh_save'); location.reload(); }

// ============ 🧪 ЧИТ ============
// Чит только для разработки: в проде выключен.
// Включается в консоли: localStorage.setItem('bomzh_dev', '1')
function cheatMoney() {
  if (localStorage.getItem('bomzh_dev') !== '1') {
    showFloatText('🔒 Чит только в dev-режиме', window.innerWidth / 2, window.innerHeight / 2);
    return;
  }
  state.money += 10000000;
  save();
  soundCoin();
  screenFlash();
  showFloatText('💎 +10 000 000 ₽', window.innerWidth / 2, window.innerHeight / 2);
  const bal = document.getElementById('balance');
  if (bal) bal.innerText = state.money.toLocaleString() + ' ₽';
  updateGoalPanel();
}

// ============ СЦЕНЫ ============
function setScene(num) {
  document.querySelectorAll('.scene').forEach(el => {
    el.style.opacity = '0';
    el.classList.remove('active');
  });
  const el = document.getElementById('scene-' + num);
  if (el) { el.style.opacity = '1'; el.classList.add('active'); }
}

function setSceneCustom(sceneId) {
  document.querySelectorAll('.scene').forEach(el => {
    el.style.opacity = '0';
    el.classList.remove('active');
  });
  const el = document.getElementById(sceneId);
  if (el) {
    el.style.opacity = '1';
    el.classList.add('active');
  }
}

// ============ ГЛАВНЫЙ ЭКРАН ============
function showStart() {
  setScene(1);
  document.getElementById('ui').style.display = 'flex';
  document.getElementById('ui').innerHTML = `
    <h1>Ты лежишь в помойке</h1>
    <p>Холодно. Грязно. Голодно.</p>
    <button class="btn" onclick="standUp()" onmousedown="soundTap()">ВЫЛЕЗТИ</button>
    <button class="btn btn-gray" onclick="toggleSound()" onmousedown="soundTap()" id="btn-sound">${soundOn ? '🔊 ЗВУК: ВКЛ' : '🔇 ЗВУК: ВЫКЛ'}</button>
    <button class="btn btn-gray" onclick="reset()" onmousedown="soundTap()">СБРОСИТЬ ПРОГРЕСС</button>
  `;
}

function standUp() {
  soundTap();
  initAudio();
  soundStandUp();
  document.getElementById('ui').style.display = 'none';
  setScene(2);
  setTimeout(() => setScene(3), 900);
  setTimeout(() => { state.isStanding = true; save(); showWork(); }, 1800);
}

function showWork() {
  // Ветка программиста — свой экран работы
  if (state.path === 'programmer') {
    showProgrammerWork();
    return;
  }
  // Остальные ветки ещё в разработке — держим экран-заглушку
  if (state.path) {
    showForkScreen();
    return;
  }

  if (state.unlockedCarWash) {
    setSceneCustom('scene-3-carwash');
    stopRainSound();
    const rainCanvas = document.getElementById('rain-canvas');
    if (rainCanvas) rainCanvas.style.display = 'none';
    if (soundOn) startMusic('wash');
  } else {
    setSceneCustom('scene-3');
    if (soundOn) startRainSound();
    const rainCanvas = document.getElementById('rain-canvas');
    if (rainCanvas) rainCanvas.style.display = '';
    if (soundOn) startMusic('street');
  }

  document.getElementById('scenes').classList.remove('hidden');
  updateGoalPanel();
  startDrones();

  const ui = document.getElementById('ui');
  ui.style.display = 'flex';
  const passive = getPassiveIncome();

  let btnText = state.unlockedCarWash ? "🚗 МЫТЬ МАШИНЫ" : "🗑️ СОБРАТЬ МУСОР";
  let levelName = state.unlockedCarWash ? "🚗 АВТОМОЙКА" : "🗑️ МУСОРКА";

  ui.innerHTML = `
    <div style="font-size:9px; color:#00f3ff; margin-bottom:-5px;">${levelName}</div>
    <div class="balance" id="balance">${state.money.toLocaleString()} ₽</div>
    ${passive > 0 ? `<div style="font-size:9px; color:#00ff66; margin-top:-8px;">+${passive} ₽/сек</div>` : ''}
    <button class="btn" id="btn-collect" onclick="startGameRouter()" onmousedown="soundTap()">${btnText}</button>
    <button class="btn btn-cyan" onclick="openUpgrades()" onmousedown="soundTap()">⚙️ УЛУЧШЕНИЯ</button>
    <button class="btn btn-gray" onclick="toggleSound()" onmousedown="soundTap()" id="btn-sound">${soundOn ? '🔊 ЗВУК: ВКЛ' : '🔇 ЗВУК: ВЫКЛ'}</button>
    <button class="btn btn-gray" onclick="reset()" onmousedown="soundTap()">СБРОСИТЬ</button>
  `;

  setTimeout(processPendingGoals, 500);
}

function startGameRouter() {
  if (state.path === 'programmer') {
    if (upgradesState.product) { doRelease(); return; }
    if (upgradesState.job)     { startOfficeGame(); return; }
    startFreelanceGame();
    return;
  }
  if (state.unlockedCarWash) startCarWashGame();
  else startTrashGame();
}

// ============ ДРОН ============
let droneTimer = null;
function startDrones() {
  if (state.unlockedCarWash) return;
  if (!droneTimer) scheduleNextDrone(15000);
}
function scheduleNextDrone(delay) { clearTimeout(droneTimer); droneTimer = setTimeout(spawnDrone, delay); }

function spawnDrone() {
  droneTimer = null;
  if (state.unlockedCarWash) return;
  if (!state.isStanding || document.querySelector('.mg-active')) { scheduleNextDrone(15000); return; }

  const drone = document.createElement('div'); drone.className = 'drone';
  drone.style.top = (14 + Math.random() * 6) + '%';
  drone.style.animationDuration = (12 + Math.random() * 3) + 's, 2.5s';

  let removed = false;
  function removeAndSchedule() {
    if (removed) return; removed = true;
    if (drone.parentNode) drone.remove();
    scheduleNextDrone(15000);
  }

  drone.onclick = (e) => {
    if (removed) return;
    const base = 150;
    const reward = Math.floor(base * getMoneyMultiplier());
    state.money += reward; save(); soundDrone(); screenFlash();
    showFloatText('+' + reward.toLocaleString() + ' ₽', e.clientX, e.clientY);
    drone.classList.add('thanks');
    setTimeout(removeAndSchedule, 500);
    const bal = document.getElementById('balance');
    if (bal) bal.innerText = state.money.toLocaleString() + ' ₽';
    checkGoalComplete();
  };
  document.body.appendChild(drone);
  setTimeout(removeAndSchedule, 15000);
}
function stopDrones() { clearTimeout(droneTimer); droneTimer = null; document.querySelectorAll('.drone').forEach(d => d.remove()); }

// ============ МЕНЮ УЛУЧШЕНИЙ ============
function openUpgrades() {
  const scene = document.getElementById('upgrades-scene');
  scene.classList.add('active');
  setTimeout(() => scene.classList.add('visible'), 50);
  renderUpgrades();
  const ui = document.getElementById('ui');
  if (ui) ui.style.display = 'none';
}

function closeUpgrades() {
  const scene = document.getElementById('upgrades-scene');
  scene.classList.remove('visible');
  setTimeout(() => {
    scene.classList.remove('active');
    const ui = document.getElementById('ui');
    if (ui) ui.style.display = 'flex';
    showWork();
  }, 400);
}

function renderUpgrades() {
  const balEl = document.getElementById('upgrades-balance');
  const totalMult = getMoneyMultiplier();
  const passive = getPassiveIncome();
  balEl.innerHTML = `
    ${state.money.toLocaleString()} ₽
    <div style="font-size:9px; color:#00f3ff; margin-top:6px;">Множитель: ×${totalMult.toFixed(1)}</div>
    ${passive > 0 ? `<div style="font-size:9px; color:#00ff66; margin-top:4px;">Пассив: +${passive} ₽/сек</div>` : ''}
  `;

  const listEl = document.getElementById('upgrades-list');
  listEl.innerHTML = '';

  const availableUpgrades = getActiveUpgrades();
  availableUpgrades.forEach(upg => {
    const owned = !!upgradesState[upg.id];
    const canAfford = state.money >= upg.price && !owned;

    let priceClass = owned ? 'maxed' : (!canAfford ? 'cant-afford' : '');
    let priceText = owned ? '✅ КУПЛЕНО' : upg.price.toLocaleString() + ' ₽';

    const card = document.createElement('div');
    card.className = 'upgrade-card' + (owned || !canAfford ? ' locked' : '');
    card.innerHTML = `
      <div class="upgrade-icon">${upg.icon}</div>
      <div class="upgrade-info">
        <div class="upgrade-name">${upg.name}</div>
        <div class="upgrade-desc">${upg.desc}</div>
      </div>
      <div class="upgrade-price ${priceClass}">${priceText}</div>
    `;
    if (canAfford) card.onclick = () => buyUpgrade(upg.id);
    listEl.appendChild(card);
  });
}

function buyUpgrade(id) {
  const upg = ALL_UPGRADES.find(u => u.id === id);
  if (!upg || upgradesState[id]) return;
  if (state.money < upg.price) { soundError(); return; }

  state.money -= upg.price;
  upgradesState[id] = true;
  save();
  soundUpgrade(); screenFlash();
  renderUpgrades();
  updateGoalPanel();
  showFloatText('-' + upg.price.toLocaleString() + ' ₽', window.innerWidth / 2, window.innerHeight / 2);

  if (upg.special === 'carwash') {
    state.unlockedCarWash = true; save();
    stopDrones();
    setTimeout(() => {
      playDriveCutscene(() => {
        // выполняется под чёрным экраном
        const up = document.getElementById('upgrades-scene');
        up.classList.remove('active', 'visible');
        document.getElementById('ui').style.display = 'flex';
        showWork();
        syncGoalsSilently();
      });
    }, 300);
    return;
  }
  if (upg.special === 'fork') {
    setTimeout(() => {
      closeUpgrades();
      setTimeout(showForkScreen, 600);
    }, 300);
    return;
  }
  // Смена этапа программиста: фриланс → офис → продукт
  if (upg.special === 'job' || upg.special === 'product') {
    if (upg.special === 'product' && soundOn) soundWinner();
    screenFlash();
    setTimeout(() => {
      closeUpgrades();
      syncGoalsSilently();
      releaseReady = true;          // продукт запущен — первый релиз доступен сразу
      releaseCooldown = 0;
      setTimeout(processPendingGoals, 900);
    }, 300);
    return;
  }

  checkGoalComplete();
}

// ============ МУСОР ============
let mgTimer = null, mgSpawner = null, mgTimeLeft = 15;
let collectedItems = [], comboCount = 0, comboMultiplier = 1, comboTimer = null;
let rareSpawnedThisRun = 0;

const MAX_RARE = 1;
const RARE_CHANCE = 0.06;

const TRASH_TYPES = [
  { id: 'can',    name: 'Банка',   price: 2,  chance: 35, size: 100 }, // было 5
  { id: 'bottle', name: 'Бутылка', price: 4,  chance: 30, size: 90 },  // было 8
  { id: 'bag',    name: 'Мешок',   price: 7,  chance: 20, size: 110 }, // было 15
  { id: 'chip',   name: 'Чип',     price: 25, chance: 8,  size: 80 }   // было 50
];

const RARE_DROPS = [
  { id: 'can',    name: '⭐ Золотая банка',   price: 15,  size: 100 }, // было 30
  { id: 'bottle', name: '⭐ Золотая бутылка', price: 25,  size: 90 },  // было 50
  { id: 'chip',   name: '⭐ Золотой чип',     price: 75,  size: 80 }   // было 150
];

function getRandomTrash() {
  if (rareSpawnedThisRun < MAX_RARE && Math.random() < RARE_CHANCE) {
    rareSpawnedThisRun++;
    const rare = RARE_DROPS[Math.floor(Math.random() * RARE_DROPS.length)];
    return { ...rare, rare: true };
  }
  const total = TRASH_TYPES.reduce((sum, t) => sum + t.chance, 0);
  let r = Math.random() * total;
  for (const t of TRASH_TYPES) {
    r -= t.chance;
    if (r <= 0) return t;
  }
  return TRASH_TYPES[0];
}

function updateCombo() {
  comboCount++; clearTimeout(comboTimer);
  comboMultiplier = Math.min(2, 1 + Math.floor(comboCount / 3) * 0.1);
  const display = document.getElementById('combo-display');
  if (comboCount >= 3 && display) {
    display.innerText = 'x' + comboMultiplier.toFixed(1);
    display.classList.add('show');
    soundCombo(comboCount);
  }
  comboTimer = setTimeout(() => {
    comboCount = 0; comboMultiplier = 1;
    if (display) display.classList.remove('show');
  }, 1500);
}

function startTrashGame() {
  initAudio();
  document.getElementById('ui').style.display = 'none';
  document.getElementById('goal-panel').style.display = 'none';
  stopDrones();
  document.getElementById('scenes').classList.add('hidden');
  const mgScene = document.getElementById('mg-scene');
  mgScene.classList.add('active', 'mg-active');
  setTimeout(() => mgScene.classList.add('visible'), 50);

  mgTimeLeft = 15;
  collectedItems = [];
  comboCount = 0;
  comboMultiplier = 1;
  rareSpawnedThisRun = 0;

  document.getElementById('mg-timer').innerText = mgTimeLeft;
  document.getElementById('bag-count').innerText = '0';
  document.getElementById('bag-counter').innerText = '0';
  document.getElementById('hands-img').src = 'assets/hands_empty.png';

  const field = document.getElementById('mg-field');
  field.querySelectorAll('.trash').forEach(t => t.remove());

  setTimeout(() => {
    mgSpawner = setInterval(spawnTrash, 450);
    mgTimer = setInterval(() => {
      mgTimeLeft--;
      document.getElementById('mg-timer').innerText = mgTimeLeft;
      if (mgTimeLeft <= 0) endTrashGame();
    }, 1000);
  }, 800);
}

function spawnTrash() {
  const field = document.getElementById('mg-field');
  const type = getRandomTrash();
  const trash = document.createElement('div');
  trash.className = 'trash' + (type.rare ? ' rare' : '');
  trash.innerHTML = `<img src="assets/trash_${type.id}.png">`;
  trash.style.width = type.size + 'px';
  trash.style.height = type.size + 'px';
  trash.style.left = (5 + Math.random() * 75) + '%';
  trash.style.top = (45 + Math.random() * 35) + '%';

  trash.onmousedown = (e) => { e.stopPropagation(); collectTrash(trash, type); };
  trash.ontouchstart = (e) => { e.stopPropagation(); collectTrash(trash, type); };

  field.appendChild(trash);
  setTimeout(() => { if (trash.parentNode) trash.remove(); }, type.rare ? 4000 : 2800);
}

function collectTrash(trash, type) {
  updateCombo();
  const finalPrice = Math.floor(type.price * getMoneyMultiplier() * comboMultiplier);
  collectedItems.push({ ...type, price: finalPrice });

  document.getElementById('bag-count').innerText = collectedItems.length;
  const bagEl = document.getElementById('bag-counter');
  bagEl.innerText = collectedItems.length;
  bagEl.classList.add('bump');
  setTimeout(() => bagEl.classList.remove('bump'), 150);

  if (type.rare) { soundCoin(); screenFlash(); }
  else soundCollect();

  const trashRect = trash.getBoundingClientRect();
  const handsEl = document.getElementById('hands');
  if (handsEl) {
    const handsRect = handsEl.getBoundingClientRect();
    const targetX = handsRect.left + handsRect.width / 2;
    const targetY = handsRect.top + handsRect.height * 0.5;
    const dx = targetX - (trashRect.left + trashRect.width / 2);
    const dy = targetY - (trashRect.top + trashRect.height / 2);
    trash.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.6, 1), opacity 0.3s';
    trash.style.transform = `translate(${dx}px, ${dy}px) scale(0.2)`;
    trash.style.opacity = '0';
    trash.style.pointerEvents = 'none';
  } else {
    trash.style.opacity = '0';
  }
  setTimeout(() => { if (trash.parentNode) trash.remove(); }, 400);
}

function endTrashGame() {
  clearInterval(mgTimer); clearInterval(mgSpawner);
  mgTimer = null; mgSpawner = null;

  const field = document.getElementById('mg-field');
  field.querySelectorAll('.trash').forEach(t => t.remove());

  if (collectedItems.length === 0) {
    const mgScene = document.getElementById('mg-scene');
    mgScene.classList.remove('visible', 'mg-active');
    setTimeout(() => {
      mgScene.classList.remove('active');
      document.getElementById('scenes').classList.remove('hidden');
      document.getElementById('ui').style.display = 'flex';
      showWork();
    }, 700);
    return;
  }

  document.getElementById('hands-img').src = 'assets/hands_full.png';
  setTimeout(showShopScene, 800);
}

function showShopScene() {
  stopRainSound();

  const shopScene = document.getElementById('shop-scene');
  const list = document.getElementById('shop-list');
  const totalEl = document.getElementById('shop-total');

  resetShopUI();

  const counts = {};
  collectedItems.forEach(item => {
    const key = item.rare ? item.id + '_rare' : item.id;
    counts[key] = counts[key] || { count: 0, type: item };
    counts[key].count++;
  });

  list.innerHTML = '';
  let total = 0;
  for (const key in counts) {
    const { count, type } = counts[key];
    const sum = count * type.price;
    total += sum;
    const row = document.createElement('div');
    row.className = 'row';
    const priceColor = type.rare ? 'color:#ffcc00;' : '';
    row.innerHTML = `<span style="${priceColor}">${type.name} × ${count}</span><span class="price">${sum} ₽</span>`;
    list.appendChild(row);
  }
  totalEl.innerText = total;

  const mgScene = document.getElementById('mg-scene');
  mgScene.classList.remove('visible', 'mg-active');
  setTimeout(() => {
    mgScene.classList.remove('active');
    shopScene.classList.add('active');
    setTimeout(() => shopScene.classList.add('visible'), 50);
  }, 500);
}

function resetShopUI() {
  const listEl = document.getElementById('shop-list');
  const totalEl = document.querySelector('.shop-total');
  const buttonsEl = document.querySelector('.shop-buttons');
  const titleEl = document.querySelector('.shop-title');
  [listEl, totalEl, buttonsEl, titleEl].forEach(el => {
    if (el) {
      el.style.transition = 'none';
      el.style.opacity = '1';
      el.style.pointerEvents = 'auto';
    }
  });
}

let saleLocked = false;

function confirmSale() {
  if (saleLocked) return;
  saleLocked = true;
  soundCoin();
  screenFlash();
  document.getElementById('shop-scene').classList.add('liked');

  const listEl = document.getElementById('shop-list');
  const totalEl = document.querySelector('.shop-total');
  const buttonsEl = document.querySelector('.shop-buttons');
  const titleEl = document.querySelector('.shop-title');

  [listEl, totalEl, buttonsEl, titleEl].forEach(el => {
    if (el) {
      el.style.transition = 'opacity 0.4s ease';
      el.style.opacity = '0';
      el.style.pointerEvents = 'none';
    }
  });

  let total = parseInt(document.getElementById('shop-total').innerText) || 0;
  state.money += total;
  save();

  showSellerSpeech(total);

  for (let i = 0; i < 25; i++) {
    const coin = document.createElement('div');
    coin.className = 'flying-coin';
    coin.innerHTML = COIN_SVG;
    coin.style.left = (30 + Math.random() * 40) + '%';
    coin.style.top = (55 + Math.random() * 15) + '%';
    coin.style.setProperty('--dx', ((Math.random() - 0.5) * 200) + 'px');
    coin.style.animationDelay = (i * 0.03) + 's';
    document.body.appendChild(coin);
    setTimeout(() => coin.remove(), 2000);
  }

  checkGoalComplete();

  setTimeout(closeShopAndReturn, 2400);
}

function showSellerSpeech(total) {
  let phrase = '';
  if (total >= 10000)      phrase = 'ОГО! БОГАЧ!';
  else if (total >= 5000)  phrase = 'Хороший улов!';
  else if (total >= 2000)  phrase = 'Неплохо, неплохо...';
  else if (total >= 500)   phrase = 'Ещё тащи!';
  else if (total >= 100)   phrase = 'Так, что тут у нас...';
  else                     phrase = 'Маловато будет...';

  const bubble = document.createElement('div');
  bubble.className = 'seller-bubble';
  bubble.innerText = phrase;
  document.body.appendChild(bubble);

  if (soundOn && audioCtx) {
    beep(180 + Math.random() * 40, 0.06, 'sawtooth', 0.06);
    setTimeout(() => beep(160 + Math.random() * 40, 0.08, 'sawtooth', 0.05), 80);
    setTimeout(() => beep(200 + Math.random() * 40, 0.06, 'sawtooth', 0.05), 180);
  }

  setTimeout(() => bubble.remove(), 2200);
}

function closeShopAndReturn() {
  const shopScene = document.getElementById('shop-scene');
  shopScene.classList.remove('visible');
  setTimeout(() => {
    shopScene.classList.remove('active', 'liked');
    resetShopUI();
    document.getElementById('scenes').classList.remove('hidden');
    document.getElementById('ui').style.display = 'flex';
    saleLocked = false;

    if (soundOn && !state.unlockedCarWash) startRainSound();

    showWork();
    setTimeout(processPendingGoals, 600);
  }, 400);
}

// ============ АВТОМОЙКА ============
let dirtOpacity = 1.0, carsWashed = 0, isSwiping = false, carTimer = null, carTimeLeft = 30;
let carActive = false;
let currentCar = null;
let carStartTime = 0;
let carwashSessionEarnings = 0;

const carField = document.getElementById('car-field');
const carClean = document.getElementById('car-clean');
const carDirty = document.getElementById('car-dirty');
const carContainer = document.getElementById('car-container');
const spongeCursor = document.getElementById('sponge-cursor');

document.addEventListener('mousemove', (e) => {
  if (spongeCursor && spongeCursor.classList.contains('active')) {
    spongeCursor.style.left = e.clientX + 'px';
    spongeCursor.style.top = e.clientY + 'px';
  }
});
document.addEventListener('touchmove', (e) => {
  if (spongeCursor && spongeCursor.classList.contains('active') && e.touches[0]) {
    spongeCursor.style.left = e.touches[0].clientX + 'px';
    spongeCursor.style.top = e.touches[0].clientY + 'px';
  }
}, { passive: true });

if (carField) {
  carField.addEventListener('mousedown', (e) => {
    isSwiping = true;
    if (spongeCursor) spongeCursor.classList.add('washing');
    tryWash(e.clientX, e.clientY);
  });
  window.addEventListener('mouseup', () => {
    isSwiping = false;
    if (spongeCursor) spongeCursor.classList.remove('washing');
  });
  carField.addEventListener('mousemove', (e) => {
    if (isSwiping) tryWash(e.clientX, e.clientY);
  });

  carField.addEventListener('touchstart', (e) => {
    isSwiping = true;
    if (spongeCursor) spongeCursor.classList.add('washing');
    if (e.touches[0]) tryWash(e.touches[0].clientX, e.touches[0].clientY);
    e.preventDefault();
  }, { passive: false });
  window.addEventListener('touchend', () => {
    isSwiping = false;
    if (spongeCursor) spongeCursor.classList.remove('washing');
  });
  carField.addEventListener('touchmove', (e) => {
    if (isSwiping && e.touches[0]) {
      tryWash(e.touches[0].clientX, e.touches[0].clientY);
      e.preventDefault();
    }
  }, { passive: false });
}

function tryWash(x, y) {
  if (!carActive || dirtOpacity <= 0 || !carDirty) return;
  const carRect = carDirty.getBoundingClientRect();
  if (x < carRect.left - 30 || x > carRect.right + 30 ||
      y < carRect.top - 30 || y > carRect.bottom + 30) return;

  dirtOpacity -= getWashSpeed();
  if (dirtOpacity < 0) dirtOpacity = 0;
  carDirty.style.opacity = dirtOpacity;

  if (Math.random() > 0.6) soundWash();
  if (Math.random() > 0.6) createSplash(x, y);
  if (Math.random() > 0.7) createFoam(x, y);

  if (dirtOpacity <= 0) {
    carActive = false;
    carWashedSuccess();
  }
}

function createSplash(x, y) {
  const s = document.createElement('div');
  s.className = 'splash';
  s.style.left = (x - 20) + 'px';
  s.style.top = (y - 20) + 'px';
  s.innerHTML = '<img src="assets/splash.png" alt="Брызги">';
  document.body.appendChild(s);
  setTimeout(() => s.remove(), 500);
}

function createFoam(x, y) {
  const f = document.createElement('div');
  f.className = 'foam-bubble';
  f.style.left = (x - 40) + 'px';
  f.style.top = (y - 60) + 'px';
  f.innerHTML = '<img src="assets/foam_bubble.png" alt="Пена">';
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 900);
}

function carWashedSuccess() {
  soundCollect(); soundShine(); screenFlash(); carsWashed++;
  document.getElementById('car-count').innerText = carsWashed;

  let speedBonus = 1;
  let speedText = '';
  if (carStartTime > 0) {
    const elapsed = (Date.now() - carStartTime) / 1000;
    if (elapsed < 5) {
      speedBonus = 2;
      speedText = '⚡ МОЛНИЯ! x2';
    } else if (elapsed < 8) {
      speedBonus = 1.5;
      speedText = '⚡ БЫСТРО! x1.5';
    }
  }

  let baseReward = 150;
  let reward = Math.floor(baseReward * getMoneyMultiplier() * speedBonus);
  let isBonus = false;

  if (upgradesState.wax && carsWashed % 5 === 0) {
    reward *= 2;
    isBonus = true;
  }

  carwashSessionEarnings += reward;

  if (speedText) {
    showFloatText(speedText, window.innerWidth / 2, window.innerHeight / 2 - 90);
  }
  if (isBonus) {
    showFloatText('🎁 +' + reward.toLocaleString() + ' ₽ (x2!)', window.innerWidth / 2, window.innerHeight / 2 - 50);
  } else {
    showFloatText('+' + reward.toLocaleString() + ' ₽', window.innerWidth / 2, window.innerHeight / 2 - 50);
  }

  carContainer.classList.remove('driving-in');
  carContainer.classList.add('driving-out');
  carContainer.classList.add('clean');
  carContainer.classList.add('shine');

  setTimeout(() => {
    carContainer.classList.remove('driving-out', 'clean', 'shine');
    if (carTimeLeft > 0) setTimeout(spawnCar, 200);
  }, 1600);
}

function spawnCar() {
  currentCar = getRandomCar();

  if (carClean) carClean.src = 'assets/car_' + currentCar.id + '_clean.png';
  if (carDirty) carDirty.src = 'assets/car_' + currentCar.id + '_dirty.png';

  dirtOpacity = 1.0;
  if (carDirty) {
    carDirty.style.transition = 'none';
    carDirty.style.opacity = '1';
  }
  carContainer.classList.remove('driving-in', 'driving-out', 'clean', 'shine');
  void carContainer.offsetWidth;
  carContainer.classList.add('driving-in');
  soundEngine();
  carStartTime = 0;

  setTimeout(() => {
    carActive = true;
    carStartTime = Date.now();
    if (carDirty) carDirty.style.transition = 'opacity 0.15s';
  }, 1500);
}

function startCarWashGame() {
  initAudio();
  document.getElementById('ui').style.display = 'none';
  document.getElementById('goal-panel').style.display = 'none';
  stopDrones();
  document.getElementById('scenes').classList.add('hidden');

  if (soundOn) startMusic('wash');

  stopRainSound();
  const rainCanvas = document.getElementById('rain-canvas');
  if (rainCanvas) rainCanvas.style.display = 'none';

  const mgCarwash = document.getElementById('mg-carwash');
  mgCarwash.classList.add('active', 'mg-active');
  setTimeout(() => mgCarwash.classList.add('visible'), 50);

  carTimeLeft = 30; carsWashed = 0;
  carwashSessionEarnings = 0;
  document.getElementById('car-count').innerText = '0';
  document.getElementById('car-timer').innerText = carTimeLeft;

  if (spongeCursor) spongeCursor.classList.add('active');

  carActive = false;
  spawnCar();

  carTimer = setInterval(() => {
    carTimeLeft--;
    document.getElementById('car-timer').innerText = carTimeLeft;
    if (carTimeLeft <= 0) endCarWashGame();
  }, 1000);
}

function endCarWashGame() {
  clearInterval(carTimer); carTimer = null;
  carActive = false;
  if (spongeCursor) spongeCursor.classList.remove('active', 'washing');

  const mgCarwash = document.getElementById('mg-carwash');
  mgCarwash.classList.remove('visible');
  setTimeout(() => {
    mgCarwash.classList.remove('active', 'mg-active');
    document.getElementById('scenes').classList.remove('hidden');
    showDirectorScene();
  }, 700);
}

// ============ ЭКРАН ДИРЕКТОРА ============
function showDirectorScene() {
  if (soundOn) stopMusic();

  const scene = document.getElementById('director-scene');
  const bg = document.getElementById('director-bg');
  const totalEl = document.getElementById('director-total');
  const textEl = document.getElementById('director-text');
  const btn = document.getElementById('director-btn');

  bg.classList.remove('after');
  btn.classList.remove('hidden');
  btn.innerText = '🖐️ ЗАБРАТЬ';

  const total = carwashSessionEarnings;
  totalEl.innerText = total.toLocaleString();

  let phrase = '';
  if (carsWashed >= 15)      phrase = `«Невероятно! ${carsWashed} машин!<br>Держи — заслужил!»`;
  else if (carsWashed >= 10) phrase = `«Отлично поработал!<br>${carsWashed} машин — вот зарплата!»`;
  else if (carsWashed >= 5)  phrase = `«Неплохо, ${carsWashed} машин.<br>Вот твоя зарплата.»`;
  else if (carsWashed >= 1)  phrase = `«Всего ${carsWashed} машин?<br>Держи что есть.»`;
  else                       phrase = `«Ты ничего не помыл...<br>Иди работай!»`;

  textEl.innerHTML = phrase;

  scene.classList.add('active');
  setTimeout(() => scene.classList.add('visible'), 50);

  if (soundOn) startMusic('wash');
}

function takeMoney() {
  if (soundOn) soundCoin();
  screenFlash();

  const total = carwashSessionEarnings;

  const bg = document.getElementById('director-bg');
  bg.classList.add('after');

  const btn = document.getElementById('director-btn');
  btn.classList.add('hidden');

  for (let i = 0; i < 30; i++) {
    const bill = document.createElement('div');
    bill.className = 'flying-bill';
    bill.innerText = '💵';
    bill.style.left = (40 + Math.random() * 30) + '%';
    bill.style.top = (55 + Math.random() * 15) + '%';
    bill.style.setProperty('--dx', ((Math.random() - 0.5) * 300) + 'px');
    bill.style.animationDelay = (i * 0.04) + 's';
    bill.style.fontSize = (32 + Math.random() * 20) + 'px';
    document.body.appendChild(bill);
    setTimeout(() => bill.remove(), 2200);
  }

  setTimeout(() => {
    state.money += total;
    save();

    const bal = document.getElementById('balance');
    if (bal) bal.innerText = state.money.toLocaleString() + ' ₽';

    showFloatText('💰 +' + total.toLocaleString() + ' ₽', window.innerWidth / 2, window.innerHeight / 2 - 100);

    const textEl = document.getElementById('director-text');
    textEl.innerHTML = '«Спасибо за работу!<br>Приходи завтра!»';
  }, 400);

  setTimeout(() => {
    const scene = document.getElementById('director-scene');
    scene.classList.remove('visible');

    setTimeout(() => {
      scene.classList.remove('active');
      carwashSessionEarnings = 0;

      document.getElementById('ui').style.display = 'flex';
      if (soundOn) startMusic('wash');

      checkGoalComplete();
      showWork();
    }, 500);
  }, 2200);
}

// ============ РАЗВИЛКА ============
function showForkScreen() {
  if (soundOn) {
    stopMusic();
    soundGoal();
    screenFlash();
  }
  // Работа по найму закончилась — станок выключаем
  stopProductStage();

  const ui = document.getElementById('ui');
  ui.style.display = 'flex';
  ui.innerHTML = `
    <div style="font-size:14px; color:#00f3ff; text-shadow: 0 0 20px #00f3ff; margin-bottom:10px; text-align:center;">
      🌟 РАЗВИЛКА
    </div>
    <div style="font-size:10px; color:#fff; margin-bottom:20px; text-align:center; line-height:1.8;">
      Ты прошёл автомойку!<br>
      Куда пойдёшь дальше?
    </div>
    <button class="btn" style="background:#00ff66; color:#000; font-size:12px; padding:20px 40px; width:100%; max-width:400px;" onclick="choosePath('programmer')" onmousedown="soundTap()">
      💻 ПРОГРАММИСТ
    </button>
    <div style="font-size:8px; color:#00ff66; margin-top:-10px; margin-bottom:10px;">
      Печатаешь код, ловишь баги
    </div>

    <button class="btn" style="background:#ffcc00; color:#000; font-size:12px; padding:20px 40px; width:100%; max-width:400px;" onclick="choosePath('businessman')" onmousedown="soundTap()">
      💼 БИЗНЕСМЕН
    </button>
    <div style="font-size:8px; color:#ffcc00; margin-top:-10px; margin-bottom:10px;">
      Покупаешь бизнесы, растёшь
    </div>

    <button class="btn" style="background:#ff00ff; color:#000; font-size:12px; padding:20px 40px; width:100%; max-width:400px;" onclick="choosePath('crypto')" onmousedown="soundTap()">
      🎮 КРИПТО-БОСС
    </button>
    <div style="font-size:8px; color:#ff00ff; margin-top:-10px; margin-bottom:10px;">
      Торгуешь, рискуешь, богатеешь
    </div>
  `;
}

function choosePath(path) {
  if (soundOn) soundUpgrade();
  screenFlash();

  state.path = path;
  save();

  // 💻 ПРОГРАММИСТ — полноценная ветка: фриланс → офис → свой продукт
  if (path === 'programmer') {
    state.users = state.users || 0;
    save();
    syncGoalsSilently();          // не показываем плашки за уже закрытые цели
    showProgrammerWork();
    setTimeout(processPendingGoals, 700);
    return;
  }

  let title = '';
  let emoji = '';
  if (path === 'businessman') { title = 'БИЗНЕСМЕН'; emoji = '💼'; }
  else if (path === 'crypto') { title = 'КРИПТО-БОСС'; emoji = '🎮'; }

  const ui = document.getElementById('ui');
  ui.innerHTML = `
    <div style="font-size:60px; margin-bottom:20px;">${emoji}</div>
    <div style="font-size:16px; color:#00f3ff; text-shadow: 0 0 20px #00f3ff; margin-bottom:15px; text-align:center;">
      ТЫ ВЫБРАЛ ПУТЬ:
    </div>
    <div style="font-size:20px; color:#ffcc00; text-shadow: 0 0 20px #ffcc00; margin-bottom:25px; text-align:center;">
      ${title}
    </div>
    <div style="font-size:9px; color:#ff8844; text-align:center; line-height:2; margin-bottom:20px; text-shadow: 2px 2px 0 #000;">
      ⚠️ ЭТА ВЕТКА ЕЩЁ В РАЗРАБОТКЕ<br>
      Прогресс не сбрасывается
    </div>
    <button class="btn" onclick="choosePath('programmer')" onmousedown="soundTap()">
      💻 ПОЙТИ ПРОГРАММИСТОМ
    </button>
    <button class="btn btn-gray" onclick="showForkScreen()" onmousedown="soundTap()">
      ◀ НАЗАД К ВЫБОРУ
    </button>
  `;
}

// ============ ДОЖДЬ ============
let rainDrops = [];
const rainCanvasEl = document.getElementById('rain-canvas');
const rainCtx = rainCanvasEl ? rainCanvasEl.getContext('2d') : null;

function initRain() {
  if (!rainCanvasEl) return;
  rainCanvasEl.width = window.innerWidth;
  rainCanvasEl.height = window.innerHeight;
  rainDrops = [];
  for (let i = 0; i < 80; i++) rainDrops.push({
    x: Math.random() * rainCanvasEl.width,
    y: Math.random() * rainCanvasEl.height,
    length: 8 + Math.random() * 12,
    speed: 4 + Math.random() * 5,
    opacity: 0.2 + Math.random() * 0.4
  });
}
function drawRain() {
  if (!rainCtx || !rainCanvasEl) return;
  if (state.unlockedCarWash) return;
  if (state.path) return;   // в ветке программиста дождь не нужен — мы в помещении
  rainCtx.clearRect(0, 0, rainCanvasEl.width, rainCanvasEl.height);
  rainCtx.strokeStyle = '#7c3aed'; rainCtx.lineWidth = 1;
  rainDrops.forEach(d => {
    rainCtx.globalAlpha = d.opacity;
    rainCtx.beginPath();
    rainCtx.moveTo(d.x, d.y);
    rainCtx.lineTo(d.x - 1, d.y + d.length);
    rainCtx.stroke();
    d.y += d.speed;
    if (d.y > rainCanvasEl.height) { d.y = -d.length; d.x = Math.random() * rainCanvasEl.width; }
  });
}
setInterval(drawRain, 30);
window.addEventListener('resize', initRain);

function showFloatText(text, x, y) {
  const el = document.createElement('div');
  el.className = 'float-text';
  el.innerText = text;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 800);
}

// ============ ЗАСТАВКА: ЕДЕМ НА МОЙКУ ============
let cutsceneRunning = false;
let cutsceneTimers = [];
let cutsceneDone = null;

function playDriveCutscene(onDone) {
  if (cutsceneRunning) return;
  cutsceneRunning = true;
  cutsceneDone = onDone;
  initAudio();
  stopMusic();
  stopRainSound();

  const cs = document.getElementById('cutscene');
  const img = document.getElementById('cutscene-img');
  if (img) {
    img.style.display = '';
    img.style.animation = 'none';
    void img.offsetWidth;
    img.style.animation = '';
  }
  cs.classList.remove('black', 'visible');
  cs.classList.add('active');
  void cs.offsetWidth;

  const t = (fn, ms) => cutsceneTimers.push(setTimeout(fn, ms));
  t(() => cs.classList.add('visible'), 50);
  t(() => { if (soundOn) soundEngine(); }, 500);
  t(() => { if (soundOn) soundEngine(); }, 2300);
  t(() => cs.classList.add('black'), 4200);
  t(finishCutscene, 5400);
}

function finishCutscene() {
  if (!cutsceneRunning || !cutsceneDone) return;
  cutsceneTimers.forEach(clearTimeout);
  cutsceneTimers = [];
  const cs = document.getElementById('cutscene');
  cs.classList.add('visible', 'black');

  const cb = cutsceneDone;
  cutsceneDone = null;
  try { cb(); } catch (e) { console.error(e); }

  setTimeout(() => {
    cs.classList.remove('visible');
    setTimeout(() => {
      cs.classList.remove('active', 'black');
      cutsceneRunning = false;
      setTimeout(processPendingGoals, 300);
    }, 900);
  }, 500);
}

function skipCutscene() { finishCutscene(); }

// ============ ПАССИВНЫЙ ДОХОД ============
// Экраны, на которых деньги НЕ капают: меню, мини-игры, ролики.
// Экран продукта сюда не входит — он и есть рабочее место на третьем этапе.
const BLOCKING_SCREENS = [
  'upgrades-scene', 'goal-complete', 'shop-scene', 'director-scene', 'boss-scene',
  'cutscene', 'mg-scene', 'mg-carwash', 'mg-freelance', 'mg-office'
];

function isWorkScreenVisible() {
  if (!state.isStanding) return false;
  return BLOCKING_SCREENS.every(id => {
    const el = document.getElementById(id);
    return !el || !el.classList.contains('active');
  });
}

let passiveTick = 0;

setInterval(() => {
  const income = getPassiveIncome();
  if (income > 0 && isWorkScreenVisible()) {
    state.money += income;

    // Раньше save() дёргался каждую секунду — 86 400 записей в сутки.
    // Теперь раз в 10 секунд + принудительный сейв на важных событиях.
    passiveTick++;
    if (passiveTick >= 10) { passiveTick = 0; save(); }

    const bal = document.getElementById('balance');
    if (bal) bal.innerText = state.money.toLocaleString() + ' ₽';
    checkGoalComplete();
    const panel = document.getElementById('goal-panel');
    if (panel && !pendingGoals.length) {
      const goal = GOALS[getCurrentGoalIndex()];
      const fillEl = document.getElementById('goal-progress');
      const hintEl = document.getElementById('goal-hint');
      if (goal && goal.type === 'money' && fillEl && hintEl) {
        const progress = Math.min(100, (state.money / goal.money) * 100);
        fillEl.style.width = progress + '%';
        hintEl.innerText = `${Math.min(state.money, goal.money).toLocaleString()} / ${goal.money.toLocaleString()} ₽`;
      }
    }
  }

  // Откат «релиза» на этапе продукта
  if (state.path === 'programmer' && upgradesState.product) {
    if (releaseCooldown > 0) releaseCooldown--;
    if (releaseCooldown <= 0 && !releaseReady) { releaseReady = true; if (soundOn) soundKeyboard(); }
    updateReleaseButton();
    renderProductPanel();
  }
}, 1000);

// ============================================================
// ВЕТКА «ПРОГРАММИСТ»: ФРИЛАНС → ОФИС → СВОЙ ПРОДУКТ
// ============================================================

// Слова, из которых собирается код на экране.
// Не случайные буквы — настоящие питоновские токены, чтоб выглядело как код.
const CODE_WORDS = [
  'import', 'def', 'return', 'print', 'self', 'for', 'if', 'True', 'False', 'None',
  'while', 'class', 'try', 'except', 'elif', 'yield', 'lambda', 'async', 'await',
  'with', 'as', 'break', 'continue', 'raise', 'range', 'len', 'str', 'int',
  'list', 'dict', 'open', 'read', 'write', 'append', 'pass', 'global'
];

// Сломанные слова — ими рисуем баги в офисе
const BROKEN_WORDS = [
  'improt', 'retrun', 'pritn', 'selif', 'wile', 'exept', 'Truee', 'Nul',
  'selfe', 'lenght', 'brek', 'contineu', 'asnyc', 'elss', 'gloabl'
];

const ORDERS = [
  { id: 'bot',    name: 'Телеграм-бот', need: 12, pay: 2000  },
  { id: 'site',   name: 'Сайт-визитка', need: 20, pay: 5000  },
  { id: 'parser', name: 'Парсер',       need: 30, pay: 10000 }
];

// ---------- ЭКРАН РАБОТЫ ----------
function showProgrammerWork() {
  const stage = upgradesState.product ? 'product' : (upgradesState.job ? 'office' : 'freelance');

  stopRainSound();
  const rainCanvas = document.getElementById('rain-canvas');
  if (rainCanvas) rainCanvas.style.display = 'none';
  if (soundOn) startMusic(stage === 'freelance' ? 'street' : 'wash');

  if (stage === 'freelance')   setSceneCustom('scene-4-freelance');
  else if (stage === 'office') setSceneCustom('scene-5-office');
  else                         setSceneCustom('scene-6-product');

  document.getElementById('scenes').classList.remove('hidden');
  updateGoalPanel();
  renderProductPanel();

  const ui = document.getElementById('ui');
  ui.style.display = 'flex';
  const passive = getPassiveIncome();

  let levelName = '💻 ФРИЛАНС';
  let btnHtml = `<button class="btn" id="btn-collect" onclick="startGameRouter()" onmousedown="soundTap()">💻 ВЗЯТЬ ЗАКАЗ</button>`;

  if (stage === 'office') {
    levelName = '🏢 IT-КОМПАНИЯ';
    btnHtml = `<button class="btn" id="btn-collect" onclick="startGameRouter()" onmousedown="soundTap()">🐞 ЧИНИТЬ БАГИ</button>`;
  } else if (stage === 'product') {
    levelName = '🚀 СВОЙ ПРОДУКТ';
    btnHtml = `<button class="btn" id="btn-release" onclick="doRelease()" onmousedown="soundTap()">🚀 РЕЛИЗ</button>`;
  }

  ui.innerHTML = `
    <div style="font-size:9px; color:#00f3ff; margin-bottom:-5px;">${levelName}</div>
    <div class="balance" id="balance">${state.money.toLocaleString()} ₽</div>
    ${passive > 0 ? `<div style="font-size:9px; color:#00ff66; margin-top:-8px;">+${passive.toLocaleString()} ₽/сек</div>` : ''}
    ${btnHtml}
    <button class="btn btn-cyan" onclick="openUpgrades()" onmousedown="soundTap()">⚙️ УЛУЧШЕНИЯ</button>
    <button class="btn btn-gray" onclick="toggleSound()" onmousedown="soundTap()" id="btn-sound">${soundOn ? '🔊 ЗВУК: ВКЛ' : '🔇 ЗВУК: ВЫКЛ'}</button>
    <button class="btn btn-gray" onclick="reset()" onmousedown="soundTap()">СБРОСИТЬ</button>
  `;

  updateReleaseButton();
  setTimeout(processPendingGoals, 500);
}

// ================= ФРИЛАНС =================
let flActive = false, flTimer = null, flTimeLeft = 20;
let flTyped = 0, flNeed = 12, flOrder = null;
let flLine = null, flLineWords = 0, flLineTarget = 5;
let flFlow = 0, flLastTap = 0, flFlowTimer = null;

const flField = document.getElementById('fl-field');
if (flField) {
  flField.addEventListener('mousedown', (e) => { e.preventDefault(); typeWord(); });
  flField.addEventListener('touchstart', (e) => { e.preventDefault(); typeWord(); }, { passive: false });
}

function startFreelanceGame() {
  initAudio();
  document.getElementById('ui').style.display = 'none';
  document.getElementById('goal-panel').style.display = 'none';
  stopDrones();
  document.getElementById('scenes').classList.add('hidden');

  const mg = document.getElementById('mg-freelance');
  mg.classList.add('active', 'mg-active');
  setTimeout(() => mg.classList.add('visible'), 50);

  flOrder   = ORDERS[Math.floor(Math.random() * ORDERS.length)];
  flNeed    = flOrder.need;
  flTyped   = 0;
  flFlow    = 0;
  flLastTap = 0;
  flTimeLeft = 20;
  flActive  = true;

  document.getElementById('fl-order').innerText = flOrder.name;
  document.getElementById('fl-need').innerText  = flNeed;
  document.getElementById('fl-typed').innerText = '0';
  document.getElementById('fl-timer').innerText = flTimeLeft;

  const codeEl = document.getElementById('fl-code');
  codeEl.innerHTML = '';
  flLine = null;
  newCodeLine();
  updateFlProgress();

  flTimer = setInterval(() => {
    if (!flActive) return;
    flTimeLeft--;
    document.getElementById('fl-timer').innerText = flTimeLeft;
    if (flTimeLeft <= 0) endFreelanceGame(false);
  }, 1000);
}

function newCodeLine() {
  const codeEl = document.getElementById('fl-code');
  if (!codeEl) return;
  const line = document.createElement('div');
  line.className = 'code-line';
  line.innerHTML = `<span class="ln">${codeEl.children.length + 1}</span>`;
  codeEl.appendChild(line);
  flLine = line;
  flLineWords = 0;
  flLineTarget = 3 + Math.floor(Math.random() * 3);
}

function typeWord() {
  if (!flActive) return;

  const perTap = upgradesState.ai ? 2 : 1;   // Нейронка пишет два слова за тап
  for (let i = 0; i < perTap; i++) {
    if (flTyped >= flNeed) break;
    if (!flLine || flLineWords >= flLineTarget) newCodeLine();
    const w = CODE_WORDS[Math.floor(Math.random() * CODE_WORDS.length)];
    const span = document.createElement('span');
    span.className = 'word';
    span.innerText = w;
    flLine.appendChild(span);
    flTyped++;
    flLineWords++;
  }

  document.getElementById('fl-typed').innerText = flTyped;
  updateFlProgress();
  const codeEl = document.getElementById('fl-code');
  if (codeEl) codeEl.scrollTop = codeEl.scrollHeight;
  if (soundOn) soundType();

  // Поток: тапаешь без пауз — копится бонус к оплате (до +50%)
  const now = Date.now();
  flFlow = (now - flLastTap < 900) ? flFlow + 1 : 1;
  flLastTap = now;

  if (flFlow > 0 && flFlow % 5 === 0) {
    const d = document.getElementById('combo-display');
    if (d) {
      d.innerText = '⚡ ПОТОК';
      d.classList.add('show');
      clearTimeout(flFlowTimer);
      flFlowTimer = setTimeout(() => d.classList.remove('show'), 900);
    }
    if (soundOn) soundCombo(flFlow);
  }

  if (flTyped >= flNeed) endFreelanceGame(true);
}

function updateFlProgress() {
  const fill = document.getElementById('fl-progress');
  if (fill) fill.style.width = Math.min(100, (flTyped / flNeed) * 100) + '%';
}

function endFreelanceGame(completed) {
  if (!flActive) return;
  flActive = false;
  clearInterval(flTimer);
  flTimer = null;

  const flowBonus = Math.min(0.5, Math.floor(flFlow / 5) * 0.1);
  const earned = Math.floor(flOrder.pay * getMoneyMultiplier() * (completed ? 1 : 0.5) * (1 + flowBonus));
  const words = flTyped, need = flNeed;

  let text;
  if (completed) {
    if (flOrder.need >= 30)     text = `«Парсер летает!<br>${words} слов кода — красава!»`;
    else if (flOrder.need >= 20) text = `«Сайт зашёл как надо!<br>Держи, как договаривались.»`;
    else                         text = `«Бот работает!<br>Норм сделал, вот оплата.»`;
  } else {
    text = `«Не успел доделать...<br>Вот половина за ${words} из ${need} слов.»`;
  }

  const mg = document.getElementById('mg-freelance');
  mg.classList.remove('visible', 'mg-active');
  setTimeout(() => {
    mg.classList.remove('active');
    showBossScene({
      bg: 'assets/customer.png',
      title: 'ЗАКАЗЧИК',
      text: text,
      total: earned,
      music: 'street'
    });
  }, 600);
}

// ================= ОФИС (АЙТИШНИК) =================
let ofActive = false, ofTimer = null, ofSpawner = null;
let ofTimeLeft = 30, ofBugs = 0;

function startOfficeGame() {
  initAudio();
  document.getElementById('ui').style.display = 'none';
  document.getElementById('goal-panel').style.display = 'none';
  stopDrones();
  document.getElementById('scenes').classList.add('hidden');
  if (soundOn) startMusic('wash');

  const mg = document.getElementById('mg-office');
  mg.classList.add('active', 'mg-active');
  setTimeout(() => mg.classList.add('visible'), 50);

  ofTimeLeft = 30;
  ofBugs = 0;
  ofActive = true;
  document.getElementById('of-timer').innerText = ofTimeLeft;
  document.getElementById('of-count').innerText = '0';

  renderOfficeCode();
  const field = document.getElementById('of-field');
  field.querySelectorAll('.bug').forEach(b => b.remove());

  ofTimer = setInterval(() => {
    if (!ofActive) return;
    ofTimeLeft--;
    document.getElementById('of-timer').innerText = ofTimeLeft;
    if (ofTimeLeft <= 0) endOfficeGame();
  }, 1000);

  ofSpawner = setInterval(spawnBug, 550);
  spawnBug();
}

function renderOfficeCode() {
  const el = document.getElementById('of-code');
  if (!el) return;
  el.innerHTML = '';
  for (let i = 0; i < 14; i++) {
    const line = document.createElement('div');
    line.className = 'code-line';
    let html = `<span class="ln">${i + 1}</span>`;
    const words = 3 + Math.floor(Math.random() * 4);
    for (let w = 0; w < words; w++) {
      // примерно каждое восьмое слово — сломанное
      if (Math.random() < 0.12) {
        html += `<span class="bad">${BROKEN_WORDS[Math.floor(Math.random() * BROKEN_WORDS.length)]}</span> `;
      } else {
        html += `<span class="word">${CODE_WORDS[Math.floor(Math.random() * CODE_WORDS.length)]}</span> `;
      }
    }
    line.innerHTML = html;
    el.appendChild(line);
  }
}

function spawnBug() {
  if (!ofActive) return;
  const field = document.getElementById('of-field');
  if (!field) return;

  const n = 1 + Math.floor(Math.random() * 3);
  const bug = document.createElement('div');
  bug.className = 'bug';
  // Сеньор-ментор учит чинить с одного тапа, без него баг упирается и требует двух
  bug.dataset.hp = upgradesState.mentor ? 1 : 2;
  // Если картинки бага ещё нет — покажется 🐞, игра не сломается
  bug.innerHTML = `<img src="assets/bug_${n}.png" alt="Баг" onerror="this.replaceWith(document.createTextNode('🐞'))">`;
  bug.style.left = (7 + Math.random() * 72) + '%';
  bug.style.top  = (16 + Math.random() * 56) + '%';
  bug.style.animationDuration = (1.6 + Math.random() * 0.9) + 's';

  bug.onmousedown  = (e) => { e.stopPropagation(); fixBug(bug); };
  bug.ontouchstart = (e) => { e.stopPropagation(); fixBug(bug); };

  field.appendChild(bug);
  setTimeout(() => { if (bug.parentNode) bug.remove(); }, 3200);
}

const BUG_RATE = 2000;   // ₽ за один пофикшенный баг (до множителя)

function fixBug(bug) {
  if (bug.__dead) return;    // страховка от двойного тапа (мышь + тач на телефоне)
  if (!ofActive || !bug.parentNode) return;

  // Баг может требовать несколько тапов (см. spawnBug) — считаем попадания
  bug.dataset.hp = (parseInt(bug.dataset.hp) || 1) - 1;
  if (parseInt(bug.dataset.hp) > 0) {
    if (soundOn) soundTap();
    showFloatText('🔨 ещё!', window.innerWidth / 2, window.innerHeight / 2 + 30);
    return;
  }

  ofBugs++;
  document.getElementById('of-count').innerText = ofBugs;
  if (soundOn) soundBugSquash();
  bug.classList.add('fixed');
  bug.style.pointerEvents = 'none';

  bug.__dead = true;
  const perBug = Math.floor(BUG_RATE * getMoneyMultiplier());
  showFloatText('+' + perBug.toLocaleString() + ' ₽', window.innerWidth / 2, window.innerHeight / 2);

  setTimeout(() => { if (bug.parentNode) bug.remove(); }, 250);
}

function endOfficeGame() {
  if (!ofActive) return;
  ofActive = false;
  clearInterval(ofTimer);
  clearInterval(ofSpawner);
  ofTimer = null;
  ofSpawner = null;

  const field = document.getElementById('of-field');
  if (field) field.querySelectorAll('.bug').forEach(b => b.remove());

  const earned = Math.floor(ofBugs * BUG_RATE * getMoneyMultiplier());
  const bugs = ofBugs;

  let text;
  if (bugs >= 20)     text = `«${bugs} багов?!<br>Ты машина, а не джун! Держи!»`;
  else if (bugs >= 12) text = `«${bugs} фиксов — сильно.<br>Вот твоя зарплата.»`;
  else if (bugs >= 6)  text = `«Норм, ${bugs} багов пофиксил.<br>Забирай.»`;
  else if (bugs >= 1)  text = `«Всего ${bugs}?<br>Держи что есть.»`;
  else                 text = `«Ты вообще ничего не починил...<br>Иди работай!»`;

  const mg = document.getElementById('mg-office');
  mg.classList.remove('visible', 'mg-active');
  setTimeout(() => {
    mg.classList.remove('active');
    showBossScene({
      bg: 'assets/hr.png',
      title: 'ТИМЛИД',
      text: text,
      total: earned,
      music: 'wash'
    });
  }, 700);
}

// ================= ЭКРАН ЗАКАЗЧИКА / ТИМЛИДА =================
let bossPending = 0, bossLocked = false;

function showBossScene(opts) {
  bossPending = opts.total || 0;
  bossLocked = false;

  const scene = document.getElementById('boss-scene');
  const bg = document.getElementById('boss-bg');
  if (bg) bg.style.backgroundImage = `url('${opts.bg}')`;

  document.getElementById('boss-title').innerText = opts.title || 'ЗАКАЗЧИК';
  document.getElementById('boss-text').innerHTML = opts.text || '';
  document.getElementById('boss-total').innerText = bossPending.toLocaleString();

  const btn = document.getElementById('boss-btn');
  if (btn) {
    btn.classList.remove('hidden');
    btn.innerText = `🖐️ ЗАБРАТЬ ${bossPending.toLocaleString()} ₽`;
  }

  if (soundOn) startMusic(opts.music || 'wash');
  scene.classList.add('active');
  setTimeout(() => scene.classList.add('visible'), 50);
}

function bossTake() {
  if (bossLocked) return;
  bossLocked = true;
  if (soundOn) soundCoin();
  screenFlash();

  const amount = bossPending;
  bossPending = 0;

  const btn = document.getElementById('boss-btn');
  if (btn) btn.classList.add('hidden');
  document.getElementById('boss-text').innerHTML = '«Спасибо за работу!<br>Приходи ещё!»';

  for (let i = 0; i < 25; i++) {
    const bill = document.createElement('div');
    bill.className = 'flying-bill';
    bill.innerText = '💵';
    bill.style.left = (35 + Math.random() * 30) + '%';
    bill.style.top  = (55 + Math.random() * 15) + '%';
    bill.style.setProperty('--dx', ((Math.random() - 0.5) * 260) + 'px');
    bill.style.animationDelay = (i * 0.04) + 's';
    bill.style.fontSize = (30 + Math.random() * 20) + 'px';
    document.body.appendChild(bill);
    setTimeout(() => bill.remove(), 2200);
  }

  setTimeout(() => {
    state.money += amount;
    save();
    const bal = document.getElementById('balance');
    if (bal) bal.innerText = state.money.toLocaleString() + ' ₽';
    if (amount > 0) showFloatText('💰 +' + amount.toLocaleString() + ' ₽', window.innerWidth / 2, window.innerHeight / 2 - 100);
  }, 400);

  setTimeout(() => {
    const scene = document.getElementById('boss-scene');
    scene.classList.remove('visible');
    setTimeout(() => {
      scene.classList.remove('active');
      document.getElementById('ui').style.display = 'flex';
      showWork();
      // Цели проверяем строго ПОСЛЕ закрытия босс-сцены — иначе
      // плашка «ЦЕЛЬ ДОСТИГНУТА» гасится проверкой активных экранов
      checkGoalComplete();
      setTimeout(processPendingGoals, 400);
    }, 500);
  }, 2200);
}

// ================= СВОЙ ПРОДУКТ =================
let releaseReady = false, releaseCooldown = 15;

function stopProductStage() {
  releaseReady = false;
  const pp = document.getElementById('product-panel');
  if (pp) pp.style.display = 'none';
}

function renderProductPanel() {
  const pp = document.getElementById('product-panel');
  if (!pp) return;
  if (state.path !== 'programmer' || !upgradesState.product) {
    pp.style.display = 'none';
    return;
  }
  pp.style.display = 'block';
  pp.innerHTML = `👥 ЮЗЕРОВ: ${(state.users || 0).toLocaleString()}<br>💰 ${getPassiveIncome().toLocaleString()} ₽/СЕК`;
}

function updateReleaseButton() {
  const btn = document.getElementById('btn-release');
  if (!btn) return;
  if (releaseReady) {
    btn.innerText = '🚀 РЕЛИЗ ГОТОВ!';
    btn.classList.add('ready');
  } else {
    btn.innerText = `⏳ РЕЛИЗ: ${Math.max(0, releaseCooldown)}с`;
    btn.classList.remove('ready');
  }
}

function doRelease() {
  if (!upgradesState.product) return;
  if (!releaseReady) { if (soundOn) soundError(); return; }

  releaseReady = false;
  releaseCooldown = 15;

  const burst = getPassiveIncome() * 5;        // 5 секунд дохода одним залпом
  const newUsers = Math.max(3, Math.floor(burst / 1500));

  state.money += burst;
  state.users = (state.users || 0) + newUsers;
  save();

  if (soundOn) soundUpgrade();
  screenFlash();
  showFloatText('🚀 +' + Math.round(burst).toLocaleString() + ' ₽', window.innerWidth / 2, window.innerHeight / 2 - 90);
  showFloatText('👥 +' + newUsers + ' юзеров', window.innerWidth / 2, window.innerHeight / 2 - 40);

  const bal = document.getElementById('balance');
  if (bal) bal.innerText = state.money.toLocaleString() + ' ₽';

  updateReleaseButton();
  renderProductPanel();
  checkGoalComplete();
}

// ============ СТАРТ ============
load();
initRain();
enableAudioOnFirstClick();

// Кулдаун релиза пережил перезагрузку — сразу отражаем его на кнопке
updateReleaseButton();

if (state.soundOn === false) {
  soundOn = false;
} else {
  soundOn = true;
  state.soundOn = true;
}

if (state.isStanding) showWork(); else showStart();