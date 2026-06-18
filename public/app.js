const $ = (selector) => document.querySelector(selector);

const gateScreen = $("#gateScreen");
const sitePassword = $("#sitePassword");
const siteButton = $("#siteButton");
const deviceScreen = $("#deviceScreen");
const pcLayoutButton = $("#pcLayoutButton");
const mobileLayoutButton = $("#mobileLayoutButton");
const phoneAccess = $("#phoneAccess");
const timeoutScreen = $("#timeoutScreen");
const timeoutCountdown = $("#timeoutCountdown");
const authScreen = $("#authScreen");
const callScreen = $("#callScreen");
const onlineCount = $("#onlineCount");
const loginTab = $("#loginTab");
const signupTab = $("#signupTab");
const authName = $("#authName");
const authPassword = $("#authPassword");
const authButton = $("#authButton");
const profileButton = $("#profileButton");
const themeButton = $("#themeButton");
const adminButton = $("#adminButton");
const logoutButton = $("#logoutButton");
const profilePanel = $("#profilePanel");
const themePanel = $("#themePanel");
const themeMode = $("#themeMode");
const themeAccent = $("#themeAccent");
const adminPanel = $("#adminPanel");
const chatEnabledToggle = $("#chatEnabledToggle");
const clearChatButton = $("#clearChatButton");
const adminChatCount = $("#adminChatCount");
const adminChatStatus = $("#adminChatStatus");
const accountList = $("#accountList");
const securityList = $("#securityList");
const profilePreview = $("#profilePreview");
const profileName = $("#profileName");
const profileFile = $("#profileFile");
const saveProfileButton = $("#saveProfileButton");
const joinButton = $("#joinButton");
const leaveButton = $("#leaveButton");
const muteButton = $("#muteButton");
const shareScreenButton = $("#shareScreenButton");
const setupPanel = $("#setupPanel");
const callControls = $("#callControls");
const participants = $("#participants");
const connectionState = $("#connectionState");
const micStatus = $("#micStatus");
const chatLog = $("#chatLog");
const chatPanel = document.querySelector(".chat-panel");
const chatForm = $("#chatForm");
const chatInput = $("#chatInput");
const chatSendButton = chatForm.querySelector('button[type="submit"]');
const mediaButton = $("#mediaButton");
const mediaFile = $("#mediaFile");
const gifButton = $("#gifButton");
const gifPanel = $("#gifPanel");
const gifSearch = $("#gifSearch");
const gifSearchButton = $("#gifSearchButton");
const gifGrid = $("#gifGrid");
const gifNote = $("#gifNote");
const volumeBackdrop = $("#volumeBackdrop");
const volumeMenu = $("#volumeMenu");
const volumeAvatar = $("#volumeAvatar");
const volumeTitle = $("#volumeTitle");
const volumeDevice = $("#volumeDevice");
const volumeValue = $("#volumeValue");
const volumeSlider = $("#volumeSlider");
const volumeDown = $("#volumeDown");
const volumeUp = $("#volumeUp");
const volumeReset = $("#volumeReset");
const volumeMute = $("#volumeMute");
const volumeClose = $("#volumeClose");
const voteKickButton = $("#voteKickButton");
const kickStartPanel = $("#kickStartPanel");
const kickTargetTitle = $("#kickTargetTitle");
const kickDuration = $("#kickDuration");
const kickReason = $("#kickReason");
const kickStartButton = $("#kickStartButton");
const kickCancelButton = $("#kickCancelButton");
const kickVotes = $("#kickVotes");
const audioMount = $("#audioMount");
const toast = $("#toast");

const AUTH_KEY = "callroom.auth.v3";
const SITE_KEY = "callroom.site.v1";
const THEME_KEY = "callroom.theme.v1";
const DEVICE_KEY = "callroom.device.v1";
const BROWSER_DEVICE_KEY = "callroom.browser-device.v1";

const state = {
  id: null,
  mode: "login",
  token: "",
  siteToken: "",
  deviceId: "",
  username: "",
  isAdmin: false,
  deviceType: "pc",
  ws: null,
  manualDisconnect: false,
  reconnectTimer: null,
  reconnectAttempt: 0,
  autoRejoin: false,
  lastPongAt: 0,
  stream: null,
  rawStream: null,
  audioContext: null,
  analyser: null,
  audioSource: null,
  audioDestination: null,
  meterFrame: null,
  meterTimer: null,
  callHealthTimer: null,
  micRecovering: false,
  screenStream: null,
  screenTrack: null,
  screenSharing: false,
  screenStarting: false,
  inCall: false,
  muted: false,
  hasMic: false,
  lastSpeaking: false,
  lastSpeakingSentAt: 0,
  activeVolumePeerId: "",
  activeKickTargetId: "",
  longPressTimer: null,
  longPressOrigin: null,
  mediaUploading: false,
  chatEnabled: true,
  gifLoading: false,
  giphyApiKey: null,
  gifQuery: "reaction",
  gifOffset: 0,
  gifHasMore: true,
  notificationContext: null,
  remoteAudioContext: null,
  notificationRegistration: null,
  notificationWanted: false,
  pushSubscribing: false,
  heartbeatTimer: null,
  wakeLock: null,
  callKickUntil: 0,
  kickVotes: new Map(),
  kickTicker: null,
  timeoutTimer: null,
  profile: {
    name: "",
    status: "online",
    avatarUrl: "",
    avatarType: ""
  },
  peers: new Map(),
  screenPeers: new Map(),
  cards: new Map(),
  onlineUsers: new Map(),
  chatIds: new Set(),
  originalTitle: document.title,
  titleTimer: null
};

const rtcConfig = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};
let lastMobileTouchEnd = 0;
let lastMobileTouchTarget = null;
let visualViewportFrame = null;

siteButton.addEventListener("click", enterSite);
sitePassword.addEventListener("keydown", (event) => {
  if (event.key === "Enter") enterSite();
});
pcLayoutButton.addEventListener("click", () => chooseDevice("pc"));
mobileLayoutButton.addEventListener("click", () => chooseDevice("mobile"));
loginTab.addEventListener("click", () => setAuthMode("login"));
signupTab.addEventListener("click", () => setAuthMode("signup"));
authButton.addEventListener("click", finishAuth);
authName.addEventListener("keydown", submitAuthOnEnter);
authPassword.addEventListener("keydown", submitAuthOnEnter);
profileButton.addEventListener("click", () => {
  profilePanel.hidden = !profilePanel.hidden;
});
themeButton.addEventListener("click", () => {
  themePanel.hidden = !themePanel.hidden;
});
themeMode.addEventListener("change", saveTheme);
themeAccent.addEventListener("change", saveTheme);
adminButton.addEventListener("click", async () => {
  adminPanel.hidden = !adminPanel.hidden;
  if (!adminPanel.hidden) {
    await loadAccounts();
    await loadSecurityEvents();
    await loadChatSettings();
  }
});
chatEnabledToggle.addEventListener("change", updateChatSetting);
clearChatButton.addEventListener("click", clearAllChatMessages);
logoutButton.addEventListener("click", logout);
saveProfileButton.addEventListener("click", saveProfile);
joinButton.addEventListener("click", joinCall);
leaveButton.addEventListener("click", () => leaveCall());
muteButton.addEventListener("click", toggleMute);
shareScreenButton.addEventListener("click", toggleScreenShare);
participants.addEventListener("click", (event) => {
  const enlarge = event.target.closest(".screen-share-enlarge");
  if (enlarge) {
    toggleScreenShareFullscreen(enlarge);
    return;
  }
  const button = event.target.closest(".peer-mute");
  if (button) togglePeerMute(button.dataset.id);
});
document.addEventListener("fullscreenchange", updateScreenShareFullscreenButtons);
participants.addEventListener("contextmenu", (event) => {
  const card = event.target.closest(".person");
  if (!card || card.dataset.local === "true") return;
  event.preventDefault();
  openVolumeMenu(card.dataset.id, event.clientX, event.clientY);
});
participants.addEventListener("touchstart", startParticipantHold, { passive: true });
participants.addEventListener("touchend", cancelParticipantHold);
participants.addEventListener("touchmove", cancelParticipantHold);
participants.addEventListener("touchcancel", cancelParticipantHold);
securityList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-security-action]");
  if (button) updateSecurityIp(button.dataset.ip, button.dataset.securityAction);
});
chatForm.addEventListener("submit", sendChat);
mediaButton.addEventListener("click", () => mediaFile.click());
mediaFile.addEventListener("change", uploadChatMedia);
gifButton.addEventListener("click", toggleGifPanel);
gifSearchButton.addEventListener("click", searchGifs);
gifSearch.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    searchGifs();
  }
});
gifPanel.addEventListener("click", (event) => {
  const item = event.target.closest("[data-gif-url]");
  if (item) sendGifItem(item);
});
gifGrid.addEventListener("scroll", () => {
  const nearBottom = gifGrid.scrollTop + gifGrid.clientHeight >= gifGrid.scrollHeight - 80;
  if (nearBottom && state.gifHasMore && !state.gifLoading) searchGifs(true);
});
volumeSlider.addEventListener("input", () => setPeerVolume(state.activeVolumePeerId, Number(volumeSlider.value) / 100));
volumeDown.addEventListener("click", () => bumpPeerVolume(-0.1));
volumeUp.addEventListener("click", () => bumpPeerVolume(0.1));
volumeReset.addEventListener("click", () => setPeerVolume(state.activeVolumePeerId, 1));
volumeMute.addEventListener("click", () => togglePeerMute(state.activeVolumePeerId));
volumeClose.addEventListener("click", closeVolumeMenu);
volumeBackdrop.addEventListener("click", (event) => {
  if (event.target === volumeBackdrop) closeVolumeMenu();
});
voteKickButton.addEventListener("click", openKickStartPanel);
kickStartButton.addEventListener("click", startKickVote);
kickCancelButton.addEventListener("click", closeKickStartPanel);
kickVotes.addEventListener("click", (event) => {
  const button = event.target.closest("[data-kick-vote-id]");
  if (button) castKickVote(button.dataset.kickVoteId);
});
document.addEventListener("click", (event) => {
  if (!volumeBackdrop.hidden && !volumeMenu.contains(event.target) && event.target !== volumeBackdrop) closeVolumeMenu();
});
document.addEventListener("gesturestart", preventMobileZoom, { passive: false });
document.addEventListener("gesturechange", preventMobileZoom, { passive: false });
document.addEventListener("gestureend", preventMobileZoom, { passive: false });
document.addEventListener("touchmove", (event) => {
  if (event.touches.length > 1) event.preventDefault();
}, { passive: false });
document.addEventListener("touchend", (event) => {
  if (state.deviceType !== "mobile" && !matchMedia("(max-width: 760px)").matches) return;
  const now = Date.now();
  if (event.target === lastMobileTouchTarget && now - lastMobileTouchEnd < 300) event.preventDefault();
  lastMobileTouchEnd = now;
  lastMobileTouchTarget = event.target;
}, { passive: false });
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    if (state.inCall) requestWakeLock();
    if (state.inCall && state.analyser && !state.meterTimer) setupLocalAudioMeter();
    if (state.token && (!state.ws || state.ws.readyState === WebSocket.CLOSED)) scheduleReconnect(0);
  } else {
    stopAudioMeter();
  }
});
window.addEventListener("resize", () => {
  closeVolumeMenu();
  scheduleVisualViewportSync();
});
window.visualViewport?.addEventListener("resize", scheduleVisualViewportSync);
window.addEventListener("beforeunload", () => {
  state.manualDisconnect = true;
  sendLeaveNow();
  if (state.ws?.readyState === WebSocket.OPEN) state.ws.close();
});
window.addEventListener("pagehide", () => {
  state.manualDisconnect = true;
  sendLeaveNow();
  if (state.ws?.readyState === WebSocket.OPEN) state.ws.close();
});
window.addEventListener("pageshow", () => {
  state.manualDisconnect = false;
  if (state.token && (!state.ws || state.ws.readyState === WebSocket.CLOSED)) scheduleReconnect(0);
});
window.addEventListener("online", recoverAllPeerConnections);
navigator.connection?.addEventListener?.("change", recoverAllPeerConnections);
navigator.mediaDevices?.addEventListener?.("devicechange", () => {
  const track = state.rawStream?.getAudioTracks()[0];
  if (state.inCall && (!track || track.readyState === "ended")) recoverMicrophone();
});

boot();

async function boot() {
  syncVisualViewport();
  localStorage.removeItem("callroom.profile");
  localStorage.removeItem("callroom.server");
  localStorage.removeItem("callroom.ui.v1");
  registerNotificationWorker();
  state.deviceId = getBrowserDeviceId();
  loadTheme();
  loadDevicePreference();
  if (await checkDeviceStatus()) return;

  const siteToken = localStorage.getItem(SITE_KEY);
  if (!siteToken) {
    gateScreen.hidden = false;
    deviceScreen.hidden = true;
    authScreen.hidden = true;
    callScreen.hidden = true;
    timeoutScreen.hidden = true;
    sitePassword.focus();
    return;
  }
  state.siteToken = siteToken;
  hideGate();
  continueAfterDevice();
}

function preventMobileZoom(event) {
  if (state.deviceType === "mobile" || matchMedia("(max-width: 760px)").matches) {
    event.preventDefault();
  }
}

function syncVisualViewport() {
  const viewport = window.visualViewport;
  const width = Math.max(1, Math.round(viewport?.width || window.innerWidth));
  const height = Math.max(1, Math.round(viewport?.height || window.innerHeight));
  const scale = viewport?.scale || 1;
  document.documentElement.style.setProperty("--visual-width", `${width}px`);
  document.documentElement.style.setProperty("--visual-height", `${height}px`);
  document.body.dataset.zoomed = scale > 1.05 ? "true" : "false";
}

function scheduleVisualViewportSync() {
  if (visualViewportFrame) return;
  visualViewportFrame = requestAnimationFrame(() => {
    visualViewportFrame = null;
    syncVisualViewport();
  });
}

function continueAfterDevice() {
  deviceScreen.hidden = true;
  timeoutScreen.hidden = true;
  try {
    const saved = JSON.parse(localStorage.getItem(AUTH_KEY) || "null");
    if (saved?.token?.includes(".") && saved?.profile) {
      applyAuth(saved);
      showCallScreen();
      connectPresence();
      return;
    }
    if (saved?.token) localStorage.removeItem(AUTH_KEY);
  } catch {
    localStorage.removeItem(AUTH_KEY);
  }

  authScreen.hidden = false;
  callScreen.hidden = true;
  authName.focus();
}

