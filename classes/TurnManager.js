class TurnManager {

  static countriesOf(game, player) {
    return game.countries.filter(function (c) {
      return c.owner === player;
    });
  }

  static alivePlayers(game) {
    return game.players.filter(function (p) {
      return TurnManager.countriesOf(game, p).length > 0;
    });
  }

  static checkWinner(game) {
    const alive = TurnManager.alivePlayers(game);

    if (alive.length === 1) {
      game.status = "finished";
      game.winner = alive[0];
      game.log.push("GAME OVER! " + alive[0] + " conquered the world!");
    } else if (!alive.includes(game.humanPlayer)) {
      game.status = "finished";
      game.winner = "The computer players";
      game.log.push("GAME OVER! You lost all your countries.");
    }
  }

  static moveToNextAlive(game) {
    do {
      game.turnIndex = (game.turnIndex + 1) % game.players.length;
    } while (TurnManager.countriesOf(game, game.players[game.turnIndex]).length === 0);
  }

  static beginTurn(game) {
    const player = game.players[game.turnIndex];
    game.pendingSoldiers = 0;

    if (game.turnsTaken >= game.players.length) {
      const newSoldiers = TurnManager.countriesOf(game, player).length * 2;
      game.pendingSoldiers = newSoldiers;

      if (player === game.humanPlayer) {
        game.log.push("You receive " + newSoldiers + " new soldiers. Place them!");
      } else {
        game.log.push(player + " receives " + newSoldiers + " new soldiers.");
      }
    }

    game.turnsTaken = game.turnsTaken + 1;
    game.attackedThisTurn = false;
    game.attack.active = false;
  }

  static start(game) {
    TurnManager.beginTurn(game);
  }

  static endTurn(game) {
    TurnManager.moveToNextAlive(game);
    TurnManager.beginTurn(game);
  }
}

module.exports = TurnManager;