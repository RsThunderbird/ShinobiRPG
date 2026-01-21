document.addEventListener('DOMContentLoaded', () => {
    init();
});

const assets = {
    bat: 'https://i.postimg.cc/yNPHqWLC/image.png',
    cave: 'https://i.postimg.cc/3wBzWVMP/image.png',
    vines: 'https://i.postimg.cc/RCbGs9Qb/image.png',
    exit: 'https://i.postimg.cc/wjb0PzpB/image.png',
    walkingForward: 'https://i.postimg.cc/1zPM81Fp/image.png',
    vinesMinigameBg: 'https://i.postimg.cc/Hn5BJY6Q/image.png',
    walkingSound: 'https://assets.mixkit.co/sfx/preview/mixkit-footsteps-in-the-forest-ground-1230.mp3', // Placeholder
    forestMusic: 'assets/bgmusicstatic.mp3'
};

let currentStage = 'blinking';

function init() {
    startBlinkingAnimation();
    setupMobileFullScreen();
}

function setupMobileFullScreen() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
        document.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.error(`Error attempting to enable full-screen mode: ${err.message}`);
                });
            }
        }, { once: true });
    }
}

function startBlinkingAnimation() {
    const tl = gsap.timeline();
    const eyelidsTop = document.querySelector('.eyelid.top');
    const eyelidsBottom = document.querySelector('.eyelid.bottom');
    const storyContainer = document.getElementById('story-container');

    // Slower blinks as requested - significantly slower
    tl.to([eyelidsTop, eyelidsBottom], { height: '35%', duration: 3, repeat: 2, yoyo: true, ease: 'power1.inOut' })
        .to([eyelidsTop, eyelidsBottom], { height: '0%', duration: 4, ease: 'power2.inOut' })
        .to(storyContainer, { filter: 'blur(0px)', duration: 5 }, '-=2')
        .add(() => {
            showNarrative("You gradually open your eyes. You find yourself in the middle of a cave.", [
                {
                    text: "Look around", action: () => {
                        showNarrative("To your left and right, the cave splits. You need to decide to go left or right.", [
                            {
                                text: "Make a choice", action: () => {
                                    setupCaveChoice();
                                }
                            }
                        ]);
                    }
                }
            ]);
        });
}

function setupCaveChoice() {
    const leftExit = document.getElementById('exit-left');
    const rightExit = document.getElementById('exit-right');

    // Explicitly show cave stage
    document.getElementById('cave-stage').classList.add('active');

    leftExit.addEventListener('click', () => {
        handleChoice('left');
    }, { once: true });

    rightExit.addEventListener('click', () => {
        handleChoice('right');
    }, { once: true });
}

function handleChoice(choice) {
    if (choice === 'right') {
        showNarrative("You step into the suffocating darkness of the right tunnel. The air grows stale, and the walls close in until it is impossible to move forward. It is a dead end.", [
            {
                text: "Turn back", action: () => {
                    showNarrative("You carefully retrace your steps back to the main cavern, relieved to escape the crushing tight space.", [
                        { text: "Take the left path", action: () => handleChoice('left') }
                    ]);
                }
            }
        ]);
    } else {
        showNarrative("You choose the left path. The oxygen level is getting lower...", [
            { text: "Walk forward", action: () => startLeftCaveTransition() }
        ]);
    }
}

function showNarrative(text, buttons = []) {
    const box = document.getElementById('narrative-box');
    box.innerHTML = `<p class="narrative-text">${text}</p>`;

    const btnContainer = document.createElement('div');
    btnContainer.className = 'cta-buttons';
    btnContainer.style.marginTop = '30px';
    btnContainer.style.display = 'flex';
    btnContainer.style.gap = '15px';
    btnContainer.style.justifyContent = 'center';

    buttons.forEach(btn => {
        const b = document.createElement('button');
        b.innerText = btn.text;
        b.className = 'story-choice-btn'; // New class for clearer styling
        b.onclick = () => {
            box.style.display = 'none';
            btn.action();
        };
        btnContainer.appendChild(b);
    });

    box.appendChild(btnContainer);
    box.style.display = 'block';
}

