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
const accountList = $("#accountList");
const securityList = $("#securityList");
const profilePreview = $("#profilePreview");
const profileName = $("#profileName");
const profileFile = $("#profileFile");
const saveProfileButton = $("#saveProfileButton");
const joinButton = $("#joinButton");
const leaveButton = $("#leaveButton");
const muteButton = $("#muteButton");
const setupPanel = $("#setupPanel");
const callControls = $("#callControls");
const participants = $("#participants");
const connectionState = $("#connectionState");
const micStatus = $("#micStatus");
const chatLog = $("#chatLog");
const chatForm = $("#chatForm");
const chatInput = $("#chatInput");
const mediaButton = $("#mediaButton");
const mediaFile = $("#mediaFile");
const gifButton = $("#gifButton");
const gifPanel = $("#gifPanel");
const gifSearch = $("#gifSearch");
const gifSearchButton = $("#gifSearchButton");
const gifGrid = $("#gifGrid");
const gifNote = $("#gifNote");
const volumeMenu = $("#volumeMenu");
const volumeTitle = $("#volumeTitle");
const volumeSlider = $("#volumeSlider");
const volumeDown = $("#volumeDown");
const volumeUp = $("#volumeUp");
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
  ws: null,
  stream: null,
  rawStream: null,
  audioContext: null,
  analyser: null,
  audioSource: null,
  audioDestination: null,
  meterFrame: null,
  inCall: false,
  muted: false,
  hasMic: false,
  lastSpeaking: false,
  lastSpeakingSentAt: 0,
  activeVolumePeerId: "",
  activeKickTargetId: "",
  longPressTimer: null,
  mediaUploading: false,
  gifLoading: false,
  giphyApiKey: null,
  gifQuery: "reaction",
  gifOffset: 0,
  gifHasMore: true,
  notificationContext: null,
  notificationWanted: false,
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
  cards: new Map(),
  chatIds: new Set(),
  originalTitle: document.title,
  titleTimer: null
};

const rtcConfig = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

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
  }
});
logoutButton.addEventListener("click", logout);
saveProfileButton.addEventListener("click", saveProfile);
joinButton.addEventListener("click", joinCall);
leaveButton.addEventListener("click", () => leaveCall());
muteButton.addEventListener("click", toggleMute);
participants.addEventListener("click", (event) => {
  const button = event.target.closest(".peer-mute");
  if (button) togglePeerMute(button.dataset.id);
});
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
voteKickButton.addEventListener("click", openKickStartPanel);
kickStartButton.addEventListener("click", startKickVote);
kickCancelButton.addEventListener("click", closeKickStartPanel);
kickVotes.addEventListener("click", (event) => {
  const button = event.target.closest("[data-kick-vote-id]");
  if (button) castKickVote(button.dataset.kickVoteId);
});
document.addEventListener("click", (event) => {
  if (!volumeMenu.hidden && !volumeMenu.contains(event.target)) closeVolumeMenu();
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && state.inCall) requestWakeLock();
});
window.addEventListener("resize", closeVolumeMenu);
window.addEventListener("beforeunload", () => {
  sendLeaveNow();
  if (state.ws?.readyState === WebSocket.OPEN) state.ws.close();
});
window.addEventListener("pagehide", () => {
  sendLeaveNow();
  if (state.ws?.readyState === WebSocket.OPEN) state.ws.close();
});

boot();

