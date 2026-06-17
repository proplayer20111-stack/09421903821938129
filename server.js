const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const os = require("os");
let webPush = null;
try {
  webPush = require("web-push");
} catch {
  webPush = null;
}

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = process.env.DATA_DIR || __dirname;
fs.mkdirSync(DATA_DIR, { recursive: true });
const ACCOUNTS_PATH = path.join(DATA_DIR, "accounts.json");
const DEVICE_RULES_PATH = path.join(DATA_DIR, "device-rules.json");
const rooms = new Map();
const sessions = new Map();
const siteSessions = new Map();
const accessAttempts = new Map();
const blockedIps = new Set();
const protectedIps = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);
const securityEvents = [];
const chatMessages = [];
const mediaCooldowns = new Map();
const deviceRules = loadDeviceRules();
const deviceTimeouts = new Map(deviceRules.deviceTimeouts || []);
const signupBlockedDevices = new Set(deviceRules.signupBlockedDevices || []);
const protectedDeviceIds = new Set();
const connectedSockets = new Set();
const kickVotes = new Map();
const callKicks = new Map();
const pushSubscriptions = new Map();
let accounts = loadAccounts();

const SITE_PASSWORD = process.env.SITE_PASSWORD || "Seth123";
const SITE_TOKEN = crypto.createHash("sha256").update(`site:${SITE_PASSWORD}`).digest("hex");
const ACCESS_TIMEOUT_MS = 10 * 60 * 1000;
const CHAT_TTL_MS = 24 * 60 * 60 * 1000;
const MEDIA_TTL_MS = 12 * 60 * 60 * 1000;
const MEDIA_COOLDOWN_MS = 30 * 1000;
const DEVICE_TIMEOUT_MS = 3 * 60 * 1000;
const KICK_MAX_MS = 3 * 60 * 1000;
const KICK_VOTE_TTL_MS = 45 * 1000;
const GIPHY_API_KEY = process.env.GIPHY_API_KEY || "";
const VAPID_KEYS = getVapidKeys();
if (webPush && VAPID_KEYS.publicKey && VAPID_KEYS.privateKey) {
  webPush.setVapidDetails(process.env.WEB_PUSH_CONTACT || "mailto:admin@example.com", VAPID_KEYS.publicKey, VAPID_KEYS.privateKey);
}

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webm": "video/webm",
  ".mp4": "video/mp4",
  ".svg": "image/svg+xml; charset=utf-8"
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "OPTIONS" && url.pathname.startsWith("/api/")) {
    sendJson(res, 204, null);
    return;
  }

  if (req.method === "GET" && url.pathname === "/healthz") {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/device-status") {
    handleDeviceStatus(req, res);
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/host-info") {
    if (!requireSiteAccess(req, res)) return;
    sendJson(res, 200, getHostInfo());
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/site-access") {
    await handleSiteAccess(req, res);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/signup") {
    if (!requireSiteAccess(req, res)) return;
    await handleSignup(req, res);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/login") {
    if (!requireSiteAccess(req, res)) return;
    await handleLogin(req, res);
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/accounts") {
    if (!requireSiteAccess(req, res)) return;
    handleAccountList(req, res);
    return;
  }

  if (req.method === "POST" && url.pathname.startsWith("/api/accounts/")) {
    if (!requireSiteAccess(req, res)) return;
    handleAccountDeviceAction(req, res, url);
    return;
  }

  if (req.method === "DELETE" && url.pathname.startsWith("/api/accounts/")) {
    if (!requireSiteAccess(req, res)) return;
    handleAccountDelete(req, res, decodeURIComponent(url.pathname.split("/").pop() || ""));
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/security-events") {
    if (!requireSiteAccess(req, res)) return;
    handleSecurityEvents(req, res);
    return;
  }

  if (req.method === "POST" && url.pathname.startsWith("/api/security-events/")) {
    if (!requireSiteAccess(req, res)) return;
    handleSecurityAction(req, res, url);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/upload-pfp") {
    if (!requireSiteAccess(req, res)) return;
    await handleProfileUpload(req, res);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/upload-media") {
    if (!requireSiteAccess(req, res)) return;
    await handleMediaUpload(req, res, url);
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/gif-config") {
    if (!requireSiteAccess(req, res)) return;
    sendJson(res, 200, {
      provider: "giphy",
      enabled: Boolean(GIPHY_API_KEY),
      giphyApiKey: GIPHY_API_KEY
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/push-config") {
    if (!requireSiteAccess(req, res)) return;
    sendJson(res, 200, {
      enabled: Boolean(webPush && VAPID_KEYS.publicKey),
      publicKey: webPush ? VAPID_KEYS.publicKey : ""
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/push-subscribe") {
    if (!requireSiteAccess(req, res)) return;
    await handlePushSubscribe(req, res);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/send-gif") {
    if (!requireSiteAccess(req, res)) return;
    await handleGifSend(req, res, url);
    return;
  }

  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const safePath = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(PUBLIC_DIR, safePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const ext = path.extname(filePath);
    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    res.end(data);
  });
});

server.on("upgrade", (req, socket) => {
  if (req.headers.upgrade?.toLowerCase() !== "websocket") {
    socket.destroy();
    return;
  }

  const key = req.headers["sec-websocket-key"];
  if (!key) {
    socket.destroy();
    return;
  }

  const accept = crypto
    .createHash("sha1")
    .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
    .digest("base64");

  socket.write(
    [
      "HTTP/1.1 101 Switching Protocols",
      "Upgrade: websocket",
      "Connection: Upgrade",
      `Sec-WebSocket-Accept: ${accept}`,
      "",
      ""
    ].join("\r\n")
  );

  const client = {
    id: crypto.randomUUID(),
    name: "Caller",
    profile: normalizeProfile({ name: "Caller" }),
    account: null,
    isAdmin: false,
    deviceId: "",
    deviceType: "pc",
    inCall: false,
    room: null,
    socket,
    buffer: Buffer.alloc(0),
    lastSeen: Date.now(),
    disconnected: false
  };
  connectedSockets.add(client);

  send(client, { type: "hello", id: client.id });

  socket.on("data", (chunk) => {
    client.buffer = Buffer.concat([client.buffer, chunk]);
    readFrames(client);
  });

  socket.on("close", () => disconnectClient(client));
  socket.on("error", () => disconnectClient(client));
});

function disconnectClient(client) {
  if (client.disconnected) return;
  client.disconnected = true;
  const wasPresent = Boolean(client.account);
  connectedSockets.delete(client);
  leaveRoom(client);
  if (wasPresent) {
    broadcastPresence({ type: "presence-left", id: client.id });
    broadcastPresenceSync();
  }
}

function readFrames(client) {
  while (client.buffer.length >= 2) {
    const firstByte = client.buffer[0];
    const secondByte = client.buffer[1];
    const opcode = firstByte & 0x0f;
    const masked = (secondByte & 0x80) !== 0;
    let payloadLength = secondByte & 0x7f;
    let offset = 2;

    if (payloadLength === 126) {
      if (client.buffer.length < offset + 2) return;
      payloadLength = client.buffer.readUInt16BE(offset);
      offset += 2;
    } else if (payloadLength === 127) {
      if (client.buffer.length < offset + 8) return;
      const highBits = client.buffer.readUInt32BE(offset);
      if (highBits !== 0) {
        client.socket.destroy();
        return;
      }
      payloadLength = client.buffer.readUInt32BE(offset + 4);
      offset += 8;
    }

    const maskOffset = masked ? 4 : 0;
    const frameLength = offset + maskOffset + payloadLength;
    if (client.buffer.length < frameLength) return;

    const mask = masked ? client.buffer.subarray(offset, offset + 4) : null;
    offset += maskOffset;

    const payload = client.buffer.subarray(offset, offset + payloadLength);
    client.buffer = client.buffer.subarray(frameLength);

    if (opcode === 0x8) {
      client.socket.end();
      disconnectClient(client);
      return;
    }

    if (opcode === 0x9) {
      writeFrame(client.socket, Buffer.from(payload), 0x0a);
      continue;
    }

    if (opcode !== 0x1) continue;

    const decoded = Buffer.alloc(payload.length);
    for (let i = 0; i < payload.length; i += 1) {
      decoded[i] = masked ? payload[i] ^ mask[i % 4] : payload[i];
    }

    try {
      handleMessage(client, JSON.parse(decoded.toString("utf8")));
    } catch {
      send(client, { type: "error", message: "Bad message" });
    }
  }
}

function handleMessage(client, message) {
  client.lastSeen = Date.now();

  if (message.type === "ping") {
    send(client, { type: "pong", time: client.lastSeen });
    return;
  }

  if (message.type === "presence") {
    if (!isValidSiteToken(message.siteToken)) {
      send(client, { type: "auth-error" });
      return;
    }

    const deviceId = normalizeDeviceId(message.deviceId);
    const timeout = getDeviceTimeout(deviceId);
    if (timeout.timedOut) {
      send(client, { type: "device-timeout", timeoutUntil: timeout.timeoutUntil });
      client.socket.end();
      return;
    }

    const session = sessions.get(String(message.token || ""));
    if (!session || !accounts[session.username]) {
      send(client, { type: "auth-error" });
      return;
    }

    const account = accounts[session.username];
    rememberAccountDevice(account, null, deviceId);
    if (account.isAdmin) protectDevice(deviceId);
    saveAccounts();
    client.deviceId = deviceId;
    client.deviceType = normalizeDeviceType(message.deviceType);
    client.account = session.username;
    client.isAdmin = account.isAdmin;
    client.profile = normalizeProfile(account.profile || { name: session.username });
    client.name = client.profile.name;
    client.inCall = false;
    send(client, {
      type: "presence-list",
      self: client.id,
      users: connectedUsers()
    });
    pruneChatMessages();
    send(client, {
      type: "chat-history",
      messages: chatMessages
    });
    broadcastPresence({ type: "presence-update", user: publicClient(client) }, client.id);
    broadcastPresenceSync();
    return;
  }

  if (message.type === "join") {
    if (!client.account) return;
    const kick = getCallKick(client.account);
    if (kick.kicked) {
      send(client, { type: "call-kicked", kickUntil: kick.kickUntil, reason: kick.reason });
      return;
    }
    client.profile = normalizeProfile(message.profile || { name: message.name });
    client.name = client.profile.name;
    client.deviceType = normalizeDeviceType(message.deviceType || client.deviceType);
    const wasCallEmpty = !rooms.get("main")?.size;
    client.inCall = true;
    joinRoom(client, "main");
    if (wasCallEmpty) {
      broadcastPresence({ type: "call-started", user: publicClient(client) }, client.id);
      sendCallStartedPush(client);
    }
    broadcastPresence({ type: "presence-update", user: publicClient(client) });
    broadcastPresenceSync();
    return;
  }

  if (message.type === "leave") {
    client.inCall = false;
    leaveRoom(client);
    broadcastPresence({ type: "presence-update", user: publicClient(client) });
    broadcastPresenceSync();
    return;
  }

  if (message.type === "kick-vote-start") {
    handleKickVoteStart(client, message);
    return;
  }

  if (message.type === "kick-vote-cast") {
    handleKickVoteCast(client, message);
    return;
  }

  if (message.type === "profile") {
    if (!client.account) return;
    client.profile = normalizeProfile(message.profile || { name: client.name });
    client.name = client.profile.name;
    if (accounts[client.account]) {
      accounts[client.account].profile = client.profile;
      saveAccounts();
    }
    broadcast(client.room, {
      type: "profile",
      from: client.id,
      profile: client.profile
    }, client.id);
    broadcastPresence({ type: "presence-update", user: publicClient(client) });
    return;
  }

  if (message.type === "chat") {
    if (!client.account) return;
    pruneChatMessages();
    const text = sanitizeChat(message.text);
    if (!text) return;
    const chat = {
      type: "chat",
      id: crypto.randomUUID(),
      from: client.id,
      name: client.name,
      profile: client.profile,
      text,
      createdAt: new Date().toISOString()
    };
    chatMessages.push(chat);
    broadcastPresence(chat);
    return;
  }

  if (["speaking", "mute"].includes(message.type)) {
    broadcast(client.room, {
      ...message,
      from: client.id,
      name: client.name,
      profile: client.profile
    }, client.id);
    return;
  }

  if (["offer", "answer", "ice"].includes(message.type)) {
    const target = findClient(message.to);
    if (!target || target.room !== client.room) return;
    send(target, {
      ...message,
      from: client.id,
      name: client.name,
      profile: client.profile
    });
  }
}

function joinRoom(client, room) {
  leaveRoom(client);
  client.room = room;

  if (!rooms.has(room)) rooms.set(room, new Set());
  const peers = [...rooms.get(room)].map((peer) => ({
    id: peer.id,
    name: peer.name,
    profile: peer.profile,
    deviceType: normalizeDeviceType(peer.deviceType)
  }));
  rooms.get(room).add(client);

  send(client, {
    type: "joined",
    id: client.id,
    room,
    peers
  });

  broadcast(room, {
    type: "peer-joined",
    peer: { id: client.id, name: client.name, profile: client.profile, deviceType: normalizeDeviceType(client.deviceType) }
  }, client.id);
}

function leaveRoom(client) {
  if (!client.room || !rooms.has(client.room)) return;

  const room = client.room;
  rooms.get(room).delete(client);
  if (rooms.get(room).size === 0) rooms.delete(room);

  broadcast(room, { type: "peer-left", id: client.id });
  clearKickVotesForClient(room, client.id);
  client.room = null;
}

function handleKickVoteStart(client, message) {
  if (!client.account || !client.room || !rooms.has(client.room)) return;
  const target = findClient(message.targetId);
  if (!target || target.id === client.id || target.room !== client.room || !target.account) return;
  const existingVote = [...kickVotes.values()].find((vote) => vote.room === client.room && vote.targetId === target.id);
  if (existingVote) {
    send(client, { type: "kick-vote", vote: publicKickVote(existingVote) });
    send(client, { type: "error", message: "vote already running" });
    return;
  }

  const durationMs = Math.max(30 * 1000, Math.min(KICK_MAX_MS, Number(message.durationMs) || 60 * 1000));
  const expiresAt = Date.now() + KICK_VOTE_TTL_MS;
  const vote = {
    id: crypto.randomUUID(),
    room: client.room,
    targetId: target.id,
    targetAccount: target.account,
    targetName: target.profile?.name || target.name,
    targetProfile: normalizeProfile(target.profile || { name: target.name }),
    starterId: client.id,
    starterName: client.profile?.name || client.name,
    starterProfile: normalizeProfile(client.profile || { name: client.name }),
    reason: sanitizeKickReason(message.reason),
    durationMs,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(expiresAt).toISOString(),
    votes: new Set([client.id])
  };
  kickVotes.set(vote.id, vote);
  broadcast(client.room, { type: "kick-vote", vote: publicKickVote(vote) });
  setTimeout(() => expireKickVote(vote.id), KICK_VOTE_TTL_MS + 150);
  evaluateKickVote(vote);
}

function handleKickVoteCast(client, message) {
  if (!client.account || !client.room) return;
  const vote = kickVotes.get(String(message.voteId || ""));
  if (!vote || vote.room !== client.room || vote.targetId === client.id) return;
  if (!rooms.get(vote.room)?.has(client)) return;

  vote.votes.add(client.id);
  broadcast(vote.room, { type: "kick-vote", vote: publicKickVote(vote) });
  evaluateKickVote(vote);
}

function evaluateKickVote(vote) {
  if (Date.parse(vote.expiresAt) <= Date.now()) {
    expireKickVote(vote.id);
    return;
  }

  const roomMembers = [...(rooms.get(vote.room) || [])];
  const eligible = roomMembers.filter((member) => member.id !== vote.targetId && member.account);
  if (!eligible.length) return;

  const threshold = eligible.length <= 2 ? eligible.length : eligible.length - 1;
  const yesVotes = eligible.filter((member) => vote.votes.has(member.id)).length;
  if (yesVotes < threshold) return;

  const target = roomMembers.find((member) => member.id === vote.targetId);
  const kickUntilMs = Date.now() + vote.durationMs;
  callKicks.set(vote.targetAccount, {
    until: kickUntilMs,
    reason: vote.reason
  });
  kickVotes.delete(vote.id);
  broadcast(vote.room, {
    type: "kick-vote-ended",
    voteId: vote.id,
    passed: true,
    targetId: vote.targetId,
    targetName: vote.targetName,
    kickUntil: new Date(kickUntilMs).toISOString()
  });

  if (target) {
    send(target, {
      type: "call-kicked",
      kickUntil: new Date(kickUntilMs).toISOString(),
      reason: vote.reason
    });
    target.inCall = false;
    leaveRoom(target);
    broadcastPresence({ type: "presence-update", user: publicClient(target) });
    broadcastPresenceSync();
  }
}

function publicKickVote(vote) {
  const roomMembers = [...(rooms.get(vote.room) || [])].filter((member) => member.id !== vote.targetId && member.account);
  const eligibleCount = roomMembers.length;
  const yesVotes = roomMembers.filter((member) => vote.votes.has(member.id)).length;
  const voterNames = roomMembers
    .filter((member) => vote.votes.has(member.id))
    .map((member) => member.profile?.name || member.name)
    .filter(Boolean);
  return {
    id: vote.id,
    targetId: vote.targetId,
    targetName: vote.targetName,
    targetProfile: vote.targetProfile,
    starterId: vote.starterId,
    starterName: vote.starterName,
    starterProfile: vote.starterProfile,
    reason: vote.reason,
    durationMs: vote.durationMs,
    createdAt: vote.createdAt,
    expiresAt: vote.expiresAt,
    votes: yesVotes,
    threshold: eligibleCount <= 2 ? eligibleCount : Math.max(1, eligibleCount - 1),
    eligibleCount,
    voterNames,
    voterIds: [...vote.votes]
  };
}

function expireKickVote(voteId) {
  const vote = kickVotes.get(voteId);
  if (!vote) return;
  kickVotes.delete(voteId);
  broadcast(vote.room, {
    type: "kick-vote-ended",
    voteId,
    passed: false,
    reason: "expired",
    targetId: vote.targetId,
    targetName: vote.targetName
  });
}

function getCallKick(username) {
  const kick = callKicks.get(username);
  if (!kick) return { kicked: false, kickUntil: "", remainingMs: 0, reason: "" };
  if (kick.until <= Date.now()) {
    callKicks.delete(username);
    return { kicked: false, kickUntil: "", remainingMs: 0, reason: "" };
  }
  return {
    kicked: true,
    kickUntil: new Date(kick.until).toISOString(),
    remainingMs: kick.until - Date.now(),
    reason: kick.reason
  };
}

function clearKickVotesForClient(room, clientId) {
  for (const [id, vote] of kickVotes.entries()) {
    if (vote.room === room && (vote.targetId === clientId || vote.starterId === clientId)) {
      kickVotes.delete(id);
      broadcast(room, { type: "kick-vote-ended", voteId: id, passed: false });
    }
  }
}

function findClient(id) {
  for (const members of rooms.values()) {
    for (const client of members) {
      if (client.id === id) return client;
    }
  }
  return null;
}

function broadcast(room, message, exceptId) {
  if (!rooms.has(room)) return;
  for (const client of rooms.get(room)) {
    if (client.id !== exceptId) send(client, message);
  }
}

function broadcastPresence(message, exceptId) {
  for (const client of connectedSockets) {
    if (client.account && client.id !== exceptId) send(client, message);
  }
}

function broadcastPresenceSync() {
  const users = connectedUsers();
  broadcastPresence({ type: "presence-sync", users });
}

function connectedUsers() {
  return [...connectedSockets]
    .filter((client) => client.account)
    .map(publicClient);
}

function publicClient(client) {
  return {
    id: client.id,
    username: client.account,
    profile: client.profile,
    deviceType: normalizeDeviceType(client.deviceType),
    inCall: Boolean(client.inCall),
    isAdmin: Boolean(client.isAdmin)
  };
}

function send(client, message) {
  if (client.socket.destroyed) return;
  try {
    writeFrame(client.socket, Buffer.from(JSON.stringify(message)), 0x1);
  } catch {
    disconnectClient(client);
  }
}

function writeFrame(socket, payload, opcode) {
  const header = [];
  header.push(0x80 | opcode);

  if (payload.length < 126) {
    header.push(payload.length);
  } else if (payload.length < 65536) {
    header.push(126, (payload.length >> 8) & 255, payload.length & 255);
  } else {
    header.push(127, 0, 0, 0, 0);
    header.push(
      (payload.length >> 24) & 255,
      (payload.length >> 16) & 255,
      (payload.length >> 8) & 255,
      payload.length & 255
    );
  }

  socket.write(Buffer.concat([Buffer.from(header), payload]));
}

function normalizeName(name) {
  return String(name || "Caller").trim().slice(0, 28) || "Caller";
}

function normalizeProfile(profile) {
  return {
    name: normalizeName(profile?.name),
    status: String(profile?.status || "Ready to talk").trim().slice(0, 40) || "Ready to talk",
    avatarUrl: typeof profile?.avatarUrl === "string" ? profile.avatarUrl.slice(0, 500) : "",
    avatarType: typeof profile?.avatarType === "string" ? profile.avatarType.slice(0, 80) : ""
  };
}

function sanitizeChat(text) {
  return String(text || "").trim().slice(0, 500);
}

function getVapidKeys() {
  if (!webPush) return { publicKey: "", privateKey: "" };
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    return {
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY
    };
  }
  return webPush.generateVAPIDKeys();
}