function startLeftCaveTransition() {
    gsap.to('#cave-bg', {
        opacity: 0, duration: 1.5, onComplete: () => {
            const walkingSound = new Howl({
                src: [assets.walkingSound],
                volume: 0.5
            });
            walkingSound.play();

            showNarrative("Suddenly, You see alot of bats!", [
                {
                    text: "Prepare yourself!", action: () => {
                        document.getElementById('bats-minigame').classList.add('active');
                        startBatsMinigame();
                    }
                }
            ]);
        }
    });
}

function startBatsMinigame() {
    const container = document.getElementById('bats-container');
    const batsText = document.getElementById('bats-text');
    batsText.innerHTML = "CLEAR THE BATS BY CLICKING ON THEM!";

    let batsCleared = 0;
    const totalBats = 15;

    function spawnBat() {
        const bat = document.createElement('img');
        bat.src = assets.bat;
        bat.className = 'bat';
        bat.style.left = Math.random() * 80 + '%';
        bat.style.top = Math.random() * 80 + '%';

        bat.addEventListener('click', () => {
            bat.remove();
            batsCleared++;
            if (batsCleared >= totalBats) {
                finishBatsMinigame();
            } else {
                spawnBat(); // Spawn a new one to replace the cleared one until total is reached
            }
        }, { once: true });

        container.appendChild(bat);

        gsap.to(bat, {
            x: (Math.random() - 0.5) * 300,
            y: (Math.random() - 0.5) * 300,
            duration: 0.8 + Math.random(),
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });
    }

    for (let i = 0; i < 6; i++) {
        spawnBat();
    }
}

function finishBatsMinigame() {
    document.getElementById('bats-minigame').classList.remove('active');
    showNarrative("You clear the swarm of bats. You see the exit of the cave.", [
        { text: "Walk forward", action: () => walkingForwardEffect() }
    ]);
}

function walkingForwardEffect() {
    const caveBg = document.getElementById('cave-bg');
    caveBg.src = assets.walkingForward;
    caveBg.style.opacity = 1;

    gsap.to(caveBg, {
        scale: 2,
        opacity: 0,
        duration: 5,
        ease: 'power2.in',
        onComplete: () => {
            showNarrative("Massive vines have blocked the exit! You'll need to cut them.", [
                { text: "Cut the vines", action: () => startVinesMinigame() }
            ]);
        }
    });
}

function startVinesMinigame() {
    const stage = document.getElementById('vines-stage');
    document.querySelectorAll('.stage').forEach(s => s.classList.remove('active'));
    stage.classList.add('active');

    const canvas = document.getElementById('vines-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const exitImg = document.getElementById('exit-img');
    exitImg.src = assets.vinesMinigameBg;

    const vineImg = new Image();
    vineImg.src = assets.vines;

    let vines = [];
    vineImg.onload = () => {
        const rows = 5;
        const cols = 8;
        const vWidth = canvas.width / cols;
        const vHeight = canvas.height / rows;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                vines.push({
                    x: c * vWidth,
                    y: r * vHeight,
                    w: vWidth,
                    h: vHeight,
                    cleared: false
                });
            }
        }
        drawVines();
    };

    function drawVines() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        vines.forEach(v => {
            if (!v.cleared) {
                ctx.drawImage(vineImg, v.x, v.y, v.w, v.h);
            }
        });
    }

    let isDrawing = false;
    canvas.addEventListener('mousedown', () => isDrawing = true);
    window.addEventListener('mouseup', () => isDrawing = false);
    canvas.addEventListener('mousemove', (e) => {
        if (!isDrawing) return;
        checkSlash(e.clientX, e.clientY);
    });

    canvas.addEventListener('touchstart', (e) => {
        isDrawing = true;
        checkSlash(e.touches[0].clientX, e.touches[0].clientY);
    });
    window.addEventListener('touchend', () => isDrawing = false);
    canvas.addEventListener('touchmove', (e) => {
        if (!isDrawing) return;
        checkSlash(e.touches[0].clientX, e.touches[0].clientY);
    });

    function checkSlash(x, y) {
        let anyCleared = false;
        vines.forEach(v => {
            if (!v.cleared && x > v.x && x < v.x + v.w && y > v.y && y < v.y + v.h) {
                v.cleared = true;
                anyCleared = true;
            }
        });
        if (anyCleared) {
            drawVines();
            if (vines.every(v => v.cleared)) {
                finishVinesMinigame();
            }
        }
    }
}

