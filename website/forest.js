function initThreeForest() {
    const container = document.getElementById('three-container');
    const loadingScreen = document.getElementById('loading-screen');
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    let questActive = false;
    let meatCollected = 0;
    const meatsArray = [];
    const assets = window.assets; // Ensure we use the global assets

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
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(100, 200, 100);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 512;
    sunLight.shadow.mapSize.height = 512;
    scene.add(sunLight);

    function getTerrainHeight(x, z) {
        return Math.sin(x * 0.05) * Math.cos(z * 0.05) * 2 +
            Math.sin(x * 0.02) * 5 +
            Math.cos(z * 0.02) * 5;
    }

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
        const group = new THREE.Group();
        const scale = 0.8 + Math.random() * 1.5;
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3 * scale, 0.5 * scale, 10 * scale, 8), new THREE.MeshLambertMaterial({ color: 0x2d1b0f }));
        trunk.position.y = 5 * scale; trunk.castShadow = true; group.add(trunk);
        const leaves = new THREE.Mesh(new THREE.DodecahedronGeometry(4 * scale, 0), new THREE.MeshLambertMaterial({ color: 0x1a4d1a }));
        leaves.position.y = 10 * scale; leaves.castShadow = true; group.add(leaves);
        group.position.set(x, getTerrainHeight(x, z), z);
        scene.add(group);
    }
    for (let i = 0; i < 150; i++) {
        const x = (Math.random() - 0.5) * 800, z = (Math.random() - 0.5) * 800;
        if (Math.abs(x) > 40 || Math.abs(z) > 40) createTree(x, z);
    }

    const outpostPos = new THREE.Vector3(200, 0, -200);
    outpostPos.y = getTerrainHeight(outpostPos.x, outpostPos.z);

    const loader = new THREE.GLTFLoader();
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
        zoroModel.scale.set(0.05, 0.05, 0.05); // Reduced from 4 to 0.05
        zoroModel.position.copy(zoroPos);
        zoroModel.traverse(n => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; } });
        scene.add(zoroModel);

        const spot = new THREE.SpotLight(0xffffff, 1, 30, Math.PI / 4, 0.5);
        spot.position.set(zoroPos.x, zoroPos.y + 15, zoroPos.z);
        spot.target = zoroModel;
        scene.add(spot);

        console.log("Zoro successfully loaded at:", zoroModel.position);
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
            case 'KeyE': checkInteraction(); break;
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
        if (dist < 12) {
            if (questActive) {
                if (meatCollected >= 5) showNarrative("Zoro: Thanks for the meat! You're not so bad after all.", [{ text: "No problem", action: () => { } }]);
                else showNarrative("Zoro: Where's my food? I need 5 pieces of meat!", [{ text: "Still looking", action: () => { } }]);
            } else startZoroDialogue();
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
                const meat = gltf.scene; meat.scale.set(1.5, 1.5, 1.5); meat.position.set(mx, my + 0.5, mz);
                meat.traverse(n => { if (n.isMesh) { n.castShadow = true; n.userData.isMeat = true; } });
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
            while (obj.parent && !obj.userData.isMeat) obj = obj.parent;
            if (obj.userData.isMeat) {
                scene.remove(obj); meatCollected++;
                document.getElementById('meat-count').innerText = meatCollected;
                showNotification(`Collected Meat (${meatCollected}/5)`);
                if (meatCollected === 5) {
                    showNotification("QUEST COMPLETE: Talk to Zoro!");
                    document.getElementById('quest-ui').style.borderLeftColor = "#ffd700";
                    const comp = document.createElement('div');
                    comp.style.position = 'fixed'; comp.style.top = '50%'; comp.style.left = '50%';
                    comp.style.transform = 'translate(-50%, -50%)'; comp.style.fontSize = '5rem';
                    comp.style.color = '#ffd700'; comp.style.zIndex = '5000'; comp.innerText = 'COMPLETE';
                    document.body.appendChild(comp);
                    setTimeout(() => comp.remove(), 3000);
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
        window.addEventListener('touchend', (e) => { for (let i = 0; i < e.changedTouches.length; i++) if (e.changedTouches[i].identifier === loId) loId = null; if (camera.position.distanceTo(zoroPos) < 15) checkInteraction(); });
    }

    const clock = new THREE.Clock(), cPtr = document.getElementById('compass-pointer'), dTxt = document.getElementById('distance-text');

    function animate() {
        requestAnimationFrame(animate);
        const delta = Math.min(clock.getDelta(), 0.1);
        let s = running ? 0.6 : 0.3;
        const dir = new THREE.Vector3(); camera.getWorldDirection(dir); dir.y = 0; dir.normalize();
        const side = new THREE.Vector3().crossVectors(camera.up, dir).normalize();
        const m = new THREE.Vector3();
        if (moveF) m.add(dir); if (moveB) m.addScaledVector(dir, -1);
        if (moveL) m.add(side); if (moveR) m.addScaledVector(side, -1);
        if (m.length() > 0) camera.position.addScaledVector(m.normalize(), s);
        velocity.y -= 40 * delta; camera.position.y += velocity.y * delta;
        const ty = getTerrainHeight(camera.position.x, camera.position.z);
        if (camera.position.y < ty + playerHeight) { camera.position.y = ty + playerHeight; velocity.y = 0; canJump = true; }
        camera.rotation.set(pitch, yaw, 0, 'YXZ');

        const dx = zoroPos.x - camera.position.x, dz = zoroPos.z - camera.position.z;
        const angle = Math.atan2(dx, -dz);
        if (cPtr) cPtr.style.transform = `translate(-50%, -50%) rotate(${angle + yaw}rad)`;
        if (dTxt) dTxt.innerText = Math.floor(camera.position.distanceTo(zoroPos)) + "m";

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
    }, 4000);

    document.addEventListener('mousemove', (e) => { if (document.pointerLockElement === renderer.domElement) { yaw -= e.movementX * 0.002; pitch -= e.movementY * 0.002; pitch = Math.max(-1.4, Math.min(1.4, pitch)); } });
}
