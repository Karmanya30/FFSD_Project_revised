/**
 * Se7enSquare - Community Settings
 * Functional localStorage-backed settings for basic info, members, channels,
 * and simple roles.
 */

const COMMUNITY_KEYS = ["communities", "nexus_communities"];
const DEFAULT_COMMUNITY_ID = "1";

let communities = [];
let currentCommunity = null;
let savedSnapshot = null;

const defaultCommunities = [
  {
    id: "1",
    name: "FPS Arena",
    description: "Competitive FPS players and tournaments",
    icon: "G",
    category: "Gaming",
    tags: ["announcements", "general"],
    channels: [
      { id: 1, name: "announcements", type: "Announcement" },
      { id: 2, name: "general", type: "Text" },
    ],
    members: [
      { id: 101, name: "Rahul Kumar", handle: "@rahulk", role: "Owner", initials: "RK", status: "Online" },
      { id: 102, name: "Arjun Kumar", handle: "@arjunk", role: "Member", initials: "AK", status: "Online" },
    ],
    roles: ["Owner", "Manager", "Moderator", "Member"],
  },
];

function readJSON(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function getCommunityId() {
  return new URLSearchParams(window.location.search).get("id") || DEFAULT_COMMUNITY_ID;
}

function normalizeId(value) {
  return String(value ?? "");
}

function normalizeCommunity(community) {
  const tags = Array.isArray(community.tags) ? community.tags : [];
  const channels = Array.isArray(community.channels) && community.channels.length
    ? community.channels
    : tags.map((tag, index) => ({ id: index + 1, name: tag, type: "Text" }));

  return {
    ...community,
    id: normalizeId(community.id),
    name: community.name || "Untitled Community",
    description: community.description || "",
    icon: community.icon || "G",
    tags,
    channels,
    members: Array.isArray(community.members) ? community.members : [],
    roles: Array.isArray(community.roles) && community.roles.length
      ? community.roles
      : ["Owner", "Manager", "Moderator", "Member"],
  };
}

function loadCommunitiesFromStorage() {
  for (const key of COMMUNITY_KEYS) {
    const stored = readJSON(key, null);
    if (Array.isArray(stored) && stored.length) {
      return stored.map(normalizeCommunity);
    }
  }

  const seeded = defaultCommunities.map(normalizeCommunity);
  persistCommunities(seeded);
  return seeded;
}

function persistCommunities(nextCommunities = communities) {
  const payload = nextCommunities.map((community) => ({
    ...community,
    tags: (community.channels || []).map((channel) => channel.name),
  }));

  COMMUNITY_KEYS.forEach((key) => {
    localStorage.setItem(key, JSON.stringify(payload));
  });
}

function setDirty(isDirty = true) {
  document.getElementById("settingsActions")?.classList.toggle("show", isDirty);
}

function renderBanner() {
  const preview = document.getElementById("bannerPreview");
  if (!preview) return;

  const banner = currentCommunity?.bannerImage || currentCommunity?.banner || "";
  if (!banner) {
    preview.style.backgroundImage = "none";
    preview.textContent = "No Banner Uploaded";
    return;
  }

  preview.style.backgroundImage = `url(${banner})`;
  preview.textContent = "";
}

function renderHeader() {
  const name = currentCommunity?.name || "Community";
  const mark = document.querySelector(".community-mark");
  const title = document.getElementById("topBarCommunityName");

  if (title) title.textContent = name;
  if (mark) mark.textContent = name.trim().charAt(0).toUpperCase() || "G";
}

function renderMembers() {
  const list = document.getElementById("settingsMemberList");
  if (!list) return;

  const members = currentCommunity.members.length
    ? currentCommunity.members
    : [
        { name: "Community Owner", handle: "@owner", role: "Owner", initials: "CO", status: "Active" },
      ];

  list.innerHTML = members.map((member) => `
    <div class="member-item">
      <div class="member-avatar">${member.initials || member.avatar || initialsFromName(member.name)}</div>
      <div class="member-info">
        <div class="member-name">${member.name || "Member"} <span class="muted-inline">${member.handle || ""}</span></div>
        <div class="member-date">${member.role || "Member"} &middot; ${member.status || "Active"}</div>
      </div>
    </div>
  `).join("");
}

function renderChannels() {
  const list = document.getElementById("settingsChannelList");
  if (!list) return;

  if (!currentCommunity.channels.length) {
    list.innerHTML = `<div class="empty-state">No channels yet. Create the first channel for this community.</div>`;
    return;
  }

  list.innerHTML = currentCommunity.channels.map((channel) => `
    <div class="channel-item">
      <div class="channel-icon">${channel.type === "Voice" ? "VC" : "#"}</div>
      <div class="channel-info">
        <div class="channel-name">${channel.name}</div>
        <div class="channel-type">${channel.type || "Text"} Channel</div>
      </div>
      <div class="channel-actions">
        <button class="btn-sm danger" onclick="deleteChannel('${channel.id}')">Delete</button>
      </div>
    </div>
  `).join("");
}

function renderRoles() {
  const list = document.getElementById("settingsRolesList");
  if (!list) return;

  list.innerHTML = currentCommunity.roles.map((role) => `
    <div class="role-item-settings">
      <div class="role-info">
        <div class="role-name">${role}</div>
        <div class="role-desc">Simple community role</div>
      </div>
    </div>
  `).join("");
}

function renderCommunity() {
  document.getElementById("communityName").value = currentCommunity.name;
  document.getElementById("communityDesc").value = currentCommunity.description;
  renderHeader();
  renderBanner();
  renderMembers();
  renderChannels();
  renderRoles();
  setDirty(false);
}

function loadCommunity() {
  const id = getCommunityId();
  communities = loadCommunitiesFromStorage();
  currentCommunity = communities.find((community) => normalizeId(community.id) === normalizeId(id));

  if (!currentCommunity) {
    currentCommunity = normalizeCommunity({
      ...defaultCommunities[0],
      id,
      name: "New Community",
      description: "Describe what this community is about.",
    });
    communities.push(currentCommunity);
    persistCommunities();
  }

  savedSnapshot = JSON.parse(JSON.stringify(currentCommunity));
  renderCommunity();
}

function saveCommunitySettings() {
  if (!currentCommunity) return;

  const nameInput = document.getElementById("communityName");
  const descInput = document.getElementById("communityDesc");
  const error = document.getElementById("basicSettingsError");
  const name = nameInput.value.trim();
  const description = descInput.value.trim();

  if (!name || !description) {
    if (error) {
      error.textContent = "Community name and description are required.";
      error.style.display = "block";
    }
    return;
  }

  if (error) {
    error.textContent = "";
    error.style.display = "none";
  }

  currentCommunity.name = name;
  currentCommunity.description = description;

  communities = communities.map((community) =>
    normalizeId(community.id) === normalizeId(currentCommunity.id) ? currentCommunity : community
  );

  persistCommunities();
  savedSnapshot = JSON.parse(JSON.stringify(currentCommunity));
  renderHeader();
  setDirty(false);
  toast("Community updated successfully");
}

function uploadBanner(event) {
  const file = event.target.files[0];
  if (!file || !currentCommunity) return;

  const reader = new FileReader();
  reader.onload = function () {
    currentCommunity.bannerImage = reader.result;
    currentCommunity.banner = reader.result;
    renderBanner();
    setDirty(true);
  };

  reader.readAsDataURL(file);
}

function initialsFromName(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "U";
}

function activateSettingsTab(targetId, navEl) {
  document.querySelectorAll(".section").forEach((section) => {
    section.style.display = "none";
    section.classList.remove("active");
  });

  document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));

  const targetSection = document.getElementById(targetId);
  if (targetSection) {
    targetSection.style.display = "block";
    targetSection.classList.add("active");
  }

  if (navEl) navEl.classList.add("active");
}

