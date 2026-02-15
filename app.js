const jarBtn = document.getElementById("jarBtn");
const pill = document.getElementById("pill");
const noteText = document.getElementById("noteText");
const countLabel = document.getElementById("countLabel");
const resetBtn = document.getElementById("resetBtn");
const muteBtn = document.getElementById("muteBtn");

let notes = [];
let idx = 0;
let busy = false;

const INDEX_KEY = "notesJarIndex_v1";
const MUTE_KEY = "notesJarMuted_v1";

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
    // autoplay restrictions, ignore
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
    countLabel.textContent = "Note 0 of 0";
    return;
  }
  if (idx >= total) {
    countLabel.textContent = `All ${total} notes opened`;
    return;
  }
  countLabel.textContent = `Note ${idx + 1} of ${total}`;
}

function parseNotes(text) {
  // Notes separated by a line containing only ---
  // Supports Windows line endings too
  const cleaned = text.replace(/\r\n/g, "\n");
  return cleaned
    .split("\n---\n")
    .map(s => s.trim())
    .filter(Boolean);
}

async function loadNotes() {
  const res = await fetch("notes.txt", { cache: "no-store" });
  if (!res.ok) throw new Error("Could not load notes.txt");
  const text = await res.text();

  notes = parseNotes(text);
  idx = loadIndex();
  if (idx > notes.length) idx = notes.length;

  setCount();
}

function nextNote() {
  if (notes.length === 0) return "No notes found.";
  if (idx >= notes.length) return "That’s all for now. You opened every note.";

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
  pill.classList.remove("is-visible", "is-open");
  pill.setAttribute("aria-hidden", "true");
}

/* Animation sequence */
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function playSequence() {
  if (busy) return;
  busy = true;

  await playClick();

  pill.setAttribute("aria-hidden", "false");
  noteText.textContent = "";

  // restart CSS animations cleanly
  pill.classList.remove("is-visible", "is-open");
  void pill.offsetWidth;

  pill.classList.add("is-visible");
  await sleep(420);

  pill.classList.add("is-open");
  await sleep(720);

  noteText.textContent = nextNote();

  await sleep(200);
  busy = false;
}

/* Events */
jarBtn.addEventListener("click", playSequence);
jarBtn.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") playSequence();
});

resetBtn.addEventListener("click", resetProgress);

muteBtn.addEventListener("click", () => {
  setMuted(!isMuted());
});

/* Init */
setMuted(isMuted());

loadNotes().catch(err => {
  noteText.textContent = "Could not load notes. Check notes.txt exists.";
  console.error(err);
});
