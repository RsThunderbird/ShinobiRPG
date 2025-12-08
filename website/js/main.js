// Main Entry Point
let game = null;

// Loading simulation
function simulateLoading() {
    const progressBar = document.getElementById('loading-progress');
    const loadingText = document.getElementById('loading-text');

    const loadingSteps = [
        { progress: 20, text: 'Loading Three.js...' },
        { progress: 40, text: 'Creating winter world...' },
        { progress: 60, text: 'Generating snowfall...' },
        { progress: 80, text: 'Building Konoha village...' },
        { progress: 100, text: 'Ready!' }
    ];

    let currentStep = 0;

    const interval = setInterval(() => {
        if (currentStep < loadingSteps.length) {
            const step = loadingSteps[currentStep];
            progressBar.style.width = step.progress + '%';
            loadingText.textContent = step.text;
            currentStep++;
        } else {
            clearInterval(interval);
            setTimeout(() => {
                document.getElementById('loading-screen').style.display = 'none';
                document.getElementById('game-container').style.display = 'block';
                // Don't show login prompt immediately, wait for user data check
            }, 500);
        }
    }, 400);
}

// Show login prompt
function showLoginPrompt() {
    const loginPrompt = document.getElementById('login-prompt');
    loginPrompt.style.display = 'flex';

    // Discord login button
    document.getElementById('discord-login-btn').addEventListener('click', () => {
        loginWithDiscord();
    });

    // Guest play button
    document.getElementById('guest-play-btn').addEventListener('click', () => {
        startGame({ username: 'Guest Ninja', isGuest: true });
    });
}

// Redirect to server-side Discord login handler
function loginWithDiscord() {
    window.location.href = '/api/auth/discord/login';
}

// Handle user data from URL after server-side callback
function handleUserLogin() {
    const urlParams = new URLSearchParams(window.location.search);
    const discordId = urlParams.get('discord_id');
    const username = urlParams.get('username');

    if (discordId && username) {
        // Store discord_id for later API calls
        localStorage.setItem('discord_id', discordId);
        
        // Clean the URL
        window.history.replaceState({}, document.title, "/");

        // Start the game with the fetched user data
        startGame({ username: username, isGuest: false });

        return true; // User was logged in
    }
    return false; // User was not logged in
}

// Start the game
function startGame(userData) {
    // Hide login prompt
    document.getElementById('login-prompt').style.display = 'none';

    // Update player name
    document.getElementById('player-name').textContent = userData.username;

    // Initialize game
    game = new Game();

    // Load player data if not guest
    if (!userData.isGuest) {
        loadPlayerData();
    }
}

// Load player data from API
async function loadPlayerData() {
    try {
        const userId = localStorage.getItem('discord_id');
        if (!userId) return;

        const response = await fetch(`/api/player/${userId}`);

        if (response.ok) {
            const data = await response.json();
            updateHUD(data);
        }
    } catch (error) {
        console.error('Failed to load player data:', error);
    }
}

// Update HUD with player data
function updateHUD(playerData) {
    if (playerData.ryo !== undefined) {
        document.getElementById('ryo-amount').textContent = playerData.ryo.toLocaleString();
    }
    if (playerData.snowflakes !== undefined) {
        document.getElementById('snowflake-amount').textContent = playerData.snowflakes.toLocaleString();
    }
    // Update other stats as needed
}

// Grant reward (called from minigames)
async function grantReward(reward) {
    try {
        const userId = localStorage.getItem('discord_id');
        if (!userId) {
            console.log('Guest users cannot save rewards');
            return;
        }

        const response = await fetch(`/api/reward`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: userId,
                reward: reward
            })
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Reward granted:', result);
            loadPlayerData(); // Refresh player data
        }
    } catch (error) {
        console.error('Failed to grant reward:', error);
    }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    // Try to log the user in from URL params first
    const loggedIn = handleUserLogin();
    
    // If the user was not logged in via the redirect,
    // show the normal loading and login prompt sequence.
    if (!loggedIn) {
        simulateLoading();
        // The timeout in simulateLoading will now correctly show the game container,
        // and then we can decide to show the login prompt.
        setTimeout(() => {
             // If game hasn't started (i.e. not guest or logged in) show prompt.
            if (!game) {
                showLoginPrompt();
            }
        }, 2500); // Wait for loading sim to finish
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (game) {
        game.stop();
    }
});
