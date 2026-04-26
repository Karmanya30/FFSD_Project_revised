/**
 * Gameunity — Community Page Interactive Logic
 * Handles tab switching, sidebar toggle, join button, chat interface, member search, etc.
 */

const COMMUNITY_STORAGE_KEY = "nexus_communities";
const CHANNEL_STORAGE_KEY = "nexus_channels";
const JOIN_STATE_KEY = "nexus_join_state";
const DEFAULT_COMMUNITY = "pro-gamers";

const defaultCommunities = [
  {
    id: "pro-gamers",
    emoji: "⚡",
    name: "Pro Gamers",
    grad: "grad-purple",
    status: "bg-dot-green",
  },
  {
    id: "rpg-tavern",
    emoji: "🎨",
    name: "RPG Tavern",
    grad: "grad-orange",
    status: "bg-dot-green",
  },
  {
    id: "gamezone",
    emoji: "🎮",
    name: "GameZone",
    grad: "grad-cyan",
    status: "bg-dot-orange",
  },
  {
    id: "fps-masters",
    emoji: "🌿",
    name: "FPS Masters",
    grad: "grad-green",
    status: "bg-dot-gray",
  },
  {
    id: "speedrunners",
    emoji: "🎵",
    name: "SpeedRunners",
    grad: "grad-pink",
    status: "bg-dot-green",
  },
  {
    id: "strategy-gods",
    emoji: "📚",
    name: "Strategy Gods",
    grad: "grad-violet",
    status: "bg-dot-gray",
  },
];

const defaultChannels = [
  {
    group: "📢 Announcements",
    name: "announcements",
    icon: "📣",
    subtitle: "Locked",
    locked: true,
    recent: "2h ago",
    unread: 0,
  },
  {
    group: "📢 Announcements",
    name: "rules-and-info",
    icon: "📌",
    subtitle: "Locked",
    locked: true,
    recent: "1d ago",
    unread: 0,
  },
  {
    group: "💬 General",
    name: "general",
    icon: "#",
    subtitle: "now",
    unread: 12,
  },
  {
    group: "💬 General",
    name: "introductions",
    icon: "#",
    subtitle: "3h ago",
    unread: 0,
  },
  {
    group: "💬 General",
    name: "off-topic",
    icon: "#",
    subtitle: "1h ago",
    unread: 0,
  },
  {
    group: "💻 Development",
    name: "frontend",
    icon: "#",
    subtitle: "20m ago",
    unread: 4,
  },
  {
    group: "💻 Development",
    name: "Strategy",
    icon: "#",
    subtitle: "45m ago",
    unread: 0,
  },
  {
    group: "💻 Development",
    name: "Streaming",
    icon: "#",
    subtitle: "2h ago",
    unread: 0,
  },
  {
    group: "💻 Development",
    name: "code-review",
    icon: "#",
    subtitle: "5m ago",
    unread: 7,
  },
  {
    group: "💻 Development",
    name: "open-source",
    icon: "#",
    subtitle: "3h ago",
    unread: 0,
  },
  {
    group: "🎯 Career",
    name: "job-board",
    icon: "#",
    subtitle: "30m ago",
    unread: 0,
  },
  {
    group: "🎯 Career",
    name: "portfolio-review",
    icon: "#",
    subtitle: "1h ago",
    unread: 0,
  },
  {
    group: "🎯 Career",
    name: "interview-prep",
    icon: "#",
    subtitle: "4h ago",
    unread: 0,
  },
  {
    group: "🎙 Voice",
    name: "study-together",
    icon: "🔊",
    subtitle: "● 3 in voice",
    unread: 0,
  },
  {
    group: "🎙 Voice",
    name: "pair-programming",
    icon: "🔊",
    subtitle: "Empty",
    unread: 0,
  },
];

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.warn("Storage parse failed", key, e);
    return fallback;
  }
}

function saveToStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function getCommunities() {
  const stored = loadFromStorage(COMMUNITY_STORAGE_KEY, null);
  return Array.isArray(stored) && stored.length ? stored : defaultCommunities;
}

function getChannels() {
  const stored = loadFromStorage(CHANNEL_STORAGE_KEY, null);
  return Array.isArray(stored) && stored.length ? stored : defaultChannels;
}

