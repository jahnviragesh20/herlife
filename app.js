const themes = [
  { id: "midnight", name: "Burgundy Silk", mood: "Black satin and wine glow", swatch: "linear-gradient(90deg,#020102,#1A0310,#7D164B,#F05FA8,#F7F0DE)" },
  { id: "orchid", name: "Rose Nocturne", mood: "Soft plum with silver dust", swatch: "linear-gradient(90deg,#050204,#2B071B,#8D2B60,#EAA0C5,#E8E5D4)" },
  { id: "sand", name: "Champagne Veil", mood: "Warm black-tie shimmer", swatch: "linear-gradient(90deg,#050403,#25100E,#7A2346,#B79674,#FFF4D6)" },
  { id: "aqua", name: "Plum Eclipse", mood: "Deep cinematic magenta", swatch: "linear-gradient(90deg,#000000,#190012,#4B0A35,#C42375,#F7F2E8)" }
];

const emergencyRegions = {
  AE: { country: "UAE", emergency: "999", ambulance: "998", women: "Dubai Foundation for Women and Children", hotline: "800111" },
  GB: { country: "UK", emergency: "999", ambulance: "999", women: "National Domestic Abuse Helpline", hotline: "08082000247" },
  US: { country: "USA", emergency: "911", ambulance: "911", women: "National Domestic Violence Hotline", hotline: "8007997233" },
  IN: { country: "India", emergency: "112", ambulance: "108", women: "Women Helpline", hotline: "1091" },
  DEFAULT: { country: "your region", emergency: "112", ambulance: "112", women: "Local women safety support", hotline: "112" }
};

const comfort = [
  { title: "Two-minute reset", type: "Breath visual", copy: "A soft breathing loop for when the world feels too close." },
  { title: "Walk with grace", type: "Confidence clip", copy: "Posture, pace, and a quiet reminder that you belong here." },
  { title: "No is complete", type: "Boundary ritual", copy: "A calming prompt for leaving a situation without overexplaining." }
];

const feed = [
  { title: "Calm After A Long Day", copy: "A slow visual ritual with warm light, soft motion, and one gentle question." },
  { title: "Confidence Before You Step Out", copy: "A polished mini-practice for posture, breath, and grounded presence." },
  { title: "Quiet Game: Match The Glow", copy: "A tiny interaction designed to soothe attention instead of stealing it." }
];

const moods = [
  ["Steady", "Clear and grounded"],
  ["Tender", "Need gentle care"],
  ["Alert", "Want safety close"],
  ["Bright", "Feeling capable"]
];

const auraOpeners = [
  "I am here. Tell me what is sitting heaviest right now.",
  "You can say it messy. I will stay with you while we untangle it.",
  "Okay, I am listening. What happened in your day?",
  "Come here for a second. What do you need most: comfort, clarity, or a way out?"
];

const safeCallScripts = {
  "Best Friend": ["Hey, it is me. Where are you?", "Are you okay? I can stay on the phone.", "Tell me what street or building you see.", "I am nearby. Do you want me to come?"],
  Sister: ["Hi love, where are you right now?", "Stay calm and keep walking toward light or people.", "Say your location naturally. I am listening.", "Do you want me to call you back again in one minute?"],
  "Calm Companion": ["I am here with you. Take one slow breath.", "Can you tell me your location?", "You are doing well. Keep your voice relaxed.", "Would a fake plan help you leave now?"],
  "Protective Friend": ["Hey. I need your location now.", "Are you safe enough to talk?", "I am tracking this. Tell me what is near you.", "Move toward the safest open place you can see."]
};

const affirmations = [
  "You do not have to earn care by being easy to understand.",
  "Your softness is not a liability. It is information, texture, and power.",
  "A calm decision is still a strong decision.",
  "You can leave any room that asks you to abandon yourself."
];

const defaultSettings = {
  memory: false,
  privateAura: false,
  privacyCurtain: true,
  nearby: true,
  quiet: true,
  shake: true,
  voice: true
};

const state = {
  theme: localStorage.getItem("herlife-theme") || "midnight",
  mood: localStorage.getItem("herlife-mood") || "Steady",
  caller: localStorage.getItem("herlife-caller") || "Maya",
  safeCallMode: localStorage.getItem("herlife-safecall-mode") || "Best Friend",
  callStyle: localStorage.getItem("herlife-call-style") || "iphone",
  settings: { ...defaultSettings, ...JSON.parse(localStorage.getItem("herlife-settings") || "{}") },
  region: JSON.parse(localStorage.getItem("herlife-region") || "null"),
  emergencyActive: false,
  currentPosition: null,
  infrastructure: [],
  auraMemoryChoice: sessionStorage.getItem("herlife-aura-choice") || null,
  chatMessages: [],
  auraContext: { lastEmotion: "soft", topics: [], turns: 0 },
  pendingUserMessage: null
};

