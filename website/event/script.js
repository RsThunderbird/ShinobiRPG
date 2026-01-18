document.addEventListener('DOMContentLoaded', () => {
    const hiddenContent = document.getElementById('hidden-content');
    const body = document.body;
    let isTorchActive = false;

    const updateTorch = (x, y) => {
        hiddenContent.style.setProperty('--x', `${x}px`);
        hiddenContent.style.setProperty('--y', `${y}px`);
    };

    const handleMove = (e) => {
        if (!isTorchActive) return;
        let x, y;
        if (e.touches && e.touches.length > 0) {
            x = e.touches[0].clientX;
            y = e.touches[0].clientY;
        } else {
            x = e.clientX;
            y = e.clientY;
        }
        updateTorch(x, y);
    };

    // Track mouse movement
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('touchmove', handleMove, { passive: false });

    // Handle initial touch/click to activate
    const activateTorch = (e) => {
        if (!isTorchActive) {
            isTorchActive = true;
            body.classList.add('torch-active');

            // Immediately move torch to click/touch location
            handleMove(e);

            // Start flicker loop
            animateFlicker();
        }
    };

    document.addEventListener('click', activateTorch);
    document.addEventListener('touchstart', (e) => {
        activateTorch(e);
        handleMove(e);
    }, { passive: false });

    // Flicker effect
    function animateFlicker() {
        if (!isTorchActive) return;
        // Random radius between 180 and 220px to simulate fire flickering
        const randomRadius = 180 + Math.random() * 40;
        hiddenContent.style.setProperty('--r', `${randomRadius}px`);

        requestAnimationFrame(() => {
            setTimeout(animateFlicker, 50 + Math.random() * 100);
        });
    }

    // Initial position reset (off screen)
    hiddenContent.style.setProperty('--x', `-1000px`);
    hiddenContent.style.setProperty('--y', `-1000px`);
});
