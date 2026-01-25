function initThreeGenjutsu() {
    const container = document.getElementById('genjutsu-three-container');
    const assets = window.assets;

    container.innerHTML = '';

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // Absolute darkness
    scene.fog = new THREE.FogExp2(0x110000, 0.03); // Faint red fog in distance

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    // --- Cursor & HUD ---
    const crosshair = document.getElementById('crosshair');
    if (crosshair) crosshair.style.display = 'block';

    renderer.domElement.addEventListener('click', () => {
        renderer.domElement.requestPointerLock();
    });

    const ambientLight = new THREE.AmbientLight(0xff0000, 0.15);
    scene.add(ambientLight);

    const redLight = new THREE.PointLight(0xff0000, 2, 50);
    redLight.position.set(0, 5, 0);
    scene.add(redLight);

    // Initial eye opening sequence
    const eyelidsTop = document.querySelector('.eyelid.top');
    const eyelidsBottom = document.querySelector('.eyelid.bottom');
    const storyContainer = document.getElementById('story-container');

    gsap.to([eyelidsTop, eyelidsBottom], { height: '0%', duration: 4, ease: 'power2.out' });
    gsap.to(storyContainer, { filter: 'blur(0px)', duration: 4 });

    setTimeout(() => {
        showNotification("TSUKUYOMI: You cannot escape.");
    }, 2000);

    // --- Terrain: Narrow Red Path ---
    const pathWidth = 5;
    const pathLength = 1000;
    const groundGeo = new THREE.PlaneGeometry(pathWidth, pathLength, 1, 50);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x110000 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.z = -pathLength / 2 + 50;
    scene.add(ground);

    // --- COSMIC SHARINGAN (sky.png) ---
    const sharinganMap = new THREE.TextureLoader().load('assets/sky.png');
    const sharinganMaterial = new THREE.SpriteMaterial({
        map: sharinganMap,
        transparent: true,
        opacity: 1.0,
        color: 0xff0000 // Ensure red tint
    });
    const sharingan = new THREE.Sprite(sharinganMaterial);
    sharingan.position.set(0, 500, -1500); // Cosmic distance
    sharingan.scale.set(800, 800, 1);
    scene.add(sharingan);

    // Animation variables
    let spinSpeed = 0.002;
    let approaching = false;

    // --- Archer Ambush (Red Glows) ---
    const loader = new THREE.GLTFLoader();
    for (let i = 0; i < 50; i++) {
        loader.load(assets.archerModel, (gltf) => {
            const archer = gltf.scene;
            archer.scale.set(2, 2, 2);
            const side = i % 2 === 0 ? 1 : -1;
            archer.position.set(side * 10, 0, -i * 20);
            archer.lookAt(0, 1.5, archer.position.z + 10);
            scene.add(archer);

            const pLight = new THREE.PointLight(0xff0000, 0.5, 10);
            pLight.position.set(0, 3, 0);
            archer.add(pLight);
        });
    }

    // --- Finale Point: Distant Green Glow ---
    const exitLight = new THREE.PointLight(0x00ff00, 10, 100);
    exitLight.position.set(0, 5, -pathLength + 50);
    scene.add(exitLight);

    // --- Movement Physics ---
    let moveF = false;
    let cameraShake = new THREE.Vector3();
    let driftAngle = 0;

    const baseSpeed = 0.12;
    const testSpeed = 2.5; // Massive speed boost for testing
    let activeSpeed = baseSpeed;

    // ENABLE TEST SPEED BY DEFAULT FOR THE USER
    activeSpeed = testSpeed;

    const playerHeight = 2.4;
    let yaw = 0, pitch = 0;

    camera.position.set(0, playerHeight, 50);

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

        // 1. Nauseatic Camera Shake
        cameraShake.set(
            Math.sin(time * 8) * 0.12,
            Math.cos(time * 7) * 0.12,
            Math.sin(time * 6) * 0.06
        );

        // 2. Heavy "Drunk" Drift
        driftAngle += Math.sin(time * 0.5) * 0.04;
        const driftX = Math.sin(driftAngle) * 0.2;

        if (moveF) {
            camera.position.z -= activeSpeed;
            camera.position.x += driftX;
        }

        camera.position.x *= 0.97; // Fight to stay on path

        const actualPos = camera.position.clone();
        camera.position.add(cameraShake);
        camera.position.y = playerHeight + Math.sin(time * 1.8) * 0.2;

        // Nauseous Tilt
        camera.rotation.set(pitch, yaw, Math.sin(time * 0.8) * 0.25 + (driftX * 1.5), 'YXZ');

        // Spin the Sharingan
        sharingan.material.rotation += spinSpeed;

        // --- Finale Trigger ---
        if (camera.position.z <= -pathLength + 100) {
            triggerGenjutsuEnd();
        }

        renderer.render(scene, camera);
        camera.position.copy(actualPos);
    }

    function triggerGenjutsuEnd() {
        if (finished) return;
        finished = true;

        showNotification("ITACHI: It's too late.");

        // 1. Force Look Up at Cosmic Sharingan
        gsap.to(camera.rotation, {
            x: 0.7,
            y: 0,
            z: 0,
            duration: 2.5,
            ease: "power2.inOut"
        });

        // 2. Sharingan Accelerates Spin and Approaches
        approaching = true;
        const timeline = gsap.timeline();

        timeline.to({ speed: spinSpeed }, {
            speed: 0.2,
            duration: 4,
            onUpdate: function () { spinSpeed = this.targets()[0].speed; }
        });

        gsap.to(sharingan.position, {
            z: camera.position.z - 30,
            y: camera.position.y,
            duration: 5,
            ease: "expo.in"
        });

        // 3. Vision Goes Dark and Video Plays
        setTimeout(() => {
            gsap.to([eyelidsTop, eyelidsBottom], {
                height: '50%',
                duration: 1.5,
                ease: "power4.in",
                onComplete: () => {
                    playFinalCinematic();
                }
            });
        }, 4000);
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
            videoContainer.remove();
            showAkatsukiBanner();
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
            y: 100,
            opacity: 0,
            duration: 3,
            ease: "power4.out"
        });

        setTimeout(() => {
            showNarrative("The genjutsu fades... but Akatsuki's shadows remain.", [
                { text: "WAKE UP", action: () => window.location.href = 'index.html' }
            ]);
        }, 6000);
    }

    animate();
}
