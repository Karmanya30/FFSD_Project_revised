/**
 * Gameunity — Login / Register / Forgot Password Logic
 * Handles form validation, auth tab switching, role-based redirects,
 * password strength checking, and demo quick-login.
 */

// ==========================================
// 1. STATE & CONFIG
// ==========================================
let currentTab = 'login';
let toastTimeout;

const ROLE_REDIRECTS = {
    superuser: 'dashboard.html',
    mod: 'dashboard.html',
    gamer: 'dashboard.html',
    audience: 'dashboard.html'
};

// Mock registered users for prototype
const MOCK_USERS = [
    { email: 'rajat', username: 'rajat', password: 'Rajat@123', role: 'superuser' },
    { email: 'karmanya', username: 'karmanya', password: 'Karmanya@123', role: 'mod' },
    { email: 'awadhesh', username: 'awadhesh', password: 'Awadhesh@123', role: 'gamer' },
    { email: 'anant', username: 'anant', password: 'Anant@123', role: 'gamer' },
    { email: 'sanidhya', username: 'sanidhya', password: 'Sanidhya@123', role: 'audience' }
];

// ==========================================
// 2. TAB SWITCHING
// ==========================================

window.switchAuthTab = function(tab) {
    currentTab = tab;
    const card = document.getElementById('loginCard');
    let visibleFormId = null;

    // Hide all forms
    document.querySelectorAll('.auth-form').forEach(f => f.classList.add('hidden'));

    // Remove active class from tabs
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));

    // Show tabs only for login/register
    const tabsContainer = document.getElementById('authTabs');
    const subtitle = document.getElementById('loginSubtitle');

    if (tab === 'login') {
        document.getElementById('form-login').classList.remove('hidden');
        document.getElementById('tab-login').classList.add('active');
        tabsContainer.style.display = 'flex';
        if (subtitle) subtitle.textContent = 'Welcome back! Sign in to your account.';
        visibleFormId = 'form-login';
    } else if (tab === 'register') {
        document.getElementById('form-register').classList.remove('hidden');
        document.getElementById('tab-register').classList.add('active');
        tabsContainer.style.display = 'flex';
        if (subtitle) subtitle.textContent = 'Create a free account to get started.';
        visibleFormId = 'form-register';
    } else if (tab === 'forgot') {
        document.getElementById('form-forgot').classList.remove('hidden');
        tabsContainer.style.display = 'none';
        if (subtitle) subtitle.textContent = '';
        visibleFormId = 'form-forgot';
    }

    if (card) {
        card.classList.add('switching');
        setTimeout(() => card.classList.remove('switching'), 320);
    }

    if (visibleFormId) {
        const visibleForm = document.getElementById(visibleFormId);
        if (visibleForm) {
            visibleForm.classList.remove('form-enter');
            void visibleForm.offsetWidth;
            visibleForm.classList.add('form-enter');
            setTimeout(() => visibleForm.classList.remove('form-enter'), 450);
        }
        applyFormStagger(visibleFormId);
    }

    // Clear all errors when switching tabs
    clearAllErrors();
};

// ==========================================
// 3. VALIDATION ENGINE
// ==========================================

function showError(fieldId, message) {
    const errorEl = document.getElementById(fieldId + '-error');
    const inputEl = document.getElementById(fieldId);

    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add('visible');
    }
    if (inputEl) {
        inputEl.classList.add('error');
        inputEl.classList.remove('success');
    }
}

function clearError(fieldId) {
    const errorEl = document.getElementById(fieldId + '-error');
    const inputEl = document.getElementById(fieldId);

    if (errorEl) {
        errorEl.textContent = '';
        errorEl.classList.remove('visible');
    }
    if (inputEl) {
        inputEl.classList.remove('error');
    }
}

function markSuccess(fieldId) {
    const inputEl = document.getElementById(fieldId);
    if (inputEl) {
        inputEl.classList.remove('error');
        inputEl.classList.add('success');
    }
}

