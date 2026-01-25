/**
 * genjutsu.js - Natural Cinematic Flow (Tight & High Impact)
 * Fully automated, logged, and refined.
 */
function initThreeGenjutsu() {
    console.log("[GENJUTSU] Starting High-Impact Cinematic...");

    const container = document.getElementById('genjutsu-three-container');
    const assets = window.assets;

    if (!container) {
        console.error("[GENJUTSU] ERROR: Container missing.");
        return;
    }

    container.innerHTML = '';

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x1a0000, 0.04);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    console.log("[GENJUTSU] Renderer & Scene active.");

    // --- Audio ---
    const bgMusic = new Howl({
        src: ['assets/genjutsubg.mp3'],
        volume: 0.6,
        autoplay: true,
        onload: () => {
            console.log("[GENJUTSU] Audio loaded. Seeking to 20s mark.");
            bgMusic.seek(20);
        }
    });

    const ambientLight = new THREE.AmbientLight(0xff0000, 0.1);
    scene.add(ambientLight);

    const mainLight = new THREE.PointLight(0xff0000, 1.5, 100);
    mainLight.position.set(0, 5, 20);
    scene.add(mainLight);

    const eyelidsTop = document.querySelector('.eyelid.top');
    const eyelidsBottom = document.querySelector('.eyelid.bottom');
    const storyContainer = document.getElementById('story-container');
    const eyeOverlay = document.getElementById('eye-blinking-overlay');

    if (eyeOverlay) eyeOverlay.style.display = 'block';
    gsap.set([eyelidsTop, eyelidsBottom], { height: '50%' });
    gsap.set(storyContainer, { filter: 'blur(30px)' });

    // --- Environment ---
    const pathWidth = 4;
    const pathLength = 600; // Natural, shorter path for tight pacing
    const groundGeo = new THREE.PlaneGeometry(pathWidth, pathLength, 1, 50);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x050000 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.z = -pathLength / 2 + 50;
    scene.add(ground);

    // --- SHARINGAN ---
    console.log("[GENJUTSU] Loading: assets/sharingan.png");
    const sharinganTex = new THREE.TextureLoader().load(
        'assets/sharingan.png',
        () => console.log("[GENJUTSU] Sharingan Texture loaded."),
        undefined,
        (err) => console.error("[GENJUTSU] Load failed:", err)
    );

    const sharinganGeo = new THREE.CircleGeometry(180, 64);
    const sharinganMat = new THREE.MeshBasicMaterial({
        map: sharinganTex,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide
    });
    const sharingan = new THREE.Mesh(sharinganGeo, sharinganMat);
    sharingan.position.set(0, 250, -800);
    sharingan.lookAt(0, 0, 0);
    scene.add(sharingan);

    // Archer Crowd
    const loader = new THREE.GLTFLoader();
    for (let i = 0; i < 40; i++) {
        loader.load(assets.archerModel, (gltf) => {
            const archer = gltf.scene;
            const side = i % 2 === 0 ? 1 : -1;
            archer.position.set(side * 8, 0, -i * 15);
            archer.scale.set(1.8, 1.8, 1.8);
            archer.lookAt(0, 1, archer.position.z + 10);
            scene.add(archer);
        });
    }

    // --- Cinematic Timeline ---
    console.log("[GENJUTSU] Sequence starting...");
    const tl = gsap.timeline({
        onComplete: () => {
            console.log("[GENJUTSU] Sequence complete. Final video playing.");
            playFinalCinematic();
        }
    });

    const playerHeight = 2.4;
    camera.position.set(0, playerHeight, 80);

    let eyeSpin = 0.002;

    // 1. Wake up (Fast clear)
    tl.to([eyelidsTop, eyelidsBottom], { height: '0%', duration: 4, ease: 'power2.out' }, 1);
    tl.to(storyContainer, { filter: 'blur(0px)', duration: 5 }, 1);
    tl.add(() => showNotification("Something is wrong..."), 3);

    // 2. Natural Stumble (25s - 30s total)
    tl.to(camera.position, {
        z: -pathLength + 100,
        duration: 25,
        ease: "power1.inOut",
        onUpdate: () => {
            const time = tl.time();
            camera.position.x = Math.sin(time * 0.8) * 1.5;
            camera.position.y = playerHeight + Math.sin(time * 1.5) * 0.15;

            // Panicking looks
            camera.rotation.y = Math.sin(time * 0.5) * 0.3;
            camera.rotation.x = -0.05 + Math.cos(time * 0.3) * 0.1;

            // Sharingan manifests
            if (time > 5) {
                sharingan.material.opacity = Math.min(0.9, sharingan.material.opacity + 0.015);
            }
        }
    }, 4);

    // 3. Force Look Up (Natural transition)
    tl.to(camera.rotation, {
        x: 0.8,
        y: 0,
        z: 0,
        duration: 4,
        ease: "power2.inOut"
    }, 22);

    tl.add(() => {
        console.log("[GENJUTSU] Focus: Sky");
        showNotification("NO... NOT AGAIN...");
    }, 24);

    // 4. Sharingan Acceleration
    tl.to(sharingan.position, {
        z: camera.position.z - 40,
        y: playerHeight + 5,
        duration: 6,
        ease: "expo.in"
    }, 25);

    tl.to({ val: 0.002 }, {
        val: 0.5,
        duration: 6,
        onUpdate: function () { eyeSpin = this.targets()[0].val; },
        ease: "power3.in"
    }, 25);

    // 5. Terror Blink
    tl.to([eyelidsTop, eyelidsBottom], {
        height: '50%',
        duration: 2,
        ease: "power2.inOut"
    }, 29);

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
            bgMusic.stop();
            gsap.to(videoContainer, {
                opacity: 0,
                duration: 2,
                onComplete: () => {
                    videoContainer.remove();
                    showAkatsukiBanner();
                }
            });
        };
    }

    function showAkatsukiBanner() {
        const banner = document.createElement('div');
        banner.className = 'akatsuki-banner';
        banner.innerHTML = `
            <div class="banner-content">
                <h1>AN AKATSUKI EVENT IS COMING</h1>
                <h2 class="akatsuki-text">THE EYE OF MOON</h2>
            </div>
        `;
        document.body.appendChild(banner);
        gsap.from(".banner-content", { y: 150, opacity: 0, duration: 4, ease: "power4.out" });

        setTimeout(() => {
            showNarrative("Infinite Tsukuyomi.", [
                { text: "Wake Up", action: () => window.location.href = 'index.html' }
            ]);
        }, 8000);
    }

    function animate() {
        requestAnimationFrame(animate);
        sharingan.rotation.z += eyeSpin;
        renderer.render(scene, camera);
    }

    animate();
}
