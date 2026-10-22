const BattleEngine = require("./BattleEngine");
const TurnManager = require("./TurnManager");

class NpcPlayer {

  constructor(game, name) {
    this.game = game;
    this.name = name;
    this.events = [];
  }

  say(text, dice) {
    this.game.log.push(text);

    const snapshot = this.game.countries.map(function (c) {
      return { name: c.name, soldiers: c.soldiers, owner: c.owner };
    });

    const event = { text: text, snapshot: snapshot };
    if (dice) {
      event.attackerDice = dice.attackerDice;
      event.defenderDice = dice.defenderDice;
    }
    this.events.push(event);
  }

  myCountries() {
    const me = this.name;
    return this.game.countries.filter(function (c) {
      return c.owner === me;
    });
  }

  strongest() {
    const list = this.myCountries();
    let best = list[0];
    list.forEach(function (c) {
      if (c.soldiers > best.soldiers) {
        best = c;
      }
    });
    return best;
  }

  reinforce() {
    const amount = this.game.pendingSoldiers;
    if (amount <= 0) return;

    const best = this.strongest();
    best.soldiers += amount;
    this.game.pendingSoldiers = 0;

    this.say(this.name + " placed " + amount + " new soldiers in " + best.name +
      ". Reason: stack them in the strongest country so it can win battles.");
  }

  gatherArmy() {
    const best = this.strongest();
    let moved = 0;
    const from = [];

    this.myCountries().forEach(function (c) {
      if (c.name !== best.name && c.soldiers > 1) {
        moved += c.soldiers - 1;
        from.push(c.name);
        c.soldiers = 1;
      }
    });

    if (moved > 0) {
      best.soldiers += moved;
      this.say(this.name + " moved " + moved + " soldiers from " + from.join(", ") +
        " to " + best.name + ". Reason: one big army wins more battles than many small ones.");
    }
  }

  pickTarget(attacker) {
    const me = this.name;
    let target = null;

    this.game.countries.forEach(function (c) {
      if (c.owner !== me) {
        if (target === null || c.soldiers < target.soldiers) {
          target = c;
        }
      }
    });

    if (target !== null && attacker.soldiers > target.soldiers + 1) {
      return target;
    }
    return null;
  }

  fight(attacker, target) {
    const game = this.game;
    const startSoldiers = target.soldiers;
    const oldOwner = target.owner;
    let rounds = 0;

    while (rounds < 50) {
      rounds++;

      const result = BattleEngine.fightRound(attacker.soldiers, target.soldiers);
      attacker.soldiers -= result.attackerLosses;
      target.soldiers -= result.defenderLosses;

      this.say(
        attacker.name + " rolled [" + result.attackerDice.join(", ") + "] vs " +
        target.name + " rolled [" + result.defenderDice.join(", ") + "]. " +
        attacker.name + " lost " + result.attackerLosses + ", " +
        target.name + " lost " + result.defenderLosses + ".",
        result
      );

      if (target.soldiers <= 0) {
        const gained = Math.max(2, Math.floor(startSoldiers / 2));
        target.owner = this.name;
        target.soldiers = gained;
        this.say(this.name + " conquered " + target.name + " and it now has " + gained + " soldiers!");

        if (TurnManager.countriesOf(game, oldOwner).length === 0) {
          this.say(oldOwner + " has been eliminated!");
        }
        TurnManager.checkWinner(game);
        return;
      }

      if (attacker.soldiers <= 1) {
        this.say(this.name + " is down to 1 soldier and the attack failed.");
        return;
      }

      if (attacker.soldiers <= target.soldiers) {
        this.say(this.name + " stops the attack. Reason: " + attacker.name + " (" +
          attacker.soldiers + ") is no longer stronger than " + target.name + " (" +
          target.soldiers + "), so more fighting is too risky.");
        return;
      }
    }
  }

  playTurn() {
    const game = this.game;

    this.say("=== " + this.name + " starts its turn ===");
    this.reinforce();
    this.gatherArmy();

    const attacker = this.strongest();
    const target = this.pickTarget(attacker);

    if (target === null) {
      this.say(this.name + " chooses NOT to attack. Reason: its best army (" +
        attacker.name + ", " + attacker.soldiers +
        " soldiers) is not clearly stronger than any enemy.");
    } else {
      this.say(this.name + " decides to attack " + target.name + " (" + target.soldiers +
        " soldiers) from " + attacker.name + " (" + attacker.soldiers +
        " soldiers). Reason: it is the weakest enemy, so the odds are good.");
      this.fight(attacker, target);
    }

    if (game.status === "playing") {
      this.say(this.name + " ends its turn.");
      TurnManager.endTurn(game);
    }

    return this.events;
  }
}

module.exports = NpcPlayer;