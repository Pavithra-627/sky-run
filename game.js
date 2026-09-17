const canvas = document.getElementById("gameCanvas");

const scoreText = document.getElementById("score");
const distanceText = document.getElementById("distance");
const finalScoreText = document.getElementById("final-score");

const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over-screen");
const startButton = document.getElementById("start-button");
const restartButton = document.getElementById("restart-button");

const engine = new BABYLON.Engine(canvas, true, {
  preserveDrawingBuffer: true,
  stencil: true
});

let scene;
let playerRoot;
let playing = false;
let jumping = false;

let lane = 1;
let targetX = 0;

let score = 0;
let distance = 0;
let gameSpeed = 0.45;

let obstacles = [];
let coins = [];
let roadPieces = [];

let obstacleTimer = 0;
let coinTimer = 0;

let touchStartX = 0;
let touchStartY = 0;

const lanePositions = [-3, 0, 3];

function createMaterial(name, color, glowColor) {
  const material = new BABYLON.StandardMaterial(name, scene);

  material.diffuseColor = color;
  material.emissiveColor = glowColor || color;
  material.specularColor = BABYLON.Color3.Black();

  return material;
}

function createScene() {
  scene = new BABYLON.Scene(engine);

  scene.clearColor = new BABYLON.Color4(0.025, 0.02, 0.11, 1);

  scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
  scene.fogDensity = 0.018;
  scene.fogColor = new BABYLON.Color3(0.05, 0.02, 0.18);

  const camera = new BABYLON.FollowCamera(
    "followCamera",
    new BABYLON.Vector3(0, 5, -11),
    scene
  );

  camera.radius = 12;
  camera.heightOffset = 4.2;
  camera.rotationOffset = 180;
  camera.cameraAcceleration = 0.08;
  camera.maxCameraSpeed = 7;
  camera.fov = 0.9;

  const hemisphericLight = new BABYLON.HemisphericLight(
    "hemisphericLight",
    new BABYLON.Vector3(0, 1, 0),
    scene
  );

  hemisphericLight.intensity = 0.7;
  hemisphericLight.diffuse = new BABYLON.Color3(0.35, 0.25, 0.75);
  hemisphericLight.groundColor = new BABYLON.Color3(0.03, 0.04, 0.15);

  const neonLight = new BABYLON.PointLight(
    "neonLight",
    new BABYLON.Vector3(0, 6, -3),
    scene
  );

  neonLight.diffuse = new BABYLON.Color3(0.0, 0.9, 1.0);
  neonLight.intensity = 1.4;
  neonLight.range = 28;

  const pinkLight = new BABYLON.PointLight(
    "pinkLight",
    new BABYLON.Vector3(0, 8, 14),
    scene
  );

  pinkLight.diffuse = new BABYLON.Color3(1.0, 0.05, 0.65);
  pinkLight.intensity = 1.1;
  pinkLight.range = 30;

  createSky();
  createRoad();
  createPlayer();
  createCity();

  camera.lockedTarget = playerRoot;

  return scene;
}

function createSky() {
  const sky = BABYLON.MeshBuilder.CreateSphere(
    "sky",
    { diameter: 180, sideOrientation: BABYLON.Mesh.BACKSIDE },
    scene
  );

  const material = new BABYLON.StandardMaterial("skyMaterial", scene);
  material.diffuseColor = new BABYLON.Color3(0.03, 0.01, 0.13);
  material.emissiveColor = new BABYLON.Color3(0.06, 0.01, 0.16);
  material.specularColor = BABYLON.Color3.Black();

  sky.material = material;
}

function createRoad() {
  const roadMaterial = createMaterial(
    "roadMaterial",
    new BABYLON.Color3(0.03, 0.07, 0.18),
    new BABYLON.Color3(0.02, 0.07, 0.15)
  );

  const cyanMaterial = createMaterial(
    "cyanMaterial",
    new BABYLON.Color3(0.0, 0.8, 1.0),
    new BABYLON.Color3(0.0, 0.9, 1.0)
  );

  const pinkMaterial = createMaterial(
    "pinkMaterial",
    new BABYLON.Color3(1.0, 0.05, 0.65),
    new BABYLON.Color3(1.0, 0.02, 0.55)
  );

  for (let i = 0; i < 9; i++) {
    const z = i * 12 - 12;

    const road = BABYLON.MeshBuilder.CreateBox(
      "road_" + i,
      { width: 10, height: 0.3, depth: 12 },
      scene
    );

    road.position = new BABYLON.Vector3(0, 0, z);
    road.material = roadMaterial;
    roadPieces.push(road);

    const leftRail = BABYLON.MeshBuilder.CreateBox(
      "leftRail_" + i,
      { width: 0.16, height: 0.25, depth: 12 },
      scene
    );

    leftRail.position = new BABYLON.Vector3(-5, 0.25, z);
    leftRail.material = cyanMaterial;

    const rightRail = BABYLON.MeshBuilder.CreateBox(
      "rightRail_" + i,
      { width: 0.16, height: 0.25, depth: 12 },
      scene
    );

    rightRail.position = new BABYLON.Vector3(5, 0.25, z);
    rightRail.material = cyanMaterial;

    for (let mark = 0; mark < 4; mark++) {
      const lineZ = z - 4 + mark * 3;

      const lineOne = BABYLON.MeshBuilder.CreateBox(
        "lineOne_" + i + "_" + mark,
        { width: 0.08, height: 0.05, depth: 1.3 },
        scene
      );

      lineOne.position = new BABYLON.Vector3(-1.5, 0.2, lineZ);
      lineOne.material = pinkMaterial;

      const lineTwo = BABYLON.MeshBuilder.CreateBox(
        "lineTwo_" + i + "_" + mark,
        { width: 0.08, height: 0.05, depth: 1.3 },
        scene
      );

      lineTwo.position = new BABYLON.Vector3(1.5, 0.2, lineZ);
      lineTwo.material = pinkMaterial;
    }
  }
}