function sanitizeHttpsUrl(value) {
  const raw = String(value || "").trim().slice(0, 700);
  const parsed = new URL(raw);
  if (parsed.protocol !== "https:") throw new Error("GIF URL must be HTTPS.");
  return parsed.toString();
}

function sanitizeKickReason(text) {
  return String(text || "No reason").trim().slice(0, 140) || "No reason";
}

async function handleProfileUpload(req, res) {
  try {
    const file = await readMediaFile(req);
    const url = await uploadToCatbox(file);
    sendJson(res, 200, { url, type: file.type });
  } catch (error) {
    const tooLarge = error.message === "Upload too large.";
    const badUpload = ["Upload must be multipart form data.", "No file was uploaded.", "Please upload an image or video."].includes(error.message);
    sendJson(res, tooLarge ? 413 : badUpload ? 400 : 500, {
      error: tooLarge ? "That file is too large." : error.message || "Could not upload to Catbox."
    });
  }
}

async function handleMediaUpload(req, res, url) {
  const auth = requireAccount(req, res);
  if (!auth) return;

  const now = Date.now();
  const lastUpload = mediaCooldowns.get(auth.username) || 0;
  if (!auth.account.isAdmin && now - lastUpload < MEDIA_COOLDOWN_MS) {
    const waitSeconds = Math.ceil((MEDIA_COOLDOWN_MS - (now - lastUpload)) / 1000);
    sendJson(res, 429, { error: `wait ${waitSeconds}s before another media upload`, waitSeconds });
    return;
  }

  try {
    const file = await readMediaFile(req);
    const mediaUrl = await uploadToCatbox(file);
    mediaCooldowns.set(auth.username, now);

    const profile = normalizeProfile(auth.account.profile || { name: auth.username });
    const chat = {
      type: "chat",
      kind: "media",
      id: crypto.randomUUID(),
      from: String(url.searchParams.get("clientId") || auth.username).slice(0, 80),
      username: auth.username,
      name: profile.name,
      profile,
      text: "",
      mediaUrl,
      mediaType: file.type,
      expiresAt: new Date(now + MEDIA_TTL_MS).toISOString(),
      createdAt: new Date(now).toISOString()
    };
    chatMessages.push(chat);
    pruneChatMessages();
    broadcastPresence(chat);
    sendJson(res, 200, { chat, cooldownSeconds: auth.account.isAdmin ? 0 : 30 });
  } catch (error) {
    const tooLarge = error.message === "Upload too large.";
    const badUpload = ["Upload must be multipart form data.", "No file was uploaded.", "Please upload an image or video."].includes(error.message);
    sendJson(res, tooLarge ? 413 : badUpload ? 400 : 500, {
      error: tooLarge ? "That file is too large." : error.message || "Could not upload to Catbox."
    });
  }
}

