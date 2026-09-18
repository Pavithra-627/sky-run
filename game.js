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

const shieldStatus = document.getElementById("shield-status");
const magnetStatus = document.getElementById("magnet-status");

const engine = new BABYLON.Engine(canvas, true, {
  preserveDrawingBuffer: true,
  stencil: true
});

let scene;
let playerRoot;
let playerShield;
let leftArm;
let rightArm;
let leftLeg;
let rightLeg;
let runnerParts = [];

let selectedRunner = "male";
let playing = false;
let paused = false;
let jumping = false;

let lane = 1;
let targetX = 0;

let score = 0;
let coinCount = 0;
let distance = 0;
let bestScore = Number(localStorage.getItem("skyRunBestScore")) || 0;

let gameSpeed = 0.28;
let frames = 0;

let shieldActive = false;
let shieldTime = 0;

let magnetActive = false;
let magnetTime = 0;

let obstacles = [];
let coins = [];
let powerups = [];
let movingRoadObjects = [];

let obstacleTimer = 0;
let coinTimer = 0;
let powerupTimer = 0;

let touchStartX = 0;
let touchStartY = 0;

const lanePositions = [-3, 0, 3];

bestScoreText.textContent = bestScore;

function createMaterial(name, color, glowColor) {
  const material = new BABYLON.StandardMaterial(name, scene);

  material.diffuseColor = color;
  material.emissiveColor = glowColor || color;
  material.specularColor = BABYLON.Color3.Black();

  return material;
}

function createScene() {
  scene = new BABYLON.Scene(engine);

  scene.clearColor = new BABYLON.Color4(0.02, 0.01, 0.09, 1);
  scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
  scene.fogDensity = 0.014;
  scene.fogColor = new BABYLON.Color3(0.04, 0.01, 0.16);

  const camera = new BABYLON.FollowCamera(
    "followCamera",
    new BABYLON.Vector3(0, 5, -12),
    scene
  );

  camera.radius = 12;
  camera.heightOffset = 4.1;
  camera.rotationOffset = 180;
  camera.cameraAcceleration = 0.08;
  camera.maxCameraSpeed = 7;
  camera.fov = 0.9;

  const light = new BABYLON.HemisphericLight(
    "skyLight",
    new BABYLON.Vector3(0, 1, 0),
    scene
  );

  light.intensity = 0.85;
  light.diffuse = new BABYLON.Color3(0.5, 0.35, 0.95);
  light.groundColor = new BABYLON.Color3(0.02, 0.03, 0.12);

  const cyanLight = new BABYLON.PointLight(
    "cyanLight",
    new BABYLON.Vector3(0, 6, -5),
    scene
  );

  cyanLight.diffuse = new BABYLON.Color3(0, 0.9, 1);
  cyanLight.intensity = 1.5;
  cyanLight.range = 32;

  const pinkLight = new BABYLON.PointLight(
    "pinkLight",
    new BABYLON.Vector3(0, 8, 20),
    scene
  );

  pinkLight.diffuse = new BABYLON.Color3(1, 0.04, 0.62);
  pinkLight.intensity = 1.3;
  pinkLight.range = 35;

  createSky();
  createRoad();
  createCity();
  createPlayer();

  camera.lockedTarget = playerRoot;

  return scene;
}

function createSky() {
  const sky = BABYLON.MeshBuilder.CreateSphere(
    "sky",
    {
      diameter: 180,
      sideOrientation: BABYLON.Mesh.BACKSIDE
    },
    scene
  );

  const skyMaterial = new BABYLON.StandardMaterial("skyMaterial", scene);

  skyMaterial.diffuseColor = new BABYLON.Color3(0.02, 0.01, 0.10);
  skyMaterial.emissiveColor = new BABYLON.Color3(0.05, 0.01, 0.16);
  skyMaterial.specularColor = BABYLON.Color3.Black();

  sky.material = skyMaterial;
}

