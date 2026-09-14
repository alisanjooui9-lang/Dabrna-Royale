/* =========================================================
   👑 DABRNA ROYALE
   Main Game Engine
   ========================================================= */

"use strict";

/* =========================================================
   STORAGE
========================================================= */

const PLAYER_KEY = "dabrnaRoyalePlayer";
const MODE_KEY = "dabrnaRoyaleGameMode";

const defaultPlayer = {
  ageGroup: null,
  level: 1,
  xp: 0,
  coins: 500,
  trophies: 0,
  tokenColor: "blue",
  cardTheme: "classic"
};

let player = loadPlayer();

function loadPlayer() {
  try {
    const saved = localStorage.getItem(PLAYER_KEY);

    if (saved) {
      return {
        ...defaultPlayer,
        ...JSON.parse(saved)
      };
    }
  } catch (error) {
    console.log(error);
  }

  return { ...defaultPlayer };
}

function savePlayer() {
  localStorage.setItem(
    PLAYER_KEY,
    JSON.stringify(player)
  );
}

/* =========================================================
   GAME SETTINGS
========================================================= */

const params = new URLSearchParams(window.location.search);

let gameMode =
  Number(params.get("mode")) ||
  Number(localStorage.getItem(MODE_KEY)) ||
  2;

if (![1, 2, 3, 4].includes(gameMode)) {
  gameMode = 2;
}

localStorage.setItem(MODE_KEY, gameMode);

const modeNames = {
  1: "تک‌نفره",
  2: "دو نفره",
  3: "سه نفره",
  4: "چهار نفره"
};

/*
  در حالت تک‌نفره:
  بازیکن اصلی + یک Bot

  در حالت‌های دیگر:
  2 = بازیکن + 1 Bot
  3 = بازیکن + 2 Bot
  4 = بازیکن + 3 Bot
*/

const botCount = Math.max(1, gameMode - 1);

/* =========================================================
   GAME VARIABLES
========================================================= */

let players = [];

let drawnNumbers = [];

let availableNumbers = [];

let currentNumber = null;

let gameStarted = false;

let gameFinished = false;

let playerMarkedNumbers = new Set();

let lastDrawTime = 0;

let botTimer = null;

/* =========================================================
   DOM
========================================================= */

const gameCoins = document.getElementById("gameCoins");
const modeLabel = document.getElementById("modeLabel");

const playersGrid = document.getElementById("playersGrid");

const drawNumber = document.getElementById("drawNumber");
const drawStatus = document.getElementById("drawStatus");
const drawButton = document.getElementById("drawButton");

const numberGrid = document.getElementById("numberGrid");

const hintButton = document.getElementById("hintButton");
const bingoButton = document.getElementById("bingoButton");

const gameMessage = document.getElementById("gameMessage");

const startModal = document.getElementById("startModal");
const startGameButton = document.getElementById("startGameButton");

const startDescription =
  document.getElementById("startDescription");

const botDifficulty =
  document.getElementById("botDifficulty");

const winModal =
  document.getElementById("winModal");

const winText =
  document.getElementById("winText");

const rewardXp =
  document.getElementById("rewardXp");

const rewardCoins =
  document.getElementById("rewardCoins");

const rewardTrophy =
  document.getElementById("rewardTrophy");

const nextGameButton =
  document.getElementById("nextGameButton");

const homeButton =
  document.getElementById("homeButton");

const backButton =
  document.getElementById("backButton");

const cardThemeName =
  document.getElementById("cardThemeName");

/* =========================================================
   GAME STYLE
   Additional game-only styling
========================================================= */

const gameStyle = document.createElement("style");

