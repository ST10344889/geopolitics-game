const gameId = new URLSearchParams(window.location.search).get("id");

let steps = [];
let current = 0;
let humanName = "";
let timer = null;

document.getElementById("backToGame").href = "/game.html?id=" + gameId;

async function loadReplay() {
  const response = await fetch("/api/games/" + gameId + "/history");
  const data = await response.json();

  if (!data.history || data.history.length === 0) {
    document.getElementById("replayInfo").innerText =
      "No replay for this game. Start a new game to record one.";
    return;
  }

  steps = data.history;
  humanName = data.humanPlayer;

  let info = "You were: " + humanName + " | " + steps.length + " moments recorded";
  if (data.status === "finished") {
    info += " | Winner: " + data.winner;
  }
  document.getElementById("replayInfo").innerText = info;

  document.getElementById("slider").max = steps.length - 1;
  showStep(0);
}

function drawBoard(countries) {
  const board = document.getElementById("board");
  board.innerHTML = "";

  countries.forEach(function (country) {
    const card = document.createElement("div");
    card.className = "card";
    if (country.owner === humanName) {
      card.className = "card mine";
    }
    card.innerHTML =
      "<h3>" + country.name + "</h3>" +
      "<p class='soldiers'>" + country.soldiers + " soldiers</p>" +
      "<p class='owner'>Owner: " + country.owner + "</p>";
    board.appendChild(card);
  });
}

function showStep(number) {
  current = Number(number);
  const step = steps[current];

  drawBoard(step.snapshot);
  document.getElementById("replayText").innerText = step.text;
  document.getElementById("slider").value = current;
  document.getElementById("stepCount").innerText =
    "Moment " + (current + 1) + " of " + steps.length;

  let dice = "";
  if (step.attackerDice && step.attackerDice.length > 0) {
    dice = "Attacker: ";
    step.attackerDice.forEach(function (d) {
      dice += "<span class='die'>" + d + "</span>";
    });
    dice += "<br>Defender: ";
    step.defenderDice.forEach(function (d) {
      dice += "<span class='die defend'>" + d + "</span>";
    });
  }
  document.getElementById("replayDice").innerHTML = dice;
}

function goTo(number) {
  showStep(number);
}

function nextStep() {
  if (current < steps.length - 1) {
    showStep(current + 1);
  } else {
    stopPlaying();
  }
}

function previousStep() {
  if (current > 0) {
    showStep(current - 1);
  }
}

function stopPlaying() {
  clearInterval(timer);
  timer = null;
  document.getElementById("playBtn").innerText = "Play";
}

function togglePlay() {
  if (timer) {
    stopPlaying();
    return;
  }

  if (current >= steps.length - 1) {
    showStep(0);
  }

  document.getElementById("playBtn").innerText = "Pause";
  timer = setInterval(nextStep, 1000);
}

loadReplay();