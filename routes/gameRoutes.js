const express = require("express");
const router = express.Router();
const gameController = require("../controllers/gameController");
const requireLogin = require("../middleware/requireLogin");

router.get("/countries", gameController.listCountries);
router.get("/:id/history", requireLogin, gameController.getHistory);

router.post("/", requireLogin, gameController.startGame);
router.get("/mine", requireLogin, gameController.listMyGames);

router.post("/:id/npcturn", requireLogin, gameController.npcTurn);
router.post("/:id/place", requireLogin, gameController.placeSoldiers);
router.post("/:id/transfer", requireLogin, gameController.transferSoldiers);
router.post("/:id/attack", requireLogin, gameController.attack);
router.post("/:id/endturn", requireLogin, gameController.endTurn);


router.get("/:id", requireLogin, gameController.getGame);

module.exports = router;
