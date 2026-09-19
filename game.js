// Create canvas and engine
const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

// Create scene
const createScene = function () {
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0.5, 0.7, 1.0);

    // Add camera
    const camera = new BABYLON.ArcRotateCamera(
        "camera",
        Math.PI / 2,
        Math.PI / 2.5,
        15,
        new BABYLON.Vector3(0, 2, 5),
        scene
    );
    camera.attachControl(canvas, true);
    camera.lowerBetaLimit = 0.1;
    camera.upperBetaLimit = Math.PI / 2.2;
    camera.lowerRadiusLimit = 10;
    camera.upperRadiusLimit = 20;

    // Add light
    const light = new BABYLON.HemisphericLight(
        "light",
        new BABYLON.Vector3(0, 1, 0),
        scene
    );
    light.intensity = 0.7;

    // Create ground (road)
    const ground = BABYLON.MeshBuilder.CreateGround("ground", {
        width: 10,
        height: 200
    }, scene);
    const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
    groundMat.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    ground.material = groundMat;

    // Create player (character)
    const player = BABYLON.MeshBuilder.CreateBox("player", {
        height: 1.5,
        width: 0.8,
        depth: 0.8
    }, scene);
    const playerMat = new BABYLON.StandardMaterial("playerMat", scene);
    playerMat.diffuseColor = new BABYLON.Color3(1, 0.5, 0);
    player.material = playerMat;
    player.position.y = 0.75;
    player.position.z = 0;
    player.position.x = 0;

    // FIX: Make character face forward along the road
    player.rotation.y = Math.PI;

    // Lane positions (left, center, right)
    const lanes = [-3, 0, 3];
    let currentLane = 1; // Start in center lane (index 1)

    // Create coins array
    const coins = [];
    const coinMat = new BABYLON.StandardMaterial("coinMat", scene);
    coinMat.diffuseColor = new BABYLON.Color3(1, 1, 0);

    // Spawn coins ahead
    for (let i = 0; i < 20; i++) {
        const coin = BABYLON.MeshBuilder.CreateSphere("coin" + i, {
            diameter: 0.6
        }, scene);
        coin.material = coinMat;
        coin.position.y = 1;
        coin.position.z = -20 - (i * 10);
        // Random lane
        const randomLane = Math.floor(Math.random() * 3);
        coin.position.x = lanes[randomLane];
        coins.push(coin);
    }

    // Score
    let score = 0;
    const scoreDiv = document.getElementById("score");

    // Keyboard controls
    scene.actionManager = new BABYLON.ActionManager(scene);

    scene.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnKeyDownTrigger,
            function (evt) {
                if (evt.sourceEvent.key === "ArrowLeft" || evt.sourceEvent.key === "a") {
                    if (currentLane > 0) {
                        currentLane--;
                    }
                } else if (evt.sourceEvent.key === "ArrowRight" || evt.sourceEvent.key === "d") {
                    if (currentLane < 2) {
                        currentLane++;
                    }
                }
            }
        )
    );

    // Touch/Swipe controls for mobile
    let touchStartX = 0;
    canvas.addEventListener("touchstart", function (evt) {
        touchStartX = evt.touches[0].clientX;
    });

    canvas.addEventListener("touchend", function (evt) {
        const touchEndX = evt.changedTouches[0].clientX;
        const diff = touchEndX - touchStartX;

        if (diff > 50) {
            // Swipe right
            if (currentLane < 2) {
                currentLane++;
            }
        } else if (diff < -50) {
            // Swipe left
            if (currentLane > 0) {
                currentLane--;
            }
        }
    });

    // HTML Button controls - FIX FOR BUTTONS NOT WORKING
    const leftBtn = document.getElementById("leftBtn");
    const rightBtn = document.getElementById("rightBtn");

    if (leftBtn) {
        leftBtn.addEventListener("click", function () {
            if (currentLane > 0) {
                currentLane--;
            }
        });
    }

    if (rightBtn) {
        rightBtn.addEventListener("click", function () {
            if (currentLane < 2) {
                currentLane++;
            }
        });
    }

    // Game loop
    scene.registerBeforeRender(function () {
        // Move player forward
        player.position.z -= 0.15;

        // Smooth lane change
        const targetX = lanes[currentLane];
        player.position.x = BABYLON.Scalar.Lerp(player.position.x, targetX, 0.1);

        // Rotate coins
        for (let i = 0; i < coins.length; i++) {
            coins[i].rotation.y += 0.05;
        }

        // Check coin collision
        for (let i = 0; i < coins.length; i++) {
            const distance = BABYLON.Vector3.Distance(player.position, coins[i].position);
            if (distance < 1) {
                // Collect coin
                coins[i].position.z = player.position.z - 200; // Move coin far ahead
                coins[i].position.x = lanes[Math.floor(Math.random() * 3)];
                score += 10;
                if (scoreDiv) {
                    scoreDiv.innerHTML = "Score: " + score;
                }
            }
        }

        // Endless effect: reset coins when player passes them
        for (let i = 0; i < coins.length; i++) {
            if (coins[i].position.z > player.position.z + 10) {
                coins[i].position.z = player.position.z - 200;
                coins[i].position.x = lanes[Math.floor(Math.random() * 3)];
            }
        }

        // Camera follows player
        camera.target = new BABYLON.Vector3(
            player.position.x,
            player.position.y + 2,
            player.position.z + 5
        );
        camera.position = new BABYLON.Vector3(
            player.position.x,
            player.position.y + 5,
            player.position.z + 10
        );
    });

    return scene;
};

// Create scene and run
const scene = createScene();
engine.runRenderLoop(function () {
    scene.render();
});

// Handle window resize
window.addEventListener("resize", function () {
    engine.resize();
});
