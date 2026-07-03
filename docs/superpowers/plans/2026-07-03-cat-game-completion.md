# ねこ育成ゲーム完成 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 娘さん制作のねこ育成ゲーム（UI完成済み・ロジック未実装）を、設計書どおりに完成させる。

**Architecture:** 素のJavaScript 1ファイル（js/game.js）。単一の `state` オブジェクトで全状態を管理し、`render()` で画面に反映。localStorage に自動保存。HTMLには道具選択モーダルと猫発見ポップアップを追加（既存 .modal スタイルを流用）。

**Tech Stack:** HTML / CSS / Vanilla JavaScript（ビルドツール・ライブラリなし）。動作確認は Playwright MCP でブラウザ操作。

**Spec:** `docs/superpowers/specs/2026-07-03-cat-game-completion-design.md`

## Global Constraints

- ライブラリ・ビルドツールを追加しない（file:// で index.html を開くだけで動くこと）
- 表示文言はすべて日本語・子ども向けのひらがな多め
- ステータスはすべて 0〜100 に clamp
- セーブキーは `"catGameSave"`
- 時間経過は 20秒ごと：満腹 -1、清潔 -1、体力 +2、満腹または清潔が30未満なら気分 -1
- 気分表示: 70以上「ごきげん」／30〜69「ふつう」／30未満「しょんぼり」
- 出会い確率: `min(0.25 + level * 0.02, 0.5)`、道具入手率 30%
- テストフレームワークは導入しない。各タスクの検証は Playwright MCP によるブラウザ操作で行う
- 各タスク完了ごとに git commit（メッセージは日本語）

---

### Task 1: 画像の配置と css フォルダ名修正

**Files:**
- Create: `assets/cats/` `assets/actions/` `assets/ui/`（zipから10枚を配置）
- Rename: `CSS/` → `css/`

**Interfaces:**
- Produces: index.html が参照する画像パス（assets/cats/main_cat.png ほか9枚）が実在する状態

- [ ] **Step 1: zipをscratchpadに展開して assets/ に振り分け**

```bash
cd "c:/Users/yuzuk/Documents/github/cat-ikusei-game"
mkdir -p assets/cats assets/actions assets/ui
SCRATCH="c:/Users/yuzuk/AppData/Local/Temp/claude/c--Users-yuzuk-Documents-github-cat-ikusei-game/b6d157de-6a2a-4279-8a10-7b1bdb75c326/scratchpad"
unzip -o "c:/Users/yuzuk/Downloads/cat_game_assets_transparent_png.zip" -d "$SCRATCH/cat_assets"
mv "$SCRATCH/cat_assets/main_cat.png" "$SCRATCH/cat_assets/gray_tabby_cat.png" "$SCRATCH/cat_assets/hidden_cat_silhouette.png" assets/cats/
mv "$SCRATCH/cat_assets/food_bowl.png" "$SCRATCH/cat_assets/bath.png" "$SCRATCH/cat_assets/walk.png" "$SCRATCH/cat_assets/play_yarn.png" "$SCRATCH/cat_assets/encyclopedia_book.png" assets/actions/
mv "$SCRATCH/cat_assets/home_icon.png" "$SCRATCH/cat_assets/settings_gear.png" assets/ui/
```

- [ ] **Step 2: CSSフォルダを css にリネーム（Windowsは大文字小文字のみの変更に2段階必要）**

```bash
cd "c:/Users/yuzuk/Documents/github/cat-ikusei-game"
git mv CSS css_tmp && git mv css_tmp css
```

- [ ] **Step 3: ブラウザで確認**

