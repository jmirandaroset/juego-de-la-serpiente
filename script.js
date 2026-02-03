const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("highScore");
const levelEl = document.getElementById("level");
const speedDisplay = document.getElementById("speedDisplay");
const finalScore = document.getElementById("finalScore");

const menuOverlay = document.getElementById("menuOverlay");
const optionsOverlay = document.getElementById("optionsOverlay");
const pauseOverlay = document.getElementById("pauseOverlay");
const gameOverOverlay = document.getElementById("gameOverOverlay");

const startBtn = document.getElementById("startBtn");
const optionsBtn = document.getElementById("optionsBtn");
const saveOptions = document.getElementById("saveOptions");
const closeOptions = document.getElementById("closeOptions");
const resumeBtn = document.getElementById("resumeBtn");
const restartBtn = document.getElementById("restartBtn");
const playAgainBtn = document.getElementById("playAgainBtn");
const backToMenuBtn = document.getElementById("backToMenuBtn");

const speedRange = document.getElementById("speedRange");
const mapSize = document.getElementById("mapSize");
const snakeSkin = document.getElementById("snakeSkin");
const bgColor = document.getElementById("bgColor");
const wallsToggle = document.getElementById("wallsToggle");
const infiniteToggle = document.getElementById("infiniteToggle");
const difficultySelect = document.getElementById("difficulty");

const themeToggle = document.getElementById("themeToggle");
const soundToggle = document.getElementById("soundToggle");

const mobileButtons = document.querySelectorAll(".mobile-controls button");

