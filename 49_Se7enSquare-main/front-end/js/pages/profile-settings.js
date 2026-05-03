/**
 * Gameunity — Profile & Settings Master Logic
 * Integrated with NexusData & NexusCRUD for full data synchronization.
 */

// --- 1. SESSION & LOADER HELPERS ---
function showLoader() {
    document.body.classList.add("loading");
}

function hideLoader() {
    document.body.classList.remove("loading");
}

window.showLoader = showLoader;
window.hideLoader = hideLoader;

function readStoredUser() {
    const userStr = localStorage.getItem("currentUser") || localStorage.getItem("nexus_user");
    return userStr ? JSON.parse(userStr) : null;
}

window.getCurrentUser = function() {
    try {
        return readStoredUser();
    } catch (err) {
        console.error("Stored user data is invalid:", err);
        return null;
    }
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
function setFieldValue(id, value) {
    const el = document.getElementById(id) || document.querySelector(`#${id}`);
    if (el) el.value = value || "";
}

function loadProfileData() {
    const user = readStoredUser();
    console.log("User Data:", user);

    if (!user) {
        console.warn("No user found");
        return;
    }

    // Update Sidebar & Topbar
    const sidebarName = document.getElementById('navName');
    const sidebarHandle = document.getElementById('navHandle');
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    const username = user.username || user.handle || "";
    const fullName = user.fullName || user.fullname || `${firstName} ${lastName}`.trim() || user.name || username;
    const initials = typeof getUserInitials === "function" ? getUserInitials(user) : ((firstName?.[0] || "") + (lastName?.[0] || "")).toUpperCase();

    if (sidebarName) sidebarName.innerText = fullName;
    if (sidebarHandle) sidebarHandle.innerText = username ? `@${username}` : "";

    // Update Avatars
    const avatarIds = ['topBarAvatar', 'navMainAvatar', 'mainAvatarPreview'];
    avatarIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (user.avatar) {
                el.style.backgroundImage = `url(${user.avatar})`;
                el.style.backgroundSize = 'cover';
                el.style.backgroundPosition = 'center';
                el.innerText = '';
            } else {
                el.innerText = initials || "U";
                el.style.backgroundImage = 'none';
            }
        }
    });
    if (typeof renderUserUI === "function") renderUserUI();

    // Populate Inputs
    setFieldValue("firstName", firstName);
    setFieldValue("lastName", lastName);
    setFieldValue("username", username);

    setFieldValue("inpFirstName", firstName);
    setFieldValue("inpLastName", lastName);
    setFieldValue("inpFullName", fullName);
    setFieldValue("inpHandle", user.handle || username);
    setFieldValue("inpEmail", user.email);
    setFieldValue("inpPhone", user.phone);
    setFieldValue("inpBio", user.bio);
}