async function enterSite() {
  const password = sitePassword.value;
  if (!password) {
    showToast("enter site password");
    return;
  }

  siteButton.disabled = true;
  siteButton.textContent = "wait";

  try {
    const response = await fetch("/api/site-access", {
      method: "POST",
      headers: requestHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ password })
    });
    const result = await response.json();
    if (response.status === 423) {
      showTimeout(result.timeoutUntil, result.remainingMs);
      return;
    }
    if (!response.ok) throw new Error(result.error || "access denied");

    state.siteToken = result.token;
    localStorage.setItem(SITE_KEY, result.token);
    hideGate();
    continueAfterDevice();
  } catch (error) {
    showToast(error.message || "access denied");
  } finally {
    siteButton.disabled = false;
    siteButton.textContent = "Enter";
  }
}

function hideGate() {
  gateScreen.hidden = true;
  gateScreen.remove();
}

function loadTheme() {
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(THEME_KEY) || "null");
  } catch {
    localStorage.removeItem(THEME_KEY);
  }

  const mode = saved?.mode === "black" ? "black" : "white";
  const accents = new Set(["blue", "purple", "green", "red", "pink", "orange"]);
  const accent = accents.has(saved?.accent) ? saved.accent : "blue";

  themeMode.value = mode;
  themeAccent.value = accent;
  applyTheme(mode, accent);
}

function saveTheme() {
  const mode = themeMode.value === "black" ? "black" : "white";
  const accent = ["blue", "purple", "green", "red", "pink", "orange"].includes(themeAccent.value)
    ? themeAccent.value
    : "blue";
  localStorage.setItem(THEME_KEY, JSON.stringify({ mode, accent }));
  applyTheme(mode, accent);
}

function applyTheme(mode, accent) {
  document.body.dataset.theme = mode;
  document.body.dataset.accent = accent;
}

function getBrowserDeviceId() {
  let id = localStorage.getItem(BROWSER_DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(BROWSER_DEVICE_KEY, id);
  }
  return id;
}

function requestHeaders(headers = {}) {
  return {
    "X-Device-Id": state.deviceId,
    ...headers
  };
}

function siteHeaders(headers = {}) {
  return requestHeaders({
    "X-Site-Token": state.siteToken,
    ...headers
  });
}

function authHeaders(headers = {}) {
  return siteHeaders({
    Authorization: `Bearer ${state.token}`,
    ...headers
  });
}

async function checkDeviceStatus() {
  try {
    const response = await fetch("/api/device-status", {
      headers: requestHeaders()
    });
    const result = await response.json();
    if (result.timedOut) {
      showTimeout(result.timeoutUntil, result.remainingMs);
      return true;
    }
  } catch {
  }
  return false;
}

function showTimeout(timeoutUntil, remainingMs = 0) {
  state.manualDisconnect = true;
  leaveCall(false);
  state.ws?.close();
  gateScreen.hidden = true;
  deviceScreen.hidden = true;
  authScreen.hidden = true;
  callScreen.hidden = true;
  timeoutScreen.hidden = false;
  updateTimeoutCountdown(timeoutUntil, remainingMs);
  clearInterval(state.timeoutTimer);
  state.timeoutTimer = setInterval(() => updateTimeoutCountdown(timeoutUntil), 1000);
}

function updateTimeoutCountdown(timeoutUntil, remainingMs = null) {
  const ms = remainingMs ?? Math.max(0, Date.parse(timeoutUntil || "") - Date.now());
  const seconds = Math.ceil(ms / 1000);
  timeoutCountdown.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  if (seconds <= 0) {
    clearInterval(state.timeoutTimer);
    state.timeoutTimer = null;
    location.reload();
  }
}

function loadDevicePreference() {
  const saved = localStorage.getItem(DEVICE_KEY);
  if (saved === "pc" || saved === "mobile") {
    applyDevice(saved);
    return saved;
  }

  const guessed = matchMedia("(min-width: 760px)").matches ? "pc" : "mobile";
  applyDevice(guessed);
  return "";
}

function chooseDevice(device) {
  const cleanDevice = device === "pc" ? "pc" : "mobile";
  deviceScreen.hidden = true;
  localStorage.setItem(DEVICE_KEY, cleanDevice);
  applyDevice(cleanDevice);
  continueAfterDevice();
}

function applyDevice(device) {
  const cleanDevice = device === "mobile" ? "mobile" : "pc";
  state.deviceType = cleanDevice;
  document.body.dataset.layout = cleanDevice;
  pcLayoutButton.classList.toggle("blue", cleanDevice === "pc");
  pcLayoutButton.classList.toggle("plain", cleanDevice !== "pc");
  mobileLayoutButton.classList.toggle("blue", cleanDevice === "mobile");
  mobileLayoutButton.classList.toggle("plain", cleanDevice !== "mobile");
  updateScreenShareButton();
}

async function showDevicePicker() {
  authScreen.hidden = true;
  callScreen.hidden = true;
  deviceScreen.hidden = false;
  await loadPhoneAccess();
}

async function loadPhoneAccess() {
  try {
    const response = await fetch("/api/host-info", {
      headers: siteHeaders()
    });
    const result = await response.json();
    const url = result.phoneUrl || result.urls?.[0];
    if (!url) return;
    phoneAccess.hidden = false;
    phoneAccess.textContent = `Phone: ${url}`;
  } catch {
  }
}

function submitAuthOnEnter(event) {
  if (event.key === "Enter") finishAuth();
}

function setAuthMode(mode) {
  state.mode = mode;
  loginTab.classList.toggle("active", mode === "login");
  signupTab.classList.toggle("active", mode === "signup");
  authButton.textContent = mode === "login" ? "Login" : "Sign up";
}

async function finishAuth() {
  const username = sanitizeName(authName.value);
  const password = authPassword.value;

  if (!username || !password) {
    showToast("enter username and password");
    return;
  }

  authButton.disabled = true;
  authButton.textContent = "wait";

  try {
    const response = await fetch(`/api/${state.mode === "login" ? "login" : "signup"}`, {
      method: "POST",
      headers: siteHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ username, password, deviceId: state.deviceId })
    });
    const result = await response.json();
    if (response.status === 423) {
      showTimeout(result.timeoutUntil, result.remainingMs);
      return;
    }
    if (!response.ok) throw new Error(result.error || "auth failed");

    applyAuth(result);
    saveAuth();
    showCallScreen();
    warmNotifications();
    connectPresence();
  } catch (error) {
    showToast(error.message || "login failed");
  } finally {
    authButton.disabled = false;
    authButton.textContent = state.mode === "login" ? "Login" : "Sign up";
  }
}

function applyAuth(auth) {
  state.token = auth.token;
  state.username = auth.username;
  state.isAdmin = Boolean(auth.isAdmin);
  state.profile = normalizeProfile(auth.profile || { name: auth.username });
}

function saveAuth() {
  localStorage.setItem(AUTH_KEY, JSON.stringify({
    token: state.token,
    username: state.username,
    isAdmin: state.isAdmin,
    profile: state.profile
  }));
}

function showCallScreen() {
  deviceScreen.hidden = true;
  authScreen.hidden = true;
  callScreen.hidden = false;
  adminButton.hidden = !state.isAdmin;
  profileName.value = state.profile.name;
  renderAvatar(profilePreview, state.profile);
  loadRtcConfig();
  if ("Notification" in window && Notification.permission === "granted") enablePushNotifications();
}

async function loadRtcConfig() {
  try {
    const response = await fetch("/api/rtc-config", { headers: siteHeaders() });
    const result = await response.json();
    if (response.ok && Array.isArray(result.iceServers) && result.iceServers.length) {
      rtcConfig.iceServers = result.iceServers;
    }
  } catch {
  }
}

function connectPresence() {
  if (state.ws && [WebSocket.CONNECTING, WebSocket.OPEN].includes(state.ws.readyState)) return;

  state.manualDisconnect = false;
  const socket = new WebSocket(wsBase());
  state.ws = socket;

  socket.addEventListener("open", () => {
    if (socket !== state.ws) return;
    setConnection("online", true);
    state.reconnectAttempt = 0;
    state.lastPongAt = Date.now();
    send({ type: "presence", token: state.token, siteToken: state.siteToken, deviceId: state.deviceId, deviceType: state.deviceType });
    startHeartbeat();
  });

  socket.addEventListener("message", async (event) => {
    if (socket !== state.ws) return;
    try {
      await handleSignal(JSON.parse(event.data));
    } catch (error) {
      console.error("Signal handling failed:", error);
      showToast("sync recovered");
    }
  });

  socket.addEventListener("close", () => {
    if (socket !== state.ws) return;
    const wasInCall = state.inCall;
    setConnection("offline", false);
    stopHeartbeat();
    cleanupPeerConnections();
    state.ws = null;
    if (!state.manualDisconnect && state.token) {
      state.autoRejoin = wasInCall || state.autoRejoin;
      scheduleReconnect();
    }
  });

  socket.addEventListener("error", () => {
    showToast("server not reachable");
  });
}

function startHeartbeat() {
  stopHeartbeat();
  state.lastPongAt = Date.now();
  state.heartbeatTimer = setInterval(() => {
    if (!state.ws || state.ws.readyState !== WebSocket.OPEN) return;
    if (Date.now() - state.lastPongAt > 35000) {
      showToast("reconnecting");
      state.autoRejoin = state.inCall || state.autoRejoin;
      state.ws.close();
      return;
    }
    send({ type: "ping" });
  }, 10000);
}

function stopHeartbeat() {
  clearInterval(state.heartbeatTimer);
  state.heartbeatTimer = null;
}

function scheduleReconnect(delay = null) {
  clearTimeout(state.reconnectTimer);
  const wait = delay ?? Math.min(30000, 1000 * 2 ** Math.min(5, state.reconnectAttempt++));
  state.reconnectTimer = setTimeout(() => {
    if (!state.token || state.manualDisconnect) return;
    connectPresence();
  }, wait);
}

function maybeAutoRejoin() {
  if (!state.autoRejoin || state.inCall || state.callKickUntil > Date.now()) return;
  state.autoRejoin = false;
  setTimeout(() => {
    if (!state.inCall && state.ws?.readyState === WebSocket.OPEN) joinCall();
  }, 400);
}

function logout() {
  state.manualDisconnect = true;
  state.autoRejoin = false;
  clearTimeout(state.reconnectTimer);
  leaveCall(false);
  state.ws?.close();
  localStorage.removeItem(AUTH_KEY);
  state.token = "";
  state.username = "";
  state.isAdmin = false;
  state.profile = {
    name: "",
    status: "online",
    avatarUrl: "",
    avatarType: ""
  };
  for (const card of state.cards.values()) card.remove();
  state.cards.clear();
  state.onlineUsers.clear();
  updateOnlineCounter();
  updatePopups();
  state.chatIds.clear();
  chatLog.textContent = "";
  authName.value = "";
  authPassword.value = "";
  adminPanel.hidden = true;
  authScreen.hidden = false;
  callScreen.hidden = true;
  authName.focus();
}

async function saveProfile() {
  saveProfileButton.disabled = true;
  saveProfileButton.textContent = "saving";

  try {
    state.profile.name = sanitizeName(profileName.value) || state.profile.name;
    state.profile.status = "";

    const file = profileFile.files[0];
    if (file) {
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        showToast("image or video only");
        return;
      }

      const form = new FormData();
      form.append("file", file);
      const response = await fetch(`${httpBase()}/api/upload-pfp`, {
        method: "POST",
        headers: siteHeaders(),
        body: form
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "upload failed");
      state.profile.avatarUrl = result.url;
      state.profile.avatarType = result.type || file.type;
      profileFile.value = "";
    }

    saveAuth();
    renderAvatar(profilePreview, state.profile);
    updateParticipant(state.id, state.profile, true, state.inCall);
    send({ type: "profile", profile: publicProfile() });
    showToast("saved");
  } catch (error) {
    showToast(error.message || "save failed");
  } finally {
    saveProfileButton.disabled = false;
    saveProfileButton.textContent = "save profile";
  }
}

async function loadAccounts() {
  if (!state.isAdmin) return;

  const response = await fetch("/api/accounts", {
    headers: authHeaders()
  });
  const result = await response.json();
  if (response.status === 423) {
    showTimeout(result.timeoutUntil, result.remainingMs);
    return;
  }
  if (!response.ok) {
    showToast(result.error || "admin failed");
    return;
  }

  accountList.textContent = "";
  for (const account of result.accounts) {
    const row = document.createElement("div");
    row.className = "account-row";
    const name = document.createElement("span");
    const deviceText = account.lastDeviceId ? "device saved" : "no device";
    name.textContent = `${account.username}${account.isAdmin ? " admin" : ""} - ${deviceText}`;

    const actions = document.createElement("div");
    actions.className = "account-actions";

    const remove = document.createElement("button");
    remove.className = "red";
    remove.type = "button";
    remove.textContent = "remove";
    remove.disabled = account.username.toLowerCase() === "seth";
    remove.addEventListener("click", () => removeAccount(account.username));

    const timeout = document.createElement("button");
    timeout.className = "small";
    timeout.type = "button";
    timeout.textContent = account.deviceTimedOut ? "timed out" : "timeout device";
    timeout.disabled = Boolean(account.isAdmin || account.protectedDevice || !account.lastDeviceId || account.deviceTimedOut);
    timeout.addEventListener("click", () => timeoutAccountDevice(account.username));

    const signupBlock = document.createElement("button");
    signupBlock.className = account.signupBlocked ? "blue" : "small";
    signupBlock.type = "button";
    signupBlock.textContent = account.signupBlocked ? "allow signups" : "block signups";
    signupBlock.disabled = Boolean(account.isAdmin || account.protectedDevice || !account.lastDeviceId);
    signupBlock.addEventListener("click", () => setAccountSignupBlock(account.username, !account.signupBlocked));

    actions.append(remove, timeout, signupBlock);
    row.append(name, actions);
    accountList.append(row);
  }
}

async function loadSecurityEvents() {
  if (!state.isAdmin) return;

  const response = await fetch("/api/security-events", {
    headers: authHeaders()
  });
  const result = await response.json();
  if (!response.ok) return;
  renderSecurityEvents(result.events || []);
}

async function loadChatSettings() {
  if (!state.isAdmin) return;
  setAdminChatStatus("loading...");
  try {
    const response = await fetch("/api/chat-settings", { headers: authHeaders() });
    const result = await response.json();
    if (!response.ok) {
      handleExpiredAdminSession(response);
      throw new Error(result.error || "could not load chat controls");
    }
    applyChatState(result.enabled !== false);
    updateAdminChatCount(result.storedMessages || 0);
    setAdminChatStatus(result.enabled === false ? "chat is disabled" : "chat is enabled");
  } catch (error) {
    setAdminChatStatus(error.message || "could not load chat controls", true);
  }
}

