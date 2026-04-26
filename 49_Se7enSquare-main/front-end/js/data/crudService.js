/**
 * DEPRECATED/TODO - crudService.js
 * AUDIT FIX: This file is currently orphaned and not imported by any HTML page.
 * Keep for reference if backend integration is planned, otherwise safe to delete.
 */
/**
 * Gameunity — Generic CRUD Service
 * Provides Create, Read, Update, Delete operations on the centralized mock data store.
 * All mutations persist to localStorage and trigger optional callbacks.
 */

// ==========================================
// 1. CORE CRUD OPERATIONS
// ==========================================

/**
 * Get all items from a collection
 * @param {string} collection - e.g. 'users', 'communities', 'events'
 * @returns {Array}
 */
function getAll(collection) {
    const store = window.NexusData.getStore();
    return store[collection] || [];
}

/**
 * Get a single item by ID
 * @param {string} collection
 * @param {string} id
 * @returns {Object|null}
 */
function getById(collection, id) {
    const items = getAll(collection);
    return items.find(item => item.id === id) || null;
}

/**
 * Get items matching a filter function
 * @param {string} collection
 * @param {Function} filterFn - e.g. item => item.status === 'active'
 * @returns {Array}
 */
function getWhere(collection, filterFn) {
    return getAll(collection).filter(filterFn);
}

/**
 * Create a new item in a collection
 * @param {string} collection
 * @param {Object} item - The item to add (id will be auto-generated if missing)
 * @returns {Object} The created item
 */
function create(collection, item) {
    const store = window.NexusData.getStore();
    if (!store[collection]) store[collection] = [];

    // Auto-generate ID if not provided
    if (!item.id) {
        const prefix = collection.charAt(0);
        const maxId = store[collection].reduce((max, i) => {
            const num = parseInt(i.id.replace(/\D/g, '')) || 0;
            return num > max ? num : max;
        }, 0);
        item.id = prefix + (maxId + 1);
    }

    // Add timestamps
    if (!item.createdAt) {
        item.createdAt = new Date().toISOString();
    }

    store[collection].push(item);
    window.NexusData.saveStore(store);

    console.log(`%c[CRUD] %cCreated in ${collection}:`, 'color: #10B981; font-weight: bold;', 'color: #aaa;', item);
    return item;
}

/**
 * Update an existing item by ID
 * @param {string} collection
 * @param {string} id
 * @param {Object} updates - Partial updates to merge
 * @returns {Object|null} The updated item
 */
function update(collection, id, updates) {
    const store = window.NexusData.getStore();
    const items = store[collection] || [];
    const index = items.findIndex(item => item.id === id);

    if (index === -1) {
        console.warn(`[CRUD] Item ${id} not found in ${collection}`);
        return null;
    }

    // Merge updates
    store[collection][index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
    window.NexusData.saveStore(store);

    console.log(`%c[CRUD] %cUpdated ${id} in ${collection}:`, 'color: #F59E0B; font-weight: bold;', 'color: #aaa;', updates);
    return store[collection][index];
}

/**
 * Delete an item by ID
 * @param {string} collection
 * @param {string} id
 * @returns {boolean} Whether the item was found and deleted
 */
function remove(collection, id) {
    const store = window.NexusData.getStore();
    const items = store[collection] || [];
    const index = items.findIndex(item => item.id === id);

    if (index === -1) {
        console.warn(`[CRUD] Item ${id} not found in ${collection}`);
        return false;
    }

    store[collection].splice(index, 1);
    window.NexusData.saveStore(store);

    console.log(`%c[CRUD] %cDeleted ${id} from ${collection}`, 'color: #EF4444; font-weight: bold;', 'color: #aaa;');
    return true;
}

// ==========================================
// 2. UTILITY OPERATIONS
// ==========================================

/**
 * Count items in a collection (optionally filtered)
 * @param {string} collection
 * @param {Function} [filterFn]
 * @returns {number}
 */
function count(collection, filterFn) {
    const items = getAll(collection);
    return filterFn ? items.filter(filterFn).length : items.length;
}

/**
 * Search items by matching a query against specified fields
 * @param {string} collection
 * @param {string} query
 * @param {Array<string>} fields - Fields to search in
 * @returns {Array}
 */
function search(collection, query, fields) {
    if (!query || !query.trim()) return getAll(collection);

    const q = query.toLowerCase().trim();
    return getAll(collection).filter(item =>
        fields.some(field => {
            const val = item[field];
            return val && String(val).toLowerCase().includes(q);
        })
    );
}

/**
 * Add an entry to the audit log
 * @param {Object} entry - { action, target, moderator, reason, community }
 */
function logAction(entry) {
    create('auditLog', {
        ...entry,
        timestamp: new Date().toISOString()
    });
}

// ==========================================
// 3. PUBLIC API
// ==========================================

window.NexusCRUD = {
    getAll,
    getById,
    getWhere,
    create,
    update,
    remove,
    count,
    search,
    logAction
};

console.log('%c[Gameunity] %cCRUD service ready.', 'color: #5B6EF5; font-weight: bold;', 'color: #10B981;');

