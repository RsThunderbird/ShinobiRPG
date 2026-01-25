function initThreeGenjutsu() {
    const container = document.getElementById('genjutsu-three-container');
    const assets = window.assets;

    container.innerHTML = '';

    const scene = new THREE.Scene();
    scene.background = null; // Transparent background to show "real sky" if applicable

    // Renderer with Alpha support
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0); // Clear to fully transparent
    container.appendChild(renderer.domElement);

    const crosshair = document.getElementById('crosshair');
    if (crosshair) crosshair.style.display = 'block';

    renderer.domElement.addEventListener('click', () => {
        renderer.domElement.requestPointerLock();
    });

    const ambientLight = new THREE.AmbientLight(0xff0000, 0.2);
    scene.add(ambientLight);

    const spotLight = new THREE.SpotLight(0xff0000, 1.0);
    spotLight.position.set(0, 50, 0);
    scene.add(spotLight);

    const eyelidsTop = document.querySelector('.eyelid.top');
    const eyelidsBottom = document.querySelector('.eyelid.bottom');
    const storyContainer = document.getElementById('story-container');

    // Initial Eye Opening
    gsap.to([eyelidsTop, eyelidsBottom], { height: '0%', duration: 4, ease: 'power1.inOut' });
    gsap.to(storyContainer, { filter: 'blur(0px)', duration: 5 });

    setTimeout(() => {
        if (typeof showNarrative === 'function') {
            showNarrative("Where the heck am i..?");
        }
    }, 2000);

    // --- Terrain: Dark Path ---
    const pathWidth = 8;
    const pathLength = 600;
    const groundGeo = new THREE.PlaneGeometry(pathWidth, pathLength, 1, 100);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x050000 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.z = -pathLength / 2;
    scene.add(ground);

    // --- SECONDARY OBJECTS (Archers) ---
    const gltfLoader = new THREE.GLTFLoader();
    for (let i = 0; i < 30; i++) {
        gltfLoader.load(assets.archerModel, (gltf) => {
            const archer = gltf.scene;
            archer.scale.set(1.5, 1.5, 1.5);
            const side = i % 2 === 0 ? 1 : -1;
            archer.position.set(side * 5, 0, -i * 20);
            archer.lookAt(0, 1, archer.position.z + 10);
            scene.add(archer);
            const redLight = new THREE.PointLight(0xff0000, 0.5, 10);
            redLight.position.set(0, 2, 0);
            archer.add(redLight);
        });
    }

    // --- PRIMARY OBJECT: THE BLACKHOLE (STABLE VERSION) ---
    const fbxLoader = new THREE.FBXLoader();
    fbxLoader.setResourcePath('assets/textures/');
    let blackhole;
    let bhOrbitAngle = 0;

    fbxLoader.load('assets/blackhole.fbx', (object) => {
        blackhole = object;
        // Start very high and scaled down
        blackhole.position.set(0, 40000, -80000);
        blackhole.scale.set(0.1, 0.1, 0.1);
        blackhole.rotation.set(Math.PI / 4, 0, 0);

        // MATERIAL FIX: Force original colors and disable shading interaction
        blackhole.traverse((child) => {
            if (child.isMesh) {
                const fixMat = (m) => {
                    return new THREE.MeshBasicMaterial({
                        map: m.map,
                        color: 0xffffff,
                        fog: false,
                        transparent: true,
                        opacity: m.opacity || 1
                    });
                };
                if (Array.isArray(child.material)) {
                    child.material = child.material.map(fixMat);
                } else {
                    child.material = fixMat(child.material);
                }
            }
        });
        scene.add(blackhole);
    });

    // --- MOVEMENT LOGIC (MANUAL START) ---
    let moveF = false;
    let cameraShake = new THREE.Vector3();
    const baseSpeed = 0.25;
    const playerHeight = 2.2;
    let yaw = 0, pitch = 0;

    camera.position.set(0, playerHeight, 0);

    const onKeyDown = (e) => { if (e.code === 'KeyW') moveF = true; };
    const onKeyUp = (e) => { if (e.code === 'KeyW') moveF = false; };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === renderer.domElement && !finished) {
            yaw -= e.movementX * 0.002;
            pitch -= e.movementY * 0.002;
            pitch = Math.max(-1.4, Math.min(1.4, pitch));
        }
    });

    let finished = false;
    let cutsceneStarted = false;

    function animate() {
        requestAnimationFrame(animate);

        const time = Date.now() * 0.001;

        // Always apply subtle shake and drift for dizziness
        cameraShake.set(Math.sin(time * 6) * 0.08, Math.cos(time * 5) * 0.08, Math.sin(time * 4) * 0.04);
        const driftX = Math.sin(time * 0.4) * 0.08;

        if (!cutsceneStarted) {
            if (moveF) {
                camera.position.z -= baseSpeed;
                camera.position.x += driftX;
            }
            camera.position.x *= 0.98;

            // Trigger Cutscene at a certain point
            if (camera.position.z <= -pathLength + 100) {
                startLookUpCutscene();
            }
        }

        const actualPos = camera.position.clone();
        camera.position.add(cameraShake);
        camera.position.y = playerHeight + Math.sin(time * 1.5) * 0.1;

        // If cutscene is active, rotation is handled by GSAP
        if (!cutsceneStarted) {
            camera.rotation.set(pitch, yaw, Math.sin(time * 0.5) * 0.1 + driftX, 'YXZ');
        }

        // --- BLACKHOLE STABLE MOVEMENT ---
        if (blackhole) {
            bhOrbitAngle += 0.001;
            const orbitRad = 10000;
            blackhole.position.x = Math.cos(bhOrbitAngle) * orbitRad;
            blackhole.position.y = 40000 + Math.sin(bhOrbitAngle) * orbitRad;
            blackhole.rotation.y += 0.002;
        }

        renderer.render(scene, camera);
        camera.position.copy(actualPos);
    }

    function startLookUpCutscene() {
        if (cutsceneStarted) return;
        cutsceneStarted = true;
        moveF = false; // Stop movement

        console.log("[GENJUTSU] Triggering lookup cutscene.");

        // 1. Force Camera to Look Up
        gsap.to(camera.rotation, {
            x: Math.PI / 2.5,
            y: 0,
            z: 0,
            duration: 3,
            ease: "power2.inOut",
            onComplete: () => {
                triggerBlinkAndZoom();
            }
        });
    }

    function triggerBlinkAndZoom() {
        // 2. The Blink
        gsap.to([eyelidsTop, eyelidsBottom], {
            height: '50%',
            duration: 0.4,
            ease: "power2.in",
            onComplete: () => {

                // 3. Move/Scale Blackhole EXTREMELY CLOSER while eyes closed
                if (blackhole) {
                    blackhole.scale.set(60, 60, 60);
                    blackhole.position.set(0, 5000, camera.position.z - 10000);
                }

                setTimeout(() => {
                    // 4. Snap EYES OPEN
                    gsap.to([eyelidsTop, eyelidsBottom], {
                        height: '0%',
                        duration: 0.15,
                        ease: "expo.out"
                    });

                    // Dramatic impact shake
                    gsap.to(camera.position, {
                        x: "+=5",
                        y: "+=2",
                        duration: 0.05,
                        repeat: 10,
                        yoyo: true
                    });

                    // 5. Play final sequence after the shock
                    setTimeout(() => {
                        gsap.to([eyelidsTop, eyelidsBottom], {
                            height: '50%',
                            duration: 1.5,
                            ease: "power3.inOut",
                            onComplete: () => {
                                finished = true;
                                playFinalCinematic();
                            }
                        });
                    }, 4000);
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
