document.addEventListener('DOMContentLoaded', () => {
    init();
});

window.assets = {
    bat: 'https://i.postimg.cc/yNPHqWLC/image.png',
    cave: 'https://i.postimg.cc/3wBzWVMP/image.png',
    vines: 'https://i.postimg.cc/RCbGs9Qb/image.png',
    exit: 'https://i.postimg.cc/wjb0PzpB/image.png',
    walkingForward: 'https://i.postimg.cc/1zPM81Fp/image.png',
    vinesMinigameBg: 'https://i.postimg.cc/Hn5BJY6Q/image.png',
    walkingSound: 'https://assets.mixkit.co/sfx/preview/mixkit-footsteps-in-the-forest-ground-1230.mp3',
    forestMusic: 'assets/bgmusicstatic.mp3?v=1',
    watchtowerModel: 'assets/wt.glb?v=1',
    zoroModel: 'assets/zoro.glb?v=1',
    meatModel: 'assets/meat.glb?v=1',
    dialogue1: 'assets/dialogue1.mp3?v=1',
    dialogue2: 'assets/dialogue2.mp3?v=1',
    dialogue3: 'assets/dialogue3.mp3?v=1',
    caveAudio: '../cave.mp3',
    narrator1: '../narrator1.mp3',
    narrator2: '../narrator2.mp3'
};

function init() {
    setupStartScreen();
}

function setupStartScreen() {
    const startBtn = document.getElementById('start-button');
    startBtn.onclick = () => {
        // Enforce Fullscreen
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen();
        }

        // Start Cave Music (45% Volume)
        const caveMusic = new Howl({
            src: [assets.caveAudio],
            volume: 0.45,
            loop: true
        });
        caveMusic.play();

        // Start Narrator 1
        new Howl({ src: [assets.narrator1] }).play();

        // Hide Start Screen and start Cinematic
        gsap.to('#start-screen', {
            opacity: 0,
            duration: 1,
            onComplete: () => {
                document.getElementById('start-screen').classList.remove('active');
                startLogCinematic();
            }
        });
    };
}

function startLogCinematic() {
    const stage = document.getElementById('cinematic-stage');
    stage.classList.add('active');

    // Play Narrator 2 during cinematic
    const n2 = new Howl({ src: [assets.narrator2] });
    n2.play();

    let clicks = 0;
    const log = document.getElementById('log');
    const counter = document.getElementById('click-counter');

    log.onclick = () => {
        clicks++;
        counter.innerText = `${clicks} / 3`;

        // Visual feedback
        const axe = document.getElementById('axe');
        if (axe) gsap.fromTo(axe, { rotate: -45, x: 0 }, { rotate: -10, x: 80, duration: 0.1, yoyo: true, repeat: 1 });
        gsap.to(log, { x: 5, duration: 0.1, yoyo: true, repeat: 3 });

        if (clicks >= 3) {
            log.onclick = null;
            // Transition to the main story
            gsap.to(stage, {
                opacity: 0,
                duration: 2,
                onComplete: () => {
                    stage.classList.remove('active');
                    document.getElementById('story-container').classList.remove('hidden');
                    startBlinkingAnimation();
                }
            });
        }
    };
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
                        showNarrative("To your left and right, the cave splits. Choose a tunnel.", []);
                        setupCaveChoice();
                    }
                }
            ]);
        });
}

function setupCaveChoice() {
    const leftExit = document.getElementById('exit-left');
    const rightExit = document.getElementById('exit-right');
    document.getElementById('cave-stage').classList.add('active');

    leftExit.onclick = () => handleChoice('left');
    rightExit.onclick = () => handleChoice('right');
}

function handleChoice(choice) {
    if (choice === 'right') {
        showNarrative("The right tunnel is a dead end. Retrace your steps.", [
            { text: "Go Left", action: () => handleChoice('left') }
        ]);
    } else {
        document.getElementById('narrative-box').style.display = 'none';
        // Transition using the "walking forward" asset
        const caveBg = document.getElementById('cave-bg');
        gsap.to(caveBg, {
            scale: 1.5, opacity: 0, duration: 2, onComplete: () => {
                document.getElementById('cave-stage').classList.remove('active');
                startBatsMinigame();
            }
        });
    }
}

window.showNarrative = showNarrative;
window.showNotification = showNotification;
function showNarrative(text, buttons = []) {
    const box = document.getElementById('narrative-box');
    box.innerHTML = `<p class="narrative-text">${text}</p>`;

    if (buttons.length > 0) {
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
    }
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

function startBatsMinigame() {
    document.getElementById('narrative-box').style.display = 'none';
    const stage = document.getElementById('bats-minigame');
    stage.classList.add('active');
    const container = document.getElementById('bats-container');
    container.innerHTML = '';
    let batsLeft = 20;

    for (let i = 0; i < batsLeft; i++) {
        const bat = document.createElement('img');
        bat.src = assets.bat;
        bat.className = 'bat';
        bat.style.left = Math.random() * 80 + 10 + '%';
        bat.style.top = Math.random() * 80 + 10 + '%';
        bat.onclick = () => {
            bat.remove();
            batsLeft--;
            if (batsLeft === 0) {
                stage.classList.remove('active');
                showNarrative("The bats are gone. You continue deeper...", [
                    { text: "Next", action: () => startVinesMinigame() }
                ]);
            }
        };
        container.appendChild(bat);
        gsap.to(bat, {
            x: 'random(-100, 100)',
            y: 'random(-100, 100)',
            duration: 'random(1, 2)',
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
        });
    }
}

function startVinesMinigame() {
    document.querySelectorAll('.stage').forEach(s => s.classList.remove('active'));
    const stage = document.getElementById('vines-stage');
    stage.classList.add('active');

    // Set background image
    const exitImg = document.getElementById('exit-img');
    if (exitImg) exitImg.src = assets.vinesMinigameBg;

    // Use the vines image correctly
    const container = document.getElementById('vines-overlay-img-container');
    container.innerHTML = '';

    let vinesCleared = 0;
    const totalVines = 12;

    for (let i = 0; i < totalVines; i++) {
        const vine = document.createElement('img');
        vine.src = assets.vines;
        vine.style.position = 'absolute';
        vine.style.left = (i / totalVines) * 100 + '%';
        vine.style.top = '-10%';
        vine.style.height = '120%';
        vine.style.width = '15%';
        vine.style.cursor = 'pointer';
        vine.style.transition = 'opacity 0.5s ease, transform 0.5s ease';

        const clearVine = () => {
            if (vine.style.opacity === '0') return;
            vine.style.opacity = '0';
            vine.style.pointerEvents = 'none';
            vinesCleared++;
            if (vinesCleared === totalVines) {
                setTimeout(() => {
                    showNarrative("The path is clear! Light is shining through.", [
                        { text: "Enter the Forest", action: () => startForestStage() }
                    ]);
                }, 500);
            }
        };

        vine.onmouseover = clearVine;
        vine.ontouchstart = (e) => { clearVine(); e.preventDefault(); };
        container.appendChild(vine);
    }
}

function startForestStage() {
    document.querySelectorAll('.stage').forEach(s => s.classList.remove('active'));
    document.getElementById('forest-stage').classList.add('active');
    document.getElementById('compass-container').style.display = 'flex';
    if (typeof initThreeForest === 'function') {
        initThreeForest();
    } else {
        console.error("initThreeForest not found!");
    }
}
