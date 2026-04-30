/**
 * Gameunity — Profile & Settings Master Logic
 * Integrated with NexusData & NexusCRUD for full data synchronization.
 */

// --- 1. SESSION HELPERS ---
window.getCurrentUser = function() {
    const userStr = localStorage.getItem('nexus_user');
    return userStr ? JSON.parse(userStr) : null;
};

// --- 2. UI NAVIGATION ---
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

window.toggleSwitch = function(el) {
    el.classList.toggle('on');
    markAsDirty();
};

// --- 3. DATA LOADING ---
function loadUserData() {
    const sessionUser = window.getCurrentUser();
    if (!sessionUser) return;

    // Fetch full data from store to ensure consistency
    const allUsers = window.NexusCRUD.getAll('users');
    const user = allUsers.find(u => u.username === sessionUser.username) || sessionUser;

    // Update Sidebar & Topbar
    const sidebarName = document.getElementById('navName');
    const sidebarHandle = document.getElementById('navHandle');
    const initials = (user.firstName?.[0] || "") + (user.lastName?.[0] || "");

    if (sidebarName) sidebarName.innerText = `${user.firstName} ${user.lastName}`.trim() || user.username;
    if (sidebarHandle) sidebarHandle.innerText = `@${user.handle || user.username}`;

    // Update Avatars
    const avatarIds = ['topBarAvatar', 'navMainAvatar', 'mainAvatarPreview'];
    avatarIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerText = initials || user.username.substring(0, 2).toUpperCase();
            el.style.backgroundImage = 'none';
        }
    });

    // Populate Inputs
    const fieldMap = {
        'inpFirstName': user.firstName || "",
        'inpLastName': user.lastName || "",
        'inpFullName': `${user.firstName} ${user.lastName}`.trim() || "",
        'inpHandle': user.handle || user.username || "",
        'inpEmail': user.email || "",
        'inpPhone': user.phone || ""
    };

    for (const [id, val] of Object.entries(fieldMap)) {
        const el = document.getElementById(id);
        if (el) el.value = val;
    }
}

// --- 4. FORM LOGIC ---
let hasUnsavedChanges = false;

window.markAsDirty = function() {
    hasUnsavedChanges = true;
    const saveBtn = document.getElementById('btnSaveAll');
    if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.classList.add('pulse');
    }
};

window.validateInput = function(el) {
    const errEl = document.getElementById('err-' + el.id);
    if (el.value.trim() === "" && el.hasAttribute('required')) {
        if (errEl) errEl.style.display = 'block';
    } else {
        if (errEl) errEl.style.display = 'none';
    }
    markAsDirty();
};

window.saveAllChanges = function () {
    const saveBtn = document.getElementById('btnSaveAll');
    if (!saveBtn) return;

    saveBtn.textContent = "Saving...";
    
    const sessionUser = window.getCurrentUser();
    const updatedUser = {
        ...sessionUser,
        firstName: document.getElementById('inpFirstName').value.trim(),
        lastName: document.getElementById('inpLastName').value.trim(),
        handle: document.getElementById('inpHandle').value.trim(),
        email: document.getElementById('inpEmail').value.trim(),
        phone: document.getElementById('inpPhone').value.trim()
    };

    // Update Local Storage
    localStorage.setItem('nexus_user', JSON.stringify(updatedUser));

    // Update Store (Mock)
    const allUsers = window.NexusCRUD.getAll('users');
    const index = allUsers.findIndex(u => u.username === updatedUser.username);
    if (index !== -1) {
        allUsers[index] = updatedUser;
        // In a real app, we'd call an API here
    }

    setTimeout(() => {
        saveBtn.textContent = "Save Changes";
        saveBtn.disabled = true;
        saveBtn.classList.remove('pulse');
        hasUnsavedChanges = false;
        window.toast("✅ Profile settings updated.");
        loadUserData();
    }, 800);
};

// --- 5. MODALS & STATUS ---
window.openPhotoModal = function(e) {
    if (e) e.stopPropagation();
    const modal = document.getElementById('photoModal');
    if (modal) modal.classList.add('active');
};

window.closePhotoModal = function() {
    const modal = document.getElementById('photoModal');
    if (modal) modal.classList.remove('active');
};

window.handleFileSelect = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        const preview = document.getElementById('filePreview');
        const img = document.getElementById('imgPreview');
        const name = document.getElementById('fileName');
        const btn = document.getElementById('btnApplyPhoto');
        if (img) img.src = event.target.result;
        if (name) name.textContent = file.name;
        if (preview) preview.style.display = 'block';
        if (btn) btn.disabled = false;
    };
    reader.readAsDataURL(file);
};

window.applyUploadedPhoto = function() {
    window.toast("📷 Photo uploaded successfully!");
    closePhotoModal();
};

window.removePhoto = function() {
    window.toast("🗑️ Profile photo removed.");
};

window.setStatus = function(el) {
    document.querySelectorAll('.status-badge').forEach(b => b.classList.remove('on'));
    el.classList.add('on');
    window.toast(`Status set to: ${el.textContent.trim()}`);
};

window.setTheme = function(el) {
    document.querySelectorAll('.theme-opt').forEach(t => t.classList.remove('on'));
    el.classList.add('on');
    window.toast("🎨 Theme updated.");
};

window.updatePrivacySettings = function() {
    window.toast("🔒 Privacy settings saved.");
};

window.updateAccessibility = function() {
    window.toast("♿ Accessibility settings updated.");
};

// --- 6. INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    if (window.NexusData) window.NexusData.getStore();
    loadUserData();

    // Minimalist Toast
    window.toast = function (msg) {
        const t = document.getElementById('toast');
        const m = document.getElementById('toastMsg');
        if (!t || !m) return;
        m.textContent = msg;
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 3000);
    };

    console.log("%c[Profile] %cReady and synced.", "color: #5B6EF5; font-weight: bold;", "color: #10B981;");
});