function createPlayer() {
  playerRoot = new BABYLON.TransformNode("playerRoot", scene);
  playerRoot.position = new BABYLON.Vector3(0, 0.7, 0);

  const boardMaterial = createMaterial(
    "boardMaterial",
    new BABYLON.Color3(0.0, 0.65, 1.0),
    new BABYLON.Color3(0.0, 0.9, 1.0)
  );

  const suitMaterial = createMaterial(
    "suitMaterial",
    new BABYLON.Color3(0.15, 0.04, 0.35),
    new BABYLON.Color3(0.35, 0.02, 0.55)
  );

  const helmetMaterial = createMaterial(
    "helmetMaterial",
    new BABYLON.Color3(0.02, 0.35, 0.52),
    new BABYLON.Color3(0.0, 0.75, 1.0)
  );

  const board = BABYLON.MeshBuilder.CreateBox(
    "hoverboard",
    { width: 1.5, height: 0.18, depth: 0.55 },
    scene
  );

  board.parent = playerRoot;
  board.position.y = 0;
  board.material = boardMaterial;

  const body = BABYLON.MeshBuilder.CreateCapsule(
    "body",
    { height: 1.35, radius: 0.28 },
    scene
  );

  body.parent = playerRoot;
  body.position.y = 0.85;
  body.material = suitMaterial;

  const head = BABYLON.MeshBuilder.CreateSphere(
    "head",
    { diameter: 0.52 },
    scene
  );

  head.parent = playerRoot;
  head.position.y = 1.65;
  head.material = helmetMaterial;

  const trail = BABYLON.MeshBuilder.CreateBox(
    "trail",
    { width: 0.7, height: 0.04, depth: 2.5 },
    scene
  );

  trail.parent = playerRoot;
  trail.position = new BABYLON.Vector3(0, -0.1, -1.4);
  trail.material = boardMaterial;
}

function createCity() {
  const buildingMaterials = [
    createMaterial(
      "buildingBlue",
      new BABYLON.Color3(0.03, 0.10, 0.28),
      new BABYLON.Color3(0.02, 0.15, 0.42)
    ),
    createMaterial(
      "buildingPurple",
      new BABYLON.Color3(0.14, 0.03, 0.30),
      new BABYLON.Color3(0.24, 0.02, 0.48)
    ),
    createMaterial(
      "buildingPink",
      new BABYLON.Color3(0.25, 0.02, 0.20),
      new BABYLON.Color3(0.42, 0.01, 0.32)
    )
  ];

  const signMaterial = createMaterial(
    "signMaterial",
    new BABYLON.Color3(0.0, 0.7, 1.0),
    new BABYLON.Color3(0.0, 1.0, 1.0)
  );

  for (let i = 0; i < 40; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const z = 10 + Math.floor(i / 2) * 7;
    const width = 2 + Math.random() * 2.5;
    const height = 5 + Math.random() * 13;

    const building = BABYLON.MeshBuilder.CreateBox(
      "building_" + i,
      { width: width, height: height, depth: 3 + Math.random() * 3 },
      scene
    );

    building.position = new BABYLON.Vector3(
      side * (8 + Math.random() * 5),
      height / 2,
      z
    );

    building.material =
      buildingMaterials[i % buildingMaterials.length];

    if (i % 3 === 0) {
      const sign = BABYLON.MeshBuilder.CreateBox(
        "sign_" + i,
        { width: width * 0.65, height: 0.55, depth: 0.08 },
        scene
      );

      sign.position = new BABYLON.Vector3(
        building.position.x - side * (width / 2 + 0.05),
        building.position.y + height * 0.15,
        building.position.z
      );

      sign.material = signMaterial;
    }
  }
}

