function initThreeGenjutsu() {
    const container = document.getElementById('genjutsu-three-container');
    const assets = window.assets;

    container.innerHTML = '';

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x330000, 0.05);

    // MAX FAR PLANE for the cosmic scale
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const crosshair = document.getElementById('crosshair');
    if (crosshair) crosshair.style.display = 'block';

    renderer.domElement.addEventListener('click', () => {
        renderer.domElement.requestPointerLock();
    });

    const ambientLight = new THREE.AmbientLight(0xff0000, 0.3);
    scene.add(ambientLight);

    const spotLight = new THREE.SpotLight(0xff0000, 1.5);
    spotLight.position.set(0, 50, 0);
    scene.add(spotLight);

    const eyelidsTop = document.querySelector('.eyelid.top');
    const eyelidsBottom = document.querySelector('.eyelid.bottom');
    const storyContainer = document.getElementById('story-container');

    gsap.to([eyelidsTop, eyelidsBottom], { height: '0%', duration: 4, ease: 'power2.out' });
    gsap.to(storyContainer, { filter: 'blur(0px)', duration: 5 });

    setTimeout(() => {
        showNotification("Where... am I?");
    }, 2000);

    const pathWidth = 8;
    const pathLength = 600;
    const groundGeo = new THREE.PlaneGeometry(pathWidth, pathLength, 1, 100);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x050000 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.z = -pathLength / 2;
    scene.add(ground);

    const sharinganTexture = new THREE.TextureLoader().load('assets/sky.png');
    const sharinganGeo = new THREE.CircleGeometry(150, 64);
    const sharinganMat = new THREE.MeshBasicMaterial({
        map: sharinganTexture,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
    });
    const sharingan = new THREE.Mesh(sharinganGeo, sharinganMat);
    sharingan.position.set(0, 200, -500);
    sharingan.lookAt(0, 0, 0);
    scene.add(sharingan);

    let spinTween = gsap.to(sharingan.rotation, { z: Math.PI * 2, duration: 40, repeat: -1, ease: "none" });

    // --- BLACKHOLE: THE COSMIC SCALE FIX ---
    const fbxLoader = new THREE.FBXLoader();
    fbxLoader.setResourcePath('assets/textures/');
    let blackhole;
    let bhOrbitAngle = 0;

    fbxLoader.load('assets/blackhole.fbx', (object) => {
        blackhole = object;

        // MOVED EXTREMELY HIGH AND FAR TO PREVENT CLIPPING
        // Y: 80,000, Z: -150,000
        blackhole.position.set(0, 80000, -150000);
        blackhole.scale.set(0.01, 0.01, 0.01);

        blackhole.rotation.x = Math.PI / 4;

        // FORCE ORIGINAL COLORS (Ignore lights and fog)
        blackhole.traverse((child) => {
            if (child.isMesh) {
                const oldMat = child.material;
                // Replace with Basic Material to show literal texture colors
                child.material = new THREE.MeshBasicMaterial({
                    map: oldMat.map,
                    color: 0xffffff,
                    fog: false,
                    transparent: oldMat.transparent,
                    opacity: oldMat.opacity
                });
            }
        });

        scene.add(blackhole);
        console.log("[GENJUTSU] Blackhole loaded at cosmic distance.");
    });

    const gltfLoader = new THREE.GLTFLoader();
    const archers = [];
    for (let i = 0; i < 30; i++) {
        gltfLoader.load(assets.archerModel, (gltf) => {
            const archer = gltf.scene;
            archer.scale.set(1.5, 1.5, 1.5);
            const side = i % 2 === 0 ? 1 : -1;
            archer.position.set(side * 5, 0, -i * 20);
            archer.lookAt(0, 1, archer.position.z + 10);
            scene.add(archer);
            archers.push(archer);

            const redLight = new THREE.PointLight(0xff0000, 0.5, 10);
            redLight.position.set(0, 2, 0);
            archer.add(redLight);
        });
    }

    let moveF = false;
    let cameraShake = new THREE.Vector3();
    const baseSpeed = 0.222;
    const playerHeight = 2.2;
    let yaw = 0, pitch = 0;

    camera.position.set(0, playerHeight, 0);

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
        cameraShake.set(Math.sin(time * 6) * 0.08, Math.cos(time * 5) * 0.08, Math.sin(time * 4) * 0.04);
        const driftX = Math.sin(time * 0.4) * 0.12;

        if (moveF) {
            camera.position.z -= baseSpeed;
            camera.position.x += driftX;
            const progress = Math.abs(camera.position.z) / pathLength;
            if (progress > 0.2) {
                // Look much higher to see the now-distant blackhole
                pitch = Math.max(pitch, (progress - 0.2) * Math.PI / 2.5);
            }
        }

        camera.position.x *= 0.98;
        const actualPos = camera.position.clone();
        camera.position.add(cameraShake);
        camera.position.y = playerHeight + Math.sin(time * 1.5) * 0.1;
        camera.rotation.set(pitch, yaw, Math.sin(time * 0.5) * 0.15 + driftX, 'YXZ');

        if (blackhole) {
            bhOrbitAngle += 0.0015;
            // High altitude circular orbit
            const rad = 25000;
            blackhole.position.x = Math.cos(bhOrbitAngle) * rad;
            blackhole.position.z = -150000 + Math.sin(bhOrbitAngle) * rad;

            blackhole.rotation.y += 0.005;
            blackhole.rotation.z += 0.002;
        }

        if (camera.position.z <= -pathLength + 30) {
            triggerGenjutsuEnd();
        }

        renderer.render(scene, camera);
        camera.position.copy(actualPos);
    }

    function triggerGenjutsuEnd() {
        if (finished) return;
        finished = true;
        showNotification("ITACHI: Look into my eyes...");
        gsap.to(camera.rotation, { x: Math.PI / 3, duration: 2 });
        spinTween.kill();
        spinTween = gsap.to(sharingan.rotation, { z: Math.PI * 2, duration: 2, repeat: -1, ease: "none" });

        if (blackhole) {
            // Massive expand but stay relatively far so it doesn't clip
            gsap.to(blackhole.scale, { x: 30, y: 30, z: 30, duration: 5, ease: "power2.in" });
            gsap.to(blackhole.position, {
                y: 5000,
                z: camera.position.z - 10000, // Move closer but keep safe distance
                duration: 5,
                ease: "power2.in"
            });
        }

        gsap.to(sharingan.position, { z: camera.position.z - 20, y: camera.position.y, duration: 5, ease: "power2.in" });

        setTimeout(() => {
            gsap.to([eyelidsTop, eyelidsBottom], { height: '50%', duration: 2, ease: "power2.inOut", onComplete: () => { playFinalCinematic(); } });
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
            gsap.to(videoContainer, { opacity: 0, duration: 1, onComplete: () => { videoContainer.remove(); showAkatsukiBanner(); } });
        };
    }

    function showAkatsukiBanner() {
        const banner = document.createElement('div');
        banner.className = 'akatsuki-banner';
        banner.innerHTML = `<div class="banner-content"><h1>PREPARE FOR THE UPCOMING EVENT</h1><h2 class="akatsuki-text">AKATSUKI</h2></div>`;
        document.body.appendChild(banner);
        gsap.from(".banner-content", { y: 50, opacity: 0, duration: 2, ease: "power3.out" });
        setTimeout(() => { showNarrative("The genjutsu fades... but the darkness remains.", [{ text: "Return to Menu", action: () => window.location.href = 'index.html' }]); }, 5000);
    }

    animate();
}
