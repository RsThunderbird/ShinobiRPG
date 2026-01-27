function initThreeGenjutsu() {
    const container = document.getElementById('genjutsu-three-container');
    const assets = window.assets;

    container.innerHTML = '';

    // --- SETUP SCENE (HELLISH RED) ---
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

    // Lights (Reddish Tint)
    const ambientLight = new THREE.AmbientLight(0xff3333, 0.4);
    scene.add(ambientLight);
    const spotLight = new THREE.SpotLight(0xff0000, 1.2);
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

    // --- Terrain (Narrower Feel) ---
    const pathWidth = 8;
    const pathLength = 600;
    const groundGeo = new THREE.PlaneGeometry(pathWidth, pathLength, 1, 100);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x110000 }); // Reddish black ground
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
        // Positioned in the "vacuum" but not at zenith
        blackhole.position.set(0, 40000, -50000);
        blackhole.scale.set(0.1, 0.1, 0.1);
        blackhole.rotation.set(0, 0, 0);

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
    let currentSpeed = 0;
    let cameraShake = new THREE.Vector3();
    const baseSpeed = 2.0; // Slowed down for "walking" feel (was 2.0)
    const playerHeight = 2.2;
    let yaw = 0, pitch = 0;

    let cutsceneStarted = false;
    let lookingUp = false;
    let finished = false;
    let bhSpinSpeed = 0;
    let distanceWalked = 0; // Track actual distance traveled

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
            // LOCK YAW (Force straight line) - Disable mouse X
            // yaw -= e.movementX * 0.002; 

            // Allow slight pitch look (up/down) but restricted
            pitch -= e.movementY * 0.002;
            pitch = Math.max(-0.6, Math.min(0.6, pitch));
        }
    });

    function animate() {
        requestAnimationFrame(animate);

        const time = Date.now() * 0.001;
        // More violent shake & sway for "drunken" feel
        cameraShake.set(
            Math.sin(time * 7) * 0.12,
            Math.cos(time * 6) * 0.12,
            Math.sin(time * 5) * 0.08
        );
        const driftX = Math.sin(time * 0.5) * 0.15;
        const swayZ = Math.sin(time * 0.3) * 0.2;

        if (!cutsceneStarted) {
            // "Unresponsive" inertia-based movement
            if (moveF) {
                currentSpeed = THREE.MathUtils.lerp(currentSpeed, baseSpeed, 0.03);
            } else {
                currentSpeed = THREE.MathUtils.lerp(currentSpeed, 0, 0.05);
            }

            camera.position.z -= currentSpeed;
            camera.position.x += driftX * (currentSpeed / baseSpeed);
            camera.position.x *= 0.98;

            // Track actual distance walked
            distanceWalked += currentSpeed;

            // REACHED THE POINT -> TRIGGER CUTSCENE (after walking 10 meters)
            if (distanceWalked >= 10) {
                triggerCutscene();
            }
        }

        const actualPos = camera.position.clone();
        camera.position.add(cameraShake);
        camera.position.y = playerHeight + Math.sin(time * 1.5) * 0.15;

        if (!lookingUp) {
            // Rotation has a drunken sway (Erratic)
            // We ignore mouse yaw to force "walking in a straight line"
            const erraticYaw = Math.sin(time * 2.5) * 0.08 + Math.cos(time * 4.2) * 0.04;
            const erraticPitch = pitch + Math.sin(time * 3) * 0.03;

            camera.rotation.set(erraticPitch, erraticYaw, swayZ + driftX, 'YXZ');
        }

        if (blackhole) {
            // No orbit, just rotation on its own axis when triggered
            blackhole.rotation.y += bhSpinSpeed;
        }

        renderer.render(scene, camera);
        camera.position.copy(actualPos);
    }

    function triggerCutscene() {
        if (cutsceneStarted) return;
        cutsceneStarted = true;
        moveF = false;
        currentSpeed = 0;

        console.log("[GENJUTSU] Triggering dialogue before lookup.");

        // Pause for effectiveness before looking up
        setTimeout(() => {
            if (typeof showNarrative === 'function') {
                showNarrative("What's going on??", [
                    { text: "...", action: () => startForcedLookup() }
                ]);
            } else {
                startForcedLookup();
            }
        }, 1500);
    }

    function startForcedLookup() {
        lookingUp = true;
        // 1. Forced Lookup Animation
        gsap.to(camera.rotation, {
            x: Math.PI / 3, // Look up at the blackhole
            y: 0,
            z: 0,
            duration: 3,
            ease: "power2.inOut",
            onComplete: () => {
                // Blackhole starts spinning
                bhSpinSpeed = 0.02;
                setTimeout(() => {
                    blinkAndEpicZoom();
                }, 2000);
            }
        });
    }

    function blinkAndEpicZoom() {
        // 2. The Blink (Close Eyes) - 3 seconds closed as requested
        gsap.to([eyelidsTop, eyelidsBottom], {
            height: '50%',
            duration: 0.5,
            ease: "power2.inOut",
            onComplete: () => {
                // Keep eyes closed for 3 seconds
                setTimeout(() => {
                    // 3. ZOOM BLACKHOLE EXTREMELY CLOSER while eyes are shut
                    if (blackhole) {
                        // "change its width" -> Scale up dramatically but not engulfing
                        // "dont bring it down" -> Keep Y at 40000, far at Z -50000
                        // Scale 10x instead of 15x so it grows but stays in distance
                        blackhole.scale.set(10, 10, 10);
                        blackhole.position.set(0, 40000, -50000);
                        bhSpinSpeed = 0.1; // Spin much faster
                    }

                    // 4. Snap Eyes Open (BOOM MOMENT)
                    gsap.to([eyelidsTop, eyelidsBottom], { height: '0%', duration: 0.15, ease: "expo.out" });

                    // Violent impact shake
                    gsap.to(camera.position, {
                        x: "+=6",
                        y: "+=2.5",
                        duration: 0.05,
                        repeat: 15,
                        yoyo: true
                    });

                    // Dialogue "Oh god..."
                    setTimeout(() => {
                        if (typeof showNarrative === 'function') {
                            showNarrative("Oh god...", [
                                { text: "...", action: () => finishGenjutsu() }
                            ]);
                        } else {
                            finishGenjutsu();
                        }
                    }, 1500);
                }, 3000);
            }
        });
    }

    function finishGenjutsu() {
        gsap.to([eyelidsTop, eyelidsBottom], {
            height: '50%',
            duration: 1.5,
            ease: "power2.inOut",
            onComplete: () => {
                finished = true;
                playFinalCinematic();
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