gameStyle.textContent = `
.players-panel {
  margin-bottom: 12px;
}

.player-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 7px;
}

.player-card {
  min-width: 0;
  padding: 9px 5px;
  border-radius: 15px;
  background: rgba(255,255,255,.035);
  border: 1px solid rgba(255,255,255,.07);
  text-align: center;
  transition: .25s ease;
}

.player-card.active {
  border-color: rgba(124,92,255,.7);
  background: rgba(124,92,255,.13);
  box-shadow: 0 8px 22px rgba(124,92,255,.12);
}

.player-avatar {
  width: 35px;
  height: 35px;
  margin: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 18px;
}

.player-name {
  display: block;
  margin-top: 5px;
  font-size: 9px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-progress {
  display: block;
  margin-top: 3px;
  color: #9ca7c2;
  font-size: 8px;
}

.game-board {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.draw-card {
  text-align: center;
  overflow: hidden;
}

.draw-title {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 7px;
  color: #cbd3e8;
  font-size: 12px;
}

.draw-number {
  width: 100px;
  height: 100px;
  margin: 13px auto 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 30px;
  background:
    radial-gradient(circle at 35% 25%, #a891ff, #5b40d9 70%);
  box-shadow:
    0 15px 35px rgba(91,64,217,.3),
    inset 0 2px 0 rgba(255,255,255,.2);
  font-size: 42px;
  font-weight: 900;
  transition: .25s ease;
}

.draw-number.pop {
  animation: numberPop .35s ease;
}

@keyframes numberPop {
  0% { transform: scale(.75) rotate(-5deg); }
  70% { transform: scale(1.08) rotate(2deg); }
  100% { transform: scale(1) rotate(0); }
}

.draw-status {
  color: #9ca7c2;
  font-size: 10px;
  min-height: 18px;
}

.draw-button {
  width: 100%;
  min-height: 50px;
  margin-top: 12px;
  border-radius: 15px;
  background: linear-gradient(145deg,#8062ff,#583ad8);
  box-shadow: 0 10px 25px rgba(92,61,216,.22);
  font-weight: bold;
}

.draw-button:disabled {
  opacity: .45;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-header > div:first-child {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
}

.card-theme {
  color: #ffd166;
  font-size: 9px;
}

.number-grid {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 4px;
}

.card-number {
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  background: rgba(255,255,255,.045);
  border: 1px solid rgba(255,255,255,.055);
  color: #e9edfa;
  font-size: 11px;
  font-weight: bold;
  transition: .2s ease;
}

.card-number.empty {
  visibility: hidden;
  pointer-events: none;
}

.card-number.drawn {
  opacity: .35;
}

.card-number.marked {
  background: linear-gradient(145deg,#35d07f,#18995b);
  border-color: #62e79e;
  color: white;
  transform: scale(.92);
  box-shadow: 0 5px 15px rgba(53,208,127,.2);
}

.card-number.current {
  animation: currentNumber .4s ease;
}

@keyframes currentNumber {
  0% { transform: scale(.7); }
  70% { transform: scale(1.12); }
  100% { transform: scale(1); }
}

.game-actions {
  display: grid;
  grid-template-columns: 1fr 1.25fr;
  gap: 9px;
}

.action-button {
  min-height: 50px;
  border-radius: 15px;
  background: rgba(255,255,255,.055);
  border: 1px solid rgba(255,255,255,.07);
  font-size: 11px;
  font-weight: bold;
}

.action-button span {
  display: block;
  margin-top: 3px;
  color: #9ca7c2;
  font-size: 8px;
}

.action-button.bingo {
  background: linear-gradient(145deg,#ffd76a,#d99d25);
  color: #17110a;
}

.game-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 48px;
  text-align: center;
}

.game-message span {
  font-size: 18px;
}

.game-message p {
  color: #aeb7cd;
  font-size: 10px;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(3,5,12,.78);
  backdrop-filter: blur(9px);
}

.modal-overlay.show {
  display: flex;
}

.start-modal,
.win-modal {
  width: 100%;
  max-width: 380px;
  padding: 25px 18px;
  border-radius: 26px;
  background:
    linear-gradient(145deg,#1c2540,#0d1222);
  border: 1px solid rgba(255,255,255,.09);
  box-shadow: 0 25px 70px rgba(0,0,0,.55);
  text-align: center;
  animation: modalIn .3s ease;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: translateY(15px) scale(.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.start-icon,
.win-trophy {
  width: 75px;
  height: 75px;
  margin: 0 auto 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 23px;
  background: linear-gradient(145deg,#8062ff,#5237ca);
  font-size: 36px;
  box-shadow: 0 15px 35px rgba(92,61,216,.22);
}

.win-trophy {
  background: linear-gradient(145deg,#ffd86e,#c78c1c);
}

.start-modal h2,
.win-modal h2 {
  font-size: 22px;
  margin-bottom: 8px;
}

.start-modal > p,
.win-modal > p {
  color: #9ca7c2;
  font-size: 11px;
  line-height: 1.8;
}

.difficulty-box {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 17px 0;
  padding: 12px;
  border-radius: 15px;
  background: rgba(255,255,255,.045);
  text-align: right;
}

.difficulty-box > span {
  font-size: 24px;
}

.difficulty-box b,
.difficulty-box small {
  display: block;
}

.difficulty-box b {
  font-size: 11px;
}

.difficulty-box small {
  color: #9ca7c2;
  margin-top: 4px;
  font-size: 9px;
}

.primary-button,
.secondary-button {
  width: 100%;
  min-height: 49px;
  border-radius: 15px;
  font-weight: bold;
}

.primary-button {
  background: linear-gradient(145deg,#8062ff,#583ad8);
}

.secondary-button {
  margin-top: 8px;
  background: rgba(255,255,255,.055);
}

.reward-box {
  display: grid;
  grid-template-columns: repeat(3,1fr);
  gap: 7px;
  margin: 18px 0;
}

.reward-box div {
  padding: 11px 5px;
  border-radius: 13px;
  background: rgba(255,255,255,.045);
}

.reward-box span,
.reward-box b {
  display: block;
}

.reward-box span {
  font-size: 20px;
}

.reward-box b {
  margin-top: 4px;
  font-size: 10px;
}

@media(max-width:380px) {
  .number-grid {
    gap: 3px;
  }

  .card-number {
    font-size: 9px;
    border-radius: 5px;
  }

  .player-grid {
    gap: 4px;
  }
}
`;

