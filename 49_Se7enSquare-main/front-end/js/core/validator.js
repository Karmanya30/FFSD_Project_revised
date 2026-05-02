/**
 * Gameunity — Form Validation Utilities
 * Reusable validation functions with inline error display.
 * Import this on any page that has forms.
 */

// ==========================================
// 1. VALIDATION RULES
// ==========================================

window.NexusValidator = {
    /**
     * Check if a value is non-empty
     */
    isRequired(value) {
        return value !== null && value !== undefined && String(value).trim().length > 0;
    },

    /**
     * Minimum length check
     */
    minLength(value, min) {
        return String(value).trim().length >= min;
    },

    /**
     * Maximum length check
     */
    maxLength(value, max) {
        return String(value).trim().length <= max;
    },

    /**
     * Email format validation
     */
    isEmail(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
    },

    /**
     * URL-safe slug validation (lowercase, hyphens, no spaces)
     */
    isSlug(value) {
        return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(value).trim());
    },

    /**
     * Username/handle validation (3-20 chars, alphanumeric + underscores)
     */
    isHandle(value) {
        return /^[a-zA-Z0-9_]{3,20}$/.test(String(value).trim());
    },

    /**
     * Check if a number is within a range
     */
    inRange(value, min, max) {
        const num = Number(value);
        return !isNaN(num) && num >= min && num <= max;
    },

    // ==========================================
    // 2. DOM HELPERS
    // ==========================================

    /**
     * Show an error message below a form field
     * @param {HTMLElement} inputEl — The input element
     * @param {string} message — Error message to display
     */
    showFieldError(inputEl, message) {
        if (!inputEl) return;

        inputEl.classList.add('error');
        inputEl.classList.remove('success');

        // Find or create error span
        let errorEl = inputEl.parentElement.querySelector('.field-error');
        if (!errorEl) {
            errorEl = document.createElement('span');
            errorEl.className = 'field-error';
            // Insert after input (or after password wrapper)
            const parent = inputEl.closest('.input-password-wrap') || inputEl;
            parent.insertAdjacentElement('afterend', errorEl);
        }

        errorEl.textContent = message;
        errorEl.style.cssText = 'display:block; color:#EF4444; font-size:11.5px; margin-top:4px; font-family:"DM Sans",sans-serif;';
    },

    /**
     * Clear error from a specific field
     */
    clearFieldError(inputEl) {
        if (!inputEl) return;

        inputEl.classList.remove('error');

        const errorEl = inputEl.parentElement.querySelector('.field-error');
        if (errorEl) errorEl.remove();
    },

    /**
     * Mark a field as valid
     */
    markFieldSuccess(inputEl) {
        if (!inputEl) return;
        inputEl.classList.remove('error');
        inputEl.classList.add('success');
        this.clearFieldError(inputEl);
    },

    /**
     * Clear all errors in a form
     * @param {HTMLFormElement} formEl
     */
    clearFormErrors(formEl) {
        if (!formEl) return;
        formEl.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
        formEl.querySelectorAll('.success').forEach(el => el.classList.remove('success'));
        formEl.querySelectorAll('.field-error').forEach(el => el.remove());
    },

    /**
     * Validate a form by running validation rules on each field.
     * @param {Object[]} rules — Array of { element, validators: [{ check, message }] }
     * @returns {boolean} — true if all valid
     *
     * @example
     * const valid = NexusValidator.validateForm([
     *   { element: nameInput, validators: [
     *     { check: v => NexusValidator.isRequired(v), message: 'Name is required' },
     *     { check: v => NexusValidator.minLength(v, 3), message: 'Min 3 characters' }
     *   ]},
     * ]);
     */
    validateForm(rules) {
        let allValid = true;

        rules.forEach(({ element, validators }) => {
            if (!element) return;

            this.clearFieldError(element);

            const value = element.type === 'checkbox' ? element.checked : element.value;

            for (const { check, message } of validators) {
                if (!check(value)) {
                    this.showFieldError(element, message);
                    allValid = false;
                    break; // Show only first error per field
                }
            }
        });

        return allValid;
    }
};

console.log('%c[Gameunity] %cValidator utilities loaded.', 'color: #5B6EF5; font-weight: bold;', 'color: #10B981;');
