/**
 * Gameunity — Reusable Modal System
 * Provides a promise-based API for confirmations, forms, and alerts.
 */

// ==========================================
// 1. TEMPLATE INJECTION
// ==========================================

/**
 * Injects the modal structure and core styles if not present.
 */
function initializeModal() {
    if (document.getElementById('platform-modal')) return;

    const modalHTML = `
        <div id="platform-modal" class="modal-overlay" style="display: none;">
            <div class="modal-container">
                <div class="modal-header">
                    <h3 id="modal-title">Notification</h3>
                    <button id="modal-close-x" class="modal-x-btn" aria-label="Close">&times;</button>
                </div>
                <div id="modal-body" class="modal-body"></div>
                <div class="modal-footer">
                    <button id="modal-cancel-btn" class="btn-ghost">Cancel</button>
                    <button id="modal-confirm-btn" class="btn-primary">Confirm</button>
                </div>
            </div>
        </div>
    `;

    // High-performance CSS injection using a dedicated style tag
    const styleTag = document.createElement('style');
    styleTag.textContent = `
        .modal-overlay {
            position: fixed; inset: 0;
            background: rgba(4, 6, 14, 0.78); z-index: 9999;
            display: flex; justify-content: center; align-items: center;
            backdrop-filter: blur(14px); animation: fadeIn 0.22s ease;
            padding: 20px;
        }
        .modal-container {
            background: linear-gradient(180deg, rgba(15, 19, 34, 0.98), rgba(10, 13, 24, 0.96));
            color: var(--text-1, #fff); width: 90%; max-width: 520px;
            border-radius: 18px; border: 1px solid rgba(255,255,255,0.08);
            overflow: hidden; box-shadow: 0 28px 80px rgba(0,0,0,0.55);
            transform: translateY(0) scale(1);
            animation: slideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .modal-header {
            padding: 18px 22px; border-bottom: 1px solid rgba(255,255,255,0.06);
            display: flex; justify-content: space-between; align-items: center;
        }
        .modal-header h3 { margin: 0; font-family: 'Syne', sans-serif; font-size: 1.1rem; letter-spacing: -0.02em; }
        .modal-x-btn { background: none; border: none; color: var(--text-3); font-size: 24px; cursor: pointer; transition: 0.2s; }
        .modal-x-btn:hover { color: var(--text-1); transform: scale(1.05); }
        .modal-body { padding: 24px 22px; line-height: 1.6; color: var(--text-2); }
        .modal-footer { padding: 14px 22px 18px; background: rgba(255,255,255,0.02); display: flex; justify-content: flex-end; gap: 12px; }
        .modal-footer .btn-ghost, .modal-footer .btn-primary {
            min-width: 112px;
        }
        .modal-footer .btn-ghost {
            background: rgba(255,255,255,0.03);
        }
        .modal-footer .btn-primary {
            background: linear-gradient(135deg, #6d7bff, #8b5cf6 70%, #06b6d4 130%);
            box-shadow: 0 12px 30px rgba(91,110,245,0.25);
        }
        .modal-footer .btn-primary:hover { transform: translateY(-1px); }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px) scale(0.98); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
    `;

    document.head.appendChild(styleTag);
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Global Listeners for closing
    document.getElementById('modal-close-x').onclick = closeModal;
    document.getElementById('modal-cancel-btn').onclick = closeModal;
    document.getElementById('platform-modal').onclick = (e) => {
        if (e.target.id === 'platform-modal') closeModal();
    };

    // Escape key listener
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}

// ==========================================
// 2. PUBLIC API
// ==========================================

/**
 * Opens a modal and returns a Promise that resolves on Confirm and rejects on Cancel.
 * @example
 * const confirmed = await openModal({ title: "Delete?", bodyHTML: "Are you sure?" });
 */
export function openModal({ 
    title = "Confirm Action", 
    bodyHTML = "", 
    confirmText = "Confirm", 
    cancelText = "Cancel",
    severity = "default" // 'default' or 'danger'
}) {
    initializeModal();

    const modal = document.getElementById('platform-modal');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');

    // Content Setup
    titleEl.textContent = title;
    bodyEl.innerHTML = bodyHTML;
    confirmBtn.textContent = confirmText;
    cancelBtn.textContent = cancelText;

    // Severity styling (e.g., red button for delete)
    if (severity === 'danger') {
        confirmBtn.style.background = 'var(--error, #ef4444)';
    } else {
        confirmBtn.style.background = 'var(--accent, #5B6EF5)';
    }

    // Return a Promise so the calling code can use async/await
    return new Promise((resolve, reject) => {
        // Clone buttons to purge old listeners
        const newConfirm = confirmBtn.cloneNode(true);
        const newCancel = cancelBtn.cloneNode(true);
        const newX = document.getElementById('modal-close-x').cloneNode(true);

        confirmBtn.replaceWith(newConfirm);
        cancelBtn.replaceWith(newCancel);
        document.getElementById('modal-close-x').replaceWith(newX);

        newConfirm.onclick = () => { closeModal(); resolve(true); };
        newCancel.onclick = () => { closeModal(); resolve(false); };
        newX.onclick = () => { closeModal(); resolve(false); };
    });
}

/**
 * Closes the modal with a quick fade-out
 */
export function closeModal() {
    const modal = document.getElementById('platform-modal');
    if (modal) {
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.display = 'none';
            modal.style.opacity = '1';
        }, 200);
    }
}

// ==========================================
// 3. UTILITY INTEGRATION
// ==========================================

/**
 * Quick confirmation shorthand
 */
window.confirmAction = async (msg, severity = 'default') => {
    return await openModal({
        title: "Confirm Action",
        bodyHTML: `<p>${msg}</p>`,
        confirmText: "Yes, Proceed",
        severity: severity
    });
};