function clearAllErrors() {
    document.querySelectorAll('.form-error').forEach(e => {
        e.textContent = '';
        e.classList.remove('visible');
    });
    document.querySelectorAll('.form-input').forEach(i => {
        i.classList.remove('error', 'success');
    });
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidHandle(handle) {
    return /^[a-zA-Z0-9_]{3,20}$/.test(handle);
}

// ==========================================
// 4. LOGIN HANDLER
// ==========================================

window.handleLogin = function(e) {
    e.preventDefault();
    clearAllErrors();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const role = document.getElementById('login-role').value;
    let isValid = true;

    // Validate email/username
    if (!email) {
        showError('login-email', 'Email or username is required');
        isValid = false;
    } else if (email.length < 3) {
        showError('login-email', 'Must be at least 3 characters');
        isValid = false;
    }

    // Validate password
    if (!password) {
        showError('login-password', 'Password is required');
        isValid = false;
    } else if (password.length < 6) {
        showError('login-password', 'Password must be at least 6 characters');
        isValid = false;
    }

    // Validate role
    if (!role) {
        showError('login-role', 'Please select a role to sign in');
        isValid = false;
    }

    if (!isValid) {
        shakeCard();
        return;
    }

    // Simulate authentication
    const btn = document.getElementById('login-btn');
    btn.classList.add('loading');
    btn.disabled = true;

    setTimeout(() => {
        // Check if a mock user matches — use their display name if found
        const matchedUser = MOCK_USERS.find(u => 
            (u.email === email || u.username === email) && u.password === password && u.role === role
        );

        // Save session to localStorage
        const user = {
            username: matchedUser ? matchedUser.username : (email.includes('@') ? email.split('@')[0] : email),
            email: matchedUser ? matchedUser.email : (email.includes('@') ? email : email + '@nexushub.io'),
            role: role,
            loginTime: new Date().toISOString(),
            token: 'mock_token_' + Math.random().toString(36).substr(2)
        };
        localStorage.setItem('nexus_user', JSON.stringify(user));

        // Seed community ownership for demo (gamer owns "pro-gamers")
        if (role === 'gamer') {
            localStorage.setItem('nexus_owned_communities', JSON.stringify(['pro-gamers']));
        } else {
            localStorage.removeItem('nexus_owned_communities');
        }

        showToast('✅', 'Login successful! Redirecting...');

        setTimeout(() => {
            window.location.href = ROLE_REDIRECTS[role] || 'dashboard.html';
        }, 800);
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
    let isValid = true;

    // Full name
    if (!fullname) {
        showError('reg-fullname', 'Full name is required');
        isValid = false;
    } else if (fullname.length < 2) {
        showError('reg-fullname', 'Name must be at least 2 characters');
        isValid = false;
    } else if (fullname.length > 50) {
        showError('reg-fullname', 'Name must be under 50 characters');
        isValid = false;
    }

    // Email
    if (!email) {
        showError('reg-email', 'Email address is required');
        isValid = false;
    } else if (!isValidEmail(email)) {
        showError('reg-email', 'Please enter a valid email (e.g., user@example.com)');
        isValid = false;
    }

    // Handle
    if (!handle) {
        showError('reg-handle', 'Username is required');
        isValid = false;
    } else if (!isValidHandle(handle)) {
        showError('reg-handle', 'Username: 3-20 characters, letters/numbers/underscores only');
        isValid = false;
    }

    // Password
    if (!password) {
        showError('reg-password', 'Password is required');
        isValid = false;
    } else if (password.length < 8) {
        showError('reg-password', 'Password must be at least 8 characters');
        isValid = false;
    } else if (!/[A-Z]/.test(password)) {
        showError('reg-password', 'Must include at least one uppercase letter');
        isValid = false;
    } else if (!/[0-9]/.test(password)) {
        showError('reg-password', 'Must include at least one number');
        isValid = false;
    } else if (!/[!@#$%^&*]/.test(password)) {
        showError('reg-password', 'Must include at least one special character (!@#$%^&*)');
        isValid = false;
    }

    // Confirm password
    if (!confirm) {
        showError('reg-confirm', 'Please confirm your password');
        isValid = false;
    } else if (password !== confirm) {
        showError('reg-confirm', 'Passwords do not match');
        isValid = false;
    }

    // Role
    if (!role) {
        showError('reg-role', 'Please select an account type');
        isValid = false;
    }

    // Terms
    if (!terms) {
        showError('reg-terms', 'You must agree to the Terms of Service');
        isValid = false;
    }

    if (!isValid) {
        shakeCard();
        return;
    }

    // Simulate registration
    const btn = document.getElementById('register-btn');
    btn.classList.add('loading');
    btn.disabled = true;

    setTimeout(() => {
        // Save new user to localStorage mock store
        const user = {
            username: handle,
            fullname: fullname,
            email: email,
            role: role,
            loginTime: new Date().toISOString(),
            token: 'mock_token_' + Math.random().toString(36).substr(2)
        };
        localStorage.setItem('nexus_user', JSON.stringify(user));

        showToast('🎉', 'Account created! Welcome to Gameunity!');

        setTimeout(() => {
            window.location.href = ROLE_REDIRECTS[role] || 'dashboard.html';
        }, 800);
    }, 1500);
};

// ==========================================
// 6. FORGOT PASSWORD HANDLER
// ==========================================

window.handleForgotPassword = function(e) {
    e.preventDefault();
    clearAllErrors();

    const email = document.getElementById('forgot-email').value.trim();
    let isValid = true;

    if (!email) {
        showError('forgot-email', 'Email address is required');
        isValid = false;
    } else if (!isValidEmail(email)) {
        showError('forgot-email', 'Please enter a valid email address');
        isValid = false;
    }

    if (!isValid) {
        shakeCard();
        return;
    }

    const btn = document.getElementById('forgot-btn');
    btn.classList.add('loading');
    btn.disabled = true;

    setTimeout(() => {
        document.getElementById('form-forgot').classList.add('hidden');
        document.getElementById('form-forgot-success').classList.remove('hidden');
        showToast('✉️', 'Reset link sent to ' + email);

        btn.classList.remove('loading');
        btn.disabled = false;
    }, 1200);
};

// ==========================================
// 7. QUICK LOGIN (Demo Personas)
// ==========================================

window.quickLogin = function(username, role) {
    // Find the matching mock user to get the correct password
    const mockUser = MOCK_USERS.find(u => u.email === username || u.username === username);
    const password = mockUser ? mockUser.password : 'Demo@123';

    document.getElementById('login-email').value = username;
    document.getElementById('login-password').value = password;
    document.getElementById('login-role').value = role;

    // Trigger login
    document.getElementById('form-login').dispatchEvent(new Event('submit'));
};

window.mockGoogleLogin = function() {
    showToast('🔗', 'Google OAuth — simulated for prototype');
    setTimeout(() => {
        const user = {
            username: 'GoogleUser',
            email: 'user@gmail.com',
            role: 'gamer',
            loginTime: new Date().toISOString(),
            token: 'mock_google_token'
        };
        localStorage.setItem('nexus_user', JSON.stringify(user));
        window.location.href = 'dashboard.html';
    }, 1000);
};

// ==========================================
// 8. PASSWORD STRENGTH METER
// ==========================================

function checkPasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};:'"\\|,.<>\/?]/.test(password)) score++;

    const levels = ['', 'weak', 'fair', 'good', 'good', 'strong'];
    const labels = ['', 'Weak', 'Fair', 'Good', 'Good', 'Strong'];

    return { level: levels[score] || 'weak', label: labels[score] || 'Weak' };
}

function initPasswordStrength() {
    const passwordInput = document.getElementById('reg-password');
    const strengthFill = document.getElementById('strength-fill');
    const strengthText = document.getElementById('strength-text');

    if (!passwordInput) return;

    passwordInput.addEventListener('input', function() {
        const val = this.value;
        if (!val) {
            strengthFill.className = 'strength-fill';
            strengthText.textContent = '';
            return;
        }

        const { level, label } = checkPasswordStrength(val);
        strengthFill.className = 'strength-fill ' + level;
        strengthText.textContent = label;
    });
}

// ==========================================
// 9. PASSWORD TOGGLE
// ==========================================

window.togglePassword = function(btn) {
    const input = btn.previousElementSibling;
    if (!input) return;

    if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '👁️';
    } else {
        input.type = 'password';
        btn.textContent = '🙈';
    }
};

// ==========================================
// 10. UI HELPERS
// ==========================================

function shakeCard() {
    const card = document.getElementById('loginCard');
    if (card) {
        card.classList.add('shake');
        setTimeout(() => card.classList.remove('shake'), 400);
    }
}

window.showToast = function(icon, msg) {
    const t = document.getElementById('toast');
    const ic = document.getElementById('toastIcon');
    const ms = document.getElementById('toastMsg');

    if (!t || !ic || !ms) return;

    ic.textContent = icon;
    ms.textContent = msg;
    t.classList.add('show');

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => t.classList.remove('show'), 2800);
};

