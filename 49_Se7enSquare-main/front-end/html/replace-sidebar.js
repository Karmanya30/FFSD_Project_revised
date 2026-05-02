const fs = require('fs');
const path = require('path');
const glob = require('glob');

const htmlDir = 'e:/Sanidhya/FFSD/49_Se7enSquare-main/49_Se7enSquare-main/front-end/html';

const files = fs.readdirSync(htmlDir).filter(f => f.endsWith('.html'));

const template = `<aside class="app-rail" id="sidebar">
  <!-- Top: Logo -->
  <div class="rail-top">
    <div class="rail-logo">⬡</div>
    <div class="rail-toggle" onclick="toggleSidebar()">☰</div>
  </div>
  
  <!-- Middle: Nav Icons -->
  <div class="rail-middle">
    <a href="dashboard.html" class="rail-item{home_active}" data-tooltip="Home">🏠</a>
    <a href="discovery.html" class="rail-item{comm_active}" data-tooltip="Communities">💬</a>
    <a href="discovery.html" class="rail-item{search_active}" data-tooltip="Search">🔍</a>
    <a href="events.html" class="rail-item{events_active}" data-tooltip="Events">📅<div class="notif-dot" style="background:var(--gold);width:6px;height:6px;"></div></a>
    <a href="profile-settings.html" class="rail-item{settings_active}" data-tooltip="Settings">⚙️</a>
  </div>
  
  <!-- Bottom: Profile -->
  <div class="rail-bottom">
    <div class="rail-avatar" onclick="window.location.href='profile-settings.html'" data-tooltip="Profile">AM<div class="rail-dot bg-dot-green" style="position:absolute;bottom:-2px;right:-2px;width:12px;height:12px;border-radius:50%;border:2px solid var(--bg-sidebar);"></div></div>
  </div>
</aside>`;

for (const file of files) {
  if (file === 'dashboard.html') continue; // already handled
  
  const filepath = path.join(htmlDir, file);
  let content = fs.readFileSync(filepath, 'utf-8');
  
  if (!content.includes('<aside class="app-rail" id="sidebar">')) continue;
  
  const homeActive = ['admin-dashboard.html', 'superuser-dashboard.html'].includes(file) ? ' active' : '';
  const commActive = ['community-page.html', 'create-community.html'].includes(file) ? ' active' : '';
  const searchActive = ['discovery.html'].includes(file) ? ' active' : '';
  const eventsActive = ['events.html'].includes(file) ? ' active' : '';
  const settingsActive = ['profile-settings.html'].includes(file) ? ' active' : '';
  
  const replacement = template
    .replace('{home_active}', homeActive)
    .replace('{comm_active}', commActive)
    .replace('{search_active}', searchActive)
    .replace('{events_active}', eventsActive)
    .replace('{settings_active}', settingsActive);
    
  const newContent = content.replace(/<aside class="app-rail" id="sidebar">[\s\S]*?<\/aside>/, replacement);
  
  if (newContent !== content) {
    fs.writeFileSync(filepath, newContent, 'utf-8');
    console.log('Updated', file);
  }
}
