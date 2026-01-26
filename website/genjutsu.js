function initThreeGenjutsu() {
    const container = document.getElementById('genjutsu-three-container');
    const assets = window.assets;

    container.innerHTML = '';

    // --- SETUP SCENE (CLEAR & TRANSPARENT) ---
    const scene = new THREE.Scene();
    scene.background = null;
    // NO FOG - REMOVING ALL TINTING

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 10, 1000000);
    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true // CRITICAL: Allows the sky behind the canvas to show through
    });
    renderer.setClearColor(0x000000, 0); // Sets clear color to black with 0 opacity (transparent)
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const crosshair = document.getElementById('crosshair');
    if (crosshair) crosshair.style.display = 'block';

    renderer.domElement.addEventListener('click', () => {
        renderer.domElement.requestPointerLock();
    });

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);
    const spotLight = new THREE.SpotLight(0xffffff, 1.0);
    spotLight.position.set(0, 50, 0);
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
    const pathWidth = 8;
    const pathLength = 600;
    const groundGeo = new THREE.PlaneGeometry(pathWidth, pathLength, 1, 100);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x050000 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.z = -pathLength / 2;
    scene.add(ground);

    // --- FBX BLACKHOLE ---
    const fbxLoader = new THREE.FBXLoader();
    fbxLoader.setResourcePath('assets/textures/');
    let blackhole;
    let bhOrbitAngle = 0;

    fbxLoader.load('assets/blackhole.fbx', (object) => {
        blackhole = object;
        // Positioned in the "vacuum" far above
        blackhole.position.set(0, 60000, -80000);
        blackhole.scale.set(0.1, 0.1, 0.1);
        blackhole.rotation.set(Math.PI / 4, 0, 0);

        // MATERIAL CLEANUP
        blackhole.traverse((child) => {
            if (child.isMesh) {
                // HIDE ANY INTERIOR SKY BOXES/SPHERES IN THE MODEL
                if (child.name.toLowerCase().includes('sky') || child.name.toLowerCase().includes('dome') || child.scale.x > 1000) {
                    child.visible = false;
                    return;
                }

                const fixMat = (m) => {
                    return new THREE.MeshBasicMaterial({
                        map: m.map,
                        color: 0xffffff,
                        fog: false, // ENSURE IT IGNORES ANY GLOBAL FOG (even though we removed it)
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

    // --- Cinematic Flow ---
    let moveF = false;
    let cameraShake = new THREE.Vector3();
    const baseSpeed = 0.222;
    const playerHeight = 2.2;
    let yaw = 0, pitch = 0;

    let cutsceneStarted = false;
    let finished = false;

    camera.position.set(0, playerHeight, 0);

    const onKeyDown = (e) => {
        if (e.code === 'KeyW' && !cutsceneStarted) moveF = true;
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
            if (camera.position.z <= -pathLength + 100) {
                triggerCutscene();
            }
        }

        const actualPos = camera.position.clone();
        camera.position.add(cameraShake);
        camera.position.y = playerHeight + Math.sin(time * 1.5) * 0.1;

        if (!cutsceneStarted) {
            camera.rotation.set(pitch, yaw, Math.sin(time * 0.5) * 0.15 + driftX, 'YXZ');
        }

        if (blackhole) {
            bhOrbitAngle += 0.001;
            const orbitRad = 10000;
            blackhole.position.x = Math.cos(bhOrbitAngle) * orbitRad;
            blackhole.position.y = 60000 + Math.sin(bhOrbitAngle) * orbitRad;
            blackhole.rotation.y += 0.002;
        }

        renderer.render(scene, camera);
        camera.position.copy(actualPos);
    }

    function triggerCutscene() {
        if (cutsceneStarted) return;
        cutsceneStarted = true;
        moveF = false;

        console.log("[GENJUTSU] Starting forced lookup cutscene.");

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
        // 2. The Blink (Close Eyes)
        gsap.to([eyelidsTop, eyelidsBottom], {
            height: '50%',
            duration: 0.4,
            ease: "power2.in",
            onComplete: () => {

                // 3. ZOOM BLACKHOLE EXTREMELY CLOSER while eyes are shut
                if (blackhole) {
                    blackhole.scale.set(65, 65, 65);
                    blackhole.position.set(0, 15000, camera.position.z - 15000);
                }

                setTimeout(() => {
                    // 4. Snap Eyes Open (BOOM MOMENT)
                    gsap.to([eyelidsTop, eyelidsBottom], { height: '0%', duration: 0.15, ease: "expo.out" });

                    // Violent impact shake
                    gsap.to(camera.position, {
                        x: "+=8",
                        y: "+=3",
                        duration: 0.05,
                        repeat: 12,
                        yoyo: true
                    });

                    // Hold the horror for a moment, then fade out
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
