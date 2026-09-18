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
let playerRoot;
let leftArm;
let rightArm;
let leftLeg;
let rightLeg;
let runnerMeshes = [];

let playing = false;
let paused = false;
let jumping = false;
let selectedRunner = "male";

let lane = 1;
let targetX = 0;

let score = 0;
let coinCount = 0;
let distance = 0;
let frames = 0;
let gameSpeed = 0.26;

let coins = [];
let obstacles = [];
let movingRoad = [];

let coinTimer = 0;
let obstacleTimer = 0;

let touchStartX = 0;
let touchStartY = 0;

let bestScore = Number(localStorage.getItem("skyRunBestScore")) || 0;

const lanePositions = [-3, 0, 3];

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

  scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
  scene.fogDensity = 0.014;
  scene.fogColor = new BABYLON.Color3(0.04, 0.01, 0.16);

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
  camera.fov = 0.9;

  const light = new BABYLON.HemisphericLight(
    "light",
    new BABYLON.Vector3(0, 1, 0),
    scene
  );

  light.intensity = 1;

  createRoad();
  createPlayer();

  camera.lockedTarget = playerRoot;

  return scene;
}

function createRoad() {
  const roadMaterial = makeMaterial(
    "roadMaterial",
    new BABYLON.Color3(0.04, 0.08, 0.22)
  );

  const railMaterial = makeMaterial(
    "railMaterial",
    new BABYLON.Color3(0, 0.9, 1)
  );

  const laneMaterial = makeMaterial(
    "laneMaterial",
    new BABYLON.Color3(1, 0.05, 0.65)
  );

  for (let i = 0; i < 12; i++) {
    const z = i * 10 - 10;

    const road = BABYLON.MeshBuilder.CreateBox(
      "road" + i,
      { width: 10, height: 0.25, depth: 10 },
      scene
    );

    road.position = new BABYLON.Vector3(0, 0, z);
    road.material = roadMaterial;
    movingRoad.push(road);

    [-5, 5].forEach(function (x, side) {
      const rail = BABYLON.MeshBuilder.CreateBox(
        "rail" + i + side,
        { width: 0.15, height: 0.2, depth: 10 },
        scene
      );

      rail.position = new BABYLON.Vector3(x, 0.2, z);
      rail.material = railMaterial;
      movingRoad.push(rail);
    });

    [-1.5, 1.5].forEach(function (x, laneNumber) {
      const laneLine = BABYLON.MeshBuilder.CreateBox(
        "laneLine" + i + laneNumber,
        { width: 0.08, height: 0.05, depth: 10 },
        scene
      );

      laneLine.position = new BABYLON.Vector3(x, 0.16, z);
      laneLine.material = laneMaterial;
      movingRoad.push(laneLine);
    });
  }
}

function clearPlayer() {
  runnerMeshes.forEach(function (mesh) {
    mesh.dispose();
  });

  runnerMeshes = [];

  if (playerRoot) {
    playerRoot.dispose();
  }
}

function addRunnerMesh(mesh) {
  mesh.parent = playerRoot;
  runnerMeshes.push(mesh);
  return mesh;
}

