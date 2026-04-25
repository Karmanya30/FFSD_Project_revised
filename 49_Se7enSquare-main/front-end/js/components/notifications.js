// ─── GLOBAL NOTIFICATIONS CONTROLLER ───
// Injected on all pages via <script src="../js/components/notifications.js">

// The notification dropdown HTML (injected dynamically)
const NOTIF_HTML = `
<div class="notif-dropdown" id="globalNotifDropdown">
  <div class="notif-header">
    <span>Notifications</span>
    <span class="notif-mark-read" onclick="markAllNotifRead()">Mark all read</span>
  </div>
  <div class="notif-body">
    <div class="notif-item unread">
      <div class="notif-icon">💬</div>
      <div class="notif-content">
        <div class="notif-text"><strong>Sara Lee</strong> mentioned you in #frontend</div>
        <div class="notif-time">2m ago</div>
      </div>
    </div>
    <div class="notif-item unread">
      <div class="notif-icon">🎉</div>
      <div class="notif-content">
        <div class="notif-text"><strong>March Hack Sprint</strong> is starting soon!</div>
        <div class="notif-time">1h ago</div>
      </div>
    </div>
    <div class="notif-item">
      <div class="notif-icon">🛡</div>
      <div class="notif-content">
        <div class="notif-text">Your report #4819 has been resolved.</div>
        <div class="notif-time">1d ago</div>
      </div>
    </div>
  </div>
  <div class="notif-footer" onclick="markAllNotifRead()">
    View All Notifications
  </div>
</div>`;

// Inject the dropdown HTML into the page
document.addEventListener('DOMContentLoaded', () => {
  // Only inject if not already present
  if (!document.getElementById('globalNotifDropdown')) {
    document.body.insertAdjacentHTML('beforeend', NOTIF_HTML);
  }

  // Hook up header bell icons
  document.querySelectorAll('.icon-btn').forEach(btn => {
    if (btn.textContent.includes('🔔')) {
      btn.classList.add('notif-trigger');
      btn.addEventListener('click', (e) => toggleNotifications(e));
    }
  });

  // Hook up sidebar bell icons
  document.querySelectorAll('.rail-item[data-tooltip="Notifications"]').forEach(link => {
    link.classList.add('notif-trigger');
    link.addEventListener('click', (e) => toggleNotifications(e));
  });
});

// Toggle the dropdown
window.toggleNotifications = function(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const dropdown = document.getElementById('globalNotifDropdown');
  if (dropdown) {
    dropdown.classList.toggle('show');
  }
};

// Mark all as read
window.markAllNotifRead = function() {
  document.querySelectorAll('.notif-item.unread').forEach(item => {
    item.classList.remove('unread');
  });
  // Hide the red dot on the bell
  document.querySelectorAll('.notif-trigger .notif-dot').forEach(dot => {
    dot.style.display = 'none';
  });
};

// Close dropdown when clicking anywhere else
document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('globalNotifDropdown');
  if (dropdown && dropdown.classList.contains('show')) {
    if (!e.target.closest('#globalNotifDropdown') && !e.target.closest('.notif-trigger')) {
      dropdown.classList.remove('show');
    }
  }
});