function finishVinesMinigame() {
    showNarrative("Finally! The path is clear. You see a dense forest...", [
        { text: "Go", action: () => startForestStage() }
    ]);
}

function startForestStage() {
    document.querySelectorAll('.stage').forEach(s => s.classList.remove('active'));
    document.getElementById('forest-stage').classList.add('active');
    initThreeForest();
}

function initThreeForest() {
    const container = document.getElementById('three-container');
    const loadingScreen = document.getElementById('loading-screen');

    // Forest Music
    const forestMusic = new Howl({
        src: [assets.forestMusic],
        loop: true,
        volume: 0.4,
        autoplay: false
    });

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.015);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(100, 200, 100);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.left = -500;
    sunLight.shadow.camera.right = 500;
    sunLight.shadow.camera.top = 500;
    sunLight.shadow.camera.bottom = -500;
    sunLight.shadow.camera.far = 1000;
    scene.add(sunLight);

    // Natural Terrain
    const groundSize = 1000;
    const segments = 128;
    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize, segments, segments);

    // Add bumps/noise to terrain
    const vertices = groundGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const y = vertices[i + 1];
        // Simple noise logic
        vertices[i + 2] = getTerrainHeight(x, y);
    }
    groundGeometry.computeVertexNormals();

    const groundMaterial = new THREE.MeshLambertMaterial({
        color: 0x2d5a27,
        side: THREE.DoubleSide
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Helper function to get terrain height at (x, z)
    function getTerrainHeight(x, z) {
        return Math.sin(x * 0.05) * Math.cos(z * 0.05) * 2 +
            Math.sin(x * 0.02) * 5 +
            Math.cos(z * 0.02) * 5;
    }

    // Clouds
    function createCloud(x, y, z) {
        const group = new THREE.Group();
        const count = 3 + Math.floor(Math.random() * 4);
        const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });

        for (let i = 0; i < count; i++) {
            const geo = new THREE.SphereGeometry(10 + Math.random() * 10, 8, 8);
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(i * 15, Math.random() * 5, Math.random() * 10);
            group.add(mesh);
        }
        group.position.set(x, y, z);
        scene.add(group);
    }

    for (let i = 0; i < 20; i++) {
        createCloud(
            (Math.random() - 0.5) * 800,
            100 + Math.random() * 50,
            (Math.random() - 0.5) * 800
        );
    }

    // Trees
    function createTree(x, z) {
        const group = new THREE.Group();
        const scale = 0.8 + Math.random() * 2.5;
        const terrainY = getTerrainHeight(x, z);

        const trunkGeom = new THREE.CylinderGeometry(0.3 * scale, 0.5 * scale, 12 * scale, 8);
        const trunkMat = new THREE.MeshLambertMaterial({ color: 0x2d1b0f });
        const trunk = new THREE.Mesh(trunkGeom, trunkMat);
        trunk.position.y = 6 * scale;
        trunk.castShadow = true;
        group.add(trunk);

        const leavesGeom = new THREE.DodecahedronGeometry(5 * scale, 0);
        const leavesMat = new THREE.MeshLambertMaterial({ color: 0x1a4d1a });
        const leaves = new THREE.Mesh(leavesGeom, leavesMat);
        leaves.position.y = 12 * scale;
        leaves.castShadow = true;
        group.add(leaves);

        group.position.set(x, terrainY, z);
        scene.add(group);
    }

    // Flowers
    function createFlower(x, z) {
        const colors = [0xffffff, 0xffeb3b, 0xf44336, 0xe91e63];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const terrainY = getTerrainHeight(x, z);

        const stemGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.5);
        const stemMat = new THREE.MeshLambertMaterial({ color: 0x4caf50 });
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.set(x, terrainY + 0.25, z);
        scene.add(stem);

        const petalGeo = new THREE.SphereGeometry(0.2, 8, 8);
        const petalMat = new THREE.MeshLambertMaterial({ color: color });
        const pedal = new THREE.Mesh(petalGeo, petalMat);
        pedal.position.set(x, terrainY + 0.5, z);
        scene.add(pedal);
    }

    // Outpost & Guardian
    const outpostPos = new THREE.Vector3(250, 0, -250);
    outpostPos.y = getTerrainHeight(outpostPos.x, outpostPos.z);
    let guardianNPC;

    function createOutpost() {
        const group = new THREE.Group();

        // Base tower
        const baseGeo = new THREE.CylinderGeometry(4, 5, 20, 8);
        const woodMat = new THREE.MeshLambertMaterial({ color: 0x5d4037 });
        const base = new THREE.Mesh(baseGeo, woodMat);
        base.position.y = 10;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        // Platform
        const platGeo = new THREE.BoxGeometry(12, 1, 12);
        const plat = new THREE.Mesh(platGeo, woodMat);
        plat.position.y = 20;
        plat.castShadow = true;
        plat.receiveShadow = true;
        group.add(plat);

        // Roof
        const roofGeo = new THREE.ConeGeometry(8, 10, 4);
        const roofMat = new THREE.MeshLambertMaterial({ color: 0x3e2723 });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = 25;
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        group.add(roof);

        group.position.copy(outpostPos);
        scene.add(group);

        // Guardian NPC
        const gGroup = new THREE.Group();
        const bodyGeo = new THREE.CapsuleGeometry(0.4, 1, 4, 8);
        const bodyMat = new THREE.MeshLambertMaterial({ color: 0x2196f3 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 21.5;
        gGroup.add(body);

        const headGeo = new THREE.SphereGeometry(0.4, 8, 8);
        const headMat = new THREE.MeshLambertMaterial({ color: 0xffccbc });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 22.5;
        gGroup.add(head);

        gGroup.position.copy(outpostPos);
        gGroup.position.x += 2;
        scene.add(gGroup);
        guardianNPC = gGroup;
    }

    // Simple Pathways
    function createPathway() {
        // Just a series of flatter, brownish segments towards the outpost
        const points = [];
        const start = new THREE.Vector3(0, 0, 0);
        const end = outpostPos.clone();

        for (let i = 0; i <= 20; i++) {
            const t = i / 20;
            const p = new THREE.Vector3().lerpVectors(start, end, t);
            p.y = getTerrainHeight(p.x, p.z) + 0.1;

            const pathSegGeo = new THREE.CircleGeometry(4, 8);
            const pathMat = new THREE.MeshLambertMaterial({ color: 0x6d4c41, side: THREE.DoubleSide });
            const seg = new THREE.Mesh(pathSegGeo, pathMat);
            seg.position.copy(p);
            seg.rotation.x = -Math.PI / 2;
            scene.add(seg);

            // Add flowers near the path
            if (i % 2 === 0) {
                createFlower(p.x + 10 + Math.random() * 5, p.z + 5);
                createFlower(p.x - 10 - Math.random() * 5, p.z - 5);
            }
        }
    }

    createOutpost();
    createPathway();

    // Random trees (away from path)
    for (let i = 0; i < 400; i++) {
        const x = (Math.random() - 0.5) * 800;
        const z = (Math.random() - 0.5) * 800;
        // Don't place trees too close to center or outpost path
        if (Math.abs(x) > 20 || Math.abs(z) > 20) {
            createTree(x, z);
        }
    }

    camera.position.set(0, 10, 20);

    let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
    let isRunning = false;
    let canJump = true;
    let velocity = new THREE.Vector3();
    let playerHeight = 2.0;

    const onKeyDown = (e) => {
        switch (e.code) {
            case 'KeyW': moveForward = true; break;
            case 'KeyS': moveBackward = true; break;
            case 'KeyA': moveLeft = true; break;
            case 'KeyD': moveRight = true; break;
            case 'ShiftLeft': isRunning = true; break;
            case 'Space': if (canJump) { velocity.y = 15; canJump = false; } break;
            case 'KeyE': checkInteraction(); break;
        }
    };
    const onKeyUp = (e) => {
        switch (e.code) {
            case 'KeyW': moveForward = false; break;
            case 'KeyS': moveBackward = false; break;
            case 'KeyA': moveLeft = false; break;
            case 'KeyD': moveRight = false; break;
            case 'ShiftLeft': isRunning = false; break;
        }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // Interaction logic
    function checkInteraction() {
        const dist = camera.position.distanceTo(outpostPos);
        if (dist < 15) {
            showNarrative("Guardian: Hello there, traveler. Be careful in these woods.", [
                { text: "Continue", action: () => { } }
            ]);
        }
    }

    // Mobile controls logic
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
        document.getElementById('mobile-controls').style.display = 'block';
        const joystick = document.getElementById('joystick');
        const joystickContainer = document.getElementById('joystick-container');
        const jumpBtn = document.getElementById('jump-btn');
        const runBtn = document.getElementById('run-btn');

        let joystickActive = false;
        let touchStartX, touchStartY;

        // FIXED JOYSTICK LOGIC
        joystickContainer.addEventListener('touchstart', (e) => {
            joystickActive = true;
            const touch = e.touches[0];
            const rect = joystickContainer.getBoundingClientRect();
            touchStartX = rect.left + rect.width / 2;
            touchStartY = rect.top + rect.height / 2;
            e.preventDefault();
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            if (!joystickActive) return;
            const touch = Array.from(e.touches).find(t => {
                const rect = joystickContainer.getBoundingClientRect();
                return t.clientX > rect.left - 50 && t.clientX < rect.right + 50 &&
                    t.clientY > rect.top - 50 && t.clientY < rect.bottom + 50;
            }) || e.touches[0];

            const dx = touch.clientX - touchStartX;
            const dy = touch.clientY - touchStartY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxDist = 40;

            const angle = Math.atan2(dy, dx);
            const moveX = Math.min(dist, maxDist) * Math.cos(angle);
            const moveY = Math.min(dist, maxDist) * Math.sin(angle);

            joystick.style.transform = `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px))`;

            moveForward = moveY < -10;
            moveBackward = moveY > 10;
            moveLeft = moveX < -10;
            moveRight = moveX > 10;
        }, { passive: false });

        window.addEventListener('touchend', () => {
            if (!joystickActive) return;
            joystickActive = false;
            joystick.style.transform = 'translate(-50%, -50%)';
            moveForward = moveBackward = moveLeft = moveRight = false;
        });

        // Mobile Buttons
        if (jumpBtn) {
            jumpBtn.addEventListener('touchstart', (e) => {
                if (canJump) { velocity.y = 15; canJump = false; }
                e.preventDefault();
            }, { passive: false });
        }
        if (runBtn) {
            runBtn.addEventListener('touchstart', (e) => {
                isRunning = true;
                e.preventDefault();
            }, { passive: false });
            runBtn.addEventListener('touchend', (e) => {
                isRunning = false;
                e.preventDefault();
            }, { passive: false });
        }

        // Touch look - restricted to right side of screen
        let lastTouchX, lastTouchY;
        let lookTouchId = null;

        window.addEventListener('touchstart', (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                if (t.clientX > window.innerWidth / 2) {
                    lookTouchId = t.identifier;
                    lastTouchX = t.clientX;
                    lastTouchY = t.clientY;
                }
            }
        });

        window.addEventListener('touchmove', (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                if (t.identifier === lookTouchId) {
                    const dx = t.clientX - lastTouchX;
                    const dy = t.clientY - lastTouchY;

                    yaw -= dx * 0.005;
                    pitch -= dy * 0.005;
                    pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, pitch));

                    lastTouchX = t.clientX;
                    lastTouchY = t.clientY;
                }
            }
        });

        window.addEventListener('touchend', (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === lookTouchId) {
                    lookTouchId = null;
                }
            }
            // Double tap or click near outpost on mobile?
            if (camera.position.distanceTo(outpostPos) < 20) {
                checkInteraction();
            }
        });
    }

    let yaw = 0, pitch = 0;
    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === renderer.domElement) {
            yaw -= e.movementX * 0.002;
            pitch -= e.movementY * 0.002;
            pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, pitch));
        }
    });

    renderer.domElement.addEventListener('click', () => {
        if (!isMobile) renderer.domElement.requestPointerLock();
        checkInteraction(); // Also allow click to interact
    });

    const clock = new THREE.Clock();
    const compassPointer = document.getElementById('compass-pointer');
    const distanceText = document.getElementById('distance-text');

    function animate() {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();

        let speed = isRunning ? 0.6 : 0.3;

        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        direction.y = 0;
        direction.normalize();
        const side = new THREE.Vector3().crossVectors(camera.up, direction).normalize();

        const moveVec = new THREE.Vector3();
        if (moveForward) moveVec.add(direction);
        if (moveBackward) moveVec.addScaledVector(direction, -1);
        if (moveLeft) moveVec.add(side);
        if (moveRight) moveVec.addScaledVector(side, -1);

        if (moveVec.length() > 0) {
            moveVec.normalize();
            camera.position.addScaledVector(moveVec, speed);
        }

        // Gravity and Jump
        velocity.y -= 40 * delta; // Gravity
        camera.position.y += velocity.y * delta;

        const terrainY = getTerrainHeight(camera.position.x, camera.position.z);
        if (camera.position.y < terrainY + playerHeight) {
            camera.position.y = terrainY + playerHeight;
            velocity.y = 0;
            canJump = true;
        }

        camera.rotation.set(pitch, yaw, 0, 'YXZ');

        // Compass logic
        const playerPos = new THREE.Vector2(camera.position.x, camera.position.z);
        const targetPos = new THREE.Vector2(outpostPos.x, outpostPos.z);
        const dirToTarget = targetPos.clone().sub(playerPos);
        const angleToTarget = Math.atan2(dirToTarget.x, dirToTarget.y); // Note: Three.js coordinates

        // We need the angle relative to camera yaw
        const relativeAngle = angleToTarget + yaw;
        if (compassPointer) {
            compassPointer.style.transform = `translate(-50%, -50%) rotate(${relativeAngle}rad)`;
        }
        if (distanceText) {
            const d = Math.floor(camera.position.distanceTo(outpostPos));
            distanceText.innerText = d + "m";
        }

        renderer.render(scene, camera);
    }

    setTimeout(() => {
        gsap.to(loadingScreen, {
            opacity: 0, duration: 1.5, onComplete: () => {
                loadingScreen.style.display = 'none';
                forestMusic.play();
                showNarrative("You've entered the Forest. Follow the compass to find the Outpost. Press E or Click to interact with the Guardian.", [
                    { text: "Let's explore", action: () => { } }
                ]);
            }
        });
    }, 4000);

    animate();
}



