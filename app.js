const jarBtn = document.getElementById("jarBtn");
const pill = document.getElementById("pill");
const noteText = document.getElementById("noteText");
const countLabel = document.getElementById("countLabel");
const resetBtn = document.getElementById("resetBtn");
const muteBtn = document.getElementById("muteBtn");
const specialNoteBtn = document.getElementById("specialNoteBtn");

const specialModal = document.getElementById("specialModal");
const specialModalText = document.getElementById("specialModalText");
const specialModalClose = document.getElementById("specialModalClose");
const specialModalBackdrop = document.getElementById("specialModalBackdrop");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let notes = [];
let idx = 0;
let busy = false;

const INDEX_KEY = "notesJarIndex_v1";
const MUTE_KEY = "notesJarMuted_v1";

const specialNote = `I just wanted to say that I’ve really enjoyed spending time with you lately.
Our hangouts have become something I genuinely look forward to.

The more we talk and spend time together, the more I find myself liking you.
I’d really like to keep seeing you and getting to know you better.`;

/* Sound */
const clickSound = new Audio("click.mp3");
clickSound.preload = "auto";
clickSound.volume = 0.35;

function isMuted() {
  return localStorage.getItem(MUTE_KEY) === "1";
}

function setMuted(muted) {
  localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  muteBtn.textContent = muted ? "sound: off" : "sound: on";
  muteBtn.setAttribute("aria-pressed", muted ? "true" : "false");
}

async function playClick() {
  if (isMuted()) return;
  try {
    clickSound.currentTime = 0;
    await clickSound.play();
  } catch {
    // Ignore autoplay restrictions
  }
}

/* Progress */
function loadIndex() {
  const saved = Number(localStorage.getItem(INDEX_KEY));
  return Number.isFinite(saved) && saved >= 0 ? saved : 0;
}

function saveIndex(n) {
  localStorage.setItem(INDEX_KEY, String(n));
}

function setCount() {
  const total = notes.length;

  if (total === 0) {
    countLabel.textContent = "0 / ∞";
    return;
  }

  if (idx >= total) {
    countLabel.textContent = "∞ / ∞";
    return;
  }

  countLabel.textContent = `${idx + 1} / ∞`;
}

function parseNotes(text) {
  const cleaned = text.replace(/\r\n/g, "\n");
  return cleaned
    .split("\n---\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function loadNotes() {
  const res = await fetch("notes.txt", { cache: "no-store" });
  if (!res.ok) throw new Error("Could not load notes.txt");

  notes = parseNotes(await res.text());
  idx = loadIndex();
  if (idx > notes.length) idx = notes.length;
  setCount();
}

function nextNote() {
  if (notes.length === 0) return "No notes found.";
  if (idx >= notes.length) return "That's all for now. You opened every note.";

  const msg = notes[idx];
  idx += 1;
  saveIndex(idx);
  setCount();
  return msg;
}

function resetProgress() {
  idx = 0;
  saveIndex(idx);
  setCount();

  noteText.textContent = "";
  noteText.classList.remove("is-revealing");
  pill.classList.remove("is-visible", "is-open");
  pill.setAttribute("aria-hidden", "true");
}

/* Helpers */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function revealNote(message) {
  noteText.textContent = "";
  noteText.classList.remove("is-revealing");

  if (prefersReducedMotion) {
    noteText.textContent = message;
    return;
  }

  noteText.classList.add("is-revealing");
  const chars = Array.from(message);

  for (const ch of chars) {
    noteText.textContent += ch;

    if (ch === "\n") {
      await sleep(36);
    } else if (ch === " ") {
      await sleep(14);
    } else {
      await sleep(20);
    }
  }

  noteText.classList.remove("is-revealing");
}

async function openPill() {
  pill.setAttribute("aria-hidden", "false");
  noteText.textContent = "";
  noteText.classList.remove("is-revealing");

  pill.classList.remove("is-visible", "is-open");
  void pill.offsetWidth;

  pill.classList.add("is-visible");
  await sleep(prefersReducedMotion ? 0 : 420);

  pill.classList.add("is-open");
  await sleep(prefersReducedMotion ? 0 : 720);
}

async function playJarTap() {
  await playClick();

  jarBtn.classList.add("is-tapped");
  setTimeout(() => jarBtn.classList.remove("is-tapped"), 140);
}

async function showMessage(message) {
  if (busy) return;
  busy = true;

  await playJarTap();
  await openPill();
  await revealNote(message);
  await sleep(prefersReducedMotion ? 0 : 120);

  busy = false;
}

/* Special modal */
function openSpecialModal() {
  specialModalText.textContent = specialNote;
  specialModal.classList.add("is-open");
  specialModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeSpecialModal() {
  specialModal.classList.remove("is-open");
  specialModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

/* Main flows */
async function playSequence() {
  const message = nextNote();
  await showMessage(message);
}

/* Events */
jarBtn.addEventListener("click", playSequence);

specialNoteBtn.addEventListener("click", async () => {
  await playClick();
  openSpecialModal();
});

specialModalClose.addEventListener("click", closeSpecialModal);
specialModalBackdrop.addEventListener("click", closeSpecialModal);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && specialModal.classList.contains("is-open")) {
    closeSpecialModal();
  }
});

resetBtn.addEventListener("click", resetProgress);
muteBtn.addEventListener("click", () => setMuted(!isMuted()));

/* Init */
setMuted(isMuted());

loadNotes().catch((err) => {
  noteText.textContent = "Could not load notes. Check notes.txt exists.";
  console.error(err);
});

/* Sakura petals animation */
const petalsContainer = document.querySelector(".petals-container");
const petalPool = [];
const SPAWN_INTERVAL_MS = 550;
const MAX_ACTIVE_PETALS = 28;
let petalTimerId = null;

function activePetals() {
  if (!petalsContainer) return 0;
  return petalsContainer.querySelectorAll(".petal.falling").length;
}

function createPetal() {
  if (!petalsContainer) return;
  if (activePetals() >= MAX_ACTIVE_PETALS) return;

  let petal = petalPool.pop();
  if (!petal) {
    petal = document.createElement("div");
    petal.className = "petal";
    petalsContainer.appendChild(petal);
  }

  const startX = Math.random() * (window.innerWidth + 32) - 16;
  const duration = 6200 + Math.random() * 4600;
  const delay = Math.random() * 400;
  const drift = Math.round(Math.random() * 180 - 90);
  const spin = Math.round(240 + Math.random() * 240);

  petal.style.left = `${startX}px`;
  petal.style.top = "-32px";
  petal.style.setProperty("--duration", `${duration + delay}ms`);
  petal.style.setProperty("--drift", `${drift}px`);
  petal.style.setProperty("--spin", `${spin}deg`);
  petal.style.opacity = "0";

  petal.classList.remove("falling");
  void petal.offsetWidth;
  petal.classList.add("falling");

  setTimeout(() => {
    petal.classList.remove("falling");
    petalPool.push(petal);
  }, duration + delay);
}

function startPetals() {
  if (!petalsContainer || prefersReducedMotion || petalTimerId !== null) return;

  petalTimerId = window.setInterval(() => {
    if (document.hidden) return;
    if (Math.random() < 0.72) createPetal();
  }, SPAWN_INTERVAL_MS);

  for (let i = 0; i < 5; i += 1) {
    createPetal();
  }
}

function stopPetals() {
  if (petalTimerId === null) return;
  window.clearInterval(petalTimerId);
  petalTimerId = null;
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopPetals();
  } else {
    startPetals();
  }
});

window.addEventListener("beforeunload", stopPetals);

startPetals();