const storage = {
  get(key, fallback) {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
};

const skins = {
  neon: {
    head: "#5ae8ff",
    body: "#47ff9c",
    glow: "rgba(90, 232, 255, 0.6)",
  },
  cyber: {
    head: "#ff8aed",
    body: "#5c7cff",
    glow: "rgba(255, 138, 237, 0.5)",
  },
  nature: {
    head: "#65ff7b",
    body: "#2bb673",
    glow: "rgba(101, 255, 123, 0.5)",
  },
};

const difficulties = {
  relax: { foodBoost: 0.12, speedGain: 0.2 },
  normal: { foodBoost: 0.2, speedGain: 0.35 },
  hard: { foodBoost: 0.32, speedGain: 0.5 },
};

const audio = {
  enabled: storage.get("sound", true),
  ctx: null,
  play(freq, duration = 0.08, type = "sine") {
    if (!this.enabled) return;
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    const oscillator = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.value = freq;
    gain.gain.value = 0.2;
    oscillator.connect(gain);
    gain.connect(this.ctx.destination);
    oscillator.start();
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    oscillator.stop(this.ctx.currentTime + duration);
  },
};

soundToggle.textContent = audio.enabled ? "🔊" : "🔈";

const game = {
  running: false,
  paused: false,
  gridSize: 18,
  baseSpeed: 6,
  speed: 6,
  cells: 18,
  cellSize: 600 / 18,
  snake: [],
  direction: { x: 1, y: 0 },
  nextDirection: { x: 1, y: 0 },
  food: null,
  particles: [],
  score: 0,
  level: 1,
  foodsEaten: 0,
  highScore: storage.get("highScore", 0),
  effects: {
    turbo: 0,
    slow: 0,
    bonus: 0,
  },
  settings: {
    walls: true,
    infinite: false,
    skin: "neon",
    bg: "#0b1220",
    difficulty: "normal",
  },
  lastTime: 0,
  accumulator: 0,
};

highScoreEl.textContent = game.highScore;

const foodTypes = [
  { type: "normal", color: "#47ff9c", score: 10, growth: 1 },
  { type: "turbo", color: "#5ae8ff", score: 12, growth: 1 },
  { type: "slow", color: "#ffa552", score: 8, growth: 1 },
  { type: "bonus", color: "#ff8aed", score: 20, growth: 2 },
];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function resizeCanvas() {
  const size = Math.min(640, window.innerWidth * 0.9);
  canvas.width = size;
  canvas.height = size;
  game.cellSize = size / game.cells;
}

function initGame() {
  game.cells = Number(mapSize.value);
  game.baseSpeed = Number(speedRange.value);
  game.speed = game.baseSpeed;
  game.score = 0;
  game.level = 1;
  game.foodsEaten = 0;
  game.effects = { turbo: 0, slow: 0, bonus: 0 };
  game.settings.walls = wallsToggle.checked;
  game.settings.infinite = infiniteToggle.checked;
  game.settings.skin = snakeSkin.value;
  game.settings.bg = bgColor.value;
  game.settings.difficulty = difficultySelect.value;
  game.snake = [
    { x: Math.floor(game.cells / 2), y: Math.floor(game.cells / 2) },
    { x: Math.floor(game.cells / 2) - 1, y: Math.floor(game.cells / 2) },
  ];
  game.direction = { x: 1, y: 0 };
  game.nextDirection = { x: 1, y: 0 };
  game.particles = [];
  spawnFood();
  resizeCanvas();
  updateUI();
}

function spawnFood() {
  const difficulty = difficulties[game.settings.difficulty];
  const roll = Math.random();
  let pool = foodTypes;
  if (roll < difficulty.foodBoost) {
    pool = foodTypes.filter((food) => food.type !== "normal");
  }
  const selected = pool[Math.floor(Math.random() * pool.length)];
  let position;
  do {
    position = {
      x: Math.floor(Math.random() * game.cells),
      y: Math.floor(Math.random() * game.cells),
    };
  } while (game.snake.some((seg) => seg.x === position.x && seg.y === position.y));
  game.food = { ...selected, position };
}

function updateUI() {
  scoreEl.textContent = game.score;
  highScoreEl.textContent = game.highScore;
  levelEl.textContent = game.level;
  speedDisplay.textContent = game.speed.toFixed(1);
  canvas.style.background = game.settings.bg;
}

function toggleOverlay(overlay, show) {
  overlay.classList.toggle("hidden", !show);
}

function startGame() {
  initGame();
  game.running = true;
  game.paused = false;
  game.lastTime = performance.now();
  game.accumulator = 0;
  toggleOverlay(menuOverlay, false);
  toggleOverlay(gameOverOverlay, false);
  toggleOverlay(pauseOverlay, false);
  requestAnimationFrame(gameLoop);
}

function pauseGame() {
  if (!game.running) return;
  game.paused = true;
  toggleOverlay(pauseOverlay, true);
}

function resumeGame() {
  game.paused = false;
  toggleOverlay(pauseOverlay, false);
  game.lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

function gameOver() {
  game.running = false;
  audio.play(180, 0.2, "sawtooth");
  finalScore.textContent = `Puntuación: ${game.score}`;
  toggleOverlay(gameOverOverlay, true);
}

function updateDirection(newDir) {
  if (game.direction.x + newDir.x === 0 && game.direction.y + newDir.y === 0) return;
  game.nextDirection = newDir;
}

function handleInput(e) {
  const key = e.key.toLowerCase();
  if (key === "arrowup" || key === "w") updateDirection({ x: 0, y: -1 });
  if (key === "arrowdown" || key === "s") updateDirection({ x: 0, y: 1 });
  if (key === "arrowleft" || key === "a") updateDirection({ x: -1, y: 0 });
  if (key === "arrowright" || key === "d") updateDirection({ x: 1, y: 0 });
  if (key === " " || key === "p") (game.paused ? resumeGame() : pauseGame());
  if (key === "r") startGame();
}

function updateEffects(delta) {
  if (game.effects.turbo > 0) game.effects.turbo -= delta;
  if (game.effects.slow > 0) game.effects.slow -= delta;
  if (game.effects.bonus > 0) game.effects.bonus -= delta;
  const turboMultiplier = game.effects.turbo > 0 ? 1.6 : 1;
  const slowMultiplier = game.effects.slow > 0 ? 0.7 : 1;
  game.speed = clamp(game.baseSpeed * turboMultiplier * slowMultiplier, 3, 18);
}

function eatFood() {
  const food = game.food;
  const multiplier = game.effects.bonus > 0 ? 2 : 1;
  game.score += food.score * multiplier;
  game.foodsEaten += 1;

  if (food.type === "turbo") {
    game.effects.turbo = 3500;
  }
  if (food.type === "slow") {
    game.effects.slow = 3500;
  }
  if (food.type === "bonus") {
    game.effects.bonus = 5000;
  }

  if (game.foodsEaten % 5 === 0) {
    game.level += 1;
    game.baseSpeed += difficulties[game.settings.difficulty].speedGain;
  }

  spawnParticles(food.position, food.color);
  audio.play(520, 0.08, "triangle");
  updateUI();
  spawnFood();
  return food.growth;
}

function spawnParticles(position, color) {
  for (let i = 0; i < 12; i += 1) {
    game.particles.push({
      x: position.x + 0.5,
      y: position.y + 0.5,
      vx: (Math.random() - 0.5) * 0.08,
      vy: (Math.random() - 0.5) * 0.08,
      life: 1,
      color,
    });
  }
}

function updateParticles(delta) {
  const factor = delta / 16;
  game.particles.forEach((particle) => {
    particle.x += particle.vx * factor;
    particle.y += particle.vy * factor;
    particle.life -= 0.03 * factor;
  });
  game.particles = game.particles.filter((p) => p.life > 0);
}

function updateSnake() {
  game.direction = game.nextDirection;
  const head = { ...game.snake[0] };
  head.x += game.direction.x;
  head.y += game.direction.y;

  if (!game.settings.walls || game.settings.infinite) {
    head.x = (head.x + game.cells) % game.cells;
    head.y = (head.y + game.cells) % game.cells;
  } else if (head.x < 0 || head.x >= game.cells || head.y < 0 || head.y >= game.cells) {
    return false;
  }

  const selfHitIndex = game.snake.findIndex((seg) => seg.x === head.x && seg.y === head.y);
  if (selfHitIndex !== -1) {
    if (game.settings.infinite) {
      game.snake = game.snake.slice(0, selfHitIndex);
      game.score = Math.max(0, game.score - 15);
      audio.play(220, 0.12, "square");
      updateUI();
    } else {
      return false;
    }
  }

  game.snake.unshift(head);

  let growth = 0;
  if (head.x === game.food.position.x && head.y === game.food.position.y) {
    growth = eatFood();
  }

  if (growth === 0) {
    game.snake.pop();
  } else if (growth > 1) {
    const tail = game.snake[game.snake.length - 1];
    for (let i = 1; i < growth; i += 1) {
      game.snake.push({ ...tail });
    }
  }

  return true;
}

function drawGrid() {
  ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= game.cells; i += 1) {
    const position = i * game.cellSize;
    ctx.beginPath();
    ctx.moveTo(position, 0);
    ctx.lineTo(position, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, position);
    ctx.lineTo(canvas.width, position);
    ctx.stroke();
  }
}

function drawFood() {
  const food = game.food;
  const size = game.cellSize * 0.6;
  const x = food.position.x * game.cellSize + (game.cellSize - size) / 2;
  const y = food.position.y * game.cellSize + (game.cellSize - size) / 2;
  ctx.fillStyle = food.color;
  ctx.shadowColor = food.color;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, 8);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawSnake() {
  const skin = skins[game.settings.skin];
  ctx.shadowColor = skin.glow;
  ctx.shadowBlur = 18;
  game.snake.forEach((segment, index) => {
    const size = game.cellSize * (index === 0 ? 0.85 : 0.72);
    const x = segment.x * game.cellSize + (game.cellSize - size) / 2;
    const y = segment.y * game.cellSize + (game.cellSize - size) / 2;
    ctx.fillStyle = index === 0 ? skin.head : skin.body;
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, 10);
    ctx.fill();
  });
  ctx.shadowBlur = 0;
}

