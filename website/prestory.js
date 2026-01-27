/**
 * prestory.js - Automatic cutscene and wood-cutting minigame
 */

function initPrestory() {
    const container = document.getElementById('three-container'); // Reusing the same container
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // --- SETUP SCENE ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.01);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = ''; // Clear container
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
    sunLight.position.set(50, 100, 50);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // --- BACKYARD ENVIRONMENT ---
    // Grass
    const groundGeo = new THREE.PlaneGeometry(100, 100);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x3d7a32 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Simple House
    const houseGroup = new THREE.Group();
    const houseBase = new THREE.Mesh(new THREE.BoxGeometry(8, 5, 8), new THREE.MeshLambertMaterial({ color: 0x8b4513 }));
    houseBase.position.y = 2.5;
    houseBase.castShadow = true;
    houseGroup.add(houseBase);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(7, 4, 4), new THREE.MeshLambertMaterial({ color: 0x4a2b10 }));
    roof.position.y = 7;
    roof.rotation.y = Math.PI / 4;
    houseGroup.add(roof);

    houseGroup.position.set(-15, 0, -10);
    scene.add(houseGroup);

    // Fence
    for (let i = -20; i < 20; i += 2) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.5, 0.2), new THREE.MeshLambertMaterial({ color: 0x5d4037 }));
        post.position.set(i, 0.75, -20);
        scene.add(post);
        if (i < 18) {
            const rail = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 0.1), new THREE.MeshLambertMaterial({ color: 0x5d4037 }));
            rail.position.set(i + 1, 1.2, -20);
            scene.add(rail);
        }
    }

    // Well
    const well = new THREE.Group();
    const wellBase = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 1, 8), new THREE.MeshLambertMaterial({ color: 0x777777 }));
    wellBase.position.y = 0.5;
    well.add(wellBase);
    well.position.set(10, 0, -5);
    scene.add(well);

    // --- WOOD CUTTING MINIGAME ---
    const logsGroup = new THREE.Group();
    scene.add(logsGroup);

    let logsToCut = 3;
    let cutCount = 0;

    function spawnLog(index) {
        const logGroup = new THREE.Group();
        const log = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1, 8), new THREE.MeshLambertMaterial({ color: 0x5d4037 }));
        log.rotation.z = Math.PI / 2;
        log.position.y = 0.3;
        logGroup.add(log);

        // Highlight area (simple sphere/marker)
        const highlight = new THREE.Mesh(new THREE.SphereGeometry(0.15), new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.8 }));
        highlight.position.set((Math.random() - 0.5) * 0.6, 0.3, (Math.random() - 0.5) * 0.6);
        highlight.userData.isHighlight = true;
        logGroup.add(highlight);

        logGroup.position.set(index * 2, 0, 5);
        logsGroup.add(logGroup);
    }

    for (let i = 0; i < logsToCut; i++) spawnLog(i);

    camera.position.set(0, 1.6, 10);
    camera.lookAt(0, 1, 5);

    // --- RAYCASTER FOR CLICKS ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function onMouseClick(event) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(logsGroup.children, true);
        if (intersects.length > 0) {
            const hit = intersects.find(i => i.object.userData.isHighlight);
            if (hit) {
                hit.object.visible = false;
                hit.object.userData.isHighlight = false;
                cutCount++;
                if (cutCount === logsToCut) {
                    startItachiEncounter();
                }
            }
        }
    }
    window.addEventListener('click', onMouseClick);

    // --- ITACHI ENCOUNTER ---
    let itachiModel;
    const loader = new THREE.GLTFLoader();

    window.startItachiEncounter = function() {
        window.removeEventListener('click', onMouseClick);
        if (typeof showNotification === 'function') showNotification("Chores done. Something feels strange...");

        loader.load('assets/itachi.glb', (gltf) => {
            itachiModel = gltf.scene;
            // Scale to ~2m
            const box = new THREE.Box3().setFromObject(itachiModel);
            const size = box.getSize(new THREE.Vector3());
            const scaleFactor = 2 / (size.y || 1);
            itachiModel.scale.set(scaleFactor, scaleFactor, scaleFactor);

            // Place behind the user
            itachiModel.position.set(0, 0, 15);
            itachiModel.rotation.y = Math.PI;
            scene.add(itachiModel);

            setTimeout(triggerTurnAround, 2000);
        });
    }

    function triggerTurnAround() {
        const tl = gsap.timeline();
        // Turn around
        tl.to(camera.rotation, { y: Math.PI, duration: 2, ease: "power2.inOut" })
          .add(() => {
              // Start blurring
              const storyContainer = document.getElementById('story-container');
              gsap.to(storyContainer, { filter: 'blur(10px)', duration: 3 });
          })
          .to(camera.position, { y: 0.2, z: 12, duration: 2, ease: "power2.in" }, "+=1") // Falling
          .add(() => {
              // Eye blinking sequence
              startBlinkingTransition();
          });
    }

    function startBlinkingTransition() {
        const eyelidsTop = document.querySelector('.eyelid-top');
        const eyelidsBottom = document.querySelector('.eyelid-bottom');
        const eyeOverlay = document.getElementById('eye-blinking-overlay');

        if (eyeOverlay) eyeOverlay.style.display = 'block';

        const tl = gsap.timeline();
        tl.to([eyelidsTop, eyelidsBottom], { height: '50%', duration: 1, ease: "power2.inOut" })
          .to([eyelidsTop, eyelidsBottom], { height: '40%', duration: 0.5, repeat: 1, yoyo: true })
          .to([eyelidsTop, eyelidsBottom], { height: '50%', duration: 1 })
          .add(() => {
              // Move Itachi to stand over the user
              itachiModel.position.set(camera.position.x, 0, camera.position.z + 1);
              itachiModel.lookAt(camera.position.x, 0, camera.position.z);
          })
          .to([eyelidsTop, eyelidsBottom], { height: '45%', duration: 2, repeat: 1, yoyo: true })
          .add(() => {
              // Transition to cave
              if (typeof initThreeCave === 'function') {
                  initThreeCave();
              } else {
                  console.log("initThreeCave not found yet.");
              }
          });
    }

    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }
    animate();

    // Initial instruction
    setTimeout(() => {
        if (typeof showNarrative === 'function') showNarrative("Finish your chores. Cut the wood logs.", []);
    }, 1000);
}

window.initPrestory = initPrestory;