document.head.appendChild(gameStyle);

/* =========================================================
   DIFFICULTY
========================================================= */

function getDifficulty() {

  const levels = {
    child: {
      name: "آسان",
      speed: 0.45,
      accuracy: 0.60
    },

    teen: {
      name: "معمولی",
      speed: 0.68,
      accuracy: 0.76
    },

    adult: {
      name: "سخت",
      speed: 0.86,
      accuracy: 0.90
    }
  };

  return levels[player.ageGroup] || levels.teen;
}

/* =========================================================
   START SCREEN
========================================================= */

function prepareStartScreen() {

  modeLabel.textContent =
    modeNames[gameMode];

  const difficulty = getDifficulty();

  botDifficulty.textContent =
    difficulty.name;

  startDescription.textContent =
    `تو در حالت ${modeNames[gameMode]} با ${botCount} Bot رقابت می‌کنی.`;

  updateCoins();

  updateThemeName();
}

function updateCoins() {

  if (gameCoins) {
    gameCoins.textContent =
      player.coins;
  }
}

function updateThemeName() {

  const names = {
    classic: "Classic",
    night: "Night",
    gold: "Gold",
    neon: "Neon",
    forest: "Forest",
    fire: "Fire",
    ice: "Ice",
    space: "Space",
    legendary: "Legendary"
  };

  if (cardThemeName) {
    cardThemeName.textContent =
      names[player.cardTheme] || "Classic";
  }
}

/* =========================================================
   CREATE PLAYERS
========================================================= */

function createPlayers() {

  players = [];

  players.push({
    id: "player",
    name: "تو",
    isBot: false,
    card: createCard(),
    marked: new Set(),
    color: player.tokenColor || "blue",
    completed: false,
    progress: 0
  });

  const botColors = [
    "red",
    "green",
    "purple"
  ];

  for (let i = 0; i < botCount; i++) {

    players.push({
      id: "bot" + (i + 1),
      name: "Bot " + (i + 1),
      isBot: true,
      card: createCard(),
      marked: new Set(),
      color: botColors[i] || "red",
      completed: false,
      progress: 0
    });
  }

  renderPlayers();
}

