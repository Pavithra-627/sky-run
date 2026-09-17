const road = document.getElementById("road");
const player = document.getElementById("player");
const scoreText = document.getElementById("score");
const coinsText = document.getElementById("coins");
const distanceText = document.getElementById("distance");
const gameOverBox = document.getElementById("game-over");
const finalScoreText = document.getElementById("final-score");

let lane = 1;
let score = 0;
let coins = 0;
let distance = 0;
let speed = 5;
let playing = true;
let jumping = false;

const lanePositions = ["16.5%", "50%", "83.5%"];

function movePlayer() {
  player.style.left = lanePositions[lane];
}

document.addEventListener("keydown", function (event) {
  if (!playing) return;

  if (event.key === "ArrowLeft" && lane > 0) {
    lane--;
    movePlayer();
  }

  if (event.key === "ArrowRight" && lane < 2) {
    lane++;
    movePlayer();
  }

  if (event.code === "Space") {
    event.preventDefault();
    jump();
  }
});

function jump() {
  if (jumping || !playing) return;

  jumping = true;
  player.style.bottom = "180px";

  setTimeout(function () {
    player.style.bottom = "70px";
    jumping = false;
  }, 500);
}

function createObstacle() {
  if (!playing) return;

  const obstacle = document.createElement("div");
  obstacle.className = "obstacle";
  obstacle.textContent = "DANGER";

  const obstacleLane = Math.floor(Math.random() * 3);

  obstacle.style.left = `calc(${lanePositions[obstacleLane]} - 47px)`;
  obstacle.style.top = "-70px";

  road.appendChild(obstacle);

  let top = -70;

  const movement = setInterval(function () {
    if (!playing) {
      clearInterval(movement);
      obstacle.remove();
      return;
    }

    top += speed;
    obstacle.style.top = top + "px";

    const nearPlayer =
      top > window.innerHeight - 170 &&
      top < window.innerHeight - 50;

    if (nearPlayer && obstacleLane === lane && !jumping) {
      clearInterval(movement);
      endGame();
      return;
    }

    if (top > window.innerHeight) {
      clearInterval(movement);
      obstacle.remove();
      score += 10;
      updateHud();
    }
  }, 20);
}

function createCoin() {
  if (!playing) return;

  const coin = document.createElement("div");
  coin.className = "coin";

  const coinLane = Math.floor(Math.random() * 3);

  coin.style.left = `calc(${lanePositions[coinLane]} - 17px)`;
  coin.style.top = "-40px";

  road.appendChild(coin);

  let top = -40;

  const movement = setInterval(function () {
    if (!playing) {
      clearInterval(movement);
      coin.remove();
      return;
    }

    top += speed;
    coin.style.top = top + "px";

    const nearPlayer =
      top > window.innerHeight - 170 &&
      top < window.innerHeight - 50;

    if (nearPlayer && coinLane === lane) {
      coins++;
      score += 25;
      updateHud();
      clearInterval(movement);
      coin.remove();
      return;
    }

    if (top > window.innerHeight) {
      clearInterval(movement);
      coin.remove();
    }
  }, 20);
}

function updateHud() {
  scoreText.textContent = score;
  coinsText.textContent = coins;
  distanceText.textContent = distance;
}

function updateGame() {
  if (!playing) return;

  distance++;
  score++;
  speed += 0.01;

  updateHud();
}

function endGame() {
  playing = false;
  finalScoreText.textContent = score;
  gameOverBox.classList.remove("hidden");
}

function restartGame() {
  window.location.reload();
}

setInterval(createObstacle, 1300);
setInterval(createCoin, 900);
setInterval(updateGame, 500);

movePlayer();
