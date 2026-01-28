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

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
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

    function createRock(x, y, z, scale = 2) {
        const geo = new THREE.DodecahedronGeometry(scale, 0);
        const mesh = new THREE.Mesh(geo, rockMat);
        mesh.position.set(x, y, z);
        mesh.rotation.set(Math.random(), Math.random(), Math.random());
        scene.add(mesh);
        return mesh;
    }

    // Build the "Intro Chamber"
    for (let i = 0; i < 60; i++) {
        const angle = (i / 60) * Math.PI * 2;
        const r = 12 + Math.random() * 2;
        createRock(Math.cos(angle) * r, Math.random() * 8, Math.sin(angle) * r, 3 + Math.random() * 2);
    }

    // --- TUNNEL OPENINGS ---
    // Markers for paths
    const createMarkerText = (text, x, z, color) => {
        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 256;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = color; ctx.font = 'bold 80px Cinzel'; ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 10;
        ctx.fillText(text, 256, 128);
        const tex = new THREE.CanvasTexture(canvas);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex }));
        sprite.position.set(x, 4, z); sprite.scale.set(6, 3, 1);
        scene.add(sprite);

        // Add a glowing light under the marker
        const light = new THREE.PointLight(color === '#00ff00' ? 0x00ff00 : 0xff0000, 1, 10);
        light.position.set(x, 0.5, z);
        scene.add(light);
    };

    createMarkerText("EXIT PATH", -8, -10, '#00ff00');
    createMarkerText("DEAD END", 8, -10, '#ff0000');

    // Tunnels Construction
    // Left Path (Correct)
    for (let i = 0; i < 30; i++) {
        createRock(-12, Math.random() * 10, -10 - i * 3, 5);
        createRock(-4, Math.random() * 10, -10 - i * 3, 5);
        // Roof and floor rocks
        createRock(-8, 8, -10 - i * 3, 4);
        createRock(-8, -1, -10 - i * 3, 2);
    }
    // Right Path (Dead End)
    for (let i = 0; i < 15; i++) {
        createRock(4, Math.random() * 10, -10 - i * 3, 5);
        createRock(12, Math.random() * 10, -10 - i * 3, 5);
        if (i >= 12) createRock(8, 2, -10 - i * 3, 8); // Blockage
    }

    // --- INVISIBLE BORDERS ---
    const borderMat = new THREE.MeshBasicMaterial({ visible: false });
    function addWall(x, z, w, d, rotY = 0) {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 20, d), borderMat);
        wall.position.set(x, 5, z);
        wall.rotation.y = rotY;
        scene.add(wall);
    }

    // Intro Chamber Borders
    addWall(0, 15, 30, 2); // South
    addWall(-15, 0, 2, 30); // West
    addWall(15, 0, 2, 30); // East

    // Tunnel Walls (Left)
    addWall(-3, -50, 2, 100);
    addWall(-14, -50, 2, 100);

    // --- MOVEMENT ---
    camera.position.set(0, 1.8, 8);
    let moveF = false, moveB = false, moveL = false, moveR = false, running = false, canMove = true;
    let yaw = 0, pitch = 0;
    const velocity = new THREE.Vector3();
    const playerHeight = 1.8;

    const onKeyDown = (e) => {
        if (!canMove) return;
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

    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === renderer.domElement && canMove) {
            yaw -= e.movementX * 0.002;
            pitch -= e.movementY * 0.002;
            pitch = Math.max(-1.4, Math.min(1.4, pitch));
        }
    });

    renderer.domElement.addEventListener('click', () => {
        if (!document.pointerLockElement) {
            renderer.domElement.requestPointerLock();
        } else if (movementPhase === 'VINES') {
            performVineAction();
        }
    });

    // --- PROGRESSION ---
    let pathTriggered = false;
    let movementPhase = 'START'; // START, WALK, VINES

    function triggerPath(side) {
        if (pathTriggered) return;
        pathTriggered = true;

        if (side === 'right') {
            if (typeof showNarrative === 'function') {
                showNarrative("This path is blocked by ancient boulders. You need to find another way.", [
                    {
                        text: "Go back", action: () => {
                            camera.position.set(0, 1.8, 5);
                            pathTriggered = false;
                        }
                    }
                ]);
            }
        } else {
            // Correct Path
            canMove = false;
            if (typeof showNarrative === 'function') {
                showNarrative("You venture deeper into the left tunnel...", []);
            }
            gsap.to(camera.position, {
                x: -8, z: -25, duration: 4, onComplete: () => {
                    if (typeof startBatsMinigame === 'function') {
                        startBatsMinigame();
                    }
                }
            });
        }
    }

    // Global hook for story.js to call
    window.startCaveWalkPhase = function () {
        movementPhase = 'WALK';
        canMove = true;
        pathTriggered = false;
        camera.position.set(-8, 1.8, -40);
        showNotification("Something is flickering in the distance. Move forward.");

        // Extend the cave walk section significantly
        const walkLength = 400;
        for (let i = 0; i < 150; i++) {
            const z = -50 - Math.random() * walkLength;
            createRock(-13 + (Math.random() - 0.5) * 4, Math.random() * 10, z, 5);
            createRock(-3 + (Math.random() - 0.5) * 4, Math.random() * 10, z, 5);

            // Add glowing mushrooms to guide
            if (i % 10 === 0) {
                const light = new THREE.PointLight(0x00ffaa, 1, 15);
                light.position.set(-8, 0.5, z);
                scene.add(light);
                const mush = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.2, 0.5), new THREE.MeshLambertMaterial({ color: 0x00ffaa, emissive: 0x004433 }));
                mush.position.set(-8 + (Math.random() - 0.5) * 4, 0.25, z);
                scene.add(mush);
            }
        }

        // Add end-of-walk walls
        addWall(-8, -460, 20, 2);
    };

    // --- VINES MINIGAME REDESIGN ---
    const vinesGroup = new THREE.Group();
    scene.add(vinesGroup);
    let vinesLeft = 15;

    function initVinesPhase() {
        canMove = false;
        movementPhase = 'VINES';

        // Camera looks at the blocked exit
        camera.position.set(-8, 1.8, -445);
        camera.rotation.set(0, yaw, 0);

        // Visual exit (forest light)
        const exitLight = new THREE.PointLight(0x87ceeb, 10, 60);
        exitLight.position.set(-8, 3, -465);
        scene.add(exitLight);

        // Realistic thick vines
        const vineMat = new THREE.MeshLambertMaterial({ color: 0x1a3300 });
        for (let i = 0; i < vinesLeft; i++) {
            const vine = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 8), vineMat);
            vine.position.set(-8 + (Math.random() - 0.5) * 6, 2, -455 + (Math.random() - 0.5) * 2);
            vine.rotation.z = (Math.random() - 0.5) * 0.8;
            vine.rotation.x = (Math.random() - 0.5) * 0.3;
            vine.userData.isVine = true;
            vinesGroup.add(vine);
        }

        showNarrative("The cave exit is choked with thick vines. Tear them down one by one.", []);
    }

    const raycaster = new THREE.Raycaster();
    function performVineAction() {
        if (movementPhase !== 'VINES') return;
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        const hits = raycaster.intersectObjects(vinesGroup.children);
        if (hits.length > 0) {
            const vine = hits[0].object;
            if (vine.userData.clearing) return;
            vine.userData.clearing = true;

            gsap.to(vine.position, {
                y: -10,
                duration: 0.8,
                ease: "power2.in",
                onComplete: () => {
                    vine.visible = false;
                    vinesLeft--;
                    if (vinesLeft === 0) {
                        finishCave();
                    }
                }
            });
        }
    }

    function finishCave() {
        showNarrative("The path is clear. Sunlight floods into the tunnel.", [
            {
                text: "Step into the Forest", action: () => {
                    if (typeof startForestStage === 'function') startForestStage();
                }
            }
        ]);
    }

    // --- ANIMATION LOOP ---
    function animate() {
        if (window.currentStage !== 'cave') return;
        requestAnimationFrame(animate);

        if (canMove) {
            const delta = 0.016;
            const speed = running ? 0.25 : 0.12;

            const dir = new THREE.Vector3(); camera.getWorldDirection(dir); dir.y = 0; dir.normalize();
            const side = new THREE.Vector3().crossVectors(camera.up, dir).normalize();
            const move = new THREE.Vector3();
            if (moveF) move.add(dir); if (moveB) move.addScaledVector(dir, -1);
            if (moveL) move.add(side); if (moveR) move.addScaledVector(side, -1);

            if (move.length() > 0) {
                const nextPos = camera.position.clone().addScaledVector(move.normalize(), speed);

                // Boundaries based on phase
                if (movementPhase === 'START') {
                    // Check logic for tunnels
                    if (nextPos.z < -4) {
                        if (Math.abs(nextPos.x) > 2) camera.position.copy(nextPos);
                        else { /* hit pillar */ }
                    } else if (nextPos.length() < 18) {
                        camera.position.copy(nextPos);
                    }
                } else if (movementPhase === 'WALK') {
                    if (nextPos.x > -12 && nextPos.x < -4 && nextPos.z > -455) {
                        camera.position.copy(nextPos);
                    }
                }
            }

            // Phase Transitions
            if (movementPhase === 'START' && camera.position.z < -6) {
                if (camera.position.x < -2) triggerPath('left');
                else if (camera.position.x > 2) triggerPath('right');
            }

            if (movementPhase === 'WALK' && camera.position.z < -440) {
                initVinesPhase();
            }
        }

        camera.rotation.set(pitch, yaw, 0, 'YXZ');
        renderer.render(scene, camera);
    }
    animate();

    // --- INITIAL BLINK ---
    const eyelidsTop = document.querySelector('.eyelid.top');
    const eyelidsBottom = document.querySelector('.eyelid.bottom');
    const storyContainer = document.getElementById('story-container');

    // Start blurred and shut
    gsap.set(storyContainer, { filter: 'blur(20px)' });
    gsap.set([eyelidsTop, eyelidsBottom], { height: '50%' });

    setTimeout(() => {
        gsap.to(storyContainer, { filter: 'blur(0px)', duration: 4 });
        gsap.timeline()
            .to([eyelidsTop, eyelidsBottom], { height: '35%', duration: 1.5, repeat: 1, yoyo: true })
            .to([eyelidsTop, eyelidsBottom], { height: '0%', duration: 3, ease: "power2.out" })
            .add(() => {
                if (typeof showNarrative === 'function') {
                    showNarrative("You wake up with a pounding headache. Two tunnels lie ahead. Choose wisely.", []);
                }
            });
    }, 1500);

    // Resize handler
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

window.initThreeCave = initThreeCave;
