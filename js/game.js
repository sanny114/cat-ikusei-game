// ねこ育成ゲーム

const SAVE_KEY = "catGameSave";
const EXP_PER_LEVEL = 20; // 次のレベルまで level × 20
const KITTEN_UNTIL_LEVEL = 3;
const HAPPY_REACTION_MS = 3500;

let state = defaultState();
let happyReactionUntil = 0;

function defaultCatProgress() {
  return {
    level: 1,
    exp: 0,
  };
}

function defaultState() {
  return {
    level: 1,
    exp: 0,
    hunger: 55,
    clean: 55,
    energy: 55,
    mood: 50,
    discovered: ["milk"],
    toys: ["yarn"],
    mainCatId: "milk",
    catNames: {},
    catProgress: {
      milk: defaultCatProgress(),
    },
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
    const saved = JSON.parse(data);
    state = Object.assign(defaultState(), saved);
    if (!state.catProgress) {
      state.catProgress = {};
    }
    if (!saved.catProgress) {
      state.catProgress.milk = {
        level: saved.level || 1,
        exp: saved.exp || 0,
      };
    }
    if (saved.name && !saved.catNames) {
      state.catNames[state.mainCatId] = saved.name;
    }
  }
}

function getCatProgress(catId) {
  const id = catId || state.mainCatId;
  if (!state.catProgress) {
    state.catProgress = {};
  }
  if (!state.catProgress[id]) {
    state.catProgress[id] = defaultCatProgress();
  }
  return state.catProgress[id];
}

function currentLevel() {
  return getCatProgress().level;
}

function currentExp() {
  return getCatProgress().exp;
}

function expToNext() {
  return currentLevel() * EXP_PER_LEVEL;
}

function hasLowCareStatus() {
  return state.hunger < 30 || state.clean < 30 || state.energy < 30;
}

function isSadMood() {
  return hasLowCareStatus() || state.mood < 30;
}

function moodLabel() {
  if (isSadMood()) return "しょんぼり";
  if (state.mood >= 70) return "ごきげん";
  if (state.mood >= 30) return "ふつう";
  return "しょんぼり";
}

function render() {
  document.getElementById("catName").textContent = getCatName(state.mainCatId);
  document.getElementById("level").textContent = currentLevel();
  document.getElementById("expBar").style.width =
    Math.round((currentExp() / expToNext()) * 100) + "%";
  document.getElementById("mood").textContent = moodLabel();

  document.getElementById("hungerBar").style.width = state.hunger + "%";
  document.getElementById("hungerText").textContent = state.hunger;
  document.getElementById("cleanBar").style.width = state.clean + "%";
  document.getElementById("cleanText").textContent = state.clean;
  document.getElementById("energyBar").style.width = state.energy + "%";
  document.getElementById("energyText").textContent = state.energy;

  document.getElementById("mainCatImage").src = getMainCatImage();

  renderBook();
}

function showMessage(text) {
  document.getElementById("message").textContent = text;
}

