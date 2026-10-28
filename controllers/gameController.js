const Game = require("../models/game");
const GameSetup = require("../classes/GameSetup");
const countryList = require("../classes/countryData");
const BattleEngine = require("../classes/BattleEngine");
const CommentaryAI = require("../classes/Commentary");
const TurnManager = require("../classes/TurnManager");
const NpcPlayer = require("../classes/NpcPlayer");
const GameHistory = require("../classes/GameHistory");

function publicGame(game, userId) {
  const data = game.toObject();
  data.isOwner = String(game.user) === String(userId);
  delete data.user;
    delete data.history;
  return data;
}

function findCountry(game, name) {
  return game.countries.find(function (c) {
    return c.name === name;
  });
}

async function getMyTurnGame(req, res) {
  let game = null;
  try {
    game = await Game.findById(req.params.id);
  } catch (error) {
    game = null;
  }

  if (!game) {
    res.status(404).json({ message: "Game not found." });
    return null;
  }
  if (String(game.user) !== String(req.session.userId)) {
    res.status(403).json({ message: "This is not your game." });
    return null;
  }
  if (game.status !== "playing") {
    res.status(400).json({ message: "This game is finished." });
    return null;
  }
  if (game.players[game.turnIndex] !== game.humanPlayer) {
    res.status(400).json({ message: "It is not your turn." });
    return null;
  }
  return game;
}

exports.listCountries = function (req, res) {
  const names = countryList.map(function (c) {
    return c.name;
  });
  res.json(names);
};

exports.startGame = async function (req, res) {
  try {
    const chosen = req.body.country;

    const found = countryList.find(function (c) {
      return c.name === chosen;
    });
    if (!found) {
      return res.status(400).json({ message: "Please pick a country from the list." });
    }

    const names = GameSetup.pickTenCountries(chosen);
    const countries = GameSetup.buildCountries(names);

    const firstTurn = Math.floor(Math.random() * names.length);

    const game = await Game.create({
      user: req.session.userId,
      humanPlayer: chosen,
      players: names,
      countries: countries,
      turnIndex: firstTurn,
      turnsTaken: 0,
      log: [
        "Game started. You are playing as " + chosen + ".",
        names[firstTurn] + " goes first."
      ]
    });

    TurnManager.start(game);
    GameHistory.add(game, "Game started. You are playing as " + chosen + ".");
    await game.save();

    res.json({ gameId: game._id });
  } catch (error) {
    res.status(500).json({ message: "Could not start the game." });
  }
};

exports.getGame = async function (req, res) {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ message: "Game not found." });
    }
    if (String(game.user) !== String(req.session.userId)) {
      return res.status(403).json({ message: "This is not your game." });
    }
    res.json(publicGame(game, req.session.userId));
  } catch (error) {
    res.status(404).json({ message: "Game not found." });
  }
};

exports.listMyGames = async function (req, res) {
  try {
    const games = await Game.find({ user: req.session.userId })
      .sort({ _id: -1 })
      .select("humanPlayer status winner");
    res.json(games);
  } catch (error) {
    res.status(500).json({ message: "Could not load your games." });
  }
};

exports.placeSoldiers = async function (req, res) {
  const game = await getMyTurnGame(req, res);
  if (!game) return;

  const country = findCountry(game, req.body.country);
  const amount = parseInt(req.body.amount);

  if (!country || country.owner !== game.humanPlayer) {
    return res.status(400).json({ message: "Pick one of your own countries." });
  }
  if (!amount || amount < 1 || amount > game.pendingSoldiers) {
    return res.status(400).json({ message: "You can place 1 to " + game.pendingSoldiers + " soldiers." });
  }

  country.soldiers += amount;
  game.pendingSoldiers -= amount;
  game.log.push("You placed " + amount + " soldiers in " + country.name + ".");
  GameHistory.add(game, "You placed " + amount + " soldiers in " + country.name + ".");
  await game.save();
  res.json({ game: publicGame(game, req.session.userId) });
};

exports.transferSoldiers = async function (req, res) {
  const game = await getMyTurnGame(req, res);
  if (!game) return;

  if (game.attack.active) {
    return res.status(400).json({ message: "You cannot transfer during an attack." });
  }

  const from = findCountry(game, req.body.from);
  const to = findCountry(game, req.body.to);
  const amount = parseInt(req.body.amount);

  if (!from || !to || from.owner !== game.humanPlayer || to.owner !== game.humanPlayer) {
    return res.status(400).json({ message: "Both countries must be yours." });
  }
  if (from.name === to.name) {
    return res.status(400).json({ message: "Pick two different countries." });
  }
  if (!amount || amount < 1 || from.soldiers - amount < 1) {
    return res.status(400).json({ message: "A country must keep at least 1 soldier." });
  }

  from.soldiers -= amount;
  to.soldiers += amount;
  game.log.push("You moved " + amount + " soldiers from " + from.name + " to " + to.name + ".");
  GameHistory.add(game, "You moved " + amount + " soldiers from " + from.name + " to " + to.name + ".");
  await game.save();
  res.json({ game: publicGame(game, req.session.userId) });
};

