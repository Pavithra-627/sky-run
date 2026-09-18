const canvas = document.getElementById("gameCanvas");

const scoreText = document.getElementById("score");
const coinsText = document.getElementById("coins");
const distanceText = document.getElementById("distance");
const bestScoreText = document.getElementById("best-score");
const finalScoreText = document.getElementById("final-score");

const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over-screen");
const pauseScreen = document.getElementById("pause-screen");

const startButton = document.getElementById("start-button");
const restartButton = document.getElementById("restart-button");
const pauseButton = document.getElementById("pause-button");
const resumeButton = document.getElementById("resume-button");

const maleButton = document.getElementById("male-button");
const femaleButton = document.getElementById("female-button");

const engine = new BABYLON.Engine(canvas, true);

let scene;
let player;
let playing = false;
let paused = false;
let selectedRunner = "male";

let lane = 1;
let targetX = 0;
let score = 0;
let coins = 0;
let distance = 0;

const lanePositions = [-3, 0, 3];

let touchStartX = 0;
let touchStartY = 0;

let bestScore = Number(localStorage.getItem("skyRunBestScore")) || 0;

bestScoreText.textContent = bestScore;

function makeMaterial(name, color) {
  const material = new BABYLON.StandardMaterial(name, scene);

  material.diffuseColor = color;
  material.emissiveColor = color;
  material.specularColor = BABYLON.Color3.Black();

  return material;
}

function createScene() {
  scene = new BABYLON.Scene(engine);

  scene.clearColor = new BABYLON.Color4(0.03, 0.01, 0.12, 1);

  const camera = new BABYLON.FollowCamera(
    "camera",
    new BABYLON.Vector3(0, 5, -12),
    scene
  );

  camera.radius = 12;
  camera.heightOffset = 4;
  camera.rotationOffset = 180;
  camera.cameraAcceleration = 0.1;
  camera.maxCameraSpeed = 7;

  const light = new BABYLON.HemisphericLight(
    "light",
    new BABYLON.Vector3(0, 1, 0),
    scene
  );

  light.intensity = 1;

  const roadMaterial = makeMaterial(
    "roadMaterial",
    new BABYLON.Color3(0.04, 0.08, 0.22)
  );

  const railMaterial = makeMaterial(
    "railMaterial",
    new BABYLON.Color3(0, 0.9, 1)
  );

  for (let i = 0; i < 10; i++) {
    const z = i * 10 - 10;

    const road = BABYLON.MeshBuilder.CreateBox(
      "road" + i,
      { width: 10, height: 0.25, depth: 10 },
      scene
    );

    road.position = new BABYLON.Vector3(0, 0, z);
    road.material = roadMaterial;

    const leftRail = BABYLON.MeshBuilder.CreateBox(
      "leftRail" + i,
      { width: 0.15, height: 0.2, depth: 10 },
      scene
    );

    leftRail.position = new BABYLON.Vector3(-5, 0.2, z);
    leftRail.material = railMaterial;

    const rightRail = BABYLON.MeshBuilder.CreateBox(
      "rightRail" + i,
      { width: 0.15, height: 0.2, depth: 10 },
      scene
    );

    rightRail.position = new BABYLON.Vector3(5, 0.2, z);
    rightRail.material = railMaterial;
  }

  createPlayer();

  camera.lockedTarget = player;

  return scene;
}

function createPlayer() {
  if (player) {
    player.dispose();
  }

  const color =
    selectedRunner === "female"
      ? new BABYLON.Color3(1, 0.05, 0.65)
      : new BABYLON.Color3(0, 0.8, 1);

  const material = makeMaterial("playerMaterial", color);

  player = BABYLON.MeshBuilder.CreateCapsule(
    "player",
    { height: 2.2, radius: 0.38 },
    scene
  );

  player.position = new BABYLON.Vector3(0, 1.1, 0);
  player.material = material;
}

function selectMale() {
  if (playing) return;

  selectedRunner = "male";

  maleButton.classList.add("selected");
  femaleButton.classList.remove("selected");

  createPlayer();
}

function selectFemale() {
  if (playing) return;

  selectedRunner = "female";

  femaleButton.classList.add("selected");
  maleButton.classList.remove("selected");

  createPlayer();
}

function startGame() {
  playing = true;
  paused = false;

  score = 0;
  coins = 0;
  distance = 0;
  lane = 1;
  targetX = 0;

  player.position.x = 0;

  scoreText.textContent = "0";
  coinsText.textContent = "0";
  distanceText.textContent = "0m";

  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  pauseScreen.classList.add("hidden");
}

function pauseGame() {
  if (!playing || paused) return;

  paused = true;
  pauseScreen.classList.remove("hidden");
}

function resumeGame() {
  if (!playing) return;

  paused = false;
  pauseScreen.classList.add("hidden");
}

function moveLeft() {
  if (!playing || paused || lane === 0) return;

  lane--;
  targetX = lanePositions[lane];
}

function moveRight() {
  if (!playing || paused || lane === 2) return;

  lane++;
  targetX = lanePositions[lane];
}

function jump() {
  if (!playing || paused) return;

  BABYLON.Animation.CreateAndStartAnimation(
    "jump",
    player,
    "position.y",
    60,
    20,
    1.1,
    2.8,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );

  setTimeout(function () {
    BABYLON.Animation.CreateAndStartAnimation(
      "land",
      player,
      "position.y",
      60,
      20,
      2.8,
      1.1,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
  }, 300);
}

function updateGame() {
  if (!playing || paused) return;

  player.position.x += (targetX - player.position.x) * 0.15;

  score++;
  distance += 0.1;

  scoreText.textContent = score;
  distanceText.textContent = Math.floor(distance) + "m";
}

maleButton.addEventListener("click", selectMale);
femaleButton.addEventListener("click", selectFemale);

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);

pauseButton.addEventListener("click", pauseGame);
resumeButton.addEventListener("click", resumeGame);

document.addEventListener("keydown", function (event) {
  if (event.key === "ArrowLeft") moveLeft();

  if (event.key === "ArrowRight") moveRight();

  if (event.code === "Space") jump();
});

canvas.addEventListener(
  "touchstart",
  function (event) {
    const touch = event.changedTouches[0];

    touchStartX = touch.screenX;
    touchStartY = touch.screenY;
  },
  { passive: true }
);

canvas.addEventListener(
  "touchend",
  function (event) {
    if (!playing || paused) return;

    const touch = event.changedTouches[0];

    const moveX = touch.screenX - touchStartX;
    const moveY = touch.screenY - touchStartY;

    if (Math.abs(moveX) > Math.abs(moveY)) {
      if (moveX > 35) moveRight();

      if (moveX < -35) moveLeft();
    } else if (moveY < -35) {
      jump();
    }
  },
  { passive: true }
);

scene = createScene();

engine.runRenderLoop(function () {
  updateGame();
  scene.render();
});

window.addEventListener("resize", function () {
  engine.resize();
});
