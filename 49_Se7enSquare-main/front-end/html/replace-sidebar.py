import os, re, glob

html_dir = 'e:/Sanidhya/FFSD/49_Se7enSquare-main/49_Se7enSquare-main/front-end/html'

new_sidebar_template = '''<aside class="app-rail" id="sidebar">
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
</aside>'''

for filepath in glob.glob(os.path.join(html_dir, '*.html')):
    filename = os.path.basename(filepath)
    if filename == 'dashboard.html':
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if '<aside class="app-rail" id="sidebar">' not in content:
        continue
        
    home_active = ' active' if filename in ['admin-dashboard.html', 'superuser-dashboard.html'] else ''
    comm_active = ' active' if filename in ['community-page.html', 'create-community.html'] else ''
    search_active = ' active' if filename in ['discovery.html'] else ''
    events_active = ' active' if filename in ['events.html'] else ''
    settings_active = ' active' if filename in ['profile-settings.html'] else ''
    
    new_sidebar = new_sidebar_template.format(
        home_active=home_active,
        comm_active=comm_active,
        search_active=search_active,
        events_active=events_active,
        settings_active=settings_active
    )
    
    new_content = re.sub(r'<aside class="app-rail" id="sidebar">.*?</aside>', new_sidebar, content, flags=re.DOTALL)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Updated {filename}')
