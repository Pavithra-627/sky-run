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
let leftArm;
let rightArm;
let leftLeg;
let rightLeg;

let playing = false;
let jumping = false;
let lane = 1;
let targetX = 0;

let score = 0;
let distance = 0;
let gameSpeed = 0.34;
let elapsedFrames = 0;

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
  scene.fogDensity = 0.016;
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

  const light = new BABYLON.HemisphericLight(
    "light",
    new BABYLON.Vector3(0, 1, 0),
    scene
  );

  light.intensity = 0.85;
  light.diffuse = new BABYLON.Color3(0.45, 0.3, 0.9);
  light.groundColor = new BABYLON.Color3(0.03, 0.04, 0.15);

  const cyanLight = new BABYLON.PointLight(
    "cyanLight",
    new BABYLON.Vector3(0, 6, -3),
    scene
  );

  cyanLight.diffuse = new BABYLON.Color3(0, 0.9, 1);
  cyanLight.intensity = 1.5;
  cyanLight.range = 30;

  const pinkLight = new BABYLON.PointLight(
    "pinkLight",
    new BABYLON.Vector3(0, 8, 18),
    scene
  );

  pinkLight.diffuse = new BABYLON.Color3(1, 0.05, 0.65);
  pinkLight.intensity = 1.2;
  pinkLight.range = 32;

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

  for (let i = 0; i < 10; i++) {
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

      [-1.5, 1.5].forEach(function (x, side) {
        const line = BABYLON.MeshBuilder.CreateBox(
          "line_" + i + "_" + mark + "_" + side,
          { width: 0.08, height: 0.05, depth: 1.3 },
          scene
        );

        line.position = new BABYLON.Vector3(x, 0.2, lineZ);
        line.material = pinkMaterial;
      });
    }
  }
}

function createPlayer() {
  playerRoot = new BABYLON.TransformNode("playerRoot", scene);
  playerRoot.position = new BABYLON.Vector3(0, 0.72, 0);

  const suit = createMaterial(
    "suit",
    new BABYLON.Color3(0.13, 0.03, 0.30),
    new BABYLON.Color3(0.34, 0.01, 0.55)
  );

  const helmet = createMaterial(
    "helmet",
    new BABYLON.Color3(0.02, 0.30, 0.48),
    new BABYLON.Color3(0.0, 0.78, 1.0)
  );

  const shoe = createMaterial(
    "shoe",
    new BABYLON.Color3(0.05, 0.12, 0.22),
    new BABYLON.Color3(0.0, 0.4, 0.85)
  );

  const body = BABYLON.MeshBuilder.CreateCapsule(
    "body",
    { height: 1.3, radius: 0.26 },
    scene
  );

  body.parent = playerRoot;
  body.position.y = 1.15;
  body.material = suit;

  const head = BABYLON.MeshBuilder.CreateSphere(
    "head",
    { diameter: 0.5 },
    scene
  );

  head.parent = playerRoot;
  head.position.y = 2.0;
  head.material = helmet;

  leftArm = BABYLON.MeshBuilder.CreateCapsule(
    "leftArm",
    { height: 0.9, radius: 0.11 },
    scene
  );

  leftArm.parent = playerRoot;
  leftArm.position = new BABYLON.Vector3(-0.38, 1.35, 0);
  leftArm.material = suit;

  rightArm = BABYLON.MeshBuilder.CreateCapsule(
    "rightArm",
    { height: 0.9, radius: 0.11 },
    scene
  );

  rightArm.parent = playerRoot;
  rightArm.position = new BABYLON.Vector3(0.38, 1.35, 0);
  rightArm.material = suit;

  leftLeg = BABYLON.MeshBuilder.CreateCapsule(
    "leftLeg",
    { height: 1.0, radius: 0.13 },
    scene
  );

  leftLeg.parent = playerRoot;
  leftLeg.position = new BABYLON.Vector3(-0.18, 0.35, 0);
  leftLeg.material = shoe;

  rightLeg = BABYLON.MeshBuilder.CreateCapsule(
    "rightLeg",
    { height: 1.0, radius: 0.13 },
    scene
  );

  rightLeg.parent = playerRoot;
  rightLeg.position = new BABYLON.Vector3(0.18, 0.35, 0);
  rightLeg.material = shoe;

  const glow = BABYLON.MeshBuilder.CreateDisc(
    "playerGlow",
    { radius: 0.8, tessellation: 32 },
    scene
  );

  glow.parent = playerRoot;
  glow.position.y = -0.65;
  glow.rotation.x = Math.PI / 2;

  const glowMaterial = createMaterial(
    "glowMaterial",
    new BABYLON.Color3(0.0, 0.8, 1.0),
    new BABYLON.Color3(0.0, 0.9, 1.0)
  );

  glow.material = glowMaterial;
}