async function handleGifSend(req, res, url) {
  const auth = requireAccount(req, res);
  if (!auth) return;

  const now = Date.now();
  const lastUpload = mediaCooldowns.get(auth.username) || 0;
  if (!auth.account.isAdmin && now - lastUpload < MEDIA_COOLDOWN_MS) {
    const waitSeconds = Math.ceil((MEDIA_COOLDOWN_MS - (now - lastUpload)) / 1000);
    sendJson(res, 429, { error: `wait ${waitSeconds}s before another media upload`, waitSeconds });
    return;
  }

  try {
    const payload = await readJson(req);
    const profile = normalizeProfile(auth.account.profile || { name: auth.username });
    const chat = {
      type: "chat",
      kind: "gif",
      id: crypto.randomUUID(),
      from: String(url.searchParams.get("clientId") || auth.username).slice(0, 80),
      username: auth.username,
      name: profile.name,
      profile,
      text: "",
      expiresAt: new Date(now + MEDIA_TTL_MS).toISOString(),
      createdAt: new Date(now).toISOString()
    };

    chat.mediaUrl = sanitizeHttpsUrl(payload.mediaUrl);
    chat.previewUrl = sanitizeHttpsUrl(payload.previewUrl || payload.mediaUrl);
    chat.mediaType = "image/gif";
    chat.title = String(payload.title || "gif").trim().slice(0, 80) || "gif";
    chat.provider = String(payload.provider || "giphy").trim().slice(0, 30) || "giphy";

    mediaCooldowns.set(auth.username, now);
    chatMessages.push(chat);
    pruneChatMessages();
    broadcastPresence(chat);
    sendJson(res, 200, { chat, cooldownSeconds: auth.account.isAdmin ? 0 : 30 });
  } catch (error) {
    sendJson(res, 400, { error: error.message || "could not send GIF" });
  }
}