// ==========================================
// 11. BACKGROUND CANVAS
// ==========================================

function initBgCanvas() {
    const canvas = document.getElementById('bgCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const root = document.documentElement;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorTrail = Array.from(document.querySelectorAll('.cursor-trail span'));
    const hoverTargets = 'a, button, input, select, textarea, [role="button"], .rail-item, .comm-card, .rec-card, .event-card, .icon-btn, .logout-btn, .section-link, .btn-join, .btn-event, .auth-tab, .demo-pill, .password-toggle';
    
    // Trail state
    const trailState = cursorTrail.map(() => ({ x: window.innerWidth/2, y: window.innerHeight/2, opacity: 0 }));
    let particles = [];
    let pointer = { x: window.innerWidth/2, y: window.innerHeight/2, active: false };
    
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function createParticles() {
        particles = [];
        const count = 100;
        const colors = ['#38BDF8', '#60A5FA', '#A78BFA'];
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                r: Math.random() * 2 + 1,
                vy: -(Math.random() * 0.5 + 0.2), // upward float
                vx: (Math.random() - 0.5) * 0.2,
                color: colors[Math.floor(Math.random() * colors.length)],
                opacity: Math.random(),
                fadeDir: Math.random() > 0.5 ? 0.01 : -0.01
            });
        }
    }

    function drawParticles() {
        particles.forEach(p => {
            // Parallax shift based on mouse
            let shiftX = (pointer.x - canvas.width/2) * 0.02;
            let shiftY = (pointer.y - canvas.height/2) * 0.02;

            p.x += p.vx;
            p.y += p.vy;
            p.opacity += p.fadeDir;
            
            if (p.opacity >= 1) p.fadeDir = -0.01;
            if (p.opacity <= 0.1) p.fadeDir = 0.01;

            if (p.y < 0) p.y = canvas.height;
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;

            ctx.beginPath();
            ctx.arc(p.x - shiftX, p.y - shiftY, p.r, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.opacity;
            ctx.fill();
            ctx.shadowBlur = 10;
            ctx.shadowColor = p.color;
        });
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
    }

    function updateCursor(x, y) {
        if (cursorDot) {
            cursorDot.style.transform = `translate3d(${x - 10}px, ${y - 10}px, 0)`;
        }
        
        const targets = [
            { x: x, y: y, op: 0.8 },
            { x: x, y: y, op: 0.5 },
            { x: x, y: y, op: 0.2 }
        ];

        trailState.forEach((state, i) => {
            const target = targets[i];
            if (!target) return;
            state.x += (target.x - state.x) * (0.2 - i*0.05);
            state.y += (target.y - state.y) * (0.2 - i*0.05);
            state.opacity = target.op;
            
            const node = cursorTrail[i];
            if (node) {
                node.style.opacity = state.opacity;
                node.style.transform = `translate3d(${state.x - 3}px, ${state.y - 3}px, 0) scale(${1 - i*0.2})`;
            }
        });
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (!reduceMotion) {
            drawParticles();
            updateCursor(pointer.x, pointer.y);
        }
        requestAnimationFrame(draw);
    }

    function onPointerMove(e) {
        pointer.x = e.clientX;
        pointer.y = e.clientY;
        pointer.active = true;
    }

    resize();
    createParticles();
    draw();

    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('touchmove', e => {
        if (e.touches && e.touches[0]) {
            pointer.x = e.touches[0].clientX;
            pointer.y = e.touches[0].clientY;
            pointer.active = true;
        }
    }, { passive: true });
    
    document.addEventListener('pointerover', event => {
        if (event.target && event.target.closest(hoverTargets)) {
            document.body.classList.add('cursor-hover');
            
            // Add glow to card if hovering it
            const card = document.getElementById('loginCard');
            if (event.target.closest('.login-card') && card) {
                card.style.boxShadow = "0 0 50px rgba(139, 92, 246, 0.4), 0 20px 60px rgba(0, 0, 0, 0.6)";
            }
        }
    });

    document.addEventListener('pointerout', event => {
        if (event.target && event.target.closest(hoverTargets)) {
            document.body.classList.remove('cursor-hover');
            const card = document.getElementById('loginCard');
            if (card) {
                card.style.boxShadow = "0 0 40px rgba(59, 130, 246, 0.2), 0 20px 60px rgba(0, 0, 0, 0.4)";
            }
        }
    });

    window.addEventListener('resize', () => {
        resize();
        createParticles();
    });
}

