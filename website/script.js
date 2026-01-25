document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const loginBtn = document.getElementById('login-btn');
    const userProfile = document.getElementById('user-profile');
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');
    const bankBtn = document.getElementById('bank-btn');
    const settingsTrigger = document.getElementById('settings-trigger');
    const settingsBar = document.getElementById('settings-bar');
    const clearCacheBtn = document.getElementById('clear-cache-btn');
    const adminBtn = document.getElementById('admin-btn');
    const adminPanel = document.getElementById('admin-panel');
    const closeAdmin = document.getElementById('close-admin');
    const adminSearchBtn = document.getElementById('admin-search-btn');
    const adminSearchInput = document.getElementById('admin-search-input');
    const userJsonEdit = document.getElementById('user-json-edit');
    const playerJsonEdit = document.getElementById('player-json-edit');
    const saveUserDataBtn = document.getElementById('save-user-data');
    const savePlayerDataBtn = document.getElementById('save-player-data');

    const OWNER_ID = '835408109899219004';

    // 1. Handle Login Callback from URL
    const urlParams = new URLSearchParams(window.location.search);
    const discordId = urlParams.get('discord_id');

    // Variable to hold user data if we just logged in
    let justLoggedInUser = null;

    if (discordId) {
        // We just logged in
        justLoggedInUser = {
            id: discordId,
            username: urlParams.get('username'),
            avatar: `https://cdn.discordapp.com/avatars/${discordId}/${urlParams.get('avatar')}.png`
        };

        // Save to storage immediately
        localStorage.setItem('user_data', JSON.stringify(justLoggedInUser));

        // Clean URL to hide params
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // 2. Weekly Cache Clear Check
    const lastVisit = localStorage.getItem('last_visit');
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;

    if (!lastVisit || (now - parseInt(lastVisit) > oneWeek)) {
        console.log("System: Performing weekly cache cleanup...");

        // If we just logged in, we must preserve that session
        // If we didn't just log in, we wipe everything

        const backupUser = justLoggedInUser || (localStorage.getItem('user_data') ? JSON.parse(localStorage.getItem('user_data')) : null);

        // However, user requested "clear the cache" which usually implies resetting data. 
        // But if I reset user_data, they have to login again. 
        // The prompt says "first time... in a week... clear cache and cookies".
        // I will clear everything. If they just logged in, I'll restore it because they JUST authenticated.

        localStorage.clear();

        if (justLoggedInUser) {
            localStorage.setItem('user_data', JSON.stringify(justLoggedInUser));
        }

        console.log("System: Cache cleared.");
    }

    // Update last visit
    localStorage.setItem('last_visit', now.toString());


    // 3. UI Update Logic
    let storedUser = localStorage.getItem('user_data');
    if (storedUser) {
        try {
            const user = JSON.parse(storedUser);
            // Validate user object
            if (!user.id || !user.username) {
                console.warn("System: Invalid user data found, clearing session.");
                localStorage.removeItem('user_data');
                storedUser = null;
            } else {
                // Ensure avatar is valid
                if (user.avatar && user.avatar.includes('undefined')) {
                    user.avatar = 'https://cdn.discordapp.com/embed/avatars/0.png';
                }
            }
        } catch (e) {
            console.error("System: Corrupt user data, clearing.");
            localStorage.removeItem('user_data');
            storedUser = null;
        }
    }

    if (storedUser) {
        const user = JSON.parse(storedUser);

        // Hide Login, Show Profile
        if (loginBtn) loginBtn.classList.add('hidden');
        if (userProfile) {
            userProfile.classList.remove('hidden');
            if (user.avatar && !user.avatar.includes('null')) {
                userAvatar.src = user.avatar;
            } else {
                userAvatar.src = 'https://cdn.discordapp.com/embed/avatars/0.png';
            }
            userName.innerText = user.username;
        }

        // Show Bank
        if (bankBtn) bankBtn.classList.remove('hidden');

        // Show Admin Panel Button for Owner
        if (user.id === OWNER_ID) {
            if (adminBtn) adminBtn.classList.remove('hidden');
        }
    } else {
        // Ensure default state
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (userProfile) userProfile.classList.add('hidden');
        if (bankBtn) bankBtn.classList.add('hidden');
    }

    // 4. Settings Logic
    if (settingsTrigger && settingsBar) {
        settingsTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            settingsBar.classList.toggle('active');
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!settingsBar.contains(e.target) && !settingsTrigger.contains(e.target)) {
                settingsBar.classList.remove('active');
            }
        });
    }

    if (clearCacheBtn) {
        clearCacheBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear cache? You will be logged out.')) {
                localStorage.clear();
                window.location.reload();
            }
        });
    }

    // 5. Admin Panel Logic
    if (adminBtn && adminPanel && closeAdmin) {
        adminBtn.addEventListener('click', () => {
            adminPanel.classList.remove('hidden');
        });

        closeAdmin.addEventListener('click', () => {
            adminPanel.classList.add('hidden');
        });
    }

    if (adminSearchBtn && adminSearchInput) {
        adminSearchBtn.addEventListener('click', async () => {
            const targetId = adminSearchInput.value.trim();
            if (!targetId) return alert('Please enter a Discord ID.');

            const storedUser = JSON.parse(localStorage.getItem('user_data'));
            if (!storedUser || storedUser.id !== OWNER_ID) return;

            try {
                adminSearchBtn.innerText = 'Searching...';
                adminSearchBtn.disabled = true;

                const response = await fetch(`/api/admin/get-data?targetId=${targetId}&adminId=${storedUser.id}`);
                const result = await response.json();

                if (result.success) {
                    userJsonEdit.value = result.userData ? JSON.stringify(result.userData, null, 4) : 'No user data found.';
                    playerJsonEdit.value = result.playerData ? JSON.stringify(result.playerData, null, 4) : 'No player data found.';
                } else {
                    alert(result.error || 'Failed to fetch data.');
                }
            } catch (error) {
                console.error('Admin Search Error:', error);
                alert('An error occurred while searching.');
            } finally {
                adminSearchBtn.innerText = 'Search';
                adminSearchBtn.disabled = false;
            }
        });
    }

    const saveAdminData = async (type) => {
        const targetId = adminSearchInput.value.trim();
        if (!targetId) return alert('No target ID selected.');

        const textarea = type === 'user' ? userJsonEdit : playerJsonEdit;
        let data;
        try {
            data = JSON.parse(textarea.value);
        } catch (e) {
            return alert(`Invalid JSON in ${type} data field.`);
        }

        const storedUser = JSON.parse(localStorage.getItem('user_data'));
        const btn = type === 'user' ? saveUserDataBtn : savePlayerDataBtn;

        try {
            btn.innerText = 'Saving...';
            btn.disabled = true;

            const response = await fetch('/api/admin/update-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-id': storedUser.id
                },
                body: JSON.stringify({ targetId, type, data })
            });

            const result = await response.json();
            if (result.success) {
                alert(`${type.toUpperCase()} data updated successfully!`);
            } else {
                alert(result.error || 'Update failed.');
            }
        } catch (error) {
            console.error('Admin Update Error:', error);
            alert('An error occurred while saving.');
        } finally {
            btn.innerText = `Save ${type === 'user' ? 'User' : 'Player'} Data`;
            btn.disabled = false;
        }
    };

    if (saveUserDataBtn) {
        saveUserDataBtn.addEventListener('click', () => saveAdminData('user'));
    }

    if (savePlayerDataBtn) {
        savePlayerDataBtn.addEventListener('click', () => saveAdminData('player'));
    }

    // Animation for hero text
    if (typeof gsap !== 'undefined') {
        gsap.from(".hero-content", { y: 30, opacity: 0, duration: 1, ease: "power3.out" });
    }
});
