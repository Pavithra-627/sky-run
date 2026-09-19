const canvas = document.getElementById("gameCanvas");

const scoreText = document.getElementById("score");
const coinsText = document.getElementById("coins");
const distanceText = document.getElementById("distance");
const bestScoreText = document.getElementById("best-score");
const finalScoreText = document.getElementById("final-score");

const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over-screen");
const pauseScreen = document.getElementById("pause-screen");

const maleButton = document.getElementById("male-button");
const femaleButton = document.getElementById("female-button");
const startButton = document.getElementById("start-button");
const restartButton = document.getElementById("restart-button");
const pauseButton = document.getElementById("pause-button");
const resumeButton = document.getElementById("resume-button");

const engine = new BABYLON.Engine(canvas, true);

let scene;
let playerRoot;
let playerPicture;
let playerShadow;

let playing = false;
let paused = false;
let jumping = false;

let selectedRunner = "male";
let lane = 1;
let targetX = 0;

let score = 0;
let coinCount = 0;
let distance = 0;
let speed = 0.26;
let frames = 0;

let coins = [];
let barriers = [];
let roadPieces = [];

let coinTimer = 0;
let barrierTimer = 0;

let touchStartX = 0;
let touchStartY = 0;

let bestScore =
  Number(localStorage.getItem("runRideBestScore")) || 0;

const lanePositions = [-3, 0, 3];

bestScoreText.textContent = bestScore;

function createMaterial(name, color) {
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
  const roadMaterial = createMaterial(
    "roadMaterial",
    new BABYLON.Color3(0.04, 0.08, 0.22)
  );

  const railMaterial = createMaterial(
    "railMaterial",
    new BABYLON.Color3(0, 0.9, 1)
  );

  const laneMaterial = createMaterial(
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
    roadPieces.push(road);

    [-5, 5].forEach(function (x, side) {
      const rail = BABYLON.MeshBuilder.CreateBox(
        "rail" + i + side,
        { width: 0.15, height: 0.22, depth: 10 },
        scene
      );

      rail.position = new BABYLON.Vector3(x, 0.22, z);
      rail.material = railMaterial;
      roadPieces.push(rail);
    });

    [-1.5, 1.5].forEach(function (x, number) {
      const laneLine = BABYLON.MeshBuilder.CreateBox(
        "line" + i + number,
        { width: 0.08, height: 0.05, depth: 10 },
        scene
      );

      laneLine.position = new BABYLON.Vector3(x, 0.16, z);
      laneLine.material = laneMaterial;
      roadPieces.push(laneLine);
    });
  }
}

function disposePlayer() {
  if (playerPicture) {
    playerPicture.dispose();
  }

  if (playerShadow) {
    playerShadow.dispose();
  }

  if (playerRoot) {
    playerRoot.dispose();
  }

  playerPicture = null;
  playerShadow = null;
  playerRoot = null;
}

function createPlayer() {
  disposePlayer();

  playerRoot = new BABYLON.TransformNode("playerRoot", scene);
  playerRoot.position = new BABYLON.Vector3(0, 1.65, 0);

  playerPicture = BABYLON.MeshBuilder.CreatePlane(
    "runnerPicture",
    {
      width: 2.6,
      height: 3.6,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    },
    scene
  );

  playerPicture.parent = playerRoot;
  playerPicture.position.y = 0;

  /*
    This means the runner image faces correctly.
  */
  playerPicture.rotation.y = 0;

  const pictureMaterial = new BABYLON.StandardMaterial(
    "runnerPictureMaterial_" + selectedRunner,
    scene
  );

  const selectedImage =
    selectedRunner === "male"
      ? "male.png"
      : "female.png";

  const pictureTexture = new BABYLON.Texture(
    selectedImage,
    scene,
    true,
    false
  );

  pictureTexture.hasAlpha = true;

  pictureMaterial.diffuseTexture = pictureTexture;
  pictureMaterial.opacityTexture = pictureTexture;
  pictureMaterial.useAlphaFromDiffuseTexture = true;
  pictureMaterial.alphaCutOff = 0.05;
  pictureMaterial.backFaceCulling = false;

  pictureMaterial.emissiveColor =
    selectedRunner === "male"
      ? new BABYLON.Color3(0, 0.35, 0.55)
      : new BABYLON.Color3(0.45, 0.02, 0.28);

  playerPicture.material = pictureMaterial;

  playerShadow = BABYLON.MeshBuilder.CreateDisc(
    "runnerShadow",
    { radius: 0.85, tessellation: 24 },
    scene
  );

  playerShadow.parent = playerRoot;
  playerShadow.position.y = -1.58;
  playerShadow.rotation.x = Math.PI / 2;

  const shadowMaterial = new BABYLON.StandardMaterial(
    "shadowMaterial_" + selectedRunner,
    scene
  );

  shadowMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);

  shadowMaterial.emissiveColor =
    selectedRunner === "male"
      ? new BABYLON.Color3(0, 0.45, 0.75)
      : new BABYLON.Color3(0.55, 0.02, 0.40);

  shadowMaterial.alpha = 0.55;

  playerShadow.material = shadowMaterial;
}

