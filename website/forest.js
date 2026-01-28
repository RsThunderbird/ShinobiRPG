function initThreeForest() {
    const container = document.getElementById('three-container');
    const loadingScreen = document.getElementById('loading-screen');
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    let questActive = false;
    let meatCollected = 0;
    const meatsArray = [];
    let scrollQuestActive = false;
    let scrollCollected = false;
    let scrollModelObj = null;
    const scrollPos = new THREE.Vector3(150, -2.5, 50); // Lowered more into the river bed
    const deerControllers = [];
    const assets = window.assets;
    let zoroMixer, zoroController;
    let zoroIdleAction;

    class SimpleDeer {
        constructor(model, mixer, animations, getTerrainHeight) {
            this.model = model;
            this.mixer = mixer;
            this.getTerrainHeight = getTerrainHeight;
            this.target = new THREE.Vector3();
            this.state = 'IDLE';
            this.timer = Math.random() * 5;
            this.speed = 1.0 + Math.random();
            if (mixer && animations.length > 0) mixer.clipAction(animations[0]).play();
        }
        update(delta) {
            if (this.mixer) this.mixer.update(delta);
            this.timer -= delta;
            if (this.state === 'IDLE') {
                if (this.timer <= 0) {
                    this.target.set(this.model.position.x + (Math.random() - 0.5) * 60, 0, this.model.position.z + (Math.random() - 0.5) * 60);
                    this.state = 'WALKING'; this.timer = 10 + Math.random() * 10;
                }
            } else {
                const dx = this.target.x - this.model.position.x, dz = this.target.z - this.model.position.z;
                const dist = Math.sqrt(dx * dx + dz * dz);
                if (dist > 0.5 && this.timer > 0) {
                    const angle = Math.atan2(dx, dz);
                    this.model.lookAt(this.target.x, this.model.position.y, this.target.z);
                    const dir = new THREE.Vector3(0, 0, 1).applyQuaternion(this.model.quaternion);
                    this.model.position.addScaledVector(dir, this.speed * delta);
                    const ty = this.getTerrainHeight(this.model.position.x, this.model.position.z);
                    this.model.position.y = THREE.MathUtils.lerp(this.model.position.y, ty, 0.1);
                } else { this.state = 'IDLE'; this.timer = 2 + Math.random() * 5; }
            }
        }
    }

    const forestMusic = new Howl({
        src: [assets.forestMusic],
        loop: true,
        volume: 0.4,
        autoplay: false
    });

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.012);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(100, 200, 100);
    sunLight.castShadow = true;
    scene.add(sunLight);

    const loader = new THREE.GLTFLoader();

    function getTerrainHeight(x, z) {
        let h = 0;
        const riverX = 150;
        const distToRiver = Math.abs(x - riverX);
        if (distToRiver < 30) {
            h = -5 * Math.cos((distToRiver / 30) * Math.PI * 0.5);
        }
        return h;
    }

    const waterGeometry = new THREE.PlaneGeometry(1000, 1000);
    const waterMaterial = new THREE.MeshPhongMaterial({
        color: 0x0077ff,
        transparent: true,
        opacity: 0.7,
        shininess: 80,
        side: THREE.DoubleSide
    });
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -1.5;
    scene.add(water);

    const groundGeometry = new THREE.PlaneGeometry(1000, 1000, 80, 80);
    const posAttr = groundGeometry.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
        posAttr.setZ(i, getTerrainHeight(posAttr.getX(i), posAttr.getY(i)));
    }
    groundGeometry.computeVertexNormals();
    const ground = new THREE.Mesh(groundGeometry, new THREE.MeshLambertMaterial({ color: 0x2d5a27 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    function createTree(x, z) {
        const h = getTerrainHeight(x, z);
        if (h < -2) return;
        const group = new THREE.Group();
        const scale = 0.8 + Math.random() * 1.5;
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3 * scale, 0.5 * scale, 10 * scale, 8), new THREE.MeshLambertMaterial({ color: 0x2d1b0f }));
        trunk.position.y = 5 * scale; trunk.castShadow = true; group.add(trunk);
        const leaves = new THREE.Mesh(new THREE.DodecahedronGeometry(4 * scale, 0), new THREE.MeshLambertMaterial({ color: 0x1a4d1a }));
        leaves.position.y = 10 * scale; leaves.castShadow = true; group.add(leaves);
        group.position.set(x, h, z);
        scene.add(group);
    }

    for (let i = 0; i < 180; i++) {
        const x = (Math.random() - 0.5) * 800, z = (Math.random() - 0.5) * 800;
        if (Math.abs(x) > 40 || Math.abs(z) > 40) {
            if (i < 120) createTree(x, z);
        }
    }

    const outpostPos = new THREE.Vector3(250, 0, -250);
    outpostPos.y = getTerrainHeight(outpostPos.x, outpostPos.z);

    loader.load(assets.watchtowerModel, (gltf) => {
        const model = gltf.scene;
        model.scale.set(5, 5, 5);
        model.position.copy(outpostPos);
        model.traverse(n => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; } });
        scene.add(model);
    });

    let zoroModel;
    const zoroPos = new THREE.Vector3(outpostPos.x + 15, 0, outpostPos.z + 15);
    zoroPos.y = getTerrainHeight(zoroPos.x, zoroPos.z);

    loader.load(assets.zoroModel, (gltf) => {
        zoroModel = gltf.scene;
        const box = new THREE.Box3().setFromObject(zoroModel);
        const size = box.getSize(new THREE.Vector3());
        const scaleFactor = 2 / size.y;
        zoroModel.scale.set(scaleFactor, scaleFactor, scaleFactor);
        zoroModel.position.copy(zoroPos);
        zoroModel.traverse(n => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; } });
        scene.add(zoroModel);
        if (gltf.animations && gltf.animations.length > 0) {
            zoroMixer = new THREE.AnimationMixer(zoroModel);
            const idleClip = gltf.animations.find(a => a.name === 'pl_zoro_2yaf01_idle_a') || gltf.animations[0];
            zoroIdleAction = zoroMixer.clipAction(idleClip);
            zoroIdleAction.play();
        }
        zoroController = new UniversalController(zoroModel, zoroMixer, getTerrainHeight);
        startDeerSpawning();
    });

    camera.position.set(0, 5, 10);
    let moveF = false, moveB = false, moveL = false, moveR = false, running = false, velocity = new THREE.Vector3(), canJump = true, playerHeight = 2.0, yaw = 0, pitch = 0;

    const onKeyDown = (e) => {
        switch (e.code) {
            case 'KeyW': moveF = true; break;
            case 'KeyS': moveB = true; break;
            case 'KeyA': moveL = true; break;
            case 'KeyD': moveR = true; break;
            case 'ShiftLeft': running = true; break;
            case 'Space': if (canJump) { velocity.y = 15; canJump = false; } break;
            case 'KeyE':
                const narrativeBox = document.getElementById('narrative-box');
                if (narrativeBox && narrativeBox.style.display !== 'none') {
                    const buttons = narrativeBox.querySelectorAll('.story-choice-btn');
                    if (buttons.length > 0) buttons[0].click();
                } else checkInteraction();
                break;
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

    function checkInteraction() {
        if (!zoroModel) return;
        const dist = camera.position.distanceTo(zoroPos);
        if (dist < 6) {
            if (scrollQuestActive) {
                if (scrollCollected) {
                    showNarrative("Zoro: You found it? The Forbidden Scroll... Wait, who is that behind you?", [
                        { text: "Turn Around", action: () => triggerPortalTransition() }
                    ]);
                } else showNarrative("Zoro: The scroll is in the river nearby. Go find it!", [{ text: "Okay", action: () => { } }]);
                return;
            }
            if (questActive) {
                if (meatCollected >= 5) {
                    showNarrative("Zoro: Thanks for the meat! Now, let's find that scroll in the river.", [
                        { text: "Let's Go", action: () => startScrollQuest() }
                    ]);
                    questActive = false;
                } else showNarrative("Zoro: I need 5 pieces of meat. Go hunt some deer!", [{ text: "Still on it", action: () => { } }]);
            } else startZoroDialogue();
        }
    }

    function startScrollQuest() {
        scrollQuestActive = true;
        showNotification("NEW QUEST: Find the Forbidden Scroll in the river!");
        loader.load(assets.scrollModel, (gltf) => {
            scrollModelObj = gltf.scene;
            const box = new THREE.Box3().setFromObject(scrollModelObj);
            const scaleFactor = 0.96 / (box.getSize(new THREE.Vector3()).y || 1);
            scrollModelObj.scale.set(scaleFactor, scaleFactor, scaleFactor);
            scrollModelObj.position.copy(scrollPos);
            scrollModelObj.userData.isScroll = true;
            const scrollLight = new THREE.PointLight(0x00ffff, 8, 30);
            scrollModelObj.add(scrollLight);
            gsap.to(scrollModelObj.rotation, { y: Math.PI * 2, duration: 4, repeat: -1, ease: "none" });
            scene.add(scrollModelObj);
            document.getElementById('quest-ui').style.borderLeftColor = "#00ffff";
            document.getElementById('meat-count').parentElement.innerHTML = 'Scroll: <span id="scroll-status">Not Found</span>';
        });
    }

    function triggerPortalTransition() {
        // Clear all Forest UI
        document.getElementById('quest-ui').classList.add('hidden');
        document.getElementById('compass-container').style.display = 'none';

        // Load Itachi for one last scare
        loader.load('assets/itachi.glb', (gltf) => {
            const itachi = gltf.scene;
            const box = new THREE.Box3().setFromObject(itachi);
            const sf = 2.2 / (box.getSize(new THREE.Vector3()).y || 1);
            itachi.scale.set(sf, sf, sf);

            // Place Itachi behind user but within view as they turn
            const dir = new THREE.Vector3(); camera.getWorldDirection(dir);
            itachi.position.set(camera.position.x - dir.x * 4, 0, camera.position.z - dir.z * 4);
            itachi.lookAt(camera.position.x, 0, camera.position.z);
            scene.add(itachi);

            showNarrative("User: Not again..");

            const storyContainer = document.getElementById('story-container');
            const eyeOverlay = document.getElementById('eye-blinking-overlay');
            const eyelidsTop = document.querySelector('.eyelid.top');
            const eyelidsBottom = document.querySelector('.eyelid.bottom');

            gsap.to(storyContainer, { filter: 'blur(20px)', duration: 3 });
            if (eyeOverlay) eyeOverlay.style.display = 'block';
            gsap.to([eyelidsTop, eyelidsBottom], {
                height: '50%',
                duration: 2,
                delay: 1.5,
                ease: "power2.inOut",
                onComplete: () => {
                    if (forestMusic) forestMusic.stop();
                    window.currentStage = 'genjutsu';
                    startGenjutsuStage();
                }
            });
        });
    }

    function startZoroDialogue() {
        showNarrative("Zoro: I'm lost. If you find me 5 pieces of meat, I'll help you.", [
            { text: "Deal", action: () => startMeatQuest() }
        ]);
    }

    function startMeatQuest() {
        questActive = true;
        document.getElementById('quest-ui').classList.remove('hidden');
        showNotification("NEW QUEST: Find 5 pieces of Meat!");
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2, dist = 10 + Math.random() * 30;
            const mx = zoroPos.x + Math.cos(angle) * dist, mz = zoroPos.z + Math.sin(angle) * dist, my = getTerrainHeight(mx, mz);
            loader.load(assets.meatModel, (gltf) => {
                const meat = gltf.scene; meat.scale.set(0.15, 0.15, 0.15); meat.position.set(mx, my + 0.5, mz);
                meat.userData.isMeat = true;
                scene.add(meat); meatsArray.push(meat);
            });
        }
    }

    function onMouseClick(event) {
        if (!isMobile && document.pointerLockElement !== renderer.domElement) {
            renderer.domElement.requestPointerLock();
            return;
        }
        checkInteraction();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        const intersects = raycaster.intersectObjects(scene.children, true);
        for (let i = 0; i < intersects.length; i++) {
            let obj = intersects[i].object;
            let scrollObj = obj; while (scrollObj.parent && !scrollObj.userData.isScroll) scrollObj = scrollObj.parent;
            if (scrollObj.userData.isScroll && scrollObj.visible !== false) {
                scrollObj.visible = false; scrollCollected = true;
                showNotification("Return to Zoro!");
                if (document.getElementById('scroll-status')) {
                    document.getElementById('scroll-status').innerText = "FOUND";
                    document.getElementById('scroll-status').style.color = "#00ffff";
                }
                break;
            }
            let meatObj = obj; while (meatObj.parent && !meatObj.userData.isMeat) meatObj = meatObj.parent;
            if (meatObj.userData.isMeat && meatObj.visible !== false) {
                meatObj.visible = false; meatCollected++;
                document.getElementById('meat-count').innerText = meatCollected;
                showNotification(`Meat (${meatCollected}/5)`);
                break;
            }
        }
    }
    renderer.domElement.addEventListener('click', onMouseClick);

    function startDeerSpawning() {
        for (let i = 0; i < 20; i++) {
            const rx = (Math.random() - 0.5) * 600, rz = (Math.random() - 0.5) * 600, ry = getTerrainHeight(rx, rz);
            loader.load(assets.deerModel, (gltf) => {
                const deer = gltf.scene;
                const box = new THREE.Box3().setFromObject(deer);
                const sf = 2 / (box.getSize(new THREE.Vector3()).y || 1);
                deer.scale.set(sf, sf, sf); deer.position.set(rx, ry, rz);
                scene.add(deer);
                const controller = new SimpleDeer(deer, gltf.animations ? new THREE.AnimationMixer(deer) : null, gltf.animations, getTerrainHeight);
                deerControllers.push(controller);
            });
        }
    }

    const clock = new THREE.Clock();
    const cPtr = document.getElementById('compass-pointer'), dTxt = document.getElementById('distance-text');

    function animate() {
        if (window.currentStage !== 'forest') return;
        requestAnimationFrame(animate);
        const delta = Math.min(clock.getDelta(), 0.1);
        if (zoroController) zoroController.update(delta);
        deerControllers.forEach(dc => dc.update(delta));

        let s = running ? 0.6 : 0.3;
        const dir = new THREE.Vector3(); camera.getWorldDirection(dir); dir.y = 0; dir.normalize();
        const side = new THREE.Vector3().crossVectors(camera.up, dir).normalize();
        const m = new THREE.Vector3();
        if (moveF) m.add(dir); if (moveB) m.addScaledVector(dir, -1);
        if (moveL) m.add(side); if (moveR) m.addScaledVector(side, -1);
        if (m.length() > 0) camera.position.addScaledVector(m.normalize(), s);

        velocity.y -= 40 * delta;
        camera.position.y += velocity.y * delta;
        const ty = getTerrainHeight(camera.position.x, camera.position.z);
        if (camera.position.y < ty + playerHeight) {
            camera.position.y = ty + playerHeight;
            velocity.y = 0; canJump = true;
        }
        camera.rotation.set(pitch, yaw, 0, 'YXZ');

        let targetPos = scrollQuestActive && !scrollCollected ? scrollPos : zoroPos;
        const angle = Math.atan2(targetPos.x - camera.position.x, -(targetPos.z - camera.position.z));
        if (cPtr) cPtr.style.transform = `translate(-50%, -50%) rotate(${angle + yaw}rad)`;
        if (dTxt) dTxt.innerText = Math.floor(camera.position.distanceTo(targetPos)) + "m";

        renderer.render(scene, camera);
    }
    animate();

    setTimeout(() => {
        if (loadingScreen) gsap.to(loadingScreen, {
            opacity: 0, duration: 1, onComplete: () => {
                loadingScreen.style.display = 'none'; forestMusic.play();
                showNarrative("Search for the Watchtower. Zoro is waiting there.", []);
            }
        });
    }, 1500);

    document.addEventListener('mousemove', (e) => { if (document.pointerLockElement === renderer.domElement) { yaw -= e.movementX * 0.002; pitch -= e.movementY * 0.002; pitch = Math.max(-1.4, Math.min(1.4, pitch)); } });
}
window.initThreeForest = initThreeForest;
