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
                    // Fixed: Face the movement direction
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
    container.innerHTML = ''; // Clear previous stage (Cave/Prestory)
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(100, 200, 100);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 512;
    sunLight.shadow.mapSize.height = 512;
    scene.add(sunLight);

    const loader = new THREE.GLTFLoader();

    function getTerrainHeight(x, z) {
        // Flat surface to prevent tearing and collision issues
        let h = 0;

        // Simple River Bed - Straight and clean
        const riverX = 150;
        const distToRiver = Math.abs(x - riverX);
        if (distToRiver < 30) {
            // Smooth dip for the river
            h = -5 * Math.cos((distToRiver / 30) * Math.PI * 0.5);
        }
        return h;
    }

    // Add Water Plane
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
    water.position.y = -1.5; // Adjusted height for better visibility in flat terrain
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
        if (h < -2) return; // Don't spawn trees in the river

        const group = new THREE.Group();
        const scale = 0.8 + Math.random() * 1.5;
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3 * scale, 0.5 * scale, 10 * scale, 8), new THREE.MeshLambertMaterial({ color: 0x2d1b0f }));
        trunk.position.y = 5 * scale; trunk.castShadow = true; group.add(trunk);
        const leaves = new THREE.Mesh(new THREE.DodecahedronGeometry(4 * scale, 0), new THREE.MeshLambertMaterial({ color: 0x1a4d1a }));
        leaves.position.y = 10 * scale; leaves.castShadow = true; group.add(leaves);
        group.position.set(x, h, z);
        scene.add(group);
    }

    function createRock(x, z) {
        const h = getTerrainHeight(x, z);
        if (h < -2) return;
        const group = new THREE.Group();
        const scale = 1 + Math.random() * 3;
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(scale, 0), new THREE.MeshLambertMaterial({ color: 0x666666 }));
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        rock.scale.set(1, 0.6, 1);
        rock.castShadow = true; rock.receiveShadow = true;
        group.position.set(x, h - 0.5, z);
        group.add(rock);
        scene.add(group);
    }

    for (let i = 0; i < 180; i++) {
        const x = (Math.random() - 0.5) * 800, z = (Math.random() - 0.5) * 800;
        if (Math.abs(x) > 40 || Math.abs(z) > 40) {
            if (i < 120) createTree(x, z);
            else createRock(x, z);
        }
    }

    // --- Road/Pathway ---
    const roadMat = new THREE.MeshLambertMaterial({ color: 0x5a4d33 });
    const roadSegments = 60;
    for (let i = 0; i < roadSegments; i++) {
        const t = i / roadSegments;
        const x = THREE.MathUtils.lerp(-50, 250, t);
        const z = THREE.MathUtils.lerp(50, -250, t);
        const wx = x + Math.sin(t * 6) * 5;
        const wz = z + Math.cos(t * 6) * 5;
        const wh = getTerrainHeight(wx, wz);
        if (wh < -0.5) continue;
        const segment = new THREE.Mesh(new THREE.PlaneGeometry(8, 10), roadMat);
        segment.position.set(wx, wh + 0.05, wz);
        segment.rotation.x = -Math.PI / 2;
        segment.rotation.z = Math.PI / 4 + Math.sin(t * 6) * 0.1;
        segment.receiveShadow = true;
        scene.add(segment);
    }

    const outpostPos = new THREE.Vector3(250, 0, -250);
    outpostPos.y = getTerrainHeight(outpostPos.x, outpostPos.z);

    loader.load(assets.watchtowerModel, (gltf) => {
        const model = gltf.scene;
        model.scale.set(5, 5, 5);
        model.position.copy(outpostPos);
        model.traverse(n => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; } });
        scene.add(model);
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const tx = outpostPos.x + Math.cos(angle) * 8, tz = outpostPos.z + Math.sin(angle) * 8, ty = getTerrainHeight(tx, tz) + 2;
            const torch = new THREE.PointLight(0xffaa44, 2, 15);
            torch.position.set(tx, ty, tz); scene.add(torch);
            const m = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2, 4), new THREE.MeshLambertMaterial({ color: 0x444444 }));
            m.position.set(tx, ty - 1, tz); scene.add(m);
        }
    });

    let zoroModel;
    const zoroPos = new THREE.Vector3(outpostPos.x + 15, 0, outpostPos.z + 15);
    zoroPos.y = getTerrainHeight(zoroPos.x, zoroPos.z);

    loader.load(assets.zoroModel, (gltf) => {
        zoroModel = gltf.scene;

        // Normalize height to 2 meters
        const box = new THREE.Box3().setFromObject(zoroModel);
        const size = box.getSize(new THREE.Vector3());
        const scaleFactor = 2 / size.y;
        zoroModel.scale.set(scaleFactor, scaleFactor, scaleFactor);

        zoroModel.position.copy(zoroPos);
        zoroModel.traverse(n => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; } });
        scene.add(zoroModel);

        if (gltf.animations && gltf.animations.length > 0) {
            zoroMixer = new THREE.AnimationMixer(zoroModel);

            // Play requested idle animation
            const idleClip = gltf.animations.find(a => a.name === 'pl_zoro_2yaf01_idle_a') || gltf.animations[0];
            zoroIdleAction = zoroMixer.clipAction(idleClip);
            zoroIdleAction.play();
        } else {
            console.log("Zoro model has NO animations.");
        }

        zoroController = new UniversalController(zoroModel, zoroMixer, getTerrainHeight);

        startDeerSpawning();

        const spot = new THREE.SpotLight(0xffffff, 1, 30, Math.PI / 4, 0.5);
        spot.position.set(zoroPos.x, zoroPos.y + 15, zoroPos.z);
        spot.target = zoroModel;
        scene.add(spot);

        console.log("Zoro successfully loaded at:", zoroModel.position, "Scale:", scaleFactor);
    }, undefined, (err) => {
        console.error("Error loading Zoro model, using placeholder:", err);
        zoroModel = new THREE.Group();
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 2, 8), new THREE.MeshLambertMaterial({ color: 0x0000ff }));
        mesh.position.y = 1;
        zoroModel.add(mesh);
        zoroModel.position.copy(zoroPos);
        scene.add(zoroModel);
    });

    camera.position.set(0, 10, 20);
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
                // Check if narrative box is visible and has buttons
                const narrativeBox = document.getElementById('narrative-box');
                if (narrativeBox && narrativeBox.style.display !== 'none') {
                    const buttons = narrativeBox.querySelectorAll('.story-choice-btn');
                    if (buttons.length > 0) {
                        buttons[0].click(); // Click the first button (usually "Next" or "Continue")
                    }
                } else {
                    checkInteraction();
                }
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
        if (dist < 4) { // Reduced even more to prevent accidental triggers
            if (scrollQuestActive) {
                if (scrollCollected) {
                    showNarrative("Zoro: You found it? The Forbidden Scroll of Teleportation... This might be our way out of here.", [
                        { text: "Continue", action: () => triggerPortalTransition() }
                    ]);
                } else {
                    showNarrative("Zoro: The scroll is at the bottom of the river. Don't drown!", [{ text: "I'm on it", action: () => { } }]);
                }
                return;
            }

            if (questActive) {
                if (meatCollected >= 5) {
                    showNarrative("Zoro: Thanks for the meat! You're not so bad after all.", [
                        {
                            text: "No problem", action: () => {
                                showNarrative("Zoro: While I was resting, I remembered something. There's a legend about a lost scroll hidden at the bottom of this river.", [
                                    {
                                        text: "A scroll?", action: () => {
                                            showNarrative("Zoro: They say it can tear through dimensions. If we find it, maybe we don't need a village to get you home.", [
                                                { text: "Let's find it!", action: () => startScrollQuest() }
                                            ]);
                                        }
                                    }
                                ]);
                            }
                        }
                    ]);
                    playZoroCompletionAnimation();
                    questActive = false; // Meat quest done
                }
                else showNarrative("Zoro: Where's my food? I need 5 pieces of meat!", [{ text: "Still looking", action: () => { } }]);
            } else startZoroDialogue();
        }
    }

    function startScrollQuest() {
        scrollQuestActive = true;
        showNotification("NEW QUEST: Find the Forbidden Scroll in the river!");

        loader.load(assets.scrollModel, (gltf) => {
            scrollModelObj = gltf.scene;

            // Normalize scale to ~0.96 meters (Reduced by 20% from 1.2m)
            const box = new THREE.Box3().setFromObject(scrollModelObj);
            const size = box.getSize(new THREE.Vector3());
            const scaleFactor = 0.96 / (size.y || 1);
            scrollModelObj.scale.set(scaleFactor, scaleFactor, scaleFactor);

            scrollModelObj.position.copy(scrollPos);
            scrollModelObj.userData.isScroll = true;

            const scrollLight = new THREE.PointLight(0x00ffff, 8, 30);
            scrollModelObj.add(scrollLight);

            // Add spinning animation
            gsap.to(scrollModelObj.rotation, { y: Math.PI * 2, duration: 4, repeat: -1, ease: "none" });
            gsap.to(scrollLight, { intensity: 15, duration: 1, yoyo: true, repeat: -1 });

            scrollModelObj.traverse(n => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; } });
            scene.add(scrollModelObj);

            // Notification for UI
            const questUi = document.getElementById('quest-ui');
            if (questUi) {
                const meatLabel = document.getElementById('meat-count').parentElement;
                if (meatLabel) meatLabel.innerHTML = 'Scroll: <span id="scroll-status">Not Found</span>';
                questUi.style.borderLeftColor = "#00ffff";
            }
        });
    }

    function triggerPortalTransition() {
        // Clear Forest UI
        const questUi = document.getElementById('quest-ui');
        if (questUi) questUi.classList.add('hidden');
        const compass = document.getElementById('compass-container');
        if (compass) compass.style.display = 'none';

        const storyContainer = document.getElementById('story-container');
        const eyeOverlay = document.getElementById('eye-blinking-overlay');
        const eyelidsTop = document.querySelector('.eyelid.top');
        const eyelidsBottom = document.querySelector('.eyelid.bottom');

        // Load Itachi for the ambush
        loader.load('assets/itachi.glb', (gltf) => {
            const itachi = gltf.scene;
            const box = new THREE.Box3().setFromObject(itachi);
            const sf = 2.2 / (box.getSize(new THREE.Vector3()).y || 1);
            itachi.scale.set(sf, sf, sf);

            const dir = new THREE.Vector3(); camera.getWorldDirection(dir);
            itachi.position.set(camera.position.x - dir.x * 4, 0, camera.position.z - dir.z * 4);
            itachi.lookAt(camera.position.x, 0, camera.position.z);
            scene.add(itachi);

            showNarrative("User: Not again..");

            showNotification("You start feeling dizzy...");
            gsap.to(storyContainer, { filter: 'blur(20px)', duration: 4 });
            gsap.to(camera, { fov: 30, duration: 4, onUpdate: () => camera.updateProjectionMatrix() });

            if (eyeOverlay) eyeOverlay.style.display = 'block';
            gsap.to([eyelidsTop, eyelidsBottom], {
                height: '50%',
                duration: 2,
                delay: 2.5,
                ease: "power2.inOut",
                onComplete: () => {
                    if (forestMusic) forestMusic.stop();
                    setTimeout(() => {
                        window.currentStage = 'genjutsu';
                        startGenjutsuStage();
                    }, 1000);
                }
            });
        });
    }

    function playZoroCompletionAnimation() {
        if (!zoroModel) return;

        // If there's a second animation, play it. Otherwise, do a 'dance' with GSAP.
        if (zoroMixer && zoroMixer._actions.length > 1) {
            const action = zoroMixer._actions[1];
            zoroMixer.stopAllAction();
            action.setLoop(THREE.LoopOnce);
            action.clampWhenFinished = true;
            action.play();
        } else {
            // Manual T-pose dance (Jump and rotate)
            const tl = gsap.timeline();
            tl.to(zoroModel.position, { y: zoroModel.position.y + 1, duration: 0.3, yoyo: true, repeat: 5 })
                .to(zoroModel.rotation, { y: zoroModel.rotation.y + Math.PI * 2, duration: 0.5 }, 0);
        }
    }

    function startZoroDialogue() {
        new Howl({ src: [assets.dialogue1] }).play();
        showNarrative("Zoro: Huh? Who are you? Do you know what this place is?", [
            {
                text: "Continue", action: () => {
                    showNarrative("User: I was kidnapped by someone and trapped in that cave nearby! This must be the Konoha Forest.", [
                        {
                            text: "Next", action: () => {
                                new Howl({ src: [assets.dialogue2] }).play();
                                showNarrative("Zoro: Konoha Forest? Where's Luffy? Get me out of here and I will help you with the kidnapper!", [
                                    {
                                        text: "Next", action: () => {
                                            showNarrative("User: Luffy? I don't know who your talking about. Come, let's go to the village and ask for help.", [
                                                {
                                                    text: "Next", action: () => {
                                                        new Howl({ src: [assets.dialogue3] }).play();
                                                        showNarrative("Zoro: Okay. But first find me some food!", [
                                                            { text: "Alright...", action: () => startMeatQuest() }
                                                        ]);
                                                    }
                                                }
                                            ]);
                                        }
                                    }
                                ]);
                            }
                        }
                    ]);
                }
            }
        ]);
    }

    function startMeatQuest() {
        questActive = true;
        document.getElementById('quest-ui').classList.remove('hidden');
        showNotification("NEW QUEST: Find 5 pieces of Meat for Zoro!");
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2, dist = 5 + Math.random() * 25;
            const mx = zoroPos.x + Math.cos(angle) * dist, mz = zoroPos.z + Math.sin(angle) * dist, my = getTerrainHeight(mx, mz);
            loader.load(assets.meatModel, (gltf) => {
                const meat = gltf.scene; meat.scale.set(0.15, 0.15, 0.15); meat.position.set(mx, my + 0.5, mz);
                meat.userData.isMeat = true;
                meat.traverse(n => { if (n.isMesh) { n.castShadow = true; } });
                scene.add(meat); meatsArray.push(meat);
            });
        }
    }

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function onMouseClick(event) {
        if (!isMobile && document.pointerLockElement !== renderer.domElement) {
            renderer.domElement.requestPointerLock();
            return;
        }
        checkInteraction();
        if (document.pointerLockElement === renderer.domElement) {
            raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        } else {
            const clientX = event.clientX || (event.touches ? event.touches[0].clientX : 0);
            const clientY = event.clientY || (event.touches ? event.touches[0].clientY : 0);
            mouse.x = (clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);
        }
        const intersects = raycaster.intersectObjects(scene.children, true);
        for (let i = 0; i < intersects.length; i++) {
            let obj = intersects[i].object;

            // Find parent for scroll
            let scrollObj = obj;
            while (scrollObj.parent && !scrollObj.userData.isScroll) scrollObj = scrollObj.parent;

            if (scrollObj.userData.isScroll && scrollObj.visible !== false) {
                scrollObj.visible = false;
                scrollCollected = true;
                showNotification("QUEST COMPLETE: Return to Zoro!");
                const statusEl = document.getElementById('scroll-status');
                if (statusEl) {
                    statusEl.innerText = "FOUND";
                    statusEl.style.color = "#00ffff";
                }
                break;
            }

            // Find the parent meat group
            while (obj.parent && !obj.userData.isMeat) obj = obj.parent;

            if (obj.userData.isMeat && obj.visible !== false) {
                obj.visible = false;
                obj.userData.isMeat = false;
                scene.remove(obj); meatCollected++;
                document.getElementById('meat-count').innerText = meatCollected;
                showNotification(`Collected Meat (${meatCollected}/5)`);
                if (meatCollected === 5) {
                    showNotification("QUEST COMPLETE: Talk to Zoro!");
                    const questUi = document.getElementById('quest-ui');
                    if (questUi) questUi.style.borderLeftColor = "#ffd700";
                    const comp = document.createElement('div');
                    comp.style.position = 'fixed'; comp.style.top = '50%'; comp.style.left = '50%';
                    comp.style.transform = 'translate(-50%, -50%)'; comp.style.fontSize = '5rem';
                    comp.style.color = '#ffd700'; comp.style.zIndex = '5000'; comp.innerText = 'COMPLETE';
                    comp.style.fontFamily = "'Bangers', cursive";
                    document.body.appendChild(comp);
                    setTimeout(() => { if (comp.parentNode) comp.remove(); }, 3000);
                }
                break;
            }
        }
    }
    renderer.domElement.addEventListener('click', onMouseClick);

    if (isMobile) {
        document.getElementById('mobile-controls').style.display = 'block';
        window.addEventListener('touchend', (e) => { if (e.target === renderer.domElement) onMouseClick(e.changedTouches[0]); });
        const jc = document.getElementById('joystick-container'), jo = document.getElementById('joystick');
        let jAct = false, tsX, tsY;
        jc.addEventListener('touchstart', (e) => { jAct = true; const t = e.touches[0], r = jc.getBoundingClientRect(); tsX = r.left + r.width / 2; tsY = r.top + r.height / 2; e.preventDefault(); }, { passive: false });
        window.addEventListener('touchmove', (e) => { if (!jAct) return; const t = Array.from(e.touches).find(t => { const r = jc.getBoundingClientRect(); return t.clientX > r.left - 50 && t.clientX < r.right + 50 && t.clientY > r.top - 50 && t.clientY < r.bottom + 50; }) || e.touches[0]; const dx = t.clientX - tsX, dy = t.clientY - tsY, ds = Math.sqrt(dx * dx + dy * dy), max = 40; const a = Math.atan2(dy, dx), mx = Math.min(ds, max) * Math.cos(a), my = Math.min(ds, max) * Math.sin(a); jo.style.transform = `translate(calc(-50% + ${mx}px), calc(-50% + ${my}px))`; moveF = my < -10; moveB = my > 10; moveL = mx < -10; moveR = mx > 10; }, { passive: false });
        window.addEventListener('touchend', () => { if (!jAct) return; jAct = false; jo.style.transform = 'translate(-50%, -50%)'; moveF = moveB = moveL = moveR = false; });
        document.getElementById('jump-btn').addEventListener('touchstart', (e) => { if (canJump) { velocity.y = 15; canJump = false; } e.preventDefault(); }, { passive: false });
        document.getElementById('run-btn').addEventListener('touchstart', (e) => { running = true; e.preventDefault(); }, { passive: false });
        document.getElementById('run-btn').addEventListener('touchend', (e) => { running = false; e.preventDefault(); }, { passive: false });
        let ltX, ltY, loId = null;
        window.addEventListener('touchstart', (e) => { for (let i = 0; i < e.changedTouches.length; i++) { const t = e.changedTouches[i]; if (t.clientX > window.innerWidth / 2) { loId = t.identifier; ltX = t.clientX; ltY = t.clientY; } } });
        window.addEventListener('touchmove', (e) => { for (let i = 0; i < e.changedTouches.length; i++) { const t = e.changedTouches[i]; if (t.identifier === loId) { yaw -= (t.clientX - ltX) * 0.005; pitch -= (t.clientY - ltY) * 0.005; pitch = Math.max(-1.4, Math.min(1.4, pitch)); ltX = t.clientX; ltY = t.clientY; } } });
        window.addEventListener('touchend', (e) => { for (let i = 0; i < e.changedTouches.length; i++) if (e.changedTouches[i].identifier === loId) loId = null; if (camera.position.distanceTo(zoroPos) < 4) checkInteraction(); });
    }

    const clock = new THREE.Clock(), cPtr = document.getElementById('compass-pointer'), dTxt = document.getElementById('distance-text');

    function startDeerSpawning() {
        const count = 30;
        for (let i = 0; i < count; i++) {
            const rx = (Math.random() - 0.5) * 800;
            const rz = (Math.random() - 0.5) * 800;
            const ry = getTerrainHeight(rx, rz);

            loader.load(assets.deerModel, (gltf) => {
                const deer = gltf.scene;

                // Normalize deer height to ~2 meters
                const box = new THREE.Box3().setFromObject(deer);
                const size = box.getSize(new THREE.Vector3());
                const scaleFactor = 2 / (size.y || 1);
                deer.scale.set(scaleFactor, scaleFactor, scaleFactor);

                deer.position.set(rx, ry, rz);
                deer.traverse(n => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; } });
                scene.add(deer);

                let dMixer;
                if (gltf.animations && gltf.animations.length > 0) {
                    dMixer = new THREE.AnimationMixer(deer);
                }

                const controller = new SimpleDeer(deer, dMixer, gltf.animations, getTerrainHeight);
                deerControllers.push(controller);
            });
        }
    }

    function animate() {
        if (window.currentStage !== 'forest') return;
        requestAnimationFrame(animate);
        const delta = Math.min(clock.getDelta(), 0.1);

        if (zoroController) zoroController.update(delta);
        deerControllers.forEach(dc => dc.update(delta));

        const waterLevel = -1.5;
        const isUnderwater = camera.position.y < waterLevel + 0.5;

        let s = running ? 0.6 : 0.3;
        if (isUnderwater) s *= 0.5; // Slow down in water

        const dir = new THREE.Vector3(); camera.getWorldDirection(dir); dir.y = 0; dir.normalize();
        const side = new THREE.Vector3().crossVectors(camera.up, dir).normalize();
        const m = new THREE.Vector3();
        if (moveF) m.add(dir); if (moveB) m.addScaledVector(dir, -1);
        if (moveL) m.add(side); if (moveR) m.addScaledVector(side, -1);
        if (m.length() > 0) camera.position.addScaledVector(m.normalize(), s);

        if (isUnderwater) {
            // Swimming Physics
            if (moveF || moveB || moveL || moveR) {
                // Gentle sway when moving
                camera.position.y += Math.sin(Date.now() * 0.005) * 0.02;
            }

            if (moveF && pitch < -0.2) velocity.y -= 5 * delta; // Dive
            if (moveF && pitch > 0.2) velocity.y += 5 * delta; // Surface

            velocity.y -= 10 * delta; // Minor gravity/sinking
            velocity.y *= 0.95; // Water resistance

            if (camera.position.y > waterLevel + 0.5) {
                camera.position.y = waterLevel + 0.5;
                velocity.y = 0;
            }
        } else {
            velocity.y -= 40 * delta;
        }

        camera.position.y += velocity.y * delta;
        const ty = getTerrainHeight(camera.position.x, camera.position.z);
        if (camera.position.y < ty + playerHeight) {
            camera.position.y = ty + playerHeight;
            velocity.y = 0;
            canJump = true;
        }
        camera.rotation.set(pitch, yaw, 0, 'YXZ');

        let targetPos = zoroPos;
        if (scrollQuestActive && !scrollCollected) {
            targetPos = scrollPos;
        }

        const dx = targetPos.x - camera.position.x, dz = targetPos.z - camera.position.z;
        const angle = Math.atan2(dx, -dz);
        if (cPtr) cPtr.style.transform = `translate(-50%, -50%) rotate(${angle + yaw}rad)`;
        if (dTxt) dTxt.innerText = Math.floor(camera.position.distanceTo(targetPos)) + "m";

        renderer.render(scene, camera);
    }
    animate();

    setTimeout(() => {
        if (loadingScreen) gsap.to(loadingScreen, {
            opacity: 0, duration: 1.5, onComplete: () => {
                loadingScreen.style.display = 'none'; forestMusic.play();
                showNarrative("Find the Watchtower. A strange warrior is waiting there.", [{ text: "Look around", action: () => { } }]);
            }
        });
    }, 1500);

    document.addEventListener('mousemove', (e) => { if (document.pointerLockElement === renderer.domElement) { yaw -= e.movementX * 0.002; pitch -= e.movementY * 0.002; pitch = Math.max(-1.4, Math.min(1.4, pitch)); } });

    // --- Developer Shortcuts ---
    window.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'p') {
            const json = scene.toJSON();
            const blob = new Blob([JSON.stringify(json)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'konoha_forest.json';
            a.click();
            console.log("Forest exported! Import this into threejs.org/editor");
        }
    });
}
