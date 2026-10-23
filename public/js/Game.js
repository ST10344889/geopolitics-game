const gameId = new URLSearchParams(window.location.search).get("id");
document.getElementById("replayLink").href = "/replay.html?id=" + gameId;

let humanName = "";
let playerNames = [];
let npcRunning = false;
let fastForward = false;

// NEW REGION GROUPING START
const countryRegions = {
  Africa: ["Egypt", "Ethiopia", "Kenya", "Nigeria", "South Africa"],
  Asia: ["Bangladesh", "China", "India", "Indonesia", "Iran", "Japan", "Pakistan", "Philippines", "Singapore", "South Korea", "Thailand", "Vietnam"],
  Europe: ["France", "Germany", "Ireland", "Italy", "Luxembourg", "Netherlands", "Norway", "Poland", "Portugal", "Russia", "Spain", "Sweden", "Turkey", "Ukraine", "United Kingdom", "Vatican City"],
  "North America": ["Canada", "Mexico", "United States"],
  Oceania: ["Australia", "New Zealand"],
  "South America": ["Argentina", "Brazil", "Chile", "Colombia"]
};

function getCountryRegion(countryName) {
  return Object.keys(countryRegions).find(function (region) {
    return countryRegions[region].includes(countryName);
  }) || "Other";
}
// NEW REGION GROUPING END

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

// NEW REGIONAL MAP BOARD START
function drawBoard(countries) {
  const board = document.getElementById("board");
  board.innerHTML = "";

  const countriesByRegion = {};
  countries.forEach(function (country) {
    const region = getCountryRegion(country.name);
    if (!countriesByRegion[region]) {
      countriesByRegion[region] = [];
    }
    countriesByRegion[region].push(country);
  });

  Object.keys(countriesByRegion).sort().forEach(function (region) {
    const group = document.createElement("section");
    group.className = "region-group";

    const heading = document.createElement("h3");
    heading.className = "region-title";
    heading.textContent = region;
    group.appendChild(heading);

    countriesByRegion[region].forEach(function (country) {
      const card = document.createElement("article");
      card.className = "card country-tile";

      if (country.owner === humanName) {
        card.classList.add("mine");
      }

      const ownerIndex = playerNames.indexOf(country.owner);
      if (ownerIndex >= 0) {
        card.classList.add("owner-" + ownerIndex);
      }

      const name = document.createElement("h4");
      name.textContent = country.name;

      const soldiers = document.createElement("span");
      soldiers.className = "stat-pill army";
      soldiers.textContent = "Army: " + country.soldiers;
      soldiers.title = "Army: the number of soldiers currently stationed in this country.";
      soldiers.setAttribute("aria-label", soldiers.title);

      const owner = document.createElement("p");
      owner.className = "owner";
      owner.textContent = "Owner: " + country.owner;

      card.appendChild(name);
      card.appendChild(soldiers);
      card.appendChild(owner);
      group.appendChild(card);
    });

    board.appendChild(group);
  });
}

function showScoreboard(game) {
  const scoreboard = document.getElementById("scoreboard");
  scoreboard.innerHTML = "";

  game.players.forEach(function (player, index) {
    const owned = game.countries.filter(function (country) {
      return country.owner === player;
    });
    const count = owned.length;
    const armyTotal = owned.reduce(function (sum, country) {
      return sum + Number(country.soldiers || 0);
    }, 0);

    const entry = document.createElement("div");
    entry.className = "score-entry owner-" + index;
    if (player === game.players[game.turnIndex] && game.status === "playing") {
      entry.classList.add("current-player");
    }

    const name = document.createElement("strong");
    name.textContent = player;

    const total = document.createElement("span");
    total.textContent = count + (count === 1 ? " country" : " countries");
    total.title = "Number of territories controlled by " + player + ".";

    const army = document.createElement("span");
    army.className = "score-army";
    army.textContent = armyTotal + " soldiers";
    army.title = "Total soldiers across " + player + "'s countries.";

    entry.appendChild(name);
    entry.appendChild(total);
    entry.appendChild(army);
    scoreboard.appendChild(entry);
  });
}
// NEW REGIONAL MAP BOARD END

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
