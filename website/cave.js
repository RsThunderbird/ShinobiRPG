function initThreeCave() {
    const container = document.getElementById('cave-three-container');
    const assets = window.assets;

    let playerHP = 100;
    let archers = [];
    let arrows = [];
    let zoroModel, zoroMixer;
    let isGameOver = false;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020202);
    scene.fog = new THREE.FogExp2(0x020202, 0.03); // Reduced fog for better visibility

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Slightly higher ambient
    scene.add(ambientLight);

    // Torch light attached to camera
    const torch = new THREE.PointLight(0xffcc66, 1.5, 30); // Warm torch color
    torch.castShadow = true;
    camera.add(torch);
    scene.add(camera); // Must add camera to scene for child light to work

    const loader = new THREE.GLTFLoader();

    // Load Cave Model
    loader.load(assets.caveModel, (gltf) => {
        const cave = gltf.scene;
        // Adjust scale for cave
        cave.scale.set(10, 10, 10);
        cave.traverse(n => { if (n.isMesh) { n.receiveShadow = true; n.castShadow = true; } });
        scene.add(cave);

        // Spawn Zoro nearby
        spawnZoro();
        // Spawn Archers
        spawnArchers();
    });

    function spawnZoro() {
        loader.load(assets.zoroModel, (gltf) => {
            zoroModel = gltf.scene;
            const box = new THREE.Box3().setFromObject(zoroModel);
            const size = box.getSize(new THREE.Vector3());
            const scaleFactor = 2 / (size.y || 1);
            zoroModel.scale.set(scaleFactor, scaleFactor, scaleFactor);
            zoroModel.position.set(2, 0, -5);
            scene.add(zoroModel);

            if (gltf.animations.length > 0) {
                zoroMixer = new THREE.AnimationMixer(zoroModel);
                zoroMixer.clipAction(gltf.animations[0]).play();
            }
        });
    }

    function spawnArchers() {
        const spawnPoints = [
            { x: -10, y: 0, z: -20 },
            { x: 10, y: 0, z: -30 },
            { x: 0, y: 0, z: -45 },
            { x: -15, y: 0, z: -60 }
        ];

        spawnPoints.forEach(pos => {
            loader.load(assets.archerModel, (gltf) => {
                const archer = gltf.scene;
                const box = new THREE.Box3().setFromObject(archer);
                const size = box.getSize(new THREE.Vector3());
                const scaleFactor = 2 / (size.y || 1);
                archer.scale.set(scaleFactor, scaleFactor, scaleFactor);
                archer.position.set(pos.x, pos.y, pos.z);

                const mixer = new THREE.AnimationMixer(archer);
                // Find shoot animation - assuming name contains 'shoot' or 'attack'
                const shootClip = gltf.animations.find(a => a.name.toLowerCase().includes('shoot')) || gltf.animations[0];

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
            });
        });
    }

    // Camera/Movement Logic (Reusing simple FPS logic)
    camera.position.set(0, 1.8, 0);
    let moveF = false, moveB = false, moveL = false, moveR = false, yaw = 0, pitch = 0;

    document.addEventListener('keydown', (e) => {
        if (isGameOver) return;
        switch (e.code) {
            case 'KeyW': moveF = true; break;
            case 'KeyS': moveB = true; break;
            case 'KeyA': moveL = true; break;
            case 'KeyD': moveR = true; break;
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
            // Player Movement
            const dir = new THREE.Vector3();
            camera.getWorldDirection(dir);
            dir.y = 0;
            dir.normalize();
            const side = new THREE.Vector3().crossVectors(camera.up, dir).normalize();

            if (moveF) camera.position.addScaledVector(dir, 10 * delta);
            if (moveB) camera.position.addScaledVector(dir, -10 * delta);
            if (moveL) camera.position.addScaledVector(side, 10 * delta);
            if (moveR) camera.position.addScaledVector(side, -10 * delta);

            camera.rotation.set(pitch, yaw, 0, 'YXZ');
        }

        if (zoroMixer) zoroMixer.update(delta);

        // Archer AI and Arrows
        const now = Date.now();
        archers.forEach(archer => {
            if (archer.isDead) return;
            archer.mixer.update(delta);

            const dist = archer.mesh.position.distanceTo(camera.position);
            if (dist < 40 && now - archer.lastShot > 3000) {
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
            arrow.mesh.position.addScaledVector(arrow.dir, 25 * delta);

            // Collision with player
            const distToPlayer = arrow.mesh.position.distanceTo(camera.position);
            if (distToPlayer < 1.5) {
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

    showNotification("THE CAVE ARE FULL OF ARCHERS! FIGHT THROUGH!");
    updateHPBar();
}