function createPlayer() {
  clearPlayer();

  playerRoot = new BABYLON.TransformNode("playerRoot", scene);
  playerRoot.position = new BABYLON.Vector3(0, 0.75, 0);

  const female = selectedRunner === "female";

  const suitColor = female
    ? new BABYLON.Color3(1, 0.05, 0.65)
    : new BABYLON.Color3(0, 0.78, 1);

  const darkSuitColor = female
    ? new BABYLON.Color3(0.35, 0.02, 0.32)
    : new BABYLON.Color3(0.02, 0.18, 0.40);

  const suitMaterial = makeMaterial(
    "suit" + selectedRunner,
    darkSuitColor
  );

  const glowMaterial = makeMaterial(
    "glow" + selectedRunner,
    suitColor
  );

  const shoeMaterial = makeMaterial(
    "shoes" + selectedRunner,
    suitColor
  );

  const body = addRunnerMesh(
    BABYLON.MeshBuilder.CreateCapsule(
      "body",
      { height: 1.25, radius: female ? 0.24 : 0.31 },
      scene
    )
  );

  body.position.y = 1.2;
  body.material = suitMaterial;

  const head = addRunnerMesh(
    BABYLON.MeshBuilder.CreateSphere(
      "head",
      { diameter: female ? 0.48 : 0.55 },
      scene
    )
  );

  head.position.y = 2.05;
  head.material = glowMaterial;

  leftArm = addRunnerMesh(
    BABYLON.MeshBuilder.CreateCapsule(
      "leftArm",
      { height: 0.92, radius: 0.10 },
      scene
    )
  );

  leftArm.position = new BABYLON.Vector3(
    female ? -0.36 : -0.45,
    1.40,
    0
  );

  leftArm.material = suitMaterial;

  rightArm = addRunnerMesh(
    BABYLON.MeshBuilder.CreateCapsule(
      "rightArm",
      { height: 0.92, radius: 0.10 },
      scene
    )
  );

  rightArm.position = new BABYLON.Vector3(
    female ? 0.36 : 0.45,
    1.40,
    0
  );

  rightArm.material = suitMaterial;

  leftLeg = addRunnerMesh(
    BABYLON.MeshBuilder.CreateCapsule(
      "leftLeg",
      { height: 1.1, radius: 0.13 },
      scene
    )
  );

  leftLeg.position = new BABYLON.Vector3(
    female ? -0.16 : -0.21,
    0.32,
    0
  );

  leftLeg.material = shoeMaterial;

  rightLeg = addRunnerMesh(
    BABYLON.MeshBuilder.CreateCapsule(
      "rightLeg",
      { height: 1.1, radius: 0.13 },
      scene
    )
  );

  rightLeg.position = new BABYLON.Vector3(
    female ? 0.16 : 0.21,
    0.32,
    0
  );

  rightLeg.material = shoeMaterial;

  if (female) {
    const ponytail = addRunnerMesh(
      BABYLON.MeshBuilder.CreateSphere(
        "ponytail",
        { diameter: 0.28 },
        scene
      )
    );

    ponytail.position = new BABYLON.Vector3(0, 2.05, -0.35);
    ponytail.material = suitMaterial;
  }

  const groundGlow = addRunnerMesh(
    BABYLON.MeshBuilder.CreateDisc(
      "runnerGlow",
      { radius: 0.8, tessellation: 24 },
      scene
    )
  );

  groundGlow.position.y = -0.72;
  groundGlow.rotation.x = Math.PI / 2;
  groundGlow.material = glowMaterial;
}

function createCoinLine() {
  const coinLane = Math.floor(Math.random() * 3);

  const coinMaterial = makeMaterial(
    "coinMaterial" + Date.now(),
    new BABYLON.Color3(1, 0.72, 0)
  );

  for (let i = 0; i < 9; i++) {
    const coin = BABYLON.MeshBuilder.CreateCylinder(
      "coin",
      { height: 0.13, diameter: 0.56, tessellation: 18 },
      scene
    );

    coin.position = new BABYLON.Vector3(
      lanePositions[coinLane],
      1.1,
      30 + i * 2.2
    );

    coin.rotation.x = Math.PI / 2;
    coin.material = coinMaterial;

    coins.push({
      mesh: coin,
      lane: coinLane
    });
  }
}