async function handlePushSubscribe(req, res) {
  const auth = requireAccount(req, res);
  if (!auth) return;
  if (!webPush || !VAPID_KEYS.publicKey) {
    sendJson(res, 503, { error: "push notifications are not enabled on this server" });
    return;
  }

  try {
    const body = await readJson(req);
    const subscription = body.subscription;
    const endpoint = String(subscription?.endpoint || "");
    if (!endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      sendJson(res, 400, { error: "bad push subscription" });
      return;
    }

    pushSubscriptions.set(endpoint, {
      username: auth.username,
      deviceId: getDeviceId(req, body),
      subscription
    });
    sendJson(res, 200, { ok: true });
  } catch {
    sendJson(res, 400, { error: "could not save push subscription" });
  }
}

function sendCallStartedPush(starter) {
  if (!webPush || !pushSubscriptions.size) return;
  const title = "Call started";
  const body = `${starter.profile?.name || starter.name || "Someone"} joined the call`;
  const payload = JSON.stringify({
    title,
    body,
    tag: "aba-call-started",
    url: "/",
    icon: "/icon.svg"
  });

  for (const [endpoint, item] of [...pushSubscriptions.entries()]) {
    if (item.username === starter.account) continue;
    webPush.sendNotification(item.subscription, payload).catch((error) => {
      if ([404, 410].includes(error?.statusCode)) pushSubscriptions.delete(endpoint);
    });
  }
}

