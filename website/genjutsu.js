function initThreeGenjutsu() {
    const container = document.getElementById('genjutsu-three-container');
    const assets = window.assets;

    container.innerHTML = '';

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // Eternal Night
    scene.fog = new THREE.FogExp2(0x1a0000, 0.03); // Faint red death haze

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 8000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // --- Interaction & HUD ---
    const crosshair = document.getElementById('crosshair');
    if (crosshair) crosshair.style.display = 'block';

    renderer.domElement.addEventListener('click', () => {
        renderer.domElement.requestPointerLock();
    });

    const ambientLight = new THREE.AmbientLight(0xff0000, 0.1);
    scene.add(ambientLight);

    const redSpot = new THREE.SpotLight(0xff0000, 2, 100);
    redSpot.position.set(0, 50, 0);
    scene.add(redSpot);

    // Initial Eye Opening Logic
    const eyelidsTop = document.querySelector('.eyelid.top');
    const eyelidsBottom = document.querySelector('.eyelid.bottom');
    const storyContainer = document.getElementById('story-container');

    // Set initial state for blinks
    gsap.set([eyelidsTop, eyelidsBottom], { height: '50%' });

    // The "Wake Up" in Tsukuyomi
    setTimeout(() => {
        gsap.to([eyelidsTop, eyelidsBottom], { height: '0%', duration: 5, ease: 'power2.out' });
        gsap.to(storyContainer, { filter: 'blur(0px)', duration: 6 });
        showNotification("WAKE UP. THIS IS TSUKUYOMI.");
    }, 1000);

    // --- Terrain: Infinite Red Path ---
    const pathWidth = 4;
    const pathLength = 1200;
    const groundGeo = new THREE.PlaneGeometry(pathWidth, pathLength, 1, 100);
    const groundMat = new THREE.MeshStandardMaterial({
        color: 0x0a0000,
        emissive: 0x220000,
        emissiveIntensity: 0.1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.z = -pathLength / 2 + 50;
    scene.add(ground);

    // --- COSMIC SHARINGAN (sky.png) ---
    // Use a large Plane instead of Sprite for better control over "Sky" feeling
    const sharinganTex = new THREE.TextureLoader().load('assets/sky.png');
    const sharinganGeo = new THREE.CircleGeometry(400, 64);
    const sharinganMat = new THREE.MeshBasicMaterial({
        map: sharinganTex,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        color: 0xff0000
    });
    const sharingan = new THREE.Mesh(sharinganGeo, sharinganMat);
    sharingan.position.set(0, 600, -2000); // Way up and back
    sharingan.rotation.x = 0.5; // Tilt towards player
    scene.add(sharingan);

    let spinSpeed = 0.003;

    // --- Archer Ambush ---
    const loader = new THREE.GLTFLoader();
    for (let i = 0; i < 60; i++) {
        loader.load(assets.archerModel, (gltf) => {
            const archer = gltf.scene;
            archer.scale.set(2.2, 2.2, 2.2);
            const side = i % 2 === 0 ? 1 : -1;
            archer.position.set(side * 12, 0, -i * 18);
            archer.lookAt(0, 2, archer.position.z + 20);
            scene.add(archer);

            const pLight = new THREE.PointLight(0xff0000, 0.4, 8);
            pLight.position.set(0, 4, 0);
            archer.add(pLight);
        });
    }

    // --- END GOAL: Green Flare ---
    const goalLight = new THREE.PointLight(0x00ff00, 15, 150);
    goalLight.position.set(0, 5, -pathLength + 80);
    scene.add(goalLight);

    // --- Movement Physics ---
    let moveF = false;
    let cameraShake = new THREE.Vector3();
    let driftAngle = 0;

    // SPEEDS
    const baseSpeed = 0.15;
    const testSpeed = 3.5;
    let activeSpeed = testSpeed; // ENABLED TEST SPEED FOR YOU

    const playerHeight = 2.5;
    let yaw = 0, pitch = 0;

    camera.position.set(0, playerHeight, 100);

    const onKeyDown = (e) => { if (e.code === 'KeyW') moveF = true; };
    const onKeyUp = (e) => { if (e.code === 'KeyW') moveF = false; };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === renderer.domElement) {
            yaw -= e.movementX * 0.002;
            pitch -= e.movementY * 0.002;
            pitch = Math.max(-1.4, Math.min(1.4, pitch));
        }
    });

    let finished = false;

    function animate() {
        if (finished) return;
        requestAnimationFrame(animate);

        const time = Date.now() * 0.001;

        // 1. Heavy Camera Nausea
        cameraShake.set(
            Math.sin(time * 9) * 0.15,
            Math.cos(time * 8) * 0.15,
            Math.sin(time * 7) * 0.08
        );

        // 2. Drunk Movement Struggle
        driftAngle += Math.sin(time * 0.4) * 0.05;
        const driftX = Math.sin(driftAngle) * 0.25;

        if (moveF) {
            camera.position.z -= activeSpeed;
            camera.position.x += driftX;
        }

        camera.position.x *= 0.98; // Centering force

        const actualPos = camera.position.clone();
        camera.position.add(cameraShake);
        camera.position.y = playerHeight + Math.sin(time * 2.5) * 0.25;

        // Apply rotation with nauseous tilt
        camera.rotation.set(pitch, yaw, Math.sin(time * 0.9) * 0.3 + (driftX * 2), 'YXZ');

        // Spin Sharingan
        sharingan.rotation.z += spinSpeed;

        // --- THE GRAND FINALE TRIGGER ---
        if (camera.position.z <= -pathLength + 150) {
            triggerGenjutsuEnd();
        }

        renderer.render(scene, camera);
        camera.position.copy(actualPos);
    }

    function triggerGenjutsuEnd() {
        if (finished) return;
        finished = true;

        showNotification("ITACHI: AMATERASU.");

        // 1. FORCE CAMERA TO SKY (AUTO LOOK UP)
        // Disable movement completely
        moveF = false;

        // Tilt camera way up to face the sharingan
        gsap.to(camera.rotation, {
            x: 1.0, // Look up high
            y: 0,
            z: 0,
            duration: 3,
            ease: "power3.inOut"
        });

        // 2. SHARINGAN REV UP & DIVE
        // Accelerate spin rapidly
        gsap.to({ s: spinSpeed }, {
            s: 0.3,
            duration: 5,
            onUpdate: function () { spinSpeed = this.targets()[0].s; }
        });

        // Massive scale zoom and move towards player
        gsap.to(sharingan.position, {
            z: camera.position.z - 40,
            y: camera.position.y + 10,
            duration: 6,
            ease: "expo.in"
        });

        gsap.to(sharingan.scale, { x: 5, y: 5, duration: 6 }); // Appear to grow as it gets closer

        // 3. EYES SHUT IN TERROR -> VIDEO
        setTimeout(() => {
            gsap.to([eyelidsTop, eyelidsBottom], {
                height: '50%',
                duration: 1.2,
                ease: "expo.in",
                onComplete: () => {
                    playFinalCinematic();
                }
            });
        }, 5000);
    }

    function playFinalCinematic() {
        // Black box container
        const videoContainer = document.createElement('div');
        videoContainer.className = 'cinematic-video-container';
        document.body.appendChild(videoContainer);

        const video = document.createElement('video');
        video.src = 'assets/itachi_sharingan.mp4';
        video.muted = true;
        video.autoplay = true;
        video.className = 'cinematic-video-small'; // Scaled down in CSS
        videoContainer.appendChild(video);

        video.onended = () => {
            gsap.to(videoContainer, {
                opacity: 0, duration: 1.5, onComplete: () => {
                    videoContainer.remove();
                    showAkatsukiBanner();
                }
            });
        };
    }

    function showAkatsukiBanner() {
        const banner = document.createElement('div');
        banner.className = 'akatsuki-banner';
        banner.innerHTML = `
            <div class="banner-content">
                <h1>PREPARE FOR THE UPCOMING EVENT</h1>
                <h2 class="akatsuki-text">AKATSUKI</h2>
            </div>
        `;
        document.body.appendChild(banner);

        gsap.from(".banner-content", {
            y: 150,
            opacity: 0,
            duration: 4,
            ease: "power4.out"
        });

        setTimeout(() => {
            showNarrative("The genjutsu fades... but the Nightmare is real.", [
                { text: "WAKE UP", action: () => window.location.href = 'index.html' }
            ]);
        }, 8000);
    }

    animate();
}
