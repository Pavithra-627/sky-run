const game = document.getElementById("game");
const road = document.getElementById("road");
const player = document.getElementById("player");

const scoreText = document.getElementById("score");
const coinsText = document.getElementById("coins");
const finalScoreText = document.getElementById("final-score");
const finalCoinsText = document.getElementById("final-coins");

const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over-screen");
const startButton = document.getElementById("start-button");
const restartButton = document.getElementById("restart-button");

let lane = 1;
let score = 0;
let coins = 0;
let speed = 4.5;
let playing = false;
let jumping = false;
let touchStartX = 0;
let touchStartY = 0;

const lanes = ["30%", "50%", "70%"];

function updatePlayerPosition() {
  player.style.left = lanes[lane];
}

function updateScore() {
  scoreText.textContent = score;
  coinsText.textContent = coins;
}

function startGame() {
  document.querySelectorAll(".obstacle, .coin").forEach(function (item) {
    item.remove();
  });

  lane = 1;
  score = 0;
  coins = 0;
  speed = 4.5;
  playing = true;
  jumping = false;

  updatePlayerPosition();
  updateScore();

  player.style.bottom = "13%";
  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
}

function moveLeft() {
  if (!playing || lane === 0) return;

  lane--;
  updatePlayerPosition();
}

function moveRight() {
  if (!playing || lane === 2) return;

  lane++;
  updatePlayerPosition();
}

function jump() {
  if (!playing || jumping) return;

  jumping = true;
  player.style.bottom = "31%";

  setTimeout(function () {
    player.style.bottom = "13%";
    jumping = false;
  }, 430);
}

function gameOver() {
  if (!playing) return;

  playing = false;
  finalScoreText.textContent = score;
  finalCoinsText.textContent = coins;
  gameOverScreen.classList.remove("hidden");
}

function createObstacle() {
  if (!playing) return;

  const obstacle = document.createElement("div");
  const obstacleLane = Math.floor(Math.random() * 3);

  obstacle.className = "obstacle";
  obstacle.textContent = "DANGER";
  obstacle.style.left = `calc(${lanes[obstacleLane]} - 29px)`;
  obstacle.style.top = "-55px";

  road.appendChild(obstacle);

  let position = -55;

  const moveObstacle = setInterval(function () {
    if (!playing) {
      clearInterval(moveObstacle);
      obstacle.remove();
      return;
    }

    position += speed;
    obstacle.style.top = position + "px";

    const playerZoneStart = road.clientHeight * 0.70;
    const playerZoneEnd = road.clientHeight * 0.88;

    if (
      position > playerZoneStart &&
      position < playerZoneEnd &&
      obstacleLane === lane &&
      !jumping
    ) {
      clearInterval(moveObstacle);
      obstacle.remove();
      gameOver();
      return;
    }

    if (position > road.clientHeight) {
      clearInterval(moveObstacle);
      obstacle.remove();
      score += 10;
      updateScore();
    }
  }, 20);
}

function createCoin() {
  if (!playing) return;

  const coin = document.createElement("div");
  const coinLane = Math.floor(Math.random() * 3);

  coin.className = "coin";
  coin.style.left = `calc(${lanes[coinLane]} - 13px)`;
  coin.style.top = "-30px";

  road.appendChild(coin);

  let position = -30;

  const moveCoin = setInterval(function () {
    if (!playing) {
      clearInterval(moveCoin);
      coin.remove();
      return;
    }

    position += speed;
    coin.style.top = position + "px";

    const playerZoneStart = road.clientHeight * 0.70;
    const playerZoneEnd = road.clientHeight * 0.88;

    if (
      position > playerZoneStart &&
      position < playerZoneEnd &&
      coinLane === lane
    ) {
      clearInterval(moveCoin);
      coin.remove();

      coins++;
      score += 25;
      updateScore();
      return;
    }

    if (position > road.clientHeight) {
      clearInterval(moveCoin);
      coin.remove();
    }
  }, 20);
}

function increaseScore() {
  if (!playing) return;

  score++;
  speed += 0.012;
  updateScore();
}

document.addEventListener("keydown", function (event) {
  if (event.key === "ArrowLeft") moveLeft();

  if (event.key === "ArrowRight") moveRight();

  if (event.code === "Space") {
    event.preventDefault();
    jump();
  }
});

game.addEventListener("touchstart", function (event) {
  const touch = event.changedTouches[0];

  touchStartX = touch.screenX;
  touchStartY = touch.screenY;
}, { passive: true });

game.addEventListener("touchend", function (event) {
  if (!playing) return;

  const touch = event.changedTouches[0];
  const moveX = touch.screenX - touchStartX;
  const moveY = touch.screenY - touchStartY;

  const minimumSwipe = 35;

  if (Math.abs(moveX) > Math.abs(moveY)) {
    if (moveX > minimumSwipe) moveRight();
    if (moveX < -minimumSwipe) moveLeft();
  } else {
    if (moveY < -minimumSwipe) jump();
  }
}, { passive: true });

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);

setInterval(function () {
  if (playing) createObstacle();
}, 1250);

setInterval(function () {
  if (playing) createCoin();
}, 850);

setInterval(increaseScore, 500);

updatePlayerPosition();