async function readMediaFile(req) {
  const contentType = req.headers["content-type"] || "";
  if (!contentType.includes("multipart/form-data")) throw new Error("Upload must be multipart form data.");

  const body = await readRequestBody(req, 200 * 1024 * 1024);
  const file = parseMultipartFile(body, contentType, "file");
  if (!file) throw new Error("No file was uploaded.");
  if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
    throw new Error("Please upload an image or video.");
  }
  return file;
}

async function uploadToCatbox(file) {
  const form = new FormData();
  form.append("reqtype", "fileupload");
  form.append("fileToUpload", new Blob([file.data], {
    type: file.type || "application/octet-stream"
  }), file.filename);

  const upload = await fetch("https://catbox.moe/user/api.php", {
    method: "POST",
    body: form
  });
  const text = (await upload.text()).trim();

  if (!upload.ok || !/^https:\/\/files\.catbox\.moe\/\S+$/i.test(text)) {
    throw new Error(text || "Catbox upload failed.");
  }

  return text;
}

async function handleSiteAccess(req, res) {
  try {
    const timeout = getDeviceTimeout(getDeviceId(req));
    if (timeout.timedOut) {
      sendJson(res, 423, { error: "device timed out", ...timeout });
      return;
    }

    const ip = getClientIp(req);
    const userAgent = String(req.headers["user-agent"] || "");
    const attempt = accessAttempts.get(ip) || { count: 0, lockedUntil: 0 };
    const now = Date.now();
    const protectedClient = isProtectedIp(ip);

    if (blockedIps.has(ip) && !protectedClient) {
      sendJson(res, 403, { error: "blocked" });
      return;
    }

    if (attempt.lockedUntil > now && !protectedClient) {
      sendJson(res, 429, { error: "too many tries, wait a bit" });
      return;
    }

    const body = await readJson(req);
    if (String(body.password || "") !== SITE_PASSWORD) {
      attempt.count += 1;
      if (attempt.count > 3 && !protectedClient) {
        attempt.lockedUntil = now + ACCESS_TIMEOUT_MS;
        recordSecurityEvent(req, attempt.count);
      }
      accessAttempts.set(ip, attempt);
      sendJson(res, attempt.lockedUntil > now && !protectedClient ? 429 : 401, { error: "wrong site password" });
      return;
    }

    accessAttempts.delete(ip);
    siteSessions.set(SITE_TOKEN, { createdAt: now, ip, userAgent });
    sendJson(res, 200, { token: SITE_TOKEN });
  } catch {
    sendJson(res, 400, { error: "bad request" });
  }
}

