/**
 * genjutsu.js - The Refined Cinematic Experience
 * Fully automated, zero user input, polished flow.
 */
function initThreeGenjutsu() {
    const container = document.getElementById('genjutsu-three-container');
    const assets = window.assets;

    container.innerHTML = '';

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x1a0000, 0.05);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // --- Audio ---
    const bgMusic = new Howl({
        src: ['../genjutsubg.mp3'],
        volume: 0.6,
        autoplay: true,
        onload: () => {
            bgMusic.seek(20); // Start from 20 seconds
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
    const pathLength = 800; // Natural length
    const groundGeo = new THREE.PlaneGeometry(pathWidth, pathLength, 1, 100);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x050000 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.z = -pathLength / 2 + 50;
    scene.add(ground);

    // --- SHARINGAN Eye (Correct Asset & Rotation) ---
    const sharinganTex = new THREE.TextureLoader().load('https://i.postimg.cc/HWPkbSff/image.png');
    const sharinganGeo = new THREE.CircleGeometry(200, 64);
    const sharinganMat = new THREE.MeshBasicMaterial({
        map: sharinganTex,
        transparent: true,
        opacity: 0,
        color: 0xff0000,
        side: THREE.DoubleSide
    });
    const sharingan = new THREE.Mesh(sharinganGeo, sharinganMat);
    sharingan.position.set(0, 300, -1200);
    sharingan.lookAt(0, 0, 0);
    scene.add(sharingan);

    // Archer Rows
    const loader = new THREE.GLTFLoader();
    for (let i = 0; i < 80; i++) {
        loader.load(assets.archerModel, (gltf) => {
            const archer = gltf.scene;
            const side = i % 2 === 0 ? 1 : -1;
            archer.position.set(side * 8, 0, -i * 15);
            archer.scale.set(2, 2, 2);
            archer.lookAt(0, 1, archer.position.z + 10);
            scene.add(archer);
        });
    }

    // --- Timeline ---
    const tl = gsap.timeline({
        onComplete: () => {
            bgMusic.fade(0.6, 0, 2000);
            setTimeout(() => {
                bgMusic.stop();
                playFinalCinematic();
            }, 1000);
        }
    });

    const playerHeight = 2.4;
    camera.position.set(0, playerHeight, 80);

    // Initial speed control
    let walkSpeed = 0.5;
    let eyeSpin = 0.002;

    // 1. Awakening (0-8s)
    tl.to([eyelidsTop, eyelidsBottom], { height: '0%', duration: 4, ease: 'power2.out' }, 1);
    tl.to(storyContainer, { filter: 'blur(0px)', duration: 6 }, 1);
    tl.add(() => showNotification("Something is wrong..."), 3);

    // 2. Automated Walk Forward (8-60s)
    tl.to(camera.position, {
        z: -pathLength + 100,
        duration: 50,
        ease: "none",
        onUpdate: () => {
            const time = tl.time();
            // Natural drunk sway
            camera.position.x = Math.sin(time * 0.7) * 1.2;
            camera.position.y = playerHeight + Math.sin(time * 1.5) * 0.2;

            // Randomly looking here and there in confusion
            camera.rotation.y = Math.sin(time * 0.4) * 0.3;
            camera.rotation.x = -0.05 + Math.cos(time * 0.2) * 0.1;

            // Reveal Sharingan
            if (time > 10) {
                sharingan.material.opacity = Math.min(0.8, sharingan.material.opacity + 0.005);
            }
        }
    }, 5);

    tl.add(() => showNotification("I can't feel my legs."), 15);
    tl.add(() => showNotification("It's so cold..."), 30);

    // 3. Final Climax (Force Look Up)
    tl.to(camera.rotation, {
        x: 0.8, // Facing the sky
        y: 0,
        z: 0,
        duration: 6,
        ease: "power2.inOut"
    }, 50);

    tl.add(() => showNotification("IT'S... TOO HUGE..."), 54);

    // 4. Sharingan Attack & Acceleration
    tl.to(sharingan.position, {
        z: camera.position.z - 40,
        y: playerHeight + 5,
        duration: 8,
        ease: "expo.in"
    }, 55);

    // Massive Spin Acceleration
    tl.to({ val: 0.002 }, {
        val: 0.5,
        duration: 8,
        onUpdate: function () { eyeSpin = this.targets()[0].val; },
        ease: "power3.in"
    }, 55);

    // 5. Terrified Reaction (Closing eyes slowly at the end)
    tl.to([eyelidsTop, eyelidsBottom], {
        height: '50%',
        duration: 3,
        ease: "power1.inOut"
    }, 62);

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
        // Correct 2D rotation for the sharingan mesh
        sharingan.rotation.z += eyeSpin;
        renderer.render(scene, camera);
    }

    animate();
}