window.addCommunity = function (comm) {
  const current = getCommunities();
  const existing = current.find((c) => c.id === comm.id);
  if (existing) return;
  current.push(comm);
  saveToStorage(COMMUNITY_STORAGE_KEY, current);
  renderCommunityRail();
};

window.addChannel = function (channel) {
  const current = getChannels();
  const existing = current.find((c) => c.name === channel.name);
  if (existing) return;
  current.push(channel);
  saveToStorage(CHANNEL_STORAGE_KEY, current);
  renderChannels();
};

function renderCommunityRail() {
  const rail = document.getElementById("railCommunities");
  if (!rail) return;
  const comms = getCommunities();
  rail.innerHTML = "";

  comms.forEach((comm) => {
    const el = document.createElement("div");
    el.className = `rail-item rail-comm ${comm.grad || "grad-purple"}`;
    el.setAttribute("data-tooltip", comm.name);
    el.innerHTML = `${comm.emoji}<div class="rail-dot ${comm.status || "bg-dot-green"}"></div>`;
    el.onclick = () => {
      // switch to community using URL for now
      window.location.href = `community-page.html?name=${encodeURIComponent(comm.id)}`;
    };
    rail.appendChild(el);
  });
}

function renderChannels() {
  const container = document.getElementById("channelsList");
  if (!container) return;
  const channels = getChannels();
  container.innerHTML = "";

  let lastGroup = null;
  channels.forEach((ch) => {
    if (ch.group !== lastGroup) {
      const title = document.createElement("div");
      title.className = "ch-group-title";
      title.textContent = ch.group;
      container.appendChild(title);
      lastGroup = ch.group;
    }

    const row = document.createElement("div");
    row.className = "ch-row";
    row.dataset.name = ch.name;

    row.onclick = () => selectChannel(row, ch.name);
    row.ondblclick = () => openChannel(ch.name);

    row.innerHTML = `<span class='ch-icon'>${ch.icon}</span><span class='ch-name'>${ch.name}</span>${ch.unread ? `<span class='ch-unread'>${ch.unread}</span>` : ""}<span class='ch-meta'>${ch.subtitle}</span>`;
    container.appendChild(row);
  });
}

window.selectChannel = function (row, channelName) {
  document
    .querySelectorAll(".ch-row")
    .forEach((r) => r.classList.remove("active-ch"));
  if (row) row.classList.add("active-ch");
  const clean = channelName.replace("#", "");
  const activeCh = document.getElementById("activeCh");
  const activeChDesc = document.getElementById("activeChDesc");
  if (activeCh) activeCh.textContent = clean;
  if (activeChDesc) {
    const mapping = {
      announcements: "All milestone and event updates live here.",
      "rules-and-info": "Community guidelines and important notices.",
      general:
        "The main hub for all things Pro Gamers. Say hello, share updates, ask anything, or just vibe with the community.",
      introductions: "New member intros and welcome messages.",
      "off-topic": "Friendly chats, memes, and casual talk.",
      frontend: "Front-end development discussions and code help.",
      Strategy: "Strategies and tactics for design decisions.",
      Streaming: "Streaming tips and setup help.",
      "code-review": "Share code for review and feedback.",
      "open-source": "Open-source project collaboration.",
      "job-board": "Post and discover job opportunities.",
      "portfolio-review": "Review your portfolio and get mentorship.",
      "interview-prep": "Interview questions, mock sessions, and advice.",
      "study-together": "Join others for coding sessions.",
      "pair-programming": "Find a partner for pairing sessions.",
    };
    activeChDesc.textContent = mapping[clean] || "A community text channel.";
  }
};

window.openChannel = function (channelName) {
  const clean = channelName.replace("#", "");
  window.location.href = `chat.html?channel=${encodeURIComponent(clean)}`;
};

window.toggleMainJoin = function () {
  const btn = document.getElementById("joinMainBtn");
  if (!btn) return;
  const state = loadFromStorage(JOIN_STATE_KEY, {});
  const joined = btn.classList.contains("joined");

  if (joined) {
    btn.classList.remove("joined");
    btn.textContent = "+ Join Community";
    btn.style.background =
      "linear-gradient(135deg, var(--accent), var(--accent-hover))";
    btn.style.color = "#fff";
    state[DEFAULT_COMMUNITY] = false;
  } else {
    btn.classList.add("joined");
    btn.textContent = "✓ Joined";
    btn.style.background = "var(--success)";
    btn.style.color = "#fff";
    state[DEFAULT_COMMUNITY] = true;
  }

  saveToStorage(JOIN_STATE_KEY, state);
};

