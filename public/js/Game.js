const gameId = new URLSearchParams(window.location.search).get("id");
document.getElementById("replayLink").href = "/replay.html?id=" + gameId;

let humanName = "";
let playerNames = [];
let npcRunning = false;
let fastForward = false;

async function loadGame() {
  const response = await fetch("/api/games/" + gameId);
  const game = await response.json();
  showGame(game);
}

function fillSelect(id, items) {
  const select = document.getElementById(id);
  select.innerHTML = "";
  items.forEach(function (item) {
    const option = document.createElement("option");
    option.value = item.value;
    option.textContent = item.text;
    select.appendChild(option);
  });
}

function drawBoard(countries) {
  const board = document.getElementById("board");
  board.innerHTML = "";
  countries.forEach(function (country) {
    const card = document.createElement("div");
    card.className = "card";
    if (country.owner === humanName) {
      card.classList.add("mine");
    }
    const ownerIndex = playerNames.indexOf(country.owner);
    if (ownerIndex >= 0) {
      card.classList.add("owner-" + ownerIndex);
    }

    const name = document.createElement("h3");
    name.textContent = country.name;
    const soldiers = document.createElement("p");
    soldiers.className = "soldiers";
    soldiers.textContent = country.soldiers + " soldiers";
    const owner = document.createElement("p");
    owner.className = "owner";
    owner.textContent = "Owner: " + country.owner;

    card.appendChild(name);
    card.appendChild(soldiers);
    card.appendChild(owner);
    board.appendChild(card);
  });
}

function showScoreboard(game) {
  const scoreboard = document.getElementById("scoreboard");
  scoreboard.innerHTML = "";

  game.players.forEach(function (player, index) {
    const count = game.countries.filter(function (country) {
      return country.owner === player;
    }).length;
    const entry = document.createElement("div");
    entry.className = "score-entry owner-" + index;
    if (player === game.players[game.turnIndex] && game.status === "playing") {
      entry.classList.add("current-player");
    }
    const name = document.createElement("strong");
    name.textContent = player;
    const total = document.createElement("span");
    total.textContent = count + (count === 1 ? " country" : " countries");
    entry.appendChild(name);
    entry.appendChild(total);
    scoreboard.appendChild(entry);
  });
}

function showGameResult(game) {
  const result = document.getElementById("gameResult");
  if (game.status !== "finished") {
    result.style.display = "none";
    return;
  }

  const won = game.winner === game.humanPlayer;
  result.className = "game-result " + (won ? "victory" : "defeat");
  result.textContent = game.isOwner
    ? (won ? "Victory! You conquered the world." : "Game over — " + game.winner + " won.")
    : "Game over. Winner: " + game.winner + ".";

  const replay = document.createElement("a");
  replay.href = "/replay.html?id=" + gameId;
  replay.textContent = " Watch replay";
  result.appendChild(replay);
  result.style.display = "block";
}

function showGame(game) {
  if (!game.countries) {
    document.getElementById("turnInfo").innerText = "Game not found.";
    return;
  }

  humanName = game.humanPlayer;
  playerNames = game.players;

  const current = game.players[game.turnIndex];
  const myTurn = current === game.humanPlayer;

  if (game.isOwner && game.status === "playing" && !myTurn) {
    runNpcTurns();
  }

  if (!game.isOwner && game.status === "playing") {
    setTimeout(loadGame, 3000);
  }

  let info = "You are: " + game.humanPlayer + " | Turn: " + current;
  if (game.status === "finished") {
    info = "GAME OVER! Winner: " + game.winner;
  }
  document.getElementById("turnInfo").innerText = info;

  showScoreboard(game);
  showGameResult(game);
  drawBoard(game.countries);

  const log = document.getElementById("log");
  log.innerHTML = "";
  game.log.forEach(function (line) {
    const p = document.createElement("p");
    p.textContent = line;
    log.appendChild(p);
  });
  log.scrollTop = log.scrollHeight;

  const panel = document.getElementById("actions");
  if (game.isOwner && game.status === "playing" && myTurn) {
    panel.style.display = "block";
    fillMenus(game);
  } else {
    panel.style.display = "none";
  }
}

