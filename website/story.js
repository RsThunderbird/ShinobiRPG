document.addEventListener('DOMContentLoaded', () => {
    init();
});

const assets = {
    bat: 'https://i.postimg.cc/yNPHqWLC/image.png',
    cave: 'https://i.postimg.cc/3wBzWVMP/image.png',
    vines: 'https://i.postimg.cc/RCbGs9Qb/image.png',
    exit: 'https://i.postimg.cc/wjb0PzpB/image.png',
    walkingForward: 'https://i.postimg.cc/1zPM81Fp/image.png',
    vinesMinigameBg: 'https://i.postimg.cc/Hn5BJY6Q/image.png',
    walkingSound: 'https://assets.mixkit.co/sfx/preview/mixkit-footsteps-in-the-forest-ground-1230.mp3', // Placeholder
    forestMusic: 'assets/bgmusicstatic.mp3',
    watchtowerModel: 'assets/wt.glb',
    zoroModel: 'assets/zoro.glb',
    meatModel: 'assets/meat.glb',
    dialogue1: 'assets/dialogue1.mp3',
    dialogue2: 'assets/dialogue2.mp3',
    dialogue3: 'assets/dialogue3.mp3'
};

let currentStage = 'blinking';

function init() {
    startBlinkingAnimation();
    setupMobileFullScreen();
}

function setupMobileFullScreen() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
        document.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.error(`Error attempting to enable full-screen mode: ${err.message}`);
                });
            }
        }, { once: true });
    }
}

function startBlinkingAnimation() {
    const tl = gsap.timeline();
    const eyelidsTop = document.querySelector('.eyelid.top');
    const eyelidsBottom = document.querySelector('.eyelid.bottom');
    const storyContainer = document.getElementById('story-container');

    tl.to([eyelidsTop, eyelidsBottom], { height: '35%', duration: 3, repeat: 2, yoyo: true, ease: 'power1.inOut' })
        .to([eyelidsTop, eyelidsBottom], { height: '0%', duration: 4, ease: 'power2.inOut' })
        .to(storyContainer, { filter: 'blur(0px)', duration: 5 }, '-=2')
        .add(() => {
            showNarrative("You gradually open your eyes. You find yourself in the middle of a cave.", [
                {
                    text: "Look around", action: () => {
                        showNarrative("To your left and right, the cave splits. You need to decide to go left or right.", [
                            {
                                text: "Make a choice", action: () => {
                                    setupCaveChoice();
                                }
                            }
                        ]);
                    }
                }
            ]);
        });
}

function setupCaveChoice() {
    const leftExit = document.getElementById('exit-left');
    const rightExit = document.getElementById('exit-right');
    document.getElementById('cave-stage').classList.add('active');

    leftExit.addEventListener('click', () => handleChoice('left'), { once: true });
    rightExit.addEventListener('click', () => handleChoice('right'), { once: true });
}

function handleChoice(choice) {
    if (choice === 'right') {
        showNarrative("You step into the suffocating darkness of the right tunnel. It's a dead end.", [
            { text: "Turn back", action: () => handleChoice('left') }
        ]);
    } else {
        showNarrative("You choose the left path. The oxygen level is getting lower...", [
            { text: "Walk forward", action: () => startLeftCaveTransition() }
        ]);
    }
}

function showNarrative(text, buttons = []) {
    const box = document.getElementById('narrative-box');
    box.innerHTML = `<p class="narrative-text">${text}</p>`;

    const btnContainer = document.createElement('div');
    btnContainer.className = 'cta-buttons';
    btnContainer.style.marginTop = '30px';
    btnContainer.style.display = 'flex';
    btnContainer.style.gap = '15px';
    btnContainer.style.justifyContent = 'center';

    buttons.forEach(btn => {
        const b = document.createElement('button');
        b.innerText = btn.text;
        b.className = 'story-choice-btn';
        b.onclick = () => {
            box.style.display = 'none';
            if (btn.action) btn.action();
        };
        btnContainer.appendChild(b);
    });

    box.appendChild(btnContainer);
    box.style.display = 'block';
}

function showNotification(text) {
    const el = document.getElementById('notification');
    if (!el) return;
    el.innerText = text;
    el.classList.remove('hidden');
    el.style.opacity = '1';
    setTimeout(() => {
        el.style.opacity = '0';
        setTimeout(() => el.classList.add('hidden'), 500);
    }, 4000);
}

