const PLAYER_KEY = "dabrnaRoyalePlayer";
const MODE_KEY = "dabrnaRoyaleGameMode";

let player = JSON.parse(localStorage.getItem(PLAYER_KEY)) || {
  ageGroup: "teen",
  level: 1,
  xp: 0,
  coins: 500,
  trophies: 0,
  tokenColor: "blue",
  cardTheme: "classic"
};

let gameMode = Number(
  new URLSearchParams(location.search).get("mode") ||
  localStorage.getItem(MODE_KEY) ||
  1
);

let players = [];
let playerCard = [];
let drawnNumbers = [];
let currentNumber = null;

let drawTimer = null;
let timerSeconds = 10;
let gameStarted = false;
let gameFinished = false;

const difficulties = {
  child: {
    name: "آسان",
    accuracy: 0.58
  },

  teen: {
    name: "معمولی",
    accuracy: 0.76
  },

  adult: {
    name: "سخت",
    accuracy: 0.90
  }
};

const tokenNames = {
  blue: "آبی",
  red: "قرمز",
  green: "سبز",
  purple: "بنفش",
  gold: "طلایی",
  black: "مشکی",
  crystal: "کریستالی",
  rainbow: "رنگین‌کمانی"
};

const themeNames = {
  classic: "کلاسیک",
  night: "شب",
  gold: "طلایی",
  neon: "نئون",
  forest: "جنگل",
  fire: "آتش",
  ice: "یخی",
  space: "فضایی",
  legendary: "افسانه‌ای"
};


// ===============================
// ذخیره بازیکن
// ===============================

function savePlayer() {
  localStorage.setItem(
    PLAYER_KEY,
    JSON.stringify(player)
  );
}


// ===============================
// آماده‌سازی
// ===============================

document.addEventListener("DOMContentLoaded", () => {

  updateCoins();

  setupMode();

  createPlayers();

  renderPlayers();

  createPlayerCard();

  renderPlayerCard();

  setupButtons();

  showStartModal();

});


// ===============================
// تنظیم حالت بازی
// ===============================

function setupMode() {

  const modeLabel = document.getElementById("modeLabel");

  const names = {
    1: "تک‌نفره",
    2: "دو نفره",
    3: "سه نفره",
    4: "چهار نفره"
  };

  if (modeLabel) {
    modeLabel.textContent = names[gameMode] || "بازی";
  }

}


// ===============================
// ساخت بازیکنان
// ===============================

function createPlayers() {

  players = [];

  players.push({
    id: 0,
    name: "شما",
    isHuman: true,
    color: player.tokenColor,
    card: [],
    marked: new Set(),
    finished: false
  });


  const botCount = Math.max(
    1,
    gameMode - 1
  );


  for (let i = 1; i <= botCount; i++) {

    players.push({
      id: i,
      name: `بازیکن ${i + 1}`,
      isHuman: false,
      color: getPlayerColor(i),
      card: createCardNumbers(),
      marked: new Set(),
      finished: false
    });

  }

}


// ===============================
// رنگ بازیکنان
// ===============================

function getPlayerColor(index) {

  const colors = [
    "red",
    "green",
    "purple",
    "gold",
    "crystal",
    "rainbow"
  ];

  return colors[
    (index - 1) % colors.length
  ];

}


// ===============================
// کارت
// ===============================

function createPlayerCard() {

  playerCard = createCardNumbers();

  players[0].card = playerCard;

}


// ساخت ۱۵ شماره متفاوت
function createCardNumbers() {

  const numbers = [];

  while (numbers.length < 15) {

    const number =
      Math.floor(Math.random() * 90) + 1;

    if (!numbers.includes(number)) {
      numbers.push(number);
    }

  }

  return numbers;

}


// ===============================
// نمایش بازیکنان
// ===============================

function renderPlayers() {

  const grid =
    document.getElementById("playersGrid");

  if (!grid) return;

  grid.innerHTML = "";

  players.forEach((p) => {

    const div =
      document.createElement("div");

    div.className =
      "player-mini-card";

    div.innerHTML = `
      <div class="player-avatar ${p.color}">
        ${p.isHuman ? "👑" : "🎮"}
      </div>

      <div class="player-mini-info">
        <strong>${p.name}</strong>
        <small>
          ${p.isHuman ? "بازیکن شما" : "پلیر"}
        </small>
      </div>

      <div class="player-status" id="status-${p.id}">
        🟢
      </div>
    `;

    grid.appendChild(div);

  });

}


// ===============================
// کارت اصلی بازیکن
// ===============================

function renderPlayerCard() {

  const card =
    document.getElementById("playerCard");

  if (!card) return;

  card.className =
    `dabrna-card theme-${player.cardTheme}`;

  card.innerHTML = "";

  playerCard.forEach((number, index) => {

    const cell =
      document.createElement("div");

    cell.className =
      "dabrna-number";

    cell.dataset.number = number;

    cell.textContent = number;

    if (drawnNumbers.includes(number)) {
      cell.classList.add("drawn");
    }

    if (
      players[0].marked &&
      players[0].marked.has(number)
    ) {
      cell.classList.add("marked");
    }

    cell.addEventListener(
      "click",
      () => markPlayerNumber(number)
    );

    card.appendChild(cell);

  });

  const theme =
    document.getElementById("cardThemeName");

  if (theme) {
    theme.textContent =
      themeNames[player.cardTheme] ||
      "کلاسیک";
  }

}