function drawParticles() {
  game.particles.forEach((particle) => {
    ctx.fillStyle = particle.color;
    ctx.globalAlpha = particle.life;
    ctx.beginPath();
    ctx.arc(
      particle.x * game.cellSize,
      particle.y * game.cellSize,
      game.cellSize * 0.12,
      0,
      Math.PI * 2
    );
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  drawFood();
  drawSnake();
  drawParticles();
}

function gameLoop(timestamp) {
  if (!game.running || game.paused) return;
  const delta = timestamp - game.lastTime;
  game.lastTime = timestamp;
  updateEffects(delta);
  updateParticles(delta);
  game.accumulator += delta;

  const step = 1000 / game.speed;
  while (game.accumulator >= step) {
    game.accumulator -= step;
    const alive = updateSnake();
    if (!alive) {
      if (game.score > game.highScore) {
        game.highScore = game.score;
        storage.set("highScore", game.highScore);
      }
      updateUI();
      gameOver();
      return;
    }
  }

  render();
  requestAnimationFrame(gameLoop);
}

function applyOptions() {
  storage.set("options", {
    speed: speedRange.value,
    map: mapSize.value,
    skin: snakeSkin.value,
    bg: bgColor.value,
    walls: wallsToggle.checked,
    infinite: infiniteToggle.checked,
    difficulty: difficultySelect.value,
  });
}

function loadOptions() {
  const saved = storage.get("options", null);
  if (!saved) return;
  speedRange.value = saved.speed ?? speedRange.value;
  mapSize.value = saved.map ?? mapSize.value;
  snakeSkin.value = saved.skin ?? snakeSkin.value;
  bgColor.value = saved.bg ?? bgColor.value;
  wallsToggle.checked = saved.walls ?? wallsToggle.checked;
  infiniteToggle.checked = saved.infinite ?? infiniteToggle.checked;
  difficultySelect.value = saved.difficulty ?? difficultySelect.value;
}

startBtn.addEventListener("click", startGame);
optionsBtn.addEventListener("click", () => toggleOverlay(optionsOverlay, true));
closeOptions.addEventListener("click", () => toggleOverlay(optionsOverlay, false));
saveOptions.addEventListener("click", () => {
  applyOptions();
  toggleOverlay(optionsOverlay, false);
});
resumeBtn.addEventListener("click", resumeGame);
restartBtn.addEventListener("click", startGame);
playAgainBtn.addEventListener("click", startGame);
backToMenuBtn.addEventListener("click", () => {
  toggleOverlay(gameOverOverlay, false);
  toggleOverlay(menuOverlay, true);
});

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("theme-light");
  document.body.classList.toggle("theme-dark");
});

soundToggle.addEventListener("click", () => {
  audio.enabled = !audio.enabled;
  storage.set("sound", audio.enabled);
  soundToggle.textContent = audio.enabled ? "🔊" : "🔈";
});

mobileButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const dir = button.dataset.dir;
    if (dir === "up") updateDirection({ x: 0, y: -1 });
    if (dir === "down") updateDirection({ x: 0, y: 1 });
    if (dir === "left") updateDirection({ x: -1, y: 0 });
    if (dir === "right") updateDirection({ x: 1, y: 0 });
  });
});

window.addEventListener("keydown", handleInput);
window.addEventListener("resize", resizeCanvas);

loadOptions();
initGame();
updateUI();