/* =========================================================
   CARD GENERATOR
   3 rows × 9 columns
   15 numbers
========================================================= */

function createCard() {

  const card = [];

  for (let row = 0; row < 3; row++) {
    card.push(new Array(9).fill(null));
  }

  const columns = [];

  for (let c = 0; c < 9; c++) {
    columns.push({
      column: c,
      numbers: []
    });
  }

  for (let c = 0; c < 9; c++) {

    let min = c * 10 + 1;
    let max = c * 10 + 10;

    if (c === 0) {
      min = 1;
      max = 9;
    }

    if (c === 8) {
      min = 81;
      max = 90;
    }

    const numbers = [];

    while (numbers.length < 2) {

      const number =
        randomInt(min, max);

      if (!numbers.includes(number)) {
        numbers.push(number);
      }
    }

    columns[c].numbers = numbers;
  }

  /*
    انتخاب 5 ستون × 3 شماره
    برای مجموع 15 شماره
  */

  const selectedColumns =
    shuffle([...Array(9).keys()])
      .slice(0, 5)
      .sort((a, b) => a - b);

  /*
    برای هر ردیف 5 خانه پر می‌شود.
    در مجموع 15 شماره داریم.
  */

  const rowCounts = [5, 5, 5];

  for (let r = 0; r < 3; r++) {

    const chosen =
      shuffle(selectedColumns)
        .slice(0, rowCounts[r]);

    for (const c of chosen) {

      const pool =
        columns[c].numbers;

      let value;

      if (r === 0) {
        value = pool[0];
      } else if (r === 1) {
        value = pool[1];
      } else {
        value =
          randomInt(
            c === 0 ? 1 : c * 10 + 1,
            c === 8 ? 90 : c * 10 + 10
          );
      }

      /*
        جلوگیری از تکرار در کارت
      */

      if (
        !card.some(row =>
          row.includes(value)
        )
      ) {
        card[r][c] = value;
      } else {

        let newValue;

        do {

          newValue =
            randomInt(
              c === 0 ? 1 : c * 10 + 1,
              c === 8 ? 90 : c * 10 + 10
            );

        } while (
          card.some(row =>
            row.includes(newValue)
          )
        );

        card[r][c] = newValue;
      }
    }
  }

  /*
    اگر به دلیل تصادفی بودن کمتر از 15 شماره شد،
    خانه‌های خالی را تکمیل می‌کنیم.
  */

  let numbersCount =
    card.flat().filter(Boolean).length;

  while (numbersCount < 15) {

    const r = randomInt(0, 2);
    const c = randomInt(0, 8);

    if (card[r][c] !== null) {
      continue;
    }

    const min =
      c === 0 ? 1 : c * 10 + 1;

    const max =
      c === 8 ? 90 : c * 10 + 10;

    const value =
      randomInt(min, max);

    if (
      !card.some(row =>
        row.includes(value)
      )
    ) {
      card[r][c] = value;
      numbersCount++;
    }
  }

  return card;
}

/* =========================================================
   RENDER PLAYERS
========================================================= */

function renderPlayers() {

  if (!playersGrid) return;

  playersGrid.innerHTML = "";

  players.forEach((p, index) => {

    const card =
      document.createElement("div");

    card.className =
      "player-card";

    if (index === 0) {
      card.classList.add("active");
    }

    const avatar =
      document.createElement("div");

    avatar.className =
      "player-avatar";

    avatar.textContent =
      p.isBot ? "🤖" : "👑";

    avatar.style.background =
      getTokenBackground(p.color);

    const name =
      document.createElement("span");

    name.className =
      "player-name";

    name.textContent =
      p.name;

    const progress =
      document.createElement("span");

    progress.className =
      "player-progress";

    progress.id =
      "progress-" + p.id;

    progress.textContent =
      "0 / 15";

    card.appendChild(avatar);
    card.appendChild(name);
    card.appendChild(progress);

    playersGrid.appendChild(card);
  });
}

function updatePlayerProgress() {

  players.forEach(p => {

    p.progress =
      p.marked.size;

    const element =
      document.getElementById(
        "progress-" + p.id
      );

    if (element) {
      element.textContent =
        `${p.progress} / 15`;
    }
  });
}

