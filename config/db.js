const mongoose = require("mongoose");

async function connectDatabase() {
  if (!process.env.MONGO_URL) {
    throw new Error("MONGO_URL is not set.");
  }

  await mongoose.connect(process.env.MONGO_URL);
  console.log("Connected to MongoDB!");
}

module.exports = connectDatabase;