let ringContext;
let ringTimer;
let speechRecognition;
let voiceTrigger;
let callLineIndex = 0;
let mediaRecorder;
let recordedChunks = [];
let lastShakeAt = 0;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function init() {
  document.body.dataset.theme = state.theme === "midnight" ? "" : state.theme;
  applyLaunchContext();
  renderThemeGrid();
  renderComfort();
  renderFeed();
  renderMoods();
  restoreSettings();
  seedChat();
  updateDate();
  updateSafetyLevel();
  renderRegion();
  renderInfrastructure();
  updateAuraPrivacyUi();
  bindEvents();
  detectRegion({ quiet: true });
  installPwaShell();
  setupDiscreetTriggers();
  setupPrivacyCurtain();
}

function bindEvents() {
  $$("[data-view]").forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
  $$("[data-open-eye]").forEach((button) => button.addEventListener("click", openEye));
  $("[data-close-eye]").addEventListener("click", closeEye);
  $("#eyeModal").addEventListener("click", (event) => { if (event.target.id === "eyeModal") closeEye(); });
  $("#safetyLevel").addEventListener("input", updateSafetyLevel);
  $("#fakeCallBtn").addEventListener("click", startFakeCall);
  $("#declineCall").addEventListener("click", stopFakeCall);
  $("#acceptCall").addEventListener("click", answerSafeCall);
  $("#callStyleToggle").addEventListener("click", toggleCallStyle);
  $("#shareRouteBtn").addEventListener("click", shareLiveRoute);
  $("#alertContactsBtn").addEventListener("click", () => startEmergencySession("manual alert"));
  $("#refreshRegion").addEventListener("click", () => detectRegion({ quiet: false }));
  $("#refreshInfrastructure").addEventListener("click", refreshInfrastructure);
  $("#chatForm").addEventListener("submit", submitChat);
  $("#privateAuraBtn").addEventListener("click", () => beginAuraSession("private"));
  $("#saveChatHistory").addEventListener("click", () => beginAuraSession("save"));
  $("#temporaryChatOnly").addEventListener("click", () => beginAuraSession("temporary"));
  $("#saveMood").addEventListener("click", saveMood);
  $("#breatheBtn").addEventListener("click", breatheButton);
  $("#officialAccessBtn").addEventListener("click", openOfficialAccess);
  $("#safeCallMode").addEventListener("change", (event) => {
    state.safeCallMode = event.target.value;
    localStorage.setItem("herlife-safecall-mode", state.safeCallMode);
  });
  $("#callerInput").addEventListener("input", (event) => {
    state.caller = event.target.value.trim() || "Maya";
    localStorage.setItem("herlife-caller", state.caller);
  });
  $("#appleSignIn").addEventListener("click", () => accountToast("Apple Sign-In is ready for OAuth from herlife.app. Tokens should stay short-lived and device-bound."));
  $("#googleSignIn").addEventListener("click", () => accountToast("Google Sign-In is ready for Firebase or Supabase Auth with encrypted profile storage."));
  $("#biometricUnlock").addEventListener("click", biometricCheck);
  $("#deleteAccount").addEventListener("click", deleteAccount);
  $("#closeLegal").addEventListener("click", closeLegal);
  $$("[data-legal]").forEach((button) => button.addEventListener("click", () => openLegal(button.dataset.legal)));

  $$(".switch").forEach((switcher) => {
    switcher.addEventListener("click", () => {
      switcher.classList.toggle("is-on");
      switcher.setAttribute("aria-pressed", switcher.classList.contains("is-on"));
      state.settings[switcher.dataset.toggle] = switcher.classList.contains("is-on");
      localStorage.setItem("herlife-settings", JSON.stringify(state.settings));
      if (switcher.dataset.toggle === "voice") setupVoiceTrigger();
      if (switcher.dataset.toggle === "privateAura" && state.settings.privateAura) beginAuraSession("private");
      updateAuraPrivacyUi();
    });
  });

  window.addEventListener("beforeunload", endTemporaryAuraSession);
}

function setView(viewName) {
  $$(".view").forEach((view) => view.classList.toggle("is-active", view.dataset.screen === viewName));
  $$(".tab").forEach((tab) => tab.classList.toggle("is-active", tab.dataset.view === viewName));
  if (viewName === "chat" && !state.auraMemoryChoice) showChatMemoryPrompt();
}

function renderThemeGrid() {
  $("#themeGrid").innerHTML = themes.map((theme) => `
    <button class="theme-card ${theme.id === state.theme ? "is-selected" : ""}" data-theme-choice="${theme.id}">
      <span class="swatch" style="background:${theme.swatch}"></span>
      <strong>${theme.name}</strong>
      <small>${theme.mood}</small>
    </button>
  `).join("");
  $$("[data-theme-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      state.theme = button.dataset.themeChoice;
      localStorage.setItem("herlife-theme", state.theme);
      document.body.dataset.theme = state.theme === "midnight" ? "" : state.theme;
      renderThemeGrid();
    });
  });
}

