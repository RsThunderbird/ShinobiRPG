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
    setupCaveChoice();
    setupBatsMinigame();
}

function startBlinkingAnimation() {
    const tl = gsap.timeline();
    const eyelidsTop = document.querySelector('.eyelid.top');
    const eyelidsBottom = document.querySelector('.eyelid.bottom');
    const storyContainer = document.getElementById('story-container');

    // Several blinks
    tl.to([eyelidsTop, eyelidsBottom], { height: '10%', duration: 0.3, repeat: 3, yoyo: true, ease: 'power1.inOut' })
      .to([eyelidsTop, eyelidsBottom], { height: '0%', duration: 1.5, ease: 'power2.inOut' })
      .to(storyContainer, { filter: 'blur(0px)', duration: 3 }, '-=1');
}

function setupCaveChoice() {
    const leftExit = document.getElementById('exit-left');
    const rightExit = document.getElementById('exit-right');

    leftExit.addEventListener('click', () => {
        handleChoice('left');
    });

    rightExit.addEventListener('click', () => {
        handleChoice('right');
    });
}

function handleChoice(choice) {
    if (choice === 'right') {
        showNarrative("You enter the right cave but it was a dead end.", [
            { text: "Go to left cave", action: () => handleChoice('left') }
        ]);
    } else {
        startLeftCaveTransition();
    }
}

function showNarrative(text, buttons = []) {
    const box = document.getElementById('narrative-box');
    box.innerHTML = `<p>${text}</p>`;

    const btnContainer = document.createElement('div');
    btnContainer.style.marginTop = '10px';

    buttons.forEach(btn => {
        const b = document.createElement('button');
        b.innerText = btn.text;
        b.className = 'action-btn'; // Use existing style if any
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
    // Black screen and sound
    gsap.to('#cave-bg', { opacity: 0, duration: 1, onComplete: () => {
        const walkingSound = new Howl({
            src: [assets.walkingSound],
            volume: 0.5
        });
        walkingSound.play();

        setTimeout(() => {
            document.getElementById('bats-minigame').classList.add('active');
            startBatsMinigame();
        }, 2000);
    }});
}

function setupBatsMinigame() {
    // Initial setup if needed
}

function startBatsMinigame() {
    const container = document.getElementById('bats-container');
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
                spawnBat();
            }
        });

        container.appendChild(bat);

        // Random movement
        gsap.to(bat, {
            x: (Math.random() - 0.5) * 200,
            y: (Math.random() - 0.5) * 200,
            duration: 1 + Math.random(),
            repeat: -1,
            yoyo: true
        });
    }

    // Spawn initial bats
    for (let i = 0; i < 5; i++) {
        spawnBat();
    }
}

function finishBatsMinigame() {
    document.getElementById('bats-minigame').classList.remove('active');
    showNarrative("The bats are cleared. You walk forwards...", []);
    setTimeout(() => {
        document.getElementById('narrative-box').style.display = 'none';
        walkingForwardEffect();
    }, 2000);
}