async function handleSignup(req, res) {
  try {
    const body = await readJson(req);
    const username = normalizeAccountName(body.username);
    const password = String(body.password || "");
    const deviceId = getDeviceId(req, body);
    const timeout = getDeviceTimeout(deviceId);
    if (timeout.timedOut) {
      sendJson(res, 423, { error: "device timed out", ...timeout });
      return;
    }
    if (signupBlockedDevices.has(deviceId) && username.toLowerCase() !== "seth") {
      sendJson(res, 403, { error: "this device cannot make more accounts" });
      return;
    }

    if (!username || password.length < 3) {
      sendJson(res, 400, { error: "Username and password required." });
      return;
    }

    if (accounts[username]) {
      sendJson(res, 409, { error: "Account already exists." });
      return;
    }

    const isAdmin = username.toLowerCase() === "seth";
    accounts[username] = {
      username,
      password: hashPassword(password),
      isAdmin,
      profile: normalizeProfile({ name: username, status: "online" }),
      createdAt: new Date().toISOString()
    };
    rememberAccountDevice(accounts[username], req, deviceId);
    saveAccounts();
    if (isAdmin) {
      protectIp(getClientIp(req));
      protectDevice(deviceId);
    }
    sendJson(res, 200, authPayload(username, deviceId));
  } catch {
    sendJson(res, 400, { error: "Bad signup." });
  }
}

function handleSecurityEvents(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  protectIp(getClientIp(req));
  sendJson(res, 200, {
    events: securityEvents.slice(-50).reverse().map((event) => ({
      ...event,
      blocked: blockedIps.has(event.ip),
      protected: isProtectedIp(event.ip)
    }))
  });
}

function handleSecurityAction(req, res, url) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  const parts = url.pathname.split("/");
  const ip = decodeURIComponent(parts[3] || "");
  const action = parts[4];
  protectIp(getClientIp(req));

  if (!ip) {
    sendJson(res, 400, { error: "missing ip" });
    return;
  }

  if (action === "allow") {
    accessAttempts.delete(ip);
    blockedIps.delete(ip);
    sendJson(res, 200, { ok: true, blocked: false, protected: isProtectedIp(ip) });
    return;
  }

  if (action === "block") {
    if (isProtectedIp(ip) || normalizeIp(ip) === normalizeIp(getClientIp(req))) {
      sendJson(res, 400, { error: "protected ip cannot be blocked" });
      return;
    }
    blockedIps.add(ip);
    accessAttempts.delete(ip);
    sendJson(res, 200, { ok: true, blocked: true, protected: false });
    return;
  }

  sendJson(res, 404, { error: "unknown action" });
}

async function handleLogin(req, res) {
  try {
    const body = await readJson(req);
    const username = normalizeAccountName(body.username);
    const password = String(body.password || "");
    const deviceId = getDeviceId(req, body);
    const timeout = getDeviceTimeout(deviceId);
    if (timeout.timedOut) {
      sendJson(res, 423, { error: "device timed out", ...timeout });
      return;
    }
    const account = accounts[username];

    if (!account || !verifyPassword(password, account.password)) {
      sendJson(res, 401, { error: "Wrong username or password." });
      return;
    }

    rememberAccountDevice(account, req, deviceId);
    saveAccounts();
    if (account.isAdmin) {
      protectIp(getClientIp(req));
      protectDevice(deviceId);
    }
    sendJson(res, 200, authPayload(username, deviceId));
  } catch {
    sendJson(res, 400, { error: "Bad login." });
  }
}

function handleAccountList(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  sendJson(res, 200, {
    accounts: Object.values(accounts).map((account) => ({
      username: account.username,
      isAdmin: Boolean(account.isAdmin),
      createdAt: account.createdAt || "",
      lastDeviceId: account.lastDeviceId || "",
      deviceTimedOut: getDeviceTimeout(account.lastDeviceId).timedOut,
      deviceTimeoutUntil: getDeviceTimeout(account.lastDeviceId).timeoutUntil,
      signupBlocked: account.lastDeviceId ? signupBlockedDevices.has(account.lastDeviceId) : false,
      protectedDevice: isProtectedDevice(account.lastDeviceId)
    }))
  });
}