async function boot() {
  localStorage.removeItem("callroom.profile");
  localStorage.removeItem("callroom.server");
  localStorage.removeItem("callroom.ui.v1");
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

function continueAfterDevice() {
  deviceScreen.hidden = true;
  timeoutScreen.hidden = true;
  try {
    const saved = JSON.parse(localStorage.getItem(AUTH_KEY) || "null");
    if (saved?.token && saved?.profile) {
      applyAuth(saved);
      showCallScreen();
      connectPresence();
      return;
    }
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
  document.body.dataset.layout = device === "pc" ? "pc" : "mobile";
  pcLayoutButton.classList.toggle("blue", device === "pc");
  pcLayoutButton.classList.toggle("plain", device !== "pc");
  mobileLayoutButton.classList.toggle("blue", device === "mobile");
  mobileLayoutButton.classList.toggle("plain", device !== "mobile");
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
}

function connectPresence() {
  if (state.ws && state.ws.readyState !== WebSocket.CLOSED) return;

  state.ws = new WebSocket(wsBase());

  state.ws.addEventListener("open", () => {
    setConnection("online", true);
    send({ type: "presence", token: state.token, siteToken: state.siteToken, deviceId: state.deviceId });
    startHeartbeat();
  });

  state.ws.addEventListener("message", async (event) => {
    await handleSignal(JSON.parse(event.data));
  });

  state.ws.addEventListener("close", () => {
    setConnection("offline", false);
    stopHeartbeat();
    cleanupPeerConnections();
  });

  state.ws.addEventListener("error", () => {
    showToast("server not reachable");
  });
}

function startHeartbeat() {
  stopHeartbeat();
  state.heartbeatTimer = setInterval(() => {
    send({ type: "ping" });
  }, 10000);
}

function stopHeartbeat() {
  clearInterval(state.heartbeatTimer);
  state.heartbeatTimer = null;
}

function logout() {
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
  if (state.callKickUntil > Date.now()) {
    updateJoinKickLock();
    return;
  }
  joinButton.disabled = true;
  micStatus.textContent = "checking mic";
  micStatus.className = "mic-status";

  if (!state.ws || state.ws.readyState === WebSocket.CLOSED) connectPresence();
  await waitForSocket();
  await requestMicrophone();
  send({
    type: "join",
    room: "main",
    name: state.profile.name,
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
    return;
  }

  if (message.type === "pong") {
    return;
  }

  if (message.type === "presence-list") {
    state.id = message.self;
    syncParticipants(message.users || []);
    return;
  }

  if (message.type === "presence-sync") {
    syncParticipants(message.users || []);
    return;
  }

  if (message.type === "presence-update") {
    const user = message.user;
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
    removePeer(message.id, true);
    playNoticeSound("leave");
    return;
  }

  if (message.type === "joined") {
    state.id = message.id;
    state.inCall = true;
    requestWakeLock();
    setupPanel.hidden = true;
    callControls.hidden = false;
    renderParticipant(state.id, publicProfile(), true, true);
    muteButton.disabled = !state.hasMic;
    muteButton.textContent = state.hasMic ? "mute" : "no mic";

    for (const peer of message.peers) {
      await createPeer(peer, true);
    }
    return;
  }

  if (message.type === "peer-joined") {
    renderParticipant(message.peer.id, message.peer.profile, false, true);
    playJoinSound();
    await createPeer(message.peer, false);
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
      profile: message.profile || profileFromName(message.name)
    });
    await peer.connection.setRemoteDescription(message.offer);
    peer.remoteReady = true;
    await flushIce(peer);
    const answer = await peer.connection.createAnswer();
    answer.sdp = improveAudioSdp(answer.sdp);
    await peer.connection.setLocalDescription(answer);
    send({ type: "answer", to: message.from, answer });
    return;
  }

  if (message.type === "answer") {
    const peer = state.peers.get(message.from);
    if (peer) {
      await peer.connection.setRemoteDescription(message.answer);
      peer.remoteReady = true;
      await flushIce(peer);
    }
    return;
  }

  if (message.type === "ice") {
    const peer = state.peers.get(message.from);
    if (peer && message.candidate) {
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

  if (!initiator) return;

  const offer = await peer.connection.createOffer();
  offer.sdp = improveAudioSdp(offer.sdp);
  await peer.connection.setLocalDescription(offer);
  send({
    type: "offer",
    to: peerInfo.id,
    offer,
    profile: publicProfile()
  });
}

async function restartPeerIce(peer) {
  if (!peer || peer.connection.connectionState === "closed") return;
  try {
    peer.connection.restartIce?.();
    const offer = await peer.connection.createOffer({ iceRestart: true });
    offer.sdp = improveAudioSdp(offer.sdp);
    await peer.connection.setLocalDescription(offer);
    send({
      type: "offer",
      to: peer.id,
      offer,
      profile: publicProfile()
    });
  } catch {
  }
}

async function ensurePeer(peerInfo) {
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
    pendingIce: [],
    remoteReady: false,
    reconnectTimer: null
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
      send({ type: "ice", to: peerInfo.id, candidate: event.candidate });
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
  });

  connection.addEventListener("connectionstatechange", () => {
    const card = state.cards.get(peerInfo.id);
    if (card) card.dataset.connection = connection.connectionState;
    if (connection.connectionState === "connected") {
      clearTimeout(peer.reconnectTimer);
      peer.reconnectTimer = null;
    }
    if (connection.connectionState === "disconnected") {
      clearTimeout(peer.reconnectTimer);
      peer.reconnectTimer = setTimeout(() => restartPeerIce(peer), 1800);
    }
    if (["failed", "closed"].includes(connection.connectionState)) {
      clearTimeout(peer.reconnectTimer);
      removePeer(peerInfo.id, false);
    }
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
      <div class="name"></div>
    </div>
    <div class="tag"></div>
    <button class="small peer-mute" type="button">mute</button>
  `;
  participants.append(card);
  state.cards.set(id, card);
  updateParticipant(id, profile, local, inCall);
}

function updateParticipant(id, profile, local, inCall) {
  const card = state.cards.get(id);
  if (!card) return;

  const cleanProfile = normalizeProfile(profile);
  card.dataset.local = local ? "true" : "false";
  card.dataset.inCall = inCall ? "true" : "false";
  renderAvatar(card.querySelector(".avatar"), cleanProfile);
  card.querySelector(".name").textContent = local ? `${cleanProfile.name} (you)` : cleanProfile.name;
  card.querySelector(".tag").textContent = inCall ? (local ? "you" : "live") : "";
  const peerMute = card.querySelector(".peer-mute");
  peerMute.hidden = local || !state.inCall;
  peerMute.dataset.id = id;
  card.classList.toggle("in-call", inCall);
  card.classList.toggle("no-mic", local && inCall && !state.hasMic);
  if (local && inCall && !state.hasMic) card.querySelector(".tag").textContent = "no mic";
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
      media.autoplay = true;
      media.loop = true;
      media.muted = true;
      media.playsInline = true;
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
    peer.connection.close();
    peer.audio?.remove();
    state.peers.delete(id);
  }

  const card = state.cards.get(id);
  if (card && removeCard) {
    card.remove();
    state.cards.delete(id);
  }
}

function cleanupPeerConnections() {
  for (const id of [...state.peers.keys()]) removePeer(id, false);
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
  if (peer.audio) peer.audio.muted = peer.remoteMuted;
  card.classList.toggle("remote-muted", peer.remoteMuted);
  const button = card.querySelector(".peer-mute");
  if (button) button.textContent = peer.remoteMuted ? "unmute" : "mute";
}

function startParticipantHold(event) {
  const card = event.target.closest(".person");
  if (!card || card.dataset.local === "true") return;
  const touch = event.touches[0];
  cancelParticipantHold();
  state.longPressTimer = setTimeout(() => {
    openVolumeMenu(card.dataset.id, touch.clientX, touch.clientY);
  }, 520);
}

function cancelParticipantHold() {
  clearTimeout(state.longPressTimer);
  state.longPressTimer = null;
}

function openVolumeMenu(id, x, y) {
  const peer = state.peers.get(id);
  const card = state.cards.get(id);
  if (!peer || !card) return;

  state.activeVolumePeerId = id;
  volumeTitle.textContent = `${card.querySelector(".name").textContent.replace(" (you)", "")} volume`;
  volumeSlider.value = String(Math.round((peer.volume ?? 1) * 100));
  volumeMenu.hidden = false;

  const menuWidth = 230;
  const menuHeight = 96;
  volumeMenu.style.left = `${Math.min(x, window.innerWidth - menuWidth - 8)}px`;
  volumeMenu.style.top = `${Math.min(y, window.innerHeight - menuHeight - 8)}px`;
}

function closeVolumeMenu() {
  volumeMenu.hidden = true;
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
  if (peer.audio) {
    peer.audio.volume = peer.volume;
    peer.audio.muted = peer.remoteMuted || peer.volume === 0;
  }
}

function openKickStartPanel() {
  const id = state.activeVolumePeerId;
  const card = state.cards.get(id);
  if (!id || !card || card.dataset.local === "true") return;
  state.activeKickTargetId = id;
  kickTargetTitle.textContent = `Vote kick ${card.querySelector(".name").textContent.replace(" (you)", "")}`;
  kickReason.value = "";
  kickDuration.value = "60000";
  kickStartPanel.hidden = false;
  closeVolumeMenu();
}

function closeKickStartPanel() {
  state.activeKickTargetId = "";
  kickStartPanel.hidden = true;
}

function startKickVote() {
  if (!state.activeKickTargetId) return;
  send({
    type: "kick-vote-start",
    targetId: state.activeKickTargetId,
    durationMs: Number(kickDuration.value) || 60000,
    reason: kickReason.value
  });
  closeKickStartPanel();
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
  sendLeaveNow();
  resetLocalCall(showMessage);
}

function sendLeaveNow() {
  if (state.ws?.readyState === WebSocket.OPEN && state.inCall) send({ type: "leave" });
}

function resetLocalCall(showMessage = true) {
  state.stream?.getTracks().forEach((track) => track.stop());
  state.rawStream?.getTracks().forEach((track) => track.stop());
  state.stream = null;
  state.rawStream = null;
  state.hasMic = false;

  if (state.audioContext?.state !== "closed") state.audioContext?.close();
  state.audioContext = null;
  state.audioSource = null;
  state.audioDestination = null;
  state.analyser = null;
  cancelAnimationFrame(state.meterFrame);

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
  micStatus.textContent = "mic not joined";
  micStatus.className = "mic-status";

  if (showMessage) showToast("left");
}

function createProcessedMicStream(rawStream) {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return rawStream;

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
    state.meterFrame = requestAnimationFrame(tick);
  };

  tick();
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
  } else if (card.dataset.inCall === "true") {
    card.querySelector(".tag").textContent = card.dataset.local === "true" ? "you" : "live";
  } else {
    card.querySelector(".tag").textContent = "online";
  }
}

function setMuted(id, muted) {
  const card = state.cards.get(id);
  if (!card) return;
  card.dataset.muted = muted ? "true" : "false";
  card.classList.toggle("muted", muted);
  card.querySelector(".tag").textContent = muted ? "muted" : id === state.id ? "you" : "live";
}

function sendChat(event) {
  event.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;

  send({ type: "chat", text });
  chatInput.value = "";
}

async function uploadChatMedia() {
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
    mediaButton.disabled = false;
    mediaButton.textContent = "+";
  }
}

function toggleGifPanel() {
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
    gifSearchButton.disabled = false;
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
      url: images.fixed_height?.url || images.downsized?.url || images.original?.url || "",
      previewUrl: images.fixed_width_small?.url || images.fixed_height_small?.url || images.preview_gif?.url || "",
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

  const mine = message.from === state.id;
  const row = document.createElement("div");
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
      nextParams.set("usedtx", "0");
      nextParams.set("maxaveragebitrate", "128000");
      nextParams.set("stereo", "0");
      nextParams.set("sprop-stereo", "0");
      nextParams.set("cbr", "1");
      return `a=fmtp:${opusPayload} ${[...nextParams].map(([key, value]) => `${key}=${value}`).join(";")}`;
    });
  } else {
    sdp = sdp.replace(
      new RegExp(`a=rtpmap:${opusPayload} opus/48000/2\\r?\\n`, "i"),
      (line) => `${line}a=fmtp:${opusPayload} useinbandfec=1;usedtx=0;maxaveragebitrate=128000;stereo=0;sprop-stereo=0;cbr=1\r\n`
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

async function tuneAudioSender(sender) {
  try {
    const params = sender.getParameters();
    if (!params.encodings || params.encodings.length === 0) params.encodings = [{}];
    params.encodings[0].maxBitrate = 128000;
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

function notifyUser(title, body = "", sound = "soft") {
  playNoticeSound(sound);
  showToast(body ? `${title}: ${body}` : title);
  flashTitle(title);

  if (document.visibilityState !== "visible" && "Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title, { body, silent: true });
    } catch {
    }
  }
}

function warmNotifications() {
  if (state.notificationWanted || !("Notification" in window) || Notification.permission !== "default") return;
  state.notificationWanted = true;
  Notification.requestPermission().catch(() => {});
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