async function updateChatSetting() {
  const enabled = chatEnabledToggle.checked;
  chatEnabledToggle.disabled = true;
  try {
    const response = await fetch("/api/chat-settings", {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ enabled })
    });
    const result = await response.json();
    if (!response.ok) {
      handleExpiredAdminSession(response);
      throw new Error(result.error || "chat update failed");
    }
    applyChatState(result.enabled !== false);
    updateAdminChatCount(result.storedMessages || 0);
    setAdminChatStatus(result.enabled ? "chat enabled for everyone" : "chat disabled for everyone");
  } catch (error) {
    chatEnabledToggle.checked = state.chatEnabled;
    setAdminChatStatus(error.message || "chat update failed", true);
  } finally {
    chatEnabledToggle.disabled = false;
  }
}

async function clearAllChatMessages() {
  if (!state.isAdmin || clearChatButton.disabled) return;
  clearChatButton.disabled = true;
  clearChatButton.textContent = "deleting...";
  try {
    const response = await fetch("/api/chat-messages", {
      method: "DELETE",
      headers: authHeaders()
    });
    const result = await response.json();
    if (!response.ok) {
      handleExpiredAdminSession(response);
      throw new Error(result.error || "delete failed");
    }
    chatLog.textContent = "";
    state.chatIds.clear();
    updateAdminChatCount(0);
    setAdminChatStatus("all messages deleted");
  } catch (error) {
    setAdminChatStatus(error.message || "delete failed", true);
  } finally {
    clearChatButton.disabled = false;
    clearChatButton.textContent = "delete all messages";
  }
}

function applyChatState(enabled) {
  state.chatEnabled = Boolean(enabled);
  chatEnabledToggle.checked = state.chatEnabled;
  chatInput.disabled = !state.chatEnabled;
  chatSendButton.disabled = !state.chatEnabled;
  mediaButton.disabled = !state.chatEnabled;
  gifButton.disabled = !state.chatEnabled;
  chatInput.placeholder = state.chatEnabled ? "message or link" : "chat disabled by admin";
  chatPanel.classList.toggle("chat-disabled", !state.chatEnabled);
  if (!state.chatEnabled) gifPanel.hidden = true;
}

function updateAdminChatCount(count) {
  adminChatCount.textContent = `${Number(count) || 0} stored messages`;
}

function setAdminChatStatus(message, error = false) {
  adminChatStatus.textContent = message;
  adminChatStatus.classList.toggle("error", error);
}

function handleExpiredAdminSession(response) {
  if (![401, 403].includes(response.status)) return;
  localStorage.removeItem(AUTH_KEY);
  setAdminChatStatus("login expired - log out and log back in", true);
}

function renderSecurityEvents(events) {
  securityList.textContent = "";
  for (const event of events) addSecurityEvent(event, false);
}

function addSecurityEvent(event, prepend = true) {
  const row = document.createElement("div");
  row.className = "account-row security-row";
  const info = document.createElement("div");
  info.textContent = `${event.time} | ${event.ip} | tries: ${event.attempts} | ${event.userAgent || "unknown"}`;

  const actions = document.createElement("div");
  actions.className = "security-actions";

  const allow = document.createElement("button");
  allow.className = "small";
  allow.type = "button";
  allow.textContent = "allow";
  allow.dataset.securityAction = "allow";
  allow.dataset.ip = event.ip;

  const block = document.createElement("button");
  block.className = "red";
  block.type = "button";
  block.textContent = event.blocked ? "blocked" : "block";
  block.disabled = Boolean(event.protected || event.blocked);
  block.dataset.securityAction = "block";
  block.dataset.ip = event.ip;

  actions.append(allow, block);
  row.append(info, actions);
  if (prepend) securityList.prepend(row);
  else securityList.append(row);
}

async function updateSecurityIp(ip, action) {
  const response = await fetch(`/api/security-events/${encodeURIComponent(ip)}/${action}`, {
    method: "POST",
    headers: authHeaders()
  });
  const result = await response.json();
  if (!response.ok) {
    showToast(result.error || "security action failed");
    return;
  }
  showToast(action === "allow" ? "ip allowed" : "ip blocked");
  await loadSecurityEvents();
}

async function removeAccount(username) {
  const response = await fetch(`/api/accounts/${encodeURIComponent(username)}`, {
    method: "DELETE",
    headers: authHeaders()
  });
  const result = await response.json();
  if (!response.ok) {
    showToast(result.error || "remove failed");
    return;
  }

  showToast("account removed");
  await loadAccounts();
}

async function timeoutAccountDevice(username) {
  const response = await fetch(`/api/accounts/${encodeURIComponent(username)}/timeout-device`, {
    method: "POST",
    headers: authHeaders()
  });
  const result = await response.json();
  if (!response.ok) {
    showToast(result.error || "timeout failed");
    return;
  }
  showToast("device timed out");
  await loadAccounts();
}

async function setAccountSignupBlock(username, blocked) {
  const response = await fetch(`/api/accounts/${encodeURIComponent(username)}/signup-block-device`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ blocked })
  });
  const result = await response.json();
  if (!response.ok) {
    showToast(result.error || "signup block failed");
    return;
  }
  showToast(blocked ? "signups blocked" : "signups allowed");
  await loadAccounts();
}

async function joinCall() {
  if (state.inCall) return;
  warmNotifications();
  if (state.callKickUntil > Date.now()) {
    updateJoinKickLock();
    return;
  }
  joinButton.disabled = true;
  micStatus.textContent = "checking mic";
  micStatus.className = "mic-status";

  await loadRtcConfig();
  if (!state.ws || state.ws.readyState === WebSocket.CLOSED) connectPresence();
  await waitForSocket();
  await requestMicrophone();
  send({
    type: "join",
    room: "main",
    name: state.profile.name,
    deviceType: state.deviceType,
    profile: publicProfile()
  });
}

function waitForSocket() {
  if (state.ws?.readyState === WebSocket.OPEN) return Promise.resolve();
  return new Promise((resolve) => {
    state.ws?.addEventListener("open", resolve, { once: true });
  });
}

async function requestMicrophone() {
  if (isInsecureLanPhone()) {
    const message = insecurePhoneMessage();
    state.hasMic = false;
    micStatus.textContent = message;
    micStatus.className = "mic-status bad";
    showToast(message);
    return false;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    state.hasMic = false;
    micStatus.textContent = insecurePhoneMessage();
    micStatus.className = "mic-status bad";
    showToast(insecurePhoneMessage());
    return false;
  }

  try {
    state.rawStream = await getMicrophoneStream();
    await tuneMicTrack(state.rawStream.getAudioTracks()[0]);
    state.stream = createProcessedMicStream(state.rawStream);
    watchMicrophoneTrack();

    state.hasMic = true;
    micStatus.textContent = "mic on";
    micStatus.className = "mic-status good";
    setupLocalAudioMeter();
    return true;
  } catch (error) {
    state.hasMic = false;
    micStatus.textContent = error.name === "NotAllowedError" ? "mic blocked" : "mic unavailable";
    micStatus.className = "mic-status bad";
    showToast(error.name === "NotAllowedError" ? "mic blocked, joining anyway" : "joining without mic");
    return false;
  }
}

async function getMicrophoneStream() {
  const preferred = {
    audio: {
      echoCancellation: { ideal: true },
      noiseSuppression: { ideal: true },
      autoGainControl: { ideal: false },
      channelCount: { ideal: 1 },
      sampleRate: { ideal: 48000 },
      sampleSize: { ideal: 16 },
      latency: { ideal: 0.02 }
    },
    video: false
  };

  try {
    return await navigator.mediaDevices.getUserMedia(preferred);
  } catch (error) {
    if (["OverconstrainedError", "ConstraintNotSatisfiedError", "NotReadableError", "AbortError"].includes(error.name)) {
      return navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    }
    throw error;
  }
}

async function tuneMicTrack(track) {
  if (!track) return;
  track.contentHint = "speech";

  const supported = navigator.mediaDevices.getSupportedConstraints?.() || {};
  const constraints = {};
  if (supported.echoCancellation) constraints.echoCancellation = true;
  if (supported.noiseSuppression) constraints.noiseSuppression = true;
  if (supported.autoGainControl) constraints.autoGainControl = false;
  if (supported.channelCount) constraints.channelCount = 1;
  if (supported.sampleRate) constraints.sampleRate = 48000;
  if (supported.latency) constraints.latency = 0.02;

  try {
    if (Object.keys(constraints).length) await track.applyConstraints(constraints);
  } catch {
  }
}

function watchMicrophoneTrack() {
  const track = state.rawStream?.getAudioTracks()[0];
  if (!track) return;
  let muteTimer = null;
  track.addEventListener("ended", () => {
    if (state.inCall) recoverMicrophone();
  }, { once: true });
  track.addEventListener("mute", () => {
    clearTimeout(muteTimer);
    muteTimer = setTimeout(() => {
      if (state.inCall && track.muted && track.readyState === "live") recoverMicrophone();
    }, 4000);
  });
  track.addEventListener("unmute", () => clearTimeout(muteTimer));
}

async function recoverMicrophone() {
  if (!state.inCall || state.micRecovering || !navigator.mediaDevices?.getUserMedia) return;
  state.micRecovering = true;
  try {
    const nextRawStream = await getMicrophoneStream();
    const nextRawTrack = nextRawStream.getAudioTracks()[0];
    await tuneMicTrack(nextRawTrack);

    stopAudioMeter();
    const oldAudioContext = state.audioContext;
    state.audioContext = null;
    state.analyser = null;
    state.audioSource = null;
    state.audioDestination = null;
    await oldAudioContext?.close().catch(() => {});

    const oldStream = state.stream;
    const oldRawStream = state.rawStream;
    state.rawStream = nextRawStream;
    state.stream = createProcessedMicStream(nextRawStream);
    const nextTrack = state.stream.getAudioTracks()[0];
    nextTrack.enabled = !state.muted;

    for (const peer of state.peers.values()) {
      for (const sender of peer.connection.getSenders()) {
        if (sender.track?.kind === "audio") {
          await sender.replaceTrack(nextTrack);
          await tuneAudioSender(sender);
        }
      }
    }

    oldStream?.getTracks().forEach((item) => item.stop());
    oldRawStream?.getTracks().forEach((item) => item.stop());
    state.hasMic = true;
    watchMicrophoneTrack();
    setupLocalAudioMeter();
  } catch {
    state.hasMic = false;
    setTimeout(() => {
      if (state.inCall) recoverMicrophone();
    }, 5000);
  } finally {
    state.micRecovering = false;
  }
}

