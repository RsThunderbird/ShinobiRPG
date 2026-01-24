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
    let flyMode = false;
    let velocityY = 0;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020205);
    scene.fog = new THREE.FogExp2(0x020205, 0.02);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.setClearColor(0x000000, 1);

    // ENSURE VISIBILITY: Force style onto canvas
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.zIndex = '500'; // Above stages, below UI

    container.innerHTML = ''; // Clear previous canvases
    container.appendChild(renderer.domElement);
    console.log("CAVE DEBUG: Renderer and Camera initialized and appended");

    // Warm Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // Subtle Hemisphere Light
    const hemiLight = new THREE.HemisphereLight(0x4040ff, 0x202020, 0.5);
    scene.add(hemiLight);

    // Stronger Torch light attached to camera (Essential for cave)
    const torch = new THREE.PointLight(0xffaa44, 2.5, 40);
    torch.castShadow = true;
    camera.add(torch);
    scene.add(camera);


    const loader = new THREE.GLTFLoader();

    // Load Cave Model
    loader.load(assets.caveModel, (gltf) => {
        const cave = gltf.scene;

        // Auto-center and Scale the cave
        const box = new THREE.Box3().setFromObject(cave);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Move cave so the "start" is at origin
        cave.position.sub(center);
        cave.position.y -= size.y / 2; // Sit on floor

        // Scale it up significantly to be a playable tunnel
        const scaleFactor = 40;
        cave.scale.set(scaleFactor, scaleFactor, scaleFactor);

        cave.traverse(n => {
            if (n.isMesh) {
                n.receiveShadow = true;
                n.castShadow = true;
                n.material.side = THREE.DoubleSide;
            }
        });
        scene.add(cave);

        console.log("CAVE DEBUG: Cave scale:", scaleFactor, "Size:", size);

        // Position elements along the cave tunnel
        spawnZoro(new THREE.Vector3(5, 0, -20));
        spawnArchers([
            { x: -10, y: 0, z: -50 },
            { x: 10, y: 0, z: -100 },
            { x: -5, y: 0, z: -150 },
            { x: 5, y: 0, z: -200 }
        ]);
    });

    function spawnZoro(pos) {
        loader.load(assets.zoroModel, (gltf) => {
            zoroModel = gltf.scene;
            const box = new THREE.Box3().setFromObject(zoroModel);
            const size = box.getSize(new THREE.Vector3());
            const s = 2 / (size.y || 1);
            zoroModel.scale.set(s, s, s);
            zoroModel.position.copy(pos);
            scene.add(zoroModel);
            if (gltf.animations.length > 0) {
                zoroMixer = new THREE.AnimationMixer(zoroModel);
                zoroMixer.clipAction(gltf.animations[0]).play();
            }
        });
    }

    function spawnArchers(points) {
        points.forEach((pos, index) => {
            loader.load(assets.archerModel, (gltf) => {
                const archer = gltf.scene;
                const s = 2 / (new THREE.Box3().setFromObject(archer).getSize(new THREE.Vector3()).y || 1);
                archer.scale.set(s, s, s);
                archer.position.copy(pos);

                const mixer = new THREE.AnimationMixer(archer);
                const shootClip = gltf.animations.find(a => a.name.toLowerCase().includes('shoot')) || gltf.animations[0];
                archer.add(new THREE.PointLight(0xff4444, 2, 20));

                archers.push({
                    mesh: archer, mixer: mixer,
                    shootAction: mixer.clipAction(shootClip),
                    lastShot: 0, hp: 30, isDead: false
                });
                scene.add(archer);
            });
        });
    }

    // Camera/Movement Logic 
    camera.position.set(0, 1.8, 5); // Spawn looking down the tunnel
    let moveF = false, moveB = false, moveL = false, moveR = false, moveU = false, moveD = false, yaw = 0, pitch = 0;
    flyMode = true; // Fly mode ON to let user find geometry if auto-center is weird

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
            // Removed for gameplay
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