Playwright で `index.html` を開く。
Expected: 背景・カードのデザインが適用され（CSS読み込みOK）、中央の白い猫、5つのお世話ボタンのアイコン、下部のホーム・歯車アイコンがすべて表示される。壊れた画像アイコンがない。

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "画像素材を配置し、CSSフォルダ名を小文字に修正"
```

---

### Task 2: 状態管理・画面反映・セーブ・時間経過（game.js の土台）

**Files:**
- Modify: `js/game.js`（メモ4行を置き換えて全面実装）

**Interfaces:**
- Produces: `state`（name/level/exp/hunger/clean/energy/mood/discovered/toys）、`clamp(v)`、`save()`、`load()`、`render()`、`showMessage(text)`、`expToNext()`。後続タスクはこれらを利用する。

- [ ] **Step 1: js/game.js を以下の内容に置き換える**

```js
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
```

- [ ] **Step 2: ブラウザで確認**

Playwright で index.html を開き、以下を確認：
1. メーターがすべて「55」で表示され、バーの幅が55%になっている
2. 気分が「ふつう」、レベル「1」、名前「ミルク」
3. コンソールで `localStorage.getItem("catGameSave")` を実行し、JSONが保存されている
4. コンソールで `state.hunger = 20; state.clean = 20; save(); render()` を実行してリロード → 値が復元される（20のまま）

Note: この時点ではお世話ボタン等は未実装（押すとコンソールにReferenceErrorが出るが、次タスクで解消する）。

- [ ] **Step 3: Commit**

```bash
git add js/game.js && git commit -m "ゲームの状態管理・画面反映・セーブ・時間経過を実装"
```

---

### Task 3: お世話アクション・レベルアップ・名前変更

**Files:**
- Modify: `js/game.js`（Task 2 のコードの末尾 `load();` の前に追記）

**Interfaces:**
- Consumes: `state` / `clamp` / `save` / `render` / `showMessage` / `expToNext`（Task 2）
- Produces: `care(type)`（HTMLのonclickから呼ばれる）、`finishCare(type, exp)`、`gainExp(amount)`、`renameCat()`。Task 4 は walk 分岐に `tryEncounter()` を追加し、Task 5 は play 分岐を道具選択に置き換える。

- [ ] **Step 1: js/game.js に以下を追記（`load();` の直前）**

```js
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
```

- [ ] **Step 2: ブラウザで確認**

Playwright で確認（事前にコンソールで `localStorage.clear()` してリロード）：
1. 「ごはん」クリック → 満腹 55→85、体力 55→65、メッセージが変わる
2. 「おふろ」クリック → 清潔 55→85
3. 「散歩」クリック → 体力 -15、満腹 -10、経験値バーが伸びる
4. コンソールで `state.energy = 5; render()` → 「散歩」クリック → 「つかれてるみたい…」と表示され、メーターが変化しない
5. お世話を繰り返してレベルアップメッセージが出る（レベル2に必要な経験値は20）
6. 「変更」クリック → 名前入力 → 表示が変わり、リロード後も残る

- [ ] **Step 3: Commit**

```bash
git add js/game.js && git commit -m "お世話アクション・レベルアップ・名前変更を実装"
```

---

### Task 4: ねこ図鑑と散歩での出会い

**Files:**
- Modify: `js/game.js`（CATSデータ・図鑑描画・出会い判定を追加、care の walk 分岐に1行追加、render に1行追加）
- Modify: `index.html`（猫発見ポップアップを追加、図鑑説明文を修正）
- Modify: `css/style.css`（発見ポップアップ用スタイルを追加）

**Interfaces:**
- Consumes: `state.discovered` / `save` / `render` / `showMessage` / `care`（Task 2・3）
- Produces: `CATS`（id/name/img の配列6件）、`renderBook()`、`openBook()` `closeBook()` `closeCatFound()`（HTML onclick から呼ばれる）、`tryEncounter()`

- [ ] **Step 1: index.html の `</body>` 直前（bookModal の後、script タグの前）に猫発見ポップアップを追加**

```html
  <section id="catFoundModal" class="modal" aria-hidden="true">
    <div class="modal-backdrop" onclick="closeCatFound()"></div>

    <div class="modal-panel found-panel">
      <h2>あたらしいねこに出会った！</h2>
      <img id="foundCatImage" class="found-cat-img" src="" alt="出会った猫" />
      <p id="foundCatName" class="found-cat-name"></p>
      <button type="button" class="close-btn" onclick="closeCatFound()">ずかんにとうろく！</button>
    </div>
  </section>
```

- [ ] **Step 2: index.html の図鑑モーダル説明文を修正**

`散歩や遊びで出会った猫が登録されます。` → `散歩で出会った猫が登録されます。`

- [ ] **Step 3: css/style.css の末尾にスタイル追加**

```css
/* 猫発見ポップアップ */

.found-panel {
  text-align: center;
  display: grid;
  justify-items: center;
  gap: 10px;
  padding: 22px 16px;
}

.found-panel h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 900;
}

