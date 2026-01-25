/**
 * genjutsu.js - The 2-Minute Cinema
 * Purely automated, natural stumble flow, polished Sharingan.
 */
function initThreeGenjutsu() {
    console.log("TSUKUYOMI INITIALIZED");
    const container = document.getElementById('genjutsu-three-container');
    const assets = window.assets;

    container.innerHTML = '';

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    // Lower fog density so distant objects aren't just solid fog color
    scene.fog = new THREE.FogExp2(0x1a0000, 0.005);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // --- Audio ---
    const bgMusic = new Howl({
        src: ['assets/genjutsubg.mp3'], // Path inside website/assets
        volume: 0.6,
        autoplay: true,
        onload: () => {
            bgMusic.seek(20); // Sync to the 20s mark as requested
        }
    });

    const ambientLight = new THREE.AmbientLight(0xff0000, 0.1);
    scene.add(ambientLight);

    const redLight = new THREE.PointLight(0xff0000, 2, 80);
    redLight.position.set(0, 5, 30);
    scene.add(redLight);

    const eyelidsTop = document.querySelector('.eyelid.top');
    const eyelidsBottom = document.querySelector('.eyelid.bottom');
    const storyContainer = document.getElementById('story-container');
    const eyeOverlay = document.getElementById('eye-blinking-overlay');

    if (eyeOverlay) eyeOverlay.style.display = 'block';
    gsap.set([eyelidsTop, eyelidsBottom], { height: '50%' });
    gsap.set(storyContainer, { filter: 'blur(30px)' });

    // --- Environment ---
    const pathWidth = 5;
    const pathLength = 2500; // Even longer for a more natural stroll
    const groundGeo = new THREE.PlaneGeometry(pathWidth, pathLength, 1, 100);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x0a0000 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.z = -pathLength / 2 + 100;
    scene.add(ground);

    // --- COSMIC SHARINGAN (Fixed Material) ---
    // Using a Sprite to ensure perfect 2D spinning and transparency behavior
    const sharinganTex = new THREE.TextureLoader().load('assets/sharingan.png');
    const sharinganMat = new THREE.SpriteMaterial({
        map: sharinganTex,
        transparent: true,
        opacity: 0,
        fog: false // CRITICAL: Fog was making it look like a red balloon
    });
    const sharingan = new THREE.Sprite(sharinganMat);
    sharingan.position.set(0, 800, -4000); // Deep in the void
    sharingan.scale.set(600, 600, 1);
    scene.add(sharingan);

    // --- Archer Ambush ---
    const loader = new THREE.GLTFLoader();
    for (let i = 0; i < 150; i++) {
        loader.load(assets.archerModel, (gltf) => {
            const archer = gltf.scene;
            const side = i % 2 === 0 ? 1 : -1;
            const posZ = -i * 18;
            archer.position.set(side * (6 + Math.random() * 4), 0, posZ);
            archer.scale.set(1.8, 1.8, 1.8);
            archer.lookAt(0, 1.5, posZ + 20);
            scene.add(archer);

            // Faint individual red eye glow
            const pLight = new THREE.PointLight(0xff0000, 0.3, 5);
            pLight.position.set(0, 3.5, 0);
            archer.add(pLight);
        });
    }

    // --- Cinematic Timeline (120s script) ---
    let spinSpeed = 0.003;
    const playerHeight = 2.4;
    camera.position.set(0, playerHeight, 100);

    const tl = gsap.timeline({
        onComplete: () => {
            bgMusic.fade(0.6, 0, 2000);
            playFinalCinematic();
        }
    });

    // 1. Awakening (0-15s)
    tl.to([eyelidsTop, eyelidsBottom], { height: '0%', duration: 10, ease: 'power1.inOut' }, 2);
    tl.to(storyContainer, { filter: 'blur(0px)', duration: 12, ease: 'sine.inOut' }, 2);
    tl.add(() => showNotification("Something... is wrong."), 14);

    // 2. Automated Path Walk (15-90s)
    tl.to(camera.position, {
        z: -pathLength + 300,
        duration: 75,
        ease: "none",
        onUpdate: () => {
            const time = tl.time();
            // Organic "Drunk" stagger
            camera.position.x = Math.sin(time * 0.5) * 1.5;
            camera.position.y = playerHeight + Math.abs(Math.sin(time * 0.8)) * 0.25;

            // Confusion (looking left/right slowly)
            camera.rotation.y = Math.sin(time * 0.3) * 0.3;
            camera.rotation.x = -0.05 + Math.cos(time * 0.2) * 0.08;

            // Fade in the eye
            if (time > 20) {
                sharingan.material.opacity = Math.min(0.9, sharingan.material.opacity + 0.005);
            }
        }
    }, 5);

    tl.add(() => showNotification("Where is the exit?"), 30);
    tl.add(() => showNotification("I can't stop walking..."), 50);
    tl.add(() => showNotification("My vision... it's fading..."), 70);

    // 3. Final Panic State (90-110s)
    tl.to(camera.rotation, {
        duration: 15,
        onUpdate: () => {
            const time = tl.time();
            camera.rotation.y = Math.sin(time * 2.5) * 0.6; // Rapid panic looking
            camera.rotation.x = -0.2 + Math.cos(time * 3) * 0.4;
        }
    }, 90);
    tl.add(() => showNotification("HELP ME!"), 95);

    // 4. Force Gaze Up (110-115s)
    tl.to(camera.rotation, {
        x: 0.9,
        y: 0,
        z: 0,
        duration: 5,
        ease: "power3.inOut"
    }, 110);
    tl.add(() => showNotification("IT'S... TOO HUGE..."), 112);

    // 5. Sharingan Consumes Camera (115-120s)
    // Dive and Spin
    tl.to(sharingan.position, {
        z: camera.position.z - 30,
        y: playerHeight + 5,
        duration: 6,
        ease: "expo.in"
    }, 114);

    tl.to({ val: 0.003 }, {
        val: 0.6,
        duration: 6,
        onUpdate: function () { spinSpeed = this.targets()[0].val; },
        ease: "power4.in"
    }, 114);

    // Final Eye Closing (Pleads and gives up)
    tl.to([eyelidsTop, eyelidsBottom], {
        height: '50%',
        duration: 3,
        ease: "power2.inOut"
    }, 116);

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
                <h1 style="color: #666; font-size: 1.5rem;">THE ETERNAL DREAM BEGINS</h1>
                <h2 class="akatsuki-text">AKATSUKI</h2>
            </div>
        `;
        document.body.appendChild(banner);

        gsap.from(".banner-content", { y: 150, opacity: 0, duration: 6, ease: "power4.out" });

        setTimeout(() => {
            showNarrative("Infinite Tsukuyomi.", [
                { text: "Wake up", action: () => window.location.href = 'index.html' }
            ]);
        }, 10000);
    }

    function animate() {
        requestAnimationFrame(animate);
        // Spin the Sharingan Sprite (Correct 2D rotation of image)
        sharingan.material.rotation += spinSpeed;
        renderer.render(scene, camera);
    }

    animate();
}