function createObstacle() {
  const obstacleLane = Math.floor(Math.random() * 3);

  const barrierMaterial = createMaterial(
    "barrierMaterial_" + Date.now(),
    new BABYLON.Color3(0.7, 0.03, 0.08),
    new BABYLON.Color3(1.0, 0.03, 0.04)
  );

  const barrier = BABYLON.MeshBuilder.CreateBox(
    "dangerBarrier",
    { width: 1.9, height: 1.25, depth: 0.45 },
    scene
  );

  barrier.position = new BABYLON.Vector3(
    lanePositions[obstacleLane],
    0.8,
    45
  );

  barrier.material = barrierMaterial;

  obstacles.push({
    mesh: barrier,
    lane: obstacleLane
  });
}

function createCoin() {
  const coinLane = Math.floor(Math.random() * 3);

  const coinMaterial = createMaterial(
    "coinMaterial_" + Date.now(),
    new BABYLON.Color3(1.0, 0.65, 0.0),
    new BABYLON.Color3(1.0, 0.75, 0.0)
  );

  const coin = BABYLON.MeshBuilder.CreateTorus(
    "energyCoin",
    { diameter: 0.6, thickness: 0.16, tessellation: 16 },
    scene
  );

  coin.position = new BABYLON.Vector3(
    lanePositions[coinLane],
    1.15,
    43
  );

  coin.rotation.x = Math.PI / 2;
  coin.material = coinMaterial;

  coins.push({
    mesh: coin,
    lane: coinLane
  });
}

function moveLeft() {
  if (!playing || lane === 0) return;

  lane--;
  targetX = lanePositions[lane];
}

function moveRight() {
  if (!playing || lane === 2) return;

  lane++;
  targetX = lanePositions[lane];
}

function jump() {
  if (!playing || jumping) return;

  jumping = true;

  BABYLON.Animation.CreateAndStartAnimation(
    "jumpUp",
    playerRoot,
    "position.y",
    60,
    16,
    0.7,
    2.7,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );

  setTimeout(function () {
    BABYLON.Animation.CreateAndStartAnimation(
      "jumpDown",
      playerRoot,
      "position.y",
      60,
      16,
      2.7,
      0.7,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    setTimeout(function () {
      jumping = false;
    }, 280);
  }, 260);
}

function startGame() {
  obstacles.forEach(function (item) {
    item.mesh.dispose();
  });

  coins.forEach(function (item) {
    item.mesh.dispose();
  });

  obstacles = [];
  coins = [];

  lane = 1;
  targetX = 0;
  playerRoot.position.x = 0;
  playerRoot.position.y = 0.7;

  score = 0;
  distance = 0;
  gameSpeed = 0.45;
  obstacleTimer = 0;
  coinTimer = 0;

  playing = true;
  jumping = false;

  scoreText.textContent = "0";
  distanceText.textContent = "0m";

  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
}

function gameOver() {
  if (!playing) return;

  playing = false;
  finalScoreText.textContent = score;
  gameOverScreen.classList.remove("hidden");
}

function updateGame() {
  if (!playing) return;

  playerRoot.position.x +=
    (targetX - playerRoot.position.x) * 0.18;

  playerRoot.rotation.z =
    (targetX - playerRoot.position.x) * -0.12;

  distance += 0.1;
  score += 1;

  scoreText.textContent = score;
  distanceText.textContent = Math.floor(distance) + "m";

  gameSpeed += 0.00018;

  obstacleTimer++;
  coinTimer++;

  if (obstacleTimer > 105) {
    createObstacle();
    obstacleTimer = 0;
  }

  if (coinTimer > 65) {
    createCoin();
    coinTimer = 0;
  }

  roadPieces.forEach(function (road) {
    road.position.z -= gameSpeed;

    if (road.position.z < -18) {
      road.position.z += 108;
    }
  });

  obstacles.forEach(function (item, index) {
    item.mesh.position.z -= gameSpeed;

    if (
      item.mesh.position.z < 1.3 &&
      item.mesh.position.z > -1.3 &&
      item.lane === lane &&
      !jumping
    ) {
      gameOver();
    }

    if (item.mesh.position.z < -12) {
      item.mesh.dispose();
      obstacles.splice(index, 1);
    }
  });

  coins.forEach(function (item, index) {
    item.mesh.position.z -= gameSpeed;
    item.mesh.rotation.z += 0.08;

    if (
      item.mesh.position.z < 1.3 &&
      item.mesh.position.z > -1.3 &&
      item.lane === lane
    ) {
      score += 25;
      item.mesh.dispose();
      coins.splice(index, 1);
    }

    if (item.mesh.position.z < -12) {
      item.mesh.dispose();
      coins.splice(index, 1);
    }
  });
}

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
    if (!playing) return;

    const touch = event.changedTouches[0];

    const moveX = touch.screenX - touchStartX;
    const moveY = touch.screenY - touchStartY;

    const minimumSwipe = 35;

    if (Math.abs(moveX) > Math.abs(moveY)) {
      if (moveX > minimumSwipe) moveRight();

      if (moveX < -minimumSwipe) moveLeft();
    } else if (moveY < -minimumSwipe) {
      jump();
    }
  },
  { passive: true }
);

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);

scene = createScene();

engine.runRenderLoop(function () {
  updateGame();
  scene.render();
});

window.addEventListener("resize", function () {
  engine.resize();
});