function initJoinState() {
  const btn = document.getElementById("joinMainBtn");
  if (!btn) return;
  const state = loadFromStorage(JOIN_STATE_KEY, {});
  const joined = state[DEFAULT_COMMUNITY];

  if (joined) {
    btn.classList.add("joined");
    btn.textContent = "✓ Joined";
    btn.style.background = "var(--success)";
    btn.style.color = "#fff";
  } else {
    btn.classList.remove("joined");
    btn.textContent = "+ Join Community";
    btn.style.background =
      "linear-gradient(135deg, var(--accent), var(--accent-hover))";
    btn.style.color = "#fff";
  }
}

window.replyToMessage = function (btn) {
  const group = btn.closest(".msg-group");
  const author = group?.querySelector(".msg-uname")?.textContent || "Unknown";
  const message = group?.querySelector(".msg-text")?.textContent || "";
  const toast = document.createElement("div");
  toast.className = "global-toast";
  toast.textContent = `Replying to ${author}: "${message.slice(0, 60)}..."`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2300);
};

window.toggleReaction = function (btn, emoji) {
  const was = btn.classList.contains("reacted");
  btn.classList.toggle("reacted");
  btn.textContent = was ? emoji : `✅ ${emoji}`;
};

window.showMessageMenu = function (btn) {
  document.querySelectorAll(".msg-context-menu").forEach((m) => m.remove());
  const menu = document.createElement("div");
  menu.className = "msg-context-menu";
  menu.innerHTML = `
        <div class='msg-menu-item' onclick='copyMessageText(this)'>📋 Copy Text</div>
        <div class='msg-menu-item' onclick='pinMessage(this)'>📌 Pin Message</div>
        <div class='msg-menu-item' onclick='reportMessage(this)'>🚩 Report</div>
    `;

  btn.style.position = "relative";
  btn.appendChild(menu);

  setTimeout(() => {
    document.addEventListener("click", function close(e) {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener("click", close);
      }
    });
  }, 10);
};

window.copyMessageText = function (node) {
  const group = node.closest(".msg-group");
  const text = group?.querySelector(".msg-text")?.textContent || "";
  navigator.clipboard
    .writeText(text)
    .then(() => createToast("Message copied to clipboard!"));
  node.closest(".msg-context-menu")?.remove();
};

window.pinMessage = function (node) {
  createToast("Message pinned to channel!");
  node.closest(".msg-context-menu")?.remove();
};

window.reportMessage = function (node) {
  window.location.href = "report.html";
};