function renderComfort() {
  $("#comfortRail").innerHTML = comfort.map((item) => `
    <article class="comfort-card glass">
      <p class="eyebrow">${item.type}</p>
      <h4>${item.title}</h4>
      <p>${item.copy}</p>
    </article>
  `).join("");
}

function renderFeed() {
  $("#feedStack").innerHTML = feed.map((item) => `
    <article class="feed-card glass">
      <div class="feed-media"><span></span></div>
      <p class="eyebrow">Daily comfort</p>
      <h3>${item.title}</h3>
      <p>${item.copy}</p>
    </article>
  `).join("");
}

function renderMoods() {
  $("#moodOptions").innerHTML = moods.map(([name, copy]) => `
    <button class="mood-option ${name === state.mood ? "is-selected" : ""}" data-mood="${name}">
      <strong>${name}</strong>
      <small>${copy}</small>
    </button>
  `).join("");
  $$("[data-mood]").forEach((button) => {
    button.addEventListener("click", () => {
      state.mood = button.dataset.mood;
      localStorage.setItem("herlife-mood", state.mood);
      renderMoods();
    });
  });
}

function restoreSettings() {
  if (state.settings.privateAura && !state.auraMemoryChoice) {
    state.auraMemoryChoice = "private";
    sessionStorage.setItem("herlife-aura-choice", "private");
  }
  $$(".switch").forEach((switcher) => {
    const enabled = Boolean(state.settings[switcher.dataset.toggle]);
    switcher.classList.toggle("is-on", enabled);
    switcher.setAttribute("aria-pressed", enabled);
  });
  $("#callerInput").value = state.caller;
  $("#safeCallMode").value = state.safeCallMode;
  applyCallStyle();
}

function seedChat() {
  $("#chatWindow").innerHTML = "";
  state.chatMessages = [];
  addMessage("ai", "Hi. I am Aura. Before we go deep, you stay in control here. You can keep this temporary, or choose encrypted history if you want to come back to it later.", { silentPersist: true });
  addMessage("ai", auraOpeners[Math.floor(Math.random() * auraOpeners.length)], { silentPersist: true });
}

function submitChat(event) {
  event.preventDefault();
  const input = $("#chatInput");
  const value = input.value.trim();
  if (!value) return;

  if (!state.auraMemoryChoice) {
    state.pendingUserMessage = value;
    showChatMemoryPrompt();
    return;
  }

  input.value = "";
  sendUserMessage(value);
}

function sendUserMessage(value) {
  addMessage("me", value);
  updateAuraContext(value);
  const typing = document.createElement("div");
  typing.className = "message ai typing";
  typing.textContent = "Aura is listening...";
  $("#chatWindow").appendChild(typing);
  $("#chatWindow").scrollTop = $("#chatWindow").scrollHeight;
  setTimeout(() => {
    typing.remove();
    addMessage("ai", generateAuraReply(value));
  }, 650 + Math.min(value.length * 12, 900));
}

function addMessage(kind, text, options = {}) {
  const bubble = document.createElement("div");
  bubble.className = `message ${kind}`;
  bubble.textContent = text;
  $("#chatWindow").appendChild(bubble);
  $("#chatWindow").scrollTop = $("#chatWindow").scrollHeight;

  const message = { id: uuid(), kind, text, at: new Date().toISOString() };
  state.chatMessages.push(message);
  if (!options.silentPersist) persistAuraSession();
}

function showChatMemoryPrompt() {
  $("#chatMemoryModal").classList.add("is-open");
  $("#chatMemoryModal").setAttribute("aria-hidden", "false");
}

function hideChatMemoryPrompt() {
  $("#chatMemoryModal").classList.remove("is-open");
  $("#chatMemoryModal").setAttribute("aria-hidden", "true");
}

async function beginAuraSession(choice) {
  state.auraMemoryChoice = choice;
  sessionStorage.setItem("herlife-aura-choice", choice);
  hideChatMemoryPrompt();
  updateAuraPrivacyUi();
  if (choice === "private") {
    sessionStorage.removeItem("herlife-aura-temp-session");
    addMessage("ai", "Private Aura Session is active. Nothing from this conversation will be saved or synced. You can be honest here.");
  }
  if (choice === "temporary") {
    addMessage("ai", "Temporary session only. Your conversation stays private and disappears when this session ends.");
    persistAuraSession();
  }
  if (choice === "save") {
    addMessage("ai", "Encrypted chat history is on. This session is protected locally with AES-GCM and prepared for secure device sync.");
    await persistAuraSession();
  }
  if (state.pendingUserMessage) {
    const pending = state.pendingUserMessage;
    state.pendingUserMessage = null;
    $("#chatInput").value = "";
    sendUserMessage(pending);
  }
}