.found-cat-img {
  width: 150px;
  height: 150px;
  object-fit: contain;
}

.found-cat-name {
  margin: 0;
  font-size: 18px;
  font-weight: 900;
}
```

- [ ] **Step 4: js/game.js に図鑑ロジックを追記（`load();` の直前）**

```js
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
```

- [ ] **Step 5: care の walk 分岐の `finishCare("walk", 8);` の直後に1行追加**

```js
    finishCare("walk", 8);
    tryEncounter();
```

- [ ] **Step 6: render() の末尾（energyText の行の後）に1行追加**

```js
  renderBook();
```

- [ ] **Step 7: ブラウザで確認**

Playwright で確認（`localStorage.clear()` → リロード）：
1. 図鑑プレビューに6匹分の枠。1匹目だけミルクの画像＋名前、残り5匹はシルエット＋「？？？」
2. 「図鑑」ボタン → モーダルが開き同じ内容。「閉じる」で閉じる
3. コンソールで `Math.random = function () { return 0; }` を実行してから「散歩」→ 発見ポップアップが出て、閉じると図鑑が「2 / 6」になる
4. リロード → 発見した猫が図鑑に残っている

Note: 未生成の猫（3〜6匹目）を発見すると画像が壊れて表示される。Task 6 で画像を生成するまでの既知の一時状態。

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "ねこ図鑑と散歩での出会いを実装"
```

---

### Task 5: 遊び道具（選択モーダル・ランダム入手）

**Files:**
- Modify: `index.html`（道具選択モーダルを追加）
- Modify: `css/style.css`（道具ボタンのスタイルを追加）
- Modify: `js/game.js`（TOYSデータ・道具選択・入手判定を追加、care の play 分岐を置き換え）

**Interfaces:**
- Consumes: `state.toys` / `clamp` / `finishCare` / `showMessage`（Task 2・3）
- Produces: `TOYS`（id/name/mood/img の配列4件）、`openToyModal()` `closeToyModal()` `playWithToy(toyId)`（HTML onclick から呼ばれる）

- [ ] **Step 1: index.html の catFoundModal の後に道具選択モーダルを追加**

```html
  <section id="toyModal" class="modal" aria-hidden="true">
    <div class="modal-backdrop" onclick="closeToyModal()"></div>

    <div class="modal-panel">
      <div class="modal-head">
        <h2>どれであそぶ？</h2>
        <button type="button" class="close-btn" onclick="closeToyModal()">やめる</button>
      </div>

      <div id="toyGrid" class="book-grid toy-grid"></div>
    </div>
  </section>
```

- [ ] **Step 2: css/style.css の末尾にスタイル追加**

```css
/* 道具選択モーダル */

.toy-grid {
  grid-template-columns: repeat(2, 1fr);
}

.toy-btn {
  min-height: 118px;
  border: 3px solid var(--ink);
  border-radius: 16px;
  background: #fff8e9;
  box-shadow: 3px 3px 0 var(--shadow);
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 900;
  color: var(--ink);
}

.toy-btn:active {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0 var(--shadow);
}

.toy-btn img {
  width: 64px;
  height: 64px;
  object-fit: contain;
}
```

- [ ] **Step 3: js/game.js に道具ロジックを追記（`load();` の直前）**

```js
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
```

- [ ] **Step 4: care の play 分岐を以下に置き換え**

```js
  } else if (type === "play") {
    if (state.energy < 10) {
      showMessage("つかれてるみたい…ごはんか休けいがひつようだよ");
      return;
    }
    openToyModal();
  }
```

- [ ] **Step 5: ブラウザで確認**

Playwright で確認（`localStorage.clear()` → リロード）：
1. 「遊ぶ」クリック → 「どれであそぶ？」モーダルに毛糸玉だけ表示
2. 「やめる」→ 閉じてメーター変化なし
3. コンソールで `Math.random = function () { return 0; }` → 「遊ぶ」→ 毛糸玉クリック → 体力 -10、「〜をみつけた！」メッセージ
4. もう一度「遊ぶ」→ 道具が2つに増えている
5. リロード → 道具が残っている

