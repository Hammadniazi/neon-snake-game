// ============================================================================
// 1. SOUND SYSTEM (WEB AUDIO API RETRO SOUND SYNTHESIZER)
// ============================================================================
import "./style.css";

class AudioSynth {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  play(type) {
    if (!this.enabled) return;
    this.init();

    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    const now = this.ctx.currentTime;

    switch (type) {
      case "click":
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
        break;

      case "eat_normal":
        osc.type = "triangle";
        osc.frequency.setValueAtTime(250, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;

      case "eat_special":
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.setValueAtTime(600, now + 0.08);
        osc.frequency.setValueAtTime(900, now + 0.16);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
        break;

      case "powerup":
        osc.type = "sine";
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.45);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
        break;

      case "gameover":
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.6);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
        break;
    }
  }
}

const Sound = new AudioSynth();

// ============================================================================
// 2. STORAGE & PERSISTENCE MANAGER
// ============================================================================
const Storage = {
  get(key, defaultValue) {
    const val = localStorage.getItem(`neonsnake_${key}`);
    if (val === null) return defaultValue;
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  },
  set(key, val) {
    localStorage.setItem(`neonsnake_${key}`, JSON.stringify(val));
  },
};

const Stats = {
  gamesPlayed: Storage.get("stats_games_played", 0),
  totalFood: Storage.get("stats_total_food", 0),
  highScore: Storage.get("stats_high_score", 0),
  longestSnake: Storage.get("stats_longest_snake", 0),
  favorites: Storage.get("stats_favorites", {
    easy: 0,
    medium: 0,
    hard: 0,
    extreme: 0,
  }),

  increment(key, val = 1) {
    this[key] += val;
    Storage.set(`stats_${this.snakeToCamel(key)}`, this[key]);
  },
  snakeToCamel(str) {
    return str.replace(/([-_][a-z])/g, (group) =>
      group.toUpperCase().replace("-", "").replace("_", ""),
    );
  },
};

// Mock Local Leaderboard setup
let Leaderboard = Storage.get("leaderboard", [
  { name: "CRASH_KING", score: 450, difficulty: "hard" },
  { name: "SNEK_LORD", score: 320, difficulty: "extreme" },
  { name: "RETRO_FAN", score: 250, difficulty: "medium" },
  { name: "CHILL_SNAKE", score: 110, difficulty: "easy" },
]);

function updateLeaderboard(score, difficulty) {
  Leaderboard.push({ name: "YOU", score, difficulty });
  Leaderboard.sort((a, b) => b.score - a.score);
  Leaderboard = Leaderboard.slice(0, 5);
  Storage.set("leaderboard", Leaderboard);
}

// ============================================================================
// 3. ACHIEVEMENTS SYSTEM
// ============================================================================
const Achievements = [
  {
    id: "first_game",
    icon: "🎮",
    title: "First Slither",
    desc: "Complete your first ever match",
    condition: (state) => Stats.gamesPlayed >= 1,
    unlocked: false,
  },
  {
    id: "grow_50",
    icon: "🐍",
    title: "Gigantic Viper",
    desc: "Achieve a snake length of 25",
    condition: (state) => state.maxCurrentLength >= 25,
    unlocked: false,
  },
  {
    id: "score_100",
    icon: "⭐",
    title: "Centurion",
    desc: "Gain 100 points in a single match",
    condition: (state) => state.score >= 100,
    unlocked: false,
  },
  {
    id: "score_300",
    icon: "👑",
    title: "Neon Overlord",
    desc: "Gain 300 points in a single match",
    condition: (state) => state.score >= 300,
    unlocked: false,
  },
  {
    id: "hard_mode",
    icon: "🔥",
    title: "Pro Gamer",
    desc: "Score 100+ on Hard or Extreme",
    condition: (state) =>
      state.score >= 100 &&
      (state.difficulty === "hard" || state.difficulty === "extreme"),
    unlocked: false,
  },
  {
    id: "power_junkie",
    icon: "⚡",
    title: "Energized",
    desc: "Have 2 active power-ups at once",
    condition: (state) => state.activePowerupsCount >= 2,
    unlocked: false,
  },
];

Achievements.forEach((ach) => {
  ach.unlocked = Storage.get(`ach_${ach.id}`, false);
});

function checkAchievements(gameState) {
  Achievements.forEach((ach) => {
    if (!ach.unlocked && ach.condition(gameState)) {
      ach.unlocked = true;
      Storage.set(`ach_${ach.id}`, true);
      showAchievementToast(ach);
    }
  });
}