async function handleSignal(message) {
  if (message.type === "hello") {
    state.id = message.id;
    return;
  }

  if (message.type === "auth-error") {
    showToast("login expired");
    logout();
    return;
  }

  if (message.type === "account-removed") {
    showToast("account removed");
    logout();
    return;
  }

  if (message.type === "error") {
    showToast(message.message || "something failed");
    playNoticeSound("error");
    return;
  }

  if (message.type === "device-timeout") {
    showTimeout(message.timeoutUntil);
    return;
  }

  if (message.type === "call-kicked") {
    handleCallKick(message);
    return;
  }

  if (message.type === "screen-share-denied") {
    await stopScreenShare(false);
    showToast(message.message || "someone else is already sharing");
    return;
  }

  if (message.type === "screen-share") {
    const user = state.onlineUsers.get(message.from);
    if (user) {
      user.screenSharing = message.enabled === true;
      state.onlineUsers.set(message.from, user);
    }
    setScreenShareCard(
      message.from,
      message.enabled === true,
      message.from === state.id ? state.screenStream : state.screenPeers.get(message.from)?.stream
    );
    if (message.from !== state.id) {
      if (message.enabled === true) {
        setTimeout(() => {
          if (state.onlineUsers.get(message.from)?.screenSharing && !state.screenPeers.get(message.from)?.stream) {
            requestScreenShareSync({
              id: message.from,
              syncAttempts: state.screenPeers.get(message.from)?.syncAttempts || 0
            });
          }
        }, 7000);
      } else {
        closeScreenPeer(message.from);
      }
    }
    return;
  }

  if (message.type === "screen-share-sync-request") {
    await refreshScreenShareForPeer(message.from, message.attempt);
    return;
  }

  if (message.type === "screen-offer") {
    await handleScreenOffer(message);
    return;
  }

  if (message.type === "screen-answer") {
    const screenPeer = state.screenPeers.get(message.from);
    if (screenPeer?.screenId === message.screenId && screenPeer.connection.signalingState === "have-local-offer") {
      await screenPeer.connection.setRemoteDescription(message.answer);
      screenPeer.remoteReady = true;
      await flushScreenIce(screenPeer);
    }
    return;
  }

  if (message.type === "screen-ice") {
    const screenPeer = state.screenPeers.get(message.from);
    if (!screenPeer || screenPeer.screenId !== message.screenId || !message.candidate) return;
    if (screenPeer.remoteReady) {
      await screenPeer.connection.addIceCandidate(message.candidate);
    } else {
      screenPeer.pendingIce.push(message.candidate);
    }
    return;
  }

  if (message.type === "kick-vote") {
    const previousVote = state.kickVotes.get(message.vote.id);
    state.kickVotes.set(message.vote.id, message.vote);
    renderKickVotes();
    if (!previousVote) {
      notifyUser("Vote kick started", `${message.vote.starterName || "Someone"} started a vote`, "vote");
    }
    return;
  }

  if (message.type === "kick-vote-ended") {
    state.kickVotes.delete(message.voteId);
    renderKickVotes();
    if (message.passed) {
      notifyUser("Vote passed", `${message.targetName || "caller"} was kicked`, "kick");
    } else if (message.reason === "expired") {
      notifyUser("Vote expired", `Kick vote for ${message.targetName || "caller"} ended`, "soft");
    }
    return;
  }

  if (message.type === "security-alert") {
    if (state.isAdmin) {
      addSecurityEvent(message.event);
      showToast("security alert");
    }
    return;
  }

  if (message.type === "chat-history") {
    chatLog.textContent = "";
    state.chatIds.clear();
    for (const chat of message.messages || []) addChatBubble(chat);
    updateAdminChatCount(message.messages?.length || 0);
    return;
  }

  if (message.type === "chat-state") {
    applyChatState(message.enabled !== false);
    return;
  }

  if (message.type === "chat-cleared") {
    chatLog.textContent = "";
    state.chatIds.clear();
    updateAdminChatCount(0);
    return;
  }

  if (message.type === "pong") {
    state.lastPongAt = Date.now();
    return;
  }

  if (message.type === "presence-list") {
    state.id = message.self;
    syncOnlineUsers(message.users || []);
    syncParticipants(message.users || []);
    maybeAutoRejoin();
    return;
  }

  if (message.type === "presence-sync") {
    syncOnlineUsers(message.users || []);
    syncParticipants(message.users || []);
    maybeAutoRejoin();
    return;
  }

  if (message.type === "presence-update") {
    const user = message.user;
    updateOnlineUser(user);
    if (user.inCall) {
      const wasVisible = state.cards.has(user.id);
      renderParticipant(user.id, user.profile, user.id === state.id, true);
      if (!wasVisible && user.id !== state.id) playJoinSound();
    } else {
      removePeer(user.id, true);
    }
    return;
  }

  if (message.type === "presence-left") {
    state.onlineUsers.delete(message.id);
    updateOnlineCounter();
    updateKickAvailability();
    removePeer(message.id, true);
    playNoticeSound("leave");
    return;
  }

  if (message.type === "call-started") {
    const user = message.user || {};
    updateOnlineUser(user);
    if (user.id !== state.id && !state.inCall) {
      notifyUser("Call started", `${user.profile?.name || user.username || "Someone"} joined the call`, "join", { forceSystem: true });
    }
    return;
  }

  if (message.type === "joined") {
    state.id = message.id;
    state.inCall = true;
    startCallHealthMonitor();
    requestWakeLock();
    setupPanel.hidden = true;
    callControls.hidden = false;
    renderParticipant(state.id, publicProfile(), true, true);
    muteButton.disabled = !state.hasMic;
    muteButton.textContent = state.hasMic ? "mute" : "no mic";

    for (const peer of message.peers) {
      await createPeer(peer, true);
    }
    if (state.screenSharing && state.screenTrack?.readyState === "live") {
      send({ type: "screen-share", enabled: true });
      setScreenShareCard(state.id, true, state.screenStream);
    }
    updateScreenShareButton();
    return;
  }

  if (message.type === "peer-joined") {
    updateOnlineUser({
      ...message.peer,
      inCall: true
    });
    await createPeer(message.peer, false);
    playJoinSound();
    return;
  }

  if (message.type === "peer-left") {
    removePeer(message.id, true);
    playNoticeSound("leave");
    return;
  }

  if (message.type === "chat") {
    addChatBubble(message);
    if (message.from !== state.id) {
      const chatKind = message.kind === "gif" ? "sent a GIF" : message.kind === "media" ? "sent media" : message.text || "sent a message";
      notifyUser(message.profile?.name || message.name || "New message", chatKind, "chat");
    }
    return;
  }

  if (message.type === "profile") {
    updateParticipant(message.from, message.profile, message.from === state.id, true);
    const peer = state.peers.get(message.from);
    if (peer) peer.profile = normalizeProfile(message.profile);
    return;
  }

  if (message.type === "offer") {
    const peer = await ensurePeer({
      id: message.from,
      profile: message.profile || profileFromName(message.name),
      deviceType: message.deviceType
    });
    const polite = String(state.id || "").localeCompare(message.from) > 0;
    const offerCollision = peer.makingOffer || peer.connection.signalingState !== "stable";
    peer.ignoreOffer = !polite && offerCollision;
    if (peer.ignoreOffer) return;
    if (offerCollision) {
      await Promise.all([
        peer.connection.setLocalDescription({ type: "rollback" }),
        peer.connection.setRemoteDescription(message.offer)
      ]);
    } else {
      await peer.connection.setRemoteDescription(message.offer);
    }
    peer.remoteReady = true;
    await flushIce(peer);
    const answer = await peer.connection.createAnswer();
    answer.sdp = improveAudioSdp(answer.sdp);
    await peer.connection.setLocalDescription(answer);
    send({ type: "answer", to: message.from, answer, deviceType: state.deviceType });
    return;
  }

  if (message.type === "answer") {
    const peer = state.peers.get(message.from);
    if (peer && peer.connection.signalingState === "have-local-offer") {
      await peer.connection.setRemoteDescription(message.answer);
      peer.remoteReady = true;
      await flushIce(peer);
    }
    return;
  }

  if (message.type === "ice") {
    const peer = state.peers.get(message.from);
    if (peer && message.candidate && !peer.ignoreOffer) {
      if (peer.remoteReady) {
        await peer.connection.addIceCandidate(message.candidate);
      } else {
        peer.pendingIce.push(message.candidate);
      }
    }
    return;
  }

  if (message.type === "speaking") {
    setSpeaking(message.from, message.speaking);
    return;
  }

  if (message.type === "mute") {
    setMuted(message.from, message.muted);
  }
}

async function createPeer(peerInfo, initiator) {
  const peer = await ensurePeer(peerInfo);

  if (!initiator) return peer;
  await negotiatePeer(peer);
  return peer;
}

async function negotiatePeer(peer) {
  if (!peer || peer.connection.connectionState === "closed") return;
  if (peer.negotiationInFlight) {
    peer.negotiationQueued = true;
    return;
  }
  if (peer.connection.signalingState !== "stable") {
    peer.negotiationQueued = true;
    clearTimeout(peer.negotiationTimer);
    peer.negotiationTimer = setTimeout(() => {
      peer.negotiationQueued = false;
      negotiatePeer(peer);
    }, 150);
    return;
  }

  clearTimeout(peer.negotiationTimer);
  peer.negotiationTimer = null;
  peer.negotiationInFlight = true;
  peer.makingOffer = true;
  try {
    const offer = await peer.connection.createOffer();
    offer.sdp = improveAudioSdp(offer.sdp);
    await peer.connection.setLocalDescription(offer);
    send({
      type: "offer",
      to: peer.id,
      offer,
      profile: publicProfile(),
      deviceType: state.deviceType
    });
  } catch {
  } finally {
    peer.makingOffer = false;
    peer.negotiationInFlight = false;
    if (peer.negotiationQueued) {
      peer.negotiationQueued = false;
      clearTimeout(peer.negotiationTimer);
      peer.negotiationTimer = setTimeout(() => negotiatePeer(peer), 150);
    }
  }
}

async function restartPeerIce(peer) {
  if (!peer || peer.connection.connectionState === "closed" || peer.restartInFlight || peer.negotiationInFlight) return;
  if (Date.now() - peer.lastRestartAt < 8000) return;
  peer.restartInFlight = true;
  peer.lastRestartAt = Date.now();
  peer.makingOffer = true;
  try {
    if (peer.connection.signalingState !== "stable") return;
    peer.connection.restartIce?.();
    const offer = await peer.connection.createOffer({ iceRestart: true });
    offer.sdp = improveAudioSdp(offer.sdp);
    await peer.connection.setLocalDescription(offer);
    send({
      type: "offer",
      to: peer.id,
      offer,
      profile: publicProfile(),
      deviceType: state.deviceType
    });
  } catch {
  } finally {
    peer.makingOffer = false;
    peer.restartInFlight = false;
  }
}

async function recoverPeerConnection(peer) {
  if (!state.inCall || !peer || state.peers.get(peer.id) !== peer || peer.recovering) return;
  peer.recovering = true;
  try {
    peer.recoveryAttempts += 1;
    if (peer.recoveryAttempts <= 2) {
      await restartPeerIce(peer);
      return;
    }

    const user = state.onlineUsers.get(peer.id) || {};
    const info = {
      id: peer.id,
      profile: user.profile || peer.profile,
      deviceType: user.deviceType || "pc",
      screenSharing: Boolean(user.screenSharing)
    };
    const volume = peer.volume;
    const remoteMuted = peer.remoteMuted;
    removePeer(peer.id, false);
    const rebuilt = await createPeer(info, String(state.id || "").localeCompare(peer.id) < 0);
    if (rebuilt) {
      rebuilt.volume = volume;
      rebuilt.remoteMuted = remoteMuted;
    }
  } catch {
  } finally {
    peer.recovering = false;
  }
}

function recoverAllPeerConnections() {
  if (!state.inCall) return;
  for (const peer of state.peers.values()) recoverPeerConnection(peer);
}

function startCallHealthMonitor() {
  stopCallHealthMonitor();
  state.callHealthTimer = setInterval(() => {
    for (const peer of state.peers.values()) checkPeerHealth(peer);
  }, state.deviceType === "mobile" ? 8000 : 6000);
}

function stopCallHealthMonitor() {
  clearInterval(state.callHealthTimer);
  state.callHealthTimer = null;
}

async function checkPeerHealth(peer) {
  if (!state.inCall || !peer || peer.connection.connectionState === "closed") return;
  try {
    const stats = await peer.connection.getStats();
    let inbound = null;
    let remoteInbound = null;
    stats.forEach((report) => {
      if (report.type === "inbound-rtp" && report.kind === "audio" && !report.isRemote) inbound = report;
      if (report.type === "remote-inbound-rtp" && report.kind === "audio") remoteInbound = report;
    });
    if (!inbound) return;
    if (peer.lastInboundPackets === null) {
      peer.lastInboundPackets = Number(inbound.packetsReceived || 0);
      peer.lastInboundLost = Number(inbound.packetsLost || 0);
      peer.lastInboundBytes = Number(inbound.bytesReceived || 0);
      peer.lastConcealedSamples = Number(inbound.concealedSamples || 0);
      peer.lastTotalSamples = Number(inbound.totalSamplesReceived || 0);
      await setPeerAudioBitrate(peer, false);
      return;
    }

    const packetDelta = Math.max(0, Number(inbound.packetsReceived || 0) - peer.lastInboundPackets);
    const lostDelta = Math.max(0, Number(inbound.packetsLost || 0) - peer.lastInboundLost);
    const byteDelta = Math.max(0, Number(inbound.bytesReceived || 0) - peer.lastInboundBytes);
    const concealedDelta = Math.max(0, Number(inbound.concealedSamples || 0) - peer.lastConcealedSamples);
    const sampleDelta = Math.max(0, Number(inbound.totalSamplesReceived || 0) - peer.lastTotalSamples);
    const lossRatio = lostDelta / Math.max(1, packetDelta + lostDelta);
    const concealRatio = concealedDelta / Math.max(1, sampleDelta);
    const jitter = Number(inbound.jitter || 0);
    const remoteLossRaw = Number(remoteInbound?.fractionLost || 0);
    const remoteLoss = remoteLossRaw > 1 ? remoteLossRaw / 255 : remoteLossRaw;
    const bad = lossRatio > 0.12 || remoteLoss > 0.12 || jitter > 0.15 || concealRatio > 0.25;

    if (peer.lastInboundPackets !== null && packetDelta === 0 && byteDelta === 0 && !peer.remoteMuted && !peer.sendingMuted) {
      peer.stalledSamples += 1;
    } else {
      peer.stalledSamples = 0;
    }
    peer.healthBadSamples = bad ? peer.healthBadSamples + 1 : Math.max(0, peer.healthBadSamples - 1);
    peer.lastInboundPackets = Number(inbound.packetsReceived || 0);
    peer.lastInboundLost = Number(inbound.packetsLost || 0);
    peer.lastInboundBytes = Number(inbound.bytesReceived || 0);
    peer.lastConcealedSamples = Number(inbound.concealedSamples || 0);
    peer.lastTotalSamples = Number(inbound.totalSamplesReceived || 0);

    await setPeerAudioBitrate(peer, bad);
    if (peer.healthBadSamples >= 3 || peer.stalledSamples >= 4) {
      peer.healthBadSamples = 0;
      peer.stalledSamples = 0;
      recoverPeerConnection(peer);
    }
  } catch {
  }
}

async function setPeerAudioBitrate(peer, degraded) {
  const bitrate = degraded ? 48000 : state.deviceType === "mobile" ? 64000 : 96000;
  if (peer.currentBitrate === bitrate) return;
  peer.currentBitrate = bitrate;
  for (const sender of peer.connection.getSenders()) {
    if (sender.track?.kind === "audio") await tuneAudioSender(sender, bitrate);
  }
}

async function ensurePeer(peerInfo) {
  updateOnlineUser({
    id: peerInfo.id,
    profile: peerInfo.profile || profileFromName(peerInfo.name),
    deviceType: peerInfo.deviceType || "pc",
    inCall: true,
    screenSharing: Boolean(peerInfo.screenSharing)
  });
  if (state.peers.has(peerInfo.id)) return state.peers.get(peerInfo.id);

  const profile = peerInfo.profile || profileFromName(peerInfo.name);
  const connection = new RTCPeerConnection(rtcConfig);
  const peer = {
    id: peerInfo.id,
    profile,
    connection,
    audio: null,
    volume: 1,
    remoteMuted: false,
    sendingMuted: false,
    pendingIce: [],
    remoteReady: false,
    reconnectTimer: null,
    boostSource: null,
    boostGain: null,
    healthBadSamples: 0,
    stalledSamples: 0,
    recoveryAttempts: 0,
    restartInFlight: false,
    recovering: false,
    makingOffer: false,
    ignoreOffer: false,
    negotiationInFlight: false,
    negotiationQueued: false,
    negotiationTimer: null,
    lastRestartAt: 0,
    lastInboundPackets: null,
    lastInboundLost: null,
    lastInboundBytes: null,
    lastConcealedSamples: null,
    lastTotalSamples: null,
    currentBitrate: null
  };
  state.peers.set(peerInfo.id, peer);
  renderParticipant(peerInfo.id, profile, false, true);

  if (state.stream) {
    for (const track of state.stream.getTracks()) {
      const sender = connection.addTrack(track, state.stream);
      if (track.kind === "audio") tuneAudioSender(sender);
    }
  } else {
    connection.addTransceiver("audio", { direction: "recvonly" });
  }

  connection.addEventListener("icecandidate", (event) => {
    if (event.candidate) {
      send({ type: "ice", to: peerInfo.id, candidate: event.candidate, deviceType: state.deviceType });
    }
  });

  connection.addEventListener("track", (event) => {
    if (!peer.audio) {
      peer.audio = document.createElement("audio");
      peer.audio.autoplay = true;
      peer.audio.playsInline = true;
      peer.audio.muted = peer.remoteMuted;
      peer.audio.volume = peer.volume;
      audioMount.append(peer.audio);
    }
    peer.audio.srcObject = event.streams[0];
    peer.audio.play().catch(() => {});
    applyPeerOutput(peer);
  });

  connection.addEventListener("connectionstatechange", () => {
    const card = state.cards.get(peerInfo.id);
    if (card) card.dataset.connection = connection.connectionState;
    if (connection.connectionState === "connected") {
      clearTimeout(peer.reconnectTimer);
      peer.reconnectTimer = null;
      peer.recoveryAttempts = 0;
      peer.healthBadSamples = 0;
      peer.stalledSamples = 0;
      peer.audio?.play().catch(() => {});
    }
    if (connection.connectionState === "disconnected") {
      clearTimeout(peer.reconnectTimer);
      peer.reconnectTimer = setTimeout(() => recoverPeerConnection(peer), 2500);
    }
    if (connection.connectionState === "failed") {
      clearTimeout(peer.reconnectTimer);
      recoverPeerConnection(peer);
    }
  });
  connection.addEventListener("iceconnectionstatechange", () => {
    if (connection.iceConnectionState === "failed") recoverPeerConnection(peer);
  });

  return peer;
}

