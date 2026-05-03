const EVENTS_STORAGE_KEY = 'events';

let communitiesById = {};

function getEventStore() {
  try {
    const events = JSON.parse(localStorage.getItem(EVENTS_STORAGE_KEY)) || [];
    return Array.isArray(events) ? events : [];
  } catch (e) {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify([]));
    return [];
  }
}

function setEventStore(events) {
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
}

function getUserRole() {
  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  return typeof normalizeRole === 'function' ? normalizeRole(user?.role) : user?.role;
}

function enforceApprovalAccess() {
  const role = getUserRole();
  if (role !== 'admin' && role !== 'manager' && role !== 'community_manager') {
    window.location.href = 'dashboard.html';
    return false;
  }
  return true;
}

async function loadCommunities() {
  communitiesById = {};
  try {
    const communities = await window.API.communities.getAll();
    communities.forEach(community => {
      communitiesById[String(community.id)] = community;
      if (community.slug) communitiesById[String(community.slug)] = community;
      if (community.name) communitiesById[String(community.name).toLowerCase()] = community;
    });
  } catch (e) {}

  communitiesById['pro-gamers'] ||= { id: 'pro-gamers', name: 'Pro Gamers', icon: '⚡' };
}

function getCommunityName(communityId) {
  const key = String(communityId || '');
  const community = communitiesById[key] || communitiesById[key.toLowerCase()];
  return community?.name || key || 'Unknown Community';
}

function updateSummary(events) {
  const countByStatus = status => events.filter(event => event.status === status).length;
  document.getElementById('pendingCount').textContent = countByStatus('pending');
  document.getElementById('approvedCount').textContent = countByStatus('approved');
  document.getElementById('rejectedCount').textContent = countByStatus('rejected');
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function renderPending(list) {
  const container = document.getElementById('pendingList');
  if (!container) return;
  container.innerHTML = '';

  if (!list.length) {
    container.innerHTML = '<div class="approval-empty">No pending event requests.</div>';
    return;
  }

  container.innerHTML = list.map(event => `
    <article class="approval-card">
      <span class="status-badge pending">Pending</span>
      <h3>${escapeHtml(event.title || 'Untitled Event')}</h3>
      <div class="approval-meta">
        <div><span>Date:</span> ${escapeHtml(event.date || 'Not set')} ${escapeHtml(event.time || '')}</div>
        <div><span>Community:</span> ${escapeHtml(getCommunityName(event.communityId))}</div>
        <div><span>Requested by:</span> ${escapeHtml(event.createdBy || 'Gamer')}</div>
      </div>
      <button class="details-btn" onclick="viewEvent(${event.id})">View Details</button>
      <div class="approval-actions">
        <button class="approve-btn" onclick="approveEvent(${event.id})">Approve</button>
        <button class="reject-btn" onclick="rejectEvent(${event.id})">Reject</button>
      </div>
    </article>
  `).join('');
}

function renderList(id, list) {
  const container = document.getElementById(id);
  if (!container) return;
  container.innerHTML = '';

  if (!list.length) {
    container.innerHTML = '<div class="approval-empty">No events in this list.</div>';
    return;
  }

  container.innerHTML = list.map(event => `
    <article class="event-card">
      <span class="status-badge ${escapeHtml(event.status)}">${escapeHtml(event.status)}</span>
      <h3>${escapeHtml(event.title || 'Untitled Event')}</h3>
      <div class="approval-meta">
        <div><span>Date:</span> ${escapeHtml(event.date || 'Not set')} ${escapeHtml(event.time || '')}</div>
        <div><span>Community:</span> ${escapeHtml(getCommunityName(event.communityId))}</div>
      </div>
      <button class="details-btn" onclick="viewEvent(${event.id})">View Details</button>
    </article>
  `).join('');
}

function loadAllEvents() {
  const events = getEventStore();
  const pending = events.filter(event => event.status === 'pending');
  const approved = events.filter(event => event.status === 'approved');
  const rejected = events.filter(event => event.status === 'rejected');

  updateSummary(events);
  renderPending(pending);
  renderList('approvedList', approved);
  renderList('rejectedList', rejected);
}

function updateStatus(id, status) {
  const events = getEventStore().map(event => {
    if (Number(event.id) === Number(id)) {
      return { ...event, status, reviewedAt: new Date().toISOString() };
    }
    return event;
  });

  setEventStore(events);
  loadAllEvents();
  if (window.toast) window.toast(`Event ${status}.`);
}

function approveEvent(id) {
  updateStatus(id, 'approved');
}

function rejectEvent(id) {
  updateStatus(id, 'rejected');
}

function viewEvent(id) {
  const events = getEventStore();
  const event = events.find(item => Number(item.id) === Number(id));
  if (!event) return;

  const capacity = event.maxAttendees || event.capacity || 'Open';
  document.getElementById('modalStatus').textContent = event.status || 'pending';
  document.getElementById('modalStatus').className = `status-badge ${event.status || 'pending'}`;
  document.getElementById('modalTitle').textContent = event.title || 'Untitled Event';
  document.getElementById('modalDesc').textContent = event.description || 'No description';
  document.getElementById('modalDate').textContent = `Date: ${event.date || 'Not set'} ${event.time || ''}`;
  document.getElementById('modalCommunity').textContent = `Community: ${getCommunityName(event.communityId)}`;
  document.getElementById('modalCapacity').textContent = `Capacity: ${capacity}`;
  document.getElementById('modalCategory').textContent = `Category: ${event.category || event.type || 'Event'}`;
  document.getElementById('eventModal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('eventModal').classList.add('hidden');
}

window.loadAllEvents = loadAllEvents;
window.renderPending = renderPending;
window.renderList = renderList;
window.approveEvent = approveEvent;
window.rejectEvent = rejectEvent;
window.updateStatus = updateStatus;
window.viewEvent = viewEvent;
window.closeModal = closeModal;

document.addEventListener('DOMContentLoaded', async () => {
  if (!enforceApprovalAccess()) return;
  await loadCommunities();
  loadAllEvents();
});