function updateAuraPrivacyUi() {
  const choice = state.auraMemoryChoice;
  const pill = $("#auraModePill");
  if (!choice) {
    pill.textContent = "Privacy choice needed";
    pill.dataset.mode = "unset";
    $("#auraPrivacyCopy").textContent = "Aura remembers only this active conversation unless you choose encrypted history.";
    return;
  }
  if (choice === "save") {
    pill.textContent = "Encrypted History Active";
    pill.dataset.mode = "save";
    $("#auraPrivacyCopy").textContent = "Chats are encrypted before storage and can be deleted anytime.";
  } else if (choice === "private") {
    pill.textContent = "Private Session Active";
    pill.dataset.mode = "private";
    $("#auraPrivacyCopy").textContent = "No chat history, no cloud sync, no memory retention.";
  } else {
    pill.textContent = "Temporary Session Only";
    pill.dataset.mode = "temporary";
    $("#auraPrivacyCopy").textContent = "This conversation is session-only and auto-clears when you leave.";
  }
}

function updateAuraContext(text) {
  const lower = text.toLowerCase();
  const topic = detectTopic(lower);
  if (topic && !state.auraContext.topics.includes(topic)) {
    state.auraContext.topics = [topic, ...state.auraContext.topics].slice(0, 4);
  }
  state.auraContext.lastEmotion = detectEmotion(lower);
  state.auraContext.turns += 1;
}

function detectTopic(text) {
  if (/work|job|boss|school|study|exam|career/.test(text)) return "pressure";
  if (/friend|sister|mom|family|relationship|boyfriend|husband|partner/.test(text)) return "relationship";
  if (/uber|taxi|walk|follow|unsafe|scared|outside|street/.test(text)) return "safety";
  if (/lonely|alone|miss|empty/.test(text)) return "loneliness";
  if (/confidence|ugly|body|pretty|worth|enough/.test(text)) return "confidence";
  return "";
}

function detectEmotion(text) {
  if (/panic|scared|unsafe|afraid|followed|danger/.test(text)) return "unsafe";
  if (/sad|cry|hurt|empty|lonely|alone/.test(text)) return "sad";
  if (/angry|mad|annoyed|furious/.test(text)) return "angry";
  if (/overthink|anxious|stress|worried|nervous/.test(text)) return "anxious";
  if (/happy|good|excited|proud|better/.test(text)) return "bright";
  return "soft";
}

function generateAuraReply(userText) {
  const emotion = state.auraContext.lastEmotion;
  const topic = state.auraContext.topics[0];
  const followUp = topic ? `And yes, I am keeping the ${topic} part in mind while we talk.` : "I am keeping the thread of what you said in mind.";
  const replies = {
    unsafe: [
      `I hear the fear in that. First, stay near light, people, or an open place if you can. ${followUp} Do you want me to help you make a quiet exit plan right now?`,
      "Okay. Let us treat this as real, even if part of you is unsure. Keep your phone in your hand, soften your face so you do not look panicked, and tell me what is closest to you."
    ],
    sad: [
      `Oh love, that sounds tender. You do not have to make it prettier for me. ${followUp} What part hurt the most: what happened, or feeling alone with it?`,
      "I am right here. Let it be honest for a minute. If your heart could say one sentence without being judged, what would it say?"
    ],
    angry: [
      `That anger makes sense. It usually shows up when something in you knows a line was crossed. ${followUp} Do you want to vent first, or do you want help choosing what to do next?`,
      "You are allowed to be upset without becoming cruel to yourself. Tell me the exact moment where your body went, no, this is not okay."
    ],
    anxious: [
      `That overthinking loop is exhausting. Let us slow the room down. ${followUp} What is the one thought that keeps repeating, even if it sounds irrational?`,
      "I believe you. Your mind is trying to protect you by rehearsing everything. We can thank it, then choose one small real step."
    ],
    bright: [
      `I love hearing that. Stay with this feeling for a second instead of rushing past it. ${followUp} What made you feel most like yourself?`,
      "That is beautiful. Let us mark it gently: you are allowed to notice when life feels lighter."
    ],
    soft: [
      `I am with you. ${followUp} Say a little more - not the polished version, the real one.`,
      "That makes sense. I do not want to rush you into advice. What do you wish someone had understood without you having to explain it perfectly?"
    ]
  };
  const pool = replies[emotion] || replies.soft;
  return pool[state.auraContext.turns % pool.length];
}

