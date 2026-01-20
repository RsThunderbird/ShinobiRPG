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
    walkingSound: 'https://assets.mixkit.co/sfx/preview/mixkit-footsteps-in-the-forest-ground-1230.mp3' // Placeholder
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

    // Mobile controls logic
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
        document.getElementById('mobile-controls').style.display = 'block';
        const joystick = document.getElementById('joystick');
        const joystickContainer = document.getElementById('joystick-container');
        let joystickActive = false;
        let touchStartX, touchStartY;

        joystickContainer.addEventListener('touchstart', (e) => {
            joystickActive = true;
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });

        window.addEventListener('touchmove', (e) => {
            if (!joystickActive) return;
            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;

            const dx = touchX - touchStartX;
            const dy = touchY - touchStartY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxDist = 40;

            const angle = Math.atan2(dy, dx);
            const moveX = Math.min(dist, maxDist) * Math.cos(angle);
            const moveY = Math.min(dist, maxDist) * Math.sin(angle);

            joystick.style.transform = `translate(${moveX}px, ${moveY}px)`;

            moveForward = moveY < -10;
            moveBackward = moveY > 10;
            moveLeft = moveX < -10;
            moveRight = moveX > 10;
        });

        window.addEventListener('touchend', () => {
            joystickActive = false;
            joystick.style.transform = 'translate(0, 0)';
            moveForward = moveBackward = moveLeft = moveRight = false;
        });

        // Touch look
        let lastTouchX, lastTouchY;
        window.addEventListener('touchstart', (e) => {
            if (e.touches[0].clientX > window.innerWidth / 2) {
                lastTouchX = e.touches[0].clientX;
                lastTouchY = e.touches[0].clientY;
            }
        });

        window.addEventListener('touchmove', (e) => {
            if (e.touches[0].clientX > window.innerWidth / 2 && !joystickActive) {
                const touchX = e.touches[0].clientX;
                const touchY = e.touches[0].clientY;

                if (lastTouchX !== undefined && lastTouchY !== undefined) {
                    const dx = touchX - lastTouchX;
                    const dy = touchY - lastTouchY;

                    yaw -= dx * 0.005;
                    pitch -= dy * 0.005;
                    pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, pitch));
                }

                lastTouchX = touchX;
                lastTouchY = touchY;
            }
        });

        window.addEventListener('touchend', (e) => {
            if (e.touches.length === 0) {
                lastTouchX = undefined;
                lastTouchY = undefined;
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
                showNarrative("You've entered the Forest. Use W/A/S/D or Joystick to move and touch/mouse to look around.", [
                    { text: "Let's explore", action: () => { } }
                ]);
            }
        });
    }, 4000);

    animate();
}
