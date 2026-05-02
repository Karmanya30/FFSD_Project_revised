/**
 * Gameunity — Login / Register / Forgot Password Logic
 * Fixed: Password Strength Meter, Persistent Registration, and Login matching.
 */

// ==========================================
// 1. STATE & PERSISTENCE
// ==========================================
let currentTab = 'login';
let toastTimeout;

const ROLE_REDIRECTS = {
    admin: 'admin-dashboard.html',
    moderator: 'dashboard.html',
    gamer: 'dashboard.html'
};

// Default users for the first-time load
const DEFAULT_USERS = [
    { email: 'rajat@gameunity.com', username: 'rajat', password: 'Rajat@123', role: 'admin' },
    { email: 'karmanya@gameunity.com', username: 'karmanya', password: 'Karmanya@123', role: 'moderator' },
    { email: 'awadhesh@gameunity.com', username: 'awadhesh', password: 'Demo@123', role: 'gamer' }
];

/** * Persistent Mock Database Helpers 
 */
function getAllUsers() {
    let stored = localStorage.getItem('gameunity_accounts');
    let users = stored ? JSON.parse(stored) : [];
    
    // Force Sync Default Personas (Ensure passwords/roles are always current)
    DEFAULT_USERS.forEach(defUser => {
        const index = users.findIndex(u => u.username.toLowerCase() === defUser.username.toLowerCase() || u.email.toLowerCase() === defUser.email.toLowerCase());
        if (index === -1) {
            users.push(defUser);
        } else {
            // Update existing record to match the default (in case of stale data)
            users[index].password = defUser.password;
            users[index].role = defUser.role;
        }
    });
    
    localStorage.setItem('gameunity_accounts', JSON.stringify(users));
    return users;
}

function saveNewUser(userData) {
    const users = getAllUsers();
    // Check if user already exists
    const exists = users.some(u => u.email === userData.email || u.username === userData.username);
    if (exists) return false;
    
    users.push(userData);
    localStorage.setItem('gameunity_accounts', JSON.stringify(users));
    return true;
}

// ==========================================
// 2. TAB SWITCHING
// ==========================================

window.switchAuthTab = function(tab) {
    currentTab = tab;
    document.querySelectorAll('.auth-form').forEach(f => f.classList.add('hidden'));
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));

    const tabsContainer = document.getElementById('authTabs');
    const subtitle = document.getElementById('loginSubtitle');

    if (tab === 'login') {
        document.getElementById('form-login').classList.remove('hidden');
        document.getElementById('tab-login').classList.add('active');
        tabsContainer.style.display = 'flex';
        if (subtitle) subtitle.textContent = 'Welcome back! Sign in to your account.';
    } else if (tab === 'register') {
        document.getElementById('form-register').classList.remove('hidden');
        document.getElementById('tab-register').classList.add('active');
        tabsContainer.style.display = 'flex';
        if (subtitle) subtitle.textContent = 'Create a free account to get started.';
    } else if (tab === 'forgot') {
        document.getElementById('form-forgot').classList.remove('hidden');
        tabsContainer.style.display = 'none';
        if (subtitle) subtitle.textContent = '';
    }
    clearAllErrors();
};

// ==========================================
// 3. VALIDATION HELPERS
// ==========================================

function showError(fieldId, message) {
    const errorEl = document.getElementById(fieldId + '-error');
    const inputEl = document.getElementById(fieldId);
    if (errorEl) { errorEl.textContent = message; errorEl.classList.add('visible'); }
    if (inputEl) { inputEl.classList.add('error'); }
}

function clearAllErrors() {
    document.querySelectorAll('.form-error').forEach(e => { e.textContent = ''; e.classList.remove('visible'); });
    document.querySelectorAll('.form-input').forEach(i => { i.classList.remove('error', 'success'); });
}

function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
function isValidHandle(handle) { return /^[a-zA-Z0-9_]{3,20}$/.test(handle); }

// ==========================================
// 4. LOGIN HANDLER
// ==========================================

window.handleLogin = function(e) {
    e.preventDefault();
    clearAllErrors();

    const inputVal = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const role = document.getElementById('login-role').value;

    if (!inputVal || !password || !role) {
        showToast('⚠️', 'Please fill all login fields.');
        shakeCard();
        return;
    }

    const btn = document.getElementById('login-btn');
    btn.classList.add('loading');
    btn.disabled = true;

    setTimeout(() => {
        const users = getAllUsers();
        // Check if input matches either email OR username AND password AND role
        const matchedUser = users.find(u => 
            (u.email.toLowerCase() === inputVal.toLowerCase() || u.username.toLowerCase() === inputVal.toLowerCase()) && 
            u.password === password && 
            u.role === role
        );

        if (!matchedUser) {
            btn.classList.remove('loading');
            btn.disabled = false;
            showError('login-password', 'Invalid credentials or role.');
            showToast('❌', 'Login failed.');
            shakeCard();
            return;
        }

        localStorage.setItem('nexus_user', JSON.stringify({
            username: matchedUser.username,
            role: matchedUser.role,
            loginTime: new Date().toISOString()
        }));
        localStorage.setItem('role', matchedUser.role);

        showToast('✅', 'Login successful!');
        setTimeout(() => { window.location.href = ROLE_REDIRECTS[role] || 'dashboard.html'; }, 800);
    }, 1200);
};