function showAchievementToast(ach) {
  const toast = document.getElementById("achievement-toast");
  document.getElementById("toast-title").innerText = ach.title;
  toast.classList.add("show");
  Sound.play("eat_special");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);
}

// ============================================================================
// 4. PARTICLE ENGINE
// ============================================================================
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.vx = (Math.random() - 0.5) * 8;
    this.vy = (Math.random() - 0.5) * 8;
    this.alpha = 1;
    this.decay = Math.random() * 0.03 + 0.02;
    this.size = Math.random() * 3 + 2;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= this.decay;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawRoundRect(context, x, y, w, h, r) {
  context.beginPath();
  if (context.roundRect) {
    context.roundRect(x, y, w, h, r);
  } else {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    context.moveTo(x + r, y);
    context.arcTo(x + w, y, x + w, y + h, r);
    context.arcTo(x + w, y + h, x, y + h, r);
    context.arcTo(x, y + h, x, y, r);
    context.arcTo(x, y, x + w, y, r);
  }
  context.fill();
}

// ============================================================================
// 5. CORE GAME LOOP & ENGINE
// ============================================================================
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const GRID_CELLS = 20;
let cellWidth, cellHeight;

const STATE_MENU = 0;
const STATE_PLAYING = 1;
const STATE_PAUSED = 2;
const STATE_GAMEOVER = 3;