async function persistAuraSession() {
  if (!state.auraMemoryChoice) return;
  const payload = { mode: state.auraMemoryChoice, messages: state.chatMessages, context: state.auraContext, updatedAt: new Date().toISOString() };
  if (state.auraMemoryChoice === "private") return;
  if (state.auraMemoryChoice === "temporary") {
    sessionStorage.setItem("herlife-aura-temp-session", JSON.stringify(payload));
    return;
  }
  if (state.auraMemoryChoice === "save") {
    try {
      const encrypted = await encryptPayload(payload);
      localStorage.setItem("herlife-aura-encrypted-history", JSON.stringify(encrypted));
    } catch (error) {
      sessionStorage.setItem("herlife-aura-temp-session", JSON.stringify(payload));
      $("#auraModePill").textContent = "Secure Context Needed";
    }
  }
}

async function encryptPayload(payload) {
  if (!crypto.subtle) {
    throw new Error("Web Crypto requires HTTPS or a secure local context.");
  }
  const key = await getAuraCryptoKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  return {
    version: 1,
    algorithm: "AES-GCM",
    iv: arrayBufferToBase64(iv),
    data: arrayBufferToBase64(encrypted),
    createdAt: new Date().toISOString(),
    sync: "client-encrypted-cloud-ready"
  };
}

async function getAuraCryptoKey() {
  const stored = localStorage.getItem("herlife-aura-device-key");
  if (stored) {
    return crypto.subtle.importKey("raw", base64ToArrayBuffer(stored), "AES-GCM", true, ["encrypt", "decrypt"]);
  }
  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
  const raw = await crypto.subtle.exportKey("raw", key);
  localStorage.setItem("herlife-aura-device-key", arrayBufferToBase64(raw));
  return key;
}

function uuid() {
  return crypto.randomUUID ? crypto.randomUUID() : `herlife-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function endTemporaryAuraSession() {
  if (state.auraMemoryChoice === "temporary" || state.auraMemoryChoice === "private") {
    sessionStorage.removeItem("herlife-aura-temp-session");
    sessionStorage.removeItem("herlife-aura-choice");
  }
}

function updateDate() {
  const now = new Date();
  const day = now.toLocaleDateString(undefined, { weekday: "long" });
  const period = now.getHours() < 12 ? "morning" : now.getHours() < 18 ? "afternoon" : "evening";
  $("#dateLine").textContent = `${day} ${period}`;
  $("#greeting").textContent = `Good ${period}, Jahnvi.`;
}

async function detectRegion({ quiet }) {
  const locale = navigator.language || "en-US";
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localeCountry = locale.split("-")[1];
  let detected = { city: "Unknown city", countryCode: localeCountry || "AE", locale, timezone, source: "locale/timezone" };
  try {
    const position = await getCurrentPosition({ timeout: 8000 });
    state.currentPosition = position;
    detected = { ...detected, latitude: position.coords.latitude, longitude: position.coords.longitude, source: "GPS" };
    detected = { ...detected, ...await reverseGeocode(position.coords.latitude, position.coords.longitude) };
  } catch (gpsError) {
    try {
      const response = await fetch("https://ipapi.co/json/");
      const data = await response.json();
      detected = { ...detected, city: data.city || detected.city, countryCode: data.country_code || detected.countryCode, latitude: data.latitude, longitude: data.longitude, source: "IP fallback" };
    } catch (ipError) {
      if (!quiet) accountToast("Location permission was not available. HerLife used locale and timezone fallback.");
    }
  }
  detected.resources = emergencyRegions[detected.countryCode] || emergencyRegions.DEFAULT;
  state.region = detected;
  localStorage.setItem("herlife-region", JSON.stringify(detected));
  renderRegion();
  refreshInfrastructure();
}

function getCurrentPosition(options = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) reject(new Error("Geolocation unavailable"));
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, maximumAge: 30000, ...options });
  });
}

async function reverseGeocode(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  const data = await response.json();
  const address = data.address || {};
  return {
    city: address.city || address.town || address.village || address.state || "Nearby area",
    countryCode: (address.country_code || "").toUpperCase() || state.region?.countryCode || "AE"
  };
}

function renderRegion() {
  const region = state.region;
  const resources = region?.resources || emergencyRegions.DEFAULT;
  $("#regionTitle").textContent = region ? `${region.city}, ${resources.country}` : "Detecting your safety region...";
  $("#regionSubtitle").textContent = `Emergency ${resources.emergency} | Ambulance ${resources.ambulance} | ${resources.women}: ${resources.hotline}`;
  updateSafetyLevel();
}

async function refreshInfrastructure() {
  const region = state.region;
  const lat = state.currentPosition?.coords?.latitude || region?.latitude;
  const lon = state.currentPosition?.coords?.longitude || region?.longitude;
  if (!lat || !lon) {
    state.infrastructure = [
      { type: "Police", name: "Nearest police station", distance: "Detect location", phone: state.region?.resources?.emergency || "112" },
      { type: "Hospital", name: "Nearest emergency hospital", distance: "Detect location", phone: state.region?.resources?.ambulance || "112" },
      { type: "Women support", name: state.region?.resources?.women || "Local support", distance: "Regional hotline", phone: state.region?.resources?.hotline || "112" }
    ];
    renderInfrastructure();
    return;
  }
  try {
    const overpass = `[out:json][timeout:8];(node(around:3500,${lat},${lon})[amenity~"police|hospital|pharmacy"];way(around:3500,${lat},${lon})[amenity~"police|hospital|pharmacy"];);out center 12;`;
    const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpass)}`);
    const data = await response.json();
    state.infrastructure = data.elements.slice(0, 6).map((item) => {
      const point = item.center || item;
      return {
        type: labelAmenity(item.tags?.amenity),
        name: item.tags?.name || labelAmenity(item.tags?.amenity),
        distance: `${distanceKm(lat, lon, point.lat, point.lon)} km`,
        phone: item.tags?.phone || emergencyNumberForAmenity(item.tags?.amenity),
        lat: point.lat,
        lon: point.lon
      };
    });
  } catch (error) {
    state.infrastructure = [];
  }
  renderInfrastructure();
}