exports.attack = async function (req, res) {
  const game = await getMyTurnGame(req, res);
  if (!game) return;

  if (game.pendingSoldiers > 0) {
    return res.status(400).json({ message: "Place your new soldiers first." });
  }
  if (game.attackedThisTurn && !game.attack.active) {
    return res.status(400).json({ message: "You already attacked this turn." });
  }

  if (!game.attack.active) {
    const from = findCountry(game, req.body.from);
    const to = findCountry(game, req.body.to);

    if (!from || !to) {
      return res.status(400).json({ message: "Pick an attacker and a target." });
    }
    if (from.owner !== game.humanPlayer) {
      return res.status(400).json({ message: "You can only attack from your own country." });
    }
    if (to.owner === game.humanPlayer) {
      return res.status(400).json({ message: "You cannot attack your own country." });
    }
    if (from.soldiers < 2) {
      return res.status(400).json({ message: "You need at least 2 soldiers to attack." });
    }

    game.attack.active = true;
    game.attack.from = from.name;
    game.attack.to = to.name;
    game.attack.startSoldiers = to.soldiers;
    game.log.push("ATTACK! " + from.name + " attacks " + to.name + ".");
  }

  const attacker = findCountry(game, game.attack.from);
  const defender = findCountry(game, game.attack.to);

  const result = BattleEngine.fightRound(attacker.soldiers, defender.soldiers);
  attacker.soldiers -= result.attackerLosses;
  defender.soldiers -= result.defenderLosses;

  const rollText =
    attacker.name + " rolled [" + result.attackerDice.join(", ") + "] vs " +
    defender.name + " rolled [" + result.defenderDice.join(", ") + "]. " +
    attacker.name + " lost " + result.attackerLosses + ", " +
    defender.name + " lost " + result.defenderLosses + ".";

  game.log.push(rollText);
  GameHistory.add(game, rollText, result);

  let outcome = "continue";

  if (defender.soldiers <= 0) {
    const gained = Math.max(2, Math.floor(game.attack.startSoldiers / 2));
    defender.owner = attacker.owner;
    defender.soldiers = gained;
    game.attack.active = false;
    game.attackedThisTurn = true;
    outcome = "conquered";

    const conqueredText = defender.name + " is conquered! It now has " + gained + " soldiers.";
    game.log.push(conqueredText);
    GameHistory.add(game, conqueredText);
    TurnManager.checkWinner(game);

  } else if (attacker.soldiers <= 1) {
    game.attack.active = false;
    game.attackedThisTurn = true;
    outcome = "failed";

    const failedText = attacker.name + " is down to 1 soldier. The attack failed.";
    game.log.push(failedText);
    GameHistory.add(game, failedText);
    TurnManager.endTurn(game);
  }

  const commentary = await CommentaryAI.describe(rollText);
  await game.save();
  res.json({
    result: result,
    outcome: outcome,
    commentary: commentary,
    game: publicGame(game, req.session.userId)
  });
};

exports.endTurn = async function (req, res) {
  const game = await getMyTurnGame(req, res);
  if (!game) return;

  if (game.pendingSoldiers > 0) {
    return res.status(400).json({ message: "Place your new soldiers first." });
  }

  if (game.attack.active) {
    game.log.push("You stopped the attack.");
    game.attack.active = false;
  }

  game.log.push("You ended your turn.");
  GameHistory.add(game, "You ended your turn.");
  TurnManager.endTurn(game);
  await game.save();
  res.json({ game: publicGame(game, req.session.userId) });
};

exports.npcTurn = async function (req, res) {
  let game = null;
  try {
    game = await Game.findById(req.params.id);
  } catch (error) {
    game = null;
  }

  if (!game) {
    return res.status(404).json({ message: "Game not found." });
  }
  if (String(game.user) !== String(req.session.userId)) {
    return res.status(403).json({ message: "This is not your game." });
  }
  if (game.status !== "playing") {
    return res.status(400).json({ message: "This game is finished." });
  }
  if (game.players[game.turnIndex] === game.humanPlayer) {
    return res.status(400).json({ message: "It is your turn, not the computer's." });
  }

  const npc = new NpcPlayer(game, game.players[game.turnIndex]);
  const events = npc.playTurn();
  game.history.push(...events);

  await game.save();
  res.json({ events: events, game: publicGame(game, req.session.userId) });
};

exports.getHistory = async function (req, res) {
  try {
    const game = await Game.findById(req.params.id)
      .select("user humanPlayer status winner history");

    if (!game) {
      return res.status(404).json({ message: "Game not found." });
    }
    if (String(game.user) !== String(req.session.userId)) {
      return res.status(403).json({ message: "This is not your game." });
    }

    res.json({
      humanPlayer: game.humanPlayer,
      status: game.status,
      winner: game.winner,
      history: game.history
    });
  } catch (error) {
    res.status(404).json({ message: "Game not found." });
  }
};