function createBarrier() {
  const barrierLane = Math.floor(Math.random() * 3);

  const material = makeMaterial(
    "barrierMaterial" + Date.now(),
    new BABYLON.Color3(1, 0.04, 0.08)
  );

  const barrier = BABYLON.MeshBuilder.CreateBox(
    "barrier",
    { width: 1.8, height: 1.1, depth: 0.45 },
    scene
  );

  barrier.position = new BABYLON.Vector3(
    lanePositions[barrierLane],
    0.65,
    42
  );

  barrier.material = material;

  obstacles.push({
    mesh: barrier,
    lane: barrierLane
  });
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
  if (!playing || paused || jumping) return;

  jumping = true;

  BABYLON.Animation.CreateAndStartAnimation(
    "jumpUp",
    playerRoot,
    "position.y",
    60,
    14,
    0.75,
    2.3,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );

  setTimeout(function () {
    BABYLON.Animation.CreateAndStartAnimation(
      "jumpDown",
      playerRoot,
      "position.y",
      60,
      14,
      2.3,
      0.75,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    setTimeout(function () {
      jumping = false;
    }, 250);
  }, 230);
}

function startGame() {
  coins.forEach(function (item) {
    item.mesh.dispose();
  });

  obstacles.forEach(function (item) {
    item.mesh.dispose();
  });

  coins = [];
  obstacles = [];

  playing = true;
  paused = false;
  jumping = false;

  lane = 1;
  targetX = 0;

  score = 0;
  coinCount = 0;
  distance = 0;
  frames = 0;
  gameSpeed = 0.26;
  coinTimer = 0;
  obstacleTimer = 0;

  playerRoot.position.x = 0;
  playerRoot.position.y = 0.75;

  scoreText.textContent = "0";
  coinsText.textContent = "0";
  distanceText.textContent = "0m";

  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  pauseScreen.classList.add("hidden");
}

function endGame() {
  if (!playing) return;

  playing = false;
  paused = false;

  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem("skyRunBestScore", bestScore);
    bestScoreText.textContent = bestScore;
  }

  finalScoreText.textContent = score;
  gameOverScreen.classList.remove("hidden");
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

function updateRunningAnimation() {
  const run = Math.sin(frames * 0.28) * 0.70;

  leftArm.rotation.x = run;
  rightArm.rotation.x = -run;

  leftLeg.rotation.x = -run;
  rightLeg.rotation.x = run;

  if (!jumping) {
    playerRoot.position.y =
      0.75 + Math.abs(Math.sin(frames * 0.56)) * 0.03;
  }
}

function updateGame() {
  if (!playing || paused) return;

  frames++;

  playerRoot.position.x +=
    (targetX - playerRoot.position.x) * 0.16;

  playerRoot.rotation.z =
    (targetX - playerRoot.position.x) * -0.12;

  updateRunningAnimation();

  score++;
  distance += 0.1;

  scoreText.textContent = score;
  distanceText.textContent = Math.floor(distance) + "m";

  coinTimer++;
  obstacleTimer++;

  if (coinTimer > 70) {
    createCoinLine();
    coinTimer = 0;
  }

  /* Barriers only begin after a safe start period. */
  if (frames > 260 && obstacleTimer > 180) {
    createBarrier();
    obstacleTimer = 0;
  }

  movingRoad.forEach(function (item) {
    item.position.z -= gameSpeed;

    if (item.position.z < -16) {
      item.position.z += 120;
    }
  });

  coins.forEach(function (item, index) {
    item.mesh.position.z -= gameSpeed;
    item.mesh.rotation.z += 0.12;

    const collectCoin =
      item.mesh.position.z < 1.4 &&
      item.mesh.position.z > -1.2 &&
      item.lane === lane;

    if (collectCoin) {
      coinCount++;
      score += 10;

      coinsText.textContent = coinCount;
      scoreText.textContent = score;

      item.mesh.dispose();
      coins.splice(index, 1);
    }

    if (item.mesh.position.z < -12) {
      item.mesh.dispose();
      coins.splice(index, 1);
    }
  });

  obstacles.forEach(function (item, index) {
    item.mesh.position.z -= gameSpeed;

    const hitBarrier =
      item.mesh.position.z < 1.15 &&
      item.mesh.position.z > -1.15 &&
      item.lane === lane &&
      !jumping;

    if (hitBarrier) {
      endGame();
    }

    if (item.mesh.position.z < -12) {
      item.mesh.dispose();
      obstacles.splice(index, 1);
    }
  });
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

maleButton.addEventListener("click", selectMale);
femaleButton.addEventListener("click", selectFemale);

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);

pauseButton.addEventListener("click", pauseGame);
resumeButton.addEventListener("click", resumeGame);

document.addEventListener("keydown", function (event) {
  if (event.key === "ArrowLeft") moveLeft();

  if (event.key === "ArrowRight") moveRight();

  if (event.code === "Space") {
    event.preventDefault();
    jump();
  }
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