function renderParticipant(id, profile, local, inCall) {
  if (state.cards.has(id)) {
    updateParticipant(id, profile, local, inCall);
    return;
  }

  const card = document.createElement("div");
  card.className = "person";
  card.dataset.id = id;
  card.innerHTML = `
    <div class="avatar"></div>
    <div class="who">
      <div class="name-line">
        <span class="name"></span>
        <span class="device-badge" title="device"></span>
      </div>
    </div>
    <div class="tag"></div>
    <button class="small peer-mute" type="button">mute</button>
    <div class="screen-share-view" hidden>
      <button class="small screen-share-enlarge" type="button" aria-label="enlarge screen share">enlarge</button>
      <video class="screen-share-video" autoplay muted playsinline></video>
      <div class="screen-share-status" role="status" hidden>connecting screen...</div>
    </div>
  `;
  participants.append(card);
  state.cards.set(id, card);
  updateParticipant(id, profile, local, inCall);
}

function updateParticipant(id, profile, local, inCall) {
  const card = state.cards.get(id);
  if (!card) return;

  const cleanProfile = normalizeProfile(profile);
  const user = state.onlineUsers.get(id);
  const deviceType = user?.deviceType || (local ? state.deviceType : "pc");
  card.dataset.local = local ? "true" : "false";
  card.dataset.inCall = inCall ? "true" : "false";
  card.dataset.deviceType = deviceType;
  renderAvatar(card.querySelector(".avatar"), cleanProfile);
  card.querySelector(".name").textContent = local ? `${cleanProfile.name} (you)` : cleanProfile.name;
  renderDeviceBadge(card.querySelector(".device-badge"), deviceType);
  card.querySelector(".tag").textContent = inCall ? (local ? "you" : "live") : "";
  const peerMute = card.querySelector(".peer-mute");
  peerMute.hidden = local || !state.inCall;
  peerMute.dataset.id = id;
  card.classList.toggle("in-call", inCall);
  card.classList.toggle("no-mic", local && inCall && !state.hasMic);
  if (local && inCall && !state.hasMic) card.querySelector(".tag").textContent = "no mic";
  const screenSharing = local ? state.screenSharing : Boolean(user?.screenSharing);
  const screenStream = local ? state.screenStream : state.screenPeers.get(id)?.stream;
  setScreenShareCard(id, screenSharing, screenStream);
  updatePopups();
}

function syncParticipants(users) {
  const inCallIds = new Set();
  for (const user of users) {
    if (!user.inCall) continue;
    inCallIds.add(user.id);
    renderParticipant(user.id, user.profile, user.id === state.id, true);
  }

  for (const id of [...state.cards.keys()]) {
    if (!inCallIds.has(id)) removePeer(id, true);
  }

  if (state.inCall && state.id && !inCallIds.has(state.id)) {
    resetLocalCall(false);
  }
  updatePopups();
  updateKickAvailability();
}

function syncOnlineUsers(users) {
  state.onlineUsers.clear();
  for (const user of users) updateOnlineUser(user, false);
  updateOnlineCounter();
  if (state.screenSharing) syncScreenShareViewers();
}

function updateOnlineUser(user, updateCounter = true) {
  if (!user?.id) return;
  state.onlineUsers.set(user.id, user);
  const card = state.cards.get(user.id);
  if (card) {
    renderDeviceBadge(card.querySelector(".device-badge"), user.deviceType || "pc");
    setScreenShareCard(user.id, Boolean(user.screenSharing), state.screenPeers.get(user.id)?.stream);
  }
  if (updateCounter) updateOnlineCounter();
  updateKickAvailability();
  if (state.screenSharing && user.id !== state.id) {
    setTimeout(() => createScreenSenderPeer(user.id), 100);
  }
}

function updateOnlineCounter() {
  const count = new Set([...state.onlineUsers.values()].map((user) => user.username || user.id)).size;
  onlineCount.textContent = `${count} online`;
}

function renderDeviceBadge(target, deviceType) {
  const mobile = deviceType === "mobile";
  target.textContent = mobile ? "phone" : "pc";
  target.title = mobile ? "Mobile" : "PC";
  target.dataset.device = mobile ? "mobile" : "pc";
}

function updatePopups() {
  participants.hidden = !participants.children.length;
  participants.classList.toggle("has-screen-share", Boolean(participants.querySelector(".person.screen-sharing")));
  kickVotes.hidden = !kickVotes.children.length;
}

function renderAvatar(target, profile) {
  const cleanProfile = normalizeProfile(profile);
  target.textContent = "";

  if (cleanProfile.avatarUrl) {
    const isVideo = cleanProfile.avatarType.startsWith("video/");
    const media = document.createElement(isVideo ? "video" : "img");
    media.src = cleanProfile.avatarUrl;
    media.alt = "";
    if (isVideo) {
      media.autoplay = state.deviceType !== "mobile";
      media.loop = true;
      media.muted = true;
      media.playsInline = true;
      media.preload = state.deviceType === "mobile" ? "metadata" : "auto";
    }
    target.append(media);
    return;
  }

  target.textContent = initials(cleanProfile.name);
}

function removePeer(id, removeCard) {
  if (state.activeVolumePeerId === id) closeVolumeMenu();
  const peer = state.peers.get(id);
  if (peer) {
    clearTimeout(peer.reconnectTimer);
    clearTimeout(peer.negotiationTimer);
    peer.boostSource?.disconnect();
    peer.boostGain?.disconnect();
    peer.connection.close();
    peer.audio?.remove();
    state.peers.delete(id);
  }
  closeScreenPeer(id);

  const card = state.cards.get(id);
  if (card && removeCard) {
    card.remove();
    state.cards.delete(id);
    updatePopups();
  }
}

function cleanupPeerConnections() {
  stopCallHealthMonitor();
  for (const id of [...state.peers.keys()]) removePeer(id, false);
}

function updateScreenShareButton() {
  const pc = state.deviceType === "pc";
  shareScreenButton.hidden = !pc;
  shareScreenButton.disabled = !state.inCall || state.screenStarting;
  shareScreenButton.textContent = state.screenSharing ? "stop sharing" : "share screen";
  shareScreenButton.classList.toggle("blue", state.screenSharing);
  shareScreenButton.classList.toggle("small", !state.screenSharing);
  shareScreenButton.setAttribute("aria-pressed", String(state.screenSharing));
}

function activeScreenSharer() {
  return [...state.onlineUsers.values()]
    .find((user) => user.id !== state.id && user.inCall && user.screenSharing);
}

async function toggleScreenShare() {
  if (state.screenSharing) {
    await stopScreenShare(true);
    return;
  }
  if (state.deviceType !== "pc") return;
  if (!state.inCall) {
    showToast("join the call before sharing");
    return;
  }
  if (!navigator.mediaDevices?.getDisplayMedia) {
    showToast("screen sharing is not supported in this browser");
    return;
  }
  const activeSharer = activeScreenSharer();
  if (activeSharer) {
    showToast(`${activeSharer.profile?.name || activeSharer.username || "someone"} is already sharing`);
    return;
  }

  state.screenStarting = true;
  updateScreenShareButton();
  let displayStream = null;
  try {
    displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        frameRate: { ideal: 20, max: 20 }
      },
      audio: false
    });
    const track = displayStream.getVideoTracks()[0];
    if (!track) throw new Error("no screen was selected");
    if (!state.inCall) {
      displayStream.getTracks().forEach((item) => item.stop());
      return;
    }

    track.contentHint = "detail";
    await track.applyConstraints({
      width: { max: 1280 },
      height: { max: 720 },
      frameRate: { max: 20 }
    }).catch(() => {});

    state.screenStream = displayStream;
    state.screenTrack = track;
    state.screenSharing = true;
    track.addEventListener("ended", () => {
      if (state.screenTrack === track) stopScreenShare(true);
    }, { once: true });

    setScreenShareCard(state.id, true, displayStream);
    send({ type: "screen-share", enabled: true });
    setTimeout(() => {
      if (state.screenSharing) send({ type: "screen-share", enabled: true });
    }, 1500);
    setTimeout(() => {
      if (state.screenSharing) send({ type: "screen-share", enabled: true });
    }, 4000);

    await Promise.all(screenViewerIds().map((peerId) => createScreenSenderPeer(peerId, true)));

    showToast("screen sharing started");
  } catch (error) {
    displayStream?.getTracks().forEach((item) => item.stop());
    if (error?.name !== "NotAllowedError") {
      showToast(error?.message || "screen sharing failed");
    }
  } finally {
    state.screenStarting = false;
    updateScreenShareButton();
  }
}

async function stopScreenShare(notifyServer = true) {
  const wasSharing = state.screenSharing;
  const stream = state.screenStream;
  state.screenSharing = false;
  state.screenStream = null;
  state.screenTrack = null;

  closeAllScreenPeers();
  stream?.getTracks().forEach((track) => track.stop());
  setScreenShareCard(state.id, false);
  if (wasSharing && notifyServer && state.inCall) {
    send({ type: "screen-share", enabled: false });
    showToast("screen sharing stopped");
  }
  updateScreenShareButton();
}

async function tuneScreenSender(sender) {
  try {
    const params = sender.getParameters();
    if (!params.encodings || !params.encodings.length) params.encodings = [{}];
    params.encodings[0].maxBitrate = 1500000;
    params.encodings[0].maxFramerate = 20;
    params.degradationPreference = "maintain-resolution";
    await sender.setParameters(params);
  } catch {
  }
}

function preferScreenShareCodecs(screenPeer) {
  try {
    const transceiver = screenPeer.connection.getTransceivers()
      .find((item) => item.sender === screenPeer.sender);
    const codecs = RTCRtpSender.getCapabilities?.("video")?.codecs || [];
    if (!transceiver?.setCodecPreferences || !codecs.length) return;
    const rank = (codec) => {
      const type = String(codec.mimeType || "").toLowerCase();
      if (type === "video/vp8") return 0;
      if (type === "video/h264") return 1;
      if (type === "video/vp9") return 2;
      if (type === "video/av1") return 3;
      return 4;
    };
    transceiver.setCodecPreferences([...codecs].sort((left, right) => rank(left) - rank(right)));
  } catch {
  }
}