function createToast(message) {
  const toast = document.createElement("div");
  toast.className = "global-toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

const COMMUNITY_EVENTS_STORAGE_KEY = "nexus_community_events";

const defaultEvents = [
  {
    id: "e1",
    title: "March Hack Sprint",
    date: "Mar 7, 2:00 PM",
    month: "Mar",
    day: "07",
    location: "Online",
    status: "Open",
    communityId: "pro-gamers",
    createdBy: "gameMaster",
    description: "Monthly hackathon for all developers.",
  },
  {
    id: "e2",
    title: "JS Deep Dive AMA",
    date: "Mar 15, 6:00 PM",
    month: "Mar",
    day: "15",
    location: "Online",
    status: "Soon",
    communityId: "pro-gamers",
    createdBy: "Mia Park",
    description: "Ask Me Anything event on JavaScript patterns.",
  },
  {
    id: "e3",
    title: "Code Review Friday",
    date: "Mar 22, 4:00 PM",
    month: "Mar",
    day: "22",
    location: "Online",
    status: "Open",
    communityId: "pro-gamers",
    createdBy: "Sara Lee",
    description: "Live code review session in #code-review.",
  },
];

function getCurrentCommunitySlug() {
  const params = new URLSearchParams(window.location.search);
  return params.get("name") || "pro-gamers";
}

function loadCommunityEvents() {
  return JSON.parse(localStorage.getItem(COMMUNITY_EVENTS_STORAGE_KEY) || "[]");
}

function saveCommunityEvents(events) {
  localStorage.setItem(COMMUNITY_EVENTS_STORAGE_KEY, JSON.stringify(events));
}

function getActiveCommunityEvents() {
  const all = loadCommunityEvents();
  const communityId = getCurrentCommunitySlug();
  const filtered = all.filter((e) => e.communityId === communityId);
  if (filtered.length) return filtered;
  return defaultEvents.filter((e) => e.communityId === communityId);
}

function renderCommunityEvents() {
  const container = document.getElementById("activeEventsList");
  if (!container) return;

  const events = getActiveCommunityEvents();
  if (!events.length) {
    container.innerHTML =
      '<div style="padding:12px;font-size:13px;color:var(--text-muted);">No active events yet. Ask a gamer to create one in Community Manager.</div>';
    return;
  }

  container.innerHTML = events
    .map(
      (ev) => `
      <div class="event-mini" data-event-id="${ev.id}">
        <div class="ev-date">
          <div class="ev-mon">${ev.month || "--"}</div>
          <div class="ev-day">${ev.day || "--"}</div>
        </div>
        <div class="ev-info">
          <div class="ev-name">${ev.title}</div>
          <div class="ev-meta">${ev.location || "🌐 Online"} · ${ev.time || ev.date}</div>
          <div class="ev-created-by" style="font-size:11px;color:var(--text-muted);margin-top:4px;">Created by ${ev.createdBy || "gamer"}</div>
        </div>
        <span class="ev-badge">${ev.status || "Open"}</span>
      </div>`,
    )
    .join("");

  document.querySelectorAll(".event-mini").forEach((card) => {
    card.onclick = () => {
      const id = card.dataset.eventId;
      const eventObj = events.find((e) => `${e.id}` === id);
      if (eventObj) showEventDetailsModal(eventObj);
    };
  });
}

function showEventDetailsModal(ev) {
  const existing = document.getElementById("eventDetailsModal");
  if (existing) existing.remove();

  const backdrop = document.createElement("div");
  backdrop.id = "eventDetailsModal";
  backdrop.className = "event-details-backdrop";
  backdrop.innerHTML = `
    <div class="event-details-modal">
      <div class="event-details-header">
        <h3>${ev.title}</h3>
        <button class="event-details-close" aria-label="Close">&times;</button>
      </div>
      <div class="event-details-body">
        <div><strong>Date & Time:</strong> ${ev.date || "TBD"}</div>
        <div><strong>Location:</strong> ${ev.location || "Online"}</div>
        <div><strong>Status:</strong> ${ev.status || "Open"}</div>
        <div><strong>Created by:</strong> ${ev.createdBy || "gamer"}</div>
        <div style="margin-top:8px; color:var(--text-secondary)">${ev.description || "No description added."}</div>
      </div>
      <div class="event-details-footer">
        <button class="btn-ghost" onclick="openEventPage('${ev.id}')">View in Events</button>
      </div>
    </div>`;

  backdrop.onclick = (e) => {
    if (e.target === backdrop) backdrop.remove();
  };

  backdrop.querySelector(".event-details-close").onclick = () =>
    backdrop.remove();

  document.body.appendChild(backdrop);
}

window.openEventPage = function (eventId) {
  const redirectTo = eventId
    ? `events.html?event=${encodeURIComponent(eventId)}`
    : "events.html";
  window.location.href = redirectTo;
};

function initPage() {
  renderCommunityRail();
  renderChannels();
  initJoinState();

  // Auto-select first channel row
  const first = document.querySelector("#channelsList .ch-row");
  if (first) selectChannel(first, first.dataset.name || "general");

  renderCommunityEvents();
}

window.onload = initPage;

// Tabs & sidebar
window.switchTab = function (tabName, btn) {
  document
    .querySelectorAll(".tab-btn")
    .forEach((t) => t.classList.remove("active"));
  document
    .querySelectorAll(".tab-content")
    .forEach((c) => c.classList.remove("active"));
  if (btn) btn.classList.add("active");
  const target = document.getElementById("tab-" + tabName);
  if (target) target.classList.add("active");
};

