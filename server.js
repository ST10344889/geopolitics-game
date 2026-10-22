require("dotenv").config();

const express = require("express");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const connectDatabase = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const gameRoutes = require("./routes/gameRoutes");

const app = express();
const missingEnvironmentVariables = ["MONGO_URL", "SESSION_SECRET"].filter(function (name) {
  return !process.env[name];
});

if (missingEnvironmentVariables.length > 0) {
  throw new Error("Missing required environment variables: " + missingEnvironmentVariables.join(", "));
}

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.get("/health", function (req, res) {
  res.json({ status: "ok" });
});

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URL }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
  }
}));

app.use(express.static("public"));

app.use("/api/auth", authRoutes);
app.use("/api/games", gameRoutes);

const port = process.env.PORT || 3000;

async function startServer() {
  await connectDatabase();

  app.listen(port, "0.0.0.0", function () {
    console.log("Server is running on port " + port);
    if (process.env.NODE_ENV !== "production") {
      console.log("Open the game at http://localhost:" + port);
    }
  });
}

startServer().catch(function (error) {
  console.error("Server failed to start:", error.message);
  process.exitCode = 1;
});