// ===============================
// کارت بازیکنان دیگر
// ===============================

function renderOtherCards() {

  const container =
    document.getElementById(
      "otherPlayersCards"
    );

  if (!container) return;

  container.innerHTML = "";

  players
    .filter(p => !p.isHuman)
    .forEach(p => {

      const wrapper =
        document.createElement("div");

      wrapper.className =
        "other-player-card";


      let cells = "";

      p.card.forEach(number => {

        const marked =
          p.marked.has(number);

        cells += `
          <div class="mini-number ${
            marked ? "mini-marked" : ""
          }">
            ${number}
          </div>
        `;

      });


      wrapper.innerHTML = `
        <div class="other-card-title">
          <span>🎮 ${p.name}</span>
          <small>
            ${p.marked.size}/15
          </small>
        </div>

        <div class="mini-dabrna-card">
          ${cells}
        </div>
      `;

      container.appendChild(wrapper);

    });

}


// ===============================
// شروع بازی
// ===============================

function startGame() {

  if (gameStarted) return;

  gameStarted = true;
  gameFinished = false;

  hideStartModal();

  const status =
    document.getElementById("drawStatus");

  if (status) {
    status.textContent =
      "بازی شروع شد!";
  }

  startAutomaticDraw();

}


// ===============================
// قرعه خودکار
// ===============================

function startAutomaticDraw() {

  clearInterval(drawTimer);

  timerSeconds = 10;

  updateTimer();

  drawNextNumber();

  drawTimer = setInterval(() => {

    if (gameFinished) return;

    timerSeconds--;

    updateTimer();

    if (timerSeconds <= 0) {

      timerSeconds = 10;

      drawNextNumber();

    }

  }, 1000);

}


// ===============================
// تایمر
// ===============================

function updateTimer() {

  const timer =
    document.getElementById(
      "nextDrawTimer"
    );

  if (!timer) return;

  timer.textContent =
    `مهره بعدی: ${timerSeconds} ثانیه`;

}


// ===============================
// بیرون آمدن مهره
// ===============================

function drawNextNumber() {

  if (drawnNumbers.length >= 90) {

    endGame("تمام مهره‌ها خارج شدند!");

    return;

  }


  const available = [];

  for (let i = 1; i <= 90; i++) {

    if (!drawnNumbers.includes(i)) {
      available.push(i);
    }

  }


  const randomIndex =
    Math.floor(
      Math.random() * available.length
    );

  currentNumber =
    available[randomIndex];

  drawnNumbers.push(currentNumber);


  animateBall(currentNumber);


  const status =
    document.getElementById("drawStatus");

  if (status) {

    status.textContent =
      `مهره شماره ${currentNumber} خارج شد!`;

  }


  markBots(currentNumber);

  renderPlayerCard();

  renderOtherCards();

  checkAllPlayers();

}


// ===============================
// انیمیشن مهره
// ===============================

function animateBall(number) {

  const bag =
    document.getElementById("bag");

  const ball =
    document.getElementById("drawBall");

  const numberText =
    document.getElementById("drawNumber");


  if (!ball || !numberText) return;


  numberText.textContent = number;


  ball.classList.remove("ball-show");

  void ball.offsetWidth;

  ball.classList.add("ball-show");


  if (bag) {

    bag.classList.remove(
      "bag-shake"
    );

    void bag.offsetWidth;

    bag.classList.add(
      "bag-shake"
    );

  }

}


// ===============================
// علامت زدن شماره بازیکن
// ===============================

function markPlayerNumber(number) {

  if (!gameStarted || gameFinished) {
    return;
  }

  if (!drawnNumbers.includes(number)) {
    showMessage(
      "⏳ این شماره هنوز از کیسه خارج نشده!"
    );

    return;
  }


  const human =
    players[0];


  if (human.marked.has(number)) {
    return;
  }


  human.marked.add(number);

  renderPlayerCard();

  renderPlayers();

  checkAllPlayers();

}


// ===============================
// حرکت بازیکنان
// ===============================

function markBots(number) {

  const difficulty =
    difficulties[
      player.ageGroup
    ] || difficulties.teen;


  players
    .filter(p => !p.isHuman)
    .forEach(bot => {

      if (
        !bot.card.includes(number)
      ) {
        return;
      }


      if (
        Math.random() <=
        difficulty.accuracy
      ) {

        bot.marked.add(number);

      }

    });

}


// ===============================
// بررسی برنده
// ===============================

function checkAllPlayers() {

  for (const p of players) {

    if (
      p.marked.size >= 15 &&
      !p.finished
    ) {

      p.finished = true;

      endGame(
        p.isHuman
          ? "🎉 شما دبرنا کردید!"
          : `🏆 ${p.name} دبرنا کرد!`
      );

      return;

    }

  }

}


