/**
 * Gameunity — Profile & Settings Master Logic
 * Single Source of Truth: localStorage.getItem('nexus_user')
 */

// --- 1. SESSION HELPERS ---
window.getCurrentUser = function() {
    const userStr = localStorage.getItem('nexus_user');
    return userStr ? JSON.parse(userStr) : null;
};

// --- 2. AUTH & PREMIUM LOGOUT ---
window.logout = function () {
    const overlay = document.getElementById('logoutOverlay');
    if (overlay) overlay.classList.add('active');

    // Wipe the only record we use
    localStorage.removeItem('nexus_user');
    
    setTimeout(() => {
        window.location.href = 'landing.html'; 
    }, 1500);
};

// --- 3. UI HELPERS ---
window.switchView = function (viewId, navEl) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const targetView = document.getElementById('view-' + viewId);
    if (targetView) targetView.classList.add('active');

    document.querySelectorAll('.ln-item').forEach(i => i.classList.remove('active'));
    if (navEl) navEl.classList.add('active');
};

window.togglePassword = function(inputId, iconEl) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.type = (input.type === "password") ? "text" : "password";
    iconEl.textContent = (input.type === "text") ? "🐵" : "🙈";
};

// --- 4. DATA LOADING (Syncs Sidebar & Inputs) ---
function loadUserData() {
    const user = window.getCurrentUser();
    
    if (!user) {
        console.warn("No user session found.");
        return;
    }

    // Create full profile data based on username
    let fullProfile = {...user}; // Start with existing user data
    
    // Add missing profile fields based on the username
    if (!fullProfile.firstName || !fullProfile.lastName) {
        switch(user.username) {
            case 'rajat':
                fullProfile.firstName = "RAJAT";
                fullProfile.lastName = "JAIN";
                fullProfile.fullName = "RAJAT JAIN";
                fullProfile.handle = "rajat";
                fullProfile.email = "rajat.jain@example.com";
                fullProfile.phone = "+91 98765 43210";
                fullProfile.initials = "RJ";
                break;
            case 'karmanya':
                fullProfile.firstName = "KARMANYA";
                fullProfile.lastName = "BELSARE";
                fullProfile.fullName = "KARMANYA BELSARE";
                fullProfile.handle = "karmanya";
                fullProfile.email = "karmanya.belsare@example.com";
                fullProfile.phone = "+91 98765 43211";
                fullProfile.initials = "KB";
                break;
            case 'awadhesh':
                fullProfile.firstName = "AWADHESH";
                fullProfile.lastName = "";
                fullProfile.fullName = "AWADHESH";
                fullProfile.handle = "awadhesh";
                fullProfile.email = "awadhesh@example.com";
                fullProfile.phone = "+91 98765 43212";
                fullProfile.initials = "AW";
                break;
            case 'anant':
                fullProfile.firstName = "ANANT";
                fullProfile.lastName = "GARG";
                fullProfile.fullName = "ANANT GARG";
                fullProfile.handle = "anant";
                fullProfile.email = "anant.garg@example.com";
                fullProfile.phone = "+91 98765 43213";
                fullProfile.initials = "AG";
                break;
            case 'sanidhya':
                fullProfile.firstName = "SANIDHYA";
                fullProfile.lastName = "JOSHI";
                fullProfile.fullName = "SANIDHYA JOSHI";
                fullProfile.handle = "sanidhya";
                fullProfile.email = "sanidhya.joshi@example.com";
                fullProfile.phone = "+91 98765 43214";
                fullProfile.initials = "SJ";
                break;
            default:
                fullProfile.firstName = user.firstName || user.username || "User";
                fullProfile.lastName = user.lastName || "";
                fullProfile.fullName = user.fullName || user.username || "User";
                fullProfile.handle = user.handle || user.username || "user";
                fullProfile.email = user.email || "user@example.com";
                fullProfile.email = user.email || "user@gameunity.com";
                fullProfile.phone = user.phone || "+91 00000 00000";
                fullProfile.initials = user.initials || (user.username ? user.username.substring(0, 2).toUpperCase() : "GU");
        }
        
        // Update the user object with the new profile data
        localStorage.setItem('nexus_user', JSON.stringify(fullProfile));
    }

    // Ensure we have initials calculated if they are missing
    const initials = fullProfile.initials || (fullProfile.firstName && fullProfile.lastName ? 
                     (fullProfile.firstName[0] + fullProfile.lastName[0]).toUpperCase() : "GU");

    // Update Sidebar & Topbar
    const sidebarName = document.getElementById('navName');
    const sidebarHandle = document.getElementById('navHandle');
    if (sidebarName) sidebarName.innerText = fullProfile.fullName || fullProfile.username || "User";
    if (sidebarHandle) sidebarHandle.innerText = fullProfile.handle ? `@${fullProfile.handle}` : `@${fullProfile.username}`;

    // Update All Avatars
    const avatars = ['topBarAvatar', 'navMainAvatar', 'mainAvatarPreview', 'sidebarBottomAvatar'];
    avatars.forEach(id => {
        const av = document.getElementById(id);
        if (av) {
            if (fullProfile.avatarUrl && fullProfile.avatarUrl !== "removed") {
                av.style.backgroundImage = `url(${fullProfile.avatarUrl})`;
                av.textContent = '';
                av.style.backgroundSize = "cover";
            } else {
                av.style.backgroundImage = 'none';
                av.innerText = initials;
            }
        }
    });

    // Populate Inputs
    const fields = {
        'inpFirstName': fullProfile.firstName || "",
        'inpLastName': fullProfile.lastName || "",
        'inpFullName': fullProfile.fullName || fullProfile.username || "",
        'inpHandle': fullProfile.handle || fullProfile.username || "",
        'inpEmail': fullProfile.email || "",
        'inpPhone': fullProfile.phone || "",
        'inpBio': fullProfile.bio || ""
    };

    for (const [id, val] of Object.entries(fields)) {
        const el = document.getElementById(id);
        if (el) el.value = val;
    }
}