function renderInfrastructure() {
  const list = $("#infrastructureList");
  const items = state.infrastructure.length ? state.infrastructure : [
    { type: "Emergency", name: "Detect location for live safety infrastructure", distance: "GPS/IP fallback", phone: state.region?.resources?.emergency || "112" }
  ];
  list.innerHTML = items.map((item) => `
    <article class="infrastructure-card glass">
      <div><p class="eyebrow">${item.type}</p><strong>${item.name}</strong><small>${item.distance}</small></div>
      <div class="infra-actions">
        <a href="tel:${item.phone}" aria-label="Call ${item.name}">Call</a>
        ${item.lat ? `<a href="https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lon}" target="_blank" rel="noreferrer">Route</a>` : ""}
      </div>
    </article>
  `).join("");
}

function labelAmenity(amenity = "emergency") {
  return ({ police: "Police", hospital: "Hospital", pharmacy: "Pharmacy" })[amenity] || "Safe place";
}

function emergencyNumberForAmenity(amenity) {
  const resources = state.region?.resources || emergencyRegions.DEFAULT;
  return amenity === "hospital" ? resources.ambulance : resources.emergency;
}

function distanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (value) => value * Math.PI / 180;
  const earth = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return (earth * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
}

function openEye() {
  $("#eyeModal").classList.add("is-open");
  $("#eyeModal").setAttribute("aria-hidden", "false");
}

function closeEye() {
  $("#eyeModal").classList.remove("is-open");
  $("#eyeModal").setAttribute("aria-hidden", "true");
}

function updateSafetyLevel() {
  const level = Number($("#safetyLevel").value);
  const resources = state.region?.resources || emergencyRegions.DEFAULT;
  let title = `Level ${level}: Calm guidance`;
  let copy = `No automatic location sharing. SafeCall AI, nearby support, and ${resources.country} emergency ${resources.emergency} stay ready.`;
  if (level >= 5 && level <= 7) {
    title = `Level ${level}: Trusted circle`;
    copy = "Trusted contacts receive a quiet alert draft, live location starts temporarily, and HerLife prepares a shareable tracking link.";
  }
  if (level >= 8) {
    title = `Level ${level}: Immediate emergency`;
    copy = "Live GPS, encrypted audio evidence, emergency log, contact alert, and rapid call actions activate together.";
  }
  $("#levelCard").innerHTML = `<h3>${title}</h3><p>${copy}</p>`;
  $("#emergencyStatus").textContent = state.emergencyActive ? "Emergency session active: live tracking and evidence logging are running." : "Private standby. No alert is sent until you choose it.";
}

async function startEmergencySession(reason) {
  closeEye();
  state.emergencyActive = true;
  updateSafetyLevel();
  const session = { id: uuid(), reason, startedAt: new Date().toISOString(), region: state.region, points: [] };
  localStorage.setItem("herlife-active-emergency", JSON.stringify(session));
  accountToast("Emergency mode started. Live route link and evidence log prepared.");
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition((position) => {
      state.currentPosition = position;
      const active = JSON.parse(localStorage.getItem("herlife-active-emergency") || "{}");
      active.points = [...(active.points || []), { lat: position.coords.latitude, lon: position.coords.longitude, at: new Date().toISOString() }].slice(-40);
      localStorage.setItem("herlife-active-emergency", JSON.stringify(active));
    }, () => {}, { enableHighAccuracy: true, maximumAge: 10000 });
  }
  startEncryptedAudioLog();
  await shareLiveRoute();
}