async function handleAccountDeviceAction(req, res, url) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  const parts = url.pathname.split("/");
  const username = normalizeAccountName(decodeURIComponent(parts[3] || ""));
  const action = parts[4];
  const account = accounts[username];
  if (!account) {
    sendJson(res, 404, { error: "Account not found." });
    return;
  }

  const deviceId = normalizeDeviceId(account.lastDeviceId);
  if (!deviceId) {
    sendJson(res, 400, { error: "No device saved for that account yet." });
    return;
  }

  if (action === "timeout-device") {
    if (account.isAdmin || isProtectedDevice(deviceId)) {
      sendJson(res, 400, { error: "protected device cannot be timed out" });
      return;
    }
    const timeoutUntil = new Date(Date.now() + DEVICE_TIMEOUT_MS).toISOString();
    deviceTimeouts.set(deviceId, Date.parse(timeoutUntil));
    saveDeviceRules();
    timeoutConnectedDevice(deviceId, timeoutUntil);
    sendJson(res, 200, { ok: true, timeoutUntil });
    return;
  }

  if (action === "signup-block-device") {
    if (account.isAdmin || isProtectedDevice(deviceId)) {
      sendJson(res, 400, { error: "protected device cannot be signup blocked" });
      return;
    }
    let body = {};
    try {
      body = await readJson(req);
    } catch {
      body = {};
    }
    const blocked = body.blocked !== false;
    if (blocked) signupBlockedDevices.add(deviceId);
    else signupBlockedDevices.delete(deviceId);
    saveDeviceRules();
    sendJson(res, 200, { ok: true, blocked });
    return;
  }

  sendJson(res, 404, { error: "unknown action" });
}

function handleAccountDelete(req, res, username) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  const cleanName = normalizeAccountName(username);
  if (!cleanName || cleanName.toLowerCase() === "seth") {
    sendJson(res, 400, { error: "That account cannot be removed." });
    return;
  }

  if (!accounts[cleanName]) {
    sendJson(res, 404, { error: "Account not found." });
    return;
  }

  delete accounts[cleanName];
  saveAccounts();

  for (const client of connectedSockets) {
    if (client.account === cleanName) {
      send(client, { type: "account-removed" });
      client.socket.end();
    }
  }

  sendJson(res, 200, { ok: true });
}

function authPayload(username, deviceId = "") {
  const token = crypto.randomBytes(32).toString("hex");
  const account = accounts[username];
  sessions.set(token, {
    username,
    deviceId: normalizeDeviceId(deviceId),
    createdAt: Date.now()
  });

  return {
    token,
    username,
    isAdmin: Boolean(account.isAdmin),
    profile: normalizeProfile(account.profile || { name: username })
  };
}

function requireAdmin(req, res) {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const session = sessions.get(token);
  const account = session ? accounts[session.username] : null;

  if (!account?.isAdmin) {
    sendJson(res, 403, { error: "Admin only." });
    return null;
  }

  protectIp(getClientIp(req));
  protectDevice(getDeviceId(req));
  return account;
}

function requireAccount(req, res) {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const session = sessions.get(token);
  const account = session ? accounts[session.username] : null;
  const timeout = getDeviceTimeout(getDeviceId(req));
  if (timeout.timedOut) {
    sendJson(res, 423, { error: "device timed out", ...timeout });
    return null;
  }

  if (!account) {
    sendJson(res, 401, { error: "login required" });
    return null;
  }

  return { username: session.username, account };
}

function requireSiteAccess(req, res) {
  const timeout = getDeviceTimeout(getDeviceId(req));
  if (timeout.timedOut) {
    sendJson(res, 423, { error: "device timed out", ...timeout });
    return false;
  }

  const token = String(req.headers["x-site-token"] || "");
  if (!isValidSiteToken(token)) {
    sendJson(res, 403, { error: "site password required" });
    return false;
  }
  return true;
}

function isValidSiteToken(token) {
  return String(token || "") === SITE_TOKEN || Boolean(token && siteSessions.has(String(token)));
}

function handleDeviceStatus(req, res) {
  const deviceId = getDeviceId(req);
  sendJson(res, 200, {
    deviceId,
    signupBlocked: signupBlockedDevices.has(deviceId),
    ...getDeviceTimeout(deviceId)
  });
}

function getDeviceId(req, body = null) {
  return normalizeDeviceId(req.headers["x-device-id"] || body?.deviceId || "");
}

function normalizeDeviceId(deviceId) {
  return String(deviceId || "").trim().replace(/[^a-zA-Z0-9._:-]/g, "").slice(0, 120);
}

function normalizeDeviceType(deviceType) {
  return deviceType === "mobile" ? "mobile" : "pc";
}

function getDeviceTimeout(deviceId) {
  const cleanId = normalizeDeviceId(deviceId);
  const until = cleanId ? deviceTimeouts.get(cleanId) || 0 : 0;
  if (until && until <= Date.now()) {
    deviceTimeouts.delete(cleanId);
    saveDeviceRules();
  }
  const activeUntil = cleanId ? deviceTimeouts.get(cleanId) || 0 : 0;
  const remainingMs = Math.max(0, activeUntil - Date.now());
  return {
    timedOut: remainingMs > 0 && !isProtectedDevice(cleanId),
    timeoutUntil: remainingMs > 0 ? new Date(activeUntil).toISOString() : "",
    remainingMs
  };
}

function rememberAccountDevice(account, req, deviceId) {
  const cleanId = normalizeDeviceId(deviceId);
  if (!account || !cleanId) return;
  account.lastDeviceId = cleanId;
  account.lastDeviceSeenAt = new Date().toISOString();
  if (req) {
    account.lastIp = getClientIp(req);
    account.lastUserAgent = String(req.headers["user-agent"] || "");
  }
}

function protectDevice(deviceId) {
  const cleanId = normalizeDeviceId(deviceId);
  if (cleanId) {
    protectedDeviceIds.add(cleanId);
    deviceTimeouts.delete(cleanId);
    signupBlockedDevices.delete(cleanId);
    saveDeviceRules();
  }
}

function isProtectedDevice(deviceId) {
  return protectedDeviceIds.has(normalizeDeviceId(deviceId));
}

function timeoutConnectedDevice(deviceId, timeoutUntil) {
  const cleanId = normalizeDeviceId(deviceId);
  for (const client of connectedSockets) {
    if (client.deviceId === cleanId) {
      send(client, { type: "device-timeout", timeoutUntil });
      client.socket.end();
    }
  }
}