// --- 5. SAVE & SYNC LOGIC ---
let hasUnsavedChanges = false;
let tempAvatarDataURL = null;

function markAsDirty() {
    hasUnsavedChanges = true;
    const saveBtn = document.getElementById('btnSaveAll');
    if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.classList.add('pulse');
    }
}

window.saveAllChanges = function () {
    const saveBtn = document.getElementById('btnSaveAll');
    saveBtn.textContent = "Saving...";

    const fName = document.getElementById('inpFirstName').value.trim();
    const lName = document.getElementById('inpLastName').value.trim();
    const initials = (fName[0] + (lName[0] || "")).toUpperCase() || "GU";

    // Get current user to preserve things like password/role
    const currentUser = window.getCurrentUser() || {};

    const updatedUser = {
        ...currentUser, // Keep existing data
        firstName: fName,
        lastName: lName,
        fullName: document.getElementById('inpFullName').value.trim(),
        handle: document.getElementById('inpHandle').value.trim(),
        email: document.getElementById('inpEmail').value.trim(),
        phone: document.getElementById('inpPhone').value.trim(),
        bio: document.getElementById('inpBio').value.trim(),
        initials: initials,
        avatarUrl: tempAvatarDataURL || currentUser.avatarUrl
    };

    // SAVE TO THE SINGLE SOURCE OF TRUTH
    localStorage.setItem('nexus_user', JSON.stringify(updatedUser));
    
    setTimeout(() => {
        saveBtn.textContent = "Save Changes";
        saveBtn.disabled = true;
        saveBtn.classList.remove('pulse');
        hasUnsavedChanges = false;
        window.toast("✅ Profile Synced Everywhere!");
        loadUserData(); 
    }, 1000);
};

// --- 6. INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    loadUserData();

    // Enable save button on any input
    document.querySelectorAll('.main input, .main textarea').forEach(el => {
        el.addEventListener('input', markAsDirty);
    });

    // Minimalist Toast
    window.toast = function (msg) {
        const t = document.getElementById('toast');
        const m = document.getElementById('toastMsg');
        if (!t || !m) return;
        m.textContent = msg;
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 3000);
    };
});