// ==========================================
// 5. REGISTER HANDLER
// ==========================================

window.handleRegister = function(e) {
    e.preventDefault();
    clearAllErrors();

    const fullname = document.getElementById('reg-fullname').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const handle = document.getElementById('reg-handle').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;
    const role = document.getElementById('reg-role').value;
    const terms = document.getElementById('reg-terms').checked;

    let valid = true;
    if (!fullname) { showError('reg-fullname', 'Required'); valid = false; }
    if (!isValidEmail(email)) { showError('reg-email', 'Invalid email'); valid = false; }
    if (!isValidHandle(handle)) { showError('reg-handle', '3-20 chars only'); valid = false; }
    if (password.length < 8) { showError('reg-password', 'Min 8 chars'); valid = false; }
    if (password !== confirm) { showError('reg-confirm', 'No match'); valid = false; }
    if (!role) { showError('reg-role', 'Select role'); valid = false; }
    if (!terms) { showToast('⚠️', 'Accept terms'); valid = false; }

    if (!valid) { shakeCard(); return; }

    const btn = document.getElementById('register-btn');
    btn.classList.add('loading');
    btn.disabled = true;

    setTimeout(() => {
        const newUser = { username: handle, fullname, email, password, role };
        if (saveNewUser(newUser)) {
            showToast('🎉', 'Account ready!');
            // Auto-login
            localStorage.setItem('nexus_user', JSON.stringify({ username: handle, role, loginTime: new Date().toISOString() }));
            localStorage.setItem('role', role);
            setTimeout(() => { window.location.href = ROLE_REDIRECTS[role] || 'dashboard.html'; }, 1000);
        } else {
            btn.classList.remove('loading');
            btn.disabled = false;
            showError('reg-email', 'User already exists');
        }
    }, 1500);
};

// ==========================================
// 6. PASSWORD STRENGTH METER (Fixed)
// ==========================================

function checkPasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*]/.test(password)) score++;
    const levels = ['', 'weak', 'fair', 'good', 'strong'];
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    return { level: levels[score] || 'weak', label: labels[score] || 'Weak' };
}

function initPasswordStrength() {
    const passwordInput = document.getElementById('reg-password');
    const strengthFill = document.getElementById('strength-fill');
    const strengthText = document.getElementById('strength-text');

    if (!passwordInput || !strengthFill) return;

    passwordInput.addEventListener('input', function() {
        if (!this.value) {
            strengthFill.className = 'strength-fill';
            strengthText.textContent = '';
            return;
        }
        const { level, label } = checkPasswordStrength(this.value);
        strengthFill.className = 'strength-fill ' + level;
        strengthText.textContent = label;
    });
}

// ==========================================
// 7. UI HELPERS
// ==========================================

window.togglePassword = function(btn) {
    const input = btn.previousElementSibling;
    input.type = input.type === 'password' ? 'text' : 'password';
    btn.textContent = input.type === 'password' ? '🙈' : '👁️';
};

window.quickLogin = function(username, role) {
    // 1. Ensure we are on the login tab
    if (typeof switchAuthTab === 'function') switchAuthTab('login');
    
    const users = getAllUsers();
    const user = users.find(u => u.username === username);
    
    const emailInput = document.getElementById('login-email');
    const passInput = document.getElementById('login-password');
    const roleInput = document.getElementById('login-role');
    
    if (emailInput) emailInput.value = username;
    if (passInput) passInput.value = user ? user.password : 'Demo@123';
    if (roleInput) roleInput.value = role;
    
    // 2. Explicitly call handleLogin with a mock event
    if (typeof handleLogin === 'function') {
        handleLogin({ preventDefault: () => {} });
    }
};

function shakeCard() {
    const card = document.getElementById('loginCard');
    if (card) { card.classList.add('shake'); setTimeout(() => card.classList.remove('shake'), 400); }
}

window.showToast = function(icon, msg) {
    const t = document.getElementById('toast');
    document.getElementById('toastIcon').textContent = icon;
    document.getElementById('toastMsg').textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => t.classList.remove('show'), 2800);
};

// ==========================================
// 8. INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Restore Strength Meter
    initPasswordStrength();

    // 2. Handle background and session check
    const session = localStorage.getItem('nexus_user');
    if (session) {
        try {
            const user = JSON.parse(session);
            window.location.href = ROLE_REDIRECTS[user.role] || 'dashboard.html';
        } catch(e) { localStorage.removeItem('nexus_user'); }
    }

    // 3. Initialize "Database"
    getAllUsers();
});