// ─── GLOBAL NOTIFICATIONS CONTROLLER ───
// Integrated with NexusData & NexusCRUD for dynamic rendering

const NOTIF_HTML = `
<div class="notif-dropdown" id="globalNotifDropdown">
  <div class="notif-header">
    <span>Notifications</span>
    <span class="notif-mark-read" onclick="markAllNotifRead()">Mark all read</span>
  </div>
  <div class="notif-body" id="notif-body">
    <!-- Dynamic notifications will be injected here -->
  </div>
  <div class="notif-footer" onclick="window.location.href='dashboard.html'">
    Back to Dashboard
  </div>
</div>`;

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('globalNotifDropdown')) {
    document.body.insertAdjacentHTML('beforeend', NOTIF_HTML);
  }

  // Hook up ALL header bell icons
  document.querySelectorAll('.icon-btn').forEach(btn => {
    if (btn.textContent.trim().startsWith('🔔')) {
      btn.classList.add('notif-trigger');
      if (!btn.getAttribute('onclick')) {
        btn.addEventListener('click', (e) => toggleNotifications(e));
      }
    }
  });

  // Initial render
  if (window.NexusCRUD) renderDropdownContent();
});

window.toggleNotifications = function(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const dropdown = document.getElementById('globalNotifDropdown');
  if (dropdown) {
    const isShowing = dropdown.classList.toggle('show');
    if (isShowing) renderDropdownContent();
  }
};

function renderDropdownContent() {
    const body = document.getElementById('notif-body');
    if (!body || !window.NexusCRUD) return;

    const notifs = window.NexusCRUD.getAll('notifications');
    
    if (notifs.length === 0) {
        body.innerHTML = '<div style="padding: 30px; text-align: center; color: var(--text-3); font-size: 13px;">No notifications yet.</div>';
        return;
    }

    body.innerHTML = notifs.map(n => `
        <div class="notif-item ${n.unread ? 'unread' : ''}">
            <div class="notif-icon">${n.type === 'mention' ? '💬' : (n.type === 'reaction' ? '❤️' : '🛡')}</div>
            <div class="notif-content">
                <div class="notif-text"><strong>${n.from || 'System'}</strong> ${n.text}</div>
                <div class="notif-time">${n.time}</div>
            </div>
        </div>
    `).join('');
}

window.markAllNotifRead = function() {
    if (window.NexusCRUD) {
        const unread = window.NexusCRUD.getWhere('notifications', n => n.unread === true);
        unread.forEach(n => {
            n.unread = false;
            // In a real app, update the store here
        });
    }

    renderDropdownContent();
    
    // Hide the red dots on the bells
    document.querySelectorAll('.notif-trigger .notif-dot').forEach(dot => {
        dot.style.display = 'none';
    });
    
    if (window.toast) window.toast("Notifications marked as read.");
};

document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('globalNotifDropdown');
  if (dropdown && dropdown.classList.contains('show')) {
    if (!e.target.closest('#globalNotifDropdown') && !e.target.closest('.notif-trigger')) {
      dropdown.classList.remove('show');
    }
  }
});
