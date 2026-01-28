/**
 * cave.js - 3D Cave environment and main story progression
 */

function initThreeCave() {
    const container = document.getElementById('three-container');
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // --- SETUP SCENE ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050005); // Very dark purple/black
    scene.fog = new THREE.FogExp2(0x050005, 0.05);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    window.caveCamera = camera;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lights - Dim and moody
    const ambientLight = new THREE.AmbientLight(0x221133, 0.5);
    scene.add(ambientLight);

    const spotLight = new THREE.PointLight(0xaa00ff, 2, 20);
    spotLight.position.set(0, 5, 0);
    scene.add(spotLight);

    // --- CAVE GEOMETRY ---
    // Floor
    const floorGeo = new THREE.PlaneGeometry(100, 100, 20, 20);
    // Add some noise to the floor
    const posAttr = floorGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
        posAttr.setZ(i, Math.random() * 0.5);
    }
    floorGeo.computeVertexNormals();
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Walls (Using a large cylinder or custom meshes)
    const caveGroup = new THREE.Group();
    scene.add(caveGroup);

    function createRock(x, y, z, scale = 1, color = 0x222222) {
        const geo = new THREE.DodecahedronGeometry(scale, 0);
        const mat = new THREE.MeshLambertMaterial({ color: color });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        mesh.rotation.set(Math.random(), Math.random(), Math.random());
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        caveGroup.add(mesh);
        return mesh;
    }

    // Build cave walls roughly matching the image
    for (let i = 0; i < 100; i++) {
        const angle = (i / 100) * Math.PI * 2;
        const r = 10 + Math.random() * 2;
        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r;
        // Don't block the tunnels
        if (Math.abs(x) < 4 && z < 0) continue;
        createRock(x, Math.random() * 10, z, 2 + Math.random() * 3);
    }

    // Archways for Tunnels
    function createArchway(x, z, color = 0x333333) {
        const group = new THREE.Group();
        for (let i = 0; i < 8; i++) {
            const angle = (i / 7) * Math.PI;
            const rx = Math.cos(angle) * 3;
            const ry = Math.sin(angle) * 3;
            const rock = createRock(rx, ry, 0, 1.2, color);
            group.add(rock);
        }
        group.position.set(x, 1, z);
        scene.add(group);
    }

    createArchway(-10, -5); // Left
    createArchway(10, -5);  // Right

    // Tunnels
    // Left Tunnel
    for (let i = 0; i < 150; i++) { // Much longer tunnel
        createRock(-7 - Math.random() * 2, Math.random() * 8, -5 - i, 3);
        createRock(-13 - Math.random() * 2, Math.random() * 8, -5 - i, 3);

        // Ceiling rocks
        if (i % 2 === 0) createRock(-10 + (Math.random()-0.5)*4, 7 + Math.random()*2, -5 - i, 3);

        // Add some green "vines" hanging
        if (i < 20 && i % 5 === 0) {
            const vine = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 5), new THREE.MeshLambertMaterial({ color: 0x1a4d1a }));
            vine.position.set(-10, 5, -5 - i);
            caveGroup.add(vine);
        }
    }
    // Right Tunnel (Dead end)
    for (let i = 0; i < 20; i++) {
        createRock(8 + Math.random() * 2, Math.random() * 8, -5 - i, 3);
        createRock(12 + Math.random() * 2, Math.random() * 8, -5 - i, 3);
        if (i === 19) createRock(10, 4, -5-i, 5); // Block it
    }

    // Glowing Mushrooms
    function createMushroom(x, z) {
        const group = new THREE.Group();
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.2), new THREE.MeshLambertMaterial({ color: 0xcccccc }));
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0xaa00ff, emissive: 0x440066 }));
        cap.position.y = 0.1;
        group.add(stem);
        group.add(cap);
        group.position.set(x, 0.1, z);
        scene.add(group);

        const light = new THREE.PointLight(0xaa00ff, 0.5, 2);
        light.position.set(x, 0.5, z);
        scene.add(light);
    }

    for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = 5 + Math.random() * 4;
        createMushroom(Math.cos(angle) * r, Math.sin(angle) * r);
    }

    // Floating Particles
    const partGeo = new THREE.BufferGeometry();
    const partCount = 200;
    const posArray = new Float32Array(partCount * 3);
    for (let i = 0; i < partCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 40;
    }
    partGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const partMat = new THREE.PointsMaterial({ color: 0xaa00ff, size: 0.05, transparent: true, opacity: 0.6 });
    const particles = new THREE.Points(partGeo, partMat);
    scene.add(particles);

    // --- MOVEMENT ---
    camera.position.set(0, 1.6, 5);
    let moveF = false, moveB = false, moveL = false, moveR = false, running = false, velocity = new THREE.Vector3(), canJump = true, playerHeight = 1.6, yaw = 0, pitch = 0;

    const onKeyDown = (e) => {
        switch (e.code) {
            case 'KeyW': moveF = true; break;
            case 'KeyS': moveB = true; break;
            case 'KeyA': moveL = true; break;
            case 'KeyD': moveR = true; break;
            case 'ShiftLeft': running = true; break;
        }
    };
    const onKeyUp = (e) => {
        switch (e.code) {
            case 'KeyW': moveF = false; break;
            case 'KeyS': moveB = false; break;
            case 'KeyA': moveL = false; break;
            case 'KeyD': moveR = false; break;
            case 'ShiftLeft': running = false; break;
        }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    if (isMobile) {
        // Assume mobile controls are handled by story.html UI if present,
        // but for now let's just use click to move forward as a fallback
    }

    function animate() {
        if (window.currentStage !== 'cave') return;
        requestAnimationFrame(animate);
        const delta = 0.016; // approx

        let s = running ? 0.15 : 0.07;
        const dir = new THREE.Vector3(); camera.getWorldDirection(dir); dir.y = 0; dir.normalize();
        const side = new THREE.Vector3().crossVectors(camera.up, dir).normalize();
        const m = new THREE.Vector3();
        if (moveF) m.add(dir); if (moveB) m.addScaledVector(dir, -1);
        if (moveL) m.add(side); if (moveR) m.addScaledVector(side, -1);

        if (m.length() > 0) {
            const nextPos = camera.position.clone().addScaledVector(m.normalize(), s);

            // Invisible Boundaries & Tunnel Constraints
            let allowed = true;
            if (nextPos.z > 8) allowed = false; // Back wall

            if (nextPos.z < -2) {
                // Inside Tunnels
                if (nextPos.x < -13 || nextPos.x > 13) allowed = false; // Outer walls
                if (nextPos.x > -7 && nextPos.x < 7) allowed = false; // Inner walls
            } else {
                // Main Chamber
                if (nextPos.x * nextPos.x + nextPos.z * nextPos.z > 144) allowed = false;
            }

            if (allowed) camera.position.copy(nextPos);
        }

        camera.rotation.set(pitch, yaw, 0, 'YXZ');

        // Check for Tunnel Selection
        if (!pathTriggered && camera.position.z < -2) {
            if (camera.position.x < -5) {
                triggerPath('left');
            } else if (camera.position.x > 5) {
                triggerPath('right');
            }
        }

        // Check for Vines End
        if (vinesActive && camera.position.z < -140) {
            // Player reached the vines
            stopWalkingToVines();
        }

        renderer.render(scene, camera);
    }

    let pathTriggered = false;
    let vinesActive = false;
    let vinesGroup;

    function triggerPath(side) {
        if (pathTriggered) return;
        pathTriggered = true;

        if (side === 'right') {
            if (typeof showNarrative === 'function') {
                showNarrative("This path seems to be a dead end. Better go the other way.", [
                    {
                        text: "Go back", action: () => {
                            camera.position.set(0, 1.6, 2);
                            pathTriggered = false;
                        }
                    }
                ]);
            }
        } else {
            // Left Path - Correct one
            if (typeof showNarrative === 'function') {
                showNarrative("You venture deeper into the left tunnel...", []);
            }
            gsap.to(camera.position, {
                z: -25, duration: 3, onComplete: () => {
                    if (typeof startBatsMinigame === 'function') {
                        startBatsMinigame();
                    }
                }
            });
        }
    }

    window.startCaveWalkPhase = function() {
        vinesActive = true;
        if (typeof showNarrative === 'function') {
            showNarrative("The bats are gone. The exit should be just ahead. Keep walking.", []);
        }

        // Add Vines at the end of the tunnel (-150)
        vinesGroup = new THREE.Group();
        scene.add(vinesGroup);

        for (let i = 0; i < 12; i++) {
            const vineGeo = new THREE.CylinderGeometry(0.15, 0.1, 8, 5);
            const vineMat = new THREE.MeshLambertMaterial({ color: 0x1a4d1a });
            const vine = new THREE.Mesh(vineGeo, vineMat);

            // Randomize position across the tunnel mouth at z = -148
            vine.position.set(-10 + (Math.random() - 0.5) * 4, 3, -148 + (Math.random()-0.5)*2);
            vine.rotation.set((Math.random()-0.5)*0.5, 0, (Math.random()-0.5)*0.5);
            vine.userData.isVine = true;
            vinesGroup.add(vine);
        }

        // Add some light at the exit
        const exitLight = new THREE.PointLight(0x87ceeb, 5, 20);
        exitLight.position.set(-10, 5, -155);
        scene.add(exitLight);

        // Forest preview plane
        const forestGeo = new THREE.PlaneGeometry(20, 20);
        const forestMat = new THREE.MeshBasicMaterial({ color: 0x2d5a27 }); // Green placeholder
        const forestPlane = new THREE.Mesh(forestGeo, forestMat);
        forestPlane.position.set(-10, 5, -158);
        scene.add(forestPlane);
    };

    let vinesReached = false;
    function stopWalkingToVines() {
        if (vinesReached) return;
        vinesReached = true;
        if (typeof showNarrative === 'function') {
            showNarrative("The exit is blocked by thick vines! You'll have to remove them one by one.", []);
        }
    }
    window.stopWalkingToVines = stopWalkingToVines;

    const raycaster = new THREE.Raycaster();
    function performAction() {
        if (!vinesActive || !vinesReached) return;
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        const intersects = raycaster.intersectObjects(vinesGroup.children);
        if (intersects.length > 0) {
            const vine = intersects[0].object;
            if (vine.userData.isVine) {
                gsap.to(vine.position, { y: -10, duration: 1, onComplete: () => {
                    vinesGroup.remove(vine);
                    if (vinesGroup.children.length === 0) {
                        finishCaveScene();
                    }
                }});
            }
        }
    }

    function finishCaveScene() {
        if (typeof showNarrative === 'function') {
            showNarrative("Finally... the air smells fresh. You step out of the cave.", [
                { text: "Exit Cave", action: () => {
                    if (typeof startForestStage === 'function') startForestStage();
                }}
            ]);
        }
    }

    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === renderer.domElement) {
            yaw -= e.movementX * 0.002;
            pitch -= e.movementY * 0.002;
            pitch = Math.max(-1.4, Math.min(1.4, pitch));
        }
    });
    renderer.domElement.addEventListener('click', () => {
        if (document.pointerLockElement !== renderer.domElement) {
            renderer.domElement.requestPointerLock();
        } else {
            performAction();
        }
    });

    // Opening Blinking Animation (Integrated)
    const eyelidsTop = document.querySelector('.eyelid.top');
    const eyelidsBottom = document.querySelector('.eyelid.bottom');
    const storyContainer = document.getElementById('story-container');

    gsap.timeline()
        .to([eyelidsTop, eyelidsBottom], { height: '35%', duration: 2, repeat: 1, yoyo: true })
        .to([eyelidsTop, eyelidsBottom], { height: '0%', duration: 3 })
        .to(storyContainer, { filter: 'blur(0px)', duration: 4 }, "-=2")
        .add(() => {
            if (typeof showNarrative === 'function') {
                showNarrative("You wake up in a damp, dark cave. Two tunnels lie ahead.", []);
            }
        });

    animate();
}

window.initThreeCave = initThreeCave;