function getTokenBackground(color) {

  const colors = {
    blue: "linear-gradient(145deg,#4ca7ff,#2466d1)",
    red: "linear-gradient(145deg,#ff647d,#c92e49)",
    green: "linear-gradient(145deg,#54e596,#21985e)",
    purple: "linear-gradient(145deg,#b274ff,#7134c7)",
    gold: "linear-gradient(145deg,#ffe17c,#c58b1f)",
    black: "linear-gradient(145deg,#535b70,#171a24)"
  };

  return colors[color] || colors.blue;
}

/* =========================================================
   RENDER PLAYER CARD
========================================================= */

function renderPlayerCard() {

  if (!numberGrid) return;

  numberGrid.innerHTML = "";

  const card =
    players[0].card;

  for (let row = 0; row < 3; row++) {

    for (let col = 0; col < 9; col++) {

      const value =
        card[row][col];

      const cell =
        document.createElement("button");

      cell.className =
        "card-number";

      if (value === null) {

        cell.classList.add("empty");

        numberGrid.appendChild(cell);

        continue;
      }

      cell.textContent =
        value;

      cell.dataset.number =
        value;

      if (playerMarkedNumbers.has(value)) {
        cell.classList.add("marked");
      }

      if (drawnNumbers.includes(value)) {
        cell.classList.add("drawn");
      }

      if (value === currentNumber) {
        cell.classList.add("current");
      }

      cell.addEventListener(
        "click",
        () => manualMark(value, cell)
      );

      numberGrid.appendChild(cell);
    }
  }
}

/* =========================================================
   MANUAL MARK
========================================================= */

function manualMark(number, element) {

  if (!gameStarted || gameFinished) {
    return;
  }

  if (!drawnNumbers.includes(number)) {

    showMessage(
      "⚠️",
      "این شماره هنوز اعلام نشده."
    );

    return;
  }

  if (playerMarkedNumbers.has(number)) {
    return;
  }

  playerMarkedNumbers.add(number);

  players[0].marked.add(number);

  element.classList.add("marked");

  updatePlayerProgress();

  checkBotWin();
}

/* =========================================================
   DRAW NUMBER
========================================================= */

function drawNextNumber() {

  if (!gameStarted || gameFinished) {
    return;
  }

  const now =
    Date.now();

  if (now - lastDrawTime < 700) {
    return;
  }

  lastDrawTime = now;

  if (availableNumbers.length === 0) {

    finishByNumbers();

    return;
  }

  const index =
    randomInt(
      0,
      availableNumbers.length - 1
    );

  currentNumber =
    availableNumbers.splice(index, 1)[0];

  drawnNumbers.push(currentNumber);

  animateNumber();

  drawStatus.textContent =
    `شماره ${currentNumber} اعلام شد`;

  markPlayerNumber();

  botPlay();

  updateDrawButton();

  checkPlayerComplete();
}

function animateNumber() {

  drawNumber.textContent =
    currentNumber;

  drawNumber.classList.remove("pop");

  void drawNumber.offsetWidth;

  drawNumber.classList.add("pop");
}

function markPlayerNumber() {

  if (
    players[0].card.flat()
      .includes(currentNumber)
  ) {

    showMessage(
      "🎯",
      `شماره ${currentNumber} روی کارت توست!`
    );

  } else {

    showMessage(
      "🎲",
      `شماره ${currentNumber} اعلام شد.`
    );
  }

  renderPlayerCard();
}

/* =========================================================
   BOT LOGIC
========================================================= */

function botPlay() {

  const difficulty =
    getDifficulty();

  players
    .filter(p => p.isBot && !p.completed)
    .forEach(bot => {

      /*
        شانس علامت زدن شماره:
        سختی بالاتر = اشتباه کمتر
      */

      const shouldMark =
        Math.random() <
        difficulty.accuracy;

      if (!shouldMark) {
        return;
      }

      if (
        bot.card.flat()
          .includes(currentNumber)
      ) {

        bot.marked.add(
          currentNumber
        );

        bot.progress =
          bot.marked.size;

        updatePlayerProgress();

        if (checkComplete(bot)) {

          bot.completed = true;

          setTimeout(() => {

            if (!gameFinished) {
              botWins(bot);
            }

          }, 450);
        }
      }
    });
}

