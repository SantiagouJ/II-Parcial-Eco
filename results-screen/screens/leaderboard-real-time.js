import { navigateTo, socket } from "../app.js";

let activePlayers = [];

export default function renderScreen1() {
  const app = document.getElementById("app");
  app.innerHTML = `
      <div id="leaderboard-container">
        <h1>🎮 Marco Polo - Jugadores Activos</h1>
        <div id="players-list">
          <p class="waiting-message">Esperando jugadores...</p>
        </div>
      </div>
      `;

  socket.on("userJoined", (gameData) => {
    console.log("Usuario se unió:", gameData);
    activePlayers = gameData.players || [];
    updatePlayersList();
  });

  socket.on("gameStarted", (gameData) => {
    console.log("Juego iniciado con roles:", gameData);
    activePlayers = gameData.players || [];
    updatePlayersList();
  });

  socket.on("scoresUpdated", (data) => {
    console.log("Puntuaciones actualizadas:", data);
    activePlayers = data.players || [];
    updatePlayersList();
  });

  socket.on("gameWinner", (data) => {
    console.log("Ganador del juego:", data);
    navigateTo("/screen2", {
      winner: data.winner,
      players: data.players,
    });
  });

  socket.on("scoresReset", (data) => {
    console.log("Puntuaciones reiniciadas");
    activePlayers = data.players || [];
    updatePlayersList();
  });

  updatePlayersList();
}

function updatePlayersList() {
  const playersList = document.getElementById("players-list");
  
  if (!playersList) return;

  if (activePlayers.length === 0) {
    playersList.innerHTML = '<p class="waiting-message">Esperando jugadores...</p>';
    return;
  }

  playersList.innerHTML = `
    <div class="players-count">
      <h3>Total de jugadores: ${activePlayers.length}</h3>
    </div>
    <div class="players-grid">
      ${activePlayers
        .map(
          (player, index) => `
        <div class="player-card">
          <div class="player-number">#${index + 1}</div>
          <div class="player-info">
            <div class="player-name">${player.nickname || "Jugador"}</div>
            <div class="player-score">Puntuación: ${player.score || 0}</div>
            ${player.role ? `<div class="player-role">Rol: ${player.role}</div>` : ""}
          </div>
        </div>
      `
        )
        .join("")}
    </div>
  `;
}
