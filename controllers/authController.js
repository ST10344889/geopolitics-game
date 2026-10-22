const bcrypt = require("bcryptjs");
const User = require("../models/user");

exports.signup = async function (req, res) {
  try {
    const username = (req.body.username || "").trim();
    const password = req.body.password || "";

    if (username.length < 3) {
      return res.status(400).json({ message: "Username needs at least 3 letters." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password needs at least 6 characters." });
    }

    const existing = await User.findOne({ username: username });
    if (existing) {
      return res.status(400).json({ message: "That username is taken." });
    }

    const scrambled = await bcrypt.hash(password, 10);

    const user = await User.create({ username: username, password: scrambled });

    req.session.userId = user._id;
    req.session.username = user.username;

    res.json({ message: "Account created!", username: user.username });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong." });
  }
};

exports.login = async function (req, res) {
  try {
    const username = (req.body.username || "").trim();
    const password = req.body.password || "";

    const user = await User.findOne({ username: username });
    if (!user) {
      return res.status(400).json({ message: "Wrong username or password." });
    }

    const matches = await bcrypt.compare(password, user.password);
    if (!matches) {
      return res.status(400).json({ message: "Wrong username or password." });
    }

    req.session.userId = user._id;
    req.session.username = user.username;
    res.json({ message: "Logged in!", username: user.username });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong." });
  }
};

exports.logout = function (req, res) {
  req.session.destroy(function () {
    res.json({ message: "Logged out." });
  });
};

exports.whoami = function (req, res) {
  if (req.session.userId) {
    res.json({ loggedIn: true, username: req.session.username });
  } else {
    res.json({ loggedIn: false });
  }
};