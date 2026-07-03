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

  renderBook();
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
    tryEncounter();
  } else if (type === "play") {
    if (state.energy < 10) {
      showMessage("つかれてるみたい…ごはんか休けいがひつようだよ");
      return;
    }
    openToyModal();
  }
}

const CATS = [
  { id: "milk", name: "ミルク", img: "assets/cats/main_cat.png" },
  { id: "gray_tabby", name: "グレーのトラねこ", img: "assets/cats/gray_tabby_cat.png" },
  { id: "white_fluffy", name: "まっしろもふもふ", img: "assets/cats/white_fluffy_cat.png" },
  { id: "brown_tabby", name: "茶トラ", img: "assets/cats/brown_tabby_cat.png" },
  { id: "black", name: "黒ねこ", img: "assets/cats/black_cat.png" },
  { id: "hachiware", name: "ハチワレ", img: "assets/cats/hachiware_cat.png" },
];
const SILHOUETTE_IMG = "assets/cats/hidden_cat_silhouette.png";

function renderBook() {
  document.getElementById("discoveredCount").textContent = state.discovered.length;
  document.getElementById("totalCount").textContent = CATS.length;

  const html = CATS.map(function (cat) {
    const found = state.discovered.includes(cat.id);
    return (
      '<div class="book-entry' + (found ? " registered" : "") + '">' +
      '<img src="' + (found ? cat.img : SILHOUETTE_IMG) + '" alt="" />' +
      '<div class="book-entry-name">' + (found ? cat.name : "？？？") + "</div>" +
      "</div>"
    );
  }).join("");

  document.getElementById("bookGrid").innerHTML = html;
  document.getElementById("modalBookGrid").innerHTML = html;
}

function openBook() {
  document.getElementById("bookModal").classList.add("open");
}

function closeBook() {
  document.getElementById("bookModal").classList.remove("open");
}

function encounterChance() {
  return Math.min(0.25 + state.level * 0.02, 0.5);
}

function tryEncounter() {
  const hidden = CATS.filter(function (cat) {
    return !state.discovered.includes(cat.id);
  });
  if (hidden.length === 0) return;
  if (Math.random() >= encounterChance()) return;

  const cat = hidden[Math.floor(Math.random() * hidden.length)];
  state.discovered.push(cat.id);
  save();
  render();

  document.getElementById("foundCatImage").src = cat.img;
  document.getElementById("foundCatName").textContent = cat.name;
  document.getElementById("catFoundModal").classList.add("open");
}

function closeCatFound() {
  document.getElementById("catFoundModal").classList.remove("open");
  if (state.discovered.length === CATS.length) {
    showMessage("ずかんコンプリート！すごい！");
  }
}

const TOYS = [
  { id: "yarn", name: "毛糸玉", mood: 15, img: "assets/actions/play_yarn.png" },
  { id: "teaser", name: "ねこじゃらし", mood: 20, img: "assets/actions/toy_teaser.png" },
  { id: "ball", name: "ボール", mood: 20, img: "assets/actions/toy_ball.png" },
  { id: "mouse", name: "ねずみのおもちゃ", mood: 25, img: "assets/actions/toy_mouse.png" },
];
const TOY_DROP_RATE = 0.3;

function openToyModal() {
  const owned = TOYS.filter(function (toy) {
    return state.toys.includes(toy.id);
  });
  document.getElementById("toyGrid").innerHTML = owned
    .map(function (toy) {
      return (
        '<button type="button" class="toy-btn" onclick="playWithToy(\'' +
        toy.id +
        "')\">" +
        '<img src="' + toy.img + '" alt="" />' +
        "<span>" + toy.name + "</span>" +
        "</button>"
      );
    })
    .join("");
  document.getElementById("toyModal").classList.add("open");
}

function closeToyModal() {
  document.getElementById("toyModal").classList.remove("open");
}

function tryToyDrop() {
  const missing = TOYS.filter(function (toy) {
    return !state.toys.includes(toy.id);
  });
  if (missing.length === 0) return null;
  if (Math.random() >= TOY_DROP_RATE) return null;
  const toy = missing[Math.floor(Math.random() * missing.length)];
  state.toys.push(toy.id);
  return toy;
}

function playWithToy(toyId) {
  closeToyModal();
  const toy = TOYS.find(function (t) {
    return t.id === toyId;
  });
  state.energy = clamp(state.energy - 10);
  state.mood = clamp(state.mood + toy.mood);
  const newToy = tryToyDrop();
  finishCare("play", 8);
  if (newToy) {
    showMessage("あそんでいたら「" + newToy.name + "」をみつけた！");
  }
}

function renameCat() {
  const newName = prompt("ねこのなまえをおしえてね（8文字まで）", state.name);
  if (!newName || newName.trim() === "") return;
  state.name = newName.trim().slice(0, 8);
  save();
  render();
}

function goHome() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetGame() {
  if (!confirm("さいしょからやりなおす？（いままでのきろくはきえます）")) {
    return;
  }
  localStorage.removeItem(SAVE_KEY);
  state = defaultState();
  save();
  render();
  showMessage("あたらしいねことのせいかつがはじまるよ！");
}

load();
render();
setInterval(tick, 20000);