function walkingForwardEffect() {
    const caveBg = document.getElementById('cave-bg');
    caveBg.src = assets.cave; // Reset or use a specific "forward" image if available
    caveBg.style.opacity = 1;

    gsap.to(caveBg, {
        scale: 3,
        opacity: 0,
        duration: 4,
        ease: 'power1.in',
        onComplete: () => {
            startVinesMinigame();
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
        // Create a grid of vines
        const rows = 4;
        const cols = 6;
        const vWidth = canvas.width / cols;
        const vHeight = canvas.height / rows;

        for(let r=0; r<rows; r++) {
            for(let c=0; c<cols; c++) {
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
    canvas.addEventListener('mouseup', () => isDrawing = false);
    canvas.addEventListener('mousemove', (e) => {
        if (!isDrawing) return;
        checkSlash(e.clientX, e.clientY);
    });

    canvas.addEventListener('touchstart', (e) => {
        isDrawing = true;
        checkSlash(e.touches[0].clientX, e.touches[0].clientY);
    });
    canvas.addEventListener('touchend', () => isDrawing = false);
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
    showNarrative("The vines are gone. You step out into the sunlight...", []);
    setTimeout(() => {
        document.getElementById('narrative-box').style.display = 'none';
        startForestStage();
    }, 2000);
}

function startForestStage() {
    document.querySelectorAll('.stage').forEach(s => s.classList.remove('active'));
    document.getElementById('forest-stage').classList.add('active');

    // Initialize Three.js Forest here
    initThreeForest();
}

function initThreeForest() {
    const container = document.getElementById('three-container');
    const loadingScreen = document.getElementById('loading-screen');

    // Three.js basic setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a2f1a); // Darker forest sky
    scene.fog = new THREE.FogExp2(0x1a2f1a, 0.05);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
    scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0x5555ff, 0.8);
    moonLight.position.set(50, 100, 50);
    moonLight.castShadow = true;
    scene.add(moonLight);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(500, 500);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x113311 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Forest Generation (Rainforest / Naruto vibe)
    function createTree(x, z, type = 0) {
        const group = new THREE.Group();
        const scale = 0.5 + Math.random() * 2;

        if (type === 0) { // Large trunk tree
            const trunkGeom = new THREE.CylinderGeometry(0.5 * scale, 0.8 * scale, 10 * scale, 8);
            const trunkMat = new THREE.MeshLambertMaterial({ color: 0x3d2b1f });
            const trunk = new THREE.Mesh(trunkGeom, trunkMat);
            trunk.position.y = 5 * scale;
            trunk.castShadow = true;
            group.add(trunk);

            const leavesGeom = new THREE.DodecahedronGeometry(4 * scale, 1);
            const leavesMat = new THREE.MeshLambertMaterial({ color: 0x0a3d0a });
            const leaves = new THREE.Mesh(leavesGeom, leavesMat);
            leaves.position.y = 10 * scale;
            leaves.castShadow = true;
            group.add(leaves);
        } else { // Slender tree
            const trunkGeom = new THREE.CylinderGeometry(0.2 * scale, 0.3 * scale, 8 * scale, 6);
            const trunkMat = new THREE.MeshLambertMaterial({ color: 0x4b3621 });
            const trunk = new THREE.Mesh(trunkGeom, trunkMat);
            trunk.position.y = 4 * scale;
            trunk.castShadow = true;
            group.add(trunk);

            for(let i=0; i<3; i++) {
                const leavesGeom = new THREE.ConeGeometry(2 * scale, 4 * scale, 6);
                const leavesMat = new THREE.MeshLambertMaterial({ color: 0x1b4d3e });
                const leaves = new THREE.Mesh(leavesGeom, leavesMat);
                leaves.position.y = (6 + i*2) * scale;
                leaves.castShadow = true;
                group.add(leaves);
            }
        }

        group.position.set(x, 0, z);
        scene.add(group);
    }

    for (let i = 0; i < 400; i++) {
        createTree(
            (Math.random() - 0.5) * 400,
            (Math.random() - 0.5) * 400,
            Math.random() > 0.5 ? 0 : 1
        );
    }

    camera.position.y = 1.6; // Eye level
    camera.position.z = 10;

    // Controls
    let moveForward = false;
    let moveBackward = false;
    let moveLeft = false;
    let moveRight = false;

    const onKeyDown = (event) => {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW': moveForward = true; break;
            case 'ArrowLeft':
            case 'KeyA': moveLeft = true; break;
            case 'ArrowDown':
            case 'KeyS': moveBackward = true; break;
            case 'ArrowRight':
            case 'KeyD': moveRight = true; break;
        }
    };

    const onKeyUp = (event) => {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW': moveForward = false; break;
            case 'ArrowLeft':
            case 'KeyA': moveLeft = false; break;
            case 'ArrowDown':
            case 'KeyS': moveBackward = false; break;
            case 'ArrowRight':
            case 'KeyD': moveRight = false; break;
        }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // Mouse look
    let yaw = 0;
    let pitch = 0;
    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === renderer.domElement) {
            yaw -= e.movementX * 0.002;
            pitch -= e.movementY * 0.002;
            pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitch));
        }
    });

    renderer.domElement.addEventListener('click', () => {
        renderer.domElement.requestPointerLock();
    });

    // Mobile controls
    const joystick = document.getElementById('joystick');
    const joystickContainer = document.getElementById('joystick-container');
    let joystickActive = false;
    let touchStartX, touchStartY;

    if ('ontouchstart' in window) {
        document.getElementById('mobile-controls').style.display = 'block';

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
            const dist = Math.sqrt(dx*dx + dy*dy);
            const maxDist = 40;

            const angle = Math.atan2(dy, dx);
            const moveX = Math.min(dist, maxDist) * Math.cos(angle);
            const moveY = Math.min(dist, maxDist) * Math.sin(angle);

            joystick.style.transform = `translate(${moveX}px, ${moveY}px)`;

            // Movement logic based on joystick
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
                    pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitch));
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

    function animate() {
        requestAnimationFrame(animate);

        const speed = 0.15;
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

    // Hide loading screen after a bit
    setTimeout(() => {
        gsap.to(loadingScreen, { opacity: 0, duration: 1, onComplete: () => loadingScreen.style.display = 'none' });
    }, 3000);

    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}