window.loadProfileData = loadProfileData;
window.loadUserData = loadProfileData;

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

    const reqFields = ['inpFirstName', 'inpLastName', 'inpHandle', 'inpFullName', 'inpEmail', 'inpPhone'];
    let hasError = false;

    // Check required fields
    reqFields.forEach(id => {
        const el = document.getElementById(id);
        const errEl = document.getElementById('err-' + id);
        if (el && el.value.trim() === "") {
            hasError = true;
            if (errEl) { errEl.style.display = 'block'; }
        } else if (errEl) {
            errEl.style.display = 'none';
        }
    });

    // Check email contains '@'
    const emailEl = document.getElementById('inpEmail');
    if (emailEl && emailEl.value.trim() !== "" && !emailEl.value.includes('@')) {
        hasError = true;
        const errEl = document.getElementById('err-inpEmail');
        if (errEl) { errEl.textContent = "Valid email is required (must contain '@')."; errEl.style.display = 'block'; }
    }

    // Check phone has no letters
    const phoneEl = document.getElementById('inpPhone');
    if (phoneEl && phoneEl.value.trim() !== "" && /[a-zA-Z]/.test(phoneEl.value)) {
        hasError = true;
        const errEl = document.getElementById('err-inpPhone');
        if (errEl) { errEl.textContent = "Phone number cannot contain letters."; errEl.style.display = 'block'; }
    }

    if (hasError) {
        window.toast("❌ Please fix errors before saving.");
        return;
    }

    saveBtn.textContent = "Saving...";
    
    const sessionUser = window.getCurrentUser();
    const updatedUser = {
        ...sessionUser,
        firstName: document.getElementById('inpFirstName').value.trim(),
        lastName: document.getElementById('inpLastName').value.trim(),
        fullName: document.getElementById('inpFullName').value.trim(),
        handle: document.getElementById('inpHandle').value.trim(),
        email: document.getElementById('inpEmail').value.trim(),
        phone: document.getElementById('inpPhone').value.trim(),
        avatar: window.tempAvatarData !== undefined ? window.tempAvatarData : sessionUser.avatar
    };
    if (window.tempAvatarData === null) {
        delete updatedUser.avatar;
    }

    if (typeof persistCurrentUser === "function") persistCurrentUser(updatedUser);
    else {
        localStorage.setItem('nexus_user', JSON.stringify(updatedUser));
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }

    setTimeout(() => {
        saveBtn.textContent = "Save Changes";
        saveBtn.disabled = true;
        saveBtn.classList.remove('pulse');
        hasUnsavedChanges = false;
        window.toast("✅ Profile settings updated.");
        loadProfileData();
        if (window.SidebarComponent) window.SidebarComponent.init();
    }, 800);
};

// --- 5. MODALS & STATUS ---
window.openPhotoModal = function(e) {
    if (e) e.stopPropagation();
    let fileInput = document.getElementById('profileImageInput');
    if (!fileInput) {
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'profileImageInput';
        fileInput.style.display = 'none';
        fileInput.accept = 'image/*';
        fileInput.onchange = window.handleFileSelect;
        document.body.appendChild(fileInput);
    }
    fileInput.click();
};

window.closePhotoModal = function() {}; // No longer needed but kept to avoid breaking HTML references

window.handleFileSelect = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        window.tempAvatarData = event.target.result;
        const avatars = ['topBarAvatar', 'navMainAvatar', 'mainAvatarPreview'];
        avatars.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.style.backgroundImage = `url(${event.target.result})`;
                el.style.backgroundSize = 'cover';
                el.style.backgroundPosition = 'center';
                el.innerText = '';
            }
        });
        window.toast("📷 Photo uploaded successfully!");
        markAsDirty();
    };
    reader.readAsDataURL(file);
};

window.applyUploadedPhoto = function() {}; // No longer needed

window.removePhoto = function() {
    window.tempAvatarData = null;
    const sessionUser = window.getCurrentUser() || {};
    const displayName = document.getElementById('inpFullName')?.value.trim() || sessionUser.fullName || `${sessionUser.firstName || ''} ${sessionUser.lastName || ''}`.trim() || sessionUser.username;
    
    const initials = typeof getUserInitials === "function" ? getUserInitials({
        ...sessionUser,
        firstName: document.getElementById('inpFirstName')?.value.trim() || sessionUser.firstName,
        lastName: document.getElementById('inpLastName')?.value.trim() || sessionUser.lastName,
    }) : "U";
    
    const avatars = ['topBarAvatar', 'navMainAvatar', 'mainAvatarPreview'];
    avatars.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.backgroundImage = 'none';
            el.innerText = initials;
        }
    });
    window.toast("🗑️ Profile photo removed.");
    markAsDirty();
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
document.addEventListener("DOMContentLoaded", () => {
    // Minimalist Toast
    window.toast = function (msg) {
        const t = document.getElementById('toast');
        const m = document.getElementById('toastMsg');
        if (!t || !m) return;
        m.textContent = msg;
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 3000);
    };

    showLoader();
    console.log("Page Loaded");

    try {
        loadProfileData();
    } catch (err) {
        console.error("Profile load failed:", err);
    } finally {
        hideLoader();
    }
});
