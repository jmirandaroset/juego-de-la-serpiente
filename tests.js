const testResults = document.getElementById("testResults");
const testSummary = document.getElementById("testSummary");

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function logResult(name, status, detail = "") {
  const item = document.createElement("div");
  item.className = `test-item ${status}`;
  item.innerHTML = `<span>${name}</span><strong>${status.toUpperCase()}</strong>`;
  if (detail) {
    item.title = detail;
  }
  testResults.appendChild(item);
}

test("Inicializa el juego con serpiente y comida", () => {
  initGame();
  assert(game.snake.length >= 2, "La serpiente debe tener al menos 2 segmentos");
  assert(game.food, "Debe existir comida");
});

test("La comida no aparece sobre la serpiente", () => {
  const overlap = game.snake.some(
    (segment) => segment.x === game.food.position.x && segment.y === game.food.position.y
  );
  assert(!overlap, "La comida no debe coincidir con un segmento");
});

test("El movimiento actualiza la cabeza", () => {
  game.settings.walls = true;
  game.snake = [{ x: 5, y: 5 }, { x: 4, y: 5 }];
  game.direction = { x: 1, y: 0 };
  game.nextDirection = { x: 1, y: 0 };
  game.food = { position: { x: 0, y: 0 }, type: "normal", score: 10, growth: 1 };
  const previousHead = { ...game.snake[0] };
  const alive = updateSnake();
  assert(alive, "La serpiente debe seguir viva en un movimiento válido");
  assert(game.snake[0].x === previousHead.x + 1, "La cabeza debe avanzar en X");
});

test("Detecta colisión con pared cuando las paredes están activas", () => {
  game.settings.walls = true;
  game.snake = [{ x: game.cells - 1, y: 0 }];
  game.direction = { x: 1, y: 0 };
  game.nextDirection = { x: 1, y: 0 };
  game.food = { position: { x: 0, y: 0 }, type: "normal", score: 10, growth: 1 };
  const alive = updateSnake();
  assert(!alive, "Debe perder al chocar con pared activa");
});

(function runTests() {
  let passed = 0;
  tests.forEach((item) => {
    try {
      item.fn();
      logResult(item.name, "pass");
      passed += 1;
    } catch (error) {
      logResult(item.name, "fail", error.message);
    }
  });

  testSummary.textContent = `${passed} / ${tests.length} pruebas superadas.`;
})();