function createScreenPeerRecord(id, mode, screenId = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`) {
  const connection = new RTCPeerConnection(rtcConfig);
  const screenPeer = {
    id,
    mode,
    screenId,
    connection,
    sender: null,
    stream: null,
    pendingIce: [],
    remoteReady: false,
    lastFrameAt: 0,
    lastCurrentTime: 0,
    syncAttempts: 0,
    monitorTimer: null,
    connectTimer: null,
    frameCallbackActive: false
  };
  state.screenPeers.set(id, screenPeer);

  screenPeer.connectTimer = setTimeout(() => {
    if (connection.connectionState === "connected" || state.screenPeers.get(id) !== screenPeer) return;
    if (mode === "sender" && state.screenSharing) {
      createScreenSenderPeer(id, true);
    } else {
      requestScreenShareSync(screenPeer);
    }
  }, 12000);
  connection.addEventListener("connectionstatechange", () => {
    if (!state.screenPeers.has(id) || state.screenPeers.get(id) !== screenPeer) return;
    if (connection.connectionState === "connected") {
      clearTimeout(screenPeer.connectTimer);
      screenPeer.connectTimer = null;
      screenPeer.syncAttempts = 0;
      return;
    }
    if (["disconnected", "failed"].includes(connection.connectionState)) {
      if (mode === "sender" && state.screenSharing) {
        setTimeout(() => createScreenSenderPeer(id, true), 700);
      } else if (mode === "receiver") {
        requestScreenShareSync(screenPeer);
      }
    }
  });
  connection.addEventListener("track", (event) => {
    if (event.track.kind !== "video") return;
    screenPeer.stream = event.streams[0] || new MediaStream([event.track]);
    screenPeer.lastFrameAt = Date.now();
    screenPeer.syncAttempts = 0;
    const user = state.onlineUsers.get(id);
    if (user) {
      user.screenSharing = true;
      state.onlineUsers.set(id, user);
    }
    setScreenShareCard(id, true, screenPeer.stream);
    event.track.addEventListener("unmute", () => {
      screenPeer.lastFrameAt = Date.now();
      setScreenShareCard(id, true, screenPeer.stream);
    });
    event.track.addEventListener("ended", () => {
      if (state.onlineUsers.get(id)?.screenSharing) requestScreenShareSync(screenPeer);
    });
  });
  return screenPeer;
}

async function createScreenSenderPeer(peerId, recreate = false) {
  if (!state.screenSharing || state.screenTrack?.readyState !== "live" || peerId === state.id || !state.onlineUsers.has(peerId)) return;
  if (recreate) closeScreenPeer(peerId);
  const existing = state.screenPeers.get(peerId);
  if (existing?.mode === "sender" && existing.connection.connectionState !== "closed") return existing;

  const screenPeer = createScreenPeerRecord(peerId, "sender");
  try {
    screenPeer.sender = screenPeer.connection.addTrack(state.screenTrack, state.screenStream);
    preferScreenShareCodecs(screenPeer);
    await tuneScreenSender(screenPeer.sender);
    const offer = await screenPeer.connection.createOffer();
    await screenPeer.connection.setLocalDescription(offer);
    await waitForIceGatheringComplete(screenPeer.connection);
    send({
      type: "screen-offer",
      to: peerId,
      screenId: screenPeer.screenId,
      offer: screenPeer.connection.localDescription
    });
  } catch {
    closeScreenPeer(peerId);
    if (state.screenSharing) setTimeout(() => createScreenSenderPeer(peerId, true), 1000);
  }
  return screenPeer;
}

async function handleScreenOffer(message) {
  if (!state.token || !message.from || !message.offer) return;
  closeScreenPeer(message.from);
  const screenPeer = createScreenPeerRecord(message.from, "receiver", String(message.screenId || ""));
  try {
    await screenPeer.connection.setRemoteDescription(message.offer);
    screenPeer.remoteReady = true;
    await flushScreenIce(screenPeer);
    const answer = await screenPeer.connection.createAnswer();
    await screenPeer.connection.setLocalDescription(answer);
    await waitForIceGatheringComplete(screenPeer.connection);
    send({
      type: "screen-answer",
      to: message.from,
      screenId: screenPeer.screenId,
      answer: screenPeer.connection.localDescription
    });
  } catch {
    closeScreenPeer(message.from);
    const audioPeer = state.peers.get(message.from);
    if (audioPeer) requestScreenShareSync({ ...audioPeer, syncAttempts: 0 });
  }
}

function waitForIceGatheringComplete(connection, timeoutMs = 10000) {
  if (connection.iceGatheringState === "complete") return Promise.resolve();
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      connection.removeEventListener("icegatheringstatechange", check);
      resolve();
    };
    const check = () => {
      if (connection.iceGatheringState === "complete") finish();
    };
    const timer = setTimeout(finish, timeoutMs);
    connection.addEventListener("icegatheringstatechange", check);
  });
}

async function flushScreenIce(screenPeer) {
  while (screenPeer.pendingIce.length) {
    await screenPeer.connection.addIceCandidate(screenPeer.pendingIce.shift());
  }
}

function closeScreenPeer(id) {
  const screenPeer = state.screenPeers.get(id);
  if (!screenPeer) return;
  clearTimeout(screenPeer.monitorTimer);
  clearTimeout(screenPeer.connectTimer);
  screenPeer.frameCallbackActive = false;
  screenPeer.connection.close();
  state.screenPeers.delete(id);
}

function closeAllScreenPeers() {
  for (const id of [...state.screenPeers.keys()]) closeScreenPeer(id);
}

function screenViewerIds() {
  return [...state.onlineUsers.keys()].filter((id) => id && id !== state.id);
}

function syncScreenShareViewers() {
  if (!state.screenSharing) return;
  const viewers = new Set(screenViewerIds());
  for (const id of viewers) createScreenSenderPeer(id);
  for (const [id, screenPeer] of state.screenPeers) {
    if (screenPeer.mode === "sender" && !viewers.has(id)) closeScreenPeer(id);
  }
}

async function refreshScreenShareForPeer(peerId, attempt = 1) {
  if (!state.screenSharing || state.screenTrack?.readyState !== "live") return;
  if (!state.onlineUsers.has(peerId) || peerId === state.id) return;
  try {
    await createScreenSenderPeer(peerId, true);
  } catch {
    setTimeout(() => {
      if (state.screenSharing) refreshScreenShareForPeer(peerId, Number(attempt) + 1);
    }, 1200);
  }
}

function requestScreenShareSync(screenPeer) {
  if (!screenPeer || !state.token || !state.onlineUsers.get(screenPeer.id)?.screenSharing) return;
  screenPeer.syncAttempts = Math.min(5, (screenPeer.syncAttempts || 0) + 1);
  send({
    type: "screen-share-sync-request",
    to: screenPeer.id,
    attempt: screenPeer.syncAttempts
  });
  if (screenPeer.syncAttempts >= 3) {
    closeScreenPeer(screenPeer.id);
  }
}

function monitorRemoteScreen(id) {
  const screenPeer = state.screenPeers.get(id);
  const card = state.cards.get(id);
  const video = card?.querySelector(".screen-share-video");
  if (!screenPeer || screenPeer.mode !== "receiver" || !video || id === state.id) return;
  clearTimeout(screenPeer.monitorTimer);

  const markFrame = () => {
    if (screenPeer.frameCallbackActive && video.srcObject && state.onlineUsers.get(id)?.screenSharing) {
      screenPeer.lastFrameAt = Date.now();
      screenPeer.syncAttempts = 0;
      const status = card.querySelector(".screen-share-status");
      if (status) status.hidden = true;
      video.requestVideoFrameCallback?.(markFrame);
    } else {
      screenPeer.frameCallbackActive = false;
    }
  };
  if (video.requestVideoFrameCallback && !screenPeer.frameCallbackActive) {
    screenPeer.frameCallbackActive = true;
    video.requestVideoFrameCallback(markFrame);
  }

  const inspect = () => {
    if (!state.onlineUsers.get(id)?.screenSharing || !state.cards.has(id)) return;
    video.play().catch(() => {});
    const currentTime = Number(video.currentTime || 0);
    const advanced = currentTime > screenPeer.lastCurrentTime + 0.02;
    if (advanced || (video.readyState >= 2 && Date.now() - screenPeer.lastFrameAt < 5000)) {
      screenPeer.lastCurrentTime = currentTime;
      screenPeer.lastFrameAt = Date.now();
      screenPeer.syncAttempts = 0;
      const status = card.querySelector(".screen-share-status");
      if (status) status.hidden = true;
    } else {
      const status = card.querySelector(".screen-share-status");
      if (status) {
        status.hidden = false;
        status.textContent = screenPeer.syncAttempts ? "reconnecting screen..." : "connecting screen...";
      }
      requestScreenShareSync(screenPeer);
    }
    screenPeer.monitorTimer = setTimeout(inspect, screenPeer.syncAttempts ? 2500 : 5000);
  };
  screenPeer.monitorTimer = setTimeout(inspect, 3500);
}

function setScreenShareCard(id, enabled, stream = null) {
  const card = state.cards.get(id);
  if (!card) return;
  const view = card.querySelector(".screen-share-view");
  const video = card.querySelector(".screen-share-video");
  const status = card.querySelector(".screen-share-status");
  if (!view || !video) return;

  card.dataset.screenSharing = enabled ? "true" : "false";
  card.classList.toggle("screen-sharing", enabled);
  view.hidden = !enabled;
  if (stream && video.srcObject !== stream) {
    video.srcObject = stream;
    video.muted = true;
    video.play().then(() => {
      if (status && video.readyState >= 2) status.hidden = true;
    }).catch(() => {});
  }
  if (!enabled) {
    if (document.fullscreenElement === view) document.exitFullscreen().catch(() => {});
    view.classList.remove("screen-share-expanded");
    video.pause();
    video.srcObject = null;
    if (status) status.hidden = true;
    const screenPeer = state.screenPeers.get(id);
    if (screenPeer) {
      clearTimeout(screenPeer.monitorTimer);
      screenPeer.monitorTimer = null;
      screenPeer.frameCallbackActive = false;
      screenPeer.syncAttempts = 0;
      screenPeer.lastCurrentTime = 0;
    }
    const local = card.dataset.local === "true";
    if (card.dataset.muted === "true") {
      card.querySelector(".tag").textContent = "muted";
    } else if (local && !state.hasMic) {
      card.querySelector(".tag").textContent = "no mic";
    } else {
      card.querySelector(".tag").textContent = local ? "you" : "live";
    }
  } else {
    card.querySelector(".tag").textContent = "sharing screen";
    if (status) {
      status.hidden = id === state.id || Boolean(stream && video.readyState >= 2);
      status.textContent = "connecting screen...";
    }
    if (id !== state.id) monitorRemoteScreen(id);
  }
  updatePopups();
}

async function toggleScreenShareFullscreen(button) {
  const view = button.closest(".screen-share-view");
  if (!view) return;
  try {
    if (document.fullscreenElement === view) {
      await document.exitFullscreen();
    } else if (view.requestFullscreen) {
      await view.requestFullscreen();
    } else {
      view.classList.toggle("screen-share-expanded");
      updateScreenShareFullscreenButtons();
    }
  } catch {
    view.classList.toggle("screen-share-expanded");
    updateScreenShareFullscreenButtons();
  }
}

function updateScreenShareFullscreenButtons() {
  for (const view of document.querySelectorAll(".screen-share-view")) {
    if (document.fullscreenElement && document.fullscreenElement !== view) {
      view.classList.remove("screen-share-expanded");
    }
    const expanded = document.fullscreenElement === view || view.classList.contains("screen-share-expanded");
    const button = view.querySelector(".screen-share-enlarge");
    if (button) {
      button.textContent = expanded ? "shrink" : "enlarge";
      button.setAttribute("aria-label", expanded ? "shrink screen share" : "enlarge screen share");
    }
  }
}

function toggleMute() {
  if (!state.stream) {
    showToast("no mic to mute");
    return;
  }

  state.muted = !state.muted;
  for (const track of state.stream.getAudioTracks()) {
    track.enabled = !state.muted;
  }

  muteButton.setAttribute("aria-pressed", String(state.muted));
  muteButton.textContent = state.muted ? "unmute" : "mute";
  setMuted(state.id, state.muted);
  send({ type: "mute", muted: state.muted });
}

function togglePeerMute(id) {
  const peer = state.peers.get(id);
  const card = state.cards.get(id);
  if (!peer || !card) return;

  peer.remoteMuted = !peer.remoteMuted;
  applyPeerOutput(peer);
  card.classList.toggle("remote-muted", peer.remoteMuted);
  const button = card.querySelector(".peer-mute");
  if (button) button.textContent = peer.remoteMuted ? "unmute" : "mute";
  if (state.activeVolumePeerId === id) volumeMute.textContent = peer.remoteMuted ? "unmute" : "mute";
}

function startParticipantHold(event) {
  const card = event.target.closest(".person");
  if (!card || card.dataset.local === "true") return;
  const touch = event.touches[0];
  cancelParticipantHold();
  state.longPressOrigin = { x: touch.clientX, y: touch.clientY };
  state.longPressTimer = setTimeout(() => {
    navigator.vibrate?.(18);
    openVolumeMenu(card.dataset.id, touch.clientX, touch.clientY);
  }, 520);
}

function cancelParticipantHold(event) {
  if (event?.type === "touchmove" && state.longPressOrigin && event.touches[0]) {
    const touch = event.touches[0];
    const distance = Math.hypot(touch.clientX - state.longPressOrigin.x, touch.clientY - state.longPressOrigin.y);
    if (distance < 12) return;
  }
  clearTimeout(state.longPressTimer);
  state.longPressTimer = null;
  state.longPressOrigin = null;
}

function openVolumeMenu(id, x, y) {
  const peer = state.peers.get(id);
  const card = state.cards.get(id);
  if (!peer || !card) return;

  state.activeVolumePeerId = id;
  const user = state.onlineUsers.get(id);
  volumeTitle.textContent = card.querySelector(".name").textContent.replace(" (you)", "");
  volumeDevice.textContent = user?.deviceType === "mobile" ? "Phone caller" : "PC caller";
  renderAvatar(volumeAvatar, user?.profile || peer.profile);
  volumeSlider.value = String(Math.round((peer.volume ?? 1) * 100));
  volumeValue.textContent = `${volumeSlider.value}%`;
  volumeMute.textContent = peer.remoteMuted ? "unmute" : "mute";
  updateKickAvailability();
  volumeBackdrop.hidden = false;
  document.body.classList.add("volume-open");

  const menuWidth = 310;
  const menuHeight = 250;
  volumeMenu.style.left = `${Math.max(8, Math.min(x, window.innerWidth - menuWidth - 8))}px`;
  volumeMenu.style.top = `${Math.max(8, Math.min(y, window.innerHeight - menuHeight - 8))}px`;
}

function closeVolumeMenu() {
  volumeBackdrop.hidden = true;
  document.body.classList.remove("volume-open");
  state.activeVolumePeerId = "";
}

function bumpPeerVolume(delta) {
  const peer = state.peers.get(state.activeVolumePeerId);
  if (!peer) return;
  const next = Math.max(0, Math.min(2, (peer.volume ?? 1) + delta));
  volumeSlider.value = String(Math.round(next * 100));
  setPeerVolume(state.activeVolumePeerId, next);
}

function setPeerVolume(id, volume) {
  const peer = state.peers.get(id);
  if (!peer) return;
  peer.volume = Math.max(0, Math.min(2, volume));
  volumeSlider.value = String(Math.round(peer.volume * 100));
  volumeValue.textContent = `${volumeSlider.value}%`;
  if (peer.audio) {
    applyPeerOutput(peer);
  }
}

function applyPeerOutput(peer) {
  if (!peer?.audio) return;
  if (peer.volume > 1 && peer.audio.srcObject) {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) throw new Error("audio boost unavailable");
      state.remoteAudioContext ||= new AudioContextClass();
      if (state.remoteAudioContext.state === "suspended") state.remoteAudioContext.resume().catch(() => {});
      if (!peer.boostGain) {
        peer.boostSource = state.remoteAudioContext.createMediaStreamSource(peer.audio.srcObject);
        peer.boostGain = state.remoteAudioContext.createGain();
        peer.boostSource.connect(peer.boostGain).connect(state.remoteAudioContext.destination);
      }
      peer.boostGain.gain.value = peer.remoteMuted ? 0 : peer.volume;
      peer.audio.muted = true;
      return;
    } catch {
    }
  }

  peer.boostSource?.disconnect();
  peer.boostGain?.disconnect();
  peer.boostSource = null;
  peer.boostGain = null;
  peer.audio.volume = Math.min(1, peer.volume);
  peer.audio.muted = peer.remoteMuted || peer.volume === 0;
}

function openKickStartPanel() {
  const callSize = currentCallSize();
  if (callSize < 3) {
    showToast("vote kick needs at least 3 people in the call");
    closeVolumeMenu();
    return;
  }
  const id = state.activeVolumePeerId;
  const card = state.cards.get(id);
  if (!id || !card || card.dataset.local === "true") return;
  state.activeKickTargetId = id;
  kickTargetTitle.textContent = `Vote kick ${card.querySelector(".name").textContent.replace(" (you)", "")}`;
  kickReason.value = "";
  updateKickDurationOptions(callSize);
  kickStartPanel.hidden = false;
  closeVolumeMenu();
}

function closeKickStartPanel() {
  state.activeKickTargetId = "";
  kickStartPanel.hidden = true;
}

function startKickVote() {
  if (!state.activeKickTargetId) return;
  if (currentCallSize() < 3) {
    showToast("vote kick needs at least 3 people in the call");
    closeKickStartPanel();
    return;
  }
  send({
    type: "kick-vote-start",
    targetId: state.activeKickTargetId,
    durationMs: Number(kickDuration.value) || 60000,
    reason: kickReason.value
  });
  closeKickStartPanel();
}

function currentCallSize() {
  return [...state.onlineUsers.values()].filter((user) => user.inCall).length;
}

function kickDurationLimit(callSize = currentCallSize()) {
  return Math.min(180, Math.max(30, callSize * 10));
}

function updateKickDurationOptions(callSize = currentCallSize()) {
  const previous = Number(kickDuration.value) || 0;
  const maxSeconds = kickDurationLimit(callSize);
  kickDuration.textContent = "";
  for (let seconds = 30; seconds <= maxSeconds; seconds += 10) {
    const option = document.createElement("option");
    option.value = String(seconds * 1000);
    option.textContent = `${seconds} seconds`;
    kickDuration.append(option);
  }
  const selectedSeconds = Math.min(maxSeconds, Math.max(30, Math.round(previous / 10000) * 10 || maxSeconds));
  kickDuration.value = String(selectedSeconds * 1000);
}

function updateKickAvailability() {
  const enabled = currentCallSize() >= 3;
  voteKickButton.disabled = !enabled;
  voteKickButton.textContent = enabled ? "vote kick" : "need 3 callers";
  if (!enabled) closeKickStartPanel();
  else if (!kickStartPanel.hidden) updateKickDurationOptions();
}

function castKickVote(voteId) {
  send({ type: "kick-vote-cast", voteId });
}

function renderKickVotes() {
  kickVotes.textContent = "";
  for (const vote of state.kickVotes.values()) {
    const remainingMs = Math.max(0, Date.parse(vote.expiresAt || "") - Date.now());
    const seconds = Math.ceil(remainingMs / 1000);
    const progress = Math.min(100, Math.round((Number(vote.votes || 0) / Math.max(1, Number(vote.threshold || 1))) * 100));
    const card = document.createElement("div");
    card.className = "kick-card";

    const top = document.createElement("div");
    top.className = "kick-top";

    const avatar = document.createElement("div");
    avatar.className = "avatar kick-avatar";
    renderAvatar(avatar, vote.targetProfile || profileFromName(vote.targetName));

    const copy = document.createElement("div");
    copy.className = "kick-copy";

    const title = document.createElement("div");
    title.className = "kick-title";
    title.textContent = `Kick ${vote.targetName}`;

    const details = document.createElement("div");
    details.className = "kick-details";
    const durationSeconds = Math.ceil((vote.durationMs || 60000) / 1000);
    details.textContent = `${durationSeconds}s timeout - ${vote.reason || "No reason"} - started by ${vote.starterName || "caller"}`;

    copy.append(title, details);
    top.append(avatar, copy);

    const meter = document.createElement("div");
    meter.className = "kick-meter";
    const fill = document.createElement("span");
    fill.style.width = `${progress}%`;
    meter.append(fill);

    const status = document.createElement("div");
    status.className = "kick-status";
    const voters = vote.voterNames?.length ? `yes: ${vote.voterNames.join(", ")}` : "no votes yet";
    status.textContent = `${vote.votes}/${vote.threshold} votes needed - ${seconds}s left - ${voters}`;

    const button = document.createElement("button");
    button.className = "blue";
    button.type = "button";
    button.textContent = vote.voterIds?.includes(state.id) ? "voted" : "vote yes";
    button.disabled = vote.targetId === state.id || vote.voterIds?.includes(state.id);
    button.dataset.kickVoteId = vote.id;

    card.append(top, meter, status, button);
    kickVotes.append(card);
  }
  updatePopups();
  syncKickTicker();
}

function syncKickTicker() {
  if (state.kickVotes.size && !state.kickTicker) {
    state.kickTicker = setInterval(() => {
      for (const [id, vote] of state.kickVotes.entries()) {
        if (Date.parse(vote.expiresAt || "") <= Date.now()) state.kickVotes.delete(id);
      }
      renderKickVotes();
    }, 1000);
  }

  if (!state.kickVotes.size && state.kickTicker) {
    clearInterval(state.kickTicker);
    state.kickTicker = null;
  }
}

function handleCallKick(message) {
  state.callKickUntil = Date.parse(message.kickUntil || "") || Date.now() + 60000;
  leaveCall(false);
  notifyUser("Kicked from call", message.reason ? `reason: ${message.reason}` : "you can rejoin when the timer ends", "kick");
  updateJoinKickLock();
}

function updateJoinKickLock() {
  const remaining = state.callKickUntil - Date.now();
  if (remaining <= 0) {
    state.callKickUntil = 0;
    joinButton.disabled = false;
    joinButton.textContent = "Join call";
    return;
  }

  joinButton.disabled = true;
  joinButton.textContent = `kicked ${Math.ceil(remaining / 1000)}s`;
  setTimeout(updateJoinKickLock, 1000);
}

function leaveCall(showMessage = true) {
  state.autoRejoin = false;
  sendLeaveNow();
  resetLocalCall(showMessage);
}

function sendLeaveNow() {
  if (state.ws?.readyState === WebSocket.OPEN && state.inCall) send({ type: "leave" });
}

function resetLocalCall(showMessage = true) {
  stopScreenShare(false);
  state.stream?.getTracks().forEach((track) => track.stop());
  state.rawStream?.getTracks().forEach((track) => track.stop());
  state.stream = null;
  state.rawStream = null;
  state.hasMic = false;

  if (state.audioContext?.state !== "closed") state.audioContext?.close();
  if (state.remoteAudioContext?.state !== "closed") state.remoteAudioContext?.close();
  state.audioContext = null;
  state.remoteAudioContext = null;
  state.audioSource = null;
  state.audioDestination = null;
  state.analyser = null;
  stopAudioMeter();

  cleanupPeerConnections();
  removePeer(state.id, true);
  releaseWakeLock();
  state.kickVotes.clear();
  renderKickVotes();
  syncKickTicker();
  closeKickStartPanel();

  setupPanel.hidden = false;
  callControls.hidden = true;
  joinButton.disabled = false;
  state.inCall = false;
  state.muted = false;
  state.lastSpeaking = false;
  muteButton.setAttribute("aria-pressed", "false");
  muteButton.textContent = "mute";
  muteButton.disabled = false;
  updateScreenShareButton();
  micStatus.textContent = "mic not joined";
  micStatus.className = "mic-status";

  if (showMessage) showToast("left");
}

function createProcessedMicStream(rawStream) {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass || state.deviceType === "mobile") return rawStream;

    state.audioContext = new AudioContextClass({ sampleRate: 48000 });
    state.audioSource = state.audioContext.createMediaStreamSource(rawStream);

    const highpass = state.audioContext.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 90;
    highpass.Q.value = 0.7;

    const compressor = state.audioContext.createDynamicsCompressor();
    compressor.threshold.value = -32;
    compressor.knee.value = 18;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.004;
    compressor.release.value = 0.18;

    const lowpass = state.audioContext.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 12000;
    lowpass.Q.value = 0.7;

    const gain = state.audioContext.createGain();
    gain.gain.value = 1.04;

    state.analyser = state.audioContext.createAnalyser();
    state.analyser.fftSize = 256;
    state.analyser.smoothingTimeConstant = 0.82;
    state.audioDestination = state.audioContext.createMediaStreamDestination();

    state.audioSource
      .connect(highpass)
      .connect(compressor)
      .connect(lowpass)
      .connect(gain)
      .connect(state.analyser)
      .connect(state.audioDestination);

    const processedTrack = state.audioDestination.stream.getAudioTracks()[0];
    if (processedTrack) processedTrack.contentHint = "speech";

    return state.audioDestination.stream;
  } catch {
    return rawStream;
  }
}

function setupLocalAudioMeter() {
  stopAudioMeter();
  if (!state.analyser) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    state.audioContext = new AudioContextClass({ sampleRate: 48000 });
    const source = state.audioContext.createMediaStreamSource(state.stream);
    state.analyser = state.audioContext.createAnalyser();
    state.analyser.fftSize = 256;
    state.analyser.smoothingTimeConstant = 0.82;
    source.connect(state.analyser);
  }
  if (state.audioContext?.state === "suspended") {
    state.audioContext.resume().catch(() => {});
  }

  const samples = new Uint8Array(state.analyser.frequencyBinCount);
  const tick = () => {
    if (!state.stream || !state.analyser) {
      stopAudioMeter();
      return;
    }
    if (document.visibilityState !== "visible") {
      state.meterTimer = setTimeout(tick, 750);
      return;
    }
    state.analyser.getByteFrequencyData(samples);
    const average = samples.reduce((sum, value) => sum + value, 0) / samples.length;
    const speaking = average > 14 && !state.muted;
    const now = Date.now();
    setSpeaking(state.id, speaking);
    if (speaking !== state.lastSpeaking || now - state.lastSpeakingSentAt > 700) {
      state.lastSpeaking = speaking;
      state.lastSpeakingSentAt = now;
      send({ type: "speaking", speaking });
    }
    state.meterTimer = setTimeout(tick, state.deviceType === "mobile" ? 120 : 55);
  };

  tick();
}

function stopAudioMeter() {
  cancelAnimationFrame(state.meterFrame);
  state.meterFrame = null;
  clearTimeout(state.meterTimer);
  state.meterTimer = null;
}

async function flushIce(peer) {
  while (peer.pendingIce.length) {
    await peer.connection.addIceCandidate(peer.pendingIce.shift());
  }
}

function setSpeaking(id, speaking) {
  const card = state.cards.get(id);
  if (!card) return;

  card.classList.toggle("speaking", speaking);
  if (speaking) {
    card.querySelector(".tag").textContent = "talking";
  } else if (card.dataset.muted === "true") {
    card.querySelector(".tag").textContent = "muted";
  } else if (card.dataset.screenSharing === "true") {
    card.querySelector(".tag").textContent = "sharing screen";
  } else if (card.dataset.inCall === "true") {
    card.querySelector(".tag").textContent = card.dataset.local === "true" ? "you" : "live";
  } else {
    card.querySelector(".tag").textContent = "online";
  }
}

function setMuted(id, muted) {
  const card = state.cards.get(id);
  if (!card) return;
  const peer = state.peers.get(id);
  if (peer) peer.sendingMuted = muted;
  card.dataset.muted = muted ? "true" : "false";
  card.classList.toggle("muted", muted);
  card.querySelector(".tag").textContent = muted
    ? "muted"
    : card.dataset.screenSharing === "true"
      ? "sharing screen"
      : id === state.id ? "you" : "live";
}

function sendChat(event) {
  event.preventDefault();
  if (!state.chatEnabled) return;
  const text = chatInput.value.trim();
  if (!text) return;

  send({ type: "chat", text });
  chatInput.value = "";
}

async function uploadChatMedia() {
  if (!state.chatEnabled) return;
  const file = mediaFile.files[0];
  mediaFile.value = "";
  if (!file || state.mediaUploading) return;

  if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
    showToast("image or video only");
    return;
  }

  state.mediaUploading = true;
  mediaButton.disabled = true;
  mediaButton.textContent = "...";

  try {
    const form = new FormData();
    form.append("file", file);
    const response = await fetch(`/api/upload-media?clientId=${encodeURIComponent(state.id || state.username)}`, {
      method: "POST",
      headers: authHeaders(),
      body: form
    });
    const result = await response.json();
    if (response.status === 423) {
      showTimeout(result.timeoutUntil, result.remainingMs);
      return;
    }
    if (!response.ok) throw new Error(result.error || "upload failed");
    if (result.chat) addChatBubble(result.chat);
    showToast("media sent");
  } catch (error) {
    showToast(error.message || "upload failed");
  } finally {
    state.mediaUploading = false;
    mediaButton.disabled = !state.chatEnabled;
    mediaButton.textContent = "+";
  }
}

function toggleGifPanel() {
  if (!state.chatEnabled) return;
  gifPanel.hidden = !gifPanel.hidden;
  if (!gifPanel.hidden) {
    if (!gifGrid.children.length) renderGifEmpty("loading GIF setup...");
    refreshGifConfig();
  }
}

async function searchGifs(append = false) {
  if (state.gifLoading) return;
  const query = gifSearch.value.trim() || "reaction";
  if (!append) {
    state.gifQuery = query;
    state.gifOffset = 0;
    state.gifHasMore = true;
    gifGrid.textContent = "";
  } else if (!state.gifHasMore) {
    return;
  }

  state.gifLoading = true;
  gifSearchButton.disabled = true;
  gifSearchButton.textContent = "wait";
  gifNote.textContent = append ? "loading more..." : "searching...";

  try {
    const key = await getGiphyApiKey();
    if (!key) throw new Error("GIPHY key is not active on this service yet. Redeploy or restart Render after adding it.");
    const endpoint = new URL("https://api.giphy.com/v1/gifs/search");
    endpoint.searchParams.set("api_key", key);
    endpoint.searchParams.set("q", state.gifQuery);
    endpoint.searchParams.set("limit", "24");
    endpoint.searchParams.set("offset", String(state.gifOffset));
    endpoint.searchParams.set("rating", "pg");
    endpoint.searchParams.set("bundle", "messaging_non_clips");
    const response = await fetch(endpoint);
    const result = await response.json();
    if (!response.ok) throw new Error(result.meta?.msg || "gif search failed");
    const items = giphyItems(result.data || []);
    state.gifOffset += items.length;
    state.gifHasMore = items.length > 0 && state.gifOffset < (result.pagination?.total_count || state.gifOffset + 1);
    renderGifResults(items, "giphy", append);
  } catch (error) {
    if (append) gifNote.textContent = error.message || "Could not load more GIFs.";
    else renderGifEmpty(error.message || "GIF search needs an API key.");
  } finally {
    state.gifLoading = false;
    gifSearchButton.disabled = !state.chatEnabled;
    gifSearchButton.textContent = "search";
  }
}

async function getGiphyApiKey() {
  if (state.giphyApiKey) return state.giphyApiKey;
  const response = await fetch(`/api/gif-config?t=${Date.now()}`, { headers: siteHeaders() });
  const result = await response.json();
  if (response.status === 423) {
    showTimeout(result.timeoutUntil, result.remainingMs);
    return "";
  }
  if (!response.ok) throw new Error(result.error || "gif config failed");
  state.giphyApiKey = result.giphyApiKey || "";
  return state.giphyApiKey;
}

async function refreshGifConfig() {
  try {
    const key = await getGiphyApiKey();
    if (key) {
      gifNote.textContent = "GIPHY connected. Search and scroll GIFs.";
      if (!gifGrid.querySelector("[data-gif-url]")) searchGifs(false);
      return;
    }
    renderGifEmpty("GIPHY key is not active yet. Redeploy or restart Render.");
  } catch (error) {
    renderGifEmpty(error.message || "GIF setup failed.");
  }
}

function giphyItems(items) {
  return items.map((item) => {
    const images = item.images || {};
    return {
      id: String(item.id || ""),
      title: String(item.title || "gif").slice(0, 80),
      url: images.fixed_height?.webp || images.fixed_height?.url || images.downsized?.url || images.original?.url || "",
      previewUrl: images.fixed_width_small?.webp || images.fixed_width_small?.url || images.fixed_height_small?.webp || images.preview_gif?.url || "",
      pageUrl: item.url || ""
    };
  }).filter((item) => item.url.startsWith("https://"));
}

function renderGifResults(items, provider, append = false) {
  if (!append) gifGrid.textContent = "";
  if (!items.length) {
    if (!append) renderGifEmpty("No GIFs found. Try another search.");
    else gifNote.textContent = "No more GIFs.";
    return;
  }

  for (const item of items) {
    const button = document.createElement("button");
    button.className = "gif-item";
    button.type = "button";
    button.dataset.gifUrl = item.url;
    button.dataset.gifPreview = item.previewUrl || item.url;
    button.dataset.gifTitle = item.title || "gif";
    button.dataset.gifProvider = provider;

    const image = document.createElement("img");
    image.src = item.previewUrl || item.url;
    image.alt = item.title || "gif";
    image.loading = "lazy";
    image.decoding = "async";
    button.append(image);
    gifGrid.append(button);
  }

  gifNote.textContent = provider === "giphy" ? (state.gifHasMore ? "Powered by GIPHY - scroll for more" : "Powered by GIPHY - end") : "";
}

function renderGifEmpty(note = "") {
  gifGrid.textContent = "";
  const empty = document.createElement("div");
  empty.className = "gif-empty";
  empty.textContent = "No GIFs";
  gifGrid.append(empty);
  gifNote.textContent = note;
}

async function sendGifItem(item) {
  if (!state.chatEnabled) return;
  if (state.mediaUploading) return;
  if (!item.dataset.gifUrl) return;
  const body = {
    kind: "gif",
    mediaUrl: item.dataset.gifUrl,
    previewUrl: item.dataset.gifPreview || item.dataset.gifUrl,
    title: item.dataset.gifTitle || "gif",
    provider: item.dataset.gifProvider || "giphy"
  };

  state.mediaUploading = true;
  try {
    const response = await fetch(`/api/send-gif?clientId=${encodeURIComponent(state.id || state.username)}`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(body)
    });
    const result = await response.json();
    if (response.status === 423) {
      showTimeout(result.timeoutUntil, result.remainingMs);
      return;
    }
    if (!response.ok) throw new Error(result.error || "send failed");
    if (result.chat) addChatBubble(result.chat);
    playNoticeSound("chat");
    gifPanel.hidden = true;
  } catch (error) {
    showToast(error.message || "send failed");
  } finally {
    state.mediaUploading = false;
  }
}

function addChatBubble(message) {
  if (message.id && state.chatIds.has(message.id)) return;
  const age = message.createdAt ? Date.now() - Date.parse(message.createdAt) : 0;
  const ttl = ["media", "gif"].includes(message.kind) ? 12 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  if (age > ttl) return;
  if (message.id) state.chatIds.add(message.id);

  const mine = message.from === state.id || Boolean(message.username && message.username === state.username);
  const followBottom = mine || isChatNearBottom();
  const row = document.createElement("div");
  row.dataset.messageId = message.id || "";
  const richMessage = ["media", "gif"].includes(message.kind);
  row.className = `chat-entry${mine ? " mine" : ""}${richMessage ? " media-entry" : ""}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar chat-avatar";
  renderAvatar(avatar, message.profile || profileFromName(message.name));

  const bubble = document.createElement("div");
  bubble.className = `bubble${mine ? " mine" : ""}${richMessage ? " media-bubble" : ""}`;

  const name = document.createElement("span");
  name.className = "bubble-name";
  name.textContent = message.profile?.name || message.name || "caller";
  bubble.append(name);

  if ((message.kind === "media" || message.kind === "gif") && message.mediaUrl) {
    appendChatMedia(bubble, message);
  } else {
    appendLinkedText(bubble, message.text || "");
  }
  row.append(avatar, bubble);
  chatLog.append(row);
  trimChatDisplay();
  if (followBottom) {
    scrollChatToBottom();
    const media = row.querySelector(".chat-media");
    if (media) {
      const eventName = media.tagName === "VIDEO" ? "loadedmetadata" : "load";
      media.addEventListener(eventName, scrollChatToBottom, { once: true });
    }
  }
}

