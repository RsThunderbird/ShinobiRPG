/**
 * cave.js - 3D Cave environment with traversal and minigame
 */

function initThreeCave() {
    const container = document.getElementById('three-container');
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // --- SETUP SCENE ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050005);
    scene.fog = new THREE.FogExp2(0x050005, 0.04);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x221133, 0.6);
    scene.add(ambientLight);

    const mainLight = new THREE.PointLight(0xaa00ff, 2, 30);
    mainLight.position.set(0, 5, 0);
    scene.add(mainLight);

    // --- CAVE GEOMETRY ---
    const rockMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const floorGeo = new THREE.PlaneGeometry(100, 200, 20, 20);
    const floor = new THREE.Mesh(floorGeo, rockMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    function createRock(x, y, z, scale = 2) {
        const geo = new THREE.DodecahedronGeometry(scale, 0);
        const mesh = new THREE.Mesh(geo, rockMat);
        mesh.position.set(x, y, z);
        mesh.rotation.set(Math.random(), Math.random(), Math.random());
        scene.add(mesh);
        return mesh;
    }

    // Build the "Intro Chamber"
    for (let i = 0; i < 40; i++) {
        const angle = (i / 40) * Math.PI * 2;
        const r = 12 + Math.random() * 2;
        createRock(Math.cos(angle) * r, Math.random() * 8, Math.sin(angle) * r, 3 + Math.random() * 2);
    }

    // --- TUNNEL OPENINGS ---
    // Left Tunnel (Valid)
    const leftMarker = createRock(-6, 1, -10, 1);
    leftMarker.material = new THREE.MeshLambertMaterial({ color: 0x00ff00, emissive: 0x004400 });

    // Right Tunnel (Dead End)
    const rightMarker = createRock(6, 1, -10, 1);
    rightMarker.material = new THREE.MeshLambertMaterial({ color: 0xff0000, emissive: 0x440000 });

    // Path indicators 2D
    const createMarkerText = (text, x, z) => {
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.font = 'bold 40px Cinzel'; ctx.textAlign = 'center';
        ctx.fillText(text, 128, 64);
        const tex = new THREE.CanvasTexture(canvas);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex }));
        sprite.position.set(x, 4, z); sprite.scale.set(4, 2, 1);
        scene.add(sprite);
    };
    createMarkerText("EXIT PATH", -6, -10);
    createMarkerText("DEAD END", 6, -10);

    // Actual Openings: Carve out space (visually we just don't put rocks there)
    // Left Path
    for (let i = 0; i < 20; i++) {
        createRock(-12, Math.random() * 8, -15 - i * 3, 4);
        createRock(-4, Math.random() * 8, -15 - i * 3, 4);
    }
    // Right Path
    for (let i = 0; i < 10; i++) {
        createRock(4, Math.random() * 8, -15 - i * 3, 4);
        createRock(12, Math.random() * 8, -15 - i * 3, 4);
        if (i === 9) createRock(8, 2, -15 - i * 3, 6); // Blockage
    }

    // --- MOVEMENT ---
    camera.position.set(0, 1.6, 5);
    let moveF = false, moveB = false, moveL = false, moveR = false, canMove = true;
    let yaw = 0, pitch = 0;
    const velocity = new THREE.Vector3();
    const playerHeight = 1.6;

    const onKeyDown = (e) => {
        if (!canMove) return;
        switch (e.code) {
            case 'KeyW': moveF = true; break;
            case 'KeyS': moveB = true; break;
            case 'KeyA': moveL = true; break;
            case 'KeyD': moveR = true; break;
        }
    };
    const onKeyUp = (e) => {
        switch (e.code) {
            case 'KeyW': moveF = false; break;
            case 'KeyS': moveB = false; break;
            case 'KeyA': moveL = false; break;
            case 'KeyD': moveR = false; break;
        }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === renderer.domElement && canMove) {
            yaw -= e.movementX * 0.002;
            pitch -= e.movementY * 0.002;
            pitch = Math.max(-1.4, Math.min(1.4, pitch));
        }
    });

    renderer.domElement.addEventListener('click', () => {
        renderer.domElement.requestPointerLock();
    });

    // --- PROGRESSION ---
    let pathTriggered = false;
    let movementPhase = 'START'; // START, TUNNEL, WALK, VINES

    function triggerPath(side) {
        if (pathTriggered) return;
        pathTriggered = true;

        if (side === 'right') {
            if (typeof showNarrative === 'function') {
                showNarrative("This path is blocked. You need to find another way.", [
                    { text: "Go back", action: () => { camera.position.set(0, 1.6, 2); pathTriggered = false; } }
                ]);
            }
        } else {
            // Correct Path
            canMove = false;
            gsap.to(camera.position, {
                x: -8, z: -25, duration: 4, onComplete: () => {
                    if (typeof startBatsMinigame === 'function') {
                        startBatsMinigame();
                    }
                }
            });
        }
    }

    // This is called after bats are cleared by story.js
    window.startCaveWalkPhase = function () {
        canMove = true;
        pathTriggered = false;
        movementPhase = 'WALK';
        camera.position.set(-8, 1.6, -30);
        showNotification("Something is flickering in the distance. Move forward.");

        // Add more rocks for the long walk
        for (let i = 0; i < 100; i++) {
            createRock(-15 + (Math.random() - 0.5) * 5, Math.random() * 8, -40 - i * 4, 6);
            createRock(-1 + (Math.random() - 0.5) * 5, Math.random() * 8, -40 - i * 4, 6);
        }

        // Add glowing mushrooms to lead the way
        for (let i = 0; i < 20; i++) {
            const light = new THREE.PointLight(0x00ffff, 1, 10);
            light.position.set(-8 + (Math.random() - 0.5) * 4, 0.5, -50 - i * 20);
            scene.add(light);
        }
    }

    // Final Vines Phase
    const vinesGroup = new THREE.Group();
    scene.add(vinesGroup);
    let vinesLeft = 15;

    function initVinesPhase() {
        canMove = false;
        movementPhase = 'VINES';
        camera.position.set(-8, 1.6, -450); // End of walk
        camera.lookAt(-8, 1.6, -500);

        // Forest light behind vines
        const forestLight = new THREE.PointLight(0x87ceeb, 5, 50);
        forestLight.position.set(-8, 2, -470);
        scene.add(forestLight);

        const vineMat = new THREE.MeshLambertMaterial({ color: 0x1a4d1a });
        for (let i = 0; i < vinesLeft; i++) {
            const vine = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 6), vineMat);
            vine.position.set(-8 + (Math.random() - 0.5) * 4, 1.5, -462 + (Math.random() - 0.5) * 1);
            vine.rotation.z = (Math.random() - 0.5) * 0.5;
            vine.userData.isVine = true;
            vinesGroup.add(vine);
        }

        showNarrative("The exit is completely blocked by thick vines. Tear them down one by one.", []);
    }

    const raycaster = new THREE.Raycaster();
    function performVineAction() {
        if (movementPhase !== 'VINES') return;
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        const hits = raycaster.intersectObjects(vinesGroup.children);
        if (hits.length > 0) {
            const vine = hits[0].object;
            gsap.to(vine.position, {
                y: -5, duration: 0.5, onComplete: () => {
                    vine.visible = false;
                    vinesLeft--;
                    if (vinesLeft === 0) finishCave();
                }
            });
        }
    }

    function finishCave() {
        showNarrative("The path is clear. You step out into the sunlight...", [
            { text: "Exit Cave", action: () => startForestStage() }
        ]);
    }

    // --- ANIMATION LOOP ---
    function animate() {
        if (window.currentStage !== 'cave') return;
        requestAnimationFrame(animate);

        if (canMove) {
            const delta = 0.016;
            const speed = 0.1; // Reduced speed as requested
            const dir = new THREE.Vector3(); camera.getWorldDirection(dir); dir.y = 0; dir.normalize();
            const side = new THREE.Vector3().crossVectors(camera.up, dir).normalize();
            const move = new THREE.Vector3();
            if (moveF) move.add(dir); if (moveB) move.addScaledVector(dir, -1);
            if (moveL) move.add(side); if (moveR) move.addScaledVector(side, -1);

            if (move.length() > 0) {
                const nextPos = camera.position.clone().addScaledVector(move.normalize(), speed);

                // Boundaries
                if (movementPhase === 'START') {
                    if (nextPos.length() < 20) camera.position.copy(nextPos);
                } else if (movementPhase === 'WALK') {
                    if (nextPos.x > -14 && nextPos.x < -2) camera.position.copy(nextPos);
                }
            }

            // Path Check
            if (movementPhase === 'START' && camera.position.z < -4) {
                if (camera.position.x < -2) triggerPath('left');
                else if (camera.position.x > 2) triggerPath('right');
            }

            // Walk End Check
            if (movementPhase === 'WALK' && camera.position.z < -450) {
                initVinesPhase();
            }
        }

        camera.rotation.set(pitch, yaw, 0, 'YXZ');
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('click', performVineAction);

    // Initial Blink
    const eyelidsTop = document.querySelector('.eyelid.top');
    const eyelidsBottom = document.querySelector('.eyelid.bottom');
    gsap.set([eyelidsTop, eyelidsBottom], { height: '50%' });

    setTimeout(() => {
        gsap.to(document.getElementById('story-container'), { filter: 'blur(0px)', duration: 3 });
        gsap.timeline()
            .to([eyelidsTop, eyelidsBottom], { height: '35%', duration: 1.5, repeat: 1, yoyo: true })
            .to([eyelidsTop, eyelidsBottom], { height: '0%', duration: 3, ease: "power2.out" })
            .add(() => {
                showNarrative("You wake up with a pounding headache. Two tunnels lie ahead. Choose wisely.", []);
            });
    }, 1000);
}

window.initThreeCave = initThreeCave;