window.switchSettingsTab = function (tabId, navEl) {
  const tabButton = navEl || document.querySelector(`[data-settings-tab="${tabId}"]`);
  activateSettingsTab(`settings-${tabId}`, tabButton);
};

window.goToCommunity = function () {
  const id = getCommunityId();
  window.location.href = `community-page.html?id=${encodeURIComponent(id)}`;
};

window.showModal = function (id) {
  document.getElementById(id)?.classList.add("show");
};

window.closeModal = function (id) {
  document.getElementById(id)?.classList.remove("show");
};

window.toast = function (msg) {
  const toastEl = document.getElementById("toast");
  const msgEl = document.getElementById("toastMsg");

  if (!toastEl || !msgEl) {
    alert(msg);
    return;
  }

  msgEl.textContent = msg;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), 2400);
};

window.submitCreateChannel = function () {
  const nameInput = document.getElementById("chNameInput");
  const typeInput = document.getElementById("chTypeInput");
  const rawName = nameInput?.value.trim();

  if (!rawName) {
    toast("Channel name cannot be empty");
    return;
  }

  const normalizedName = rawName.toLowerCase().replace(/\s+/g, "-");
  const exists = currentCommunity.channels.some((channel) => channel.name === normalizedName);
  if (exists) {
    toast("A channel with that name already exists");
    return;
  }

  currentCommunity.channels.push({
    id: String(Date.now()),
    name: normalizedName,
    type: typeInput?.value || "Text",
  });

  renderChannels();
  closeModal("modalBg");
  if (nameInput) nameInput.value = "";
  setDirty(true);
  toast(`Channel #${normalizedName} added`);
};

window.deleteChannel = function (channelId) {
  currentCommunity.channels = currentCommunity.channels.filter(
    (channel) => normalizeId(channel.id) !== normalizeId(channelId)
  );
  renderChannels();
  setDirty(true);
};

window.discardSettings = function () {
  if (!savedSnapshot) return;
  currentCommunity = JSON.parse(JSON.stringify(savedSnapshot));
  communities = communities.map((community) =>
    normalizeId(community.id) === normalizeId(currentCommunity.id) ? currentCommunity : community
  );
  renderCommunity();
  toast("Unsaved changes discarded");
};

window.saveSettings = saveCommunitySettings;
window.saveCommunitySettings = saveCommunitySettings;
window.uploadBanner = uploadBanner;
window.handleBannerUpload = uploadBanner;
window.loadCommunity = loadCommunity;

document.addEventListener("DOMContentLoaded", () => {
  if (typeof requireRole === "function" && !requireRole(["community_manager", "admin"])) return;

  if (typeof renderUserUI === "function") renderUserUI();
  loadCommunity();

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => activateSettingsTab(tab.dataset.target, tab));
  });

  const activeTab = document.querySelector(".tab.active") || document.querySelector(".tab");
  if (activeTab) activateSettingsTab(activeTab.dataset.target, activeTab);

  document.querySelectorAll("#view-settings input, #view-settings textarea, #view-settings select").forEach((el) => {
    el.addEventListener("input", () => setDirty(true));
    el.addEventListener("change", () => setDirty(true));
  });
});