/* =========================================================
   CHECK COMPLETE
========================================================= */

function checkComplete(gamePlayer) {

  /*
    برای این نسخه:
    تکمیل 15 شماره کارت = دبرنا
  */

  return (
    gamePlayer.marked.size >= 15
  );
}

function checkPlayerComplete() {

  if (
    playerMarkedNumbers.size >= 15 &&
    !gameFinished
  ) {

    players[0].completed = true;

    setTimeout(() => {

      if (!gameFinished) {
        playerWins();
      }

    }, 350);
  }
}

function checkBotWin() {

  players
    .filter(p => p.isBot)
    .forEach(bot => {

      if (
        bot.marked.size >= 15 &&
        !gameFinished
      ) {

        bot.completed = true;

        botWins(bot);
      }
    });
}

/* =========================================================
   PLAYER WIN
========================================================= */

function playerWins() {

  if (gameFinished) {
    return;
  }

  gameFinished = true;

  const xpReward =
    100 + player.level * 10;

  const coinReward =
    150 + player.level * 15;

  player.xp += xpReward;

  player.coins += coinReward;

  player.trophies += 1;

  processLevelUp();

  savePlayer();

  updateCoins();

  rewardXp.textContent =
    `+${xpReward} XP`;

  rewardCoins.textContent =
    `+${coinReward}`;

  rewardTrophy.textContent =
    "+1";

  winText.textContent =
    "دبرنا! تو برنده این مسابقه شدی 👑";

  winModal.classList.add("show");

  drawButton.disabled = true;
}

function botWins(bot) {

  if (gameFinished) {
    return;
  }

  gameFinished = true;

  const consolation =
    Math.min(
      40 + player.level * 5,
      150
    );

  player.coins += consolation;

  player.xp += 25;

  savePlayer();

  updateCoins();

  rewardXp.textContent =
    "+25 XP";

  rewardCoins.textContent =
    `+${consolation}`;

  rewardTrophy.textContent =
    "+0";

  winText.textContent =
    `${bot.name} زودتر دبرنا کرد! 😅`;

  winModal.classList.add("show");

  drawButton.disabled = true;
}

/* =========================================================
   LEVEL SYSTEM
========================================================= */

function processLevelUp() {

  let needed =
    getXpNeeded(player.level);

  while (player.xp >= needed) {

    player.xp -= needed;

    player.level++;

    const levelReward =
      50 + player.level * 10;

    player.coins +=
      levelReward;

    needed =
      getXpNeeded(player.level);
  }
}

function getXpNeeded(level) {

  return 250 + (level - 1) * 100;
}

/* =========================================================
   FINISH BY NUMBERS
========================================================= */

function finishByNumbers() {

  if (gameFinished) {
    return;
  }

  gameFinished = true;

  winText.textContent =
    "تمام شماره‌ها اعلام شدند!";

  rewardXp.textContent =
    "+20 XP";

  rewardCoins.textContent =
    "+25";

  rewardTrophy.textContent =
    "+0";

  player.xp += 20;
  player.coins += 25;

  savePlayer();

  updateCoins();

  winModal.classList.add("show");

  drawButton.disabled = true;
}

/* =========================================================
   HINT
========================================================= */

