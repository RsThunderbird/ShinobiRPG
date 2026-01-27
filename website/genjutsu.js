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
        alpha: true // CRITICAL: Transparent sky
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

    // Lights (Dim red for mood)
    const ambientLight = new THREE.AmbientLight(0x440000, 0.6);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xff0000, 1.2);
    pointLight.position.set(0, 10, 0);
    scene.add(pointLight);

    // Initial eye opening animation
    const eyelidsTop = document.querySelector('.eyelid.top');
    const eyelidsBottom = document.querySelector('.eyelid.bottom');
    const storyContainer = document.getElementById('story-container');

    gsap.to([eyelidsTop, eyelidsBottom], { height: '0%', duration: 4, ease: 'power2.inOut' });
    gsap.to(storyContainer, { filter: 'blur(0px)', duration: 5 });

    // Background Music
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

    // --- BLOOD TRAIL TEXTURE ---
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 4096;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000000'; // Black path
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Blood Trail
    ctx.strokeStyle = '#880000';
    ctx.lineWidth = 15;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, canvas.height);
    for (let y = canvas.height; y > 0; y -= 20) {
        let x = canvas.width / 2 + (Math.random() - 0.5) * 50;
        ctx.lineTo(x, y);
        // Blood splatters
        if (Math.random() > 0.7) {
            ctx.fillStyle = '#660000';
            ctx.beginPath();
            ctx.arc(x + (Math.random() - 0.5) * 30, y, Math.random() * 15, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.stroke();

    const pathTex = new THREE.CanvasTexture(canvas);
    pathTex.wrapS = THREE.RepeatWrapping;
    pathTex.wrapT = THREE.RepeatWrapping;

    // --- Path ---
    const pathWidth = 10;
    const pathLength = 5000;
    const pathGeo = new THREE.PlaneGeometry(pathWidth, pathLength);
    const pathMat = new THREE.MeshLambertMaterial({ map: pathTex });
    const path = new THREE.Mesh(pathGeo, pathMat);
    path.rotation.x = -Math.PI / 2;
    path.position.z = -pathLength / 2 + 50;
    scene.add(path);

    // --- ERRATIC RED MOUNTAINS (Small & Spiky) ---
    const mountainGeo = new THREE.ConeGeometry(3, 15, 4);
    const mountainMat = new THREE.MeshLambertMaterial({ color: 0x660000 });
    for (let i = 0; i < 400; i++) {
        const m = new THREE.Mesh(mountainGeo, mountainMat);
        let side = Math.random() > 0.5 ? 1 : -1;
        let x = (pathWidth / 2 + 5 + Math.random() * 40) * side;
        let z = -Math.random() * pathLength + 50;
        m.position.set(x, 0, z);
        m.scale.set(1, Math.random() * 2 + 0.5, 1);
        m.rotation.y = Math.random() * Math.PI;
        scene.add(m);
    }

    // --- SHARINGAN ---
    const texLoader = new THREE.TextureLoader();
    const sharinganTex = texLoader.load('assets/sharingan.png');
    const sharinganGeo = new THREE.PlaneGeometry(60, 60);
    const sharinganMat = new THREE.MeshBasicMaterial({
        map: sharinganTex,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        opacity: 0
    });
    const sharingan = new THREE.Mesh(sharinganGeo, sharinganMat);
    sharingan.position.set(0, 400, -100);
    sharingan.rotation.x = Math.PI / 2;
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

        // Forced Lookup to Zenith
        gsap.to(camera.rotation, {
            x: Math.PI / 2.1,
            y: 0,
            z: 0,
            duration: 5,
            ease: "power2.inOut",
            onStart: () => {
                sharingan.visible = true;
                gsap.to(sharinganMat, { opacity: 1, duration: 3 });
            },
            onComplete: () => {
                gsap.to(sharingan.scale, { x: 10, y: 10, z: 1, duration: 12, ease: "sine.inOut" });
                gsap.to(sharingan.position, { y: 60, z: -20, duration: 12, ease: "power1.in" });

                sharinganSpinSpeed = 0.005;
                gsap.to({ val: 0.005 }, {
                    val: 0.25,
                    duration: 10,
                    onUpdate: function () { sharinganSpinSpeed = this.targets()[0].val; }
                });

                setTimeout(() => {
                    blinkAndEpicZoom();
                }, 10000);
            }
        });
    }

    function blinkAndEpicZoom() {
        gsap.to([eyelidsTop, eyelidsBottom], {
            height: '50%',
            duration: 0.5,
            ease: "power2.inOut",
            onComplete: () => {
                gsap.to(genjutsuMusic, { volume: 0, duration: 1, onComplete: () => genjutsuMusic.pause() });

                setTimeout(() => {
                    gsap.to([eyelidsTop, eyelidsBottom], { height: '0%', duration: 0.15, ease: "expo.out" });

                    gsap.to(camera.position, {
                        x: "+=12",
                        y: "+=5",
                        duration: 0.05,
                        repeat: 25,
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
        video.muted = false;
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
