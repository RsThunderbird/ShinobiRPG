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

    // Ensure all Forest UI is hidden
    document.getElementById('quest-ui').classList.add('hidden');
    document.getElementById('compass-container').style.display = 'none';

    const crosshair = document.getElementById('crosshair');
    if (crosshair) crosshair.style.display = 'block';

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

    gsap.set([eyelidsTop, eyelidsBottom], { height: '50%' });
    gsap.to([eyelidsTop, eyelidsBottom], { height: '0%', duration: 4, ease: 'power2.inOut', delay: 1 });
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
            showNarrative("Where... where am i?");
        }
    }, 3000);

    // --- BLOOD TRAIL TEXTURE ---
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 4096;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#990000';
    ctx.lineWidth = 20;
    ctx.strokeRect(0, 0, 512, 4096);

    const pathTex = new THREE.CanvasTexture(canvas);
    pathTex.wrapS = THREE.RepeatWrapping;
    pathTex.wrapT = THREE.RepeatWrapping;
    pathTex.repeat.set(1, 10);

    // --- Environment ---
    const pathWidth = 10;
    const pathLength = 10000;
    const pathGeo = new THREE.PlaneGeometry(pathWidth, pathLength);
    const pathMat = new THREE.MeshLambertMaterial({ map: pathTex });
    const path = new THREE.Mesh(pathGeo, pathMat);
    path.rotation.x = -Math.PI / 2;
    path.position.z = -pathLength / 2 + 50;
    scene.add(path);

    const lavaGeo = new THREE.PlaneGeometry(2000, pathLength);
    const lavaMat = new THREE.MeshLambertMaterial({ color: 0x990000, emissive: 0x440000, transparent: true, opacity: 0.9 });
    const leftLava = new THREE.Mesh(lavaGeo, lavaMat);
    leftLava.rotation.x = -Math.PI / 2;
    leftLava.position.set(-1000 - pathWidth / 2 - 50, -0.5, -pathLength / 2 + 50);
    scene.add(leftLava);
    const rightLava = new THREE.Mesh(lavaGeo, lavaMat);
    rightLava.rotation.x = -Math.PI / 2;
    rightLava.position.set(1000 + pathWidth / 2 + 50, -0.5, -pathLength / 2 + 50);
    scene.add(rightLava);

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
    sharingan.position.set(0, 400, -150);
    sharingan.rotation.x = Math.PI / 2;
    sharingan.visible = false;
    scene.add(sharingan);

    // --- Cinematic Flow ---
    let moveF = false;
    let currentSpeed = 0;
    const baseSpeed = 0.25;
    const playerHeight = 2.2;
    let pitch = 0;
    let cutsceneStarted = false;
    let lookingUp = false;
    let finished = false;
    let sharinganSpinSpeed = 0;
    let distanceWalked = 0;

    const dialogues = [
        { dist: 40, text: "Wait, everything is red..." },
        { dist: 80, text: "Zoro? Where did he go?" }
    ];
    let nextDialogueIdx = 0;

    camera.position.set(0, playerHeight, 0);

    const onKeyDown = (e) => { if (e.code === 'KeyW' && !cutsceneStarted) moveF = true; };
    const onKeyUp = (e) => { if (e.code === 'KeyW') moveF = false; };
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

        if (!cutsceneStarted) {
            if (moveF) currentSpeed = THREE.MathUtils.lerp(currentSpeed, baseSpeed, 0.03);
            else currentSpeed = THREE.MathUtils.lerp(currentSpeed, 0, 0.05);

            camera.position.z -= currentSpeed;
            camera.position.x += Math.sin(time * 0.7) * 0.45 * (currentSpeed / baseSpeed);
            distanceWalked += currentSpeed;

            if (nextDialogueIdx < dialogues.length && distanceWalked >= dialogues[nextDialogueIdx].dist) {
                showNarrative(dialogues[nextDialogueIdx].text);
                nextDialogueIdx++;
                if (nextDialogueIdx === dialogues.length) {
                    setTimeout(triggerCutscene, 3000);
                }
            }
        }

        const actualPos = camera.position.clone();
        camera.position.y = playerHeight + Math.sin(time * 2.0) * 0.3;
        if (!lookingUp) {
            camera.rotation.set(pitch + Math.sin(time * 4) * 0.05, Math.sin(time * 3.5) * 0.1, 0, 'YXZ');
        }

        if (sharingan && sharingan.visible) {
            sharingan.rotation.z += sharinganSpinSpeed;
        }

        renderer.render(scene, camera);
        camera.position.copy(actualPos);
    }
    animate();

    function triggerCutscene() {
        if (cutsceneStarted) return;
        cutsceneStarted = true;
        moveF = false;
        currentSpeed = 0;
        showNarrative("What is that in the sky..?", [
            { text: "Look Up", action: () => startForcedLookup() }
        ]);
    }

    function startForcedLookup() {
        lookingUp = true;
        gsap.to(camera.rotation, {
            x: Math.PI / 2.1, y: 0, z: 0, duration: 6, ease: "power2.inOut",
            onStart: () => {
                sharingan.visible = true;
                gsap.to(sharinganMat, { opacity: 1, duration: 4 });
            },
            onComplete: () => {
                gsap.to(sharingan.scale, { x: 15, y: 15, z: 1, duration: 15, ease: "sine.inOut" });
                gsap.to(sharingan.position, { y: 30, z: -20, duration: 15, ease: "power1.in" });
                sharinganSpinSpeed = 0.005;
                gsap.to({ val: 0.005 }, {
                    val: 0.5, duration: 12,
                    onUpdate: function () { sharinganSpinSpeed = this.targets()[0].val; }
                });
                setTimeout(blinkAndEpicZoom, 11000);
            }
        });
    }

    function blinkAndEpicZoom() {
        const eyelidsTop = document.querySelector('.eyelid.top');
        const eyelidsBottom = document.querySelector('.eyelid.bottom');

        // Final Eyelid Sequence: SHUT AND STAY SHUT
        gsap.timeline()
            .to([eyelidsTop, eyelidsBottom], { height: '50%', duration: 1, ease: "power4.inOut" })
            .add(() => {
                finished = true;
                setTimeout(showAkatsukiBanner, 1000);
            });
    }

    function showAkatsukiBanner() {
        const banner = document.createElement('div');
        banner.className = 'akatsuki-banner';
        banner.innerHTML = `<div class="banner-content"><h1>COMPLETE</h1><h2 class="akatsuki-text">Done! You can now continue on Discord.</h2></div>`;
        document.body.appendChild(banner);
        gsap.from(".banner-content", { y: 50, opacity: 0, duration: 2, ease: "power3.out" });

        // Banner duration set to exactly 7 seconds
        setTimeout(() => {
            gsap.to(banner, { opacity: 0, duration: 2, onComplete: () => banner.remove() });
        }, 7000);
    }
}
window.initThreeGenjutsu = initThreeGenjutsu;
