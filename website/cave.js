function initThreeCave() {
    console.log("CAVE DEBUG: initThreeCave started");
    const container = document.getElementById('cave-three-container');
    if (!container) {
        console.error("CAVE DEBUG: Container 'cave-three-container' NOT FOUND!");
        return;
    }
    console.log("CAVE DEBUG: Container size:", container.clientWidth, "x", container.clientHeight);

    const assets = window.assets;
    console.log("CAVE DEBUG: Assets:", assets);

    let playerHP = 100;
    let archers = [];
    let arrows = [];
    let zoroModel, zoroMixer;
    let isGameOver = false;
    let flyMode = true; // Default to fly mode for free roam
    let velocityY = 0;

    // Create a Debug Coord display
    const debugUI = document.createElement('div');
    debugUI.style.position = 'fixed'; debugUI.style.bottom = '20px'; debugUI.style.right = '20px';
    debugUI.style.color = '#00ff00'; debugUI.style.fontFamily = 'monospace'; debugUI.style.fontSize = '14px';
    debugUI.style.pointerEvents = 'none'; debugUI.id = 'coord-debug';
    debugUI.style.zIndex = '10000';
    document.body.appendChild(debugUI);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky Blue
    scene.fog = new THREE.Fog(0x87ceeb, 1, 3000);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    console.log("CAVE DEBUG: Renderer and Camera initialized");

    // BRIGHT SUN (Directional Light)
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(500, 1000, 500);
    sunLight.castShadow = true;
    sunLight.shadow.camera.left = -1000;
    sunLight.shadow.camera.right = 1000;
    sunLight.shadow.camera.top = 1000;
    sunLight.shadow.camera.bottom = -1000;
    scene.add(sunLight);

    // Stronger Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    // Add Hemisphere Light for natural bounce
    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x3d2b1f, 1.0);
    scene.add(hemiLight);

    // Ground Plane (Catch falling player and shadows)
    const floorGeo = new THREE.PlaneGeometry(5000, 5000);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    scene.add(floor);

    // Stronger Torch light attached to camera
    const torch = new THREE.PointLight(0xffaa44, 3, 100);
    torch.castShadow = true;
    camera.add(torch);
    scene.add(camera);

    // TEST CUBE at origin
    const testGeo = new THREE.BoxGeometry(5, 5, 5);
    const testMat = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
    const testCube = new THREE.Mesh(testGeo, testMat);
    testCube.position.set(0, 5, 0);
    scene.add(testCube);
    console.log("CAVE DEBUG: Added Red Test Cube at (0, 5, 0)");

    // Add Grid Helper to see the floor/center
    const gridHelper = new THREE.GridHelper(500, 50, 0x00ff00, 0x444444);
    scene.add(gridHelper);

    // Extra "Cave Glow" lights scattered around
    const createGlow = (x, y, z, color) => {
        const light = new THREE.PointLight(color, 5, 60);
        light.position.set(x, y, z);
        scene.add(light);

        // Add a small visible "crystal" mesh for the light source
        const geo = new THREE.SphereGeometry(1, 8, 8);
        const mat = new THREE.MeshBasicMaterial({ color: color });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        console.log(`CAVE DEBUG: Created glow light at (${x}, ${y}, ${z})`);
    };

    createGlow(-40, 5, -30, 0x00ff88); // Green glow
    createGlow(40, 5, -50, 0x0088ff);  // Blue glow
    createGlow(0, 10, -100, 0xff00ff); // Purple glow
    createGlow(-30, 5, -10, 0x00ffff); // Cyan glow

    const loader = new THREE.GLTFLoader();

    // Load Cave Model
    console.log("CAVE DEBUG: Loading cave model from:", assets.caveModel);
    loader.load(assets.caveModel, (gltf) => {
        console.log("CAVE DEBUG: Cave model LOADED successfully!");
        const cave = gltf.scene;
        // Make it MASSIVE
        cave.scale.set(50, 50, 50);
        cave.traverse(n => {
            if (n.isMesh) {
                n.receiveShadow = true;
                n.castShadow = true;
                // Ensure visibility from both sides
                n.material.side = THREE.DoubleSide;
            }
        });
        scene.add(cave);

        // Spawn Zoro nearby
        spawnZoro();
        // Spawn Archers
        spawnArchers();
    }, (xhr) => {
        console.log(`CAVE DEBUG: Cave loading: ${(xhr.loaded / xhr.total * 100).toFixed(2)}%`);
    }, (err) => {
        console.error("CAVE DEBUG: ERROR loading cave model:", err);
    });

    function spawnZoro() {
        console.log("CAVE DEBUG: Loading Zoro model...");
        loader.load(assets.zoroModel, (gltf) => {
            console.log("CAVE DEBUG: Zoro model LOADED.");
            zoroModel = gltf.scene;
            const box = new THREE.Box3().setFromObject(zoroModel);
            const size = box.getSize(new THREE.Vector3());
            const scaleFactor = 2 / (size.y || 1);
            zoroModel.scale.set(scaleFactor, scaleFactor, scaleFactor);
            zoroModel.position.set(5, 0, -10);
            scene.add(zoroModel);

            if (gltf.animations.length > 0) {
                zoroMixer = new THREE.AnimationMixer(zoroModel);
                zoroMixer.clipAction(gltf.animations[0]).play();
            }
        });
    }

    function spawnArchers() {
        console.log("CAVE DEBUG: Spawning archers...");
        const spawnPoints = [
            { x: -20, y: 0, z: -40 },
            { x: 20, y: 0, z: -60 },
            { x: 0, y: 0, z: -90 },
            { x: -30, y: 0, z: -120 }
        ];

        spawnPoints.forEach((pos, index) => {
            loader.load(assets.archerModel, (gltf) => {
                const archer = gltf.scene;
                const box = new THREE.Box3().setFromObject(archer);
                const size = box.getSize(new THREE.Vector3());
                const scaleFactor = 2 / (size.y || 1);
                archer.scale.set(scaleFactor, scaleFactor, scaleFactor);
                archer.position.set(pos.x, pos.y, pos.z);

                const mixer = new THREE.AnimationMixer(archer);
                const shootClip = gltf.animations.find(a => a.name.toLowerCase().includes('shoot')) || gltf.animations[0];

                // Add a light to each archer so they are visible
                const archerLight = new THREE.PointLight(0xff4444, 2, 20);
                archer.add(archerLight);

                const archerObj = {
                    mesh: archer,
                    mixer: mixer,
                    shootAction: mixer.clipAction(shootClip),
                    lastShot: 0,
                    hp: 30,
                    isDead: false
                };

                scene.add(archer);
                archers.push(archerObj);
                console.log(`CAVE DEBUG: Archer #${index} loaded at (${pos.x}, ${pos.y}, ${pos.z})`);
            });
        });
    }

    // Camera/Movement Logic (Reusing simple FPS logic)
    camera.position.set(20, 100, 50); // Massive birds-eye view for debugging
    camera.lookAt(0, 0, 0);
    let moveF = false, moveB = false, moveL = false, moveR = false, moveU = false, moveD = false, yaw = 0, pitch = 0;

    document.addEventListener('keydown', (e) => {
        if (isGameOver) return;
        switch (e.code) {
            case 'KeyW': moveF = true; break;
            case 'KeyS': moveB = true; break;
            case 'KeyA': moveL = true; break;
            case 'KeyD': moveR = true; break;
            case 'Space': moveU = true; break;
            case 'ShiftLeft': moveD = true; break;
            case 'KeyF': flyMode = !flyMode; showNotification("Fly Mode: " + (flyMode ? "ON" : "OFF")); break;
            case 'KeyE':
                const narrativeBox = document.getElementById('narrative-box');
                if (narrativeBox && narrativeBox.style.display !== 'none') {
                    const buttons = narrativeBox.querySelectorAll('.story-choice-btn');
                    if (buttons.length > 0) buttons[0].click();
                }
                break;
        }
    });

    document.addEventListener('keyup', (e) => {
        switch (e.code) {
            case 'KeyW': moveF = false; break;
            case 'KeyS': moveB = false; break;
            case 'KeyA': moveL = false; break;
            case 'KeyD': moveR = false; break;
            case 'Space': moveU = false; break;
            case 'ShiftLeft': moveD = false; break;
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === renderer.domElement) {
            yaw -= e.movementX * 0.002;
            pitch -= e.movementY * 0.002;
            pitch = Math.max(-1.4, Math.min(1.4, pitch));
        }
    });

    const raycaster = new THREE.Raycaster();
    renderer.domElement.addEventListener('click', () => {
        if (document.pointerLockElement !== renderer.domElement) {
            renderer.domElement.requestPointerLock();
            return;
        }
        if (isGameOver) return;

        playerAttack();
    });

    function playerAttack() {
        // Simple punch effect: camera shake
        gsap.to(camera.position, { x: camera.position.x + 0.1, duration: 0.05, yoyo: true, repeat: 1 });

        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        const intersects = raycaster.intersectObjects(archers.map(a => a.mesh), true);

        if (intersects.length > 0) {
            let hitObj = intersects[0].object;

            // Find which archer was hit by checking ancestors
            archers.forEach(archer => {
                let current = hitObj;
                while (current) {
                    if (current === archer.mesh) {
                        if (archer.isDead) return;
                        archer.hp -= 15;
                        showNotification("HIT ARCHER!");
                        if (archer.hp <= 0) {
                            archer.isDead = true;
                            gsap.to(archer.mesh.scale, { x: 0, y: 0, z: 0, duration: 0.5, onComplete: () => scene.remove(archer.mesh) });
                            showNotification("ARCHER DEFEATED");
                        }
                        return;
                    }
                    current = current.parent;
                }
            });
        }
    }

    function createArrow(startPos, targetPos) {
        const arrowGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 4);
        const arrowMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
        const arrow = new THREE.Mesh(arrowGeo, arrowMat);

        arrow.position.copy(startPos);
        arrow.lookAt(targetPos);
        arrow.rotateX(Math.PI / 2);

        const dir = new THREE.Vector3().subVectors(targetPos, startPos).normalize();

        scene.add(arrow);
        arrows.push({ mesh: arrow, dir: dir, spawnTime: Date.now() });
    }

    function updateHPBar() {
        const fill = document.getElementById('hp-bar-fill');
        const text = document.getElementById('hp-text');
        if (fill) fill.style.width = playerHP + '%';
        if (text) text.innerText = Math.round(playerHP) + '% HP';

        if (playerHP <= 0 && !isGameOver) {
            isGameOver = true;
            showNarrative("You have fallen in combat...", [{ text: "Retry", action: () => location.reload() }]);
        }
    }

    const clock = new THREE.Clock();
    function animate() {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();

        if (!isGameOver) {
            const moveSpeed = flyMode ? 50 : 15;
            // Player Movement
            const dir = new THREE.Vector3();
            camera.getWorldDirection(dir);
            if (!flyMode) dir.y = 0;
            dir.normalize();
            const side = new THREE.Vector3().crossVectors(camera.up, dir).normalize();

            if (moveF) camera.position.addScaledVector(dir, moveSpeed * delta);
            if (moveB) camera.position.addScaledVector(dir, -moveSpeed * delta);
            if (moveL) camera.position.addScaledVector(side, moveSpeed * delta);
            if (moveR) camera.position.addScaledVector(side, -moveSpeed * delta);

            if (flyMode) {
                if (moveU) camera.position.y += moveSpeed * delta;
                if (moveD) camera.position.y -= moveSpeed * delta;
            } else {
                // Gravity simulator
                velocityY -= 30 * delta;
                camera.position.y += velocityY * delta;
                if (camera.position.y < 1.8) {
                    camera.position.y = 1.8;
                    velocityY = 0;
                }
            }

            camera.rotation.set(pitch, yaw, 0, 'YXZ');

            // Update Debug UI
            debugUI.innerText = `POS: ${Math.round(camera.position.x)}, ${Math.round(camera.position.y)}, ${Math.round(camera.position.z)} | FLY: ${flyMode ? 'ON' : 'OFF'} | SCENE CHILDS: ${scene.children.length}`;
        }

        if (zoroMixer) zoroMixer.update(delta);

        // Archer AI and Arrows
        const now = Date.now();
        archers.forEach(archer => {
            if (archer.isDead) return;
            archer.mixer.update(delta);

            const dist = archer.mesh.position.distanceTo(camera.position);
            if (dist < 60 && now - archer.lastShot > 3500) {
                // Shoot
                archer.lastShot = now;
                archer.shootAction.reset().play();
                setTimeout(() => {
                    if (!archer.isDead) createArrow(archer.mesh.position.clone().add(new THREE.Vector3(0, 1.5, 0)), camera.position.clone());
                }, 500); // Shoot delay half-way into animation
            }
            // Make archer face player
            archer.mesh.lookAt(camera.position.x, archer.mesh.position.y, camera.position.z);
        });

        // Update Arrows
        for (let i = arrows.length - 1; i >= 0; i--) {
            const arrow = arrows[i];
            arrow.mesh.position.addScaledVector(arrow.dir, 40 * delta);

            // Collision with player
            const distToPlayer = arrow.mesh.position.distanceTo(camera.position);
            if (distToPlayer < 2.0) {
                playerHP -= 10;
                updateHPBar();
                scene.remove(arrow.mesh);
                arrows.splice(i, 1);
                showNotification("OUCH! Arrow hit!");
                continue;
            }

            // Remove old arrows
            if (now - arrow.spawnTime > 5000) {
                scene.remove(arrow.mesh);
                arrows.splice(i, 1);
            }
        }

        renderer.render(scene, camera);
    }
    animate();

    console.log("CAVE DEBUG: Render loop started. Initial position:", camera.position);
    showNotification("THE CAVE ARE FULL OF ARCHERS! FIGHT THROUGH!");
    updateHPBar();
}
