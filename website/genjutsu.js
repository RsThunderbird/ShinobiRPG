function initThreeGenjutsu() {
    console.log("Initializing Genjutsu Stage...");
    const container = document.getElementById('genjutsu-three-container');
    const assets = window.assets;

    container.innerHTML = '';

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x220000, 0.04);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 8000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // --- HUD ---
    const crosshair = document.getElementById('crosshair');
    if (crosshair) crosshair.style.display = 'block';

    renderer.domElement.addEventListener('click', () => {
        renderer.domElement.requestPointerLock();
    });

    const ambientLight = new THREE.AmbientLight(0xff0000, 0.2);
    scene.add(ambientLight);

    const redLight = new THREE.PointLight(0xff0000, 2, 50);
    redLight.position.set(0, 10, 0);
    scene.add(redLight);

    // --- Eye Animation ---
    const eyelidsTop = document.querySelector('.eyelid.top');
    const eyelidsBottom = document.querySelector('.eyelid.bottom');
    const storyContainer = document.getElementById('story-container');
    const eyeOverlay = document.getElementById('eye-blinking-overlay');

    if (eyeOverlay) eyeOverlay.style.display = 'block';
    gsap.set([eyelidsTop, eyelidsBottom], { height: '50%' });
    gsap.set(storyContainer, { filter: 'blur(30px)' });

    // Open eyes faster
    setTimeout(() => {
        gsap.to([eyelidsTop, eyelidsBottom], { height: '0%', duration: 3, ease: 'power2.out' });
        gsap.to(storyContainer, { filter: 'blur(0px)', duration: 4 });
        showNotification("WAKE UP. THIS IS TSUKUYOMI.");
    }, 500);

    // --- Terrain ---
    const pathWidth = 6;
    const pathLength = 1000;
    const groundGeo = new THREE.PlaneGeometry(pathWidth, pathLength, 1, 100);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x0a0000 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.z = -pathLength / 2; // Starts at z=0, ends at z=-1000
    scene.add(ground);

    // --- SHARINGAN (sky.png) ---
    const sharinganTexture = new THREE.TextureLoader().load('assets/sky.png');
    const sharinganGeo = new THREE.CircleGeometry(400, 64);
    const sharinganMat = new THREE.MeshBasicMaterial({
        map: sharinganTexture,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        color: 0xff0000
    });
    const sharingan = new THREE.Mesh(sharinganGeo, sharinganMat);
    sharingan.position.set(0, 500, -2000);
    sharingan.rotation.x = 0.4;
    scene.add(sharingan);

    let spinSpeed = 0.004;

    // --- Archers ---
    const loader = new THREE.GLTFLoader();
    for (let i = 0; i < 50; i++) {
        loader.load(assets.archerModel, (gltf) => {
            const archer = gltf.scene;
            archer.scale.set(2, 2, 2);
            const side = i % 2 === 0 ? 1 : -1;
            archer.position.set(side * 10, 0, -i * 18 - 20);
            archer.lookAt(0, 1.5, archer.position.z + 10);
            scene.add(archer);
            const pLight = new THREE.PointLight(0xff0000, 0.5, 10);
            pLight.position.set(0, 3, 0);
            archer.add(pLight);
        });
    }

    // --- Movement ---
    let moveF = false;
    let cameraShake = new THREE.Vector3();
    let driftAngle = 0;

    const baseSpeed = 0.12;
    const testSpeed = 4.0; // Fast for testing
    let activeSpeed = testSpeed;

    const playerHeight = 2.4;
    let yaw = 0, pitch = 0;

    camera.position.set(0, playerHeight, 50); // Start slightly before the path

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

        // 1. Camera Nausea
        cameraShake.set(
            Math.sin(time * 8) * 0.1,
            Math.cos(time * 7) * 0.1,
            Math.sin(time * 6) * 0.05
        );

        // 2. Movement
        driftAngle += Math.sin(time * 0.4) * 0.04;
        const driftX = Math.sin(driftAngle) * 0.2;

        if (moveF) {
            camera.position.z -= activeSpeed;
            camera.position.x += driftX;
        }

        camera.position.x *= 0.98;

        const actualPos = camera.position.clone();
        camera.position.add(cameraShake);
        camera.position.y = playerHeight + Math.sin(time * 2) * 0.2;

        camera.rotation.set(pitch, yaw, Math.sin(time * 0.8) * 0.2 + (driftX * 2), 'YXZ');

        // Spin Sharingan
        sharingan.rotation.z += spinSpeed;

        // --- Finale Detection ---
        if (camera.position.z <= -pathLength + 150) {
            triggerGenjutsuEnd();
        }

        renderer.render(scene, camera);
        camera.position.copy(actualPos);
    }

    function triggerGenjutsuEnd() {
        if (finished) return;
        finished = true;

        // 1. FORCE CAMERA TO SKY
        moveF = false;
        showNotification("THERE IS NO EXIT.");

        gsap.to(camera.rotation, {
            x: 0.9,
            y: 0,
            z: 0,
            duration: 3,
            ease: "power3.inOut"
        });

        // 2. SHARINGAN ATTACK
        gsap.to({ s: spinSpeed }, {
            s: 0.4,
            duration: 5,
            onUpdate: function () { spinSpeed = this.targets()[0].s; }
        });

        gsap.to(sharingan.position, {
            z: camera.position.z - 40,
            y: camera.position.y,
            duration: 6,
            ease: "expo.in"
        });

        // 3. BLACKOUT -> VIDEO
        setTimeout(() => {
            gsap.to([eyelidsTop, eyelidsBottom], {
                height: '50%',
                duration: 1,
                ease: "power4.in",
                onComplete: () => {
                    playFinalCinematic();
                }
            });
        }, 5000);
    }

    function playFinalCinematic() {
        const videoContainer = document.createElement('div');
        videoContainer.className = 'cinematic-video-container';
        document.body.appendChild(videoContainer);

        const video = document.createElement('video');
        video.src = 'assets/itachi_sharingan.mp4';
        video.muted = true;
        video.autoplay = true;
        video.className = 'cinematic-video-small';
        videoContainer.appendChild(video);

        video.onended = () => {
            gsap.to(videoContainer, {
                opacity: 0, duration: 1, onComplete: () => {
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

        gsap.from(".banner-content", { y: 100, opacity: 0, duration: 3, ease: "power3.out" });

        setTimeout(() => {
            showNarrative("The nightmare continues...", [
                { text: "WAKE UP", action: () => window.location.href = 'index.html' }
            ]);
        }, 7000);
    }

    animate();
}
