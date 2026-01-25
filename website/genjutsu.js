/**
 * genjutsu.js - Fully automated cinematic sequence
 */
function initThreeGenjutsu() {
    const container = document.getElementById('genjutsu-three-container');
    const assets = window.assets;

    container.innerHTML = '';

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x220000, 0.05);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xff0000, 0.3);
    scene.add(ambientLight);

    const spotLight = new THREE.SpotLight(0xff0000, 2);
    spotLight.position.set(0, 50, 0);
    scene.add(spotLight);

    const eyelidsTop = document.querySelector('.eyelid.top');
    const eyelidsBottom = document.querySelector('.eyelid.bottom');
    const storyContainer = document.getElementById('story-container');
    const eyeOverlay = document.getElementById('eye-blinking-overlay');

    // Initial setup
    if (eyeOverlay) eyeOverlay.style.display = 'block';
    gsap.set([eyelidsTop, eyelidsBottom], { height: '50%' });
    gsap.set(storyContainer, { filter: 'blur(20px)' });

    // --- Terrain ---
    const pathWidth = 6;
    const pathLength = 300; // Signficantly shortened as requested
    const groundGeo = new THREE.PlaneGeometry(pathWidth, pathLength, 1, 50);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x050000 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.z = -pathLength / 2;
    scene.add(ground);

    // --- Sharingan Sky ---
    const sharinganTexture = new THREE.TextureLoader().load('assets/sky.png');
    const sharinganGeo = new THREE.CircleGeometry(100, 64);
    const sharinganMat = new THREE.MeshBasicMaterial({
        map: sharinganTexture,
        transparent: true,
        opacity: 1.0,
        side: THREE.DoubleSide,
        color: 0xff0000
    });
    const sharingan = new THREE.Mesh(sharinganGeo, sharinganMat);
    sharingan.position.set(0, 150, -500);
    sharingan.lookAt(0, 0, 0);
    scene.add(sharingan);

    // --- Archers ---
    const loader = new THREE.GLTFLoader();
    for (let i = 0; i < 20; i++) {
        loader.load(assets.archerModel, (gltf) => {
            const archer = gltf.scene;
            const side = i % 2 === 0 ? 1 : -1;
            archer.position.set(side * 6, 0, -i * 15);
            archer.scale.set(1.8, 1.8, 1.8);
            archer.lookAt(0, 1, archer.position.z + 10);
            scene.add(archer);
        });
    }

    // --- Cinematic Sequence ---
    const sequence = gsap.timeline({
        onComplete: () => {
            playFinalCinematic();
        }
    });

    // 1. Wake up
    sequence.to([eyelidsTop, eyelidsBottom], { height: '0%', duration: 4, ease: 'power2.out' }, 1);
    sequence.to(storyContainer, { filter: 'blur(0px)', duration: 5 }, 1);

    // 2. Erratic Movement (Drunk Walk)
    const playerHeight = 2.2;
    camera.position.set(0, playerHeight, 50);

    // Automated Forward Walk
    sequence.to(camera.position, {
        z: -pathLength + 50,
        duration: 20,
        ease: "none",
        onUpdate: () => {
            const time = sequence.time();
            // Sway
            camera.position.x = Math.sin(time * 0.8) * 0.5;
            camera.position.y = playerHeight + Math.sin(time * 1.5) * 0.15;

            // Random camera look here and there
            camera.rotation.y = Math.sin(time * 0.5) * 0.2;
            camera.rotation.x = Math.sin(time * 0.3) * 0.1;
            camera.rotation.z = Math.sin(time * 0.4) * 0.1;
        }
    }, 2);

    // 3. Look up at Sharingan
    sequence.to(camera.rotation, {
        x: 0.8 * (Math.PI / 180 * 50), // Facing the sky
        y: 0,
        z: 0,
        duration: 3,
        ease: "power2.inOut"
    }, "-=5");

    // 4. Sharingan accelerates and approaches
    sequence.to(sharingan.position, {
        z: camera.position.z - 30,
        y: playerHeight,
        duration: 4,
        ease: "power2.in"
    }, "-=4");

    // 5. Terrified Blink (Close eyes)
    sequence.to([eyelidsTop, eyelidsBottom], {
        height: '50%',
        duration: 1,
        ease: "power4.in"
    }, "-=1");

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
                duration: 1.5,
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
                <h1>PREPARE FOR THE UPCOMING EVENT</h1>
                <h2 class="akatsuki-text">AKATSUKI</h2>
            </div>
        `;
        document.body.appendChild(banner);

        gsap.from(".banner-content", { y: 100, opacity: 0, duration: 3, ease: "power4.out" });

        setTimeout(() => {
            showNarrative("The nightmare is real.", [
                { text: "Return to Menu", action: () => window.location.href = 'index.html' }
            ]);
        }, 8000);
    }

    function animate() {
        requestAnimationFrame(animate);
        sharingan.rotation.z += 0.005 + (sequence.progress() * 0.05);
        renderer.render(scene, camera);
    }

    animate();
}
