const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");

const app = express();
app.use(cors());
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const games = new Map();

// Serve static files
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`HTTP/WebSocket server is running on port ${PORT}`);
});

wss.on("connection", (ws) => {
  let gameId = "";
  let playerId = "";

  ws.on("message", (message) => {
    const data = JSON.parse(message);

    switch (data.type) {
      case "join":
        gameId = data.gameId;
        playerId = data.playerId;
        if (!games.has(gameId)) {
          games.set(gameId, new Set());
        }
        games.get(gameId).add(ws);
        break;

      case "move":
        // Broadcast the move to all players in the game except sender
        if (games.has(gameId)) {
          games.get(gameId).forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(
                JSON.stringify({
                  type: "move",
                  playerId: playerId,
                  tileIndex: data.tileIndex,
                })
              );
            }
          });
        }
        break;

      case "match":
        if (games.has(gameId)) {
          games.get(gameId).forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(
                JSON.stringify({
                  type: "match",
                  playerId: playerId,
                  tiles: data.tiles,
                })
              );
            }
          });
        }
        break;
    }
  });

  ws.on("close", () => {
    if (games.has(gameId)) {
      games.get(gameId).delete(ws);
      if (games.get(gameId).size === 0) {
        games.delete(gameId);
      }
    }
  });
});