// ==========================================
// 12. REAL-TIME INPUT VALIDATION
// ==========================================

function initRealTimeValidation() {
    // Login form
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');

    if (loginEmail) {
        loginEmail.addEventListener('blur', function() {
            if (this.value.trim() && this.value.trim().length >= 3) {
                clearError('login-email');
                markSuccess('login-email');
            }
        });
    }

    if (loginPassword) {
        loginPassword.addEventListener('blur', function() {
            if (this.value && this.value.length >= 6) {
                clearError('login-password');
                markSuccess('login-password');
            }
        });
    }

    // Register form — real-time validation on blur
    const regFields = [
        { id: 'reg-fullname', validate: v => v.length >= 2 },
        { id: 'reg-email', validate: v => isValidEmail(v) },
        { id: 'reg-handle', validate: v => isValidHandle(v) },
        { id: 'reg-password', validate: v => v.length >= 8 }
    ];

    regFields.forEach(({ id, validate }) => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('blur', function() {
                if (this.value.trim() && validate(this.value.trim())) {
                    clearError(id);
                    markSuccess(id);
                }
            });
        }
    });

    // Confirm password — real-time match check
    const confirmEl = document.getElementById('reg-confirm');
    if (confirmEl) {
        confirmEl.addEventListener('input', function() {
            const password = document.getElementById('reg-password').value;
            if (this.value && this.value === password) {
                clearError('reg-confirm');
                markSuccess('reg-confirm');
            } else if (this.value && this.value !== password) {
                showError('reg-confirm', 'Passwords do not match');
            }
        });
    }
}