function trimChatDisplay() {
  while (chatLog.children.length > 25) {
    const oldest = chatLog.firstElementChild;
    const id = oldest?.dataset.messageId;
    if (id) state.chatIds.delete(id);
    oldest?.remove();
  }
  updateAdminChatCount(chatLog.children.length);
}

function isChatNearBottom() {
  return chatLog.scrollHeight - chatLog.scrollTop - chatLog.clientHeight < 120;
}

function scrollChatToBottom() {
  chatLog.scrollTop = chatLog.scrollHeight;
}

function appendChatMedia(parent, message) {
  const isVideo = String(message.mediaType || "").startsWith("video/");
  const media = document.createElement(isVideo ? "video" : "img");
  media.src = message.previewUrl || message.mediaUrl;
  media.className = "chat-media";
  if (isVideo) {
    media.controls = true;
    media.playsInline = true;
    media.preload = "metadata";
  } else {
    media.alt = message.title || "uploaded image";
    media.loading = "lazy";
    media.decoding = "async";
  }

  parent.append(media);
}

function appendLinkedText(parent, text) {
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  let lastIndex = 0;

  for (const match of text.matchAll(urlPattern)) {
    if (match.index > lastIndex) {
      parent.append(document.createTextNode(text.slice(lastIndex, match.index)));
    }

    const link = document.createElement("a");
    link.href = match[0];
    link.textContent = match[0];
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    parent.append(link);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parent.append(document.createTextNode(text.slice(lastIndex)));
  }
}