function startLeftCaveTransition() {
    gsap.to('#cave-bg', {
        opacity: 0, duration: 1.5, onComplete: () => {
            document.getElementById('cave-stage').classList.remove('active');
            startBatsMinigame();
        }
    });
}

function startBatsMinigame() {
    const stage = document.getElementById('bats-minigame');
    stage.classList.add('active');
    const container = document.getElementById('bats-container');
    let batsLeft = 20;

    for (let i = 0; i < batsLeft; i++) {
        const bat = document.createElement('img');
        bat.src = assets.bat;
        bat.className = 'bat';
        bat.style.left = Math.random() * 90 + '%';
        bat.style.top = Math.random() * 90 + '%';
        bat.onclick = () => {
            bat.remove();
            batsLeft--;
            if (batsLeft === 0) {
                stage.classList.remove('active');
                showNarrative("You've cleared the bats. You continue deeper into the cave.", [
                    { text: "Keep going", action: () => startVinesMinigame() }
                ]);
            }
        };
        container.appendChild(bat);
        gsap.to(bat, {
            x: 'random(-50, 50)',
            y: 'random(-50, 50)',
            duration: 'random(1, 2)',
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
        });
    }
}

function startVinesMinigame() {
    document.querySelectorAll('.stage').forEach(s => s.classList.remove('active'));
    document.getElementById('vines-stage').classList.add('active');

    const canvas = document.getElementById('vines-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let vines = [];
    for (let i = 0; i < 15; i++) {
        vines.push({
            x: Math.random() * canvas.width,
            y: 0,
            width: 20 + Math.random() * 40,
            height: canvas.height * 0.5 + Math.random() * canvas.height * 0.4,
            cleared: false
        });
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        vines.forEach(v => {
            if (!v.cleared) {
                ctx.fillStyle = '#2d5a27';
                ctx.fillRect(v.x, v.y, v.width, v.height);
            }
        });
    }

    draw();

    canvas.addEventListener('mousedown', handleMove);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('touchstart', (e) => handleMove(e.touches[0]));
    canvas.addEventListener('touchmove', (e) => handleMove(e.touches[0]));

    function handleMove(e) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        vines.forEach(v => {
            if (mouseX > v.x && mouseX < v.x + v.width && mouseY > v.y && mouseY < v.y + v.height) {
                v.cleared = true;
                draw();
            }
        });

        if (vines.every(v => v.cleared)) {
            finishVinesMinigame();
        }
    }
}

function finishVinesMinigame() {
    showNarrative("Finally! The path is clear. You see a dense forest...", [
        { text: "Go", action: () => startForestStage() }
    ]);
}

function startForestStage() {
    document.querySelectorAll('.stage').forEach(s => s.classList.remove('active'));
    document.getElementById('forest-stage').classList.add('active');
    document.getElementById('compass-container').style.display = 'flex';
    initThreeForest();
}

function initThreeForest() {
    const container = document.getElementById('three-container');
    const loadingScreen = document.getElementById('loading-screen');
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    let questActive = false;
    let meatCollected = 0;
    const meatsArray = [];

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

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
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
    loader.load(assets.zoroModel, (gltf) => {
        zoroModel = gltf.scene;
        zoroModel.scale.set(3, 3, 3);
        zoroModel.position.set(outpostPos.x + 8, outpostPos.y, outpostPos.z + 8);
        zoroModel.traverse(n => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; } });
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
        const dist = camera.position.distanceTo(zoroModel.position);
        if (dist < 10) {
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
            const angle = Math.random() * Math.PI * 2, dist = 10 + Math.random() * 50;
            const mx = outpostPos.x + Math.cos(angle) * dist, mz = outpostPos.z + Math.sin(angle) * dist, my = getTerrainHeight(mx, mz);
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
        window.addEventListener('touchend', (e) => { for (let i = 0; i < e.changedTouches.length; i++) if (e.changedTouches[i].identifier === loId) loId = null; if (camera.position.distanceTo(zoroModel.position) < 15) checkInteraction(); });
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
        const dx = outpostPos.x - camera.position.x, dz = outpostPos.z - camera.position.z;
        const angle = Math.atan2(dx, -dz);
        if (cPtr) cPtr.style.transform = `translate(-50%, -50%) rotate(${angle + yaw}rad)`;
        if (dTxt) dTxt.innerText = Math.floor(camera.position.distanceTo(outpostPos)) + "m";
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
