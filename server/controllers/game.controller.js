const playersDb = require("../db/players.db");
const {
  emitEvent,
  emitToSpecificClient,
} = require("../services/socket.service");

const joinGame = async (req, res) => {
  try {
    const { nickname, socketId } = req.body;
    playersDb.addPlayer(nickname, socketId);

    const gameData = playersDb.getGameData();
    emitEvent("userJoined", gameData);

    res.status(200).json({ success: true, players: gameData.players });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const startGame = async (req, res) => {
  try {
    const playersWithRoles = playersDb.assignPlayerRoles();

    playersWithRoles.forEach((player) => {
      emitToSpecificClient(player.id, "startGame", {
        role: player.role,
        score: player.score || 0,
      });
    });

    // Emit to all clients (including results-screen) to update roles
    const gameData = playersDb.getGameData();
    emitEvent("gameStarted", gameData);

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const notifyMarco = async (req, res) => {
  try {
    const { socketId } = req.body;

    const rolesToNotify = playersDb.findPlayersByRole([
      "polo",
      "polo-especial",
    ]);

    rolesToNotify.forEach((player) => {
      emitToSpecificClient(player.id, "notification", {
        message: "Marco!!!",
        userId: socketId,
      });
    });

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const notifyPolo = async (req, res) => {
  try {
    const { socketId } = req.body;

    const rolesToNotify = playersDb.findPlayersByRole("marco");

    rolesToNotify.forEach((player) => {
      emitToSpecificClient(player.id, "notification", {
        message: "Polo!!",
        userId: socketId,
      });
    });

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const selectPolo = async (req, res) => {
  try {
    const { socketId, poloId } = req.body;

    const myUser = playersDb.findPlayerById(socketId);
    const poloSelected = playersDb.findPlayerById(poloId);
    const allPlayers = playersDb.getAllPlayers();

    // Apply scoring logic
    if (poloSelected.role === "polo-especial") {
      // Marco caught the special polo
      playersDb.updatePlayerScore(socketId, 50); // Marco +50
      playersDb.updatePlayerScore(poloId, -10); // Polo especial -10
      
      // Check if Marco reached 100 points
      const updatedMarco = playersDb.findPlayerById(socketId);
      if (updatedMarco.score >= 100) {
        // Game winner - emit to all players
        emitEvent("gameWinner", {
          winner: updatedMarco.nickname,
          players: allPlayers.sort((a, b) => b.score - a.score),
        });
      } else {
        // Round over - emit updated scores
        allPlayers.forEach((player) => {
          emitToSpecificClient(player.id, "notifyGameOver", {
            message: `El marco ${myUser.nickname} ha ganado, ${poloSelected.nickname} ha sido capturado`,
          });
        });
        emitEvent("scoresUpdated", { players: allPlayers });
      }
    } else {
      // Marco didn't catch the special polo
      playersDb.updatePlayerScore(socketId, -10); // Marco -10
      
      // Find the polo especial player and give them +10
      const poloEspecial = playersDb.findPlayersByRole("polo-especial")[0];
      if (poloEspecial) {
        playersDb.updatePlayerScore(poloEspecial.id, 10); // Polo especial +10
        
        // Check if polo especial reached 100 points
        const updatedPoloEspecial = playersDb.findPlayerById(poloEspecial.id);
        if (updatedPoloEspecial.score >= 100) {
          // Game winner - emit to all players
          emitEvent("gameWinner", {
            winner: updatedPoloEspecial.nickname,
            players: allPlayers.sort((a, b) => b.score - a.score),
          });
        } else {
          // Round over - emit updated scores
          allPlayers.forEach((player) => {
            emitToSpecificClient(player.id, "notifyGameOver", {
              message: `El marco ${myUser.nickname} ha perdido`,
            });
          });
          emitEvent("scoresUpdated", { players: allPlayers });
        }
      }
    }

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const resetScores = async (req, res) => {
  try {
    playersDb.resetScores();
    
    // Re-assign roles to start a new game
    const playersWithRoles = playersDb.assignPlayerRoles();
    
    playersWithRoles.forEach((player) => {
      emitToSpecificClient(player.id, "startGame", {
        role: player.role,
        score: player.score || 0,
      });
    });
    
    const gameData = playersDb.getGameData();
    
    // Emit to all clients that scores have been reset and game restarted
    emitEvent("scoresReset", gameData);
    emitEvent("gameStarted", gameData);
    
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  joinGame,
  startGame,
  notifyMarco,
  notifyPolo,
  selectPolo,
  resetScores,
};