function createRoad() {
  const roadMaterial = createMaterial(
    "roadMaterial",
    new BABYLON.Color3(0.025, 0.06, 0.18),
    new BABYLON.Color3(0.01, 0.06, 0.16)
  );

  const railMaterial = createMaterial(
    "railMaterial",
    new BABYLON.Color3(0, 0.75, 1),
    new BABYLON.Color3(0, 0.95, 1)
  );

  const lineMaterial = createMaterial(
    "lineMaterial",
    new BABYLON.Color3(1, 0.05, 0.65),
    new BABYLON.Color3(1, 0.02, 0.60)
  );

  for (let i = 0; i < 12; i++) {
    const z = i * 10 - 10;

    const road = BABYLON.MeshBuilder.CreateBox(
      "road_" + i,
      { width: 10, height: 0.28, depth: 10 },
      scene
    );

    road.position = new BABYLON.Vector3(0, 0, z);
    road.material = roadMaterial;
    movingRoadObjects.push(road);

    const leftRail = BABYLON.MeshBuilder.CreateBox(
      "leftRail_" + i,
      { width: 0.13, height: 0.28, depth: 10 },
      scene
    );

    leftRail.position = new BABYLON.Vector3(-5, 0.26, z);
    leftRail.material = railMaterial;
    movingRoadObjects.push(leftRail);

    const rightRail = BABYLON.MeshBuilder.CreateBox(
      "rightRail_" + i,
      { width: 0.13, height: 0.28, depth: 10 },
      scene
    );

    rightRail.position = new BABYLON.Vector3(5, 0.26, z);
    rightRail.material = railMaterial;
    movingRoadObjects.push(rightRail);

    for (let mark = 0; mark < 3; mark++) {
      const markZ = z - 3 + mark * 3.2;

      [-1.5, 1.5].forEach(function (x, index) {
        const line = BABYLON.MeshBuilder.CreateBox(
          "laneLine_" + i + "_" + mark + "_" + index,
          { width: 0.09, height: 0.04, depth: 1.4 },
          scene
        );

        line.position = new BABYLON.Vector3(x, 0.18, markZ);
        line.material = lineMaterial;
        movingRoadObjects.push(line);
      });
    }
  }
}

function createCity() {
  const buildingMaterials = [
    createMaterial(
      "blueBuilding",
      new BABYLON.Color3(0.03, 0.08, 0.24),
      new BABYLON.Color3(0.02, 0.12, 0.42)
    ),
    createMaterial(
      "purpleBuilding",
      new BABYLON.Color3(0.12, 0.02, 0.28),
      new BABYLON.Color3(0.24, 0.02, 0.48)
    ),
    createMaterial(
      "pinkBuilding",
      new BABYLON.Color3(0.22, 0.02, 0.18),
      new BABYLON.Color3(0.44, 0.01, 0.30)
    )
  ];

  for (let i = 0; i < 50; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const z = 8 + Math.floor(i / 2) * 6;
    const width = 2 + Math.random() * 2.5;
    const height = 5 + Math.random() * 15;

    const building = BABYLON.MeshBuilder.CreateBox(
      "building_" + i,
      {
        width: width,
        height: height,
        depth: 3 + Math.random() * 3
      },
      scene
    );

    building.position = new BABYLON.Vector3(
      side * (8 + Math.random() * 5),
      height / 2,
      z
    );

    building.material =
      buildingMaterials[i % buildingMaterials.length];
  }
}

function clearPlayer() {
  runnerParts.forEach(function (part) {
    part.dispose();
  });

  runnerParts = [];

  if (playerRoot) {
    playerRoot.dispose();
  }
}

function addRunnerPart(mesh) {
  mesh.parent = playerRoot;
  runnerParts.push(mesh);
  return mesh;
}

