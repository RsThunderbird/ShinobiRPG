function initThreeGenjutsu() {
    const container = document.getElementById('genjutsu-three-container');
    const assets = window.assets;

    // Clear previous scene if any (though story.js handles switching)
    container.innerHTML = '';

    const scene = new THREE.Scene();
    // Hellish red environment
    scene.background = new THREE.Color(0x1a0000);
    scene.fog = new THREE.FogExp2(0x8b0000, 0.05);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xff0000, 0.5);
    scene.add(ambientLight);

    const spotLight = new THREE.SpotLight(0xff0000, 2);
    spotLight.position.set(0, 50, 0);
    scene.add(spotLight);

    // Initial eye opening animation
    const eyelidsTop = document.querySelector('.eyelid.top');
    const eyelidsBottom = document.querySelector('.eyelid.bottom');
    const storyContainer = document.getElementById('story-container');

    gsap.to([eyelidsTop, eyelidsBottom], { height: '0%', duration: 3, ease: 'power2.out' });
    gsap.to(storyContainer, { filter: 'blur(0px)', duration: 4 });

    // --- Terrain: Narrow Path ---
    // A long narrow path with "infinite" feeling
    const pathWidth = 10;
    const pathLength = 500;
    const groundGeo = new THREE.PlaneGeometry(pathWidth, pathLength, 1, 100);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x0a0000 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.z = -pathLength / 2;
    scene.add(ground);

    // Add some "void" around the path
    const voidMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const leftVoid = new THREE.Mesh(new THREE.PlaneGeometry(1000, pathLength), voidMat);
    leftVoid.rotation.x = -Math.PI / 2;
    leftVoid.position.set(-505, -0.1, -pathLength / 2);
    scene.add(leftVoid);

    const rightVoid = new THREE.Mesh(new THREE.PlaneGeometry(1000, pathLength), voidMat);
    rightVoid.rotation.x = -Math.PI / 2;
    rightVoid.position.set(505, -0.1, -pathLength / 2);
    scene.add(rightVoid);

    // --- Sharingan in the sky ---
    const sharinganTexture = new THREE.TextureLoader().load('https://i.postimg.cc/85z9dy0Y/itachi-sharingan.png');
    const sharinganGeo = new THREE.CircleGeometry(120, 64);
    const sharinganMat = new THREE.MeshBasicMaterial({
        map: sharinganTexture,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        color: 0xff4444 // Tinted red
    });
    const sharingan = new THREE.Mesh(sharinganGeo, sharinganMat);
    sharingan.position.set(0, 180, -450);
    sharingan.lookAt(0, 0, 0);
    scene.add(sharingan);

    // Slow spin and pulse
    gsap.to(sharingan.rotation, { z: Math.PI * 2, duration: 120, repeat: -1, ease: "none" });
    gsap.to(sharingan.scale, { x: 1.2, y: 1.2, duration: 2, yoyo: true, repeat: -1, ease: "sine.inOut" });

    // --- Archers ---
    const loader = new THREE.GLTFLoader();
    const archers = [];
    for (let i = 0; i < 20; i++) {
        loader.load(assets.archerModel, (gltf) => {
            const archer = gltf.scene;
            archer.scale.set(1.5, 1.5, 1.5);
            const side = i % 2 === 0 ? 1 : -1;
            archer.position.set(side * 4, 0, -i * 25);
            archer.lookAt(0, 0, archer.position.z);
            scene.add(archer);
            archers.push(archer);
        });
    }

    // --- Green opening at the end ---
    const endGeo = new THREE.CircleGeometry(15, 32);
    const endMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 });
    const endportal = new THREE.Mesh(endGeo, endMat);
    endportal.position.set(0, 5, -pathLength + 10);
    scene.add(endportal);

    // --- Movement Stats ---
    let moveF = false, moveB = false, moveL = false, moveR = false;
    let cameraShake = new THREE.Vector3();
    let moveErratic = new THREE.Vector2();
    let velocity = 0;
    const baseSpeed = 0.05; // Very slow
    const playerHeight = 2;

    camera.position.set(0, playerHeight, 0);

    const onKeyDown = (e) => {
        switch (e.code) {
            case 'KeyW': moveF = true; break;
            case 'KeyS': moveB = true; break;
            case 'KeyA': moveL = true; break;
            case 'KeyD': moveR = true; break;
        }
    };
    const onKeyUp = (e) => {
        switch (e.code) {
            case 'KeyW': moveF = false; break;
            case 'KeyS': moveB = false; break;
            case 'KeyA': moveL = false; break;
            case 'KeyD': moveR = false; break;
        }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    let finished = false;

    function animate() {
        if (finished) return;
        requestAnimationFrame(animate);

        const time = Date.now() * 0.001;

        // --- Nauseatic Effects ---
        // 1. Constant Camera Shake (Random/Sinusoidal)
        cameraShake.set(
            Math.sin(time * 6) * 0.1,
            Math.cos(time * 5) * 0.1,
            Math.sin(time * 4) * 0.05
        );

        // 2. Erratic "Drunk" Drift
        const driftX = Math.sin(time * 0.4) * 0.1;
        const driftAngle = Math.cos(time * 0.2) * 0.1;

        // Movement logic
        if (moveF) {
            // Apply erratic drift to movement
            camera.position.z -= baseSpeed;
            camera.position.x += driftX;
        }

        // Return to path center force
        camera.position.x *= 0.99;

        // Apply shake and drunk tilt
        const shakePos = camera.position.clone().add(cameraShake);
        const actualPos = camera.position.clone();
        camera.position.copy(shakePos);

        // Head bob & float
        camera.position.y = playerHeight + Math.sin(time * 2) * 0.1;

        // Camera rotation sway and drunk tilt
        camera.rotation.z = Math.sin(time * 0.5) * 0.2 + driftAngle;
        camera.rotation.y = Math.sin(time * 0.3) * 0.1;
        camera.rotation.x = Math.sin(time * 1.5) * 0.05;

        // --- End Detection ---
        if (camera.position.z <= -pathLength + 20) {
            triggerGenjutsuEnd();
        }

        renderer.render(scene, camera);

        // Restore position
        camera.position.copy(actualPos);
    }

    function triggerGenjutsuEnd() {
        if (finished) return;
        finished = true;

        // Camera pans upward to sharingan
        gsap.to(camera.rotation, { x: Math.PI / 4, duration: 3, ease: "power2.inOut" });

        // Sharingan draws closer (zoom/fov)
        gsap.to(camera, { fov: 20, duration: 4, onUpdate: () => camera.updateProjectionMatrix() });
        gsap.to(sharingan.position, { z: camera.position.z - 50, duration: 4, ease: "power1.in" });

        // User closes eyes
        setTimeout(() => {
            gsap.to([eyelidsTop, eyelidsBottom], {
                height: '50%',
                duration: 2,
                ease: "power2.inOut",
                onComplete: () => {
                    playFinalCinematic();
                }
            });
        }, 3000);
    }

    function playFinalCinematic() {
        const video = document.createElement('video');
        video.src = 'assets/itachi_sharingan.mp4';
        video.style.position = 'fixed';
        video.style.top = '0';
        video.style.left = '0';
        video.style.width = '100vw';
        video.style.height = '100vh';
        video.style.objectFit = 'cover';
        video.style.zIndex = '10000';
        video.autoplay = true;
        document.body.appendChild(video);

        video.onended = () => {
            // Maybe show credits or return to main menu
            showNarrative("To be continued...", [{ text: "The End", action: () => window.location.href = 'index.html' }]);
            video.remove();
        };
    }

    animate();
}
