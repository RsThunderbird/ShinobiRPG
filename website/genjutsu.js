/**
 * genjutsu.js - ITACHI'S GENJUTSU CINEMATIC
 * A hellish environment, drunken walk, and a terrifying blackhole expansion.
 */
function initThreeGenjutsu() {
    console.log("[GENJUTSU] Entering Itachi's Realm.");

    const container = document.getElementById('genjutsu-three-container');
    if (!container) {
        console.error("[GENJUTSU] Missing container.");
        return;
    }

    // --- Cleanup & Setup ---
    container.innerHTML = '';
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050000); // Deep Bloody Black
    scene.fog = new THREE.FogExp2(0x1a0000, 0.02);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 30000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 1.8;
    container.appendChild(renderer.domElement);

    // --- Lights ---
    const ambientLight = new THREE.AmbientLight(0xff0000, 0.1); // Red ambient
    scene.add(ambientLight);

    const atmosphereLight = new THREE.PointLight(0xff0000, 5, 200);
    atmosphereLight.position.set(0, 10, 0);
    scene.add(atmosphereLight);

    // --- Assets ---
    const loader = new THREE.FBXLoader();
    loader.setResourcePath('assets/textures/');
    let blackhole;

    // --- HUD Elements ---
    const eyelidsTop = document.querySelector('.eyelid.top');
    const eyelidsBottom = document.querySelector('.eyelid.bottom');

    // Load Blackhole
    loader.load('assets/blackhole.fbx', (object) => {
        blackhole = object;
        // Initial state: Tiny and high up
        blackhole.position.set(0, 800, -1200);
        blackhole.scale.set(0.1, 0.1, 0.1);

        // Scary beautiful angle (tilted towards camera)
        blackhole.rotation.x = Math.PI / 4;
        blackhole.rotation.z = Math.PI / 6;

        scene.add(blackhole);
        console.log("[GENJUTSU] Blackhole loaded.");

        startCinematic();
    }, undefined, (err) => {
        console.error("[GENJUTSU] Failed to load blackhole:", err);
    });

    // --- Terrain (Hellish Path) ---
    const groundGeo = new THREE.PlaneGeometry(200, 5000, 10, 50);
    const groundMat = new THREE.MeshStandardMaterial({
        color: 0x0a0a0a,
        emissive: 0x110000,
        roughness: 0.9,
        metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Blood-red markers along the path
    for (let i = 0; i < 150; i++) {
        const marker = new THREE.Mesh(
            new THREE.BoxGeometry(1, 0.1, 2),
            new THREE.MeshBasicMaterial({ color: 0x440000 })
        );
        marker.position.set((Math.random() - 0.5) * 40, 0.05, -i * 30);
        scene.add(marker);
    }

    // --- Cinematic State ---
    let time = 0;
    let isWalking = true;
    let cameraPitch = 0;
    let walkSpeed = 0.06;
    let swayIntensity = 1.0;

    camera.position.set(0, 1.7, 50);

    function startCinematic() {
        // 1. Initial Eye Opening (slowly)
        gsap.to(eyelidsTop, { height: '8%', duration: 5, ease: "power1.inOut" });
        gsap.to(eyelidsBottom, { height: '8%', duration: 5, ease: "power1.inOut" });

        // --- Dialogue & Actions Sequence ---

        // Start 1: Initial Confusion
        setTimeout(() => {
            window.showNarrative("My head... it won't stop spinning. Everything feels so heavy...");
            // Trigger Event Notification after a bit
            setTimeout(() => {
                window.showNotification("NEW EVENT: THE INFINITE GENJUTSU");
            }, 3000);
        }, 2000);

        // Start 2: Feeling the pressure
        setTimeout(() => {
            window.showNarrative("This place... it's not the forest anymore. What kind of trick is this?");
        }, 8000);

        // Start 3: Seeing something above
        setTimeout(() => {
            window.showNarrative("Wait... the sky... it's breaking. I have to look up.");
            // Tilt camera up slowly
            gsap.to(camera, {
                duration: 12,
                onUpdate: function () {
                    cameraPitch = (this.progress() * Math.PI / 2.3);
                }
            });
        }, 14000);

        // Start 4: Reveal of the small blackhole
        setTimeout(() => {
            window.showNarrative("A void... consuming the heavens. How is this possible?");
        }, 20000);

        // Start 5: THE BLINK (Rapid eyes close/open)
        setTimeout(() => {
            gsap.to([eyelidsTop, eyelidsBottom], {
                height: '50%', duration: 0.3, ease: "power4.in", onComplete: () => {

                    // --- THE BOOM MOMENT (While eyes are closed) ---
                    if (blackhole) {
                        blackhole.scale.set(80, 80, 80); // MASSIVE
                        blackhole.position.set(0, 1500, -1800);
                        blackhole.rotation.x = Math.PI / 3;
                    }

                    // Violent Shake while closed
                    gsap.to(camera.position, { x: "+=10", duration: 0.1, repeat: 10, yoyo: true });

                    setTimeout(() => {
                        // SNAP OPEN
                        gsap.to([eyelidsTop, eyelidsBottom], { height: '0%', duration: 0.1, ease: "expo.out" });

                        window.showNarrative("IT'S CONSUMING EVERYTHING! ESCAPE IS IMPOSSIBLE!");

                        // Violent impact
                        gsap.to(camera.position, {
                            x: "+=5",
                            y: "+=2",
                            duration: 0.05,
                            repeat: 20,
                            yoyo: true
                        });

                        // Bright Flash
                        gsap.to(renderer, { toneMappingExposure: 8, duration: 0.1, yoyo: true, repeat: 1 });

                        walkSpeed = 0.01; // Halt almost completely
                        swayIntensity = 3.0; // Violent disorientation

                        // Final Closing after seeing the horror
                        setTimeout(() => {
                            gsap.to([eyelidsTop, eyelidsBottom], {
                                height: '50%', duration: 1.5, ease: "power3.in", onComplete: () => {
                                    isWalking = false;
                                    playItachiVideo();
                                }
                            });
                        }, 6000);
                    }, 500);
                }
            });
        }, 28000);
    }

    function playItachiVideo() {
        console.log("[GENJUTSU] Playing Itachi Cinematic Video.");

        // Hide narrative
        const narrativeBox = document.getElementById('narrative-box');
        if (narrativeBox) narrativeBox.style.display = 'none';

        // Create Video Element
        const videoContainer = document.createElement('div');
        videoContainer.className = 'cinematic-video-container';

        const video = document.createElement('video');
        video.src = 'assets/itachi_sharingan.mp4';
        video.autoplay = true;
        video.className = 'cinematic-video-small';

        // Add Akatsuki Banner if needed (Matching story.css)
        const banner = document.createElement('div');
        banner.className = 'akatsuki-banner';
        banner.innerHTML = `
            <div class="banner-content">
                <h1>YOU ARE TRAPPED WITHIN</h1>
                <p class="akatsuki-text">TSUKUYOMI</p>
            </div>
        `;

        videoContainer.appendChild(video);
        document.body.appendChild(videoContainer);
        document.body.appendChild(banner);

        video.onended = () => {
            console.log("[GENJUTSU] Video ended. Transitioning...");
            gsap.to([videoContainer, banner], {
                opacity: 0, duration: 2, onComplete: () => {
                    videoContainer.remove();
                    banner.remove();
                    // Return to story or next stage
                    if (typeof startForestStage === 'function') {
                        startForestStage();
                    }
                }
            });
        };
    }

    function animate() {
        requestAnimationFrame(animate);
        time += 0.01;

        if (isWalking) {
            // Forward movement
            camera.position.z -= walkSpeed;

            // Drunken Sway
            const swayX = Math.sin(time * 0.4) * 0.8 * swayIntensity;
            const bobY = Math.sin(time * 1.5) * 0.15 * swayIntensity;
            const rollZ = Math.sin(time * 0.6) * 0.1 * swayIntensity;

            camera.position.x = swayX;
            camera.position.y = 1.7 + bobY;
            camera.rotation.set(cameraPitch, 0, rollZ, 'YXZ');
        }

        // Spin the blackhole
        if (blackhole) {
            blackhole.rotation.y += 0.005;
            blackhole.rotation.z += 0.002;

            // Pulse
            const pulse = 1 + Math.sin(time * 4) * 0.02;
            blackhole.scale.multiplyScalar(pulse);
        }

        renderer.render(scene, camera);
    }

    animate();

    // Handle Resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}