function createCity() {
  const buildings = [
    createMaterial(
      "blueBuilding",
      new BABYLON.Color3(0.03, 0.10, 0.28),
      new BABYLON.Color3(0.02, 0.15, 0.42)
    ),
    createMaterial(
      "purpleBuilding",
      new BABYLON.Color3(0.14, 0.03, 0.30),
      new BABYLON.Color3(0.24, 0.02, 0.48)
    ),
    createMaterial(
      "pinkBuilding",
      new BABYLON.Color3(0.25, 0.02, 0.20),
      new BABYLON.Color3(0.42, 0.01, 0.32)
    )
  ];

  for (let i = 0; i < 46; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const z = 9 + Math.floor(i / 2) * 7;
    const width = 2 + Math.random() * 2.5;
    const height = 5 + Math.random() * 14;

    const building = BABYLON.MeshBuilder.CreateBox(
      "building_" + i,
      { width, height, depth: 3 + Math.random() * 3 },
      scene
    );

    building.position = new BABYLON.Vector3(
      side * (8 + Math.random() * 5),
      height / 2,
      z
    );

    building.material = buildings[i % buildings.length];
  }
}

function createObstacle() {
  const obstacleLane = Math.floor(Math.random() * 3);

  const material = createMaterial(
    "barrier_" + Date.now(),
    new BABYLON.Color3(0.7, 0.03, 0.08),
    new BABYLON.Color3(1.0, 0.03, 0.04)
  );

  const barrier = BABYLON.MeshBuilder.CreateBox(
    "dangerBarrier",
    { width: 1.9, height: 1.15, depth: 0.5 },
    scene
  );

  barrier.position = new BABYLON.Vector3(
    lanePositions[obstacleLane],
    0.72,
    46
  );

  barrier.material = material;

  obstacles.push({
    mesh: barrier,
    lane: obstacleLane
  });
}

function createCoinLine() {
  const coinLane = Math.floor(Math.random() * 3);

  const material = createMaterial(
    "coin_" + Date.now(),
    new BABYLON.Color3(1.0, 0.65, 0.0),
    new BABYLON.Color3(1.0, 0.78, 0.0)
  );

  for (let i = 0; i < 6; i++) {
    const coin = BABYLON.MeshBuilder.CreateTorus(
      "energyCoin",
      { diameter: 0.58, thickness: 0.14, tessellation: 16 },
      scene
    );

    coin.position = new BABYLON.Vector3(
      lanePositions[coinLane],
      1.15 + (i % 2) * 0.12,
      42 + i * 2.1
    );

    coin.rotation.x = Math.PI / 2;
    coin.material = material;

    coins.push({
      mesh: coin,
      lane: coinLane
    });
  }
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
    15,
    0.72,
    2.45,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );

  setTimeout(function () {
    BABYLON.Animation.CreateAndStartAnimation(
      "jumpDown",
      playerRoot,
      "position.y",
      60,
      15,
      2.45,
      0.72,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    setTimeout(function () {
      jumping = false;
    }, 270);
  }, 250);
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
  playerRoot.position.y = 0.72;

  score = 0;
  distance = 0;
  gameSpeed = 0.34;
  elapsedFrames = 0;
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

function updateRunningAnimation() {
  const run = Math.sin(elapsedFrames * 0.25) * 0.65;

  leftArm.rotation.x = run;
  rightArm.rotation.x = -run;

  leftLeg.rotation.x = -run;
  rightLeg.rotation.x = run;
}

function updateGame() {
  if (!playing) return;

  elapsedFrames++;

  playerRoot.position.x +=
    (targetX - playerRoot.position.x) * 0.16;

  playerRoot.rotation.z =
    (targetX - playerRoot.position.x) * -0.12;

  updateRunningAnimation();

  distance += 0.09;
  score += 1;

  scoreText.textContent = score;
  distanceText.textContent = Math.floor(distance) + "m";

  gameSpeed += 0.0001;

  obstacleTimer++;
  coinTimer++;

  /* First barriers appear after a short safe starting period. */
  if (elapsedFrames > 220 && obstacleTimer > 170) {
    createObstacle();
    obstacleTimer = 0;
  }

  /* More coin lines appear regularly. */
  if (coinTimer > 90) {
    createCoinLine();
    coinTimer = 0;
  }

  roadPieces.forEach(function (road) {
    road.position.z -= gameSpeed;

    if (road.position.z < -18) {
      road.position.z += 120;
    }
  });

  obstacles.forEach(function (item, index) {
    item.mesh.position.z -= gameSpeed;

    const hitPlayer =
      item.mesh.position.z < 1.25 &&
      item.mesh.position.z > -1.15 &&
      item.lane === lane &&
      !jumping;

    if (hitPlayer) {
      gameOver();
    }

    if (item.mesh.position.z < -12) {
      item.mesh.dispose();
      obstacles.splice(index, 1);
    }
  });

  coins.forEach(function (item, index) {
    item.mesh.position.z -= gameSpeed;
    item.mesh.rotation.z += 0.10;

    const collectCoin =
      item.mesh.position.z < 1.35 &&
      item.mesh.position.z > -1.2 &&
      item.lane === lane;

    if (collectCoin) {
      score += 15;
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