function createPlayer() {
  clearPlayer();

  playerRoot = new BABYLON.TransformNode("playerRoot", scene);
  playerRoot.position = new BABYLON.Vector3(0, 0.78, 0);

  const isFemale = selectedRunner === "female";

  const suitMaterial = createMaterial(
    "runnerSuit_" + selectedRunner,
    isFemale
      ? new BABYLON.Color3(0.32, 0.02, 0.25)
      : new BABYLON.Color3(0.02, 0.16, 0.34),
    isFemale
      ? new BABYLON.Color3(0.95, 0.02, 0.52)
      : new BABYLON.Color3(0.0, 0.65, 1.0)
  );

  const helmetMaterial = createMaterial(
    "runnerHelmet_" + selectedRunner,
    isFemale
      ? new BABYLON.Color3(0.34, 0.03, 0.38)
      : new BABYLON.Color3(0.02, 0.30, 0.48),
    isFemale
      ? new BABYLON.Color3(1.0, 0.04, 0.68)
      : new BABYLON.Color3(0, 0.78, 1)
  );

  const shoeMaterial = createMaterial(
    "runnerShoe_" + selectedRunner,
    new BABYLON.Color3(0.04, 0.08, 0.20),
    isFemale
      ? new BABYLON.Color3(1.0, 0.04, 0.68)
      : new BABYLON.Color3(0, 0.42, 0.90)
  );

  const hairMaterial = createMaterial(
    "hairMaterial",
    new BABYLON.Color3(0.10, 0.01, 0.12),
    new BABYLON.Color3(0.45, 0.01, 0.38)
  );

  const bodyWidth = isFemale ? 0.24 : 0.31;
  const armOffset = isFemale ? 0.37 : 0.46;
  const legOffset = isFemale ? 0.16 : 0.21;

  const body = addRunnerPart(
    BABYLON.MeshBuilder.CreateCapsule(
      "runnerBody",
      { height: 1.35, radius: bodyWidth },
      scene
    )
  );

  body.position.y = 1.15;
  body.material = suitMaterial;

  const head = addRunnerPart(
    BABYLON.MeshBuilder.CreateSphere(
      "runnerHead",
      { diameter: isFemale ? 0.50 : 0.55 },
      scene
    )
  );

  head.position.y = 2.06;
  head.material = helmetMaterial;

  leftArm = addRunnerPart(
    BABYLON.MeshBuilder.CreateCapsule(
      "leftArm",
      { height: 0.92, radius: 0.11 },
      scene
    )
  );

  leftArm.position = new BABYLON.Vector3(-armOffset, 1.40, 0);
  leftArm.material = suitMaterial;

  rightArm = addRunnerPart(
    BABYLON.MeshBuilder.CreateCapsule(
      "rightArm",
      { height: 0.92, radius: 0.11 },
      scene
    )
  );

  rightArm.position = new BABYLON.Vector3(armOffset, 1.40, 0);
  rightArm.material = suitMaterial;

  leftLeg = addRunnerPart(
    BABYLON.MeshBuilder.CreateCapsule(
      "leftLeg",
      { height: 1.05, radius: 0.14 },
      scene
    )
  );

  leftLeg.position = new BABYLON.Vector3(-legOffset, 0.32, 0);
  leftLeg.material = shoeMaterial;

  rightLeg = addRunnerPart(
    BABYLON.MeshBuilder.CreateCapsule(
      "rightLeg",
      { height: 1.05, radius: 0.14 },
      scene
    )
  );

  rightLeg.position = new BABYLON.Vector3(legOffset, 0.32, 0);
  rightLeg.material = shoeMaterial;

  if (isFemale) {
    const ponytail = addRunnerPart(
      BABYLON.MeshBuilder.CreateSphere(
        "ponytail",
        { diameter: 0.30 },
        scene
      )
    );

    ponytail.position = new BABYLON.Vector3(0, 2.10, -0.32);
    ponytail.material = hairMaterial;

    const ponytailEnd = addRunnerPart(
      BABYLON.MeshBuilder.CreateCapsule(
        "ponytailEnd",
        { height: 0.45, radius: 0.09 },
        scene
      )
    );

    ponytailEnd.position = new BABYLON.Vector3(0, 1.88, -0.40);
    ponytailEnd.rotation.x = 0.60;
    ponytailEnd.material = hairMaterial;
  }

  const glow = addRunnerPart(
    BABYLON.MeshBuilder.CreateDisc(
      "runnerGlow",
      { radius: 0.78, tessellation: 32 },
      scene
    )
  );

  glow.position.y = -0.73;
  glow.rotation.x = Math.PI / 2;

  const glowMaterial = createMaterial(
    "runnerGlowMaterial_" + selectedRunner,
    isFemale
      ? new BABYLON.Color3(1.0, 0.04, 0.60)
      : new BABYLON.Color3(0, 0.65, 1),
    isFemale
      ? new BABYLON.Color3(1.0, 0.03, 0.75)
      : new BABYLON.Color3(0, 0.95, 1)
  );

  glow.material = glowMaterial;

  playerShield = BABYLON.MeshBuilder.CreateSphere(
    "playerShield",
    { diameter: 3.1, segments: 16 },
    scene
  );

  playerShield.parent = playerRoot;
  playerShield.position.y = 0.8;

  const shieldMaterial = new BABYLON.StandardMaterial(
    "shieldMaterial",
    scene
  );

  shieldMaterial.diffuseColor = new BABYLON.Color3(0, 0.75, 1);
  shieldMaterial.emissiveColor = new BABYLON.Color3(0, 0.85, 1);
  shieldMaterial.alpha = 0.18;
  shieldMaterial.backFaceCulling = false;

  playerShield.material = shieldMaterial;
  playerShield.setEnabled(false);
}