function recordSecurityEvent(req, attempts) {
  const event = {
    time: new Date().toISOString(),
    ip: getClientIp(req),
    userAgent: String(req.headers["user-agent"] || ""),
    forwardedFor: String(req.headers["x-forwarded-for"] || ""),
    attempts,
    blocked: blockedIps.has(getClientIp(req)),
    protected: isProtectedIp(getClientIp(req))
  };
  securityEvents.push(event);
  while (securityEvents.length > 100) securityEvents.shift();
  broadcastSecurityAlert(event);
}

function broadcastSecurityAlert(event) {
  for (const client of connectedSockets) {
    if (client.isAdmin) send(client, { type: "security-alert", event });
  }
}

function getClientIp(req) {
  return String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "")
    .split(",")[0]
    .trim();
}

function protectIp(ip) {
  const normalized = normalizeIp(ip);
  if (normalized) protectedIps.add(normalized);
  for (const localIp of getLocalIps()) protectedIps.add(normalizeIp(localIp));
}

function isProtectedIp(ip) {
  return protectedIps.has(normalizeIp(ip)) || getLocalIps().some((localIp) => normalizeIp(localIp) === normalizeIp(ip));
}

function normalizeIp(ip) {
  return String(ip || "").replace(/^::ffff:/, "");
}

function getLocalIps() {
  const ips = ["127.0.0.1", "::1"];
  for (const details of Object.values(os.networkInterfaces())) {
    for (const item of details || []) {
      if (item.family === "IPv4") ips.push(item.address);
    }
  }
  return ips;
}

function pruneChatMessages() {
  const now = Date.now();
  for (let index = chatMessages.length - 1; index >= 0; index -= 1) {
    const message = chatMessages[index];
    const created = Date.parse(message.createdAt) || now;
    const ttl = ["media", "gif"].includes(message.kind) ? MEDIA_TTL_MS : CHAT_TTL_MS;
    if (created < now - ttl) {
      chatMessages.splice(index, 1);
    }
  }
}

function readJson(req) {
  return readRequestBody(req, 1024 * 1024).then((body) => JSON.parse(body.toString("utf8") || "{}"));
}

function loadAccounts() {
  try {
    return JSON.parse(fs.readFileSync(ACCOUNTS_PATH, "utf8"));
  } catch {
    return {};
  }
}

function saveAccounts() {
  fs.writeFileSync(ACCOUNTS_PATH, JSON.stringify(accounts, null, 2));
}

function loadDeviceRules() {
  try {
    return JSON.parse(fs.readFileSync(DEVICE_RULES_PATH, "utf8"));
  } catch {
    return { deviceTimeouts: [], signupBlockedDevices: [] };
  }
}

function saveDeviceRules() {
  fs.writeFileSync(DEVICE_RULES_PATH, JSON.stringify({
    deviceTimeouts: [...deviceTimeouts.entries()].filter(([, until]) => until > Date.now()),
    signupBlockedDevices: [...signupBlockedDevices]
  }, null, 2));
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || "").split(":");
  if (!salt || !hash) return false;
  const actual = crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(actual, "hex"));
}

function normalizeAccountName(username) {
  return String(username || "").trim().slice(0, 28);
}

function readRequestBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error("Upload too large."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function parseMultipartFile(body, contentType, fieldName) {
  const boundaryMatch = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
  const boundaryText = boundaryMatch?.[1] || boundaryMatch?.[2];
  if (!boundaryText) return null;

  const boundary = Buffer.from(`--${boundaryText.trim()}`);
  const headerBreak = Buffer.from("\r\n\r\n");
  let cursor = body.indexOf(boundary);

  while (cursor !== -1) {
    cursor += boundary.length;
    if (body[cursor] === 45 && body[cursor + 1] === 45) break;
    if (body[cursor] === 13 && body[cursor + 1] === 10) cursor += 2;

    const headerEnd = body.indexOf(headerBreak, cursor);
    if (headerEnd === -1) break;

    const headers = body.subarray(cursor, headerEnd).toString("latin1");
    const nextBoundary = body.indexOf(boundary, headerEnd + headerBreak.length);
    if (nextBoundary === -1) break;

    let dataEnd = nextBoundary;
    if (body[dataEnd - 2] === 13 && body[dataEnd - 1] === 10) dataEnd -= 2;

    const disposition = /content-disposition:\s*form-data;([^\r\n]+)/i.exec(headers)?.[1] || "";
    const name = /name="([^"]+)"/i.exec(disposition)?.[1] || "";
    const filename = /filename="([^"]*)"/i.exec(disposition)?.[1] || "";
    const type = /content-type:\s*([^\r\n]+)/i.exec(headers)?.[1]?.trim() || "application/octet-stream";

    if (name === fieldName && filename) {
      return {
        filename: sanitizeFilename(filename),
        type,
        data: Buffer.from(body.subarray(headerEnd + headerBreak.length, dataEnd))
      };
    }

    cursor = nextBoundary;
  }

  return null;
}

function sanitizeFilename(filename) {
  return path.basename(filename).replace(/[^a-z0-9._-]/gi, "_").slice(0, 120) || "profile";
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Site-Token, X-Device-Id"
  });
  res.end(body === null ? "" : JSON.stringify(body));
}

function getHostInfo() {
  const urls = [];
  for (const details of Object.values(os.networkInterfaces())) {
    for (const item of details || []) {
      if (item.family === "IPv4" && !item.internal) {
        urls.push(`http://${item.address}:${PORT}`);
      }
    }
  }

  return {
    phoneUrl: urls[0] || "",
    urls
  };
}

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Calling website running at http://localhost:${PORT}`);
  for (const url of getHostInfo().urls) {
    console.log(`Phone/LAN URL: ${url}`);
  }
});

setInterval(pruneChatMessages, 60 * 60 * 1000).unref();
setInterval(() => {
  const now = Date.now();
  for (const client of [...connectedSockets]) {
    if (client.account && now - client.lastSeen > 90 * 1000) {
      client.socket.destroy();
      disconnectClient(client);
    }
  }
  broadcastPresenceSync();
}, 10 * 1000).unref();