function send(message) {
  if (state.ws?.readyState === WebSocket.OPEN) {
    state.ws.send(JSON.stringify(message));
  }
}

function setConnection(text, online) {
  connectionState.textContent = text;
  connectionState.classList.toggle("online", online);
}

function wsBase() {
  return `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}`;
}

function httpBase() {
  return location.origin;
}

function improveAudioSdp(sdp) {
  if (!sdp) return sdp;
  const opusPayload = /a=rtpmap:(\d+) opus\/48000/i.exec(sdp)?.[1];
  if (!opusPayload) return sdp;

  const fmtpPattern = new RegExp(`a=fmtp:${opusPayload} ([^\\r\\n]+)`);
  if (fmtpPattern.test(sdp)) {
    sdp = sdp.replace(fmtpPattern, (line, params) => {
      const nextParams = new Map();
      for (const item of params.split(";").map((value) => value.trim()).filter(Boolean)) {
        const [key, value = ""] = item.split("=");
        nextParams.set(key, value);
      }
      nextParams.set("useinbandfec", "1");
      nextParams.set("usedtx", "1");
      nextParams.set("maxaveragebitrate", state.deviceType === "mobile" ? "64000" : "96000");
      nextParams.set("stereo", "0");
      nextParams.set("sprop-stereo", "0");
      nextParams.delete("cbr");
      return `a=fmtp:${opusPayload} ${[...nextParams].map(([key, value]) => `${key}=${value}`).join(";")}`;
    });
  } else {
    sdp = sdp.replace(
      new RegExp(`a=rtpmap:${opusPayload} opus/48000/2\\r?\\n`, "i"),
      (line) => `${line}a=fmtp:${opusPayload} useinbandfec=1;usedtx=1;maxaveragebitrate=${state.deviceType === "mobile" ? "64000" : "96000"};stereo=0;sprop-stereo=0\r\n`
    );
  }

  if (!/^a=ptime:/m.test(sdp)) {
    sdp = sdp.replace(/^m=audio .+$/m, (line) => `${line}\r\na=ptime:20`);
  }
  if (!/^a=maxptime:/m.test(sdp)) {
    sdp = sdp.replace(/^a=ptime:20$/m, (line) => `${line}\r\na=maxptime:20`);
  }

  return sdp;
}

async function tuneAudioSender(sender, maxBitrate = state.deviceType === "mobile" ? 64000 : 96000) {
  try {
    const params = sender.getParameters();
    if (!params.encodings || params.encodings.length === 0) params.encodings = [{}];
    params.encodings[0].maxBitrate = maxBitrate;
    params.encodings[0].priority = "high";
    params.encodings[0].networkPriority = "high";
    await sender.setParameters(params);
  } catch {
  }
}

function playJoinSound() {
  playNoticeSound("join");
}

function playNoticeSound(kind = "soft") {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const context = state.notificationContext || new AudioContextClass();
    state.notificationContext = context;
    if (context.state === "suspended") context.resume().catch(() => {});

    const now = context.currentTime;
    const patterns = {
      join: [{ f: 620, t: 0, d: 0.12 }, { f: 880, t: 0.1, d: 0.16 }],
      leave: [{ f: 520, t: 0, d: 0.12 }, { f: 360, t: 0.1, d: 0.18 }],
      chat: [{ f: 760, t: 0, d: 0.08 }, { f: 980, t: 0.08, d: 0.1 }],
      vote: [{ f: 540, t: 0, d: 0.1 }, { f: 720, t: 0.09, d: 0.1 }, { f: 540, t: 0.18, d: 0.12 }],
      kick: [{ f: 220, t: 0, d: 0.18 }, { f: 180, t: 0.16, d: 0.24 }],
      error: [{ f: 180, t: 0, d: 0.12 }, { f: 160, t: 0.1, d: 0.18 }],
      soft: [{ f: 680, t: 0, d: 0.12 }]
    };

    for (const tone of patterns[kind] || patterns.soft) {
      const gain = context.createGain();
      gain.gain.setValueAtTime(0.0001, now + tone.t);
      gain.gain.exponentialRampToValueAtTime(kind === "kick" ? 0.08 : 0.11, now + tone.t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + tone.t + tone.d);
      gain.connect(context.destination);

      const oscillator = context.createOscillator();
      oscillator.type = kind === "kick" || kind === "error" ? "triangle" : "sine";
      oscillator.frequency.setValueAtTime(tone.f, now + tone.t);
      oscillator.connect(gain);
      oscillator.start(now + tone.t);
      oscillator.stop(now + tone.t + tone.d + 0.02);
    }
  } catch {
  }
}

async function notifyUser(title, body = "", sound = "soft", options = {}) {
  playNoticeSound(sound);
  showToast(body ? `${title}: ${body}` : title);
  flashTitle(title);

  const shouldShowSystem = options.forceSystem || document.visibilityState !== "visible";
  if (!shouldShowSystem || !("Notification" in window) || Notification.permission !== "granted") return;

  try {
    const registration = state.notificationRegistration || await navigator.serviceWorker?.ready;
    if (registration?.showNotification) {
      await registration.showNotification(title, {
        body,
        tag: options.tag || "aba-call",
        renotify: true,
        silent: false,
        icon: "/icon.svg",
        badge: "/icon.svg",
        data: { url: location.href }
      });
      return;
    }
  } catch {
  }

  try {
    new Notification(title, { body, silent: false });
  } catch {
  }
}

function warmNotifications() {
  if (!window.isSecureContext || !("Notification" in window)) return;
  if (Notification.permission === "granted") {
    enablePushNotifications();
    return;
  }
  if (state.notificationWanted || Notification.permission !== "default") return;
  state.notificationWanted = true;
  Notification.requestPermission()
    .then((permission) => {
      if (permission === "granted") enablePushNotifications(true);
    })
    .catch(() => {});
}

async function registerNotificationWorker() {
  if (!("serviceWorker" in navigator) || !window.isSecureContext) return;
  try {
    state.notificationRegistration = await navigator.serviceWorker.register("/sw.js");
  } catch {
    state.notificationRegistration = null;
  }
}

async function enablePushNotifications(showTest = false) {
  if (state.pushSubscribing || !state.token || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
  state.pushSubscribing = true;
  try {
    const configResponse = await fetch("/api/push-config", { headers: siteHeaders() });
    const config = await configResponse.json();
    if (!configResponse.ok || !config.enabled || !config.publicKey) return;

    const registration = state.notificationRegistration || await navigator.serviceWorker.ready;
    state.notificationRegistration = registration;
    const applicationServerKey = urlBase64ToUint8Array(config.publicKey);
    let existing = await registration.pushManager.getSubscription();
    if (existing && !pushKeyMatches(existing.options?.applicationServerKey, applicationServerKey)) {
      await existing.unsubscribe();
      existing = null;
    }
    const subscription = existing || await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey
    });

    await fetch("/api/push-subscribe", {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ subscription, deviceId: state.deviceId })
    });

    if (showTest) {
      await registration.showNotification("Notifications ready", {
        body: "Call alerts are enabled on this device.",
        tag: "aba-notification-test",
        icon: "/icon.svg",
        badge: "/icon.svg",
        data: { url: location.href }
      });
    }
  } catch {
  } finally {
    state.pushSubscribing = false;
  }
}

function urlBase64ToUint8Array(value) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = `${value}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) output[index] = raw.charCodeAt(index);
  return output;
}

function pushKeyMatches(existingKey, nextKey) {
  if (!existingKey) return false;
  const current = new Uint8Array(existingKey);
  if (current.length !== nextKey.length) return false;
  return current.every((value, index) => value === nextKey[index]);
}

function flashTitle(title) {
  clearTimeout(state.titleTimer);
  if (document.visibilityState === "visible") return;
  document.title = title;
  state.titleTimer = setTimeout(() => {
    document.title = state.originalTitle;
  }, 2400);
}

async function requestWakeLock() {
  try {
    if (!("wakeLock" in navigator) || state.wakeLock) return;
    state.wakeLock = await navigator.wakeLock.request("screen");
    state.wakeLock.addEventListener("release", () => {
      state.wakeLock = null;
    });
  } catch {
    state.wakeLock = null;
  }
}

function releaseWakeLock() {
  try {
    state.wakeLock?.release();
  } catch {
  }
  state.wakeLock = null;
}

function insecurePhoneMessage() {
  if (isInsecureLanPhone()) {
    return "phone mic needs HTTPS";
  }
  return "mic unavailable";
}

function isInsecureLanPhone() {
  return !window.isSecureContext && !["localhost", "127.0.0.1", "::1"].includes(location.hostname);
}

let toastTimer;
function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function publicProfile() {
  return normalizeProfile(state.profile);
}

function normalizeProfile(profile) {
  return {
    name: sanitizeName(profile?.name) || "caller",
    status: sanitizeStatus(profile?.status),
    avatarUrl: typeof profile?.avatarUrl === "string" ? profile.avatarUrl : "",
    avatarType: typeof profile?.avatarType === "string" ? profile.avatarType : ""
  };
}

function profileFromName(name) {
  return {
    name: sanitizeName(name) || "caller",
    status: "online",
    avatarUrl: "",
    avatarType: ""
  };
}

function sanitizeName(name) {
  return String(name || "").trim().slice(0, 28);
}

function sanitizeStatus(status) {
  return String(status || "online").trim().slice(0, 40) || "online";
}


function initials(name) {
  return (sanitizeName(name) || "caller")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "C";
}
