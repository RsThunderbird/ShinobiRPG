document.addEventListener('DOMContentLoaded', () => {
    // Landing page is static now with glassmorphism
    // If there's any specific logic needed for buttons or animations, it will go here.

    // Add subtle parallax effect to glass container
    const glass = document.querySelector('.glass-container');
    if (glass) {
        document.addEventListener('mousemove', (e) => {
            const xAxis = (window.innerWidth / 2 - e.pageX) / 50;
            const yAxis = (window.innerHeight / 2 - e.pageY) / 50;
            glass.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
        });

        document.addEventListener('mouseenter', () => {
            glass.style.transition = 'none';
        });

        document.addEventListener('mouseleave', () => {
            glass.style.transition = 'all 0.5s ease';
            glass.style.transform = `rotateY(0deg) rotateX(0deg)`;
        });
    }

    // Official Site external link
    const externalLinks = document.querySelectorAll('.external-link');
    externalLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // No need to preventDefault if it's external
        });
    });
});
