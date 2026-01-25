/**
 * genjutsu.js - FREE ROAM TEST MODE
 * Manual movement enabled. Automated cinematic disabled.
 * Uses assets/sharingan.png for visual verification.
 */
function initThreeGenjutsu() {
    console.log("[GENJUTSU TEST] Entering Free Roam Mode.");

    const container = document.getElementById('genjutsu-three-container');
    const assets = window.assets;

    if (!container) {
        console.error("[GENJUTSU] Missing container.");
        return;
    }

    container.innerHTML = '';

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x1a0000, 0.04);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Click to lock cursor for free roam
    renderer.domElement.addEventListener('click', () => {
        renderer.domElement.requestPointerLock();
    });

    // --- Audio (Manual Triggering) ---
    const bgMusic = new Howl({
        src: ['assets/genjutsubg.mp3'],
        volume: 0.6,
        autoplay: true,
        onload: () => {
            console.log("[GENJUTSU] Audio Loaded. Starting at 20s.");
            bgMusic.seek(20);
        }
    });

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1); // Slightly brighter for test
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xff0000, 2, 50);
    pointLight.position.set(0, 5, 0);
    scene.add(pointLight);

    const eyelidsTop = document.querySelector('.eyelid.top');
    const eyelidsBottom = document.querySelector('.eyelid.bottom');
    const storyContainer = document.getElementById('story-container');

    // Instantly open eyes for testing
    if (eyelidsTop) eyelidsTop.style.height = '0%';
    if (eyelidsBottom) eyelidsBottom.style.height = '0%';
    if (storyContainer) storyContainer.style.filter = 'none';

    // --- Terrain ---
    const pathWidth = 10;
    const pathLength = 2000;
    const groundGeo = new THREE.PlaneGeometry(pathWidth, pathLength, 1, 100);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // --- SHARINGAN IMAGE (THE TEST SUBJECT) ---
    console.log("[GENJUTSU] LOADING IMAGE TEST: assets/sharingan.png");
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
        'assets/sharingan.png',
        (texture) => {
            console.log("[GENJUTSU] SUCCESS: Texture loaded successfully.");
            const sharinganGeo = new THREE.CircleGeometry(150, 64);
            const sharinganMat = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                side: THREE.DoubleSide
            });
            const sharinganMesh = new THREE.Mesh(sharinganGeo, sharinganMat);
            // Place it high in the sky and far away
            sharinganMesh.position.set(0, 300, -800);
            sharinganMesh.lookAt(0, 0, 0);
            sharinganMesh.name = "testing_sharingan"; // For debugging in console
            scene.add(sharinganMesh);
            console.log("[GENJUTSU] Sharingan Mesh added at:", sharinganMesh.position);

            window.sharinganRef = sharinganMesh; // Expose for console debugging
        },
        undefined,
        (err) => console.error("[GENJUTSU] FAILED to load texture:", err)
    );

    // --- Controls Logic ---
    let moveForward = false;
    let moveBackward = false;
    let moveLeft = false;
    let moveRight = false;

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
            pitch = Math.max(-1.5, Math.min(1.5, pitch));
        }
    });

    camera.position.set(0, 2, 50);

    const speed = 0.5;

    function animate() {
        requestAnimationFrame(animate);

        if (document.pointerLockElement === renderer.domElement) {
            const dir = new THREE.Vector3();
            camera.getWorldDirection(dir);
            dir.y = 0; // Keep movement on horizontal plane
            dir.normalize();

            const side = new THREE.Vector3().crossVectors(camera.up, dir).normalize();

            if (moveForward) camera.position.addScaledVector(dir, speed);
            if (moveBackward) camera.position.addScaledVector(dir, -speed);
            if (moveLeft) camera.position.addScaledVector(side, speed);
            if (moveRight) camera.position.addScaledVector(side, -speed);
        }

        camera.rotation.set(pitch, yaw, 0, 'YXZ');

        // Optional: Manual spin test
        if (window.sharinganRef) {
            window.sharinganRef.rotation.z += 0.01;
        }

        renderer.render(scene, camera);
    }

    animate();
}
