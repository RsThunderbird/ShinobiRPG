/**
 * cave.js - 3D Cave environment and main story progression
 */

function initThreeCave() {
    const container = document.getElementById('three-container');
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // --- SETUP SCENE ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050005); // Very dark purple/black
    scene.fog = new THREE.FogExp2(0x050005, 0.05);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lights - Dim and moody
    const ambientLight = new THREE.AmbientLight(0x221133, 0.5);
    scene.add(ambientLight);

    const spotLight = new THREE.PointLight(0xaa00ff, 2, 20);
    spotLight.position.set(0, 5, 0);
    scene.add(spotLight);

    // --- CAVE GEOMETRY ---
    // Floor
    const floorGeo = new THREE.PlaneGeometry(100, 100, 20, 20);
    // Add some noise to the floor
    const posAttr = floorGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
        posAttr.setZ(i, Math.random() * 0.5);
    }
    floorGeo.computeVertexNormals();
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Walls (Using a large cylinder or custom meshes)
    const caveGroup = new THREE.Group();
    scene.add(caveGroup);

    function createRock(x, y, z, scale = 1, color = 0x222222) {
        const geo = new THREE.DodecahedronGeometry(scale, 0);
        const mat = new THREE.MeshLambertMaterial({ color: color });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        mesh.rotation.set(Math.random(), Math.random(), Math.random());
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        caveGroup.add(mesh);
        return mesh;
    }

    // Build cave walls roughly matching the image
    for (let i = 0; i < 100; i++) {
        const angle = (i / 100) * Math.PI * 2;
        const r = 10 + Math.random() * 2;
        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r;
        createRock(x, Math.random() * 10, z, 2 + Math.random() * 3);
    }

    // Tunnels
    // Left Tunnel
    for (let i = 0; i < 20; i++) {
        createRock(-8 - Math.random() * 2, Math.random() * 8, -5 - i, 3);
        createRock(-12 - Math.random() * 2, Math.random() * 8, -5 - i, 3);
        // Add some green "vines" hanging
        if (i % 5 === 0) {
            const vine = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 5), new THREE.MeshLambertMaterial({ color: 0x1a4d1a }));
            vine.position.set(-10, 5, -5 - i);
            caveGroup.add(vine);
        }
    }
    // Right Tunnel
    for (let i = 0; i < 20; i++) {
        createRock(8 + Math.random() * 2, Math.random() * 8, -5 - i, 3);
        createRock(12 + Math.random() * 2, Math.random() * 8, -5 - i, 3);
    }

    // Glowing Mushrooms
    function createMushroom(x, z) {
        const group = new THREE.Group();
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.2), new THREE.MeshLambertMaterial({ color: 0xcccccc }));
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0xaa00ff, emissive: 0x440066 }));
        cap.position.y = 0.1;
        group.add(stem);
        group.add(cap);
        group.position.set(x, 0.1, z);
        scene.add(group);

        const light = new THREE.PointLight(0xaa00ff, 0.5, 2);
        light.position.set(x, 0.5, z);
        scene.add(light);
    }

    for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = 5 + Math.random() * 4;
        createMushroom(Math.cos(angle) * r, Math.sin(angle) * r);
    }

    // Floating Particles
    const partGeo = new THREE.BufferGeometry();
    const partCount = 200;
    const posArray = new Float32Array(partCount * 3);
    for (let i = 0; i < partCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 40;
    }
    partGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const partMat = new THREE.PointsMaterial({ color: 0xaa00ff, size: 0.05, transparent: true, opacity: 0.6 });
    const particles = new THREE.Points(partGeo, partMat);
    scene.add(particles);

    // --- MOVEMENT ---
    camera.position.set(0, 1.6, 5);
    let moveF = false, moveB = false, moveL = false, moveR = false, running = false, velocity = new THREE.Vector3(), canJump = true, playerHeight = 1.6, yaw = 0, pitch = 0;

    const onKeyDown = (e) => {
        switch (e.code) {
            case 'KeyW': moveF = true; break;
            case 'KeyS': moveB = true; break;
            case 'KeyA': moveL = true; break;
            case 'KeyD': moveR = true; break;
            case 'ShiftLeft': running = true; break;
        }
    };
    const onKeyUp = (e) => {
        switch (e.code) {
            case 'KeyW': moveF = false; break;
            case 'KeyS': moveB = false; break;
            case 'KeyA': moveL = false; break;
            case 'KeyD': moveR = false; break;
            case 'ShiftLeft': running = false; break;
        }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    if (isMobile) {
        // Assume mobile controls are handled by story.html UI if present,
        // but for now let's just use click to move forward as a fallback
    }

    function animate() {
        if (window.currentStage !== 'cave') return;
        requestAnimationFrame(animate);
        const delta = 0.016; // approx

        let s = running ? 0.15 : 0.07;
        const dir = new THREE.Vector3(); camera.getWorldDirection(dir); dir.y = 0; dir.normalize();
        const side = new THREE.Vector3().crossVectors(camera.up, dir).normalize();
        const m = new THREE.Vector3();
        if (moveF) m.add(dir); if (moveB) m.addScaledVector(dir, -1);
        if (moveL) m.add(side); if (moveR) m.addScaledVector(side, -1);
        if (m.length() > 0) camera.position.addScaledVector(m.normalize(), s);

        camera.rotation.set(pitch, yaw, 0, 'YXZ');

        // Check for Tunnel Selection
        if (camera.position.z < -2) {
            if (camera.position.x < -2) {
                triggerPath('left');
            } else if (camera.position.x > 2) {
                triggerPath('right');
            }
        }

        renderer.render(scene, camera);
    }
    animate();

    let pathTriggered = false;
    function triggerPath(side) {
        if (pathTriggered) return;
        pathTriggered = true;

        if (side === 'right') {
            if (typeof showNarrative === 'function') {
                showNarrative("This path seems to be a dead end. Better go the other way.", [
                    {
                        text: "Go back", action: () => {
                            camera.position.set(0, 1.6, 2);
                            pathTriggered = false;
                        }
                    }
                ]);
            }
        } else {
            // Left Path - Correct one
            if (typeof showNarrative === 'function') {
                showNarrative("You venture deeper into the left tunnel...", []);
            }
            gsap.to(camera.position, {
                z: -20, duration: 3, onComplete: () => {
                    if (typeof startBatsMinigame === 'function') {
                        startBatsMinigame();
                    }
                }
            });
        }
    }

    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === renderer.domElement) {
            yaw -= e.movementX * 0.002;
            pitch -= e.movementY * 0.002;
            pitch = Math.max(-1.4, Math.min(1.4, pitch));
        }
    });
    renderer.domElement.addEventListener('click', () => {
        renderer.domElement.requestPointerLock();
    });

    // Opening Blinking Animation (Integrated)
    const eyelidsTop = document.querySelector('.eyelid.top');
    const eyelidsBottom = document.querySelector('.eyelid.bottom');
    const storyContainer = document.getElementById('story-container');

    gsap.timeline()
        .to([eyelidsTop, eyelidsBottom], { height: '35%', duration: 2, repeat: 1, yoyo: true })
        .to([eyelidsTop, eyelidsBottom], { height: '0%', duration: 3 })
        .to(storyContainer, { filter: 'blur(0px)', duration: 4 }, "-=2")
        .add(() => {
            if (typeof showNarrative === 'function') {
                showNarrative("You wake up in a damp, dark cave. Two tunnels lie ahead.", []);
            }
        });
}

window.initThreeCave = initThreeCave;
