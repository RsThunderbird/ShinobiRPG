document.addEventListener('DOMContentLoaded', () => {
    init();
});

const assets = {
    bat: 'https://i.postimg.cc/yNPHqWLC/image.png',
    cave: 'https://i.postimg.cc/3wBzWVMP/image.png',
    vines: 'https://i.postimg.cc/RCbGs9Qb/image.png',
    exit: 'https://i.postimg.cc/wjb0PzpB/image.png',
    walkingSound: 'https://assets.mixkit.co/sfx/preview/mixkit-footsteps-in-the-forest-ground-1230.mp3' // Placeholder
};

let currentStage = 'blinking';

function init() {
    startBlinkingAnimation();
}

function startBlinkingAnimation() {
    const tl = gsap.timeline();
    const eyelidsTop = document.querySelector('.eyelid.top');
    const eyelidsBottom = document.querySelector('.eyelid.bottom');
    const storyContainer = document.getElementById('story-container');

    // Slower blinks as requested
    tl.to([eyelidsTop, eyelidsBottom], { height: '30%', duration: 1.5, repeat: 2, yoyo: true, ease: 'power1.inOut' })
        .to([eyelidsTop, eyelidsBottom], { height: '0%', duration: 2.5, ease: 'power2.inOut' })
        .to(storyContainer, { filter: 'blur(0px)', duration: 4 }, '-=1')
        .add(() => {
            showNarrative("You gradually open your eyes. The air is cold and damp. You find yourself at the mouth of a mysterious cave.", [
                {
                    text: "Look around", action: () => {
                        showNarrative("To your left and right, the cave splits. A faint light flickers from the left, while the right is shrouded in darkness.", [
                            {
                                text: "Continue", action: () => {
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
        showNarrative("You venture into the dark right path, but the tunnel narrows until it's impossible to pass. It's a dead end.", [
            {
                text: "Return to the split", action: () => {
                    showNarrative("You walk back to where you started. The left path still beckons.", [
                        { text: "Take the left path", action: () => handleChoice('left') }
                    ]);
                }
            }
        ]);
    } else {
        showNarrative("You choose the left path. The flickering light grows brighter as you descend deeper into the earth...", [
            { text: "Walk forward", action: () => startLeftCaveTransition() }
        ]);
    }
}

function showNarrative(text, buttons = []) {
    const box = document.getElementById('narrative-box');
    box.innerHTML = `<p class="narrative-text">${text}</p>`;

    const btnContainer = document.createElement('div');
    btnContainer.className = 'cta-buttons'; // Use landing page button styles if possible, or define in story.css
    btnContainer.style.marginTop = '20px';
    btnContainer.style.justifyContent = 'center';

    buttons.forEach(btn => {
        const b = document.createElement('button');
        b.innerText = btn.text;
        b.className = 'glass-btn';
        b.style.padding = '10px 20px';
        b.style.fontSize = '1rem';
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

            showNarrative("Suddenly, the ceiling begins to shake. Hundreds of wings flap in unison!", [
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
    showNarrative("The swarm disperses. You are exhausted but safe. Ahead, you see a strange green glow blocking the exit.", [
        { text: "Investigate the glow", action: () => walkingForwardEffect() }
    ]);
}

function walkingForwardEffect() {
    const caveBg = document.getElementById('cave-bg');
    caveBg.src = assets.cave;
    caveBg.style.opacity = 1;

    gsap.to(caveBg, {
        scale: 4,
        opacity: 0,
        duration: 5,
        ease: 'power2.in',
        onComplete: () => {
            showNarrative("Massive vines have blockaded the exit! You'll need to cut through them to escape this cavern.", [
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
    showNarrative("Finally! The path is clear. You shield your eyes as the blinding sunlight of the surface hits you...", [
        { text: "Step into the light", action: () => startForestStage() }
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

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1a0a);
    scene.fog = new THREE.FogExp2(0x0a1a0a, 0.04);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0x4444ff, 1.2);
    moonLight.position.set(50, 100, 50);
    moonLight.castShadow = true;
    scene.add(moonLight);

    const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x051a05 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    function createTree(x, z, type = 0) {
        const group = new THREE.Group();
        const scale = 0.8 + Math.random() * 2.5;

        const trunkGeom = new THREE.CylinderGeometry(0.3 * scale, 0.5 * scale, 12 * scale, 8);
        const trunkMat = new THREE.MeshLambertMaterial({ color: 0x2d1b0f });
        const trunk = new THREE.Mesh(trunkGeom, trunkMat);
        trunk.position.y = 6 * scale;
        trunk.castShadow = true;
        group.add(trunk);

        const leavesGeom = new THREE.DodecahedronGeometry(5 * scale, 0);
        const leavesMat = new THREE.MeshLambertMaterial({ color: 0x0a2d0a });
        const leaves = new THREE.Mesh(leavesGeom, leavesMat);
        leaves.position.y = 12 * scale;
        leaves.castShadow = true;
        group.add(leaves);

        group.position.set(x, 0, z);
        scene.add(group);
    }

    for (let i = 0; i < 300; i++) {
        createTree(
            (Math.random() - 0.5) * 600,
            (Math.random() - 0.5) * 600
        );
    }

    camera.position.set(0, 1.8, 20);

    let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;

    const onKeyDown = (e) => {
        switch (e.code) {
            case 'KeyW': moveForward = true; break;
            case 'KeyS': moveBackward = true; break;
            case 'KeyA': moveLeft = true; break;
            case 'KeyD': moveRight = true; break;
        }
    };
    const onKeyUp = (e) => {
        switch (e.code) {
            case 'KeyW': moveForward = false; break;
            case 'KeyS': moveBackward = false; break;
            case 'KeyA': moveLeft = false; break;
            case 'KeyD': moveRight = false; break;
        }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    let yaw = 0, pitch = 0;
    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === renderer.domElement) {
            yaw -= e.movementX * 0.002;
            pitch -= e.movementY * 0.002;
            pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, pitch));
        }
    });

    renderer.domElement.addEventListener('click', () => {
        renderer.domElement.requestPointerLock();
    });

    function animate() {
        requestAnimationFrame(animate);
        const speed = 0.2;
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        direction.y = 0;
        direction.normalize();
        const side = new THREE.Vector3().crossVectors(camera.up, direction).normalize();

        if (moveForward) camera.position.addScaledVector(direction, speed);
        if (moveBackward) camera.position.addScaledVector(direction, -speed);
        if (moveLeft) camera.position.addScaledVector(side, speed);
        if (moveRight) camera.position.addScaledVector(side, -speed);

        camera.rotation.set(pitch, yaw, 0, 'YXZ');
        renderer.render(scene, camera);
    }

    setTimeout(() => {
        gsap.to(loadingScreen, {
            opacity: 0, duration: 1.5, onComplete: () => {
                loadingScreen.style.display = 'none';
                showNarrative("You've entered the Forbidden Forest. Use W/A/S/D to move and your mouse to look around.", [
                    { text: "Let's explore", action: () => { } }
                ]);
            }
        });
    }, 4000);

    animate();
}