Note: 新しい道具（ねこじゃらし等）の画像は Task 6 で生成するまで壊れて表示される。

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "遊び道具の選択とランダム入手を実装"
```

---

### Task 6: 猫4匹＋道具3つの画像生成・配置

**Files:**
- Create: `assets/cats/white_fluffy_cat.png` `assets/cats/brown_tabby_cat.png` `assets/cats/black_cat.png` `assets/cats/hachiware_cat.png`
- Create: `assets/actions/toy_teaser.png` `assets/actions/toy_ball.png` `assets/actions/toy_mouse.png`

**Interfaces:**
- Consumes: Task 4 の CATS / Task 5 の TOYS が参照するパス（上記と一致させる）

- [ ] **Step 1: 既存画像のテイストを確認**

`assets/cats/main_cat.png` と `assets/cats/gray_tabby_cat.png` を Read で表示し、画風（線の太さ・塗り・タッチ）を把握する。

- [ ] **Step 2: nano-banana で猫4匹を生成**

mcp__nano-banana-2__edit_image で `assets/cats/gray_tabby_cat.png` を参照画像にし、同じ画風・同じポーズ感で以下を1匹ずつ生成（透過PNG、全身、正面向き、かわいい手描き風）：
1. まっしろのもふもふ猫（white_fluffy_cat.png）
2. 茶トラ猫（brown_tabby_cat.png）
3. 黒猫（black_cat.png）
4. 灰色と白のハチワレ猫（hachiware_cat.png）

- [ ] **Step 3: 生成した猫をユーザー（娘さん）に確認してもらう**

4匹の画像を提示し、OKが出たものだけ `assets/cats/` に配置。イメージと違うものは指示をもらって再生成（2回失敗したら相談）。

- [ ] **Step 4: 道具3つを生成**

`assets/actions/play_yarn.png` を参照画像にし、同じ画風で：
1. ねこじゃらし（toy_teaser.png）
2. ボール（toy_ball.png）
3. ねずみのおもちゃ（toy_mouse.png）

同様にユーザー確認後 `assets/actions/` に配置。

- [ ] **Step 5: ブラウザで確認**

コンソールで `state.discovered = CATS.map(c => c.id); state.toys = TOYS.map(t => t.id); save(); render()` を実行。
Expected: 図鑑に6匹全員の画像と名前が表示される。「遊ぶ」で道具4つが画像付きで表示される。確認後 `localStorage.clear()` でリセットしておく。

- [ ] **Step 6: Commit**

```bash
git add assets && git commit -m "猫4匹と道具3つの画像を追加"
```

---

### Task 7: ホーム・設定ボタンと最終動作確認

**Files:**
- Modify: `index.html`（下部ナビの2ボタンに onclick を追加）
- Modify: `js/game.js`（goHome / resetGame を追加）

**Interfaces:**
- Consumes: `defaultState` / `save` / `render` / `showMessage`（Task 2）
- Produces: `goHome()` `resetGame()`（HTML onclick から呼ばれる）

- [ ] **Step 1: index.html の下部ナビを修正**

ホームボタン（home_icon.png の方）に `onclick="goHome()"`、設定ボタン（settings_gear.png の方）に `onclick="resetGame()"` を追加：

```html
        <button class="bottom-icon-btn" type="button" onclick="goHome()">
          <img src="assets/ui/home_icon.png" alt="ホーム" />
        </button>
```

```html
        <button class="bottom-icon-btn" type="button" onclick="resetGame()">
          <img src="assets/ui/settings_gear.png" alt="設定" />
        </button>
```

- [ ] **Step 2: js/game.js に追記（`load();` の直前）**

```js
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
```

- [ ] **Step 3: 最終動作確認（Playwright で通し）**

`localStorage.clear()` → リロード後、以下を順に確認：
1. ごはん・おふろ・散歩・遊ぶがすべて動き、メーターとメッセージが変化する
2. 体力不足時に散歩・遊ぶがブロックされる
3. レベルアップメッセージが出る
4. 散歩で猫を発見でき、図鑑（プレビュー＋モーダル）に反映される
5. 遊ぶで道具が増える
6. 名前変更が動く
7. ページ下部までスクロール → ホームボタンで先頭に戻る
8. リロードしてもすべてのデータが復元される
9. 設定（歯車）→ 確認ダイアログ → OK でリセットされ初期状態に戻る
10. コンソールにエラーが出ていない

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "ホーム・リセットボタンを実装しゲーム完成"
```
