// Game Configuration
const CONFIG = {
    // Discord OAuth
    DISCORD_REDIRECT_URI: window.location.origin + '/api/auth/discord/callback',

    // API Configuration - All API calls are relative
    API_URL: '',

    // Game Settings
    PLAYER: {
        SPEED: 5,
        SPRINT_MULTIPLIER: 1.5,
        JUMP_FORCE: 10,
        SIZE: 1
    },

    WORLD: {
        SIZE: 100,
        SNOW_PARTICLES: 1000
    },

    CAMERA: {
        FOV: 75,
        NEAR: 0.1,
        FAR: 1000,
        OFFSET: { x: 0, y: 5, z: 10 }
    }
};
