async function loadCountries() {
  const response = await fetch("/api/games/countries");
  if (!response.ok) {
    throw new Error("Could not load the country list.");
  }
  const names = await response.json();
  const select = document.getElementById("countrySelect");

  select.innerHTML = "";
  names.forEach(function (name) {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });
}

async function loadMyGames() {
  const response = await fetch("/api/games/mine");
  if (!response.ok) {
    throw new Error("Could not load your games.");
  }
  const games = await response.json();
  const box = document.getElementById("myGames");
  box.innerHTML = "";

  if (games.length === 0) {
    box.textContent = "No games yet.";
    return;
  }

  games.forEach(function (game) {
    const row = document.createElement("div");

    const link = document.createElement("a");
    link.href = "/game.html?id=" + game._id;
    link.textContent = game.humanPlayer + " (" + game.status + ")";

    const replay = document.createElement("a");
    replay.href = "/replay.html?id=" + game._id;
    replay.textContent = " - replay";

    row.className = "gameLink";
    row.appendChild(link);
    row.appendChild(replay);
    box.appendChild(row);
  });
}

async function startGame() {
  const country = document.getElementById("countrySelect").value;

  const response = await fetch("/api/games", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ country: country })
  });

  const data = await response.json();
  if (data.gameId) {
    window.location.href = "/game.html?id=" + data.gameId;
  } else {
    document.getElementById("message").innerText = data.message;
  }
}

async function start() {
  const response = await fetch("/api/auth/whoami");
  const data = await response.json();

  if (data.loggedIn) {
    document.getElementById("status").innerText = "Welcome, " + data.username + "!";
    document.getElementById("newGame").style.display = "block";
    Promise.all([loadCountries(), loadMyGames()]).catch(function (error) {
      document.getElementById("message").innerText = error.message;
    });
  } else {
    document.getElementById("status").innerText = "Please log in to start a game.";
  }
}

start().catch(function () {
  document.getElementById("status").innerText = "Could not connect to the server.";
});