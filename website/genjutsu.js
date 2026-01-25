/**
 * genjutsu.js - The 2-Minute Cinematic Experience
 * Fully automated, zero user input, high polish.
 */
function initThreeGenjutsu() {
    const container = document.getElementById('genjutsu-three-container');
    const assets = window.assets;

    container.innerHTML = '';

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x1a0000, 0.04);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xff0000, 0.1);
    scene.add(ambientLight);

    const mainLight = new THREE.PointLight(0xff0000, 2, 100);
    mainLight.position.set(0, 5, 50);
    scene.add(mainLight);

    const eyelidsTop = document.querySelector('.eyelid.top');
    const eyelidsBottom = document.querySelector('.eyelid.bottom');
    const storyContainer = document.getElementById('story-container');
    const eyeOverlay = document.getElementById('eye-blinking-overlay');

    if (eyeOverlay) eyeOverlay.style.display = 'block';
    gsap.set([eyelidsTop, eyelidsBottom], { height: '50%' });
    gsap.set(storyContainer, { filter: 'blur(30px)' });

    // --- Environment Creation ---

    // 1. The Path
    const pathWidth = 3;
    const pathLength = 2000; // Much longer for slow walk
    const groundGeo = new THREE.PlaneGeometry(pathWidth, pathLength, 1, 200);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x0a0000 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.z = -pathLength / 2 + 100;
    scene.add(ground);

    // 2. The Mysterious Red Blob (Initial Sky Object)
    const blobTexture = new THREE.TextureLoader().load('https://i.postimg.cc/HWPkbSff/image.png'); // Sharingan but we'll blur it
    const blobGeo = new THREE.CircleGeometry(400, 64);
    const blobMat = new THREE.MeshBasicMaterial({
        map: blobTexture,
        transparent: true,
        opacity: 0,
        color: 0xff0000,
        side: THREE.DoubleSide
    });
    const sharingan = new THREE.Mesh(blobGeo, blobMat);
    sharingan.position.set(0, 800, -3000);
    sharingan.lookAt(0, 0, 0);
    scene.add(sharingan);

    // 3. Archer Rows (The Spectators)
    const loader = new THREE.GLTFLoader();
    const archerCount = 150;
    for (let i = 0; i < archerCount; i++) {
        loader.load(assets.archerModel, (gltf) => {
            const archer = gltf.scene;
            const side = i % 2 === 0 ? 1 : -1;
            const rowPos = -i * 15;
            archer.position.set(side * (5 + Math.random() * 5), 0, rowPos);
            archer.scale.set(2, 2, 2);
            archer.lookAt(0, 1, rowPos + 10);
            scene.add(archer);

            // Add a faint red glow to each archer
            const glow = new THREE.PointLight(0xff0000, 0.2, 5);
            glow.position.set(0, 3, 0);
            archer.add(glow);
        });
    }

    // --- Cinematic Timeline (The Script) ---
    // Total duration targeted: ~120 seconds
    const tl = gsap.timeline({
        onComplete: () => {
            playFinalCinematic();
        }
    });

    const playerHeight = 2.4;
    camera.position.set(0, playerHeight, 100);

    // Stage 1: The Awakening (0s - 15s)
    tl.to([eyelidsTop, eyelidsBottom], { height: '0%', duration: 8, ease: 'power1.inOut' }, 2);
    tl.to(storyContainer, { filter: 'blur(0px)', duration: 10, ease: 'sine.inOut' }, 2);
    tl.add(() => showNotification("Where... is everyone?"), 12);

    // Stage 2: Distant Blob Appears (15s - 30s)
    tl.to(sharingan.material, { opacity: 0.2, duration: 15 }, 15);
    tl.add(() => showNotification("What is that... in the sky?"), 25);

    // Stage 3: The Long Walk (30s - 80s)
    // We walk 2000 units slowly
    tl.to(camera.position, {
        z: -pathLength + 200,
        duration: 70, // 70 seconds of walking
        ease: "sine.inOut",
        onUpdate: () => {
            const time = tl.time();
            // Nauseous swaying
            camera.position.x = Math.sin(time * 0.5) * 1.5;
            camera.position.y = playerHeight + Math.sin(time * 1.2) * 0.3;

            // Drunk camera rotation (looking around in fear)
            camera.rotation.y = Math.sin(time * 0.4) * 0.4;
            camera.rotation.x = -0.1 + Math.cos(time * 0.3) * 0.15;
            camera.rotation.z = Math.sin(time * 0.6) * 0.2;

            // Sharingan slowly brightens and sharpens
            sharingan.material.opacity = Math.min(0.9, 0.2 + (tl.progress() * 0.7));
        }
    }, 20);

    tl.add(() => showNotification("My body... feels like lead."), 40);
    tl.add(() => showNotification("Please... someone help..."), 60);

    // Stage 4: The Pleading (80s - 100s)
    // Camera starts moving more erratically as the character panics
    tl.to(camera.rotation, {
        duration: 20,
        onUpdate: () => {
            const time = tl.time();
            camera.rotation.y = Math.sin(time * 2) * 0.6; // Rapid looking left/right
            camera.rotation.x = -0.2 + Math.sin(time * 3) * 0.3; // Looking up/down
        }
    }, 80);
    tl.add(() => showNotification("NO... NOT AGAIN..."), 85);

    // Stage 5: The Sky Eye Reveals (100s - 110s)
    // Character looks UP at the Sharingan
    tl.to(camera.rotation, {
        x: 0.8, // Facing the sky
        y: 0,
        z: 0,
        duration: 5,
        ease: "power2.inOut"
    }, 100);
    tl.add(() => showNotification("IT'S WATCHING ME."), 105);

    // Stage 6: The Dive (110s - 120s)
    // The Sharingan accelerates and comes close
    tl.to(sharingan.position, {
        z: camera.position.z - 50,
        y: playerHeight + 10,
        duration: 10,
        ease: "expo.in"
    }, 110);

    // Sharingan rotation revs up
    let eyeSpin = 0.005;
    tl.to({ val: 0.005 }, {
        val: 0.4,
        duration: 10,
        onUpdate: function () { eyeSpin = this.targets()[0].val; },
        ease: "power3.in"
    }, 110);

    // Stage 7: The Fear Blink (Final blackout)
    tl.to([eyelidsTop, eyelidsBottom], {
        height: '50%',
        duration: 2,
        ease: "power4.in"
    }, 118);

    function playFinalCinematic() {
        const videoContainer = document.createElement('div');
        videoContainer.className = 'cinematic-video-container';
        document.body.appendChild(videoContainer);

        const video = document.createElement('video');
        video.src = 'assets/itachi_sharingan.mp4';
        video.muted = true;
        video.autoplay = true;
        video.className = 'cinematic-video-small'; // Reduced size in CSS
        videoContainer.appendChild(video);

        video.onended = () => {
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

        gsap.from(".banner-content", { y: 150, opacity: 0, duration: 5, ease: "power4.out" });

        setTimeout(() => {
            showNarrative("The genjutsu is eternal.", [
                { text: "Return to Menu", action: () => window.location.href = 'index.html' }
            ]);
        }, 10000);
    }

    function animate() {
        requestAnimationFrame(animate);
        sharingan.rotation.z += eyeSpin;
        renderer.render(scene, camera);
    }

    animate();
}
