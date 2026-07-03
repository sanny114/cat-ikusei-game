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

const CARE_MESSAGES = {
  food: ["もぐもぐ…おいしい！", "おなかいっぱいだにゃ", "ごはんだいすき！"],
  bath: ["さっぱりしたにゃ！", "ぴかぴかになったよ", "いいにおいだにゃ"],
  walk: ["おさんぽたのしい！", "いいてんきだにゃ", "とことこ…"],
  play: ["きゃっきゃっ！たのしい！", "もっとあそぼ！", "うれしいにゃ！"],
};

function randomMessage(type) {
  const list = CARE_MESSAGES[type];
  return list[Math.floor(Math.random() * list.length)];
}

function gainExp(amount) {
  state.exp += amount;
  let leveledUp = false;
  while (state.exp >= expToNext()) {
    state.exp -= expToNext();
    state.level += 1;
    leveledUp = true;
  }
  return leveledUp;
}

function finishCare(type, exp) {
  const leveledUp = gainExp(exp);
  showMessage(
    leveledUp
      ? "レベルアップ！レベル" + state.level + "になったよ！"
      : randomMessage(type)
  );
  save();
  render();
}

function care(type) {
  if (type === "food") {
    state.hunger = clamp(state.hunger + 30);
    state.energy = clamp(state.energy + 10);
    finishCare("food", 5);
  } else if (type === "bath") {
    state.clean = clamp(state.clean + 30);
    finishCare("bath", 5);
  } else if (type === "walk") {
    if (state.energy < 15) {
      showMessage("つかれてるみたい…ごはんか休けいがひつようだよ");
      return;
    }
    state.energy = clamp(state.energy - 15);
    state.hunger = clamp(state.hunger - 10);
    state.mood = clamp(state.mood + 15);
    finishCare("walk", 8);
  } else if (type === "play") {
    if (state.energy < 10) {
      showMessage("つかれてるみたい…ごはんか休けいがひつようだよ");
      return;
    }
    state.energy = clamp(state.energy - 10);
    state.mood = clamp(state.mood + 15);
    finishCare("play", 8);
  }
}

function renameCat() {
  const newName = prompt("ねこのなまえをおしえてね（8文字まで）", state.name);
  if (!newName || newName.trim() === "") return;
  state.name = newName.trim().slice(0, 8);
  save();
  render();
}

load();
render();
setInterval(tick, 20000);
