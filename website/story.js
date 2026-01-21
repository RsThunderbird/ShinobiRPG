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
    forestMusic: 'assets/bgmusicstatic.mp3',
    watchtowerModel: 'assets/wt.glb'
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
    document.getElementById('compass-container').style.display = 'flex';
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
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.012);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.2)); // Very conservative for mobile
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
    sunLight.position.set(100, 200, 100);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 512; // Lower for performance
    sunLight.shadow.mapSize.height = 512;
    sunLight.shadow.camera.left = -300;
    sunLight.shadow.camera.right = 300;
    sunLight.shadow.camera.top = 300;
    sunLight.shadow.camera.bottom = -300;
    scene.add(sunLight);

    // Natural Terrain
    function getTerrainHeight(x, z) {
        return Math.sin(x * 0.05) * Math.cos(z * 0.05) * 2 +
            Math.sin(x * 0.02) * 5 +
            Math.cos(z * 0.02) * 5;
    }

    const groundSize = 1000;
    const segments = 80; // Lowered for performance
    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize, segments, segments);
    const vertices = groundGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
        vertices[i + 2] = getTerrainHeight(vertices[i], vertices[i + 1]);
    }
    groundGeometry.computeVertexNormals();

    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5a27 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Clouds
    function createCloud(x, y, z) {
        const group = new THREE.Group();
        const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
        for (let i = 0; i < 3; i++) {
            const geo = new THREE.SphereGeometry(10 + Math.random() * 5, 6, 6);
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(i * 12, 0, 0);
            group.add(mesh);
        }
        group.position.set(x, y, z);
        scene.add(group);
    }
    for (let i = 0; i < 10; i++) createCloud((Math.random() - 0.5) * 1000, 150, (Math.random() - 0.5) * 1000);

    // Trees
    function createTree(x, z) {
        const group = new THREE.Group();
        const scale = 0.8 + Math.random() * 1.5;
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3 * scale, 0.5 * scale, 10 * scale, 8), new THREE.MeshLambertMaterial({ color: 0x2d1b0f }));
        trunk.position.y = 5 * scale; trunk.castShadow = true; group.add(trunk);
        const leaves = new THREE.Mesh(new THREE.DodecahedronGeometry(4 * scale, 0), new THREE.MeshLambertMaterial({ color: 0x1a4d1a }));
        leaves.position.y = 10 * scale; leaves.castShadow = true; group.add(leaves);
        group.position.set(x, getTerrainHeight(x, z), z);
        scene.add(group);
    }

    for (let i = 0; i < 200; i++) {
        const x = (Math.random() - 0.5) * 800, z = (Math.random() - 0.5) * 800;
        if (Math.abs(x) > 30 || Math.abs(z) > 30) createTree(x, z);
    }

    // Flowers
    function createFlower(x, z) {
        const color = [0xffffff, 0xffeb3b, 0xf44336][Math.floor(Math.random() * 3)];
        const y = getTerrainHeight(x, z);
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4, 4), new THREE.MeshLambertMaterial({ color: 0x4caf50 }));
        stem.position.set(x, y + 0.2, z); scene.add(stem);
        const pedal = new THREE.Mesh(new THREE.SphereGeometry(0.15, 5, 5), new THREE.MeshLambertMaterial({ color: color }));
        pedal.position.set(x, y + 0.4, z); scene.add(pedal);
    }
    for (let i = 0; i < 50; i++) createFlower((Math.random() - 0.5) * 150, (Math.random() - 0.5) * 150);

    // Watchtower
    const outpostPos = new THREE.Vector3(200, 0, -200);
    outpostPos.y = getTerrainHeight(outpostPos.x, outpostPos.z);

    const loader = new THREE.GLTFLoader();
    loader.load(assets.watchtowerModel, (gltf) => {
        const model = gltf.scene;
        model.scale.set(5, 5, 5);
        model.position.copy(outpostPos);
        model.traverse(n => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; } });
        scene.add(model);

        // Simplified torches
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const tx = outpostPos.x + Math.cos(angle) * 8;
            const tz = outpostPos.z + Math.sin(angle) * 8;
            const ty = getTerrainHeight(tx, tz) + 2;

            const torch = new THREE.PointLight(0xffaa44, 2, 15);
            torch.position.set(tx, ty, tz);
            scene.add(torch);

            const torchMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2, 4), new THREE.MeshLambertMaterial({ color: 0x444444 }));
            torchMesh.position.set(tx, ty - 1, tz);
            scene.add(torchMesh);
        }
    }, undefined, (err) => console.error("Error loading watchtower:", err));

    // Guardian NPC (Cylinder for compatibility)
    const gGroup = new THREE.Group();
    const gBody = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.5, 8), new THREE.MeshLambertMaterial({ color: 0x2196f3 }));
    gBody.position.y = 0.75; gGroup.add(gBody);
    const gHead = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), new THREE.MeshLambertMaterial({ color: 0xffccbc }));
    gHead.position.y = 1.7; gGroup.add(gHead);
    gGroup.position.set(outpostPos.x + 10, outpostPos.y, outpostPos.z + 10);
    scene.add(gGroup);

    camera.position.set(0, 10, 20);
    let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
    let isRunning = false, canJump = true, velocity = new THREE.Vector3(), playerHeight = 2.0;
    let yaw = 0, pitch = 0;

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

    function checkInteraction() {
        const d = camera.position.distanceTo(gGroup.position);
        if (d < 8) {
            showNarrative("Guardian: Greetings! Follow the compass to find the watchtower. Be safe.", [{ text: "Okay", action: () => { } }]);
        }
    }

    // Mobile controls
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
        document.getElementById('mobile-controls').style.display = 'block';
        const jc = document.getElementById('joystick-container'), jo = document.getElementById('joystick');
        let jAct = false, tsX, tsY;

        jc.addEventListener('touchstart', (e) => {
            jAct = true; const t = e.touches[0], r = jc.getBoundingClientRect();
            tsX = r.left + r.width / 2; tsY = r.top + r.height / 2; e.preventDefault();
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            if (!jAct) return;
            const t = Array.from(e.touches).find(t => { const r = jc.getBoundingClientRect(); return t.clientX > r.left - 50 && t.clientX < r.right + 50 && t.clientY > r.top - 50 && t.clientY < r.bottom + 50; }) || e.touches[0];
            const dx = t.clientX - tsX, dy = t.clientY - tsY, ds = Math.sqrt(dx * dx + dy * dy), max = 40;
            const a = Math.atan2(dy, dx), mx = Math.min(ds, max) * Math.cos(a), my = Math.min(ds, max) * Math.sin(a);
            jo.style.transform = `translate(calc(-50% + ${mx}px), calc(-50% + ${my}px))`;
            moveForward = my < -10; moveBackward = my > 10; moveLeft = mx < -10; moveRight = mx > 10;
        }, { passive: false });

        window.addEventListener('touchend', () => { if (!jAct) return; jAct = false; jo.style.transform = 'translate(-50%, -50%)'; moveForward = moveBackward = moveLeft = moveRight = false; });
        document.getElementById('jump-btn').addEventListener('touchstart', (e) => { if (canJump) { velocity.y = 15; canJump = false; } e.preventDefault(); }, { passive: false });
        document.getElementById('run-btn').addEventListener('touchstart', (e) => { isRunning = true; e.preventDefault(); }, { passive: false });
        document.getElementById('run-btn').addEventListener('touchend', (e) => { isRunning = false; e.preventDefault(); }, { passive: false });

        let ltX, ltY, loId = null;
        window.addEventListener('touchstart', (e) => { for (let i = 0; i < e.changedTouches.length; i++) { const t = e.changedTouches[i]; if (t.clientX > window.innerWidth / 2) { loId = t.identifier; ltX = t.clientX; ltY = t.clientY; } } });
        window.addEventListener('touchmove', (e) => { for (let i = 0; i < e.changedTouches.length; i++) { const t = e.changedTouches[i]; if (t.identifier === loId) { yaw -= (t.clientX - ltX) * 0.005; pitch -= (t.clientY - ltY) * 0.005; pitch = Math.max(-1.4, Math.min(1.4, pitch)); ltX = t.clientX; ltY = t.clientY; } } });
        window.addEventListener('touchend', (e) => { for (let i = 0; i < e.changedTouches.length; i++) if (e.changedTouches[i].identifier === loId) loId = null; if (camera.position.distanceTo(gGroup.position) < 15) checkInteraction(); });
    }

    document.addEventListener('mousemove', (e) => { if (document.pointerLockElement === renderer.domElement) { yaw -= e.movementX * 0.002; pitch -= e.movementY * 0.002; pitch = Math.max(-1.4, Math.min(1.4, pitch)); } });
    renderer.domElement.addEventListener('click', () => { if (!/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) renderer.domElement.requestPointerLock(); checkInteraction(); });

    const clock = new THREE.Clock(), compassPtr = document.getElementById('compass-pointer'), distTxt = document.getElementById('distance-text');

    function animate() {
        requestAnimationFrame(animate);
        const delta = Math.min(clock.getDelta(), 0.1);
        let speed = isRunning ? 0.6 : 0.3;
        const dir = new THREE.Vector3(); camera.getWorldDirection(dir); dir.y = 0; dir.normalize();
        const side = new THREE.Vector3().crossVectors(camera.up, dir).normalize();
        const mVec = new THREE.Vector3();
        if (moveForward) mVec.add(dir); if (moveBackward) mVec.addScaledVector(dir, -1);
        if (moveLeft) mVec.add(side); if (moveRight) mVec.addScaledVector(side, -1);
        if (mVec.length() > 0) camera.position.addScaledVector(mVec.normalize(), speed);

        velocity.y -= 40 * delta; camera.position.y += velocity.y * delta;
        const tY = getTerrainHeight(camera.position.x, camera.position.z);
        if (camera.position.y < tY + playerHeight) { camera.position.y = tY + playerHeight; velocity.y = 0; canJump = true; }
        camera.rotation.set(pitch, yaw, 0, 'YXZ');

        // FIXED COMPASS MATH
        const dx = outpostPos.x - camera.position.x, dz = outpostPos.z - camera.position.z;
        const angleToTarget = Math.atan2(dx, -dz);
        const relAngle = angleToTarget + yaw;
        if (compassPtr) compassPtr.style.transform = `translate(-50%, -50%) rotate(${relAngle}rad)`;
        if (distTxt) distTxt.innerText = Math.floor(camera.position.distanceTo(outpostPos)) + "m";

        renderer.render(scene, camera);
    }

    setTimeout(() => {
        if (loadingScreen) {
            gsap.to(loadingScreen, {
                opacity: 0,
                duration: 1.5,
                onComplete: () => {
                    loadingScreen.style.display = 'none';
                    forestMusic.play();
                    showNarrative("You've entered the forest. Follow the compass to find the Watchtower.", [{ text: "Explore", action: () => { } }]);
                }
            });
        }
    }, 4000);

    animate();
}
