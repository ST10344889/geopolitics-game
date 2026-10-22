class GameHistory {

  static add(game, text, dice) {

    const snapshot = game.countries.map(function (c) {
      return { name: c.name, soldiers: c.soldiers, owner: c.owner };
    });

    const event = { text: text, snapshot: snapshot };

    if (dice) {
      event.attackerDice = dice.attackerDice;
      event.defenderDice = dice.defenderDice;
    }

    game.history.push(event);
  }
}

module.exports = GameHistory;