// ===============================
// پایان بازی
// ===============================

function endGame(message) {

  if (gameFinished) return;

  gameFinished = true;

  clearInterval(drawTimer);


  const human =
    players[0];


  if (human.finished) {

    const xpReward = 100;
    const coinReward = 150;
    const trophyReward = 1;

    player.xp += xpReward;
    player.coins += coinReward;
    player.trophies += trophyReward;

    checkLevelUp();

    savePlayer();

    showWinModal(
      message,
      xpReward,
      coinReward,
      trophyReward
    );

  } else {

    const xpReward = 20;
    const coinReward = 30;

    player.xp += xpReward;
    player.coins += coinReward;

    checkLevelUp();

    savePlayer();

    showWinModal(
      message,
      xpReward,
      coinReward,
      0
    );

  }

}


// ===============================
// Level Up
// ===============================

function checkLevelUp() {

  const neededXP =
    player.level * 300;


  while (player.xp >= neededXP) {

    player.xp -=
      player.level * 300;

    player.level++;

    player.coins += 100;

  }

}


// ===============================
// راهنما
// ===============================

function useHint() {

  if (!gameStarted || gameFinished) {
    return;
  }


  if (player.coins < 25) {

    showMessage(
      "🪙 سکه کافی نداری!"
    );

    return;

  }


  const human =
    players[0];


  const available =
    playerCard.filter(
      number =>
        drawnNumbers.includes(number) &&
        !human.marked.has(number)
    );


  if (!available.length) {

    showMessage(
      "💡 فعلاً شماره مناسبی برای راهنما نیست."
    );

    return;

  }


  const number =
    available[
      Math.floor(
        Math.random() *
        available.length
      )
    ];


  player.coins -= 25;

  human.marked.add(number);

  savePlayer();

  updateCoins();

  renderPlayerCard();

  checkAllPlayers();

}


// ===============================
// دبرنا
// ===============================

function claimBingo() {

  if (!gameStarted || gameFinished) {
    return;
  }


  const human =
    players[0];


  if (human.marked.size >= 15) {

    human.finished = true;

    endGame(
      "🎉 شما دبرنا کردید!"
    );

  } else {

    showMessage(
      `❌ هنوز ${15 - human.marked.size} خانه باقی مانده!`
    );

  }

}


// ===============================
// پیام
// ===============================

function showMessage(text) {

  const message =
    document.getElementById(
      "gameMessage"
    );

  if (!message) return;

  message.textContent = text;

  message.classList.add(
    "show"
  );


  setTimeout(() => {

    message.classList.remove(
      "show"
    );

  }, 2200);

}


// ===============================
// سکه
// ===============================

function updateCoins() {

  const gameCoins =
    document.getElementById(
      "gameCoins"
    );

  if (gameCoins) {
    gameCoins.textContent =
      player.coins;
  }

}


// ===============================
// دکمه‌ها
// ===============================

function setupButtons() {

  const start =
    document.getElementById(
      "startGameButton"
    );

  if (start) {
    start.onclick = startGame;
  }


  const hint =
    document.getElementById(
      "hintButton"
    );

  if (hint) {
    hint.onclick = useHint;
  }


  const bingo =
    document.getElementById(
      "bingoButton"
    );

  if (bingo) {
    bingo.onclick = claimBingo;
  }


  const next =
    document.getElementById(
      "nextGameButton"
    );

  if (next) {

    next.onclick = () => {

      location.reload();

    };

  }

}


// ===============================
// مودال شروع
// ===============================

function showStartModal() {

  const modal =
    document.getElementById(
      "startModal"
    );

  const difficulty =
    document.getElementById(
      "difficultyName"
    );


  if (difficulty) {

    difficulty.textContent =
      (
        difficulties[
          player.ageGroup
        ] ||
        difficulties.teen
      ).name;

  }


  if (modal) {

    modal.classList.remove(
      "hidden"
    );

  }

}


function hideStartModal() {

  const modal =
    document.getElementById(
      "startModal"
    );

  if (modal) {

    modal.classList.add(
      "hidden"
    );

  }

}


// ===============================
// مودال برد
// ===============================

function showWinModal(
  message,
  xp,
  coins,
  trophies
) {

  const modal =
    document.getElementById(
      "winModal"
    );


  document.getElementById(
    "winnerTitle"
  ).textContent =
    message.includes("شما")
      ? "🎉 دبرنا!"
      : "🏆 بازی تمام شد";


  document.getElementById(
    "winnerText"
  ).textContent =
    message;


  document.getElementById(
    "rewardXP"
  ).textContent =
    `+${xp}`;


  document.getElementById(
    "rewardCoins"
  ).textContent =
    `+${coins} 🪙`;


  document.getElementById(
    "rewardTrophy"
  ).textContent =
    `+${trophies} 🏆`;


  updateCoins();


  if (modal) {

    modal.classList.remove(
      "hidden"
    );

  }

}


// ===============================
// صفحه اصلی
// ===============================

function goHome() {

  clearInterval(drawTimer);

  location.href =
    "index.html";

}
