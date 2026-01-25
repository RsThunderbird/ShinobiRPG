/**
 * genjutsu.js - CINEMATIC BLACKHOLE SEQUENCE
 * Character walks drunkenly, looks up at a blackhole that expands after a blink.
 */
function initThreeGenjutsu() {
    console.log("[GENJUTSU] Starting Cinematic Sequence.");

    const container = document.getElementById('genjutsu-three-container');
    if (!container) {
        console.error("[GENJUTSU] Missing container.");
        return;
    }

    // --- Cleanup & Setup ---
    container.innerHTML = '';
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x0a0005, 0.02);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 20000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 2.0;
    container.appendChild(renderer.domElement);

    // --- Lights ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambientLight);

    const atmosphereLight = new THREE.PointLight(0x4400ff, 5, 100);
    atmosphereLight.position.set(0, 5, 0);
    scene.add(atmosphereLight);

    // --- Assets ---
    const loader = new THREE.GLTFLoader();
    let blackhole;

    // --- Eyelid Elements ---
    const eyelidsTop = document.querySelector('.eyelid.top');
    const eyelidsBottom = document.querySelector('.eyelid.bottom');

    // Load Blackhole
    loader.load('assets/blackhole.glb', (gltf) => {
        blackhole = gltf.scene;
        // Initial state: Tiny and high up
        blackhole.position.set(0, 500, -800);
        blackhole.scale.set(0.1, 0.1, 0.1);

        // Scary beautiful angle (tilted towards camera)
        blackhole.rotation.x = Math.PI / 6;
        blackhole.rotation.z = Math.PI / 8;

        scene.add(blackhole);
        console.log("[GENJUTSU] Blackhole loaded.");

        startCinematic();
    }, undefined, (err) => {
        console.error("[GENJUTSU] Failed to load blackhole:", err);
    });

    // --- Terrain (Endless Dark Path) ---
    const groundGeo = new THREE.PlaneGeometry(100, 4000, 1, 10);
    const groundMat = new THREE.MeshStandardMaterial({
        color: 0x050505,
        roughness: 0.8,
        metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Markers
    for (let i = 0; i < 100; i++) {
        const marker = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.1, 1),
            new THREE.MeshBasicMaterial({ color: 0x220000 })
        );
        marker.position.set(0, 0.05, -i * 30);
        scene.add(marker);
    }

    // --- Cinematic State ---
    let time = 0;
    let isWalking = true;
    let cameraPitch = 0;
    let walkSpeed = 0.05;

    camera.position.set(0, 1.7, 50);

    function startCinematic() {
        // 1. Initial Eye Opening (slowly)
        gsap.to(eyelidsTop, { height: '5%', duration: 4, ease: "power2.inOut" });
        gsap.to(eyelidsBottom, { height: '5%', duration: 4, ease: "power2.inOut" });

        // 2. Start Drunken Walk & Look Up
        // 4-10s: Slowly look up
        gsap.to(camera, {
            delay: 4,
            duration: 10,
            onUpdate: function () {
                // Smoothly interpolate pitch
                cameraPitch = (this.progress() * Math.PI / 2.2);
            }
        });

        // 3. The Blink & Expansion
        setTimeout(() => {
            // Close eyes dramatically
            gsap.to(eyelidsTop, { height: '50%', duration: 0.4, ease: "power4.in" });
            gsap.to(eyelidsBottom, {
                height: '50%', duration: 0.4, ease: "power4.in", onComplete: () => {

                    // --- THE BOOM MOMENT (While eyes are closed) ---
                    if (blackhole) {
                        blackhole.scale.set(60, 60, 60); // EVEN BIGGER
                        blackhole.position.set(0, 1000, -1500);
                        blackhole.rotation.x = Math.PI / 4; // Steeper angle for scale
                    }

                    // Wait in darkness for a heartbeat
                    setTimeout(() => {
                        // SNAP EYES OPEN
                        gsap.to(eyelidsTop, { height: '0%', duration: 0.15, ease: "expo.out" });
                        gsap.to(eyelidsBottom, { height: '0%', duration: 0.15, ease: "expo.out" });

                        // Violent camera shake
                        gsap.to(camera.position, {
                            x: "+=3",
                            y: "+=1",
                            duration: 0.05,
                            repeat: 15,
                            yoyo: true,
                            ease: "none"
                        });

                        // Flash exposure
                        gsap.to(renderer, { toneMappingExposure: 5, duration: 0.2, yoyo: true, repeat: 1 });

                        // Slow down movement to a near halt
                        walkSpeed = 0.01;

                        console.log("[GENJUTSU] BOOM! Landscape consumed.");

                        // Final fade out after seeing the horror
                        setTimeout(() => {
                            gsap.to([eyelidsTop, eyelidsBottom], { height: '50%', duration: 2, ease: "power2.inOut" });
                            isWalking = false;
                        }, 6000);
                    }, 800);
                }
            });
        }, 15000);
    }

    function animate() {
        requestAnimationFrame(animate);
        time += 0.01;

        if (isWalking) {
            // Forward movement
            camera.position.z -= walkSpeed;

            // Drunken Sway
            const swayX = Math.sin(time * 0.4) * 0.7;
            const bobY = Math.sin(time * 1.5) * 0.15;
            const rollZ = Math.sin(time * 0.6) * 0.08;

            camera.position.x = swayX;
            camera.position.y = 1.7 + bobY;
            camera.rotation.set(cameraPitch, 0, rollZ, 'YXZ');
        }

        // Spin the blackhole
        if (blackhole) {
            blackhole.rotation.y += 0.003;
            blackhole.rotation.z += 0.001;

            // Subtle pulse
            const pulse = 1 + Math.sin(time * 3) * 0.01;
            blackhole.scale.multiplyScalar(pulse);
        }

        renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}