function createObstacle() {
  const obstacleLane = Math.floor(Math.random() * 3);

  const barrierMaterial = createMaterial(
    "barrierMaterial_" + Date.now(),
    new BABYLON.Color3(0.7, 0.03, 0.08),
    new BABYLON.Color3(1, 0.03, 0.04)
  );

  const barrier = BABYLON.MeshBuilder.CreateBox(
    "dangerBarrier",
    { width: 1.85, height: 1.05, depth: 0.48 },
    scene
  );

  barrier.position = new BABYLON.Vector3(
    lanePositions[obstacleLane],
    0.65,
    48
  );

  barrier.material = barrierMaterial;

  obstacles.push({
    mesh: barrier,
    lane: obstacleLane
  });
}

function createCoin(x, z, y) {
  const coinMaterial = createMaterial(
    "coinMaterial_" + Date.now() + "_" + Math.random(),
    new BABYLON.Color3(1, 0.62, 0),
    new BABYLON.Color3(1, 0.80, 0.02)
  );

  const coin = BABYLON.MeshBuilder.CreateCylinder(
    "skyCoin",
    {
      height: 0.14,
      diameter: 0.58,
      tessellation: 20
    },
    scene
  );

  coin.position = new BABYLON.Vector3(x, y, z);
  coin.rotation.x = Math.PI / 2;
  coin.material = coinMaterial;

  coins.push({ mesh: coin, laneX: x });
}

function createCoinLine() {
  const laneNumber = Math.floor(Math.random() * 3);
  const x = lanePositions[laneNumber];

  for (let i = 0; i < 10; i++) {
    createCoin(x, 35 + i * 2.1, 1.1);
  }
}

function createZigZagCoins() {
  for (let i = 0; i < 12; i++) {
    const laneNumber = i % 3;
    createCoin(lanePositions[laneNumber], 34 + i * 2.2, 1.1);
  }
}

function createPowerup() {
  const type = Math.random() > 0.5 ? "shield" : "magnet";
  const powerupLane = Math.floor(Math.random() * 3);

  const material = createMaterial(
    "powerupMaterial_" + Date.now(),
    type === "shield"
      ? new BABYLON.Color3(0, 0.6, 1)
      : new BABYLON.Color3(1, 0.05, 0.65),
    type === "shield"
      ? new BABYLON.Color3(0, 0.9, 1)
      : new BABYLON.Color3(1, 0.05, 0.75)
  );

  const mesh = BABYLON.MeshBuilder.CreateSphere(
    "powerup_" + type,
    { diameter: 0.8, segments: 12 },
    scene
  );

  mesh.position = new BABYLON.Vector3(
    lanePositions[powerupLane],
    1.1,
    48
  );

  mesh.material = material;

  powerups.push({
    mesh: mesh,
    lane: powerupLane,
    type: type
  });
}

function activateShield() {
  shieldActive = true;
  shieldTime = 720;
  playerShield.setEnabled(true);
  shieldStatus.classList.remove("hidden");
}

function activateMagnet() {
  magnetActive = true;
  magnetTime = 720;
  magnetStatus.classList.remove("hidden");
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
    15,
    0.78,
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
      0.78,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    setTimeout(function () {
      jumping = false;
    }, 280);
  }, 250);
}

function clearGameObjects() {
  obstacles.forEach(function (item) {
    item.mesh.dispose();
  });

  coins.forEach(function (item) {
    item.mesh.dispose();
  });

  powerups.forEach(function (item) {
    item.mesh.dispose();
  });

  obstacles = [];
  coins = [];
  powerups = [];
}

function startGame() {
  clearGameObjects();

  lane = 1;
  targetX = 0;
  playerRoot.position.x = 0;
  playerRoot.position.y = 0.78;

  score = 0;
  coinCount = 0;
  distance = 0;
  gameSpeed = 0.28;
  frames = 0;

  obstacleTimer = 0;
  coinTimer = 0;
  powerupTimer = 0;

  shieldActive = false;
  shieldTime = 0;
  magnetActive = false;
  magnetTime = 0;

  playerShield.setEnabled(false);
  shieldStatus.classList.add("hidden");
  magnetStatus.classList.add("hidden");

  playing = true;
  paused = false;
  jumping = false;

  scoreText.textContent = "0";
  coinsText.textContent = "0";
  distanceText.textContent = "0m";

  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  pauseScreen.classList.add("hidden");
}

