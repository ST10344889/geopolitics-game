class BattleEngine {

  static rollDie() {
    return Math.floor(Math.random() * 6) + 1;
  }

  static fightRound(attackerSoldiers, defenderSoldiers) {
    const attackerCanUse = attackerSoldiers - 1;

    const diceCount = Math.min(attackerCanUse, defenderSoldiers);

    const attackerDice = [];
    const defenderDice = [];
    let attackerLosses = 0;
    let defenderLosses = 0;

    for (let i = 0; i < diceCount; i++) {
      const a = BattleEngine.rollDie();
      const d = BattleEngine.rollDie();
      attackerDice.push(a);
      defenderDice.push(d);

      if (a > d) {
        defenderLosses++;
      } else if (d > a) {
        attackerLosses++;
      }
    }

    return {
      attackerDice: attackerDice,
      defenderDice: defenderDice,
      attackerLosses: attackerLosses,
      defenderLosses: defenderLosses
    };
  }
}

module.exports = BattleEngine;