function syncFloatingFieldState(field) {
    const group = field?.closest('.form-group');
    if (!group) return;

    if (field.tagName === 'SELECT') {
        // Keep select labels floated to avoid label/value overlap.
        group.classList.add('has-value');
        return;
    }

    group.classList.toggle('has-value', Boolean(field.value && field.value.trim()));
}

function initFloatingLabels() {
    document.querySelectorAll('.auth-form .form-input').forEach(field => {
        const group = field.closest('.form-group');
        if (!group) return;

        const refresh = () => syncFloatingFieldState(field);

        field.addEventListener('focus', () => group.classList.add('focused'));
        field.addEventListener('blur', () => {
            group.classList.remove('focused');
            refresh();
        });
        field.addEventListener('input', refresh);
        field.addEventListener('change', refresh);

        refresh();
    });
}

function addRippleEffect(el) {
    if (!el || el.dataset.rippleBound === '1') return;
    el.dataset.rippleBound = '1';
    el.classList.add('ripple-host');

    el.addEventListener('click', event => {
        const rect = el.getBoundingClientRect();
        const ripple = document.createElement('span');
        const size = Math.max(rect.width, rect.height) * 1.35;

        ripple.className = 'btn-ripple';
        ripple.style.width = `${size}px`;
        ripple.style.height = `${size}px`;
        ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
        ripple.style.top = `${event.clientY - rect.top - size / 2}px`;

        el.appendChild(ripple);
        setTimeout(() => ripple.remove(), 700);
    });
}

function applyFormStagger(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    const nodes = form.querySelectorAll('.form-group, .form-row, .terms-check, .btn-submit, .demo-personas, .auth-divider, .btn-google, .back-to-login');
    nodes.forEach((node, index) => {
        node.classList.remove('reveal-stagger');
        node.style.setProperty('--stagger-index', String(index));
        void node.offsetWidth;
        node.classList.add('reveal-stagger');
    });
}

function initRoleSelectState() {
    const selects = document.querySelectorAll('.form-select');
    selects.forEach(select => {
        const group = select.closest('.form-group');
        if (!group) return;

        const refresh = () => {
            const selected = Boolean(select.value);
            group.classList.toggle('role-picked', selected);
            select.classList.toggle('role-selected', selected);
        };

        select.addEventListener('focus', () => select.classList.add('is-open'));
        select.addEventListener('blur', () => select.classList.remove('is-open'));
        select.addEventListener('change', refresh);
        refresh();
    });
}

function initButtonRipples() {
    document.querySelectorAll('.btn-submit, .btn-google, .demo-pill, .auth-tab').forEach(addRippleEffect);
}

// ==========================================
// 13. INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    const session = localStorage.getItem('nexus_user');
    if (session) {
        try {
            const user = JSON.parse(session);
            if (user && user.role) {
                window.location.href = ROLE_REDIRECTS[user.role] || 'dashboard.html';
                return;
            }
        } catch (e) {
            localStorage.removeItem('nexus_user');
        }
    }

    initBgCanvas();
    initPasswordStrength();
    initRealTimeValidation();
    initFloatingLabels();
    initRoleSelectState();
    initButtonRipples();
    applyFormStagger('form-login');
    applyFormStagger('form-register');
    applyFormStagger('form-forgot');

    console.log('%c[Gameunity] %cLogin module initialized.', 'color: #5B6EF5; font-weight: bold;', 'color: #aaa;');
});