function fillMenus(game) {
  const mine = game.countries.filter(function (c) {
    return c.owner === game.humanPlayer;
  });
  const others = game.countries.filter(function (c) {
    return c.owner !== game.humanPlayer;
  });

  function toItems(list) {
    return list.map(function (c) {
      return { value: c.name, text: c.name + " (" + c.soldiers + ")" };
    });
  }

  fillSelect("placeCountry", toItems(mine));
  fillSelect("transferFrom", toItems(mine));
  fillSelect("transferTo", toItems(mine));
  fillSelect("attackFrom", toItems(mine));
  fillSelect("attackTarget", toItems(others));

  if (game.attack && game.attack.active) {
    fillSelect("attackFrom", toItems(mine.filter(function (c) { return c.name === game.attack.from; })));
    fillSelect("attackTarget", toItems(others.filter(function (c) { return c.name === game.attack.to; })));
  }

  const pending = document.getElementById("pendingInfo");
  if (game.pendingSoldiers > 0) {
    pending.innerText = "You have " + game.pendingSoldiers + " new soldiers to place!";
  } else {
    pending.innerText = "";
  }
}

async function sendAction(url, body) {
  const response = await fetch("/api/games/" + gameId + url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {})
  });
  const data = await response.json();
  document.getElementById("actionMessage").innerText = data.message || "";
  if (data.game) {
    showGame(data.game);
  }
  return data;
}

function placeSoldiers() {
  sendAction("/place", {
    country: document.getElementById("placeCountry").value,
    amount: document.getElementById("placeAmount").value
  });
}

function transferSoldiers() {
  sendAction("/transfer", {
    from: document.getElementById("transferFrom").value,
    to: document.getElementById("transferTo").value,
    amount: document.getElementById("transferAmount").value
  });
}

async function attack() {
  const data = await sendAction("/attack", {
    from: document.getElementById("attackFrom").value,
    to: document.getElementById("attackTarget").value
  });

  if (data.result) {
    let html = "<p class='battle-heading'>";
    if (data.outcome === "conquered") {
      html += "Territory conquered!";
    } else if (data.outcome === "failed") {
      html += "Attack failed";
    } else {
      html += "Battle continues";
    }
    html += "</p><p>Attacker: ";
    data.result.attackerDice.forEach(function (d) {
      html += "<span class='die'>" + d + "</span>";
    });
    html += "</p><p>Defender: ";
    data.result.defenderDice.forEach(function (d) {
      html += "<span class='die defend'>" + d + "</span>";
    });
    html += "</p>";

    const battleBox = document.getElementById("battleBox");
    battleBox.className = "battle-result " + (data.outcome || "continue");
    battleBox.innerHTML = html;

    if (data.commentary) {
      const commentary = document.createElement("p");
      commentary.className = "battle-commentary";
      commentary.textContent = data.commentary;
      battleBox.appendChild(commentary);
    }
  }
}

function endTurn() {
  document.getElementById("battleBox").innerHTML = "";
  sendAction("/endturn");
}

loadGame();

function addLogLine(text) {
  const log = document.getElementById("log");
  const p = document.createElement("p");
  p.textContent = text;
  log.appendChild(p);
  log.scrollTop = log.scrollHeight;
}

function showDice(event) {
  if (!event.attackerDice) return;

  let html = "Attacker: ";
  event.attackerDice.forEach(function (d) {
    html += "<span class='die'>" + d + "</span>";
  });
  html += "<br>Defender: ";
  event.defenderDice.forEach(function (d) {
    html += "<span class='die defend'>" + d + "</span>";
  });
  document.getElementById("npcDice").innerHTML = html;
}

function wait(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

function fastForwardNow() {
  fastForward = true;
}

async function runNpcTurns() {
  if (npcRunning) return;
  npcRunning = true;
  document.getElementById("npcBox").style.display = "block";
  document.getElementById("npcDice").innerHTML = "";

  while (true) {
    const response = await fetch("/api/games/" + gameId + "/npcturn", { method: "POST" });
    const data = await response.json();

    if (!data.events) {
      document.getElementById("turnInfo").innerText = data.message || "Something went wrong.";
      break;
    }

    for (const event of data.events) {
      drawBoard(event.snapshot);
      addLogLine(event.text);
      showDice(event);
      document.getElementById("turnInfo").innerText = event.text;

      await wait(fastForward ? 250 : 1200);
    }

    const g = data.game;
    if (g.status !== "playing" || g.players[g.turnIndex] === g.humanPlayer) {
      fastForward = false;
      npcRunning = false;
      document.getElementById("npcBox").style.display = "none";
      showGame(g);
      return;
    }
  }

  npcRunning = false;
  document.getElementById("npcBox").style.display = "none";
}