const countryList = require("./countryData");

class GameSetup {

  static soldiersFor(population) {
    if (population <= 5) return 1;
    if (population <= 10) return 2;
    if (population <= 25) return 3;
    if (population <= 50) return 4;
    if (population <= 75) return 5;
    if (population <= 100) return 6;
    if (population <= 125) return 7;
    if (population <= 150) return 8;
    return 9;
  }

  static pickTenCountries(chosenName) {
    const others = countryList.filter(function (c) {
      return c.name !== chosenName;
    });

    others.sort(function () {
      return Math.random() - 0.5;
    });

    const nine = others.slice(0, 9).map(function (c) {
      return c.name;
    });
    nine.push(chosenName);
    return nine;
  }

  static buildCountries(names) {
    return names.map(function (name) {
      const info = countryList.find(function (c) {
        return c.name === name;
      });
      return {
        name: name,
        population: info.population,
        soldiers: GameSetup.soldiersFor(info.population),
        owner: name
      };
    });
  }
}

module.exports = GameSetup;
