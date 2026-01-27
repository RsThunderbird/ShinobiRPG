function initThreeGenjutsu() {
    const container = document.getElementById('genjutsu-three-container');
    const assets = window.assets;

    container.innerHTML = '';

    // --- SETUP SCENE ---
    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
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

    // Lights
    const ambientLight = new THREE.AmbientLight(0xff3333, 0.5);
    scene.add(ambientLight);
    const spotLight = new THREE.SpotLight(0xff0000, 1.5);
    spotLight.position.set(0, 50, 0);
    scene.add(spotLight);

    // Initial eye opening animation
    const eyelidsTop = document.querySelector('.eyelid.top');
    const eyelidsBottom = document.querySelector('.eyelid.bottom');
    const storyContainer = document.getElementById('story-container');

    gsap.to([eyelidsTop, eyelidsBottom], { height: '0%', duration: 4, ease: 'power2.inOut' });
    gsap.to(storyContainer, { filter: 'blur(0px)', duration: 5 });

    // Background Music with Fade In
    const genjutsuMusic = new Audio('assets/genjutsubg.mp3');
    genjutsuMusic.currentTime = 25;
    genjutsuMusic.volume = 0;
    genjutsuMusic.loop = true;
    genjutsuMusic.play().catch(e => console.log("Audio play failed:", e));
    gsap.to(genjutsuMusic, { volume: 0.5, duration: 4 });

    setTimeout(() => {
        if (typeof showNarrative === 'function') {
            showNarrative("Where the heck am i..?");
        }
        if (typeof showNotification === 'function') {
            showNotification("Quest: Reach the end of this narrow path");
        }
    }, 2000);

    // --- Terrain ---
    const pathWidth = 8;
    const pathLength = 2000; // Longer path
    const groundGeo = new THREE.PlaneGeometry(pathWidth, pathLength, 1, 100);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x110000 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.z = -pathLength / 2 + 50;
    scene.add(ground);

    // --- SHARINGAN ---
    const texLoader = new THREE.TextureLoader();
    const sharinganTex = texLoader.load('assets/sharingan.png');
    const sharinganGeo = new THREE.PlaneGeometry(15, 15);
    const sharinganMat = new THREE.MeshBasicMaterial({
        map: sharinganTex,
        transparent: true,
        side: THREE.DoubleSide,
        depthTest: false
    });
    const sharingan = new THREE.Mesh(sharinganGeo, sharinganMat);
    sharingan.position.set(0, 80, 0); // Zenith
    sharingan.rotation.x = Math.PI / 2;
    sharingan.scale.set(0.01, 0.01, 0.01);
    sharingan.visible = false;
    scene.add(sharingan);

    // --- Cinematic Flow ---
    let moveF = false;
    let currentSpeed = 0;
    let cameraShake = new THREE.Vector3();
    const baseSpeed = 2.0;
    const playerHeight = 2.2;
    let pitch = 0;

    let cutsceneStarted = false;
    let lookingUp = false;
    let finished = false;
    let sharinganSpinSpeed = 0;
    let distanceWalked = 0;

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
            pitch -= e.movementY * 0.002;
            pitch = Math.max(-0.6, Math.min(0.6, pitch));
        }
    });

    function animate() {
        if (finished) return;
        requestAnimationFrame(animate);

        const time = Date.now() * 0.001;

        cameraShake.set(
            Math.sin(time * 7) * 0.12,
            Math.cos(time * 6) * 0.12,
            Math.sin(time * 5) * 0.08
        );
        const driftX = Math.sin(time * 0.5) * 0.15;
        const swayZ = Math.sin(time * 0.3) * 0.2;

        if (!cutsceneStarted) {
            if (moveF) {
                currentSpeed = THREE.MathUtils.lerp(currentSpeed, baseSpeed, 0.03);
            } else {
                currentSpeed = THREE.MathUtils.lerp(currentSpeed, 0, 0.05);
            }

            camera.position.z -= currentSpeed;
            camera.position.x += driftX * (currentSpeed / baseSpeed);
            camera.position.x *= 0.98;

            distanceWalked += currentSpeed;

            // REACHED 100 METERS
            if (distanceWalked >= 100) {
                triggerCutscene();
            }
        }

        const actualPos = camera.position.clone();
        camera.position.add(cameraShake);
        camera.position.y = playerHeight + Math.sin(time * 1.5) * 0.15;

        if (!lookingUp) {
            const erraticYaw = Math.sin(time * 2.5) * 0.08 + Math.cos(time * 4.2) * 0.04;
            const erraticPitch = pitch + Math.sin(time * 3) * 0.03;
            camera.rotation.set(erraticPitch, erraticYaw, swayZ + driftX, 'YXZ');
        }

        if (sharingan && sharingan.visible) {
            sharingan.rotation.z += sharinganSpinSpeed;
        }

        renderer.render(scene, camera);
        camera.position.copy(actualPos);
    }

    function triggerCutscene() {
        if (cutsceneStarted) return;
        cutsceneStarted = true;
        moveF = false;
        currentSpeed = 0;

        setTimeout(() => {
            if (typeof showNarrative === 'function') {
                showNarrative("I feel like im about to..", [
                    {
                        text: "...", action: () => {
                            showNarrative("What's going on?", [
                                { text: "...", action: () => startForcedLookup() }
                            ]);
                        }
                    }
                ]);
            } else {
                startForcedLookup();
            }
        }, 1500);
    }

    function startForcedLookup() {
        lookingUp = true;
        sharingan.visible = true;

        // Forced Lookup to Zenith
        gsap.to(camera.rotation, {
            x: Math.PI / 2,
            y: 0,
            z: 0,
            duration: 4,
            ease: "power2.inOut",
            onComplete: () => {
                // Sharingan starts spinning and growing
                gsap.to(sharingan.scale, { x: 5, y: 5, z: 5, duration: 8, ease: "sine.inOut" });
                gsap.to(sharingan.position, { y: 20, duration: 8, ease: "sine.inOut" });

                // Gradually increase spin
                gsap.to({ val: 0 }, {
                    val: 0.05,
                    duration: 6,
                    onUpdate: function () { sharinganSpinSpeed = this.targets()[0].val; }
                });

                setTimeout(() => {
                    blinkAndEpicZoom();
                }, 6000);
            }
        });
    }

    function blinkAndEpicZoom() {
        gsap.to([eyelidsTop, eyelidsBottom], {
            height: '50%',
            duration: 0.5,
            ease: "power2.inOut",
            onComplete: () => {
                // Stop music
                gsap.to(genjutsuMusic, { volume: 0, duration: 1, onComplete: () => genjutsuMusic.pause() });

                setTimeout(() => {
                    // Open eyes for the boom moment
                    gsap.to([eyelidsTop, eyelidsBottom], { height: '0%', duration: 0.15, ease: "expo.out" });

                    // Violent impact shake
                    gsap.to(camera.position, {
                        x: "+=8",
                        y: "+=3",
                        duration: 0.05,
                        repeat: 20,
                        yoyo: true
                    });

                    setTimeout(() => {
                        finishGenjutsu();
                    }, 1000);
                }, 1500);
            }
        });
    }

    function finishGenjutsu() {
        gsap.to([eyelidsTop, eyelidsBottom], {
            height: '50%',
            duration: 1.0,
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
        video.muted = false; // Allow sound for the epic ending if needed
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
