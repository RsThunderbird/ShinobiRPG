/**
 * genjutsu.js - The High-Impact Cinematic (3D MODEL EDITION)
 * Fully automated, extremely logged, tight pacing.
 */
function initThreeGenjutsu() {
    console.log("[GENJUTSU] EVENT: initThreeGenjutsu started.");

    try {
        const container = document.getElementById('genjutsu-three-container');
        if (!container) throw new Error("Missing #genjutsu-three-container");

        console.log("[GENJUTSU] Step 1: Cleaning container.");
        container.innerHTML = '';

        console.log("[GENJUTSU] Step 2: Setting up Scene & Fog.");
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);
        scene.fog = new THREE.FogExp2(0x1a0000, 0.04);

        console.log("[GENJUTSU] Step 3: Setting up Camera & Renderer.");
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 8000);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        // --- AUDIO CHECK ---
        console.log("[GENJUTSU] Step 4: Loading Audio (assets/genjutsubg.mp3).");
        if (typeof Howl !== "undefined") {
            const bgMusic = new Howl({
                src: ['assets/genjutsubg.mp3'],
                volume: 0.6,
                autoplay: true,
                onload: () => {
                    console.log("[GENJUTSU] Audio Loaded. Seeking to 20s.");
                    bgMusic.seek(20);
                },
                onloaderror: (id, err) => console.error("[GENJUTSU] Audio Load Error:", err)
            });
        }

        console.log("[GENJUTSU] Step 5: Adding Lights.");
        const ambientLight = new THREE.AmbientLight(0xff0000, 0.2);
        scene.add(ambientLight);
        const mainLight = new THREE.PointLight(0xff0000, 2, 100);
        mainLight.position.set(0, 5, 40);
        scene.add(mainLight);

        // --- SHARINGAN 3D MODEL LOAD ---
        console.log("[GENJUTSU] Step 6: Triggering GLTFLoader for assets/sharingan.glb.");
        const modelLoader = new THREE.GLTFLoader();
        let sharinganModel = null;

        modelLoader.load(
            'assets/sharingan.glb',
            (gltf) => {
                console.log("[GENJUTSU] SUCCESS: Sharingan 3D model loaded.");
                sharinganModel = gltf.scene;

                // Initial positioning: Huge and distant in the sky
                sharinganModel.scale.set(50, 50, 50);
                sharinganModel.position.set(0, 350, -1000);

                // Make it face downwards (tilting towards the camera)
                sharinganModel.rotation.x = 0.6;

                scene.add(sharinganModel);
            },
            undefined,
            (err) => console.error("[GENJUTSU] FAILED: Sharingan model load error:", err)
        );

        console.log("[GENJUTSU] Step 7: Adding Terrain.");
        const pathLength = 800;
        const groundGeo = new THREE.PlaneGeometry(5, pathLength, 1, 50);
        const groundMat = new THREE.MeshLambertMaterial({ color: 0x050000 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.z = -pathLength / 2 + 50;
        scene.add(ground);

        // --- Archer Crowd ---
        console.log("[GENJUTSU] Step 8: Adding Archers.");
        for (let i = 0; i < 40; i++) {
            modelLoader.load(window.assets.archerModel, (gltf) => {
                const archer = gltf.scene;
                const side = i % 2 === 0 ? 1 : -1;
                archer.position.set(side * 8, 0, -i * 18);
                archer.scale.set(1.8, 1.8, 1.8);
                archer.lookAt(0, 1, archer.position.z + 15);
                scene.add(archer);
            });
        }

        // --- THE TIMELINE (The 30-Second Script) ---
        console.log("[GENJUTSU] Step 9: Building Cinematic Timeline.");
        const eyelidsTop = document.querySelector('.eyelid.top');
        const eyelidsBottom = document.querySelector('.eyelid.bottom');
        const storyContainer = document.getElementById('story-container');

        const tl = gsap.timeline({
            onComplete: () => {
                console.log("[GENJUTSU] Timeline Complete. Switching to Video.");
                playFinalVideo();
            }
        });

        const playerHeight = 2.4;
        camera.position.set(0, playerHeight, 100);

        // 1. Wake Up (0-5s)
        tl.to([eyelidsTop, eyelidsBottom], { height: '0%', duration: 4, ease: 'power2.out' }, 1);
        tl.to(storyContainer, { filter: 'blur(0px)', duration: 5 }, 1);
        tl.add(() => showNotification("Where... am I?"), 3);

        // 2. The Walk (5-25s)
        tl.to(camera.position, {
            z: -pathLength + 150,
            duration: 20,
            ease: "none",
            onUpdate: () => {
                const time = tl.time();
                camera.position.x = Math.sin(time * 0.8) * 1.5;
                camera.position.y = playerHeight + Math.sin(time * 1.5) * 0.2;
                camera.rotation.y = Math.sin(time * 0.4) * 0.2;
            }
        }, 5);

        // 3. The Terror (22-26s)
        tl.to(camera.rotation, {
            x: 0.8,
            y: 0,
            z: 0,
            duration: 4,
            ease: "power3.inOut"
        }, 22);

        tl.add(() => showNotification("NO... NOT AGAIN..."), 24);

        // 4. The Model Dive (Acceleration)
        tl.add(() => {
            if (sharinganModel) {
                console.log("[GENJUTSU] Action: Model Diving.");
                gsap.to(sharinganModel.position, {
                    z: camera.position.z - 40,
                    y: playerHeight + 5,
                    duration: 6,
                    ease: "expo.in"
                });

                // Accelerate spin
                const spinObj = { val: 0.01 };
                gsap.to(spinObj, {
                    val: 0.8,
                    duration: 6,
                    onUpdate: function () {
                        if (sharinganModel) sharinganModel.rotation.y += spinObj.val;
                    },
                    ease: "power2.in"
                });
            }
        }, 25);

        // 5. Blackout
        tl.to([eyelidsTop, eyelidsBottom], { height: '50%', duration: 1.5, ease: "expo.in" }, 29);

        function playFinalVideo() {
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
                    opacity: 0, duration: 2, onComplete: () => {
                        videoContainer.remove();
                        showFinalBanner();
                    }
                });
            };
        }

        function showFinalBanner() {
            const banner = document.createElement('div');
            banner.className = 'akatsuki-banner';
            banner.innerHTML = `
                <div class="banner-content">
                    <h1>THE EYE OF MOON</h1>
                    <h2 class="akatsuki-text">AKATSUKI</h2>
                </div>
            `;
            document.body.appendChild(banner);
            gsap.from(".banner-content", { y: 100, opacity: 0, duration: 4, ease: "power4.out" });

            setTimeout(() => {
                showNarrative("Infinite Tsukuyomi.", [
                    { text: "Wake Up", action: () => window.location.href = 'index.html' }
                ]);
            }, 8000);
        }

        function animate() {
            requestAnimationFrame(animate);
            if (sharinganModel && !tl.isActive()) {
                sharinganModel.rotation.y += 0.01; // Constant slow spin if not in timeline
            }
            renderer.render(scene, camera);
        }

        animate();

    } catch (e) {
        console.error("[GENJUTSU] CRITICAL ERROR IN JS EXECUTION:", e);
    }
}
