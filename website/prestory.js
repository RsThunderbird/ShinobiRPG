/**
 * prestory.js - First-person backyard intro with wood-cutting task
 */

function initPrestory() {
    const container = document.getElementById('three-container');
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    container.innerHTML = '';

    // --- SETUP SCENE ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Bright backyard sky
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.015);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    window.prestoryCamera = camera;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
    sunLight.position.set(50, 100, 50);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // --- ENVIRONMENT ---
    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x3d7a32 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // House
    const house = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(10, 6, 10), new THREE.MeshLambertMaterial({ color: 0x8b4513 }));
    body.position.y = 3;
    house.add(body);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(8, 5, 4), new THREE.MeshLambertMaterial({ color: 0x4a2b10 }));
    roof.position.y = 8.5;
    roof.rotation.y = Math.PI / 4;
    house.add(roof);
    house.position.set(-20, 0, -15);
    scene.add(house);

    // Fence
    for (let i = -30; i < 30; i += 2) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.5, 0.2), new THREE.MeshLambertMaterial({ color: 0x5d4037 }));
        post.position.set(i, 0.75, -25);
        scene.add(post);
    }

    // --- WOOD CUTTING SETUP ---
    const logsGroup = new THREE.Group();
    scene.add(logsGroup);
    let logsToCut = 3;
    let cutCount = 0;

    function spawnLog(x, z) {
        const logGroup = new THREE.Group();
        logGroup.userData.isLog = true;

        const log1 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.6, 8), new THREE.MeshLambertMaterial({ color: 0x5d4037 }));
        log1.rotation.z = Math.PI / 2;
        log1.position.set(-0.3, 0.4, 0);
        logGroup.add(log1);
        logGroup.userData.log1 = log1;

        const log2 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.6, 8), new THREE.MeshLambertMaterial({ color: 0x5d4037 }));
        log2.rotation.z = Math.PI / 2;
        log2.position.set(0.3, 0.4, 0);
        logGroup.add(log2);
        logGroup.userData.log2 = log2;

        const highlight = new THREE.Mesh(new THREE.SphereGeometry(0.2), new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.7 }));
        highlight.position.set(0, 0.6, 0);
        highlight.userData.isHighlight = true;
        logGroup.add(highlight);

        logGroup.position.set(x, 0, z);
        logsGroup.add(logGroup);
    }

    spawnLog(0, -5);
    spawnLog(4, -6);
    spawnLog(-4, -4);

    // --- MOVEMENT CONTROLS ---
    let moveF = false, moveB = false, moveL = false, moveR = false, canMove = true;
    let yaw = 0, pitch = 0;
    const velocity = new THREE.Vector3();
    const playerHeight = 2.0;

    camera.position.set(0, playerHeight, 5);

    const onKeyDown = (e) => {
        if (!canMove) return;
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

    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === renderer.domElement && canMove) {
            yaw -= e.movementX * 0.002;
            pitch -= e.movementY * 0.002;
            pitch = Math.max(-1.4, Math.min(1.4, pitch));
        }
    });

    renderer.domElement.addEventListener('click', () => {
        if (!document.pointerLockElement) {
            renderer.domElement.requestPointerLock();
        } else {
            performAction();
        }
    });

    const raycaster = new THREE.Raycaster();
    function performAction() {
        if (!canMove) return;
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        const intersects = raycaster.intersectObjects(logsGroup.children, true);
        const highlightHit = intersects.find(i => i.object.userData.isHighlight);
        if (highlightHit && highlightHit.object.visible) {
            highlightHit.object.visible = false;

            // Log breaking animation
            let parent = highlightHit.object.parent;
            if (parent && parent.userData.isLog) {
                const l1 = parent.userData.log1;
                const l2 = parent.userData.log2;
                gsap.to(l1.position, { x: -1.2, y: 0, duration: 0.5, ease: "power2.out" });
                gsap.to(l1.rotation, { x: 1, z: Math.PI / 2 + 0.5, duration: 0.5 });
                gsap.to(l2.position, { x: 1.2, y: 0, duration: 0.5, ease: "power2.out" });
                gsap.to(l2.rotation, { x: -1, z: Math.PI / 2 - 0.5, duration: 0.5 });
            }

            cutCount++;
            if (typeof showNotification === 'function') showNotification(`Log cut (${cutCount}/${logsToCut})`);
            if (cutCount === logsToCut) {
                setTimeout(startItachiEncounter, 1000);
            }
        }
    }

    // --- ITACHI ENCOUNTER ---
    let itachiModel;
    function startItachiEncounter() {
        canMove = false;
        moveF = moveB = moveL = moveR = false;
        if (typeof showNotification === 'function') showNotification("Chores done. Something feels strange...");

        const gltfLoader = new THREE.GLTFLoader();
        gltfLoader.load('assets/itachi.glb', (gltf) => {
            itachiModel = gltf.scene;

            // Standard scale to 2m
            const box = new THREE.Box3().setFromObject(itachiModel);
            const size = box.getSize(new THREE.Vector3());
            const scaleFactor = 2.0 / (size.y || 1);
            itachiModel.scale.set(scaleFactor, scaleFactor, scaleFactor);

            // Position behind player, ensuring he's not underground
            // If his origin is at the center, we need to lift him by half his height
            const height = size.y * scaleFactor;
            itachiModel.position.set(camera.position.x, height / 2, camera.position.z + 5);

            // Look at player
            itachiModel.lookAt(camera.position.x, height / 2, camera.position.z);
            scene.add(itachiModel);

            setTimeout(triggerTurnAround, 2000);
        });
    }

    function triggerTurnAround() {
        const tl = gsap.timeline();
        // Calculate target rotation to look at Itachi's face
        // Itachi is at z + 5, camera is at z.
        // Rotation Y should be Math.PI (behind)
        // Rotation X should be slightly up if we are looking at his face

        tl.to(camera.rotation, {
            x: 0.3, // Tilt up slightly
            y: Math.PI,
            duration: 3,
            ease: "power2.inOut"
        })
        .add(() => {
            const storyContainer = document.getElementById('story-container');
            if (storyContainer) gsap.to(storyContainer, { filter: 'blur(10px)', duration: 3 });
        })
        .to(camera.position, {
            y: 0.2,
            z: camera.position.z + 1,
            duration: 2,
            ease: "power2.in"
        }, "+=1")
        .add(() => {
            startBlinkingTransition();
        });
    }

    function startBlinkingTransition() {
        const eyeOverlay = document.getElementById('eye-blinking-overlay');
        const eyelidsTop = document.querySelector('.eyelid.top');
        const eyelidsBottom = document.querySelector('.eyelid.bottom');

        if (eyeOverlay) eyeOverlay.style.display = 'block';

        gsap.timeline()
            .to([eyelidsTop, eyelidsBottom], { height: '50%', duration: 1.5, ease: "power2.inOut" })
            .add(() => {
                // Move Itachi to stand right over the user
                if (itachiModel) {
                    const box = new THREE.Box3().setFromObject(itachiModel);
                    const size = box.getSize(new THREE.Vector3());
                    itachiModel.position.set(camera.position.x, size.y / 2, camera.position.z - 0.5);
                }
            })
            .to([eyelidsTop, eyelidsBottom], { height: '40%', duration: 0.5, repeat: 1, yoyo: true })
            .to([eyelidsTop, eyelidsBottom], { height: '50%', duration: 1.0 }) // Final shut
            .add(() => {
                // Show "A few days later" transition
                const storyContainer = document.getElementById('story-container');
                const intermission = document.createElement('div');
                intermission.id = 'intermission-overlay';
                intermission.style.position = 'fixed';
                intermission.style.top = '0';
                intermission.style.left = '0';
                intermission.style.width = '100%';
                intermission.style.height = '100%';
                intermission.style.background = 'black';
                intermission.style.color = 'white';
                intermission.style.display = 'flex';
                intermission.style.alignItems = 'center';
                intermission.style.justifyContent = 'center';
                intermission.style.fontSize = '2rem';
                intermission.style.fontFamily = "'Cinzel', serif";
                intermission.style.zIndex = '10000';
                intermission.style.opacity = '0';
                intermission.innerText = "A few days later...";
                document.body.appendChild(intermission);

                gsap.to(intermission, { opacity: 1, duration: 1, onComplete: () => {
                    setTimeout(() => {
                        gsap.to(intermission, { opacity: 0, duration: 1, onComplete: () => {
                            intermission.remove();
                            window.currentStage = 'cave';
                            if (typeof initThreeCave === 'function') {
                                initThreeCave();
                            }
                        }});
                    }, 3000);
                }});
            });
    }

    // --- ANIMATION LOOP ---
    function animate() {
        if (window.currentStage !== 'prestory') return;
        requestAnimationFrame(animate);

        if (canMove) {
            const delta = 0.016;
            const speed = 0.15;
            const dir = new THREE.Vector3();
            camera.getWorldDirection(dir);
            dir.y = 0; dir.normalize();
            const side = new THREE.Vector3().crossVectors(camera.up, dir).normalize();

            const move = new THREE.Vector3();
            if (moveF) move.add(dir);
            if (moveB) move.addScaledVector(dir, -1);
            if (moveL) move.add(side);
            if (moveR) move.addScaledVector(side, -1);

            if (move.length() > 0) {
                const nextPos = camera.position.clone().addScaledVector(move.normalize(), speed);

                // Invisible Boundaries
                const limit = 45;
                if (Math.abs(nextPos.x) < limit && Math.abs(nextPos.z) < limit) {
                    camera.position.copy(nextPos);
                }
            }
            camera.rotation.set(pitch, yaw, 0, 'YXZ');
        }

        renderer.render(scene, camera);
    }
    animate();

    // Resize handler
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    setTimeout(() => {
        if (typeof showNarrative === 'function') showNarrative("Finish your chores. Cut the wood logs with your axe (Click to Interact).", []);
    }, 1000);
}

window.initPrestory = initPrestory;
