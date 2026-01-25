function initThreeGenjutsu() {
    const container = document.getElementById('genjutsu-three-container');
    const assets = window.assets;

    container.innerHTML = '';

    // --- SETUP SCENE (CLEAR & TRANSPARENT) ---
    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 10, 1000000);
    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const crosshair = document.getElementById('crosshair');
    if (crosshair) crosshair.style.display = 'block';

    renderer.domElement.addEventListener('click', () => {
        renderer.domElement.requestPointerLock();
    });

    // --- ENHANCED LIGHTING (Fix Pitch Black Environment) ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4); // Brighter ambient
    scene.add(ambientLight);

    // Add a light that follows the camera to illuminate the path
    const playerLight = new THREE.PointLight(0xff0000, 1.5, 50);
    scene.add(playerLight);

    const spotLight = new THREE.SpotLight(0xffffff, 1.2);
    spotLight.position.set(0, 100, 0);
    scene.add(spotLight);

    // Initial eye opening animation
    const eyelidsTop = document.querySelector('.eyelid.top');
    const eyelidsBottom = document.querySelector('.eyelid.bottom');
    const storyContainer = document.getElementById('story-container');

    gsap.to([eyelidsTop, eyelidsBottom], { height: '0%', duration: 4, ease: 'power2.inOut' });
    gsap.to(storyContainer, { filter: 'blur(0px)', duration: 5 });

    setTimeout(() => {
        if (typeof showNarrative === 'function') {
            showNarrative("Where the heck am i..?");
        }
    }, 2000);

    // --- Terrain ---
    const pathWidth = 12; // Slightly wider
    const pathLength = 800; // Longer path
    const groundGeo = new THREE.PlaneGeometry(pathWidth, pathLength, 1, 100);
    // Dark but slightly visible red/obsidian ground
    const groundMat = new THREE.MeshStandardMaterial({
        color: 0x110000,
        roughness: 0.8,
        metalness: 0.2,
        emissive: 0x050000
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.z = -pathLength / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Red markers to guide the way
    for (let i = 0; i < 40; i++) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 2), new THREE.MeshBasicMaterial({ color: 0x440000 }));
        m.position.set(0, 0.05, -i * 20);
        scene.add(m);
    }

    // --- Archers ---
    const gltfLoader = new THREE.GLTFLoader();
    for (let i = 0; i < 30; i++) {
        gltfLoader.load(assets.archerModel, (gltf) => {
            const archer = gltf.scene;
            archer.scale.set(1.5, 1.5, 1.5);
            const side = i % 2 === 0 ? 1 : -1;
            archer.position.set(side * 6, 0, -i * 25);
            archer.lookAt(0, 1, archer.position.z + 10);
            archer.traverse(n => { if (n.isMesh) n.castShadow = true; });
            scene.add(archer);

            // Give archers a faint red glow
            const aling = new THREE.PointLight(0xff0000, 0.3, 10);
            aling.position.set(0, 2, 0);
            archer.add(aling);
        });
    }

    // --- FBX BLACKHOLE ---
    const fbxLoader = new THREE.FBXLoader();
    fbxLoader.setResourcePath('assets/textures/');
    let blackhole;
    let bhOrbitAngle = 0;

    fbxLoader.load('assets/blackhole.fbx', (object) => {
        blackhole = object;
        blackhole.position.set(0, 80000, -150000);
        blackhole.scale.set(0.15, 0.15, 0.15);
        blackhole.rotation.set(Math.PI / 4, 0, 0);

        blackhole.traverse((child) => {
            if (child.isMesh) {
                if (child.name.toLowerCase().includes('sky') || child.name.toLowerCase().includes('dome') || child.scale.x > 1000) {
                    child.visible = false;
                    return;
                }
                const oldMat = child.material;
                const matArray = Array.isArray(oldMat) ? oldMat : [oldMat];
                const fixedMats = matArray.map(m => new THREE.MeshBasicMaterial({
                    map: m.map,
                    color: 0xffffff,
                    fog: false,
                    transparent: true,
                    opacity: m.opacity || 1
                }));
                child.material = Array.isArray(oldMat) ? fixedMats : fixedMats[0];
            }
        });
        scene.add(blackhole);
    });

    // --- Cinematic Flow ---
    let moveF = false;
    let cameraShake = new THREE.Vector3();
    const baseSpeed = 0.25;
    const playerHeight = 2.2;
    let yaw = 0, pitch = 0;

    let cutsceneStarted = false;
    let finished = false;

    camera.position.set(0, playerHeight, 0);

    // --- KEYBOARD LISTENERS ---
    const onKeyDown = (e) => {
        if (e.code === 'KeyW' && !cutsceneStarted) moveF = true;

        // FIX: Press E to continue dialogue
        if (e.code === 'KeyE') {
            const narrativeBox = document.getElementById('narrative-box');
            if (narrativeBox && narrativeBox.style.display !== 'none') {
                const buttons = narrativeBox.querySelectorAll('.story-choice-btn');
                if (buttons.length > 0) {
                    buttons[0].click();
                } else {
                    narrativeBox.style.display = 'none';
                }
            }
        }
    };

    const onKeyUp = (e) => {
        if (e.code === 'KeyW') moveF = false;
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === renderer.domElement && !cutsceneStarted) {
            yaw -= e.movementX * 0.002;
            pitch -= e.movementY * 0.002;
            pitch = Math.max(-1.4, Math.min(1.4, pitch));
        }
    });

    function animate() {
        requestAnimationFrame(animate);

        const time = Date.now() * 0.001;
        cameraShake.set(Math.sin(time * 6) * 0.08, Math.cos(time * 5) * 0.08, Math.sin(time * 4) * 0.04);
        const driftX = Math.sin(time * 0.4) * 0.12;

        if (!cutsceneStarted) {
            if (moveF) {
                camera.position.z -= baseSpeed;
                camera.position.x += driftX;
            }
            camera.position.x *= 0.98;

            // REACHED THE POINT -> TRIGGER CUTSCENE
            if (camera.position.z <= -pathLength + 150) {
                triggerCutscene();
            }
        }

        const actualPos = camera.position.clone();
        camera.position.add(cameraShake);
        camera.position.y = playerHeight + Math.sin(time * 1.5) * 0.1;

        playerLight.position.copy(camera.position);

        if (!cutsceneStarted) {
            camera.rotation.set(pitch, yaw, Math.sin(time * 0.5) * 0.15 + driftX, 'YXZ');
        }

        if (blackhole) {
            bhOrbitAngle += 0.001;
            const orbitRad = 15000;
            blackhole.position.x = Math.cos(bhOrbitAngle) * orbitRad;
            blackhole.position.y = 80000 + Math.sin(bhOrbitAngle) * orbitRad;
            blackhole.rotation.y += 0.002;
        }

        renderer.render(scene, camera);
        camera.position.copy(actualPos);
    }

    function triggerCutscene() {
        if (cutsceneStarted) return;
        cutsceneStarted = true;
        moveF = false;

        console.log("[GENJUTSU] Triggering lookup cutscene.");

        // 1. Forced Lookup Animation
        gsap.to(camera.rotation, {
            x: Math.PI / 2.5,
            y: 0,
            z: 0,
            duration: 3,
            ease: "power2.inOut",
            onComplete: () => {
                blinkAndEpicZoom();
            }
        });
    }

    function blinkAndEpicZoom() {
        gsap.to([eyelidsTop, eyelidsBottom], {
            height: '50%',
            duration: 0.4,
            ease: "power2.in",
            onComplete: () => {

                if (blackhole) {
                    blackhole.scale.set(70, 70, 70);
                    blackhole.position.set(0, 15000, camera.position.z - 25000);
                }

                setTimeout(() => {
                    gsap.to([eyelidsTop, eyelidsBottom], { height: '0%', duration: 0.15, ease: "expo.out" });

                    gsap.to(camera.position, {
                        x: "+=10",
                        y: "+=4",
                        duration: 0.05,
                        repeat: 15,
                        yoyo: true
                    });

                    setTimeout(() => {
                        gsap.to([eyelidsTop, eyelidsBottom], {
                            height: '50%',
                            duration: 2,
                            ease: "power2.inOut",
                            onComplete: () => {
                                finished = true;
                                playFinalCinematic();
                            }
                        });
                    }, 5000);
                }, 800);
            }
        });
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
        setTimeout(() => {
            if (typeof showNarrative === 'function') {
                showNarrative("The genjutsu fades... but the darkness remains.", [
                    { text: "Return to Menu", action: () => window.location.href = 'index.html' }
                ]);
            }
        }, 5000);
    }

    animate();
}