function createCoinLine() {
  const laneNumber = Math.floor(Math.random() * 3);

  const coinMaterial = createMaterial(
    "coinMaterial_" + Date.now(),
    new BABYLON.Color3(1, 0.72, 0)
  );

  for (let i = 0; i < 10; i++) {
    const coin = BABYLON.MeshBuilder.CreateCylinder(
      "coin",
      { height: 0.13, diameter: 0.56, tessellation: 18 },
      scene
    );

    coin.position = new BABYLON.Vector3(
      lanePositions[laneNumber],
      1.1,
      30 + i * 2.2
    );

    coin.rotation.x = Math.PI / 2;
    coin.material = coinMaterial;

    coins.push({
      mesh: coin,
      lane: laneNumber
    });
  }
}

function createBarrier() {
  const laneNumber = Math.floor(Math.random() * 3);

  const barrierMaterial = createMaterial(
    "barrierMaterial_" + Date.now(),
    new BABYLON.Color3(1, 0.04, 0.08)
  );

  const barrier = BABYLON.MeshBuilder.CreateBox(
    "barrier",
    { width: 1.8, height: 1.1, depth: 0.45 },
    scene
  );

  barrier.position = new BABYLON.Vector3(
    lanePositions[laneNumber],
    0.65,
    43
  );

  barrier.material = barrierMaterial;

  barriers.push({
    mesh: barrier,
    lane: laneNumber
  });
}

function chooseMale() {
  if (playing) return;

  selectedRunner = "male";

  maleButton.classList.add("selected");
  femaleButton.classList.remove("selected");

  createPlayer();
}

function chooseFemale() {
  if (playing) return;

  selectedRunner = "female";

  femaleButton.classList.add("selected");
  maleButton.classList.remove("selected");

  createPlayer();
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
    1.65,
    3.15,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );

  setTimeout(function () {
    BABYLON.Animation.CreateAndStartAnimation(
      "jumpDown",
      playerRoot,
      "position.y",
      60,
      14,
      3.15,
      1.65,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    setTimeout(function () {
      jumping = false;
    }, 250);
  }, 230);
}

function clearObjects() {
  coins.forEach(function (item) {
    item.mesh.dispose();
  });

  barriers.forEach(function (item) {
    item.mesh.dispose();
  });

  coins = [];
  barriers = [];
}

function startGame() {
  clearObjects();

  playing = true;
  paused = false;
  jumping = false;

  lane = 1;
  targetX = 0;

  playerRoot.position.x = 0;
  playerRoot.position.y = 1.65;

  score = 0;
  coinCount = 0;
  distance = 0;
  speed = 0.26;
  frames = 0;

  coinTimer = 0;
  barrierTimer = 0;

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

    localStorage.setItem(
      "runRideBestScore",
      bestScore
    );

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

function updateRunnerAnimation() {
  if (jumping) return;

  playerRoot.position.y =
    1.65 + Math.abs(Math.sin(frames * 0.55)) * 0.08;

  playerPicture.rotation.z =
Math.PI + Math.sin(frames * 0.28) * 0.035;

  playerPicture.position.y =
    Math.sin(frames * 0.55) * 0.04;
}

function updateGame() {
  if (!playing || paused) return;

  frames++;

  playerRoot.position.x +=
    (targetX - playerRoot.position.x) * 0.15;

  playerRoot.rotation.z =
    (targetX - playerRoot.position.x) * -0.10;

  updateRunnerAnimation();

  score++;
  distance += 0.1;

  scoreText.textContent = score;
  distanceText.textContent = Math.floor(distance) + "m";

  coinTimer++;
  barrierTimer++;

  if (coinTimer > 72) {
    createCoinLine();
    coinTimer = 0;
  }

  if (frames > 250 && barrierTimer > 190) {
    createBarrier();
    barrierTimer = 0;
  }

  roadPieces.forEach(function (piece) {
    piece.position.z -= speed;

    if (piece.position.z < -16) {
      piece.position.z += 120;
    }
  });

  coins.forEach(function (item, index) {
    item.mesh.position.z -= speed;
    item.mesh.rotation.z += 0.12;

    const pickedUp =
      item.mesh.position.z < 1.5 &&
      item.mesh.position.z > -1.2 &&
      item.lane === lane;

    if (pickedUp) {
      coinCount++;
      score += 10;

      coinsText.textContent = coinCount;
      scoreText.textContent = score;

      item.mesh.dispose();
      coins.splice(index, 1);
      return;
    }

    if (item.mesh.position.z < -12) {
      item.mesh.dispose();
      coins.splice(index, 1);
    }
  });

  barriers.forEach(function (item, index) {
    item.mesh.position.z -= speed;

    const hit =
      item.mesh.position.z < 1.2 &&
      item.mesh.position.z > -1.2 &&
      item.lane === lane &&
      !jumping;

    if (hit) {
      endGame();
    }

    if (item.mesh.position.z < -12) {
      item.mesh.dispose();
      barriers.splice(index, 1);
    }
  });
}

maleButton.addEventListener("click", chooseMale);
femaleButton.addEventListener("click", chooseFemale);

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
      if (moveX > 35) {
        moveRight();
      }

      if (moveX < -35) {
        moveLeft();
      }
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
