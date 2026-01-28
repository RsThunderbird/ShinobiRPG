function initThreeGenjutsu() {
    const container = document.getElementById('genjutsu-three-container');
    const assets = window.assets;

    container.innerHTML = '';

    // --- SETUP SCENE ---
    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 20000);
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

    // Clear ALL UI
    const questUi = document.getElementById('quest-ui');
    if (questUi) questUi.classList.add('hidden');
    const compass = document.getElementById('compass-container');
    if (compass) compass.style.display = 'none';
    const narrative = document.getElementById('narrative-box');
    if (narrative) narrative.style.display = 'none';

    renderer.domElement.addEventListener('click', () => {
        renderer.domElement.requestPointerLock();
    });

    // Lights
    const ambientLight = new THREE.AmbientLight(0x660000, 0.8);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xff3300, 2.0);
    pointLight.position.set(0, 15, 0);
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
            showNotification("Quest: Escape the Genjutsu");
        }
    }, 2000);

    // --- BLOOD TRAIL TEXTURE ---
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 4096;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#990000';
    ctx.lineWidth = 20;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, canvas.height);
    for (let y = canvas.height; y > 0; y -= 15) {
        let x = canvas.width / 2 + (Math.random() - 0.5) * 60;
        ctx.lineTo(x, y);
        if (Math.random() > 0.6) {
            ctx.fillStyle = '#770000';
            ctx.beginPath();
            ctx.arc(x + (Math.random() - 0.5) * 40, y, Math.random() * 20, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.stroke();

    const pathTex = new THREE.CanvasTexture(canvas);
    pathTex.wrapS = THREE.RepeatWrapping;
    pathTex.wrapT = THREE.RepeatWrapping;
    pathTex.repeat.set(1, 10);

    // --- Environment ---
    const pathWidth = 10;
    const pathLength = 10000;

    // 1. Black Path
    const pathGeo = new THREE.PlaneGeometry(pathWidth, pathLength);
    const pathMat = new THREE.MeshLambertMaterial({ map: pathTex });
    const path = new THREE.Mesh(pathGeo, pathMat);
    path.rotation.x = -Math.PI / 2;
    path.position.z = -pathLength / 2 + 50;
    scene.add(path);

    // 2. Lava/Red Floors
    const lavaGeo = new THREE.PlaneGeometry(2000, pathLength);
    const lavaMat = new THREE.MeshLambertMaterial({
        color: 0x990000,
        emissive: 0x440000,
        transparent: true,
        opacity: 0.9
    });

    const leftLava = new THREE.Mesh(lavaGeo, lavaMat);
    leftLava.rotation.x = -Math.PI / 2;
    leftLava.position.set(-1000 - pathWidth / 2 - 50, -0.5, -pathLength / 2 + 50);
    scene.add(leftLava);

    const rightLava = new THREE.Mesh(lavaGeo, lavaMat);
    rightLava.rotation.x = -Math.PI / 2;
    rightLava.position.set(1000 + pathWidth / 2 + 50, -0.5, -pathLength / 2 + 50);
    scene.add(rightLava);

    // 3. Spikes/Mountains
    const mountainGeo = new THREE.ConeGeometry(4, 18, 4);
    const mountainMat = new THREE.MeshLambertMaterial({ color: 0x550000 });
    for (let i = 0; i < 800; i++) {
        const m = new THREE.Mesh(mountainGeo, mountainMat);
        let side = Math.random() > 0.5 ? 1 : -1;
        let x = (pathWidth / 2 + 2 + Math.random() * 20) * side;
        let z = -Math.random() * pathLength + 50;
        m.position.set(x, -2, z);
        m.scale.set(1, Math.random() * 2.5 + 0.5, 1);
        m.rotation.y = Math.random() * Math.PI;
        scene.add(m);
    }

    // --- SHARINGAN ---
    const texLoader = new THREE.TextureLoader();
    const sharinganTex = texLoader.load('assets/sharingan.png');
    const sharinganGeo = new THREE.PlaneGeometry(70, 70);
    const sharinganMat = new THREE.MeshBasicMaterial({
        map: sharinganTex,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        opacity: 0
    });
    const sharingan = new THREE.Mesh(sharinganGeo, sharinganMat);
    sharingan.position.set(0, 400, -150); // Fixed initial Y to avoid 'yeeting' up
    sharingan.rotation.x = Math.PI / 2;
    sharingan.visible = false;
    scene.add(sharingan);

    // --- Cinematic Flow ---
    let moveF = false;
    let currentSpeed = 0;
    let cameraShake = new THREE.Vector3();
    const baseSpeed = 0.25; // Reduced by ~90% (from 2.5)
    const playerHeight = 2.2;
    let pitch = 0;

    let cutsceneStarted = false;
    let lookingUp = false;
    let finished = false;
    let sharinganSpinSpeed = 0;
    let distanceWalked = 0;

    const dialogues = [
        { dist: 40, text: "Where's Zoro?" },
        { dist: 80, text: "Did i die?" },
        { dist: 120, text: "This place is giving me creeps." },
        { dist: 160, text: "I think i just saw a human skull..." },
        { dist: 200, text: "WHAT WAS THAT?" }
    ];
    let nextDialogueIdx = 0;

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
        if (window.currentStage !== 'genjutsu') return;
        if (finished) return;
        requestAnimationFrame(animate);

        const time = Date.now() * 0.001;

        // More erratic camera shake (increased intensity)
        cameraShake.set(
            Math.sin(time * 8) * 0.22,
            Math.cos(time * 7) * 0.22,
            Math.sin(time * 6) * 0.18
        );
        const driftX = Math.sin(time * 0.7) * 0.35;
        const swayZ = Math.sin(time * 0.5) * 0.45;

        if (!cutsceneStarted) {
            if (moveF) {
                currentSpeed = THREE.MathUtils.lerp(currentSpeed, baseSpeed, 0.03);
            } else {
                currentSpeed = THREE.MathUtils.lerp(currentSpeed, 0, 0.05);
            }

            camera.position.z -= currentSpeed;
            // More erratic straight-line movement drift
            camera.position.x += driftX * (currentSpeed / baseSpeed);
            camera.position.x *= 0.98;

            distanceWalked += currentSpeed;

            // Dialogue checkpoints
            if (nextDialogueIdx < dialogues.length && distanceWalked >= dialogues[nextDialogueIdx].dist) {
                const diag = dialogues[nextDialogueIdx];
                if (typeof showNarrative === 'function') {
                    showNarrative(diag.text);
                }
                nextDialogueIdx++;

                if (nextDialogueIdx === dialogues.length) {
                    setTimeout(() => {
                        triggerCutscene();
                    }, 2000);
                }
            }
        }

        const actualPos = camera.position.clone();
        camera.position.add(cameraShake);
        camera.position.y = playerHeight + Math.sin(time * 2.0) * 0.3; // More erratic bobbing

        if (!lookingUp) {
            const erraticYaw = Math.sin(time * 3.5) * 0.15 + Math.cos(time * 5.2) * 0.08;
            const erraticPitch = pitch + Math.sin(time * 4) * 0.05;
            camera.rotation.set(erraticPitch, erraticYaw, swayZ + driftX, 'YXZ');
        }

        if (sharingan && sharingan.visible) {
            sharingan.rotation.z += sharinganSpinSpeed;
            // Removed cumulative pulse to fix the 'bouncing' bug
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
                showNarrative("What's going on?", [
                    { text: "Look up", action: () => startForcedLookup() }
                ]);
            } else {
                startForcedLookup();
            }
        }, 1000);
    }

    function startForcedLookup() {
        lookingUp = true;

        gsap.to(camera.rotation, {
            x: Math.PI / 2.1,
            y: 0,
            z: 0,
            duration: 6,
            ease: "power2.inOut",
            onStart: () => {
                sharingan.visible = true;
                gsap.to(sharinganMat, { opacity: 1, duration: 4 });
            },
            onComplete: () => {
                // Fixed: Start growing and descending from the already established Y=400
                gsap.to(sharingan.scale, { x: 12, y: 12, z: 1, duration: 15, ease: "sine.inOut" });
                gsap.to(sharingan.position, { y: 50, z: -30, duration: 15, ease: "power1.in" });

                sharinganSpinSpeed = 0.005;
                gsap.to({ val: 0.005 }, {
                    val: 0.35,
                    duration: 12,
                    onUpdate: function () { sharinganSpinSpeed = this.targets()[0].val; }
                });

                setTimeout(() => {
                    blinkAndEpicZoom();
                }, 12000);
            }
        });
    }

    function blinkAndEpicZoom() {
        gsap.to([eyelidsTop, eyelidsBottom], {
            height: '50%',
            duration: 0.5,
            ease: "power2.inOut",
            onComplete: () => {
                // Stop music and hide sharingan to prevent clipping issues
                gsap.to(genjutsuMusic, { volume: 0, duration: 1, onComplete: () => genjutsuMusic.pause() });
                sharingan.visible = false;

                setTimeout(() => {
                    // Fix: Ensure eyes stay shut during the screen shake zoom
                    gsap.set([eyelidsTop, eyelidsBottom], { height: '50%' });

                    gsap.to(camera.position, {
                        x: "+=20",
                        y: "+=8",
                        duration: 0.05,
                        repeat: 40,
                        yoyo: true
                    });

                    setTimeout(() => {
                        finishGenjutsu();
                    }, 1500);
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
        video.muted = true;
        video.autoplay = true;
        video.className = 'cinematic-video-small';
        videoContainer.appendChild(video);

        video.onended = () => {
            // New: Display post-video image
            video.remove();
            const postImg = document.createElement('img');
            postImg.src = 'https://i.postimg.cc/SN28MYFj/image.png';
            postImg.className = 'post-cinematic-image';
            videoContainer.appendChild(postImg);

            setTimeout(() => {
                gsap.to(videoContainer, {
                    opacity: 0, duration: 1.5, onComplete: () => {
                        videoContainer.remove();
                        // Final eye shut
                        gsap.to([eyelidsTop, eyelidsBottom], {
                            height: '50%',
                            duration: 1,
                            onComplete: () => showAkatsukiBanner()
                        });
                    }
                });
            }, 2000);
        };
    }

    function showAkatsukiBanner() {
        const banner = document.createElement('div');
        banner.className = 'akatsuki-banner';
        banner.innerHTML = `<div class="banner-content"><h1> COMPLETE</h1><h2 class="akatsuki-text">Done! You can now continue on discord.</h2></div>`;
        document.body.appendChild(banner);
        gsap.from(".banner-content", { y: 50, opacity: 0, duration: 2, ease: "power3.out" });

        setTimeout(() => {
            gsap.to(banner, { opacity: 0, duration: 2, onComplete: () => banner.remove() });
        }, 7000);
    }

    animate();
}
