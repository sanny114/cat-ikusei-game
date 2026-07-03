// ねこ育成ゲーム

const SAVE_KEY = "catGameSave";
const EXP_PER_LEVEL = 20; // 次のレベルまで level × 20

let state = defaultState();

function defaultState() {
  return {
    name: "ミルク",
    level: 1,
    exp: 0,
    hunger: 55,
    clean: 55,
    energy: 55,
    mood: 50,
    discovered: ["milk"],
    toys: ["yarn"],
  };
}

function clamp(value) {
  return Math.max(0, Math.min(100, value));
}

function save() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function load() {
  const data = localStorage.getItem(SAVE_KEY);
  if (data) {
    state = Object.assign(defaultState(), JSON.parse(data));
  }
}

function expToNext() {
  return state.level * EXP_PER_LEVEL;
}

function moodLabel() {
  if (state.mood >= 70) return "ごきげん";
  if (state.mood >= 30) return "ふつう";
  return "しょんぼり";
}

function render() {
  document.getElementById("catName").textContent = state.name;
  document.getElementById("level").textContent = state.level;
  document.getElementById("expBar").style.width =
    Math.round((state.exp / expToNext()) * 100) + "%";
  document.getElementById("mood").textContent = moodLabel();

  document.getElementById("hungerBar").style.width = state.hunger + "%";
  document.getElementById("hungerText").textContent = state.hunger;
  document.getElementById("cleanBar").style.width = state.clean + "%";
  document.getElementById("cleanText").textContent = state.clean;
  document.getElementById("energyBar").style.width = state.energy + "%";
  document.getElementById("energyText").textContent = state.energy;
}

function showMessage(text) {
  document.getElementById("message").textContent = text;
}

function tick() {
  state.hunger = clamp(state.hunger - 1);
  state.clean = clamp(state.clean - 1);
  state.energy = clamp(state.energy + 2);
  if (state.hunger < 30 || state.clean < 30) {
    state.mood = clamp(state.mood - 1);
  }
  save();
  render();
}

load();
render();
setInterval(tick, 20000);