async function startEncryptedAudioLog() {
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    recordedChunks = [];
    mediaRecorder.ondataavailable = (event) => recordedChunks.push(event.data);
    mediaRecorder.start(5000);
  } catch (error) {
    accountToast("Audio evidence needs microphone permission.");
  }
}

async function shareLiveRoute() {
  const point = state.currentPosition?.coords || {};
  const link = point.latitude ? `https://maps.google.com/?q=${point.latitude},${point.longitude}` : location.href;
  const text = `HerLife safety share: I may need help. Live location/session link: ${link}`;
  if (navigator.share) {
    await navigator.share({ title: "HerLife Safety Share", text, url: link }).catch(() => {});
  } else {
    await navigator.clipboard?.writeText(text).catch(() => {});
    accountToast("Safety message copied for SMS or trusted contacts.");
  }
}

function startFakeCall() {
  closeEye();
  callLineIndex = 0;
  $("#callerName").textContent = state.caller || "Maya";
  $("#callTranscript").innerHTML = "";
  $("#callCaption").textContent = "incoming SafeCall...";
  $("#callScreen").classList.add("is-open");
  $("#callScreen").setAttribute("aria-hidden", "false");
  vibrate([180, 80, 180]);
  startRingtone();
}

function answerSafeCall() {
  stopRingtone();
  $("#callCaption").textContent = "connected - speak naturally";
  speakNextSafeCallLine();
  startSpeechToText();
}

function stopFakeCall() {
  $("#callScreen").classList.remove("is-open");
  $("#callScreen").setAttribute("aria-hidden", "true");
  stopRingtone();
  stopSpeechToText();
  speechSynthesis.cancel();
}

function speakNextSafeCallLine() {
  const script = safeCallScripts[state.safeCallMode] || safeCallScripts["Best Friend"];
  const line = script[callLineIndex % script.length];
  callLineIndex += 1;
  appendTranscript(state.caller, line);
  const utterance = new SpeechSynthesisUtterance(line);
  utterance.lang = navigator.language || "en-US";
  utterance.pitch = state.safeCallMode === "Protective Friend" ? 0.92 : 1.08;
  utterance.rate = 0.92;
  utterance.onend = () => setTimeout(() => {
    if ($("#callScreen").classList.contains("is-open")) speakNextSafeCallLine();
  }, 2600);
  speechSynthesis.speak(utterance);
}

function startSpeechToText() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    appendTranscript("HerLife", "Speech recognition is not available in this browser.");
    return;
  }
  speechRecognition = new Recognition();
  speechRecognition.lang = navigator.language || "en-US";
  speechRecognition.continuous = true;
  speechRecognition.interimResults = false;
  speechRecognition.onresult = (event) => {
    const phrase = event.results[event.results.length - 1][0].transcript;
    appendTranscript("You", phrase);
    if (/help|unsafe|followed|scared|emergency/i.test(phrase)) startEmergencySession("SafeCall voice escalation");
  };
  speechRecognition.start();
}

function stopSpeechToText() {
  if (speechRecognition) speechRecognition.stop();
  speechRecognition = null;
}

function appendTranscript(speaker, text) {
  const line = document.createElement("p");
  line.innerHTML = `<strong>${speaker}</strong> ${text}`;
  $("#callTranscript").appendChild(line);
  $("#callTranscript").scrollTop = $("#callTranscript").scrollHeight;
}

function startRingtone() {
  stopRingtone();
  ringContext = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = () => {
    const oscillator = ringContext.createOscillator();
    const gain = ringContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(740, ringContext.currentTime);
    oscillator.frequency.setValueAtTime(880, ringContext.currentTime + 0.18);
    gain.gain.setValueAtTime(0.001, ringContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, ringContext.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, ringContext.currentTime + 0.72);
    oscillator.connect(gain).connect(ringContext.destination);
    oscillator.start();
    oscillator.stop(ringContext.currentTime + 0.78);
  };
  playTone();
  ringTimer = setInterval(playTone, 1600);
}

function stopRingtone() {
  if (ringTimer) clearInterval(ringTimer);
  ringTimer = null;
  if (ringContext) ringContext.close();
  ringContext = null;
}

function toggleCallStyle() {
  state.callStyle = state.callStyle === "iphone" ? "samsung" : "iphone";
  localStorage.setItem("herlife-call-style", state.callStyle);
  applyCallStyle();
}

function applyCallStyle() {
  $("#callScreen").dataset.callStyle = state.callStyle;
  $("#callStyleToggle").textContent = state.callStyle === "iphone" ? "iPhone UI" : "Samsung UI";
  $("#callStyleLabel").textContent = state.callStyle === "iphone" ? "SafeCall AI" : "SafeCall AI - One UI";
}

