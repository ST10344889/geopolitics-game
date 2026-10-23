# geopolitics-game
Geopolitics Game is a single-player, Risk-style strategy game for the web. You pick a country, and nine other countries are chosen at random.

## Game features

- One human player against nine computer-controlled countries
- Choose your starting country
- Build armies and expand your territory
- Attack rival countries and win battles using dice rolls
- Eliminate opponents until only one country remains
- Save and replay game events

## How to play

1. Create an account or log in.
2. Choose your country and start a new game.
3. On your turn, place reinforcements in your countries.
4. Move soldiers between your countries if needed.
5. Select one of your countries and an enemy country, then attack.
6. Keep attacking and expanding until one player remains.

## Run the game

### Requirements

- Node.js 20.19.0 or newer
- MongoDB running

### Steps

1. Open the game folder in your terminal.

2. Firstly type "npm install" to install dependencies:

4. Fill in the values in `.env`:
   - `MONGO_URL` = your MongoDB connection string
   - `SESSION_SECRET` = a long secret value
   - `PORT` = optional, default is `3000`

5. To start the game type "npm start"


6. Open the game in your browser: http://localhost:3000 you should see a signin or login page to start
