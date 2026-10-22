const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  humanPlayer: String,
  players: [String],
  countries: [
    { name: String, soldiers: Number, owner: String }
  ],
  turnIndex: Number,
  turnsTaken: Number,
  status: { type: String, default: "playing" },
  winner: String,
  pendingSoldiers: { type: Number, default: 0 },
  attackedThisTurn: { type: Boolean, default: false },
  attack: {
    active: { type: Boolean, default: false },
    from: String,
    to: String,
    startSoldiers: Number
  },
  history: [
    {
      text: String,
      snapshot: [{ name: String, soldiers: Number, owner: String }],
      attackerDice: [Number],
      defenderDice: [Number]
    }
  ],
  log: [String],
});

module.exports = mongoose.model("Game", gameSchema);