function useHint() {

  const price = 25;

  if (!gameStarted || gameFinished) {
    return;
  }

  if (player.coins < price) {

    showMessage(
      "🪙",
      "سکه کافی نداری."
    );

    return;
  }

  const availableCardNumbers =
    players[0].card
      .flat()
      .filter(Boolean)
      .filter(
        number =>
          drawnNumbers.includes(number) &&
          !playerMarkedNumbers.has(number)
      );

  if (availableCardNumbers.length === 0) {

    showMessage(
      "💡",
      "فعلاً شماره مناسبی برای راهنما نیست."
    );

    return;
  }

  const number =
    availableCardNumbers[
      randomInt(
        0,
        availableCardNumbers.length - 1
      )
    ];

  const cell =
    document.querySelector(
      `.card-number[data-number="${number}"]`
    );

  if (cell) {

    player.coins -= price;

    playerMarkedNumbers.add(number);

    players[0].marked.add(number);

    cell.classList.add("marked");

    updateCoins();

    updatePlayerProgress();

    savePlayer();

    showMessage(
      "💡",
      `شماره ${number} برایت علامت خورد.`
    );

    checkPlayerComplete();
  }
}

/* =========================================================
   MESSAGE
========================================================= */

function showMessage(icon, text) {

  if (!gameMessage) return;

  const iconElement =
    gameMessage.querySelector("span");

  const textElement =
    gameMessage.querySelector("p");

  if (iconElement) {
    iconElement.textContent =
      icon;
  }

  if (textElement) {
    textElement.textContent =
      text;
  }
}

/* =========================================================
   START GAME
========================================================= */

function startGame() {

  if (gameStarted) {
    return;
  }

  gameStarted = true;

  gameFinished = false;

  drawnNumbers = [];

  availableNumbers =
    Array.from(
      { length: 90 },
      (_, i) => i + 1
    );

  currentNumber = null;

  playerMarkedNumbers =
    new Set();

  createPlayers();

  renderPlayerCard();

  updatePlayerProgress();

  drawNumber.textContent =
    "?";

  drawStatus.textContent =
    "اولین شماره را انتخاب کن";

  startModal.classList.remove("show");

  drawButton.disabled = false;

  showMessage(
    "🎯",
    "بازی شروع شد!"
  );
}

/* =========================================================
   NEXT GAME
========================================================= */

function nextGame() {

  winModal.classList.remove("show");

  gameStarted = false;

  gameFinished = false;

  startModal.classList.add("show");

  prepareStartScreen();
}

/* =========================================================
   HOME
========================================================= */

function goHome() {

  window.location.href =
    "index.html";
}

/* =========================================================
   RANDOM HELPERS
========================================================= */

function randomInt(min, max) {

  return Math.floor(
    Math.random() * (max - min + 1)
  ) + min;
}

function shuffle(array) {

  const result =
    [...array];

  for (
    let i = result.length - 1;
    i > 0;
    i--
  ) {

    const j =
      randomInt(0, i);

    [
      result[i],
      result[j]
    ] = [
      result[j],
      result[i]
    ];
  }

  return result;
}

/* =========================================================
   BUTTON EVENTS
========================================================= */

if (startGameButton) {

  startGameButton.addEventListener(
    "click",
    startGame
  );
}

if (drawButton) {

  drawButton.addEventListener(
    "click",
    drawNextNumber
  );
}

if (hintButton) {

  hintButton.addEventListener(
    "click",
    useHint
  );
}

if (bingoButton) {

  bingoButton.addEventListener(
    "click",
    () => {

      if (!gameStarted || gameFinished) {
        return;
      }

      /*
        بازیکن فقط زمانی می‌تواند
        دبرنا اعلام کند که همه 15
        شماره کارت علامت خورده باشند.
      */

      if (
        playerMarkedNumbers.size >= 15
      ) {

        playerWins();

      } else {

        const remaining =
          15 -
          playerMarkedNumbers.size;

        showMessage(
          "❌",
          `${remaining} شماره دیگر باقی مانده.`
        );
      }

    }
  );
}

if (nextGameButton) {

  nextGameButton.addEventListener(
    "click",
    nextGame
  );
}

if (homeButton) {

  homeButton.addEventListener(
    "click",
    goHome
  );
}

if (backButton) {

  backButton.addEventListener(
    "click",
    goHome
  );
}

/* =========================================================
   INITIALIZE
========================================================= */

prepareStartScreen();

/*
  کارت‌ها تا شروع بازی ساخته نمی‌شوند.
  این باعث می‌شود صفحه شروع تمیز بماند.
*/

showMessage(
  "🎯",
  "برای شروع آماده شو!"
);