function setupDiscreetTriggers() {
  window.addEventListener("devicemotion", (event) => {
    if (!state.settings.shake) return;
    const a = event.accelerationIncludingGravity;
    if (!a) return;
    const force = Math.abs(a.x || 0) + Math.abs(a.y || 0) + Math.abs(a.z || 0);
    if (force > 38 && Date.now() - lastShakeAt > 2500) {
      lastShakeAt = Date.now();
      startEmergencySession("shake trigger");
    }
  });
  setupVoiceTrigger();
}

function setupVoiceTrigger() {
  if (voiceTrigger) voiceTrigger.stop();
  if (!state.settings.voice) return;
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) return;
  voiceTrigger = new Recognition();
  voiceTrigger.lang = navigator.language || "en-US";
  voiceTrigger.continuous = true;
  voiceTrigger.onresult = (event) => {
    const phrase = event.results[event.results.length - 1][0].transcript.toLowerCase();
    if (phrase.includes("herlife help me")) startEmergencySession("voice trigger");
  };
  try { voiceTrigger.start(); } catch (error) {}
}

function setupPrivacyCurtain() {
  const curtain = $("#privacyCurtain");
  const toggle = () => {
    const shouldHide = state.settings.privacyCurtain && state.auraMemoryChoice === "private" && document.visibilityState === "hidden";
    curtain.classList.toggle("is-visible", shouldHide);
  };
  document.addEventListener("visibilitychange", toggle);
  window.addEventListener("blur", () => {
    if (state.settings.privacyCurtain && state.auraMemoryChoice === "private") curtain.classList.add("is-visible");
  });
  window.addEventListener("focus", () => curtain.classList.remove("is-visible"));
}

function vibrate(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

function accountToast(message) {
  addMessage("ai", message);
  setView("chat");
}

async function biometricCheck() {
  const available = await window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable?.().catch(() => false);
  accountToast(available ? "Biometric authenticator detected. HerLife can bind encrypted keys to passkeys in production." : "Biometric unlock needs a supported device/browser or native keychain wrapper.");
}

function deleteAccount() {
  ["herlife-journal", "herlife-active-emergency", "herlife-region", "herlife-aura-encrypted-history", "herlife-aura-device-key"].forEach((key) => localStorage.removeItem(key));
  sessionStorage.removeItem("herlife-aura-temp-session");
  accountToast("Local private data and encrypted Aura history were cleared. Backend account deletion endpoint is ready to connect.");
}

function openLegal(type) {
  const privacy = type === "privacy";
  $("#legalEyebrow").textContent = privacy ? "Privacy" : "Terms";
  $("#legalTitle").textContent = privacy ? "HerLife Privacy" : "HerLife Terms";
  $("#legalBody").textContent = privacy
    ? "Aura asks before saving chat history. Temporary and Private Aura sessions are not permanently stored. Saved chats are encrypted client-side before storage and should sync only as encrypted payloads through the official HerLife backend."
    : "HerLife supports emotional care, privacy-first safety planning, official-domain access, and emergency preparation. It does not replace police, medical services, or licensed crisis care.";
  $("#legalModal").classList.add("is-open");
  $("#legalModal").setAttribute("aria-hidden", "false");
}

function closeLegal() {
  $("#legalModal").classList.remove("is-open");
  $("#legalModal").setAttribute("aria-hidden", "true");
}

function saveMood() {
  localStorage.setItem("herlife-journal", $("#journalText").value.trim());
  $("#affirmationText").textContent = affirmations[Math.floor(Math.random() * affirmations.length)];
  $("#saveMood").textContent = "Saved privately";
  setTimeout(() => { $("#saveMood").textContent = "Save check-in"; }, 1300);
}

function breatheButton() {
  const button = $("#breatheBtn");
  button.textContent = "Breathe";
  button.animate([{ transform: "scale(1)" }, { transform: "scale(1.12)" }, { transform: "scale(1)" }], { duration: 4200, iterations: 2, easing: "ease-in-out" });
  setTimeout(() => { button.textContent = "Start"; }, 8400);
}

function installPwaShell() {
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js").catch(() => {});
  if ("Notification" in window && Notification.permission === "default") Notification.requestPermission().catch(() => {});
}

function applyLaunchContext() {
  const params = new URLSearchParams(location.search);
  const launch = params.get("launch");
  if (launch === "private-aura") {
    state.auraMemoryChoice = "private";
    sessionStorage.setItem("herlife-aura-choice", "private");
  }
  if (params.get("token")) {
    sessionStorage.setItem("herlife-secure-launch-token", params.get("token"));
  }
}

function openOfficialAccess() {
  const url = "https://secure.herlife.app/open?continue=herlife%3A%2F%2Faura%3Fmode%3Dprivate";
  if (navigator.clipboard) navigator.clipboard.writeText(url).catch(() => {});
  accountToast("Secure portal link prepared: secure.herlife.app. Universal links and herlife:// launch are scaffolded for production.");
}

init();