const Game = {
  state: STATE_MENU,
  difficulty: "easy",
  snakeSkin: "green",
  score: 0,
  combo: 1.0,
  snake: [],
  direction: { x: 1, y: 0 },

  // Professional Upgrade: Dedicated Input Queue Buffer to eliminate turn latency collisions
  inputQueue: [],
  isBoosting: false, // holding space triggers high-speed risk dashing

  foods: [],
  powerups: [],
  activePowerups: {},
  particles: [],
  floatingTexts: [], // floating text score notifications
  screenShake: 0,
  lastTick: 0,
  maxCurrentLength: 0,

  skins: {
    green: { head: "#39ff14", body: "rgba(57, 255, 20, 0.7)", glow: "#39ff14" },
    neon: { head: "#00f0ff", body: "rgba(189, 0, 255, 0.7)", glow: "#00f0ff" },
    pink: { head: "#ff007f", body: "rgba(255, 230, 0, 0.7)", glow: "#ff007f" },
    gold: { head: "#ffe600", body: "rgba(255, 108, 0, 0.7)", glow: "#ffe600" },
  },

  speeds: {
    easy: { interval: 140, mult: 1.0 },
    medium: { interval: 95, mult: 1.5 },
    hard: { interval: 65, mult: 2.2 },
    extreme: { interval: 45, mult: 3.5 },
  },

  foodTypes: {
    normal: {
      color: "#ff007f",
      glow: "#ff007f",
      points: 10,
      prob: 0.65,
      label: "Normal",
    },
    golden: {
      color: "#ffe600",
      glow: "#ffe600",
      points: 30,
      prob: 0.15,
      label: "Golden",
    },
    mega: {
      color: "#bd00ff",
      glow: "#bd00ff",
      points: 50,
      prob: 0.05,
      label: "Mega",
    },
    speed: {
      color: "#00f0ff",
      glow: "#00f0ff",
      points: 15,
      prob: 0.08,
      label: "Speedy",
    },
    slow: {
      color: "#ff6c00",
      glow: "#ff6c00",
      points: 15,
      prob: 0.07,
      label: "Slow Down",
    },
  },

  powerupTypes: {
    shield: { name: "Shield", color: "#00f0ff", icon: "🛡️", duration: 8000 },
    magnet: { name: "Magnet", color: "#ffe600", icon: "🧲", duration: 10000 },
    multiplier: {
      name: "2X Points",
      color: "#ff007f",
      icon: "⚡",
      duration: 7000,
    },
    ghost: { name: "Ghost", color: "#bd00ff", icon: "👻", duration: 8000 },
  },

  init() {
    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());
    this.setupControls();
    this.loadPreferences();
    this.updateMenuStats();

    // Safeguard: Autopause when the window loses focus
    window.addEventListener("blur", () => {
      if (this.state === STATE_PLAYING) {
        this.togglePause();
      }
    });

    const loop = (time) => {
      this.tick(time);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  },

  resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    cellWidth = rect.width / GRID_CELLS;
    cellHeight = rect.height / GRID_CELLS;
  },

  loadPreferences() {
    this.difficulty = Storage.get("pref_difficulty", "easy");
    this.snakeSkin = Storage.get("pref_skin", "green");
    Sound.enabled = Storage.get("pref_sound", true);

    document.querySelectorAll("[data-difficulty]").forEach((btn) => {
      btn.classList.toggle(
        "active",
        btn.dataset.difficulty === this.difficulty,
      );
    });
    document.querySelectorAll("[data-skin]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.skin === this.snakeSkin);
    });
    document.getElementById("sound-btn").innerText = Sound.enabled
      ? "🔊"
      : "🔇";

    const savedTheme = Storage.get("pref_theme", "dark");
    document.documentElement.setAttribute("data-theme", savedTheme);
  },

  updateMenuStats() {
    document.getElementById("menu-hi-score").innerText = Stats.highScore;
    document.getElementById("menu-games-played").innerText = Stats.gamesPlayed;
  },

  startNewGame() {
    Sound.play("click");
    this.score = 0;
    this.combo = 1.0;
    this.screenShake = 0;
    this.direction = { x: 1, y: 0 };
    this.inputQueue = [];
    this.isBoosting = false;
    this.snake = [
      { x: 5, y: 10 },
      { x: 4, y: 10 },
      { x: 3, y: 10 },
    ];
    this.maxCurrentLength = this.snake.length;
    this.foods = [];
    this.powerups = [];
    this.activePowerups = {};
    this.particles = [];
    this.floatingTexts = [];

    this.spawnFood();

    Stats.gamesPlayed++;
    Storage.set("stats_games_played", Stats.gamesPlayed);

    Stats.favorites[this.difficulty] =
      (Stats.favorites[this.difficulty] || 0) + 1;
    Storage.set("stats_favorites", Stats.favorites);

    document.getElementById("menu-screen").classList.add("hidden");
    document.getElementById("game-screen").classList.remove("hidden");

    this.resizeCanvas();
    this.lastTick = performance.now();

    document.getElementById("pause-modal").classList.add("hidden");
    document.getElementById("game-over-modal").classList.add("hidden");
    this.updateHud();

    // 3-2-1 countdown before gameplay starts
    this.state = STATE_PAUSED;
    const countdownEl = document.getElementById("countdown-number");
    const countdownModal = document.getElementById("countdown-modal");
    const counts = ["3", "2", "1", "GO!"];
    let i = 0;
    countdownModal.classList.remove("hidden");
    const tick = () => {
      if (i < counts.length) {
        countdownEl.textContent = counts[i];
        Sound.play("click");
        i++;
        setTimeout(tick, i < counts.length ? 700 : 400);
      } else {
        countdownModal.classList.add("hidden");
        this.state = STATE_PLAYING;
        this.lastTick = performance.now();
      }
    };
    tick();
  },

  updateHud() {
    document.getElementById("current-score").innerText = this.score;
    document.getElementById("combo-multiplier").innerText =
      `${this.combo.toFixed(1)}x`;
    document.getElementById("hud-best-score").innerText = Stats.highScore;
    const bi = document.getElementById("boost-indicator");
    if (this.isBoosting) {
      bi.classList.remove("hidden");
    } else {
      bi.classList.add("hidden");
    }
  },

  spawnFood() {
    let attempts = 0;
    let rx, ry;
    const head = this.snake[0];

    while (attempts < 150) {
      rx = Math.floor(Math.random() * GRID_CELLS);
      ry = Math.floor(Math.random() * GRID_CELLS);
      const onSnake = this.snake.some(
        (segment) => segment.x === rx && segment.y === ry,
      );
      const onFood = this.foods.some((food) => food.x === rx && food.y === ry);

      // Gamer Design Upgrade: Prevent items spawning inside a 3-cell safety radius from head
      const distFromHead = Math.abs(rx - head.x) + Math.abs(ry - head.y);

      if (!onSnake && !onFood && distFromHead >= 3) break;
      attempts++;
    }

    const rand = Math.random();
    let chosenType = "normal";
    let runningSum = 0;
    for (const [key, meta] of Object.entries(this.foodTypes)) {
      runningSum += meta.prob;
      if (rand <= runningSum) {
        chosenType = key;
        break;
      }
    }

    this.foods.push({
      x: rx,
      y: ry,
      type: chosenType,
      pulse: 0,
      createdAt: Date.now(),
    });

    if (Math.random() < 0.12 && this.powerups.length === 0) {
      this.spawnPowerup();
    }
  },

  spawnPowerup() {
    let rx, ry;
    let attempts = 0;
    const head = this.snake[0];

    while (attempts < 100) {
      rx = Math.floor(Math.random() * GRID_CELLS);
      ry = Math.floor(Math.random() * GRID_CELLS);
      const onSnake = this.snake.some(
        (segment) => segment.x === rx && segment.y === ry,
      );
      const onFood = this.foods.some((food) => food.x === rx && food.y === ry);

      // Pro Safeguard: Maintain safety margins around snake head
      const distFromHead = Math.abs(rx - head.x) + Math.abs(ry - head.y);

      if (!onSnake && !onFood && distFromHead >= 3) break;
      attempts++;
    }

    const keys = Object.keys(this.powerupTypes);
    const randomType = keys[Math.floor(Math.random() * keys.length)];

    this.powerups.push({
      x: rx,
      y: ry,
      type: randomType,
      pulse: 0,
    });
  },

  explode(x, y, color, count = 15) {
    const px = x * cellWidth + cellWidth / 2;
    const py = y * cellHeight + cellHeight / 2;
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(px, py, color));
    }
  },

  applyPowerup(type) {
    Sound.play("powerup");
    const duration = this.powerupTypes[type].duration;
    this.activePowerups[type] = Date.now() + duration;

    this.renderActivePowerupsUI();
  },

  renderActivePowerupsUI() {
    const overlay = document.getElementById("powerup-overlay");
    overlay.innerHTML = "";
    const now = Date.now();

    Object.entries(this.activePowerups).forEach(([type, expiresAt]) => {
      const remaining = expiresAt - now;
      if (remaining > 0) {
        const meta = this.powerupTypes[type];
        const badge = document.createElement("div");
        badge.className = "powerup-badge";
        badge.style.borderLeft = `3px solid ${meta.color}`;
        badge.innerHTML = `<span>${meta.icon}</span> <span>${meta.name}</span> <span style="color:${meta.color}; margin-left: 5px;">${Math.ceil(remaining / 1000)}s</span>`;
        overlay.appendChild(badge);
      }
    });
  },

  triggerScreenShake(amt) {
    this.screenShake = amt;
  },

  setupControls() {
    const triggerDirection = (dirKey) => {
      if (this.state !== STATE_PLAYING) return;

      // Evaluates pending items in queue buffer, falling back to current active vector
      const lastDir =
        this.inputQueue.length > 0
          ? this.inputQueue[this.inputQueue.length - 1]
          : this.direction;

      let target = null;
      switch (dirKey) {
        case "ArrowUp":
        case "KeyW":
          if (lastDir.y === 0) target = { x: 0, y: -1 };
          break;
        case "ArrowDown":
        case "KeyS":
          if (lastDir.y === 0) target = { x: 0, y: 1 };
          break;
        case "ArrowLeft":
        case "KeyA":
          if (lastDir.x === 0) target = { x: -1, y: 0 };
          break;
        case "ArrowRight":
        case "KeyD":
          if (lastDir.x === 0) target = { x: 1, y: 0 };
          break;
      }

      // Limit buffer size to 2 entries to avoid sliding lag
      if (target && this.inputQueue.length < 2) {
        this.inputQueue.push(target);
      }
    };

    window.addEventListener("keydown", (e) => {
      if (
        ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
          e.code,
        )
      ) {
        e.preventDefault();
      }
      if (e.code === "Escape") {
        this.togglePause();
      }

      // Spacebar: Dash Mechanic
      if (e.code === "Space" && this.state === STATE_PLAYING) {
        this.isBoosting = true;
        this.updateHud();
      }

      triggerDirection(e.code);
    });

    window.addEventListener("keyup", (e) => {
      if (e.code === "Space" && this.state === STATE_PLAYING) {
        this.isBoosting = false;
        this.updateHud();
      }
    });

    const bindControl = (btnId, key) => {
      document.getElementById(btnId).addEventListener(
        "touchstart",
        (e) => {
          e.preventDefault();
          triggerDirection(key);
        },
        { passive: false },
      );
      document.getElementById(btnId).addEventListener("mousedown", () => {
        triggerDirection(key);
      });
    };

    bindControl("btn-up", "ArrowUp");
    bindControl("btn-down", "ArrowDown");
    bindControl("btn-left", "ArrowLeft");
    bindControl("btn-right", "ArrowRight");

    // Swipe Gestures
    let touchStartX = 0;
    let touchStartY = 0;

    canvas.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
      },
      { passive: true },
    );

    canvas.addEventListener(
      "touchend",
      (e) => {
        const diffX = e.changedTouches[0].screenX - touchStartX;
        const diffY = e.changedTouches[0].screenY - touchStartY;
        const absX = Math.abs(diffX);
        const absY = Math.abs(diffY);

        if (Math.max(absX, absY) > 25) {
          if (absX > absY) {
            triggerDirection(diffX > 0 ? "ArrowRight" : "ArrowLeft");
          } else {
            triggerDirection(diffY > 0 ? "ArrowDown" : "ArrowUp");
          }
        }
      },
      { passive: true },
    );
  },

  togglePause() {
    if (this.state === STATE_PLAYING) {
      Sound.play("click");
      this.state = STATE_PAUSED;
      document.getElementById("pause-modal").classList.remove("hidden");
    } else if (this.state === STATE_PAUSED) {
      Sound.play("click");
      this.state = STATE_PLAYING;
      document.getElementById("pause-modal").classList.add("hidden");
    }
  },

  tick(timestamp) {
    this.updateVisuals();

    if (this.state !== STATE_PLAYING) {
      this.draw();
      return;
    }

    let activeSpeed = this.speeds[this.difficulty].interval;

    if (this.activePowerups["speed"]) {
      activeSpeed *= 0.7;
    }
    if (this.activePowerups["slow"]) {
      activeSpeed *= 1.4;
    }

    // Dash Booster scale
    if (this.isBoosting) {
      activeSpeed *= 0.5;
    }

    const elapsed = timestamp - this.lastTick;
    if (elapsed >= activeSpeed) {
      this.lastTick = timestamp;
      this.moveSnake();
    }

    this.draw();
  },

  updateVisuals() {
    // UI/UX Upgrade: Damped harmonic decay spring on screen shake
    if (this.screenShake > 0) {
      this.screenShake *= 0.85;
      if (this.screenShake < 0.1) this.screenShake = 0;
    }

    const now = Date.now();
    let powerupsUIUpdateNeeded = false;
    Object.keys(this.activePowerups).forEach((type) => {
      if (this.activePowerups[type] < now) {
        delete this.activePowerups[type];
        powerupsUIUpdateNeeded = true;
      }
    });

    if (powerupsUIUpdateNeeded) {
      this.renderActivePowerupsUI();
    }

    this.foods.forEach((f) => (f.pulse += 0.12));
    this.powerups.forEach((p) => (p.pulse += 0.08));

    // Update Standard particles with CPU load limiting bounds
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update();
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
    if (this.particles.length > 150) {
      this.particles.splice(0, this.particles.length - 150);
    }

    // UI/UX Upgrade: Process floating score popups
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y += t.vy;
      t.alpha -= 0.035;
      if (t.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  },

  moveSnake() {
    // Consume direction instruction from safety input queue
    if (this.inputQueue.length > 0) {
      this.direction = this.inputQueue.shift();
    }

    const head = this.snake[0];
    const newHead = {
      x: head.x + this.direction.x,
      y: head.y + this.direction.y,
    };

    const isGhost = !!this.activePowerups["ghost"];
    if (isGhost) {
      if (newHead.x < 0) newHead.x = GRID_CELLS - 1;
      if (newHead.x >= GRID_CELLS) newHead.x = 0;
      if (newHead.y < 0) newHead.y = GRID_CELLS - 1;
      if (newHead.y >= GRID_CELLS) newHead.y = 0;
    } else {
      if (
        newHead.x < 0 ||
        newHead.x >= GRID_CELLS ||
        newHead.y < 0 ||
        newHead.y >= GRID_CELLS
      ) {
        this.handleCrash();
        return;
      }
    }

    const isShielded = !!this.activePowerups["shield"];
    const collidesSelf = this.snake.some(
      (segment) => segment.x === newHead.x && segment.y === newHead.y,
    );
    if (collidesSelf && !isGhost) {
      if (isShielded) {
        delete this.activePowerups["shield"];
        this.triggerScreenShake(8);
        this.renderActivePowerupsUI();
        Sound.play("click");
      } else {
        this.handleCrash();
        return;
      }
    }

    this.snake.unshift(newHead);

    const isMagnet = !!this.activePowerups["magnet"];
    if (isMagnet) {
      this.foods.forEach((food) => {
        const dist =
          Math.abs(newHead.x - food.x) + Math.abs(newHead.y - food.y);
        if (dist <= 2 && dist > 0) {
          food.x += Math.sign(newHead.x - food.x);
          food.y += Math.sign(newHead.y - food.y);
        }
      });
    }

    let ate = false;
    for (let i = 0; i < this.foods.length; i++) {
      const food = this.foods[i];
      if (newHead.x === food.x && newHead.y === food.y) {
        this.handleEatFood(food, i);
        ate = true;
        break;
      }
    }

    for (let i = 0; i < this.powerups.length; i++) {
      const item = this.powerups[i];
      if (newHead.x === item.x && newHead.y === item.y) {
        this.applyPowerup(item.type);
        this.explode(item.x, item.y, this.powerupTypes[item.type].color, 20);
        this.powerups.splice(i, 1);
        break;
      }
    }

    if (!ate) {
      this.snake.pop();
    }

    if (this.snake.length > this.maxCurrentLength) {
      this.maxCurrentLength = this.snake.length;
    }
  },

  handleEatFood(food, index) {
    this.foods.splice(index, 1);

    // Boosting triggers double combo gains
    const comboStep = this.isBoosting ? 0.4 : 0.2;
    this.combo += comboStep;

    const foodConfig = this.foodTypes[food.type];
    const diffMult = this.speeds[this.difficulty].mult;
    const multiActive = this.activePowerups["multiplier"] ? 2.0 : 1.0;
    const dashBonus = this.isBoosting ? 1.5 : 1.0; // Dashing yields score bonuses

    const gainedPoints = Math.round(
      foodConfig.points * diffMult * this.combo * multiActive * dashBonus,
    );
    this.score += gainedPoints;

    // UI/UX Score floating popup
    this.floatingTexts.push({
      x: food.x * cellWidth + cellWidth / 2,
      y: food.y * cellHeight,
      text: `+${gainedPoints}`,
      color: foodConfig.color,
      alpha: 1.0,
      vy: -1.4,
    });

    if (food.type === "golden") {
      Sound.play("eat_special");
      this.triggerScreenShake(5);
      this.explode(food.x, food.y, foodConfig.color, 25);
    } else if (food.type === "mega") {
      Sound.play("eat_special");
      this.triggerScreenShake(10);
      this.explode(food.x, food.y, foodConfig.color, 35);
    } else {
      Sound.play("eat_normal");
      this.explode(food.x, food.y, foodConfig.color, 12);
    }

    if (food.type === "speed") {
      this.activePowerups["speed"] = Date.now() + 4000;
      delete this.activePowerups["slow"];
    } else if (food.type === "slow") {
      this.activePowerups["slow"] = Date.now() + 4000;
      delete this.activePowerups["speed"];
    }

    this.updateHud();
    this.spawnFood();

    Stats.increment("total_food");

    const statePayload = {
      score: this.score,
      maxCurrentLength: this.maxCurrentLength,
      difficulty: this.difficulty,
      activePowerupsCount: Object.keys(this.activePowerups).length,
    };
    checkAchievements(statePayload);
  },

  handleCrash() {
    Sound.play("gameover");
    this.triggerScreenShake(18);

    this.explode(
      this.snake[0].x,
      this.snake[0].y,
      this.skins[this.snakeSkin].head,
      40,
    );

    if ("vibrate" in navigator) {
      navigator.vibrate(200);
    }

    this.state = STATE_GAMEOVER;

    if (this.score > Stats.highScore) {
      Stats.highScore = this.score;
      Storage.set("stats_high_score", this.score);
    }

    if (this.maxCurrentLength > Stats.longestSnake) {
      Stats.longestSnake = this.maxCurrentLength;
      Storage.set("stats_longest_snake", Stats.longestSnake);
    }

    updateLeaderboard(this.score, this.difficulty);
    this.updateMenuStats();

    const statePayload = {
      score: this.score,
      maxCurrentLength: this.maxCurrentLength,
      difficulty: this.difficulty,
      activePowerupsCount: Object.keys(this.activePowerups).length,
    };
    checkAchievements(statePayload);

    document.getElementById("go-score").innerText = this.score;
    document.getElementById("go-combo").innerText = `${this.combo.toFixed(1)}x`;
    document.getElementById("go-diff").innerText = this.difficulty;
    document.getElementById("go-length").innerText = this.maxCurrentLength;
    document.getElementById("game-over-modal").classList.remove("hidden");
  },

  draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    if (this.screenShake > 0) {
      const dx = (Math.random() - 0.5) * this.screenShake;
      const dy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(dx, dy);
    }

    this.drawGrid();

    // Render Foods
    this.foods.forEach((food) => {
      const config = this.foodTypes[food.type];
      const scale = 1 + Math.sin(food.pulse) * 0.1;
      const w = cellWidth * scale;
      const h = cellHeight * scale;
      const px = food.x * cellWidth + (cellWidth - w) / 2;
      const py = food.y * cellHeight + (cellHeight - h) / 2;

      ctx.save();
      ctx.shadowColor = config.glow;
      ctx.shadowBlur = 15;
      ctx.fillStyle = config.color;
      ctx.beginPath();
      ctx.arc(px + w / 2, py + h / 2, w / 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Render Powerups
    this.powerups.forEach((item) => {
      const meta = this.powerupTypes[item.type];
      const scale = 1 + Math.sin(item.pulse) * 0.12;
      const w = cellWidth * scale;
      const h = cellHeight * scale;
      const px = item.x * cellWidth + (cellWidth - w) / 2;
      const py = item.y * cellHeight + (cellHeight - h) / 2;

      ctx.save();
      ctx.shadowColor = meta.color;
      ctx.shadowBlur = 15;
      ctx.fillStyle = meta.color;
      drawRoundRect(ctx, px + w * 0.1, py + h * 0.1, w * 0.8, h * 0.8, 4);

      ctx.restore();
      ctx.fillStyle = "#fff";
      ctx.font = `${cellWidth * 0.5}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(meta.icon, px + w / 2, py + h / 2);
    });

    // Render Particles
    this.particles.forEach((p) => p.draw(ctx));

    // Render Snake
    const skinConfig = this.skins[this.snakeSkin];
    const isGhost = !!this.activePowerups["ghost"];

    this.snake.forEach((segment, i) => {
      const isHead = i === 0;
      const px = segment.x * cellWidth;
      const py = segment.y * cellHeight;

      ctx.save();
      if (isHead) {
        ctx.fillStyle = skinConfig.head;
        ctx.shadowColor = skinConfig.glow;
        ctx.shadowBlur = 20;
      } else {
        ctx.fillStyle = skinConfig.body;
      }

      if (isGhost) {
        ctx.globalAlpha = 0.55;
      }

      const radius = isHead ? 6 : 4;
      drawRoundRect(
        ctx,
        px + 1.5,
        py + 1.5,
        cellWidth - 3,
        cellHeight - 3,
        radius,
      );

      if (isHead) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#000";
        const eyeSize = 2.5;
        const offset = 5;

        if (this.direction.x !== 0) {
          const ex =
            this.direction.x === 1 ? px + cellWidth - offset : px + offset;
          ctx.beginPath();
          ctx.arc(ex, py + offset, eyeSize, 0, Math.PI * 2);
          ctx.arc(ex, py + cellHeight - offset, eyeSize, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const ey =
            this.direction.y === 1 ? py + cellHeight - offset : py + offset;
          ctx.beginPath();
          ctx.arc(px + offset, ey, eyeSize, 0, Math.PI * 2);
          ctx.arc(px + cellWidth - offset, ey, eyeSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    });

    // UI/UX Upgrade: Render Floating score texts
    this.floatingTexts.forEach((t) => {
      ctx.save();
      ctx.globalAlpha = t.alpha;
      ctx.fillStyle = t.color;
      ctx.shadowColor = t.color;
      ctx.shadowBlur = 8;
      ctx.font = `bold ${cellWidth * 0.5}px Arial`;
      ctx.textAlign = "center";
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    });

    ctx.restore();
  },

  drawGrid() {
    ctx.save();
    ctx.strokeStyle =
      document.documentElement.getAttribute("data-theme") === "dark"
        ? "rgba(255, 255, 255, 0.03)"
        : "rgba(0, 0, 0, 0.03)";
    ctx.lineWidth = 1;

    for (let i = 0; i <= GRID_CELLS; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellWidth, 0);
      ctx.lineTo(i * cellWidth, canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * cellHeight);
      ctx.lineTo(canvas.width, i * cellHeight);
      ctx.stroke();
    }
    ctx.restore();
  },
};

// ============================================================================
// 6. UI INTERACTIONS & ROUTING
// ============================================================================

document.querySelectorAll("[data-difficulty]").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    Sound.play("click");
    document
      .querySelectorAll("[data-difficulty]")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    Game.difficulty = btn.dataset.difficulty;
    Storage.set("pref_difficulty", Game.difficulty);
  });
});

document.querySelectorAll("[data-skin]").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    Sound.play("click");
    document
      .querySelectorAll("[data-skin]")
      .forEach((b) => b.classList.remove("active"));
    const el = e.currentTarget;
    el.classList.add("active");
    Game.snakeSkin = el.dataset.skin;
    Storage.set("pref_skin", Game.snakeSkin);
  });
});

document.getElementById("sound-btn").addEventListener("click", (e) => {
  Sound.enabled = !Sound.enabled;
  Sound.play("click");
  e.currentTarget.innerText = Sound.enabled ? "🔊" : "🔇";
  Storage.set("pref_sound", Sound.enabled);
});

document.getElementById("theme-btn").addEventListener("click", () => {
  Sound.play("click");
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const targetTheme = currentTheme === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", targetTheme);
  Storage.set("pref_theme", targetTheme);
});

document.getElementById("play-btn").addEventListener("click", () => {
  Game.startNewGame();
});

document.getElementById("pause-btn").addEventListener("click", () => {
  Game.togglePause();
});
document.getElementById("resume-btn").addEventListener("click", () => {
  Game.togglePause();
});
document.getElementById("restart-btn").addEventListener("click", () => {
  Game.startNewGame();
});
document.getElementById("quit-btn").addEventListener("click", () => {
  Sound.play("click");
  Game.state = STATE_MENU;
  document.getElementById("game-screen").classList.add("hidden");
  document.getElementById("menu-screen").classList.remove("hidden");
});

document.getElementById("go-restart-btn").addEventListener("click", () => {
  Game.startNewGame();
});
document.getElementById("go-menu-btn").addEventListener("click", () => {
  Sound.play("click");
  Game.state = STATE_MENU;
  document.getElementById("game-screen").classList.add("hidden");
  document.getElementById("menu-screen").classList.remove("hidden");
});

const statsModal = document.getElementById("stats-modal");
document.getElementById("stats-btn").addEventListener("click", () => {
  Sound.play("click");

  document.getElementById("stat-games").innerText = Stats.gamesPlayed;
  document.getElementById("stat-food").innerText = Stats.totalFood;
  document.getElementById("stat-hiscore").innerText = Stats.highScore;
  document.getElementById("stat-length").innerText = Stats.longestSnake;

  let fav = "None";
  let maxCount = -1;
  Object.entries(Stats.favorites).forEach(([key, val]) => {
    if (val > maxCount) {
      maxCount = val;
      fav = key;
    }
  });
  document.getElementById("stat-favorite").innerText =
    maxCount > 0 ? fav.toUpperCase() : "N/A";

  const leadList = document.getElementById("leaderboard-container");
  leadList.innerHTML = "";
  Leaderboard.forEach((entry, idx) => {
    const row = document.createElement("div");
    row.className = `lead-row ${entry.name === "YOU" ? "current-user" : ""}`;
    row.innerHTML = `<span>#${idx + 1} ${entry.name}</span> <span style="text-transform:uppercase; font-size: 0.75rem; color:var(--text-secondary);">${entry.difficulty}</span> <span>${entry.score} pts</span>`;
    leadList.appendChild(row);
  });

  statsModal.classList.remove("hidden");
});
document.getElementById("stats-close-btn").addEventListener("click", () => {
  Sound.play("click");
  statsModal.classList.add("hidden");
});

const achModal = document.getElementById("ach-modal");
document.getElementById("ach-btn").addEventListener("click", () => {
  Sound.play("click");

  const countText = document.getElementById("ach-count");
  const unlockedCount = Achievements.filter((a) => a.unlocked).length;
  countText.innerText = `${unlockedCount}/${Achievements.length}`;

  const container = document.getElementById("ach-list-container");
  container.innerHTML = "";

  Achievements.forEach((ach) => {
    const row = document.createElement("div");
    row.className = `achievement-row ${ach.unlocked ? "unlocked" : ""}`;
    row.innerHTML = `
            <div class="ach-icon">${ach.icon}</div>
            <div class="ach-info">
                <span class="ach-title">${ach.title}</span>
                <span class="ach-desc">${ach.desc}</span>
            </div>
        `;
    container.appendChild(row);
  });

  achModal.classList.remove("hidden");
});
document.getElementById("ach-close-btn").addEventListener("click", () => {
  Sound.play("click");
  achModal.classList.add("hidden");
});

Game.init();