function tick() {
  state.hunger = clamp(state.hunger - 1);
  state.clean = clamp(state.clean - 1);
  state.energy = clamp(state.energy + 2);
  if (hasLowCareStatus()) {
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
  const progress = getCatProgress();
  progress.exp += amount;
  let leveledUp = false;
  while (progress.exp >= expToNext()) {
    progress.exp -= expToNext();
    progress.level += 1;
    leveledUp = true;
  }
  return leveledUp;
}

function startHappyReaction() {
  happyReactionUntil = Date.now() + HAPPY_REACTION_MS;
  setTimeout(render, HAPPY_REACTION_MS);
}

function finishCare(type, exp) {
  const leveledUp = gainExp(exp);
  startHappyReaction();
  showMessage(
    leveledUp
      ? "レベルアップ！レベル" + currentLevel() + "になったよ！"
      : randomMessage(type)
  );
  save();
  render();
}

function care(type) {
  if (type === "food") {
    state.hunger = clamp(state.hunger + 30);
    state.energy = clamp(state.energy + 10);
    state.clean = clamp(state.clean - 5);
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
    state.clean = clamp(state.clean - 10);
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
  {
    id: "milk",
    name: "ミルク",
    img: "assets_optimized/cats/main_cat.webp",
    variants: {
      happy: "assets_variants/cats/milk/milk_happy.webp",
      sad: "assets_variants/cats/milk/milk_sad.webp",
      kitten: "assets_variants/cats/milk/milk_kitten.webp",
      kittenHappy: "assets_variants/cats/milk/milk_kitten_happy.webp",
      kittenSad: "assets_variants/cats/milk/milk_kitten_sad.webp",
    },
  },
  {
    id: "gray_tabby",
    name: "グレーのトラねこ",
    img: "assets_optimized/cats/gray_tabby_cat.webp",
    variants: {
      happy: "assets_variants/cats/gray_tabby/gray_tabby_happy.webp",
      sad: "assets_variants/cats/gray_tabby/gray_tabby_sad.webp",
      kitten: "assets_variants/cats/gray_tabby/gray_tabby_kitten.webp",
      kittenHappy: "assets_variants/cats/gray_tabby/gray_tabby_kitten_happy.webp",
      kittenSad: "assets_variants/cats/gray_tabby/gray_tabby_kitten_sad.webp",
    },
  },
  {
    id: "white_fluffy",
    name: "まっしろもふもふ",
    img: "assets_optimized/cats/white_fluffy_cat.webp",
    variants: {
      happy: "assets_variants/cats/white_fluffy/white_fluffy_happy.webp",
      sad: "assets_variants/cats/white_fluffy/white_fluffy_sad.webp",
      kitten: "assets_variants/cats/white_fluffy/white_fluffy_kitten.webp",
      kittenHappy: "assets_variants/cats/white_fluffy/white_fluffy_kitten_happy_v2.webp",
      kittenSad: "assets_variants/cats/white_fluffy/white_fluffy_kitten_sad.webp",
    },
  },
  {
    id: "brown_tabby",
    name: "茶トラ",
    img: "assets_optimized/cats/brown_tabby_cat.webp",
    variants: {
      happy: "assets_variants/cats/brown_tabby/brown_tabby_happy.webp",
      sad: "assets_variants/cats/brown_tabby/brown_tabby_sad.webp",
      kitten: "assets_variants/cats/brown_tabby/brown_tabby_kitten.webp",
      kittenHappy: "assets_variants/cats/brown_tabby/brown_tabby_kitten_happy.webp",
      kittenSad: "assets_variants/cats/brown_tabby/brown_tabby_kitten_sad.webp",
    },
  },
  {
    id: "black",
    name: "黒ねこ",
    img: "assets_optimized/cats/black_cat.webp",
    variants: {
      happy: "assets_variants/cats/black/black_happy.webp",
      sad: "assets_variants/cats/black/black_sad.webp",
      kitten: "assets_variants/cats/black/black_kitten.webp",
      kittenHappy: "assets_variants/cats/black/black_kitten_happy.webp",
      kittenSad: "assets_variants/cats/black/black_kitten_sad.webp",
    },
  },
  {
    id: "hachiware",
    name: "ハチワレ",
    img: "assets_optimized/cats/hachiware_cat.webp",
    variants: {
      happy: "assets_variants/cats/hachiware/hachiware_happy.webp",
      sad: "assets_variants/cats/hachiware/hachiware_sad.webp",
      kitten: "assets_variants/cats/hachiware/hachiware_kitten.webp",
      kittenHappy: "assets_variants/cats/hachiware/hachiware_kitten_happy.webp",
      kittenSad: "assets_variants/cats/hachiware/hachiware_kitten_sad.webp",
    },
  },
];
const SILHOUETTE_IMG = "assets_optimized/cats/hidden_cat_silhouette.webp";

function getCat(catId) {
  return CATS.find(function (cat) {
    return cat.id === catId;
  });
}

function getCatName(catId) {
  if (state.catNames[catId]) return state.catNames[catId];
  const cat = getCat(catId);
  return cat.name;
}

function getMainCatImage() {
  const cat = getCat(state.mainCatId) || CATS[0];
  const variants = cat.variants || {};
  const isHappyReaction = Date.now() < happyReactionUntil;
  const isKitten = currentLevel() < KITTEN_UNTIL_LEVEL;

  if (isKitten) {
    if (isSadMood() && variants.kittenSad) {
      return variants.kittenSad;
    }

    if (isHappyReaction && variants.kittenHappy) {
      return variants.kittenHappy;
    }

    if (variants.kitten) {
      return variants.kitten;
    }
  }

  if (isSadMood() && variants.sad) {
    return variants.sad;
  }

  if (isHappyReaction && variants.happy) {
    return variants.happy;
  }

  return cat.img;
}

function renderBook() {
  document.getElementById("discoveredCount").textContent = state.discovered.length;
  document.getElementById("totalCount").textContent = CATS.length;

  const html = CATS.map(function (cat) {
    const found = state.discovered.includes(cat.id);
    const isMain = cat.id === state.mainCatId;
    const classes =
      "book-entry" + (found ? " registered" : "") + (isMain ? " main-selected" : "");
    const onclick = found ? ' onclick="selectMainCat(\'' + cat.id + '\')"' : "";
    return (
      '<div class="' + classes + '"' + onclick + ">" +
      '<img src="' + (found ? cat.img : SILHOUETTE_IMG) + '" alt="" />' +
      '<div class="book-entry-name">' + (found ? getCatName(cat.id) : "？？？") + "</div>" +
      "</div>"
    );
  }).join("");

  document.getElementById("bookGrid").innerHTML = html;
  document.getElementById("modalBookGrid").innerHTML = html;
}

function selectMainCat(catId) {
  if (catId === state.mainCatId) return;
  if (!confirm(getCatName(catId) + "をメインのねこにする？")) return;
  getCatProgress(catId);
  state.mainCatId = catId;
  save();
  render();
}

function openBook() {
  document.getElementById("bookModal").classList.add("open");
}

function closeBook() {
  document.getElementById("bookModal").classList.remove("open");
}

function encounterChance() {
  return Math.min(0.25 + currentLevel() * 0.02, 0.5);
}

function tryEncounter() {
  const hidden = CATS.filter(function (cat) {
    return !state.discovered.includes(cat.id);
  });
  if (hidden.length === 0) return;
  if (Math.random() >= encounterChance()) return;

  const cat = hidden[Math.floor(Math.random() * hidden.length)];
  state.discovered.push(cat.id);
  getCatProgress(cat.id);
  save();
  render();

  document.getElementById("foundCatImage").src = cat.img;
  document.getElementById("foundCatName").textContent = getCatName(cat.id);
  document.getElementById("catFoundModal").classList.add("open");
}

function closeCatFound() {
  document.getElementById("catFoundModal").classList.remove("open");
  if (state.discovered.length === CATS.length) {
    showMessage("ずかんコンプリート！すごい！");
  }
}

const TOYS = [
  { id: "yarn", name: "毛糸玉", mood: 15, img: "assets_optimized/actions/play_yarn.webp" },
  { id: "teaser", name: "ねこじゃらし", mood: 20, img: "assets_optimized/actions/toy_teaser.webp" },
  { id: "ball", name: "ボール", mood: 20, img: "assets_optimized/actions/toy_ball.webp" },
  { id: "mouse", name: "ぬいぐるみ", mood: 25, img: "assets_optimized/actions/toy_mouse.webp" },
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
  state.clean = clamp(state.clean - 8);
  state.mood = clamp(state.mood + toy.mood);
  const newToy = tryToyDrop();
  finishCare("play", 8);
  if (newToy) {
    showMessage("あそんでいたら「" + newToy.name + "」をみつけた！");
  }
}

function renameCat() {
  const currentName = getCatName(state.mainCatId);
  const newName = prompt("ねこのなまえをおしえてね（8文字まで）", currentName);
  if (!newName || newName.trim() === "") return;
  state.catNames[state.mainCatId] = newName.trim().slice(0, 8);
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