function gameOver() {
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

function updateRunAnimation() {
  const runAmount = Math.sin(frames * 0.28) * 0.70;

  leftArm.rotation.x = runAmount;
  rightArm.rotation.x = -runAmount;

  leftLeg.rotation.x = -runAmount;
  rightLeg.rotation.x = runAmount;

  if (!jumping) {
    playerRoot.position.y =
      0.78 + Math.abs(Math.sin(frames * 0.56)) * 0.035;
  }
}

function collectCoin(item, index) {
  coinCount++;
  score += 10;

  coinsText.textContent = coinCount;
  scoreText.textContent = score;

  item.mesh.dispose();
  coins.splice(index, 1);
}

function updatePowerupTimes() {
  if (shieldActive) {
    shieldTime--;

    if (shieldTime <= 0) {
      shieldActive = false;
      playerShield.setEnabled(false);
      shieldStatus.classList.add("hidden");
    }
  }

  if (magnetActive) {
    magnetTime--;

    if (magnetTime <= 0) {
      magnetActive = false;
      magnetStatus.classList.add("hidden");
    }
  }
}

function updateGame() {
  if (!playing || paused) return;

  frames++;

  playerRoot.position.x +=
    (targetX - playerRoot.position.x) * 0.16;

  playerRoot.rotation.z =
    (targetX - playerRoot.position.x) * -0.12;

  updateRunAnimation();
  updatePowerupTimes();

  distance += 0.08;
  score += 1;

  scoreText.textContent = score;
  distanceText.textContent = Math.floor(distance) + "m";

  gameSpeed += 0.00008;

  obstacleTimer++;
  coinTimer++;
  powerupTimer++;

  if (frames > 240 && obstacleTimer > 190) {
    createObstacle();
    obstacleTimer = 0;
  }

  if (coinTimer > 82) {
    if (Math.random() > 0.45) {
      createCoinLine();
    } else {
      createZigZagCoins();
    }

    coinTimer = 0;
  }

  if (frames > 360 && powerupTimer > 520) {
    createPowerup();
    powerupTimer = 0;
  }

  movingRoadObjects.forEach(function (object) {
    object.position.z -= gameSpeed;

    if (object.position.z < -16) {
      object.position.z += 120;
    }
  });

  obstacles.forEach(function (item, index) {
    item.mesh.position.z -= gameSpeed;

    const hitBarrier =
      item.mesh.position.z < 1.2 &&
      item.mesh.position.z > -1.2 &&
      item.lane === lane &&
      !jumping;

    if (hitBarrier) {
      if (shieldActive) {
        shieldActive = false;
        shieldTime = 0;
        playerShield.setEnabled(false);
        shieldStatus.classList.add("hidden");

        item.mesh.dispose();
        obstacles.splice(index, 1);
        return;
      }

      gameOver();
    }

    if (item.mesh.position.z < -12) {
      item.mesh.dispose();
      obstacles.splice(index, 1);
    }
  });

  coins.forEach(function (item, index) {
    item.mesh.position.z -= gameSpeed;
    item.mesh.rotation.z += 0.12;

    const isSameLane =
      Math.abs(item.laneX - lanePositions[lane]) < 0.1;

    const nearPlayer =
      item.mesh.position.z < 1.45 &&
      item.mesh.position.z > -1.2;

    if (magnetActive) {
      const horizontalGap =
        Math.abs(item.mesh.position.x - playerRoot.position.x);

      if (item.mesh.position.z < 8 && horizontalGap < 5) {
        item.mesh.position.x +=
          (playerRoot.position.x - item.mesh.position.x) * 0.14;

        item.mesh.position.y +=
          (1.1 - item.mesh.position.y) * 0.10;
      }
    }

    const magnetCollect =
      magnetActive &&
      item.mesh.position.z < 1.8 &&
      item.mesh.position.z > -1.3 &&
      Math.abs(item.mesh.position.x - playerRoot.position.x) < 1.2;

    if ((nearPlayer && isSameLane) || magnetCollect) {
      collectCoin(item, index);
      return;
    }

    if (item.mesh.position.z < -12) {
      item.mesh.dispose();
      coins.splice(index, 1);
 
